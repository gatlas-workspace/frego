import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName, PriceVerdict } from '@frego/core';
import { Icon, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

const TILES: { key: PriceVerdict; label: string; icon: IconName; bg: string; fg: string }[] = [
  { key: 'cheaper', label: 'Rẻ hơn', icon: 'cheaper', bg: colors.goodSoft, fg: colors.good },
  { key: 'within', label: 'Đúng khoảng', icon: 'range', bg: colors.primarySoft, fg: colors.primary },
  { key: 'pricier', label: 'Đắt hơn', icon: 'pricier', bg: colors.badSoft, fg: colors.bad },
];

export interface VerdictTilesProps {
  onPick: (verdict: PriceVerdict) => void;
  /** Đang gửi: khóa cả ba ô. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Ba ô báo giá một chạm: Rẻ hơn · Đúng khoảng · Đắt hơn (màn Báo giá thật). */
export function VerdictTiles({ onPick, disabled, style }: VerdictTilesProps) {
  return (
    <View
      role="group"
      accessibilityLabel="Giá thật so với ước tính"
      style={[{ flexDirection: 'row', gap: 8 }, style]}
    >
      {TILES.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => onPick(t.key)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t.label}
          accessibilityState={{ disabled: !!disabled }}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 0,
            minHeight: 96,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderWidth: 1.5,
            borderColor: pressed ? t.fg : colors.line,
            borderRadius: 18,
            backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: disabled ? 0.5 : 1,
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: t.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={t.icon} size={24} color={t.fg} strokeWidth={2.3} />
          </View>
          <T weight={700} size={14} lineHeight={18} align="center" numberOfLines={2}>
            {t.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
