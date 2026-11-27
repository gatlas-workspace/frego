import { memo } from 'react';
import { Pressable, View } from 'react-native';
import type { DealView } from '@frego/core';
import { BrandLogo, T } from '@/components/ui';
import { pressScale } from '@/components/motion';
import { colors, radius } from '@/theme/tokens';

export const DEAL_CARD_W = 228;

/** Thẻ ưu đãi quán tài trợ trong hàng cuộn ngang ở Trang chủ v3. */
export const DealCard = memo(function DealCard({ deal, busy, onPress }: { deal: DealView; busy?: boolean; onPress: (d: DealView) => void }) {
  return (
    <Pressable
      onPress={() => onPress(deal)}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={`${deal.brand}, ${deal.area}. ${deal.serviceText} ${deal.amountText}. ${deal.endsInText}. Đặt xe`}
      style={({ pressed }) => [
        {
          width: DEAL_CARD_W,
          padding: 14,
          gap: 12,
          borderRadius: radius.card,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          opacity: busy ? 0.6 : 1,
        },
        pressScale(pressed),
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BrandLogo kind={deal.category} size={36} radius={18} iconSize={18} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T weight={800} size={14} lineHeight={19} numberOfLines={1}>
            {deal.brand}
          </T>
          <T size={12} lineHeight={16} color={colors.muted} numberOfLines={1}>
            {deal.area}
          </T>
        </View>
      </View>
      <View style={{ gap: 2 }}>
        <T weight={800} size={22} lineHeight={28} color={colors.dealInk} style={{ letterSpacing: -0.3, fontVariant: ['tabular-nums'] }}>
          {deal.amountText}
        </T>
        <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={1}>
          {deal.serviceText}
        </T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
        <T weight={600} size={12} lineHeight={16} color={colors.muted}>
          {deal.endsInText}
        </T>
        <T weight={800} size={14} lineHeight={18} color={colors.primary}>
          Đặt xe
        </T>
      </View>
    </Pressable>
  );
});
