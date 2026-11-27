import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { T } from './Text';
import { colors, shadow } from '@/theme/tokens';

export interface MapRouteProps {
  /** Chiều cao (design `height`): 250 phía trên tấm trượt, 844 làm nền toàn màn. Mặc định 250. Truyền `'100%'` để lấp khung cha. */
  height?: number | '100%';
  /** Hiện nhãn điểm đi/đến (design `labels`, mặc định true). */
  labels?: boolean;
  /** Nhãn điểm đi (design `from`), VD "Landmark 81". */
  from?: string;
  /** Nhãn điểm đến (design `to`), VD "Chợ Bến Thành". */
  to?: string;
  style?: StyleProp<ViewStyle>;
}

const ROUTE = 'M330 66 C 304 74, 292 92, 276 92 L 186 92 C 168 92, 160 124, 142 146 L 110 186 C 98 200, 82 206, 66 210';

function Label({ text, left, top }: { text: string; left: number; top: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: colors.surface,
        boxShadow: shadow.mapLabel,
      }}
    >
      <T weight={700} size={12} lineHeight={14} numberOfLines={1}>
        {text}
      </T>
    </View>
  );
}

/** UiMapRoute: bản đồ minh họa tuyến đường (không phải bản đồ thật). Trang trí: ẩn với trình đọc màn hình. */
export function MapRoute({ height = 250, labels = true, from, to, style }: MapRouteProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[{ position: 'relative', width: '100%', height, overflow: 'hidden', backgroundColor: colors.mapBg }, style]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 320"
        preserveAspectRatio="xMidYMin slice"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <Rect width={390} height={320} fill={colors.mapBg} />
        <Path d="M-20 262 C 60 232, 120 282, 200 252 S 330 202, 410 226 L410 330 L-20 330 Z" fill={colors.mapWater} />
        <Rect x={24} y={36} width={72} height={44} rx={12} fill={colors.mapPark} />
        <Rect x={290} y={196} width={76} height={40} rx={12} fill={colors.mapPark} />
        <G fill={colors.mapBlock}>
          <Rect x={120} y={30} width={56} height={50} rx={9} />
          <Rect x={198} y={30} width={68} height={50} rx={9} />
          <Rect x={288} y={104} width={78} height={40} rx={9} />
          <Rect x={24} y={104} width={72} height={62} rx={9} />
          <Rect x={120} y={104} width={56} height={30} rx={9} />
          <Rect x={198} y={104} width={68} height={62} rx={9} />
          <Rect x={24} y={198} width={72} height={34} rx={9} />
          <Rect x={120} y={198} width={146} height={30} rx={9} />
          <Rect x={288} y={30} width={78} height={20} rx={9} />
        </G>
        <Path d="M0 92 H390 M0 186 H390 M108 0 V320 M186 0 V320 M276 0 V320" fill="none" stroke={colors.white} strokeWidth={12} />
        <Path d="M0 18 H390 M0 160 L390 64" fill="none" stroke={colors.white} strokeWidth={5} />
        <Path d={ROUTE} fill="none" stroke={colors.white} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        <Path d={ROUTE} fill="none" stroke={colors.primary} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={330} cy={66} r={11} fill={colors.white} />
        <Circle cx={330} cy={66} r={7} fill="none" stroke={colors.ink} strokeWidth={4} />
        <Path
          d="M66 214 C 58 204, 50 196, 50 186 A16 16 0 1 1 82 186 C 82 196, 74 204, 66 214 Z"
          fill={colors.primary}
          stroke={colors.white}
          strokeWidth={3}
        />
        <Circle cx={66} cy={186} r={6} fill={colors.white} />
      </Svg>
      {labels && from ? <Label text={from} left={216} top={30} /> : null}
      {labels && to ? <Label text={to} left={20} top={128} /> : null}
    </View>
  );
}
