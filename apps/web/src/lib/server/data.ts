/**
 * Dữ liệu phía server cho web.
 * - Có NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY → Supabase (cookie phiên qua @supabase/ssr, RLS theo vai trò).
 * - Không có → DEMO: một cơ sở dữ liệu trong bộ nhớ dùng chung cho tiến trình server, vai trò lưu ở cookie.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import {
  createAdminOpsService,
  createAdminService,
  createBusinessService,
  createMemoryDb,
  createSeed,
  DEMO_ADMIN_ID,
  DEMO_OWNER_ID,
  type Db,
  type MemoryDb,
} from '@frego/core';
import { createSupabaseDb } from '@frego/core/supabase';

export const MODE: 'demo' | 'supabase' =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'supabase' : 'demo';

export const DEMO_ROLE_COOKIE = 'frego_demo_role';

export type WebRole = 'biz' | 'admin';

export interface WebSession {
  role: WebRole;
  userId: string;
  /** Doanh nghiệp đang quản lý (vai trò biz) */
  businessId: string | null;
  businessName: string | null;
  displayName: string;
  email: string;
}

const g = globalThis as unknown as { __fregoDemoDb?: MemoryDb };
function demoDb(): MemoryDb {
  g.__fregoDemoDb ??= createMemoryDb(createSeed());
  return g.__fregoDemoDb;
}

/** Db cho request hiện tại (đã gắn người đăng nhập). */
export async function getDb(): Promise<Db> {
  if (MODE === 'demo') {
    const role = (await cookies()).get(DEMO_ROLE_COOKIE)?.value as WebRole | undefined;
    const base = demoDb();
    const userId = role === 'admin' ? DEMO_ADMIN_ID : role === 'biz' ? DEMO_OWNER_ID : null;
    return { ...base, currentUserId: () => userId } as Db;
  }
  const store = await cookies();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* Server Component: bỏ qua, middleware sẽ làm mới phiên */
        }
      },
    },
  });
  const db = createSupabaseDb(client);
  await db.refreshUser();
  return db;
}

/** Phiên hiện tại hoặc null. */
export async function getSession(): Promise<WebSession | null> {
  const db = await getDb();
  const userId = db.currentUserId();
  if (!userId) return null;
  const profile = await db.get('profiles', userId);
  if (!profile) return null;
  if (profile.role === 'admin') {
    return { role: 'admin', userId, businessId: null, businessName: null, displayName: profile.displayName, email: 'vanhanh@frego.vn' };
  }
  const members = await db.list('business_members', { where: { userId } });
  const m = members[0];
  if (!m) return null;
  const b = await db.get('businesses', m.businessId);
  return { role: 'biz', userId, businessId: m.businessId, businessName: b?.name ?? null, displayName: profile.displayName, email: m.email };
}

/** Bắt buộc vai trò; chưa đăng nhập thì chuyển về /dang-nhap. */
export async function requireRole(role: WebRole): Promise<WebSession> {
  const s = await getSession();
  if (!s || s.role !== role) redirect(`/dang-nhap?vai-tro=${role === 'admin' ? 'quan-tri' : 'doanh-nghiep'}`);
  return s;
}

export async function bizService() {
  const s = await requireRole('biz');
  return { session: s, svc: createBusinessService(await getDb(), s.businessId!) };
}

export async function adminService() {
  const s = await requireRole('admin');
  return { session: s, svc: createAdminService(await getDb()) };
}

export async function adminOpsService() {
  const s = await requireRole('admin');
  return { session: s, svc: createAdminOpsService(await getDb()) };
}
