// 9 · Tài khoản (TaiKhoan-v2): điểm, tiết kiệm, lịch sử, ví, liên kết, cài đặt thông báo, quyền dữ liệu.
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, type IconName, type MeView } from '@frego/core';
import { Button, ListCard, ListRow, T } from '@/components/ui';
import { GuestPrompt, ProfileCard, StatCards } from '@/components/screens/account/AccountSummary';
import { usePullRefresh } from '@/components/screens/account/usePullRefresh';
import { ErrorView, LoadingView } from '@/components/screens/account/ScreenState';
import { useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

interface MenuRow {
  icon: IconName;
  title: string;
  sub?: string;
  deal?: boolean;
  href: Href;
}

function menuRows(me: MeView | undefined): MenuRow[] {
  return [
    {
      icon: 'clock',
      title: 'Lịch sử so giá',
      sub: me ? (me.pendingReports > 0 ? `${me.pendingReports} chuyến chưa báo giá` : 'Không có chuyến chờ báo giá') : undefined,
      deal: !!me && me.pendingReports > 0,
      href: '/lich-su',
    },
    {
      icon: 'ticket',
      title: 'Ví voucher',
      sub: me ? (me.usableVouchers > 0 ? `${me.usableVouchers} mã dùng được` : 'Chưa có mã dùng được') : undefined,
      href: '/vi',
    },
    { icon: 'link', title: 'Liên kết ví, thẻ, ứng dụng', sub: me?.linkedSummary, href: '/lien-ket' },
    {
      icon: 'bell',
      title: 'Cài đặt thông báo',
      sub: me ? (me.notifOnCount > 0 ? `${me.notifOnCount} loại tin đang bật` : 'Đang tắt mọi loại tin') : undefined,
      href: '/cai-dat-thong-bao',
    },
    {
      icon: 'shield',
      title: 'Quyền dữ liệu',
      sub: me ? (me.locationOn ? 'Vị trí đang bật' : 'Vị trí đang tắt') : undefined,
      href: '/quyen-rieng-tu?tu=tai-khoan',
    },
  ];
}

export default function TaiKhoanScreen() {
  const insets = useSafeAreaInsets();
  const { status, guest, svc, signOut } = useApi();
  const me = useQuery({ queryKey: ['me'], queryFn: () => svc.getMe(), enabled: status === 'signedIn' });
  const pull = usePullRefresh(me.refetch);
  const [signingOut, setSigningOut] = useState(false);

  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/chao-mung');
    } finally {
      setSigningOut(false);
    }
  };

  const data = me.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, layout.topInset), paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl {...pull} tintColor={colors.primary} />}
    >
      <T variant="tabTitle" accessibilityRole="header" style={{ letterSpacing: -0.5 }}>
        Tài khoản
      </T>

      {guest ? (
        <GuestPrompt onSignIn={() => router.push('/dang-nhap')} />
      ) : data ? (
        <>
          <ProfileCard name={data.profile.displayName || 'Bạn'} phone={data.maskedPhone} initials={data.initials} avatarUrl={data.profile.avatarUrl} />
          <StatCards
            pointsText={data.pointsText}
            savedText={data.savedText}
            savedSub={data.savedSub}
            onPoints={() => router.push('/diem-thuong')}
          />
        </>
      ) : me.isError ? (
        <ErrorView onRetry={() => me.refetch()} />
      ) : (
        <LoadingView style={{ flexGrow: 0, paddingVertical: 40 }} />
      )}

      <ListCard divider="lead" accessibilityLabel="Mục tài khoản">
        {menuRows(data).map((r) => (
          <ListRow
            key={r.title}
            icon={r.icon}
            title={r.title}
            sub={r.sub}
            subTone={r.deal ? 'deal' : 'muted'}
            trail="chev"
            onPress={() => router.push(r.href)}
          />
        ))}
      </ListCard>

      <Button
        label={signingOut ? 'Đang đăng xuất…' : guest ? 'Thoát chế độ khách' : 'Đăng xuất'}
        variant="white"
        onPress={logout}
        disabled={signingOut}
      />
      <T size={12} lineHeight={18} color={colors.muted} align="center">
        {brand.name} {brand.appVersion} · {brand.independenceNote}
      </T>
    </ScrollView>
  );
}
