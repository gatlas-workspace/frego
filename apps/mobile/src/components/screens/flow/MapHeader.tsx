import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEST_RING_M, type VehicleClass } from '@frego/core';
import { SponsorCounter, ZoomButtons } from '@/components/map/MapControls';
import { MapSurface } from '@/components/map/MapSurface';
import { SponsorCard } from '@/components/map/SponsorCard';
import type { MapSurfaceHandle } from '@/components/map/types';
import { BackButton, Icon, MapRoute, T } from '@/components/ui';
import { pressScale } from '@/components/motion';
import { usePickup } from '@/lib/pickup';
import { useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors, HIT, shadow } from '@/theme/tokens';

/** Chiều cao bản đồ phía trên tấm trượt (KetQua, ChonHang): 250 như khung 844; máy thấp thì thu lại để còn chỗ cho nội dung. */
export const MAP_HEIGHT = 250;
const MAP_MIN = 160;
/** Tấm trượt đè lên đáy bản đồ 28px. */
const SHEET_OVERLAP = 28;
/** Chiều cao ước chừng của thẻ quán, chừa ra khi canh khung nhìn. */
const CARD_SPACE = 236;

export interface MapHeaderProps {
  from?: string;
  to?: string;
  /** Nhãn nút quay lại, VD "Quay lại chọn điểm đến". */
  backLabel: string;
  onBack: () => void;
  /** Tấm trượt đang thu gọn: bản đồ chiếm hết phần còn lại của màn. */
  expanded?: boolean;
  /** Chạm ghim quán khi bản đồ đang nhỏ → xin giãn bản đồ để hiện thẻ quán. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Đã đổi điểm đến sang một quán (VD màn So giá quay về bước Gắn voucher). */
  onTripChanged?: () => void;
  /** Loại xe để vẽ đường (So giá: theo tab). Mặc định xe máy. */
  vehicleClass?: VehicleClass;
  /**
   * Mã người dùng đang chọn (refId): bản đồ chỉ hiện quán có mã nằm trong danh sách này.
   * Gắn voucher: các mã đã gắn; So giá: mã của hãng đang chọn. Bỏ trống (undefined) = hiện mọi quán dùng được.
   */
  focusRefIds?: readonly string[];
}

/** Bản đồ thật của chuyến + ghim quán tài trợ quanh điểm đến + nút quay lại trắng nổi ở góc trên trái. */
export function MapHeader({
  from,
  to,
  backLabel,
  onBack,
  expanded = false,
  onExpandedChange,
  onTripChanged,
  vehicleClass = 'bike',
  focusRefIds,
}: MapHeaderProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const { svc } = useApi();
  const { plan, start } = useTripFlow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mapRef = useRef<MapSurfaceHandle>(null);
  /** Chiều cao ô đếm / thẻ quán đang nổi ở đáy (đo thật) — để đặt nút ⓘ ghi nguồn ngay phía trên. */
  const [overlayH, setOverlayH] = useState(0);
  const h =Math.round(Math.min(MAP_HEIGHT, Math.max(MAP_MIN, screenH * 0.3)));

  // Chỉ quán có voucher dùng được cho chuyến này (khớp danh sách ở màn Gắn voucher).
  const sponsors = useQuery({
    queryKey: ['usable-sponsors', plan?.dest.id, plan?.at],
    queryFn: () => svc.usableSponsors(plan!),
    enabled: !!plan,
  });

  // Đường theo loại xe (xe máy có sẵn trong chuyến; ô tô hỏi thêm một lần rồi nhớ).
  const routeLine = useQuery({
    queryKey: ['route-line', plan?.origin.lat, plan?.origin.lng, plan?.dest.id, vehicleClass],
    queryFn: () => svc.routeLine(plan!, vehicleClass),
    enabled: !!plan,
    staleTime: Infinity,
  });

  // Đổi điểm đến thì bỏ chọn quán cũ.
  useEffect(() => setSelectedId(null), [plan?.dest.id]);

  // Đổi điểm đón (bấm dòng điểm đón → màn Điểm đón → quay lại): tính lại chuyến với cùng điểm đến.
  const { pickup } = usePickup();
  const replanning = useRef(false);
  useEffect(() => {
    if (!plan || !pickup || replanning.current) return;
    const moved = Math.abs(pickup.lat - plan.origin.lat) > 1e-6 || Math.abs(pickup.lng - plan.origin.lng) > 1e-6;
    if (!moved) return;
    replanning.current = true;
    start(plan.dest.id)
      .catch(() => {})
      .finally(() => {
        replanning.current = false;
      });
  }, [pickup, plan, start]);

  const allPins = sponsors.data ?? [];
  const focusKey = focusRefIds ? focusRefIds.join('|') : null;
  const pins = useMemo(
    () => (focusRefIds ? allPins.filter((p) => p.refIds.some((r) => focusRefIds.includes(r))) : allPins),
    // focusKey thay cho mảng (mảng mới mỗi lần vẽ).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allPins, focusKey],
  );
  const selected = pins.find((p) => p.businessId === selectedId) ?? null;
  const showCard = expanded && !!selected;

  // Chạm ghim quán hoặc chạm vào bản đồ khi đang nhỏ → giãn bản đồ (tấm thông tin hạ xuống), khỏi phải bấm thanh kéo.
  const select = (id: string | null) => {
    setSelectedId(id);
    if (!expanded) onExpandedChange?.(true);
  };

  const goTo = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      await start(`biz:${selected.businessId}`, { preferredCampaignId: selected.campaignId });
      setSelectedId(null);
      onTripChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={expanded ? { flex: 1 } : { height: h }}>
      <View style={{ flex: 1, overflow: 'hidden', backgroundColor: colors.mapBg }}>
        {plan ? (
          <MapSurface
            ref={mapRef}
            origin={{
              lat: plan.origin.lat,
              lng: plan.origin.lng,
              // Đi từ vị trí hiện tại: chấm xanh "Vị trí của bạn" như thongtincty.
              label: plan.origin.label === 'Vị trí hiện tại' ? 'Vị trí của bạn' : (from ?? plan.origin.label),
            }}
            dest={{ lat: plan.dest.lat, lng: plan.dest.lng, label: to ?? plan.dest.name }}
            route={routeLine.data ?? plan.route}
            sponsors={pins}
            nearbyRadiusM={DEST_RING_M}
            selectedId={selectedId}
            onSelect={select}
            bottomInset={SHEET_OVERLAP + (showCard ? CARD_SPACE : 0)}
            fitKey={expanded ? 'lon' : 'nho'}
            attributionBottom={SHEET_OVERLAP + (expanded && overlayH ? 12 + overlayH + 4 : 2)}
          />
        ) : (
          <MapRoute height={h} from={from} to={to} />
        )}
      </View>
      <BackButton
        variant="float"
        onPress={onBack}
        accessibilityLabel={backLabel}
        style={{ position: 'absolute', top: Math.max(insets.top + 8, 52), left: 16 }}
      />
      {/* Thẻ tuyến (UI v3): bấm dòng điểm đón để đổi điểm đón, dòng điểm đến để chọn nơi khác */}
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top + 8, 52),
          left: 16 + HIT + 10,
          right: 16,
          borderRadius: 14,
          backgroundColor: colors.surface,
          boxShadow: shadow.floatButton,
          overflow: 'hidden',
        }}
      >
        <RouteLine kind="from" label={from ?? plan?.origin.label ?? 'Điểm đón'} onPress={() => router.push('/diem-don')} />
        <View style={{ height: 1, marginLeft: 34, backgroundColor: colors.line }} />
        <RouteLine kind="to" label={to ?? plan?.dest.name ?? 'Điểm đến'} onPress={() => router.push('/tim-kiem')} />
      </View>
      {/* Nút phóng to/thu nhỏ chỉ khi bản đồ mở rộng (bản đồ nhỏ đã có thẻ tuyến chiếm chỗ). */}
      {plan && expanded ? (
        <View style={{ position: 'absolute', top: Math.max(insets.top + 8, 52) + 2 * HIT + 14, right: 16 }}>
          <ZoomButtons onZoomIn={() => mapRef.current?.zoomIn()} onZoomOut={() => mapRef.current?.zoomOut()} />
        </View>
      ) : null}
      {plan && expanded && !showCard ? (
        <View
          onLayout={(e) => setOverlayH(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', right: 16, bottom: SHEET_OVERLAP + 12 }}
        >
          <SponsorCounter count={pins.length} onRecenter={() => mapRef.current?.recenter()} />
        </View>
      ) : null}
      {showCard && selected && plan ? (
        <View
          onLayout={(e) => setOverlayH(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 16, right: 16, bottom: SHEET_OVERLAP + 12 }}
        >
          <SponsorCard
            pin={selected}
            isDest={plan.dest.id === `biz:${selected.businessId}`}
            busy={busy}
            onGo={goTo}
            onClose={() => setSelectedId(null)}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Một dòng trong thẻ tuyến: chấm (điểm đón) hoặc ô vuông (điểm đến), tên, bút sửa. */
function RouteLine({ kind, label, onPress }: { kind: 'from' | 'to'; label: string; onPress: () => void }) {
  const from = kind === 'from';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={from ? `Điểm đón: ${label}. Đổi điểm đón` : `Điểm đến: ${label}. Chọn điểm đến khác`}
      style={({ pressed }) => [
        { minHeight: HIT, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
        pressScale(pressed),
      ]}
    >
      <View
        style={
          from
            ? { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: colors.primary, backgroundColor: colors.surface }
            : { width: 10, height: 10, borderRadius: 2, marginHorizontal: 1, backgroundColor: colors.primary }
        }
      />
      <T weight={from ? 600 : 800} size={13} lineHeight={18} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
        {label}
      </T>
      <Icon name="chev" size={14} color={colors.muted} strokeWidth={2.2} />
    </Pressable>
  );
}
