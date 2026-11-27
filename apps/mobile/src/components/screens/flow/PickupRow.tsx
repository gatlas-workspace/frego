import { router } from 'expo-router';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors, HIT } from '@/theme/tokens';

export interface PickupRowProps {
  /** Dòng đậm dưới nhãn "Điểm đón", VD "Vị trí hiện tại · 720A Điện Biên Phủ". */
  value: string;
  style?: StyleProp<ViewStyle>;
}

/** Dòng "Điểm đón" có chấm vòng tím (thẻ tìm chuyến ở Trang chủ, đầu màn Tìm kiếm). Bấm để đổi điểm đón. */
export function PickupRow({ value, style }: PickupRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Điểm đón: ${value}`}
      accessibilityHint="Mở màn đổi điểm đón"
      onPress={() => router.push('/diem-don')}
      style={({ pressed }) => [
        { minHeight: HIT, flexDirection: 'row', alignItems: 'center', gap: 10, opacity: pressed ? 0.7 : 1 },
        style,
      ]}
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
        <T weight={700} size={15} lineHeight={20} numberOfLines={1}>
          {value}
        </T>
      </View>
      <T weight={700} size={14} lineHeight={20} color={colors.primary}>
        Đổi
      </T>
    </Pressable>
  );
}
