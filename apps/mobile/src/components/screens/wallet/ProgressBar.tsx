import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';

export interface ProgressBarProps {
  /** 0–1 */
  value: number;
  /** Màu rãnh (mặc định rãnh xám; trên nền tím dùng colors.onPrimaryTrack). */
  track?: string;
  /** Màu phần đã đạt (mặc định màu chính; trên nền tím dùng trắng). */
  fill?: string;
  style?: StyleProp<ViewStyle>;
}

/** Thanh tiến độ cao 8 bo 4. Trang trí: số liệu luôn có ở chữ bên cạnh. */
export function ProgressBar({ value, track = colors.track, fill = colors.primary, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: 8, borderRadius: 4, backgroundColor: track, overflow: 'hidden' }, style]}
    >
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: fill }} />
    </View>
  );
}
