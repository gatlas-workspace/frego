import { View } from 'react-native';
import type { SponsorPinView } from '@frego/core';
import { BackButton, BrandLogo, Button, Icon, T } from '@/components/ui';
import { colors, radius, shadow } from '@/theme/tokens';

export interface SponsorCardProps {
  pin: SponsorPinView;
  /** Quán này đang là điểm đến: ẩn nút "Đi tới quán này". */
  isDest: boolean;
  busy?: boolean;
  onGo: () => void;
  onClose: () => void;
}

/** Thẻ nổi trên bản đồ khi chạm ghim quán tài trợ. */
export function SponsorCard({ pin, isDest, busy, onGo, onClose }: SponsorCardProps) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Quán tài trợ ${pin.name}`}
      style={{ backgroundColor: colors.surface, borderRadius: radius.card, padding: 16, gap: 12, boxShadow: shadow.sheet }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <BrandLogo kind={pin.category} size={44} />
        <View style={{ flex: 1, gap: 2 }}>
          <T weight={800} size={16} lineHeight={21} numberOfLines={1}>
            {pin.name}
          </T>
          <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={2}>
            {pin.address}
          </T>
          <T size={13} lineHeight={18} color={colors.muted}>
            {pin.distanceText} · {pin.hoursText}
          </T>
        </View>
        <BackButton variant="soft" icon="close" accessibilityLabel="Đóng thông tin quán" onPress={onClose} style={{ marginTop: -4, marginRight: -4 }} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.deal }}>
          <T weight={800} size={14} lineHeight={18} color={colors.dealInk}>
            {pin.amountText}
          </T>
        </View>
        <T weight={600} size={14} lineHeight={18} color={colors.ink2} style={{ flex: 1 }}>
          {pin.serviceText}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Icon name="pinok" size={18} color={colors.primary} />
        <T size={13} lineHeight={18} color={colors.primary} style={{ flex: 1 }}>
          {pin.statusText}
        </T>
      </View>
      {isDest ? null : (
        <Button
          label="Đi tới quán này"
          variant="secondary"
          size="sm"
          icon="map"
          disabled={busy}
          onPress={onGo}
          accessibilityHint="Đổi điểm đến của chuyến thành quán này"
        />
      )}
    </View>
  );
}
