import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { Shimmer } from '@/components/motion';
import { Button, InfoNote } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

/** Khối giữ chỗ xám khi đang tải (không dùng vòng quay). */
export function Skeleton({
  height,
  width = '100%',
  r = radius.card,
  style,
}: {
  height: number;
  width?: DimensionValue;
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <Shimmer style={[{ height, width, borderRadius: r, backgroundColor: colors.skeleton }, style]} />;
}

/** Vùng đang tải: vài khối xám, đọc là "Đang tải". */
export function LoadingBlocks({ heights = [68, 68], gap = 12 }: { heights?: number[]; gap?: number }) {
  return (
    <View accessible accessibilityLabel="Đang tải" style={{ gap }}>
      {heights.map((h, i) => (
        <Skeleton key={i} height={h} />
      ))}
    </View>
  );
}

/** Lỗi tải dữ liệu: ghi chú ngắn + nút thử lại. */
export function ErrorState({
  message = 'Chưa tải được dữ liệu. Kiểm tra mạng rồi thử lại.',
  onRetry,
  style,
}: {
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ gap: 4 }, style]}>
      <InfoNote tone="neutral" icon="info" text={message} live />
      {onRetry ? <Button label="Thử lại" variant="text" size="sm" block={false} onPress={onRetry} /> : null}
    </View>
  );
}
