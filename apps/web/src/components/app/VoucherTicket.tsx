import { Icon } from "@/components/Icon";
import { MerchantLogo, type MerchantLogoKind } from "./MerchantLogo";

export type VoucherTicketMode = "link" | "attach" | "static";
export type VoucherTicketTag = "sponsor" | "frego" | "public";

export type VoucherTicketProps = {
  /** link: chữ hành động ở góc; attach: nút Gắn / Đã gắn; static: chỉ hiển thị. */
  mode?: VoucherTicketMode;
  logo?: MerchantLogoKind;
  tag?: VoucherTicketTag;
  /** Chữ trên nhãn; bỏ trống → "Tài trợ" / "Frego" / "Công khai" theo `tag`. */
  tagText?: string;
  title?: string;
  /** Mức giảm, VD "−20.000đ" (dùng formatDiscount). */
  amount?: string;
  /** Dịch vụ dưới mức giảm, VD "Grab ô tô". Chuỗi rỗng → ẩn. */
  service?: string;
  line?: string;
  lineIcon?: "none" | "spark";
  /** Dòng phụ cuối vé, VD "HSD 30/11/2026". */
  meta?: string;
  /** Chữ hành động ở chế độ link, VD "Xem mã ›". */
  action?: string;
  /** Chế độ attach: đang gắn hay chưa. */
  attached?: boolean;
  /** Chế độ attach: bấm nút. Chỉ truyền từ client component (xem VoucherTicketAttach). */
  onToggle?: () => void;
  className?: string;
};

const TAG_LABEL: Record<VoucherTicketTag, string> = { sponsor: "Tài trợ", frego: "Frego", public: "Công khai" };
const TAG_CLASS: Record<VoucherTicketTag, string> = {
  sponsor: "border border-app-tag-line px-[7px] py-px text-app-ink-2",
  frego: "bg-app-primary-soft px-[7px] py-0.5 text-app-primary-deep",
  public: "bg-app-alt px-[7px] py-0.5 text-app-ink-2",
};

/**
 * Vé voucher (UiVoucherTicket): cuống màu ưu đãi bên trái (logo, mức giảm, dịch vụ),
 * đường cắt răng cưa, phần thông tin bên phải. Hai khuyết tròn dùng màu nền trang app (app-bg),
 * nên đặt vé trên nền app-bg như thiết kế.
 */
export function VoucherTicket({
  mode = "link",
  logo = "cup",
  tag = "sponsor",
  tagText,
  title = "",
  amount = "",
  service = "",
  line = "",
  lineIcon = "none",
  meta = "",
  action = "Xem mã ›",
  attached = true,
  onToggle,
  className = "",
}: VoucherTicketProps) {
  const hasBottom = !!meta || mode !== "static";
  return (
    <div
      className={`box-border flex w-full overflow-hidden rounded-app-ticket bg-app-surface font-app text-app-ink shadow-app-card ${className}`}
    >
      <div className="box-border flex w-[104px] flex-none flex-col items-center justify-center gap-1.5 bg-app-deal px-2 py-3.5 text-center">
        <MerchantLogo logo={logo} />
        <span className="whitespace-nowrap text-[17px] font-extrabold leading-[1.2] text-app-deal-ink tabular-nums">
          {amount}
        </span>
        {service && <span className="text-xs font-semibold leading-[1.3] text-app-ink-2">{service}</span>}
      </div>

      <div aria-hidden="true" className="relative w-0 flex-none border-l-2 border-dashed border-app-deal-dash">
        <span className="absolute -left-2.5 -top-2.5 size-[18px] rounded-full bg-app-bg" />
        <span className="absolute -bottom-2.5 -left-2.5 size-[18px] rounded-full bg-app-bg" />
      </div>

      <div className="box-border flex min-w-0 flex-1 flex-col gap-1.5 py-3.5 pl-4 pr-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`flex-none rounded-[6px] text-xs font-bold leading-[1.3] ${TAG_CLASS[tag]}`}>
            {tagText || TAG_LABEL[tag]}
          </span>
          <span className="text-[15px] font-extrabold leading-[1.3]">{title}</span>
        </div>

        {line &&
          (lineIcon === "spark" ? (
            <p className="m-0 flex items-start gap-1.5 text-[13px] leading-[1.45] text-app-ink-2">
              <span className="mt-0.5 text-app-primary">
                <Icon name="spark" size={15} strokeWidth={2} />
              </span>
              <span>{line}</span>
            </p>
          ) : (
            <p className="m-0 text-[13px] leading-[1.45] text-app-ink-2">{line}</p>
          ))}

        {hasBottom && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
            <span className="text-xs font-semibold leading-[1.35] text-app-muted">{meta}</span>
            {mode === "attach" &&
              (attached ? (
                <button
                  type="button"
                  aria-pressed="true"
                  onClick={onToggle}
                  className="box-border flex h-11 flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-app-small border-0 bg-app-primary px-3.5 font-app text-sm font-bold text-white"
                >
                  <Icon name="check" size={16} strokeWidth={2.4} />
                  Đã gắn
                </button>
              ) : (
                <button
                  type="button"
                  aria-pressed="false"
                  onClick={onToggle}
                  className="box-border h-11 flex-none cursor-pointer whitespace-nowrap rounded-app-small border-[1.5px] border-solid border-app-primary bg-app-surface px-[18px] font-app text-sm font-bold text-app-primary"
                >
                  Gắn
                </button>
              ))}
            {mode === "link" && (
              <span className="flex-none whitespace-nowrap text-[13px] font-bold text-app-primary">{action}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
