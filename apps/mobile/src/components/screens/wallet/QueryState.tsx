import type { ReactNode } from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, T } from '@/components/ui';
import { colors, radius, shadow } from '@/theme/tokens';

/** Đang tải: vòng quay giữa vùng nội dung, có nhãn cho trình đọc màn hình. */
export function LoadingState({ label = 'Đang tải', style }: { label?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/** Thẻ trắng chữ giữa (trạng thái trống, như "Chưa có mã nào đã dùng…"). */
export function EmptyCard({ text, children, style }: { text: string; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          paddingVertical: 24,
          paddingHorizontal: 20,
          borderRadius: radius.card,
          backgroundColor: colors.surface,
          boxShadow: shadow.card,
          alignItems: 'center',
          gap: 12,
        },
        style,
      ]}
    >
      <T size={14} lineHeight={21} color={colors.ink2} align="center">
        {text}
      </T>
      {children}
    </View>
  );
}

/** Lỗi tải dữ liệu: lời nhắn + nút Thử lại. */
export function ErrorState({
  text = 'Chưa tải được dữ liệu. Kiểm tra kết nối mạng rồi thử lại.',
  onRetry,
  style,
}: {
  text?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View accessibilityLiveRegion="polite" style={style}>
      <EmptyCard text={text}>
        {onRetry ? <Button label="Thử lại" variant="secondary" size="sm" block={false} onPress={onRetry} /> : null}
      </EmptyCard>
    </View>
  );
}
