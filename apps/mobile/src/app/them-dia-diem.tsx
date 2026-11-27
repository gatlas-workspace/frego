// Thêm địa điểm đã lưu (thiết kế ThemDiaDiem-v2.dc.html)
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SAVED_PLACE_KINDS, type SavedPlaceKind } from '@frego/core';
import {
  BottomBar,
  Button,
  Field,
  InfoNote,
  ListCard,
  ListRow,
  Pill,
  ScreenHeader,
  SearchField,
  SectionTitle,
  T,
} from '@/components/ui';
import { ErrorState, LoadingBlocks } from '@/components/screens/flow/ScreenState';
import { refreshAll, useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

interface PlaceOption {
  id: string;
  name: string;
  address: string;
}

export default function AddPlaceScreen() {
  const { svc } = useApi();
  const [kind, setKind] = useState<SavedPlaceKind>('other');
  const [label, setLabel] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<PlaceOption | null>(null);
  const [mapNote, setMapNote] = useState(false);
  const q = useDeferredValue(query.trim());
  const typed = q.length > 0;

  const suggestions = useQuery({ queryKey: ['savedPlaceSuggestions'], queryFn: () => svc.savedPlaceSuggestions() });
  const results = useQuery({
    queryKey: ['searchPlaces', q],
    queryFn: () => svc.searchPlaces(q),
    enabled: typed,
    placeholderData: keepPreviousData,
  });

  const save = useMutation({
    mutationFn: (place: PlaceOption) => {
      const kindLabel = SAVED_PLACE_KINDS.find((k) => k.key === kind)?.label ?? '';
      const name = label.trim() || (kind === 'other' ? place.name : kindLabel);
      return svc.addSavedPlace({ kind, label: name, placeId: place.id });
    },
    onSuccess: () => {
      refreshAll();
      if (router.canGoBack()) router.back();
      else router.replace('/');
    },
  });

  const list: PlaceOption[] | undefined = typed ? results.data : suggestions.data;
  const listQuery = typed ? results : suggestions;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Thêm địa điểm" backLabel="Quay lại trang chủ" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: layout.gutter, paddingBottom: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 10 }}>
          <SectionTitle text="Loại địa điểm" />
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Loại địa điểm"
            style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
          >
            {SAVED_PLACE_KINDS.map((k) => (
              <Pill
                key={k.key}
                label={k.label}
                state={kind === k.key ? 'selected' : 'default'}
                onPress={() => setKind(k.key)}
                accessibilityRole="radio"
              />
            ))}
          </View>
        </View>

        <Field
          label="Tên gọi"
          placeholder="VD: Nhà ba mẹ, Trường của bé"
          value={label}
          onChangeText={setLabel}
          autoComplete="off"
          maxLength={40}
        />

        <View style={{ gap: 10 }}>
          <SectionTitle text="Địa chỉ" />
          <SearchField
            tone="surface"
            accessibilityLabel="Tìm địa chỉ"
            placeholder="Tìm địa chỉ, tên đường, toà nhà"
            value={query}
            onChangeText={setQuery}
            onClear={() => setQuery('')}
            clearLabel="Xóa ô tìm địa chỉ"
            autoCorrect={false}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <T weight={700} size={13} lineHeight={18} color={colors.muted} style={{ flexShrink: 1 }}>
              {typed ? `Kết quả cho “${q}”` : 'Gợi ý từ chuyến gần đây'}
            </T>
            <Button label="Chọn trên bản đồ" variant="text" size="sm" icon="map" block={false} onPress={() => setMapNote(true)} />
          </View>
          {mapNote ? (
            <InfoNote tone="neutral" icon="info" text="Chọn trên bản đồ chưa có trong bản này. Gõ tên địa chỉ để tìm." live />
          ) : null}
          {listQuery.isError ? (
            <ErrorState onRetry={() => listQuery.refetch()} />
          ) : !list ? (
            <LoadingBlocks heights={[204]} />
          ) : list.length === 0 ? (
            <View accessibilityLiveRegion="polite">
              <InfoNote tone="neutral" icon="search" text="Chưa thấy địa chỉ nào khớp. Thử gõ tên đường hoặc tên toà nhà." />
            </View>
          ) : (
            <ListCard accessibilityLabel="Gợi ý địa chỉ">
              {list.map((p) => {
                const on = picked?.id === p.id;
                return (
                  <ListRow
                    key={p.id}
                    icon={on || typed ? 'pin' : 'clock'}
                    title={p.name}
                    sub={p.address}
                    trail={on ? 'done' : 'none'}
                    doneLabel="Đã chọn"
                    selected={on}
                    onPress={() => setPicked(on ? null : { id: p.id, name: p.name, address: p.address })}
                  />
                );
              })}
            </ListCard>
          )}
        </View>
      </ScrollView>

      <BottomBar>
        <Button
          label="Lưu địa điểm"
          disabled={!picked || save.isPending}
          onPress={() => picked && save.mutate(picked)}
          accessibilityHint={picked ? `Lưu ${picked.name}` : undefined}
        />
        {save.isError ? (
          <T size={13} lineHeight={19} color={colors.bad} align="center" accessibilityLiveRegion="polite">
            Chưa lưu được địa điểm. Thử lại sau giây lát.
          </T>
        ) : !picked ? (
          <T size={13} lineHeight={19} color={colors.muted} align="center">
            Chọn một địa chỉ để lưu.
          </T>
        ) : null}
      </BottomBar>
    </KeyboardAvoidingView>
  );
}
