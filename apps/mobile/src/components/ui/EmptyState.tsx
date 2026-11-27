import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { T } from './Text';
import { Float } from '@/components/motion';
import { colors } from '@/theme/tokens';

/** Hình vé trống (Ví lần đầu v3). */
function TicketArt() {
  return (
    <Svg width={160} height={112} viewBox="0 0 160 112" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Ellipse cx={80} cy={104} rx={56} ry={5} fill={colors.line} />
      <Rect x={22} y={26} width={116} height={66} rx={12} fill={colors.primarySoft} />
      <Path d="M22 46h116v10a9 9 0 0 0 0 18v6a12 12 0 0 1-12 12H34a12 12 0 0 1-12-12v-6a9 9 0 0 0 0-18Z" fill={colors.surface} stroke={colors.onPrimarySoft} strokeWidth={2} />
      <Path d="M60 50v36" stroke={colors.onPrimarySoft} strokeWidth={2} strokeDasharray="4 4" />
      <Rect x={72} y={60} width={44} height={8} rx={4} fill={colors.primarySoft} />
      <Rect x={72} y={74} width={28} height={6} rx={3} fill={colors.surfaceAlt} />
      <Circle cx={118} cy={22} r={14} fill={colors.deal} />
      <Path d="M112 22h12M118 16v12" stroke={colors.dealInk} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

/** Trạng thái trống có hình, tiêu đề, lời gợi ý và phần hành động tùy chọn. */
export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 8, paddingHorizontal: 12 }}>
        <Float>
          <TicketArt />
        </Float>
        <T accessibilityRole="header" weight={800} size={19} lineHeight={25} align="center" style={{ letterSpacing: -0.2 }}>
          {title}
        </T>
        <T size={14} lineHeight={21} color={colors.ink2} align="center">
          {text}
        </T>
      </View>
      {children}
    </View>
  );
}
