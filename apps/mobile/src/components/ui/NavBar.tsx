// TODO(thành phần): dựng theo UiNavBar.dc.html. Bản tạm để app chạy được.
import { Pressable, View } from 'react-native';
import { T } from './Text';
import { colors } from '@/theme/tokens';

export type NavKey = 'home' | 'voucher' | 'notif' | 'account';

export function NavBar({ active, badge, onNavigate }: { active: NavKey; badge?: string; onNavigate: (k: NavKey) => void }) {
  const items: [NavKey, string][] = [['home', 'Trang chủ'], ['voucher', 'Ví voucher'], ['notif', 'Thông báo'], ['account', 'Tài khoản']];
  return (
    <View style={{ flexDirection: 'row', height: 94, backgroundColor: colors.surface }}>
      {items.map(([k, label]) => (
        <Pressable key={k} onPress={() => onNavigate(k)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <T variant="label" color={k === active ? colors.primary : colors.muted}>{label}{k === 'notif' && badge ? ` (${badge})` : ''}</T>
        </Pressable>
      ))}
    </View>
  );
}
