// Màn 2b · So giá sau voucher (thiết kế UI v3: V3-SoGia.dc.html) + 2c khách cần đăng nhập (V3-YeuCauDangNhap.dc.html)
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { formatTime, VEHICLE_TABS, type PriceRow, type Selection } from '@frego/core';
import { Button, Icon, InfoNote, ModalSheet, Sheet, T } from '@/components/ui';
import { Rise, pressScale } from '@/components/motion';
import { MapHeader } from '@/components/screens/flow/MapHeader';
import { PriceOption } from '@/components/screens/flow/PriceOption';
import { ErrorState, Skeleton } from '@/components/screens/flow/ScreenState';
import { VehicleTabs } from '@/components/screens/flow/VehicleTabs';
import { refreshAll, useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors, HIT, radius } from '@/theme/tokens';

/** Hàng có giá thấp nhất (chỉ đánh dấu khi có từ 2 hãng có giá). */
function cheapestService(rows: PriceRow[]): string | null {
  const priced = rows.filter((r) => r.priced && r.final);
  if (priced.length < 2) return null;
  return priced.reduce((a, b) => (b.final!.low < a.final!.low ? b : a)).service;
}

export default function CompareScreen() {
  const { svc, guest } = useApi();
  const { plan, selection, vehicleClass, setVehicleClass, setOpenView, setSponsorAd } = useTripFlow();
  /** Khách chọn hãng có mã của quán tài trợ: mời đăng nhập (chốt 27/11/2026 — khách không nhận mã của quán). */
  const [askLogin, setAskLogin] = useState<{ shop: string; save: string; service: string } | null>(null);
  // Đóng hộp sau cú bấm (tránh "click" rơi xuống thẻ hãng nằm dưới).
  const closeAskLogin = () => setTimeout(() => setAskLogin(null), 80);
  const [picked, setPicked] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const comparison = useQuery({
    queryKey: ['compare', plan?.dest.id, plan?.at, selection, vehicleClass],
    queryFn: () => svc.compare(plan!, selection, vehicleClass),
    enabled: !!plan,
    placeholderData: keepPreviousData,
  });

  const open = useMutation({
    mutationFn: async (row: PriceRow) => {
      // Khách: bỏ mã của quán tài trợ ở các hãng khác để không phát mã (máy chủ cũng chặn).
      const sel: Selection = guest
        ? Object.fromEntries(
            Object.entries(selection).filter(
              ([, refId]) => plan!.evaluation.eligible.find((e) => e.offer.refId === refId)?.offer.source !== 'sponsor',
            ),
          )
        : selection;
      const view = await svc.openProvider(plan!, sel, row);
      // Mã gắn ở hãng này là của quán tài trợ → popup quảng cáo trước (màn 2d); lỗi thì bỏ qua, không chặn luồng.
      const ad = await svc.sponsorAd(plan!, row).catch(() => null);
      return { view, ad };
    },
    onSuccess: ({ view, ad }) => {
      setOpenView(view);
      setSponsorAd(ad);
      refreshAll();
      router.push(ad ? '/chuyen/quang-cao' : '/chuyen/mo-app');
    },
  });

  const c = comparison.data;
  // Đổi loại xe: dữ liệu cũ còn hiện trong lúc tải → thay bằng khung xương.
  const switching = comparison.isPlaceholderData && comparison.isFetching;
  const rows = useMemo(() => (switching ? [] : c?.rows ?? []), [c, switching]);
  const cheapest = useMemo(() => cheapestService(rows), [rows]);
  const sel = rows.find((r) => r.service === picked) ?? rows.find((r) => r.service === cheapest) ?? rows.find((r) => r.priced) ?? null;
  const onPick = useCallback((r: PriceRow) => setPicked(r.service), []);

  if (!plan) return <Redirect href="/tim-kiem" />;

  // Luồng thẳng: quay lại luôn là bước gắn voucher (kể cả khi vào từ thẻ tài trợ ở Trang chủ).
  const toAttach = () => router.dismissTo('/chuyen/gan-voucher');
  const from = plan.title.split(' → ')[0];
  const arrive = formatTime(new Date(new Date(plan.at).getTime() + plan.minutes * 60_000));

  const go = () => {
    if (!sel || open.isPending) return;
    if (guest && sel.attached?.offer.source === 'sponsor') {
      setAskLogin({ shop: sel.attached.offer.label, save: `${sel.name}`, service: sel.service });
    } else open.mutate(sel);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapHeader
        from={from}
        to={plan.dest.name}
        backLabel="Quay lại bước gắn voucher"
        onBack={toAttach}
        expanded={mapOpen}
        onExpandedChange={setMapOpen}
        onTripChanged={toAttach}
        vehicleClass={vehicleClass}
        focusRefIds={sel?.attached ? [sel.attached.offer.refId] : []}
      />
      <Sheet
        title="Giá đã trừ voucher"
        subtitle={`${plan.subtitle} · tới nơi ~${arrive}`}
        header={<VehicleTabs items={c?.tabs ?? VEHICLE_TABS} value={vehicleClass} onChange={(v) => { setPicked(null); setVehicleClass(v); }} />}
        contentStyle={{ paddingTop: 2, paddingHorizontal: 12, paddingBottom: 16, gap: 6 }}
        collapsed={mapOpen}
        onCollapsedChange={setMapOpen}
        style={{ backgroundColor: colors.surface }}
        footer={
          <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface }}>
            {/* Mã đã gắn · Đổi */}
            <Pressable
              onPress={toAttach}
              accessibilityRole="button"
              accessibilityLabel={c ? `${c.attachedTitle}: ${c.attachedLine}. Đổi voucher` : 'Đổi voucher'}
              style={({ pressed }) => [
                { minHeight: HIT, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.deal, flexDirection: 'row', alignItems: 'center', gap: 8 },
                pressScale(pressed),
              ]}
            >
              <Icon name="ticket" size={16} color={colors.dealInk} strokeWidth={2} />
              <T weight={700} size={13} lineHeight={18} color={colors.dealInk} numberOfLines={1} style={{ flex: 1 }}>
                {c ? `${c.attachedTitle} · ${c.attachedLine}` : ' '}
              </T>
              <T weight={700} size={13} lineHeight={18} color={colors.dealInk} style={{ textDecorationLine: 'underline' }}>
                Đổi
              </T>
            </Pressable>
            {sel ? (
              <Pressable
                onPress={go}
                disabled={open.isPending}
                accessibilityRole="button"
                accessibilityLabel={`Mở app ${sel.name}${sel.priced ? `, ${sel.finalText}` : ''}`}
                style={({ pressed }) => [
                  {
                    minHeight: 56,
                    paddingHorizontal: 18,
                    borderRadius: radius.block,
                    backgroundColor: pressed ? colors.primaryDeep : colors.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    opacity: open.isPending ? 0.6 : 1,
                  },
                  pressScale(pressed),
                ]}
              >
                <T weight={800} size={16} lineHeight={20} color={colors.white}>
                  {open.isPending ? 'Đang mở…' : `Mở app ${sel.name}`}
                </T>
                <T weight={800} size={16} lineHeight={20} color={colors.white} style={{ fontVariant: ['tabular-nums'] }}>
                  {sel.priced ? sel.finalText : 'Xem giá trong app'}
                </T>
              </Pressable>
            ) : (
              <View style={{ minHeight: 56, borderRadius: radius.block, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                <T weight={700} size={15} lineHeight={20} color={colors.ink2}>
                  {c ? 'Chọn một hãng để đặt' : 'Đang tính giá…'}
                </T>
              </View>
            )}
          </View>
        }
      >
        {c?.peakNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4, paddingBottom: 4 }}>
            <View style={{ marginTop: 2 }}>
              <Icon name={plan.peak ? 'clock' : 'info'} size={16} color={plan.peak ? colors.amber : colors.muted} strokeWidth={2} />
            </View>
            <T size={13} lineHeight={19} color={colors.ink2} style={{ flex: 1 }}>
              {c.peakNote}
            </T>
          </View>
        ) : null}

        {comparison.isError ? (
          <ErrorState message="Chưa tải được bảng giá. Thử lại sau giây lát." onRetry={() => comparison.refetch()} />
        ) : !c || switching ? (
          <View accessible accessibilityLabel="Đang tính giá sau voucher" accessibilityLiveRegion="polite" style={{ gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ minHeight: 72, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton height={56} width={70} r={16} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton height={14} width="55%" r={7} />
                  <Skeleton height={11} width="80%" r={6} />
                </View>
                <Skeleton height={18} width={76} r={8} />
              </View>
            ))}
          </View>
        ) : (
          <View accessibilityRole="radiogroup" accessibilityLabel="Hãng xe, giá sau voucher" style={{ gap: 6 }}>
            {rows.map((r, i) => (
              <Rise key={r.service} index={i}>
                <PriceOption row={r} selected={sel?.service === r.service} cheapest={cheapest === r.service} onPress={onPick} />
              </Rise>
            ))}
          </View>
        )}

        {c?.insight ? (
          <View accessibilityLiveRegion="polite" style={{ paddingTop: 6 }}>
            <InfoNote icon="spark" text={c.insight} />
          </View>
        ) : null}
        {open.isError ? <InfoNote tone="neutral" icon="info" text="Chưa mở được app hãng. Thử lại sau giây lát." live /> : null}

        <T size={12} lineHeight={18} color={colors.muted} style={{ paddingHorizontal: 4, paddingTop: 4 }}>
          Giá là ước tính sau voucher; giá cuối cùng do app hãng hiển thị. Hãng có thể từ chối mã nếu chuyến không đủ điều kiện.
        </T>
      </Sheet>

      {askLogin ? (
        <ModalSheet onDismiss={closeAskLogin} dismissLabel="Đóng, chọn hãng khác" gap={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.deal, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="ticket" size={24} color={colors.dealInk} strokeWidth={2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T size={13} lineHeight={18} color={colors.muted}>
                Quà riêng của {askLogin.shop}
              </T>
              <T weight={800} size={17} lineHeight={22} color={colors.dealInk}>
                Mã của quán cho chuyến {askLogin.save}
              </T>
            </View>
          </View>
          <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
            Đăng nhập để nhận mã của quán
          </T>
          <T size={15} lineHeight={22} color={colors.ink2}>
            Mã của quán là quà riêng cho tài khoản đã xác thực số điện thoại. Đăng nhập mất khoảng 30 giây, rồi so giá lại để nhận
            mã.
          </T>
          <View style={{ padding: 12, borderRadius: 14, backgroundColor: colors.bg, gap: 8 }}>
            {['Nhận thêm quà chào mừng của Frego', 'Báo giá thật để tích điểm đổi voucher'].map((t) => (
              <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
                <Icon name="check" size={18} color={colors.primary} strokeWidth={2.6} />
                <T size={14} lineHeight={20} style={{ flex: 1 }}>
                  {t}
                </T>
              </View>
            ))}
          </View>
          <Button
            label="Đăng nhập"
            onPress={() => {
              setAskLogin(null);
              router.push('/dang-nhap');
            }}
          />
          <Button label="Chọn hãng khác" variant="outline" onPress={closeAskLogin} />
          <T size={12} lineHeight={17} color={colors.muted}>
            Hãng không có mã của quán thì bạn vẫn mở app được ngay khi chưa đăng nhập.
          </T>
        </ModalSheet>
      ) : null}
    </View>
  );
}
