/**
 * Giao diện truy cập dữ liệu dùng chung. Có hai cài đặt:
 * - createMemoryDb (chế độ DEMO, dữ liệu mẫu trong bộ nhớ)
 * - createSupabaseDb (Supabase, RLS lọc theo người đăng nhập)
 * Logic hiển thị nằm ở services/*, chạy giống nhau trên cả hai.
 */
import type { Row, TableName } from './schema';
import type {
  AppNotification,
  AttachedCode,
  Business,
  CategoryKey,
  Profile,
  PriceVerdict,
  Referral,
  ReferralStatus,
  ShopPhoto,
  ProviderId,
  ServiceKey,
  Trip,
  UserVoucher,
} from '../types';

export interface ListOptions<T> {
  where?: Partial<T>;
  /** Cột giá trị nằm trong danh sách */
  in?: { [K in keyof T]?: T[K][] };
  order?: { column: keyof T & string; ascending?: boolean };
  limit?: number;
}

/* ───────── Lệnh tin cậy (RPC): chạy trong Postgres (security definer) hoặc bộ nhớ ở DEMO ───────── */

export interface RecordTripArgs {
  originLabel: string;
  originPlaceId: string | null;
  destPlaceId: string;
  destLabel: string;
  distanceKm: number;
  durationMin: number;
  attached: AttachedCode[];
  chosenService: ServiceKey | null;
  estimateLow: number | null;
  estimateHigh: number | null;
  comparedCount: number;
}

export interface Rpcs {
  /** Ghi lần so giá. Ưu đãi chiến dịch chưa nhận ("cp:") được phát mã riêng cho người dùng. */
  record_trip: { args: RecordTripArgs; result: Trip };
  /**
   * Ghi nhận chuyến sau khi mở app hãng kèm mã và nhắc báo giá (DEMO: giả lập sau khi mở app hãng).
   * Frego không biết mã có thật sự được dùng (chưa có API đối tác): thông báo không được nói "đã được dùng".
   */
  mark_code_used: { args: { tripId: string }; result: { trip: Trip; notification: AppNotification | null } };
  report_price: {
    args: { tripId: string; verdict?: PriceVerdict; paidAmount?: number };
    /** held: lý do điểm bị giữ (vượt giới hạn ngày, số tiền lệch quá 30%) hoặc null */
    result: { trip: Trip; pointsAwarded: number; points: number; held: string | null };
  };
  redeem_reward: { args: { rewardId: string }; result: { voucher: UserVoucher; points: number } };
  /** Xóa tài khoản người dùng và mọi dữ liệu của họ (không cho tài khoản quản lý doanh nghiệp / quản trị). */
  delete_my_account: { args: Record<string, never>; result: { deleted: true } };
  vote_public_code: { args: { publicCodeId: string; works: boolean }; result: { ok: number; bad: number } };
  mark_all_notifications_read: { args: Record<string, never>; result: { count: number } };
  /** Phát quà chào mừng FREGO20 khi đăng nhập lần đầu (không phát lại, tối đa brand.welcomeQuota suất). */
  ensure_welcome_voucher: { args: Record<string, never>; result: UserVoucher | null };
  /** Quản trị: khớp tiền nạp vào ví doanh nghiệp. */
  confirm_topup: { args: { transactionId: string }; result: { balance: number } };
  /**
   * Webhook PayOS (máy chủ, đã kiểm chữ ký): cộng tiền cho lần nạp có mã đơn orderCode. Không cộng hai lần (idempotent),
   * số tiền phải khớp đúng lần nạp. Supabase: chỉ service_role gọi được.
   */
  payos_credit_topup: {
    args: { orderCode: number; amount: number; reference?: string | null };
    result: { credited: boolean; balance: number | null; reason: 'ok' | 'already' | 'not_found' | 'amount_mismatch' };
  };
  /** Quản trị: cộng/trừ điểm thủ công (ghi nhật ký). */
  adjust_points: { args: { userId: string; delta: number; reason: string }; result: { points: number } };
  /** Đăng ký doanh nghiệp (DN 0): tạo hồ sơ chờ duyệt, người gửi là chủ cửa hàng. */
  register_business: {
    args: {
      name: string;
      legalName?: string;
      taxCode?: string;
      representative?: string;
      category?: CategoryKey;
      industry?: string;
      address?: string;
      district?: string;
      landmark?: string;
      lat?: number;
      lng?: number;
      contactEmail?: string;
      contactPhone?: string;
      /** Lưu nháp thay vì gửi duyệt */
      draft?: boolean;
    };
    result: Business;
  };
  /** Quản trị: duyệt / từ chối hồ sơ doanh nghiệp. */
  review_business: { args: { businessId: string; approve: boolean; reason?: string }; result: Business };
  /** Quản trị: tạm khóa / mở khóa doanh nghiệp (khóa thì dừng chiến dịch đang chạy). */
  set_business_status: { args: { businessId: string; status: 'active' | 'locked'; reason?: string }; result: Business };
  /** Quản trị: tạm khóa / mở khóa người dùng. */
  set_user_status: { args: { userId: string; status: 'active' | 'locked'; reason?: string }; result: Profile };
  /**
   * Ghi 1 lượt xem popup quảng cáo cho chuyến (chủ chuyến gọi). Chỉ tính khi hãng đã chọn có mã của quán tài trợ,
   * mỗi chuyến 1 lần; cộng vào campaigns.ad_view_count. Không lưu ai xem.
   */
  record_ad_view: { args: { tripId: string }; result: { counted: boolean; campaignId: string | null } };
  /**
   * Ghi 1 biên nhận email đã bóc (máy chủ gọi bằng service role sau khi đọc Gmail; DEMO: người đang đăng nhập).
   * Khớp chuyến cùng hãng, mở app hãng trong 3 giờ trước biên nhận; ghi giá như nhập số tiền ở Báo giá (cùng quy tắc
   * điểm: lệch ≤ 30%, tối đa 300 điểm/ngày). Không ghi trùng: mỗi (userId, messageId) một lần.
   */
  record_receipt: { args: RecordReceiptArgs; result: RecordReceiptResult };

  /* ───── Giới thiệu bạn bè (supabase/migrations/20261127001200_v3_referral_cover_photo.sql) ───── */

  /** Kiểm tra mã trước khi nhập (không ghi gì). */
  check_referral_code: { args: { code: string }; result: ReferralCheckResult };
  /** Nhập mã giới thiệu (mỗi tài khoản 1 lần, trong 7 ngày đầu). Lỗi: ném câu tiếng Việt. */
  apply_referral_code: { args: { code: string }; result: { ownerName: string } };
  /** Dữ liệu màn Giới thiệu bạn bè của người đang đăng nhập (tên bạn đã che, không có số điện thoại). */
  my_referrals: { args: Record<string, never>; result: MyReferralsResult };
  /** Trang mời công khai /moi/[ma]: chỉ trả tên đã che của chủ mã (anon gọi được). */
  referral_owner_name: { args: { code: string }; result: { ownerName: string | null } };
  /** Quản trị (ops): đổi trạng thái lượt giới thiệu. "rewarded" từ held/pending thì cộng điểm cho cả hai bên. */
  admin_set_referral_status: {
    args: { id: string; status: Extract<ReferralStatus, 'rewarded' | 'rejected' | 'held'>; note?: string | null };
    result: Referral;
  };

  /* ───── Ảnh bìa Trang chủ ───── */

  /** Ảnh bìa đang hiện: bản "scheduled" có khung giờ chứa hiện tại (bắt đầu muộn nhất thắng), không có thì null. */
  active_home_cover: { args: Record<string, never>; result: { imageUrl: string; overlay: number; title: string } | null };

  /* ───── Ảnh tại quán ───── */

  /** Gửi ảnh tại quán cho chuyến dùng mã của quán tài trợ (chờ Frego duyệt). */
  submit_shop_photo: {
    args: { tripId: string; storagePath: string; sha256: string; takenAt: string; lat: number; lng: number };
    result: ShopPhoto;
  };
  /** Quản trị (ops): duyệt (+50 điểm, thông báo) hoặc từ chối (cần lý do, thông báo). */
  review_shop_photo: { args: { id: string; approve: boolean; reason?: string | null }; result: ShopPhoto };
  /** Doanh nghiệp (thành viên quán) / quản trị: số lượt check-in có ảnh đã duyệt của quán — không ảnh, không người chụp. */
  business_checkin_count: { args: { businessId: string }; result: { count: number } };
}

export type ReferralCheckReason = 'not_found' | 'own' | 'already' | 'too_late' | 'guest';

/**
 * Kết quả kiểm tra mã giới thiệu. `ownerName` đã che ("Lan N."). Khi không hợp lệ, `message` là câu tiếng Việt để hiện
 * (trùng câu lỗi của apply_referral_code). Mã của tài khoản tạo sau người nhập trả reason "not_found" kèm message riêng.
 */
export type ReferralCheckResult = { ok: true; ownerName: string } | { ok: false; reason: ReferralCheckReason; message: string };

export interface MyReferralFriend {
  id: string;
  /** Tên đã che: "Lan N." */
  name: string;
  status: ReferralStatus;
  createdAt: string;
  qualifiedAt: string | null;
  rewardedAt: string | null;
}

export interface MyReferralsResult {
  code: string;
  /** Lúc tạo tài khoản (tính hạn 7 ngày nhập mã) */
  accountCreatedAt: string;
  /** Khách ẩn danh (chưa đăng nhập số điện thoại) */
  guest: boolean;
  /** Số lượt được thưởng tháng này (giờ VN) của người đang đăng nhập với vai người giới thiệu */
  monthRewarded: number;
  /** Bạn đã mời, mới nhất trước */
  friends: MyReferralFriend[];
  /** Người giới thiệu của mình (nếu đã nhập mã) */
  enteredBy: { name: string; status: ReferralStatus; createdAt: string } | null;
}

export interface RecordReceiptArgs {
  /** Chủ hộp thư. Supabase: bắt buộc (máy chủ gọi bằng service role). DEMO: mặc định người đang đăng nhập. */
  userId?: string;
  messageId: string;
  providerId: ProviderId;
  paidAmount: number;
  receivedAt: string;
  tripAt?: string | null;
  pickup?: string | null;
  dropoff?: string | null;
  promoCode?: string | null;
}

export interface RecordReceiptResult {
  status: 'matched' | 'unmatched' | 'already_reported';
  /** Thư này đã ghi từ trước (không cộng điểm lần nữa) */
  duplicate: boolean;
  tripId: string | null;
  pointsAwarded: number;
  held: string | null;
}

/**
 * Kho file (ảnh banner quảng cáo). DEMO: data URL trong bộ nhớ. Supabase: Storage — bucket riêng `ad-uploads`
 * (chủ quán tải lên, quản trị xem) và bucket công khai `ad-banners` (chép sang khi duyệt).
 */
export interface FileStore {
  /** Tải ảnh lên vùng riêng của quán. Trả "ref" để lưu vào ad_banners.image_url khi chờ duyệt. */
  uploadPrivate(businessId: string, file: { bytes: Uint8Array; contentType: string; ext: string }): Promise<string>;
  /** URL hiển thị được cho ref (ảnh riêng: URL ký có hạn; URL công khai/data URL: giữ nguyên). */
  viewUrl(ref: string): Promise<string>;
  /** Quản trị duyệt: chép ảnh sang vùng công khai, trả URL công khai. */
  publish(ref: string): Promise<string>;
  /** Logo quán: tải thẳng lên vùng công khai `business-logos/<businessId>/…` (app hiện ngay), trả URL công khai. */
  uploadLogo(businessId: string, file: { bytes: Uint8Array; contentType: string; ext: string }): Promise<string>;
  /** Ảnh bìa Trang chủ (quản trị ops): bucket công khai `app-banners`. DEMO: data URL. */
  uploadHomeCover(file: { bytes: Uint8Array; contentType: string; ext: string }): Promise<{ imageUrl: string; storagePath: string }>;
  /** Gỡ tệp ảnh bìa khỏi kho (bỏ qua nếu không có). */
  removeHomeCover(storagePath: string): Promise<void>;
  /**
   * Ảnh tại quán: bucket riêng `checkin-photos/<userId>/…` (chỉ chủ ảnh tải lên, quản trị xem). Trả đường dẫn trong bucket.
   * `{ uri }`: ảnh chọn từ máy (React Native) khi không đọc được byte (DEMO giữ nguyên uri để xem).
   */
  uploadCheckinPhoto(userId: string, file: { bytes: Uint8Array; contentType: string; ext: string } | { uri: string }): Promise<string>;
  /** URL xem ảnh tại quán (URL ký 1 giờ); null nếu không có. */
  checkinPhotoUrl(storagePath: string): Promise<string | null>;
}

export type RpcName = keyof Rpcs;

export interface Db {
  readonly mode: 'demo' | 'supabase';
  list<T extends TableName>(table: T, opts?: ListOptions<Row<T>>): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  insert<T extends TableName>(table: T, row: Partial<Row<T>>): Promise<Row<T>>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>>;
  remove<T extends TableName>(table: T, id: string): Promise<void>;
  rpc<N extends RpcName>(name: N, args: Rpcs[N]['args']): Promise<Rpcs[N]['result']>;
  readonly files: FileStore;
  /** Người đang đăng nhập (null = khách). */
  currentUserId(): string | null;
  /** Đồng hồ: DEMO dùng mốc 22/11/2026 17:45 để khớp thiết kế. */
  now(): Date;
}
