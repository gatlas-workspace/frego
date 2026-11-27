import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, T } from '@/components/ui';
import { colors, HIT, radius } from '@/theme/tokens';

export interface StatusRowProps {
  text: string;
  /** Liên kết bên phải (VD "Mở Ví"). */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** iOS không có vùng đọc lại (live region): đọc thông báo một lần khi chữ đổi. Android/web dùng accessibilityLiveRegion. */
function useAnnounce(text: string) {
  useEffect(() => {
    if (Platform.OS === 'ios' && text) AccessibilityInfo.announceForAccessibility(text);
  }, [text]);
}

/** Dòng xác nhận tím nhạt có dấu check, đọc lại khi xuất hiện (VD "Đã thêm voucher … vào Ví."). */
export function StatusRow({ text, actionLabel, onAction, style }: StatusRowProps) {
  useAnnounce(text);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
          paddingRight: 8,
          paddingLeft: 14,
          minHeight: 60,
          borderRadius: radius.block,
          backgroundColor: colors.primarySoft,
        },
        style,
      ]}
    >
      <Icon name="check" size={18} color={colors.primaryDeep} strokeWidth={2.2} />
      <T weight={700} size={13} lineHeight={19} color={colors.primaryDeep} style={{ flex: 1, minWidth: 0 }}>
        {text}
      </T>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="link"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => ({
            minHeight: HIT,
            paddingHorizontal: 10,
            justifyContent: 'center',
            borderRadius: radius.small,
            backgroundColor: pressed ? colors.onPrimarySoft : 'transparent',
          })}
        >
          <T weight={800} size={14} lineHeight={18} color={colors.primaryDeep} style={{ textDecorationLine: 'underline' }}>
            {actionLabel}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Khối trạng thái cao 56 thay cho nút chính sau khi bấm (VD "Đã chép mã, đang mở Grab"). */
export function ButtonStatus({ text, icon = 'check' }: { text: string; icon?: 'check' | 'info' }) {
  useAnnounce(text);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        minHeight: 56,
        paddingHorizontal: 16,
        borderRadius: radius.block,
        backgroundColor: colors.primarySoft,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Icon name={icon} size={20} color={colors.primaryDeep} strokeWidth={2.2} />
      <T weight={700} size={15} lineHeight={20} color={colors.primaryDeep} style={{ flexShrink: 1 }}>
        {text}
      </T>
    </View>
  );
}
