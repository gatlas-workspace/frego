/** Nền bản đồ web dùng chung (bản đồ chuyến, chọn trên bản đồ). */
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import L from 'leaflet';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { colors, fontFamily, shadow } from '@/theme/tokens';

// Worker MapLibre phục vụ từ public/vendor (chép bằng scripts/copy-map-worker.mjs; Metro không tự phục vụ file này).
setWorkerUrl(`${window.location.origin}/vendor/maplibre-gl-worker.mjs`);

/**
 * Nền giống thongtincty (CARTO Positron): kiểu **Positron của OpenFreeMap** — cùng thiết kế, dữ liệu OSM, miễn phí,
 * không key (CARTO giờ bắt buộc key). Vẽ bằng MapLibre GL (WebGL) gắn vào Leaflet; nhãn đổi sang tên tiếng Việt.
 * Kiểm 27/11/2026: style, tile vector, font, sprite đều vào được qua DNS VNPT.
 */
const POSITRON_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const POSITRON_ATTRIBUTION = '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; OpenMapTiles &copy; OpenStreetMap';
/**
 * Dự phòng khi máy không có WebGL: tile raster OSM qua máy chủ cộng đồng OSM Đức (DNS VNPT không phân giải
 * `*.openstreetmap.org`), làm nhạt bằng CSS `.frego-tiles`.
 */
const TILE_URL = 'https://tile.openstreetmap.de/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; OpenStreetMap';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Nền Positron (MapLibre) hoặc raster dự phòng. */
export function BaseLayer({ attributionBottom = 0 }: { attributionBottom?: number }) {
  const map = useMap();
  const [fallback] = useState(() => !hasWebGL());
  const ctrl = useRef<L.Control | null>(null);
  // Ghi nguồn (bắt buộc theo giấy phép OSM/OpenFreeMap) thu gọn thành nút ⓘ nhỏ ở góc dưới phải — chốt 27/11/2026.
  useEffect(() => {
    const c = attributionControl(fallback ? ATTRIBUTION : POSITRON_ATTRIBUTION);
    c.addTo(map);
    ctrl.current = c;
    return () => {
      c.remove();
      ctrl.current = null;
    };
  }, [map, fallback]);
  // Đẩy nút lên trên phần đáy bị tấm trượt / thẻ quán / ô đếm che.
  useEffect(() => {
    const el = ctrl.current?.getContainer();
    if (el) el.style.marginBottom = `${Math.max(0, Math.round(attributionBottom))}px`;
  }, [map, fallback, attributionBottom]);
  useEffect(() => {
    if (fallback) return;
    const layer = maplibreGL({ style: POSITRON_STYLE, attributionControl: false });
    layer.addTo(map);
    const gl = layer.getMaplibreMap();
    // Kiểu Positron ưu tiên tên tiếng Anh (`name_en`): đổi sang tên địa phương (tiếng Việt có dấu).
    const vietnamese = () => {
      for (const l of gl.getStyle()?.layers ?? []) {
        if (l.type === 'symbol' && gl.getLayoutProperty(l.id, 'text-field') != null) {
          gl.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get', 'name'], ['get', 'name:latin']]);
        }
      }
    };
    // Ẩn ranh giới hành chính (phường/quận/tỉnh, nét đứt — dễ nhầm với đường đi, không giúp người đặt xe) và ranh giới
    // tranh chấp. Giữ đường ray (Metro số 1) và viền nét đứt của đường hầm: là đường thật.
    const hideBoundaries = () => {
      for (const id of ['boundary_3', 'boundary_disputed']) {
        if (gl.getLayer(id)) gl.setLayoutProperty(id, 'visibility', 'none');
      }
    };
    gl.once('load', () => {
      vietnamese();
      hideBoundaries();
    });
    return () => {
      layer.remove();
    };
  }, [map, fallback]);
  return fallback ? <TileLayer url={TILE_URL} maxZoom={19} className="frego-tiles" /> : null;
}

/**
 * Nút ⓘ ghi nguồn nhỏ ở góc dưới phải (đặt trên phần đáy bị che, xem BaseLayer): bấm thì hiện / ẩn dòng nguồn bên trái nút.
 * Thay thanh ghi nguồn mặc định của Leaflet (MapContainer đặt attributionControl={false}).
 */
function attributionControl(html: string): L.Control {
  const Ctrl = L.Control.extend({
    onAdd() {
      const wrap = L.DomUtil.create('div', 'frego-attrib');
      wrap.style.cssText = 'display:flex;align-items:flex-end;gap:2px;margin:0;font-family:inherit';
      const note = L.DomUtil.create('div', '', wrap);
      note.setAttribute('role', 'note');
      note.hidden = true;
      note.style.cssText =
        `margin:0 0 4px;max-width:200px;padding:4px 8px;border-radius:8px;background:${colors.surface};box-shadow:${shadow.mapLabel};` +
        `color:${colors.ink2};font:400 10px/14px ${fontFamily[400]},sans-serif`;
      note.innerHTML = html;
      const btn = L.DomUtil.create('button', '', wrap);
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Nguồn dữ liệu bản đồ');
      btn.setAttribute('aria-expanded', 'false');
      // Vùng chạm 44 px; hình tròn 18 px nằm sát góc dưới phải của vùng chạm (trông nhỏ, vẫn dễ bấm).
      btn.style.cssText =
        'width:44px;height:44px;padding:0 4px 4px 0;border:0;background:transparent;cursor:pointer;display:flex;align-items:flex-end;justify-content:flex-end';
      btn.innerHTML =
        `<span aria-hidden="true" style="width:18px;height:18px;border-radius:9px;background:${colors.surface};box-shadow:${shadow.mapLabel};` +
        `color:${colors.ink2};font:700 11px/18px ${fontFamily[700]},sans-serif;text-align:center;font-style:italic">i</span>`;
      L.DomEvent.disableClickPropagation(wrap);
      L.DomEvent.disableScrollPropagation(wrap);
      L.DomEvent.on(btn, 'click', () => {
        note.hidden = !note.hidden;
        btn.setAttribute('aria-expanded', String(!note.hidden));
      });
      return wrap;
    },
  });
  return new Ctrl({ position: 'bottomright' });
}

/**
 * Dọn khi gỡ bản đồ: dừng hiệu ứng bay/kéo và hủy hẹn giờ phóng bằng con lăn chuột (Leaflet không tự hủy) —
 * nếu không, hẹn giờ chạy trên bản đồ đã gỡ và báo "Cannot read properties of undefined (reading '_leaflet_pos')".
 */
export function MapCleanup() {
  const map = useMap();
  useEffect(
    () => () => {
      const wheel = map.scrollWheelZoom as unknown as { _timer?: ReturnType<typeof setTimeout> } | undefined;
      if (wheel?._timer) clearTimeout(wheel._timer);
      // MapContainer có thể đã gọi map.remove() trước (React dọn cha trước con): khi đó khung đã mất, không gọi stop().
      if ((map as unknown as { _mapPane?: HTMLElement })._mapPane) map.stop();
    },
    [map],
  );
  return null;
}
