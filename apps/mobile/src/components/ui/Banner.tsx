import { router } from 'expo-router';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BrandLogo } from './BrandLogo';
import { DashLine } from './Dash';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export interface BannerProps {
  /** Nhãn viên trắng (design `chip`), VD "Quà chào mừng". */
  chip: string;
  /** Tiêu đề 19/800 (design `title`). */
  title: string;
  /** Dòng phụ (design `sub`). */
  sub: string;
  /** Số tiền trên vé nghiêng (design `ticketAmount`), VD "−10K". */
  ticketAmount: string;
  /** Dịch vụ trên vé (design `ticketService`), VD "Be xe máy". */
  ticketService: string;
  /** Đường dẫn expo-router khi bấm (nhận `BannerView.link`). Bỏ qua nếu có `onPress`. */
  link?: string;
  onPress?: () => void;
  /** Số chấm trang (mặc định 3) và chấm đang chọn (mặc định 0). */
  pageCount?: number;
  pageIndex?: number;
  style?: StyleProp<ViewStyle>;
}

/** UiBanner: thẻ quảng bá cao 156 trên trang chủ (nền tím, vé nghiêng bên phải). Nhận thẳng `BannerView`. */
export function Banner({ chip, title, sub, ticketAmount, ticketService, link, onPress, pageCount = 3, pageIndex = 0, style }: BannerProps) {
  const press = onPress ?? (link ? () => router.push(link) : undefined);
  return (
    <Pressable
      onPress={press}
      disabled={!press}
      accessibilityRole="button"
      accessibilityLabel={`${chip}. ${title}. ${sub}`}
      style={({ pressed }) => [
        {
          height: 156,
          borderRadius: radius.card,
          overflow: 'hidden',
          backgroundColor: pressed ? colors.primaryDeep : colors.primary,
          paddingVertical: 16,
          paddingHorizontal: 20,
        },
        style,
      ]}
    >
      {/* Hai vòng trang trí, neo theo cạnh phải như khung 350 của thiết kế */}
      <Svg width={350} height={156} viewBox="0 0 350 156" style={{ position: 'absolute', right: 0, top: 0 }} pointerEvents="none">
        <Circle cx={318} cy={6} r={92} fill={colors.bannerCircle1} />
        <Circle cx={292} cy={160} r={62} fill={colors.bannerCircle2} />
      </Svg>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 8,
          top: 52,
          width: 108,
          height: 58,
          borderRadius: radius.small,
          backgroundColor: colors.bannerCircle2,
          transform: [{ rotate: '10deg' }],
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 16,
          top: 40,
          width: 112,
          borderRadius: radius.small,
          backgroundColor: colors.surface,
          boxShadow: shadow.bannerTicket,
          transform: [{ rotate: '-8deg' }],
        }}
      >
        <View style={{ flexDirection: 'row', borderRadius: radius.small, overflow: 'hidden' }}>
          <View style={{ width: 38, paddingVertical: 16, backgroundColor: colors.deal, alignItems: 'center', justifyContent: 'center' }}>
            <BrandLogo kind="frego" size={24} radius={8} fontSize={13} />
          </View>
          <DashLine />
          <View
            style={{
              flex: 1,
              minWidth: 0,
              paddingTop: 6,
              paddingBottom: 6,
              paddingLeft: 7,
              paddingRight: 4,
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <T weight={800} size={16} lineHeight={19} color={colors.dealInk} numberOfLines={1}>
              {ticketAmount}
            </T>
            <T weight={600} size={12} lineHeight={16} color={colors.ink2} numberOfLines={1}>
              {ticketService}
            </T>
          </View>
        </View>
      </View>
      <View style={{ width: 204, height: '100%', alignItems: 'flex-start', gap: 6 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 10 }}>
          <T weight={800} size={12} lineHeight={16} color={colors.primaryDeep} numberOfLines={1}>
            {chip}
          </T>
        </View>
        <T weight={800} size={19} lineHeight={23} color={colors.white} style={{ letterSpacing: -0.3 }}>
          {title}
        </T>
        <T size={13} lineHeight={18} color={colors.onPrimarySoft}>
          {sub}
        </T>
        {pageCount > 1 ? (
          <View
            style={{ marginTop: 'auto', flexDirection: 'row', gap: 5 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {Array.from({ length: pageCount }, (_, i) => (
              <View
                key={i}
                style={
                  i === pageIndex
                    ? { width: 18, height: 6, borderRadius: 3, backgroundColor: colors.white }
                    : { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onPrimarySoft, opacity: 0.6 }
                }
              />
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
