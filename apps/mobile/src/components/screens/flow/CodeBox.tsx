import { useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, Chip, DashLine, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface CodeBoxProps {
  /** Mã ngắn để tự nhập trong app hãng, VD "FREGO20". */
  code: string;
  /** VD "Giảm 10.000đ cho chuyến xe máy". */
  codeLine: string | null;
  /** Đã chép vào bộ nhớ tạm → hiện nhãn "Đã chép". */
  copied: boolean;
  onCopy: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Máy hẹp hơn mức này: xếp nút "Chép mã" xuống dưới mã (vạch đứt nằm ngang) để mã không bị cắt. */
const NARROW = 360;

/** Khối "Mã của bạn" nền cam, vạch đứt dọc, nút "Chép mã" (màn Mở app hãng). */
export function CodeBox({ code, codeLine, copied, onCopy, style }: CodeBoxProps) {
  const narrow = useWindowDimensions().width < NARROW;
  return (
    <View
      style={[
        {
          flexDirection: narrow ? 'column' : 'row',
          alignItems: narrow ? 'stretch' : 'center',
          gap: 12,
          padding: 16,
          borderRadius: 20,
          backgroundColor: colors.deal,
        },
        style,
      ]}
    >
      <View
        accessible
        accessibilityLabel={`Mã của bạn: ${code}. ${codeLine ?? ''}`}
        style={narrow ? { gap: 2 } : { flex: 1, minWidth: 0, gap: 2 }}
      >
        <T weight={700} size={12} lineHeight={16} color={colors.dealInk}>
          Mã của bạn
        </T>
        <T weight={800} size={26} lineHeight={31} style={{ letterSpacing: 1 }} numberOfLines={1} adjustsFontSizeToFit>
          {code}
        </T>
        {codeLine ? (
          <T size={13} lineHeight={18} color={colors.dealInk}>
            {codeLine}
          </T>
        ) : null}
      </View>
      <DashLine direction={narrow ? 'horizontal' : 'vertical'} />
      <View style={narrow ? { alignSelf: 'flex-start' } : { flexShrink: 0 }}>
        {copied ? (
          <View role="status" accessibilityLiveRegion="polite">
            <Chip text="Đã chép" tone="tint" icon="check" />
          </View>
        ) : (
          <Button
            label="Chép mã"
            variant="outline"
            size="sm"
            icon="copy"
            block={false}
            onPress={onCopy}
            accessibilityLabel={`Chép mã ${code}`}
          />
        )}
      </View>
    </View>
  );
}
