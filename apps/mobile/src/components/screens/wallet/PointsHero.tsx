import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { T } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';
import { ProgressBar } from './ProgressBar';

export interface PointsHeroProps {
  pointsText: string;
  /** 0–1: tiến độ tới quà đắt nhất. */
  progress: number;
  progressText: string;
}

/** Thẻ tím "Điểm của bạn": số điểm lớn, thanh tiến độ trắng, hai vòng trang trí góc phải. */
export function PointsHero({ pointsText, progress, progressText }: PointsHeroProps) {
  return (
    <View
      accessible
      accessibilityLabel={`Điểm của bạn: ${pointsText} điểm. ${progressText}`}
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: colors.primary, borderRadius: radius.card, padding: 20, gap: 14, overflow: 'hidden' }}
    >
      <Svg
        width={350}
        height={180}
        viewBox="0 0 350 180"
        pointerEvents="none"
        style={{ position: 'absolute', right: 0, top: 0 }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Circle cx={330} cy={0} r={96} fill={colors.bannerCircle1} />
        <Circle cx={300} cy={190} r={60} fill={colors.bannerCircle2} />
      </Svg>
      <View style={{ gap: 2 }}>
        <T weight={600} size={13} lineHeight={18} color={colors.onPrimarySoft}>
          Điểm của bạn
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <T weight={800} size={40} lineHeight={44} color={colors.white} style={{ letterSpacing: -1, fontVariant: ['tabular-nums'] }}>
            {pointsText}
          </T>
          <T weight={700} size={16} lineHeight={22} color={colors.white}>
            điểm
          </T>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <ProgressBar value={progress} track={colors.onPrimaryTrack} fill={colors.white} />
        {progressText ? (
          <T size={13} lineHeight={19} color={colors.onPrimarySoft}>
            {progressText}
          </T>
        ) : null}
      </View>
    </View>
  );
}
