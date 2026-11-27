import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, shadow } from '@/theme/tokens';

export interface ShortcutProps {
  /** Chữ dưới vòng tròn (design `label`), VD "Nhà". */
  label: string;
  /** Icon (design `icon`: home, brief, plus). Nhận `SavedPlaceView.icon` (home, brief, pin). */
  icon?: IconName;
  /** Kiểu (design `variant`): normal (vòng trắng nổi, icon tím) | add (viền đứt, nút "Thêm"). */
  variant?: 'normal' | 'add';
  onPress?: () => void;
  /** Nhãn đọc, VD "Thêm địa điểm đã lưu" cho nút add. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** UiShortcut: lối tắt địa điểm đã lưu (vòng 56 + chữ), rộng 72. */
export function Shortcut({ label, icon = 'home', variant = 'normal', onPress, accessibilityLabel, style }: ShortcutProps) {
  const add = variant === 'add';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [{ width: 72, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 }, style]}
    >
      <View
        style={[
          { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
          add
            ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dash }
            : { backgroundColor: colors.surface, boxShadow: shadow.card },
        ]}
      >
        <Icon name={icon} size={24} color={add ? colors.ink2 : colors.primary} strokeWidth={2} />
      </View>
      <T weight={700} size={13} lineHeight={17} align="center" numberOfLines={1}>
        {label}
      </T>
    </Pressable>
  );
}
