import { memo } from 'react';
import { Pressable, View } from 'react-native';
import type { WalletGiftView } from '@frego/core';
import { DashLine, T, VehicleTile } from '@/components/ui';
import { pressScale } from '@/components/motion';
import { colors, radius } from '@/theme/tokens';

/**
 * Vé voucher tặng riêng (Ví v3): cuống cam có ô xe + logo hãng và số tiền, răng cưa, thân vé có tên quán,
 * lý do tặng, hạn dùng và nút "Xem mã". Loại xe không ghi chữ vì đã có hình xe (đọc trong nhãn trợ năng).
 */
export const GiftTicket = memo(function GiftTicket({ gift: g, onPress }: { gift: WalletGiftView; onPress: (g: WalletGiftView) => void }) {
  const notch = (pos: 'top' | 'bottom') => (
    <View style={{ position: 'absolute', left: -8, [pos]: -10, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bg }} />
  );
  return (
    <Pressable
      onPress={() => onPress(g)}
      accessibilityRole="button"
      accessibilityLabel={`${g.title}, voucher ${g.serviceText} ${g.amountText}. ${g.line}. ${g.endsText}. ${g.action.replace(/\s*›$/, '')}`}
      style={({ pressed }) => [
        { borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: pressed ? colors.surfaceAlt : colors.surface },
        pressScale(pressed),
      ]}
    >
      <View style={{ flexDirection: 'row', borderRadius: radius.card, overflow: 'hidden' }}>
        <View style={{ width: 104, paddingVertical: 10, paddingHorizontal: 4, backgroundColor: colors.deal, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <View style={{ marginLeft: -6 }}>
            <VehicleTile brand={g.providerId} kind={g.vehicleClass} />
          </View>
          <T weight={800} size={16} lineHeight={20} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.2 }}>
            {g.amountText}
          </T>
        </View>
        <View style={{ width: 2, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <DashLine style={{ flex: 1 }} />
          {notch('top')}
          {notch('bottom')}
        </View>
        <View style={{ flex: 1, minWidth: 0, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, gap: 6 }}>
          <T weight={800} size={15} lineHeight={20} numberOfLines={1}>
            {g.title}
          </T>
          <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={2}>
            {g.line}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <T weight={700} size={12} lineHeight={16} color={colors.dealInk} numberOfLines={1} style={{ flexShrink: 1 }}>
              {g.endsText}
            </T>
            <View style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.primary, justifyContent: 'center' }}>
              <T weight={800} size={13} lineHeight={17} color={colors.white}>
                {g.action.replace(/\s*›$/, '')}
              </T>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
});
