import { PROVIDERS, type ProviderId } from "@frego/core";

/**
 * Logo hãng xe (Grab, Be, Green SM) — ảnh logo thật trong `public/logos/`, cùng file app dùng.
 * Luôn là trang trí (aria-hidden): tên hãng đã có ở chữ bên cạnh.
 */
export const PROVIDER_LOGO_SRC: Record<ProviderId, string> = {
  grab: "/logos/grab.png",
  be: "/logos/be.png",
  gsm: "/logos/gsm.png",
};

export type ProviderLogoProps = {
  provider: ProviderId;
  /** Cạnh ô, px (thiết kế: 30, 36, 40, 52). */
  size?: number;
  /** Bo góc, viền, bóng theo chỗ dùng. */
  className?: string;
};

export function ProviderLogo({ provider, size = 30, className = "" }: ProviderLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo nhỏ, tĩnh; chạy tốt cả trong trình duyệt Zalo/Facebook
    <img
      src={PROVIDER_LOGO_SRC[provider]}
      alt=""
      aria-hidden="true"
      data-provider={PROVIDERS[provider].mono}
      width={size}
      height={size}
      className={`box-border block flex-none overflow-hidden bg-white object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
