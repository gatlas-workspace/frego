// Màn 2b · So giá sau voucher (thiết kế ChonHang-v2.dc.html)
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { VEHICLE_TABS, type PriceRow } from '@frego/core';
import { Icon, InfoNote, PriceRowCard, SectionTitle, Sheet, T, Tabs } from '@/components/ui';
import { MapHeader } from '@/components/screens/flow/MapHeader';
import { ErrorState, LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { refreshAll, useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors, HIT, radius } from '@/theme/tokens';

export default function CompareScreen() {
  const { svc } = useApi();
  const { plan, selection, vehicleClass, setVehicleClass, setOpenView } = useTripFlow();

  const comparison = useQuery({
    queryKey: ['compare', plan?.dest.id, plan?.at, selection, vehicleClass],
    queryFn: () => svc.compare(plan!, selection, vehicleClass),
    enabled: !!plan,
    placeholderData: keepPreviousData,
  });

  const open = useMutation({
    mutationFn: (row: PriceRow) => svc.openProvider(plan!, selection, row),
    onSuccess: (view) => {
      setOpenView(view);
      refreshAll();
      router.push('/chuyen/mo-app');
    },
  });

  if (!plan) return <Redirect href="/tim-kiem" />;

  // Luồng thẳng: quay lại luôn là bước gắn voucher (kể cả khi vào từ thẻ tài trợ ở Trang chủ).
  const toAttach = () => router.dismissTo('/chuyen/gan-voucher');
  const c = comparison.data;
  const from = plan.title.split(' → ')[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapHeader from={from} to={plan.dest.name} backLabel="Quay lại bước gắn voucher" onBack={toAttach} />
      <Sheet title={plan.title} subtitle={plan.subtitle} contentStyle={{ paddingTop: 2, paddingBottom: 28, gap: 14 }}>
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
              <PriceRowCard key={r.service} row={r} onPress={() => !open.isPending && open.mutate(r)} />
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
    </View>
  );
}
