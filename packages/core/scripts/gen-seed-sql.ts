/**
 * Sinh supabase/seed.sql từ dữ liệu mẫu TypeScript (packages/core/src/seed) — một nguồn cho DEMO và Supabase.
 * Chạy: pnpm db:seed:gen
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSeed, DEMO_NOW } from '../src/seed';
import { PRIMARY_KEYS, type BaseTableName } from '../src/db/schema';
import { snakeKey } from '../src/supabase/case';

const ORDER: BaseTableName[] = [
  'places', 'partners', 'fare_tables', 'profiles', 'consents', 'notification_prefs', 'saved_places', 'recent_searches',
  'linked_accounts', 'businesses', 'business_members', 'campaigns', 'campaign_events', 'frego_codes', 'rewards',
  'user_vouchers', 'public_codes', 'code_votes', 'trips', 'points_ledger', 'notifications', 'wallet_transactions',
  'invoices', 'redemptions', 'support_tickets', 'ticket_messages', 'audit_logs', 'broadcasts', 'stats', 'ad_banners',
];

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

function lit(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (typeof v === 'string') return q(v);
  if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
    return q('{' + v.map((x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}');
  }
  return q(JSON.stringify(v)); // jsonb (khóa bên trong giữ camelCase)
}

/**
 * SEED_SHIFT=now: dời mọi mốc thời gian để "hôm nay" của dữ liệu mẫu (22/11/2026) thành thời điểm chạy lệnh.
 * Dùng cho môi trường staging để chiến dịch, voucher còn hạn.
 */
const SHIFT_MS = process.env.SEED_SHIFT === 'now' ? Date.now() - new Date(DEMO_NOW).getTime() : 0;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function shift<T>(v: T): T {
  if (!SHIFT_MS) return v;
  if (typeof v === 'string' && ISO.test(v)) return new Date(new Date(v).getTime() + SHIFT_MS).toISOString() as T;
  if (Array.isArray(v)) return v.map(shift) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shift(x)])) as T;
  return v;
}

const seed = shift(createSeed());
const out: string[] = [
  '-- TỰ SINH bằng `pnpm db:seed:gen` từ packages/core/src/seed. Không sửa tay.',
  '-- Dữ liệu mẫu: Minh Anh (app), Cà phê Mây (doanh nghiệp), Vận hành Frego (quản trị). Mốc thời gian 22/11/2026.',
  '',
  'begin;',
  '',
  '-- Tài khoản đăng nhập mẫu (môi trường dev/staging). Trigger on_auth_user_created tạo hồ sơ mặc định.',
];

const emails: Record<string, string> = {
  '00000000-0000-4000-8000-0000000000a1': 'vanhanh@frego.vn',
  '00000000-0000-4000-8000-0000000000b1': 'chu@caphemay.vn',
};
for (const p of seed.profiles) {
  out.push(
    `insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', ${q(p.id)}, 'authenticated', 'authenticated', ${lit(emails[p.id] ?? null)}, ${q(p.phone.replace('+', ''))}, ${q(p.createdAt)}) on conflict (id) do nothing;`,
  );
}
out.push('');

for (const table of ORDER) {
  const rows = seed[table] as unknown as Record<string, unknown>[];
  if (!rows.length) continue;
  const pk = snakeKey(PRIMARY_KEYS[table]);
  const cols = Object.keys(rows[0]);
  const colSql = cols.map(snakeKey);
  out.push(`-- ${table} (${rows.length})`);
  out.push(`insert into public.${table} (${colSql.join(', ')}) values`);
  out.push(rows.map((r) => '  (' + cols.map((c) => lit(r[c])).join(', ') + ')').join(',\n'));
  const updates = colSql.filter((c) => c !== pk).map((c) => `${c} = excluded.${c}`);
  out.push(`on conflict (${pk}) do update set ${updates.join(', ')};`);
  out.push('');
}
out.push('commit;', '');

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../../../supabase/seed.sql');
writeFileSync(target, out.join('\n'));
console.log(`Đã ghi ${target}`);
