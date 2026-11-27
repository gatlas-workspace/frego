// 11 · Liên kết ví, thẻ, ứng dụng (LienKet-v2). Thẻ chỉ chọn ngân hàng + loại thẻ, không nhập số thẻ.
// Ngân hàng, ví: Frego chỉ ghi nhận người dùng có dùng để gợi ý mã hợp.
// Grab / Be / Green SM: "Đã cài app" — chỉ ghi nhận để ưu tiên mã; Frego không kết nối tài khoản hãng.
// Gmail: tự lấy giá từ biên nhận email (lib/gmail.ts). Chưa bật ở máy chủ → "Sắp có"; DEMO → liên kết giả lập, ghi rõ.
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { brand, type GmailSyncResult, type LinkRowView, type ProviderId } from '@frego/core';
import { Button, Chip, InfoNote, ListCard, ListRow, Pill, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { SheetModal } from '@/components/screens/account/SheetModal';
import { refreshAll, useApi } from '@/lib/api';
import { useGmail } from '@/lib/gmail';
import { colors } from '@/theme/tokens';

// Bản web: cửa sổ đăng nhập Google quay về trang này → báo kết quả cho cửa sổ app rồi tự đóng (bản cài: không làm gì).
WebBrowser.maybeCompleteAuthSession();

type CardType = 'credit' | 'debit';
const CARD_TYPES: { key: CardType; label: string }[] = [
  { key: 'credit', label: 'Thẻ tín dụng' },
  { key: 'debit', label: 'Thẻ ghi nợ' },
];

export default function LienKetScreen() {
  const { status, svc } = useApi();
  const links = useQuery({ queryKey: ['links'], queryFn: () => svc.getLinks(), enabled: status === 'signedIn' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unlinkRow, setUnlinkRow] = useState<LinkRowView | null>(null);
  const [bankSheet, setBankSheet] = useState(false);

  if (status === 'signedOut') return <Redirect href="/chao-mung" />;

  const run = async (id: string, job: () => Promise<unknown>, failText: string) => {
    setBusyId(id);
    setError(null);
    try {
      await job();
      await refreshAll();
    } catch {
      setError(failText);
    } finally {
      setBusyId(null);
    }
  };
  const link = (r: LinkRowView, cardType: CardType | null = null) =>
    run(
      r.partnerId,
      () => svc.link(r.partnerId, cardType),
      r.isRideApp ? `Chưa lưu được ${r.name}. Thử lại sau ít phút.` : `Chưa liên kết được ${r.name}. Thử lại sau ít phút.`,
    );
  const unlink = (r: LinkRowView) =>
    run(
      r.partnerId,
      () => svc.unlink(r.partnerId),
      r.isRideApp ? `Chưa bỏ được ${r.name}. Thử lại sau ít phút.` : `Chưa gỡ được liên kết ${r.name}. Thử lại sau ít phút.`,
    );

  const section = (id: string, title: string, rows: LinkRowView[]) => (
    <View style={{ gap: 10 }}>
      <SectionTitle text={title} size="sm" nativeID={id} />
      <ListCard divider="lead" accessibilityLabel={title}>
        {rows.map((r) => (
          <ListRow
            key={r.partnerId}
            lead={r.isRideApp ? 'logo' : 'mono'}
            logo={r.isRideApp ? (r.partnerId as ProviderId) : undefined}
            mono={r.mono}
            title={r.name}
            sub={r.desc}
            subWrap
            trail={r.linked ? 'done' : 'action'}
            actionLabel={r.isRideApp ? 'Có cài' : undefined}
            doneLabel={r.isRideApp ? 'Đã cài app' : undefined}
            onAction={() => link(r)}
            onPress={r.linked ? () => setUnlinkRow(r) : undefined}
            accessibilityHint={r.linked ? (r.isRideApp ? 'Bấm để bỏ đánh dấu đã cài app' : 'Bấm để gỡ liên kết') : undefined}
            disabled={busyId === r.partnerId}
          />
        ))}
      </ListCard>
    </View>
  );

  const d = links.data;
  const ride = !!unlinkRow?.isRideApp;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Liên kết ví, thẻ, ứng dụng" backLabel="Quay lại Tài khoản" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 28, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {d ? (
          <>
            <InfoNote
              icon="link"
              title={d.count > 0 ? `Đang liên kết ${d.count} mục` : 'Chưa liên kết mục nào'}
              text={`${brand.name} dùng các liên kết này để biết mã nào hợp với bạn và tự gắn mã khi so giá.`}
              live
            />
            {error ? <InlineError text={error} /> : null}
            <View style={{ gap: 10 }}>
              {section('lk-the', 'Thẻ ngân hàng', d.cards)}
              <Button label="Thêm thẻ ngân hàng khác" variant="dashed" size="md" icon="plus" onPress={() => setBankSheet(true)} />
              <T size={13} lineHeight={19} color={colors.muted}>
                Chỉ cần chọn ngân hàng và loại thẻ, không nhập số thẻ.
              </T>
            </View>
            {section('lk-vi', 'Ví điện tử', d.wallets)}
            <View style={{ gap: 10 }}>
              {section('lk-app', 'App đặt xe bạn đã cài', d.apps)}
              <T size={13} lineHeight={19} color={colors.muted}>
                {brand.name} chỉ ghi nhận bạn có cài app để ưu tiên mã của hãng đó. {brand.name} không kết nối tài khoản Grab, Be,
                Green SM nên không biết khi nào mã được dùng: giá thật lấy từ biên nhận Gmail hoặc do bạn báo.
              </T>
            </View>
            <GmailSection />
            <T size={13} lineHeight={19} color={colors.muted}>
              {brand.name} chỉ lưu tên ngân hàng, loại thẻ và tên ví, không lưu số thẻ hay mật khẩu. Bạn gỡ liên kết được bất cứ lúc nào.
            </T>
          </>
        ) : links.isError ? (
          <ErrorView onRetry={() => links.refetch()} />
        ) : (
          <LoadingView />
        )}
      </ScrollView>

      <BankSheet
        visible={bankSheet}
        banks={d?.cards ?? []}
        onClose={() => setBankSheet(false)}
        onLink={(r, type) => {
          setBankSheet(false);
          link(r, type);
        }}
      />

      <SheetModal
        visible={!!unlinkRow}
        onClose={() => setUnlinkRow(null)}
        title={unlinkRow ? (ride ? `Bỏ đánh dấu ${unlinkRow.name}?` : `Gỡ liên kết ${unlinkRow.name}?`) : ''}
        subtitle={
          ride
            ? `${brand.name} sẽ không ưu tiên mã ${unlinkRow?.name ?? ''} nữa. Bạn đánh dấu lại được bất cứ lúc nào.`
            : `${brand.name} sẽ không gợi ý mã cần ${unlinkRow?.name ?? ''} nữa. Bạn liên kết lại được bất cứ lúc nào.`
        }
        footer={
          <>
            <Button
              label={ride ? 'Bỏ đánh dấu' : 'Gỡ liên kết'}
              onPress={() => {
                const r = unlinkRow;
                setUnlinkRow(null);
                if (r) unlink(r);
              }}
            />
            <Button label={ride ? 'Giữ' : 'Giữ liên kết'} variant="text" size="sm" onPress={() => setUnlinkRow(null)} />
          </>
        }
      />
    </View>
  );
}

/** Gmail: tự lấy giá từ biên nhận Grab, Be, Green SM. */
function GmailSection() {
  const g = useGmail();
  const [busy, setBusy] = useState<'link' | 'sync' | 'unlink' | null>(null);
  const [message, setMessage] = useState<{ tone: 'tint' | 'neutral'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const st = g.status;
  const demo = g.availability === 'demo';

  const syncText = (r: GmailSyncResult) => {
    const parts =
      r.matched > 0
        ? [`Đã ghi giá ${r.matched} chuyến từ biên nhận${r.pointsAwarded > 0 ? `, +${r.pointsAwarded} điểm` : ''}.`]
        : [r.checked > 0 ? 'Biên nhận mới chưa khớp chuyến nào bạn mở từ Frego.' : 'Chưa có biên nhận mới.'];
    if (r.held) parts.push(r.held);
    return parts.join(' ');
  };

  const doSync = async () => {
    setBusy('sync');
    setError(null);
    try {
      const r = await g.sync();
      setMessage({ tone: r.matched > 0 ? 'tint' : 'neutral', text: syncText(r) });
      await refreshAll();
    } catch {
      setError('Chưa đọc được biên nhận. Thử lại sau ít phút.');
    } finally {
      setBusy(null);
    }
  };

  const doLink = async () => {
    setBusy('link');
    setError(null);
    setMessage(null);
    try {
      const outcome = await g.link();
      await refreshAll();
      if (outcome === 'linked') {
        setBusy(null);
        await doSync();
        return;
      }
      if (outcome === 'failed') setError('Chưa liên kết được Gmail. Thử lại sau ít phút.');
    } catch {
      setError('Chưa liên kết được Gmail. Thử lại sau ít phút.');
    } finally {
      setBusy(null);
    }
  };

  const doUnlink = async () => {
    setConfirmUnlink(false);
    setBusy('unlink');
    setError(null);
    setMessage(null);
    try {
      await g.unlink();
      await refreshAll();
    } catch {
      setError('Chưa gỡ được liên kết Gmail. Thử lại sau ít phút.');
    } finally {
      setBusy(null);
    }
  };

  const loading = g.availabilityLoading || ((g.availability === 'demo' || g.availability === 'live') && !st && !g.statusError);
  const soon = g.availability === 'soon' || g.statusError;

  let body: ReactNode;
  if (loading) {
    body = <ListRow icon="mail" title="Gmail" sub="Đang kiểm tra…" />;
  } else if (soon) {
    body = (
      <>
        <ListRow icon="mail" leadTone="neutral" title="Gmail" sub="Tự lấy giá từ biên nhận Grab, Be, Green SM" subWrap chip="Sắp có" chipTone="tint" />
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          <T size={13} lineHeight={19} color={colors.muted}>
            {brand.name} đang chờ Google duyệt quyền đọc biên nhận. Trong lúc chờ, bạn nhập số tiền ở màn Báo giá để nhận điểm.
          </T>
          <Button label="Sắp có" variant="secondary" size="sm" disabled accessibilityHint="Tính năng chưa mở" />
        </View>
      </>
    );
  } else if (st?.linked) {
    body = (
      <>
        <ListRow
          icon="mail"
          title="Gmail"
          sub={demo ? `${st.email ?? ''} · liên kết giả lập` : (st.email ?? '')}
          subWrap
          trail="done"
          doneLabel="Đã liên kết"
        />
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {demo ? <Chip text="Bản thử DEMO · không có Google thật" tone="neutral" size="sm" style={{ alignSelf: 'flex-start' }} /> : null}
          {st.error ? <InlineError text={st.error} /> : null}
          <T size={13} lineHeight={19} color={colors.muted}>
            {[st.matchedCount > 0 ? `Đã tự ghi giá ${st.matchedCount} chuyến.` : 'Chưa ghi giá chuyến nào.', st.lastSyncText]
              .filter(Boolean)
              .join(' ')}
          </T>
          <Button
            label={busy === 'sync' ? 'Đang đọc biên nhận…' : 'Đọc biên nhận mới'}
            variant="secondary"
            size="sm"
            icon="receipt"
            disabled={!!busy}
            onPress={doSync}
          />
          <Button label="Gỡ liên kết Gmail" variant="text" size="sm" disabled={!!busy} onPress={() => setConfirmUnlink(true)} />
        </View>
      </>
    );
  } else {
    body = (
      <>
        <ListRow icon="mail" title="Gmail" sub="Mỗi chuyến có biên nhận Grab, Be, Green SM sẽ tự được ghi giá và cộng điểm." subWrap />
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
          {demo ? (
            <T size={13} lineHeight={19} color={colors.muted}>
              Chế độ DEMO: không kết nối Google thật. Liên kết và biên nhận ở đây đều là giả lập để xem thử luồng.
            </T>
          ) : null}
          {g.needsLogin ? (
            <T size={13} lineHeight={19} color={colors.muted}>
              Đăng nhập bằng số điện thoại để liên kết Gmail.
            </T>
          ) : null}
          <Button
            label={busy === 'link' ? 'Đang mở Google…' : demo ? 'Liên kết thử (DEMO)' : 'Liên kết Gmail'}
            size="sm"
            icon={demo ? undefined : 'external'}
            disabled={!!busy || g.needsLogin}
            onPress={doLink}
          />
        </View>
      </>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <SectionTitle text="Tự lấy giá từ biên nhận email" size="sm" nativeID="lk-gmail" />
      {error ? <InlineError text={error} /> : null}
      {message ? <InfoNote tone={message.tone} icon="receipt" text={message.text} live /> : null}
      <ListCard accessibilityLabel="Tự lấy giá từ biên nhận email">{body}</ListCard>
      <T size={13} lineHeight={19} color={colors.muted}>
        {brand.name} chỉ tìm thư biên nhận của Grab, Be, Green SM để lấy số tiền, giờ chuyến, điểm đón và điểm đến; không lưu nội
        dung thư. Khi bạn gỡ liên kết, {brand.name} thu hồi quyền đọc ngay.
      </T>

      <SheetModal
        visible={confirmUnlink}
        onClose={() => setConfirmUnlink(false)}
        title="Gỡ liên kết Gmail?"
        subtitle={`${brand.name} sẽ ngừng đọc biên nhận. Giá các chuyến đã ghi vẫn giữ trong lịch sử của bạn.`}
        footer={
          <>
            <Button label="Gỡ liên kết" onPress={doUnlink} />
            <Button label="Giữ liên kết" variant="text" size="sm" onPress={() => setConfirmUnlink(false)} />
          </>
        }
      />
    </View>
  );
}

/** Chọn ngân hàng và loại thẻ (không nhập số thẻ). */
function BankSheet({
  visible,
  banks,
  onClose,
  onLink,
}: {
  visible: boolean;
  banks: LinkRowView[];
  onClose: () => void;
  onLink: (bank: LinkRowView, type: CardType) => void;
}) {
  const available = banks.filter((b) => !b.linked);
  const [bankId, setBankId] = useState<string | null>(null);
  const [type, setType] = useState<CardType>('credit');
  const bank = available.find((b) => b.partnerId === bankId) ?? null;

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Thêm thẻ ngân hàng"
      subtitle="Chỉ cần chọn ngân hàng và loại thẻ, không nhập số thẻ."
      footer={
        available.length ? (
          <Button label="Liên kết thẻ" disabled={!bank} onPress={() => bank && onLink(bank, type)} />
        ) : (
          <Button label="Đóng" variant="ghost" onPress={onClose} />
        )
      }
    >
      {available.length ? (
        <>
          <View role="radiogroup" aria-label="Ngân hàng" style={{ gap: 10 }}>
            <SectionTitle text="Ngân hàng" size="sm" />
            <ListCard tone="alt" divider="lead">
              {available.map((b) => (
                <ListRow
                  key={b.partnerId}
                  mono={b.mono}
                  title={b.name}
                  sub={b.desc}
                  subWrap
                  trail={b.partnerId === bankId ? 'done' : 'none'}
                  doneLabel="Đã chọn"
                  selected={b.partnerId === bankId}
                  onPress={() => setBankId(b.partnerId)}
                />
              ))}
            </ListCard>
          </View>
          <View role="radiogroup" aria-label="Loại thẻ" style={{ gap: 10 }}>
            <SectionTitle text="Loại thẻ" size="sm" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CARD_TYPES.map((t) => (
                <Pill
                  key={t.key}
                  label={t.label}
                  accessibilityRole="radio"
                  state={type === t.key ? 'selected' : 'default'}
                  onPress={() => setType(t.key)}
                />
              ))}
            </View>
          </View>
        </>
      ) : (
        <InfoNote
          tone="neutral"
          icon="check"
          text={`Bạn đã liên kết mọi ngân hàng ${brand.name} đang hỗ trợ. Ngân hàng mới sẽ có ở đây khi có mã đặt xe đi kèm.`}
        />
      )}
    </SheetModal>
  );
}
