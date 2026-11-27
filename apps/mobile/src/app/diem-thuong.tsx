// 7 · Điểm thưởng (thiết kế DiemThuong-v2.dc.html): điểm cộng khi báo giá, đổi thành voucher.
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { RewardView } from '@frego/core';
import { Button, InfoNote, ListCard, ListRow, ModalSheet, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { PointsHero } from '@/components/screens/wallet/PointsHero';
import { ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { RewardTicket } from '@/components/screens/wallet/RewardTicket';
import { StatusRow } from '@/components/screens/wallet/StatusRow';
import { refreshAll, useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

const EARN = [
  { key: 'quick', title: 'Trả lời nhanh giá thật sau chuyến', sub: 'Một chạm: rẻ hơn, đúng khoảng hay đắt hơn', chip: '+10' },
  { key: 'amount', title: 'Nhập số tiền đã trả', sub: 'Xem trong lịch sử chuyến của app hãng', chip: '+50' },
  { key: 'new', title: 'Báo giá ở nơi chưa có dữ liệu', sub: 'Ví dụ Green SM khi chưa có bảng giá', chip: 'x2' },
];

export default function PointsScreen() {
  const { svc } = useApi();
  const q = useQuery({ queryKey: ['points'], queryFn: () => svc.getPoints() });
  /** Quà đã đổi trong lần mở màn này (hiện nhãn "Đã đổi") và lời xác nhận gần nhất. */
  const [redeemed, setRedeemed] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState<string | null>(null);
  /** Hỏi lại trước khi trừ điểm (27/11/2026): điểm đã đổi không hoàn lại. */
  const [ask, setAsk] = useState<RewardView | null>(null);
  // Đóng hộp sau cú bấm (tránh "click" rơi xuống nút Đổi nằm dưới).
  const closeAsk = () => setTimeout(() => setAsk(null), 80);
  const redeem = useMutation({
    mutationFn: (r: RewardView) => svc.redeemReward(r.id),
    onSuccess: (_res, r) => {
      setRedeemed((ids) => (ids.includes(r.id) ? ids : [...ids, r.id]));
      setConfirmText(`Đã thêm voucher ${r.serviceText} ${r.amountText} vào Ví.`);
      refreshAll();
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Điểm thưởng" />
      {q.isPending ? (
        <LoadingState label="Đang tải điểm thưởng" />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
          <ErrorState onRetry={() => q.refetch()} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 4, paddingHorizontal: layout.gutter, paddingBottom: 28, gap: 18 }}
        >
          <PointsHero pointsText={q.data.pointsText} progress={q.data.progress} progressText={q.data.progressText} />

          {confirmText ? <StatusRow text={confirmText} actionLabel="Mở Ví" onAction={() => router.dismissTo('/vi?tab=gift')} /> : null}
          {redeem.isError ? (
            <InfoNote
              tone="deal"
              icon="info"
              text={redeem.error instanceof Error && redeem.error.message ? `Chưa đổi được: ${redeem.error.message}.` : 'Chưa đổi được. Thử lại sau ít phút.'}
              live
            />
          ) : null}

          <View style={{ gap: 12 }}>
            <SectionTitle text="Đổi điểm lấy voucher" />
            <View accessibilityRole="list" style={{ gap: 12 }}>
              {q.data.rewards.map((r) => (
                <RewardTicket
                  key={r.id}
                  reward={r}
                  redeemed={redeemed.includes(r.id)}
                  busy={redeem.isPending}
                  onRedeem={() => setAsk(r)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <SectionTitle text="Cách kiếm điểm" />
            <ListCard accessibilityLabel="Cách kiếm điểm">
              {EARN.map((e) => (
                <ListRow key={e.key} lead="none" title={e.title} sub={e.sub} subWrap chip={e.chip} chipTone="tint" />
              ))}
            </ListCard>
          </View>

          <T size={13} lineHeight={20} color={colors.muted}>
            Điểm không đổi ra tiền mặt. Voucher đổi từ điểm do Frego tài trợ, dùng như mã thường.
          </T>
        </ScrollView>
      )}
      {ask ? (
        <ModalSheet onDismiss={closeAsk} dismissLabel="Để sau" gap={14}>
          <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
            {`Đổi ${ask.costText} lấy voucher ${ask.serviceText} ${ask.amountText}?`}
          </T>
          <T size={15} lineHeight={22} color={colors.ink2}>
            Voucher vào Ví ngay. Điểm đã đổi không hoàn lại được.
          </T>
          <Button
            label="Đổi điểm"
            onPress={() => {
              redeem.mutate(ask);
              closeAsk();
            }}
          />
          <Button label="Để sau" variant="ghost" onPress={closeAsk} />
        </ModalSheet>
      ) : null}
    </View>
  );
}
