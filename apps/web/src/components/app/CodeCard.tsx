import type { ProviderId } from "@frego/core";
import { Icon } from "@/components/Icon";
import { ProviderLogo } from "./ProviderLogo";

export type CodeCardProps = {
  logo?: ProviderId | "none";
  /** VD "Grab · mã công khai". */
  brandLine?: string;
  /** Mã để nhập; rỗng → hãng tự áp. */
  code?: string;
  title?: string;
  /** Nhãn hợp lệ (tím), VD "Thẻ VPBank của bạn". */
  ok?: string;
  /** Nhãn lưu ý (cam). */
  warn?: string;
  /** Nhãn xám. */
  plain?: string;
  plain2?: string;
  /** VD "Nguồn: grab.com · kiểm tra 2 giờ trước". */
  meta?: string;
  /** Chữ hành động ở góc phải. */
  cta?: string;
  className?: string;
};

const pill = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-[9px] py-[3px] text-xs font-bold leading-[1.35]";

/** Thẻ mã công khai của hãng, ngân hàng, ví (UiCodeCard). */
export function CodeCard({
  logo = "grab",
  brandLine = "",
  code = "",
  title = "",
  ok = "",
  warn = "",
  plain = "",
  plain2 = "",
  meta = "",
  cta = "",
  className = "",
}: CodeCardProps) {
  const hasTags = !!(ok || warn || plain || plain2);
  return (
    <div
      className={`box-border flex w-full flex-col gap-2 rounded-app-card bg-app-surface p-4 font-app text-app-ink shadow-app-card ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {logo !== "none" && <ProviderLogo provider={logo} size={36} className="rounded-[10px] border border-app-line" />}
        <span className="text-[13px] font-semibold leading-[1.35] text-app-muted">{brandLine}</span>
      </div>
      {code && (
        <span className="whitespace-nowrap text-xl font-extrabold leading-[1.2] tracking-[0.6px]">{code}</span>
      )}
      <span className="text-[15px] font-bold leading-[1.4]">{title}</span>
      {hasTags && (
        <div className="flex flex-wrap gap-1.5">
          {ok && (
            <span className={`${pill} bg-app-primary-soft text-app-primary-deep`}>
              <Icon name="check" size={13} strokeWidth={2.4} />
              {ok}
            </span>
          )}
          {warn && <span className={`${pill} bg-app-deal text-app-deal-ink`}>{warn}</span>}
          {plain && <span className={`${pill} bg-app-alt text-app-ink-2`}>{plain}</span>}
          {plain2 && <span className={`${pill} bg-app-alt text-app-ink-2`}>{plain2}</span>}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-xs leading-[1.4] text-app-muted">{meta}</span>
        {cta && <span className="flex-none whitespace-nowrap text-[13px] font-bold text-app-primary">{cta}</span>}
      </div>
    </div>
  );
}
