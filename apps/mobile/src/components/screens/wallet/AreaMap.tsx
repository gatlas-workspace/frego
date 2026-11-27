import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors, fontFamily } from '@/theme/tokens';

export interface AreaMapProps {
  /** Tên quán ở tâm vòng tròn. */
  businessName: string;
  /** Bán kính dạng chữ, VD "500 m". */
  radiusText: string;
  /** Nơi bạn hay đến nằm trong vùng (VD "Chợ Bến Thành"); bỏ trống thì không vẽ. */
  placeLabel?: string | null;
  style?: StyleProp<ViewStyle>;
}

const W = 348;
const H = 170;
const LABEL_FONT = 12;

/** Ước lượng bề rộng nhãn (12px, đậm 700) để khung trắng ôm vừa chữ. */
function labelWidth(text: string) {
  return Math.round(text.length * 7 + 16);
}

/**
 * Bản đồ nhỏ minh họa vùng áp dụng mã: vòng tròn bán kính quanh quán (tâm), đường phố,
 * nhãn bán kính và nơi bạn hay đến nằm trong vòng tròn. Dựng theo SVG 348×170 của thiết kế.
 */
export function AreaMap({ businessName, radiusText, placeLabel, style }: AreaMapProps) {
  const cx = 164;
  const cy = 84;
  const bizW = labelWidth(businessName);
  const placeW = placeLabel ? labelWidth(placeLabel) : 0;
  const a11y = placeLabel
    ? `Bản đồ: vòng tròn ${radiusText} quanh ${businessName}, ${placeLabel} nằm bên trong vòng tròn`
    : `Bản đồ: vòng tròn ${radiusText} quanh ${businessName}`;
  const label = { fontFamily: fontFamily[700], fontSize: LABEL_FONT, textAnchor: 'middle' as const };
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11y}
      style={[{ width: '100%', aspectRatio: W / H, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.mapBg }, style]}
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} pointerEvents="none">
        <Rect x={0} y={0} width={W} height={H} fill={colors.mapBg} />
        <Path d="M0 36 H348 M0 128 H348 M64 0 V170 M262 0 V170 M0 150 L348 10" fill="none" stroke={colors.white} strokeWidth={8} />
        <Path d="M0 82 H348 M160 0 V170 M312 0 V170" fill="none" stroke={colors.white} strokeWidth={4} />
        <Circle cx={cx} cy={cy} r={70} fill={colors.areaFill} stroke={colors.badge} strokeWidth={2} strokeDasharray="6 5" />
        <Path d={`M${cx} ${cy} H${cx - 70}`} fill="none" stroke={colors.badge} strokeWidth={1.5} strokeDasharray="3 3" />
        <Rect x={98} y={88} width={48} height={18} rx={9} fill={colors.white} />
        <SvgText x={122} y={101} fill={colors.dealInk} {...label}>
          {radiusText}
        </SvgText>
        <Circle cx={cx} cy={cy} r={13} fill={colors.catCafe} stroke={colors.white} strokeWidth={3} />
        <G transform="translate(155.7 73.2) scale(0.667)" fill="none" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6.5 12.5h10V15a5 5 0 0 1-10 0Z" />
          <Path d="M16.5 13.5h1.2a1.9 1.9 0 0 1 0 3.8h-1.6" />
        </G>
        <Rect x={cx - bizW / 2} y={44} width={bizW} height={20} rx={10} fill={colors.white} />
        <SvgText x={cx} y={58} fill={colors.ink} {...label}>
          {businessName}
        </SvgText>
        {placeLabel ? (
          <>
            <Circle cx={200} cy={120} r={10} fill={colors.primary} stroke={colors.white} strokeWidth={3} />
            <Circle cx={200} cy={120} r={3.5} fill={colors.white} />
            <Rect x={216} y={110} width={placeW} height={20} rx={10} fill={colors.white} />
            <SvgText x={216 + placeW / 2} y={124} fill={colors.ink} {...label}>
              {placeLabel}
            </SvgText>
          </>
        ) : null}
      </Svg>
    </View>
  );
}
