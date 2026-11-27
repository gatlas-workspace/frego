/**
 * Bộ thành phần "Web quản lý" (cổng doanh nghiệp /doanh-nghiep, quản trị /quan-tri), dựng theo Web*.dc.html.
 * Phong cách Notion: Inter 14px, xám ấm, xanh #2383E2 chỉ cho hành động chính và vùng đang chọn.
 *
 * Quy ước:
 * - Mọi thành phần dùng được trong Server Component, trừ Sidebar, Drawer, NavSearch (client).
 * - Segmented, Toggle, Input, Tabs, ChoiceGroup: không điều khiển (name + defaultValue, gửi trong <form>) ở server;
 *   có điều khiển (value + onChange) khi dùng trong Client Component.
 * - Xem mọi biến thể ở /dev/thanh-phan.
 */

// Thành phần theo thiết kế
export { Sidebar, activeNavKey, type SidebarProps, type SidebarRole } from './Sidebar';
export { Topbar, parseCrumbs, type TopbarProps, type Crumb } from './Topbar';
export { StatCard, StatGroup, type StatCardProps, type StatTone } from './StatCard';
export { Status, canonTone, type StatusProps, type StatusTone, type StatusShape } from './Status';
export { Check, type CheckProps, type CheckTone } from './Check';
export {
  Table,
  guessColumnType,
  type TableProps,
  type TableColumn,
  type TableColumnType,
  type TableCell,
  type TableCellData,
  type TableRow,
  type TableRowObject,
} from './Table';
export { BarChart, type BarChartProps, type Bar } from './BarChart';
export { Tabs, TabsTool, tabHref, type TabsProps, type TabItem, type SearchParamsLike } from './Tabs';
export { Segmented, type SegmentedProps, type SegmentedItem } from './Segmented';
export { Input, Textarea, type InputProps, type TextareaProps } from './Input';
export { Toggle, ToggleRow, type ToggleProps, type ToggleRowProps } from './Toggle';
export { Button, buttonClass, type ButtonProps, type ButtonVariant, type ButtonSize, type ButtonIcon } from './Button';
export { Callout, type CalloutProps, type CalloutTone, type CalloutIconColor } from './Callout';

// Khung và bố cục
export { PortalShell } from './PortalShell';
export { PageBody, PageHeader, type PageHeaderProps } from './Page';
export {
  Panel,
  Section,
  SectionHeader,
  MoreLink,
  SubHeading,
  DetailHeader,
  Columns,
  Divider,
  Hint,
  PreviewBox,
  type SectionHeaderProps,
  type Gap,
} from './Panel';
export { KeyValueList, KeyValue, Timeline, Meter, Tile, InfoTile, Metric, type KeyValueProps, type TimelineItem, type MeterTone } from './DataDisplay';
export { List, ListRow, QueueList, QueueItem, FileRow, type ListRowProps, type QueueItemProps } from './List';
export { FormSection, FieldGrid, SearchField, ChoiceGroup, type ChoiceItem } from './Form';
export { Drawer, type DrawerProps } from './Drawer';
export { StandalonePage, StepList, FregoLogo } from './Frame';
export { NavSearch, type NavSearchItem } from './NavSearch';

// Biểu tượng
export { FregoMark, BizMark, ProviderMark, Avatar, type BizMarkSize, type ProviderMarkSize } from './Marks';
export { WebIcon, type WebIconProps, type AnyIconName } from './WebIcon';
export { webIcons, type WebIconName } from './icons-web';
export { cx } from './cx';
