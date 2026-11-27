// 8 · Lịch sử so giá (thiết kế LichSu-v2.dc.html): chuyến chưa báo giá có nút báo ngay.
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { TripHistoryItem } from '@frego/core';
import { ScreenHeader, SectionTitle, Tabs, type TabItem } from '@/components/ui';
import { EmptyCard, ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { TripCard } from '@/components/screens/wallet/TripCard';
import { Rise } from '@/components/motion';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

type Filter = 'all' | 'pending';

/** Gom các chuyến liền nhau cùng nhóm ngày (danh sách đã xếp mới nhất trước). */
function groupTrips(trips: TripHistoryItem[]) {
  const groups: { label: string; items: TripHistoryItem[] }[] = [];
  for (const t of trips) {
    const last = groups[groups.length - 1];
    if (last && last.label === t.group) last.items.push(t);
    else groups.push({ label: t.group, items: [t] });
  }
  return groups;
}

export default function HistoryScreen() {
  const { svc } = useApi();
  const q = useQuery({ queryKey: ['trips'], queryFn: () => svc.listTrips() });
  const [filter, setFilter] = useState<Filter>('all');
  const trips = q.data ?? [];
  const pendingCount = trips.filter((t) => t.status === 'pending').length;
  const tabs: TabItem<Filter>[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chưa báo giá', count: pendingCount },
  ];
  const groups = useMemo(
    () => groupTrips(filter === 'pending' ? trips.filter((t) => t.status === 'pending') : trips),
    [trips, filter],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Lịch sử so giá" />
      <View style={{ paddingHorizontal: layout.gutter, paddingBottom: 8 }}>
        <Tabs items={tabs} value={filter} onChange={setFilter} accessibilityLabel="Lọc chuyến" />
      </View>
      {q.isPending ? (
        <LoadingState label="Đang tải lịch sử so giá" />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: layout.gutter, paddingTop: 8 }}>
          <ErrorState onRetry={() => q.refetch()} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 8, paddingHorizontal: layout.gutter, paddingBottom: 28, gap: 20 }}
        >
          {groups.length === 0 ? (
            <EmptyCard
              text={
                filter === 'pending'
                  ? 'Bạn đã báo giá mọi chuyến. Chuyến mới dùng mã sẽ hiện ở đây.'
                  : 'Chưa có chuyến nào. Mỗi lần so giá sẽ được lưu ở đây.'
              }
            />
          ) : (
            groups.map((g, gi) => (
              <Rise key={g.label} index={gi} style={{ gap: 10 }}>
                <SectionTitle text={g.label} size="sm" />
                {g.items.map((t) => (
                  <TripCard key={t.id} trip={t} onReport={() => router.push(`/bao-gia/${t.id}`)} />
                ))}
              </Rise>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
