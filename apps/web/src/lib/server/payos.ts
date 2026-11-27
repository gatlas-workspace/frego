/**
 * PayOS (nạp ví doanh nghiệp qua VietQR) — CHỈ chạy ở máy chủ: khóa bí mật không bao giờ tới trình duyệt.
 * Bật khi có đủ PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY; thiếu thì cổng doanh nghiệp dùng chuyển khoản tay.
 * Phần thuần (chuỗi ký, kiểm chữ ký webhook) ở packages/core/src/services/payos.ts, có test.
 */
import 'server-only';
import { createHmac } from 'node:crypto';
import { payosDescription, payosRequestSignData, type HmacHex } from '@frego/core';

const API = 'https://api-merchant.payos.vn/v2/payment-requests';

export const hmacSha256Hex: HmacHex = (key, message) => createHmac('sha256', key).update(message, 'utf8').digest('hex');

export function payosConfig(): { clientId: string; apiKey: string; checksumKey: string } | null {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();
  return clientId && apiKey && checksumKey ? { clientId, apiKey, checksumKey } : null;
}

export const payosEnabled = () => payosConfig() !== null;

/** Địa chỉ gốc của web (link quay về sau khi thanh toán). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** Tạo link thanh toán PayOS. Trả checkoutUrl (trang VietQR của PayOS). */
export async function createPayosPaymentLink(input: { orderCode: number; amount: number; returnPath: string }): Promise<string> {
  const cfg = payosConfig();
  if (!cfg) throw new Error('PayOS chưa được cấu hình');
  const base = siteUrl();
  const req = {
    orderCode: input.orderCode,
    amount: input.amount,
    description: payosDescription(input.orderCode),
    returnUrl: `${base}${input.returnPath}`,
    cancelUrl: `${base}${input.returnPath}`,
  };
  const signature = hmacSha256Hex(cfg.checksumKey, payosRequestSignData(req));
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-client-id': cfg.clientId, 'x-api-key': cfg.apiKey },
    body: JSON.stringify({ ...req, signature }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { code?: string; desc?: string; data?: { checkoutUrl?: string } } | null;
  if (!res.ok || json?.code !== '00' || !json.data?.checkoutUrl) {
    throw new Error(`PayOS từ chối tạo link: ${json?.code ?? res.status} ${json?.desc ?? ''}`.trim());
  }
  return json.data.checkoutUrl;
}
