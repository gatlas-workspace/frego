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
  /**
   * Mã giới thiệu riêng (6–7 ký tự in hoa, duy nhất), sinh khi tạo hồ sơ. Supabase: cột not null (trigger sinh mã).
   * Tùy chọn ở kiểu để dữ liệu DEMO cũ / hồ sơ tạo tay vẫn hợp lệ (DEMO tự sinh khi thiếu).
   */
  referralCode?: string;
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
  /** Ai tạm dừng: doanh nghiệp tự dừng (được chạy lại) hay Frego dừng (chỉ Frego cho chạy lại) */
  pausedBy: 'business' | 'frego' | null;
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
  /** Số lượt hiện popup quảng cáo của quán sau khi người dùng chọn hãng có mã của chiến dịch này (RPC record_ad_view) */
  adViewCount: number;
}

export type AdBannerStatus = 'pending' | 'approved' | 'rejected' | 'replaced';

/**
 * Banner quảng cáo của quán (popup sau màn So giá). Doanh nghiệp gửi, Frego duyệt (chốt 27/11/2026).
 * Mỗi quán hiện banner đã duyệt mới nhất; gửi bản mới thì bản cũ chạy tới khi bản mới được duyệt (rồi thành `replaced`).
 */
export interface AdBanner {
  id: string;
  businessId: string;
  /** Ảnh: chờ duyệt là "ref" vùng riêng (Storage ad-uploads / data URL ở DEMO); đã duyệt là URL công khai */
  imageUrl: string;
  /** ≤ 40 ký tự */
  title: string;
  /** ≤ 120 ký tự */
  body: string;
  status: AdBannerStatus;
  rejectReason: string | null;
  submittedAt: ISODate;
  reviewedAt: ISODate | null;
  /** Tên người duyệt (quản trị) */
  reviewedBy: string | null;
}

/** View ad_banners_public: banner đã duyệt mới nhất mỗi quán (app đọc). */
export type AdBannerPublic = Pick<AdBanner, 'id' | 'businessId' | 'imageUrl' | 'title' | 'body' | 'reviewedAt'>;

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

/** Mã riêng trong ví của người dùng: voucher nhãn hàng tặng riêng hoặc mã Frego (FREGO20, đổi điểm). */
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

/** Mã do Frego tự tài trợ (FREGO20, quà đổi điểm). */
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
  /** Số mã tối đa được phát (null = không giới hạn) */
  quota: number | null;
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
  /** Tên hiện cho người dùng: "Cà phê Mây", "FREGO20" */
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
  /** Đã hiện popup quảng cáo nhà tài trợ cho chuyến này (mỗi chuyến tính 1 lượt xem) */
  adViewedAt: ISODate | null;
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
  /** Nội dung chuyển khoản riêng của lần nạp ("FREGO CPM1024-2"), mỗi lần nạp một mã khác nhau để khớp đúng dòng. */
  reference: string | null;
  /** Mã đơn PayOS (nạp qua cổng thanh toán; null khi chuyển khoản tay). Webhook PayOS khớp theo mã này. */
  orderCode?: number | null;
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
  /** Người gửi là người dùng app (để họ đọc được trả lời). Doanh nghiệp / dữ liệu cũ: null. */
  requesterId?: string | null;
}

/** Tin nhắn trong yêu cầu hỗ trợ: lời người gửi và trả lời của Frego (bảng ticket_messages). */
export interface TicketMessage {
  id: string;
  ticketId: string;
  authorKind: 'requester' | 'admin';
  /** "Minh Anh", "Hỗ trợ Frego" */
  authorName: string;
  body: string;
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

/* ───────────────────────── Giới thiệu bạn bè, ảnh bìa, ảnh tại quán (UI v3) ───────────────────────── */

export type ReferralStatus = 'pending' | 'rewarded' | 'held' | 'expired' | 'rejected';

/** Một lượt giới thiệu: người mới (referee) nhập mã của người giới thiệu (referrer). Mỗi người mới một lượt. */
export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  status: ReferralStatus;
  /** Lúc nhập mã */
  createdAt: ISODate;
  /** Lúc người mới báo giá được cộng điểm lần đầu (đạt điều kiện) */
  qualifiedAt: ISODate | null;
  rewardedAt: ISODate | null;
  /** Lý do giữ / từ chối / hết hạn */
  note: string | null;
}

/** Ảnh bìa Trang chủ app (QT 13). Mỗi lúc hiện một ảnh "scheduled" có khung giờ chứa hiện tại. */
export interface AppBanner {
  id: string;
  /** Tên ảnh, chỉ hiện trong quản trị */
  title: string;
  /** URL công khai (bucket app-banners; DEMO: data URL) */
  imageUrl: string;
  /** Đường dẫn trong bucket app-banners (để gỡ tệp); DEMO: "demo/<tên tệp>" */
  storagePath: string | null;
  startsAt: ISODate;
  endsAt: ISODate;
  /** Lớp phủ tối #14152B: 0 | 0.2 | 0.4 | 0.6 */
  overlay: number;
  status: 'draft' | 'scheduled';
  /** Quản trị viên tạo / sửa lần cuối (profiles.id) */
  createdBy: string | null;
  updatedAt: ISODate;
}

export type ShopPhotoStatus = 'pending' | 'approved' | 'rejected';

/** Ảnh chụp tại quán tài trợ sau chuyến dùng mã của quán (+50 điểm khi Frego duyệt). Quán không thấy ảnh, người chụp. */
export interface ShopPhoto {
  id: string;
  userId: string;
  tripId: string;
  businessId: string;
  /** Đường dẫn trong bucket riêng checkin-photos: "<userId>/<tệp>" */
  storagePath: string;
  /** SHA-256 (hex) của tệp ảnh: không nhận lại ảnh cũ */
  sha256: string;
  takenAt: ISODate;
  lat: number;
  lng: number;
  /** Khoảng cách từ chỗ chụp tới quán (m) */
  distanceM: number;
  status: ShopPhotoStatus;
  rejectReason: string | null;
  /** Tên người duyệt */
  reviewedBy: string | null;
  reviewedAt: ISODate | null;
  createdAt: ISODate;
}
