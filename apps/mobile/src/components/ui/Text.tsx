import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, fontFamily, type, type FontWeight, type TypeVariant } from '@/theme/tokens';

export interface TProps extends TextProps {
  /** Kiểu chữ trong thang (mặc định: body) */
  variant?: TypeVariant;
  /** Ghi đè độ đậm: 400 | 500 | 600 | 700 | 800 */
  weight?: FontWeight;
  size?: number;
  color?: string;
  align?: TextStyle['textAlign'];
  lineHeight?: number;
}

/**
 * Chữ chuẩn của app: luôn dùng Be Vietnam Pro đúng độ đậm.
 * Dùng <T variant="screenTitle">…</T> thay cho <Text> của React Native.
 */
export function T({ variant = 'body', weight, size, color, align, lineHeight, style, ...rest }: TProps) {
  const v = type[variant];
  const w = (weight ?? v.weight) as FontWeight;
  const fs = size ?? v.fontSize;
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: fontFamily[w],
          fontSize: fs,
          lineHeight: lineHeight ?? (size ? Math.round(size * 1.35) : v.lineHeight),
          letterSpacing: v.letterSpacing,
          color: color ?? colors.ink,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
