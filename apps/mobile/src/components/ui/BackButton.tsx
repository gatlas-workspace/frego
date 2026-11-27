import { router } from 'expo-router';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { colors, shadow } from '@/theme/tokens';

export interface BackButtonProps {
  /** Kiểu (design `variant`): plain (trong suốt, đầu màn) · float (trắng nổi trên bản đồ) · soft (xám, đóng hộp thoại). */
  variant?: 'plain' | 'float' | 'soft';
  /** Icon (design `icon`): back (mũi tên) | close (dấu X). */
  icon?: 'back' | 'close';
  /** Mặc định: `router.back()` nếu quay lại được. */
  onPress?: () => void;
  /** Nhãn đọc (bắt buộc với nút chỉ có icon). Mặc định "Quay lại" / "Đóng". VD "Quay lại trang chủ". */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** UiBackButton: nút tròn 44×44 chỉ có icon. */
export function BackButton({ variant = 'plain', icon = 'back', onPress, accessibilityLabel, style }: BackButtonProps) {
  const isClose = icon === 'close';
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (isClose ? 'Đóng' : 'Quay lại')}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
        },
        variant === 'float' && { backgroundColor: colors.surface, boxShadow: shadow.floatButton },
        variant === 'soft' && { backgroundColor: colors.surfaceAlt },
        pressed && { backgroundColor: variant === 'soft' ? colors.track : variant === 'float' ? colors.surfaceAlt : colors.track },
        style,
      ]}
    >
      <Icon name={isClose ? 'close' : 'back'} size={isClose ? 20 : 22} color={colors.ink} strokeWidth={2.2} />
    </Pressable>
  );
}
