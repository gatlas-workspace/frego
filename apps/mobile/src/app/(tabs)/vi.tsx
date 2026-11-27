// 3a · Ví voucher (thiết kế UI v3: V3-ViVoucher.dc.html, Ví lần đầu V3-ViTrong.dc.html): tab Tặng bạn / Tại quán / Công khai / Đã dùng.
// Tại quán (27/11/2026): ưu đãi trên banner quán tài trợ đã xem trong ngày, mở lại để đưa nhân viên.
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROVIDER_ORDER, PROVIDERS, type ShopOfferView, type WalletGiftView, type WalletView } from '@frego/core';
import { Button, Card, CodeCard, EmptyState, ListCard, ListRow, Pill, T, UnderlineTabs } from '@/components/ui';
import { GiftTicket } from '@/components/screens/wallet/GiftTicket';
import { Rise } from '@/components/motion';
import { BannerImage } from '@/components/screens/flow/BannerImage';
import { EmptyCard, ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { TextLink } from '@/components/screens/wallet/TextLink';
import { useGiftPush } from '@/components/screens/wallet/useGiftPush';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

type WalletTab = 'gift' | 'shop' | 'public' | 'used';


const isTab = (v: unknown): v is WalletTab => v === 'gift' || v === 'shop' || v === 'public' || v === 'used';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { svc, status } = useApi();
  const params = useLocalSearchParams<{ tab?: string }>();
  // Chưa chọn tab: có mã tặng riêng thì mở "Tặng bạn", không thì "Công khai".
  const [picked, setTab] = useState<WalletTab | null>(isTab(params.tab) ? params.tab : null);
  const [fit, setFit] = useState(false);
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => svc.getWallet() });
  const shop = useQuery({ queryKey: ['shopOffers'], queryFn: () => svc.shopOffers() });
  const me = useQuery({ queryKey: ['me'], queryFn: () => svc.getMe(), enabled: status === 'signedIn' });
  const w = wallet.data;
  const tab: WalletTab = picked ?? (w && w.gifts.length === 0 ? 'public' : 'gift');
  const tabs = [
    { key: 'gift' as const, label: 'Tặng bạn', count: w?.gifts.length },
    { key: 'shop' as const, label: 'Tại quán', count: shop.data?.length },
    { key: 'public' as const, label: 'Công khai', count: w ? w.publicCodes.length : undefined },
    { key: 'used' as const, label: 'Đã dùng' },
  ];
  useGiftPush();

  // Mở Ví từ nơi khác với ?tab=gift (VD sau khi đổi điểm) → chuyển đúng tab.
  useEffect(() => {
    if (isTab(params.tab)) setTab(params.tab);
  }, [params.tab]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: Math.max(insets.top + 12, layout.topInset), paddingHorizontal: layout.gutter, gap: 14, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <T variant="tabTitle" accessibilityRole="header" style={{ letterSpacing: -0.4 }}>
            Ví voucher
          </T>
          {me.data ? (
            <T size={13} lineHeight={18} color={colors.ink2} style={{ marginBottom: 4 }}>
              Đã tiết kiệm{' '}
              <T weight={800} size={13} lineHeight={18}>
                {me.data.savedText}
              </T>
            </T>
          ) : null}
        </View>
        <UnderlineTabs items={tabs} value={tab} onChange={setTab} accessibilityLabel="Loại voucher" />
      </View>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
      {wallet.isPending ? (
        <LoadingState label="Đang tải Ví voucher" />
      ) : wallet.isError ? (
        <ErrorState onRetry={() => wallet.refetch()} />
      ) : tab === 'public' ? (
        <PublicTab data={wallet.data} fit={fit} onToggleFit={() => setFit((v) => !v)} />
      ) : tab === 'gift' ? (
        <GiftTab data={wallet.data} onPublic={() => setTab('public')} />
      ) : tab === 'shop' ? (
        shop.isPending ? (
          <LoadingState label="Đang tải ưu đãi tại quán" />
        ) : shop.isError ? (
          <ErrorState onRetry={() => shop.refetch()} />
        ) : (
          <ShopTab offers={shop.data} />
        )
      ) : (
        <UsedTab data={wallet.data} />
      )}
    </ScrollView>
    </View>
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

const openGift = (g: WalletGiftView) => router.push(g.link);

function GiftTab({ data, onPublic }: { data: WalletView; onPublic: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <T size={14} lineHeight={21} color={colors.ink2}>
        Nhãn hàng tặng riêng khi nơi bạn hay đến nằm gần quán của họ. Mỗi mã chỉ dùng được cho tài khoản của bạn.
      </T>
      {data.gifts.length ? (
        <View accessibilityRole="list" style={{ gap: 12 }}>
          {data.gifts.map((g, i) => (
            <Rise key={g.id} index={i}>
              <GiftTicket gift={g} onPress={openGift} />
            </Rise>
          ))}
        </View>
      ) : (
        <EmptyState title="Chưa có voucher tặng riêng" text="Khi nơi bạn hay đến nằm gần quán tài trợ, mã sẽ hiện ở đây. Trong lúc chờ, bạn vẫn có thể:">
          <ListCard accessibilityLabel="Gợi ý">
            <ListRow icon="ticket" title={`Xem ${data.publicCodes.length} mã công khai`} sub="Mã ngân hàng, ví đang chạy, có ghi nguồn" onPress={onPublic} />
            <ListRow icon="link" title="Liên kết thẻ, ví" sub="Frego tự gắn mã hợp thẻ của bạn khi so giá" onPress={() => router.push('/lien-ket')} />
            <ListRow icon="gift" title="Mời bạn bè" sub="Bạn +200 điểm khi bạn ấy báo giá chuyến đầu" onPress={() => router.push('/gioi-thieu')} />
          </ListCard>
          <Button label="So giá chuyến đầu tiên" onPress={() => router.push('/tim-kiem')} />
        </EmptyState>
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

/** Ưu đãi tại quán: mở lại banner quán đã xem hôm nay để đưa nhân viên khi tới quán. */
function ShopTab({ offers }: { offers: ShopOfferView[] }) {
  return (
    <View style={{ gap: 12 }}>
      <T size={14} lineHeight={21} color={colors.ink2}>
        Ưu đãi quán tặng kèm chuyến xe. Tới quán, mở thẻ này và đưa cho nhân viên.
      </T>
      {offers.length ? (
        offers.map((o) => (
          <Card key={o.tripId} padding={16} gap={12} accessibilityLabel={`Ưu đãi tại ${o.name}: ${o.title}`}>
            <BannerImage uri={o.imageUrl} label={`Ảnh quảng cáo của ${o.name}: ${o.title}`} />
            <View style={{ gap: 4 }}>
              <T weight={800} size={18} lineHeight={24} accessibilityRole="header">
                {o.title}
              </T>
              {o.body ? (
                <T size={14} lineHeight={21} color={colors.ink2}>
                  {o.body}
                </T>
              ) : null}
            </View>
            <View style={{ gap: 2 }}>
              <T weight={700} size={14} lineHeight={20}>
                {o.name}
              </T>
              <T size={13} lineHeight={19} color={colors.muted}>
                {o.address}
              </T>
              <T size={13} lineHeight={19} color={colors.dealInk} weight={600}>
                {o.whenText}
              </T>
            </View>
            <Button
              label="Chỉ đường tới quán"
              variant="outline"
              size="md"
              icon="external"
              onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${o.lat},${o.lng}`).catch(() => {})}
            />
          </Card>
        ))
      ) : (
        <EmptyCard text="Chưa có ưu đãi tại quán hôm nay. Khi bạn đi xe bằng mã của quán tài trợ có ưu đãi, thẻ sẽ được lưu ở đây." />
      )}
    </View>
  );
}
