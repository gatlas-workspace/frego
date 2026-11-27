import { View, type ViewStyle } from 'react-native';
import { brand, formatDiscountShort, formatVnd } from '@frego/core';
import { DashLine, T } from '@/components/ui';
import { colors, radius, shadow } from '@/theme/tokens';

/** Vé minh họa nghiêng: số giảm trên nền cam, răng cưa, tên dịch vụ + nguồn mã. */
function IlloTicket({ amount, title, sub, style }: { amount: string; title: string; sub: string; style: ViewStyle }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: 228,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: radius.block,
          backgroundColor: colors.surface,
          boxShadow: shadow.illoTicket,
        },
        style,
      ]}
    >
      <View style={{ backgroundColor: colors.deal, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 8 }}>
        <T weight={800} size={16} lineHeight={20} color={colors.dealInk} numberOfLines={1}>
          {amount}
        </T>
      </View>
      <DashLine />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <T weight={800} size={13} lineHeight={17}>
          {title}
        </T>
        <T size={12} lineHeight={16} color={colors.muted}>
          {sub}
        </T>
      </View>
    </View>
  );
}

/**
 * Minh họa màn Chào mừng (0a): khối tím nhạt bo 28, hai vòng trang trí, ba vé voucher nghiêng
 * và thẻ giá "Sau voucher". Trang trí: ẩn với trình đọc màn hình.
 */
export function WelcomeIllustration() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: 212, borderRadius: radius.sheet, backgroundColor: colors.primarySoft, overflow: 'hidden' }}
    >
      {/* Vòng trang trí: tâm (320, 20) r90 và (20, 210) r70 trong khung 342 × 212. */}
      <View
        style={{ position: 'absolute', right: -68, top: -70, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.onPrimarySoft }}
      />
      <View
        style={{ position: 'absolute', left: -50, top: 140, width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primarySoft2 }}
      />
      <IlloTicket
        amount={formatDiscountShort(20000)}
        title="Grab ô tô"
        sub="Quán tặng riêng"
        style={{ left: 16, top: 18, transform: [{ rotate: '-3deg' }] }}
      />
      <IlloTicket
        amount={formatDiscountShort(brand.welcomeAmount)}
        title="Be xe máy"
        sub={`Mã ${brand.welcomeCode}`}
        style={{ left: 40, top: 80, transform: [{ rotate: '2deg' }] }}
      />
      <IlloTicket
        amount={formatDiscountShort(0, 0.25)}
        title="Green SM"
        sub="Tự áp, không cần mã"
        style={{ left: 14, top: 142, transform: [{ rotate: '-2deg' }] }}
      />
      <View
        style={{
          position: 'absolute',
          right: 14,
          top: 58,
          width: 112,
          gap: 2,
          padding: 12,
          borderRadius: 18,
          backgroundColor: colors.primary,
          boxShadow: shadow.illoPrimary,
          transform: [{ rotate: '4deg' }],
        }}
      >
        <T weight={600} size={12} lineHeight={16} color={colors.onPrimarySoft}>
          Sau voucher
        </T>
        {/* Không xuống dòng; được tràn vào phần đệm như thiết kế (nowrap). */}
        <View style={{ marginRight: -12 }}>
          <T weight={800} size={22} lineHeight={25} color={colors.white} numberOfLines={1}>
            {/* Be xe máy 31.000đ (Landmark 81 → Chợ Bến Thành) sau mã chào mừng */}
            {formatVnd(31000 - brand.welcomeAmount)}
          </T>
        </View>
        <T weight={600} size={12} lineHeight={16} color={colors.white}>
          Be xe máy
        </T>
      </View>
    </View>
  );
}
