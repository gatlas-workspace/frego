// Bộ hiệu ứng nhỏ của UI v3 (khối CSS "v3-motion" trên canvas), chỉ dùng Animated có sẵn của React Native.
// Mọi hiệu ứng chạy bằng native driver (opacity/transform) và tắt khi máy bật "Giảm chuyển động".
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { motion } from '@/theme/tokens';

/* ───────── Giảm chuyển động: đọc một lần, mọi thành phần dùng chung ───────── */
let reduced = false;
const listeners = new Set<(v: boolean) => void>();
let watching = false;
function watchReducedMotion() {
  if (watching) return;
  watching = true;
  AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => {
      reduced = v;
      listeners.forEach((l) => l(v));
    })
    .catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
    reduced = v;
    listeners.forEach((l) => l(v));
  });
}

/** true khi người dùng bật "Giảm chuyển động" trong cài đặt máy. */
export function useReducedMotion(): boolean {
  const [v, setV] = useState(reduced);
  useEffect(() => {
    watchReducedMotion();
    listeners.add(setV);
    setV(reduced);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
}

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

/** Chạy một Animated.Value từ 0 → 1 khi gắn (bỏ qua khi giảm chuyển động). */
function useEnter(duration: number, delay = 0, easing = ease) {
  const off = useReducedMotion();
  const v = useRef(new Animated.Value(off ? 1 : 0)).current;
  useEffect(() => {
    if (off) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [off, v, duration, delay, easing]);
  return v;
}

/** Hiện dần + trồi lên 10px. `index` tạo độ trễ nối tiếp cho danh sách (70ms mỗi mục, tối đa 8 mục). */
export function Rise({ index = 0, children, style }: { index?: number; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useEnter(motion.base, Math.min(index, 8) * motion.stagger);
  return (
    <Animated.View
      style={[
        style,
        { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Tấm trượt lên từ đáy (ModalSheet, bảng giá So giá). */
export function SlideUp({ children, style, distance = 56, ...rest }: ViewProps & { distance?: number }) {
  const v = useEnter(motion.slow, 0, Easing.bezier(0.22, 1, 0.36, 1));
  return (
    <Animated.View {...rest} style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Bật nhẹ (dấu tích "Đã chép", nhãn "Rẻ nhất", ghim điểm đến). */
export function Pop({ children, delay = 0, style }: { children?: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const off = useReducedMotion();
  const v = useRef(new Animated.Value(off ? 1 : 0.6)).current;
  useEffect(() => {
    if (off) {
      v.setValue(1);
      return;
    }
    const a = Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true })]);
    a.start();
    return () => a.stop();
  }, [off, v, delay]);
  return <Animated.View style={[style, { transform: [{ scale: v }] }]}>{children}</Animated.View>;
}

/** Thanh tiến độ chạy tới `progress` (0–1), neo mép trái. */
export function Fill({ progress, color, style }: { progress: number; color: string; style?: StyleProp<ViewStyle> }) {
  const v = useEnter(900, 250, Easing.bezier(0.22, 1, 0.36, 1));
  const p = Math.max(0, Math.min(1, progress));
  return (
    <Animated.View
      style={[
        { height: '100%', width: `${p * 100}%`, backgroundColor: color, transformOrigin: 'left' },
        style,
        { transform: [{ scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [0.04, 1] }) }] },
      ]}
    />
  );
}

/** Trôi nhẹ lên xuống (thẻ voucher ở màn Chào mừng). */
export function Float({ index = 0, children, style }: { index?: number; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const off = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (off) return;
    const half = 2100;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay((index * 700) % half),
        Animated.timing(v, { toValue: 1, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [off, v, index]);
  return (
    <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Nhấp nháy (con trỏ ô mã OTP). */
export function Blink({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const off = useReducedMotion();
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (off) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [off, v]);
  return <Animated.View style={[style, { opacity: off ? 1 : v }]}>{children}</Animated.View>;
}

/* ───────── Khung xương lấp lánh: một vòng lặp chung cho mọi khối ───────── */
const shimmer = new Animated.Value(0);
let shimmerUsers = 0;
let shimmerLoop: Animated.CompositeAnimation | null = null;
function useShimmer(off: boolean) {
  useEffect(() => {
    if (off) return;
    shimmerUsers += 1;
    if (!shimmerLoop) {
      shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      );
      shimmerLoop.start();
    }
    return () => {
      shimmerUsers -= 1;
      if (shimmerUsers <= 0 && shimmerLoop) {
        shimmerLoop.stop();
        shimmerLoop = null;
      }
    };
  }, [off]);
}

/** Khối giữ chỗ khi đang tải, nhịp sáng tối nhẹ. */
export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const off = useReducedMotion();
  useShimmer(off);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[style, { opacity: off ? 1 : shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }]}
    />
  );
}

/** Kiểu nhấn chung: thu nhỏ 0,97 khi giữ (dùng trong style của Pressable). */
export const pressScale = (on: boolean): ViewStyle | null => (on && !reduced ? { transform: [{ scale: 0.97 }] } : null);
