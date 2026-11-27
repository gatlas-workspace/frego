/**
 * Bắt đầu liên kết Gmail (2 bước, không đưa token đăng nhập của app vào URL):
 * 1. POST (app, header Authorization: Bearer <token Supabase>, body { returnUrl }) → { url } là /api/gmail/start?ticket=…
 *    (vé mã hóa AES-GCM, hạn 2 phút, chứa id người dùng + địa chỉ quay về app).
 * 2. GET ?ticket=… (mở trong trình duyệt của app: expo-web-browser openAuthSessionAsync) → đặt cookie HttpOnly chứa
 *    state + PKCE verifier (hạn 10 phút) rồi chuyển sang trang đồng ý của Google. Callback so state với cookie.
 */
import { NextResponse } from 'next/server';
import {
  adminClient,
  appUser,
  gmailConfig,
  googleAuthUrl,
  json,
  OAUTH_COOKIE,
  pkceChallenge,
  preflight,
  randomToken,
  safeReturnUrl,
  sealJson,
  unsealJson,
} from '../_lib/gmail';

export const dynamic = 'force-dynamic';

interface Ticket {
  uid: string;
  returnUrl: string;
}

export async function POST(req: Request) {
  const cfg = gmailConfig();
  if (!cfg) return json(req, { error: 'Tính năng chưa bật' }, 503);
  const uid = await appUser(req, adminClient(cfg));
  if (!uid) return json(req, { error: 'Cần đăng nhập bằng số điện thoại' }, 401);
  const body = (await req.json().catch(() => ({}))) as { returnUrl?: unknown };
  const returnUrl = safeReturnUrl(body.returnUrl);
  if (!returnUrl) return json(req, { error: 'Địa chỉ quay về không hợp lệ' }, 400);
  const ticket = sealJson(cfg.key, { uid, returnUrl } satisfies Ticket, 120);
  return json(req, { url: `${cfg.siteUrl}/api/gmail/start?ticket=${encodeURIComponent(ticket)}` });
}

export async function GET(req: Request) {
  const cfg = gmailConfig();
  if (!cfg) return new Response('Tính năng chưa bật.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const t = unsealJson<Ticket>(cfg.key, new URL(req.url).searchParams.get('ticket'));
  if (!t) {
    return new Response('Liên kết đã hết hạn. Quay lại app Frego và bấm Liên kết lần nữa.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const state = randomToken();
  const verifier = randomToken();
  const res = NextResponse.redirect(googleAuthUrl(cfg, state, pkceChallenge(verifier)), 302);
  res.cookies.set(OAUTH_COOKIE, sealJson(cfg.key, { state, verifier, uid: t.uid, returnUrl: t.returnUrl }, 600), {
    httpOnly: true,
    secure: cfg.siteUrl.startsWith('https://'),
    sameSite: 'lax',
    path: '/api/gmail',
    maxAge: 600,
  });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export function OPTIONS(req: Request) {
  return preflight(req);
}
