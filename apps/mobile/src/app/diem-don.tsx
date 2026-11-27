// Đổi điểm đón: vị trí hiện tại (GPS / trình duyệt), tìm địa chỉ, địa điểm đã lưu, hoặc ghim trên bản đồ (chốt 27/11/2026).
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { PlaceView } from '@frego/core';
import { Button, InfoNote, ListCard, ListRow, Pill, ScreenHeader, SearchField, SectionTitle, T } from '@/components/ui';
import { LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { useApi } from '@/lib/api';
import { usePickup, type LocateResult } from '@/lib/pickup';
import { colors, layout } from '@/theme/tokens';

const LOCATE_NOTE: Record<Exclude<LocateResult, 'ok'>, string> = {
  denied: 'Frego chưa được phép dùng vị trí. Bật lại trong Cài đặt của máy (hoặc của trình duyệt), hoặc gõ điểm đón bên dưới.',
  unavailable: 'Chưa lấy được vị trí lúc này. Thử lại ở nơi thoáng hơn, hoặc gõ điểm đón bên dưới.',
};

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function PickupScreen() {
  const { svc } = useApi();
  const { pickup, locating, locate, setManual } = usePickup();
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim(), 300);
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const home = useQuery({ queryKey: ['home'], queryFn: () => svc.getHome() });
  const results = useQuery({
    queryKey: ['searchPlaces', q],
    queryFn: () => svc.searchPlaces(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const locateHere = async () => {
    setNote(null);
    const r = await locate();
    if (r === 'ok') done();
    else setNote(LOCATE_NOTE[r]);
  };

  const pick = async (placeId: string) => {
    setBusyId(placeId);
    const p = await svc.pickupFromPlace(placeId).catch(() => null);
    setBusyId(null);
    if (!p) {
      setNote('Chưa đặt được điểm đón này. Thử chọn trên bản đồ.');
      return;
    }
    setManual(p);
    done();
  };

  const openMap = (at?: { lat: number; lng: number }, label?: string) =>
    router.push({
      pathname: '/chon-tren-ban-do',
      params: { muc: 'diem-don', ...(at ? { lat: String(at.lat), lng: String(at.lng) } : {}), ...(label ? { q: label } : {}) },
    });

  const row = (p: PlaceView) => (
    <ListRow
      key={p.id}
      icon={p.pickOnMap ? 'map' : 'pin'}
      title={p.name}
      sub={p.pickOnMap ? [p.address, 'Chạm để ghim đúng nhà trên bản đồ'].filter(Boolean).join(' · ') : p.address}
      onPress={() => (p.pickOnMap ? openMap(p.pickOnMap, p.name) : pick(p.id))}
      disabled={busyId === p.id}
    />
  );

  const saved = home.data?.savedPlaces ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Điểm đón" backLabel="Quay lại" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: layout.gutter, paddingBottom: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <T size={13} lineHeight={19} color={colors.muted}>
            Đang đón ở
          </T>
          <T weight={800} size={16} lineHeight={22}>
            {pickup ? pickup.name : 'Landmark 81 · điểm mặc định'}
          </T>
          {pickup?.address ? (
            <T size={13} lineHeight={19} color={colors.ink2}>
              {pickup.address}
            </T>
          ) : null}
        </View>

        <Button
          label={locating ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'}
          icon="locate"
          variant="secondary"
          disabled={locating}
          onPress={locateHere}
        />
        {note ? <InfoNote tone="neutral" icon="info" text={note} live /> : null}

        <SearchField
          accessibilityLabel="Tìm điểm đón"
          placeholder="Gõ địa chỉ, tên đường, toà nhà"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          clearLabel="Xóa chữ đã gõ"
          autoCorrect={false}
          returnKeyType="search"
        />

        {q ? (
          <View style={{ gap: 10 }}>
            <SectionTitle text={`Kết quả cho “${q}”`} />
            {!results.data ? (
              <LoadingBlocks heights={[136]} />
            ) : results.data.length === 0 ? (
              <InfoNote tone="neutral" icon="search" text="Chưa thấy địa điểm nào khớp. Thử gõ tên đường hoặc chọn trên bản đồ." />
            ) : (
              <ListCard accessibilityLabel="Kết quả tìm điểm đón">{results.data.map(row)}</ListCard>
            )}
          </View>
        ) : saved.length > 0 ? (
          <View accessibilityRole="toolbar" accessibilityLabel="Địa điểm đã lưu" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {saved.map((s) => (
              <Pill
                key={s.id}
                label={s.label}
                icon={s.icon}
                onPress={() => pick(s.placeId)}
                disabled={busyId === s.placeId}
                accessibilityLabel={`Đón ở ${s.label}`}
              />
            ))}
          </View>
        ) : null}

        <Button label="Chọn trên bản đồ" variant="text" size="sm" icon="map" block={false} onPress={() => openMap()} style={{ alignSelf: 'flex-start' }} />
      </ScrollView>
    </View>
  );
}
