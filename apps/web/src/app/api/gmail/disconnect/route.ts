/**
 * POST /api/gmail/disconnect (app, header Authorization: Bearer <token Supabase>): thu hồi quyền ở Google rồi xóa
 * kết nối (kể cả refresh token đã mã hóa). Biên nhận đã ghi vẫn giữ trong lịch sử chuyến của người dùng.
 */
import { adminClient, appUser, gmailConfig, json, preflight, revokeToken, unseal } from '../_lib/gmail';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const cfg = gmailConfig();
  if (!cfg) return json(req, { error: 'Tính năng chưa bật' }, 503);
  const admin = adminClient(cfg);
  const uid = await appUser(req, admin);
  if (!uid) return json(req, { error: 'Cần đăng nhập bằng số điện thoại' }, 401);

  const { data: conn } = await admin
    .from('gmail_connections')
    .select('refresh_token_enc')
    .eq('user_id', uid)
    .maybeSingle<{ refresh_token_enc: string }>();
  if (conn) {
    const refresh = unseal(cfg.key, conn.refresh_token_enc);
    if (refresh) await revokeToken(refresh);
    const { error } = await admin.from('gmail_connections').delete().eq('user_id', uid);
    if (error) return json(req, { error: 'Chưa gỡ được liên kết' }, 500);
  }
  return json(req, { ok: true });
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
