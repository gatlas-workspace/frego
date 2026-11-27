import { Redirect, Stack } from 'expo-router';

/** Trang tổng hợp thành phần chỉ có trong bản phát triển (__DEV__) hoặc khi bật EXPO_PUBLIC_SHOW_DEV=1. */
export default function DevLayout() {
  if (!__DEV__ && process.env.EXPO_PUBLIC_SHOW_DEV !== '1') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
