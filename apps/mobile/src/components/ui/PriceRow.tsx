import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { PriceRow } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { VehicleBox } from './VehicleTile';
import { colors, radius, shadow } from '@/theme/tokens';

export interface PriceRowCardProps {
  /**
   * Một dòng so giá từ core (`ComparisonView.rows[i]`, design `row`):
   * name, serviceName (design `row.service`), finalText (`row.final`), baseText (`row.base`),
   * voucherText, priced, autoNote, providerId, vehicleClass (→ minh họa xe).
   */
  row: Pick<
    PriceRow,
    'name' | 'serviceName' | 'finalText' | 'baseText' | 'voucherText' | 'priced' | 'autoNote' | 'providerId' | 'vehicleClass'
  >;
  /** Bấm để mở app hãng. */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** UiPriceRow: thẻ giá sau voucher của một hãng (bước So giá). */
export function PriceRowCard({ row, onPress, style }: PriceRowCardProps) {
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <VehicleBox brand={row.providerId} kind={row.vehicleClass} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={800} size={16} lineHeight={21}>
            {row.name}
          </T>
          <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={1}>
            {row.serviceName}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {row.priced ? (
            <T weight={800} size={16} lineHeight={21} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
              {row.finalText}
            </T>
          ) : null}
          {row.baseText ? (
            <T
              size={12}
              lineHeight={16}
              color={colors.muted}
              numberOfLines={1}
              accessibilityLabel={`giá gốc ${row.baseText}`}
              style={{ textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] }}
            >
              {row.baseText}
            </T>
          ) : null}
        </View>
      </View>
      {row.voucherText ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 9,
            paddingHorizontal: 12,
            borderRadius: radius.small,
            backgroundColor: colors.deal,
          }}
        >
          <Icon name="ticket" size={16} color={colors.dealInk} strokeWidth={1.9} />
          <T weight={700} size={13} lineHeight={18} color={colors.dealInk} style={{ flex: 1 }}>
            {row.voucherText}
          </T>
        </View>
      ) : null}
      {row.priced && !row.voucherText ? (
        <T size={13} lineHeight={19} color={colors.ink2}>
          Chưa có voucher hợp cho loại xe này. Có mã riêng thì quay lại bước gắn voucher để nhập.
        </T>
      ) : null}
      {!row.priced ? (
        <T size={13} lineHeight={19} color={colors.ink2}>
          Chưa có bảng giá ở khu vực này. Xem giá trong app, rồi báo lại giúp mọi người.
        </T>
      ) : null}
      {row.autoNote ? (
        <View
          style={{
            alignSelf: 'flex-start',
            borderRadius: radius.pill,
            paddingVertical: 4,
            paddingHorizontal: 10,
            backgroundColor: colors.primarySoft,
          }}
        >
          <T weight={700} size={12} lineHeight={17} color={colors.primaryDeep}>
            {row.autoNote}
          </T>
        </View>
      ) : null}
    </>
  );
  const box: ViewStyle = { gap: 10, padding: 14, borderRadius: 22, backgroundColor: colors.surface, boxShadow: shadow.card };
  if (!onPress) return <View style={[box, style]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={`Mở app ${row.name}`}
      style={({ pressed }) => [box, pressed && { backgroundColor: colors.surfaceAlt }, style]}
    >
      {body}
    </Pressable>
  );
}
