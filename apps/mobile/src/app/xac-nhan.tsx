// 0c · Nhập mã 6 số (XacNhan-v2) → lời chào mừng sau khi đăng nhập, kèm quà FREGO10 đã vào Ví voucher.
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '@frego/core';
import { BottomBar, Button, Icon, ScreenHeader, T, VoucherTicket } from '@/components/ui';
import { OtpInput } from '@/components/screens/account/OtpInput';
import { RESEND_SECONDS, otpSession } from '@/components/screens/account/otp-session';
import { resetTo } from '@/components/screens/account/navigation';
import { PageHeading, Strong } from '@/components/screens/account/PageHeading';
import { InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

const CODE_LENGTH = 6;

/** Số đã che "0909 ••• 123" không bị ngắt giữa dòng. */
const keepTogether = (s: string) => s.replace(/ /g, '\u00A0');

function formatCountdown(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function XacNhanScreen() {
  const { pendingPhone, verifyOtp } = useApi();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [welcomePhone, setWelcomePhone] = useState<string | null>(null);
  const otpRef = useRef<TextInputInstance | null>(null);

  const submit = async () => {
    if (verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await verifyOtp(code);
      if (!res.ok) {
        setError(res.error);
        otpRef.current?.focus();
        return;
      }
      setWelcomePhone(pendingPhone ?? '');
    } catch {
      setError('Chưa xác nhận được mã. Thử lại sau ít phút.');
    } finally {
      setVerifying(false);
    }
  };

  if (welcomePhone !== null) return <Welcome phone={welcomePhone} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader
        backLabel="Quay lại nhập số điện thoại"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/dang-nhap'))}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 24, paddingBottom: 24, gap: 22 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <PageHeading title={`Nhập mã ${CODE_LENGTH} số`}>
          {pendingPhone ? (
            <>
              Mã đã gửi qua tin nhắn tới <Strong>{keepTogether(pendingPhone)}</Strong>.
            </>
          ) : (
            'Mã đã gửi qua tin nhắn tới số điện thoại của bạn.'
          )}
        </PageHeading>
        <View style={{ gap: 10 }}>
          <OtpInput
            ref={otpRef}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            length={CODE_LENGTH}
            error={!!error}
            onSubmit={submit}
            autoFocus
          />
          {error ? <InlineError text={error} /> : null}
        </View>
        <ResendRow />
        <Button label={verifying ? 'Đang xác nhận…' : 'Xác nhận'} onPress={submit} disabled={verifying} />
        <Button
          label="Đổi số điện thoại"
          variant="text"
          size="sm"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/dang-nhap'))}
        />
      </ScrollView>
    </View>
  );
}

/** "Gửi lại mã sau 0:42" → khi hết giờ: nút "Gửi lại mã". */
function ResendRow() {
  const { sendOtp } = useApi();
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [note, setNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = left > 0;
  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const resend = async () => {
    if (!otpSession.phone) {
      router.replace('/dang-nhap');
      return;
    }
    setSending(true);
    setNote(null);
    const res = await sendOtp(otpSession.phone).catch(() => ({ ok: false as const, error: 'Chưa gửi được mã. Thử lại sau ít phút.' }));
    setSending(false);
    if (!res.ok) {
      setNote(res.error);
      return;
    }
    setNote('Đã gửi mã mới.');
    setLeft(RESEND_SECONDS);
  };

  if (left > 0) {
    return (
      <T size={14} lineHeight={20} color={colors.ink2} accessibilityLabel={`Gửi lại mã sau ${left} giây`}>
        Gửi lại mã sau{' '}
        <T weight={700} size={14} lineHeight={20} style={{ fontVariant: ['tabular-nums'] }}>
          {formatCountdown(left)}
        </T>
        {note ? ` · ${note}` : ''}
      </T>
    );
  }
  return (
    <View style={{ gap: 4, alignItems: 'flex-start' }}>
      <Button label={sending ? 'Đang gửi…' : 'Gửi lại mã'} variant="text" size="sm" block={false} disabled={sending} onPress={resend} style={{ marginLeft: -14 }} />
      {note ? <InlineError text={note} /> : null}
    </View>
  );
}

/** Bước chào mừng sau khi xác nhận thành công. */
function Welcome({ phone }: { phone: string }) {
  const insets = useSafeAreaInsets();
  const { svc } = useApi();
  const wallet = useQuery({ queryKey: ['wallet'], queryFn: () => svc.getWallet() });
  const gift = wallet.data?.gifts.find((g) => g.source === 'frego' && g.title === `Mã ${brand.welcomeCode}`);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top + 28, layout.topInset + 16),
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 16,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={34} color={colors.white} strokeWidth={2.6} />
          </View>
        </View>
        <PageHeading title={`Chào mừng bạn đến ${brand.name}!`} align="center" style={{ alignSelf: 'stretch' }}>
          {phone ? (
            <>
              Đăng nhập thành công với số <Strong>{keepTogether(phone)}</Strong>.
            </>
          ) : (
            'Đăng nhập thành công.'
          )}
        </PageHeading>
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          {wallet.isLoading ? (
            <LoadingView label="Đang mở quà chào mừng…" style={{ paddingVertical: 24 }} />
          ) : gift ? (
            <VoucherTicket
              mode="static"
              logo="f"
              amountText={gift.amountText}
              tag="frego"
              tagText="Quà chào mừng"
              title={`${gift.title} cho chuyến ${gift.serviceText}`}
              line={`Đã có trong Ví voucher, ${brand.name} tự gắn khi bạn đặt xe.`}
              notchColor={colors.surface}
            />
          ) : null}
        </View>
      </ScrollView>
      <BottomBar>
        <Button label="Tiếp tục" onPress={() => resetTo('/thong-tin')} />
      </BottomBar>
    </View>
  );
}
