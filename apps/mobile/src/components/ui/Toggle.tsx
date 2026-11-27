import { useEffect, useRef } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, shadow } from '@/theme/tokens';

export interface ToggleProps {
  /** Bật/tắt (design `checked`). */
  checked: boolean;
  /**
   * Đổi trạng thái. Có hàm này thì công tắc là nút `switch` riêng (vùng chạm 44).
   * Không có (VD nằm trong ListRow đã là switch) thì chỉ hiển thị, ẩn với trình đọc màn hình.
   */
  onChange?: (next: boolean) => void;
  /** Nhãn đọc khi công tắc đứng riêng, VD "Vị trí khi đang dùng app". */
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** UiToggle: công tắc 52×32, núm 26px. Bật: tím; tắt: xám #8A8FA6. */
export function Toggle({ checked, onChange, accessibilityLabel, disabled, style }: ToggleProps) {
  const x = useRef(new Animated.Value(checked ? 20 : 0)).current;
  useEffect(() => {
    Animated.timing(x, { toValue: checked ? 20 : 0, duration: 160, useNativeDriver: true }).start();
  }, [checked, x]);

  const track = (
    <View
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        backgroundColor: checked ? colors.primary : colors.toggleOff,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 3,
          left: 3,
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.surface,
          boxShadow: shadow.knob,
          transform: [{ translateX: x }],
        }}
      />
    </View>
  );

  if (!onChange) {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={style}>
        {track}
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked, disabled: !!disabled }}
      hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
      style={[{ paddingVertical: 6 }, style]}
    >
      {track}
    </Pressable>
  );
}
