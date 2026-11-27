import { Pressable, View } from 'react-native';
import { T, Toggle } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface SwitchRowProps {
  title: string;
  sub: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * Hàng bật/tắt của màn Quyền dữ liệu: đệm 16, chữ hai dòng, công tắc 52×32 (vùng chạm 44).
 * Cả hàng là một công tắc (role switch) để dễ bấm; nhãn = tiêu đề, gợi ý = mô tả.
 */
export function SwitchRow({ title, sub, checked, onChange, disabled }: SwitchRowProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityHint={sub}
      accessibilityState={{ checked, disabled: !!disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        backgroundColor: pressed ? colors.track : 'transparent',
      })}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T weight={700} size={15} lineHeight={20}>
          {title}
        </T>
        <T size={13} lineHeight={19} color={colors.muted}>
          {sub}
        </T>
      </View>
      <View style={{ paddingVertical: 6 }}>
        <Toggle checked={checked} />
      </View>
    </Pressable>
  );
}
