import { forwardRef } from 'react';
import { Pressable, TextInput, View, type StyleProp, type TextInputInstance, type TextInputProps, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { colors, fontFamily, radius, shadow } from '@/theme/tokens';

export interface SearchFieldProps extends Omit<TextInputProps, 'style' | 'placeholderTextColor'> {
  /** Nhãn đọc (bắt buộc vì ô không có nhãn hiện), VD "Điểm đến", "Tìm địa chỉ". */
  accessibilityLabel: string;
  /**
   * Nền: alt (xám #F1F2F8, chữ 16/700 — ô "Bạn muốn đi đâu?" màn Tìm kiếm) ·
   * surface (trắng có bóng thẻ, chữ 16/600 — ô "Tìm địa chỉ" màn Thêm địa điểm).
   */
  tone?: 'alt' | 'surface';
  /** Bấm nút X xóa (chỉ hiện khi có `value`). */
  onClear?: () => void;
  /** Nhãn nút xóa, mặc định "Xóa" (thiết kế: "Xóa điểm đến"). */
  clearLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Ô tìm kiếm cao 52, icon kính lúp tím, nút X xóa 44×44 (màn Tìm kiếm, Thêm địa điểm). */
export const SearchField = forwardRef<TextInputInstance, SearchFieldProps>(function SearchField(
  { accessibilityLabel, tone = 'alt', onClear, clearLabel = 'Xóa', style, value, ...input },
  ref,
) {
  const alt = tone === 'alt';
  const canClear = !!onClear && !!value;
  return (
    <View
      style={[
        {
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 14,
          paddingRight: canClear ? 4 : 14,
          borderRadius: radius.block,
          backgroundColor: alt ? colors.surfaceAlt : colors.surface,
        },
        !alt && { boxShadow: shadow.card },
        style,
      ]}
    >
      <Icon name="search" size={20} color={colors.primary} strokeWidth={2} />
      <TextInput
        ref={ref}
        {...input}
        value={value}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={colors.muted}
        autoComplete={input.autoComplete ?? 'off'}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          paddingVertical: 0,
          fontFamily: fontFamily[alt ? 700 : 600],
          fontSize: 16,
          color: colors.ink,
          outlineWidth: 0,
          // Web: bỏ viền focus mặc định của trình duyệt (khung ô nhập đã có trạng thái focus riêng).
          ...({ outlineStyle: 'none' } as object),
        }}
      />
      {canClear ? (
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? colors.track : 'transparent',
          })}
        >
          <Icon name="x" size={20} color={colors.ink2} strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
});
