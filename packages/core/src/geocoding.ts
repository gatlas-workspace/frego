/**
 * Tìm địa chỉ (gõ → gợi ý) và đổi tọa độ thành địa chỉ (chọn trên bản đồ).
 * Chốt 27/11/2026: **Goong** (key `EXPO_PUBLIC_GOONG_API_KEY`); chưa có key thì tạm dùng **Photon** (OSM, như thongtincty).
 * Nominatim của openstreetmap.org không dùng được: DNS VNPT chặn `*.openstreetmap.org`.
 */
import type { LatLng } from './geo';
import type { Place } from './types';

/** Một gợi ý địa chỉ. Có tọa độ (Photon) hoặc chưa (Goong: cần hỏi chi tiết khi chọn). */
export interface GeoHit {
  /** Id dùng cho planTrip: "geo:…" (đã có tọa độ) hoặc "goong:…" (hỏi chi tiết khi chọn) */
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  /** Chỉ là con đường, không có số nhà (OSM ở VN thiếu số nhà) → nên mở bản đồ để ghim đúng chỗ */
  street: boolean;
}

export interface Geocoder {
  readonly provider: 'goong' | 'photon';
  search(query: string, near: LatLng): Promise<GeoHit[]>;
  /** Goong: place_id → tọa độ. Photon không cần (gợi ý đã có tọa độ). */
  detail(providerId: string, fallback: { name: string; address: string }): Promise<Place | null>;
  reverse(p: LatLng): Promise<Place | null>;
}

/* ── Id cho điểm đến tự do (không có trong bảng places) ── */

const enc = encodeURIComponent;
const dec = (s: string | undefined) => {
  try {
    return decodeURIComponent(s ?? '');
  } catch {
    return s ?? '';
  }
};

/** "geo:10.789500,106.685500|Tên|Địa chỉ" — lưu được trong trips.dest_place_id (phần trước dấu "|"). */
export function geoPlaceId(p: { lat: number; lng: number; name: string; address: string }): string {
  return `geo:${p.lat.toFixed(6)},${p.lng.toFixed(6)}|${enc(p.name)}|${enc(p.address)}`;
}

/** Đọc lại id "geo:…" thành Place (id gọn "geo:lat,lng"). Sai định dạng → null. */
export function parseGeoPlaceId(id: string): Place | null {
  if (!id.startsWith('geo:')) return null;
  const [coord, name, address] = id.slice(4).split('|');
  const [lat, lng] = (coord ?? '').split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const n = dec(name);
  const a = dec(address);
  return { id: `geo:${lat!.toFixed(6)},${lng!.toFixed(6)}`, name: n || 'Điểm đã chọn trên bản đồ', address: a, district: '', lat: lat!, lng: lng! };
}

/** "goong:<place_id>|Tên|Địa chỉ" */
export function goongPlaceRef(placeId: string, name: string, address: string): string {
  return `goong:${enc(placeId)}|${enc(name)}|${enc(address)}`;
}

export function parseGoongPlaceRef(id: string): { placeId: string; name: string; address: string } | null {
  if (!id.startsWith('goong:')) return null;
  const [pid, name, address] = id.slice(6).split('|');
  const placeId = dec(pid);
  return placeId ? { placeId, name: dec(name), address: dec(address) } : null;
}

/* ── Gọi mạng có giới hạn thời gian ── */

async function getJson(f: typeof fetch, url: string, timeoutMs: number): Promise<unknown | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  try {
    const res = await Promise.race([
      f(url, ctrl ? { signal: ctrl.signal } : undefined),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          ctrl?.abort();
          reject(new Error('timeout'));
        }, timeoutMs);
      }),
    ]);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const joinParts = (parts: string[]) => parts.filter((x, i, a) => x && a.indexOf(x) === i).join(', ');

export interface GeocoderOptions {
  fetch?: typeof fetch;
  timeoutMs?: number;
}

/* ── Goong (Việt Nam) ── */

/**
 * Goong REST (rsapi.goong.io), theo khuôn Google Places cũ: AutoComplete → predictions[place_id, description,
 * structured_formatting]; Place/Detail → result.geometry.location; Geocode?latlng → results[formatted_address].
 * Chưa thử với key thật (27/11/2026: tài liệu docs.goong.io lỗi chứng chỉ; API có thật, không key trả API_KEY_MISSING).
 */
export function createGoongGeocoder({
  apiKey,
  baseUrl = 'https://rsapi.goong.io',
  fetch: f = globalThis.fetch,
  timeoutMs = 5000,
}: GeocoderOptions & { apiKey: string; baseUrl?: string }): Geocoder {
  const base = baseUrl.replace(/\/+$/, '');
  const key = `api_key=${enc(apiKey)}`;
  return {
    provider: 'goong',
    async search(query, near) {
      const url = `${base}/Place/AutoComplete?${key}&input=${enc(query)}&location=${near.lat},${near.lng}&limit=8&more_compound=true`;
      const json = (await getJson(f, url, timeoutMs)) as { predictions?: unknown[] } | null;
      return (json?.predictions ?? []).flatMap((raw) => {
        const p = raw as { place_id?: unknown; description?: unknown; structured_formatting?: { main_text?: unknown; secondary_text?: unknown } };
        const placeId = str(p.place_id);
        const description = str(p.description);
        const name = str(p.structured_formatting?.main_text) || description.split(',')[0]!.trim();
        const address = str(p.structured_formatting?.secondary_text) || description;
        if (!placeId || !name) return [];
        return [{ id: goongPlaceRef(placeId, name, address), name, address, street: false } satisfies GeoHit];
      });
    },
    async detail(placeId, fallback) {
      const json = (await getJson(f, `${base}/Place/Detail?${key}&place_id=${enc(placeId)}`, timeoutMs)) as {
        result?: { name?: unknown; formatted_address?: unknown; geometry?: { location?: { lat?: unknown; lng?: unknown } } };
      } | null;
      const r = json?.result;
      const lat = num(r?.geometry?.location?.lat);
      const lng = num(r?.geometry?.location?.lng);
      if (lat === undefined || lng === undefined) return null;
      const name = fallback.name || str(r?.name);
      const address = fallback.address || str(r?.formatted_address);
      return { id: `geo:${lat.toFixed(6)},${lng.toFixed(6)}`, name, address, district: '', lat, lng };
    },
    async reverse(p) {
      const json = (await getJson(f, `${base}/Geocode?${key}&latlng=${p.lat},${p.lng}`, timeoutMs)) as {
        results?: { name?: unknown; formatted_address?: unknown }[];
      } | null;
      const r = json?.results?.[0];
      const full = str(r?.formatted_address);
      if (!r || !full) return null;
      const name = str(r.name) || full.split(',')[0]!.trim();
      const address = full.startsWith(name) ? full.slice(name.length).replace(/^[,\s]+/, '') : full;
      return { id: `geo:${p.lat.toFixed(6)},${p.lng.toFixed(6)}`, name, address, district: '', lat: p.lat, lng: p.lng };
    },
  };
}

/* ── Photon (OSM) ── */

/** Khung TP.HCM (gồm vùng ven): Photon chỉ trả kết quả trong khung này. */
export const HCMC_BBOX = { west: 106.35, south: 10.35, east: 107.05, north: 11.2 };

type PhotonProps = {
  name?: unknown;
  housenumber?: unknown;
  street?: unknown;
  locality?: unknown;
  district?: unknown;
  city?: unknown;
  osm_key?: unknown;
};

function photonPlace(props: PhotonProps): { name: string; address: string; street: boolean } {
  const name0 = str(props.name);
  const house = str(props.housenumber);
  const street = str(props.street);
  const line = joinParts([house && street ? `${house} ${street}` : street]);
  const name = name0 || line || 'Điểm đã chọn trên bản đồ';
  // Mọi kết quả đều trong TP.HCM (khung tìm): bỏ tên thành phố cho dòng phụ ngắn, đọc được trên một dòng.
  const city = str(props.city);
  const cityShown = /h[ồo] ch[íi] minh/i.test(city) ? '' : city;
  const address = joinParts([name0 ? line : '', str(props.locality) && !str(props.district) ? str(props.locality) : '', str(props.district), cityShown]);
  return { name, address, street: str(props.osm_key) === 'highway' && !house };
}

export function createPhotonGeocoder({
  baseUrl = 'https://photon.komoot.io',
  fetch: f = globalThis.fetch,
  timeoutMs = 5000,
}: GeocoderOptions & { baseUrl?: string } = {}): Geocoder {
  const base = baseUrl.replace(/\/+$/, '');
  const bbox = `${HCMC_BBOX.west},${HCMC_BBOX.south},${HCMC_BBOX.east},${HCMC_BBOX.north}`;
  return {
    provider: 'photon',
    async search(query, near) {
      const url = `${base}/api/?q=${enc(query)}&lat=${near.lat}&lon=${near.lng}&bbox=${bbox}&limit=8&lang=default`;
      const json = (await getJson(f, url, timeoutMs)) as { features?: unknown[] } | null;
      const seen = new Set<string>();
      return (json?.features ?? []).flatMap((raw) => {
        const ft = raw as { properties?: PhotonProps; geometry?: { coordinates?: unknown[] } };
        const lng = num(ft.geometry?.coordinates?.[0]);
        const lat = num(ft.geometry?.coordinates?.[1]);
        if (lat === undefined || lng === undefined || !ft.properties) return [];
        const p = photonPlace(ft.properties);
        // Một con đường dài có nhiều đoạn: giữ một kết quả mỗi tên + địa chỉ.
        const k = `${p.name}|${p.address}`;
        if (seen.has(k)) return [];
        seen.add(k);
        return [{ id: geoPlaceId({ lat, lng, ...p }), name: p.name, address: p.address, lat, lng, street: p.street } satisfies GeoHit];
      });
    },
    async detail() {
      return null;
    },
    async reverse(p) {
      const json = (await getJson(f, `${base}/reverse?lat=${p.lat}&lon=${p.lng}&lang=default`, timeoutMs)) as {
        features?: { properties?: PhotonProps }[];
      } | null;
      const props = json?.features?.[0]?.properties;
      if (!props) return null;
      const x = photonPlace(props);
      return { id: `geo:${p.lat.toFixed(6)},${p.lng.toFixed(6)}`, name: x.name, address: x.address, district: str(props.district), lat: p.lat, lng: p.lng };
    },
  };
}
