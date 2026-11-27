import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export type InfoNoteTone = 'tint' | 'neutral' | 'deal' | 'white';

export interface InfoNoteProps {
  /** Tông (design `tone`): tint (tím nhạt) · neutral (xám) · deal (cam) · white (thẻ trắng). Mặc định tint. */
  tone?: InfoNoteTone;
  /** Icon (design `icon`: pinok, spark, check, clock, bell, link, ticket, info, gift). Mặc định pinok. */
  icon?: IconName;
  /** Dòng đậm phía trên (design `title`). */
  title?: string;
  /** Nội dung (design `text`). Không có title thì chữ đậm 600. */
  text: string;
  /** Đọc lại khi nội dung đổi (thay `role="status"` của thiết kế), VD "Đã thêm…", "Cảm ơn bạn!…". */
  live?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<InfoNoteTone, { bg: string; icon: string; title: string; text: string }> = {
  tint: { bg: colors.primarySoft, icon: colors.primaryDeep, title: colors.primaryDeep, text: colors.primaryDeep },
  neutral: { bg: colors.surfaceAlt, icon: colors.ink2, title: colors.ink, text: colors.ink2 },
  deal: { bg: colors.deal, icon: colors.dealInk, title: colors.dealInk, text: colors.dealInk },
  white: { bg: colors.surface, icon: colors.primary, title: colors.ink, text: colors.ink2 },
};

/** UiInfoNote: khối ghi chú có icon, bo 16. */
export function InfoNote({ tone = 'tint', icon = 'pinok', title, text, live, style }: InfoNoteProps) {
  const t = TONES[tone];
  return (
    <View
      accessible
      accessibilityLiveRegion={live ? 'polite' : undefined}
      accessibilityLabel={title ? `${title}. ${text}` : text}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: radius.block,
          backgroundColor: t.bg,
        },
        tone === 'white' && { boxShadow: shadow.card },
        style,
      ]}
    >
      <View style={{ marginTop: 1 }}>
        <Icon name={icon} size={18} color={t.icon} strokeWidth={2} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {title ? (
          <T weight={700} size={14} lineHeight={20} color={t.title}>
            {title}
          </T>
        ) : null}
        <T weight={title ? 400 : 600} size={13} lineHeight={19} color={t.text}>
          {text}
        </T>
      </View>
    </View>
  );
}
