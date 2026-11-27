/**
 * Google chuyển về đây sau khi người dùng đồng ý (redirect URI khai báo trong Google Cloud Console:
 * <NEXT_PUBLIC_SITE_URL>/api/gmail/callback). So state với cookie, đổi code lấy token (PKCE), mã hóa refresh token
 * rồi lưu gmail_connections bằng service role, sau đó quay về app: <returnUrl>?gmail=ok | loi | huy.
 */
import { NextResponse } from 'next/server';
import {
  adminClient,
  exchangeCode,
  gmailConfig,
  GMAIL_SCOPE,
  gmailGet,
  OAUTH_COOKIE,
  revokeToken,
  sameToken,
  seal,
  unsealJson,
  withParam,
} from '../_lib/gmail';

export const dynamic = 'force-dynamic';

interface OAuthCookie {
  state: string;
  verifier: string;
  uid: string;
  returnUrl: string;
}

const text = (msg: string, status = 400) =>
  new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function GET(req: Request) {
  const cfg = gmailConfig();
  if (!cfg) return text('Tính năng chưa bật.', 503);
  const params = new URL(req.url).searchParams;
  const cookieValue = req.headers
    .get('cookie')
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${OAUTH_COOKIE}=`))
    ?.slice(OAUTH_COOKIE.length + 1);
  const c = unsealJson<OAuthCookie>(cfg.key, cookieValue ? decodeURIComponent(cookieValue) : null);
  const state = params.get('state') ?? '';
  if (!c || !state || !sameToken(state, c.state)) {
    return text('Phiên liên kết đã hết hạn hoặc không hợp lệ. Quay lại app Frego và bấm Liên kết lần nữa.');
  }

  const back = (result: 'ok' | 'loi' | 'huy') => {
    const res = NextResponse.redirect(withParam(c.returnUrl, 'gmail', result), 302);
    res.cookies.set(OAUTH_COOKIE, '', { path: '/api/gmail', maxAge: 0 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  };

  const code = params.get('code');
  if (params.get('error') || !code) return back('huy');

  const tok = await exchangeCode(cfg, code, c.verifier);
  // Người dùng có thể bỏ chọn quyền đọc Gmail ở màn đồng ý (đồng ý từng phần) → coi như chưa liên kết.
  const granted = (tok.scope ?? '').split(' ').includes(GMAIL_SCOPE);
  if (!tok.access_token || !tok.refresh_token || !granted) {
    if (tok.refresh_token) await revokeToken(tok.refresh_token);
    return back(granted ? 'loi' : 'huy');
  }

  try {
    const profile = await gmailGet<{ emailAddress?: string }>(tok.access_token, '/profile');
    const { error } = await adminClient(cfg)
      .from('gmail_connections')
      .upsert(
        {
          user_id: c.uid,
          email: profile.emailAddress ?? '',
          refresh_token_enc: seal(cfg.key, tok.refresh_token),
          status: 'active',
          connected_at: new Date().toISOString(),
          last_sync_at: null,
          last_error: null,
        },
        { onConflict: 'user_id' },
      );
    if (error) throw new Error(error.message);
  } catch {
    await revokeToken(tok.refresh_token);
    return back('loi');
  }
  return back('ok');
}
