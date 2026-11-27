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
  /** Hãng báo mã đã được dùng (DEMO: giả lập sau khi mở app hãng). */
  mark_code_used: { args: { tripId: string }; result: { trip: Trip; notification: AppNotification | null } };
  report_price: {
    args: { tripId: string; verdict?: PriceVerdict; paidAmount?: number };
    /** held: lý do điểm bị giữ (vượt giới hạn ngày, số tiền lệch quá 30%) hoặc null */
    result: { trip: Trip; pointsAwarded: number; points: number; held: string | null };
  };
  redeem_reward: { args: { rewardId: string }; result: { voucher: UserVoucher; points: number } };
  vote_public_code: { args: { publicCodeId: string; works: boolean }; result: { ok: number; bad: number } };
  mark_all_notifications_read: { args: Record<string, never>; result: { count: number } };
  /** Phát quà chào mừng FREGO20 khi đăng nhập lần đầu (không phát lại, tối đa brand.welcomeQuota suất). */
  ensure_welcome_voucher: { args: Record<string, never>; result: UserVoucher | null };
  /** Quản trị: khớp tiền nạp vào ví doanh nghiệp. */
  confirm_topup: { args: { transactionId: string }; result: { balance: number } };
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
  /** Người đang đăng nhập (null = khách). */
  currentUserId(): string | null;
  /** Đồng hồ: DEMO dùng mốc 22/11/2026 17:45 để khớp thiết kế. */
  now(): Date;
}
