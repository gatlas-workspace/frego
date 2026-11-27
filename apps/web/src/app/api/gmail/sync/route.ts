/**
 * POST /api/gmail/sync (app, header Authorization: Bearer <token Supabase>) → GmailSyncResult.
 * Đọc thư của Grab / Be / Green SM (chuỗi tìm gmailReceiptQuery), bóc bằng parseReceipt (packages/core/src/receipts.ts),
 * ghi bằng RPC record_receipt (service role): khớp chuyến, ghi giá, cộng điểm như "nhập số tiền" ở Báo giá.
 * Chỉ đọc thư biên nhận; không lưu nội dung thư, chỉ lưu các trường đã bóc trong gmail_receipts.
 */
import { gmailReceiptQuery, parseReceipt, type GmailSyncResult, type RecordReceiptResult } from '@frego/core';
import { toCamel } from '@frego/core/supabase';
import {
  adminClient,
  appUser,
  gmailConfig,
  gmailGet,
  json,
  preflight,
  refreshAccess,
  toReceiptEmail,
  unseal,
  type GmailMessage,
} from '../_lib/gmail';

export const dynamic = 'force-dynamic';

/** Lần đầu đọc 14 ngày gần nhất; sau đó từ lần đồng bộ trước (thêm 1 ngày cho chắc), tối đa 14 ngày. */
const FIRST_DAYS = 14;
const MAX_MESSAGES = 25;
/** Không đồng bộ dồn dập (mỗi người tối đa 1 lần / 30 giây). */
const MIN_INTERVAL_MS = 30_000;

export async function POST(req: Request) {
  const cfg = gmailConfig();
  if (!cfg) return json(req, { error: 'Tính năng chưa bật' }, 503);
  const admin = adminClient(cfg);
  const uid = await appUser(req, admin);
  if (!uid) return json(req, { error: 'Cần đăng nhập bằng số điện thoại' }, 401);

  const { data: conn } = await admin
    .from('gmail_connections')
    .select('refresh_token_enc, last_sync_at')
    .eq('user_id', uid)
    .maybeSingle<{ refresh_token_enc: string; last_sync_at: string | null }>();
  if (!conn) return json(req, { error: 'Chưa liên kết Gmail' }, 404);

  const empty: GmailSyncResult = { checked: 0, matched: 0, pointsAwarded: 0, held: null };
  const last = conn.last_sync_at ? new Date(conn.last_sync_at).getTime() : 0;
  if (Date.now() - last < MIN_INTERVAL_MS) return json(req, empty);

  const markError = (msg: string) =>
    admin.from('gmail_connections').update({ status: 'error', last_error: msg }).eq('user_id', uid);

  const refresh = unseal(cfg.key, conn.refresh_token_enc);
  const tok = refresh ? await refreshAccess(cfg, refresh) : {};
  if (!tok.access_token) {
    await markError('Google đã thu hồi quyền hoặc hết hạn. Gỡ rồi liên kết lại Gmail.');
    return json(req, { error: 'Cần liên kết lại Gmail' }, 409);
  }

  const days = last ? Math.min(FIRST_DAYS, Math.ceil((Date.now() - last) / 86_400_000) + 1) : FIRST_DAYS;
  const result: GmailSyncResult = { ...empty };
  try {
    const q = encodeURIComponent(gmailReceiptQuery(days));
    const list = await gmailGet<{ messages?: { id: string }[] }>(tok.access_token, `/messages?q=${q}&maxResults=${MAX_MESSAGES}`);
    const ids = (list.messages ?? []).map((m) => m.id);
    const { data: seen } = ids.length
      ? await admin.from('gmail_receipts').select('message_id').eq('user_id', uid).in('message_id', ids)
      : { data: [] as { message_id: string }[] };
    const done = new Set((seen ?? []).map((r) => r.message_id));

    for (const id of ids.filter((x) => !done.has(x))) {
      const msg = await gmailGet<GmailMessage>(tok.access_token, `/messages/${encodeURIComponent(id)}?format=full`);
      const parsed = parseReceipt(toReceiptEmail(msg));
      if (!parsed) continue;
      result.checked += 1;
      const { data, error } = await admin.rpc('record_receipt', {
        args: {
          userId: uid,
          messageId: id,
          providerId: parsed.providerId,
          paidAmount: parsed.total,
          receivedAt: parsed.receivedAt,
          tripAt: parsed.tripAt,
          pickup: parsed.pickup,
          dropoff: parsed.dropoff,
          promoCode: parsed.promoCode,
        },
      });
      if (error) continue; // VD tài khoản tạm khóa: bỏ qua thư này, lần sau thử lại.
      const r = toCamel<RecordReceiptResult>(data);
      if (r.status === 'matched' && !r.duplicate) result.matched += 1;
      result.pointsAwarded += r.pointsAwarded;
      if (r.held) result.held = r.held;
    }
  } catch {
    await markError('Chưa đọc được Gmail. Thử lại sau ít phút.');
    return json(req, { error: 'Chưa đọc được Gmail' }, 502);
  }

  await admin
    .from('gmail_connections')
    .update({ status: 'active', last_error: null, last_sync_at: new Date().toISOString() })
    .eq('user_id', uid);
  return json(req, result);
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
