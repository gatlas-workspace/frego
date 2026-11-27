// 5b · Voucher tặng riêng (thiết kế ChiTietVoucher-v2.dc.html).
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import type { VoucherDetailView } from '@frego/core';
import { BottomBar, Button, Card, Icon, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { AreaMap } from '@/components/screens/wallet/AreaMap';
import { CodeBox } from '@/components/screens/wallet/CodeBox';
import { BulletList, IconList } from '@/components/screens/wallet/DetailList';
import { EmptyCard, ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { TextLink } from '@/components/screens/wallet/TextLink';
import { VoucherHero } from '@/components/screens/wallet/VoucherHero';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

const backToWallet = () => router.dismissTo('/vi');

/** Nơi người nhận hay đến (vẽ trên bản đồ): lấy từ ghi chú "…hay đến khu X" hoặc địa chỉ "…gần X". */
function placeFrom(d: VoucherDetailView): string | null {
  if (d.landmark) return d.landmark;
  const fromNote = /khu\s+(.+?)\.?$/i.exec(d.voucher.note)?.[1];
  if (fromNote) return fromNote.trim();
  const fromAddress = /gần\s+([^,]+)/i.exec(d.businessAddress)?.[1];
  return fromAddress ? fromAddress.trim() : null;
}

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { svc } = useApi();
  const q = useQuery({ queryKey: ['voucher', id], queryFn: () => svc.getVoucher(String(id)), enabled: !!id });
  const d = q.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Voucher tặng riêng" backLabel="Quay lại Ví voucher" onBack={backToWallet} />
      {q.isPending ? (
        <LoadingState label="Đang tải voucher" />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
          <ErrorState onRetry={() => q.refetch()} />
        </View>
      ) : !d ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
          <EmptyCard text="Không tìm thấy voucher này. Có thể mã đã hết hạn hoặc thuộc tài khoản khác.">
            <Button label="Về Ví voucher" variant="secondary" size="sm" block={false} onPress={backToWallet} />
          </EmptyCard>
        </View>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 4, paddingHorizontal: layout.gutter, paddingBottom: 24, gap: 14 }}
          >
            <VoucherHero
              businessName={d.businessName}
              businessAddress={d.businessAddress}
              category={d.category}
              sponsor={d.voucher.source === 'sponsor'}
              amountText={d.amountText}
              serviceText={d.serviceText}
              expiresText={d.expiresText}
            />

            <Card gap={10}>
              <SectionTitle text="Mã riêng của bạn" />
              <CodeBox code={d.voucher.code} />
              <T size={13} lineHeight={20} color={colors.muted}>
                Mã chỉ dùng được 1 lần, cho tài khoản của bạn.
              </T>
            </Card>

            {d.reasons.length ? (
              <Card gap={10}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="spark" size={20} color={colors.primary} strokeWidth={2} />
                  <SectionTitle text="Vì sao bạn được tặng" style={{ flex: 1 }} />
                </View>
                <BulletList items={d.reasons} />
                <T size={13} lineHeight={20} color={colors.muted}>
                  {`Frego tự chọn người nhận từ lịch sử chuyến bạn cho phép dùng. ${d.businessName} chỉ biết số mã đã tặng và đã dùng, không biết bạn là ai.`}
                </T>
                <TextLink
                  label="Quản lý quyền dữ liệu"
                  onPress={() => router.push('/quyen-rieng-tu?tu=tai-khoan')}
                  style={{ alignSelf: 'flex-start' }}
                />
              </Card>
            ) : null}

            {d.area && d.radiusText ? (
              <Card gap={12}>
                <View style={{ gap: 4 }}>
                  <SectionTitle text={`Vùng áp dụng: ${d.radiusText} quanh quán`} />
                  <T size={14} lineHeight={21} color={colors.ink2}>
                    Đặt điểm đến trong vòng tròn là dùng được mã.
                  </T>
                </View>
                <AreaMap businessName={d.businessName} radiusText={d.radiusText} placeLabel={placeFrom(d)} />
              </Card>
            ) : null}

            <Card gap={10}>
              <SectionTitle text="Điều kiện" />
              <IconList items={d.conditions.map((text) => ({ text, icon: 'check' as const }))} />
            </Card>
          </ScrollView>
          <BottomBar>
            <Button label={d.area ? 'Tìm điểm đến trong vùng' : 'So giá và dùng mã'} onPress={() => router.push('/tim-kiem')} />
          </BottomBar>
        </>
      )}
    </View>
  );
}
