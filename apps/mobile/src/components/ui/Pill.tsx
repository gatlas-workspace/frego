import { Pressable, View, type AccessibilityRole, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export type PillState = 'default' | 'selected' | 'dashed';

export interface PillProps {
  /** Chữ (design `label`). */
  label: string;
  /** Trạng thái (design `state`): default (trắng, nổi) · selected (tím nhạt, viền tím, có dấu check) · dashed (viền đứt, nút "Thêm"). */
  state?: PillState;
  /** Icon đứng trước (design `icon`: home, brief, plus, map, sliders). Ở trạng thái selected luôn hiện dấu check. */
  icon?: IconName;
  /** Bấm để chọn/bỏ chọn hoặc điều hướng. Không có onPress thì chỉ hiển thị. */
  onPress?: () => void;
  /** Mặc định `button` (aria-pressed → accessibilityState.selected). Dùng `radio` cho nhóm chọn một. */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** Kiểu cho khung ngoài (lề, alignSelf). Viên luôn ôm vừa chữ. */
  style?: StyleProp<ViewStyle>;
}

/** UiPill: nút dạng viên cao 44 (địa điểm đã lưu, bộ lọc, chọn sở thích). */
export function Pill({ label, state = 'default', icon, onPress, accessibilityRole, accessibilityLabel, disabled, style }: PillProps) {
  const selected = state === 'selected';
  const fg = selected ? colors.primaryDeep : state === 'dashed' ? colors.ink2 : colors.ink;
  const box: ViewStyle =
    state === 'selected'
      ? { backgroundColor: colors.primarySoft, borderWidth: 1.5, borderColor: colors.primary }
      : state === 'dashed'
        ? { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dash }
        : { backgroundColor: colors.surface, boxShadow: shadow.raised };
  const content = (
    <>
      {selected ? (
        <Icon name="check" size={16} color={fg} strokeWidth={2.2} />
      ) : icon ? (
        <Icon name={icon} size={18} color={fg} strokeWidth={2} />
      ) : null}
      <T weight={700} size={14} lineHeight={17} color={fg} numberOfLines={1}>
        {label}
      </T>
    </>
  );
  const base: ViewStyle = {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  };
  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          disabled={disabled}
          accessibilityRole={accessibilityRole ?? 'button'}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ selected, disabled: !!disabled }}
          style={({ pressed }) => [base, box, { opacity: disabled ? 0.5 : pressed ? 0.75 : 1 }]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={[base, box]}>{content}</View>
      )}
    </View>
  );
}
