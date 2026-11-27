// Màn 1 · Trang chủ (thiết kế Main-v2.dc.html)
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Banner, Card, DealRow, Icon, InfoNote, ListCard, ListRow, SectionTitle, Shortcut, T } from '@/components/ui';
import { PickupRow } from '@/components/screens/flow/PickupRow';
import { ErrorState, LoadingBlocks, Skeleton } from '@/components/screens/flow/ScreenState';
import { useStartTrip } from '@/components/screens/flow/useStartTrip';
import { useApi } from '@/lib/api';
import { colors, layout, radius } from '@/theme/tokens';

export default function HomeScreen() {
  const { svc } = useApi();
  const insets = useSafeAreaInsets();
  const home = useQuery({ queryKey: ['home'], queryFn: () => svc.getHome() });
  const { go, goDeal, busyId, error } = useStartTrip();
  const data = home.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top + 8, layout.topInset),
        paddingHorizontal: layout.gutter,
        paddingBottom: 28,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Tiêu đề chỉ cho trình đọc màn hình (h1 ẩn của thiết kế). */}
      <T
        accessibilityRole="header"
        color="transparent"
        style={{ position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'hidden' }}
      >
        Frego – Trang chủ
      </T>

      {home.isPending ? (
        <Skeleton height={156} />
      ) : data?.banner ? (
        <Banner {...data.banner} />
      ) : null}

      {/* Tìm chuyến đi */}
      <Card padding={14} gap={12} accessibilityLabel="Tìm chuyến đi">
        <PickupRow value={data?.originLabel ?? 'Vị trí hiện tại'} style={{ paddingHorizontal: 4 }} />
        <Pressable
          onPress={() => router.push('/tim-kiem')}
          accessibilityRole="button"
          accessibilityLabel="Bạn muốn đi đâu?"
          accessibilityHint="Mở màn chọn điểm đến"
          style={({ pressed }) => ({
            minHeight: 58,
            paddingLeft: 16,
            paddingRight: 14,
            borderRadius: radius.block,
            backgroundColor: pressed ? colors.track : colors.surfaceAlt,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          })}
        >
          <Icon name="pin" size={22} color={colors.primary} strokeWidth={2} />
          <T weight={800} size={18} lineHeight={24} style={{ flex: 1, minWidth: 0, letterSpacing: -0.2 }} numberOfLines={1}>
            Bạn muốn đi đâu?
          </T>
          <Icon name="chev" size={20} color={colors.muted} strokeWidth={2} />
        </Pressable>
      </Card>

      {error ? <InfoNote tone="neutral" icon="info" text={error} live /> : null}

      {home.isError ? (
        <ErrorState onRetry={() => home.refetch()} />
      ) : (
        <>
          {/* Địa điểm đã lưu */}
          <View
            accessibilityRole="toolbar"
            accessibilityLabel="Địa điểm đã lưu"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}
          >
            {(data?.savedPlaces ?? []).map((s) => (
              <Shortcut
                key={s.id}
                label={s.label}
                icon={s.icon}
                onPress={() => go(s.placeId)}
                accessibilityLabel={`Đi tới ${s.label}`}
                style={busyId === s.placeId ? { opacity: 0.5 } : undefined}
              />
            ))}
            <Shortcut
              label="Thêm"
              icon="plus"
              variant="add"
              onPress={() => router.push('/them-dia-diem')}
              accessibilityLabel="Thêm địa điểm đã lưu"
            />
          </View>

          {/* Tìm gần đây */}
          {home.isPending ? (
            <View style={{ gap: 10 }}>
              <SectionTitle text="Tìm gần đây" />
              <LoadingBlocks heights={[136]} />
            </View>
          ) : data && data.recent.length > 0 ? (
            <View style={{ gap: 10 }}>
              <SectionTitle text="Tìm gần đây" />
              <ListCard accessibilityLabel="Tìm gần đây">
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
            </View>
          ) : null}

          {/* Thẻ tài trợ: luôn có nhãn, bấm là đi thẳng tới so giá với mã đó đã gắn */}
          {data && data.deals.length > 0 ? (
            <View style={{ gap: 12 }}>
              <SectionTitle text="Đi đến đây được tặng voucher" tag="Tài trợ" />
              <View accessibilityRole="list" style={{ gap: 12 }}>
                {data.deals.map((d) => (
                  <DealRow
                    key={d.campaignId}
                    category={d.category}
                    area={d.area}
                    brand={d.brand}
                    serviceText={d.serviceText}
                    amountText={d.amountText}
                    cta={d.cta}
                    onPress={() => goDeal(d)}
                    style={busyId === d.campaignId ? { opacity: 0.6 } : undefined}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
