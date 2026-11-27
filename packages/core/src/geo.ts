/** Khoảng cách và ước tính tuyến đường (chưa dùng API bản đồ; đủ cho ước tính giá). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Khoảng cách đường chim bay (mét). */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Hệ số đường vòng nội đô và tốc độ trung bình TP.HCM (≈ 17 km/h giờ cao điểm). */
export const ROUTE_DETOUR = 1.6;
export const MIN_PER_KM = 3.45;

export interface RouteEstimate {
  km: number;
  minutes: number;
}

/** Tuyến đã đo sẵn (khớp số trong thiết kế). Khóa: "placeA>placeB". */
const KNOWN_ROUTES: Record<string, RouteEstimate> = {
  'landmark81>ben-thanh': { km: 5.8, minutes: 20 },
  'landmark81>ben-thanh-bac': { km: 5.7, minutes: 20 },
  'landmark81>cho-dem-ben-thanh': { km: 5.8, minutes: 20 },
  'landmark81>metro-ben-thanh': { km: 5.9, minutes: 21 },
};

export function estimateRoute(from: LatLng & { id?: string }, to: LatLng & { id?: string }): RouteEstimate {
  const known = from.id && to.id ? KNOWN_ROUTES[`${from.id}>${to.id}`] : undefined;
  if (known) return known;
  const km = Math.max(0.5, Math.round(((distanceM(from, to) / 1000) * ROUTE_DETOUR) * 10) / 10);
  return { km, minutes: Math.max(3, Math.round(km * MIN_PER_KM)) };
}

/** Làm tròn khoảng cách hiển thị tới 50 m: 683 → 700, 154 → 150. */
export function roundMeters(m: number): number {
  return Math.round(m / 50) * 50;
}
