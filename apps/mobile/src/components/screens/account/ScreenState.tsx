import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, InfoNote, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

/** Đang tải: vòng xoay màu chính + chữ nhỏ, căn giữa vùng còn lại. */
export function LoadingView({ label = 'Đang tải…', style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }, style]}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      <T size={13} lineHeight={19} color={colors.muted}>
        {label}
      </T>
    </View>
  );
}

/** Lỗi tải dữ liệu: ghi chú xám + nút Thử lại. */
export function ErrorView({
  message = 'Chưa tải được dữ liệu. Kiểm tra kết nối mạng rồi thử lại.',
  onRetry,
  style,
}: {
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap: 12 }, style]}>
      <InfoNote tone="neutral" icon="info" text={message} live />
      {onRetry ? <Button label="Thử lại" variant="secondary" size="md" onPress={onRetry} /> : null}
    </View>
  );
}

/** Dòng báo lỗi đỏ dưới ô nhập (đọc ngay khi xuất hiện). */
export function InlineError({ text, nativeID }: { text: string; nativeID?: string }) {
  return (
    <T nativeID={nativeID} accessibilityRole="alert" accessibilityLiveRegion="assertive" weight={600} size={13} lineHeight={19} color={colors.bad}>
      {text}
    </T>
  );
}
