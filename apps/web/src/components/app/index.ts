/**
 * Thành phần app Frego bản web (HTML + Tailwind), dựng theo các Ui*.dc.html của thiết kế.
 * Chỉ hiển thị (dùng được trong server component); tương tác nằm ở wrapper client riêng.
 */
export { VoucherTicket, type VoucherTicketProps, type VoucherTicketMode, type VoucherTicketTag } from "./VoucherTicket";
export { VoucherTicketAttach, type VoucherTicketAttachProps } from "./VoucherTicketAttach";
export { PushNotif, type PushNotifProps } from "./PushNotif";
export { PriceRow, type PriceRowData } from "./PriceRow";
export { CodeCard, type CodeCardProps } from "./CodeCard";
export { VehicleTile, type VehicleTileProps } from "./VehicleTile";
export { VehicleArt, type VehicleBrand, type VehicleKind } from "./VehicleArt";
export { ProviderLogo, type ProviderLogoProps } from "./ProviderLogo";
export { MerchantLogo, type MerchantLogoKind, type MerchantLogoProps } from "./MerchantLogo";
