// Màn 2b · So giá sau voucher (thiết kế ChonHang-v2.dc.html)
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { VEHICLE_TABS, type PriceRow, type Selection } from '@frego/core';
import { Button, Icon, InfoNote, ModalSheet, PriceRowCard, SectionTitle, Sheet, T, Tabs } from '@/components/ui';
import { MapHeader } from '@/components/screens/flow/MapHeader';
import { ErrorState, LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { refreshAll, useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors, HIT, radius } from '@/theme/tokens';

export default function CompareScreen() {
  const { svc, guest } = useApi();
  const { plan, selection, vehicleClass, setVehicleClass, setOpenView, setSponsorAd } = useTripFlow();
  /** Khách bấm hãng có mã của quán tài trợ: mời đăng nhập (chốt 27/11/2026 — khách không nhận mã của quán). */
  const [askLogin, setAskLogin] = useState<string | null>(null);
  // Đóng hộp sau cú bấm (tránh "click" rơi xuống thẻ hãng nằm dưới).
  const closeAskLogin = () => setTimeout(() => setAskLogin(null), 80);

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
      // Mã gắn ở hãng này là của quán tài trợ → popup quảng cáo trước (màn 2c); lỗi thì bỏ qua, không chặn luồng.
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

  const [mapOpen, setMapOpen] = useState(false);

  if (!plan) return <Redirect href="/tim-kiem" />;

  // Luồng thẳng: quay lại luôn là bước gắn voucher (kể cả khi vào từ thẻ tài trợ ở Trang chủ).
  const toAttach = () => router.dismissTo('/chuyen/gan-voucher');
  const c = comparison.data;
  const from = plan.title.split(' → ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapHeader from={from} to={plan.dest.name} backLabel="Quay lại bước gắn voucher" onBack={toAttach}
        expanded={mapOpen}
        onExpandedChange={setMapOpen}
        onTripChanged={toAttach}
        vehicleClass={vehicleClass}
      />
      <Sheet
        title={plan.title}
        subtitle={plan.subtitle}
        contentStyle={{ paddingTop: 2, paddingBottom: 28, gap: 14 }}
        collapsed={mapOpen}
        onCollapsedChange={setMapOpen}
      >
        {/* Đã gắn N voucher · Đổi */}
        <Pressable
          onPress={toAttach}
          accessibilityRole="button"
          accessibilityLabel={c ? `${c.attachedTitle}: ${c.attachedLine}. Đổi voucher` : 'Đổi voucher'}
          style={({ pressed }) => ({
            minHeight: 60,
            paddingVertical: 8,
            paddingLeft: 14,
            paddingRight: 6,
            borderRadius: radius.block,
            backgroundColor: colors.deal,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Icon name="ticket" size={20} color={colors.dealInk} strokeWidth={1.9} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <T weight={800} size={14} lineHeight={19} color={colors.dealInk}>
              {c?.attachedTitle ?? ' '}
            </T>
            <T weight={600} size={12} lineHeight={16} color={colors.dealInk}>
              {c?.attachedLine ?? ' '}
            </T>
          </View>
          <View style={{ minHeight: HIT, paddingHorizontal: 10, justifyContent: 'center' }}>
            <T weight={800} size={14} lineHeight={19} color={colors.dealInk} style={{ textDecorationLine: 'underline' }}>
              Đổi
            </T>
          </View>
        </Pressable>

        <Tabs
          items={c?.tabs ?? VEHICLE_TABS}
          value={vehicleClass}
          onChange={setVehicleClass}
          accessibilityLabel="Loại xe"
        />

        {c?.peakNote ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ marginTop: 2 }}>
              <Icon name={plan.peak ? 'clock' : 'info'} size={16} color={plan.peak ? colors.amber : colors.muted} strokeWidth={2} />
            </View>
            <T size={13} lineHeight={19} color={colors.ink2} style={{ flex: 1 }}>
              {c.peakNote}
            </T>
          </View>
        ) : null}

        {c?.insight ? (
          <View accessibilityLiveRegion="polite">
            <InfoNote icon="spark" text={c.insight} />
          </View>
        ) : null}

        <SectionTitle text="Giá sau khi trừ voucher" />

        {comparison.isError ? (
          <ErrorState message="Chưa tải được bảng giá. Thử lại sau giây lát." onRetry={() => comparison.refetch()} />
        ) : !c ? (
          <LoadingBlocks heights={[130, 130, 110]} />
        ) : (
          <View accessibilityRole="list" accessibilityLabel="Giá sau voucher theo hãng" style={{ gap: 12, opacity: open.isPending ? 0.6 : 1 }}>
            {c.rows.map((r) => (
              <PriceRowCard
                key={r.service}
                row={r}
                onPress={() => {
                  if (open.isPending) return;
                  if (guest && r.attached?.offer.source === 'sponsor') setAskLogin(r.attached.offer.label);
                  else open.mutate(r);
                }}
              />
            ))}
          </View>
        )}

        {open.isError ? (
          <InfoNote tone="neutral" icon="info" text="Chưa mở được app hãng. Thử lại sau giây lát." live />
        ) : null}

        <T size={13} lineHeight={20} color={colors.muted}>
          Giá sau voucher vẫn là ước tính. Hãng có thể từ chối mã nếu chuyến không đủ điều kiện.
        </T>
      </Sheet>

      {askLogin ? (
        <ModalSheet onDismiss={closeAskLogin} dismissLabel="Đóng, chọn hãng khác" gap={14}>
          <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
            Đăng nhập để nhận mã của quán
          </T>
          <T size={15} lineHeight={22} color={colors.ink2}>
            Mã giảm giá của {askLogin} là quà riêng cho tài khoản đã xác thực số điện thoại. Đăng nhập mất khoảng 30 giây, rồi
            so giá lại để nhận mã. Hãng không có mã của quán thì bạn vẫn mở app được ngay.
          </T>
          <Button
            label="Đăng nhập"
            onPress={() => {
              setAskLogin(null);
              router.push('/dang-nhap');
            }}
          />
          <Button label="Chọn hãng khác" variant="ghost" onPress={closeAskLogin} />
        </ModalSheet>
      ) : null}
    </View>
  );
}
