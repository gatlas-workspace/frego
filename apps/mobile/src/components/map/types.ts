import type { Ref } from 'react';
import type { LatLng, SponsorPinView, TripRouteLine } from '@frego/core';

export interface MapPoint extends LatLng {
  /** Nhãn hiện cạnh điểm, VD "Vị trí của bạn", "Chợ Bến Thành" */
  label: string;
}

/** Điều khiển bản đồ từ ngoài (nút +/−, nút về vị trí nằm ở MapHeader, dùng chung hai nền tảng). */
export interface MapSurfaceHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  /** Canh lại khung nhìn ôm điểm đi, điểm đến và các quán. */
  recenter: () => void;
}

/** Bản đồ chuyến: điểm đi, điểm đến, đường đi, vòng tham chiếu 1 km và ghim quán có voucher dùng được. Hai bản: app (react-native-maps) và web (Leaflet). */
export interface MapSurfaceProps {
  ref?: Ref<MapSurfaceHandle>;
  origin: MapPoint;
  dest: MapPoint;
  /** Đường theo phố (nét liền có viền trắng) hoặc nối thẳng khi chưa/không tìm được đường (nét đứt). */
  route: TripRouteLine;
  sponsors: SponsorPinView[];
  /** Bán kính vòng tham chiếu quanh điểm đến (m) — chỉ để nhìn, không lọc quán */
  nearbyRadiusM: number;
  /** businessId của quán đang chọn (hiện vùng tặng mã) */
  selectedId: string | null;
  onSelect: (businessId: string | null) => void;
  /** Khoảng dưới đáy bị tấm trượt/thẻ che: chừa ra khi canh khung nhìn. */
  bottomInset: number;
  /** Đổi giá trị này để canh lại khung nhìn (VD khi bản đồ giãn ra). */
  fitKey: string;
  /** false: chỉ để xem (nền phía sau tấm trượt) — không kéo, không phóng, không nhận bàn phím. Mặc định true. */
  interactive?: boolean;
  /** Bản web: nút ⓘ ghi nguồn ở góc dưới phải, cách đáy bản đồ ngần này px (đặt trên phần bị che). Mặc định 0. */
  attributionBottom?: number;
}

/** Ghim gần nhau hơn ngần này (px) thì gom thành cụm (= cỡ ghim). */
export const CLUSTER_RADIUS_PX = 44;

/** Các điểm cần lọt vào khung nhìn: điểm đi, điểm đến, đường đi, các quán và trọn vòng tìm quán quanh điểm đến. */
export function fitPoints({
  origin,
  dest,
  route,
  sponsors,
  nearbyRadiusM,
}: Pick<MapSurfaceProps, 'origin' | 'dest' | 'route' | 'sponsors' | 'nearbyRadiusM'>): LatLng[] {
  const dLat = nearbyRadiusM / 111_320;
  const dLng = dLat / Math.cos((dest.lat * Math.PI) / 180);
  const ring = [
    { lat: dest.lat + dLat, lng: dest.lng },
    { lat: dest.lat - dLat, lng: dest.lng },
    { lat: dest.lat, lng: dest.lng + dLng },
    { lat: dest.lat, lng: dest.lng - dLng },
  ];
  // Chỉ cần khung bao của đường: lấy 4 điểm cực trị thay vì cả nghìn điểm.
  const ext = route.coords.length
    ? [
        route.coords.reduce((a, b) => (b.lat > a.lat ? b : a)),
        route.coords.reduce((a, b) => (b.lat < a.lat ? b : a)),
        route.coords.reduce((a, b) => (b.lng > a.lng ? b : a)),
        route.coords.reduce((a, b) => (b.lng < a.lng ? b : a)),
      ]
    : [];
  return [origin, dest, ...ext, ...sponsors, ...ring];
}
