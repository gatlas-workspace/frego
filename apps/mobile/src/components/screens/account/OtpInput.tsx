import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View, type TextInputInstance } from 'react-native';
import { T } from '@/components/ui';
import { colors, fontFamily } from '@/theme/tokens';

export interface OtpInputProps {
  value: string;
  onChange: (digits: string) => void;
  /** Số ô (mặc định 6). */
  length?: number;
  /** Viền đỏ khi mã sai. */
  error?: boolean;
  /** Gõ Enter / Xong trên bàn phím. */
  onSubmit?: () => void;
  autoFocus?: boolean;
}

/**
 * Ô nhập mã OTP: một TextInput thật (tự điền mã từ tin nhắn: one-time-code / sms-otp) nằm ẩn
 * phủ lên 6 ô số 48×58. Ô đang nhập có viền tím và con trỏ.
 */
export const OtpInput = forwardRef<TextInputInstance | null, OtpInputProps>(function OtpInput(
  { value, onChange, length = 6, error, onSubmit, autoFocus },
  ref,
) {
  const input = useRef<TextInputInstance>(null);
  useImperativeHandle(ref, () => input.current as TextInputInstance);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() => input.current?.focus()}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}
      >
        {Array.from({ length }, (_, i) => {
          const digit = value[i] ?? '';
          const isActive = focused && i === active;
          const showCaret = isActive && value.length < length;
          return (
            <View
              key={i}
              style={{
                width: 48,
                flexShrink: 1,
                minWidth: 0,
                height: 58,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? colors.surface : colors.surfaceAlt,
                borderWidth: 2,
                borderColor: error ? colors.bad : isActive ? colors.primary : 'transparent',
              }}
            >
              {showCaret && !digit ? (
                <View style={{ width: 2, height: 26, borderRadius: 1, backgroundColor: colors.primary }} />
              ) : (
                <T weight={800} size={24} lineHeight={30} style={{ fontVariant: ['tabular-nums'] }}>
                  {digit}
                </T>
              )}
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        maxLength={length}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        returnKeyType="done"
        caretHidden
        accessibilityLabel={`Mã xác nhận, đã nhập ${value.length} trên ${length} số`}
        accessibilityHint="Mã 6 số gửi qua tin nhắn"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          opacity: 0,
          color: 'transparent',
          fontFamily: fontFamily[400],
          fontSize: 16,
          outlineWidth: 0,
        }}
      />
    </View>
  );
});
