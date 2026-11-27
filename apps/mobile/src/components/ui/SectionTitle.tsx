import { View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from './Text';
import { colors } from '@/theme/tokens';

export interface SectionTitleProps {
  /** Chữ tiêu đề (design `text`). */
  text: string;
  /** Cỡ (design `size`): lg 17/800 chữ đậm đen · sm 14/700 chữ phụ (nhóm trong danh sách, ngày). Mặc định lg. */
  size?: 'lg' | 'sm';
  /** Nhãn viền nhỏ sau tiêu đề (design `tag`), VD "Tài trợ". */
  tag?: string;
  /** Ghi chú căn phải (design `note`), VD "Chép từ bài gốc của Grab". */
  note?: string;
  /** id để vùng nội dung tham chiếu (design `hid`), truyền vào `nativeID`. */
  nativeID?: string;
  style?: StyleProp<ViewStyle>;
}

/** UiSectionTitle: tiêu đề mục (role header). */
export function SectionTitle({ text, size = 'lg', tag, note, nativeID, style }: SectionTitleProps) {
  const lg = size !== 'sm';
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 6, columnGap: 8 }, style]}>
      <T
        nativeID={nativeID}
        accessibilityRole="header"
        weight={lg ? 800 : 700}
        size={lg ? 17 : 14}
        lineHeight={lg ? 22 : 19}
        color={lg ? colors.ink : colors.ink2}
        style={lg ? { letterSpacing: -0.2 } : undefined}
      >
        {text}
      </T>
      {tag ? (
        <View style={{ borderWidth: 1, borderColor: colors.dash, borderRadius: 6, paddingVertical: 1, paddingHorizontal: 7 }}>
          <T weight={700} size={12} lineHeight={16} color={colors.ink2} numberOfLines={1}>
            {tag}
          </T>
        </View>
      ) : null}
      {note ? (
        <T weight={600} size={12} lineHeight={16} color={colors.muted} style={{ marginLeft: 'auto' }}>
          {note}
        </T>
      ) : null}
    </View>
  );
}
