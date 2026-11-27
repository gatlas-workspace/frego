import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';

export type DividerInset = 'full' | 'sides' | 'lead' | 'none';

export interface DividerProps {
  /**
   * Thụt lề vạch ngăn:
   * full (sát hai mép, như `li + li { border-top }`) · sides (lề 16 hai bên) ·
   * lead (lề trái 68 — sau ô icon 40 của ListRow, phải 16) · none (không vẽ).
   */
  inset?: DividerInset;
  style?: StyleProp<ViewStyle>;
}

/** Vạch ngăn 1px #E8EAF2. */
export function Divider({ inset = 'full', style }: DividerProps) {
  if (inset === 'none') return null;
  const m = inset === 'sides' ? { marginHorizontal: 16 } : inset === 'lead' ? { marginLeft: 68, marginRight: 16 } : null;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height: 1, backgroundColor: colors.line }, m, style]}
    />
  );
}

export interface ListCardProps {
  /** Các hàng (thường là ListRow). Tự chèn vạch ngăn giữa các con hợp lệ. */
  children?: ReactNode;
  /** Kiểu vạch ngăn giữa các hàng (xem Divider). Mặc định full. Danh sách có icon đầu (Tài khoản, Liên kết) dùng `lead`. */
  divider?: DividerInset;
  /** Nền: surface (trắng + bóng thẻ) · bg (xám #F4F5FA, không bóng — dùng trên màn nền trắng như Quyền dữ liệu) · alt (#F1F2F8, không bóng). */
  tone?: 'surface' | 'bg' | 'alt';
  /** Nhãn nhóm cho trình đọc màn hình (thiết kế: `aria-label` của ul/nav). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Danh sách trắng bo 24, vạch ngăn 1px giữa các hàng (thay cho `<ul>` của thiết kế). */
export function ListCard({ children, divider = 'full', tone = 'surface', accessibilityLabel, style }: ListCardProps) {
  const items = Children.toArray(children).filter(isValidElement);
  const bg = tone === 'bg' ? colors.bg : tone === 'alt' ? colors.surfaceAlt : colors.surface;
  return (
    <View
      accessibilityRole={accessibilityLabel ? 'list' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ borderRadius: radius.card, backgroundColor: bg, boxShadow: tone === 'surface' ? shadow.card : undefined }, style]}
    >
      <View style={{ borderRadius: radius.card, overflow: 'hidden' }}>
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 ? <Divider inset={divider} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}
