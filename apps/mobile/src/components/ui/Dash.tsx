import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '@/theme/tokens';

export interface DashLineProps {
  /** Dọc (kéo theo chiều cao khung cha) hoặc ngang (theo chiều rộng). */
  direction?: 'vertical' | 'horizontal';
  /** Màu (mặc định đường răng cưa của vé #E8B48F). */
  color?: string;
  /** Độ dày (thiết kế: 2). */
  thickness?: number;
  /** Mẫu nét đứt (dài, hở). */
  dash?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Đường nét đứt một cạnh (thay CSS `border-left/top: 2px dashed`, vì Android không vẽ nét đứt cho một cạnh).
 * Dọc: tự kéo dài theo chiều cao hàng chứa nó (alignSelf stretch).
 */
export function DashLine({ direction = 'vertical', color = colors.ticketDash, thickness = 2, dash = '6 5', style }: DashLineProps) {
  const v = direction === 'vertical';
  const len = 2000;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[v ? { width: thickness, alignSelf: 'stretch' } : { height: thickness, alignSelf: 'stretch' }, { overflow: 'hidden' }, style]}
    >
      <Svg width={v ? thickness : len} height={v ? len : thickness} style={{ position: 'absolute', left: 0, top: 0 }}>
        {v ? (
          <Line x1={thickness / 2} y1={0} x2={thickness / 2} y2={len} stroke={color} strokeWidth={thickness} strokeDasharray={dash} />
        ) : (
          <Line x1={0} y1={thickness / 2} x2={len} y2={thickness / 2} stroke={color} strokeWidth={thickness} strokeDasharray={dash} />
        )}
      </Svg>
    </View>
  );
}
