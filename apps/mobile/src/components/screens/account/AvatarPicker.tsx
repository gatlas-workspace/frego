import { Image, Pressable, View } from 'react-native';
import { Button, Icon, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface AvatarPickerProps {
  /** Ảnh đã chọn (uri trên máy). */
  uri: string | null;
  /** Mở lựa chọn chụp/chọn ảnh. */
  onPick: () => void;
  busy?: boolean;
}

const SIZE = 76;

/** Ô ảnh đại diện màn Thông tin (0d): tròn viền đứt có dấu cộng khi chưa có ảnh; ảnh + nút "Đổi ảnh" khi đã có. */
export function AvatarPicker({ uri, onPick, busy }: AvatarPickerProps) {
  if (!uri) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable
          onPress={onPick}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Thêm ảnh đại diện"
          accessibilityHint="Chụp mới hoặc chọn từ thư viện ảnh."
          style={({ pressed }) => ({
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: colors.dash,
            backgroundColor: pressed ? colors.track : colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.6 : 1,
          })}
        >
          <Icon name="camera" size={28} color={colors.ink2} strokeWidth={1.8} />
          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.primary,
              borderWidth: 2,
              borderColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="plus" size={14} color={colors.white} strokeWidth={2.6} />
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={700} size={15} lineHeight={20}>
            Ảnh đại diện
          </T>
          <T size={13} lineHeight={19} color={colors.muted}>
            Chụp mới hoặc chọn từ thư viện ảnh.
          </T>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <Image
        source={{ uri }}
        accessibilityIgnoresInvertColors
        accessible={false}
        style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: colors.onPrimarySoft }}
      />
      <View style={{ flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 4 }}>
        <T weight={700} size={15} lineHeight={20} accessibilityLiveRegion="polite" role="status">
          Đã thêm ảnh đại diện
        </T>
        <Button label="Đổi ảnh" variant="ghost" size="sm" block={false} onPress={onPick} disabled={busy} accessibilityLabel="Đổi ảnh đại diện" />
      </View>
    </View>
  );
}
