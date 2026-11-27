import { Image, View } from 'react-native';
import { Button, Card, Icon, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

/** Ảnh hoặc chữ viết tắt trong vòng tròn tím nhạt. */
function Avatar({ initials, uri, size = 56 }: { initials: string; uri?: string | null; size?: number }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessible={false}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft }}
      />
    );
  }
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
    >
      <T weight={800} size={19} lineHeight={24} color={colors.primaryDeep}>
        {initials}
      </T>
    </View>
  );
}

/** Thẻ hồ sơ màn Tài khoản (9): ảnh/chữ viết tắt, tên, số điện thoại đã che. */
export function ProfileCard({ name, phone, initials, avatarUrl }: { name: string; phone: string; initials: string; avatarUrl: string | null }) {
  return (
    <Card accessibilityLabel={`Hồ sơ: ${name}, ${phone}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Avatar initials={initials} uri={avatarUrl} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T weight={800} size={18} lineHeight={23} numberOfLines={1}>
          {name}
        </T>
        <T size={14} lineHeight={19} color={colors.ink2}>
          {phone}
        </T>
      </View>
    </Card>
  );
}

/** Hai thẻ số: Điểm thưởng (tím, bấm sang Điểm thưởng) và Đã tiết kiệm. */
export function StatCards({
  pointsText,
  savedText,
  savedSub,
  onPoints,
}: {
  pointsText: string;
  savedText: string;
  savedSub: string;
  onPoints: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Card
        tone="primary"
        gap={4}
        onPress={onPoints}
        accessibilityLabel={`Điểm thưởng ${pointsText}. Đổi voucher`}
        style={{ flex: 1, minWidth: 0 }}
      >
        <T weight={600} size={13} lineHeight={18} color={colors.onPrimarySoft}>
          Điểm thưởng
        </T>
        <T weight={800} size={26} lineHeight={30} color={colors.white} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
          {pointsText}
        </T>
        <T weight={700} size={13} lineHeight={18} color={colors.white}>
          Đổi voucher ›
        </T>
      </Card>
      <Card gap={4} accessibilityLabel={`Đã tiết kiệm ${savedText} ${savedSub}`} style={{ flex: 1, minWidth: 0 }}>
        <T weight={600} size={13} lineHeight={18} color={colors.muted}>
          Đã tiết kiệm
        </T>
        <T weight={800} size={26} lineHeight={30} color={colors.dealInk} numberOfLines={1} adjustsFontSizeToFit style={{ fontVariant: ['tabular-nums'] }}>
          {savedText}
        </T>
        <T size={13} lineHeight={18} color={colors.muted}>
          {savedSub}
        </T>
      </Card>
    </View>
  );
}

/** Khách chưa đăng nhập: mời đăng nhập bằng số điện thoại thay cho hồ sơ. */
/** Tài khoản khi chưa đăng nhập (UI v3: V3-TaiKhoanKhach.dc.html): thẻ tím nêu lợi ích + nút đăng nhập. */
export function GuestPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <Card tone="primary" padding={18} gap={12}>
      <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: colors.primaryDeep }}>
        <T weight={700} size={12} lineHeight={16} color={colors.white}>
          Đang xem với tư cách khách
        </T>
      </View>
      <T weight={800} size={21} lineHeight={27} color={colors.white} accessibilityRole="header" style={{ letterSpacing: -0.3 }}>
        Đăng nhập để giữ mã và tích điểm
      </T>
      <View style={{ gap: 8 }}>
        {['Quà chào mừng của Frego cho chuyến đầu', 'Mã riêng của quán gần nơi bạn hay đến', 'Báo giá thật để nhận điểm đổi voucher'].map((t) => (
          <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="check" size={16} color={colors.vehicleHeadlight} strokeWidth={2.8} />
            <T size={14} lineHeight={20} color={colors.primarySoft2} style={{ flex: 1 }}>
              {t}
            </T>
          </View>
        ))}
      </View>
      <Button label="Đăng nhập bằng số điện thoại" variant="white" onPress={onSignIn} />
    </Card>
  );
}

/** Thẻ cam "Giới thiệu bạn bè" ở Tài khoản (UI v3). */
export function ReferralCard({ referrer, referee, onPress }: { referrer: number; referee: number; onPress: () => void }) {
  return (
    <Card onPress={onPress} padding={14} accessibilityLabel={`Giới thiệu bạn bè. Bạn cộng ${referrer} điểm, bạn bè cộng ${referee} điểm`} style={{ backgroundColor: colors.deal, borderColor: colors.deal }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="gift" size={20} color={colors.dealInk} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={800} size={15} lineHeight={20}>
            Giới thiệu bạn bè
          </T>
          <T size={13} lineHeight={18} color={colors.ink2}>
            Bạn +{referrer} điểm, bạn bè +{referee} điểm
          </T>
        </View>
        <Icon name="chev" size={18} color={colors.dealInk} strokeWidth={2} />
      </View>
    </Card>
  );
}
