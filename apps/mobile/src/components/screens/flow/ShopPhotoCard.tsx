// Khối "Ghé quán? Chụp ảnh nhận điểm" ở màn Báo giá (UI v3: V3-BaoGia.dc.html).
// Chỉ chụp bằng máy ảnh (không chọn ảnh cũ), kèm vị trí lúc chụp; máy chủ kiểm vị trí ≤ 150 m, giờ chụp, ảnh trùng; Frego duyệt rồi mới cộng điểm.
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { Button, Icon, T } from '@/components/ui';
import { Pop, Rise } from '@/components/motion';
import { refreshAll, useApi } from '@/lib/api';
import { colors, radius } from '@/theme/tokens';

type Shot = { file: Blob | { uri: string }; uri: string; takenAt: string; lat: number; lng: number };

/** Vị trí hiện tại (nạp expo-location khi cần, như lib/pickup). */
async function currentPosition(): Promise<{ lat: number; lng: number }> {
  const Location = await import('expo-location');
  const perm = await Location.requestForegroundPermissionsAsync();
  if (!perm.granted) throw new Error('Cần quyền vị trí để xác nhận bạn đang ở quán. Bật quyền vị trí cho Frego rồi thử lại.');
  const p = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Chưa lấy được vị trí. Ra chỗ thoáng hơn rồi thử lại.')), 12_000)),
  ]);
  return { lat: p.coords.latitude, lng: p.coords.longitude };
}

export function ShopPhotoCard({ tripId }: { tripId: string }) {
  const { svc } = useApi();
  const state = useQuery({ queryKey: ['shop-photo', tripId], queryFn: () => svc.getShopPhotoState(tripId) });
  const [shot, setShot] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (s: Shot) => svc.submitShopPhoto(tripId, { file: s.file, takenAt: s.takenAt, lat: s.lat, lng: s.lng }),
    onSuccess: () => {
      setShot(null);
      state.refetch();
      refreshAll();
    },
    onError: (e) => setError(e instanceof Error && e.message ? e.message : 'Chưa gửi được ảnh. Thử lại sau giây lát.'),
  });

  const s = state.data;
  if (!s) return null; // Chuyến không dùng mã của quán tài trợ: không có khối này.

  const take = async () => {
    setError(null);
    setBusy(true);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) throw new Error('Cần quyền máy ảnh để chụp ảnh tại quán. Bật quyền máy ảnh cho Frego trong Cài đặt.');
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, exif: false });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const pos = await currentPosition();
      setShot({ file: a.file ?? { uri: a.uri }, uri: a.uri, takenAt: new Date().toISOString(), ...pos });
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Chưa chụp được ảnh. Thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const box = { padding: 14, gap: 12, borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface } as const;

  if (s.status !== 'none') {
    const msg =
      s.status === 'pending'
        ? `Đã nhận ảnh. ${s.points} điểm được cộng sau khi Frego kiểm tra (thường trong 24 giờ).`
        : s.status === 'approved'
          ? `Ảnh tại ${s.shopName} đã được duyệt, cộng ${s.points} điểm.`
          : `Ảnh chưa được duyệt${s.rejectReason ? `: ${s.rejectReason}` : ''}.`;
    const ok = s.status !== 'rejected';
    return (
      <Rise>
        <View role="status" style={{ padding: 12, borderRadius: radius.card, backgroundColor: ok ? colors.goodSoft : colors.badSoft, flexDirection: 'row', gap: 10 }}>
          <Pop delay={150}>
            <Icon name={ok ? 'check' : 'info'} size={20} color={ok ? colors.good : colors.bad} strokeWidth={2.6} />
          </Pop>
          <T weight={700} size={14} lineHeight={20} color={ok ? colors.good : colors.bad} style={{ flex: 1 }}>
            {msg}
          </T>
        </View>
      </Rise>
    );
  }

  return (
    <View style={box}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T accessibilityRole="header" weight={800} size={15} lineHeight={20}>
            Ghé {s.shopName}? Chụp ảnh nhận điểm
          </T>
          <T size={13} lineHeight={18} color={colors.ink2}>
            Chụp ngay tại quán trong 24 giờ sau chuyến. Frego kiểm tra vị trí rồi cộng điểm.
          </T>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.primarySoft }}>
          <T weight={800} size={12} lineHeight={16} color={colors.primaryDeep}>
            +{s.points}
          </T>
        </View>
      </View>
      {shot ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={{ uri: shot.uri }} accessibilityLabel={`Ảnh vừa chụp tại ${s.shopName}`} style={{ width: 88, height: 88, borderRadius: 12, backgroundColor: colors.surfaceAlt }} />
            <View style={{ flex: 1, gap: 6 }}>
              <T weight={700} size={14} lineHeight={19}>
                Ảnh vừa chụp
              </T>
              <Button label="Chụp lại" variant="outline" size="sm" block={false} onPress={take} disabled={busy || send.isPending} />
            </View>
          </View>
          <Button label={send.isPending ? 'Đang gửi…' : 'Gửi ảnh'} badge={`+${s.points} điểm`} onPress={() => send.mutate(shot)} disabled={send.isPending} />
        </View>
      ) : (
        <Button label={busy ? 'Đang mở máy ảnh…' : 'Chụp ảnh tại quán'} icon="camera" variant="secondary" onPress={take} disabled={busy} />
      )}
      {error ? (
        <T size={13} lineHeight={19} color={colors.bad} accessibilityLiveRegion="polite">
          {error}
        </T>
      ) : null}
      <T size={12} lineHeight={17} color={colors.muted}>
        Ảnh chỉ Frego xem để duyệt, quán không thấy ảnh hay thông tin của bạn.
      </T>
    </View>
  );
}
