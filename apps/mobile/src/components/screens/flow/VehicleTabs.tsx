import { Pressable, View } from 'react-native';
import type { VehicleClass } from '@frego/core';
import { T, VehicleArt, vehicleKind } from '@/components/ui';
import { pressScale } from '@/components/motion';
import { colors } from '@/theme/tokens';

export interface VehicleTabsProps {
  items: { key: VehicleClass; label: string }[];
  value: VehicleClass;
  onChange: (v: VehicleClass) => void;
}

/** Ba ô loại xe có hình xe (So giá v3), ô đang chọn viền tím. */
export function VehicleTabs({ items, value, onChange }: VehicleTabsProps) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel="Loại xe" style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((t) => {
        const on = t.key === value;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => !on && onChange(t.key)}
            style={({ pressed }) => [
              {
                flex: 1,
                minWidth: 0,
                height: 76,
                paddingHorizontal: 4,
                borderRadius: 14,
                borderWidth: on ? 2 : 1.5,
                borderColor: on ? colors.primary : colors.line,
                backgroundColor: on ? colors.primarySoft : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              },
              pressScale(pressed),
            ]}
          >
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <VehicleArt kind={vehicleKind(t.key)} width={56} />
            </View>
            <T weight={on ? 800 : 600} size={13} lineHeight={16} numberOfLines={1}>
              {t.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

