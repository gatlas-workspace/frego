import { Pressable, View } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon, T } from '@/components/ui';
import { colors, HIT, shadow } from '@/theme/tokens';

function SquareButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Icon name={icon} size={20} color={colors.ink2} />
    </Pressable>
  );
}

/** Nút +/− (góc trên phải, như thongtincty). */
export function ZoomButtons({ onZoomIn, onZoomOut }: { onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 12, boxShadow: shadow.mapLabel, overflow: 'hidden' }}>
      <SquareButton icon="plus" label="Phóng to bản đồ" onPress={onZoomIn} />
      <View style={{ height: 1, backgroundColor: colors.line }} />
      <SquareButton icon="minus" label="Thu nhỏ bản đồ" onPress={onZoomOut} />
    </View>
  );
}

/** Ô đếm quán có voucher dùng được + nút canh lại bản đồ (góc dưới phải, như ô "Doanh nghiệp 79 / 1.111" của thongtincty). */
export function SponsorCounter({ count, onRecenter }: { count: number; onRecenter: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingLeft: 14,
        boxShadow: shadow.mapLabel,
      }}
    >
      <View accessible accessibilityLabel={`${count} quán tài trợ có voucher dùng được cho chuyến này`} style={{ paddingVertical: 8, gap: 2 }}>
        <T weight={700} size={11} lineHeight={13} color={colors.muted} style={{ letterSpacing: 0.6 }}>
          QUÁN TÀI TRỢ
        </T>
        <T weight={800} size={20} lineHeight={24}>
          {count}
          <T size={13} lineHeight={24} color={colors.muted}>
            {' dùng được'}
          </T>
        </T>
      </View>
      <View style={{ width: 1, alignSelf: 'stretch', marginVertical: 10, marginLeft: 12, backgroundColor: colors.line }} />
      <SquareButton icon="locate" label="Canh lại bản đồ theo chuyến" onPress={onRecenter} />
    </View>
  );
}
