import { PROVIDERS, type ProviderId } from "@frego/core";

/**
 * Ô logo hãng xe (Grab, Be, Green SM) như ảnh logo trong thiết kế.
 * Bản xuất thiết kế không kèm file logo chính thức, nên tạm vẽ ô màu hãng + chữ viết tắt
 * (`PROVIDERS[id].mono`). Có file logo thì thay phần thân bằng <img> trong `public/`.
 * Luôn là trang trí (aria-hidden): tên hãng đã có ở chữ bên cạnh.
 */
const tone: Record<ProviderId, string> = {
  grab: "bg-app-veh-grab text-white",
  be: "bg-app-veh-be text-app-ink",
  gsm: "bg-app-veh-gsm text-white",
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
    <span
      aria-hidden="true"
      className={`box-border flex flex-none items-center justify-center font-extrabold leading-none tracking-[-0.02em] ${tone[provider]} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {PROVIDERS[provider].mono}
    </span>
  );
}
