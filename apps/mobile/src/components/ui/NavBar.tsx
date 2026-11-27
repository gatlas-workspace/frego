import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export type NavKey = 'home' | 'voucher' | 'notif' | 'account';

const ITEMS: { key: NavKey; label: string; icon: IconName }[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home' },
  { key: 'voucher', label: 'Ví voucher', icon: 'ticket' },
  { key: 'notif', label: 'Thông báo', icon: 'bell' },
  { key: 'account', label: 'Tài khoản', icon: 'user' },
];

/** Khoảng đệm dưới tối thiểu như khung thiết kế (vùng thanh home). */
const MIN_BOTTOM = 30;

/**
 * UiNavBar: thanh điều hướng 4 tab (custom tab bar trong `src/app/(tabs)/_layout.tsx`).
 * - `active` (design `active`): tab đang mở.
 * - `badge` (design `badge`): số thông báo chưa đọc trên chuông; chuỗi rỗng thì ẩn.
 * - `onNavigate`: bấm tab.
 * Đệm dưới theo vùng an toàn (tối thiểu 30 như thiết kế).
 */
export function NavBar({ active, badge, onNavigate }: { active: NavKey; badge?: string; onNavigate: (k: NavKey) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Điều hướng chính"
      style={{
        flexDirection: 'row',
        gap: 2,
        paddingTop: 8,
        paddingHorizontal: 8,
        paddingBottom: Math.max(insets.bottom, MIN_BOTTOM),
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.card,
        borderTopRightRadius: radius.card,
        boxShadow: shadow.bottomBar,
      }}
    >
      {ITEMS.map((it) => {
        const on = it.key === active;
        const showBadge = it.key === 'notif' && !!badge;
        const fg = on ? colors.primary : colors.muted;
        return (
          <Pressable
            key={it.key}
            onPress={() => onNavigate(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            aria-selected={on}
            accessibilityLabel={showBadge ? `${it.label}, ${badge} chưa đọc` : it.label}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              minHeight: 56,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              opacity: pressed && !on ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 56,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: on ? colors.primarySoft : 'transparent',
              }}
            >
              <Icon name={it.icon} size={22} color={fg} strokeWidth={on ? 2 : 1.8} />
              {showBadge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 5,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: colors.surface,
                    backgroundColor: colors.badge,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <T weight={700} size={12} lineHeight={13} color={colors.white}>
                    {badge}
                  </T>
                </View>
              ) : null}
            </View>
            <T weight={on ? 700 : 600} size={12} lineHeight={14} color={fg} numberOfLines={1}>
              {it.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
