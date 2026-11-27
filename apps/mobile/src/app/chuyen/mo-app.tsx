// Màn 3 · Mở app hãng kèm mã (thiết kế MoApp-v2.dc.html — Be, MoAppGrab-v2.dc.html — Grab; một màn cho mọi hãng)
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { PROVIDERS } from '@frego/core';
import { BackButton, Button, InfoNote, ModalSheet, T, VehicleTile } from '@/components/ui';
import { CodeBox } from '@/components/screens/flow/CodeBox';
import { noBreak } from '@/components/screens/flow/noBreak';
import { copyText, openProviderApp, scheduleCodeUsed } from '@/components/screens/flow/openProviderApp';
import { Steps, Strong } from '@/components/screens/flow/Steps';
import { TripMapBackdrop } from '@/components/screens/flow/TripMapBackdrop';
import { useApi } from '@/lib/api';
import { usePush } from '@/lib/push';
import { useTripFlow } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

export default function OpenAppScreen() {
  const { svc } = useApi();
  const { show } = usePush();
  const { plan, openView: view, sponsorAd } = useTripFlow();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [opening, setOpening] = useState(false);

  if (!plan) return <Redirect href="/tim-kiem" />;
  if (!view) return <Redirect href="/chuyen/so-gia" />;

  const name = PROVIDERS[view.providerId].name;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/chuyen/so-gia'));
  const hasEstimate = view.trip.estimateLow !== null && view.trip.estimateHigh !== null;

  const copyCode = async () => {
    if (!view.code) return;
    const ok = await copyText(view.code);
    setCopied(ok);
    setCopyFailed(!ok);
  };

  const openApp = async () => {
    if (opening) return;
    setOpening(true);
    // Hãng không nhận điểm đến qua link (Be): chép sẵn địa chỉ để dán; mã ngắn để tự nhập.
    if (!view.prefillsDestination) await copyText(view.destAddress);
    await openProviderApp(view);
    scheduleCodeUsed(svc, view.trip.id, show);
    setOpening(false);
  };

  return (
    <ModalSheet
      backdrop={<TripMapBackdrop vehicleClass={view.vehicleClass} />}
      onDismiss={close}
      dismissLabel="Đóng, quay lại chọn hãng xe"
      gap={18}
      scroll
    >
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <T weight={800} size={22} lineHeight={28} style={{ flex: 1, minWidth: 0, letterSpacing: -0.3 }} accessibilityRole="header">
            {view.title}
          </T>
          <BackButton variant="soft" icon="close" onPress={close} accessibilityLabel="Đóng, quay lại chọn hãng xe" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <VehicleTile brand={view.providerId} kind={view.vehicleClass} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T weight={700} size={15} lineHeight={20}>
              {view.serviceLine}
            </T>
            {hasEstimate ? (
              <T size={14} lineHeight={20} color={colors.ink2}>
                ước tính sau mã{' '}
                <T weight={700} size={14} lineHeight={20}>
                  {noBreak(view.estimateText)}
                </T>
              </T>
            ) : (
              <T size={14} lineHeight={20} color={colors.ink2}>
                Chưa có giá ước tính, xem giá trong app {name}.
              </T>
            )}
          </View>
        </View>
      </View>

      {view.code ? (
        <View style={{ gap: 8 }}>
          <CodeBox code={view.code} codeLine={view.codeLine} copied={copied} onCopy={copyCode} />
          {copyFailed ? (
            <T size={13} lineHeight={19} color={colors.ink2} accessibilityLiveRegion="polite">
              Chưa chép được mã. Bạn nhập tay mã {view.code} trong app {name} nhé.
            </T>
          ) : null}
        </View>
      ) : (
        <InfoNote tone="neutral" icon="ticket" text={`Chuyến này chưa gắn mã ${name}. Giá trong app là giá chưa giảm.`} />
      )}

      <Steps
        accessibilityLabel="Các bước đặt xe"
        items={[
          view.prefillsDestination ? (
            <>
              <Strong>{view.step1[0]}</Strong>
              {view.step1[1]}
            </>
          ) : (
            <>
              {view.step1[0]}
              <Strong>{view.step1[1]}</Strong>
            </>
          ),
          view.code ? (
            <>
              Ở bước chọn ưu đãi, nhập mã <Strong>{view.code}</Strong>.
            </>
          ) : (
            <>Chọn loại xe và đặt như bình thường trong app {name}.</>
          ),
        ]}
      />

      {sponsorAd?.banner ? (
        <InfoNote
          tone="tint"
          icon="check"
          title={`Đã lưu ưu đãi của ${sponsorAd.name}`}
          text="Mở ở Ví › Tại quán khi tới quán để đưa nhân viên."
        />
      ) : null}

      <Button label={`Mở app ${name}`} icon="external" onPress={openApp} disabled={opening} />
      <T size={13} lineHeight={19} color={colors.muted} align="center">
        Frego không đặt xe thay bạn. Giá cuối cùng do app {name} hiển thị.
      </T>
    </ModalSheet>
  );
}
