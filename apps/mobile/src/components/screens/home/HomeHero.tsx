// Dải đầu Trang chủ v3: ảnh bìa (do quản trị đặt ở QT 13, hoặc tranh mặc định "Sài Gòn tím") + lời chào + nút mã/điểm.
import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Icon, T } from '@/components/ui';
import { Float, pressScale, useReducedMotion } from '@/components/motion';
import { colors, radius } from '@/theme/tokens';

const VB_W = 390;
const VB_H = 220;

/** Tranh nền tĩnh (trời, chân trời thành phố, đường). Neo góc dưới phải như `xMaxYMax slice`. */
const CityArt = memo(function CityArt() {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.coverSkyTop} />
          <Stop offset="1" stopColor={colors.coverSkyBottom} />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.82" cy="0.18" r="0.55">
          <Stop offset="0" stopColor={colors.coverGlow} stopOpacity={0.75} />
          <Stop offset="1" stopColor={colors.coverGlow} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.coverRoadTop} />
          <Stop offset="1" stopColor={colors.coverRoadBottom} />
        </LinearGradient>
      </Defs>
      <Rect width={VB_W} height={VB_H} fill="url(#sky)" />
      <Rect width={VB_W} height={VB_H} fill="url(#glow)" />
      <Circle cx={-10} cy={210} r={90} fill="none" stroke={colors.coverRing} strokeWidth={1.5} opacity={0.5} />
      <Circle cx={-10} cy={210} r={130} fill="none" stroke={colors.coverRing} strokeWidth={1} opacity={0.35} />
      <G fill={colors.white} opacity={0.7}>
        <Circle cx={232} cy={22} r={1.4} />
        <Circle cx={300} cy={14} r={1.1} />
        <Circle cx={366} cy={40} r={1.3} />
        <Circle cx={186} cy={44} r={1} />
      </G>
      <G transform="translate(0 -22)">
        <G fill={colors.coverBack}>
          <Rect x={196} y={120} width={22} height={58} rx={2} />
          <Rect x={222} y={102} width={18} height={76} rx={2} />
          <Rect x={286} y={92} width={20} height={86} rx={2} />
          <Rect x={366} y={108} width={24} height={70} rx={2} />
        </G>
        <Path d="M322 178V70h4V52h4V36h3V22h2l1-10 1 10h2v14h3v16h4v18h4v108Z" fill={colors.coverTower} />
        <Path d="M336 12v166" stroke={colors.coverTowerLine} strokeWidth={1.5} />
        <Path d="M252 178V84c0-9 4-16 8-20l2-6h6l2 6c4 4 8 11 8 20v94Z" fill={colors.coverTower2} />
        <Rect x={274} y={88} width={14} height={4} rx={2} fill={colors.coverTower2} />
        <G fill={colors.coverFront}>
          <Rect x={206} y={140} width={26} height={38} rx={2} />
          <Rect x={236} y={128} width={16} height={50} rx={2} />
          <Rect x={300} y={132} width={20} height={46} rx={2} />
          <Rect x={352} y={126} width={20} height={52} rx={2} />
        </G>
        <G fill={colors.coverWindow} opacity={0.8}>
          {WINDOWS.map(([x, y, w], i) => (
            <Rect key={i} x={x} y={y} width={w} height={3} />
          ))}
        </G>
      </G>
      <Path d="M0 163C110 153 250 155 390 159V220H0Z" fill="url(#road)" />
      <Path d="M0 175C120 166 260 168 390 171" fill="none" stroke={colors.vehicleHeadlight} strokeWidth={2} strokeDasharray="10 9" opacity={0.55} />
    </Svg>
  );
});

const WINDOWS: [number, number, number][] = [
  [326, 80, 2], [331, 80, 2], [341, 80, 2], [326, 96, 2], [336, 96, 2], [341, 110, 2], [331, 124, 2], [326, 138, 2],
  [258, 96, 2], [266, 108, 2], [262, 122, 2], [258, 140, 2], [212, 148, 3], [222, 148, 3], [356, 134, 3], [364, 146, 3],
];

function Bike({ s }: { s: number }) {
  return (
    <Svg width={34 * s} height={22 * s} viewBox="0 -2 34 22">
      <Circle cx={8} cy={16} r={4.5} fill={colors.ink} />
      <Circle cx={30} cy={16} r={4.5} fill={colors.ink} />
      <Path d="M3 13c0-5 3-7 8-7h10c2 0 3 1 3.5 3l1 4Z" fill={colors.vehicleTaillight} />
      <Path d="M26 14c-1-6 1-11 4-14l2 1c-3 4-3 8-2 13Z" fill={colors.vehicleTaillight} />
      <Circle cx={14} cy={1} r={3.2} fill={colors.vehicleHeadlight} />
      <Path d="M11 4h7l1 4h-9Z" fill={colors.white} />
    </Svg>
  );
}

function Car({ s }: { s: number }) {
  return (
    <Svg width={54 * s} height={23 * s} viewBox="0 0 54 23">
      <Path d="M2 14c0-3 2-5 5-5l6-1 6-5c1-1 3-2 5-2h10c2 0 4 1 5 2l6 5 4 1c3 0 4 2 4 5v3H2Z" fill={colors.white} />
      <Path d="M17 8l5-4h6v4Z M31 4h5l5 4H31Z" fill={colors.coverCarGlass} />
      <Circle cx={13} cy={18} r={4.5} fill={colors.ink} />
      <Circle cx={41} cy={18} r={4.5} fill={colors.ink} />
      <Rect x={49} y={11} width={4} height={2.5} rx={1} fill={colors.vehicleHeadlight} />
    </Svg>
  );
}

/** Xe chạy ngang theo đường; giảm chuyển động thì đứng yên ở `restX`. */
function Driving({ width, top, duration, offset, restX, children }: { width: number; top: number; duration: number; offset: number; restX: number; children: React.ReactNode }) {
  const off = useReducedMotion();
  const v = useRef(new Animated.Value(offset)).current;
  useEffect(() => {
    if (off || width <= 0) return;
    let loop: Animated.CompositeAnimation | null = null;
    // Vòng đầu chạy tiếp từ `offset` (hai xe lệch nhau), các vòng sau chạy đủ đường.
    v.setValue(offset);
    const first = Animated.timing(v, { toValue: 1, duration: duration * (1 - offset), easing: Easing.linear, useNativeDriver: true });
    first.start(({ finished }) => {
      if (!finished) return;
      v.setValue(0);
      loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
      loop.start();
    });
    return () => {
      first.stop();
      loop?.stop();
    };
  }, [off, v, width, duration, offset]);
  const x = off ? restX : v.interpolate({ inputRange: [0, 1], outputRange: [-70, width + 10] });
  return <Animated.View style={{ position: 'absolute', top, left: 0, transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

export interface HomeCover {
  imageUrl: string;
  /** Độ mờ lớp phủ tối 0 | 0.2 | 0.4 | 0.6 */
  overlay: number;
}

/** Ảnh bìa: ảnh của quản trị (có lớp phủ) hoặc tranh mặc định có xe chạy, vé trôi. */
export function HomeCoverArt({ cover }: { cover?: HomeCover | null }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  const useImage = !!cover?.imageUrl && !failed;
  // Tỉ lệ và gốc toạ độ của khung 390×220 khi phủ kín và neo góc dưới phải.
  const s = size.w && size.h ? Math.max(size.w / VB_W, size.h / VB_H) : 1;
  const ox = size.w - VB_W * s;
  const oy = size.h - VB_H * s;
  return (
    <View onLayout={onLayout} style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.primary }}>
      {useImage ? (
        <>
          <Image source={{ uri: cover!.imageUrl }} onError={() => setFailed(true)} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          {cover!.overlay > 0 ? (
            <View style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.coverOverlay, opacity: cover!.overlay }} />
          ) : null}
        </>
      ) : (
        <>
          <CityArt />
          {size.w > 0 ? (
            <>
              <Float index={1} style={{ position: 'absolute', left: ox + 298 * s, top: oy + 118 * s, transform: [{ rotate: '-10deg' }] }}>
                <Ticket s={s} />
              </Float>
              <Driving width={size.w} top={oy + 149 * s} duration={9000} offset={0.15} restX={ox + 70 * s}>
                <Bike s={s} />
              </Driving>
              <Driving width={size.w} top={oy + 155 * s} duration={13000} offset={0.55} restX={ox + 270 * s}>
                <Car s={s} />
              </Driving>
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

function Ticket({ s }: { s: number }) {
  return (
    <View style={{ width: 44 * s, height: 24 * s, borderRadius: 3 * s, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', paddingLeft: 4 * s, gap: 3 * s }}>
      <View style={{ width: 6 * s, height: 6 * s, borderRadius: 3 * s, backgroundColor: colors.vehicleHeadlight }} />
      <View style={{ width: 0, height: 18 * s, borderLeftWidth: 1, borderStyle: 'dashed', borderColor: colors.ticketDash }} />
      <T weight={800} size={Math.max(8, 9 * s)} lineHeight={Math.max(10, 11 * s)} color={colors.dealInk}>
        −20K
      </T>
    </View>
  );
}

export interface HomeHeroProps {
  /** "Chào Minh Anh" — rỗng thì chỉ hiện "Xin chào" */
  name: string;
  /** "3 mã · 1.250 điểm" */
  chip: string;
  onChip: () => void;
  cover?: HomeCover | null;
}

/** Dải đầu Trang chủ: lời chào + nút mã/điểm cùng hàng, tiêu đề lớn bên dưới; chừa 44px đáy cho thẻ tìm kiếm đè lên. */
export function HomeHero({ name, chip, onChip, cover, topInset }: HomeHeroProps & { topInset: number }) {
  return (
    <View style={{ paddingTop: topInset, paddingHorizontal: 20, paddingBottom: 68, gap: 6, overflow: 'hidden' }}>
      <HomeCoverArt cover={cover} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T size={14} weight={500} lineHeight={20} color={colors.primarySoft2} numberOfLines={1} style={{ flexShrink: 1 }}>
          {name ? `Chào ${name}` : 'Xin chào'}
        </T>
        <Pressable
          onPress={onChip}
          accessibilityRole="button"
          accessibilityLabel={`${chip}. Mở Ví voucher`}
          style={({ pressed }) => [
            { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.primaryDeep, flexDirection: 'row', alignItems: 'center', gap: 8 },
            pressScale(pressed),
          ]}
        >
          <Icon name="ticket" size={18} color={colors.white} strokeWidth={2} />
          <T weight={700} size={14} lineHeight={18} color={colors.white} numberOfLines={1}>
            {chip}
          </T>
        </Pressable>
      </View>
      <T accessibilityRole="header" weight={800} size={26} lineHeight={32} color={colors.white} style={{ letterSpacing: -0.4 }}>
        Hôm nay đi đâu?
      </T>
    </View>
  );
}
