// Thành phần UI dùng chung (trang "Thành phần UI" của thiết kế). Xuất tất cả từ đây.
// Màn hình chỉ dựng từ các thành phần này + T (chữ) + Icon; màu/bóng/bo góc lấy từ '@/theme/tokens'.
// Xem mọi biến thể: route /dev/thanh-phan.

/* Nền tảng */
export { T, type TProps } from './Text';
export { Icon, type IconProps } from './Icon';
export {
  BrandLogo,
  MonoLogo,
  Wordmark,
  isProvider,
  isCategoryTile,
  type BrandLogoProps,
  type BrandLogoKind,
  type CategoryTileKey,
  type MonoLogoProps,
  type WordmarkProps,
} from './BrandLogo';
export { DashLine, type DashLineProps } from './Dash';

/* Thành phần (UiX) */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { Chip, type ChipProps, type ChipTone } from './Chip';
export { Pill, type PillProps, type PillState } from './Pill';
export { BackButton, type BackButtonProps } from './BackButton';
export { Toggle, type ToggleProps } from './Toggle';
export { Tabs, type TabsProps, type TabItem } from './Tabs';
export { Field, type FieldProps } from './Field';
export { SearchField, type SearchFieldProps } from './SearchField';
export { SectionTitle, type SectionTitleProps } from './SectionTitle';
export { ListRow, type ListRowProps, type ListRowLead, type ListRowTrail } from './ListRow';
export { InfoNote, type InfoNoteProps, type InfoNoteTone } from './InfoNote';
export { Shortcut, type ShortcutProps } from './Shortcut';
export { NavBar, type NavKey } from './NavBar';
export { Banner, type BannerProps } from './Banner';
export { DealRow, type DealRowProps } from './DealRow';
export { VoucherTicket, type VoucherTicketProps, type VoucherTag } from './VoucherTicket';
export { CodeCard, type CodeCardProps } from './CodeCard';
export { PriceRowCard, type PriceRowCardProps } from './PriceRow';
export { MapRoute, type MapRouteProps } from './MapRoute';
export { PushNotif, type PushNotifProps } from './PushNotif';
export { NotifItem, type NotifItemProps } from './NotifItem';
export {
  VehicleTile,
  VehicleBox,
  VehicleArt,
  vehicleKind,
  VEHICLE_COLOR,
  type VehicleTileProps,
  type VehicleBoxProps,
  type VehicleArtProps,
  type VehicleKind,
  type VehicleBrand,
} from './VehicleTile';

/* Bố cục */
export { Card, type CardProps } from './Card';
export { ListCard, Divider, type ListCardProps, type DividerProps, type DividerInset } from './ListCard';
export { ScreenHeader, type ScreenHeaderProps } from './ScreenHeader';
export { BottomBar, type BottomBarProps } from './BottomBar';
export { Sheet, ModalSheet, SheetHandle, type SheetProps, type ModalSheetProps } from './Sheet';
