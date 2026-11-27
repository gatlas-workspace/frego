/**
 * PayOS (nạp ví doanh nghiệp qua VietQR) — phần thuần, không gọi mạng, không dùng thư viện mã hóa.
 * Máy chủ web (apps/web/src/lib/server/payos.ts) truyền hàm HMAC-SHA256 (node:crypto) vào đây.
 *
 * Theo tài liệu PayOS (payos.vn/docs, đọc 27/11/2026):
 * - Tạo link: POST https://api-merchant.payos.vn/v2/payment-requests, header x-client-id, x-api-key;
 *   signature = HMAC_SHA256(checksumKey, "amount=…&cancelUrl=…&description=…&orderCode=…&returnUrl=…") dạng hex.
 *   description tối đa 9 ký tự với tài khoản ngân hàng không liên kết qua PayOS.
 * - Webhook: { code, desc, success, data, signature }; chữ ký tính trên `data`: sắp khóa tăng dần, "khóa=giá trị" nối bằng
 *   "&", null/undefined/"null"/"undefined" → chuỗi rỗng, mảng → JSON (khóa trong từng phần tử được sắp).
 */

export type HmacHex = (key: string, message: string) => string;

export interface PayosPaymentRequest {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

/** Chuỗi ký khi tạo link thanh toán (thứ tự chữ cái của 5 trường). */
export function payosRequestSignData(r: PayosPaymentRequest): string {
  return `amount=${r.amount}&cancelUrl=${r.cancelUrl}&description=${r.description}&orderCode=${r.orderCode}&returnUrl=${r.returnUrl}`;
}

function sortKeys(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
}

/** Chuỗi ký của `data` trong webhook / phản hồi PayOS. */
export function payosDataSignString(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((k) => {
      let v = data[k];
      if (Array.isArray(v)) {
        v = JSON.stringify(v.map((x) => (x && typeof x === 'object' ? sortKeys(x as Record<string, unknown>) : x)));
      } else if (v === null || v === undefined || v === 'null' || v === 'undefined') {
        v = '';
      }
      return `${k}=${v}`;
    })
    .join('&');
}

/** So sánh chuỗi không lộ thời gian (đủ cho chữ ký hex). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Kiểm chữ ký webhook PayOS. */
export function verifyPayosWebhook(
  body: { data?: unknown; signature?: unknown },
  checksumKey: string,
  hmac: HmacHex,
): boolean {
  if (!checksumKey || !body || typeof body.signature !== 'string' || !body.data || typeof body.data !== 'object') return false;
  const expected = hmac(checksumKey, payosDataSignString(body.data as Record<string, unknown>));
  return safeEqual(expected.toLowerCase(), body.signature.toLowerCase());
}

/** Mã đơn PayOS: số nguyên dương, duy nhất (thời điểm ms + 3 số ngẫu nhiên), nhỏ hơn 2^53. */
export function newPayosOrderCode(nowMs: number, rand: () => number = Math.random): number {
  return Number(`${String(nowMs).slice(-10)}${String(Math.floor(rand() * 1000)).padStart(3, '0')}`);
}

/** Nội dung chuyển khoản PayOS (≤ 9 ký tự, không dấu): "FR" + 7 số cuối mã đơn. */
export function payosDescription(orderCode: number): string {
  return `FR${String(orderCode).slice(-7)}`;
}
