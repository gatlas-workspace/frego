// Màn 1a · Trang chủ (thiết kế UI v3: V3-TrangChu.dc.html)
import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DealView } from '@frego/core';
import { Card, Icon, InfoNote, ListCard, ListRow, T } from '@/components/ui';
import { Rise, pressScale } from '@/components/motion';
import { PickupRow } from '@/components/screens/flow/PickupRow';
import { ErrorState, LoadingBlocks, Skeleton } from '@/components/screens/flow/ScreenState';
import { useStartTrip } from '@/components/screens/flow/useStartTrip';
import { DEAL_CARD_W, DealCard } from '@/components/screens/home/DealCard';
import { HomeHero } from '@/components/screens/home/HomeHero';
import { useApi } from '@/lib/api';
import { colors, HIT, layout, radius } from '@/theme/tokens';

const DEAL_GAP = 12;

export default function HomeScreen() {
  const { svc } = useApi();
  const insets = useSafeAreaInsets();
  const home = useQuery({ queryKey: ['home'], queryFn: () => svc.getHome() });
  // Ảnh bìa ít đổi: giữ 10 phút, lỗi thì dùng tranh mặc định.
  const cover = useQuery({ queryKey: ['home-cover'], queryFn: () => svc.getHomeCover(), staleTime: 10 * 60_000 });
  const { go, goDeal, busyId, error } = useStartTrip();
  const data = home.data;
  const onDeal = useCallback((d: DealView) => goDeal(d), [goDeal]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <HomeHero
        topInset={Math.max(insets.top + 8, layout.headerTop)}
        name={data?.greetingName ?? ''}
        chip={data?.walletChip ?? 'Ví voucher'}
        onChip={() => router.push('/vi')}
        cover={cover.data ?? null}
      />

      {/* Thẻ tìm chuyến đè lên đáy dải màu */}
      <Rise style={{ marginTop: -44, marginHorizontal: 16 }}>
        <Card padding={8} gap={4} accessibilityLabel="Tìm chuyến đi" style={{ paddingBottom: 14 }}>
          <PickupRow value={data?.originLabel ?? 'Vị trí hiện tại'} style={{ paddingLeft: 12, paddingRight: 4 }} />
          <Pressable
            onPress={() => router.push('/tim-kiem')}
            accessibilityRole="button"
            accessibilityLabel="Bạn muốn đi đâu?"
            accessibilityHint="Mở màn chọn điểm đến"
            style={({ pressed }) => [
              {
                minHeight: 56,
                marginHorizontal: 4,
                paddingHorizontal: 14,
                borderRadius: 14,
                backgroundColor: pressed ? colors.track : colors.surfaceAlt,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              },
              pressScale(pressed),
            ]}
          >
            <Icon name="search" size={22} color={colors.primary} strokeWidth={2.2} />
            <T weight={800} size={17} lineHeight={22} style={{ flex: 1, letterSpacing: -0.2 }} numberOfLines={1}>
              Bạn muốn đi đâu?
            </T>
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="toolbar"
            accessibilityLabel="Địa điểm đã lưu"
            contentContainerStyle={{ gap: 8, paddingTop: 10, paddingHorizontal: 4 }}
          >
            {(data?.savedPlaces ?? []).map((s) => (
              <Pressable
                key={s.id}
                onPress={() => go(s.placeId)}
                disabled={busyId === s.placeId}
                accessibilityRole="button"
                accessibilityLabel={`Đi tới ${s.label}`}
                style={({ pressed }) => [
                  {
                    minHeight: HIT,
                    paddingHorizontal: 14,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: colors.line,
                    backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: busyId === s.placeId ? 0.5 : 1,
                  },
                  pressScale(pressed),
                ]}
              >
                <Icon name={s.icon} size={16} color={colors.ink2} strokeWidth={2} />
                <T weight={600} size={14} lineHeight={18}>
                  {s.label}
                </T>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push('/them-dia-diem')}
              accessibilityRole="button"
              accessibilityLabel="Thêm địa điểm đã lưu"
              style={({ pressed }) => [
                {
                  minWidth: HIT,
                  minHeight: HIT,
                  paddingHorizontal: 12,
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.dash,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                },
              ]}
            >
              <Icon name="plus" size={18} color={colors.primary} strokeWidth={2.2} />
            </Pressable>
          </ScrollView>
        </Card>
      </Rise>

      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 12 }}>
        {error ? <InfoNote tone="neutral" icon="info" text={error} live /> : null}
        {home.isError ? <ErrorState onRetry={() => home.refetch()} /> : null}

        {/* Quà chào mừng / voucher của bạn */}
        {home.isPending ? (
          <Skeleton height={72} />
        ) : data?.banner ? (
          <Rise index={1}>
            <Pressable
              onPress={() => router.push('/vi')}
              accessibilityRole="button"
              accessibilityLabel={`${data.banner.chip}: ${data.banner.title}. ${data.banner.sub}`}
              style={({ pressed }) => [
                {
                  minHeight: 72,
                  padding: 12,
                  paddingRight: 14,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: colors.line,
                  backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                },
                pressScale(pressed),
              ]}
            >
              <View style={{ minWidth: 72, height: 48, paddingHorizontal: 8, borderRadius: 10, backgroundColor: colors.deal, alignItems: 'center', justifyContent: 'center' }}>
                <T weight={800} size={15} lineHeight={19} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
                  {data.banner.ticketAmount}
                </T>
              </View>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <T weight={800} size={14} lineHeight={19} numberOfLines={1}>
                  {data.banner.chip}: {data.banner.ticketService}
                </T>
                <T size={13} lineHeight={18} color={colors.ink2} numberOfLines={2}>
                  {data.banner.sub}
                </T>
              </View>
              <Icon name="chev" size={18} color={colors.muted} strokeWidth={2} />
            </Pressable>
          </Rise>
        ) : null}
      </View>

      {/* Quán tài trợ: thẻ cuộn ngang, dừng đúng mép thẻ */}
      {data && data.deals.length > 0 ? (
        <Rise index={2} style={{ paddingTop: 24, gap: 12 }}>
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <T accessibilityRole="header" weight={800} size={17} lineHeight={22} style={{ flex: 1, letterSpacing: -0.2 }}>
              Đi tới quán này, được tặng mã
            </T>
            <Pressable onPress={() => router.push('/vi')} accessibilityRole="link" style={{ minHeight: HIT, justifyContent: 'center' }}>
              <T weight={700} size={14} lineHeight={18} color={colors.primary}>
                Xem hết
              </T>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={data.deals}
            keyExtractor={(d) => d.campaignId}
            renderItem={({ item }) => <DealCard deal={item} busy={busyId === item.campaignId} onPress={onDeal} />}
            ItemSeparatorComponent={DealGap}
            showsHorizontalScrollIndicator={false}
            snapToInterval={DEAL_CARD_W + DEAL_GAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
            accessibilityRole="list"
          />
        </Rise>
      ) : null}

      {/* Đi lại: tìm gần đây */}
      <View style={{ paddingHorizontal: 16, paddingTop: 24, gap: 10 }}>
        {home.isPending ? (
          <LoadingBlocks heights={[136]} />
        ) : data && data.recent.length > 0 ? (
          <Rise index={3} style={{ gap: 10 }}>
            <T accessibilityRole="header" weight={800} size={17} lineHeight={22} style={{ paddingHorizontal: 4, letterSpacing: -0.2 }}>
              Đi lại
            </T>
            <ListCard accessibilityLabel="Đi lại">
              {data.recent.map((p) => (
                <ListRow
                  key={p.id}
                  icon="clock"
                  title={p.name}
                  sub={p.address}
                  chip={p.voucherChip || undefined}
                  onPress={() => go(p.id)}
                  disabled={busyId === p.id}
                />
              ))}
            </ListCard>
          </Rise>
        ) : null}
      </View>
    </ScrollView>
  );
}

function DealGap() {
  return <View style={{ width: DEAL_GAP }} />;
}
