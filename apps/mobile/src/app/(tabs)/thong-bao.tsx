// 10 · Trung tâm thông báo (TrungTamThongBao-v2): chấm tím = chưa đọc; mỗi dòng mở đúng màn liên quan.
// Lọc Voucher / Chuyến đi, "Đánh dấu đã đọc hết". Số đỏ trên thanh tab theo query ['unread'].
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NotificationCategory, NotificationView } from '@frego/core';
import { Button, Icon, NotifItem, SectionTitle, T, UnderlineTabs } from '@/components/ui';
import { Rise, pressScale } from '@/components/motion';
import { usePullRefresh } from '@/components/screens/account/usePullRefresh';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { refreshAll, useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

type Filter = 'all' | NotificationCategory;
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'voucher', label: 'Voucher' },
  { key: 'trip', label: 'Chuyến đi' },
];

export default function ThongBaoScreen() {
  const insets = useSafeAreaInsets();
  const { status, svc } = useApi();
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['notifications'], queryFn: () => svc.listNotifications(), enabled: status === 'signedIn' });
  const pull = usePullRefresh(list.refetch);
  const [filter, setFilter] = useState<Filter>('all');
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = list.data ?? [];
  const unread = all.filter((n) => n.unread).length;
  const shown = all.filter((n) => filter === 'all' || n.category === filter);
  const today = shown.filter((n) => n.group === 'today');
  const earlier = shown.filter((n) => n.group === 'earlier');

  /** Đánh dấu đã đọc ngay trên giao diện (số trên tab giảm luôn), rồi lưu. */
  const markLocal = (ids: string[] | 'all') => {
    qc.setQueryData<NotificationView[]>(['notifications'], (prev) =>
      prev?.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, unread: false, readAt: n.readAt ?? new Date().toISOString() } : n)),
    );
    qc.setQueryData<number>(['unread'], (prev) => (ids === 'all' ? 0 : Math.max(0, (prev ?? 0) - ids.length)));
  };

  const readAll = async () => {
    setMarking(true);
    setError(null);
    markLocal('all');
    try {
      await svc.markAllNotificationsRead();
    } catch {
      setError('Chưa đánh dấu được. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setMarking(false);
      refreshAll();
    }
  };

  const open = (n: NotificationView) => {
    if (n.unread) {
      markLocal([n.id]);
      svc
        .markNotificationRead(n.id)
        .catch(() => {})
        .finally(() => refreshAll());
    }
    if (n.link) router.push(n.link);
  };

  const readAllButton = unread > 0 && (
    <Button
      label="Đánh dấu đã đọc hết"
      variant="text"
      size="xs"
      icon="check"
      block={false}
      disabled={marking}
      onPress={readAll}
      style={{ flexShrink: 0 }}
    />
  );

  const group = (id: string, title: string, items: NotificationView[], withAction: boolean) => (
    <View style={{ gap: withAction ? 8 : 10 }}>
      {withAction ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 44 }}>
          <SectionTitle text={title} size="sm" nativeID={id} style={{ flexShrink: 1 }} />
          {readAllButton}
        </View>
      ) : (
        <SectionTitle text={title} size="sm" nativeID={id} />
      )}
      <View accessibilityRole="list" accessibilityLabel={title} style={{ gap: 12 }}>
        {items.map((n, i) => (
          <Rise key={n.id} index={i}>
          <NotifItem
            icon={n.icon}
            tone={n.tone}
            logo={n.logo}
            title={n.title}
            body={n.body}
            metaText={n.metaText}
            cta={n.cta}
            unread={n.unread}
            onPress={() => open(n)}
          />
          </Rise>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Đầu màn v3: nền trắng, tiêu đề + số chưa đọc, nút cài đặt, tab gạch chân */}
      <View style={{ paddingTop: Math.max(insets.top + 12, layout.topInset), paddingHorizontal: 20, gap: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="tabTitle" accessibilityRole="header" style={{ letterSpacing: -0.4 }}>
              Thông báo
            </T>
            {list.data ? (
              <T size={13} lineHeight={18} color={colors.ink2} accessibilityLiveRegion="polite" role="status">
                {unread > 0 ? `${unread} thông báo chưa đọc` : 'Bạn đã đọc hết thông báo.'}
              </T>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/cai-dat-thong-bao')}
            accessibilityRole="button"
            accessibilityLabel="Cài đặt thông báo"
            style={({ pressed }) => [{ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? colors.track : colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, pressScale(pressed)]}
          >
            <Icon name="sliders" size={20} color={colors.ink} strokeWidth={2} />
          </Pressable>
        </View>
        <UnderlineTabs items={FILTERS} value={filter} onChange={setFilter} accessibilityLabel="Lọc thông báo" style={{ justifyContent: 'flex-start', gap: 20 }} />
      </View>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...pull} tintColor={colors.primary} />}
    >
      {error ? <InlineError text={error} /> : null}
      {list.data ? (
        shown.length ? (
          <>
            {today.length ? group('tb-hom-nay', 'Hôm nay', today, true) : null}
            {earlier.length ? group('tb-truoc-do', 'Trước đó', earlier, today.length === 0) : null}
          </>
        ) : (
          <View style={{ paddingVertical: 32, alignItems: 'center', gap: 4 }}>
            <T weight={700} size={15} lineHeight={20} align="center">
              Chưa có thông báo nào
            </T>
            <T size={13} lineHeight={19} color={colors.muted} align="center">
              {filter === 'all'
                ? 'Tin về voucher và chuyến đi sẽ hiện ở đây.'
                : filter === 'voucher'
                  ? 'Tin về voucher mới, mã sắp hết hạn sẽ hiện ở đây.'
                  : 'Tin nhắc báo giá, cộng điểm sau chuyến sẽ hiện ở đây.'}
            </T>
          </View>
        )
      ) : list.isError ? (
        <ErrorView onRetry={() => list.refetch()} />
      ) : (
        <LoadingView style={{ flexGrow: 0, paddingVertical: 40 }} />
      )}
    </ScrollView>
    </View>
  );
}
