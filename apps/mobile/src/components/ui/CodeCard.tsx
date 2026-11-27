import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ProviderId } from '@frego/core';
import { BrandLogo } from './BrandLogo';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export interface CodeCardProps {
  /** Logo hãng (design `logo`): grab | be | gsm | none. */
  logo?: ProviderId | 'none';
  /** Dòng cạnh logo (design `brandLine`), VD "Grab · mã công khai". */
  brandLine: string;
  /** Mã (design `code`); rỗng thì ẩn (ưu đãi tự áp). */
  code?: string;
  /** Mô tả ưu đãi (design `title`). */
  title: string;
  /** Nhãn "hợp" tím có dấu check (design `ok`; `PublicCodeCardView.okText`). */
  okText?: string;
  /** Nhãn cảnh báo cam (design `warn`; `warnText`). */
  warnText?: string;
  /** Nhãn xám (design `plain`, `plain2`; `plainText`, `plainText2`). */
  plainText?: string;
  plainText2?: string;
  /** Dòng nguồn cuối thẻ (design `meta`; `metaText`), VD "Nguồn: grab.com · kiểm tra 2 giờ trước". */
  metaText: string;
  /** Chữ hành động góc phải (design `cta`), VD "Chi tiết ›". */
  cta?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function Tag({ text, tone, check }: { text: string; tone: 'tint' | 'deal' | 'neutral'; check?: boolean }) {
  const bg = tone === 'tint' ? colors.primarySoft : tone === 'deal' ? colors.deal : colors.surfaceAlt;
  const fg = tone === 'tint' ? colors.primaryDeep : tone === 'deal' ? colors.dealInk : colors.ink2;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: radius.pill,
        paddingVertical: 3,
        paddingHorizontal: 9,
        backgroundColor: bg,
      }}
    >
      {check ? <Icon name="check" size={13} color={fg} strokeWidth={2.4} /> : null}
      <T weight={700} size={12} lineHeight={16} color={fg} numberOfLines={1}>
        {text}
      </T>
    </View>
  );
}

/** UiCodeCard: thẻ mã công khai (Ví voucher). Dùng `<CodeCard {...publicCode} cta="Chi tiết ›" onPress={…} />`. */
export function CodeCard({
  logo = 'grab',
  brandLine,
  code,
  title,
  okText,
  warnText,
  plainText,
  plainText2,
  metaText,
  cta,
  onPress,
  style,
}: CodeCardProps) {
  const hasTags = !!(okText || warnText || plainText || plainText2);
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {logo !== 'none' ? <BrandLogo kind={logo} size={36} radius={10} /> : null}
        <T weight={600} size={13} lineHeight={18} color={colors.muted} style={{ flex: 1 }}>
          {brandLine}
        </T>
      </View>
      {code ? (
        <T weight={800} size={20} lineHeight={24} numberOfLines={1} style={{ letterSpacing: 0.6 }}>
          {code}
        </T>
      ) : null}
      <T weight={700} size={15} lineHeight={21}>
        {title}
      </T>
      {hasTags ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {okText ? <Tag text={okText} tone="tint" check /> : null}
          {warnText ? <Tag text={warnText} tone="deal" /> : null}
          {plainText ? <Tag text={plainText} tone="neutral" /> : null}
          {plainText2 ? <Tag text={plainText2} tone="neutral" /> : null}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 2 }}>
        <T size={12} lineHeight={17} color={colors.muted} style={{ flexShrink: 1 }}>
          {metaText}
        </T>
        {cta ? (
          <T weight={700} size={13} lineHeight={17} color={colors.primary} numberOfLines={1} style={{ flexShrink: 0 }}>
            {cta}
          </T>
        ) : null}
      </View>
    </>
  );
  const box: ViewStyle = { gap: 8, padding: 16, borderRadius: radius.card, backgroundColor: colors.surface, boxShadow: shadow.card };
  if (!onPress) return <View style={[box, style]}>{body}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[brandLine, code, title, okText, warnText, plainText, plainText2, metaText, cta?.replace(/\s*›$/, '')]
        .filter(Boolean)
        .join(', ')}
      style={({ pressed }) => [box, pressed && { backgroundColor: colors.surfaceAlt }, style]}
    >
      {body}
    </Pressable>
  );
}
