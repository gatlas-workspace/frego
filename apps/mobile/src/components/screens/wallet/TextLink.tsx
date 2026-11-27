import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors, HIT } from '@/theme/tokens';

export interface TextLinkProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Liên kết chữ tím 14/700, vùng chạm cao 44 (VD "Quản lý dữ liệu dùng để tặng mã"). */
export function TextLink({ label, onPress, accessibilityHint, style }: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[{ minHeight: HIT, justifyContent: 'center' }, style]}
    >
      {({ pressed }) => (
        <T weight={700} size={14} lineHeight={20} color={pressed ? colors.primaryDeep : colors.primary}>
          {label}
        </T>
      )}
    </Pressable>
  );
}
