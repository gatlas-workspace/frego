// Màn 2c · Quảng cáo nhà tài trợ (chốt 27/11/2026): sau khi chọn hãng ở So giá, nếu mã gắn ở hãng đó là của quán tài
// trợ thì hiện banner của quán (hoặc popup gọn nếu quán chưa có banner được duyệt), rồi mới sang màn Mở app hãng.
// Nút "Tiếp tục" bấm được ngay; mỗi chuyến tính 1 lượt xem cho báo cáo doanh nghiệp (chỉ số tổng).
import { Redirect, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { BackButton, BrandLogo, Button, InfoNote, ModalSheet, T } from '@/components/ui';
import { BannerImage } from '@/components/screens/flow/BannerImage';
import { TripMapBackdrop } from '@/components/screens/flow/TripMapBackdrop';
import { useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

export default function SponsorAdScreen() {
  const { svc } = useApi();
  const { plan, openView, sponsorAd: ad } = useTripFlow();
  const counted = useRef(false);

  // Ghi 1 lượt xem khi popup hiện (RPC tự bỏ qua nếu chuyến đã tính).
  useEffect(() => {
    if (!ad || !openView || counted.current) return;
    counted.current = true;
    void svc.recordAdView(openView.trip.id);
  }, [ad, openView, svc]);

  if (!plan) return <Redirect href="/tim-kiem" />;
  if (!openView) return <Redirect href="/chuyen/so-gia" />;
  if (!ad) return <Redirect href="/chuyen/mo-app" />;

  // Đóng hay bấm tiếp đều sang màn Mở app (mã đã được phát, không mất).
  const next = () => router.replace('/chuyen/mo-app');

  return (
    <ModalSheet backdrop={<TripMapBackdrop vehicleClass={openView.vehicleClass} />} onDismiss={next} dismissLabel={ad.ctaLabel} gap={16} scroll>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ borderWidth: 1, borderColor: colors.dash, borderRadius: 8, paddingVertical: 2, paddingHorizontal: 8 }}>
          <T weight={700} size={12} lineHeight={16} color={colors.ink2}>
            Tài trợ
          </T>
        </View>
        <T size={13} lineHeight={18} color={colors.muted} style={{ flex: 1 }}>
          Quán tặng mã cho chuyến của bạn
        </T>
        <BackButton variant="soft" icon="close" onPress={next} accessibilityLabel={`Đóng quảng cáo, ${ad.ctaLabel.charAt(0).toLowerCase()}${ad.ctaLabel.slice(1)}`} />
      </View>

      {ad.banner ? (
        <View style={{ gap: 12 }}>
          <BannerImage uri={ad.banner.imageUrl} label={`Ảnh quảng cáo của ${ad.name}: ${ad.banner.title}`} />
          <View style={{ gap: 4 }}>
            <T weight={800} size={21} lineHeight={27} accessibilityRole="header" style={{ letterSpacing: -0.2 }}>
              {ad.banner.title}
            </T>
            {ad.banner.body ? (
              <T size={15} lineHeight={22} color={colors.ink2}>
                {ad.banner.body}
              </T>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <BrandLogo kind={ad.category} size={ad.banner ? 44 : 56} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T
            weight={800}
            size={ad.banner ? 16 : 20}
            lineHeight={ad.banner ? 21 : 26}
            accessibilityRole={ad.banner ? undefined : 'header'}
          >
            {ad.name}
          </T>
          {ad.industry ? (
            <T size={13} lineHeight={18} color={colors.muted}>
              {ad.industry}
            </T>
          ) : null}
          <T size={13} lineHeight={18} color={colors.ink2}>
            {[ad.address, ad.distanceText].filter(Boolean).join(' · ')}
          </T>
          {ad.hoursText ? (
            <T size={13} lineHeight={18} color={colors.ink2}>
              {ad.hoursText}
            </T>
          ) : null}
        </View>
      </View>

      <InfoNote tone="deal" icon="gift" text={ad.giftText} />

      <Button label={ad.ctaLabel} onPress={next} />
    </ModalSheet>
  );
}
