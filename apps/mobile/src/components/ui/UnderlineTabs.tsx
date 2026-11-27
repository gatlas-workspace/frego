import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from './Text';
import { colors, HIT, radius } from '@/theme/tokens';

export interface UnderlineTabItem<K extends string = string> {
  key: K;
  label: string;
  /** Huy hiệu số sau chữ (bỏ trống thì không hiện). */
  count?: number;
}

export interface UnderlineTabsProps<K extends string = string> {
  items: readonly UnderlineTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Tab gạch chân có huy hiệu số (Ví voucher v3): dàn đều hết chiều ngang, không tràn. */
export function UnderlineTabs<K extends string = string>({ items, value, onChange, accessibilityLabel, style }: UnderlineTabsProps<K>) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={[{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, style]}>
      {items.map((t) => {
        const on = t.key === value;
        const hasCount = typeof t.count === 'number' && t.count > 0;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={hasCount ? `${t.label}, ${t.count}` : t.label}
            style={{ minHeight: HIT, paddingBottom: 2, borderBottomWidth: 3, borderBottomColor: on ? colors.primary : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <T weight={on ? 800 : 600} size={14} lineHeight={18} color={on ? colors.ink : colors.ink2} numberOfLines={1}>
              {t.label}
            </T>
            {hasCount ? (
              <View style={{ minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: on ? colors.primary : colors.track, alignItems: 'center', justifyContent: 'center' }}>
                <T weight={800} size={12} lineHeight={14} color={on ? colors.white : colors.ink2} style={{ fontVariant: ['tabular-nums'] }}>
                  {t.count}
                </T>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
