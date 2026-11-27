import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from './BackButton';
import { T } from './Text';
import { colors, layout } from '@/theme/tokens';

export interface ScreenHeaderProps {
  /** Tiêu đề màn 20/800 (role header). Bỏ trống khi chỉ có nút quay lại (Đăng nhập, Xác nhận). */
  title?: string;
  /** Nhãn nút quay lại, VD "Quay lại Tài khoản". Mặc định "Quay lại". */
  backLabel?: string;
  /** Mặc định `router.back()`. */
  onBack?: () => void;
  /** Ẩn nút quay lại. */
  hideBack?: boolean;
  /** Nội dung thay cho tiêu đề (VD thẻ ô tìm kiếm ở màn Tìm kiếm). */
  children?: ReactNode;
  /** Phần bên phải (nút phụ). */
  right?: ReactNode;
  /** Căn dọc: center (mặc định) | start (màn Tìm kiếm: nút quay lại lùi xuống 14px cạnh thẻ cao). */
  align?: 'center' | 'start';
  style?: StyleProp<ViewStyle>;
}

/**
 * Đầu màn: nút quay lại + tiêu đề (TimKiem, ThemDiaDiem, LichSu, LienKet, CaiDatThongBao, ChiTiet…).
 * Đệm: trên = vùng an toàn (tối thiểu 48 như khung thiết kế), phải 16, dưới 10, trái 8.
 */
export function ScreenHeader({ title, backLabel, onBack, hideBack, children, right, align = 'center', style }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const start = align === 'start';
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: start ? 'flex-start' : 'center',
          gap: 10,
          paddingTop: Math.max(insets.top + 4, layout.headerTop),
          paddingRight: 16,
          paddingBottom: start ? 12 : 12,
          paddingLeft: 16,
          // UI v3: màn có tiêu đề dùng thanh đầu trắng, kẻ mảnh phía dưới; màn chỉ có nút quay lại (Đăng nhập…) giữ trong suốt.
          ...(title ? { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line } : null),
        },
        style,
      ]}
    >
      {hideBack ? null : <BackButton variant="soft" onPress={onBack} accessibilityLabel={backLabel} style={start ? { marginTop: 14 } : undefined} />}
      {children ?? (
        <View style={{ flex: 1, minWidth: 0 }}>
          {title ? (
            <T variant="screenTitle" size={18} lineHeight={24} accessibilityRole="header" numberOfLines={1}>
              {title}
            </T>
          ) : null}
        </View>
      )}
      {right}
    </View>
  );
}
