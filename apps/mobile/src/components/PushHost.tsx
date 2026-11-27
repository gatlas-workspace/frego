import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PushNotif } from '@/components/ui/PushNotif';
import { usePush, type PushMessage } from '@/lib/push';

/** Thời gian tự ẩn (ms). */
const AUTO_HIDE = 6000;
const OFFSCREEN = -240;

/**
 * Banner thông báo đẩy khi app đang mở (3b, 5a): trượt xuống từ trên (dưới vùng an toàn),
 * bấm → mở `link` bằng expo-router rồi ẩn; tự ẩn sau ~6 giây.
 */
export function PushHost() {
  const { current, dismiss } = usePush();
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<PushMessage | null>(null);
  const y = useRef(new Animated.Value(OFFSCREEN)).current;

  // Tin mới → hiện và trượt xuống; tin bị xóa → trượt lên rồi gỡ.
  useEffect(() => {
    if (current) {
      setShown(current);
      y.setValue(OFFSCREEN);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      AccessibilityInfo.announceForAccessibility(`Thông báo: ${current.title}. ${current.body}`);
      const t = setTimeout(dismiss, AUTO_HIDE);
      return () => clearTimeout(t);
    }
    Animated.timing(y, { toValue: OFFSCREEN, duration: 200, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setShown(null);
    });
    return undefined;
  }, [current, dismiss, y]);

  if (!shown) return null;
  const open = () => {
    const link = shown.link;
    dismiss();
    if (link) router.push(link);
  };
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
      <Animated.View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, transform: [{ translateY: y }] }} pointerEvents="box-none">
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={`${shown.title}. ${shown.body}`}
          accessibilityHint="Mở thông báo"
          accessibilityLiveRegion="polite"
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <PushNotif title={shown.title} body={shown.body} time={shown.time} />
        </Pressable>
      </Animated.View>
    </View>
  );
}
