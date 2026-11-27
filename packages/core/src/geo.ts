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

/* ── Bản đồ: chiếu Web Mercator và gom cụm ghim theo khoảng cách trên màn hình ── */

const TILE_PX = 256;

/** Tọa độ điểm ảnh (Web Mercator) ở mức zoom `zoom` (cùng nghĩa zoom của Leaflet/Google). */
export function projectPx(p: LatLng, zoom: number): { x: number; y: number } {
  const scale = TILE_PX * 2 ** zoom;
  const s = Math.sin((Math.max(-85, Math.min(85, p.lat)) * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale,
  };
}

/** Mức zoom tương ứng khung nhìn rộng `longitudeDelta` độ trên `widthPx` điểm ảnh (react-native-maps báo region, không báo zoom). */
export function zoomFromLongitudeDelta(longitudeDelta: number, widthPx: number): number {
  return Math.log2((widthPx * 360) / (TILE_PX * Math.max(longitudeDelta, 1e-9)));
}

export type PinGroup<T extends LatLng> =
  | { kind: 'single'; key: string; lat: number; lng: number; item: T }
  | { kind: 'cluster'; key: string; lat: number; lng: number; items: T[] };

/**
 * Gom các ghim cách nhau dưới `radiusPx` điểm ảnh ở mức zoom hiện tại thành một cụm (tâm = trung bình).
 * Tham lam theo thứ tự đầu vào: mỗi ghim vào cụm đầu tiên có ghim mở cụm đủ gần.
 */
export function clusterPins<T extends LatLng>(items: T[], zoom: number, radiusPx: number, keyOf: (item: T) => string): PinGroup<T>[] {
  const groups: { anchor: { x: number; y: number }; items: T[] }[] = [];
  for (const item of items) {
    const p = projectPx(item, zoom);
    const g = groups.find((x) => Math.hypot(x.anchor.x - p.x, x.anchor.y - p.y) < radiusPx);
    if (g) g.items.push(item);
    else groups.push({ anchor: p, items: [item] });
  }
  return groups.map(({ items: list }) => {
    if (list.length === 1) return { kind: 'single', key: keyOf(list[0]!), lat: list[0]!.lat, lng: list[0]!.lng, item: list[0]! };
    const lat = list.reduce((s, x) => s + x.lat, 0) / list.length;
    const lng = list.reduce((s, x) => s + x.lng, 0) / list.length;
    return { kind: 'cluster', key: list.map(keyOf).sort().join('+'), lat, lng, items: list };
  });
}
