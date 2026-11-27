/**
 * "Tự lấy giá từ biên nhận email" (Gmail) phía app.
 * - DEMO (không có Supabase): liên kết giả lập, ghi rõ là bản thử; đồng bộ tạo biên nhận mẫu (svc.demoSyncGmail).
 * - Supabase: máy chủ web (EXPO_PUBLIC_WEB_URL) giữ token Google và đọc thư; app chỉ mở trang đồng ý của Google
 *   bằng expo-web-browser và gọi /api/gmail/sync, /api/gmail/disconnect kèm token đăng nhập Supabase.
 *   Máy chủ chưa cấu hình Google (GET /api/gmail/status → available=false) hoặc thiếu EXPO_PUBLIC_WEB_URL → "Sắp có".
 */
import { useQuery } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Db, GmailSyncResult } from '@frego/core';
import { useApi } from '@/lib/api';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL?.trim().replace(/\/+$/, '') || null;

/** demo: liên kết giả lập · live: Google thật · soon: chưa bật ("Sắp có") */
export type GmailAvailability = 'demo' | 'live' | 'soon';

export type GmailLinkOutcome = 'linked' | 'cancelled' | 'failed';

async function accessToken(db: Db): Promise<string | null> {
  const client = (db as Db & { client?: SupabaseClient }).client;
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.access_token ?? null;
}

async function callApi<T>(db: Db, path: string, body: unknown = {}): Promise<T> {
  const token = await accessToken(db);
  if (!WEB_URL || !token) throw new Error('Chưa đăng nhập');
  const res = await fetch(`${WEB_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Lỗi ${res.status}`);
  return json;
}

/** Địa chỉ trang Liên kết trong app (Google quay về đây sau khi đồng ý). */
const returnUrl = () => Linking.createURL('lien-ket');

export function useGmail() {
  const { mode, db, svc, status, guest } = useApi();
  const signedIn = status === 'signedIn';

  const availability = useQuery({
    queryKey: ['gmail-availability', mode],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<GmailAvailability> => {
      if (mode === 'demo') return 'demo';
      if (!WEB_URL) return 'soon';
      try {
        const res = await fetch(`${WEB_URL}/api/gmail/status`);
        const j = (await res.json()) as { available?: boolean };
        return j.available ? 'live' : 'soon';
      } catch {
        return 'soon';
      }
    },
  });
  const avail: GmailAvailability | null = availability.data ?? null;
  /** Khách (chưa đăng nhập số điện thoại) không liên kết được Gmail thật. */
  const needsLogin = avail === 'live' && guest;

  const gmail = useQuery({
    queryKey: ['gmail'],
    queryFn: () => svc.getGmailStatus(),
    enabled: signedIn && (avail === 'demo' || avail === 'live'),
  });

  // Trình duyệt web chặn cửa sổ bật lên nếu mở sau một lệnh chờ mạng → lấy sẵn địa chỉ bắt đầu (vé hạn 2 phút).
  const startUrl = useQuery({
    queryKey: ['gmail-start-url'],
    queryFn: () => callApi<{ url: string }>(db, '/api/gmail/start', { returnUrl: returnUrl() }).then((r) => r.url),
    enabled: signedIn && avail === 'live' && !guest && gmail.data?.linked === false,
    staleTime: 90_000,
    refetchInterval: 90_000,
  });

  async function link(): Promise<GmailLinkOutcome> {
    if (avail === 'demo') {
      await svc.demoLinkGmail();
      return 'linked';
    }
    if (avail !== 'live') return 'failed';
    const fresh = startUrl.data && Date.now() - startUrl.dataUpdatedAt < 100_000 ? startUrl.data : null;
    const url = fresh ?? (await callApi<{ url: string }>(db, '/api/gmail/start', { returnUrl: returnUrl() })).url;
    const r = await WebBrowser.openAuthSessionAsync(url, returnUrl());
    if (r.type !== 'success') return 'cancelled';
    const result = Linking.parse(r.url).queryParams?.gmail;
    return result === 'ok' ? 'linked' : result === 'huy' ? 'cancelled' : 'failed';
  }

  async function sync(): Promise<GmailSyncResult> {
    if (avail === 'demo') return svc.demoSyncGmail();
    return callApi<GmailSyncResult>(db, '/api/gmail/sync');
  }

  async function unlink(): Promise<void> {
    if (avail === 'demo') return svc.demoUnlinkGmail();
    await callApi(db, '/api/gmail/disconnect');
  }

  return {
    availability: avail,
    availabilityLoading: availability.isLoading,
    needsLogin,
    status: gmail.data ?? null,
    statusError: gmail.isError,
    refetch: () => gmail.refetch(),
    link,
    sync,
    unlink,
  };
}
