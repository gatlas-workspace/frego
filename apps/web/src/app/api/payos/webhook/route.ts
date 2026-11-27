/**
 * Webhook PayOS: PayOS gọi khi một link thanh toán (nạp ví doanh nghiệp) đã được trả.
 * 1. Kiểm chữ ký HMAC-SHA256 của `data` bằng PAYOS_CHECKSUM_KEY (sai → 401, không cộng gì).
 * 2. Gọi RPC tin cậy payos_credit_topup (khớp theo orderCode, đúng số tiền, không cộng hai lần).
 * Luôn trả 2xx cho thông báo hợp lệ (kể cả mã đơn không có, như lần PayOS thử khi lưu địa chỉ webhook) để PayOS không gửi lại.
 */
import { verifyPayosWebhook } from '@frego/core';
import { trustedServerDb } from '@/lib/server/data';
import { hmacSha256Hex, payosConfig } from '@/lib/server/payos';

export const dynamic = 'force-dynamic';

type PayosWebhook = {
  code?: string;
  desc?: string;
  success?: boolean;
  data?: { orderCode?: number | string; amount?: number | string; code?: string; reference?: string | null };
  signature?: string;
};

export async function POST(request: Request): Promise<Response> {
  const cfg = payosConfig();
  if (!cfg) return Response.json({ ok: false, error: 'PayOS chưa bật' }, { status: 503 });

  let body: PayosWebhook;
  try {
    body = (await request.json()) as PayosWebhook;
  } catch {
    return Response.json({ ok: false, error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
  if (!verifyPayosWebhook(body, cfg.checksumKey, hmacSha256Hex)) {
    return Response.json({ ok: false, error: 'Sai chữ ký' }, { status: 401 });
  }

  const d = body.data ?? {};
  // Chỉ cộng tiền khi PayOS báo thanh toán thành công (mã "00").
  const paid = body.code === '00' && (d.code === undefined || d.code === '00');
  const orderCode = Number(d.orderCode);
  const amount = Number(d.amount);
  if (!paid || !Number.isSafeInteger(orderCode) || !Number.isSafeInteger(amount)) {
    return Response.json({ ok: true, credited: false, reason: 'ignored' });
  }

  const db = trustedServerDb();
  if (!db) {
    console.error('[payos] thiếu SUPABASE_SERVICE_ROLE_KEY, không cộng được tiền cho đơn', orderCode);
    return Response.json({ ok: false, error: 'Máy chủ chưa cấu hình' }, { status: 500 });
  }
  try {
    const r = await db.rpc('payos_credit_topup', { orderCode, amount, reference: d.reference ?? null });
    if (r.reason === 'amount_mismatch') console.error('[payos] số tiền không khớp đơn', orderCode, amount);
    return Response.json({ ok: true, credited: r.credited, reason: r.reason });
  } catch (e) {
    console.error('[payos] lỗi khi cộng tiền', orderCode, e);
    // 5xx để PayOS gửi lại sau.
    return Response.json({ ok: false, error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
