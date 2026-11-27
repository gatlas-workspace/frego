/**
 * Kết nối dữ liệu cho app:
 * - Có EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY → Supabase thật (đăng nhập OTP qua SMS).
 * - Không có → chế độ DEMO: dữ liệu mẫu trong bộ nhớ, lưu lại trên máy bằng AsyncStorage, mã OTP bất kỳ 6 số.
 *
 * Màn hình dùng: const { svc } = useApi(); useQuery({ queryKey: ['home'], queryFn: svc.getHome })
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createMemoryDb,
  createSeed,
  createUserService,
  createGoongGeocoder,
  createPhotonGeocoder,
  createValhallaRouter,
  demoSignUp,
  maskPhone,
  toE164Vn,
  type Db,
  type Seed,
  type UserService,
} from '@frego/core';
import { createSupabaseDb } from '@frego/core/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const MODE: 'demo' | 'supabase' = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'demo';

/**
 * Máy chủ tìm đường Valhalla (docs/research/tim-duong.md). Mặc định khi thử nghiệm: máy chủ công cộng FOSSGIS
 * (tối đa 1 lượt/giây, không dùng cho bản chính thức). Ra mắt: đặt EXPO_PUBLIC_ROUTING_URL tới máy chủ tự chạy.
 * Đặt "off" để tắt (km/phút ước tính theo đường chim bay).
 */
const ROUTING_URL = process.env.EXPO_PUBLIC_ROUTING_URL || 'https://valhalla1.openstreetmap.de';
const router = ROUTING_URL === 'off' ? null : createValhallaRouter({ baseUrl: ROUTING_URL });

/**
 * Tìm địa chỉ (chốt 27/11/2026: Goong). Có EXPO_PUBLIC_GOONG_API_KEY → Goong; chưa có → tạm Photon công cộng
 * (EXPO_PUBLIC_GEOCODING_URL đổi được máy chủ Photon; "off" = tắt, chỉ tìm địa điểm có sẵn).
 * Key Goong nằm trong app (ai cũng đọc được): giới hạn key và hạn mức trong trang quản lý Goong.
 */
const GOONG_KEY = process.env.EXPO_PUBLIC_GOONG_API_KEY;
const GEOCODING_URL = process.env.EXPO_PUBLIC_GEOCODING_URL || 'https://photon.komoot.io';
const geocoder = GOONG_KEY
  ? createGoongGeocoder({ apiKey: GOONG_KEY })
  : GEOCODING_URL === 'off'
    ? null
    : createPhotonGeocoder({ baseUrl: GEOCODING_URL });

/** Đổi khóa khi dữ liệu mẫu đổi (v3: giới thiệu, ảnh bìa, ảnh tại quán; v4: câu chữ "Chuyến … thế nào?", tài khoản DEMO theo số điện thoại) → nạp lại dữ liệu mẫu mới. */
const DEMO_DATA_KEY = 'frego.demo.data.v4';
const DEMO_SESSION_KEY = 'frego.demo.session.v1';
/** DEMO: tài khoản khách ("Xem voucher trước, đăng nhập sau"). */
const DEMO_GUEST_ID = '00000000-0000-4000-8000-00000000ff01';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface ApiContextValue {
  mode: typeof MODE;
  db: Db;
  svc: UserService;
  status: AuthStatus;
  /** Đang xem với tư cách khách (chưa đăng nhập bằng số điện thoại). */
  guest: boolean;
  /** Số điện thoại đang chờ OTP, đã che: "0909 ••• 123" */
  pendingPhone: string | null;
  sendOtp(phone: string): Promise<{ ok: true } | { ok: false; error: string }>;
  verifyOtp(code: string): Promise<{ ok: true; welcome: boolean } | { ok: false; error: string }>;
  /** "Xem voucher trước, đăng nhập sau" */
  continueAsGuest(): Promise<void>;
  signOut(): Promise<void>;
  /** DEMO: đưa dữ liệu mẫu về như ban đầu. */
  resetDemo(): Promise<void>;
}

const ApiContext = createContext<ApiContextValue | null>(null);

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5_000, retry: 1 } },
});

function useDemoBackend() {
  const [db] = useState(() =>
    createMemoryDb(createSeed(), {
      onChange: (data: Seed) => {
        AsyncStorage.setItem(DEMO_DATA_KEY, JSON.stringify(data)).catch(() => {});
      },
    }),
  );
  return db;
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const demoDb = useDemoBackend();
  const supa = useMemo(() => {
    if (MODE !== 'supabase') return null;
    const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    });
    return createSupabaseDb(client);
  }, []);
  const db: Db = supa ?? demoDb;
  const svc = useMemo(() => createUserService(db, { router, geocoder }), [db]);

  const [status, setStatus] = useState<AuthStatus>('loading');
  const [guest, setGuest] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  // Khởi động: khôi phục phiên.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (supa) {
        const id = await supa.refreshUser();
        const { data } = await supa.client.auth.getSession();
        if (!alive) return;
        setGuest(!!data.session?.user?.is_anonymous);
        setStatus(id ? 'signedIn' : 'signedOut');
        supa.client.auth.onAuthStateChange(async () => {
          const uid = await supa.refreshUser();
          setStatus(uid ? 'signedIn' : 'signedOut');
          queryClient.invalidateQueries();
        });
        return;
      }
      try {
        const [saved, session] = await Promise.all([
          AsyncStorage.getItem(DEMO_DATA_KEY),
          AsyncStorage.getItem(DEMO_SESSION_KEY),
        ]);
        if (saved) Object.assign(demoDb.data, JSON.parse(saved));
        if (session) {
          const s = JSON.parse(session) as { userId: string; guest: boolean };
          demoDb.setUser(s.userId);
          setGuest(s.guest);
          if (alive) setStatus('signedIn');
          return;
        }
      } catch {
        /* bỏ qua dữ liệu hỏng */
      }
      if (alive) setStatus('signedOut');
    })();
    return () => {
      alive = false;
    };
  }, [supa, demoDb]);

  const sendOtp = useCallback<ApiContextValue['sendOtp']>(
    async (input) => {
      const e164 = toE164Vn(input);
      if (!e164) return { ok: false, error: 'Số điện thoại chưa đúng. Ví dụ: 909 123 456' };
      if (supa) {
        const { error } = await supa.client.auth.signInWithOtp({ phone: e164 });
        if (error) return { ok: false, error: 'Chưa gửi được mã. Thử lại sau ít phút.' };
      }
      setPhone(e164);
      return { ok: true };
    },
    [supa],
  );

  const verifyOtp = useCallback<ApiContextValue['verifyOtp']>(
    async (code) => {
      if (!/^\d{6}$/.test(code)) return { ok: false, error: 'Mã gồm 6 số.' };
      if (supa) {
        if (!phone) return { ok: false, error: 'Nhập số điện thoại trước.' };
        const { error } = await supa.client.auth.verifyOtp({ phone, token: code, type: 'sms' });
        if (error) return { ok: false, error: 'Mã chưa đúng hoặc đã hết hạn.' };
        await supa.refreshUser();
      } else {
        // DEMO: số của tài khoản mẫu Minh Anh (0909 555 123) vào Minh Anh để xem đủ dữ liệu; số khác tạo tài khoản
        // mới (lần đầu) hoặc vào lại tài khoản đã tạo bằng số đó. Hồ sơ lưu cùng dữ liệu DEMO (AsyncStorage).
        if (!phone) return { ok: false, error: 'Nhập số điện thoại trước.' };
        const { userId } = await demoSignUp(demoDb, phone);
        demoDb.setUser(userId);
        await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ userId, guest: false }));
      }
      const welcome = await svc.ensureWelcomeVoucher().catch(() => null);
      setGuest(false);
      setStatus('signedIn');
      queryClient.invalidateQueries();
      return { ok: true, welcome: !!welcome };
    },
    [supa, demoDb, phone, svc],
  );

  const continueAsGuest = useCallback(async () => {
    if (supa) {
      await supa.client.auth.signInAnonymously();
      await supa.refreshUser();
    } else {
      // DEMO: khách có hồ sơ trống riêng (không thấy dữ liệu của tài khoản mẫu), vẫn xem được ưu đãi, mã công khai, so giá.
      const now = demoDb.now().toISOString();
      if (!(await demoDb.get('profiles', DEMO_GUEST_ID))) {
        await demoDb.insert('profiles', {
          id: DEMO_GUEST_ID,
          phone: '',
          displayName: '',
          avatarUrl: null,
          birthday: null,
          interests: [],
          vehiclePrefs: [],
          points: 0,
          savedAmount: 0,
          savedCount: 0,
          role: 'user',
          adminRole: null,
          status: 'active',
          lockReason: null,
          createdAt: now,
          onboardedAt: null,
        });
        await demoDb.insert('consents', { userId: DEMO_GUEST_ID, location: true, shareData: false, personalized: false, updatedAt: now });
        await demoDb.insert('notification_prefs', {
          userId: DEMO_GUEST_ID,
          gift: true,
          card: true,
          expire: true,
          report: true,
          points: true,
          promo: false,
          quiet: true,
        });
      }
      demoDb.setUser(DEMO_GUEST_ID);
      await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ userId: DEMO_GUEST_ID, guest: true }));
    }
    setGuest(true);
    setStatus('signedIn');
    queryClient.invalidateQueries();
  }, [supa, demoDb]);

  const signOut = useCallback(async () => {
    if (supa) await supa.client.auth.signOut();
    else {
      demoDb.setUser(null);
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    }
    setGuest(false);
    setPhone(null);
    setStatus('signedOut');
    queryClient.clear();
  }, [supa, demoDb]);

  const resetDemo = useCallback(async () => {
    if (supa) return;
    const fresh = createSeed();
    for (const k of Object.keys(fresh) as (keyof Seed)[]) (demoDb.data as Record<string, unknown>)[k] = fresh[k];
    await AsyncStorage.setItem(DEMO_DATA_KEY, JSON.stringify(demoDb.data));
    // Tài khoản DEMO tạo sau (số điện thoại mới, khách) không có trong dữ liệu mẫu → đăng xuất.
    const uid = demoDb.currentUserId();
    if (uid && !demoDb.data.profiles.some((p) => p.id === uid)) {
      await signOut();
      return;
    }
    queryClient.invalidateQueries();
  }, [supa, demoDb, signOut]);

  const value: ApiContextValue = {
    mode: MODE,
    db,
    svc,
    status,
    guest,
    pendingPhone: phone ? maskPhone(phone) : null,
    sendOtp,
    verifyOtp,
    continueAsGuest,
    signOut,
    resetDemo,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
    </QueryClientProvider>
  );
}

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi phải nằm trong <ApiProvider>');
  return ctx;
}

/** Làm mới mọi dữ liệu sau khi ghi. */
export const refreshAll = () => queryClient.invalidateQueries();
