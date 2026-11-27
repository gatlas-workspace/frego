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
export function GuestPrompt({ onSignIn }: { onSignIn: () => void }) {
  return (
    <Card gap={14}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="user" size={26} color={colors.primary} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={800} size={18} lineHeight={23} accessibilityRole="header">
            Bạn đang xem với tư cách khách
          </T>
          <T size={14} lineHeight={20} color={colors.ink2}>
            Đăng nhập bằng số điện thoại để giữ mã voucher riêng và cộng điểm mỗi lần báo giá.
          </T>
        </View>
      </View>
      <Button label="Đăng nhập bằng số điện thoại" size="md" onPress={onSignIn} />
    </Card>
  );
}
