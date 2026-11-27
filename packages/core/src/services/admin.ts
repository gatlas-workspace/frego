/**
 * Dịch vụ Quản trị Frego — nhóm "Vận hành": tổng quan (QT 1), duyệt (QT 2), kho mã (QT 3),
 * người dùng và báo giá (QT 4), doanh nghiệp (QT 5), chiến dịch (QT 6).
 * Chạy trên Db bất kỳ (DEMO hoặc Supabase; RLS cho phép quản trị viên đọc toàn bộ).
 * Mọi chuỗi hiển thị (tiền, ngày, nhãn trạng thái) được tính ở đây; trang web chỉ việc dựng.
 *
 * Lệnh đặc quyền đi qua RPC: review_business, set_business_status, set_user_status, adjust_points.
 * Duyệt / từ chối / tạm dừng chiến dịch: cập nhật thẳng bảng campaigns (quản trị được phép) + ghi campaign_events.
 */
import { brand } from '../brand';
import { PROVIDERS, serviceShortLabel } from '../catalog';
import type { StatRow } from '../db/schema';
import type { Db } from '../db/types';
import {
  MINUS,
  formatDate,
  formatDayMonth,
  formatDiscount,
  formatMeters,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
  formatVnd,
  formatVndRange,
  initials,
  maskPhone,
  parseDateVn,
  vnParts,
} from '../format';
import type {
  AdminRole,
  AuditLog,
  Business,
  Campaign,
  CampaignEvent,
  CategoryKey,
  FareTable,
  Profile,
  ProviderId,
  PublicCode,
  PublicCodeStatus,
  Trip,
  VehicleClass,
} from '../types';

/* ───────────────────────── Kiểu dữ liệu màn hình ───────────────────────── */

export type AdminChipTone = 'green' | 'amber' | 'grey' | 'red' | 'blue' | 'orange';
/** Nhãn trạng thái (WebStatus). */
export interface AdminChip {
  text: string;
  tone: AdminChipTone;
}
/** Một tab lọc (WebTabs): key ghi vào ?tab=. */
export interface AdminTab<K extends string = string> {
  key: K;
  label: string;
  count: string;
  icon?: 'table';
}
export interface AdminFact {
  label: string;
  value: string;
}
/** Dòng kiểm tra tự động (WebCheck). */
export interface AdminCheck {
  tone: 'green' | 'amber' | 'red' | 'blue';
  title: string;
  text?: string;
}
export type AdminDeltaTone = 'good' | 'bad' | 'neutral';
export interface AdminKpi {
  key: string;
  label: string;
  value: string;
  sub: string;
  delta: string | null;
  deltaTone: AdminDeltaTone;
}

/* QT 1 · Tổng quan */

export interface OverviewBar {
  label: string;
  srLabel: string;
  value: number;
  highlight: boolean;
}
export interface OverviewMix {
  key: 'sponsor' | 'public' | 'frego';
  label: string;
  value: number;
  valueText: string;
  percent: number;
  tone: 'orange' | 'blue' | 'grey';
}
export interface OverviewTodo {
  key: string;
  icon: 'shield' | 'tag' | 'wallet' | 'receipt';
  tone: 'warn' | 'bad' | 'good' | 'info';
  title: string;
  sub: string;
  href: string | null;
}
export interface OverviewSponsor {
  id: string;
  name: string;
  href: string;
  runningText: string;
  usedText: string;
  feeText: string;
  wallet: AdminChip;
}
export interface OverviewAccuracy {
  key: string;
  providerId: ProviderId;
  label: string;
  valueText: string;
  percent: number;
  tone: 'green' | 'grey';
}
export interface AdminOverviewView {
  description: string;
  kpis: AdminKpi[];
  daily: OverviewBar[];
  dailySummary: string;
  mix: OverviewMix[];
  todo: OverviewTodo[];
  sponsors: OverviewSponsor[];
  accuracy: OverviewAccuracy[];
}

/* QT 2 · Duyệt */

export type ReviewTab = 'chien-dich' | 'doanh-nghiep';
export type ReviewKind = 'campaign' | 'business';
export interface ReviewDecision {
  state: 'approved' | 'rejected';
  chip: AdminChip;
}
export interface ReviewQueueItem {
  id: string;
  kind: ReviewKind;
  title: string;
  subtitle: string;
  category: CategoryKey;
  /** Hãng xe (chiến dịch) hoặc null (hồ sơ doanh nghiệp). */
  providerId: ProviderId | null;
  meta: string;
  timeText: string;
  chip: AdminChip;
}
export interface ReviewPreview {
  category: CategoryKey;
  title: string;
  amountText: string;
  serviceText: string;
  line: string;
  meta: string;
}
export interface ReviewDetail {
  kind: ReviewKind;
  id: string;
  title: string;
  sub: string;
  category: CategoryKey;
  /** null = đang chờ duyệt (hiện nút Duyệt / Từ chối). */
  decision: ReviewDecision | null;
  /** Chỉ chiến dịch: vé voucher "Người dùng sẽ thấy". */
  preview: ReviewPreview | null;
  facts: AdminFact[];
  /** Chỉ hồ sơ doanh nghiệp: giấy tờ đã gửi. */
  files: { icon: 'receipt' | 'camera'; text: string; ok: boolean }[];
  checks: AdminCheck[];
}
export interface ReviewPageView {
  tab: ReviewTab;
  tabs: AdminTab<ReviewTab>[];
  items: ReviewQueueItem[];
  selected: ReviewDetail | null;
  emptyText: string;
}

/* QT 3 · Kho mã công khai */

export type CodeTab = 'tat-ca' | 'dang-hien' | 'tu-an' | 'het-han' | 'cho-kiem-tra';
export interface PublicCodeRow {
  id: string;
  code: string;
  sourceText: string;
  providerId: ProviderId;
  offerText: string;
  conditionText: string;
  conditionMuted: boolean;
  checkedText: string;
  usedText: string;
  badText: string;
  badHigh: boolean;
  chip: AdminChip;
}
export interface PublicCodesView {
  tab: CodeTab;
  tabs: AdminTab<CodeTab>[];
  rows: PublicCodeRow[];
  emptyText: string;
  banks: { id: string; name: string }[];
}
export type CodeBrand = ProviderId | 'bank';
export interface AddPublicCodeInput {
  brand: CodeBrand;
  /** Khi brand = bank: ngân hàng bắt buộc và app áp dụng. */
  bankId?: string;
  bankProvider?: ProviderId;
  code: string;
  title: string;
  condition: string;
  source: string;
  /** dd/mm/yyyy, có thể bỏ trống */
  expires: string;
}
export type AddPublicCodeField = 'code' | 'title' | 'source' | 'expires' | 'bank';
export type AddPublicCodeResult =
  | { ok: true; id: string; code: string }
  | { ok: false; errors: Partial<Record<AddPublicCodeField, string>> };

/* QT 4 · Người dùng, báo giá */

export type UserTab = 'nguoi-dung' | 'bao-gia';
export interface UserRow {
  id: string;
  name: string;
  phoneText: string;
  comparesText: string;
  usedText: string;
  pointsText: string;
  chip: AdminChip;
}
export interface UserLedgerRow {
  id: string;
  deltaText: string;
  positive: boolean;
  reason: string;
  dateText: string;
}
export interface UserDetail {
  id: string;
  name: string;
  initials: string;
  sub: string;
  chip: AdminChip;
  locked: boolean;
  lockReason: string | null;
  points: number;
  facts: AdminFact[];
  ledger: UserLedgerRow[];
}
export interface AccuracyRow {
  key: string;
  providerId: ProviderId;
  label: string;
  sub: string;
  valueText: string;
  chip: AdminChip;
}
export interface PriceReportRow {
  id: string;
  title: string;
  sub: string;
  estimateText: string;
  estimateMuted: boolean;
  actualText: string;
  chip: AdminChip;
}
export interface UsersPageView {
  tab: UserTab;
  tabs: AdminTab<UserTab>[];
  query: string;
  users: UserRow[];
  selected: UserDetail | null;
  lockedNote: string | null;
  accuracy: AccuracyRow[];
  reports: PriceReportRow[];
}

/* QT 5 · Doanh nghiệp */

export type BizTab = 'tat-ca' | 'hoat-dong' | 'cho-duyet' | 'tam-khoa';
export interface BizRow {
  id: string;
  name: string;
  sub: string;
  /** "1 chạy" hoặc "chưa có" */
  campaignsText: string;
  /** Dòng phụ: "1 chờ duyệt · 1 tạm dừng" */
  campaignsSub: string;
  campaignsMuted: boolean;
  usedText: string;
  wallet: AdminChip;
  chip: AdminChip;
}
export interface BizDetail {
  id: string;
  name: string;
  sub: string;
  chip: AdminChip;
  status: Business['status'];
  facts: AdminFact[];
  campaigns: { id: string; name: string; providerId: ProviderId; chip: AdminChip }[];
  /** Ghi chú khi đang tạm khóa: "Tạm khóa 20/11, lý do …" */
  lockNote: string | null;
  /** Hồ sơ chờ duyệt → liên kết sang mục Duyệt. */
  reviewHref: string | null;
}
export interface BusinessesPageView {
  tab: BizTab;
  tabs: AdminTab<BizTab>[];
  rows: BizRow[];
  shownText: string;
  hasMore: boolean;
  total: number;
  selected: BizDetail | null;
}

/* QT 6 · Chiến dịch */

export type CampaignTab = 'tat-ca' | 'dang-chay' | 'cho-duyet' | 'tam-dung' | 'frego-dung';
export type CampaignAdminState = 'running' | 'pending' | 'paused' | 'stopped' | 'ended' | 'rejected' | 'draft';
export interface CampaignRow {
  id: string;
  name: string;
  businessName: string;
  providerId: ProviderId;
  offerText: string;
  radiusText: string;
  codesText: string;
  budgetText: string;
  budgetMuted: boolean;
  chip: AdminChip;
}
export interface CampaignDetail {
  id: string;
  name: string;
  businessName: string;
  category: CategoryKey;
  chip: AdminChip;
  state: CampaignAdminState;
  facts: AdminFact[];
  events: { key: string; time: string; text: string }[];
  canPause: boolean;
  canResume: boolean;
  /** Giải thích vì sao không có thao tác (doanh nghiệp tự dừng, đang khóa…). */
  note: string | null;
  reviewHref: string | null;
}
export interface CampaignsPageView {
  kpis: AdminKpi[];
  tab: CampaignTab;
  tabs: AdminTab<CampaignTab>[];
  rows: CampaignRow[];
  hint: string;
  page: number;
  pageCount: number;
  selected: CampaignDetail | null;
}

/* ───────────────────────── Hằng số, hàm nhỏ ───────────────────────── */

const FEE = brand.serviceFeePerCode;
/** Quyết định duyệt trong khoảng này vẫn hiện trong hàng chờ, kèm nhãn "Đã duyệt" / "Đã từ chối". */
const RECENT_DECISION_MS = 2 * 60 * 60 * 1000;
/** Hồ sơ doanh nghiệp đăng ký trong khoảng này mới tính là "Doanh nghiệp mới". */
const NEW_BUSINESS_MS = 30 * 24 * 60 * 60 * 1000;
/** Không ghi trùng nhật ký "Xem chi tiết người dùng" trong khoảng này (render lại sau thao tác). */
const VIEW_LOG_DEDUPE_MS = 10 * 60 * 1000;
const LOW_BUDGET_RATIO = 0.1;
const LOW_WALLET_DAYS = 5;
const WALLET_RED = 200000;
const WALLET_AMBER = 1000000;
const BIZ_PAGE_SIZE = 7;
const CAMPAIGN_PAGE_SIZE = 8;
const ACCURACY_GOOD = 0.75;

const EV_APPROVE = 'Frego duyệt';
const EV_REJECT = 'Frego từ chối';
const EV_STOP = 'Frego tạm dừng vì ';
const EV_RESUME = 'Frego cho chạy lại';

const VEHICLE_WEB: Record<VehicleClass, string> = { bike: 'xe máy', car4: 'ô tô 4 chỗ', car7: 'ô tô 7 chỗ' };

/** "Grab ô tô 4 chỗ", "Green SM xe máy" */
export function offerServiceLabel(providerId: ProviderId, vehicleClass: VehicleClass): string {
  return `${PROVIDERS[providerId].name} ${VEHICLE_WEB[vehicleClass]}`;
}

const t = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const trimDot = (s: string) => s.trim().replace(/[.。]+$/, '');

/** Bỏ dấu + chữ thường để tìm kiếm. */
function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function periodOf(d: Date): string {
  const p = vnParts(d);
  return `${p.year}-${String(p.month).padStart(2, '0')}`;
}
function prevPeriod(period: string): string {
  const [y, m] = period.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}
/** 00:00 ngày 1 của tháng (giờ VN) */
function monthStart(d: Date): number {
  const p = vnParts(d);
  return Date.UTC(p.year, p.month - 1, 1) - 7 * 3600 * 1000;
}

/** "+9%", "−3%" */
function deltaText(cur: number, prev: number | undefined): { delta: string | null; tone: AdminDeltaTone } {
  if (!prev) return { delta: null, tone: 'neutral' };
  const r = cur / prev - 1;
  const pct = Math.round(Math.abs(r) * 100);
  return { delta: `${r >= 0 ? '+' : MINUS}${pct}%`, tone: r >= 0 ? 'good' : 'bad' };
}

/** "+2%" / "−3%" cho độ lệch */
function signedPercent(r: number): string {
  return `${r >= 0 ? '+' : MINUS}${Math.round(Math.abs(r) * 100)}%`;
}

/** "01/12 – 31/12/2026" hoặc "01/12/2026 – 31/01/2027" */
function dateRange(from: string, to: string): string {
  const a = vnParts(from);
  const b = vnParts(to);
  return a.year === b.year ? `${formatDayMonth(from)} – ${formatDate(to)}` : `${formatDate(from)} – ${formatDate(to)}`;
}

/** "09/2026" */
function monthYear(iso: string): string {
  const p = vnParts(iso);
  return `${String(p.month).padStart(2, '0')}/${p.year}`;
}

/** "0318456789" → "0318•••789" */
function maskTax(tax: string): string {
  return tax.length > 7 ? `${tax.slice(0, 4)}•••${tax.slice(-3)}` : tax;
}

/** "Đường Lê Thánh Tôn, gần Chợ Bến Thành, Quận 1, TP.HCM" → "Lê Thánh Tôn, Quận 1" */
function shortAddress(address: string): string {
  const parts = address
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !/^gần /i.test(s) && !/^TP\.?\s?HCM$/i.test(s));
  if (parts[0]) parts[0] = parts[0].replace(/^Đường /, '');
  return parts.join(', ');
}

/** "Đường Võ Văn Tần, Quận 3, TP.HCM" → "Đường Võ Văn Tần, Quận 3" */
function storeAddress(address: string): string {
  return address.replace(/,\s*TP\.?\s?HCM$/i, '');
}

/** "Bán lẻ · Sách, văn phòng phẩm" → "Bán lẻ sách, văn phòng phẩm" */
function industryText(industry: string): string {
  const [a, b] = industry.split(' · ');
  return b ? `${a} ${lowerFirst(b)}` : a;
}
/** "Ăn uống · Cà phê" → "Ăn uống" */
const industryGroup = (industry: string) => industry.split(' · ')[0] || industry;

/** Danh từ chỉ nơi kinh doanh trong câu "quanh quán", "quanh phòng tập". */
function placeNoun(category: CategoryKey): string {
  if (category === 'gym') return 'phòng tập';
  if (category === 'book') return 'nhà sách';
  return 'quán';
}

/** ["Quận 1", "Quận 3", "Quận 7"] → "Quận 1, 3, 7" */
function compactDistricts(list: string[]): string {
  if (list.length > 1 && list.every((d) => /^Quận \d+$/.test(d))) return `Quận ${list.map((d) => d.slice(5)).join(', ')}`;
  return list.join(', ');
}

/** Số mã ví đủ trả: "hơn 200", "hơn 70" */
function roughDown(n: number): number {
  if (n >= 100) return Math.floor(n / 100) * 100;
  if (n >= 10) return Math.floor(n / 10) * 10;
  return n;
}

function walletChip(balance: number, daysLeft: number | null, spentAny: boolean): AdminChip {
  if (balance <= 0) return spentAny ? { text: 'Hết tiền', tone: 'red' } : { text: 'Chưa nạp', tone: 'grey' };
  const text = `Còn ${formatVnd(balance)}`;
  if (balance < WALLET_RED) return { text, tone: 'red' };
  if (balance < WALLET_AMBER || (daysLeft !== null && daysLeft <= LOW_WALLET_DAYS)) return { text, tone: 'amber' };
  return { text, tone: 'green' };
}

function businessChip(status: Business['status']): AdminChip {
  switch (status) {
    case 'active':
      return { text: 'Hoạt động', tone: 'green' };
    case 'pending':
      return { text: 'Chờ duyệt hồ sơ', tone: 'amber' };
    case 'locked':
      return { text: 'Tạm khóa', tone: 'red' };
    case 'rejected':
      return { text: 'Đã từ chối', tone: 'grey' };
    default:
      return { text: 'Bản nháp', tone: 'grey' };
  }
}

/* ───────────────────────── Dịch vụ ───────────────────────── */

export function createAdminService(db: Db) {
  const now = () => db.now();
  const nowIso = () => db.now().toISOString();

  async function actor(): Promise<{ name: string; role: AdminRole }> {
    const id = db.currentUserId();
    const p = id ? await db.get('profiles', id) : null;
    if (!p || p.role !== 'admin') throw new Error('Cần quyền quản trị');
    return { name: p.displayName, role: p.adminRole ?? 'ops' };
  }

  async function log(action: string): Promise<void> {
    const a = await actor();
    await db.insert('audit_logs', { actorName: a.name, actorRole: a.role, action, createdAt: nowIso() });
  }

  /** Số liệu tổng hợp của một scope, gom theo metric|period → key → value. */
  async function statsOf(scope: string) {
    const rows = await db.list('stats', { where: { scope } });
    const get = (metric: string, period: string) =>
      new Map(
        rows
          .filter((r: StatRow) => r.metric === metric && r.period === period)
          .sort((a, b) => a.sort - b.sort)
          .map((r) => [r.key, r.value] as const),
      );
    return { rows, get };
  }

  /* ───── Chiến dịch: trạng thái theo góc nhìn quản trị ───── */

  function eventsByCampaign(events: CampaignEvent[]): Map<string, CampaignEvent[]> {
    const m = new Map<string, CampaignEvent[]>();
    for (const e of [...events].sort((a, b) => t(b.at) - t(a.at))) {
      const list = m.get(e.campaignId) ?? [];
      list.push(e);
      m.set(e.campaignId, list);
    }
    return m;
  }

  /** Lý do Frego dừng (sự kiện mới nhất "Frego tạm dừng vì …") khi chiến dịch đang tạm dừng. */
  function stopReason(c: Campaign, evs: CampaignEvent[] | undefined): string | null {
    if (c.status !== 'paused' || !evs?.length) return null;
    const last = evs.find((e) => e.text.startsWith(EV_STOP) || e.text.startsWith(EV_RESUME) || /tạm dừng|chạy lại/i.test(e.text));
    if (!last || !last.text.startsWith(EV_STOP)) return null;
    return last.text.slice(EV_STOP.length).trim();
  }

  function campaignState(c: Campaign, evs: CampaignEvent[] | undefined): CampaignAdminState {
    switch (c.status) {
      case 'active':
        return 'running';
      case 'paused':
        return stopReason(c, evs) !== null ? 'stopped' : 'paused';
      default:
        return c.status;
    }
  }

  const lowBudget = (c: Campaign) => c.status === 'active' && c.budget > 0 && (c.budget - c.spent) / c.budget < LOW_BUDGET_RATIO;

  function campaignChip(c: Campaign, evs: CampaignEvent[] | undefined): AdminChip {
    const state = campaignState(c, evs);
    switch (state) {
      case 'running':
        return lowBudget(c) ? { text: 'Sắp hết ngân sách', tone: 'amber' } : { text: 'Đang chạy', tone: 'green' };
      case 'paused':
        return { text: 'Tạm dừng', tone: 'grey' };
      case 'stopped': {
        const reason = stopReason(c, evs) ?? '';
        return { text: reason && reason.length <= 18 ? `Dừng vì ${reason}` : 'Frego dừng', tone: 'red' };
      }
      case 'pending':
        return { text: 'Chờ duyệt', tone: 'amber' };
      case 'ended':
        return { text: 'Đã kết thúc', tone: 'grey' };
      case 'rejected':
        return { text: 'Từ chối', tone: 'red' };
      default:
        return { text: 'Bản nháp', tone: 'grey' };
    }
  }

  /* ───── Doanh nghiệp: số liệu tháng này ───── */

  type BizMonth = { used: number; spent: number; running: number; daysLeft: number | null; spentAny: boolean };

  function bizMonthStats(businesses: Business[], campaigns: Campaign[]): Map<string, BizMonth> {
    const start = monthStart(now());
    const day = vnParts(now()).day;
    const m = new Map<string, BizMonth>();
    for (const b of businesses) m.set(b.id, { used: 0, spent: 0, running: 0, daysLeft: null, spentAny: false });
    for (const c of campaigns) {
      const s = m.get(c.businessId);
      if (!s) continue;
      if (c.spent > 0) s.spentAny = true;
      if (c.status === 'active') s.running += 1;
      if (t(c.endsAt) < start || ['draft', 'pending', 'rejected'].includes(c.status)) continue;
      s.used += c.usedCount;
      s.spent += c.spent;
    }
    for (const b of businesses) {
      const s = m.get(b.id)!;
      if (s.running > 0 && s.spent > 0) s.daysLeft = b.walletBalance / (s.spent / Math.max(1, day));
    }
    return m;
  }

  /** Đã gửi nhắc nạp ví trong 7 ngày qua (nhật ký quản trị hoặc sự kiện chiến dịch tự động). */
  function remindedRecently(b: Business, logs: AuditLog[], events: CampaignEvent[], campaignIds: Set<string>): boolean {
    const since = now().getTime() - 7 * 86400000;
    return (
      logs.some((l) => t(l.createdAt) >= since && l.action.includes(`nhắc nạp ví cho ${b.name}`)) ||
      events.some((e) => campaignIds.has(e.campaignId) && t(e.at) >= since && /nhắc nạp/i.test(e.text))
    );
  }

  /* ───── Duyệt: quyết định gần đây ───── */

  function campaignDecision(c: Campaign, evs: CampaignEvent[] | undefined): (ReviewDecision & { at: string }) | null {
    const since = now().getTime() - RECENT_DECISION_MS;
    const ev = evs?.find((e) => e.text.startsWith(EV_APPROVE) || e.text.startsWith(EV_REJECT));
    if (!ev || t(ev.at) < since) return null;
    if (c.status === 'active' && ev.text.startsWith(EV_APPROVE)) {
      return { state: 'approved', at: ev.at, chip: { text: `Đã duyệt · ${formatRelative(ev.at, now())}`, tone: 'green' } };
    }
    if (c.status === 'rejected' && ev.text.startsWith(EV_REJECT)) {
      return { state: 'rejected', at: ev.at, chip: { text: 'Đã từ chối · đã báo doanh nghiệp', tone: 'red' } };
    }
    return null;
  }

  function businessDecision(b: Business, logs: AuditLog[]): (ReviewDecision & { at: string }) | null {
    const since = now().getTime() - RECENT_DECISION_MS;
    const l = logs.find((x) => x.action === `Duyệt doanh nghiệp ${b.name}` || x.action === `Từ chối doanh nghiệp ${b.name}`);
    if (!l || t(l.createdAt) < since) return null;
    if (b.status === 'active' && l.action.startsWith('Duyệt')) {
      return { state: 'approved', at: l.createdAt, chip: { text: `Đã duyệt · ${formatRelative(l.createdAt, now())}`, tone: 'green' } };
    }
    if (b.status === 'rejected' && l.action.startsWith('Từ chối')) {
      return { state: 'rejected', at: l.createdAt, chip: { text: 'Đã từ chối · đã báo doanh nghiệp', tone: 'red' } };
    }
    return null;
  }

  const queueChip = (d: ReviewDecision | null): AdminChip =>
    !d ? { text: 'Chờ duyệt', tone: 'amber' } : d.state === 'approved' ? { text: 'Đã duyệt', tone: 'green' } : { text: 'Đã từ chối', tone: 'red' };

  async function campaignChecks(c: Campaign, b: Business): Promise<AdminCheck[]> {
    const [st, fares, fregoCodes, publicCodes] = await Promise.all([
      db.list('stats', { where: { scope: `cp:${c.id}`, metric: 'review_check' } }),
      db.list('fare_tables', { where: { providerId: c.providerId, vehicleClass: c.vehicleClass } }),
      db.list('frego_codes', { where: { providerId: c.providerId, vehicleClass: c.vehicleClass, active: true } }),
      db.list('public_codes', { where: { providerId: c.providerId, status: 'live' } }),
    ]);
    const svc = offerServiceLabel(c.providerId, c.vehicleClass);
    const checks: AdminCheck[] = [];
    const noun = placeNoun(b.category);
    checks.push(
      b.storefrontVerified
        ? { tone: 'green', title: `Địa chỉ ${noun === 'quán' ? 'quán ' : ''}khớp vị trí trên bản đồ` }
        : { tone: 'amber', title: 'Chưa xác nhận vị trí cửa hàng', text: 'Doanh nghiệp chưa gửi ảnh mặt tiền. Vùng áp dụng tính theo địa chỉ đã khai.' },
    );
    const img = new Map(st.map((r) => [r.key, r.value]));
    if (img.has('image_width')) {
      const w = img.get('image_width')!;
      const h = img.get('image_height') ?? w;
      const bad = [img.get('image_phone') ? 'số điện thoại' : null, img.get('image_qr') ? 'mã QR' : null].filter(Boolean);
      if (bad.length) {
        checks.push({ tone: 'red', title: `Ảnh có ${bad.join(' và ')}`, text: 'Quy định không cho thông tin liên hệ trên ảnh. Nên từ chối và xin ảnh khác.' });
      } else if (w !== h) {
        checks.push({ tone: 'amber', title: `Ảnh ${w} × ${h} chưa đúng tỷ lệ vuông`, text: 'App cắt ảnh vuông, phần ngoài có thể bị mất.' });
      } else {
        checks.push({ tone: 'green', title: `Ảnh vuông ${w} × ${h}, không có số điện thoại hay mã QR` });
      }
    } else {
      checks.push({ tone: 'amber', title: 'Chưa có ảnh chiến dịch', text: 'App sẽ dùng logo theo ngành của doanh nghiệp.' });
    }
    const perCode = c.amount + FEE;
    const n = Math.floor(b.walletBalance / perCode);
    if (n <= 0) {
      checks.push({ tone: 'red', title: 'Ví chưa có tiền', text: 'Chiến dịch chỉ phát mã khi doanh nghiệp nạp ví.' });
    } else if (n < c.dailyCap * 3) {
      checks.push({
        tone: 'amber',
        title: `Ví chỉ đủ khoảng ${formatNumber(n)} mã`,
        text: 'Chiến dịch vẫn chạy và tự dừng khi ví hết. Nên nhắc doanh nghiệp nạp thêm.',
      });
    } else {
      checks.push({ tone: 'green', title: `Ví đủ cho hơn ${formatNumber(roughDown(n))} mã` });
    }
    const fare = fares.find((f: FareTable) => f.region === 'hcm');
    if (fare && !fare.enabled) {
      const name = PROVIDERS[c.providerId].name;
      checks.push({
        tone: 'amber',
        title: `${name} chưa có ước tính giá ở ${b.district}`,
        text: `Mã vẫn dùng được, nhưng app chưa so giá ${name} chính xác ở khu này.`,
      });
    }
    const frego = fregoCodes.find((f) => f.kind !== 'reward');
    const fixedPublic = publicCodes.filter((p: PublicCode) => p.amount && p.vehicleClasses.includes(c.vehicleClass));
    if (frego && frego.amount === c.amount) {
      checks.push({
        tone: 'blue',
        title: `Bằng mức giảm của ${frego.code} cho ${svc}`,
        text: `Gợi ý doanh nghiệp tăng lên ${formatVnd(c.amount + 5000)} để mã được gắn nhiều hơn.`,
      });
    } else if (frego && frego.amount > c.amount) {
      checks.push({
        tone: 'amber',
        title: `Thấp hơn mức giảm của ${frego.code} cho ${svc}`,
        text: 'Mỗi hãng chỉ gắn 1 mã mỗi chuyến, app ưu tiên mã giảm nhiều hơn.',
      });
    } else if (fixedPublic.length) {
      const best = fixedPublic.reduce((a, p) => ((p.amount ?? 0) > (a.amount ?? 0) ? p : a));
      const top = best.amount ?? 0;
      checks.push(
        c.amount >= top
          ? { tone: 'green', title: `Mức giảm ${c.amount > top ? 'cao hơn' : 'bằng'} mã công khai đang có cho ${svc}` }
          : {
              tone: 'amber',
              title: `Thấp hơn mã công khai ${best.code} cho ${svc}`,
              text: 'Mỗi hãng chỉ gắn 1 mã mỗi chuyến, app ưu tiên mã giảm nhiều hơn.',
            },
      );
    }
    return checks;
  }

  async function businessChecks(b: Business, all: Business[]): Promise<{ checks: AdminCheck[]; licenseUploaded: boolean }> {
    const st = await db.list('stats', { where: { scope: `biz:${b.id}`, metric: 'review_check' } });
    const v = new Map(st.map((r) => [r.key, r.value]));
    const checks: AdminCheck[] = [];
    if (v.has('tax_active')) {
      checks.push(
        v.get('tax_active')
          ? { tone: 'green', title: 'Mã số thuế đang hoạt động' }
          : { tone: 'red', title: 'Mã số thuế không hoạt động', text: 'Tra cứu cơ quan thuế không thấy doanh nghiệp đang hoạt động.' },
      );
    } else {
      checks.push({ tone: 'amber', title: 'Chưa tra cứu mã số thuế' });
    }
    checks.push(
      v.get('contact_verified')
        ? { tone: 'green', title: 'Email và số điện thoại đã xác minh' }
        : { tone: 'amber', title: 'Chưa xác minh email hoặc số điện thoại' },
    );
    if (v.get('license_address_match') === 0) {
      checks.push({
        tone: 'amber',
        title: 'Địa chỉ trên giấy phép khác địa chỉ cửa hàng',
        text: b.storefrontVerified
          ? 'Đã có ảnh mặt tiền xác nhận vị trí cửa hàng.'
          : 'Thường gặp khi đăng ký ở văn phòng. Cần ảnh mặt tiền cửa hàng để xác nhận vị trí.',
      });
    } else if (v.get('license_address_match') === 1) {
      checks.push({ tone: 'green', title: 'Địa chỉ trên giấy phép khớp địa chỉ cửa hàng' });
    }
    const twin = all.find((x) => x.id !== b.id && x.taxCode && x.taxCode === b.taxCode && x.status === 'active');
    if (twin) {
      checks.push({
        tone: 'blue',
        title: `Cùng mã số thuế với ${twin.name} đang hoạt động`,
        text: `Có thể là cửa hàng mới của doanh nghiệp này (${shortAddress(twin.address)}).`,
      });
    }
    return { checks, licenseUploaded: !!v.get('license_uploaded') };
  }

  /* ───────────────────────── Truy vấn và lệnh ───────────────────────── */

  const service = {
    db,

    /** QT 1 · Tổng quan hệ thống. */
    async getOverview(): Promise<AdminOverviewView> {
      const n = now();
      const period = periodOf(n);
      const prev = prevPeriod(period);
      const [st, campaigns, businesses, codes, fares, events, logs] = await Promise.all([
        statsOf('platform'),
        db.list('campaigns'),
        db.list('businesses'),
        db.list('public_codes'),
        db.list('fare_tables', { where: { region: 'hcm' } }),
        db.list('campaign_events'),
        db.list('audit_logs'),
      ]);
      const kpi = st.get('kpi', period);
      const kpiPrev = st.get('kpi', prev);
      const src = st.get('codes_used_by_source', period);
      const srcPrev = st.get('codes_used_by_source', prev);
      const daily = [...st.get('codes_used_daily', period).entries()].sort(([a], [b]) => (a < b ? -1 : 1));
      const used = sum([...src.values()]) || sum(daily.map(([, v]) => v));
      const usedPrev = sum([...srcPrev.values()]);
      const sponsor = src.get('sponsor') ?? 0;
      const active = kpi.get('active_users') ?? 0;
      const compares = kpi.get('compares') ?? 0;
      const refreshed = st.get('meta', period).get('refreshed_at');
      const [y, m] = period.split('-').map(Number);
      const description = [
        `Tháng ${m}/${y}, tính đến hết ${formatDayMonth(refreshed ?? n)}`,
        `so với cùng kỳ tháng ${Number(prev.split('-')[1])}`,
        refreshed ? `cập nhật ${formatRelative(refreshed, n)}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

      const d1 = deltaText(active, kpiPrev.get('active_users'));
      const d2 = deltaText(compares, kpiPrev.get('compares'));
      const d3 = deltaText(used, usedPrev);
      const d4 = deltaText(sponsor * FEE, (srcPrev.get('sponsor') ?? 0) * FEE);
      const kpis: AdminKpi[] = [
        { key: 'active', label: 'Người dùng hoạt động', value: formatNumber(active), sub: 'mở app ít nhất 1 lần', delta: d1.delta, deltaTone: d1.tone },
        {
          key: 'compares',
          label: 'Lượt so giá',
          value: formatNumber(compares),
          sub: active ? `${(compares / active).toFixed(1).replace('.', ',')} lượt mỗi người` : '',
          delta: d2.delta,
          deltaTone: d2.tone,
        },
        { key: 'used', label: 'Mã được dùng', value: formatNumber(used), sub: 'mọi loại mã', delta: d3.delta, deltaTone: d3.tone },
        {
          key: 'fee',
          label: 'Doanh thu phí dịch vụ',
          value: formatVnd(sponsor * FEE),
          sub: `${formatNumber(sponsor)} mã × ${formatVnd(FEE)}`,
          delta: d4.delta,
          deltaTone: d4.tone,
        },
      ];

      const maxDaily = Math.max(0, ...daily.map(([, v]) => v));
      const peak = daily.find(([, v]) => v === maxDaily);
      const lastDay = daily.length;
      const bars: OverviewBar[] = daily.map(([key, value], i) => {
        const day = i + 1;
        const dm = `${Number(key.slice(8, 10))}/${Number(key.slice(5, 7))}`;
        return {
          label: [1, 5, 10, 15, 20].includes(day) || day === lastDay ? String(day) : '',
          srLabel: dm,
          value,
          highlight: !!peak && key === peak[0],
        };
      });
      const dailySummary = peak
        ? `Mã được dùng mỗi ngày từ ${bars[0].srLabel} đến ${bars[bars.length - 1].srLabel}, cao nhất ngày ${Number(peak[0].slice(8, 10))}/${Number(peak[0].slice(5, 7))} với ${formatNumber(peak[1])} mã`
        : 'Chưa có số liệu mã được dùng tháng này';

      const mixDef: { key: OverviewMix['key']; label: string; tone: OverviewMix['tone'] }[] = [
        { key: 'sponsor', label: 'Mã tài trợ', tone: 'orange' },
        { key: 'public', label: 'Mã công khai', tone: 'blue' },
        { key: 'frego', label: 'Mã Frego, đổi điểm', tone: 'grey' },
      ];
      const mix = mixDef.map((d) => {
        const v = src.get(d.key) ?? 0;
        return { ...d, value: v, valueText: formatNumber(v), percent: used ? (v / used) * 100 : 0 };
      });

      /* Cần xử lý */
      const todo: OverviewTodo[] = [];
      const pendC = campaigns.filter((c) => c.status === 'pending').length;
      const pendB = businesses.filter((b) => b.status === 'pending').length;
      todo.push(
        pendC + pendB > 0
          ? {
              key: 'review',
              icon: 'shield',
              tone: 'warn',
              title: `${pendC + pendB} mục chờ duyệt`,
              sub: [pendC ? `${pendC} chiến dịch` : null, pendB ? `${pendB} doanh nghiệp mới` : null].filter(Boolean).join(', '),
              href: pendC ? '/quan-tri/duyet' : '/quan-tri/duyet?tab=doanh-nghiep',
            }
          : { key: 'review', icon: 'shield', tone: 'good', title: 'Không có mục chờ duyệt', sub: 'Đã xử lý hết hồ sơ và chiến dịch', href: '/quan-tri/duyet' },
      );
      for (const c of codes.filter((x) => x.status === 'hidden' && x.badReports24h >= brand.autoHideReportThreshold)) {
        todo.push({
          key: `code-${c.id}`,
          icon: 'tag',
          tone: 'bad',
          title: `Mã ${c.code} đã tự ẩn`,
          sub: `${formatNumber(c.badReports24h)} lượt báo lỗi trong 24 giờ`,
          href: '/quan-tri/kho-ma?tab=tu-an',
        });
      }
      const month = bizMonthStats(businesses, campaigns);
      const low = businesses
        .filter((b) => b.status === 'active')
        .map((b) => ({ b, s: month.get(b.id)! }))
        .filter(({ s }) => s.daysLeft !== null && s.daysLeft <= LOW_WALLET_DAYS)
        .sort((a, b) => a.s.daysLeft! - b.s.daysLeft!);
      for (const { b, s } of low) {
        const ids = new Set(campaigns.filter((c) => c.businessId === b.id).map((c) => c.id));
        const days = Math.max(0, Math.round(s.daysLeft!));
        todo.push({
          key: `wallet-${b.id}`,
          icon: 'wallet',
          tone: 'warn',
          title: `${b.name} sắp hết tiền ví`,
          sub: [`Còn ${formatVnd(b.walletBalance)}`, days < 1 ? 'dưới 1 ngày' : `khoảng ${days} ngày`, remindedRecently(b, logs, events, ids) ? 'đã nhắc nạp' : null]
            .filter(Boolean)
            .join(', '),
          href: `/quan-tri/doanh-nghiep?id=${encodeURIComponent(b.id)}`,
        });
      }
      const gaps = st.get('estimate_gap', period);
      for (const p of Object.values(PROVIDERS)) {
        const tables = fares.filter((f) => f.providerId === p.id);
        if (!tables.length || tables.some((f) => f.enabled)) continue;
        const districts = [...gaps.keys()].filter((k) => k.startsWith(`${p.id}|`)).map((k) => k.split('|')[1]);
        todo.push({
          key: `estimate-${p.id}`,
          icon: 'receipt',
          tone: 'info',
          title: `${p.name} chưa có ước tính giá`,
          sub: districts.length
            ? `Cần thêm báo giá ở ${compactDistricts(districts)}`
            : `Mới có ${formatNumber(sum(tables.map((f) => f.reportCount)))} báo giá`,
          href: '/quan-tri/nguoi-dung?tab=bao-gia',
        });
      }

      /* Doanh nghiệp tài trợ theo mã dùng tháng này */
      const sponsors: OverviewSponsor[] = businesses
        .filter((b) => b.status === 'active' || b.status === 'locked')
        .map((b) => ({ b, s: month.get(b.id)! }))
        .filter(({ s }) => s.used > 0)
        .sort((a, b) => b.s.used - a.s.used)
        .slice(0, 4)
        .map(({ b, s }) => ({
          id: b.id,
          name: b.name,
          href: `/quan-tri/doanh-nghiep?id=${encodeURIComponent(b.id)}`,
          runningText: String(s.running),
          usedText: formatNumber(s.used),
          feeText: formatVnd(s.used * FEE),
          wallet: walletChip(b.walletBalance, s.daysLeft, s.spentAny),
        }));

      /* Độ khớp giá ước tính: 3 bảng giá nhiều báo giá nhất + bảng chưa bật nhiều báo giá nhất */
      const enabled = fares
        .filter((f) => f.enabled && f.accuracy !== null)
        .sort((a, b) => b.reportCount - a.reportCount)
        .slice(0, 3)
        .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0));
      const off = fares.filter((f) => !f.enabled).sort((a, b) => b.reportCount - a.reportCount)[0];
      const accuracy: OverviewAccuracy[] = [...enabled, ...(off ? [off] : [])].map((f) => ({
        key: f.id,
        providerId: f.providerId,
        label: offerServiceLabel(f.providerId, f.vehicleClass),
        valueText: f.enabled && f.accuracy !== null ? formatPercent(f.accuracy) : 'Chưa bật',
        percent: f.enabled && f.accuracy !== null ? f.accuracy * 100 : 0,
        tone: f.enabled ? 'green' : 'grey',
      }));

      return { description, kpis, daily: bars, dailySummary, mix, todo, sponsors, accuracy };
    },

    /* ───── QT 2 · Duyệt ───── */

    async getReviewPage(opts: { tab?: string; id?: string } = {}): Promise<ReviewPageView> {
      const n = now();
      const [campaigns, businesses, events, logs] = await Promise.all([
        db.list('campaigns'),
        db.list('businesses'),
        db.list('campaign_events'),
        db.list('audit_logs', { order: { column: 'createdAt', ascending: false } }),
      ]);
      const bizById = new Map(businesses.map((b) => [b.id, b]));
      const evs = eventsByCampaign(events);

      const campItems = campaigns
        .map((c) => ({ c, d: c.status === 'pending' ? null : campaignDecision(c, evs.get(c.id)) }))
        .filter(({ c, d }) => (c.status === 'pending' || d) && bizById.has(c.businessId))
        .sort((a, b) => t(b.c.submittedAt ?? b.c.createdAt) - t(a.c.submittedAt ?? a.c.createdAt));
      const bizItems = businesses
        .map((b) => ({ b, d: b.status === 'pending' ? null : businessDecision(b, logs) }))
        .filter(({ b, d }) => b.status === 'pending' || (d && n.getTime() - t(b.joinedAt) <= NEW_BUSINESS_MS))
        .sort((a, b) => t(b.b.joinedAt) - t(a.b.joinedAt));

      const tabs: AdminTab<ReviewTab>[] = [
        { key: 'chien-dich', label: 'Chiến dịch', count: String(campItems.filter((x) => !x.d).length) },
        { key: 'doanh-nghiep', label: 'Doanh nghiệp mới', count: String(bizItems.filter((x) => !x.d).length) },
      ];
      const tab: ReviewTab = opts.tab === 'doanh-nghiep' ? 'doanh-nghiep' : 'chien-dich';

      const items: ReviewQueueItem[] =
        tab === 'chien-dich'
          ? campItems.map(({ c, d }) => {
              const b = bizById.get(c.businessId)!;
              return {
                id: c.id,
                kind: 'campaign',
                title: c.name,
                subtitle: b.name,
                category: b.category,
                providerId: c.providerId,
                meta: `${offerServiceLabel(c.providerId, c.vehicleClass)} · ${formatDiscount(c.amount)}`,
                timeText: formatRelative(c.submittedAt ?? c.createdAt, n),
                chip: queueChip(d),
              };
            })
          : bizItems.map(({ b, d }) => ({
              id: b.id,
              kind: 'business',
              title: 'Đăng ký doanh nghiệp',
              subtitle: b.name,
              category: b.category,
              providerId: null,
              meta: 'Hồ sơ doanh nghiệp mới',
              timeText: formatRelative(b.joinedAt, n),
              chip: queueChip(d),
            }));

      const pick = items.find((i) => i.id === opts.id) ?? items[0];
      let selected: ReviewDetail | null = null;
      if (pick && pick.kind === 'campaign') {
        const { c, d } = campItems.find((x) => x.c.id === pick.id)!;
        const b = bizById.get(c.businessId)!;
        const noun = placeNoun(b.category);
        const img = await db.list('stats', { where: { scope: `cp:${c.id}`, metric: 'review_check' } });
        selected = {
          kind: 'campaign',
          id: c.id,
          title: `${b.name} · ${c.name}`,
          sub: `Gửi ${formatRelative(c.submittedAt ?? c.createdAt, n)}`,
          category: b.category,
          decision: d ? { state: d.state, chip: d.chip } : null,
          preview: {
            category: b.category,
            title: b.name,
            amountText: formatDiscount(c.amount),
            serviceText: serviceShortLabel(c.providerId, c.vehicleClass),
            line: `Tặng riêng cho bạn. Điểm đến trong vùng ${formatMeters(c.radiusM)} quanh ${noun}.`,
            meta: c.imageUrl || img.length ? 'Ảnh do doanh nghiệp tải lên' : 'Chưa có ảnh, app dùng logo theo ngành',
          },
          facts: [
            { label: 'Hãng và loại xe', value: offerServiceLabel(c.providerId, c.vehicleClass) },
            { label: 'Mức giảm', value: `${formatVnd(c.amount)} mỗi chuyến` },
            { label: 'Vùng áp dụng', value: `${formatMeters(c.radiusM)} quanh ${noun}` },
            { label: 'Thời gian', value: dateRange(c.startsAt, c.endsAt) },
            { label: 'Khung giờ', value: `${c.hoursFrom} – ${c.hoursTo} mỗi ngày` },
            { label: 'Ngân sách', value: formatVnd(c.budget) },
            { label: 'Ví hiện có', value: formatVnd(b.walletBalance) },
          ],
          files: [],
          checks: await campaignChecks(c, b),
        };
      } else if (pick) {
        const { b, d } = bizItems.find((x) => x.b.id === pick.id)!;
        const { checks, licenseUploaded } = await businessChecks(b, businesses);
        selected = {
          kind: 'business',
          id: b.id,
          title: `${b.name} · Đăng ký doanh nghiệp`,
          sub: `Gửi ${formatRelative(b.joinedAt, n)}`,
          category: b.category,
          decision: d ? { state: d.state, chip: d.chip } : null,
          preview: null,
          facts: [
            { label: 'Tên trên giấy phép', value: b.legalName || b.name },
            { label: 'Mã số thuế', value: b.taxCode ? maskTax(b.taxCode) : 'Chưa khai' },
            { label: 'Người đại diện', value: b.representative || 'Chưa khai' },
            { label: 'Địa chỉ cửa hàng', value: storeAddress(b.address) || 'Chưa khai' },
            { label: 'Ngành', value: industryText(b.industry) || 'Chưa khai' },
          ],
          files: [
            { icon: 'receipt', text: licenseUploaded ? 'Giấy phép kinh doanh.pdf' : 'Chưa có giấy phép', ok: licenseUploaded },
            { icon: 'camera', text: b.storefrontVerified ? 'Ảnh mặt tiền' : 'Chưa có ảnh mặt tiền', ok: b.storefrontVerified },
          ],
          checks,
        };
      }
      return {
        tab,
        tabs,
        items,
        selected,
        emptyText: tab === 'chien-dich' ? 'Không còn chiến dịch nào chờ duyệt.' : 'Không có hồ sơ doanh nghiệp mới.',
      };
    },

    async approveCampaign(id: string): Promise<void> {
      const c = await db.get('campaigns', id);
      if (!c) throw new Error('Không tìm thấy chiến dịch');
      if (c.status !== 'pending') throw new Error('Chiến dịch không còn chờ duyệt');
      const b = await db.get('businesses', c.businessId);
      const at = nowIso();
      await db.update('campaigns', id, { status: 'active', approvedAt: at, rejectReason: null });
      const text =
        t(c.startsAt) > now().getTime() ? `${EV_APPROVE}, bắt đầu chạy từ ${formatDayMonth(c.startsAt)}` : `${EV_APPROVE}, chạy ngay`;
      await db.insert('campaign_events', { campaignId: id, at, text });
      await log(`Duyệt chiến dịch ${c.name}, ${b?.name ?? ''}`.replace(/, $/, ''));
    },

    async rejectCampaign(id: string, reason: string): Promise<void> {
      const why = trimDot(reason);
      if (!why) throw new Error('Cần lý do từ chối');
      const c = await db.get('campaigns', id);
      if (!c) throw new Error('Không tìm thấy chiến dịch');
      if (c.status !== 'pending') throw new Error('Chiến dịch không còn chờ duyệt');
      const b = await db.get('businesses', c.businessId);
      const at = nowIso();
      await db.update('campaigns', id, { status: 'rejected', rejectReason: `${lowerFirst(why)}.` });
      await db.insert('campaign_events', { campaignId: id, at, text: `${EV_REJECT}, lý do: ${lowerFirst(why)}.` });
      await log(`Từ chối chiến dịch ${c.name}, ${b?.name ?? ''}: ${lowerFirst(why)}`);
    },

    async approveBusiness(id: string): Promise<void> {
      const b = await db.get('businesses', id);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      if (b.status !== 'pending') throw new Error('Hồ sơ không còn chờ duyệt');
      await db.rpc('review_business', { businessId: id, approve: true });
    },

    async rejectBusiness(id: string, reason: string): Promise<void> {
      const why = trimDot(reason);
      if (!why) throw new Error('Cần lý do từ chối');
      const b = await db.get('businesses', id);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      if (b.status !== 'pending') throw new Error('Hồ sơ không còn chờ duyệt');
      await db.rpc('review_business', { businessId: id, approve: false, reason: why });
      await log(`Gửi lý do từ chối cho ${b.name}: ${lowerFirst(why)}`);
    },

    /* ───── QT 3 · Kho mã công khai ───── */

    async getPublicCodes(opts: { tab?: string } = {}): Promise<PublicCodesView> {
      const n = now();
      const [codes, partners] = await Promise.all([db.list('public_codes'), db.list('partners', { order: { column: 'sortOrder' } })]);
      const pName = new Map(partners.map((p) => [p.id, p.name]));
      const tabStatus: Record<CodeTab, PublicCodeStatus | null> = {
        'tat-ca': null,
        'dang-hien': 'live',
        'tu-an': 'hidden',
        'het-han': 'expired',
        'cho-kiem-tra': 'checking',
      };
      const tab: CodeTab = opts.tab && opts.tab in tabStatus ? (opts.tab as CodeTab) : 'tat-ca';
      const label: Record<CodeTab, string> = {
        'tat-ca': 'Tất cả',
        'dang-hien': 'Đang hiện',
        'tu-an': 'Tự ẩn',
        'het-han': 'Hết hạn',
        'cho-kiem-tra': 'Chờ kiểm tra',
      };
      const tabs = (Object.keys(tabStatus) as CodeTab[]).map((k) => ({
        key: k,
        label: label[k],
        count: String(codes.filter((c) => !tabStatus[k] || c.status === tabStatus[k]).length),
      }));
      const rank: Record<PublicCodeStatus, number> = { checking: 0, live: 1, hidden: 2, expired: 3 };
      const rows = codes
        .filter((c) => !tabStatus[tab] || c.status === tabStatus[tab])
        .sort((a, b) => rank[a.status] - rank[b.status] || (a.status === 'checking' ? t(b.createdAt) - t(a.createdAt) : t(a.createdAt) - t(b.createdAt)))
        .map((c): PublicCodeRow => {
          let cond: string;
          if (c.status === 'expired' && c.expiresAt) cond = `Hết hạn ${formatDate(c.expiresAt)}`;
          else {
            const parts = [c.requiresPartnerId ? `Thẻ ${pName.get(c.requiresPartnerId) ?? c.requiresPartnerId}` : null, c.notes[0] ?? null].filter(Boolean);
            cond = parts.length ? parts.join(' · ') : (c.conditions[0] ?? '');
          }
          const high = c.badReports24h >= brand.autoHideReportThreshold;
          const chip: AdminChip =
            c.status === 'live'
              ? { text: 'Đang hiện', tone: 'green' }
              : c.status === 'hidden'
                ? high
                  ? { text: 'Tự ẩn · báo lỗi', tone: 'red' }
                  : { text: 'Đã ẩn', tone: 'grey' }
                : c.status === 'expired'
                  ? { text: 'Hết hạn', tone: 'grey' }
                  : { text: 'Chờ kiểm tra', tone: 'amber' };
          return {
            id: c.id,
            code: c.code,
            sourceText: `Nguồn: ${c.sourceName}`,
            providerId: c.providerId,
            offerText: c.title,
            conditionText: cond || 'Chưa nhập',
            conditionMuted: true,
            checkedText: c.status === 'checking' ? 'đang kiểm tra' : formatRelative(c.lastCheckedAt, n),
            usedText: formatNumber(c.usedCount),
            badText: formatNumber(c.badReports24h),
            badHigh: high,
            chip,
          };
        });
      return {
        tab,
        tabs,
        rows,
        emptyText: 'Không có mã nào ở trạng thái này.',
        banks: partners.filter((p) => p.kind === 'bank').map((p) => ({ id: p.id, name: p.name })),
      };
    },

    /** Thêm mã công khai (trạng thái "Chờ kiểm tra"; chỉ hiện trên app sau khi kiểm tra xong). */
    async addPublicCode(input: AddPublicCodeInput): Promise<AddPublicCodeResult> {
      const errors: Partial<Record<AddPublicCodeField, string>> = {};
      const code = input.code.trim().toUpperCase().replace(/\s+/g, '');
      const title = input.title.trim();
      const source = input.source.trim();
      const condition = input.condition.trim();
      if (!/^[A-Z0-9]{3,20}$/.test(code)) errors.code = 'Mã gồm 3–20 chữ cái không dấu hoặc số.';
      if (!title) errors.title = 'Nhập ưu đãi, VD: Giảm 25.000đ GrabCar từ 120.000đ.';
      if (!source) errors.source = 'Nhập nguồn để Frego mở ra kiểm tra.';
      let expiresAt: string | null = null;
      if (input.expires.trim()) {
        const d = parseDateVn(input.expires);
        if (!d) errors.expires = 'Ngày theo dạng dd/mm/yyyy.';
        else {
          const end = new Date(d.getTime() + (23 * 60 + 59) * 60000);
          if (end.getTime() < now().getTime()) errors.expires = 'Hạn dùng đã qua.';
          else expiresAt = end.toISOString();
        }
      }
      let providerId: ProviderId = input.brand === 'bank' ? (input.bankProvider ?? 'grab') : input.brand;
      if (!PROVIDERS[providerId]) providerId = 'grab';
      let partnerId: string | null = null;
      if (input.brand === 'bank') {
        const p = input.bankId ? await db.get('partners', input.bankId) : null;
        if (!p || p.kind !== 'bank') errors.bank = 'Chọn ngân hàng của mã.';
        else partnerId = p.id;
      }
      if (!errors.code) {
        const same = await db.list('public_codes', { where: { code } });
        if (same.some((c) => c.status !== 'expired')) errors.code = 'Mã này đã có trong kho.';
      }
      if (Object.keys(errors).length) return { ok: false, errors };

      const money = (re: RegExp) => {
        const m = re.exec(title);
        return m ? Number(m[1].replace(/[.,]/g, '')) : null;
      };
      const pct = /(\d+(?:[.,]\d+)?)\s*%/.exec(title);
      const percent = pct ? Number(pct[1].replace(',', '.')) / 100 : null;
      const vehicles: VehicleClass[] = [];
      if (/bike|xe máy/i.test(title)) vehicles.push('bike');
      if (/car|ô tô|taxi/i.test(title)) vehicles.push('car4');
      const at = nowIso();
      const row = await db.insert('public_codes', {
        code,
        providerId,
        vehicleClasses: vehicles.length ? vehicles : ['bike', 'car4'],
        title,
        amount: percent ? null : money(/giảm\s+([\d.,]+)\s*đ/i),
        percent,
        maxAmount: money(/tối đa\s+([\d.,]+)\s*đ/i),
        minFare: money(/từ\s+([\d.,]+)\s*đ/i),
        requiresPartnerId: partnerId,
        airportOnly: /sân bay/i.test(`${title} ${condition}`),
        notes: condition ? [condition] : [],
        conditions: condition ? [condition] : [],
        sourceName: source.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        sourceUrl: /^https?:\/\//.test(source) ? source : `https://${source}`,
        sourceTitle: '',
        lastCheckedAt: at,
        expiresAt,
        status: 'checking',
        okReports24h: 0,
        badReports24h: 0,
        usedCount: 0,
        createdAt: at,
      });
      await log(`Thêm mã công khai ${code}, chờ kiểm tra`);
      return { ok: true, id: row.id, code };
    },

    /* ───── QT 4 · Người dùng, báo giá ───── */

    async getUsersPage(opts: { tab?: string; q?: string; id?: string } = {}): Promise<UsersPageView> {
      const n = now();
      const period = periodOf(n);
      const tab: UserTab = opts.tab === 'bao-gia' ? 'bao-gia' : 'nguoi-dung';
      const query = (opts.q ?? '').trim();
      const [profiles, members, trips, st, fares] = await Promise.all([
        db.list('profiles', { order: { column: 'createdAt' } }),
        db.list('business_members'),
        db.list('trips'),
        statsOf('platform'),
        db.list('fare_tables', { where: { region: 'hcm' } }),
      ]);
      const memberIds = new Set(members.map((m) => m.userId).filter(Boolean));
      const all = profiles.filter((p) => p.role === 'user' && !memberIds.has(p.id));
      const kpi = st.get('kpi', period);
      const compares30 = st.get('user_compares_30d', period);
      const since30 = n.getTime() - 30 * 86400000;
      const comparesOf = (p: Profile) => compares30.get(p.id) ?? trips.filter((x) => x.userId === p.id && t(x.createdAt) >= since30).length;
      const reported = trips.filter((x) => x.status === 'reported' && x.reportedAt);
      const tabs: AdminTab<UserTab>[] = [
        { key: 'nguoi-dung', label: 'Người dùng', count: formatNumber(kpi.get('users_total') ?? all.length) },
        { key: 'bao-gia', label: 'Báo giá', count: formatNumber(kpi.get('price_reports') ?? reported.length) },
      ];

      const fq = fold(query);
      const digits = query.replace(/\D/g, '');
      const list = query
        ? all.filter((p) => fold(p.displayName).includes(fq) || (digits.length >= 3 && p.phone.replace(/\D/g, '').endsWith(digits)))
        : all;
      const userChip = (p: Profile): AdminChip =>
        p.status === 'locked' ? { text: 'Tạm khóa', tone: 'red' } : comparesOf(p) === 0 ? { text: 'Ít dùng', tone: 'grey' } : { text: 'Hoạt động', tone: 'green' };
      const users: UserRow[] = list.map((p) => ({
        id: p.id,
        name: p.displayName,
        phoneText: maskPhone(p.phone),
        comparesText: formatNumber(comparesOf(p)),
        usedText: formatNumber(p.savedCount),
        pointsText: formatNumber(p.points),
        chip: userChip(p),
      }));
      const locked = list.filter((p) => p.status === 'locked');
      const lockedNote = locked.length
        ? locked
            .map((p) => (p.lockReason ? `${p.displayName} bị tạm khóa vì ${lowerFirst(trimDot(p.lockReason))}.` : `${p.displayName} đang bị tạm khóa.`))
            .join(' ')
        : null;

      let selected: UserDetail | null = null;
      const pick = (opts.id ? all.find((p) => p.id === opts.id) : undefined) ?? list[0];
      if (tab === 'nguoi-dung' && pick) {
        const [linked, partners, ledger] = await Promise.all([
          db.list('linked_accounts', { where: { userId: pick.id } }),
          db.list('partners', { order: { column: 'sortOrder' } }),
          db.list('points_ledger', { where: { userId: pick.id }, order: { column: 'createdAt', ascending: false }, limit: 4 }),
        ]);
        const pName = new Map(partners.map((p) => [p.id, p]));
        const linkedNames = linked
          .map((l) => pName.get(l.partnerId))
          .filter((p): p is NonNullable<typeof p> => !!p)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => p.name);
        const waiting = trips
          .filter((x) => x.userId === pick.id && x.status === 'code_used')
          .sort((a, b) => t(b.createdAt) - t(a.createdAt))[0];
        selected = {
          id: pick.id,
          name: pick.displayName,
          initials: initials(pick.displayName),
          sub: `${maskPhone(pick.phone)} · từ ${monthYear(pick.createdAt)}`,
          chip: pick.status === 'locked' ? { text: 'Tạm khóa', tone: 'red' } : { text: 'Hoạt động', tone: 'green' },
          locked: pick.status === 'locked',
          lockReason: pick.lockReason,
          points: pick.points,
          facts: [
            { label: 'Điểm', value: formatNumber(pick.points) },
            {
              label: 'Đã tiết kiệm',
              value: pick.savedCount ? `${formatVnd(pick.savedAmount)} nhờ ${formatNumber(pick.savedCount)} mã` : 'Chưa dùng mã nào',
            },
            { label: 'Đã liên kết', value: linkedNames.length ? linkedNames.join(', ') : 'Chưa liên kết' },
            {
              label: 'Chưa báo giá',
              value: waiting ? `${waiting.originLabel} → ${waiting.destLabel}, ${formatDayMonth(waiting.createdAt)}` : 'Không có chuyến nào',
            },
            ...(pick.status === 'locked' && pick.lockReason ? [{ label: 'Lý do khóa', value: trimDot(pick.lockReason) }] : []),
          ],
          ledger: ledger.map((e) => ({
            id: e.id,
            deltaText: `${e.delta >= 0 ? '+' : MINUS}${formatNumber(Math.abs(e.delta))}`,
            positive: e.delta >= 0,
            reason: e.reason,
            dateText: formatDayMonth(e.createdAt),
          })),
        };
      }

      /* Tab Báo giá */
      const minReports = brand.minReportsToEnableEstimate;
      const accuracy: AccuracyRow[] = [
        ...fares.filter((f) => f.enabled && f.accuracy !== null).sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)),
        ...fares.filter((f) => !f.enabled && f.reportCount >= minReports).sort((a, b) => b.reportCount - a.reportCount),
      ].map((f) => ({
        key: f.id,
        providerId: f.providerId,
        label: offerServiceLabel(f.providerId, f.vehicleClass),
        sub: f.enabled
          ? `${formatNumber(f.reportCount)} báo giá${f.medianBias !== null ? ` · lệch giữa ${signedPercent(f.medianBias)}` : ''}`
          : `${formatNumber(f.reportCount)} báo giá, chưa đủ ở khu nào`,
        valueText: f.enabled && f.accuracy !== null ? formatPercent(f.accuracy) : '—',
        chip: !f.enabled
          ? { text: 'Chưa bật', tone: 'grey' }
          : (f.accuracy ?? 0) >= ACCURACY_GOOD
            ? { text: 'Đang dùng', tone: 'green' }
            : { text: 'Cần thêm dữ liệu', tone: 'amber' },
      }));
      const sourceLabel: Record<NonNullable<Trip['reportSource']>, string> = { tap: 'một chạm', amount: 'nhập số tiền', receipt: 'email' };
      const verdictText = { cheaper: 'Rẻ hơn', within: 'Đúng khoảng', pricier: 'Đắt hơn' } as const;
      const reports: PriceReportRow[] = reported
        .sort((a, b) => t(b.reportedAt) - t(a.reportedAt))
        .slice(0, 8)
        .map((x) => {
          const svc = x.chosenService ? x.chosenService.split('-') : null;
          const svcText = svc ? serviceShortLabel(svc[0] as ProviderId, svc[1] as VehicleClass) : 'Chưa chọn hãng';
          const hasEst = x.estimateLow !== null && x.estimateHigh !== null;
          let verdict = x.verdict;
          if (!verdict && hasEst && x.paidAmount !== null) {
            verdict = x.paidAmount < x.estimateLow! ? 'cheaper' : x.paidAmount > x.estimateHigh! ? 'pricier' : 'within';
          }
          const chip: AdminChip = !hasEst
            ? { text: 'Thêm dữ liệu', tone: 'blue' }
            : verdict === 'cheaper'
              ? { text: 'Lệch dưới', tone: 'amber' }
              : verdict === 'pricier'
                ? { text: 'Lệch trên', tone: 'red' }
                : { text: 'Trong khoảng', tone: 'green' };
          return {
            id: x.id,
            title: `${x.originLabel} → ${x.destLabel}`,
            sub: [svcText, `${formatDayMonth(x.createdAt)} ${formatTime(x.createdAt)}`, x.reportSource ? sourceLabel[x.reportSource] : null]
              .filter(Boolean)
              .join(' · '),
            estimateText: hasEst ? formatVndRange(x.estimateLow!, x.estimateHigh!) : 'chưa có',
            estimateMuted: !hasEst,
            actualText: x.paidAmount !== null ? formatVnd(x.paidAmount) : verdict ? verdictText[verdict] : '—',
            chip,
          };
        });

      return { tab, tabs, query, users, selected, lockedNote, accuracy, reports };
    },

    /** Ghi nhật ký mỗi lần mở chi tiết người dùng (bỏ qua nếu vừa ghi cho cùng người trong 10 phút). */
    async recordUserView(userId: string): Promise<void> {
      const p = await db.get('profiles', userId);
      if (!p) return;
      const a = await actor();
      const action = `Xem chi tiết người dùng ${p.displayName}`;
      const recent = await db.list('audit_logs', { where: { action, actorName: a.name }, order: { column: 'createdAt', ascending: false }, limit: 1 });
      if (recent[0] && now().getTime() - t(recent[0].createdAt) < VIEW_LOG_DEDUPE_MS) return;
      await db.insert('audit_logs', { actorName: a.name, actorRole: a.role, action, createdAt: nowIso() });
    },

    /** Cộng / trừ điểm thủ công (RPC adjust_points ghi sổ điểm và nhật ký). */
    async adjustPoints(userId: string, delta: number, reason: string): Promise<{ points: number }> {
      const why = reason.trim();
      if (!Number.isInteger(delta) || delta === 0) throw new Error('Số điểm phải là số nguyên khác 0');
      if (Math.abs(delta) > 10000) throw new Error('Mỗi lần điều chỉnh tối đa 10.000 điểm');
      if (!why) throw new Error('Cần lý do điều chỉnh');
      const p = await db.get('profiles', userId);
      if (!p) throw new Error('Không tìm thấy người dùng');
      if (p.points + delta < 0) throw new Error(`Người dùng chỉ còn ${formatNumber(p.points)} điểm`);
      return db.rpc('adjust_points', { userId, delta, reason: why });
    },

    async setUserLocked(userId: string, locked: boolean, reason?: string): Promise<void> {
      const why = trimDot(reason ?? '');
      if (locked && !why) throw new Error('Cần lý do tạm khóa');
      await db.rpc('set_user_status', { userId, status: locked ? 'locked' : 'active', reason: locked ? why : undefined });
    },

    /* ───── QT 5 · Doanh nghiệp ───── */

    async getBusinessesPage(opts: { tab?: string; id?: string; all?: boolean } = {}): Promise<BusinessesPageView> {
      const n = now();
      const [businesses, campaigns, events, logs] = await Promise.all([
        db.list('businesses'),
        db.list('campaigns'),
        db.list('campaign_events'),
        db.list('audit_logs', { order: { column: 'createdAt', ascending: false } }),
      ]);
      const evs = eventsByCampaign(events);
      const month = bizMonthStats(businesses, campaigns);
      const filter: Record<BizTab, (b: Business) => boolean> = {
        'tat-ca': () => true,
        'hoat-dong': (b) => b.status === 'active',
        'cho-duyet': (b) => b.status === 'pending',
        'tam-khoa': (b) => b.status === 'locked',
      };
      const label: Record<BizTab, string> = { 'tat-ca': 'Tất cả', 'hoat-dong': 'Đang hoạt động', 'cho-duyet': 'Chờ duyệt hồ sơ', 'tam-khoa': 'Tạm khóa' };
      const tab: BizTab = opts.tab && opts.tab in filter ? (opts.tab as BizTab) : 'tat-ca';
      const tabs = (Object.keys(filter) as BizTab[]).map((k) => ({
        key: k,
        label: label[k],
        count: formatNumber(businesses.filter(filter[k]).length),
        ...(k === 'tat-ca' ? { icon: 'table' as const } : {}),
      }));
      const inTab = businesses
        .filter(filter[tab])
        .sort((a, b) => month.get(b.id)!.used - month.get(a.id)!.used || a.name.localeCompare(b.name, 'vi'));
      const shown = opts.all ? inTab : inTab.slice(0, BIZ_PAGE_SIZE);

      const campaignsOf = (id: string) => campaigns.filter((c) => c.businessId === id);
      /** ["1 chạy", "1 chờ duyệt", "1 tạm dừng"]: số chạy lên dòng chính, phần còn lại xuống dòng phụ. */
      const campaignSummary = (id: string) => {
        const states = campaignsOf(id).map((c) => campaignState(c, evs.get(c.id)));
        const count = (s: CampaignAdminState) => states.filter((x) => x === s).length;
        return [
          count('running') ? `${count('running')} chạy` : null,
          count('pending') ? `${count('pending')} chờ duyệt` : null,
          count('paused') ? `${count('paused')} tạm dừng` : null,
          count('stopped') ? `${count('stopped')} đã dừng` : null,
        ].filter((x): x is string => !!x);
      };
      const rows: BizRow[] = shown.map((b) => {
        const s = month.get(b.id)!;
        const [main, ...rest] = campaignSummary(b.id);
        return {
          id: b.id,
          name: b.name,
          sub: `${b.district} · ${industryGroup(b.industry)}`,
          campaignsText: main ?? 'chưa có',
          campaignsSub: rest.join(' · '),
          campaignsMuted: !main,
          usedText: formatNumber(s.used),
          wallet: walletChip(b.walletBalance, s.daysLeft, s.spentAny),
          chip: businessChip(b.status),
        };
      });

      let selected: BizDetail | null = null;
      const pick = (opts.id ? businesses.find((b) => b.id === opts.id) : undefined) ?? shown[0];
      if (pick) {
        const s = month.get(pick.id)!;
        const legal = /^hộ kinh doanh/i.test(pick.legalName) ? 'hộ kinh doanh' : /^công ty/i.test(pick.legalName) ? 'công ty' : '';
        const h = pick.openHours;
        const hours = h.weekdays === h.saturday && h.weekdays === h.sunday ? h.weekdays : `${h.weekdays} (T2–T6), ${h.saturday} (T7), ${h.sunday} (CN)`;
        const order: CampaignAdminState[] = ['running', 'pending', 'paused', 'stopped'];
        const lockLog = pick.status === 'locked' ? logs.find((l) => l.action.startsWith(`Tạm khóa ${pick.name}`)) : undefined;
        const lockReason = lockLog?.action.split(', lý do ')[1];
        selected = {
          id: pick.id,
          name: pick.name,
          sub: [`Tham gia ${monthYear(pick.joinedAt)}`, legal].filter(Boolean).join(' · '),
          chip: businessChip(pick.status),
          status: pick.status,
          facts: [
            { label: 'Địa chỉ', value: shortAddress(pick.address) || 'Chưa khai' },
            { label: 'Giờ mở cửa', value: hours },
            { label: 'Số dư ví', value: formatVnd(pick.walletBalance) },
            { label: `Đã chi tháng ${vnParts(n).month}`, value: formatVnd(s.spent) },
            { label: 'Phí dịch vụ', value: formatVnd(s.used * FEE) },
          ],
          campaigns: campaignsOf(pick.id)
            .map((c) => ({ c, st: campaignState(c, evs.get(c.id)) }))
            .filter(({ st }) => order.includes(st))
            .sort((a, b) => order.indexOf(a.st) - order.indexOf(b.st))
            .map(({ c }) => ({ id: c.id, name: c.name, providerId: c.providerId, chip: campaignChip(c, evs.get(c.id)) })),
          lockNote:
            pick.status === 'locked'
              ? lockLog
                ? `Tạm khóa ${formatDayMonth(lockLog.createdAt)}${lockReason ? `, lý do ${lockReason}` : ''}. Chiến dịch đang chạy đã dừng.`
                : 'Doanh nghiệp đang bị tạm khóa, chiến dịch không phát mã.'
              : null,
          reviewHref: pick.status === 'pending' ? `/quan-tri/duyet?tab=doanh-nghiep&id=${encodeURIComponent(pick.id)}` : null,
        };
      }
      const total = inTab.length;
      return {
        tab,
        tabs,
        rows,
        total,
        hasMore: shown.length < total,
        shownText: `Hiển thị ${formatNumber(shown.length)} trong ${formatNumber(total)} doanh nghiệp.`,
        selected,
      };
    },

    /** Gửi email nhắc nạp ví (bản này chỉ ghi nhận vào nhật ký, chưa tích hợp email). */
    async remindTopup(businessId: string): Promise<{ name: string }> {
      const b = await db.get('businesses', businessId);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      if (b.status !== 'active') throw new Error('Doanh nghiệp không hoạt động');
      await log(`Gửi email nhắc nạp ví cho ${b.name}`);
      return { name: b.name };
    },

    /** Tạm khóa (dừng mọi chiến dịch đang chạy) hoặc mở khóa doanh nghiệp, qua RPC set_business_status. */
    async setBusinessLocked(businessId: string, locked: boolean, reason?: string): Promise<void> {
      const why = trimDot(reason ?? '');
      if (locked && !why) throw new Error('Cần lý do tạm khóa');
      const b = await db.get('businesses', businessId);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      if (locked && b.status !== 'active') throw new Error('Chỉ tạm khóa doanh nghiệp đang hoạt động');
      if (!locked && b.status !== 'locked') throw new Error('Doanh nghiệp không bị khóa');
      const running = locked ? await db.list('campaigns', { where: { businessId, status: 'active' } }) : [];
      await db.rpc('set_business_status', { businessId, status: locked ? 'locked' : 'active', reason: locked ? lowerFirst(why) : undefined });
      const at = nowIso();
      for (const c of running) await db.insert('campaign_events', { campaignId: c.id, at, text: `${EV_STOP}doanh nghiệp bị tạm khóa` });
    },

    /* ───── QT 6 · Chiến dịch ───── */

    async getCampaignsPage(opts: { tab?: string; id?: string; page?: number } = {}): Promise<CampaignsPageView> {
      const n = now();
      const period = periodOf(n);
      const [campaigns, businesses, events, st] = await Promise.all([
        db.list('campaigns'),
        db.list('businesses'),
        db.list('campaign_events'),
        statsOf('platform'),
      ]);
      const bizById = new Map(businesses.map((b) => [b.id, b]));
      const evs = eventsByCampaign(events);
      const stateOf = (c: Campaign) => campaignState(c, evs.get(c.id));

      const running = campaigns.filter((c) => c.status === 'active');
      const kpi = st.get('kpi', period);
      const src = st.get('codes_used_by_source', period);
      const srcPrev = st.get('codes_used_by_source', prevPeriod(period));
      const issued = kpi.get('sponsor_codes_issued') ?? sum(campaigns.map((c) => c.issuedCount));
      const sponsorUsed = src.get('sponsor') ?? sum(campaigns.map((c) => c.usedCount));
      const dUsed = deltaText(sponsorUsed, srcPrev.get('sponsor'));
      const kpis: AdminKpi[] = [
        {
          key: 'running',
          label: 'Đang chạy',
          value: formatNumber(running.length),
          sub: `của ${formatNumber(new Set(running.map((c) => c.businessId)).size)} doanh nghiệp`,
          delta: null,
          deltaTone: 'neutral',
        },
        { key: 'issued', label: 'Mã đã tặng tháng này', value: formatNumber(issued), sub: 'cho người hay đến gần quán', delta: null, deltaTone: 'neutral' },
        {
          key: 'used',
          label: 'Mã tài trợ đã dùng',
          value: formatNumber(sponsorUsed),
          sub: issued ? `${formatPercent(sponsorUsed / issued)} số mã đã tặng` : '',
          delta: dUsed.delta,
          deltaTone: dUsed.tone,
        },
        {
          key: 'low',
          label: 'Sắp hết ngân sách',
          value: formatNumber(running.filter(lowBudget).length),
          sub: `dưới ${formatPercent(LOW_BUDGET_RATIO)} ngân sách còn lại`,
          delta: null,
          deltaTone: 'neutral',
        },
      ];

      const filter: Record<CampaignTab, (c: Campaign) => boolean> = {
        'tat-ca': () => true,
        'dang-chay': (c) => stateOf(c) === 'running',
        'cho-duyet': (c) => stateOf(c) === 'pending',
        'tam-dung': (c) => stateOf(c) === 'paused',
        'frego-dung': (c) => stateOf(c) === 'stopped',
      };
      const label: Record<CampaignTab, string> = {
        'tat-ca': 'Tất cả',
        'dang-chay': 'Đang chạy',
        'cho-duyet': 'Chờ duyệt',
        'tam-dung': 'Tạm dừng',
        'frego-dung': 'Frego dừng',
      };
      const tab: CampaignTab = opts.tab && opts.tab in filter ? (opts.tab as CampaignTab) : 'tat-ca';
      const tabs = (Object.keys(filter) as CampaignTab[]).map((k) => ({
        key: k,
        label: label[k],
        count: formatNumber(campaigns.filter(filter[k]).length),
        ...(k === 'tat-ca' ? { icon: 'table' as const } : {}),
      }));
      const rank: Record<CampaignAdminState, number> = { running: 0, paused: 1, stopped: 2, pending: 3, ended: 4, rejected: 5, draft: 6 };
      const inTab = campaigns
        .filter((c) => bizById.has(c.businessId) && filter[tab](c))
        .sort((a, b) => rank[stateOf(a)] - rank[stateOf(b)] || b.usedCount - a.usedCount || a.name.localeCompare(b.name, 'vi'));
      const pageCount = Math.max(1, Math.ceil(inTab.length / CAMPAIGN_PAGE_SIZE));
      const page = Math.min(Math.max(1, Math.floor(opts.page ?? 1)), pageCount);
      const shown = inTab.slice((page - 1) * CAMPAIGN_PAGE_SIZE, page * CAMPAIGN_PAGE_SIZE);
      const rows: CampaignRow[] = shown.map((c) => {
        const s = stateOf(c);
        return {
          id: c.id,
          name: c.name,
          businessName: bizById.get(c.businessId)!.name,
          providerId: c.providerId,
          offerText: `${offerServiceLabel(c.providerId, c.vehicleClass)} · ${formatDiscount(c.amount)}`,
          radiusText: formatMeters(c.radiusM),
          codesText: s === 'pending' || s === 'draft' ? '—' : `${formatNumber(c.usedCount)} / ${formatNumber(c.issuedCount)}`,
          budgetText: s === 'running' ? formatVnd(Math.max(0, c.budget - c.spent)) : s === 'pending' || s === 'draft' ? formatVnd(c.budget) : '—',
          budgetMuted: !(s === 'running' || s === 'pending' || s === 'draft'),
          chip: campaignChip(c, evs.get(c.id)),
        };
      });
      const from = (page - 1) * CAMPAIGN_PAGE_SIZE + 1;
      const hint = [
        inTab.length === 0
          ? 'Không có chiến dịch nào.'
          : page === 1
            ? `Hiển thị ${formatNumber(shown.length)} trong ${formatNumber(inTab.length)} chiến dịch.`
            : `Hiển thị ${formatNumber(from)}–${formatNumber(from + shown.length - 1)} trong ${formatNumber(inTab.length)} chiến dịch.`,
        'Chiến dịch chờ duyệt xử lý ở mục Duyệt.',
      ].join(' ');

      let selected: CampaignDetail | null = null;
      const c = opts.id ? campaigns.find((x) => x.id === opts.id) : undefined;
      const b = c ? bizById.get(c.businessId) : undefined;
      if (c && b) {
        const s = stateOf(c);
        const list = evs.get(c.id) ?? [];
        const canResume = s === 'stopped' && b.status === 'active' && t(c.endsAt) > n.getTime() && c.spent < c.budget;
        selected = {
          id: c.id,
          name: c.name,
          businessName: b.name,
          category: b.category,
          chip: campaignChip(c, list),
          state: s,
          facts: [
            { label: 'Doanh nghiệp', value: `${b.name} · ${shortAddress(b.address)}` },
            { label: 'Ưu đãi', value: `${offerServiceLabel(c.providerId, c.vehicleClass)} · ${formatDiscount(c.amount)}` },
            { label: 'Vùng áp dụng', value: `${formatMeters(c.radiusM)} quanh ${placeNoun(b.category)}` },
            { label: 'Thời gian', value: dateRange(c.startsAt, c.endsAt) },
            { label: 'Khung giờ', value: `${c.hoursFrom} – ${c.hoursTo}` },
            { label: 'Ngân sách', value: `${formatVnd(c.budget)}, đã chi ${formatVnd(c.spent)}` },
            { label: 'Mã dùng / tặng', value: `${formatNumber(c.usedCount)} / ${formatNumber(c.issuedCount)}` },
            { label: 'Ví doanh nghiệp', value: formatVnd(b.walletBalance) },
          ],
          events: list.slice(0, 6).map((e) => ({ key: e.id, time: formatDayMonth(e.at), text: e.text })),
          canPause: s === 'running',
          canResume,
          note:
            s === 'paused'
              ? 'Doanh nghiệp tự tạm dừng chiến dịch này.'
              : s === 'stopped' && b.status !== 'active'
                ? 'Doanh nghiệp đang bị tạm khóa. Mở khóa ở mục Doanh nghiệp trước khi cho chạy lại.'
                : s === 'stopped' && !canResume
                  ? 'Chiến dịch đã hết hạn hoặc hết ngân sách.'
                  : s === 'rejected' && c.rejectReason
                    ? `Đã từ chối, lý do: ${c.rejectReason}`
                    : null,
          reviewHref: s === 'pending' ? `/quan-tri/duyet?id=${encodeURIComponent(c.id)}` : null,
        };
      }
      return { kpis, tab, tabs, rows, hint, page, pageCount, selected };
    },

    /** Frego tạm dừng ngay chiến dịch có vấn đề (doanh nghiệp được báo qua email). */
    async pauseCampaign(id: string, reason: string): Promise<void> {
      const why = lowerFirst(trimDot(reason));
      if (!why) throw new Error('Cần lý do tạm dừng');
      const c = await db.get('campaigns', id);
      if (!c) throw new Error('Không tìm thấy chiến dịch');
      if (c.status !== 'active') throw new Error('Chiến dịch không chạy');
      const b = await db.get('businesses', c.businessId);
      await db.update('campaigns', id, { status: 'paused' });
      await db.insert('campaign_events', { campaignId: id, at: nowIso(), text: `${EV_STOP}${why}` });
      await log(`Tạm dừng chiến dịch ${c.name}, ${b?.name ?? ''}: ${why}`);
    },

    /** Cho chạy lại chiến dịch Frego đã dừng. */
    async resumeCampaign(id: string): Promise<void> {
      const c = await db.get('campaigns', id);
      if (!c) throw new Error('Không tìm thấy chiến dịch');
      if (c.status !== 'paused') throw new Error('Chiến dịch không ở trạng thái tạm dừng');
      const b = await db.get('businesses', c.businessId);
      if (!b || b.status !== 'active') throw new Error('Doanh nghiệp đang bị khóa');
      await db.update('campaigns', id, { status: 'active' });
      await db.insert('campaign_events', { campaignId: id, at: nowIso(), text: EV_RESUME });
      await log(`Cho chạy lại chiến dịch ${c.name}, ${b.name}`);
    },
  };
  return service;
}

export type AdminService = ReturnType<typeof createAdminService>;
