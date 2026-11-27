import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { ProviderId, VehicleClass } from '@frego/core';
import { BrandLogo } from './BrandLogo';
import { colors, radius } from '@/theme/tokens';

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
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
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
          <Path
            d="M10 42 C10 36 14 33 20 32 L32 30 L44 19 C47 16.5 50.5 15 54.5 15 L77 15 C81 15 84.5 16.5 87.5 19 L99 30 L106 31.5 C111 32.5 114 36 114 41 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z"
            fill={color}
          />
          <Path d="M47.5 30 L56 20.5 C57 19.4 58.4 18.8 59.9 18.8 L64 18.8 L64 30 Z" fill={colors.vehicleGlass} />
          <Path d="M68 18.8 L76.5 18.8 C78.4 18.8 80.2 19.6 81.4 21 L90 30 L68 30 Z" fill={colors.vehicleGlass} />
          <Rect x={104} y={35} width={7} height={4} rx={2} fill={colors.vehicleHeadlight} />
          <Rect x={12} y={35} width={5} height={4} rx={2} fill={colors.vehicleTaillight} />
          <Circle cx={32} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={32} cy={51} r={4} fill={colors.vehicleHub} />
          <Circle cx={92} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={92} cy={51} r={4} fill={colors.vehicleHub} />
        </>
      ) : (
        <>
          <Ellipse cx={62} cy={58} rx={50} ry={3.5} fill={colors.vehicleShadow} />
          <Path
            d="M10 44 C10 38 13 34 19 33 L28 31 L36 17 C38 14 41 12.5 44.5 12.5 L90 12.5 C94 12.5 97 14.5 98.5 17.5 L104 31 L107 32 C112 33.5 114 37 114 42 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z"
            fill={color}
          />
          <Path d="M39 30 L45 17 L60 17 L60 30 Z" fill={colors.vehicleGlass} />
          <Path d="M64 17 L80 17 L80 30 L64 30 Z" fill={colors.vehicleGlass} />
          <Path d="M84 17 L92 17 C94 17 95 18 95.8 19.5 L100 30 L84 30 Z" fill={colors.vehicleGlass} />
          <Rect x={104} y={35} width={7} height={4} rx={2} fill={colors.vehicleHeadlight} />
          <Rect x={12} y={35} width={5} height={4} rx={2} fill={colors.vehicleTaillight} />
          <Circle cx={32} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={32} cy={51} r={4} fill={colors.vehicleHub} />
          <Circle cx={92} cy={51} r={9.5} fill={colors.vehicleDark} />
          <Circle cx={92} cy={51} r={4} fill={colors.vehicleHub} />
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
