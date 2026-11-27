// Màn 2 · Gắn voucher cho chuyến (thiết kế KetQua-v2.dc.html)
import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { OFFER_PRIORITIES, toggleSelection } from '@frego/core';
import { BottomBar, Button, Card, Field, InfoNote, ListCard, Pill, SectionTitle, Sheet, T, Tabs, VoucherTicket } from '@/components/ui';
import { MapHeader } from '@/components/screens/flow/MapHeader';
import { useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';
import { colors } from '@/theme/tokens';

type CodeNote = { ok: boolean; text: string };

export default function AttachScreen() {
  const { svc } = useApi();
  const { plan, selection, setSelection, priority, setPriority } = useTripFlow();
  const [code, setCode] = useState('');
  const [note, setNote] = useState<CodeNote | null>(null);
  /** Mã đã nhập mà Frego chưa có dữ liệu: giữ để người dùng nhớ nhập trong app hãng (không tính vào giá). */
  const [unknownCodes, setUnknownCodes] = useState<string[]>([]);
  const [mapOpen, setMapOpen] = useState(false);

  const items = useMemo(() => (plan ? svc.attachItems(plan, selection, priority) : []), [svc, plan, selection, priority]);

  const addCode = useMutation({
    mutationFn: (input: string) => svc.addCustomCode(plan!, input),
    onSuccess: ({ matched, message, unknown }) => {
      if (matched) setSelection({ ...selection, [matched.service]: matched.offer.refId });
      if (unknown) setUnknownCodes((list) => (list.includes(unknown) ? list : [...list, unknown]));
      setNote({ ok: !!matched, text: message });
      // Ô nhập luôn còn để thử mã khác; chỉ xóa chữ khi mã đã được ghi nhận.
      if (matched || unknown) setCode('');
    },
    onError: () => setNote({ ok: false, text: 'Chưa kiểm tra được mã. Thử lại sau giây lát.' }),
  });

  if (!plan) return <Redirect href="/tim-kiem" />;

  const from = plan.title.split(' → ')[0];
  const submit = () => {
    const v = code.trim();
    if (!v || addCode.isPending) return;
    addCode.mutate(v);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <MapHeader
        from={from}
        to={plan.dest.name}
        backLabel="Quay lại chọn điểm đến"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/tim-kiem'))}
        expanded={mapOpen}
        onExpandedChange={setMapOpen}
      />
      <Sheet
        title={plan.title}
        subtitle={plan.subtitle}
        collapsed={mapOpen}
        onCollapsedChange={setMapOpen}
        footer={
          <BottomBar>
            <Button label={svc.attachCta(selection)} onPress={() => router.push('/chuyen/so-gia')} />
          </BottomBar>
        }
      >
        <InfoNote icon="pinok" title={`Điểm đến vẫn là ${plan.dest.name}`} text="Voucher chỉ giảm giá, không đổi địa chỉ đến." />

        <View style={{ gap: 10 }}>
          <SectionTitle text="Gắn voucher trước khi so giá" />
          {/* Cách ưu tiên: quyết định mã được tự gắn cho từng hãng và thứ tự danh sách (chốt 27/11/2026). */}
          <Tabs
            items={OFFER_PRIORITIES}
            value={priority}
            onChange={(k) => k !== priority && setPriority(k)}
            accessibilityLabel="Ưu tiên mã"
          />
          <T size={13} lineHeight={20} color={colors.ink2} accessibilityLiveRegion="polite">
            {OFFER_PRIORITIES.find((p) => p.key === priority)?.hint} Mỗi hãng dùng 1 mã mỗi chuyến, bấm Gắn để đổi.
          </T>
        </View>

        {items.length > 0 ? (
          <View accessibilityRole="list" accessibilityLabel="Voucher dùng được cho chuyến này" style={{ gap: 12 }}>
            {items.map((it) => {
              const offer = plan.evaluation.eligible.find((e) => e.offer.refId === it.refId && e.service === it.service);
              return (
                <VoucherTicket
                  key={`${it.refId}:${it.service}`}
                  mode="attach"
                  logo={it.logo}
                  amountText={it.amountText}
                  serviceText={it.serviceText}
                  tag={it.tag}
                  name={it.name}
                  conditionLine={it.conditionLine}
                  metaText={it.metaText}
                  attached={it.attached}
                  onToggle={() => offer && setSelection(toggleSelection(selection, offer))}
                />
              );
            })}
          </View>
        ) : (
          <InfoNote tone="neutral" icon="ticket" text="Chưa có voucher hợp chuyến này. Bạn vẫn so giá được, hoặc nhập mã riêng bên dưới." />
        )}

        <Card padding={16} gap={10}>
          <T weight={800} size={15} lineHeight={20} nativeID="nhap-ma-khac">
            Có mã khác? Nhập để tính vào giá
          </T>
          {(
            <Field
              accessibilityLabel="Có mã khác? Nhập để tính vào giá"
              placeholder="Mã Grab, Be, Green SM"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              returnKeyType="done"
              onSubmitEditing={submit}
              action="Thêm"
              onAction={submit}
              actionDisabled={!code.trim() || addCode.isPending}
            />
          )}
          {note ? (
            <View role="status">
              <InfoNote tone={note.ok ? 'tint' : 'neutral'} icon={note.ok ? 'check' : 'info'} text={note.text} live />
            </View>
          ) : null}
          {unknownCodes.length > 0 ? (
            <View style={{ gap: 6 }}>
              <T weight={700} size={13} lineHeight={18} color={colors.ink2}>
                Mã bạn nhập (chưa xác minh, nhập trong app hãng)
              </T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {unknownCodes.map((c) => (
                  <Pill
                    key={c}
                    label={c}
                    icon="x"
                    accessibilityLabel={`Bỏ mã ${c}`}
                    onPress={() => setUnknownCodes((list) => list.filter((x) => x !== c))}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </Card>

        {plan.evaluation.ineligible.length > 0 ? (
          <View style={{ gap: 10 }}>
            <SectionTitle text="Không hợp chuyến này" />
            <ListCard accessibilityLabel="Mã không hợp chuyến này">
              {plan.evaluation.ineligible.map((e) => (
                <View key={e.offer.refId} accessible style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 2 }}>
                  <T weight={800} size={14} lineHeight={19} color={colors.ink2} style={{ letterSpacing: 0.4 }}>
                    {e.offer.code || e.offer.label}
                  </T>
                  <T size={13} lineHeight={18} color={colors.muted}>
                    {e.line}
                  </T>
                </View>
              ))}
            </ListCard>
          </View>
        ) : null}

        <T size={13} lineHeight={20} color={colors.muted}>
          Frego gắn mã theo số tiền bạn được giảm, không theo tiền tài trợ.
        </T>
      </Sheet>
    </KeyboardAvoidingView>
  );
}
