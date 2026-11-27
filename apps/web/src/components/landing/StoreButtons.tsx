import { brand } from "@frego/core";

/**
 * Nút tải app và mã QR. Theo ghi chú thiết kế: nút và mã QR là MẪU, chưa có link
 * App Store / Google Play (link lấy từ `brand.web`, hiện trỏ về mục #tai-app).
 */

type Variant = "dark" | "light" | "white" | "ghost";

const VARIANT: Record<Variant, string> = {
  dark: "bg-app-ink text-white shadow-app-dark hover:bg-app-ink-2",
  light: "bg-app-surface text-app-ink shadow-app-ring-strong hover:bg-app-alt",
  white: "bg-app-surface text-app-primary-deep hover:bg-app-primary-soft",
  ghost: "bg-transparent text-white shadow-app-ring-white hover:bg-app-on-primary-fill",
};

function PhoneGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="block flex-none"
    >
      <rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6" />
      <path d="M10.5 18h3" />
    </svg>
  );
}

export function StoreButton({ platform, variant }: { platform: "ios" | "android"; variant: Variant }) {
  const href = platform === "ios" ? brand.web.appStoreUrl : brand.web.playStoreUrl;
  return (
    <a
      href={href}
      className={`flex h-[60px] items-center gap-3 rounded-app-block pl-[18px] pr-[22px] transition-colors ${VARIANT[variant]}`}
    >
      <PhoneGlyph />
      <span className="flex flex-col leading-[1.2]">
        <span aria-hidden="true" className="text-xs font-semibold opacity-80">
          Có trên
        </span>
        <span className="text-[17px] font-extrabold">{platform === "ios" ? "Tải cho iPhone" : "Tải cho Android"}</span>
      </span>
    </a>
  );
}

/** Mô-đun của mã QR mẫu trong thiết kế (lưới 21 × 21), gộp thành một path. */
const QR_PATH =
  "M0 0h7v1h-7zM10 0h1v1h-1zM14 0h7v1h-7zM0 1h1v1h-1zM6 1h1v1h-1zM8 1h1v1h-1zM14 1h1v1h-1zM20 1h1v1h-1zM0 2h1v1h-1zM2 2h3v1h-3zM6 2h1v1h-1zM8 2h1v1h-1zM14 2h1v1h-1zM16 2h3v1h-3zM20 2h1v1h-1zM0 3h1v1h-1zM2 3h3v1h-3zM6 3h1v1h-1zM8 3h3v1h-3zM14 3h1v1h-1zM16 3h3v1h-3zM20 3h1v1h-1zM0 4h1v1h-1zM2 4h3v1h-3zM6 4h1v1h-1zM8 4h1v1h-1zM11 4h2v1h-2zM14 4h1v1h-1zM16 4h3v1h-3zM20 4h1v1h-1zM0 5h1v1h-1zM6 5h1v1h-1zM9 5h3v1h-3zM14 5h1v1h-1zM20 5h1v1h-1zM0 6h7v1h-7zM8 6h3v1h-3zM12 6h1v1h-1zM14 6h7v1h-7zM9 7h1v1h-1zM11 7h1v1h-1zM2 8h2v1h-2zM6 8h1v1h-1zM8 8h3v1h-3zM14 8h1v1h-1zM17 8h2v1h-2zM20 8h1v1h-1zM0 9h1v1h-1zM2 9h1v1h-1zM5 9h2v1h-2zM9 9h2v1h-2zM15 9h1v1h-1zM18 9h3v1h-3zM4 10h2v1h-2zM11 10h4v1h-4zM16 10h4v1h-4zM0 11h1v1h-1zM2 11h5v1h-5zM11 11h1v1h-1zM13 11h3v1h-3zM17 11h1v1h-1zM19 11h2v1h-2zM0 12h2v1h-2zM4 12h3v1h-3zM9 12h2v1h-2zM12 12h9v1h-9zM8 13h1v1h-1zM10 13h1v1h-1zM12 13h1v1h-1zM16 13h3v1h-3zM0 14h7v1h-7zM8 14h1v1h-1zM10 14h1v1h-1zM12 14h1v1h-1zM15 14h1v1h-1zM19 14h1v1h-1zM0 15h1v1h-1zM6 15h1v1h-1zM9 15h1v1h-1zM11 15h1v1h-1zM13 15h3v1h-3zM19 15h2v1h-2zM0 16h1v1h-1zM2 16h3v1h-3zM6 16h1v1h-1zM8 16h3v1h-3zM12 16h7v1h-7zM0 17h1v1h-1zM2 17h3v1h-3zM6 17h1v1h-1zM8 17h1v1h-1zM10 17h2v1h-2zM13 17h2v1h-2zM17 17h2v1h-2zM0 18h1v1h-1zM2 18h3v1h-3zM6 18h1v1h-1zM10 18h1v1h-1zM18 18h1v1h-1zM0 19h1v1h-1zM6 19h1v1h-1zM11 19h4v1h-4zM16 19h1v1h-1zM19 19h2v1h-2zM0 20h7v1h-7zM8 20h2v1h-2zM13 20h2v1h-2zM17 20h3v1h-3z";

export function QrCode({ size }: { size: number }) {
  return (
    <svg
      viewBox="-1 -1 23 23"
      width={size}
      height={size}
      role="img"
      aria-label={`Mã QR tải app ${brand.name} (mẫu)`}
      shapeRendering="crispEdges"
      className="block flex-none bg-app-surface"
    >
      <path d={QR_PATH} className="fill-app-ink" />
    </svg>
  );
}
