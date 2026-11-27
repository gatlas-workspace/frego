import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { PROVIDERS, SERVICES, type AttachItemView, type ServiceKey } from '@frego/core';
import { Icon, T, VehicleBox } from '@/components/ui';
import { pressScale } from '@/components/motion';
import { colors, radius } from '@/theme/tokens';

const TAG_TEXT: Record<AttachItemView['tag'], string> = { sponsor: 'Quán tài trợ', frego: 'Frego', public: 'Công khai' };

/** Một mã trong nhóm: cột số tiền + nguồn, tên + điều kiện, nút Gắn/Đã gắn. */
const CodeRow = memo(function CodeRow({ it, first, onToggle }: { it: AttachItemView; first: boolean; onToggle: (it: AttachItemView) => void }) {
  return (
    <View style={{ minHeight: 72, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
      <View style={{ width: 76, gap: 2 }}>
        <T weight={800} size={16} lineHeight={20} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
          {it.amountText}
        </T>
        <T weight={600} size={11} lineHeight={14} color={it.tag === 'frego' ? colors.primary : colors.dealInk} numberOfLines={1}>
          {TAG_TEXT[it.tag]}
        </T>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <T weight={800} size={14} lineHeight={19} numberOfLines={1}>
          {it.name}
        </T>
        <T size={12} lineHeight={17} color={colors.muted} numberOfLines={2}>
          {[it.conditionLine, it.metaText].filter(Boolean).join(' · ')}
        </T>
      </View>
      <Pressable
        onPress={() => onToggle(it)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: it.attached }}
        accessibilityLabel={`${it.attached ? 'Bỏ gắn' : 'Gắn'} ${it.name} ${it.amountText}`}
        style={({ pressed }) => [
          {
            minWidth: 84,
            minHeight: 44,
            paddingHorizontal: 12,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            backgroundColor: it.attached ? colors.primary : colors.surface,
            borderWidth: it.attached ? 0 : 1.5,
            borderColor: colors.handle,
          },
          pressScale(pressed),
        ]}
      >
        {it.attached ? <Icon name="check" size={16} color={colors.white} strokeWidth={2.6} /> : null}
        <T weight={800} size={14} lineHeight={18} color={it.attached ? colors.white : colors.ink}>
          {it.attached ? 'Đã gắn' : 'Gắn'}
        </T>
      </Pressable>
    </View>
  );
});

/** Nhóm mã theo hãng + loại xe (Gắn voucher v3): đầu nhóm ô xe nhỏ, "1 mã mỗi chuyến". */
export const CodeGroup = memo(function CodeGroup({ service, items, onToggle }: { service: ServiceKey; items: AttachItemView[]; onToggle: (it: AttachItemView) => void }) {
  const svc = SERVICES[service];
  return (
    <View style={{ gap: 8 }}>
      <View accessibilityRole="header" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 52, height: 43, marginLeft: -4 }}>
          <View style={{ transform: [{ scale: 0.69 }], transformOrigin: 'left top' }}>
            <VehicleBox brand={svc.providerId} kind={svc.vehicleClass} logoOffset={0} style={{ marginLeft: 6, marginTop: 6 }} />
          </View>
        </View>
        <T weight={800} size={14} lineHeight={19} style={{ flex: 1 }}>
          {PROVIDERS[svc.providerId].name}
        </T>
        <T weight={600} size={12} lineHeight={16} color={colors.muted}>
          1 mã mỗi chuyến
        </T>
      </View>
      <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}>
        {items.map((it, i) => (
          <CodeRow key={`${it.refId}:${it.service}`} it={it} first={i === 0} onToggle={onToggle} />
        ))}
      </View>
    </View>
  );
});
