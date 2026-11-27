// 6 · Xin quyền dữ liệu (QuyenRiengTu-v2). Mở trong luồng bắt đầu (Tiếp tục → Trang chủ)
// hoặc từ Tài khoản / Cài đặt thông báo với `?tu=tai-khoan` (Tiếp tục → quay lại).
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, type Consents } from '@frego/core';
import { BottomBar, Button, ListCard, ScreenHeader, T, Wordmark } from '@/components/ui';
import { resetTo } from '@/components/screens/account/navigation';
import { PageHeading } from '@/components/screens/account/PageHeading';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { SwitchRow } from '@/components/screens/account/SwitchRow';
import { useSettings } from '@/components/screens/account/useSettings';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

type ConsentKey = keyof Omit<Consents, 'userId' | 'updatedAt'>;

const ROWS: { key: ConsentKey; title: string; sub: string }[] = [
  { key: 'location', title: 'Vị trí khi đang dùng app', sub: 'Để điền điểm đón và tính quãng đường.' },
  {
    key: 'shareData',
    title: 'Góp dữ liệu tìm kiếm ẩn danh',
    sub: 'Gộp theo khu vực và khung giờ để giá ước tính sát hơn, không gắn với tên bạn.',
  },
  {
    key: 'personalized',
    title: 'Voucher tặng riêng',
    sub: `Nhãn hàng gần nơi bạn hay đến có thể tặng mã riêng. ${brand.name} không gửi lịch sử chuyến cho nhãn hàng.`,
  },
];

const POLICY_URL = `https://${brand.web.domain}/quyen-rieng-tu`;

export default function QuyenRiengTuScreen() {
  const insets = useSafeAreaInsets();
  const { tu } = useLocalSearchParams<{ tu?: string }>();
  const fromAccount = tu === 'tai-khoan';
  const { status, svc } = useApi();
  const { query, set, saveError } = useSettings<Consents>('consents', () => svc.getConsents(), (patch) => svc.updateConsents(patch));

  if (status === 'signedOut') return <Redirect href="/chao-mung" />;

  const done = () => {
    if (fromAccount) {
      if (router.canGoBack()) router.back();
      else router.replace('/tai-khoan');
    } else {
      resetTo('/');
    }
  };

  const openPolicy = () => {
    WebBrowser.openBrowserAsync(POLICY_URL).catch(() => Linking.openURL(POLICY_URL).catch(() => {}));
  };

  const c = query.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {fromAccount ? <ScreenHeader backLabel="Quay lại Tài khoản" onBack={done} /> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: fromAccount ? 8 : Math.max(insets.top + 12, layout.topInset),
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {fromAccount ? null : <Wordmark size={24} />}
        <PageHeading title={`Bạn chọn chia sẻ gì với ${brand.name}`}>
          Mỗi mục bật, tắt riêng và đổi lại được bất cứ lúc nào trong Tài khoản.
        </PageHeading>
        {c ? (
          <ListCard tone="bg" accessibilityLabel="Quyền dữ liệu">
            {ROWS.map((r) => (
              <SwitchRow key={r.key} title={r.title} sub={r.sub} checked={c[r.key]} onChange={(v) => set({ [r.key]: v })} />
            ))}
          </ListCard>
        ) : query.isError ? (
          <ErrorView onRetry={() => query.refetch()} />
        ) : (
          <LoadingView style={{ flexGrow: 0, paddingVertical: 32 }} />
        )}
        {saveError ? <InlineError text="Chưa lưu được thay đổi. Kiểm tra kết nối rồi bấm lại." /> : null}
        <T size={13} lineHeight={19} color={colors.muted}>
          Tắt cả ba mục, bạn vẫn so giá được bằng cách gõ điểm đón.
        </T>
        <View style={{ flexDirection: 'row' }}>
          <T
            accessibilityRole="link"
            accessibilityHint="Mở trang chính sách dữ liệu trên trình duyệt"
            onPress={openPolicy}
            weight={700}
            size={14}
            lineHeight={19}
            color={colors.primary}
            style={{ minHeight: 44, paddingVertical: 12.5 }}
          >
            Đọc chính sách dữ liệu
          </T>
        </View>
      </ScrollView>
      <BottomBar>
        <Button label="Tiếp tục" onPress={done} />
      </BottomBar>
    </View>
  );
}
