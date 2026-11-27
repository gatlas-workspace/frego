import { Image, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { brand, type CategoryKey, type ProviderId } from '@frego/core';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, shadow } from '@/theme/tokens';

/**
 * Logo dùng chung (UiListRow, UiVoucherTicket, UiCodeCard, UiNotifItem, UiVehicleTile, UiBanner):
 * - logo hãng xe: `grab` | `be` | `gsm` (ảnh từ thiết kế)
 * - logo Frego: `frego` (hoặc `f` như thiết kế) → ô màu chính có chữ "F"
 * - ô ngành của quán: `cafe`/`cup`, `book`, `gym`, `cake`, `bowl`, `tea`/`lotus` → ô màu có icon trắng
 */
export type CategoryTileKey = CategoryKey | 'cup' | 'lotus';
export type BrandLogoKind = ProviderId | 'frego' | 'f' | CategoryTileKey;

const PROVIDER_IMG: Record<ProviderId, ImageSourcePropType> = {
  grab: require('./logos/grab.png'),
  be: require('./logos/be.png'),
  gsm: require('./logos/gsm.png'),
};

/** Icon + màu nền ô ngành (dùng lại cho ghim quán trên bản đồ web). */
export const CATEGORY: Record<CategoryTileKey, { icon: 'cup' | 'book' | 'gym' | 'cake' | 'bowl' | 'lotus'; bg: string }> = {
  cafe: { icon: 'cup', bg: colors.catCafe },
  cup: { icon: 'cup', bg: colors.catCafe },
  book: { icon: 'book', bg: colors.catBook },
  gym: { icon: 'gym', bg: colors.catGym },
  cake: { icon: 'cake', bg: colors.catCake },
  bowl: { icon: 'bowl', bg: colors.catBowl },
  tea: { icon: 'lotus', bg: colors.catTea },
  lotus: { icon: 'lotus', bg: colors.catTea },
};

export function isProvider(kind: string): kind is ProviderId {
  return kind === 'grab' || kind === 'be' || kind === 'gsm';
}

export function isCategoryTile(kind: string): kind is CategoryTileKey {
  return kind in CATEGORY;
}

export interface BrandLogoProps {
  /** Loại logo: hãng (`grab`/`be`/`gsm`), `frego`/`f`, hoặc ngành quán (`cafe`/`cup`, `book`, `gym`, `cake`, `bowl`, `tea`/`lotus`). */
  kind: BrandLogoKind;
  /** Cạnh ô vuông (px). Thiết kế dùng 60 (ưu đãi), 52 (vé), 44 (chi tiết mã), 40 (hàng danh sách), 36 (thẻ mã), 30 (góc ô xe), 24 (banner). */
  size?: number;
  /** Bo góc; mặc định ~30% cạnh (60→18, 40→12, 30→9). */
  radius?: number;
  /**
   * Kiểu khung cho logo hãng:
   * `tile` (mặc định) nền trắng viền 1px #E8EAF2; `badge` viền trắng 2px + bóng (gắn góc ô minh họa xe).
   */
  frame?: 'tile' | 'badge';
  /** Cỡ chữ "F" khi `kind` là frego (mặc định theo cạnh). */
  fontSize?: number;
  /** Cỡ icon ngành (mặc định theo cạnh: 60→30, 52→28, 40→22). */
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}

/** Logo hãng / Frego / ô ngành quán. Trang trí: ẩn với trình đọc màn hình (tên luôn có ở chữ bên cạnh). */
export function BrandLogo({ kind, size = 40, radius, frame = 'tile', fontSize, iconSize, style }: BrandLogoProps) {
  const r = radius ?? Math.round(size * 0.3);
  const hidden = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  if (isProvider(kind)) {
    const badge = frame === 'badge';
    return (
      <View
        {...hidden}
        style={[
          {
            width: size,
            height: size,
            borderRadius: r,
            backgroundColor: colors.surface,
            borderWidth: badge ? 2 : 1,
            borderColor: badge ? colors.surface : colors.line,
            overflow: 'hidden',
          },
          badge && { boxShadow: shadow.logoBadge },
          style,
        ]}
      >
        <Image source={PROVIDER_IMG[kind]} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      </View>
    );
  }

  if (kind === 'frego' || kind === 'f') {
    return (
      <View
        {...hidden}
        style={[
          { width: size, height: size, borderRadius: r, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
          style,
        ]}
      >
        <T weight={800} size={fontSize ?? Math.round(size * 0.46)} color={colors.white}>
          {brand.name.charAt(0)}
        </T>
      </View>
    );
  }

  const cat = CATEGORY[kind];
  const ic = iconSize ?? Math.round(size / 2) + (size < 60 ? 2 : 0);
  return (
    <View
      {...hidden}
      style={[
        { width: size, height: size, borderRadius: r, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Icon name={cat.icon} size={ic} color={colors.white} strokeWidth={1.6} />
    </View>
  );
}

export interface MonoLogoProps {
  /** Chữ viết tắt (design `mono`, VD "VP", "KL", "Mo"). */
  text: string;
  size?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Ô chữ viết tắt nền tối cho ngân hàng, ví (UiListRow lead="mono"). */
export function MonoLogo({ text, size = 40, radius = 12, style }: MonoLogoProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width: size, height: size, borderRadius: radius, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <T weight={800} size={13} color={colors.white}>
        {text}
      </T>
    </View>
  );
}

export interface WordmarkProps {
  /** Cỡ chữ (thiết kế: 24). */
  size?: number;
}

/** Logo chữ hai màu "Fre" + "go" (màn Chào mừng, Quyền dữ liệu). */
export function Wordmark({ size = 24 }: WordmarkProps) {
  const [a, b] = brand.logoParts;
  return (
    <T weight={800} size={size} lineHeight={Math.round(size * 1.3)} style={{ letterSpacing: -0.5 }} accessibilityLabel={brand.name}>
      {a}
      <T weight={800} size={size} lineHeight={Math.round(size * 1.3)} color={colors.primary} style={{ letterSpacing: -0.5 }}>
        {b}
      </T>
    </T>
  );
}
