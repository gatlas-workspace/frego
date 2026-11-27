import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface PageHeadingProps {
  /** Tiêu đề lớn 28/800 (h1 của các màn bắt đầu). */
  title: string;
  /** Đoạn dẫn 15px chữ phụ; có thể chứa <Strong>. */
  children?: ReactNode;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/** Tiêu đề + đoạn dẫn của các màn Chào mừng, Đăng nhập, Xác nhận, Thông tin, Quyền dữ liệu. */
export function PageHeading({ title, children, align = 'left', style }: PageHeadingProps) {
  return (
    <View style={[{ gap: 8 }, style]}>
      <T variant="display" accessibilityRole="header" align={align} style={{ letterSpacing: -0.6 }}>
        {title}
      </T>
      {children ? (
        <T size={15} lineHeight={22} color={colors.ink2} align={align}>
          {children}
        </T>
      ) : null}
    </View>
  );
}

/** Chữ đậm màu chữ chính trong đoạn dẫn (thay <b> của thiết kế). */
export function Strong({ children }: { children: ReactNode }) {
  return (
    <T weight={700} size={15} lineHeight={22} color={colors.ink}>
      {children}
    </T>
  );
}
