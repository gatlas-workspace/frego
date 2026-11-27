/**
 * Kiểu dữ liệu nghiệp vụ (camelCase). Bảng Postgres dùng snake_case cùng tên cột;
 * adapter Supabase đổi tên tự động (xem src/supabase/case.ts).
 */
import type { IconName } from './icons';

export type ProviderId = 'grab' | 'be' | 'gsm';
export type VehicleClass = 'bike' | 'car4' | 'car7';
/** Nhóm gắn mã: mỗi hãng + loại xe được tối đa 1 mã mỗi chuyến. */
export type ServiceKey = `${ProviderId}-${VehicleClass}`;
export type CategoryKey = 'cafe' | 'book' | 'gym' | 'cake' | 'bowl' | 'tea';
export type RegionId = 'hcm' | 'hn';
export type ISODate = string;

/* ───────────────────────── Danh mục ───────────────────────── */

export interface Provider {
  id: ProviderId;
  name: string;
  /** Chữ viết tắt trên ô logo: Gr, Be, GS */
  mono: string;
  /** Deep link mở app (không đặt xe thay người dùng). */
  appUrl: string;
  storeUrl: string;
  /** Grab nhận điểm đến qua deep link; Be thì phải dán địa chỉ. */
  prefillsDestination: boolean;
  /** Ưu đãi tự áp (VD: Green SM giảm 25%), hiện dạng thông tin, không có mã. */
  autoPromo?: { percent: number; until: ISODate; note: string; source: string } | null;
}

export interface Service {
  key: ServiceKey;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  /** "Xe máy", "Ô tô 4 chỗ", "Xe máy điện" */
  name: string;
  /** Tên sản phẩm của hãng: GrabBike, GrabCar… dùng trong điều kiện mã */
  productName: string;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  isAirport?: boolean;
}

export type SavedPlaceKind = 'home' | 'work' | 'school' | 'gym' | 'relative' | 'other';

export interface SavedPlace {
  id: string;
  userId: string;
  kind: SavedPlaceKind;
  label: string;
  placeId: string;
  createdAt: ISODate;
}

export interface RecentSearch {
  id: string;
  userId: string;
  placeId: string;
  searchedAt: ISODate;
}

/** Bảng giá ước tính (QT 10). Giá = mở cửa + mỗi km sau openKm + mỗi phút. */
export interface FareTable {
  id: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  region: RegionId;
  openFare: number;
  openKm: number;
  perKm: number;
  perMin: number;
  /** Hệ số nới đầu trên của khoảng giá giờ cao điểm. */
  peakFactor: number;
  minFare: number;
  /** Bật ước tính khi đủ báo giá (brand.minReportsToEnableEstimate). */
  enabled: boolean;
  reportCount: number;
  /** Tỷ lệ giá thật nằm trong khoảng ước tính, 30 ngày qua (0–1). */
  accuracy: number | null;
  /** Lệch giữa so với giá thật, VD +0.02 */
  medianBias: number | null;
  updatedAt: ISODate;
}

/* ───────────────────────── Người dùng ───────────────────────── */

export type UserRole = 'user' | 'admin';
export type AdminRole = 'ops' | 'accounting' | 'support';

export interface Profile {
  id: string;
  phone: string;
  displayName: string;
  avatarUrl: string | null;
  birthday: ISODate | null;
  interests: string[];
  vehiclePrefs: VehicleClass[];
  points: number;
  savedAmount: number;
  savedCount: number;
  role: UserRole;
  adminRole: AdminRole | null;
  status: 'active' | 'locked';
  lockReason: string | null;
  createdAt: ISODate;
  onboardedAt: ISODate | null;
}

export interface Consents {
  userId: string;
  /** Vị trí khi đang dùng app */
  location: boolean;
  /** Góp dữ liệu tìm kiếm ẩn danh */
  shareData: boolean;
  /** Voucher tặng riêng (mặc định tắt) */
  personalized: boolean;
  updatedAt: ISODate;
}

export interface NotificationPrefs {
  userId: string;
  gift: boolean;
  card: boolean;
  expire: boolean;
  report: boolean;
  points: boolean;
  promo: boolean;
  quiet: boolean;
}

export type PartnerKind = 'bank' | 'wallet' | 'app' | 'email';

/** Ngân hàng, ví, app đặt xe, email mà người dùng liên kết được (QT 11). */
export interface Partner {
  id: string;
  kind: PartnerKind;
  name: string;
  mono: string;
  /** Mô tả khi chưa liên kết */
  description: string;
  /** Mô tả khi đã liên kết (nếu khác) */
  linkedDescription?: string;
  /** Có thỏa thuận tích hợp thật hay chỉ ghi nhận */
  integration: 'live' | 'record_only' | 'planned';
  sortOrder: number;
}

export interface LinkedAccount {
  id: string;
  userId: string;
  partnerId: string;
  cardType: 'credit' | 'debit' | null;
  linkedAt: ISODate;
}

/* ───────────────────────── Doanh nghiệp, chiến dịch ───────────────────────── */

export type BusinessStatus = 'pending' | 'active' | 'locked' | 'rejected' | 'draft';

export interface Business {
  id: string;
  name: string;
  legalName: string;
  taxCode: string;
  representative: string;
  category: CategoryKey;
  /** "Ăn uống · Cà phê" */
  industry: string;
  address: string;
  district: string;
  /** Địa danh gần quán để hiện "Gần Chợ Bến Thành" */
  landmark: string;
  lat: number;
  lng: number;
  openHours: { weekdays: string; saturday: string; sunday: string };
  status: BusinessStatus;
  walletBalance: number;
  autoTopup: { enabled: boolean; amount: number; threshold: number };
  invoiceName: string;
  invoiceEmail: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string | null;
  storefrontVerified: boolean;
  /** Nội dung chuyển khoản để khớp tiền nạp: "FREGO CPM1024" */
  transferCode: string;
  notifyPrefs: { review: boolean; lowBalance: boolean; weekly: boolean };
  joinedAt: ISODate;
}

/** Thông tin quán ai cũng xem được (view businesses_public): không có ví, mã số thuế, liên hệ. */
export type BusinessPublic = Pick<
  Business,
  'id' | 'name' | 'category' | 'industry' | 'landmark' | 'address' | 'district' | 'lat' | 'lng' | 'openHours' | 'status' | 'logoUrl'
>;

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string | null;
  email: string;
  role: 'owner' | 'accountant';
  invitedAt: ISODate;
}

export type CampaignStatus = 'draft' | 'pending' | 'active' | 'paused' | 'ended' | 'rejected';

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  status: CampaignStatus;
  rejectReason: string | null;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  /** Mức giảm mỗi chuyến (đ) */
  amount: number;
  radiusM: number;
  /** "13:00"–"19:00" */
  hoursFrom: string;
  hoursTo: string;
  onlyOpenHours: boolean;
  dailyCap: number;
  budget: number;
  spent: number;
  issuedCount: number;
  usedCount: number;
  startsAt: ISODate;
  endsAt: ISODate;
  imageUrl: string | null;
  submittedAt: ISODate | null;
  approvedAt: ISODate | null;
  createdAt: ISODate;
}

/** Chiến dịch ai cũng xem được (view campaigns_public): không có ngân sách, số đã chi. */
export type CampaignPublic = Pick<
  Campaign,
  'id' | 'businessId' | 'name' | 'status' | 'providerId' | 'vehicleClass' | 'amount' | 'radiusM' | 'hoursFrom' | 'hoursTo' | 'startsAt' | 'endsAt' | 'imageUrl'
> & {
  /** Đang phát mã: đang chạy, còn ngân sách, trong thời gian chạy */
  offering: boolean;
};

export interface CampaignEvent {
  id: string;
  campaignId: string;
  at: ISODate;
  text: string;
}

/* ───────────────────────── Mã, voucher ───────────────────────── */

export type CodeSource = 'sponsor' | 'frego' | 'public';

/** Mã riêng trong ví của người dùng: voucher nhãn hàng tặng riêng hoặc mã Frego (FREGO10, đổi điểm). */
export interface UserVoucher {
  id: string;
  userId: string;
  source: 'sponsor' | 'frego';
  campaignId: string | null;
  fregoCodeId: string | null;
  code: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  /** "Tặng vì bạn hay đến khu Chợ Bến Thành" / "Quà chào mừng khi bạn tham gia Frego" */
  note: string;
  /** Mục "Vì sao bạn được tặng" */
  reasons: string[];
  status: 'active' | 'used' | 'expired';
  issuedAt: ISODate;
  expiresAt: ISODate;
  usedAt: ISODate | null;
  tripId: string | null;
}

export type PublicCodeStatus = 'live' | 'checking' | 'hidden' | 'expired';

/** Mã công khai Frego tổng hợp từ trang của hãng, ngân hàng, ví (Kho mã). */
export interface PublicCode {
  id: string;
  code: string;
  providerId: ProviderId;
  vehicleClasses: VehicleClass[];
  /** "Giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ" */
  title: string;
  amount: number | null;
  percent: number | null;
  maxAmount: number | null;
  minFare: number | null;
  /** id đối tác (ngân hàng/ví) bắt buộc, VD "vpb" */
  requiresPartnerId: string | null;
  airportOnly: boolean;
  /** Dòng phụ trên thẻ mã: "1 lần mỗi tháng", "Mọi cách thanh toán" */
  notes: string[];
  /** Điều kiện chép từ bài gốc */
  conditions: string[];
  sourceName: string;
  sourceUrl: string;
  sourceTitle: string;
  lastCheckedAt: ISODate;
  expiresAt: ISODate | null;
  status: PublicCodeStatus;
  okReports24h: number;
  badReports24h: number;
  usedCount: number;
  createdAt: ISODate;
}

/** Mã do Frego tự tài trợ (FREGO10, quà đổi điểm). */
export interface FregoCode {
  id: string;
  code: string;
  kind: 'welcome' | 'reward' | 'promo';
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  title: string;
  /** Số ngày hiệu lực sau khi phát */
  validDays: number;
  issuedCount: number;
  usedCount: number;
  active: boolean;
}

export interface Reward {
  id: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  cost: number;
  fregoCodeId: string;
  redeemedCount: number;
  active: boolean;
}

export interface CodeVote {
  id: string;
  userId: string;
  publicCodeId: string;
  works: boolean;
  createdAt: ISODate;
}

/* ───────────────────────── Chuyến, báo giá, điểm ───────────────────────── */

export interface AttachedCode {
  service: ServiceKey;
  source: CodeSource;
  /** id của UserVoucher hoặc PublicCode */
  refId: string;
  code: string;
  /** Tên hiện cho người dùng: "Cà phê Mây", "FREGO10" */
  label: string;
  amount: number;
}

export type TripStatus = 'compared' | 'opened' | 'code_used' | 'reported';
export type PriceVerdict = 'cheaper' | 'within' | 'pricier';

/** Một lần so giá (Lịch sử so giá). */
export interface Trip {
  id: string;
  userId: string;
  originLabel: string;
  originPlaceId: string | null;
  destPlaceId: string;
  destLabel: string;
  distanceKm: number;
  durationMin: number;
  attached: AttachedCode[];
  chosenService: ServiceKey | null;
  /** Ước tính SAU mã cho hãng đã chọn */
  estimateLow: number | null;
  estimateHigh: number | null;
  /** Số hãng đã có giá khi so */
  comparedCount: number;
  status: TripStatus;
  verdict: PriceVerdict | null;
  paidAmount: number | null;
  reportSource: 'tap' | 'amount' | 'receipt' | null;
  pointsAwarded: number;
  createdAt: ISODate;
  openedAt: ISODate | null;
  codeUsedAt: ISODate | null;
  reportedAt: ISODate | null;
}

export interface PointsEntry {
  id: string;
  userId: string;
  delta: number;
  reason: string;
  tripId: string | null;
  createdAt: ISODate;
}

/* ───────────────────────── Thông báo ───────────────────────── */

export type NotificationCategory = 'voucher' | 'trip';
export type NotificationKind = 'code_used' | 'gift' | 'card_match' | 'points' | 'promo' | 'expire';

export interface AppNotification {
  id: string;
  userId: string;
  category: NotificationCategory;
  kind: NotificationKind;
  icon: IconName;
  tone: 'tint' | 'deal';
  /** Logo nhỏ: id hãng, ngành quán hoặc "frego" */
  logo: ProviderId | CategoryKey | 'frego';
  title: string;
  body: string;
  cta: string;
  /** Đường dẫn trong app (expo-router), VD "/bao-gia/t1" */
  link: string;
  createdAt: ISODate;
  readAt: ISODate | null;
}

/* ───────────────────────── Tiền, đối soát, hỗ trợ (web) ───────────────────────── */

export interface WalletTransaction {
  id: string;
  businessId: string;
  kind: 'topup' | 'deduction' | 'refund';
  amount: number;
  /** "Nạp chuyển khoản", "Trừ 17 mã ngày 21/11" */
  note: string;
  status: 'pending' | 'done' | 'failed';
  reference: string | null;
  createdAt: ISODate;
}

export interface Invoice {
  id: string;
  businessId: string;
  /** "2026-11" */
  month: string;
  amount: number;
  status: 'draft' | 'issued';
  issuedAt: ISODate | null;
}

/** Mỗi lần một mã được dùng (căn cứ trừ ví và đối soát hãng). */
export interface Redemption {
  id: string;
  source: CodeSource;
  userVoucherId: string | null;
  publicCodeId: string | null;
  campaignId: string | null;
  businessId: string | null;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  fee: number;
  tripId: string | null;
  usedAt: ISODate;
  providerConfirmed: boolean;
  deductedAt: ISODate | null;
}

export interface SupportTicket {
  id: string;
  requesterName: string;
  requesterKind: 'user' | 'business';
  topic: 'data_delete' | 'points' | 'code' | 'billing' | 'other';
  subject: string;
  status: 'open' | 'pending' | 'done';
  dueAt: ISODate | null;
  createdAt: ISODate;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: AdminRole | 'system';
  action: string;
  createdAt: ISODate;
}

export interface Broadcast {
  id: string;
  title: string;
  body: string;
  audience: string;
  scheduledAt: ISODate;
  status: 'draft' | 'scheduled' | 'sent';
  recipients: number;
  createdAt: ISODate;
}
