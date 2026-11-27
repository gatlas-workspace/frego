import { icons, type IconName } from "@frego/core";

/** Icon nét 1,8 dùng chung với app (dữ liệu trong @frego/core). Trang trí → aria-hidden. */
export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.8,
  title,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** Có title → icon mang nghĩa (role="img") */
  title?: string;
}) {
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
      style={{ flex: "none", display: "block" }}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {icons[name].map((s, i) => {
        if (s.kind === "path") return <path key={i} d={s.d} strokeDasharray={s.dash} />;
        if (s.kind === "circle") return <circle key={i} cx={s.cx} cy={s.cy} r={s.r} />;
        return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} />;
      })}
    </svg>
  );
}
