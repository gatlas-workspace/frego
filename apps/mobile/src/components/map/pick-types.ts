import type { Ref } from 'react';
import type { LatLng } from '@frego/core';

export interface PickMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  /** Đưa tâm bản đồ (vị trí ghim) về điểm này. */
  centerOn: (p: LatLng) => void;
}

/** Bản đồ chọn điểm: ghim cố định giữa màn (vẽ ở màn hình), kéo bản đồ để đổi điểm. */
export interface PickMapProps {
  ref?: Ref<PickMapHandle>;
  initial: LatLng;
  /** Gọi khi bản đồ dừng kéo/phóng, với tọa độ tâm (= điểm ghim). */
  onCenterChange: (p: LatLng) => void;
  /** Bản web: nút ⓘ ghi nguồn ở góc dưới phải, cách đáy bản đồ ngần này px (đặt trên thẻ điểm đến). Mặc định 0. */
  attributionBottom?: number;
}

/** Mức zoom ban đầu: đủ gần để thấy số nhà, tên hẻm. */
export const PICK_ZOOM = 17;
