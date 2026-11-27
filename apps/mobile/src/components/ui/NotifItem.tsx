import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { CategoryKey, IconName, ProviderId } from '@frego/core';
import { BrandLogo, type CategoryTileKey } from './BrandLogo';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export interface NotifItemProps {
  /** Icon ô đầu khi không có logo (design `icon`: receipt, gift, card2, sparkplus, tag). */
  icon?: IconName;
  /** Tông ô icon (design `tone`): tint | deal. */
  tone?: 'tint' | 'deal';
  /** Logo thay ô icon (design `logo`: grab, be, gsm, frego, cafe…). Rỗng/không có thì dùng icon. */
  logo?: ProviderId | CategoryKey | CategoryTileKey | 'frego' | '';
  /** Tiêu đề (design `title`). */
  title: string;
  /** Nội dung (design `body`). */
  body: string;
  /** Giờ · nhóm (design `meta`; `NotificationView.metaText`), VD "18:05 · Chuyến đi". */
  metaText: string;
  /** Lời mời (design `cta`), VD "Báo giá ›". */
  cta: string;
  /** Chưa đọc (design `unread`): tiêu đề đậm 800 + chấm tím. */
  unread?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** UiNotifItem: thẻ thông báo trong Trung tâm thông báo. Dùng `<NotifItem {...n} onPress={…} />` với `NotificationView`. */
export function NotifItem({ icon = 'receipt', tone = 'tint', logo, title, body, metaText, cta, unread, onPress, style }: NotifItemProps) {
  const lead = logo ? (
    <BrandLogo kind={logo} size={40} radius={12} iconSize={22} fontSize={18} />
  ) : (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.small,
        backgroundColor: tone === 'deal' ? colors.deal : colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={20} color={tone === 'deal' ? colors.dealInk : colors.primary} strokeWidth={1.9} />
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={[unread ? 'Chưa đọc' : '', title, body, metaText, cta.replace(/\s*›$/, '')].filter(Boolean).join('. ')}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          padding: 14,
          borderRadius: 22,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          boxShadow: shadow.card,
        },
        style,
      ]}
    >
      {lead}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        {unread ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <T weight={800} size={15} lineHeight={20} style={{ flex: 1 }}>
              {title}
            </T>
            <View style={{ width: 10, height: 10, marginTop: 6, borderRadius: 5, backgroundColor: colors.primary }} />
          </View>
        ) : (
          <T weight={600} size={15} lineHeight={20}>
            {title}
          </T>
        )}
        <T size={14} lineHeight={20} color={colors.ink2}>
          {body}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 4 }}>
          <T size={12} lineHeight={16} color={colors.muted} style={{ flexShrink: 1 }}>
            {metaText}
          </T>
          <T weight={700} size={13} lineHeight={17} color={colors.primary} numberOfLines={1} style={{ flexShrink: 0 }}>
            {cta}
          </T>
        </View>
      </View>
    </Pressable>
  );
}
