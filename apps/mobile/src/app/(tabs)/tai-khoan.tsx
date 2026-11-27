// 9 · Tài khoản (TaiKhoan-v2): điểm, tiết kiệm, lịch sử, ví, liên kết, cài đặt thông báo, quyền dữ liệu.
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, RefreshControl, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, POINTS_RULES, type IconName, type MeView } from '@frego/core';
import { Button, InfoNote, ListCard, ListRow, ModalSheet, T } from '@/components/ui';
import { GuestPrompt, ProfileCard, ReferralCard, StatCards } from '@/components/screens/account/AccountSummary';
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
    { icon: 'user', title: 'Thông tin của bạn', sub: 'Tên, ảnh, ngày sinh, sở thích', href: '/thong-tin?tu=tai-khoan' },
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
  /** Hộp hỏi lại trước khi đăng xuất / xóa tài khoản (27/11/2026). */
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Đóng hộp sau cú bấm (trình duyệt còn gửi "click" xuống phần tử nằm dưới nếu hộp biến mất ngay khi nhả tay).
  const closeConfirm = () => setTimeout(() => setConfirm(null), 80);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const logout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/chao-mung');
    } finally {
      setSigningOut(false);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      await svc.deleteMyAccount();
      await signOut();
      router.replace('/chao-mung');
    } catch (e) {
      setActionError(e instanceof Error && e.message ? e.message : 'Chưa xóa được tài khoản. Thử lại sau ít phút.');
    } finally {
      setDeleting(false);
    }
  };

  /** Tải dữ liệu của tôi: web tải tệp JSON, điện thoại mở bảng Chia sẻ (lưu vào Tệp, gửi email…). */
  const exportData = async () => {
    setExportNote(null);
    try {
      const json = await svc.exportMyData();
      if (Platform.OS === 'web') {
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'frego-du-lieu-cua-toi.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportNote('Đã tải tệp frego-du-lieu-cua-toi.json. Trình duyệt trong Zalo/Facebook có thể chặn tải tệp: mở bằng Chrome hoặc Safari nếu không thấy tệp.');
      } else {
        await Share.share({ title: 'Dữ liệu Frego của tôi', message: json });
      }
    } catch {
      setExportNote('Chưa tải được dữ liệu. Thử lại sau ít phút.');
    }
  };

  const data = me.data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
          <ReferralCard
            referrer={POINTS_RULES.referral.referrer}
            referee={POINTS_RULES.referral.referee}
            onPress={() => router.push('/gioi-thieu')}
          />
        </>
      ) : me.isError ? (
        <ErrorView onRetry={() => me.refetch()} />
      ) : (
        <LoadingView style={{ flexGrow: 0, paddingVertical: 40 }} />
      )}

      <ListCard divider="lead" accessibilityLabel="Mục tài khoản">
        {menuRows(data)
          .filter((r) => !guest || r.href !== '/thong-tin?tu=tai-khoan')
          .map((r) => (
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
        onPress={() => (guest ? logout() : setConfirm('logout'))}
        disabled={signingOut}
      />
      {!guest && data ? (
        <View style={{ gap: 4 }}>
          <Button label="Tải dữ liệu của tôi" variant="text" size="sm" icon="external" onPress={exportData} />
          {exportNote ? <InfoNote tone="neutral" icon="info" text={exportNote} live /> : null}
          <Button label="Xóa tài khoản" variant="text" size="sm" onPress={() => setConfirm('delete')} />
        </View>
      ) : null}
      <T size={12} lineHeight={18} color={colors.muted} align="center">
        {brand.name} {brand.appVersion} · {brand.independenceNote}
      </T>
    </ScrollView>

    {confirm === 'logout' ? (
      <ModalSheet onDismiss={closeConfirm} dismissLabel="Ở lại" gap={14}>
        <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
          Đăng xuất khỏi {brand.name}?
        </T>
        <T size={15} lineHeight={22} color={colors.ink2}>
          Voucher, điểm và lịch sử vẫn được giữ. Đăng nhập lại bằng số điện thoại này để dùng tiếp.
        </T>
        <Button label={signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'} onPress={logout} disabled={signingOut} />
        <Button label="Ở lại" variant="ghost" onPress={closeConfirm} />
      </ModalSheet>
    ) : null}

    {confirm === 'delete' ? (
      <ModalSheet onDismiss={() => !deleting && closeConfirm()} dismissLabel="Giữ tài khoản" gap={14}>
        <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
          Xóa tài khoản vĩnh viễn?
        </T>
        <T size={15} lineHeight={22} color={colors.ink2}>
          {`Frego sẽ xóa hồ sơ, ${data ? `${data.pointsText} điểm thưởng` : 'điểm thưởng'}, voucher trong Ví, lịch sử so giá và mọi liên kết. Không khôi phục được. Muốn giữ bản sao, bấm "Tải dữ liệu của tôi" trước.`}
        </T>
        {actionError ? <InfoNote tone="neutral" icon="info" text={actionError} live /> : null}
        <Button label={deleting ? 'Đang xóa…' : 'Xóa vĩnh viễn'} variant="secondary" onPress={removeAccount} disabled={deleting} />
        <Button label="Giữ tài khoản" variant="ghost" onPress={closeConfirm} disabled={deleting} />
      </ModalSheet>
    ) : null}
    </View>
  );
}
