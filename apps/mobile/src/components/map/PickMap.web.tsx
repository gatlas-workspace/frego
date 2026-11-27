import 'leaflet/dist/leaflet.css';
import { useEffect, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import { BaseLayer, MapCleanup } from './BaseLayer.web';
import { PICK_ZOOM, type PickMapHandle, type PickMapProps } from './pick-types';
import { colors } from '@/theme/tokens';

function Bridge({ handleRef, onCenterChange }: { handleRef: PickMapProps['ref']; onCenterChange: PickMapProps['onCenterChange'] }) {
  const map = useMap();
  const report = () => {
    const c = map.getCenter();
    onCenterChange({ lat: c.lat, lng: c.lng });
  };
  useMapEvents({ moveend: report });
  useImperativeHandle(
    handleRef,
    (): PickMapHandle => ({
      zoomIn: () => map.zoomIn(1),
      zoomOut: () => map.zoomOut(1),
      centerOn: (p) => map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), PICK_ZOOM - 1)),
    }),
    [map],
  );
  // Báo tâm ban đầu một lần.
  useEffect(report, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** Bản web: Leaflet + nền Positron (như bản đồ chuyến). */
export function PickMap({ ref, initial, onCenterChange, attributionBottom }: PickMapProps) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.mapBg }]}>
      <MapContainer
        center={[initial.lat, initial.lng]}
        zoom={PICK_ZOOM}
        zoomSnap={0.25}
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%', background: colors.mapBg }}
      >
        <BaseLayer attributionBottom={attributionBottom} />
        <MapCleanup />
        <Bridge handleRef={ref} onCenterChange={onCenterChange} />
      </MapContainer>
    </View>
  );
}
