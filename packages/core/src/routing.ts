/**
 * Tìm đường theo đường phố (nghiên cứu: docs/research/tim-duong.md).
 * Cài đặt: Valhalla (FOSSGIS khi thử nghiệm, máy chủ tự chạy khi ra mắt; đổi bằng địa chỉ, không sửa code).
 * Lỗi mạng / quá giờ → `null`; nơi gọi tự dùng ước tính đường chim bay (geo.estimateRoute).
 */
import type { LatLng } from './geo';
import type { VehicleClass } from './types';

/** Xe máy và ô tô đi đường khác nhau (cấm, một chiều, cao tốc). */
export type RouteVehicle = 'motorbike' | 'car';

export const routeVehicleOf = (v: VehicleClass): RouteVehicle => (v === 'bike' ? 'motorbike' : 'car');

export interface RoadRoute {
  /** Các điểm của đường đi, từ điểm đi tới điểm đến */
  coords: LatLng[];
  /** Làm tròn 0,1 km */
  km: number;
  minutes: number;
}

export interface Router {
  route(from: LatLng, to: LatLng, vehicle: RouteVehicle): Promise<RoadRoute | null>;
}

/** Giải mã polyline mã hóa (Google), độ chính xác 1e-6 như Valhalla trả về (`precision` = 6). */
export function decodePolyline(encoded: string, precision = 6): LatLng[] {
  const factor = 10 ** precision;
  const out: LatLng[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < encoded.length) {
    lat += next();
    lng += next();
    out.push({ lat: lat / factor, lng: lng / factor });
  }
  return out;
}

/** Chi phí Valhalla: `motorcycle` (xe máy thường; `motor_scooter` tránh đường lớn nên đi vòng, không hợp) và `auto`. */
/**
 * Chi phí Valhalla theo loại xe (sửa 27/11/2026): xe máy dùng `motor_scooter`. `motorcycle` là chế độ thử nghiệm,
 * ở TP.HCM thường báo "No path could be found" (lỗi 442) nên app rơi về đường thẳng ước tính.
 */
const COSTING: Record<RouteVehicle, string> = { motorbike: 'motor_scooter', car: 'auto' };

export interface ValhallaRouterOptions {
  /** VD "https://valhalla1.openstreetmap.de" */
  baseUrl: string;
  fetch?: typeof fetch;
  /** Quá thời gian thì bỏ, dùng ước tính (mặc định 5 giây). */
  timeoutMs?: number;
}

export function createValhallaRouter({ baseUrl, fetch: f = globalThis.fetch, timeoutMs = 5000 }: ValhallaRouterOptions): Router {
  const base = baseUrl.replace(/\/+$/, '');

  /** Một lượt hỏi đường. `relaxed`: bỏ qua giới hạn ra vào/đường cấm (điểm nằm trong sân bay, khu dân cư có cổng…). */
  async function ask(from: LatLng, to: LatLng, costing: string, relaxed: boolean, deadline: number): Promise<RoadRoute | 'no_path' | null> {
    const body: Record<string, unknown> = {
      locations: [
        { lat: from.lat, lon: from.lng },
        { lat: to.lat, lon: to.lng },
      ],
      costing,
      units: 'kilometers',
      language: 'vi-VN',
      directions_type: 'none',
    };
    if (relaxed) body.costing_options = { [costing]: { ignore_access: true, ignore_closures: true } };
    // GET (không preflight CORS), như trang openstreetmap.org gọi FOSSGIS Valhalla.
    const url = `${base}/route?json=${encodeURIComponent(JSON.stringify(body))}`;
    const wait = deadline - Date.now();
    if (wait <= 0) return null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    try {
      const res = await Promise.race([
        f(url, ctrl ? { signal: ctrl.signal } : undefined),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            ctrl?.abort();
            reject(new Error('timeout'));
          }, wait);
        }),
      ]);
      const json = (await res.json().catch(() => null)) as {
        error_code?: number;
        trip?: { summary?: { length?: number; time?: number }; legs?: { shape?: string }[] };
      } | null;
      // 442/171: không có đường nối hai điểm với chi phí này → thử lại kiểu nới lỏng.
      if (!res.ok) return json && (json.error_code === 442 || json.error_code === 171) ? 'no_path' : null;
      const trip = json?.trip;
      const len = trip?.summary?.length;
      const time = trip?.summary?.time;
      if (!trip?.legs?.length || typeof len !== 'number' || typeof time !== 'number') return null;
      const coords = trip.legs.flatMap((l) => (l.shape ? decodePolyline(l.shape, 6) : []));
      if (coords.length < 2) return null;
      return { coords, km: Math.max(0.1, Math.round(len * 10) / 10), minutes: Math.max(1, Math.round(time / 60)) };
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    async route(from, to, vehicle) {
      // Cả hai lượt chung một hạn chờ: lỗi mạng/quá giờ thì bỏ luôn, chỉ "không có đường" mới hỏi lại.
      const deadline = Date.now() + timeoutMs;
      const costing = COSTING[vehicle];
      const first = await ask(from, to, costing, false, deadline);
      if (first !== 'no_path') return first;
      const second = await ask(from, to, costing, true, deadline);
      return second === 'no_path' ? null : second;
    },
  };
}
