// 10b · Cài đặt thông báo (CaiDatThongBao-v2): tin của luồng chính bật sẵn, ưu đãi chung tắt sẵn,
// giờ yên lặng ban đêm. Tắt nhắc báo giá thì nói rõ vẫn báo được trong Lịch sử.
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { brand, type NotificationPrefs } from '@frego/core';
import { Icon, InfoNote, ListCard, ListRow, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { useSettings } from '@/components/screens/account/useSettings';
import { useApi } from '@/lib/api';
import { colors } from '@/theme/tokens';

type PrefKey = keyof Omit<NotificationPrefs, 'userId'>;
type Row = { key: PrefKey; title: string; desc: string };

const VOUCHER_ROWS: Row[] = [
  { key: 'gift', title: 'Voucher tặng riêng', desc: 'Khi quán gần nơi bạn hay đến tặng mã cho bạn.' },
  { key: 'card', title: 'Mã mới hợp thẻ, ví của bạn', desc: 'Chỉ báo mã khớp thẻ, ví bạn đã lưu.' },
  { key: 'expire', title: 'Voucher sắp hết hạn', desc: 'Nhắc trước 3 ngày với mã còn trong Ví.' },
];
const TRIP_ROWS: Row[] = [
  { key: 'report', title: 'Nhắc báo giá sau chuyến', desc: 'Sau khi bạn mở app hãng kèm mã, để bạn báo giá và nhận điểm.' },
  { key: 'points', title: 'Điểm thưởng', desc: 'Khi được cộng điểm hoặc đủ điểm đổi voucher.' },
];
const OTHER_ROWS: Row[] = [
  {
    key: 'promo',
    title: 'Ưu đãi chung của hãng',
    desc: 'Chương trình giảm giá lớn của Grab, Be, Green SM, tối đa 2 tin mỗi tuần.',
  },
  {
    key: 'quiet',
    title: 'Giờ yên lặng',
    desc: `Không gửi tin từ ${brand.quietHours.from} đến ${Number(brand.quietHours.to.split(':')[0])}:${brand.quietHours.to.split(':')[1]} sáng.`,
  },
];

export default function CaiDatThongBaoScreen() {
  const { status, svc } = useApi();
  const { query, set, saveError } = useSettings<NotificationPrefs>(
    'notification-prefs',
    () => svc.getNotificationPrefs(),
    (patch) => svc.updateNotificationPrefs(patch),
  );

  if (status === 'signedOut') return <Redirect href="/chao-mung" />;

  const p = query.data;
  const group = (id: string, title: string, rows: Row[]) =>
    p ? (
      <>
        <SectionTitle text={title} size="sm" nativeID={id} />
        <ListCard divider="sides" accessibilityLabel={title}>
          {rows.map((r) => (
            <ListRow key={r.key} lead="none" title={r.title} sub={r.desc} subWrap trail="toggle" checked={p[r.key]} onPress={() => set({ [r.key]: !p[r.key] })} />
          ))}
        </ListCard>
      </>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Cài đặt thông báo" backLabel="Quay lại Tài khoản" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 28, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <T size={14} lineHeight={21} color={colors.ink2}>
          Chọn loại tin gửi lên điện thoại. Tin đã tắt vẫn nằm trong mục Thông báo để bạn xem lại.
        </T>
        <InfoNote icon="bell" title="Thông báo đang bật trên điện thoại này" text="Muốn tắt hẳn, vào Cài đặt của điện thoại." />
        {saveError ? <InlineError text="Chưa lưu được thay đổi. Kiểm tra kết nối rồi bấm lại." /> : null}
        {p ? (
          <>
            <View style={{ gap: 10 }}>
              {group('nhom-voucher', 'Voucher', VOUCHER_ROWS)}
              <Pressable
                onPress={() => router.push('/quyen-rieng-tu?tu=tai-khoan')}
                accessibilityRole="link"
                accessibilityLabel="Voucher tặng riêng chỉ có khi bạn bật mục này trong Quyền dữ liệu. Mở Quyền dữ liệu"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                  paddingHorizontal: 4,
                  borderRadius: 12,
                  backgroundColor: pressed ? colors.primarySoft : 'transparent',
                })}
              >
                <T weight={700} size={13} lineHeight={19} color={colors.primary} style={{ flex: 1, minWidth: 0 }}>
                  Voucher tặng riêng chỉ có khi bạn bật mục này trong Quyền dữ liệu
                </T>
                <Icon name="chev" size={18} color={colors.primary} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={{ gap: 10 }}>
              {group('nhom-chuyen-di', 'Chuyến đi', TRIP_ROWS)}
              {!p.report ? (
                <T size={13} lineHeight={19} color={colors.muted} accessibilityLiveRegion="polite">
                  Tắt nhắc báo giá, bạn vẫn báo giá được trong Lịch sử so giá.
                </T>
              ) : null}
            </View>
            <View style={{ gap: 10 }}>{group('nhom-khac', 'Khác', OTHER_ROWS)}</View>
          </>
        ) : query.isError ? (
          <ErrorView onRetry={() => query.refetch()} />
        ) : (
          <LoadingView style={{ flexGrow: 0, paddingVertical: 40 }} />
        )}
      </ScrollView>
    </View>
  );
}
