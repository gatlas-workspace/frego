import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, MapRoute } from '@/components/ui';

/** Chiều cao bản đồ phía trên tấm trượt (KetQua, ChonHang): 250 như khung 844; máy thấp thì thu lại để còn chỗ cho nội dung. */
export const MAP_HEIGHT = 250;
const MAP_MIN = 160;

export interface MapHeaderProps {
  from?: string;
  to?: string;
  /** Nhãn nút quay lại, VD "Quay lại chọn điểm đến". */
  backLabel: string;
  onBack: () => void;
}

/** Bản đồ tuyến 250px + nút quay lại trắng nổi ở góc trên trái (dưới vùng an toàn). */
export function MapHeader({ from, to, backLabel, onBack }: MapHeaderProps) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();
  const h = Math.round(Math.min(MAP_HEIGHT, Math.max(MAP_MIN, screenH * 0.3)));
  return (
    <View style={{ height: h }}>
      <MapRoute height={h} from={from} to={to} />
      <BackButton
        variant="float"
        onPress={onBack}
        accessibilityLabel={backLabel}
        style={{ position: 'absolute', top: Math.max(insets.top + 8, 52), left: 16 }}
      />
    </View>
  );
}
