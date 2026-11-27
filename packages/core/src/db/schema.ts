/**
 * Ánh xạ tên bảng Postgres (snake_case) → kiểu dòng (camelCase).
 * Thêm bảng mới: thêm vào Tables + PRIMARY_KEYS, viết migration trong supabase/migrations.
 */
import type {
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
  Reward,
  SavedPlace,
  SupportTicket,
  Trip,
  UserVoucher,
  WalletTransaction,
} from '../types';

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
  audit_logs: AuditLog;
  broadcasts: Broadcast;
  stats: StatRow;
  /** View chỉ đọc: thông tin quán công khai */
  businesses_public: BusinessPublic;
  /** View chỉ đọc: chiến dịch công khai (không có ngân sách) */
  campaigns_public: CampaignPublic;
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
  audit_logs: 'id',
  broadcasts: 'id',
  stats: 'id',
  businesses_public: 'id',
  campaigns_public: 'id',
};

/** Bảng thật (không gồm view). */
export type BaseTableName = Exclude<TableName, 'businesses_public' | 'campaigns_public'>;
export type Seed = { [K in BaseTableName]: Tables[K][] };
