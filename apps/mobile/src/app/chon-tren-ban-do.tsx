// Chọn điểm đến trên bản đồ: kéo bản đồ để đặt ghim giữa màn, Frego đổi điểm ghim thành địa chỉ, bấm "Đến đây".
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LatLng } from '@frego/core';
import { ZoomButtons } from '@/components/map/MapControls';
import { PickMap } from '@/components/map/PickMap';
import type { PickMapHandle } from '@/components/map/pick-types';
import { BackButton, Button, Icon, InfoNote, T } from '@/components/ui';
import { useStartTrip } from '@/components/screens/flow/useStartTrip';
import { useApi } from '@/lib/api';
import { usePickup } from '@/lib/pickup';
import { colors, HIT, radius, shadow } from '@/theme/tokens';

/** Làm tròn ~1 m để không hỏi địa chỉ lại khi bản đồ chỉ nhích. */
const round = (p: LatLng) => ({ lat: Math.round(p.lat * 1e5) / 1e5, lng: Math.round(p.lng * 1e5) / 1e5 });

/** Ghim cố định giữa màn: đầu tròn màu chính, chân chỉ đúng tâm bản đồ. Trang trí (mô tả bằng chữ ở thẻ dưới). */
function CenterPin() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: '50%', top: '50%', alignItems: 'center', transform: [{ translateX: -15 }, { translateY: -46 }] }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.primary,
          borderWidth: 4,
          borderColor: colors.white,
          boxShadow: shadow.mapLabel,
        }}
      />
      <View style={{ width: 3, height: 14, backgroundColor: colors.primary, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
      <View style={{ width: 8, height: 4, borderRadius: 4, backgroundColor: colors.ink, opacity: 0.25 }} />
    </View>
  );
}

export default function PickOnMapScreen() {
  const insets = useSafeAreaInsets();
  const cardBottom = Math.max(insets.bottom, 16) + 8;
  /** Chiều cao thẻ điểm đến (đo thật): nút ⓘ ghi nguồn nằm ngay phía trên. */
  const [cardH, setCardH] = useState(0);
  const { svc } = useApi();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; q?: string; muc?: string }>();
  const { go, busyId, error } = useStartTrip();
  /** Mở từ màn Điểm đón: ghim chọn điểm đón thay vì điểm đến. */
  const forPickup = params.muc === 'diem-don';
  const { setManual } = usePickup();
  const [pickupBusy, setPickupBusy] = useState(false);
  const confirmPickup = async (id: string) => {
    setPickupBusy(true);
    const p = await svc.pickupFromPlace(id).catch(() => null);
    setPickupBusy(false);
    if (!p) return;
    setManual(p);
    // Về màn trước màn Điểm đón (Trang chủ / Chọn điểm đến).
    if (router.canDismiss()) router.dismiss(2);
    else router.replace('/');
  };
  const mapRef = useRef<PickMapHandle>(null);

  const fromParams = params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng) } : null;
  const origin = useQuery({ queryKey: ['originPoint'], queryFn: () => svc.originPoint() });
  const initial = fromParams && Number.isFinite(fromParams.lat) && Number.isFinite(fromParams.lng) ? fromParams : origin.data;

  const [center, setCenter] = useState<LatLng | null>(null);
  // Chờ bản đồ đứng yên 400 ms mới hỏi địa chỉ.
  const [settled, setSettled] = useState<LatLng | null>(null);
  useEffect(() => {
    if (!center) return;
    const t = setTimeout(() => setSettled(round(center)), 400);
    return () => clearTimeout(t);
  }, [center]);

  const point = useQuery({
    queryKey: ['describePoint', settled?.lat, settled?.lng],
    queryFn: () => svc.describePoint(settled!),
    enabled: !!settled,
    staleTime: Infinity,
  });
  const moving = !!center && (!settled || round(center).lat !== settled.lat || round(center).lng !== settled.lng);
  const ready = !!point.data && !moving && !point.isFetching;
  const busy = !!point.data && busyId === point.data.id;

  return (
    <View style={{ flex: 1, backgroundColor: colors.mapBg }}>
      {initial ? (
        <PickMap ref={mapRef} initial={initial} onCenterChange={setCenter} attributionBottom={cardBottom + cardH + 4} />
      ) : null}
      {initial ? <CenterPin /> : null}

      <View style={{ position: 'absolute', top: Math.max(insets.top + 8, 52), left: 16, right: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <BackButton variant="float" accessibilityLabel="Quay lại tìm điểm đến" />
        <View style={{ flex: 1 }}>
          {params.q ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14, boxShadow: shadow.mapLabel }}>
              <T size={13} lineHeight={18} color={colors.ink2}>
                Kéo bản đồ để ghim đúng nhà trên <T weight={700} size={13} lineHeight={18}>{params.q}</T>
              </T>
            </View>
          ) : null}
        </View>
        {initial ? <ZoomButtons onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} /> : null}
      </View>

      <View
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: cardBottom,
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          padding: 16,
          gap: 12,
          boxShadow: shadow.sheet,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ marginTop: 2 }}>
            <Icon name="pin" size={22} color={colors.primary} />
          </View>
          <View accessibilityLiveRegion="polite" style={{ flex: 1, gap: 2, minHeight: 42 }}>
            <T weight={700} size={11} lineHeight={13} color={colors.muted} style={{ letterSpacing: 0.6 }}>
              {forPickup ? 'ĐIỂM ĐÓN' : 'ĐIỂM ĐẾN'}
            </T>
            {ready ? (
              <>
                <T weight={800} size={16} lineHeight={21} numberOfLines={2}>
                  {point.data!.name}
                </T>
                {point.data!.address ? (
                  <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={2}>
                    {point.data!.address}
                  </T>
                ) : null}
              </>
            ) : (
              <T size={14} lineHeight={20} color={colors.ink2}>
                {moving ? 'Thả tay để chọn điểm này…' : 'Đang tìm địa chỉ…'}
              </T>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Về vị trí của tôi"
            onPress={() => origin.data && mapRef.current?.centerOn(origin.data)}
            style={({ pressed }) => ({ width: HIT, height: HIT, marginTop: -6, marginRight: -6, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
          >
            <Icon name="locate" size={22} color={colors.ink2} />
          </Pressable>
        </View>
        {error ? <InfoNote tone="neutral" icon="info" text={error} live /> : null}
        {forPickup ? (
          <Button
            label="Đón ở đây"
            disabled={!ready || pickupBusy}
            onPress={() => point.data && confirmPickup(point.data.id)}
            accessibilityHint="Chọn điểm đang ghim làm điểm đón"
          />
        ) : (
          <Button
            label="Đến đây"
            disabled={!ready || busy}
            onPress={() => point.data && go(point.data.id)}
            accessibilityHint="Chọn điểm đang ghim làm điểm đến, rồi gắn voucher và so giá"
          />
        )}
      </View>
    </View>
  );
}
