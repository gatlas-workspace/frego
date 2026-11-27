/**
 * Ánh xạ tên bảng Postgres (snake_case) → kiểu dòng (camelCase).
 * Thêm bảng mới: thêm vào Tables + PRIMARY_KEYS, viết migration trong supabase/migrations.
 */
import type {
  AdBanner,
  AdBannerPublic,
  AppBanner,
  AppNotification,
  AuditLog,
  Broadcast,
  Business,
  BusinessMember,
  BusinessPublic,
  CampaignPublic,
  Campaign,
  CampaignEvent,
  CodeVote,
  Consents,
  FareTable,
  FregoCode,
  Invoice,
  LinkedAccount,
  NotificationPrefs,
  Partner,
  Place,
  PointsEntry,
  Profile,
  PublicCode,
  RecentSearch,
  Redemption,
  Referral,
  Reward,
  SavedPlace,
  ShopPhoto,
  SupportTicket,
  TicketMessage,
  Trip,
  UserVoucher,
  WalletTransaction,
} from '../types';
import type { GmailConnection, GmailReceipt } from '../receipts';

/** Số liệu tổng hợp (job hằng đêm gộp từ redemptions, trips…). Doanh nghiệp chỉ thấy số liệu tổng. */
export interface StatRow {
  id: string;
  /** "platform" | "biz:<businessId>" | "cp:<campaignId>" */
  scope: string;
  /** VD "arrivals_daily", "arrivals_by_hour", "codes_used_daily", "origin_district" */
  metric: string;
  /** "2026-11" */
  period: string;
  /** Ngày "2026-11-14", giờ "16", thứ "6", hãng "grab-car4", quận "Quận 3"… */
  key: string;
  value: number;
  sort: number;
}

export interface Tables {
  places: Place;
  fare_tables: FareTable;
  profiles: Profile;
  consents: Consents;
  notification_prefs: NotificationPrefs;
  saved_places: SavedPlace;
  recent_searches: RecentSearch;
  partners: Partner;
  linked_accounts: LinkedAccount;
  businesses: Business;
  business_members: BusinessMember;
  campaigns: Campaign;
  campaign_events: CampaignEvent;
  frego_codes: FregoCode;
  rewards: Reward;
  user_vouchers: UserVoucher;
  public_codes: PublicCode;
  code_votes: CodeVote;
  trips: Trip;
  points_ledger: PointsEntry;
  notifications: AppNotification;
  wallet_transactions: WalletTransaction;
  invoices: Invoice;
  redemptions: Redemption;
  support_tickets: SupportTicket;
  ticket_messages: TicketMessage;
  audit_logs: AuditLog;
  broadcasts: Broadcast;
  stats: StatRow;
  ad_banners: AdBanner;
  /** Kết nối Gmail. Supabase: người dùng KHÔNG đọc trực tiếp (có cột token mã hóa) — đọc qua view gmail_connections_public. */
  gmail_connections: GmailConnection;
  /** Biên nhận email đã ghi (chỉ RPC record_receipt ghi) */
  gmail_receipts: GmailReceipt;
  /** Giới thiệu bạn bè (chỉ RPC ghi; người dùng đọc dòng mình là người giới thiệu / người mới) */
  referrals: Referral;
  /** Ảnh bìa Trang chủ (QT 13). Supabase: chỉ quản trị ops đọc/ghi bảng; app đọc qua RPC active_home_cover */
  app_banners: AppBanner;
  /** Ảnh tại quán (chỉ RPC submit_shop_photo / review_shop_photo ghi) */
  shop_photos: ShopPhoto;
  /** View chỉ đọc: thông tin quán công khai */
  businesses_public: BusinessPublic;
  /** View chỉ đọc: chiến dịch công khai (không có ngân sách) */
  campaigns_public: CampaignPublic;
  /** View chỉ đọc: banner quảng cáo đã duyệt mới nhất mỗi quán */
  ad_banners_public: AdBannerPublic;
  /** View chỉ đọc: kết nối Gmail của chính người đang đăng nhập (không có token) */
  gmail_connections_public: GmailConnection;
}

export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T];

export const PRIMARY_KEYS: { [K in TableName]: keyof Tables[K] & string } = {
  places: 'id',
  fare_tables: 'id',
  profiles: 'id',
  consents: 'userId',
  notification_prefs: 'userId',
  saved_places: 'id',
  recent_searches: 'id',
  partners: 'id',
  linked_accounts: 'id',
  businesses: 'id',
  business_members: 'id',
  campaigns: 'id',
  campaign_events: 'id',
  frego_codes: 'id',
  rewards: 'id',
  user_vouchers: 'id',
  public_codes: 'id',
  code_votes: 'id',
  trips: 'id',
  points_ledger: 'id',
  notifications: 'id',
  wallet_transactions: 'id',
  invoices: 'id',
  redemptions: 'id',
  support_tickets: 'id',
  ticket_messages: 'id',
  audit_logs: 'id',
  broadcasts: 'id',
  stats: 'id',
  ad_banners: 'id',
  gmail_connections: 'userId',
  gmail_receipts: 'id',
  referrals: 'id',
  app_banners: 'id',
  shop_photos: 'id',
  businesses_public: 'id',
  campaigns_public: 'id',
  ad_banners_public: 'id',
  gmail_connections_public: 'userId',
};

/** Bảng thật (không gồm view). */
export type BaseTableName = Exclude<
  TableName,
  'businesses_public' | 'campaigns_public' | 'ad_banners_public' | 'gmail_connections_public'
>;
export type Seed = { [K in BaseTableName]: Tables[K][] };
