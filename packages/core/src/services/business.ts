/**
 * Dịch vụ Cổng doanh nghiệp (apps/web /doanh-nghiep). Chạy trên Db bất kỳ (DEMO hoặc Supabase).
 * Doanh nghiệp chỉ thấy số liệu tổng (bảng `stats`, chiến dịch, ví của mình), không thấy người nhận mã.
 *
 * Mọi chuỗi hiển thị (tiền, ngày, nhãn trạng thái) được tính ở đây; trang web chỉ ghép thành phần.
 * Ghi dữ liệu theo đúng quyền RLS của thành viên doanh nghiệp (supabase/migrations/*_rls.sql):
 * - businesses: chỉ các cột hồ sơ (BIZ_PROFILE_FIELDS), chủ cửa hàng;
 * - campaigns: thêm ở trạng thái draft/pending, active ↔ paused, đổi ngân sách; không tự duyệt, không sửa số đã chi;
 * - wallet_transactions: chỉ thêm topup "pending" (báo đã chuyển khoản);
 * - business_members: chủ cửa hàng mời thành viên.
 */
import { brand } from '../brand';
import { PROVIDERS, PROVIDER_ORDER, VEHICLE_ORDER, serviceShortLabel } from '../catalog';
import type { Db } from '../db/types';
import type { StatRow } from '../db/schema';
import {
  formatDate,
  formatDayMonth,
  formatDiscount,
  formatMeters,
  formatNumber,
  formatPercent,
  formatRelative,
  formatVnd,
  initials,
  parseDateVn,
  parseVnd,
  vnParts,
} from '../format';
import type {
  AdBanner,
  Business,
  BusinessMember,
  Campaign,
  CampaignEvent,
  CampaignStatus,
  CategoryKey,
  Invoice,
  ProviderId,
  VehicleClass,
  WalletTransaction,
} from '../types';

export * from './payos';

/* ───────────────────────── Hằng số, nhãn ───────────────────────── */

const FEE = brand.serviceFeePerCode;
const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 3_600_000;

/** Lỗi hiển thị được cho người dùng (chuỗi tiếng Việt). */
export class BizServiceError extends Error {
  constructor(
    message: string,
    readonly field?: string,
  ) {
    super(message);
    this.name = 'BizServiceError';
  }
}

/** Loại xe đầy đủ trên cổng doanh nghiệp: "xe máy", "ô tô 4 chỗ", "ô tô 7 chỗ". */
export const BIZ_VEHICLE_LABEL: Record<VehicleClass, string> = { bike: 'xe máy', car4: 'ô tô 4 chỗ', car7: 'ô tô 7 chỗ' };

/** "Grab ô tô 4 chỗ", "Be xe máy", "Green SM xe máy" */
export function bizServiceLabel(providerId: ProviderId, vehicleClass: VehicleClass): string {
  return `${PROVIDERS[providerId].name} ${BIZ_VEHICLE_LABEL[vehicleClass]}`;
}

export type BizTone = 'green' | 'amber' | 'grey' | 'red' | 'blue';
export type BizCampaignTab = 'tat-ca' | 'dang-chay' | 'sap-chay' | 'cho-duyet' | 'bi-tu-choi' | 'tam-dung' | 'da-ket-thuc' | 'nhap';

/**
 * Trạng thái hiển thị: như campaigns.status, thêm "scheduled" = đã duyệt (status active) nhưng chưa tới ngày bắt đầu.
 * Không lưu riêng: tự thành "Đang chạy" khi tới ngày (giống cột offering của view campaigns_public).
 */
export type BizCampaignState = CampaignStatus | 'scheduled';

/** Trạng thái hiển thị của chiến dịch tại thời điểm `now`. */
export function bizCampaignState(c: Pick<Campaign, 'status' | 'startsAt'>, now: Date): BizCampaignState {
  return c.status === 'active' && new Date(c.startsAt).getTime() > now.getTime() ? 'scheduled' : c.status;
}

const STATUS: Record<BizCampaignState, { label: string; tone: BizTone; rank: number; tab: BizCampaignTab }> = {
  active: { label: 'Đang chạy', tone: 'green', rank: 0, tab: 'dang-chay' },
  scheduled: { label: 'Đã duyệt', tone: 'blue', rank: 1, tab: 'sap-chay' },
  paused: { label: 'Tạm dừng', tone: 'grey', rank: 2, tab: 'tam-dung' },
  pending: { label: 'Chờ Frego duyệt', tone: 'amber', rank: 3, tab: 'cho-duyet' },
  draft: { label: 'Nháp', tone: 'grey', rank: 4, tab: 'nhap' },
  rejected: { label: 'Bị từ chối', tone: 'red', rank: 5, tab: 'bi-tu-choi' },
  ended: { label: 'Đã kết thúc', tone: 'grey', rank: 6, tab: 'da-ket-thuc' },
};

/** "Đã duyệt · chạy từ 01/12" cho chiến dịch chưa tới ngày; còn lại nhãn cố định. */
function statusLabelOf(state: BizCampaignState, c: Pick<Campaign, 'startsAt'>): string {
  return state === 'scheduled' ? `Đã duyệt · chạy từ ${formatDayMonth(c.startsAt)}` : STATUS[state].label;
}

const TABS: { key: BizCampaignTab; label: string }[] = [
  { key: 'tat-ca', label: 'Tất cả' },
  { key: 'dang-chay', label: 'Đang chạy' },
  { key: 'sap-chay', label: 'Sắp chạy' },
  { key: 'cho-duyet', label: 'Chờ duyệt' },
  { key: 'bi-tu-choi', label: 'Bị từ chối' },
  { key: 'tam-dung', label: 'Tạm dừng' },
  { key: 'da-ket-thuc', label: 'Đã kết thúc' },
  { key: 'nhap', label: 'Nháp' },
];

/** Lựa chọn khi tạo chiến dịch (WebDnTaoChienDich). */
export const BIZ_RADIUS_OPTIONS = [300, 500, 800, 1000] as const;
export const BIZ_AMOUNT_OPTIONS = [10000, 15000, 20000, 30000] as const;
export const BIZ_TOPUP_OPTIONS = [2000000, 5000000, 10000000] as const;

/** Cột hồ sơ doanh nghiệp mà thành viên được sửa (khớp quyền cột trên bảng businesses). */
export const BIZ_PROFILE_FIELDS = [
  'name',
  'industry',
  'address',
  'landmark',
  'lat',
  'lng',
  'openHours',
  'autoTopup',
  'invoiceName',
  'invoiceEmail',
  'contactEmail',
  'contactPhone',
  'logoUrl',
  'notifyPrefs',
] as const;
export type BizProfilePatch = Partial<Pick<Business, (typeof BIZ_PROFILE_FIELDS)[number]>>;

const WEEKDAY_ORDER = ['1', '2', '3', '4', '5', '6', '0'];
const WEEKDAY_SHORT: Record<string, string> = { '1': 'T2', '2': 'T3', '3': 'T4', '4': 'T5', '5': 'T6', '6': 'T7', '0': 'CN' };
const WEEKDAY_NAME: Record<string, string> = {
  '1': 'thứ Hai',
  '2': 'thứ Ba',
  '3': 'thứ Tư',
  '4': 'thứ Năm',
  '5': 'thứ Sáu',
  '6': 'thứ Bảy',
  '0': 'Chủ nhật',
};

const MEMBER_ROLE: Record<BusinessMember['role'], { label: string; permissions: string }> = {
  owner: { label: 'Chủ cửa hàng', permissions: 'Tạo chiến dịch, nạp ví, xem báo cáo' },
  accountant: { label: 'Kế toán', permissions: 'Ví, hóa đơn' },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Sự kiện chiến dịch khi quán đổi địa chỉ (cùng chữ với trigger SQL businesses_address_guard). */
export const BIZ_EV_ADDRESS_REREVIEW = 'Quay lại chờ duyệt vì quán đổi địa chỉ';

/* ───────────────────────── Kiểu dữ liệu màn hình ───────────────────────── */

/** Ô số liệu (WebStatCard). */
export interface BizStatView {
  label: string;
  value: string;
  sub: string;
}

/** Cột biểu đồ (WebBarChart). */
export interface BizBarView {
  label: string;
  srLabel: string;
  value: number;
  highlight: boolean;
}

export interface BizChartView {
  bars: BizBarView[];
  /** Câu tóm tắt cho trình đọc màn hình. */
  summary: string;
}

/** Một dòng bảng chiến dịch (DN 1, DN 2). */
export interface BizCampaignRowView {
  id: string;
  href: string;
  name: string;
  /** "01/11 – 30/11/2026 · 13:00–19:00", "… · dừng từ 16/11", "… · Frego từ chối 22/11" */
  sub: string;
  status: BizCampaignState;
  statusLabel: string;
  statusTone: BizTone;
  providerId: ProviderId;
  /** "Grab ô tô 4 chỗ · −20.000đ" */
  offerText: string;
  /** "500 m quanh quán" */
  zoneText: string;
  /** "312 / 980" hoặc "—" */
  usedText: string;
  /** "32% được dùng" hoặc "chưa chạy" */
  usedSub: string;
  spentText: string;
}

export interface BizWalletSummaryView {
  balanceText: string;
  /** "Đủ khoảng 51 mã Grab ô tô. Ví hết thì chiến dịch tự dừng." */
  noteText: string;
  /** amber khi ví chỉ đủ dưới 1 tuần */
  tone: 'amber' | 'grey';
}

export interface BizOverviewView {
  businessName: string;
  /** "Tháng 11/2026, tính đến hết 22/11 · cập nhật 10 phút trước" */
  description: string;
  stats: BizStatView[];
  daily: BizChartView;
  wallet: BizWalletSummaryView;
  /** "15:00–17:00, từ thứ Sáu đến Chủ nhật" */
  peakText: string | null;
  campaigns: BizCampaignRowView[];
  canManage: boolean;
}

export interface BizCampaignListView {
  tabs: { key: BizCampaignTab; label: string; count: number }[];
  activeTab: BizCampaignTab;
  rows: BizCampaignRowView[];
  /** Thẻ "Đang chạy: …, ngân sách còn …" */
  running: { id: string; href: string; name: string; leftText: string } | null;
  /** Thẻ "Bị từ chối: …. Lý do: …" */
  rejected: { id: string; href: string; name: string; reason: string } | null;
  canManage: boolean;
}

/* Quảng cáo (banner popup sau màn So giá) */

export const AD_TITLE_MAX = 40;
export const AD_BODY_MAX = 120;
export const AD_IMAGE_MAX_BYTES = 1024 * 1024;
/** contentType → đuôi file */
export const AD_IMAGE_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const AD_RULES = [
  'Ảnh JPG, PNG hoặc WebP, tối đa 1 MB, nên 1200 × 675 px (tỉ lệ 16:9).',
  `Tiêu đề tối đa ${AD_TITLE_MAX} ký tự, nội dung tối đa ${AD_BODY_MAX} ký tự.`,
  'Không đưa số điện thoại, mã QR, logo hãng xe hay nội dung sai sự thật.',
  'Frego duyệt trong 1 ngày làm việc. Banner hiện khi khách chọn hãng có mã của quán ở màn So giá.',
];

export interface BizAdBannerView {
  id: string;
  /** URL xem được (ảnh chờ duyệt: URL có hạn) */
  imageUrl: string;
  title: string;
  body: string;
  /** "Đang hiện trong app từ 25/11/2026" / "Gửi 22/11/2026, Frego duyệt trong 1 ngày làm việc" */
  statusText: string;
}

export interface BizAdView {
  running: BizAdBannerView | null;
  pending: BizAdBannerView | null;
  rejected: (BizAdBannerView & { reason: string }) | null;
  adViews: BizStatView;
  canSubmit: boolean;
  /** Lý do chưa gửi được (kế toán; đang có bản chờ duyệt) */
  submitBlockedText: string | null;
  /** Thông tin quán cho khung xem trước popup */
  preview: { name: string; category: CategoryKey; industry: string; address: string; giftText: string };
  rules: string[];
}

export interface BizCampaignDetailView {
  id: string;
  name: string;
  status: BizCampaignState;
  statusLabel: string;
  statusTone: BizTone;
  /** "01/11 – 30/11/2026 · 13:00–19:00 · Grab ô tô 4 chỗ · 500 m quanh quán" */
  subtitle: string;
  canPause: boolean;
  canResume: boolean;
  canEditBudget: boolean;
  /** Bị từ chối / nháp: sửa và gửi lại ở trang Tạo chiến dịch. */
  resubmitHref: string | null;
  rejectReason: string | null;
  stats: BizStatView[];
  /** Lượt hiện popup quảng cáo của quán từ chiến dịch này (chỉ số tổng) */
  adViews: BizStatView;
  chart: BizChartView & { title: string };
  history: { key: string; time: string; text: string }[];
  settings: { label: string; value: string }[];
  budget: number;
  budgetText: string;
  spent: number;
  /** Ngân sách nhỏ nhất được phép đặt (đã chi + một mã). */
  minBudget: number;
  canManage: boolean;
}

export interface BizCampaignFormValues {
  name: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  radiusM: number;
  /** "5.000.000" */
  budget: string;
  dailyCap: string;
  /** "01/12/2026" */
  startDate: string;
  endDate: string;
  onlyOpenHours: boolean;
}

export interface BizCampaignFormView {
  /** new: tạo mới; edit: sửa nháp/bị từ chối rồi gửi lại; copy: tạo mới từ chiến dịch cũ */
  mode: 'new' | 'edit' | 'copy';
  fromId: string | null;
  rejectReason: string | null;
  business: {
    name: string;
    category: CategoryKey;
    /** "Lê Thánh Tôn, Quận 1" */
    shortAddress: string;
    /** "07:00 – 22:00, mỗi ngày" */
    openHoursText: string;
  };
  fee: number;
  feeText: string;
  radii: { value: number; label: string }[];
  amounts: { value: number; label: string }[];
  providers: { value: ProviderId; label: string }[];
  vehicles: { value: VehicleClass; label: string }[];
  /** Người dùng hay đặt xe tới vùng mỗi tháng theo bán kính (số tổng hợp), hoặc null khi chưa có. */
  audience: Record<string, number> | null;
  image: { name: string; meta: string };
  values: BizCampaignFormValues;
  canManage: boolean;
}

export interface BizTransactionView {
  id: string;
  dateText: string;
  title: string;
  sub: string;
  /** "−437.000đ", "+2.000.000đ" */
  amountText: string;
  tone: 'good' | 'bad' | '';
  /** "1.180.000đ" hoặc "Chờ xác nhận" */
  balanceAfterText: string;
  pending: boolean;
}

export interface BizInvoiceView {
  id: string;
  /** "Hóa đơn tháng 11/2026" */
  title: string;
  /** "Tạm tính 8.138.000đ" */
  sub: string;
  statusText: string;
  statusTone: BizTone;
  issued: boolean;
}

export interface BizWalletView {
  balance: number;
  balanceText: string;
  /** "Đủ cho khoảng 51 mã Grab ô tô −20.000đ. Hôm nay đã có 17 mã được dùng, sẽ trừ ngày 23/11." */
  coverText: string;
  topupOptions: { value: number; label: string }[];
  defaultTopup: number;
  /** Mã gốc của doanh nghiệp ("FREGO CPM1024"); mỗi lần nạp thêm hậu tố riêng. */
  transferCode: string;
  /** Nội dung chuyển khoản của lần nạp kế tiếp ("FREGO CPM1024-3"). */
  nextReference: string;
  /** Tài khoản nhận của Frego (brand.bank). */
  bank: { bankName: string; accountNumber: string; accountName: string; branch: string };
  transactions: BizTransactionView[];
  invoices: BizInvoiceView[];
  invoiceEmail: string;
  canManage: boolean;
}

export interface BizMeterView {
  key: string;
  label: string;
  valueText: string;
  /** Độ dài thanh 0–100 */
  percent: number;
  providerId?: ProviderId;
  tone: 'green' | 'amber' | 'blue';
}

export interface BizReportView {
  /** "Tháng 11/2026, tính đến hết 22/11. Chỉ có số liệu tổng hợp, …" */
  description: string;
  stats: BizStatView[];
  /** note: khung giờ của từng chiến dịch trong tháng (giải thích chuyến ngoài khung giờ của chiến dịch đang chạy) */
  hours: BizChartView & { peakText: string; note: string | null };
  services: BizMeterView[];
  /** "Chiến dịch Be xe máy tạm dừng từ 16/11 nên ít chuyến hơn." */
  servicesNote: string | null;
  districts: BizMeterView[];
  weekdays: BizChartView;
  /** Tổng lượt hiện popup quảng cáo của quán (mọi chiến dịch, từ trước tới nay) */
  adViews: BizStatView;
  hasData: boolean;
}

export interface BizMemberView {
  id: string;
  email: string;
  initials: string;
  roleLabel: string;
  permissions: string;
  /** Đã mời nhưng chưa có tài khoản */
  invited: boolean;
  isMe: boolean;
}

export interface BizProfileView {
  name: string;
  industry: string;
  address: string;
  landmark: string;
  category: CategoryKey;
  /** imageUrl: ảnh logo đã lưu (null → ô biểu tượng theo ngành) */
  logo: { title: string; sub: string; imageUrl: string | null };
  openHours: { label: string; value: string }[];
  storefront: { title: string; statusText: string; tone: BizTone };
  invoiceName: string;
  taxCodeMasked: string;
  invoiceEmail: string;
  contactEmail: string;
  contactPhone: string;
  notifyPrefs: Business['notifyPrefs'];
  members: BizMemberView[];
  canManage: boolean;
}

export interface BizCampaignInput {
  name: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  radiusM: number;
  budget: number;
  dailyCap: number;
  /** ISO, 00:00 giờ VN ngày bắt đầu */
  startsAt: string;
  /** ISO, 23:59 giờ VN ngày kết thúc */
  endsAt: string;
  onlyOpenHours: boolean;
}

export type BizCampaignField = keyof BizCampaignFormValues;
export type BizFieldErrors<K extends string = string> = Partial<Record<K, string>>;

/* ───────────────────────── Hàm thuần (dùng được ở form) ───────────────────────── */

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "2026-11" theo giờ VN */
export function bizPeriodOf(d: Date | string | number): string {
  const p = vnParts(d);
  return `${p.year}-${pad2(p.month)}`;
}

function prevPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
}

/** "2026-11" → "11/2026" */
function periodText(period: string): string {
  const [y, m] = period.split('-');
  return `${m}/${y}`;
}

/** [đầu tháng, đầu tháng sau) theo giờ VN, ms */
function periodBounds(period: string): [number, number] {
  const [y, m] = period.split('-').map(Number);
  return [Date.UTC(y, m - 1, 1) - VN_OFFSET_MS, Date.UTC(y, m, 1) - VN_OFFSET_MS];
}

/** "2026-11-14" → "14/11" */
function dayKeyShort(key: string): string {
  const [, m, d] = key.split('-');
  return `${Number(d)}/${Number(m)}`;
}

function vnDayIndex(d: Date | string | number): number {
  return Math.floor((new Date(d).getTime() + VN_OFFSET_MS) / DAY_MS);
}

/** "01/11 – 30/11/2026"; khác năm: "20/12/2026 – 05/01/2027" */
function dateRange(from: string, to: string): string {
  return vnParts(from).year === vnParts(to).year
    ? `${formatDayMonth(from)} – ${formatDate(to)}`
    : `${formatDate(from)} – ${formatDate(to)}`;
}

/** "07:00 – 22:00" → ["07:00", "22:00"] */
function parseHours(text: string): [string, string] | null {
  const m = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/.exec(text);
  if (!m) return null;
  return [`${pad2(Number(m[1]))}:${m[2]}`, `${pad2(Number(m[3]))}:${m[4]}`];
}

function openHoursText(h: Business['openHours']): string {
  if (h.weekdays === h.saturday && h.weekdays === h.sunday) return `${h.weekdays}, mỗi ngày`;
  return `Thứ Hai – Thứ Sáu ${h.weekdays}, thứ Bảy ${h.saturday}, Chủ nhật ${h.sunday}`;
}

/** "Đường Lê Thánh Tôn, gần Chợ Bến Thành, Quận 1, TP.HCM" → "Lê Thánh Tôn, Quận 1" */
function shortAddress(b: Pick<Business, 'address' | 'district'>): string {
  const street = (b.address.split(',')[0] ?? '').replace(/^Đường\s+/i, '').trim();
  const district = b.district || districtOf(b.address);
  return [street, district].filter(Boolean).join(', ');
}

const DISTRICT_RE =
  /(Quận\s+\d+|Quận\s+[A-ZĐ][^,]*|Bình Thạnh|Phú Nhuận|Thủ Đức|Gò Vấp|Tân Bình|Tân Phú|Bình Tân|Bình Chánh|Nhà Bè|Hóc Môn|Củ Chi|Cần Giờ)/;
function districtOf(address: string): string {
  return DISTRICT_RE.exec(address)?.[1]?.trim() ?? '';
}

function categoryOf(industry: string): CategoryKey {
  const t = industry.toLowerCase();
  if (/sách|văn phòng phẩm/.test(t)) return 'book';
  if (/tập|gym|thể thao|yoga/.test(t)) return 'gym';
  if (/bánh/.test(t)) return 'cake';
  if (/trà/.test(t)) return 'tea';
  if (/bún|phở|cơm|mì|quán ăn/.test(t)) return 'bowl';
  return 'cafe';
}

function maskTaxCode(code: string): string {
  if (code.length < 8) return code;
  return `${code.slice(0, 4)}•••${code.slice(-3)}`;
}

/** Chữ cái đại diện: chữ đầu của từ đầu và từ cuối ("Cà phê Mây" → "CM"). */
function edgeInitials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return initials(text);
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Tên tệp ảnh để hiện ("logo-may.png"). Ảnh DEMO là data URL (không có tên tệp: trước đây lấy nhầm đuôi base64, VD "Z").
 */
export function imageFileName(url: string | null | undefined): string {
  if (!url || url.startsWith('data:')) return '';
  const last = decodeURIComponent(url.split('?')[0].split('/').pop() ?? '');
  return /\.[a-z0-9]{2,5}$/i.test(last) ? last : '';
}

/** Mã chuyển khoản riêng của lần nạp thứ n: "FREGO CPM1024-3". */
export function topupReference(transferCode: string, n: number): string {
  return `${transferCode}-${n}`;
}

/** Số thứ tự lần nạp kế tiếp theo các nội dung chuyển khoản đã dùng ("FREGO CPM1024-2" → 3). */
export function nextTopupNumber(transferCode: string, references: (string | null)[]): number {
  let max = 0;
  const prefix = `${transferCode}-`;
  for (const r of references) {
    if (r && r.startsWith(prefix)) {
      const n = Number(r.slice(prefix.length));
      if (Number.isInteger(n) && n > max) max = n;
    }
  }
  return max + 1;
}

/** "Mã được dùng ngày 21/11 · 19 mã Grab ô tô" → ["Mã được dùng ngày 21/11", "19 mã Grab ô tô"] */
function splitNote(note: string): [string, string] {
  const i = note.indexOf(' · ');
  return i < 0 ? [note, ''] : [note.slice(0, i), note.slice(i + 3)];
}

function sumOf(rows: StatRow[]): number {
  return rows.reduce((s, r) => s + r.value, 0);
}

/** Chỉ số của cột lớn nhất (lấy cột sau nếu bằng nhau, như thiết kế "cao nhất ngày 14/11"). */
function lastMaxIndex(values: number[]): number {
  let idx = -1;
  values.forEach((v, i) => {
    if (idx < 0 || v >= values[idx]) idx = i;
  });
  return idx;
}

/** Biểu đồ theo ngày: nhãn thưa (1, 5, 10, 15, 20, 25, 30 và ngày cuối), tô cột cao nhất. */
function dailyChart(rows: StatRow[], unit: string, what: string): BizChartView {
  const values = rows.map((r) => r.value);
  const hi = lastMaxIndex(values);
  const days = rows.map((r) => Number(r.key.slice(8)));
  const last = days[days.length - 1];
  const bars = rows.map((r, i) => {
    const d = days[i];
    const milestone = d === 1 || (d % 5 === 0 && last - d > 1);
    return {
      label: milestone || i === rows.length - 1 ? String(d) : '',
      srLabel: dayKeyShort(r.key),
      value: r.value,
      highlight: i === hi,
    };
  });
  const summary =
    rows.length === 0
      ? `Chưa có số liệu ${what}`
      : `${what[0].toUpperCase()}${what.slice(1)} từ ${dayKeyShort(rows[0].key)} đến ${dayKeyShort(rows[rows.length - 1].key)}, cao nhất ngày ${dayKeyShort(rows[hi].key)} với ${formatNumber(values[hi])} ${unit}`;
  return { bars, summary };
}

/** Khung 2 giờ liền nhau nhiều chuyến nhất. */
function peakWindow(rows: StatRow[]): { from: number; to: number; peakHour: number; peakValue: number } | null {
  const byHour = new Map(rows.map((r) => [Number(r.key), r.value]));
  let best: { from: number; sum: number } | null = null;
  for (const r of rows) {
    const h = Number(r.key);
    const sum = r.value + (byHour.get(h + 1) ?? 0);
    if (!best || sum > best.sum) best = { from: h, sum };
  }
  if (!best) return null;
  const a = byHour.get(best.from) ?? 0;
  const b = byHour.get(best.from + 1) ?? 0;
  return { from: best.from, to: best.from + 2, peakHour: b > a ? best.from + 1 : best.from, peakValue: Math.max(a, b) };
}

/** Các ngày trong tuần cao hơn trung bình: "từ thứ Sáu đến Chủ nhật", "thứ Bảy và Chủ nhật". */
function peakDaysText(rows: StatRow[]): string | null {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const ordered = WEEKDAY_ORDER.filter((k) => byKey.has(k));
  if (ordered.length === 0) return null;
  const mean = sumOf(rows) / ordered.length;
  const top = ordered.filter((k) => (byKey.get(k) ?? 0) > mean);
  if (top.length === 0) return null;
  const idx = top.map((k) => ordered.indexOf(k));
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  const names = top.map((k) => WEEKDAY_NAME[k]);
  if (names.length === 1) return names[0];
  if (contiguous && names.length >= 3) return `từ ${names[0]} đến ${names[names.length - 1]}`;
  if (names.length === 2) return `${names[0]} và ${names[1]}`;
  return names.join(', ');
}

/** Chỉ số hai cột lớn nhất. */
function topTwo(values: number[]): Set<number> {
  return new Set(
    values
      .map((v, i) => [v, i] as const)
      .sort((a, b) => b[0] - a[0])
      .slice(0, 2)
      .map(([, i]) => i),
  );
}

/**
 * Đọc form Tạo chiến dịch (FormData → chuỗi). Trả lỗi theo ô để hiện dưới từng ô nhập.
 * `today`: mốc so ngày bắt đầu (không cho bắt đầu trong quá khứ).
 */
export function parseBizCampaignForm(
  raw: Record<string, string | undefined>,
  today: Date,
): { input: BizCampaignInput | null; errors: BizFieldErrors<BizCampaignField> } {
  const errors: BizFieldErrors<BizCampaignField> = {};
  const name = (raw.name ?? '').trim();
  if (!name) errors.name = 'Nhập tên chiến dịch.';
  else if (name.length > 80) errors.name = 'Tên tối đa 80 ký tự.';

  const providerId = raw.providerId as ProviderId;
  if (!PROVIDER_ORDER.includes(providerId)) errors.providerId = 'Chọn hãng xe.';
  const vehicleClass = raw.vehicleClass as VehicleClass;
  if (!VEHICLE_ORDER.includes(vehicleClass)) errors.vehicleClass = 'Chọn loại xe.';

  const amount = Number(raw.amount);
  if (!Number.isInteger(amount) || amount < 5000 || amount > 100000 || amount % 1000 !== 0) errors.amount = 'Chọn mức giảm.';
  const radiusM = Number(raw.radiusM);
  if (!(BIZ_RADIUS_OPTIONS as readonly number[]).includes(radiusM)) errors.radiusM = 'Chọn bán kính.';

  const budget = parseVnd(raw.budget ?? '');
  const perCode = (Number.isFinite(amount) ? amount : 0) + FEE;
  if (budget === null) errors.budget = 'Nhập ngân sách, VD 5.000.000.';
  else if (budget < perCode) errors.budget = `Tối thiểu ${formatVnd(perCode)} (một mã).`;
  else if (budget > 1_000_000_000) errors.budget = 'Tối đa 1.000.000.000đ.';

  const cap = Number((raw.dailyCap ?? '').replace(/[.\s]/g, ''));
  if (!Number.isInteger(cap) || cap < 1) errors.dailyCap = 'Nhập số mã, từ 1.';
  else if (cap > 1000) errors.dailyCap = 'Tối đa 1.000 mã mỗi ngày.';

  const start = parseDateVn(raw.startDate ?? '');
  const end = parseDateVn(raw.endDate ?? '');
  if (!start) errors.startDate = 'Ngày dạng dd/mm/yyyy.';
  else if (vnDayIndex(start) < vnDayIndex(today)) errors.startDate = 'Chọn từ hôm nay trở đi.';
  if (!end) errors.endDate = 'Ngày dạng dd/mm/yyyy.';
  else if (start && end.getTime() < start.getTime()) errors.endDate = 'Phải sau ngày bắt đầu.';

  if (Object.keys(errors).length > 0 || !start || !end || budget === null) return { input: null, errors };
  return {
    input: {
      name,
      providerId,
      vehicleClass,
      amount,
      radiusM,
      budget,
      dailyCap: cap,
      startsAt: start.toISOString(),
      endsAt: new Date(end.getTime() + DAY_MS - 60_000).toISOString(),
      onlyOpenHours: raw.onlyOpenHours === 'on' || raw.onlyOpenHours === 'true',
    },
    errors,
  };
}

/* ───────────────────────── Đăng ký doanh nghiệp (DN 0) ───────────────────────── */

export type BizRegistrationField =
  | 'legalName'
  | 'taxCode'
  | 'representative'
  | 'name'
  | 'industry'
  | 'address'
  | 'contactEmail'
  | 'contactPhone'
  | 'password';

export interface BizRegistrationInput {
  legalName: string;
  taxCode: string;
  representative: string;
  name: string;
  industry: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  draft: boolean;
}

/** Đọc form Đăng ký doanh nghiệp. Lưu nháp chỉ cần tên hiển thị và email. */
export function parseBizRegistration(
  raw: Record<string, string | undefined>,
  opts: { draft: boolean; needPassword: boolean },
): { input: BizRegistrationInput | null; password: string; errors: BizFieldErrors<BizRegistrationField> } {
  const v = (k: BizRegistrationField) => (raw[k] ?? '').trim();
  const errors: BizFieldErrors<BizRegistrationField> = {};
  const input: BizRegistrationInput = {
    legalName: v('legalName'),
    taxCode: v('taxCode').replace(/\s/g, ''),
    representative: v('representative'),
    name: v('name'),
    industry: v('industry'),
    address: v('address'),
    contactEmail: v('contactEmail').toLowerCase(),
    contactPhone: v('contactPhone'),
    draft: opts.draft,
  };
  if (!input.name) errors.name = 'Nhập tên hiển thị trên app.';
  if (!EMAIL_RE.test(input.contactEmail)) errors.contactEmail = 'Email chưa đúng, VD lienhe@cuahang.vn.';
  if (!opts.draft) {
    if (!input.legalName) errors.legalName = 'Nhập tên trên giấy phép.';
    if (!/^\d{10}(-?\d{3})?$/.test(input.taxCode)) errors.taxCode = 'Mã số thuế gồm 10 hoặc 13 chữ số.';
    if (!input.representative) errors.representative = 'Nhập người đại diện.';
    if (!input.industry) errors.industry = 'Nhập ngành, VD Ăn uống · Cà phê.';
    if (input.address.length < 10) errors.address = 'Nhập địa chỉ đầy đủ: số nhà, đường, quận.';
    const digits = input.contactPhone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 11) errors.contactPhone = 'Số điện thoại 9–11 chữ số.';
  }
  const password = raw.password ?? '';
  if (opts.needPassword && password.length < 8) errors.password = 'Mật khẩu tối thiểu 8 ký tự.';
  return { input: Object.keys(errors).length ? null : input, password, errors };
}

/** Gửi hồ sơ (RPC register_business): tạo doanh nghiệp chờ duyệt, người gửi là chủ cửa hàng. */
export async function registerBusiness(db: Db, input: BizRegistrationInput): Promise<Business> {
  return db.rpc('register_business', {
    name: input.name,
    legalName: input.legalName,
    taxCode: input.taxCode,
    representative: input.representative,
    category: categoryOf(input.industry),
    industry: input.industry,
    address: input.address,
    district: districtOf(input.address),
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    draft: input.draft,
  });
}

/* ───────────────────────── Dịch vụ theo doanh nghiệp ───────────────────────── */

export function createBusinessService(db: Db, businessId: string) {
  const scope = `biz:${businessId}`;

  async function business(): Promise<Business> {
    const b = await db.get('businesses', businessId);
    if (!b) throw new BizServiceError('Không tìm thấy doanh nghiệp.');
    return b;
  }

  async function campaigns(): Promise<Campaign[]> {
    return db.list('campaigns', { where: { businessId } });
  }

  async function ownCampaign(id: string): Promise<Campaign> {
    const c = await db.get('campaigns', id);
    if (!c || c.businessId !== businessId) throw new BizServiceError('Không tìm thấy chiến dịch.');
    return c;
  }

  async function stat(sc: string, metric: string, period: string): Promise<StatRow[]> {
    const rows = await db.list('stats', { where: { scope: sc, metric, period } });
    return rows.sort((a, b) => a.sort - b.sort);
  }

  async function eventsOf(ids: string[]): Promise<CampaignEvent[]> {
    if (ids.length === 0) return [];
    const rows = await db.list('campaign_events', { in: { campaignId: ids } });
    // Mới nhất trước; cùng thời điểm thì dòng ghi sau đứng trước.
    return rows
      .map((e, i) => ({ e, i }))
      .sort((a, b) => b.e.at.localeCompare(a.e.at) || b.i - a.i)
      .map(({ e }) => e);
  }

  const stateNow = (c: Campaign) => bizCampaignState(c, db.now());
  /** Đang chạy thật: đã duyệt và đã tới ngày bắt đầu (không gồm chiến dịch "Đã duyệt · chạy từ …"). */
  const isRunning = (c: Campaign) => stateNow(c) === 'active';

  async function canManage(): Promise<boolean> {
    const uid = db.currentUserId();
    if (!uid) return false;
    const members = await db.list('business_members', { where: { businessId, userId: uid } });
    return members.some((m) => m.role === 'owner');
  }

  async function requireOwner() {
    if (!(await canManage())) throw new BizServiceError('Chỉ chủ cửa hàng làm được thao tác này.');
  }

  /** Ngày banner đầu tiên của quán được duyệt (lượt xem quảng cáo chỉ đếm từ đó), null khi chưa có banner duyệt. */
  async function adSince(): Promise<string | null> {
    const banners = await db.list('ad_banners', { where: { businessId } });
    const dates = banners
      .filter((a) => (a.status === 'approved' || a.status === 'replaced') && a.reviewedAt)
      .map((a) => a.reviewedAt!)
      .sort();
    return dates[0] ?? null;
  }

  /**
   * Ô "Lượt xem quảng cáo": số lần popup của quán hiện sau màn So giá (mỗi chuyến tính 1 lần), ghi rõ mốc bắt đầu đếm.
   * Không đặt cạnh số mã đã dùng (khác khoảng thời gian: mã tính cả trước khi có banner).
   */
  function adViewsStat(views: number, since: string | null): BizStatView {
    return {
      label: 'Lượt xem quảng cáo',
      value: formatNumber(views),
      sub: since
        ? `từ ${formatDate(since)} (ngày banner được duyệt), mỗi chuyến tính 1 lần`
        : views
          ? 'popup hiện khi khách chọn hãng có mã của quán'
          : 'chưa có banner được duyệt',
    };
  }

  function checkTopupAmount(amount: number) {
    if (!Number.isInteger(amount) || amount < 100000 || amount > 500_000_000) {
      throw new BizServiceError('Số tiền nạp từ 100.000đ đến 500.000.000đ.');
    }
  }

  /** Ghi lần nạp chờ khớp với nội dung chuyển khoản chưa dùng (thử lại khi trùng do hai người bấm cùng lúc). */
  async function insertTopup(amount: number, note: string, wanted: string | null, orderCode: number | null): Promise<WalletTransaction> {
    const b = await business();
    for (let attempt = 0; attempt < 3; attempt++) {
      const txs = await db.list('wallet_transactions', { where: { businessId } });
      const used = new Set(txs.map((t) => t.reference));
      const reference =
        attempt === 0 && wanted && wanted.startsWith(`${b.transferCode}-`) && !used.has(wanted)
          ? wanted
          : topupReference(b.transferCode, nextTopupNumber(b.transferCode, [...used]));
      try {
        return await db.insert('wallet_transactions', {
          businessId,
          kind: 'topup',
          amount,
          note,
          status: 'pending',
          reference,
          ...(orderCode !== null ? { orderCode } : {}),
          createdAt: db.now().toISOString(),
        });
      } catch (e) {
        if (attempt === 2) throw e;
      }
    }
    throw new BizServiceError('Chưa ghi nhận được. Thử lại sau ít phút.');
  }

  async function addEvent(campaignId: string, text: string) {
    await db.insert('campaign_events', { campaignId, at: db.now().toISOString(), text });
  }

  function overlaps(c: Campaign, period: string): boolean {
    const [from, to] = periodBounds(period);
    return new Date(c.startsAt).getTime() < to && new Date(c.endsAt).getTime() >= from;
  }

  /** Tổng tháng: ưu tiên số gộp hằng đêm (stats), chưa có thì cộng từ chiến dịch chạy trong tháng. */
  async function monthTotals(period: string, list: Campaign[]) {
    const rows = await stat(scope, 'totals', period);
    if (rows.length > 0) {
      const get = (k: string) => rows.find((r) => r.key === k)?.value ?? 0;
      return { issued: get('issued'), used: get('used'), spent: get('spent'), fromStats: true };
    }
    const inPeriod = list.filter((c) => overlaps(c, period));
    return {
      issued: inPeriod.reduce((s, c) => s + c.issuedCount, 0),
      used: inPeriod.reduce((s, c) => s + c.usedCount, 0),
      spent: inPeriod.reduce((s, c) => s + c.spent, 0),
      fromStats: false,
    };
  }

  /** "Tháng 11/2026, tính đến hết 22/11" + " · cập nhật 10 phút trước" */
  async function periodHeader(period: string, dailyRows: StatRow[]): Promise<{ head: string; updated: string }> {
    const lastKey = dailyRows[dailyRows.length - 1]?.key;
    const until = formatDayMonth(lastKey ? new Date(`${lastKey}T12:00:00+07:00`) : db.now());
    const at = (await stat(scope, 'updated_at', period))[0]?.value;
    return {
      head: `Tháng ${periodText(period)}, tính đến hết ${until}`,
      updated: at ? `cập nhật ${formatRelative(at, db.now())}` : '',
    };
  }

  function latestEvent(events: CampaignEvent[], campaignId: string, prefix: string): CampaignEvent | undefined {
    return events.find((e) => e.campaignId === campaignId && e.text.startsWith(prefix));
  }

  function rowOf(c: Campaign, events: CampaignEvent[]): BizCampaignRowView {
    const state = stateNow(c);
    const st = STATUS[state];
    const range = dateRange(c.startsAt, c.endsAt);
    let sub = range;
    if (c.status === 'active') sub = `${range} · ${c.hoursFrom}–${c.hoursTo}`;
    if (c.status === 'paused') {
      const e = latestEvent(events, c.id, 'Tạm dừng');
      sub = e ? `${range} · dừng từ ${formatDayMonth(e.at)}` : `${range} · đang tạm dừng`;
    }
    if (c.status === 'rejected') {
      const e = latestEvent(events, c.id, 'Frego từ chối');
      sub = e ? `${range} · Frego từ chối ${formatDayMonth(e.at)}` : range;
    }
    const notRun =
      c.issuedCount === 0 && (c.status === 'pending' || c.status === 'draft' || c.status === 'rejected' || state === 'scheduled');
    return {
      id: c.id,
      href: `/doanh-nghiep/chien-dich/${c.id}`,
      name: c.name,
      sub,
      status: state,
      statusLabel: statusLabelOf(state, c),
      statusTone: st.tone,
      providerId: c.providerId,
      offerText: `${bizServiceLabel(c.providerId, c.vehicleClass)} · ${formatDiscount(c.amount)}`,
      zoneText: `${formatMeters(c.radiusM)} quanh quán`,
      usedText: notRun ? '—' : `${formatNumber(c.usedCount)} / ${formatNumber(c.issuedCount)}`,
      usedSub: notRun ? 'chưa chạy' : c.issuedCount ? `${formatPercent(c.usedCount / c.issuedCount)} được dùng` : 'chưa có mã',
      spentText: formatVnd(c.spent),
    };
  }

  const byRank = (a: Campaign, b: Campaign) =>
    STATUS[stateNow(a)].rank - STATUS[stateNow(b)].rank || b.createdAt.localeCompare(a.createdAt);

  /** Chiến dịch đang chạy tốn nhất mỗi mã → "51 mã Grab ô tô". */
  function coverOf(balance: number, list: Campaign[]) {
    const running = list.filter(isRunning).sort((a, b) => b.amount - a.amount)[0];
    if (!running) return null;
    const per = running.amount + FEE;
    return {
      codes: Math.floor(balance / per),
      service: serviceShortLabel(running.providerId, running.vehicleClass),
      amountText: formatDiscount(running.amount),
    };
  }

  return {
    db,
    businessId,

    async getBusiness() {
      return db.get('businesses', businessId);
    },

    /** Thành viên hiện tại là chủ cửa hàng (được tạo chiến dịch, sửa hồ sơ, mời thành viên). */
    canManage,

    /* ───── DN 1 · Tổng quan ───── */

    async getOverview(): Promise<BizOverviewView> {
      const now = db.now();
      const period = bizPeriodOf(now);
      const [b, list, daily, hours, weekdays, manage] = await Promise.all([
        business(),
        campaigns(),
        stat(scope, 'arrivals_daily', period),
        stat(scope, 'arrivals_by_hour', period),
        stat(scope, 'arrivals_by_weekday', period),
        canManage(),
      ]);
      const totals = await monthTotals(period, list);
      const events = await eventsOf(list.map((c) => c.id));
      const header = await periodHeader(period, daily);
      const cover = coverOf(b.walletBalance, list);
      const days = Math.max(1, vnParts(now).day);
      const perDay = totals.spent / days;
      const daysLeft = perDay > 0 ? b.walletBalance / perDay : Infinity;
      const peak = peakWindow(hours);
      const peakDays = peakDaysText(weekdays);
      const peakText = [peak ? `${pad2(peak.from)}:00–${pad2(peak.to)}:00` : '', peakDays ?? ''].filter(Boolean).join(', ');
      return {
        businessName: b.name,
        description: [header.head, header.updated].filter(Boolean).join(' · '),
        stats: [
          { label: 'Mã đã tặng', value: formatNumber(totals.issued), sub: 'cho người hay đến gần quán' },
          {
            label: 'Mã đã dùng',
            value: formatNumber(totals.used),
            sub: totals.issued ? `${formatPercent(totals.used / totals.issued)} số mã đã tặng` : 'chưa có mã nào',
          },
          { label: 'Đã chi', value: formatVnd(totals.spent), sub: 'giá trị giảm cộng phí dịch vụ' },
          {
            label: 'Chi phí mỗi chuyến đến',
            value: totals.used ? formatVnd(Math.round(totals.spent / totals.used)) : '—',
            sub: 'mỗi khách đặt xe tới vùng quán',
          },
        ],
        daily: dailyChart(daily, 'chuyến', 'số chuyến đến vùng quán mỗi ngày'),
        wallet: {
          balanceText: formatVnd(b.walletBalance),
          noteText: cover
            ? `Đủ khoảng ${formatNumber(cover.codes)} mã ${cover.service}. Ví hết thì chiến dịch tự dừng.`
            : `Chưa có chiến dịch đang chạy. Mỗi mã được dùng trừ giá trị giảm cộng ${formatVnd(FEE)} phí dịch vụ.`,
          tone: cover && daysLeft < 7 ? 'amber' : 'grey',
        },
        peakText: peakText || null,
        campaigns: list
          .filter((c) => c.status === 'active' || c.status === 'paused' || c.status === 'pending' || c.status === 'draft')
          .sort(byRank)
          .slice(0, 5)
          .map((c) => rowOf(c, events)),
        canManage: manage,
      };
    },

    /* ───── DN 2 · Chiến dịch ───── */

    async listCampaigns(tab?: string): Promise<BizCampaignListView> {
      const [list, manage] = await Promise.all([campaigns(), canManage()]);
      const events = await eventsOf(list.map((c) => c.id));
      const sorted = list.slice().sort(byRank);
      const count = (k: BizCampaignTab) => (k === 'tat-ca' ? list.length : list.filter((c) => STATUS[stateNow(c)].tab === k).length);
      const tabs = TABS.filter((t) => (t.key !== 'nhap' && t.key !== 'sap-chay') || count(t.key) > 0).map((t) => ({
        ...t,
        count: count(t.key),
      }));
      const activeTab = (tabs.find((t) => t.key === tab)?.key ?? 'tat-ca') as BizCampaignTab;
      const running = sorted.find(isRunning);
      const rejected = list
        .filter((c) => c.status === 'rejected')
        .sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt))[0];
      return {
        tabs,
        activeTab,
        rows: sorted.filter((c) => activeTab === 'tat-ca' || STATUS[stateNow(c)].tab === activeTab).map((c) => rowOf(c, events)),
        running: running
          ? {
              id: running.id,
              href: `/doanh-nghiep/chien-dich/${running.id}`,
              name: running.name,
              leftText: formatVnd(Math.max(0, running.budget - running.spent)),
            }
          : null,
        rejected: rejected
          ? {
              id: rejected.id,
              href: `/doanh-nghiep/chien-dich/tao?tu=${rejected.id}`,
              name: rejected.name,
              reason: rejected.rejectReason ?? 'Frego sẽ gửi lý do qua email.',
            }
          : null,
        canManage: manage,
      };
    },

    /* ───── DN 6 · Chi tiết chiến dịch ───── */

    async getCampaignDetail(id: string): Promise<BizCampaignDetailView | null> {
      const c = await db.get('campaigns', id);
      if (!c || c.businessId !== businessId) return null;
      const lastDay = Math.min(db.now().getTime(), new Date(c.endsAt).getTime());
      const period = bizPeriodOf(Math.max(lastDay, new Date(c.startsAt).getTime()));
      const [events, daily, manage] = await Promise.all([eventsOf([c.id]), stat(`cp:${c.id}`, 'codes_used_daily', period), canManage()]);
      const state = stateNow(c);
      const st = STATUS[state];
      const service = bizServiceLabel(c.providerId, c.vehicleClass);
      const perCode = c.amount + FEE;
      const left = Math.max(0, c.budget - c.spent);
      const notStarted = c.issuedCount === 0;
      const adFrom = await adSince();
      return {
        id: c.id,
        name: c.name,
        status: state,
        statusLabel: statusLabelOf(state, c),
        statusTone: st.tone,
        subtitle: [dateRange(c.startsAt, c.endsAt), `${c.hoursFrom}–${c.hoursTo}`, service, `${formatMeters(c.radiusM)} quanh quán`].join(' · '),
        canPause: manage && c.status === 'active',
        canResume: manage && c.status === 'paused' && !!c.approvedAt && c.pausedBy !== 'frego',
        canEditBudget: manage && c.status !== 'ended' && c.status !== 'rejected',
        resubmitHref: manage && (c.status === 'rejected' || c.status === 'draft') ? `/doanh-nghiep/chien-dich/tao?tu=${c.id}` : null,
        rejectReason: c.status === 'rejected' ? c.rejectReason : null,
        stats: [
          {
            label: 'Mã đã tặng',
            value: formatNumber(c.issuedCount),
            sub: notStarted ? `bắt đầu ${formatDate(c.startsAt)}` : `từ ${formatDayMonth(c.startsAt)}`,
          },
          {
            label: 'Mã đã dùng',
            value: formatNumber(c.usedCount),
            sub: c.issuedCount ? `${formatPercent(c.usedCount / c.issuedCount)} số mã đã tặng` : 'chưa có mã nào',
          },
          { label: 'Đã chi', value: formatVnd(c.spent), sub: `${formatVnd(perCode)} mỗi mã` },
          { label: 'Ngân sách còn', value: formatVnd(left), sub: `trên ${formatVnd(c.budget)} ngân sách` },
        ],
        adViews: adViewsStat(c.adViewCount ?? 0, adFrom),
        chart: {
          title: 'Mã được dùng mỗi ngày',
          ...dailyChart(daily, 'mã', 'mã của chiến dịch được dùng mỗi ngày'),
        },
        history: events.map((e) => ({ key: e.id, time: formatDayMonth(e.at), text: e.text })),
        settings: [
          { label: 'Hãng và loại xe', value: service },
          { label: 'Mức giảm', value: `${formatVnd(c.amount)} mỗi chuyến` },
          { label: 'Vùng áp dụng', value: `${formatMeters(c.radiusM)} quanh quán` },
          { label: 'Khung giờ', value: `${c.hoursFrom} – ${c.hoursTo} mỗi ngày` },
          { label: 'Tối đa mỗi ngày', value: `${formatNumber(c.dailyCap)} mã` },
        ],
        budget: c.budget,
        budgetText: formatVnd(c.budget),
        spent: c.spent,
        minBudget: Math.max(c.spent, perCode),
        canManage: manage,
      };
    },

    /** Tạm dừng (active → paused) hoặc chạy tiếp (paused → active, đã được Frego duyệt). */
    async setCampaignPaused(id: string, paused: boolean): Promise<{ campaign: Campaign; message: string }> {
      await requireOwner();
      const c = await ownCampaign(id);
      if (paused && c.status !== 'active') throw new BizServiceError('Chỉ tạm dừng được chiến dịch đang chạy.');
      if (!paused && (c.status !== 'paused' || !c.approvedAt)) throw new BizServiceError('Chiến dịch này chưa chạy tiếp được.');
      if (!paused && c.pausedBy === 'frego') {
        throw new BizServiceError('Frego đang tạm dừng chiến dịch này. Liên hệ Frego để được xem xét chạy lại.');
      }
      const campaign = await db.update('campaigns', id, {
        status: paused ? 'paused' : 'active',
        pausedBy: paused ? 'business' : null,
      });
      await addEvent(id, paused ? 'Tạm dừng' : 'Tiếp tục chạy');
      return {
        campaign,
        message: paused
          ? 'Đã tạm dừng. Mã đã tặng vẫn dùng được đến hết hạn, Frego không tặng thêm mã mới.'
          : 'Chiến dịch chạy tiếp, Frego tặng mã mới từ bây giờ.',
      };
    },

    /** Đổi ngân sách tối đa (không cần duyệt lại). Ghi lịch sử "Tăng ngân sách từ … lên …". */
    async updateCampaignBudget(id: string, budget: number): Promise<{ campaign: Campaign; message: string }> {
      await requireOwner();
      const c = await ownCampaign(id);
      if (c.status === 'ended' || c.status === 'rejected') throw new BizServiceError('Chiến dịch này không đổi được ngân sách.');
      if (!Number.isInteger(budget) || budget <= 0) throw new BizServiceError('Nhập số tiền, VD 15.000.000.', 'budget');
      const min = Math.max(c.spent, c.amount + FEE);
      if (budget < min) throw new BizServiceError(`Tối thiểu ${formatVnd(min)} (số đã chi hoặc một mã).`, 'budget');
      if (budget > 1_000_000_000) throw new BizServiceError('Tối đa 1.000.000.000đ.', 'budget');
      if (budget === c.budget) throw new BizServiceError('Ngân sách mới giống ngân sách hiện tại.', 'budget');
      const campaign = await db.update('campaigns', id, { budget });
      const up = budget > c.budget;
      await addEvent(
        id,
        up
          ? `Tăng ngân sách từ ${formatVnd(c.budget)} lên ${formatVnd(budget)}`
          : `Giảm ngân sách từ ${formatVnd(c.budget)} xuống ${formatVnd(budget)}`,
      );
      return {
        campaign,
        message: `Đã ${up ? 'tăng ngân sách lên' : 'giảm ngân sách xuống'} ${formatVnd(budget)}. Không cần Frego duyệt lại khi chỉ đổi ngân sách.`,
      };
    },

    /* ───── DN 3 · Tạo chiến dịch ───── */

    async getCampaignForm(fromId?: string | null): Promise<BizCampaignFormView> {
      const now = db.now();
      const [b, list, audienceRows, manage] = await Promise.all([
        business(),
        campaigns(),
        stat(scope, 'audience_by_radius', bizPeriodOf(now)),
        canManage(),
      ]);
      const from = fromId ? list.find((c) => c.id === fromId) ?? null : null;
      const mode: BizCampaignFormView['mode'] = !from
        ? 'new'
        : from.status === 'draft' || from.status === 'rejected' || from.status === 'pending'
          ? 'edit'
          : 'copy';
      const p = vnParts(now);
      const nextMonthStart = new Date(Date.UTC(p.year, p.month, 1) - VN_OFFSET_MS);
      const nextMonthEnd = new Date(Date.UTC(p.year, p.month + 1, 1) - VN_OFFSET_MS - DAY_MS);
      const startDate = mode === 'edit' && from && new Date(from.startsAt).getTime() >= now.getTime() ? from.startsAt : null;
      const withImage = list.filter((c) => c.imageUrl).sort((a, z) => z.createdAt.localeCompare(a.createdAt))[0];
      const imageUrl = from?.imageUrl ?? withImage?.imageUrl ?? b.logoUrl;
      const fileName = imageFileName(imageUrl);
      return {
        mode,
        fromId: mode === 'edit' && from ? from.id : null,
        rejectReason: from?.status === 'rejected' ? from.rejectReason : null,
        business: {
          name: b.name,
          category: b.category,
          shortAddress: shortAddress(b),
          openHoursText: openHoursText(b.openHours),
        },
        fee: FEE,
        feeText: formatVnd(FEE),
        radii: BIZ_RADIUS_OPTIONS.map((r) => ({ value: r, label: formatMeters(r) })),
        amounts: [...new Set<number>([...BIZ_AMOUNT_OPTIONS, ...(from ? [from.amount] : [])])]
          .sort((a, z) => a - z)
          .map((a) => ({ value: a, label: formatVnd(a) })),
        providers: PROVIDER_ORDER.map((id) => ({ value: id, label: PROVIDERS[id].name })),
        vehicles: VEHICLE_ORDER.map((v) => ({ value: v, label: BIZ_VEHICLE_LABEL[v][0].toUpperCase() + BIZ_VEHICLE_LABEL[v].slice(1) })),
        audience: audienceRows.length ? Object.fromEntries(audienceRows.map((r) => [r.key, r.value])) : null,
        image: imageUrl
          ? {
              name: fileName || (imageUrl === b.logoUrl ? 'Logo cửa hàng' : 'Ảnh chiến dịch'),
              meta: from?.imageUrl ? 'ảnh của chiến dịch này' : imageUrl === b.logoUrl ? 'logo trong Hồ sơ cửa hàng' : 'dùng lại từ chiến dịch trước',
            }
          : { name: `Biểu tượng ${b.industry.split('·').pop()?.trim().toLowerCase() || 'cửa hàng'}`, meta: 'Dùng khi chưa có ảnh riêng' },
        values: {
          name: mode === 'edit' && from ? from.name : from ? `${from.name} (bản sao)` : `Chiến dịch tháng ${pad2(vnParts(nextMonthStart).month)}/${vnParts(nextMonthStart).year}`,
          providerId: from?.providerId ?? 'grab',
          vehicleClass: from?.vehicleClass ?? 'car4',
          amount: from?.amount ?? 20000,
          radiusM: from && (BIZ_RADIUS_OPTIONS as readonly number[]).includes(from.radiusM) ? from.radiusM : 500,
          budget: formatNumber(from?.budget || 5000000),
          dailyCap: String(from?.dailyCap ?? 30),
          startDate: formatDate(startDate ?? nextMonthStart),
          endDate: formatDate(startDate && from ? from.endsAt : nextMonthEnd),
          onlyOpenHours: from?.onlyOpenHours ?? true,
        },
        canManage: manage,
      };
    },

    /**
     * Gửi Frego duyệt (status pending + submittedAt) hoặc lưu nháp.
     * `fromId` là chiến dịch nháp / bị từ chối / chờ duyệt → sửa và gửi lại; khác thì tạo mới.
     */
    async createCampaign(
      input: BizCampaignInput,
      opts: { draft?: boolean; fromId?: string | null } = {},
    ): Promise<{ campaign: Campaign; message: string; resubmitted: boolean }> {
      await requireOwner();
      const b = await business();
      const now = db.now().toISOString();
      const hours = input.onlyOpenHours ? parseHours(b.openHours.weekdays) ?? ['07:00', '22:00'] : (['00:00', '23:59'] as [string, string]);
      const fields = {
        name: input.name,
        providerId: input.providerId,
        vehicleClass: input.vehicleClass,
        amount: input.amount,
        radiusM: input.radiusM,
        hoursFrom: hours[0],
        hoursTo: hours[1],
        onlyOpenHours: input.onlyOpenHours,
        dailyCap: input.dailyCap,
        budget: input.budget,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      } satisfies Partial<Campaign>;
      const status: CampaignStatus = opts.draft ? 'draft' : 'pending';
      const message = opts.draft
        ? 'Đã lưu nháp. Bạn có thể sửa và gửi Frego duyệt khi sẵn sàng.'
        : 'Đã gửi. Frego sẽ duyệt trong 1 ngày làm việc và báo cho bạn qua email.';

      if (opts.fromId) {
        const old = await ownCampaign(opts.fromId);
        if (old.status === 'draft' || old.status === 'rejected' || old.status === 'pending') {
          const campaign = await db.update('campaigns', old.id, {
            ...fields,
            status,
            rejectReason: null,
            submittedAt: opts.draft ? old.submittedAt : now,
          });
          await addEvent(old.id, opts.draft ? 'Lưu nháp' : old.status === 'rejected' ? 'Sửa và gửi duyệt lại' : 'Gửi duyệt');
          return { campaign, message, resubmitted: true };
        }
      }
      const campaign = await db.insert('campaigns', {
        businessId,
        ...fields,
        status,
        rejectReason: null,
        pausedBy: null,
        spent: 0,
        issuedCount: 0,
        usedCount: 0,
        adViewCount: 0,
        imageUrl: b.logoUrl,
        submittedAt: opts.draft ? null : now,
        approvedAt: null,
        createdAt: now,
      });
      await addEvent(campaign.id, opts.draft ? 'Lưu nháp' : 'Gửi duyệt');
      return { campaign, message, resubmitted: false };
    },

    /* ───── DN 4 · Báo cáo chuyến đến ───── */

    async getReport(): Promise<BizReportView> {
      const now = db.now();
      const period = bizPeriodOf(now);
      const prev = prevPeriod(period);
      const [list, daily, hours, weekdays, services, districts, distance] = await Promise.all([
        campaigns(),
        stat(scope, 'arrivals_daily', period),
        stat(scope, 'arrivals_by_hour', period),
        stat(scope, 'arrivals_by_weekday', period),
        stat(scope, 'arrivals_by_service', period),
        stat(scope, 'origin_district', period),
        stat(scope, 'avg_distance_m', period),
      ]);
      const [totals, prevTotals, events] = await Promise.all([
        monthTotals(period, list),
        monthTotals(prev, list),
        eventsOf(list.map((c) => c.id)),
      ]);
      const header = await periodHeader(period, daily);

      const running = list.filter((c) => (c.status === 'active' || c.status === 'paused') && overlaps(c, period));
      const radii = [...new Set((running.length ? running : list.filter((c) => overlaps(c, period))).map((c) => c.radiusM))];
      const prevCamps = list.filter((c) => overlaps(c, prev) && c.usedCount > 0);
      const prevVehicles = [...new Set(prevCamps.map((c) => c.vehicleClass))];
      const prevSub = prevTotals.used
        ? `tháng ${Number(prev.slice(5))}: ${formatVnd(Math.round(prevTotals.spent / prevTotals.used))}${
            prevVehicles.length === 1 ? `, mã ${prevVehicles[0] === 'bike' ? 'xe máy' : 'ô tô'}` : ''
          }`
        : 'chưa có số liệu tháng trước';

      const peak = peakWindow(hours);
      const hourValues = hours.map((r) => r.value);
      const peakHours = new Set(peak ? [peak.from, peak.from + 1] : []);
      const weekdayRows = WEEKDAY_ORDER.map((k) => weekdays.find((r) => r.key === k)).filter((r): r is StatRow => !!r);
      const wkTop = topTwo(weekdayRows.map((r) => r.value));
      const wkMax = lastMaxIndex(weekdayRows.map((r) => r.value));

      const svcTotal = sumOf(services);
      const toneOf: Record<ProviderId, BizMeterView['tone']> = { grab: 'green', be: 'amber', gsm: 'blue' };
      const pausedNotes = list
        .filter((c) => c.status === 'paused' && overlaps(c, period))
        .map((c) => {
          const e = latestEvent(events, c.id, 'Tạm dừng');
          return `Chiến dịch ${bizServiceLabel(c.providerId, c.vehicleClass)} tạm dừng${e ? ` từ ${formatDayMonth(e.at)}` : ''} nên ít chuyến hơn.`;
        });
      // Khung giờ từng chiến dịch có chạy trong tháng: số theo giờ gộp mọi chiến dịch, nên ghi rõ để không bị hiểu lầm.
      const windows = list
        .filter((c) => (c.status === 'active' || c.status === 'paused' || c.status === 'ended') && overlaps(c, period) && c.issuedCount > 0)
        .map((c) => {
          const e = c.status === 'paused' ? latestEvent(events, c.id, 'Tạm dừng') : undefined;
          return `${bizServiceLabel(c.providerId, c.vehicleClass)} ${c.hoursFrom}–${c.hoursTo}${
            c.status === 'paused' ? (e ? ` (tạm dừng từ ${formatDayMonth(e.at)})` : ' (đang tạm dừng)') : ''
          }`;
        });
      const hoursNote = windows.length > 1 ? `Gộp mọi chiến dịch trong tháng: ${windows.join('; ')}.` : null;
      const distTotal = sumOf(districts);
      const distMax = Math.max(1, ...districts.map((r) => r.value));

      return {
        description: `${header.head}. Chỉ có số liệu tổng hợp, Frego không chia sẻ người nhận là ai.`,
        stats: [
          { label: 'Chuyến đến vùng quán', value: formatNumber(totals.used), sub: 'mỗi chuyến dùng 1 mã' },
          {
            label: 'Tỷ lệ dùng mã',
            value: totals.issued ? formatPercent(totals.used / totals.issued) : '—',
            sub: `trên ${formatNumber(totals.issued)} mã đã tặng`,
          },
          {
            label: 'Điểm đến cách quán',
            value: distance[0] ? formatMeters(distance[0].value) : '—',
            sub: radii.length ? `trung bình, vùng áp dụng ${formatMeters(Math.max(...radii))}` : 'trung bình',
          },
          {
            label: 'Chi phí mỗi chuyến',
            value: totals.used ? formatVnd(Math.round(totals.spent / totals.used)) : '—',
            sub: prevSub,
          },
        ],
        hours: {
          bars: hours.map((r) => ({
            label: `${Number(r.key)}h`,
            srLabel: `${Number(r.key)} giờ`,
            value: r.value,
            highlight: peakHours.has(Number(r.key)),
          })),
          summary: peak
            ? `Số chuyến theo giờ, cao nhất lúc ${peak.peakHour} giờ với ${formatNumber(peak.peakValue)} chuyến`
            : 'Chưa có số liệu theo giờ',
          peakText: peak ? `Khách đến nhiều nhất ${pad2(peak.from)}:00–${pad2(peak.to)}:00` : 'Chưa có số liệu',
          note: hoursNote,
        },
        services: services.map((r) => {
          const [p, v] = r.key.split('-') as [ProviderId, VehicleClass];
          const share = svcTotal ? r.value / svcTotal : 0;
          return {
            key: r.key,
            label: PROVIDERS[p] && BIZ_VEHICLE_LABEL[v] ? bizServiceLabel(p, v) : r.key,
            valueText: `${formatNumber(r.value)} · ${formatPercent(share)}`,
            percent: Math.round(share * 100),
            providerId: PROVIDERS[p] ? p : undefined,
            tone: toneOf[p] ?? 'blue',
          };
        }),
        servicesNote: pausedNotes.length ? pausedNotes.join(' ') : null,
        districts: districts.map((r) => ({
          key: r.key,
          label: r.key,
          valueText: distTotal ? formatPercent(r.value / distTotal) : '—',
          percent: Math.round((r.value / distMax) * 100),
          tone: 'blue',
        })),
        weekdays: {
          bars: weekdayRows.map((r, i) => ({
            label: WEEKDAY_SHORT[r.key],
            srLabel: WEEKDAY_NAME[r.key],
            value: r.value,
            highlight: wkTop.has(i),
          })),
          summary:
            wkMax >= 0
              ? `${WEEKDAY_NAME[weekdayRows[wkMax].key].replace(/^t/, 'T')} nhiều chuyến nhất với ${formatNumber(weekdayRows[wkMax].value)} chuyến`
              : 'Chưa có số liệu theo ngày trong tuần',
        },
        adViews: adViewsStat(
          list.reduce((s, c) => s + (c.adViewCount ?? 0), 0),
          await adSince(),
        ),
        hasData: daily.length > 0 || totals.used > 0,
      };
    },

    /* ───── Quảng cáo: banner popup sau màn So giá (chốt 27/11/2026) ───── */

    /** Trang Quảng cáo: banner đang chạy, bản chờ duyệt / bị từ chối gần nhất, lượt xem, quy định. */
    async getAd(): Promise<BizAdView> {
      const [b, banners, list, manage] = await Promise.all([
        business(),
        db.list('ad_banners', { where: { businessId } }),
        campaigns(),
        canManage(),
      ]);
      const byNewest = [...banners].sort((x, y) => y.submittedAt.localeCompare(x.submittedAt));
      const running = byNewest
        .filter((a) => a.status === 'approved')
        .sort((x, y) => (y.reviewedAt ?? '').localeCompare(x.reviewedAt ?? ''))[0];
      const pending = byNewest.find((a) => a.status === 'pending');
      // Bị từ chối: chỉ hiện nếu là bản gửi mới nhất (gửi lại thì thôi).
      const rejected = byNewest[0]?.status === 'rejected' ? byNewest[0] : undefined;
      const toView = async (a: AdBanner, statusText: string): Promise<BizAdBannerView> => ({
        id: a.id,
        imageUrl: await db.files.viewUrl(a.imageUrl),
        title: a.title,
        body: a.body,
        statusText,
      });
      const views = list.reduce((s, c) => s + (c.adViewCount ?? 0), 0);
      const sample = list.find(isRunning) ?? list.find((c) => c.status === 'active') ?? list[0];
      return {
        running: running ? await toView(running, `Đang hiện trong app từ ${formatDate(running.reviewedAt ?? running.submittedAt)}`) : null,
        pending: pending ? await toView(pending, `Gửi ${formatDate(pending.submittedAt)}, Frego duyệt trong 1 ngày làm việc`) : null,
        rejected: rejected
          ? { ...(await toView(rejected, `Bị từ chối ngày ${formatDate(rejected.reviewedAt ?? rejected.submittedAt)}`)), reason: rejected.rejectReason ?? '' }
          : null,
        adViews: adViewsStat(views, await adSince()),
        canSubmit: manage && !pending,
        submitBlockedText: !manage ? 'Chỉ chủ cửa hàng gửi được banner.' : pending ? 'Đang có banner chờ duyệt. Chờ Frego duyệt xong rồi gửi bản mới.' : null,
        preview: {
          name: b.name,
          category: b.category,
          industry: b.industry,
          address: b.address,
          giftText: sample
            ? `Voucher ${formatDiscount(sample.amount)} ${bizServiceLabel(sample.providerId, sample.vehicleClass)} chuyến này là quà của ${b.name}.`
            : `Voucher chuyến này là quà của ${b.name}.`,
        },
        rules: AD_RULES,
      };
    },

    /** Gửi banner mới (chờ Frego duyệt). Bản đang chạy vẫn hiện tới khi bản mới được duyệt. */
    async submitAd(input: {
      file: { bytes: Uint8Array; contentType: string; name: string } | null;
      title: string;
      body: string;
    }): Promise<{ ok: true } | { ok: false; field: 'file' | 'title' | 'body' | null; error: string }> {
      if (!(await canManage())) return { ok: false, field: null, error: 'Chỉ chủ cửa hàng gửi được banner.' };
      const title = input.title.trim().replace(/\s+/g, ' ');
      const body = input.body.trim().replace(/\s+/g, ' ');
      const f = input.file;
      if (!f || !f.bytes.length) return { ok: false, field: 'file', error: 'Chọn ảnh banner.' };
      const ext = AD_IMAGE_TYPES[f.contentType];
      if (!ext) return { ok: false, field: 'file', error: 'Ảnh phải là JPG, PNG hoặc WebP.' };
      if (f.bytes.length > AD_IMAGE_MAX_BYTES) return { ok: false, field: 'file', error: 'Ảnh tối đa 1 MB.' };
      if (!title) return { ok: false, field: 'title', error: 'Nhập tiêu đề.' };
      if (title.length > AD_TITLE_MAX) return { ok: false, field: 'title', error: `Tiêu đề tối đa ${AD_TITLE_MAX} ký tự.` };
      if (body.length > AD_BODY_MAX) return { ok: false, field: 'body', error: `Nội dung tối đa ${AD_BODY_MAX} ký tự.` };
      const pending = await db.list('ad_banners', { where: { businessId, status: 'pending' }, limit: 1 });
      if (pending.length) return { ok: false, field: null, error: 'Đang có banner chờ duyệt. Chờ Frego duyệt xong rồi gửi bản mới.' };
      const imageUrl = await db.files.uploadPrivate(businessId, { bytes: f.bytes, contentType: f.contentType, ext });
      await db.insert('ad_banners', {
        businessId,
        imageUrl,
        title,
        body,
        status: 'pending',
        rejectReason: null,
        submittedAt: db.now().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
      });
      return { ok: true };
    },

    /** Báo cáo dạng CSV (UTF-8 có BOM để Excel đọc đúng tiếng Việt). Chỉ số tổng hợp. */
    async getReportCsv(): Promise<{ fileName: string; csv: string }> {
      const now = db.now();
      const period = bizPeriodOf(now);
      const [b, list] = await Promise.all([business(), campaigns()]);
      const metrics: [string, string][] = [
        ['arrivals_daily', 'Chuyến đến mỗi ngày'],
        ['arrivals_by_hour', 'Theo giờ trong ngày'],
        ['arrivals_by_weekday', 'Theo ngày trong tuần'],
        ['arrivals_by_service', 'Theo hãng và loại xe'],
        ['origin_district', 'Khách đi từ đâu (quận nơi đón)'],
      ];
      const totals = await monthTotals(period, list);
      const cell = (s: string | number) => {
        const t = String(s);
        return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
      };
      const lines: (string | number)[][] = [
        ['Mục', 'Mốc', 'Giá trị'],
        ['Mã đã tặng', `Tháng ${periodText(period)}`, totals.issued],
        ['Mã đã dùng (chuyến đến vùng quán)', `Tháng ${periodText(period)}`, totals.used],
        ['Đã chi (đ)', `Tháng ${periodText(period)}`, totals.spent],
      ];
      for (const [metric, label] of metrics) {
        for (const r of await stat(scope, metric, period)) {
          let key = r.key;
          if (metric === 'arrivals_daily') key = formatDate(new Date(`${r.key}T00:00:00+07:00`));
          if (metric === 'arrivals_by_hour') key = `${Number(r.key)} giờ`;
          if (metric === 'arrivals_by_weekday') key = WEEKDAY_NAME[r.key] ?? r.key;
          if (metric === 'arrivals_by_service') {
            const [p, v] = r.key.split('-') as [ProviderId, VehicleClass];
            key = PROVIDERS[p] && BIZ_VEHICLE_LABEL[v] ? bizServiceLabel(p, v) : r.key;
          }
          lines.push([label, key, r.value]);
        }
      }
      const slug = b.name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      return {
        fileName: `frego-bao-cao-${slug || 'cua-hang'}-${period}.csv`,
        csv: '﻿' + lines.map((l) => l.map(cell).join(',')).join('\r\n') + '\r\n',
      };
    },

    /* ───── DN 5 · Ví và hóa đơn ───── */

    async getWallet(): Promise<BizWalletView> {
      const now = db.now();
      const period = bizPeriodOf(now);
      const [b, list, txs, invoices, daily, manage] = await Promise.all([
        business(),
        campaigns(),
        db.list('wallet_transactions', { where: { businessId } }),
        db.list('invoices', { where: { businessId } }),
        stat(scope, 'arrivals_daily', period),
        canManage(),
      ]);
      const cover = coverOf(b.walletBalance, list);
      const todayKey = `${period}-${pad2(vnParts(now).day)}`;
      const todayCodes = daily.find((r) => r.key === todayKey)?.value ?? 0;
      const tomorrow = new Date(now.getTime() + DAY_MS);
      const coverText = [
        cover ? `Đủ cho khoảng ${formatNumber(cover.codes)} mã ${cover.service} ${cover.amountText}.` : 'Chưa có chiến dịch đang chạy.',
        todayCodes ? `Hôm nay đã có ${formatNumber(todayCodes)} mã được dùng, sẽ trừ ngày ${formatDayMonth(tomorrow)}.` : '',
      ]
        .filter(Boolean)
        .join(' ');

      // Số dư sau mỗi giao dịch đã xong: đi lùi từ số dư hiện tại.
      const desc = txs.slice().sort((a, z) => z.createdAt.localeCompare(a.createdAt));
      const after = new Map<string, number>();
      let running = b.walletBalance;
      for (const t of desc) {
        if (t.status !== 'done') continue;
        after.set(t.id, running);
        running -= t.amount;
      }
      const pendingFirst = [...desc.filter((t) => t.status === 'pending'), ...desc.filter((t) => t.status !== 'pending')];
      const transactions = pendingFirst.slice(0, 8).map((t): BizTransactionView => {
        const [title, sub] = splitNote(t.note);
        const pending = t.status === 'pending';
        const sign = t.amount < 0 ? '−' : '+';
        return {
          id: t.id,
          dateText: formatDate(t.createdAt),
          title: title || (t.kind === 'topup' ? 'Nạp tiền' : t.kind === 'refund' ? 'Hoàn tiền' : 'Trừ ví'),
          sub: pending
            ? ['Chờ ngân hàng xác nhận', t.reference].filter(Boolean).join(' · ')
            : t.status === 'failed'
              ? 'Không thành công'
              : sub || t.reference || '',
          amountText: sign + formatVnd(Math.abs(t.amount)),
          tone: pending || t.status === 'failed' ? '' : t.amount < 0 ? 'bad' : 'good',
          balanceAfterText: pending ? 'Chờ xác nhận' : after.has(t.id) ? formatVnd(after.get(t.id)!) : '—',
          pending,
        };
      });

      const invoiceViews = invoices
        .slice()
        .sort((a, z) => z.month.localeCompare(a.month))
        .map((inv: Invoice): BizInvoiceView => {
          const [y, m] = inv.month.split('-').map(Number);
          const issueOn = new Date(Date.UTC(y, m, 1) - VN_OFFSET_MS);
          return {
            id: inv.id,
            title: `Hóa đơn tháng ${periodText(inv.month)}`,
            sub: inv.status === 'draft' ? `Tạm tính ${formatVnd(inv.amount)}` : formatVnd(inv.amount),
            statusText: inv.status === 'draft' ? `Xuất ngày ${formatDayMonth(issueOn)}` : 'Đã xuất',
            statusTone: inv.status === 'draft' ? 'amber' : 'green',
            issued: inv.status === 'issued',
          };
        });

      return {
        balance: b.walletBalance,
        balanceText: formatVnd(b.walletBalance),
        coverText,
        topupOptions: BIZ_TOPUP_OPTIONS.map((v) => ({ value: v, label: formatVnd(v) })),
        defaultTopup: 5000000,
        transferCode: b.transferCode,
        nextReference: topupReference(b.transferCode, nextTopupNumber(b.transferCode, txs.map((t) => t.reference))),
        bank: { ...brand.bank },
        transactions,
        invoices: invoiceViews,
        invoiceEmail: b.invoiceEmail,
        canManage: manage,
      };
    },

    /**
     * "Tôi đã chuyển khoản": ghi một lần nạp chờ khớp. Mỗi lần có nội dung chuyển khoản RIÊNG ("FREGO CPM1024-2"),
     * nên hai lần nạp cùng số tiền vẫn khớp đúng từng dòng (SQL: chỉ mục duy nhất trên reference của lần nạp).
     * `reference`: nội dung đã hiện cho người dùng (nếu còn chưa ai dùng thì giữ, để khớp đúng chữ họ đã chuyển).
     */
    async reportTransfer(amount: number, reference?: string | null): Promise<{ transaction: WalletTransaction; message: string }> {
      checkTopupAmount(amount);
      const transaction = await insertTopup(amount, 'Nạp chuyển khoản', reference ?? null, null);
      return {
        transaction,
        message: `Đã ghi nhận lần nạp ${formatVnd(amount)} với nội dung ${transaction.reference}. Frego khớp tiền trong giờ làm việc, thường dưới 30 phút, và báo khi tiền vào ví.`,
      };
    },

    /**
     * Nạp qua PayOS: ghi lần nạp chờ với mã đơn (orderCode) để webhook khớp tự động. Trang web gọi PayOS tạo link
     * thanh toán bằng mã đơn này (chỉ ở máy chủ, có khóa bí mật).
     */
    async startPayosTopup(amount: number, orderCode: number): Promise<{ transaction: WalletTransaction }> {
      checkTopupAmount(amount);
      if (!Number.isSafeInteger(orderCode) || orderCode <= 0) throw new BizServiceError('Mã đơn không hợp lệ.');
      const transaction = await insertTopup(amount, 'Nạp qua PayOS · VietQR', null, orderCode);
      return { transaction };
    },

    /** Lần nạp PayOS của doanh nghiệp theo mã đơn (trang quay về sau khi thanh toán). */
    async getPayosTopup(orderCode: number): Promise<{ status: WalletTransaction['status']; amountText: string } | null> {
      const rows = await db.list('wallet_transactions', { where: { businessId, kind: 'topup' } });
      const tx = rows.find((t) => t.orderCode === orderCode);
      return tx ? { status: tx.status, amountText: formatVnd(tx.amount) } : null;
    },

    /** Hóa đơn tháng (trang in / lưu PDF bằng trình duyệt). */
    async getInvoice(id: string): Promise<{
      title: string;
      issued: boolean;
      statusText: string;
      issuedText: string | null;
      seller: { name: string; email: string; hotline: string };
      buyer: { name: string; taxCode: string; address: string; email: string };
      lines: { label: string; value: string }[];
      totalText: string;
    } | null> {
      const [b, inv] = await Promise.all([business(), db.get('invoices', id)]);
      if (!inv || inv.businessId !== businessId) return null;
      const [y, m] = inv.month.split('-').map(Number);
      const [from, to] = periodBounds(inv.month);
      const camps = (await campaigns()).filter((c) => new Date(c.startsAt).getTime() < to && new Date(c.endsAt).getTime() >= from);
      const used = camps.reduce((s, c) => s + c.usedCount, 0);
      return {
        title: `Hóa đơn tháng ${pad2(m)}/${y}`,
        issued: inv.status === 'issued',
        statusText: inv.status === 'issued' ? 'Đã xuất' : 'Tạm tính, chưa xuất',
        issuedText: inv.issuedAt ? formatDate(inv.issuedAt) : null,
        seller: { name: brand.company.legalName, email: brand.company.businessEmail, hotline: brand.company.hotline },
        buyer: { name: b.invoiceName || b.legalName || b.name, taxCode: b.taxCode, address: b.address, email: b.invoiceEmail },
        lines: [
          { label: 'Kỳ', value: `${formatDate(new Date(from))} – ${formatDate(new Date(to - DAY_MS))}` },
          { label: 'Mã được dùng', value: used ? `${formatNumber(used)} mã` : '—' },
          { label: 'Nội dung', value: 'Giá trị giảm của mã đã dùng và phí dịch vụ Frego, đã trừ từ ví' },
        ],
        totalText: formatVnd(inv.amount),
      };
    },

    /* ───── DN 7 · Hồ sơ cửa hàng ───── */

    async getProfile(): Promise<BizProfileView> {
      const [b, members, manage] = await Promise.all([
        business(),
        db.list('business_members', { where: { businessId } }),
        canManage(),
      ]);
      const me = db.currentUserId();
      // Ảnh DEMO là data URL: không có tên tệp.
      const logoName = b.logoUrl && !b.logoUrl.startsWith('data:') ? decodeURIComponent(b.logoUrl.split('/').pop() ?? '').split('?')[0] : '';
      return {
        name: b.name,
        industry: b.industry,
        address: b.address,
        landmark: b.landmark,
        category: b.category,
        logo: b.logoUrl
          ? { title: `Logo · ${logoName || 'ảnh đã tải'}`, sub: 'Ảnh vuông 1080 × 1080, dùng mặc định cho chiến dịch', imageUrl: b.logoUrl }
          : { title: 'Logo · biểu tượng theo ngành', sub: 'Tải ảnh vuông 1080 × 1080 để dùng mặc định cho chiến dịch', imageUrl: null },
        openHours: [
          { label: 'Thứ Hai – Thứ Sáu', value: b.openHours.weekdays },
          { label: 'Thứ Bảy', value: b.openHours.saturday },
          { label: 'Chủ nhật', value: b.openHours.sunday },
        ],
        storefront: b.storefrontVerified
          ? { title: 'Ảnh mặt tiền cửa hàng', statusText: 'Frego đã xác nhận', tone: 'green' }
          : { title: 'Ảnh mặt tiền cửa hàng', statusText: 'Chờ Frego xác nhận', tone: 'amber' },
        invoiceName: b.invoiceName,
        taxCodeMasked: maskTaxCode(b.taxCode),
        invoiceEmail: b.invoiceEmail,
        contactEmail: b.contactEmail,
        contactPhone: b.contactPhone,
        notifyPrefs: b.notifyPrefs,
        members: members
          .slice()
          .sort((a, z) => (a.role === z.role ? a.invitedAt.localeCompare(z.invitedAt) : a.role === 'owner' ? -1 : 1))
          .map((m) => ({
            id: m.id,
            email: m.email,
            initials: m.role === 'owner' ? edgeInitials(b.name) : edgeInitials(MEMBER_ROLE[m.role].label),
            roleLabel: MEMBER_ROLE[m.role].label,
            permissions: MEMBER_ROLE[m.role].permissions,
            invited: !m.userId,
            isMe: !!me && m.userId === me,
          })),
        canManage: manage,
      };
    },

    /**
     * Lưu hồ sơ (chỉ các cột BIZ_PROFILE_FIELDS). Đổi địa chỉ thì chiến dịch đang chạy chờ Frego duyệt lại
     * (Supabase: trigger businesses_address_guard; DEMO: làm tương tự ở đây).
     */
    /** Đổi logo quán (Hồ sơ cửa hàng): JPG/PNG/WebP ≤ 1 MB, chỉ chủ quán. Logo hiện ngay trong app (ghim, popup). */
    async updateLogo(file: { bytes: Uint8Array; contentType: string; name: string }): Promise<{ logoUrl: string }> {
      await requireOwner();
      const ext = AD_IMAGE_TYPES[file.contentType];
      if (!ext) throw new BizServiceError('Logo phải là ảnh JPG, PNG hoặc WebP.', 'logo');
      if (!file.bytes.length) throw new BizServiceError('Chọn ảnh logo.', 'logo');
      if (file.bytes.length > AD_IMAGE_MAX_BYTES) throw new BizServiceError('Logo tối đa 1 MB.', 'logo');
      const logoUrl = await db.files.uploadLogo(businessId, { bytes: file.bytes, contentType: file.contentType, ext });
      await db.update('businesses', businessId, { logoUrl });
      return { logoUrl };
    },

    async updateProfile(patch: BizProfilePatch): Promise<{ business: Business; message: string; rereview: number }> {
      await requireOwner();
      const clean: BizProfilePatch = {};
      for (const k of BIZ_PROFILE_FIELDS) {
        if (patch[k] !== undefined) (clean as Record<string, unknown>)[k] = patch[k];
      }
      const errors: Record<string, string> = {};
      if (clean.name !== undefined) {
        clean.name = clean.name.trim();
        if (!clean.name) errors.name = 'Nhập tên hiển thị.';
        else if (clean.name.length > 60) errors.name = 'Tên tối đa 60 ký tự.';
      }
      if (clean.address !== undefined) {
        clean.address = clean.address.trim();
        if (clean.address.length < 10) errors.address = 'Nhập địa chỉ đầy đủ.';
      }
      for (const k of ['invoiceEmail', 'contactEmail'] as const) {
        if (clean[k] !== undefined) {
          clean[k] = clean[k]!.trim().toLowerCase();
          if (clean[k] && !EMAIL_RE.test(clean[k]!)) errors[k] = 'Email chưa đúng.';
        }
      }
      const first = Object.entries(errors)[0];
      if (first) throw new BizServiceError(first[1], first[0]);

      const before = await business();
      // Quận đi theo địa chỉ mới (danh sách quản trị hiện quận): đổi địa chỉ mà không đọc được quận thì giữ quận cũ.
      const district = clean.address !== undefined ? districtOf(clean.address) : '';
      const business_ = await db.update('businesses', businessId, {
        ...clean,
        ...(district && district !== before.district ? { district } : {}),
      });
      const moved =
        (clean.address !== undefined && clean.address !== before.address) ||
        (clean.lat !== undefined && clean.lat !== before.lat) ||
        (clean.lng !== undefined && clean.lng !== before.lng);
      let rereview = 0;
      if (moved) {
        const running = (await campaigns()).filter((c) => c.status === 'active');
        rereview = running.length;
        // Supabase: trigger businesses_address_guard chuyển chiến dịch + ghi sự kiện (migration 20261127001000).
        if (db.mode === 'demo') {
          const at = db.now().toISOString();
          for (const c of running) {
            await db.update('campaigns', c.id, { status: 'pending', submittedAt: at });
            await addEvent(c.id, BIZ_EV_ADDRESS_REREVIEW);
          }
        }
      }
      return {
        business: business_,
        rereview,
        message: rereview
          ? `Đã lưu hồ sơ cửa hàng. Địa chỉ thay đổi nên ${rereview} chiến dịch đang chạy chờ Frego duyệt lại.`
          : 'Đã lưu hồ sơ cửa hàng.',
      };
    },

    /** Xóa thành viên (chủ cửa hàng). Không xóa chính mình và không để cửa hàng không còn chủ. */
    async removeMember(memberId: string): Promise<{ message: string }> {
      await requireOwner();
      const members = await db.list('business_members', { where: { businessId } });
      const m = members.find((x) => x.id === memberId);
      if (!m) throw new BizServiceError('Không tìm thấy thành viên.');
      if (m.userId && m.userId === db.currentUserId()) throw new BizServiceError('Không tự xóa chính mình được.');
      if (m.role === 'owner' && members.filter((x) => x.role === 'owner').length <= 1) {
        throw new BizServiceError('Cửa hàng cần ít nhất một chủ cửa hàng.');
      }
      await db.remove('business_members', m.id);
      return { message: `Đã xóa ${m.email} khỏi cửa hàng.` };
    },

    /** Mời thành viên theo email (tài khoản tự gắn khi người đó đăng ký bằng email này). */
    async inviteMember(email: string, role: BusinessMember['role']): Promise<{ member: BusinessMember; message: string }> {
      await requireOwner();
      const e = email.trim().toLowerCase();
      if (!EMAIL_RE.test(e)) throw new BizServiceError('Email chưa đúng, VD ketoan@cuahang.vn.', 'email');
      if (role !== 'owner' && role !== 'accountant') throw new BizServiceError('Chọn vai trò.', 'role');
      const members = await db.list('business_members', { where: { businessId } });
      if (members.some((m) => m.email.toLowerCase() === e)) throw new BizServiceError('Email này đã là thành viên.', 'email');
      const member = await db.insert('business_members', {
        businessId,
        userId: null,
        email: e,
        role,
        invitedAt: db.now().toISOString(),
      });
      return { member, message: `Đã mời ${e} với vai trò ${MEMBER_ROLE[role].label.toLowerCase()}.` };
    },
  };
}

export type BusinessService = ReturnType<typeof createBusinessService>;
