import { useQuery } from '@tanstack/react-query';
import { Redirect, Tabs } from 'expo-router';
import { NavBar, type NavKey } from '@/components/ui';
import { useApi } from '@/lib/api';

const ROUTE_TO_KEY: Record<string, NavKey> = { index: 'home', vi: 'voucher', 'thong-bao': 'notif', 'tai-khoan': 'account' };
const KEY_TO_ROUTE: Record<NavKey, string> = { home: 'index', voucher: 'vi', notif: 'thong-bao', account: 'tai-khoan' };

export default function TabsLayout() {
  const { status, svc } = useApi();
  const unread = useQuery({ queryKey: ['unread'], queryFn: () => svc.unreadCount(), enabled: status === 'signedIn' });
  if (status === 'loading') return null;
  if (status === 'signedOut') return <Redirect href="/chao-mung" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={({ state, navigateToTab }) => {
        const active = ROUTE_TO_KEY[state.routes[state.index].name] ?? 'home';
        return (
          <NavBar
            active={active}
            badge={unread.data ? String(unread.data) : ''}
            onNavigate={(key) => {
              const route = state.routes.find((r) => r.name === KEY_TO_ROUTE[key]);
              if (route) navigateToTab(route.key);
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vi" />
      <Tabs.Screen name="thong-bao" />
      <Tabs.Screen name="tai-khoan" />
    </Tabs>
  );
}
