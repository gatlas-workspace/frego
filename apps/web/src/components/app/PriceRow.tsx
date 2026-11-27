import { Icon } from "@/components/Icon";
import { ProviderLogo } from "./ProviderLogo";
import { VehicleArt, type VehicleBrand, type VehicleKind } from "./VehicleArt";

export type PriceRowData = {
  /** Tên hãng: "Grab", "Be", "Green SM" (hãng khác → hình xe tím, không logo). */
  name: string;
  /** Mã hãng; bỏ trống thì suy ra từ `name`. */
  key?: VehicleBrand;
  /** Dịch vụ, VD "Xe máy". */
  service: string;
  /** Giá sau voucher, VD "21.000–26.000đ". */
  final?: string;
  /** Giá gốc (gạch ngang). */
  base?: string;
  /** Dòng voucher đã gắn, VD "Đã gắn FREGO10, giảm 10.000đ". */
  voucherText?: string;
  /** Có bảng giá ở khu vực này không. */
  priced: boolean;
  kind: VehicleKind;
  /** Nhãn hãng tự giảm, VD "Green SM đang tự giảm 25%, không cần mã". */
  autoNote?: string;
};

const BRAND_BY_NAME: Record<string, VehicleBrand> = { Grab: "grab", Be: "be", "Green SM": "gsm" };

/** Một dòng giá ở màn So giá sau voucher (UiPriceRow). */
export function PriceRow({ row, className = "" }: { row: PriceRowData; className?: string }) {
  const brandKey = row.key ?? BRAND_BY_NAME[row.name] ?? "other";
  return (
    <div
      className={`box-border flex w-full flex-col gap-2.5 rounded-app-ticket bg-app-surface p-3.5 font-app text-app-ink shadow-app-card ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="relative flex h-14 w-[70px] flex-none items-center justify-center rounded-app-block bg-app-alt"
        >
          <VehicleArt brand={brandKey} kind={row.kind} />
          {brandKey !== "other" && (
            <ProviderLogo
              provider={brandKey}
              size={30}
              className="absolute -left-1.5 -top-1.5 rounded-[9px] border-2 border-white shadow-app-brand-strong"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-base font-extrabold leading-[1.3]">{row.name}</span>
          <span className="whitespace-nowrap text-[13px] leading-[1.35] text-app-ink-2">{row.service}</span>
        </span>
        <span className="flex flex-none flex-col items-end gap-0.5">
          {row.priced && row.final && (
            <span className="whitespace-nowrap text-base font-extrabold leading-[1.3] tabular-nums">{row.final}</span>
          )}
          {row.base && (
            <span className="whitespace-nowrap text-xs leading-[1.3] text-app-muted line-through tabular-nums">
              <span className="sr-only">Giá gốc </span>
              {row.base}
            </span>
          )}
        </span>
      </div>

      {row.voucherText && (
        <div className="flex items-center gap-2 rounded-app-small bg-app-deal px-3 py-[9px] text-[13px] font-bold leading-[1.4] text-app-deal-ink">
          <Icon name="ticket" size={16} strokeWidth={1.9} />
          <span className="min-w-0 flex-1">{row.voucherText}</span>
        </div>
      )}
      {row.priced && !row.voucherText && (
        <p className="m-0 text-[13px] leading-[1.45] text-app-ink-2">
          Chưa có voucher hợp cho loại xe này. Có mã riêng thì quay lại bước gắn voucher để nhập.
        </p>
      )}
      {!row.priced && (
        <p className="m-0 text-[13px] leading-[1.45] text-app-ink-2">
          Chưa có bảng giá ở khu vực này. Xem giá trong app, rồi báo lại giúp mọi người.
        </p>
      )}
      {row.autoNote && (
        <span className="self-start rounded-full bg-app-primary-soft px-2.5 py-1 text-xs font-bold leading-[1.4] text-app-primary-deep">
          {row.autoNote}
        </span>
      )}
    </div>
  );
}
