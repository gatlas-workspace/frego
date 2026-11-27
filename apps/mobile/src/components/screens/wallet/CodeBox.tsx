import { View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

export interface CodeBoxProps {
  code: string;
  /** Cỡ chữ: 26 (mã riêng, giãn chữ 3) · 22 (mã công khai, giãn chữ 1). */
  size?: number;
  letterSpacing?: number;
  style?: StyleProp<ViewStyle>;
}

/** Đọc từng ký tự cho trình đọc màn hình: "M A Y 7 K 2 Q". */
export function spellCode(code: string) {
  return code.split('').join(' ');
}

/** Ô mã nền xám viền đứt (MAY7K2Q, VPBTRANSPORT). Chữ chọn được để chép tay khi không chép được tự động. */
export function CodeBox({ code, size = 26, letterSpacing = 3, style }: CodeBoxProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Mã ${spellCode(code)}`}
      style={[
        {
          padding: 14,
          borderRadius: radius.block,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.dash,
        },
        style,
      ]}
    >
      <T weight={800} size={size} align="center" numberOfLines={1} adjustsFontSizeToFit selectable style={{ letterSpacing }}>
        {code}
      </T>
    </View>
  );
}
