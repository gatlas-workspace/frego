import { View } from 'react-native';
import type { IconName } from '@frego/core';
import { Icon, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

/** Danh sách chấm tròn tím (mục "Vì sao bạn được tặng"). */
export function BulletList({ items }: { items: string[] }) {
  return (
    <View accessibilityRole="list" style={{ gap: 8 }}>
      {items.map((text, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: 6, height: 6, marginTop: 8, borderRadius: 3, backgroundColor: colors.primary }}
          />
          <T size={14} lineHeight={21} color={colors.ink2} style={{ flex: 1, minWidth: 0 }}>
            {text}
          </T>
        </View>
      ))}
    </View>
  );
}

/** Danh sách điều kiện có icon tím 18 (dấu check, thẻ…). */
export function IconList({ items }: { items: { text: string; icon: IconName }[] }) {
  return (
    <View accessibilityRole="list" style={{ gap: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ marginTop: 2 }}>
            <Icon name={it.icon} size={18} color={colors.primary} strokeWidth={2} />
          </View>
          <T size={14} lineHeight={21} color={colors.ink2} style={{ flex: 1, minWidth: 0 }}>
            {it.text}
          </T>
        </View>
      ))}
    </View>
  );
}
