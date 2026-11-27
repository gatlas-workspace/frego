import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { icons, type IconName } from '@frego/core';
import { colors } from '@/theme/tokens';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Icon nét 1,8 dùng chung (dữ liệu trong @frego/core/icons). Trang trí: không đọc bởi trình đọc màn hình. */
export function Icon({ name, size = 22, color = colors.ink, strokeWidth = 1.8 }: IconProps) {
  const shapes = icons[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      {shapes.map((s, i) => {
        if (s.kind === 'path') return <Path key={i} d={s.d} strokeDasharray={s.dash} />;
        if (s.kind === 'circle') return <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
        return <Rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />;
      })}
    </Svg>
  );
}
