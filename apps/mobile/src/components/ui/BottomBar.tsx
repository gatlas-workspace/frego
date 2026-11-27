import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '@/theme/tokens';

export interface BottomBarProps {
  /** Nút chính (Button) và nút phụ/ghi chú. */
  children?: ReactNode;
  /** Khoảng cách giữa các con: 8 (mặc định) hoặc 4 khi nút phụ là nút chữ (Chào mừng, Thông tin). */
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/** Thanh đáy trắng bo 24 phía trên, bóng hướng lên, chứa nút hành động chính. Đệm dưới theo vùng an toàn (tối thiểu 30 như thiết kế). */
export function BottomBar({ children, gap = 8, style }: BottomBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          paddingTop: 12,
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 30),
          gap,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.card,
          borderTopRightRadius: radius.card,
          boxShadow: shadow.bottomBar,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
