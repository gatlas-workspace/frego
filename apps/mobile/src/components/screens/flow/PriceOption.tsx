import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { formatDiscount, type PriceRow } from '@frego/core';
import { Icon, T, VehicleBox } from '@/components/ui';
import { Pop, pressScale } from '@/components/motion';
import { colors } from '@/theme/tokens';

/** Tên mã đã gắn và số tiền giảm của một hàng giá (tách từ `row.attached`). */
export function savingOf(row: PriceRow): { codeName: string; save: string } | null {
  const a = row.attached;
  if (!a || !row.priced) return null;
  return { codeName: a.offer.source === 'sponsor' ? a.offer.label : a.offer.code, save: formatDiscount(a.discount) };
}

export interface PriceOptionProps {
  row: PriceRow;
  selected: boolean;
  cheapest: boolean;
  onPress: (row: PriceRow) => void;
}

/**
 * Hàng giá So giá v3: ô xe + tên hãng (+ "Rẻ nhất"), dòng mã đã gắn; bên phải giá sau voucher và chip số tiền giảm.
 * Hàng chưa có bảng giá viền nét đứt, mời báo giá ×2 điểm.
 */
export const PriceOption = memo(function PriceOption({ row, selected, cheapest, onPress }: PriceOptionProps) {
  const sv = savingOf(row);
  const a11y = row.priced
    ? `${row.name}, ${row.finalText}${sv ? `, đã gắn ${sv.codeName} ${sv.save}` : ''}${cheapest ? ', rẻ nhất' : ''}`
    : `${row.name}, chưa có bảng giá khu này`;
  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        {
          minHeight: 72,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 14,
          borderWidth: 1.5,
          borderStyle: row.priced ? 'solid' : 'dashed',
          borderColor: selected ? colors.primary : row.priced ? 'transparent' : colors.line,
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        pressScale(pressed),
      ]}
    >
      <VehicleBox brand={row.providerId} kind={row.vehicleClass} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T weight={800} size={15} lineHeight={20} numberOfLines={1} style={{ flexShrink: 1 }}>
            {row.name}
          </T>
          {cheapest ? (
            <Pop delay={350}>
              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.goodSoft }}>
                <T weight={800} size={11} lineHeight={14} color={colors.good}>
                  Rẻ nhất
                </T>
              </View>
            </Pop>
          ) : null}
        </View>
        {sv ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="ticket" size={14} color={colors.dealInk} strokeWidth={2.2} />
            <T weight={700} size={12} lineHeight={16} color={colors.dealInk} numberOfLines={1} style={{ flexShrink: 1 }}>
              {sv.codeName}
            </T>
          </View>
        ) : (
          <T weight={600} size={12} lineHeight={16} color={colors.muted} numberOfLines={2}>
            {row.priced ? row.autoNote ?? 'Chưa có mã hợp' : row.autoNote ? `${row.autoNote} · chưa có giá khu này` : 'Chưa có bảng giá khu này'}
          </T>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        {row.priced ? (
          <T weight={800} size={16} lineHeight={21} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
            {row.finalText}
          </T>
        ) : (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.primarySoft }}>
            <T weight={800} size={12} lineHeight={16} color={colors.primaryDeep}>
              Báo giá ×2
            </T>
          </View>
        )}
        {sv ? (
          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, backgroundColor: colors.deal }}>
            <T weight={800} size={12} lineHeight={16} color={colors.dealInk} style={{ fontVariant: ['tabular-nums'] }}>
              {sv.save}
            </T>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});
