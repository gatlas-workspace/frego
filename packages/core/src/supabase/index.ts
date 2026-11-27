/**
 * Cài đặt Db trên Supabase (PostgREST + RPC). Quyền đọc/ghi do RLS quyết định
 * (supabase/migrations/*_rls.sql). Lệnh tin cậy gọi hàm SQL security definer.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Db, ListOptions, RpcName, Rpcs } from '../db/types';
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

  const db = {
    mode: 'supabase' as const,
    client,
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
