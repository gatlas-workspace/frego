'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Button } from '@/components/web';

/**
 * Bản đồ ghim vị trí cửa hàng (bước 2 của Đăng ký): kéo bản đồ để ghim giữa khung nằm đúng cửa hàng.
 * Không thêm thư viện: tự xếp ô bản đồ OpenStreetMap (máy chủ tile.openstreetmap.de — DNS VNPT chặn *.openstreetmap.org).
 * Bàn phím: phím mũi tên để dịch bản đồ, +/− để phóng to/thu nhỏ.
 */
const TILE = 256;
const TILE_URL = (z: number, x: number, y: number) => `https://tile.openstreetmap.de/${z}/${x}/${y}.png`;
const MIN_Z = 12;
const MAX_Z = 19;

type LatLng = { lat: number; lng: number };

function project({ lat, lng }: LatLng, z: number) {
  const n = TILE * 2 ** z;
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * n, y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n };
}

function unproject(x: number, y: number, z: number): LatLng {
  const n = TILE * 2 ** z;
  const lng = (x / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  return { lat, lng };
}

export function PinMap({
  initial,
  saving,
  onSave,
}: {
  initial: LatLng;
  saving: boolean;
  onSave: (p: LatLng) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [size, setSize] = useState({ w: 640, h: 320 });
  const [zoom, setZoom] = useState(17);
  const [center, setCenter] = useState<LatLng>(initial);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth || 640, h: el.clientHeight || 320 });
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const c = project(center, zoom);
  const left = c.x - size.w / 2;
  const top = c.y - size.h / 2;
  const count = 2 ** zoom;
  const tiles: { key: string; x: number; y: number; src: string }[] = [];
  for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + size.h) / TILE); ty++) {
    if (ty < 0 || ty >= count) continue;
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + size.w) / TILE); tx++) {
      const wx = ((tx % count) + count) % count;
      tiles.push({ key: `${zoom}/${tx}/${ty}`, x: tx * TILE - left, y: ty * TILE - top, src: TILE_URL(zoom, wx, ty) });
    }
  }

  const panBy = (dx: number, dy: number) => setCenter(unproject(c.x + dx, c.y + dy, zoom));
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, cx: c.x, cy: c.y };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    setCenter(unproject(d.cx - (e.clientX - d.x), d.cy - (e.clientY - d.y), zoom));
  };
  const onUp = () => {
    drag.current = null;
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 60;
    const map: Record<string, () => void> = {
      ArrowLeft: () => panBy(-step, 0),
      ArrowRight: () => panBy(step, 0),
      ArrowUp: () => panBy(0, -step),
      ArrowDown: () => panBy(0, step),
      '+': () => setZoom((z) => Math.min(MAX_Z, z + 1)),
      '=': () => setZoom((z) => Math.min(MAX_Z, z + 1)),
      '-': () => setZoom((z) => Math.max(MIN_Z, z - 1)),
    };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={box}
        role="application"
        aria-label="Bản đồ ghim vị trí cửa hàng. Kéo bản đồ hoặc dùng phím mũi tên để ghim giữa khung nằm đúng cửa hàng; phím + và − để phóng to, thu nhỏ."
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className="relative h-[320px] w-full cursor-grab touch-none select-none overflow-hidden rounded-frame border border-line bg-hover outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue active:cursor-grabbing max-[480px]:h-[260px]"
      >
        {tiles.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={t.src}
            alt=""
            width={TILE}
            height={TILE}
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{ left: t.x, top: t.y }}
          />
        ))}
        {/* Ghim cố định giữa khung: đầu ghim chạm đúng tâm. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 34"
          width="30"
          height="42"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow"
        >
          <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0Z" className="fill-danger" />
          <circle cx="12" cy="12" r="4.5" className="fill-white" />
        </svg>
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <Button type="button" variant="secondary" size="sm" aria-label="Phóng to" onClick={() => setZoom((z) => Math.min(MAX_Z, z + 1))}>
            +
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-label="Thu nhỏ" onClick={() => setZoom((z) => Math.max(MIN_Z, z - 1))}>
            −
          </Button>
        </div>
        <span className="absolute bottom-1 right-1 rounded-ctl bg-white/90 px-1 text-[11px] text-ink-2">© OpenStreetMap</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] text-ink-2 tabular-nums">
          Ghim: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
        </span>
        <Button type="button" icon="check" disabled={saving} onClick={() => onSave(center)}>
          {saving ? 'Đang lưu…' : 'Lưu vị trí ghim'}
        </Button>
      </div>
    </div>
  );
}
