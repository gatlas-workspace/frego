/**
 * Dịch vụ cho app người dùng (apps/mobile). Chạy trên Db bất kỳ (DEMO hoặc Supabase).
 * Mọi chuỗi hiển thị (giá, HSD, nhãn) được tính ở đây để app và web hiện giống nhau.
 */
import { brand } from '../brand';
import {
  CATEGORY_LABEL,
  POINTS_RULES,
  PROVIDERS,
  SERVICES,
  VEHICLE_ORDER,
  VEHICLE_TABS,
  parseServiceKey,
  serviceFullLabel,
  serviceLongLabel,
  serviceShortLabel,
} from '../catalog';
import type { Db, ReferralCheckResult } from '../db/types';
import { sha256Hex, utf8Bytes } from '../sha256';
import {
  formatDate,
  formatDayGroup,
  formatDayMonth,
  formatDiscount,
  formatDiscountShort,
  formatKm,
  formatMeters,
  formatNumber,
  formatRelative,
  formatTime,
  formatVnd,
  formatVndRange,
  initials,
  maskPhone,
  vnParts,
} from '../format';
import { distanceM, estimateRoute, roundMeters, type LatLng } from '../geo';
import { isPeak } from '../pricing';
import { routeVehicleOf, type RoadRoute, type Router, type RouteVehicle } from '../routing';
import { geoPlaceId, parseGeoPlaceId, parseGoongPlaceRef, type Geocoder, type GeoHit } from '../geocoding';
import { parseReceipt, type ReceiptEmail } from '../receipts';
import type {
  AppNotification,
  AttachedCode,
  BusinessPublic,
  CampaignPublic,
  CategoryKey,
  Consents,
  NotificationPrefs,
  Partner,
  Place,
  PriceVerdict,
  Profile,
  ProviderId,
  PublicCode,
  ReferralStatus,
  SavedPlaceKind,
  ServiceKey,
  ShopPhoto,
  ShopPhotoStatus,
  Trip,
  UserVoucher,
  VehicleClass,
} from '../types';
import {
  attachCtaText,
  autoSelect,
  comparePrices,
  evaluateOffers,
  selectedOffers,
  sortEligible,
  type CodeOffer,
  type EligibleOffer,
  type OfferEvaluation,
  type OfferPriority,
  type PriceRow,
  type Selection,
  type TripContext,
} from '../vouchers';

/* ───────────────────────── Kiểu dữ liệu màn hình ───────────────────────── */

/** Ưu đãi tại quán đã lưu (Ví › Tại quán): nội dung banner quán tài trợ người dùng đã xem trong ngày. */
export interface ShopOfferView {
  tripId: string;
  businessId: string;
  name: string;
  address: string;
  category: CategoryKey;
  logoUrl: string | null;
  title: string;
  body: string;
  imageUrl: string;
  /** "Xem lúc 17:47 hôm nay · dùng trong ngày" */
  whenText: string;
  lat: number;
  lng: number;
}

/** Điểm đón đã chọn: vị trí thật (GPS / trình duyệt) hoặc người dùng sửa tay. */
export interface PickupPoint extends LatLng {
  /** Tên ngắn để hiện ("720A Điện Biên Phủ", "Chợ Bến Thành") */
  name: string;
  address: string;
  /** Id địa điểm có sẵn (places) nếu chọn từ danh sách; null khi là tọa độ tự do */
  placeId: string | null;
  source: 'gps' | 'manual';
}

export interface PlaceView {
  id: string;
  name: string;
  address: string;
  /** "5,8 km" từ điểm đón */
  distanceText: string;
  /** "3 voucher" hoặc "" */
  voucherChip: string;
  voucherCount: number;
  /** Kết quả chỉ là con đường (không có số nhà): chọn thì mở bản đồ tại đây để ghim đúng nhà */
  pickOnMap: LatLng | null;
}

export interface SavedPlaceView {
  id: string;
  kind: SavedPlaceKind;
  label: string;
  placeId: string;
  icon: 'home' | 'brief' | 'pin';
}

/** URL ảnh an toàn để hiện: http(s) hoặc ảnh nhúng PNG/JPEG/WebP (logo ở DEMO). Còn lại → null. */
export function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) || /^data:image\/(png|jpeg|webp);base64,/i.test(url) ? url : null;
}

export interface DealView {
  campaignId: string;
  businessId: string;
  category: CategoryKey;
  /** "Gần Chợ Bến Thành" */
  area: string;
  brand: string;
  /** "Mã Grab ô tô" */
  serviceText: string;
  amountText: string;
  cta: string;
  /** Điểm đến khi bấm (địa điểm gần quán nhất) */
  destPlaceId: string;
  /** Hạn chiến dịch theo ngày giờ VN: "Còn 3 ngày", "Còn 1 ngày", "Hết hạn hôm nay" */
  endsInText: string;
}

/**
 * Vòng tham chiếu quanh điểm đến trên bản đồ chuyến (1 km), để người dùng ước lượng khoảng cách xung quanh.
 * Chỉ để nhìn: không dùng để lọc quán (chốt 27/11/2026).
 */
export const DEST_RING_M = 1000;

/**
 * Ghim quán tài trợ trên bản đồ chuyến: chỉ quán có voucher dùng được cho chuyến này (điểm đến trong vùng tặng mã của quán).
 * Chỉ thông tin công khai của quán, không có người nhận mã.
 */
export interface SponsorPinView {
  businessId: string;
  /** Chiến dịch giảm nhiều nhất của quán (ưu tiên gắn khi chọn quán làm điểm đến) */
  campaignId: string;
  name: string;
  category: CategoryKey;
  /** Logo quán (chỉ URL http/https); null → ghim dùng icon ngành */
  logoUrl: string | null;
  address: string;
  lat: number;
  lng: number;
  /** Bán kính vùng tặng mã quanh quán (m) */
  radiusM: number;
  /** "Cách điểm đến 150 m" */
  distanceText: string;
  /** "−20.000đ" */
  amountText: string;
  /** "Grab ô tô" (thêm "· 2 ưu đãi" nếu quán có nhiều chiến dịch) */
  serviceText: string;
  /** "Tặng mã 07:00–22:00" */
  hoursText: string;
  /** "Điểm đến nằm trong vùng tặng mã 500 m" / "Voucher tặng riêng cho bạn, điểm đến trong vùng 500 m quanh quán" */
  statusText: string;
  /** Nhãn đọc màn hình cho ghim */
  a11yLabel: string;
}

export interface BannerView {
  chip: string;
  title: string;
  sub: string;
  ticketAmount: string;
  ticketService: string;
  /** Đường dẫn khi bấm */
  link: string;
}

export interface HomeView {
  banner: BannerView | null;
  originLabel: string;
  savedPlaces: SavedPlaceView[];
  recent: PlaceView[];
  deals: DealView[];
  unreadCount: number;
  /** Tên hiện ở lời chào (tên hồ sơ); '' với khách hoặc chưa đặt tên */
  greetingName: string;
  /** Chip ví ở đầu Trang chủ: "3 mã · 1.250 điểm"; khách: "Mã công khai" */
  walletChip: string;
}

/** Đường vẽ trên bản đồ: theo đường phố (`road`) hoặc nối thẳng khi không tìm được đường (`estimate`). */
export interface TripRouteLine {
  coords: LatLng[];
  source: 'road' | 'estimate';
}

export interface UserServiceOptions {
  /** Bộ tìm đường theo đường phố. Không có → km/phút ước tính theo đường chim bay (như trước). */
  router?: Router | null;
  /** Bộ tìm địa chỉ (Goong / Photon). Không có → chỉ tìm trong địa điểm có sẵn, không chọn được địa chỉ tự do. */
  geocoder?: Geocoder | null;
}

export interface TripPlan {
  origin: { label: string; placeId: string | null } & LatLng;
  dest: Place;
  /** Theo đường xe máy thật nếu tìm được (chốt 27/11/2026), không thì ước tính */
  km: number;
  minutes: number;
  /** Đường xe máy (loại xe mặc định) */
  route: TripRouteLine;
  at: string;
  peak: boolean;
  /** "Landmark 81 → Chợ Bến Thành" */
  title: string;
  /** "5,8 km · khoảng 20 phút" */
  subtitle: string;
  evaluation: OfferEvaluation;
  /** Lựa chọn tự gắn (mã giảm nhiều nhất mỗi nhóm) */
  selection: Selection;
  /** id chiến dịch được bấm từ trang chủ (ưu tiên gắn) */
  preferredCampaignId: string | null;
}

export interface AttachItemView {
  refId: string;
  service: ServiceKey;
  logo: CategoryKey | 'frego' | ProviderId;
  tag: 'sponsor' | 'frego' | 'public';
  name: string;
  amountText: string;
  serviceText: string;
  conditionLine: string;
  metaText: string;
  attached: boolean;
}

export interface ComparisonView {
  tabs: { key: VehicleClass; label: string; icon: 'bike' | 'car' | 'suv' }[];
  vehicleClass: VehicleClass;
  rows: PriceRow[];
  insight: string | null;
  /** "Đã gắn 3 voucher" */
  attachedTitle: string;
  /** "FREGO20 · Cà phê Mây · Quán bún Ngõ Nhỏ" */
  attachedLine: string;
  /** "17:40 là giờ cao điểm, khoảng giá đã nới rộng. Giá cuối cùng do app hãng hiển thị." */
  peakNote: string | null;
}

/**
 * Popup quảng cáo nhà tài trợ (màn 2c, chốt 27/11/2026): hiện sau khi chọn hãng ở So giá nếu mã gắn ở hãng đó là của
 * quán tài trợ. Có banner đã duyệt thì hiện banner; chưa có thì popup gọn với thông tin quán.
 */
export interface SponsorAdView {
  campaignId: string;
  businessId: string;
  name: string;
  category: CategoryKey;
  logoUrl: string | null;
  /** "Ăn uống · Cà phê" */
  industry: string;
  address: string;
  /** "Cách điểm đến 150 m" */
  distanceText: string;
  /** "Mở cửa hôm nay 07:00 – 22:00" */
  hoursText: string;
  /** "Voucher −20.000đ Grab ô tô chuyến này là quà của Cà phê Mây." */
  giftText: string;
  /** Banner đã duyệt (null → popup gọn) */
  banner: { imageUrl: string; title: string; body: string } | null;
  /** Chữ nút chính trên popup: "Nhận mã giảm giá" (chốt 27/11/2026) */
  ctaLabel: string;
}

export interface OpenAppView {
  trip: Trip;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  title: string;
  serviceLine: string;
  estimateText: string;
  code: string | null;
  codeLine: string | null;
  prefillsDestination: boolean;
  /** Địa chỉ để chép/dán khi app hãng không nhận điểm đến qua link */
  destAddress: string;
  /** Link mở app hãng (Grab: mở sẵn điểm đến) */
  deepLink: string;
  storeUrl: string;
  /** Bước 1 trên màn Mở app: [phần đậm, phần thường] */
  step1: [string, string];
}

export interface WalletGiftView {
  id: string;
  source: 'sponsor' | 'frego';
  logo: CategoryKey | 'frego';
  tag: 'sponsor' | 'frego';
  title: string;
  amountText: string;
  serviceText: string;
  line: string;
  metaText: string;
  action: string;
  /** Điều hướng khi bấm */
  link: string;
}

export interface PublicCodeCardView {
  id: string;
  logo: ProviderId;
  brandLine: string;
  code: string;
  title: string;
  okText: string;
  warnText: string;
  plainText: string;
  plainText2: string;
  metaText: string;
  /** Cần thẻ/ví người dùng chưa có */
  otherCard: boolean;
}

export interface AutoPromoView {
  providerId: ProviderId;
  brandLine: string;
  title: string;
  metaText: string;
}

export interface UsedVoucherView {
  id: string;
  title: string;
  amountText: string;
  serviceText: string;
  usedText: string;
}

export interface WalletView {
  gifts: WalletGiftView[];
  publicCodes: PublicCodeCardView[];
  autoPromos: AutoPromoView[];
  used: UsedVoucherView[];
}

export interface VoucherDetailView {
  voucher: UserVoucher;
  businessName: string;
  businessAddress: string;
  /** Địa danh gần quán ("Chợ Bến Thành") để vẽ trên bản đồ vùng áp dụng */
  landmark: string | null;
  category: CategoryKey | 'frego';
  amountText: string;
  serviceText: string;
  expiresText: string;
  reasons: string[];
  radiusText: string;
  area: (LatLng & { radiusM: number }) | null;
  conditions: string[];
}

export interface PublicCodeDetailView {
  code: PublicCode;
  providerName: string;
  fits: boolean;
  fitText: string | null;
  missingText: string | null;
  conditions: string[];
  expiryNote: string;
  sourceHost: string;
  sourceTitle: string;
  checkedText: string;
  reportsText: string;
  reportsSub: string;
  myVote: boolean | null;
}

export interface RewardView {
  id: string;
  providerId: ProviderId;
  kind: 'bike' | 'car' | 'suv';
  amountText: string;
  serviceText: string;
  cost: number;
  costText: string;
  canRedeem: boolean;
  shortText: string;
}

export interface PointsView {
  points: number;
  pointsText: string;
  progressText: string;
  progress: number;
  rewards: RewardView[];
  history: { id: string; deltaText: string; reason: string; dateText: string }[];
}

export interface TripHistoryItem {
  id: string;
  group: string;
  time: string;
  status: 'pending' | 'viewed' | 'reported' | 'opened';
  chip: string;
  title: string;
  line: string;
  paidText: string | null;
  pointsText: string | null;
}

export interface MeView {
  profile: Profile;
  initials: string;
  maskedPhone: string;
  pointsText: string;
  savedText: string;
  savedSub: string;
  pendingReports: number;
  usableVouchers: number;
  linkedSummary: string;
  notifOnCount: number;
  locationOn: boolean;
}

/** Trạng thái "Tự lấy giá từ biên nhận email" (Gmail). */
export interface GmailStatusView {
  linked: boolean;
  /** Liên kết giả lập của chế độ DEMO (không có Google thật) */
  demo: boolean;
  email: string | null;
  /** "Đồng bộ lần cuối 17:58, 22/11" hoặc null */
  lastSyncText: string | null;
  /** Số chuyến đã tự ghi giá từ biên nhận */
  matchedCount: number;
  /** Lỗi lần đồng bộ trước (VD Google thu hồi quyền → cần liên kết lại) */
  error: string | null;
}

/** Kết quả một lần đọc biên nhận (máy chủ trả cùng dạng). */
export interface GmailSyncResult {
  /** Số thư biên nhận đã xét */
  checked: number;
  /** Số chuyến được ghi giá */
  matched: number;
  pointsAwarded: number;
  /** Lý do giữ điểm gần nhất (nếu có) */
  held: string | null;
}

export interface LinkRowView {
  partnerId: string;
  kind: Partner['kind'];
  name: string;
  mono: string;
  desc: string;
  linked: boolean;
  isRideApp: boolean;
}

/** Màn Giới thiệu bạn bè (UI v3). */
export interface ReferralFriendView {
  id: string;
  /** Tên đã che: "Lan N." */
  name: string;
  /** Chữ cái đầu cho ô avatar: "L" */
  initial: string;
  status: ReferralStatus;
  /** "Báo giá chuyến đầu 24/11", "Nhập mã 25/11 · còn 28 ngày", "Nhập mã 12/10, chưa có chuyến" */
  sub: string;
  /** Điểm mình nhận từ lượt này (đã cộng): 200 hoặc 0 */
  points: number;
}

export interface ReferralView {
  code: string;
  /** `https://frego.vn/moi/<mã>` */
  link: string;
  rewardReferrer: number;
  rewardReferee: number;
  monthlyCap: number;
  /** Số lượt được thưởng tháng này (giờ VN) */
  monthRewarded: number;
  /** Tổng điểm đã nhận từ giới thiệu (cả lượt mình được giới thiệu) */
  pointsEarned: number;
  friends: ReferralFriendView[];
  /** Còn nhập được mã của bạn bè (đăng nhập số điện thoại, chưa nhập, trong 7 ngày đầu) */
  canEnter: boolean;
  /** Số ngày còn lại để nhập mã (khi canEnter) */
  enterDaysLeft: number | null;
  /** Người đã giới thiệu mình */
  enteredBy: { name: string } | null;
}

/** Ảnh bìa Trang chủ đang hiện (null → app dùng ảnh mặc định "Sài Gòn tím"). */
export interface HomeCoverView {
  imageUrl: string;
  /** Lớp phủ tối #14152B: 0 | 0.2 | 0.4 | 0.6 */
  overlay: number;
  title: string;
}

/** Khối "Ghé quán? Chụp ảnh nhận điểm" ở màn Báo giá. */
export interface ShopPhotoStateView {
  shopName: string;
  status: 'none' | ShopPhotoStatus;
  /** Điểm thưởng khi được duyệt */
  points: number;
  rejectReason: string | null;
}

export interface ShopPhotoInput {
  /** Ảnh đã chụp: Blob (web) hoặc `{ uri }` (React Native, expo-image-picker) */
  file: Blob | { uri: string };
  /** ISO, giờ chụp (EXIF hoặc lúc chụp) */
  takenAt: string;
  lat: number;
  lng: number;
}

const DAY_MS = 86_400_000;

/** Đọc byte của Blob: arrayBuffer() nếu có, không thì FileReader; không đọc được → null. */
async function blobBytes(blob: Blob): Promise<Uint8Array | null> {
  try {
    if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  } catch {
    /* thử FileReader */
  }
  if (typeof FileReader === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result instanceof ArrayBuffer ? new Uint8Array(reader.result) : null);
      reader.onerror = () => resolve(null);
      reader.readAsArrayBuffer(blob);
    } catch {
      resolve(null);
    }
  });
}

const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' };

export interface NotificationView extends AppNotification {
  unread: boolean;
  metaText: string;
  group: 'today' | 'earlier';
}

/* ───────────────────────── Dịch vụ ───────────────────────── */

const VEHICLE_KIND: Record<VehicleClass, 'bike' | 'car' | 'suv'> = { bike: 'bike', car4: 'car', car7: 'suv' };

export function createUserService(db: Db, opts: UserServiceOptions = {}) {
  const router = opts.router ?? null;
  const geocoder = opts.geocoder ?? null;
  /** Nhớ đường đã tìm (mỗi cặp điểm + loại xe một lần): đúng giới hạn 1 lượt/giây của máy chủ công cộng. */
  const routeCache = new Map<string, Promise<RoadRoute | null>>();
  const roadRoute = (from: LatLng, to: LatLng, vehicle: RouteVehicle) => {
    if (!router) return Promise.resolve(null);
    const key = `${from.lat},${from.lng}>${to.lat},${to.lng}:${vehicle}`;
    let p = routeCache.get(key);
    if (!p) {
      p = router.route(from, to, vehicle);
      // Lỗi thì không nhớ, lần sau thử lại.
      p.then((r) => (r ? undefined : routeCache.delete(key)));
      routeCache.set(key, p);
    }
    return p;
  };
  const me = () => {
    const id = db.currentUserId();
    if (!id) throw new Error('Cần đăng nhập');
    return id;
  };
  const nowIso = () => db.now().toISOString();

  async function placesById() {
    const all = await db.list('places');
    return new Map(all.map((p) => [p.id, p]));
  }

  async function activeCampaigns(): Promise<(CampaignPublic & { business: BusinessPublic })[]> {
    const [camps, bizs] = await Promise.all([
      db.list('campaigns_public', { where: { offering: true } }),
      db.list('businesses_public', { where: { status: 'active' } }),
    ]);
    const byId = new Map(bizs.map((b) => [b.id, b]));
    return camps.filter((c) => byId.has(c.businessId)).map((c) => ({ ...c, business: byId.get(c.businessId)! }));
  }

  /**
   * Điểm đón người dùng chọn (chốt 27/11/2026): vị trí thật (GPS / định vị trình duyệt) hoặc sửa tay (tìm, ghim bản đồ).
   * Chỉ giữ trong phiên (app tự lưu lại ở máy). null: điểm mặc định Landmark 81 (dữ liệu mẫu, khớp thiết kế).
   */
  let pickup: PickupPoint | null = null;

  /** Điểm đón hiện tại. `label` "Vị trí hiện tại" = đúng chỗ người dùng đang đứng (bản đồ vẽ chấm xanh). */
  async function currentOrigin(): Promise<{ label: string; placeId: string | null } & LatLng> {
    if (pickup) {
      return { label: pickup.source === 'gps' ? 'Vị trí hiện tại' : pickup.name, placeId: pickup.placeId, lat: pickup.lat, lng: pickup.lng };
    }
    const lm = await db.get('places', 'landmark81');
    return { label: 'Vị trí hiện tại', placeId: 'landmark81', lat: lm?.lat ?? 10.7949, lng: lm?.lng ?? 106.7219 };
  }

  /** Dòng "Điểm đón" ở Trang chủ / Chọn điểm đến. */
  function pickupLabel(): string {
    if (!pickup) return 'Landmark 81 · điểm mặc định';
    return pickup.source === 'gps' ? `Vị trí hiện tại · ${pickup.name}` : pickup.name;
  }

  function countVouchersFor(place: Place, camps: (CampaignPublic & { business: BusinessPublic })[]) {
    return camps.filter((c) => distanceM(place, c.business) <= c.radiusM).length;
  }

  async function toPlaceViews(list: Place[], origin: LatLng & { placeId: string | null }) {
    const camps = await activeCampaigns();
    return list.map((p) => {
      const n = countVouchersFor(p, camps);
      const route = estimateRoute({ ...origin, id: origin.placeId ?? undefined }, p);
      return {
        id: p.id,
        name: p.name,
        address: p.address,
        distanceText: formatKm(route.km),
        voucherChip: n > 0 ? `${n} voucher` : '',
        voucherCount: n,
        pickOnMap: null,
      } satisfies PlaceView;
    });
  }

  /** Điểm đến từ id: địa điểm có sẵn, "biz:<quán>", "geo:…" (địa chỉ tự do) hoặc "goong:…" (hỏi Goong tọa độ). */
  async function resolveDest(destId: string): Promise<Place | null> {
    if (destId.startsWith('biz:')) {
      const b = await db.get('businesses_public', destId.slice(4));
      return b ? { id: destId, name: b.name, address: b.address, district: b.district, lat: b.lat, lng: b.lng } : null;
    }
    if (destId.startsWith('geo:')) return parseGeoPlaceId(destId);
    const g = parseGoongPlaceRef(destId);
    if (g) return geocoder ? geocoder.detail(g.placeId, { name: g.name, address: g.address }) : null;
    return db.get('places', destId);
  }

  async function myVouchers(): Promise<UserVoucher[]> {
    const uid = me();
    const list = await db.list('user_vouchers', { where: { userId: uid } });
    const t = db.now().getTime();
    return list.map((v) =>
      v.status === 'active' && new Date(v.expiresAt).getTime() < t ? { ...v, status: 'expired' as const } : v,
    );
  }

  async function linkedPartnerIds(): Promise<string[]> {
    const rows = await db.list('linked_accounts', { where: { userId: me() } });
    return rows.map((r) => r.partnerId);
  }

  async function buildOffers(): Promise<CodeOffer[]> {
    const [vouchers, camps, publicCodes, partners] = await Promise.all([
      myVouchers(),
      activeCampaigns(),
      db.list('public_codes', { where: { status: 'live' } }),
      db.list('partners'),
    ]);
    const partnerName = new Map(partners.map((p) => [p.id, p.name]));
    const campById = new Map(camps.map((c) => [c.id, c]));
    const offers: CodeOffer[] = [];
    const heldCampaigns = new Set<string>();

    for (const v of vouchers.filter((x) => x.status === 'active')) {
      if (v.source === 'sponsor' && v.campaignId) {
        const c = campById.get(v.campaignId);
        if (!c) continue;
        heldCampaigns.add(c.id);
        offers.push({
          refId: `uv:${v.id}`,
          source: 'sponsor',
          inWallet: true,
          campaignId: c.id,
          code: v.code,
          label: c.business.name,
          logo: c.business.category,
          providerId: v.providerId,
          vehicleClasses: [v.vehicleClass],
          amount: v.amount,
          percent: null,
          maxAmount: null,
          minFare: null,
          requiresPartner: null,
          airportOnly: false,
          area: { lat: c.business.lat, lng: c.business.lng, radiusM: c.radiusM },
          hours: null,
          expiresAt: v.expiresAt,
          sourceName: null,
          description: null,
        });
      } else if (v.source === 'frego') {
        const vehicle = SERVICES[`${v.providerId}-${v.vehicleClass}`];
        offers.push({
          refId: `uv:${v.id}`,
          source: 'frego',
          inWallet: true,
          campaignId: null,
          code: v.code,
          label: v.code,
          logo: 'frego',
          providerId: v.providerId,
          vehicleClasses: [v.vehicleClass],
          amount: v.amount,
          percent: null,
          maxAmount: null,
          minFare: null,
          requiresPartner: null,
          airportOnly: false,
          area: null,
          hours: null,
          expiresAt: v.expiresAt,
          sourceName: null,
          description: `Mã riêng Frego, mọi chuyến ${vehicle.name.toLowerCase()} trên app ${PROVIDERS[v.providerId].name}.`,
        });
      }
    }
    // Ưu đãi chiến dịch: đi đến vùng quanh quán là được tặng.
    for (const c of camps) {
      if (heldCampaigns.has(c.id)) continue;
      offers.push({
        refId: `cp:${c.id}`,
        source: 'sponsor',
        inWallet: false,
        campaignId: c.id,
        code: '',
        label: c.business.name,
        logo: c.business.category,
        providerId: c.providerId,
        vehicleClasses: [c.vehicleClass],
        amount: c.amount,
        percent: null,
        maxAmount: null,
        minFare: null,
        requiresPartner: null,
        airportOnly: false,
        area: { lat: c.business.lat, lng: c.business.lng, radiusM: c.radiusM },
        hours: { from: c.hoursFrom, to: c.hoursTo },
        expiresAt: c.endsAt,
        sourceName: null,
        description: null,
      });
    }
    for (const p of publicCodes) {
      offers.push({
        refId: `pc:${p.id}`,
        source: 'public',
        inWallet: false,
        campaignId: null,
        code: p.code,
        label: p.code,
        logo: p.providerId,
        providerId: p.providerId,
        vehicleClasses: p.vehicleClasses,
        amount: p.amount,
        percent: p.percent,
        maxAmount: p.maxAmount,
        minFare: p.minFare,
        requiresPartner: p.requiresPartnerId
          ? { id: p.requiresPartnerId, name: partnerName.get(p.requiresPartnerId) ?? p.requiresPartnerId }
          : null,
        airportOnly: p.airportOnly,
        area: null,
        hours: null,
        expiresAt: p.expiresAt,
        sourceName: p.sourceName,
        description: null,
      });
    }
    return offers;
  }

  async function tripContext(plan: Pick<TripPlan, 'origin' | 'dest' | 'km' | 'minutes' | 'at'>): Promise<TripContext> {
    const [fareTables, partners, originPlace] = await Promise.all([
      db.list('fare_tables', { where: { region: 'hcm' } }),
      linkedPartnerIds(),
      plan.origin.placeId ? db.get('places', plan.origin.placeId) : Promise.resolve(null),
    ]);
    return {
      origin: { lat: plan.origin.lat, lng: plan.origin.lng, isAirport: originPlace?.isAirport },
      dest: plan.dest,
      km: plan.km,
      minutes: plan.minutes,
      at: plan.at,
      linkedPartnerIds: partners,
      fareTables,
    };
  }

  const service = {
    db,

    /* ───── Đăng nhập, hồ sơ ───── */

    async getMe(): Promise<MeView> {
      const uid = me();
      const [profile, vouchers, trips, links, partners, prefs, consents] = await Promise.all([
        db.get('profiles', uid),
        myVouchers(),
        db.list('trips', { where: { userId: uid } }),
        db.list('linked_accounts', { where: { userId: uid } }),
        db.list('partners'),
        db.get('notification_prefs', uid),
        db.get('consents', uid),
      ]);
      if (!profile) throw new Error('Không tìm thấy hồ sơ');
      const pName = new Map(partners.map((p) => [p.id, p.name]));
      const linkedNames = links.map((l) => pName.get(l.partnerId) ?? l.partnerId);
      const prefKeys: (keyof Omit<NotificationPrefs, 'userId' | 'quiet'>)[] = ['gift', 'card', 'expire', 'report', 'points', 'promo'];
      const pending = trips.filter((t) => t.status === 'code_used').length;
      return {
        profile,
        initials: initials(profile.displayName || 'Bạn'),
        maskedPhone: maskPhone(profile.phone),
        pointsText: formatNumber(profile.points),
        savedText: formatVnd(profile.savedAmount),
        savedSub: `nhờ ${profile.savedCount} voucher`,
        pendingReports: pending,
        usableVouchers: vouchers.filter((v) => v.status === 'active').length,
        linkedSummary: linkedNames.length ? `${linkedNames.join(', ')} đã liên kết` : 'Chưa liên kết',
        notifOnCount: prefs ? prefKeys.filter((k) => prefs[k]).length : 0,
        locationOn: consents?.location ?? false,
      };
    },

    async updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'birthday' | 'interests' | 'vehiclePrefs' | 'avatarUrl'>>) {
      return db.update('profiles', me(), { ...patch, onboardedAt: nowIso() });
    },

    /** Xóa tài khoản và mọi dữ liệu của người dùng (RPC tin cậy). App đăng xuất sau đó. */
    async deleteMyAccount(): Promise<void> {
      await db.rpc('delete_my_account', {});
      pickup = null;
    },

    /** "Tải dữ liệu của tôi": mọi dữ liệu Frego giữ về người dùng, dạng JSON dễ đọc. */
    async exportMyData(): Promise<string> {
      const uid = me();
      const tables = [
        'consents',
        'notification_prefs',
        'saved_places',
        'recent_searches',
        'trips',
        'user_vouchers',
        'points_ledger',
        'linked_accounts',
        'notifications',
      ] as const;
      const out: Record<string, unknown> = { xuatLuc: nowIso(), hoSo: await db.get('profiles', uid) };
      for (const t of tables) {
        out[t] = await db.list(t, { where: { userId: uid } as never }).catch(() => []);
      }
      return JSON.stringify(out, null, 2);
    },

    async getConsents(): Promise<Consents> {
      const uid = me();
      return (
        (await db.get('consents', uid)) ?? { userId: uid, location: true, shareData: false, personalized: false, updatedAt: nowIso() }
      );
    },

    async updateConsents(patch: Partial<Omit<Consents, 'userId' | 'updatedAt'>>) {
      const uid = me();
      const existing = await db.get('consents', uid);
      if (!existing) return db.insert('consents', { userId: uid, location: true, shareData: false, personalized: false, ...patch, updatedAt: nowIso() });
      return db.update('consents', uid, { ...patch, updatedAt: nowIso() });
    },

    async getNotificationPrefs(): Promise<NotificationPrefs> {
      const uid = me();
      return (
        (await db.get('notification_prefs', uid)) ?? {
          userId: uid,
          gift: true,
          card: true,
          expire: true,
          report: true,
          points: true,
          promo: false,
          quiet: true,
        }
      );
    },

    async updateNotificationPrefs(patch: Partial<Omit<NotificationPrefs, 'userId'>>) {
      const uid = me();
      const existing = await db.get('notification_prefs', uid);
      if (!existing) {
        const base = await service.getNotificationPrefs();
        return db.insert('notification_prefs', { ...base, ...patch });
      }
      return db.update('notification_prefs', uid, patch);
    },

    async ensureWelcomeVoucher() {
      return db.rpc('ensure_welcome_voucher', {});
    },

    /* ───── Trang chủ, tìm kiếm ───── */

    async getHome(): Promise<HomeView> {
      const uid = me();
      const origin = await currentOrigin();
      const [saved, recent, byId, vouchers, camps, unread, profile] = await Promise.all([
        db.list('saved_places', { where: { userId: uid }, order: { column: 'createdAt' } }),
        db.list('recent_searches', { where: { userId: uid }, order: { column: 'searchedAt', ascending: false }, limit: 2 }),
        placesById(),
        myVouchers(),
        activeCampaigns(),
        service.unreadCount(),
        db.get('profiles', uid),
      ]);
      // Khách (tài khoản ẩn danh, chưa có số điện thoại) giống quy ước của record_trip.
      const guest = !profile?.phone;
      const usable = vouchers.filter((v) => v.status === 'active').length;
      const walletChip = guest ? 'Mã công khai' : `${formatNumber(usable)} mã · ${formatNumber(profile?.points ?? 0)} điểm`;
      const nowT = db.now();
      const welcome = vouchers.find((v) => v.source === 'frego' && v.status === 'active');
      const banner: BannerView | null = welcome
        ? {
            chip: welcome.note.startsWith('Quà chào mừng') ? 'Quà chào mừng' : 'Voucher của bạn',
            title: `Giảm ${formatVnd(welcome.amount)} chuyến ${serviceShortLabel(welcome.providerId, welcome.vehicleClass)}`,
            sub: 'Frego tự gắn mã khi bạn đặt xe',
            ticketAmount: formatDiscountShort(welcome.amount),
            ticketService: serviceShortLabel(welcome.providerId, welcome.vehicleClass),
            link: '/vi',
          }
        : null;
      const places = [...byId.values()];
      // Mỗi khu một thẻ (mức giảm cao nhất), giảm nhiều trước, cùng mức thì sắp hết hạn trước.
      const seenArea = new Set<string>();
      const deals: DealView[] = [...camps]
        .sort((a, b) => b.amount - a.amount || new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
        .filter((c) => {
          const area = normalize(c.business.landmark);
          if (seenArea.has(area)) return false;
          seenArea.add(area);
          return true;
        })
        .slice(0, 5)
        .map((c) => {
          const candidates = places
            .filter((p) => !['nha-minh-anh', 'cty-minh-anh'].includes(p.id))
            .map((p) => ({ p, d: distanceM(p, c.business) }))
            .filter((x) => x.d <= c.radiusM);
          // Ưu tiên địa danh của quán ("Gần Chợ Bến Thành" → Chợ Bến Thành), rồi tới nơi gần quán nhất.
          const nearest =
            candidates.find((x) => normalize(x.p.name) === normalize(c.business.landmark)) ??
            candidates.sort((a, b) => a.d - b.d)[0];
          return {
            campaignId: c.id,
            businessId: c.businessId,
            category: c.business.category,
            area: `Gần ${c.business.landmark}`,
            brand: c.business.name,
            serviceText: `Mã ${serviceShortLabel(c.providerId, c.vehicleClass)}`,
            amountText: formatDiscount(c.amount),
            cta: 'Đặt xe ›',
            destPlaceId: nearest ? nearest.p.id : `biz:${c.businessId}`,
            endsInText: endsInText(c.endsAt, nowT),
          };
        });
      const recentPlaces = recent.map((r) => byId.get(r.placeId)).filter((p): p is Place => !!p);
      return {
        banner,
        originLabel: pickupLabel(),
        savedPlaces: saved.map((s) => ({
          id: s.id,
          kind: s.kind,
          label: s.label,
          placeId: s.placeId,
          icon: s.kind === 'home' ? 'home' : s.kind === 'work' ? 'brief' : 'pin',
        })),
        recent: await toPlaceViews(recentPlaces, origin),
        deals,
        unreadCount: unread,
        greetingName: guest ? '' : (profile?.displayName ?? '').trim(),
        walletChip,
      };
    },

    async recentSearches(limit = 3): Promise<PlaceView[]> {
      const uid = me();
      const [recent, byId, origin] = await Promise.all([
        db.list('recent_searches', { where: { userId: uid }, order: { column: 'searchedAt', ascending: false }, limit }),
        placesById(),
        currentOrigin(),
      ]);
      return toPlaceViews(recent.map((r) => byId.get(r.placeId)).filter((p): p is Place => !!p), origin);
    },

    async searchPlaces(query: string): Promise<PlaceView[]> {
      const q = normalize(query);
      if (!q) return [];
      const tokens = q.split(/\s+/).filter(Boolean);
      const last = tokens[tokens.length - 1];
      const [all, origin] = await Promise.all([db.list('places'), currentOrigin()]);
      // Khớp cả cụm trước; rồi khớp từng từ (từ cuối là từ đang gõ, phải khớp đầu một từ trong tên/địa chỉ).
      const scored = all
        .filter((p) => !['nha-minh-anh', 'cty-minh-anh'].includes(p.id))
        .map((p) => {
          const name = normalize(p.name);
          const text = `${name} ${normalize(p.address)}`;
          const words = text.split(/[\s,]+/);
          const phrase = name.includes(q) ? 1 : 0;
          // Từ đã gõ xong phải khớp nguyên từ; chỉ từ cuối (đang gõ) khớp đầu từ — "nha tho duc ba" không khớp
          // "Nhất … bay" của Sân bay Tân Sơn Nhất (27/11/2026).
          const hits = tokens.filter((t, i) => words.some((w) => (i === tokens.length - 1 ? w.startsWith(t) : w === t))).length;
          const lastOk = words.some((w) => w.startsWith(last));
          return { p, phrase, ratio: hits / tokens.length, ok: phrase === 1 || (lastOk && hits / tokens.length >= 0.5) };
        })
        .filter((x) => x.ok)
        .sort((a, b) => b.phrase - a.phrase || b.ratio - a.ratio);
      const local = await toPlaceViews(scored.slice(0, 8).map((x) => x.p), origin);
      // Gõ từ 2 ký tự: hỏi thêm Goong/Photon. Lỗi mạng → chỉ còn địa điểm có sẵn.
      if (!geocoder || q.length < 2) return local;
      const hits = await geocoder.search(query.trim(), origin).catch(() => [] as GeoHit[]);
      const camps = await activeCampaigns();
      const remote = hits
        // Bỏ trùng với địa điểm có sẵn (cùng tên, cách < 150 m).
        .filter(
          (h) =>
            !scored.some((x) => {
              const a = normalize(x.p.name);
              const b = normalize(h.name);
              return (a === b || a.includes(b) || b.includes(a)) && (h.lat === undefined || distanceM(x.p, h as LatLng) < 150);
            }),
        )
        .map((h) => {
          const at = h.lat !== undefined && h.lng !== undefined ? { lat: h.lat, lng: h.lng } : null;
          const n = at ? countVouchersFor({ id: h.id, name: h.name, address: h.address, district: '', ...at }, camps) : 0;
          return {
            id: h.id,
            name: h.name,
            address: h.address,
            distanceText: at ? formatKm(estimateRoute(origin, at).km) : '',
            voucherChip: n > 0 ? `${n} voucher` : '',
            voucherCount: n,
            pickOnMap: h.street && at ? at : null,
          } satisfies PlaceView;
        });
      return [...local, ...remote].slice(0, 10);
    },

    /** Chọn trên bản đồ: tọa độ → địa chỉ để hiện và id "geo:…" để lập chuyến. Không tìm được địa chỉ vẫn đi được. */
    async describePoint(p: LatLng): Promise<{ id: string; name: string; address: string; found: boolean }> {
      const place = geocoder ? await geocoder.reverse(p).catch(() => null) : null;
      const name = place?.name || 'Điểm đã chọn trên bản đồ';
      const address = place?.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
      return { id: geoPlaceId({ lat: p.lat, lng: p.lng, name, address }), name, address, found: !!place };
    },

    /** Tọa độ điểm đón hiện tại (tâm mặc định khi chọn trên bản đồ). */
    async originPoint(): Promise<LatLng> {
      const o = await currentOrigin();
      return { lat: o.lat, lng: o.lng };
    },

    /** Đang dùng Goong hay Photon (để ghi nguồn), hoặc null nếu tắt. */
    geocodingProvider(): Geocoder['provider'] | null {
      return geocoder?.provider ?? null;
    },

    async currentOriginLabel(): Promise<string> {
      return pickupLabel();
    },

    /** Đặt điểm đón: vị trí thật (`source: 'gps'`) hoặc sửa tay (`'manual'`); null = về điểm mặc định. */
    setPickup(p: PickupPoint | null) {
      pickup = p;
      routeCache.clear();
    },

    /** Điểm đón đang dùng (null = mặc định). */
    getPickup(): PickupPoint | null {
      return pickup;
    },

    /** Điểm đón từ id địa điểm ("geo:…", id có sẵn, "goong:…") — màn Đổi điểm đón. */
    async pickupFromPlace(placeId: string): Promise<PickupPoint | null> {
      const p = await resolveDest(placeId);
      if (!p) return null;
      const known = !placeId.startsWith('geo:') && !placeId.startsWith('goong:') && !placeId.startsWith('biz:');
      return { lat: p.lat, lng: p.lng, name: p.name, address: p.address, placeId: known ? p.id : null, source: 'manual' };
    },

    async addSavedPlace(input: { kind: SavedPlaceKind; label: string; placeId: string }) {
      return db.insert('saved_places', { userId: me(), ...input, createdAt: nowIso() });
    },

    /** Gợi ý từ chuyến gần đây (màn Thêm địa điểm). */
    async savedPlaceSuggestions(): Promise<Place[]> {
      const byId = await placesById();
      return ['ben-thanh', 'landmark81', 'tan-son-nhat'].map((id) => byId.get(id)).filter((p): p is Place => !!p);
    },

    /* ───── Luồng chính: gắn voucher → so giá → mở app hãng ───── */

    /** Lập kế hoạch chuyến tới điểm đến (placeId, hoặc "biz:<id>" để đi tới quán). */
    async planTrip(destId: string, opts: { preferredCampaignId?: string | null } = {}): Promise<TripPlan> {
      const origin = await currentOrigin();
      const dest = await resolveDest(destId);
      if (!dest) throw new Error('Không tìm thấy điểm đến');
      // Đường xe máy thật (chốt 27/11/2026: km, phút và giá theo đường thật); lỗi mạng → ước tính như cũ.
      const road = await roadRoute(origin, dest, 'motorbike');
      const route = road ?? estimateRoute({ ...origin, id: origin.placeId ?? undefined }, dest);
      const line: TripRouteLine = road ? { coords: road.coords, source: 'road' } : { coords: [origin, dest], source: 'estimate' };
      const at = nowIso();
      const base = { origin, dest, km: route.km, minutes: route.minutes, route: line, at };
      const ctx = await tripContext(base);
      const evaluation = evaluateOffers(await buildOffers(), ctx);
      const selection: Selection = { ...evaluation.autoSelection };
      if (opts.preferredCampaignId) {
        const pref = evaluation.eligible.find((e) => e.offer.campaignId === opts.preferredCampaignId);
        if (pref) selection[pref.service] = pref.offer.refId;
      }
      const originName = pickup
        ? pickup.name
        : origin.placeId
          ? (await db.get('places', origin.placeId))?.name ?? origin.label
          : origin.label;
      return {
        ...base,
        peak: isPeak(at),
        title: `${originName} → ${dest.name}`,
        subtitle: `${formatKm(route.km)} · khoảng ${route.minutes} phút`,
        evaluation,
        selection,
        preferredCampaignId: opts.preferredCampaignId ?? null,
      };
    },

    /** Đường vẽ trên bản đồ theo loại xe (So giá: tab ô tô vẽ đường ô tô). Xe máy dùng lại đường của chuyến. */
    async routeLine(plan: Pick<TripPlan, 'origin' | 'dest' | 'route'>, vehicleClass: VehicleClass): Promise<TripRouteLine> {
      const vehicle = routeVehicleOf(vehicleClass);
      if (vehicle === 'motorbike') return plan.route;
      const road = await roadRoute(plan.origin, plan.dest, vehicle);
      return road ? { coords: road.coords, source: 'road' } : plan.route;
    },

    /**
     * Quán tài trợ có voucher **dùng được cho chuyến này** (chốt 27/11/2026): lấy đúng danh sách voucher hợp chuyến ở màn
     * Gắn voucher (`plan.evaluation.eligible`) — điểm đến nằm trong vùng tặng mã riêng của quán (300 m–1 km), đúng khung
     * giờ, đúng loại xe; gồm cả voucher tặng riêng trong ví. Không dùng bán kính cố định. Mỗi quán một ghim, gần trước.
     */
    async usableSponsors(plan: Pick<TripPlan, 'dest' | 'evaluation'>): Promise<SponsorPinView[]> {
      const camps = new Map((await activeCampaigns()).map((c) => [c.id, c]));
      const byBiz = new Map<string, { camp: CampaignPublic & { business: BusinessPublic }; e: EligibleOffer }[]>();
      for (const e of plan.evaluation.eligible) {
        const camp = e.offer.campaignId ? camps.get(e.offer.campaignId) : undefined;
        if (!camp) continue;
        byBiz.set(camp.businessId, [...(byBiz.get(camp.businessId) ?? []), { camp, e }]);
      }
      return [...byBiz.values()]
        .map((list) => {
          // Giảm nhiều nhất cho chuyến này trước (như thứ tự tự gắn mã).
          const { camp: best, e } = [...list].sort((a, b) => b.e.discount - a.e.discount)[0]!;
          const b = best.business;
          const d = distanceM(plan.dest, b);
          const radius = formatMeters(best.radiusM);
          const distanceText = d < 25 ? 'Ngay tại điểm đến' : `Cách điểm đến ${formatMeters(roundMeters(d))}`;
          const serviceText = e.serviceText + (list.length > 1 ? ` · ${list.length} ưu đãi` : '');
          const statusText = e.offer.inWallet
            ? `Voucher tặng riêng cho bạn, điểm đến trong vùng ${radius} quanh quán`
            : `Điểm đến nằm trong vùng tặng mã ${radius}`;
          return {
            d,
            pin: {
              businessId: b.id,
              campaignId: best.id,
              name: b.name,
              category: b.category,
              logoUrl: safeImageUrl(b.logoUrl),
              address: b.address,
              lat: b.lat,
              lng: b.lng,
              radiusM: best.radiusM,
              distanceText,
              amountText: e.amountText,
              serviceText,
              hoursText: `Tặng mã ${best.hoursFrom}–${best.hoursTo}`,
              statusText,
              a11yLabel: `${b.name}, voucher ${e.amountText} ${serviceText} dùng được cho chuyến này, ${distanceText.toLowerCase()}`,
            } satisfies SponsorPinView,
          };
        })
        .sort((a, b) => a.d - b.d)
        .map((x) => x.pin);
    },

    /** Mã tự gắn theo cách ưu tiên người dùng chọn (Giảm nhiều nhất / Quán gần nhất / Sắp hết hạn). */
    autoSelection(plan: Pick<TripPlan, 'evaluation'>, priority: OfferPriority): Selection {
      return autoSelect(plan.evaluation.eligible, priority);
    },

    /** Danh sách màn Gắn voucher: mã đang gắn trước, rồi theo cách ưu tiên (mặc định giảm nhiều nhất). */
    attachItems(plan: TripPlan, selection: Selection, priority: OfferPriority = 'discount'): AttachItemView[] {
      return sortEligible(plan.evaluation.eligible, selection, priority).map((e) => {
        const attached = selection[e.service] === e.offer.refId;
        const busy = !attached && !!selection[e.service];
        return {
          refId: e.offer.refId,
          service: e.service,
          logo: e.offer.logo,
          tag: e.tag,
          name: e.offer.label,
          amountText: e.amountText,
          serviceText: e.serviceText,
          conditionLine: e.conditionLine,
          metaText: busy ? 'Đang dùng mã khác' : e.metaText,
          attached,
        };
      });
    },

    attachCta(selection: Selection) {
      return attachCtaText(Object.values(selection).filter(Boolean).length);
    },

    /** Người dùng nhập mã khác. Trả về refId nếu khớp mã đã biết và hợp chuyến. */
    /**
     * Mã người dùng tự nhập: khớp mã Frego biết → gắn; biết nhưng không hợp → nói lý do; chưa biết → `unknown`
     * (giữ trong danh sách "Mã bạn nhập", không tính vào giá vì chưa biết mức giảm — 27/11/2026).
     */
    async addCustomCode(
      plan: TripPlan,
      input: string,
    ): Promise<{ matched: EligibleOffer | null; message: string; unknown: string | null }> {
      const code = input.trim().toUpperCase();
      const hit = plan.evaluation.eligible.find((e) => e.offer.code.toUpperCase() === code);
      if (hit) return { matched: hit, message: `Đã gắn ${hit.offer.code} cho ${hit.serviceText}.`, unknown: null };
      const bad = plan.evaluation.ineligible.find((e) => e.offer.code.toUpperCase() === code);
      if (bad) return { matched: null, message: `${bad.offer.code} không hợp chuyến này: ${bad.line.split(' · ')[1]}.`, unknown: null };
      return {
        matched: null,
        message: `Frego chưa có thông tin mã ${code} nên chưa trừ vào giá so sánh. Bạn vẫn nhập được mã này trong app hãng khi đặt xe.`,
        unknown: code,
      };
    },

    async compare(plan: TripPlan, selection: Selection, vehicleClass: VehicleClass): Promise<ComparisonView> {
      const ctx = await tripContext(plan);
      const { rows, insight } = comparePrices(ctx, vehicleClass, plan.evaluation, selection);
      const order = { frego: 0, sponsor: 1, public: 2 } as const;
      const chosen = selectedOffers(selection, plan.evaluation).sort(
        (a, b) => order[a.offer.source] - order[b.offer.source] || b.discount - a.discount,
      );
      return {
        tabs: VEHICLE_TABS,
        vehicleClass,
        rows,
        insight,
        attachedTitle: chosen.length ? `Đã gắn ${chosen.length} voucher` : 'Chưa gắn voucher',
        attachedLine: chosen.length ? chosen.map((c) => c.offer.label).join(' · ') : 'Bấm để gắn mã trước khi so giá',
        peakNote: plan.peak
          ? `${formatTime(plan.at)} là giờ cao điểm, khoảng giá đã nới rộng. Giá cuối cùng do app hãng hiển thị.`
          : 'Giá cuối cùng do app hãng hiển thị.',
      };
    },

    /** Bấm một hãng ở màn So giá: ghi chuyến, phát mã (nếu là ưu đãi chiến dịch), trả dữ liệu màn Mở app. */
    async openProvider(plan: TripPlan, selection: Selection, row: PriceRow): Promise<OpenAppView> {
      const chosen = selectedOffers(selection, plan.evaluation);
      const attached: AttachedCode[] = chosen.map((c) => ({
        service: c.service,
        source: c.offer.source,
        refId: c.offer.refId,
        code: c.offer.code,
        label: c.offer.label,
        amount: c.discount,
      }));
      const trip = await db.rpc('record_trip', {
        originLabel: plan.title.split(' → ')[0],
        originPlaceId: plan.origin.placeId,
        destPlaceId: plan.dest.id,
        destLabel: plan.dest.name,
        distanceKm: plan.km,
        durationMin: plan.minutes,
        attached,
        chosenService: row.service,
        estimateLow: row.final?.low ?? null,
        estimateHigh: row.final?.high ?? null,
        comparedCount: 3,
      });
      return service.openAppView(trip, plan.dest);
    },

    openAppView(trip: Trip, dest: Pick<Place, 'name' | 'address' | 'lat' | 'lng'>): OpenAppView {
      const { providerId, vehicleClass } = parseServiceKey(trip.chosenService!);
      const provider = PROVIDERS[providerId];
      const code = trip.attached.find((c) => c.service === trip.chosenService) ?? null;
      return {
        trip,
        providerId,
        vehicleClass,
        title: `Mở app ${provider.name} để đặt xe`,
        serviceLine: serviceLongLabel(providerId, vehicleClass),
        estimateText:
          trip.estimateLow !== null && trip.estimateHigh !== null ? formatVndRange(trip.estimateLow, trip.estimateHigh) : 'Chưa có giá',
        code: code?.code ?? null,
        codeLine: code ? `Giảm ${formatVnd(code.amount)} cho chuyến ${SERVICES[code.service].name.toLowerCase()}` : null,
        prefillsDestination: provider.prefillsDestination,
        destAddress: `${dest.name}, ${dest.address}`,
        deepLink: providerDeepLink(providerId, dest),
        storeUrl: provider.storeUrl,
        step1: provider.prefillsDestination
          ? [`${provider.name} mở sẵn điểm đến`, ', bạn chỉ cần nhập mã.']
          : [`${provider.name} chưa tự điền điểm đến,`, ' địa chỉ đã được chép sẵn để bạn dán.'],
      };
    },

    /**
     * Nội dung popup quảng cáo cho hãng vừa chọn ở So giá, hoặc null nếu mã gắn ở hãng đó không phải của quán tài trợ
     * (mã Frego, mã công khai, không có mã) → đi thẳng sang màn Mở app.
     */
    async sponsorAd(plan: Pick<TripPlan, 'dest'>, row: PriceRow): Promise<SponsorAdView | null> {
      const e = row.attached;
      if (!e || e.offer.source !== 'sponsor' || !e.offer.campaignId) return null;
      const camp = await db.get('campaigns_public', e.offer.campaignId);
      const b = camp ? await db.get('businesses_public', camp.businessId) : null;
      if (!camp || !b) return null;
      const [banner] = await db.list('ad_banners_public', { where: { businessId: b.id }, limit: 1 });
      const d = distanceM(plan.dest, b);
      const wd = vnParts(db.now()).weekday;
      const today = wd === 0 ? b.openHours.sunday : wd === 6 ? b.openHours.saturday : b.openHours.weekdays;
      return {
        campaignId: camp.id,
        businessId: b.id,
        name: b.name,
        category: b.category,
        logoUrl: safeImageUrl(b.logoUrl),
        industry: b.industry,
        address: b.address,
        distanceText: d < 25 ? 'Ngay tại điểm đến' : `Cách điểm đến ${formatMeters(roundMeters(d))}`,
        hoursText: today ? `Mở cửa hôm nay ${today}` : '',
        giftText: `Voucher ${formatDiscount(e.discount)} ${serviceShortLabel(camp.providerId, camp.vehicleClass)} chuyến này là quà của ${b.name}.`,
        banner: banner ? { imageUrl: banner.imageUrl, title: banner.title, body: banner.body } : null,
        ctaLabel: 'Nhận mã giảm giá',
      };
    },

    /**
     * Ví › Tại quán (chốt 27/11/2026): ưu đãi trên banner của quán mà người dùng đã xem trong ngày (sau khi chọn hãng có mã
     * của quán). Banner hay ghi "đưa màn hình này…" nên phải mở lại được khi tới quán. Lấy từ chuyến có `adViewedAt`.
     */
    async shopOffers(): Promise<ShopOfferView[]> {
      const uid = me();
      const today = formatDate(db.now());
      const trips = (await db.list('trips', { where: { userId: uid }, order: { column: 'createdAt', ascending: false } })).filter(
        (t) => t.adViewedAt && formatDate(t.adViewedAt) === today,
      );
      const out: ShopOfferView[] = [];
      const seen = new Set<string>();
      for (const t of trips) {
        const code = t.attached.find((c) => c.service === t.chosenService);
        if (!code?.refId.startsWith('uv:')) continue;
        const v = await db.get('user_vouchers', code.refId.slice(3));
        const camp = v?.campaignId ? await db.get('campaigns_public', v.campaignId) : null;
        const b = camp ? await db.get('businesses_public', camp.businessId) : null;
        if (!b || seen.has(b.id)) continue;
        const [banner] = await db.list('ad_banners_public', { where: { businessId: b.id }, limit: 1 });
        if (!banner) continue;
        seen.add(b.id);
        out.push({
          tripId: t.id,
          businessId: b.id,
          name: b.name,
          address: b.address,
          category: b.category,
          logoUrl: safeImageUrl(b.logoUrl),
          title: banner.title,
          body: banner.body,
          imageUrl: banner.imageUrl,
          whenText: `Xem lúc ${formatTime(t.adViewedAt!)} hôm nay · dùng trong ngày`,
          lat: b.lat,
          lng: b.lng,
        });
      }
      return out;
    },

    /** Đã hiện popup quảng cáo cho chuyến: ghi 1 lượt xem (mỗi chuyến 1 lần; lỗi mạng thì bỏ qua, không chặn luồng). */
    async recordAdView(tripId: string): Promise<boolean> {
      try {
        return (await db.rpc('record_ad_view', { tripId })).counted;
      } catch {
        return false;
      }
    },

    /** Ghi lần so giá mà không mở app hãng nào ("Chỉ xem giá"). */
    async recordViewOnly(plan: TripPlan) {
      return db.rpc('record_trip', {
        originLabel: plan.title.split(' → ')[0],
        originPlaceId: plan.origin.placeId,
        destPlaceId: plan.dest.id,
        destLabel: plan.dest.name,
        distanceKm: plan.km,
        durationMin: plan.minutes,
        attached: [],
        chosenService: null,
        estimateLow: null,
        estimateHigh: null,
        comparedCount: 3,
      });
    },

    /** DEMO: giả lập hãng báo mã đã dùng (thật: webhook đối tác / biên nhận email). */
    async simulateCodeUsed(tripId: string) {
      return db.rpc('mark_code_used', { tripId });
    },

    async getTrip(tripId: string) {
      const t = await db.get('trips', tripId);
      if (!t || t.userId !== me()) return null;
      const { providerId, vehicleClass } = t.chosenService ? parseServiceKey(t.chosenService) : { providerId: null, vehicleClass: null };
      const code = t.attached.find((c) => c.service === t.chosenService) ?? null;
      return {
        trip: t,
        providerId,
        vehicleClass,
        kind: vehicleClass ? VEHICLE_KIND[vehicleClass] : null,
        serviceLine: providerId && vehicleClass ? serviceLongLabel(providerId, vehicleClass) : '',
        providerName: providerId ? PROVIDERS[providerId].name : '',
        estimateText: t.estimateLow !== null && t.estimateHigh !== null ? formatVndRange(t.estimateLow, t.estimateHigh) : '',
        codeUsedChip: code ? `Mã ${code.code} vừa được dùng` : 'Chuyến vừa hoàn tất',
      };
    },

    async reportPrice(tripId: string, input: { verdict?: PriceVerdict; paidAmount?: number }) {
      return db.rpc('report_price', { tripId, ...input });
    },

    /* ───── Ví voucher ───── */

    async getWallet(): Promise<WalletView> {
      const [vouchers, camps, bizs, codes, partners, linked] = await Promise.all([
        myVouchers(),
        db.list('campaigns_public'),
        db.list('businesses_public'),
        db.list('public_codes', { where: { status: 'live' } }),
        db.list('partners'),
        linkedPartnerIds(),
      ]);
      const campById = new Map(camps.map((c) => [c.id, c]));
      const bizById = new Map(bizs.map((b) => [b.id, b]));
      const pName = new Map(partners.map((p) => [p.id, p]));
      const gifts: WalletGiftView[] = vouchers
        .filter((v) => v.status === 'active')
        .sort((a, b) => (a.source === b.source ? 0 : a.source === 'sponsor' ? -1 : 1))
        .map((v) => {
          const c = v.campaignId ? campById.get(v.campaignId) : null;
          const b = c ? bizById.get(c.businessId) : null;
          const isSponsor = v.source === 'sponsor' && !!b;
          return {
            id: v.id,
            source: v.source,
            logo: isSponsor ? b!.category : 'frego',
            tag: isSponsor ? 'sponsor' : 'frego',
            title: isSponsor ? b!.name : `Mã ${v.code}`,
            amountText: formatDiscount(v.amount),
            serviceText: serviceShortLabel(v.providerId, v.vehicleClass),
            line: v.note,
            metaText: `HSD ${formatDate(v.expiresAt)}`,
            action: isSponsor ? 'Xem mã ›' : 'Dùng ›',
            link: isSponsor ? `/voucher/${v.id}` : '/tim-kiem',
          };
        });
      const nowT = db.now().getTime();
      const publicCodes: PublicCodeCardView[] = codes.map((c) => {
        const partner = c.requiresPartnerId ? pName.get(c.requiresPartnerId) : null;
        const has = !!partner && linked.includes(partner.id);
        return {
          id: c.id,
          logo: c.providerId,
          brandLine: `${PROVIDERS[c.providerId].name} · mã công khai`,
          code: c.code,
          title: c.title,
          okText: partner && has ? `Thẻ ${partner.name} của bạn` : '',
          warnText: partner && !has ? `Cần thẻ ${partner.name}` : '',
          plainText: c.notes[0] ?? '',
          plainText2: c.notes[1] ?? '',
          metaText: `Nguồn: ${c.sourceName} · kiểm tra ${checkedAgo(c.lastCheckedAt, nowT)}`,
          otherCard: !!partner && !has,
        };
      });
      const autoPromos: AutoPromoView[] = Object.values(PROVIDERS)
        .filter((p) => p.autoPromo && new Date(p.autoPromo.until).getTime() > nowT)
        .map((p) => ({
          providerId: p.id,
          brandLine: `${p.name} · tự áp, không cần mã`,
          title: `Giảm ${Math.round(p.autoPromo!.percent * 100)}% mọi chuyến đến hết ${formatDate(p.autoPromo!.until)}`,
          metaText: `Nguồn: ${p.autoPromo!.source} · kiểm tra hôm nay`,
        }));
      const used: UsedVoucherView[] = vouchers
        .filter((v) => v.status === 'used')
        .map((v) => {
          const c = v.campaignId ? campById.get(v.campaignId) : null;
          const b = c ? bizById.get(c.businessId) : null;
          return {
            id: v.id,
            title: b ? b.name : `Mã ${v.code}`,
            amountText: formatDiscount(v.amount),
            serviceText: serviceShortLabel(v.providerId, v.vehicleClass),
            usedText: v.usedAt ? `Đã dùng ${formatDate(v.usedAt)}` : 'Đã dùng',
          };
        });
      return { gifts, publicCodes, autoPromos, used };
    },

    async getVoucher(id: string): Promise<VoucherDetailView | null> {
      const v = await db.get('user_vouchers', id);
      if (!v || v.userId !== me()) return null;
      const c = v.campaignId ? await db.get('campaigns_public', v.campaignId) : null;
      const b = c ? await db.get('businesses_public', c.businessId) : null;
      const svc = serviceFullLabel(v.providerId, v.vehicleClass);
      const radius = c ? formatMeters(c.radiusM) : '';
      return {
        voucher: v,
        businessName: b?.name ?? brand.name,
        businessAddress: b?.address.split(',').slice(0, 2).join(',') ?? '',
        landmark: b?.landmark || null,
        category: b?.category ?? 'frego',
        amountText: formatDiscount(v.amount),
        serviceText: `${PROVIDERS[v.providerId].name} ${SERVICES[`${v.providerId}-${v.vehicleClass}`].name.toLowerCase()}`,
        expiresText: `HSD ${formatDate(v.expiresAt)}`,
        reasons: v.reasons,
        radiusText: radius,
        area: c && b ? { lat: b.lat, lng: b.lng, radiusM: c.radiusM } : null,
        conditions: [
          `Dùng 1 lần cho chuyến ${svc.charAt(0).toUpperCase() + svc.slice(1)}.`,
          ...(c ? [`Điểm đến nằm trong vòng ${radius} quanh quán.`] : []),
          `Nhập mã trong app ${PROVIDERS[v.providerId].name} trước khi đặt xe.`,
          `Hạn dùng đến hết ngày ${formatDate(v.expiresAt)}.`,
        ],
      };
    },

    async getPublicCode(id: string): Promise<PublicCodeDetailView | null> {
      const c = await db.get('public_codes', id);
      if (!c) return null;
      const [partners, linked, votes] = await Promise.all([
        db.list('partners'),
        linkedPartnerIds(),
        db.list('code_votes', { where: { userId: me(), publicCodeId: id } }),
      ]);
      const partner = c.requiresPartnerId ? partners.find((p) => p.id === c.requiresPartnerId) : null;
      const has = !!partner && linked.includes(partner.id);
      const nowT = db.now().getTime();
      let host = c.sourceName;
      try {
        const u = new URL(c.sourceUrl);
        host = u.host.replace(/^www\./, '') + (u.pathname.startsWith('/vn') ? '/vn' : '');
      } catch {
        /* giữ sourceName */
      }
      return {
        code: c,
        providerName: PROVIDERS[c.providerId].name,
        fits: !partner || has,
        fitText: partner && has ? `Hợp với bạn: bạn đã liên kết thẻ ${partner.name} trong Tài khoản.` : null,
        missingText: partner && !has ? `Cần thẻ ${partner.name}. Liên kết trong Tài khoản để Frego tự gắn mã này.` : null,
        conditions: c.conditions,
        expiryNote: c.expiresAt
          ? `Hạn dùng: đến hết ${formatDate(c.expiresAt)}. Frego kiểm tra lại mỗi ngày và tự ẩn khi mã hết.`
          : 'Hạn dùng: chưa rõ ngày kết thúc. Frego kiểm tra lại mỗi ngày và tự ẩn khi mã hết.',
        sourceHost: host,
        sourceTitle: `Bài: ${c.sourceTitle}`,
        checkedText: `Frego kiểm tra lần cuối ${checkedAgo(c.lastCheckedAt, nowT)}`,
        reportsText: `${c.okReports24h} dùng được`,
        reportsSub: ` · ${c.badReports24h} không dùng được, trong 24 giờ qua`,
        myVote: votes[0]?.works ?? null,
      };
    },

    async votePublicCode(id: string, works: boolean) {
      return db.rpc('vote_public_code', { publicCodeId: id, works });
    },

    /* ───── Điểm thưởng ───── */

    async getPoints(): Promise<PointsView> {
      const uid = me();
      const [profile, rewards, ledger] = await Promise.all([
        db.get('profiles', uid),
        db.list('rewards', { where: { active: true }, order: { column: 'cost' } }),
        db.list('points_ledger', { where: { userId: uid }, order: { column: 'createdAt', ascending: false }, limit: 20 }),
      ]);
      const points = profile?.points ?? 0;
      const target = rewards[rewards.length - 1];
      const targetLabel = target ? `${serviceShortLabel(target.providerId, target.vehicleClass)} ${formatDiscount(target.amount)}` : '';
      return {
        points,
        pointsText: formatNumber(points),
        progressText: !target
          ? ''
          : points >= target.cost
            ? `Đủ điểm đổi ${targetLabel}`
            : `Còn ${formatNumber(target.cost - points)} điểm nữa để đổi ${targetLabel}`,
        progress: target ? Math.min(1, points / target.cost) : 0,
        rewards: rewards.map((r) => ({
          id: r.id,
          providerId: r.providerId,
          kind: VEHICLE_KIND[r.vehicleClass],
          amountText: formatDiscount(r.amount),
          serviceText: r.providerId === 'gsm' ? PROVIDERS.gsm.name : serviceShortLabel(r.providerId, r.vehicleClass),
          cost: r.cost,
          costText: `${formatNumber(r.cost)} điểm`,
          canRedeem: points >= r.cost,
          shortText: points >= r.cost ? '' : `Thiếu ${formatNumber(r.cost - points)} điểm`,
        })),
        history: ledger.map((e) => ({
          id: e.id,
          deltaText: (e.delta > 0 ? '+' : '') + formatNumber(e.delta),
          reason: e.reason,
          dateText: formatDayMonth(e.createdAt),
        })),
      };
    },

    async redeemReward(rewardId: string) {
      return db.rpc('redeem_reward', { rewardId });
    },

    /* ───── Lịch sử so giá ───── */

    async listTrips(): Promise<TripHistoryItem[]> {
      const uid = me();
      const trips = await db.list('trips', { where: { userId: uid }, order: { column: 'createdAt', ascending: false } });
      const now = db.now();
      return trips.map((t) => {
        const svc = t.chosenService ? SERVICES[t.chosenService] : null;
        const svcLabel = svc ? serviceShortLabel(svc.providerId, svc.vehicleClass) : '';
        const code = t.attached.find((c) => c.service === t.chosenService);
        const codeText = code ? (code.source === 'sponsor' ? `voucher ${code.label} ${formatDiscount(code.amount)}` : `mã ${code.code}`) : '';
        const est = t.estimateLow !== null && t.estimateHigh !== null ? formatVndRange(t.estimateLow, t.estimateHigh) : '';
        let status: TripHistoryItem['status'];
        let chip: string;
        let line: string;
        if (t.status === 'reported') {
          status = 'reported';
          chip = 'Đã báo giá';
          line = code ? `${svcLabel} · ${codeText}` : `${serviceLongLabelLower(t.chosenService!)} · ước tính ${est}`;
        } else if (t.status === 'code_used') {
          status = 'pending';
          chip = 'Chưa báo giá';
          line = `${svcLabel} · ${codeText ? codeText + ' · ' : ''}ước tính sau mã ${est}`;
        } else if (t.status === 'opened') {
          status = 'opened';
          chip = 'Đã mở app hãng';
          line = `${svcLabel}${codeText ? ' · ' + codeText : ''} · ước tính ${est}`;
        } else {
          status = 'viewed';
          chip = 'Chỉ xem giá';
          line = `Đã so ${t.comparedCount} hãng, chưa mở app hãng nào.`;
        }
        return {
          id: t.id,
          group: formatDayGroup(t.createdAt, now),
          time: formatTime(t.createdAt),
          status,
          chip,
          title: `${t.originLabel} → ${t.destLabel}`,
          line,
          paidText: t.paidAmount ? `Bạn trả ${formatVnd(t.paidAmount)}` : null,
          pointsText: t.pointsAwarded ? `+${t.pointsAwarded} điểm` : null,
        };
      });
    },

    /* ───── Liên kết ───── */

    async getLinks(): Promise<{ cards: LinkRowView[]; wallets: LinkRowView[]; apps: LinkRowView[]; count: number }> {
      const [partners, linked] = await Promise.all([db.list('partners', { order: { column: 'sortOrder' } }), linkedPartnerIds()]);
      const row = (p: Partner): LinkRowView => ({
        partnerId: p.id,
        kind: p.kind,
        name: p.name,
        mono: p.mono,
        desc: linked.includes(p.id) ? (p.linkedDescription ?? p.description) : p.description,
        linked: linked.includes(p.id),
        isRideApp: ['grab', 'be', 'gsm'].includes(p.id),
      });
      return {
        cards: partners.filter((p) => p.kind === 'bank').map(row),
        wallets: partners.filter((p) => p.kind === 'wallet').map(row),
        // Gmail có hàng riêng (getGmailStatus); hàng Grab/Be/Green SM là "Đã cài app", chỉ ghi nhận để ưu tiên mã.
        apps: partners.filter((p) => p.kind === 'app').map(row),
        count: linked.filter((id) => id !== 'gmail').length,
      };
    },

    async link(partnerId: string, cardType: 'credit' | 'debit' | null = null) {
      const uid = me();
      const existing = await db.list('linked_accounts', { where: { userId: uid, partnerId } });
      if (existing.length) return existing[0];
      return db.insert('linked_accounts', { userId: uid, partnerId, cardType, linkedAt: nowIso() });
    },

    async unlink(partnerId: string) {
      const uid = me();
      const existing = await db.list('linked_accounts', { where: { userId: uid, partnerId } });
      for (const e of existing) await db.remove('linked_accounts', e.id);
    },

    /* ───── Gmail: tự lấy giá từ biên nhận ───── */
    // Supabase: liên kết / đồng bộ / gỡ chạy ở máy chủ web (apps/web/src/app/api/gmail), app chỉ đọc trạng thái ở đây.
    // DEMO: liên kết giả lập (ghi rõ là bản thử), đồng bộ tạo một biên nhận mẫu cho chuyến gần nhất rồi chạy đúng
    // parseReceipt + RPC record_receipt như máy chủ.

    async getGmailStatus(): Promise<GmailStatusView> {
      const uid = me();
      const [conns, receipts] = await Promise.all([
        db.list('gmail_connections_public', { where: { userId: uid } }),
        db.list('gmail_receipts', { where: { userId: uid } }),
      ]);
      const c = conns[0] ?? null;
      return {
        linked: !!c,
        demo: !!c?.demo,
        email: c?.email ?? null,
        lastSyncText: c?.lastSyncAt ? `Đồng bộ lần cuối ${formatTime(c.lastSyncAt)}, ${formatDayMonth(c.lastSyncAt)}` : null,
        matchedCount: receipts.filter((r) => r.status === 'matched').length,
        error: c?.status === 'error' ? (c.lastError ?? 'Cần liên kết lại Gmail.') : null,
      };
    },

    async demoLinkGmail() {
      if (db.mode !== 'demo') throw new Error('Chỉ dùng ở chế độ DEMO');
      const uid = me();
      const existing = await db.list('gmail_connections', { where: { userId: uid } });
      if (existing.length) return existing[0]!;
      return db.insert('gmail_connections', {
        userId: uid,
        email: 'hopthu.demo@gmail.com',
        status: 'active',
        connectedAt: nowIso(),
        lastSyncAt: null,
        lastError: null,
        demo: true,
      });
    },

    async demoUnlinkGmail() {
      if (db.mode !== 'demo') throw new Error('Chỉ dùng ở chế độ DEMO');
      const uid = me();
      const existing = await db.list('gmail_connections', { where: { userId: uid } });
      for (const e of existing) await db.remove('gmail_connections', e.userId);
    },

    async demoSyncGmail(): Promise<GmailSyncResult> {
      if (db.mode !== 'demo') throw new Error('Chỉ dùng ở chế độ DEMO');
      const uid = me();
      // Chuyến mở app hãng gần nhất chưa có số tiền (đúng chuyến mà record_receipt sẽ khớp).
      const trips = await db.list('trips', { where: { userId: uid } });
      const trip =
        trips
          .filter((t) => t.chosenService && t.openedAt && t.paidAmount === null)
          .sort((a, b) => (a.openedAt! < b.openedAt! ? 1 : -1))[0] ?? null;
      const result: GmailSyncResult = { checked: 0, matched: 0, pointsAwarded: 0, held: null };
      if (trip) {
        const parsed = parseReceipt(demoReceiptEmail(trip, db.now()));
        if (parsed) {
          result.checked = 1;
          const r = await db.rpc('record_receipt', {
            messageId: `demo-${trip.id}`,
            providerId: parsed.providerId,
            paidAmount: parsed.total,
            receivedAt: parsed.receivedAt,
            tripAt: parsed.tripAt,
            pickup: parsed.pickup,
            dropoff: parsed.dropoff,
            promoCode: parsed.promoCode,
          });
          if (r.status === 'matched' && !r.duplicate) result.matched = 1;
          result.pointsAwarded = r.pointsAwarded;
          result.held = r.held;
        }
      }
      await db.update('gmail_connections', uid, { lastSyncAt: nowIso() });
      return result;
    },

    /* ───── Giới thiệu bạn bè ───── */

    async getReferral(): Promise<ReferralView> {
      const r = await db.rpc('my_referrals', {});
      const R = POINTS_RULES.referral;
      const nowT = db.now().getTime();
      // Số ngày còn lại tính theo ngày lịch giờ VN: nhập mã 20/11, hôm nay 22/11 → còn 30 − 2 = 28 ngày.
      const vnDay = (t: string | number) => Math.floor((new Date(t).getTime() + 7 * 3600_000) / DAY_MS);
      const friends: ReferralFriendView[] = r.friends.map((f) => {
        const daysLeft = Math.max(1, R.qualifyDays - (vnDay(nowT) - vnDay(f.createdAt)));
        const sub =
          f.status === 'rewarded'
            ? `Báo giá chuyến đầu ${formatDayMonth(f.rewardedAt ?? f.qualifiedAt ?? f.createdAt)}`
            : f.status === 'pending'
              ? `Nhập mã ${formatDayMonth(f.createdAt)} · còn ${daysLeft} ngày`
              : f.status === 'held'
                ? 'Đang giữ lại để Frego kiểm tra'
                : f.status === 'expired'
                  ? `Nhập mã ${formatDayMonth(f.createdAt)}, chưa có chuyến`
                  : 'Không đủ điều kiện nhận thưởng';
        return {
          id: f.id,
          name: f.name,
          initial: (f.name.trim()[0] ?? 'F').toUpperCase(),
          status: f.status,
          sub,
          points: f.status === 'rewarded' ? R.referrer : 0,
        };
      });
      const deadline = new Date(r.accountCreatedAt).getTime() + R.enterDays * DAY_MS;
      const canEnter = !r.guest && !r.enteredBy && nowT < deadline;
      return {
        code: r.code,
        link: `https://${brand.web.domain}/moi/${r.code}`,
        rewardReferrer: R.referrer,
        rewardReferee: R.referee,
        monthlyCap: R.monthlyCap,
        monthRewarded: r.monthRewarded,
        pointsEarned:
          friends.filter((f) => f.status === 'rewarded').length * R.referrer + (r.enteredBy?.status === 'rewarded' ? R.referee : 0),
        friends,
        canEnter,
        enterDaysLeft: canEnter ? Math.max(1, R.enterDays - (vnDay(nowT) - vnDay(r.accountCreatedAt))) : null,
        enteredBy: r.enteredBy ? { name: r.enteredBy.name } : null,
      };
    },

    /** Kiểm tra mã bạn bè trước khi áp dụng (không ghi gì). */
    async checkReferralCode(code: string): Promise<ReferralCheckResult> {
      return db.rpc('check_referral_code', { code });
    },

    /** Nhập mã giới thiệu. Lỗi (mã sai, mã của mình, đã nhập, quá 7 ngày, khách) ném câu tiếng Việt. */
    async applyReferralCode(code: string): Promise<{ ownerName: string }> {
      return db.rpc('apply_referral_code', { code });
    },

    /* ───── Ảnh bìa Trang chủ ───── */

    /** Ảnh bìa đang hiện; null (không có / lỗi mạng / URL lạ) → app dùng ảnh mặc định. */
    async getHomeCover(): Promise<HomeCoverView | null> {
      try {
        const c = await db.rpc('active_home_cover', {});
        const imageUrl = safeImageUrl(c?.imageUrl);
        if (!c || !imageUrl) return null;
        return { imageUrl, overlay: Number(c.overlay) || 0, title: c.title };
      } catch {
        return null;
      }
    },

    /* ───── Ảnh tại quán ───── */

    /** Trạng thái ảnh tại quán của chuyến; null khi chuyến không dùng mã của quán tài trợ. */
    async getShopPhotoState(tripId: string): Promise<ShopPhotoStateView | null> {
      const uid = me();
      const t = await db.get('trips', tripId);
      if (!t || t.userId !== uid) return null;
      const codes = t.attached
        .filter((c) => c.source === 'sponsor')
        .sort((a, b) => Number(b.service === t.chosenService) - Number(a.service === t.chosenService));
      let shopName: string | null = null;
      for (const code of codes) {
        const campaignId = code.refId.startsWith('uv:')
          ? ((await db.get('user_vouchers', code.refId.slice(3)))?.campaignId ?? null)
          : code.refId.startsWith('cp:')
            ? code.refId.slice(3)
            : null;
        const camp = campaignId ? await db.get('campaigns_public', campaignId) : null;
        const biz = camp ? await db.get('businesses_public', camp.businessId) : null;
        if (biz) {
          shopName = biz.name;
          break;
        }
      }
      if (!shopName) return null;
      const [photo] = await db.list('shop_photos', { where: { tripId: t.id, userId: uid }, limit: 1 });
      return {
        shopName,
        status: photo?.status ?? 'none',
        points: POINTS_RULES.shopPhoto,
        rejectReason: photo?.rejectReason ?? null,
      };
    },

    /**
     * Gửi ảnh tại quán: tính SHA-256 của ảnh, tải lên kho riêng `checkin-photos/<uid>/…`, rồi gọi RPC submit_shop_photo
     * (máy chủ kiểm chuyến, giờ chụp, vị trí ≤ 150 m, mỗi chuyến một ảnh, ảnh không trùng). Chờ Frego duyệt mới cộng điểm.
     */
    async submitShopPhoto(tripId: string, input: ShopPhotoInput): Promise<ShopPhoto> {
      const uid = me();
      const state = await service.getShopPhotoState(tripId);
      if (!state) throw new Error('Chuyến này không dùng mã của quán tài trợ');
      if (state.status !== 'none') throw new Error('Chuyến này đã gửi ảnh tại quán rồi');
      const f = input.file;
      let bytes: Uint8Array | null = null;
      let contentType = 'image/jpeg';
      let uri: string | null = null;
      if ('uri' in f && typeof f.uri === 'string') {
        uri = f.uri;
        if (db.mode === 'supabase') {
          try {
            bytes = new Uint8Array(await (await fetch(f.uri)).arrayBuffer());
          } catch {
            bytes = null;
          }
        }
      } else {
        const blob = f as Blob;
        bytes = await blobBytes(blob);
        contentType = blob.type || contentType;
        if (!bytes) throw new Error('Không đọc được ảnh. Thử chụp lại.');
      }
      if (bytes && !bytes.length) throw new Error('Không đọc được ảnh. Thử chụp lại.');
      // Không đọc được byte từ uri (một số máy): băm uri + giờ chụp; máy chủ vẫn chặn trùng chuyến.
      const sha256 = await sha256Hex(bytes ?? utf8Bytes(`${uri ?? ''}|${input.takenAt}`));
      const storagePath = await db.files.uploadCheckinPhoto(
        uid,
        bytes ? { bytes, contentType, ext: IMAGE_EXT[contentType] ?? 'jpg' } : { uri: uri ?? '' },
      );
      return db.rpc('submit_shop_photo', {
        tripId,
        storagePath,
        sha256,
        takenAt: input.takenAt,
        lat: input.lat,
        lng: input.lng,
      });
    },

    /* ───── Thông báo ───── */

    async listNotifications(): Promise<NotificationView[]> {
      const uid = me();
      const list = await db.list('notifications', { where: { userId: uid }, order: { column: 'createdAt', ascending: false } });
      const now = db.now();
      return list.map((n) => {
        const today = formatDayGroup(n.createdAt, now) === 'Hôm nay';
        const when = today
          ? formatTime(n.createdAt)
          : formatDayGroup(n.createdAt, now) === 'Hôm qua'
            ? `Hôm qua, ${formatTime(n.createdAt)}`
            : `${Number(formatDayMonth(n.createdAt).split('/')[0])}/${Number(formatDayMonth(n.createdAt).split('/')[1])}`;
        return {
          ...n,
          unread: !n.readAt,
          metaText: `${when} · ${n.category === 'trip' ? 'Chuyến đi' : 'Voucher'}`,
          group: today ? 'today' : 'earlier',
        };
      });
    },

    async unreadCount(): Promise<number> {
      const uid = db.currentUserId();
      if (!uid) return 0;
      const list = await db.list('notifications', { where: { userId: uid } });
      return list.filter((n) => !n.readAt).length;
    },

    async markAllNotificationsRead() {
      return db.rpc('mark_all_notifications_read', {});
    },

    async markNotificationRead(id: string) {
      return db.update('notifications', id, { readAt: nowIso() });
    },

    /* ───── Tiện ích ───── */
    formatRelative: (iso: string) => formatRelative(iso, db.now()),
    categoryLabel: (c: CategoryKey) => CATEGORY_LABEL[c],
  };

  return service;
}

export type UserService = ReturnType<typeof createUserService>;

/** DEMO: thư biên nhận mẫu (giả lập) cho chuyến đã mở app hãng — giá giữa khoảng ước tính, gửi 25 phút sau khi mở app. */
function demoReceiptEmail(trip: Trip, now: Date): ReceiptEmail {
  const { providerId, vehicleClass } = parseServiceKey(trip.chosenService!);
  const sender = { grab: 'Grab <no-reply@grab.com>', be: 'be <hotro@be.com.vn>', gsm: 'Xanh SM <no-reply@xanhsm.com>' }[providerId];
  const opened = new Date(trip.openedAt!).getTime();
  const at = new Date(Math.min(opened + 25 * 60_000, now.getTime()));
  const lo = trip.estimateLow ?? 30_000;
  const hi = trip.estimateHigh ?? lo;
  const total = Math.round((lo + hi) / 2 / 1000) * 1000;
  const code = trip.attached.find((c) => c.service === trip.chosenService)?.code ?? null;
  return {
    from: sender,
    subject: `[Bản thử DEMO] Biên nhận chuyến đi ${serviceFullLabel(providerId, vehicleClass)}`,
    date: at.toISOString(),
    text: [
      'Cảm ơn bạn đã đi cùng chúng tôi',
      `Thời gian: ${formatTime(at)} ${formatDate(at)}`,
      `Điểm đón: ${trip.originLabel}`,
      `Điểm đến: ${trip.destLabel}`,
      code ? `Mã khuyến mãi: ${code}` : '',
      `Tổng cộng: ${formatVnd(total)}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/** Link mở app hãng. Grab nhận điểm đến qua tham số; Be, Green SM chỉ mở app. */
export function providerDeepLink(providerId: ProviderId, dest: Pick<Place, 'name' | 'lat' | 'lng'>): string {
  const p = PROVIDERS[providerId];
  if (providerId === 'grab') {
    const q = `screenType=BOOKING&dropOffLatitude=${dest.lat}&dropOffLongitude=${dest.lng}&dropOffAddress=${encodeURIComponent(dest.name)}`;
    return `${p.appUrl}?${q}`;
  }
  return p.appUrl;
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function serviceLongLabelLower(key: ServiceKey) {
  const { providerId, vehicleClass } = parseServiceKey(key);
  return serviceFullLabel(providerId, vehicleClass);
}

/** "2 giờ trước", "hôm qua" */
/** Hạn còn lại theo ngày lịch giờ VN: hết hạn trong hôm nay → "Hết hạn hôm nay", còn lại → "Còn N ngày". */
export function endsInText(endsAt: string, now: Date): string {
  const day = (d: Date | string) => {
    const p = vnParts(d);
    return Date.UTC(p.year, p.month - 1, p.day) / 86_400_000;
  };
  const days = day(endsAt) - day(now);
  return days <= 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`;
}

function checkedAgo(iso: string, nowT: number): string {
  return formatRelative(iso, nowT);
}
