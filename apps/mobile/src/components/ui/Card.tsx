import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';

export interface CardProps {
  children?: ReactNode;
  /** Đệm trong (thiết kế: 16 cho thẻ nội dung, 14 cho thẻ tìm kiếm, 20 cho thẻ điểm). Mặc định 16. */
  padding?: number;
  /** Khoảng cách giữa các con (thiết kế hay dùng 8–12). */
  gap?: number;
  /** Nền: surface (trắng, có bóng) · primary (tím, không bóng — thẻ Điểm thưởng) · bg (xám nền, không bóng). */
  tone?: 'surface' | 'primary' | 'bg';
  /** Cắt nội dung theo bo góc (thẻ có vạch răng cưa / dải màu ở đáy). */
  clip?: boolean;
  /** Có onPress thì cả thẻ là một nút. */
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Thẻ trắng bo 24 có bóng thẻ — khối nội dung cơ bản của mọi màn. */
export function Card({
  children,
  padding = 16,
  gap,
  tone = 'surface',
  clip,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}: CardProps) {
  const bg = tone === 'primary' ? colors.primary : tone === 'bg' ? colors.bg : colors.surface;
  const outer: ViewStyle = {
    borderRadius: radius.card,
    backgroundColor: bg,
    boxShadow: tone === 'surface' ? shadow.card : undefined,
  };
  // Bóng nằm ở khung ngoài, phần cắt theo bo góc ở khung trong để không mất bóng.
  const inner = clip ? <View style={{ borderRadius: radius.card, overflow: 'hidden', padding, gap }}>{children}</View> : children;
  const own: ViewStyle = clip ? {} : { padding, gap };
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          outer,
          own,
          pressed && { backgroundColor: tone === 'primary' ? colors.primaryDeep : tone === 'bg' ? colors.track : colors.surfaceAlt },
          style,
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={[outer, own, style]}>
      {inner}
    </View>
  );
}
