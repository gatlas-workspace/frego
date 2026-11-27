import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PushHost } from '@/components/PushHost';
import { ApiProvider, useApi } from '@/lib/api';
import { PickupProvider } from '@/lib/pickup';
import { PushProvider } from '@/lib/push';
import { TripFlowProvider } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Chờ biết đã đăng nhập hay chưa (và dữ liệu demo trên máy đã nạp xong) rồi mới dựng màn hình.
 * Không có bước này, mở thẳng một link (VD bấm thông báo → /bao-gia/<id> lúc app vừa mở) sẽ đọc dữ liệu trước khi nạp
 * và báo "Không tìm thấy chuyến".
 */
function WhenApiReady({ children }: { children: ReactNode }) {
  const { status } = useApi();
  return status === 'loading' ? null : <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);
  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ApiProvider>
        <WhenApiReady>
        <TripFlowProvider>
          <PickupProvider>
          <PushProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="chuyen/quang-cao" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="chuyen/mo-app" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="bao-gia/[tripId]" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            <PushHost />
          </PushProvider>
          </PickupProvider>
        </TripFlowProvider>
        </WhenApiReady>
      </ApiProvider>
    </SafeAreaProvider>
  );
}
