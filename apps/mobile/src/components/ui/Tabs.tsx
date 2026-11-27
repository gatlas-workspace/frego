import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from './Text';
import { VehicleArt, type VehicleKind } from './VehicleTile';
import { colors, radius, shadow } from '@/theme/tokens';

export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  /** Minh họa xe trên chữ (tab Loại xe, ô cao 76): bike | car | suv. */
  icon?: VehicleKind;
  /** Số đếm nối sau chữ: "Chưa báo giá · 1". */
  count?: number | string;
}

export interface TabsProps<K extends string = string> {
  /** Các ô (design `items`). Nhận thẳng `ComparisonView.tabs` (key, label, icon). */
  items: readonly TabItem<K>[];
  /** Ô đang chọn. */
  value: K;
  onChange: (key: K) => void;
  /** Tên nhóm cho trình đọc màn hình (design `label`, VD "Lọc thông báo", "Loại xe"). */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** UiTabs: tab phân đoạn trên rãnh xám, ô chọn nền trắng nổi nhẹ. */
export function Tabs<K extends string = string>({ items, value, onChange, accessibilityLabel, style }: TabsProps<K>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[{ flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.block, backgroundColor: colors.track }, style]}
    >
      {items.map((t) => {
        const on = t.key === value;
        const text = t.count !== undefined && t.count !== '' ? `${t.label} · ${t.count}` : t.label;
        const withIcon = !!t.icon;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            accessibilityRole="tab"
            accessibilityLabel={text}
            accessibilityState={{ selected: on }}
            style={({ pressed }) => [
              {
                flex: 1,
                minWidth: 0,
                borderRadius: radius.small,
                alignItems: 'center',
                justifyContent: 'center',
              },
              withIcon
                ? { height: 76, paddingTop: 6, paddingBottom: 8, paddingHorizontal: 4, gap: 4 }
                : { height: 44, paddingHorizontal: 6 },
              on ? { backgroundColor: colors.surface, boxShadow: shadow.segment } : pressed ? { backgroundColor: colors.line } : null,
            ]}
          >
            {t.icon ? <VehicleArt kind={t.icon} width={56} height={30} /> : null}
            <T
              weight={on ? 700 : 600}
              size={withIcon ? 13 : 14}
              lineHeight={withIcon ? 16 : 18}
              color={on ? colors.ink : colors.ink2}
              numberOfLines={1}
              align="center"
            >
              {text}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}
