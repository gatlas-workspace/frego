import type { CategoryKey } from '@frego/core';
import { WebIcon, cx } from '@/components/web';

/** Bán kính vẽ trên bản đồ minh họa 520 × 170 (thiết kế WebDnTaoChienDich). */
const CIRCLE_R: Record<number, number> = { 300: 32, 500: 50, 800: 66, 1000: 78 };

const PIN: Record<CategoryKey, { fill: string; icon: 'cup' | 'bowl' | 'lotus' | 'gym' | 'book' | 'cake' }> = {
  cafe: { fill: 'fill-app-logo-cup', icon: 'cup' },
  bowl: { fill: 'fill-app-logo-bowl', icon: 'bowl' },
  tea: { fill: 'fill-app-logo-lotus', icon: 'lotus' },
  gym: { fill: 'fill-app-logo-gym', icon: 'gym' },
  book: { fill: 'fill-app-logo-book', icon: 'book' },
  cake: { fill: 'fill-app-logo-cake', icon: 'cake' },
};

/** Bản đồ minh họa vùng áp dụng: vòng tròn bán kính quanh ghim quán (không phải bản đồ thật). */
export function RadiusMap({ radiusM, radiusText, name, category }: { radiusM: number; radiusText: string; name: string; category: CategoryKey }) {
  const r = CIRCLE_R[radiusM] ?? Math.max(24, Math.min(80, radiusM / 12));
  const pin = PIN[category] ?? PIN.cafe;
  const nameW = Math.max(60, Math.round(name.length * 6.6 + 16));
  const radiusW = Math.max(44, Math.round(radiusText.length * 7 + 16));
  return (
    <svg
      viewBox="0 0 520 170"
      width="100%"
      role="img"
      aria-label={`Bản đồ vùng áp dụng: vòng tròn ${radiusText} quanh ${name}`}
      className="block rounded-frame border border-line"
    >
      <rect x="0" y="0" width="520" height="170" className="fill-app-bg" />
      <path d="M0 34 H520 M0 128 H520 M96 0 V170 M410 0 V170 M0 160 L520 14" className="fill-none stroke-white" strokeWidth={9} />
      <path d="M0 82 H520 M250 0 V170 M470 0 V170 M160 0 V170" className="fill-none stroke-white" strokeWidth={4} />
      <circle
        cx="260"
        cy="85"
        r={r}
        className="fill-accent-orange/10 stroke-accent-orange transition-[r] duration-200"
        strokeWidth={1.5}
        strokeDasharray="5 4"
      />
      <circle cx="260" cy="85" r="12" className={cx(pin.fill, 'stroke-white')} strokeWidth={3} />
      <g transform="translate(252.5 77.5)" className="text-white">
        <WebIcon name={pin.icon} size={15} strokeWidth={2.4} />
      </g>
      <rect x={260 - nameW / 2} y="50" width={nameW} height="18" rx="4" className="fill-white stroke-line" />
      <text x="260" y="63" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        {name}
      </text>
      <rect x={260 - radiusW / 2} y="104" width={radiusW} height="18" rx="4" className="fill-white stroke-line" />
      <text x="260" y="117" textAnchor="middle" className="fill-tag-orange-ink text-[11px] font-semibold">
        {radiusText}
      </text>
    </svg>
  );
}
