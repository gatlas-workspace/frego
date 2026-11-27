// 11 · Liên kết ví, thẻ, ứng dụng (LienKet-v2). Thẻ chỉ chọn ngân hàng + loại thẻ, không nhập số thẻ.
// Chưa có thỏa thuận với đối tác thì Frego chỉ ghi nhận người dùng có dùng ví, app đó.
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { brand, type LinkRowView, type ProviderId } from '@frego/core';
import { Button, InfoNote, ListCard, ListRow, Pill, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { SheetModal } from '@/components/screens/account/SheetModal';
import { refreshAll, useApi } from '@/lib/api';
import { colors } from '@/theme/tokens';

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
    run(r.partnerId, () => svc.link(r.partnerId, cardType), `Chưa liên kết được ${r.name}. Thử lại sau ít phút.`);
  const unlink = (r: LinkRowView) => run(r.partnerId, () => svc.unlink(r.partnerId), `Chưa gỡ được liên kết ${r.name}. Thử lại sau ít phút.`);

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
            onAction={() => link(r)}
            onPress={r.linked ? () => setUnlinkRow(r) : undefined}
            accessibilityHint={r.linked ? 'Bấm để gỡ liên kết' : undefined}
            disabled={busyId === r.partnerId}
          />
        ))}
      </ListCard>
    </View>
  );

  const d = links.data;
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
            {section('lk-app', 'Ứng dụng khác', d.apps)}
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
        title={unlinkRow ? `Gỡ liên kết ${unlinkRow.name}?` : ''}
        subtitle={`${brand.name} sẽ không gợi ý mã cần ${unlinkRow?.name ?? ''} nữa. Bạn liên kết lại được bất cứ lúc nào.`}
        footer={
          <>
            <Button
              label="Gỡ liên kết"
              onPress={() => {
                const r = unlinkRow;
                setUnlinkRow(null);
                if (r) unlink(r);
              }}
            />
            <Button label="Giữ liên kết" variant="text" size="sm" onPress={() => setUnlinkRow(null)} />
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
