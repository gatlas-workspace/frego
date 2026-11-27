import { useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { PICK_ZOOM, type PickMapHandle, type PickMapProps } from './pick-types';

/** Độ rộng khung nhìn (độ kinh) ứng với zoom 17 trên màn ~390 px. */
const DELTA = (390 * 360) / (256 * 2 ** PICK_ZOOM);

/** Bản app: react-native-maps (Apple Maps / Google Maps), như bản đồ chuyến. */
export function PickMap({ ref, initial, onCenterChange }: PickMapProps) {
  const mapRef = useRef<MapView>(null);
  const region = useRef<Region>({ latitude: initial.lat, longitude: initial.lng, latitudeDelta: DELTA, longitudeDelta: DELTA });

  const zoomBy = (f: number) => {
    const r = region.current;
    mapRef.current?.animateToRegion({ ...r, latitudeDelta: r.latitudeDelta * f, longitudeDelta: r.longitudeDelta * f }, 250);
  };
  useImperativeHandle(
    ref,
    (): PickMapHandle => ({
      zoomIn: () => zoomBy(0.5),
      zoomOut: () => zoomBy(2),
      centerOn: (p) => mapRef.current?.animateToRegion({ ...region.current, latitude: p.lat, longitude: p.lng }, 400),
    }),
  );

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={region.current}
      userInterfaceStyle="light"
      pitchEnabled={false}
      rotateEnabled={false}
      showsCompass={false}
      toolbarEnabled={false}
      onMapReady={() => onCenterChange(initial)}
      onRegionChangeComplete={(r) => {
        region.current = r;
        onCenterChange({ lat: r.latitude, lng: r.longitude });
      }}
    />
  );
}
