import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEST_RING_M, type VehicleClass } from '@frego/core';
import { SponsorCounter, ZoomButtons } from '@/components/map/MapControls';
import { MapSurface } from '@/components/map/MapSurface';
import { SponsorCard } from '@/components/map/SponsorCard';
import type { MapSurfaceHandle } from '@/components/map/types';
import { BackButton, MapRoute } from '@/components/ui';
import { useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

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

  const pins = sponsors.data ?? [];
  const selected = pins.find((p) => p.businessId === selectedId) ?? null;
  const showCard = expanded && !!selected;

  const select = (id: string | null) => {
    setSelectedId(id);
    if (id && !expanded) onExpandedChange?.(true);
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
      {plan ? (
        <View style={{ position: 'absolute', top: Math.max(insets.top + 8, 52), right: 16 }}>
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
