// Màn 4 · Báo giá thật (thiết kế BaoGia-v2.dc.html). Mở từ thông báo "mã vừa được dùng" (3b).
import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { formatVnd, parseVnd, POINTS_RULES, type PriceVerdict } from '@frego/core';
import { BackButton, Button, Chip, Field, InfoNote, ListRow, ModalSheet, T, VehicleTile } from '@/components/ui';
import { noBreak } from '@/components/screens/flow/noBreak';
import { ErrorState, LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { SkeletonBackdrop } from '@/components/screens/flow/SkeletonBackdrop';
import { VerdictTiles } from '@/components/screens/flow/VerdictTiles';
import { refreshAll, useApi } from '@/lib/api';
import { colors } from '@/theme/tokens';

const VERDICT_TEXT: Record<PriceVerdict, string> = {
  cheaper: 'rẻ hơn ước tính',
  within: 'đúng khoảng ước tính',
  pricier: 'đắt hơn ước tính',
};

/** Thông báo xác nhận: đọc lại cho trình đọc màn hình (role status). */
function Done({ text }: { text: string }) {
  return (
    <View role="status">
      <InfoNote icon="check" text={text} live />
    </View>
  );
}

export default function ReportPriceScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const { svc } = useApi();
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [tapDone, setTapDone] = useState<string | null>(null);
  const [amountDone, setAmountDone] = useState<string | null>(null);

  const trip = useQuery({ queryKey: ['trip', tripId], queryFn: () => svc.getTrip(String(tripId)), enabled: !!tripId });

  const tap = useMutation({
    mutationFn: (verdict: PriceVerdict) => svc.reportPrice(String(tripId), { verdict }),
    onSuccess: (r) => {
      setTapDone(r.held ?? `Cảm ơn bạn! Đã cộng ${r.pointsAwarded} điểm.`);
      refreshAll();
    },
  });
  const sendAmount = useMutation({
    mutationFn: (paidAmount: number) => svc.reportPrice(String(tripId), { paidAmount }),
    onSuccess: (r) => {
      setAmountDone(r.pointsAwarded > 0 ? `Đã nhận số tiền, cộng ${r.pointsAwarded} điểm.` : (r.held ?? 'Đã nhận số tiền.'));
      refreshAll();
    },
  });

  const close = () => router.dismissTo('/');
  const t = trip.data;

  const submitAmount = () => {
    const v = parseVnd(amount);
    if (v === null || v <= 0 || v > 10_000_000) {
      setAmountError('Nhập số tiền đã trả, VD: 24.000');
      return;
    }
    setAmountError(null);
    sendAmount.mutate(v);
  };

  let body: ReactNode;
  if (trip.isPending) {
    body = <LoadingBlocks heights={[28, 90, 96, 116]} />;
  } else if (trip.isError) {
    body = <ErrorState onRetry={() => trip.refetch()} />;
  } else if (!t || !t.providerId || !t.vehicleClass) {
    body = (
      <>
        <InfoNote tone="neutral" icon="info" text="Không tìm thấy chuyến cần báo giá. Có thể chuyến đã được báo trước đó." />
        <Button label="Về trang chủ" variant="secondary" onPress={close} />
      </>
    );
  } else {
    // Nơi chưa có giá ước tính: điểm nhân đôi (như quy tắc điểm), và không có mốc để so một chạm.
    const hasEstimate = t.trip.estimateLow !== null && t.trip.estimateHigh !== null;
    const mult = hasEstimate ? 1 : POINTS_RULES.noDataMultiplier;
    const verdict = t.trip.verdict;
    const paid = t.trip.paidAmount;

    body = (
      <>
        <View style={{ gap: 12 }}>
          <T weight={800} size={22} lineHeight={28} style={{ letterSpacing: -0.3 }} accessibilityRole="header">
            {hasEstimate ? `Giá trong app ${t.providerName} so với ước tính?` : `Chuyến ${t.providerName} hết bao nhiêu tiền?`}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <VehicleTile brand={t.providerId} kind={t.vehicleClass} />
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T weight={700} size={15} lineHeight={20}>
                {t.serviceLine}
              </T>
              <T size={14} lineHeight={20} color={colors.ink2}>
                {hasEstimate ? (
                  <>
                    Frego ước tính sau mã{' '}
                    <T weight={700} size={14} lineHeight={20}>
                      {noBreak(t.estimateText)}
                    </T>
                  </>
                ) : (
                  'Frego chưa có giá ước tính ở khu vực này.'
                )}
              </T>
            </View>
          </View>
        </View>

        {hasEstimate ? (
          tapDone !== null ? (
            <Done text={tapDone} />
          ) : verdict ? (
            <Done text={`Đã ghi nhận: giá thật ${VERDICT_TEXT[verdict]}.`} />
          ) : (
            <View style={{ gap: 8 }}>
              <VerdictTiles onPick={(v) => tap.mutate(v)} disabled={tap.isPending} />
              {tap.isError ? (
                <T size={13} lineHeight={19} color={colors.bad} accessibilityLiveRegion="polite">
                  Chưa gửi được. Thử lại sau giây lát.
                </T>
              ) : (
                <T size={13} lineHeight={19} color={colors.muted}>
                  Một chạm là xong, được cộng {POINTS_RULES.tap * mult} điểm.
                </T>
              )}
            </View>
          )
        ) : null}

        <T weight={800} size={15} lineHeight={20} style={{ marginTop: 4 }}>
          {hasEstimate ? 'Muốn chính xác hơn và nhiều điểm hơn?' : 'Nhập số tiền để giúp mọi người có giá tham khảo'}
        </T>

        {amountDone !== null ? (
          <Done text={amountDone} />
        ) : paid ? (
          <Done text={`Đã nhận số tiền ${formatVnd(paid)}.`} />
        ) : (
          <View style={{ gap: 6 }}>
            <Field
              label="Nhập số tiền bạn đã trả"
              placeholder="VD: 24.000"
              value={amount}
              onChangeText={(s) => {
                setAmount(s);
                if (amountError) setAmountError(null);
              }}
              inputMode="numeric"
              suffix="đ"
              help={`Số tiền sau khi trừ mã, xem trong lịch sử chuyến của app ${t.providerName}.`}
              helpPosition="top"
              action="Gửi"
              actionBadge={`+${POINTS_RULES.amount * mult} điểm`}
              onAction={submitAmount}
              actionDisabled={sendAmount.isPending}
              onSubmitEditing={submitAmount}
              returnKeyType="send"
            />
            {amountError || sendAmount.isError ? (
              <T size={13} lineHeight={19} color={colors.bad} accessibilityLiveRegion="polite">
                {amountError ?? 'Chưa gửi được. Thử lại sau giây lát.'}
              </T>
            ) : null}
          </View>
        )}

        <ListRow
          icon="mail"
          title="Tự lấy giá từ biên nhận email"
          sub="Bật một lần, mỗi chuyến có biên nhận sẽ tự được ghi nhận."
          subWrap
          trail="chev"
          onPress={() => router.push('/lien-ket')}
          style={{ backgroundColor: colors.surfaceAlt, borderRadius: 20 }}
        />
        <Button label="Xem điểm và đổi voucher" variant="text" size="md" onPress={() => router.push('/diem-thuong')} />
      </>
    );
  }

  return (
    <ModalSheet backdrop={<SkeletonBackdrop />} gap={16} scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {t ? <Chip text={t.codeUsedChip} tone="tint" style={{ flexShrink: 1 }} /> : <View />}
        <BackButton variant="soft" icon="close" onPress={close} accessibilityLabel="Bỏ qua" />
      </View>
      {body}
    </ModalSheet>
  );
}
