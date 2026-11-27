import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, TextInput, View, type StyleProp, type TextInputInstance, type TextInputProps, type ViewStyle } from 'react-native';
import { T } from './Text';
import { colors, fontFamily, radius } from '@/theme/tokens';

export interface FieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  /** Nhãn trên ô (design `label`). Để trống khi nhãn nằm ngoài (VD "Có mã khác?" ở KetQua) và truyền `accessibilityLabel`. */
  label?: string;
  /** Ghi chú (design `help`). */
  help?: string;
  /** Vị trí ghi chú (design `helpPos`): top (giữa nhãn và ô) | bottom (dưới ô). Mặc định bottom. */
  helpPosition?: 'top' | 'bottom';
  /** Tiền tố có vạch ngăn (design `prefix`), VD "+84". */
  prefix?: string;
  /** Hậu tố (design `suffix`), VD "đ". */
  suffix?: string;
  /** Nút liền bên phải ô (design `action`), VD "Thêm", "Gửi". */
  action?: string;
  /** Nhãn viên trong nút (design `actionBadge`), VD "+50 điểm". */
  actionBadge?: string;
  /** Bấm nút bên phải (design `onAction`). */
  onAction?: () => void;
  /** Tắt nút bên phải (mờ 50%). */
  actionDisabled?: boolean;
  /** Ép kiểu viền (design `state`): `focus` để vẽ trạng thái đang nhập (bảng thành phần). Bình thường tự theo focus thật. */
  state?: 'default' | 'focus';
  /** Kiểu cho khung ngoài cùng. */
  style?: StyleProp<ViewStyle>;
}

/**
 * UiField: ô nhập thật (TextInput) có nhãn, tiền tố/hậu tố, ghi chú trên/dưới, nút hành động.
 * Bàn phím số: truyền `inputMode="numeric"` (hoặc `"tel"`); tự điền: `autoComplete` (VD "tel-national", "birthdate-full").
 */
export const Field = forwardRef<TextInputInstance, FieldProps>(function Field(
  {
    label,
    help,
    helpPosition = 'bottom',
    prefix,
    suffix,
    action,
    actionBadge,
    onAction,
    actionDisabled,
    state,
    style,
    onFocus,
    onBlur,
    accessibilityLabel,
    accessibilityHint,
    ...input
  },
  ref,
) {
  const inner = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => inner.current as TextInputInstance);
  const [focused, setFocused] = useState(false);
  const isFocus = state === 'focus' || focused;
  const helpText = help ? (
    <T size={13} lineHeight={19} color={colors.muted}>
      {help}
    </T>
  ) : null;

  return (
    <View style={[{ gap: 8, alignSelf: 'stretch' }, style]}>
      {label ? (
        <T weight={700} size={14} lineHeight={19} onPress={() => inner.current?.focus()} accessible={false}>
          {label}
        </T>
      ) : null}
      {helpPosition === 'top' && helpText}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            minWidth: 0,
            height: 56,
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: radius.block,
            borderWidth: 1.5,
            borderColor: isFocus ? colors.primary : 'transparent',
            backgroundColor: isFocus ? colors.surface : colors.surfaceAlt,
            overflow: 'hidden',
          }}
        >
          {prefix ? (
            <View
              style={{
                height: 24,
                paddingLeft: 16,
                paddingRight: 12,
                justifyContent: 'center',
                borderRightWidth: 1.5,
                borderRightColor: colors.fieldDivider,
              }}
            >
              <T weight={700} size={16} lineHeight={20}>
                {prefix}
              </T>
            </View>
          ) : null}
          <TextInput
            ref={inner}
            {...input}
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityHint={accessibilityHint ?? help}
            placeholderTextColor={colors.muted}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              paddingHorizontal: 16,
              paddingVertical: 0,
              fontFamily: fontFamily[600],
              fontSize: 16,
              color: colors.ink,
              outlineWidth: 0,
              // Web: bỏ viền focus mặc định của trình duyệt (khung ô nhập đã có trạng thái focus riêng).
              ...({ outlineStyle: 'none' } as object),
            }}
          />
          {suffix ? (
            <T weight={700} size={16} lineHeight={20} color={colors.ink2} style={{ paddingRight: 16 }}>
              {suffix}
            </T>
          ) : null}
        </View>
        {action ? (
          <Pressable
            onPress={onAction}
            disabled={actionDisabled}
            accessibilityRole="button"
            accessibilityLabel={actionBadge ? `${action}, ${actionBadge}` : action}
            accessibilityState={{ disabled: !!actionDisabled }}
            style={({ pressed }) => ({
              height: 56,
              paddingHorizontal: 18,
              borderRadius: radius.block,
              backgroundColor: pressed ? colors.primaryDeep : colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: actionDisabled ? 0.5 : 1,
            })}
          >
            <T weight={700} size={15} lineHeight={19} color={colors.white} numberOfLines={1}>
              {action}
            </T>
            {actionBadge ? (
              <View style={{ borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: colors.white }}>
                <T weight={800} size={12} lineHeight={14} color={colors.primaryDeep} numberOfLines={1}>
                  {actionBadge}
                </T>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>
      {helpPosition === 'bottom' && helpText}
    </View>
  );
});
