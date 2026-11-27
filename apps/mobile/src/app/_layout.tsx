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
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PushHost } from '@/components/PushHost';
import { ApiProvider } from '@/lib/api';
import { PushProvider } from '@/lib/push';
import { TripFlowProvider } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
        <TripFlowProvider>
          <PushProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="chuyen/mo-app" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="bao-gia/[tripId]" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            <PushHost />
          </PushProvider>
        </TripFlowProvider>
      </ApiProvider>
    </SafeAreaProvider>
  );
}
