import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, type Region } from 'react-native-maps';
import { clusterPins, zoomFromLongitudeDelta, type LatLng, type SponsorPinView } from '@frego/core';
import { ClusterBubble, DestDot, OriginDot, PointLabel, SponsorMarker } from './markers';
import { CLUSTER_RADIUS_PX, fitPoints, type MapSurfaceProps } from './types';
import { colors, HIT } from '@/theme/tokens';

/** Lề canh khung: hai bên đủ cho nửa nhãn điểm đi/đến (nhãn nằm giữa trên chấm). */
const EDGE = 32;
const SIDE = 64;
const coord = (p: LatLng) => ({ latitude: p.lat, longitude: p.lng });

/**
 * Bản đồ thật trong app: Apple Maps (iOS), Google Maps (Android, key ở app.config.js). Giao diện theo bản đồ thongtincty.
 * File duy nhất import `react-native-maps` (gói này không chạy trên web; bản web ở `MapSurface.web.tsx`).
 */
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
}: MapSurfaceProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [width, setWidth] = useState(0);
  const points = fitPoints({ origin, dest, route, sponsors, nearbyRadiusM });
  const line = useMemo(() => route.coords.map(coord), [route]);
  const selected = sponsors.find((s) => s.businessId === selectedId) ?? null;

  const zoom = region && width ? zoomFromLongitudeDelta(region.longitudeDelta, width) : 14;
  const groups = useMemo(() => clusterPins(sponsors, zoom, CLUSTER_RADIUS_PX, (s) => s.businessId), [sponsors, zoom]);

  const fit = () =>
    mapRef.current?.fitToCoordinates(points.map(coord), {
      edgePadding: { top: EDGE + 24, right: SIDE, bottom: EDGE + bottomInset, left: SIDE },
      animated: true,
    });
  const zoomBy = (factor: number) => {
    if (!region) return;
    mapRef.current?.animateToRegion(
      { ...region, latitudeDelta: region.latitudeDelta * factor, longitudeDelta: region.longitudeDelta * factor },
      250,
    );
  };

  useImperativeHandle(ref, () => ({ zoomIn: () => zoomBy(0.5), zoomOut: () => zoomBy(2), recenter: fit }));

  // Canh lại khi đổi chuyến, đổi danh sách quán hoặc bản đồ giãn/thu.
  useEffect(() => {
    const t = setTimeout(fit, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, dest.lat, dest.lng, sponsors.length, bottomInset, route]);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...coord(dest), latitudeDelta: 0.05, longitudeDelta: 0.05 }}
        userInterfaceStyle="light"
        onMapReady={fit}
        onRegionChangeComplete={setRegion}
        onPress={() => onSelect(null)}
        pitchEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        showsBuildings={false}
        toolbarEnabled={false}
      >
        {/* Vòng tham chiếu 1 km quanh điểm đến (như thongtincty): chỉ để ước lượng khoảng cách, không lọc quán */}
        <Circle center={coord(dest)} radius={nearbyRadiusM} strokeColor={colors.mapNearbyStroke} strokeWidth={2} fillColor={colors.mapNearbyFill} />
        {selected ? (
          <Circle
            center={coord(selected)}
            radius={selected.radiusM}
            strokeColor={colors.mapZoneStroke}
            strokeWidth={2}
            lineDashPattern={[6, 6]}
            fillColor={colors.mapZoneFill}
          />
        ) : null}
        {route.source === 'road' ? (
          <>
            {/* Đường theo phố: viền trắng + nét màu chính (kiểu app gọi xe) */}
            <Polyline coordinates={line} strokeColor={colors.white} strokeWidth={9} lineCap="round" lineJoin="round" />
            <Polyline coordinates={line} strokeColor={colors.primary} strokeWidth={5} lineCap="round" lineJoin="round" />
          </>
        ) : (
          <Polyline coordinates={line} strokeColor={colors.primary} strokeWidth={4} lineDashPattern={[10, 8]} />
        )}
        {/* anchor = tâm chấm: nhãn 26 + khoảng 6 + chấm 18 (đến: 26) */}
        <Marker coordinate={coord(origin)} anchor={{ x: 0.5, y: 41 / 50 }} tappable={false} tracksViewChanges={false}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <PointLabel text={origin.label} />
            <OriginDot />
          </View>
        </Marker>
        <Marker coordinate={coord(dest)} anchor={{ x: 0.5, y: 45 / 58 }} tappable={false} tracksViewChanges={false}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <PointLabel text={dest.label} />
            <DestDot />
          </View>
        </Marker>
        {groups.map((g) =>
          g.kind === 'single' ? (
            <SponsorPin key={`pin:${g.key}:${g.key === selectedId}`} pin={g.item} selected={g.key === selectedId} onSelect={onSelect} />
          ) : (
            <Marker
              key={`cluster:${g.key}`}
              coordinate={coord(g)}
              tracksViewChanges={false}
              accessibilityLabel={`${g.items.length} quán tài trợ: ${g.items.map((p) => p.name).join(', ')}. Phóng to để xem`}
              onPress={(e) => {
                e.stopPropagation();
                // Chạm cụm → phóng tới vừa các quán trong cụm (như leaflet.markercluster).
                mapRef.current?.fitToCoordinates(g.items.map(coord), {
                  edgePadding: { top: HIT * 2, right: HIT * 2, bottom: HIT * 2 + bottomInset, left: HIT * 2 },
                  animated: true,
                });
              }}
            >
              <ClusterBubble count={g.items.length} />
            </Marker>
          ),
        )}
      </MapView>
    </View>
  );
}

function SponsorPin({ pin, selected, onSelect }: { pin: SponsorPinView; selected: boolean; onSelect: (id: string) => void }) {
  // Có logo thì chờ ảnh tải xong mới tắt tracksViewChanges (Google Maps chụp view một lần, như thongtincty).
  const [settled, setSettled] = useState(!pin.logoUrl);
  useEffect(() => {
    if (!pin.logoUrl) return;
    const t = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(t);
  }, [pin.logoUrl]);
  return (
    <Marker
      coordinate={coord(pin)}
      tracksViewChanges={!settled}
      zIndex={selected ? 2 : 1}
      onPress={(e) => {
        e.stopPropagation();
        onSelect(pin.businessId);
      }}
      accessibilityLabel={pin.a11yLabel}
    >
      <SponsorMarker pin={pin} selected={selected} />
    </Marker>
  );
}
