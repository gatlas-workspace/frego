/**
 * Điểm đón (chốt 27/11/2026): vị trí thật qua expo-location (trên web là định vị của trình duyệt), hoặc người dùng sửa tay
 * (tìm địa chỉ, ghim bản đồ). Điểm sửa tay được nhớ trên máy; vị trí thật hỏi lại mỗi lần mở app.
 * Chưa có quyền vị trí / lỗi → điểm mặc định của dữ liệu mẫu, ghi rõ "điểm mặc định".
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { PickupPoint } from '@frego/core';
import { queryClient, useApi } from './api';

const KEY = 'frego.pickup.v1';
/** Chờ GPS tối đa (giây) rồi thôi, tránh treo nút. */
const LOCATE_TIMEOUT_MS = 12_000;

export type LocateResult = 'ok' | 'denied' | 'unavailable';

interface PickupValue {
  pickup: PickupPoint | null;
  locating: boolean;
  /** Hỏi quyền (nếu chưa) rồi lấy vị trí thật làm điểm đón. */
  locate(): Promise<LocateResult>;
  setManual(p: PickupPoint): void;
}

const Ctx = createContext<PickupValue | null>(null);

/** Nạp expo-location khi cần: bản cài cũ chưa có mô-đun gốc thì báo "unavailable" thay vì làm sập app. */
async function loadLocation() {
  try {
    return await import('expo-location');
  } catch {
    return null;
  }
}

export function PickupProvider({ children }: { children: ReactNode }) {
  const { svc, status } = useApi();
  const [pickup, setPickupState] = useState<PickupPoint | null>(null);
  const [locating, setLocating] = useState(false);
  const tried = useRef(false);

  const apply = useCallback(
    (p: PickupPoint | null) => {
      svc.setPickup(p);
      setPickupState(p);
      if (p?.source === 'manual') AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
      else AsyncStorage.removeItem(KEY).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['originLabel'] });
      queryClient.invalidateQueries({ queryKey: ['originPoint'] });
      queryClient.invalidateQueries({ queryKey: ['searchPlaces'] });
      queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
    },
    [svc],
  );

  const locate = useCallback(async (): Promise<LocateResult> => {
    const Location = await loadLocation();
    if (!Location) return 'unavailable';
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return 'denied';
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<null>((r) => setTimeout(() => r(null), LOCATE_TIMEOUT_MS)),
      ]);
      if (!pos) return 'unavailable';
      const at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const d = await svc.describePoint(at).catch(() => null);
      apply({
        ...at,
        name: d?.found ? d.name : 'Vị trí của bạn',
        address: d?.address ?? `${at.lat.toFixed(5)}, ${at.lng.toFixed(5)}`,
        placeId: null,
        source: 'gps',
      });
      return 'ok';
    } catch {
      return 'unavailable';
    } finally {
      setLocating(false);
    }
  }, [svc, apply]);

  // Đã đăng nhập (kể cả khách): điểm đón sửa tay lần trước, không có thì lấy vị trí thật nếu người dùng cho phép ở màn Quyền dữ liệu.
  useEffect(() => {
    if (status !== 'signedIn' || tried.current) return;
    tried.current = true;
    (async () => {
      const saved = await AsyncStorage.getItem(KEY).catch(() => null);
      if (saved) {
        try {
          apply(JSON.parse(saved) as PickupPoint);
          return;
        } catch {
          /* hỏng: bỏ qua */
        }
      }
      const consents = await svc.getConsents().catch(() => null);
      if (consents?.location) await locate();
    })();
  }, [status, svc, apply, locate]);

  return (
    <Ctx.Provider value={{ pickup, locating, locate, setManual: (p) => apply({ ...p, source: 'manual' }) }}>{children}</Ctx.Provider>
  );
}

export function usePickup() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePickup phải nằm trong <PickupProvider>');
  return v;
}
