// 0a · Chào mừng (ChaoMung-v2): giới thiệu, cho xem voucher trước, đăng nhập sau.
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, type IconName } from '@frego/core';
import { BottomBar, Button, Icon, T, Wordmark } from '@/components/ui';
import { PageHeading } from '@/components/screens/account/PageHeading';
import { InlineError } from '@/components/screens/account/ScreenState';
import { WelcomeIllustration } from '@/components/screens/account/WelcomeIllustration';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

const POINTS: { icon: IconName; title: string; sub: string }[] = [
  { icon: 'ticket', title: 'Voucher mọi hãng ở một nơi', sub: 'Mã công khai, mã ngân hàng và quà tặng riêng, luôn ghi nguồn.' },
  { icon: 'compare', title: 'Gắn mã rồi mới so giá', sub: 'Giá so sánh là giá sau khi trừ voucher của từng hãng.' },
  { icon: 'gift', title: 'Báo giá thật, nhận thêm voucher', sub: 'Điểm thưởng đổi lấy mã giảm giá.' },
];

export default function ChaoMungScreen() {
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useApi();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const browseFirst = async () => {
    setBusy(true);
    setError(null);
    try {
      await continueAsGuest();
      router.push('/quyen-rieng-tu');
    } catch {
      setError('Chưa mở được chế độ xem trước. Thử lại sau ít phút.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 12, layout.topInset),
          paddingHorizontal: 24,
          paddingBottom: 20,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Wordmark size={24} />
        <WelcomeIllustration />
        <PageHeading title={brand.tagline}>{brand.shortPitch}</PageHeading>
        <View accessibilityRole="list" style={{ gap: 14 }}>
          {POINTS.map((p) => (
            <View key={p.title} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name={p.icon} size={20} color={colors.primary} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <T weight={700} size={15} lineHeight={20}>
                  {p.title}
                </T>
                <T size={13} lineHeight={19} color={colors.muted}>
                  {p.sub}
                </T>
              </View>
            </View>
          ))}
        </View>
        {error ? <InlineError text={error} /> : null}
      </ScrollView>
      <BottomBar gap={4}>
        <Button label="Bắt đầu" onPress={() => router.push('/dang-nhap')} />
        <Button
          label={busy ? 'Đang mở…' : 'Xem voucher trước, đăng nhập sau'}
          variant="text"
          size="sm"
          disabled={busy}
          onPress={browseFirst}
        />
      </BottomBar>
    </View>
  );
}
