import { View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface PickupRowProps {
  /** Dòng đậm dưới nhãn "Điểm đón", VD "Vị trí hiện tại". */
  value: string;
  style?: StyleProp<ViewStyle>;
}

/** Dòng "Điểm đón" có chấm vòng tím (thẻ tìm chuyến ở Trang chủ, đầu màn Tìm kiếm). */
export function PickupRow({ value, style }: PickupRowProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Điểm đón: ${value}`}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          borderWidth: 3,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        }}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
        <T weight={600} size={12} lineHeight={16} color={colors.muted}>
          Điểm đón
        </T>
        <T weight={700} size={15} lineHeight={20}>
          {value}
        </T>
      </View>
    </View>
  );
}
