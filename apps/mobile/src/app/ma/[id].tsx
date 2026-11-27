// 5c · Chi tiết mã công khai (thiết kế ChiTietMa-v2.dc.html).
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { PROVIDERS, type IconName, type ProviderId } from '@frego/core';
import { BottomBar, BrandLogo, Button, Card, Chip, Icon, InfoNote, ScreenHeader, SectionTitle, T } from '@/components/ui';
import { CodeBox } from '@/components/screens/wallet/CodeBox';
import { IconList } from '@/components/screens/wallet/DetailList';
import { ProgressBar } from '@/components/screens/wallet/ProgressBar';
import { EmptyCard, ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { ButtonStatus } from '@/components/screens/wallet/StatusRow';
import { refreshAll, useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

const backToWallet = () => router.dismissTo('/vi');

/** Hai nút báo lại chia phần dư theo nội dung để "Không dùng được" không bị cắt chữ ở màn 390. */
const VOTE_BUTTON = { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', minWidth: 0 } as const;

/** Điều kiện về thẻ/thanh toán dùng icon thẻ, còn lại dấu check (như bài gốc). */
const conditionIcon = (text: string): IconName => (/thẻ|thanh toán/i.test(text) ? 'card' : 'check');

/** Mở app hãng; không mở được (chưa cài, hoặc đang chạy trên web) thì mở trang tải app. Không bao giờ ném lỗi. */
async function openProviderApp(providerId: ProviderId) {
  const p = PROVIDERS[providerId];
  if (Platform.OS !== 'web') {
    try {
      await Linking.openURL(p.appUrl);
      return;
    } catch {
      /* chưa cài app → mở trang tải */
    }
  }
  try {
    await Linking.openURL(p.storeUrl);
  } catch {
    /* bỏ qua */
  }
}

async function copyCode(code: string): Promise<boolean> {
  try {
    return await Clipboard.setStringAsync(code);
  } catch {
    return false;
  }
}

export default function PublicCodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const codeId = String(id ?? '');
  const { svc } = useApi();
  const q = useQuery({ queryKey: ['public-code', codeId], queryFn: () => svc.getPublicCode(codeId), enabled: !!codeId });
  const [opened, setOpened] = useState<'copied' | 'manual' | null>(null);
  const [justVoted, setJustVoted] = useState(false);
  const vote = useMutation({
    mutationFn: (works: boolean) => svc.votePublicCode(codeId, works),
    onSuccess: () => {
      setJustVoted(true);
      refreshAll();
    },
  });
  const d = q.data;

  const body = q.isPending ? (
    <LoadingState label="Đang tải mã" />
  ) : q.isError ? (
    <View style={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
      <ErrorState onRetry={() => q.refetch()} />
    </View>
  ) : !d ? (
    <View style={{ paddingHorizontal: layout.gutter, paddingTop: 4 }}>
      <EmptyCard text="Không tìm thấy mã này. Mã có thể đã hết hoặc bị ẩn do nhiều người báo lỗi.">
        <Button label="Về Ví voucher" variant="secondary" size="sm" block={false} onPress={backToWallet} />
      </EmptyCard>
    </View>
  ) : null;

  if (body || !d) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Chi tiết mã" backLabel="Quay lại Ví voucher" onBack={backToWallet} />
        {body}
      </View>
    );
  }

  const c = d.code;
  const provider = d.providerName;
  const total = c.okReports24h + c.badReports24h;
  const voted = justVoted || d.myVote !== null;

  const onOpen = async () => {
    const ok = await copyCode(c.code);
    setOpened(ok ? 'copied' : 'manual');
    await openProviderApp(c.providerId);
  };
  const onSource = () => {
    WebBrowser.openBrowserAsync(c.sourceUrl).catch(() => Linking.openURL(c.sourceUrl).catch(() => {}));
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Chi tiết mã" backLabel="Quay lại Ví voucher" onBack={backToWallet} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: layout.gutter, paddingBottom: 24, gap: 14 }}
      >
        <Card gap={12}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BrandLogo kind={c.providerId} size={44} radius={14} />
            <View style={{ alignItems: 'flex-start', gap: 4 }}>
              <T weight={800} size={16} lineHeight={21}>
                {provider}
              </T>
              <Chip text="Mã công khai" tone="neutral" size="sm" />
            </View>
          </View>
          <CodeBox code={c.code} size={22} letterSpacing={1} />
          <T weight={800} size={17} lineHeight={24} accessibilityRole="header">
            {c.title}
          </T>
          {d.fitText ? <InfoNote icon="check" text={d.fitText} /> : null}
          {d.missingText ? <InfoNote tone="deal" icon="card" text={d.missingText} /> : null}
        </Card>

        <Card gap={12}>
          <SectionTitle text="Điều kiện" note={`Chép từ bài gốc của ${provider}`} />
          {d.conditions.length ? <IconList items={d.conditions.map((text) => ({ text, icon: conditionIcon(text) }))} /> : null}
          <InfoNote tone="neutral" icon="clock" text={d.expiryNote} />
        </Card>

        <Card gap={12}>
          <SectionTitle text="Nguồn" />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="globe" size={20} color={colors.primary} strokeWidth={1.9} />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <T weight={700} size={15} lineHeight={20}>
                {d.sourceHost}
              </T>
              <T size={13} lineHeight={18} color={colors.ink2}>
                {d.sourceTitle}
              </T>
              <T size={12} lineHeight={17} color={colors.muted}>
                {d.checkedText}
              </T>
            </View>
          </View>
          <Button
            label="Xem bài gốc"
            variant="secondary"
            size="sm"
            icon="external"
            block={false}
            onPress={onSource}
            accessibilityHint={`Mở bài gốc trên ${d.sourceHost}`}
            style={{ alignSelf: 'flex-start' }}
          />
          <T size={12} lineHeight={18} color={colors.muted}>
            {`Frego chỉ tổng hợp mã ${provider} đăng công khai, không phải đối tác của ${provider} trong chương trình này.`}
          </T>
        </Card>

        <Card gap={12}>
          <SectionTitle text="Người dùng Frego báo lại" />
          <View style={{ gap: 8 }}>
            <T size={13} lineHeight={19} color={colors.ink2}>
              <T weight={700} size={15} lineHeight={19}>
                {d.reportsText}
              </T>
              {d.reportsSub}
            </T>
            <ProgressBar value={total ? c.okReports24h / total : 0} />
          </View>
          {voted ? (
            <InfoNote icon="check" text="Cảm ơn bạn. Mã bị nhiều người báo lỗi sẽ tự ẩn khỏi Ví voucher." live />
          ) : (
            <View style={{ gap: 8 }}>
              <T weight={700} size={14} lineHeight={19}>
                Bạn đã thử mã này chưa?
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Button
                  label="Dùng được"
                  variant="ghost"
                  size="xs"
                  icon="check"
                  disabled={vote.isPending}
                  onPress={() => vote.mutate(true)}
                  accessibilityLabel={`Mã ${c.code} dùng được`}
                  style={VOTE_BUTTON}
                />
                <Button
                  label="Không dùng được"
                  variant="ghost"
                  size="xs"
                  icon="x"
                  disabled={vote.isPending}
                  onPress={() => vote.mutate(false)}
                  accessibilityLabel={`Mã ${c.code} không dùng được`}
                  style={VOTE_BUTTON}
                />
              </View>
              {vote.isError ? (
                <InfoNote tone="deal" icon="info" text="Chưa gửi được. Thử lại sau ít phút." live />
              ) : null}
            </View>
          )}
        </Card>
      </ScrollView>
      <BottomBar gap={4}>
        {opened ? (
          <ButtonStatus
            text={opened === 'copied' ? `Đã chép mã, đang mở ${provider}` : `Chưa chép được, hãy nhập ${c.code} trong ${provider}`}
            icon={opened === 'copied' ? 'check' : 'info'}
          />
        ) : (
          <Button label={`Chép mã và mở ${provider}`} onPress={onOpen} accessibilityHint={`Chép mã ${c.code} rồi mở app ${provider}`} />
        )}
        <Button label="So giá trước khi đặt" variant="text" size="sm" onPress={() => router.push('/tim-kiem')} />
      </BottomBar>
    </View>
  );
}
