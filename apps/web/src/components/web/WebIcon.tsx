import { icons, type IconName, type IconShape } from '@frego/core';
import { webIcons, type WebIconName } from './icons-web';

/** Tên icon dùng được trên web quản lý: bộ chung của @frego/core + bộ riêng web (icons-web.ts). */
export type AnyIconName = IconName | WebIconName;

function shapesOf(name: AnyIconName): readonly IconShape[] {
  if (name in webIcons) return webIcons[name as WebIconName];
  return icons[name as IconName];
}

export type WebIconProps = {
  name: AnyIconName;
  /** Cạnh icon, px. Thiết kế web: 14–18. */
  size?: number;
  className?: string;
  /** Độ dày nét. Bộ chung 1,8; nút và ghi chú trong thiết kế dùng 2. */
  strokeWidth?: number;
  /** Có title → icon mang nghĩa (role="img"); không có → trang trí (aria-hidden). */
  title?: string;
};

/** Icon nét cho web quản lý. Màu theo `currentColor` (đặt bằng lớp text-*). */
export function WebIcon({ name, size = 16, className, strokeWidth = 1.8, title }: WebIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none', display: 'block' }}
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      {shapesOf(name).map((s, i) => {
        if (s.kind === 'path') return <path key={i} d={s.d} strokeDasharray={s.dash} />;
        if (s.kind === 'circle') return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
        return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />;
      })}
    </svg>
  );
}
