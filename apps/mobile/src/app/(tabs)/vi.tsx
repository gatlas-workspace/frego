// 5 · Ví voucher (thiết kế ViVoucher-v2.dc.html): ba tab Tặng bạn / Mã công khai / Đã dùng, mở sẵn Mã công khai.
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROVIDER_ORDER, PROVIDERS, type WalletView } from '@frego/core';
import { CodeCard, ListCard, ListRow, Pill, T, Tabs, VoucherTicket, type TabItem } from '@/components/ui';
import { EmptyCard, ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { TextLink } from '@/components/screens/wallet/TextLink';
import { useGiftPush } from '@/components/screens/wallet/useGiftPush';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

type WalletTab = 'gift' | 'public' | 'used';

const TABS: TabItem<WalletTab>[] = [
  { key: 'gift', label: 'Tặng bạn' },
  { key: 'public', label: 'Mã công khai' },
  { key: 'used', label: 'Đã dùng' },
];

const isTab = (v: unknown): v is WalletTab => v === 'gift' || v === 'public' || v === 'used';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { svc } = useApi();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<WalletTab>(isTab(params.tab) ? params.tab : 'public');
  const [fit, setFit] = useState(false);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => svc.getWallet() });
  useGiftPush();

  // Mở Ví từ nơi khác với ?tab=gift (VD sau khi đổi điểm) → chuyển đúng tab.
  useEffect(() => {
    if (isTab(params.tab)) setTab(params.tab);
  }, [params.tab]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top + 12, layout.topInset),
        paddingHorizontal: layout.gutter,
        paddingBottom: 24,
        gap: 16,
      }}
    >
      <View style={{ gap: 6 }}>
        <T variant="tabTitle" accessibilityRole="header" style={{ letterSpacing: -0.5 }}>
          Ví voucher
        </T>
        <T size={14} lineHeight={21} color={colors.ink2}>
          Mã nhãn hàng tặng riêng bạn và mã công khai Frego tổng hợp, luôn kèm nguồn.
        </T>
      </View>
      <Tabs items={TABS} value={tab} onChange={setTab} accessibilityLabel="Loại mã" />
      {wallet.isPending ? (
        <LoadingState label="Đang tải Ví voucher" />
      ) : wallet.isError ? (
        <ErrorState onRetry={() => wallet.refetch()} />
      ) : tab === 'public' ? (
        <PublicTab data={wallet.data} fit={fit} onToggleFit={() => setFit((v) => !v)} />
      ) : tab === 'gift' ? (
        <GiftTab data={wallet.data} />
      ) : (
        <UsedTab data={wallet.data} />
      )}
    </ScrollView>
  );
}

function PublicTab({ data, fit, onToggleFit }: { data: WalletView; fit: boolean; onToggleFit: () => void }) {
  const codes = fit ? data.publicCodes.filter((c) => !c.otherCard) : data.publicCodes;
  const countText = fit ? `${codes.length} mã hợp với bạn` : `${codes.length} mã đang chạy`;
  // Hãng chưa có mã công khai lẫn ưu đãi tự áp (VD Be) → ghi chú nơi xem ưu đãi của hãng.
  const footnote = useMemo(() => {
    const covered = new Set<string>([...data.publicCodes.map((c) => c.logo), ...data.autoPromos.map((p) => p.providerId)]);
    const missing = PROVIDER_ORDER.filter((id) => !covered.has(id)).map((id) => PROVIDERS[id].name);
    const parts = missing.map((n) => `${n} chưa đăng mã công khai, ưu đãi của ${n} hiện sẵn trong mục Khuyến mãi của app ${n}.`);
    return [...parts, 'Mã bị nhiều người báo lỗi sẽ tự ẩn.'].join(' ');
  }, [data]);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <T weight={700} size={13} lineHeight={18} color={colors.ink2} accessibilityLiveRegion="polite" style={{ flexShrink: 1 }}>
          {countText}
        </T>
        <Pill label="Hợp thẻ, ví của tôi" state={fit ? 'selected' : 'default'} onPress={onToggleFit} />
      </View>
      <View accessibilityRole="list" style={{ gap: 12 }}>
        {codes.map((c) => (
          <CodeCard key={c.id} {...c} cta="Chi tiết ›" onPress={() => router.push(`/ma/${c.id}`)} />
        ))}
        {data.autoPromos.map((p) => (
          <CodeCard key={p.providerId} logo={p.providerId} brandLine={p.brandLine} title={p.title} metaText={p.metaText} />
        ))}
      </View>
      {codes.length === 0 && data.autoPromos.length === 0 ? (
        <EmptyCard text={fit ? 'Chưa có mã hợp thẻ, ví của bạn. Liên kết thẻ trong Tài khoản để Frego tự gắn mã.' : 'Chưa có mã công khai nào đang chạy.'} />
      ) : null}
      <T size={13} lineHeight={20} color={colors.muted}>
        {footnote}
      </T>
    </View>
  );
}

function GiftTab({ data }: { data: WalletView }) {
  return (
    <View style={{ gap: 12 }}>
      <T size={14} lineHeight={21} color={colors.ink2}>
        Nhãn hàng tặng riêng khi nơi bạn hay đến nằm gần quán của họ. Mỗi mã chỉ dùng được cho tài khoản của bạn.
      </T>
      {data.gifts.length ? (
        <View accessibilityRole="list" style={{ gap: 12 }}>
          {data.gifts.map((g) => (
            <VoucherTicket key={g.id} {...g} lineIcon="spark" onPress={() => router.push(g.link)} />
          ))}
        </View>
      ) : (
        <EmptyCard text="Chưa có voucher tặng riêng. Khi nơi bạn hay đến nằm gần quán tài trợ, mã sẽ hiện ở đây." />
      )}
      <TextLink
        label="Quản lý dữ liệu dùng để tặng mã"
        onPress={() => router.push('/quyen-rieng-tu?tu=tai-khoan')}
        style={{ alignSelf: 'center' }}
      />
    </View>
  );
}

function UsedTab({ data }: { data: WalletView }) {
  if (!data.used.length) return <EmptyCard text="Chưa có mã nào đã dùng. Mã bạn dùng khi đặt xe sẽ hiện ở đây." />;
  return (
    <ListCard accessibilityLabel="Mã đã dùng">
      {data.used.map((u) => (
        <ListRow key={u.id} lead="none" title={u.title} sub={`${u.serviceText} · ${u.usedText}`} chip={u.amountText} />
      ))}
    </ListCard>
  );
}
