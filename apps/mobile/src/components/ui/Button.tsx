import { Pressable, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'dashed' | 'white';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

export interface ButtonProps {
  /** Chữ trên nút (design `label`). */
  label: string;
  /** Kiểu (design `variant`): primary | secondary | outline | ghost | text | dashed | white. Mặc định primary. */
  variant?: ButtonVariant;
  /** Cỡ (design `size`): lg 56 · md 48 · sm 44 · xs 44 (đệm hẹp). Mặc định lg. */
  size?: ButtonSize;
  /**
   * Icon (design `icon`): copy, check, plus, map, x đứng trước chữ; external, chev đứng sau chữ.
   * Nhận mọi tên trong bộ icon chung.
   */
  icon?: IconName;
  /** Ép vị trí icon; mặc định theo thiết kế (external/chev ở sau). */
  iconPosition?: 'start' | 'end';
  /** Nhãn viên bên phải chữ (design `badge`, VD "+10 điểm"). */
  badge?: string;
  /** Kéo hết chiều ngang (design `block`, mặc định true). Khi false, nút ôm vừa chữ; `style` áp cho khung ngoài (lề, alignSelf). */
  block?: boolean;
  /** Tắt nút: mờ 50% như màn Thêm địa điểm. */
  disabled?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
  /** Nhãn đọc cho trình đọc màn hình (mặc định = label + badge). */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** [chiều cao, đệm ngang, bo góc, cỡ chữ] theo cỡ — như UiButton. */
const DIMS: Record<ButtonSize, [number, number, number, number]> = {
  lg: [56, 20, 16, 16],
  md: [48, 18, 14, 15],
  sm: [44, 14, 12, 14],
  xs: [44, 10, 12, 13],
};

const END_ICONS: IconName[] = ['external', 'chev'];

function look(variant: ButtonVariant, pressed: boolean): { box: ViewStyle; fg: string; badgeBg: string; badgeFg: string } {
  const badgeOnPrimary = { badgeBg: colors.primary, badgeFg: colors.white };
  switch (variant) {
    case 'primary':
      return {
        box: { backgroundColor: pressed ? colors.primaryDeep : colors.primary },
        fg: colors.white,
        badgeBg: colors.white,
        badgeFg: colors.primaryDeep,
      };
    case 'secondary':
      return { box: { backgroundColor: pressed ? colors.onPrimarySoft : colors.primarySoft }, fg: colors.primaryDeep, ...badgeOnPrimary };
    case 'outline':
      return {
        box: { backgroundColor: pressed ? colors.primarySoft : colors.surface, borderWidth: 1.5, borderColor: colors.primary },
        fg: colors.primary,
        ...badgeOnPrimary,
      };
    case 'ghost':
      return { box: { backgroundColor: pressed ? colors.track : colors.surfaceAlt }, fg: colors.ink, ...badgeOnPrimary };
    case 'text':
      return {
        box: { backgroundColor: pressed ? colors.primarySoft : 'transparent' },
        fg: pressed ? colors.primaryDeep : colors.primary,
        ...badgeOnPrimary,
      };
    case 'dashed':
      return {
        box: {
          backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.dash,
        },
        fg: colors.ink2,
        ...badgeOnPrimary,
      };
    case 'white':
      return {
        box: { backgroundColor: pressed ? colors.surfaceAlt : colors.surface, boxShadow: shadow.raised },
        fg: colors.ink,
        ...badgeOnPrimary,
      };
  }
}

/** UiButton: nút chữ có icon/nhãn viên tùy chọn. Luôn ≥ 44px chiều cao. */
export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition,
  badge,
  block = true,
  disabled,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const [h, px, r, fs] = DIMS[size];
  const atEnd = icon ? (iconPosition ? iconPosition === 'end' : END_ICONS.includes(icon)) : false;
  const btn = (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (badge ? `${label}, ${badge}` : label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => {
        const l = look(variant, pressed && !disabled);
        return [
          {
            height: h,
            paddingHorizontal: px,
            borderRadius: r,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            alignSelf: block ? 'stretch' : 'auto',
            opacity: disabled ? 0.5 : 1,
          },
          l.box,
          block ? style : null,
        ];
      }}
    >
      {({ pressed }) => {
        const l = look(variant, pressed && !disabled);
        const ic = icon ? <Icon name={icon} size={atEnd ? 18 : 20} color={l.fg} strokeWidth={2} /> : null;
        return (
          <>
            {!atEnd && ic}
            <T weight={700} size={fs} lineHeight={Math.round(fs * 1.2)} color={l.fg} numberOfLines={1} style={{ flexShrink: 1 }}>
              {label}
            </T>
            {badge ? (
              <View style={{ borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: l.badgeBg }}>
                <T weight={800} size={12} lineHeight={14} color={l.badgeFg} numberOfLines={1}>
                  {badge}
                </T>
              </View>
            ) : null}
            {atEnd && ic}
          </>
        );
      }}
    </Pressable>
  );
  // Nút không kéo dài: bọc hàng ngang để luôn ôm vừa nội dung, kể cả trong cột.
  return block ? btn : <View style={[{ flexDirection: 'row' }, style]}>{btn}</View>;
}
