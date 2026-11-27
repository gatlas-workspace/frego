/**
 * Cài đặt Db trên Supabase (PostgREST + RPC). Quyền đọc/ghi do RLS quyết định
 * (supabase/migrations/*_rls.sql). Lệnh tin cậy gọi hàm SQL security definer.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Db, FileStore, ListOptions, RpcName, Rpcs } from '../db/types';
import { PRIMARY_KEYS, type Row, type TableName } from '../db/schema';
import { snakeKey, toCamel, toSnake } from './case';

export { toCamel, toSnake } from './case';

export interface SupabaseDbOptions {
  /** Lệch đồng hồ tùy chọn (giữ 0 ở môi trường thật). */
  clockOffsetMs?: number;
}

export function createSupabaseDb(client: SupabaseClient, opts: SupabaseDbOptions = {}): Db & {
  client: SupabaseClient;
  refreshUser(): Promise<string | null>;
} {
  let userId: string | null = null;
  const fail = (table: string, error: { message: string } | null) => {
    if (error) throw new Error(`${table}: ${error.message}`);
  };

  /**
   * Kho ảnh banner: bucket riêng `ad-uploads/<businessId>/…` (chủ quán tải, quản trị xem; RLS ở migration
   * 20261127000800_ad_banners.sql) → khi duyệt chép sang bucket công khai `ad-banners`.
   * ref ảnh riêng có dạng `storage:ad-uploads/<đường dẫn>`.
   */
  const PRIVATE = 'ad-uploads';
  const PUBLIC = 'ad-banners';
  /** Logo quán: công khai, chủ quán tải thẳng (không cần duyệt, như cột logo_url). */
  const LOGOS = 'business-logos';
  const PREFIX = `storage:${PRIVATE}/`;
  /** Ảnh bìa Trang chủ (công khai) và ảnh tại quán (riêng tư). */
  const COVERS = 'app-banners';
  const CHECKINS = 'checkin-photos';
  const files: FileStore = {
    async uploadPrivate(businessId, file) {
      const path = `${businessId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${file.ext}`;
      const { error } = await client.storage.from(PRIVATE).upload(path, file.bytes, { contentType: file.contentType, upsert: false });
      fail('storage', error);
      return PREFIX + path;
    },
    async viewUrl(ref) {
      if (!ref.startsWith(PREFIX)) return ref;
      const { data, error } = await client.storage.from(PRIVATE).createSignedUrl(ref.slice(PREFIX.length), 3600);
      fail('storage', error);
      return data!.signedUrl;
    },
    async publish(ref) {
      if (!ref.startsWith(PREFIX)) return ref;
      const path = ref.slice(PREFIX.length);
      const { error } = await client.storage.from(PRIVATE).copy(path, path, { destinationBucket: PUBLIC });
      fail('storage', error);
      return client.storage.from(PUBLIC).getPublicUrl(path).data.publicUrl;
    },
    async uploadLogo(businessId, file) {
      const path = `${businessId}/logo-${Date.now().toString(36)}.${file.ext}`;
      const { error } = await client.storage.from(LOGOS).upload(path, file.bytes, { contentType: file.contentType, upsert: false });
      fail('storage', error);
      return client.storage.from(LOGOS).getPublicUrl(path).data.publicUrl;
    },
    // Ảnh bìa Trang chủ (QT 13): bucket công khai, chỉ quản trị ops ghi (migration 20261127001200_v3_referral_cover_photo.sql).
    async uploadHomeCover(file) {
      const storagePath = `${new Date().getUTCFullYear()}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${file.ext}`;
      const { error } = await client.storage.from(COVERS).upload(storagePath, file.bytes, { contentType: file.contentType, upsert: false });
      fail('storage', error);
      return { imageUrl: client.storage.from(COVERS).getPublicUrl(storagePath).data.publicUrl, storagePath };
    },
    async removeHomeCover(storagePath) {
      if (!storagePath) return;
      const { error } = await client.storage.from(COVERS).remove([storagePath]);
      fail('storage', error);
    },
    // Ảnh tại quán: bucket riêng, thư mục "<userId>/…" (chỉ chủ ảnh tải lên; quản trị xem bằng URL ký).
    async uploadCheckinPhoto(userId, file) {
      let body: Uint8Array | Blob;
      let contentType = 'image/jpeg';
      let ext = 'jpg';
      if ('uri' in file) {
        // React Native: đọc tệp từ uri (fetch hỗ trợ file://, content://).
        body = await (await fetch(file.uri)).blob();
        contentType = body.type || contentType;
      } else {
        body = file.bytes;
        contentType = file.contentType;
        ext = file.ext;
      }
      const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await client.storage.from(CHECKINS).upload(path, body, { contentType, upsert: false });
      fail('storage', error);
      return path;
    },
    async checkinPhotoUrl(storagePath) {
      if (!storagePath) return null;
      const { data, error } = await client.storage.from(CHECKINS).createSignedUrl(storagePath, 3600);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  };

  const db = {
    mode: 'supabase' as const,
    client,
    files,
    async refreshUser() {
      const { data } = await client.auth.getUser();
      userId = data.user?.id ?? null;
      return userId;
    },
    currentUserId: () => userId,
    now: () => new Date(Date.now() + (opts.clockOffsetMs ?? 0)),

    async list<T extends TableName>(table: T, o: ListOptions<Row<T>> = {}) {
      let q = client.from(table).select('*');
      if (o.where) q = q.match(toSnake(o.where) as Record<string, unknown>);
      if (o.in) for (const [k, vs] of Object.entries(o.in)) q = q.in(snakeKey(k), vs as unknown[]);
      if (o.order) q = q.order(snakeKey(o.order.column), { ascending: o.order.ascending ?? true });
      if (o.limit) q = q.limit(o.limit);
      const { data, error } = await q;
      fail(table, error);
      return toCamel<Row<T>[]>(data ?? []);
    },

    async get<T extends TableName>(table: T, id: string) {
      const { data, error } = await client.from(table).select('*').eq(snakeKey(PRIMARY_KEYS[table]), id).maybeSingle();
      fail(table, error);
      return data ? toCamel<Row<T>>(data) : null;
    },

    async insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
      const { data, error } = await client.from(table).insert(toSnake<Record<string, unknown>>(row)).select('*').single();
      fail(table, error);
      return toCamel<Row<T>>(data);
    },

    async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
      const { data, error } = await client
        .from(table)
        .update(toSnake<Record<string, unknown>>(patch))
        .eq(snakeKey(PRIMARY_KEYS[table]), id)
        .select('*')
        .single();
      fail(table, error);
      return toCamel<Row<T>>(data);
    },

    async remove<T extends TableName>(table: T, id: string) {
      const { error } = await client.from(table).delete().eq(snakeKey(PRIMARY_KEYS[table]), id);
      fail(table, error);
    },

    async rpc<N extends RpcName>(name: N, args: Rpcs[N]['args']): Promise<Rpcs[N]['result']> {
      // Hàm SQL nhận một tham số jsonb "args" (camelCase giữ nguyên trong payload).
      const { data, error } = await client.rpc(name, { args });
      fail(name, error);
      return toCamel<Rpcs[N]['result']>(data);
    },
  };
  return db;
}
