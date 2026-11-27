/**
 * Phần dùng chung cho /api/gmail/* (chỉ chạy ở máy chủ): cấu hình, mã hóa, xác thực người dùng app, gọi Google.
 *
 * Bật khi có đủ: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_TOKEN_KEY (32 byte base64), NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SITE_URL. Thiếu một biến → available = false, app hiện "Sắp có".
 * Scope gmail.readonly là scope "restricted" của Google: trước khi mở cho mọi người cần Google thẩm định (OAuth
 * verification + đánh giá bảo mật CASA); trước đó chỉ tài khoản trong danh sách "Test users" đăng nhập được.
 */
import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const OAUTH_COOKIE = 'frego_gmail_oauth';
const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE = 'https://oauth2.googleapis.com/revoke';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

/* ───────────── Cấu hình ───────────── */

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  key: Buffer;
  siteUrl: string;
  redirectUri: string;
  supabaseUrl: string;
  serviceRoleKey: string;
}

export function gmailConfig(): GmailConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const rawKey = process.env.GMAIL_TOKEN_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (!clientId || !clientSecret || !rawKey || !supabaseUrl || !serviceRoleKey || !siteUrl) return null;
  const key = Buffer.from(rawKey, 'base64');
  if (key.length !== 32) return null;
  return {
    clientId,
    clientSecret,
    key,
    siteUrl,
    redirectUri: `${siteUrl}/api/gmail/callback`,
    supabaseUrl,
    serviceRoleKey,
  };
}

/* ───────────── Mã hóa AES-256-GCM (refresh token, vé, cookie) ───────────── */

export function seal(key: Buffer, plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), ct.toString('base64url')].join('.');
}

export function unseal(key: Buffer, sealed: string): string | null {
  const [v, iv, tag, ct] = sealed.split('.');
  if (v !== 'v1' || !iv || !tag || !ct) return null;
  try {
    const d = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Gói dữ liệu ngắn hạn (vé mở trình duyệt, cookie OAuth): mã hóa + hạn dùng. */
export function sealJson(key: Buffer, data: object, ttlSec: number): string {
  return seal(key, JSON.stringify({ ...data, exp: Date.now() + ttlSec * 1000 }));
}

export function unsealJson<T>(key: Buffer, sealed: string | null | undefined): T | null {
  if (!sealed) return null;
  const s = unseal(key, sealed);
  if (!s) return null;
  try {
    const o = JSON.parse(s) as T & { exp?: number };
    return typeof o.exp === 'number' && o.exp > Date.now() ? o : null;
  } catch {
    return null;
  }
}

export const randomToken = () => randomBytes(32).toString('base64url');
export const pkceChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
export function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ───────────── Địa chỉ quay về app ───────────── */

/**
 * Chỉ quay về app Frego: scheme frego:// (bản cài), exp:// / exps:// (Expo Go khi phát triển), hoặc origin web của
 * app trong GMAIL_APP_ORIGINS (VD http://localhost:8081). Chặn chuyển hướng tùy ý.
 */
export function safeReturnUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 500) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol === 'frego:' || u.protocol === 'exp:' || u.protocol === 'exps:') return raw;
  return appOrigins().includes(u.origin) ? raw : null;
}

export function withParam(url: string, key: string, value: string): string {
  const hashAt = url.indexOf('#');
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  return `${base}${base.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

function appOrigins(): string[] {
  return (process.env.GMAIL_APP_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/* ───────────── CORS (bản web của app gọi từ origin khác) ───────────── */

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin || !appOrigins().includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  };
}

export function json(req: Request, body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { ...corsHeaders(req), 'Cache-Control': 'no-store' } });
}

export function preflight(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

/* ───────────── Supabase (service role) + người dùng app ───────────── */

export function adminClient(cfg: GmailConfig): SupabaseClient {
  return createClient(cfg.supabaseUrl, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Người dùng app từ header "Authorization: Bearer <access token Supabase>". Khách (ẩn danh) không được liên kết Gmail. */
export async function appUser(req: Request, admin: SupabaseClient): Promise<string | null> {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const { data, error } = await admin.auth.getUser(m[1]);
  if (error || !data.user || data.user.is_anonymous) return null;
  return data.user.id;
}

/* ───────────── Google ───────────── */

export function googleAuthUrl(cfg: GmailConfig, state: string, challenge: string): string {
  const q = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${GOOGLE_AUTH}?${q}`;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
    cache: 'no-store',
  });
  return ((await res.json().catch(() => ({}))) as TokenResponse) ?? {};
}

export function exchangeCode(cfg: GmailConfig, code: string, verifier: string) {
  return tokenRequest({
    code,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  });
}

export function refreshAccess(cfg: GmailConfig, refreshToken: string) {
  return tokenRequest({
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'refresh_token',
  });
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(GOOGLE_REVOKE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
    cache: 'no-store',
  }).catch(() => undefined);
}

export async function gmailGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Gmail ${res.status}`);
  return (await res.json()) as T;
}

/* ───────────── Thư Gmail → ReceiptEmail ───────────── */

export interface GmailPart {
  mimeType?: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string; size?: number };
  parts?: GmailPart[];
}

export interface GmailMessage {
  id: string;
  internalDate?: string;
  payload?: GmailPart;
}

function decodePart(p: GmailPart): string {
  if (!p.body?.data) return '';
  const bytes = Buffer.from(p.body.data, 'base64url');
  const ct = p.headers?.find((h) => h.name.toLowerCase() === 'content-type')?.value ?? '';
  const charset = /charset="?([\w-]+)"?/i.exec(ct)?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return bytes.toString('utf8');
  }
}

/** Lấy From, Subject, ngày nhận và phần chữ / HTML (lấy phần đầu tiên mỗi loại, bỏ tệp đính kèm). */
export function toReceiptEmail(m: GmailMessage) {
  const headers = m.payload?.headers ?? [];
  const h = (name: string) => headers.find((x) => x.name.toLowerCase() === name)?.value ?? '';
  let text: string | null = null;
  let html: string | null = null;
  const walk = (p: GmailPart | undefined) => {
    if (!p) return;
    if (p.mimeType === 'text/plain' && text === null) text = decodePart(p);
    else if (p.mimeType === 'text/html' && html === null) html = decodePart(p);
    p.parts?.forEach(walk);
  };
  walk(m.payload);
  const ms = Number(m.internalDate);
  const date = Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : h('date');
  return { from: h('from'), subject: h('subject'), date, text, html };
}
