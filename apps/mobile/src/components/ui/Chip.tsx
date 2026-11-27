import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius } from '@/theme/tokens';

export type ChipTone = 'deal' | 'tint' | 'neutral' | 'outline' | 'solid' | 'dark';

export interface ChipProps {
  /** Chữ (design `text`), VD "3 voucher", "−20.000đ". */
  text: string;
  /** Tông (design `tone`): deal (cam) · tint (tím nhạt) · neutral (xám) · outline (viền) · solid (tím) · dark. Mặc định deal. */
  tone?: ChipTone;
  /** Cỡ (design `size`): sm (12px, đệm 2×8) | md (13px, đệm 4×10). Mặc định md. */
  size?: 'sm' | 'md';
  /** Icon đứng trước (design `icon`): check | spark. */
  icon?: 'check' | 'spark';
  /** Bo góc 6px thay vì tròn (design `square`, dùng cho nhãn "Tài trợ"). */
  square?: boolean;
  /** Kiểu cho khung ngoài (lề, alignSelf). Chip luôn ôm vừa chữ, kể cả trong cột. */
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<ChipTone, { bg: string; fg: string; border?: string }> = {
  deal: { bg: colors.deal, fg: colors.dealInk },
  tint: { bg: colors.primarySoft, fg: colors.primaryDeep },
  neutral: { bg: colors.surfaceAlt, fg: colors.ink2 },
  outline: { bg: 'transparent', fg: colors.ink2, border: colors.dash },
  solid: { bg: colors.primary, fg: colors.white },
  dark: { bg: colors.ink, fg: colors.white },
};

/** UiChip: nhãn nhỏ không bấm được (số voucher, trạng thái, số tiền giảm). */
export function Chip({ text, tone = 'deal', size = 'md', icon, square, style }: ChipProps) {
  const t = TONES[tone];
  const sm = size === 'sm';
  const fs = sm ? 12 : 13;
  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: square ? 6 : radius.pill,
            paddingVertical: sm ? 2 : 4,
            paddingHorizontal: sm ? 8 : 10,
            backgroundColor: t.bg,
          },
          t.border ? { borderWidth: 1, borderColor: t.border } : null,
        ]}
      >
        {icon ? <Icon name={icon} size={14} color={t.fg} strokeWidth={icon === 'check' ? 2.2 : 2} /> : null}
        <T
          weight={700}
          size={fs}
          lineHeight={Math.round(fs * 1.35)}
          color={t.fg}
          numberOfLines={1}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {text}
        </T>
      </View>
    </View>
  );
}
