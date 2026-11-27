// Màn 1b · Chọn điểm đến (thiết kế TimKiem-v2.dc.html)
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDeferredValue, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { stripDiacritics, type PlaceView } from '@frego/core';
import {
  Button,
  Chip,
  Icon,
  InfoNote,
  ListCard,
  ListRow,
  Pill,
  ScreenHeader,
  SearchField,
  SectionTitle,
  T,
} from '@/components/ui';
import { PickupRow } from '@/components/screens/flow/PickupRow';
import { ErrorState, LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { useStartTrip } from '@/components/screens/flow/useStartTrip';
import { useApi } from '@/lib/api';
import { colors, layout, radius, shadow } from '@/theme/tokens';

/** Phần tên khớp từ đầu với chữ đã gõ (không dấu), kéo đến hết từ: "Chợ Bến" + "Thành". */
function splitHighlight(name: string, query: string): { hl?: string; title: string } {
  const q = stripDiacritics(query.trim()).toLowerCase();
  if (!q) return { title: name };
  name = name.normalize('NFC');
  const n = stripDiacritics(name).toLowerCase();
  if (!n.startsWith(q) || q.length >= name.length) return { title: name };
  let end = q.length;
  while (end < name.length && name[end] !== ' ') end++;
  const rest = name.slice(end).replace(/^\s+/, '');
  if (!rest) return { title: name };
  return { hl: name.slice(0, end), title: rest };
}

export default function SearchScreen() {
  const { svc } = useApi();
  const [query, setQuery] = useState('');
  const [mapNote, setMapNote] = useState(false);
  const q = useDeferredValue(query.trim());
  const { go, busyId, error } = useStartTrip();

  const origin = useQuery({ queryKey: ['originLabel'], queryFn: () => svc.currentOriginLabel() });
  const home = useQuery({ queryKey: ['home'], queryFn: () => svc.getHome() });
  const recent = useQuery({ queryKey: ['recentSearches'], queryFn: () => svc.recentSearches() });
  const results = useQuery({
    queryKey: ['searchPlaces', q],
    queryFn: () => svc.searchPlaces(q),
    enabled: q.length > 0,
    placeholderData: keepPreviousData,
  });

  const typed = q.length > 0;
  const saved = home.data?.savedPlaces ?? [];

  const placeRow = (p: PlaceView, mode: 'recent' | 'result') => {
    const parts = mode === 'result' ? splitHighlight(p.name, q) : { title: p.name };
    return (
      <ListRow
        key={p.id}
        icon={mode === 'result' ? 'pin' : 'clock'}
        hl={parts.hl}
        title={parts.title}
        sub={p.address}
        meta={mode === 'result' ? p.distanceText : undefined}
        chip={p.voucherChip || undefined}
        onPress={() => go(p.id)}
        disabled={busyId === p.id}
      />
    );
  };

  const mapButton = (
    <View style={{ gap: 8 }}>
      <Button
        label="Chọn trên bản đồ"
        variant="text"
        size="sm"
        icon="map"
        block={false}
        onPress={() => setMapNote(true)}
        style={{ alignSelf: 'flex-start' }}
      />
      {mapNote ? (
        <InfoNote tone="neutral" icon="info" text="Chọn trên bản đồ chưa có trong bản này. Gõ tên điểm đến để tìm." live />
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader align="start" backLabel="Quay lại trang chủ">
        <View
          style={{
            flex: 1,
            minWidth: 0,
            backgroundColor: colors.surface,
            borderRadius: radius.card,
            boxShadow: shadow.card,
            padding: 12,
            gap: 10,
          }}
        >
          <PickupRow value={origin.data ?? 'Vị trí hiện tại'} style={{ paddingVertical: 2, paddingHorizontal: 4 }} />
          <SearchField
            accessibilityLabel="Điểm đến"
            placeholder="Bạn muốn đi đâu?"
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            clearLabel="Xóa điểm đến"
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            style={{ paddingLeft: 14 }}
          />
        </View>
      </ScreenHeader>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 4, paddingHorizontal: layout.gutter, paddingBottom: 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ marginTop: 1 }}>
            <Icon name="ticket" size={18} color={colors.primary} strokeWidth={1.9} />
          </View>
          <T size={13} lineHeight={19} color={colors.ink2} style={{ flex: 1 }}>
            Chọn điểm đến để Frego gắn voucher hợp nhất cho từng hãng, rồi mới so giá.
          </T>
        </View>

        {saved.length > 0 ? (
          <View accessibilityRole="toolbar" accessibilityLabel="Địa điểm đã lưu" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {saved.map((s) => (
              <Pill
                key={s.id}
                label={s.label}
                icon={s.icon}
                onPress={() => go(s.placeId)}
                disabled={busyId === s.placeId}
                accessibilityLabel={`Đi tới ${s.label}`}
              />
            ))}
          </View>
        ) : null}

        {error ? <InfoNote tone="neutral" icon="info" text={error} live /> : null}

        {typed ? (
          <View style={{ gap: 10 }}>
            <SectionTitle text={`Kết quả cho “${q}”`} />
            {results.isError ? (
              <ErrorState message="Chưa tìm được. Kiểm tra mạng rồi thử lại." onRetry={() => results.refetch()} />
            ) : !results.data ? (
              <LoadingBlocks heights={[136]} />
            ) : results.data.length === 0 ? (
              <View accessibilityLiveRegion="polite">
                <InfoNote tone="neutral" icon="search" text="Chưa thấy địa điểm nào khớp. Thử gõ tên đường hoặc tên toà nhà." />
              </View>
            ) : (
              <ListCard accessibilityLabel="Kết quả tìm kiếm">{results.data.map((p) => placeRow(p, 'result'))}</ListCard>
            )}
            {mapButton}
            {results.data && results.data.some((p) => p.voucherCount > 0) ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Chip text={results.data.find((p) => p.voucherCount > 0)!.voucherChip} size="sm" />
                <T size={13} lineHeight={19} color={colors.muted} style={{ flex: 1 }}>
                  Số voucher tài trợ dùng được nếu bạn đi đến đó.
                </T>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {recent.isError ? (
              <ErrorState onRetry={() => recent.refetch()} />
            ) : recent.isPending ? (
              <>
                <SectionTitle text="Tìm gần đây" />
                <LoadingBlocks heights={[204]} />
              </>
            ) : recent.data.length > 0 ? (
              <>
                <SectionTitle text="Tìm gần đây" />
                <ListCard accessibilityLabel="Tìm gần đây">{recent.data.map((p) => placeRow(p, 'recent'))}</ListCard>
              </>
            ) : null}
            {mapButton}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

