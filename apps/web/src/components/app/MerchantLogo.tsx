import { Icon } from "@/components/Icon";
import { ProviderLogo } from "./ProviderLogo";

/** Logo trên vé voucher: icon quán, chữ F (Frego) hoặc logo Grab ("gr"). */
export type MerchantLogoKind = "cup" | "bowl" | "lotus" | "gym" | "book" | "cake" | "f" | "gr";

const shop = {
  cup: { bg: "bg-app-logo-cup", icon: "cup" },
  bowl: { bg: "bg-app-logo-bowl", icon: "bowl" },
  lotus: { bg: "bg-app-logo-lotus", icon: "lotus" },
  gym: { bg: "bg-app-logo-gym", icon: "gym" },
  book: { bg: "bg-app-logo-book", icon: "book" },
  cake: { bg: "bg-app-logo-cake", icon: "cake" },
} as const;

export type MerchantLogoProps = {
  logo: MerchantLogoKind;
  /** Cạnh ô, px. Vé voucher: 52. */
  size?: number;
  /** Bo góc, px. Vé voucher: 14. */
  radius?: number;
  /** Cỡ icon, px. Vé voucher: 28. */
  iconSize?: number;
  strokeWidth?: number;
};

export function MerchantLogo({ logo, size = 52, radius = 14, iconSize = 28, strokeWidth = 1.6 }: MerchantLogoProps) {
  const box = { width: size, height: size, borderRadius: radius };
  if (logo === "gr") {
    return <ProviderLogo provider="grab" size={size} className="border border-app-line" />;
  }
  if (logo === "f") {
    return (
      <span
        aria-hidden="true"
        className="flex flex-none items-center justify-center bg-app-primary font-extrabold text-white"
        style={{ ...box, fontSize: Math.round(size * 0.46) }}
      >
        F
      </span>
    );
  }
  const s = shop[logo];
  return (
    <span aria-hidden="true" className={`flex flex-none items-center justify-center text-white ${s.bg}`} style={box}>
      <Icon name={s.icon} size={iconSize} strokeWidth={strokeWidth} />
    </span>
  );
}
