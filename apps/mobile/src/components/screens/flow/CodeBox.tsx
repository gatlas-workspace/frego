import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, T } from '@/components/ui';
import { Pop, pressScale } from '@/components/motion';
import { colors, radius } from '@/theme/tokens';

export interface CodeBoxProps {
  /** Mã ngắn để tự nhập trong app hãng, VD "FREGO20". */
  code: string;
  /** VD "Giảm 10.000đ cho chuyến xe máy". */
  codeLine: string | null;
  /** Nguồn mã (chip bên phải nhãn), VD "Quà của Cà phê Mây". */
  origin?: string | null;
  /** Đã chép vào bộ nhớ tạm → nút đổi thành "Đã chép". */
  copied: boolean;
  onCopy: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Khối "Mã của bạn" (Mở app v3): hàng nhãn + nguồn, mã lớn + nút "Chép mã", dòng điều kiện. */
export function CodeBox({ code, codeLine, origin, copied, onCopy, style }: CodeBoxProps) {
  return (
    <View style={[{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.card, backgroundColor: colors.deal, gap: 8 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <T weight={700} size={12} lineHeight={16} color={colors.dealInk}>
          Mã của bạn
        </T>
        {origin ? (
          <View style={{ flexShrink: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: colors.surface }}>
            <T weight={700} size={12} lineHeight={16} color={colors.dealInk} numberOfLines={1}>
              {origin}
            </T>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T
          weight={800}
          size={28}
          lineHeight={34}
          numberOfLines={1}
          adjustsFontSizeToFit
          accessibilityLabel={`Mã của bạn: ${code.split('').join(' ')}`}
          style={{ flexShrink: 1, letterSpacing: 2, fontVariant: ['tabular-nums'] }}
        >
          {code}
        </T>
        {copied ? (
          <Pop>
            <View
              role="status"
              accessibilityLiveRegion="polite"
              style={{ minWidth: 96, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Icon name="check" size={16} color={colors.good} strokeWidth={2.6} />
              <T weight={800} size={14} lineHeight={18} color={colors.good}>
                Đã chép
              </T>
            </View>
          </Pop>
        ) : (
          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel={`Chép mã ${code}`}
            style={({ pressed }) => [
              { minWidth: 96, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: pressed ? colors.ink2 : colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
              pressScale(pressed),
            ]}
          >
            <Icon name="copy" size={16} color={colors.white} strokeWidth={2} />
            <T weight={800} size={14} lineHeight={18} color={colors.white}>
              Chép mã
            </T>
          </Pressable>
        )}
      </View>
      {codeLine ? (
        <T weight={600} size={13} lineHeight={18} color={colors.dealInk}>
          {codeLine}
        </T>
      ) : null}
    </View>
  );
}
