import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { ProviderId, VehicleClass } from '@frego/core';
import { BrandLogo } from './BrandLogo';
import { colors, radius } from '@/theme/tokens';
import { svgHidden } from './a11y';

/** Loại xe trong minh họa: xe máy, ô tô 4 chỗ, ô tô 6–7 chỗ. */
export type VehicleKind = 'bike' | 'car' | 'suv';
/** Hãng cho màu thân xe; `other` = tím Frego (tab loại xe). */
export type VehicleBrand = ProviderId | 'other';

/** car4 → car, car7 → suv (core `VehicleClass` → loại minh họa). */
export function vehicleKind(vc: VehicleClass | VehicleKind): VehicleKind {
  if (vc === 'car4') return 'car';
  if (vc === 'car7') return 'suv';
  return vc;
}

export const VEHICLE_COLOR: Record<VehicleBrand, string> = {
  grab: colors.providerGrab,
  be: colors.providerBe,
  gsm: colors.providerGsm,
  other: colors.providerOther,
};

export interface VehicleArtProps {
  kind: VehicleKind;
  /** Màu thân xe (mặc định tím Frego `providerOther`). */
  color?: string;
  /** Rộng (thiết kế: 60 trong ô xe, 56 trong tab). Cao tự tính theo tỉ lệ 120:64. */
  width?: number;
  height?: number;
}

/** Minh họa xe (SVG 120×64) dịch từ thiết kế: xe máy / ô tô / ô tô 7 chỗ. */
export function VehicleArt({ kind, color = colors.providerOther, width = 60, height }: VehicleArtProps) {
  const h = height ?? Math.round((width * 32) / 60);
  return (
    <Svg
      width={width}
      height={h}
      viewBox="0 0 120 64"
      {...svgHidden}
      pointerEvents="none"
    >
      {kind === 'bike' ? (
        <>
          <Ellipse cx={60} cy={58} rx={46} ry={3.5} fill={colors.vehicleShadow} />
          <Circle cx={28} cy={48} r={10} fill={colors.vehicleDark} />
          <Circle cx={28} cy={48} r={4.2} fill={colors.vehicleHub} />
          <Circle cx={94} cy={48} r={10} fill={colors.vehicleDark} />
          <Circle cx={94} cy={48} r={4.2} fill={colors.vehicleHub} />
          <Path d="M14 42 C14 32 21 27 32 27 L56 27 C61 27 63.5 30 64.5 34 L66 42 Z" fill={color} />
          <Path d="M24 26 C24 22 27 20 31 20 L52 20 C55.5 20 58 22.5 58 26 Z" fill={colors.vehicleDark} />
          <Path d="M62 45 L84 45 L86 40 L62 40 Z" fill={colors.vehicleDark} />
          <Path d="M80 45 C78 32 81 20 89 11 L94 13 C88 21 86 32 88 45 Z" fill={color} />
          <Path d="M86 10 L100 7" fill="none" stroke={colors.vehicleDark} strokeWidth={3.5} strokeLinecap="round" />
          <Circle cx={95} cy={16} r={3.2} fill={colors.vehicleHeadlight} />
          <Path d="M84 41 C87 35 101 35 104 41" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </>
      ) : kind === 'car' ? (
        <>
          <Ellipse cx={62} cy={58} rx={50} ry={3.5} fill={colors.vehicleShadow} />
          {/* Lật ngang quanh x = 62 để mũi xe (phần dài) ở bên phải: mọi xe cùng hướng trái → phải. */}
          <G transform="translate(124 0) scale(-1 1)">
            <Path
              d="M10 42 C10 36 14 33 20 32 L32 30 L44 19 C47 16.5 50.5 15 54.5 15 L77 15 C81 15 84.5 16.5 87.5 19 L99 30 L106 31.5 C111 32.5 114 36 114 41 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z"
              fill={color}
            />
            <Path d="M47.5 30 L56 20.5 C57 19.4 58.4 18.8 59.9 18.8 L64 18.8 L64 30 Z" fill={colors.vehicleGlass} />
            <Path d="M68 18.8 L76.5 18.8 C78.4 18.8 80.2 19.6 81.4 21 L90 30 L68 30 Z" fill={colors.vehicleGlass} />
          </G>
          <Rect x={104} y={35} width={7} height={4} rx={2} fill={colors.vehicleHeadlight} />
          <Rect x={12} y={35} width={5} height={4} rx={2} fill={colors.vehicleTaillight} />
          <Circle cx={32} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={32} cy={51} r={4} fill={colors.vehicleHub} />
          <Circle cx={92} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={92} cy={51} r={4} fill={colors.vehicleHub} />
        </>
      ) : (
        // Ô tô 6–7 chỗ: dáng SUV/MPV (Innova, Xpander, Fortuner) — kính trước nghiêng, mui dài, đuôi gần thẳng,
        // 3 ô cửa sổ (ô hông nhỏ cho hàng ghế 3), thanh giá nóc, bánh to: khác hẳn sedan 4 chỗ.
        <>
          <Ellipse cx={62} cy={58} rx={51} ry={3.5} fill={colors.vehicleShadow} />
          <Rect x={24} y={9.5} width={46} height={2.6} rx={1.3} fill={colors.vehicleDark} />
          <Rect x={28} y={11} width={2.4} height={3.5} fill={colors.vehicleDark} />
          <Rect x={64} y={11} width={2.4} height={3.5} fill={colors.vehicleDark} />
          <Path
            d="M10 46 L10 26 C10 20.5 12.5 16.5 17.5 15 C19.5 14.4 21.5 14.2 23.5 14.2 L73 14.2 C76 14.2 78.6 15.3 80.6 17.4 L92.5 29.5 L105 31.4 C110.6 32.3 114 36 114 41 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z"
            fill={color}
          />
          <Path d="M15.5 28 L15.5 22.5 C15.5 20 17.3 18 19.8 18 L31 18 L31 28 Z" fill={colors.vehicleGlass} />
          <Path d="M35 18 L53 18 L53 28 L35 28 Z" fill={colors.vehicleGlass} />
          <Path d="M57 18 L72.5 18 C74.4 18 76.2 18.8 77.5 20.2 L85.5 28 L57 28 Z" fill={colors.vehicleGlass} />
          <Rect x={105} y={34.5} width={7} height={4} rx={2} fill={colors.vehicleHeadlight} />
          <Rect x={11.5} y={31} width={4} height={6} rx={2} fill={colors.vehicleTaillight} />
          <Circle cx={31} cy={50.5} r={10.5} fill={colors.vehicleDark} />
          <Circle cx={31} cy={50.5} r={4.5} fill={colors.vehicleHub} />
          <Circle cx={93} cy={50.5} r={10.5} fill={colors.vehicleDark} />
          <Circle cx={93} cy={50.5} r={4.5} fill={colors.vehicleHub} />
        </>
      )}
    </Svg>
  );
}

export interface VehicleBoxProps {
  /** Hãng: màu thân xe + logo góc (không có logo khi `other`). */
  brand: VehicleBrand;
  /** Loại xe (nhận cả `car4`/`car7` của core). */
  kind: VehicleKind | VehicleClass;
  /** Vị trí logo góc so với ô xe (UiPriceRow: −6; UiVehicleTile: 0 vì ô đã lùi 6px). */
  logoOffset?: number;
  style?: StyleProp<ViewStyle>;
}

/** Ô xám 70×56 có minh họa xe và logo hãng ở góc (dùng trong UiPriceRow). */
export function VehicleBox({ brand, kind, logoOffset = -6, style }: VehicleBoxProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          position: 'relative',
          width: 70,
          height: 56,
          borderRadius: radius.block,
          backgroundColor: colors.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <VehicleArt kind={vehicleKind(kind)} color={VEHICLE_COLOR[brand]} width={60} height={32} />
      {brand !== 'other' ? (
        <BrandLogo kind={brand} size={30} radius={9} frame="badge" style={{ position: 'absolute', left: logoOffset, top: logoOffset }} />
      ) : null}
    </View>
  );
}

export interface VehicleTileProps {
  /** Hãng (design `brand`): `grab` | `be` | `gsm` | `other`. Nhận `RewardView.providerId`. */
  brand: VehicleBrand;
  /** Loại xe (design `kind`): `bike` | `car` | `suv`; nhận cả `car4`/`car7`. */
  kind: VehicleKind | VehicleClass;
  style?: StyleProp<ViewStyle>;
}

/** UiVehicleTile: khối 76×62 = ô xe 70×56 lùi 6px + logo hãng 30px ở góc trên trái. Trang trí. */
export function VehicleTile({ brand, kind, style }: VehicleTileProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'relative', width: 76, height: 62 }, style]}
    >
      <VehicleBox brand={brand} kind={kind} logoOffset={-6} style={{ position: 'absolute', left: 6, top: 6 }} />
    </View>
  );
}
