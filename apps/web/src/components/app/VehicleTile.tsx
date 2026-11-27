import { ProviderLogo } from "./ProviderLogo";
import { VehicleArt, type VehicleBrand, type VehicleKind } from "./VehicleArt";

export type VehicleTileProps = {
  /** Hãng xe; "other" = không có logo hãng. */
  brand?: VehicleBrand;
  kind?: VehicleKind;
  className?: string;
};

/** Ô hình xe 76 × 62 kèm logo hãng ở góc (UiVehicleTile). Trang trí. */
export function VehicleTile({ brand = "be", kind = "bike", className = "" }: VehicleTileProps) {
  return (
    <span aria-hidden="true" className={`relative block h-[62px] w-[76px] ${className}`}>
      <span className="absolute left-1.5 top-1.5 flex h-14 w-[70px] items-center justify-center rounded-app-block bg-app-alt">
        <VehicleArt brand={brand} kind={kind} />
      </span>
      {brand !== "other" && (
        <ProviderLogo
          provider={brand}
          size={30}
          className="absolute left-0 top-0 rounded-[9px] border-2 border-white shadow-app-brand-strong"
        />
      )}
    </span>
  );
}
