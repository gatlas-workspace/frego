import 'leaflet/dist/leaflet.css';
import './map.css';
import L from 'leaflet';
import { useEffect, useImperativeHandle, useMemo, useState, type CSSProperties } from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, MapContainer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { BaseLayer, MapCleanup } from './BaseLayer.web';
import { clusterPins, icons, type IconName, type LatLng, type PinGroup, type SponsorPinView } from '@frego/core';
import { CATEGORY } from '@/components/ui/BrandLogo';
import { CLUSTER_RADIUS_PX, fitPoints, type MapSurfaceHandle, type MapSurfaceProps } from './types';
import { colors, fontFamily, HIT, shadow } from '@/theme/tokens';

/** Lề canh khung: hai bên đủ cho nửa nhãn điểm đi/đến (nhãn nằm giữa trên chấm). */
const EDGE = 32;
const SIDE = 64;
const MAX_FIT_ZOOM = 16;

const ll = (p: LatLng): [number, number] => [p.lat, p.lng];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Icon nét chung (@frego/core/icons) thành chuỗi SVG cho divIcon. */
function iconSvg(name: IconName, size: number, color: string) {
  const body = icons[name]
    .map((s) =>
      s.kind === 'path'
        ? `<path d="${s.d}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`
        : s.kind === 'circle'
          ? `<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}"/>`
          : `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}"${s.rx ? ` rx="${s.rx}"` : ''}/>`,
    )
    .join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

const labelHtml = (text: string) =>
  `<div style="padding:6px 10px;border-radius:10px;background:${colors.surface};box-shadow:${shadow.mapLabel};font:700 12px/14px ${fontFamily[700]},sans-serif;color:${colors.ink};white-space:nowrap">${esc(text)}</div>`;

/** Điểm đi (chấm xanh "Vị trí của bạn" như thongtincty) / điểm đến (chấm màu chính): nhãn phía trên, tâm chấm đúng tọa độ. */
function pointIcon(text: string, kind: 'origin' | 'dest') {
  const d = kind === 'origin' ? 18 : 26;
  const dot =
    kind === 'origin'
      ? `<div style="width:${d}px;height:${d}px;box-sizing:border-box;border-radius:9999px;background:${colors.mapUser};border:3px solid ${colors.white};box-shadow:${shadow.mapLabel}"></div>`
      : `<div style="width:${d}px;height:${d}px;box-sizing:border-box;border-radius:9999px;background:${colors.primary};border:4px solid ${colors.white};box-shadow:${shadow.mapLabel}"></div>`;
  return L.divIcon({
    className: '',
    html: `<div style="position:absolute;left:50%;bottom:${-d / 2}px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px">${labelHtml(text)}${dot}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Ghim quán kiểu thongtincty: tròn 44px, viền trắng 3px, bóng nhẹ; có logo thì hiện logo, không thì icon ngành. */
function sponsorIcon(pin: SponsorPinView, selected: boolean) {
  const cat = CATEGORY[pin.category];
  const inner = pin.logoUrl
    ? `<img src="${esc(pin.logoUrl)}" alt="" style="width:100%;height:100%;object-fit:contain;background:${colors.white}" loading="lazy"/>`
    : `<div style="width:100%;height:100%;background:${cat.bg};display:flex;align-items:center;justify-content:center">${iconSvg(cat.icon, 20, colors.white)}</div>`;
  return L.divIcon({
    className: 'frego-pin',
    html: `<div style="width:${HIT}px;height:${HIT}px;box-sizing:border-box;border-radius:9999px;overflow:hidden;border:3px solid ${selected ? colors.primary : colors.white};background:${colors.white};box-shadow:0 2px 8px rgba(20,21,43,0.22);cursor:pointer">${inner}</div>`,
    iconSize: [HIT, HIT],
    iconAnchor: [HIT / 2, HIT / 2],
  });
}

/** Bong bóng cụm kiểu leaflet.markercluster (xanh lá, 40px trong vùng chạm 44px). */
function clusterIcon(count: number) {
  return L.divIcon({
    className: 'frego-pin',
    html: `<div style="width:${HIT}px;height:${HIT}px;display:flex;align-items:center;justify-content:center;cursor:pointer"><div style="width:40px;height:40px;border-radius:9999px;background:${colors.mapClusterOuter};display:flex;align-items:center;justify-content:center"><div style="width:30px;height:30px;border-radius:9999px;background:${colors.mapClusterInner};display:flex;align-items:center;justify-content:center;font:700 13px/1 ${fontFamily[700]},sans-serif;color:${colors.ink}">${count}</div></div></div>`,
    iconSize: [HIT, HIT],
    iconAnchor: [HIT / 2, HIT / 2],
  });
}

function fitAll(map: L.Map, points: LatLng[], bottomInset: number) {
  map.invalidateSize();
  map.fitBounds(L.latLngBounds(points.map(ll)), {
    // Phía trên chừa chỗ cho nhãn điểm đi/đến (≈ 34px trên chấm).
    paddingTopLeft: [SIDE, EDGE + 24],
    paddingBottomRight: [SIDE, EDGE + bottomInset],
    maxZoom: MAX_FIT_ZOOM,
    animate: true,
  });
}

/** Lớp trong MapContainer: canh khung, theo dõi zoom, nối nút điều khiển bên ngoài. */
function Controller({
  handleRef,
  points,
  bottomInset,
  fitKey,
  onZoom,
  onSelect,
}: {
  handleRef: MapSurfaceProps['ref'];
  points: LatLng[];
  bottomInset: number;
  fitKey: string;
  onZoom: (z: number) => void;
  onSelect: (id: string | null) => void;
}) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useMapEvents({ zoomend: () => onZoom(map.getZoom()), click: () => onSelect(null) });
  useImperativeHandle(
    handleRef,
    () => ({ zoomIn: () => map.zoomIn(1), zoomOut: () => map.zoomOut(1), recenter: () => fitAll(map, points, bottomInset) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, key, bottomInset],
  );
  useEffect(() => {
    const t = setTimeout(() => fitAll(map, points, bottomInset), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, bottomInset, fitKey]);
  return null;
}

/** Bản web của bản đồ thật: Leaflet + nền OpenStreetMap, giao diện theo bản đồ thongtincty. */
export function MapSurface({
  ref,
  origin,
  dest,
  route,
  sponsors,
  nearbyRadiusM,
  selectedId,
  onSelect,
  bottomInset,
  fitKey,
  interactive = true,
  attributionBottom,
}: MapSurfaceProps) {
  const [zoom, setZoom] = useState(14);
  const points = fitPoints({ origin, dest, route, sponsors, nearbyRadiusM });
  const line = useMemo(() => route.coords.map(ll), [route]);
  const selected = sponsors.find((s) => s.businessId === selectedId) ?? null;
  const originIcon = useMemo(() => pointIcon(origin.label, 'origin'), [origin.label]);
  const destIcon = useMemo(() => pointIcon(dest.label, 'dest'), [dest.label]);
  const groups: PinGroup<SponsorPinView>[] = useMemo(
    () => clusterPins(sponsors, zoom, CLUSTER_RADIUS_PX, (s) => s.businessId),
    [sponsors, zoom],
  );

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.mapBg }]}>
      <MapContainer
        center={ll(dest)}
        zoom={14}
        // Canh khung ôm sát hơn (mặc định làm tròn xuống bậc nguyên, tuyến ngắn trông rất nhỏ).
        zoomSnap={0.25}
        zoomControl={false}
        attributionControl={false}
        dragging={interactive}
        touchZoom={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        boxZoom={interactive}
        keyboard={interactive}
        style={{ width: '100%', height: '100%', background: colors.mapBg, '--frego-focus': colors.primary } as CSSProperties}
      >
        <BaseLayer attributionBottom={attributionBottom} />
        <MapCleanup />
        <Controller handleRef={ref} points={points} bottomInset={bottomInset} fitKey={fitKey} onZoom={setZoom} onSelect={onSelect} />
        {/* Vòng tham chiếu 1 km quanh điểm đến (như thongtincty): chỉ để ước lượng khoảng cách, không lọc quán */}
        <Circle
          center={ll(dest)}
          radius={nearbyRadiusM}
          pathOptions={{ color: colors.mapNearbyStroke, weight: 2, fillColor: colors.mapNearbyFill, fillOpacity: 1 }}
          interactive={false}
        />
        {selected ? (
          <Circle
            center={ll(selected)}
            radius={selected.radiusM}
            pathOptions={{ color: colors.mapZoneStroke, weight: 2, dashArray: '6 6', fillColor: colors.mapZoneFill, fillOpacity: 1 }}
            interactive={false}
          />
        ) : null}
        {route.source === 'road' ? (
          <>
            {/* Đường theo phố: viền trắng + nét màu chính (kiểu app gọi xe) */}
            <Polyline positions={line} pathOptions={{ color: colors.white, weight: 9, lineCap: 'round', lineJoin: 'round' }} interactive={false} />
            <Polyline positions={line} pathOptions={{ color: colors.primary, weight: 5, lineCap: 'round', lineJoin: 'round' }} interactive={false} />
          </>
        ) : (
          <Polyline positions={line} pathOptions={{ color: colors.primary, weight: 4, dashArray: '10 8' }} interactive={false} />
        )}
        <Marker position={ll(origin)} icon={originIcon} interactive={false} keyboard={false} />
        <Marker position={ll(dest)} icon={destIcon} interactive={false} keyboard={false} />
        {groups.map((g) =>
          g.kind === 'single' ? (
            <Marker
              key={`pin:${g.key}:${g.key === selectedId}`}
              position={ll(g)}
              icon={sponsorIcon(g.item, g.key === selectedId)}
              title={g.item.a11yLabel}
              alt={g.item.a11yLabel}
              zIndexOffset={g.key === selectedId ? 1000 : 500}
              eventHandlers={{ click: () => onSelect(g.key) }}
            />
          ) : (
            <ClusterMarker key={`cluster:${g.key}`} group={g} />
          ),
        )}
      </MapContainer>
    </View>
  );
}

/** Chạm cụm → phóng to tới vừa các quán trong cụm (như leaflet.markercluster). */
function ClusterMarker({ group }: { group: Extract<PinGroup<SponsorPinView>, { kind: 'cluster' }> }) {
  const map = useMap();
  const label = `${group.items.length} quán tài trợ: ${group.items.map((p) => p.name).join(', ')}. Phóng to để xem`;
  return (
    <Marker
      position={ll(group)}
      icon={clusterIcon(group.items.length)}
      title={label}
      alt={label}
      zIndexOffset={600}
      eventHandlers={{
        click: () => {
          const bounds = L.latLngBounds(group.items.map(ll));
          // Hai quán gần như cùng chỗ: phóng tới mức đủ tách (ghim 44px), tối đa zoom 19.
          map.flyToBounds(bounds, { padding: [HIT * 2, HIT * 2], maxZoom: 19 });
        },
      }}
    />
  );
}
