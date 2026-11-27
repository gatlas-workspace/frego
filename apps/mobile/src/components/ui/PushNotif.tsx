import { View, type StyleProp, type ViewStyle } from 'react-native';
import { brand } from '@frego/core';
import { BrandLogo } from './BrandLogo';
import { T } from './Text';
import { colors, shadow } from '@/theme/tokens';

export interface PushNotifProps {
  /** Tiêu đề (design `title`). */
  title: string;
  /** Nội dung (design `body`). */
  body: string;
  /** Thời gian (design `time`), mặc định "vừa xong". */
  time?: string;
  style?: StyleProp<ViewStyle>;
}

/** UiPushNotif: banner thông báo đẩy (logo F + "Frego" + giờ, tiêu đề, nội dung). Chỉ hiển thị; PushHost lo bấm/ẩn. */
export function PushNotif({ title, body, time = 'vừa xong', style }: PushNotifProps) {
  return (
    <View
      style={[
        { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 22, backgroundColor: colors.surface, boxShadow: shadow.card },
        style,
      ]}
    >
      <BrandLogo kind="frego" size={40} radius={12} fontSize={18} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <T weight={700} size={13} lineHeight={17} color={colors.ink2}>
            {brand.name}
          </T>
          <T size={12} lineHeight={16} color={colors.muted}>
            {time}
          </T>
        </View>
        <T weight={800} size={15} lineHeight={20}>
          {title}
        </T>
        <T size={13} lineHeight={19} color={colors.ink2}>
          {body}
        </T>
      </View>
    </View>
  );
}
