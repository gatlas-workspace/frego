import type { CategoryKey } from "@frego/core";
import { Icon } from "@/components/Icon";
import { MerchantLogo, type MerchantLogoKind } from "./MerchantLogo";

const LOGO: Record<CategoryKey, MerchantLogoKind> = { cafe: "cup", bowl: "bowl", tea: "lotus", gym: "gym", book: "book", cake: "cake" };

export type AdPopupProps = {
  /** Ảnh banner 16:9 (URL xem được hoặc data/blob URL). Trống → ô giữ chỗ. */
  imageUrl?: string | null;
  title: string;
  body: string;
  businessName: string;
  category: CategoryKey;
  /** Địa chỉ quán (dòng dưới tên). */
  address?: string;
  /** "Voucher −10.000đ Grab ô tô chuyến này là quà của …" */
  giftText?: string;
  className?: string;
};

/**
 * Popup quảng cáo nhà tài trợ (màn 2c của app, sau khi chọn hãng ở So giá) — bản web chỉ để xem trước
 * ở cổng doanh nghiệp và trang Duyệt. Nút đóng và nút "Nhận mã giảm giá" chỉ là hình (không bấm được).
 */
export function AdPopup({
  imageUrl,
  title,
  body,
  businessName,
  category,
  address,
  giftText,
  className = "",
}: AdPopupProps) {
  return (
    <div
      className={`relative mx-auto box-border flex w-full max-w-[340px] flex-col overflow-hidden rounded-app-card bg-app-surface font-app text-app-ink shadow-app-card ${className}`}
    >
      <div className="relative aspect-[16/9] w-full flex-none bg-app-alt">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước (data/blob URL), chạy tốt trong trình duyệt Zalo/Facebook
          <img src={imageUrl} alt={`Ảnh banner: ${title || "chưa có tiêu đề"}`} className="block size-full object-cover" />
        ) : (
          <span className="flex size-full flex-col items-center justify-center gap-1.5 text-[13px] text-app-muted">
            <Icon name="camera" size={24} />
            Ảnh banner 16:9
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-app-surface text-app-ink shadow-app-soft"
        >
          <Icon name="x" size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5">
          <span className="self-start rounded-[6px] border border-app-tag-line px-[7px] py-px text-xs font-bold leading-[1.3] text-app-ink-2">
            Tài trợ
          </span>
          <span className={`break-words text-[17px] font-extrabold leading-[1.3] ${title ? "" : "text-app-muted"}`}>
            {title || "Tiêu đề banner"}
          </span>
          {body ? <span className="break-words text-sm leading-[1.45] text-app-ink-2">{body}</span> : null}
        </div>
        <div className="flex items-center gap-2.5">
          <MerchantLogo logo={LOGO[category]} size={36} radius={10} iconSize={20} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold leading-[1.35]">{businessName}</span>
            {address ? <span className="truncate text-xs leading-[1.4] text-app-muted">{address}</span> : null}
          </span>
        </div>
        {giftText ? (
          <span className="flex items-start gap-2 rounded-app-small bg-app-deal-tint px-3 py-2.5 text-[13px] leading-[1.45] text-app-deal-ink">
            <Icon name="gift" size={16} className="mt-px" />
            {giftText}
          </span>
        ) : null}
        <span
          className="flex h-12 items-center justify-center rounded-app-small bg-app-primary px-4 text-[15px] font-bold text-white"
        >
          Nhận mã giảm giá
        </span>
      </div>
    </div>
  );
}
