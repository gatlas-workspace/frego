import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandLogo, type CategoryTileKey } from './BrandLogo';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export interface DealRowProps {
  /** Ngành quán → ô màu (design `tile`: cup, book, gym, cake, bowl; core: cafe, tea…). Nhận `DealView.category`. */
  category: CategoryTileKey;
  /** Khu vực, dòng đậm (design `area`), VD "Gần Chợ Bến Thành". */
  area: string;
  /** Tên quán (design `brand`). */
  brand: string;
  /** Loại mã (design `svc`; `DealView.serviceText`), VD "Mã Grab ô tô". */
  serviceText: string;
  /** Số tiền giảm (design `amount`; `DealView.amountText`), VD "−20.000đ". */
  amountText: string;
  /** Lời mời bấm (design `cta`), VD "Đặt xe ›". */
  cta: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** UiDealRow: thẻ ưu đãi điểm đến (trang chủ). Dùng `<DealRow {...deal} onPress={…} />` với `DealView`. */
export function DealRow({ category, area, brand, serviceText, amountText, cta, onPress, style }: DealRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${area}, ${brand}, ${serviceText} ${amountText}. ${cta.replace(/\s*›$/, '')}`}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 12,
          borderRadius: radius.card,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          boxShadow: shadow.card,
        },
        style,
      ]}
    >
      <BrandLogo kind={category} size={60} radius={18} iconSize={30} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T weight={800} size={15} lineHeight={20}>
          {area}
        </T>
        <T weight={600} size={13} lineHeight={18} color={colors.ink2}>
          {brand}
        </T>
        <T size={13} lineHeight={18} color={colors.muted}>
          {serviceText}
        </T>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <View style={{ backgroundColor: colors.deal, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 9 }}>
          <T weight={800} size={13} lineHeight={17} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
            {amountText}
          </T>
        </View>
        <T weight={700} size={13} lineHeight={17} color={colors.primary} numberOfLines={1}>
          {cta}
        </T>
      </View>
    </Pressable>
  );
}
