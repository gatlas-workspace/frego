import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, radius } from '@/theme/tokens';

/** Nền mờ sau hộp thoại Báo giá: vài khối giữ chỗ gợi màn phía sau (trang trí). */
export function SkeletonBackdrop() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          position: 'absolute',
          top: Math.max(insets.top + 8, layout.topInset),
          left: layout.gutter,
          right: layout.gutter,
          gap: 16,
        }}
      >
        <View style={{ width: 120, height: 28, borderRadius: 10, backgroundColor: colors.skeleton }} />
        <View style={{ height: 124, borderRadius: radius.card, backgroundColor: colors.surface }} />
        <View style={{ width: 220, height: 44, borderRadius: 22, backgroundColor: colors.surface }} />
      </View>
    </View>
  );
}
