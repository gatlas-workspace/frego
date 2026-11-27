/**
 * Dịch vụ Quản trị Frego — nhóm "Tiền, dữ liệu, hệ thống": tiền và đối soát (QT 7), điểm và mã Frego (QT 8),
 * thông báo (QT 9), bảng giá ước tính (QT 10), đối tác (QT 11), hỗ trợ và nhật ký (QT 12).
 * Chạy trên Db bất kỳ (DEMO hoặc Supabase; RLS cho quản trị viên đọc toàn bộ, kế toán giữ bảng tiền).
 * Mọi chuỗi hiển thị (tiền, ngày, nhãn trạng thái) được tính ở đây; trang web chỉ dàn trang.
 *
 * Số liệu cả nền tảng theo tháng (đã trừ ví, đối soát hãng, điểm cộng, lượt gửi tin…) đọc từ bảng `stats`
 * (scope "platform", job hằng đêm gộp); số liệu có đủ dòng gốc (nạp tiền, trừ ví, hóa đơn, mã Frego, bảng giá,
 * yêu cầu hỗ trợ, nhật ký) tính trực tiếp nên đổi ngay khi quản trị viên thao tác.
 */
import { brand } from '../brand';
import { POINTS_RULES, PROVIDERS, PROVIDER_ORDER, SERVICES, VEHICLE_ORDER, serviceFullLabel, serviceKey, serviceShortLabel } from '../catalog';
import type { Db } from '../db/types';
import type { StatRow } from '../db/schema';
import { formatDate, formatDateTime, formatDayMonth, formatDiscount, formatKm, formatNumber, formatPercent, formatTime, formatVnd, formatVndRange, MINUS, parseVnd, vnParts } from '../format';
import { estimateRoute } from '../geo';
import { estimateFare, isPeak } from '../pricing';
import type {
  AdminRole,
  AuditLog,
  Broadcast,
  Business,
  FareTable,
  FregoCode,
  NotificationPrefs,
  Partner,
  PartnerKind,
  ProviderId,
  RegionId,
  SupportTicket,
  VehicleClass,
  WalletTransaction,
} from '../types';

/* ───────────────────────── Cấu hình nghiệp vụ của nhóm (chưa có cột/bảng riêng) ───────────────────────── */

/** Tin ưu đãi chung soạn tay: tối đa mỗi tuần (thứ Hai – Chủ nhật, giờ VN). */
export const PROMO_BROADCASTS_PER_WEEK = 2;
/** Giới hạn điểm báo giá mỗi người mỗi ngày; vượt thì giữ lại để kiểm tra. */
export const POINTS_DAILY_CAP = 300;
/** Báo số tiền chỉ được điểm khi lệch không quá tỷ lệ này so với ước tính. */
export const AMOUNT_REPORT_MAX_DEVIATION = 0.3;
/** Yêu cầu xóa dữ liệu phải xong trong số ngày này (hạn ghi ở support_tickets.dueAt). */
export const DATA_DELETION_DAYS = 30;
/** Chuyến thử ở form bảng giá (QT 10): cùng tuyến mẫu của app. */
export const FARE_TEST_TRIP = { fromPlaceId: 'landmark81', toPlaceId: 'ben-thanh' } as const;

export const REGION_ORDER: RegionId[] = ['hcm', 'hn'];
export const REGION_LABEL: Record<RegionId, string> = { hcm: 'TP.HCM', hn: 'Hà Nội' };

export const ADMIN_ROLE_ORDER: AdminRole[] = ['ops', 'accounting', 'support'];
export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = { ops: 'Vận hành', accounting: 'Kế toán', support: 'Hỗ trợ' };
/** Phạm vi quyền theo RLS (is_admin): vận hành làm được mọi việc, kế toán giữ bảng tiền, hỗ trợ giữ yêu cầu và điểm. */
export const ADMIN_ROLE_SCOPE: Record<AdminRole, string> = {
  ops: 'Duyệt, khóa, xem người dùng',
  accounting: 'Tiền, hóa đơn',
  support: 'Yêu cầu, điểm',
};
/** Tên người thao tác ghi vào nhật ký (giống các RPC trong db/memory.ts và supabase/migrations). */
const ACTOR_NAME: Record<AdminRole, string> = { ops: 'Vận hành Frego', accounting: 'Kế toán', support: 'Hỗ trợ' };

/**
 * Quan hệ với từng hãng xe (QT 11). Chưa có cột trong bảng partners nên ghi ở đây:
 * hợp đồng, link mở màn đặt xe có chính thức không, hãng có gửi báo cáo đối soát hằng ngày không.
 */
export const PROVIDER_PARTNERSHIP: Record<ProviderId, { contract: 'signed' | 'negotiating' | 'none'; officialDeepLink: boolean; dailyRecon: boolean }> = {
  grab: { contract: 'negotiating', officialDeepLink: false, dailyRecon: true },
  be: { contract: 'none', officialDeepLink: false, dailyRecon: true },
  gsm: { contract: 'none', officialDeepLink: false, dailyRecon: false },
};

export type NotifPrefKey = keyof Omit<NotificationPrefs, 'userId' | 'quiet'>;

/** Loại tin khớp mục Cài đặt thông báo trong app (thứ tự như app). */
export const NOTIFICATION_TYPES: { key: NotifPrefKey; title: string; trigger: string; mode: 'auto' | 'manual' }[] = [
  { key: 'gift', title: 'Voucher tặng riêng', trigger: 'Doanh nghiệp tặng mã cho người hay đến gần quán', mode: 'auto' },
  { key: 'card', title: 'Mã mới hợp thẻ, ví', trigger: 'Kho mã có mã mới khớp thẻ, ví người dùng đã lưu', mode: 'auto' },
  { key: 'expire', title: 'Voucher sắp hết hạn', trigger: 'Còn 3 ngày, mã vẫn nằm trong Ví', mode: 'auto' },
  { key: 'report', title: 'Nhắc báo giá sau chuyến', trigger: 'Hãng ghi nhận mã đã dùng', mode: 'auto' },
  { key: 'points', title: 'Điểm thưởng', trigger: 'Được cộng điểm hoặc đủ điểm đổi quà', mode: 'auto' },
  {
    key: 'promo',
    title: 'Ưu đãi chung của hãng',
    trigger: `Frego soạn tay, tối đa ${PROMO_BROADCASTS_PER_WEEK} tin mỗi tuần, mặc định tắt`,
    mode: 'manual',
  },
];

/** Nhóm nhận tin soạn tay: khóa = cột của notification_prefs. */
export const BROADCAST_AUDIENCES: Partial<Record<NotifPrefKey, string>> = { promo: 'Người bật tin ưu đãi chung' };

/* ───────────────────────── Kiểu dữ liệu màn hình ───────────────────────── */

/** Màu nhãn trạng thái (trùng tên tone của <Status> trên web). */
export type OpsTone = 'green' | 'amber' | 'grey' | 'red' | 'blue' | 'orange';

export interface OpsStat {
  label: string;
  value: string;
  sub: string;
  /** "+36%" so với tháng trước, rỗng nếu không có số tháng trước. */
  delta: string;
  deltaTone: 'good' | 'bad' | 'neutral';
}

export interface OpsLabel {
  text: string;
  tone: OpsTone;
}

/* QT 7 */

export interface TopupRowView {
  id: string;
  businessId: string;
  businessName: string;
  /** "21/11 16:20" */
  timeText: string;
  /** Nội dung chuyển khoản "FREGO CPM1024" */
  reference: string;
  amountText: string;
  status: WalletTransaction['status'];
  label: OpsLabel;
}

export interface DeductionRowView {
  id: string;
  businessName: string;
  codesText: string;
  discountText: string;
  feeText: string;
  totalText: string;
  label: OpsLabel;
}

export interface ReconRowView {
  providerId: ProviderId;
  name: string;
  recordedText: string;
  confirmedText: string;
  diffText: string;
  diffBad: boolean;
  payableText: string;
  label: OpsLabel;
}

export interface InvoiceRowView {
  id: string;
  businessName: string;
  /** "Tháng 11/2026" */
  periodText: string;
  amountText: string;
  sendTo: string;
  label: OpsLabel;
}

export interface MoneyView {
  stats: { walletHeld: OpsStat; deducted: OpsStat; serviceFee: OpsStat; pendingTopups: OpsStat };
  topups: TopupRowView[];
  /** Nạp tiền đang chờ khớp, theo thứ tự trong bảng. */
  pendingTopups: { id: string; businessName: string; amountText: string }[];
  deductions: {
    /** "22/11": ngày chạy trừ ví gần nhất */
    runDayText: string;
    /** "21/11": ngày mã được dùng */
    usedDayText: string;
    rows: DeductionRowView[];
  };
  recon: { rows: ReconRowView[]; note: string };
  invoices: InvoiceRowView[];
}

/* QT 8 */

export interface PointsRuleView {
  key: 'tap' | 'amount' | 'receipt' | 'daily_cap';
  title: string;
  pointsText: string;
  condition: string;
  usesText: string;
  label: OpsLabel;
}

export interface RewardRowView {
  id: string;
  providerId: ProviderId;
  title: string;
  costText: string;
  redeemedText: string;
  spendText: string;
  label: OpsLabel;
}

export interface FregoCodeRowView {
  id: string;
  code: string;
  kind: FregoCode['kind'];
  active: boolean;
  providerId: ProviderId;
  /** "Be xe máy · −10.000đ" */
  offerText: string;
  /** Mô tả ngắn: "Quà chào mừng" */
  title: string;
  /** "30 ngày sau khi nhận" */
  validityText: string;
  usedText: string;
  costText: string;
  label: OpsLabel;
}

export interface PointsAdminView {
  stats: { awarded: OpsStat; redeemed: OpsStat; codesUsed: OpsStat; codesCost: OpsStat };
  rules: PointsRuleView[];
  /** "Điểm nhân 2 khi …" */
  multiplierNote: string;
  /** Cảnh báo báo giá trùng (kèm ví dụ người bị giữ điểm nếu có). */
  fraudNote: string;
  rewards: RewardRowView[];
  codes: FregoCodeRowView[];
}

export interface CreateFregoCodeInput {
  code: string;
  providerId: string;
  vehicleClass: string;
  amount: string | number;
  title: string;
  validDays: string | number;
  active: boolean;
}

/* QT 9 */

export interface NotificationTypeRowView {
  key: NotifPrefKey;
  title: string;
  trigger: string;
  sentText: string;
  openText: string;
  offText: string;
  label: OpsLabel;
}

export interface NotificationsAdminView {
  types: NotificationTypeRowView[];
  /** "Giờ yên lặng 22:00 – 7:00 …" */
  quietNote: string;
  weekly: { limit: number; used: number; remaining: number; label: OpsLabel };
  audience: { key: NotifPrefKey; label: string; count: number; countText: string };
  /** Bản nháp gần nhất (mở sẵn trong khung soạn tin). */
  draft: { id: string; title: string; body: string; sendAtText: string } | null;
  /** Tin đã hẹn, chưa gửi. */
  scheduled: { id: string; title: string; whenText: string; recipientsText: string }[];
}

export interface BroadcastInput {
  id?: string | null;
  title: string;
  body: string;
  /** "28/11 17:30" hoặc "28/11/2026 17:30" */
  sendAt: string;
}

/* QT 10 */

export interface FareRowView {
  id: string;
  providerId: ProviderId;
  label: string;
  openText: string;
  perKmText: string;
  perMinText: string;
  peakText: string;
  accuracyText: string;
  /** Chưa bật ước tính: hiện số xám. */
  muted: boolean;
  status: OpsLabel;
}

export interface FareTestTrip {
  /** "Landmark 81 → Chợ Bến Thành" */
  title: string;
  km: number;
  minutes: number;
  /** "5,8 km, 20 phút" */
  distanceText: string;
  /** Thời điểm tính (ISO): cùng giờ app đang tính lúc này. */
  at: string;
  peak: boolean;
}

export interface FareEditView {
  table: FareTable;
  label: string;
  /** "Be xe máy · TP.HCM" */
  title: string;
  /** "Cập nhật 18/11 từ 1.410 báo giá" */
  sub: string;
  /** Giá app đang hiện cho chuyến thử (trước khi trừ mã), null nếu chưa bật. */
  currentText: string | null;
  canEnable: boolean;
  enableHelp: string;
}

export interface FareAdminView {
  region: RegionId;
  regions: { key: RegionId; label: string; count: string }[];
  rows: FareRowView[];
  selectedIndex: number;
  selected: FareEditView | null;
  test: FareTestTrip | null;
  /** "Green SM bật ước tính khi đủ 30 báo giá …" */
  note: string | null;
  minReports: number;
}

export interface FareTableInput {
  openFare: string | number;
  perKm: string | number;
  perMin: string | number;
  peakFactor: string | number;
  enabled: boolean;
}

/* QT 11 */

export interface ProviderPartnerRowView {
  id: ProviderId;
  name: string;
  prefill: { text: string; sub: string };
  sponsor: OpsLabel;
  usage: { text: string; sub: string };
  contract: OpsLabel;
}

export interface PaymentPartnerRowView {
  id: string;
  name: string;
  kindText: string;
  purpose: string;
  linkedText: string;
  inApp: OpsLabel;
}

export interface PartnersAdminView {
  providers: ProviderPartnerRowView[];
  payments: PaymentPartnerRowView[];
}

export interface AddPartnerInput {
  kind: string;
  name: string;
  description: string;
}

/* QT 12 */

export type TicketFilter = 'all' | 'open' | 'done';

export interface TicketRowView {
  id: string;
  /** "#1042" */
  number: string;
  subject: string;
  /** "#1042 · hạn 21/12/2026" */
  sub: string;
  requester: string;
  requesterKindText: string;
  topic: OpsLabel;
  timeText: string;
  status: SupportTicket['status'];
  label: OpsLabel;
}

export interface TicketDetailView extends TicketRowView {
  createdText: string;
  dueText: string | null;
}

export interface SupportView {
  filter: TicketFilter;
  counts: Record<TicketFilter, number>;
  rows: TicketRowView[];
  selected: TicketDetailView | null;
  log: { id: string; time: string; actor: string; action: string }[];
  roles: { role: AdminRole; label: string; countText: string; scope: string }[];
}

/* ───────────────────────── Hàm trợ giúp ───────────────────────── */

const DAY_MS = 86_400_000;
const VN_OFFSET_MS = 7 * 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** Chỉ số ngày theo giờ VN. */
const vnDay = (d: Date | string | number) => Math.floor((new Date(d).getTime() + VN_OFFSET_MS) / DAY_MS);
/** 00:00 giờ VN của một chỉ số ngày. */
const vnDayStart = (day: number) => new Date(day * DAY_MS - VN_OFFSET_MS);
/** Chỉ số ngày thứ Hai của tuần chứa d. */
const weekStartDay = (d: Date | string | number) => vnDay(d) - ((vnParts(d).weekday + 6) % 7);

const monthKey = (d: Date | string | number) => {
  const p = vnParts(d);
  return `${p.year}-${pad(p.month)}`;
};
const prevMonthKey = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
};
/** "2026-11" → "Tháng 11/2026" */
const monthText = (key: string) => {
  const [y, m] = key.split('-');
  return `Tháng ${m}/${y}`;
};
/** "2026-11" → "01/12" (ngày xuất hóa đơn: đầu tháng sau). */
const firstOfNextMonth = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `01/${pad(m === 12 ? 1 : m + 1)}${m === 12 ? `/${y + 1}` : ''}`;
};

/** +36% / −5% so với kỳ trước. */
function deltaOf(cur: number | null, prev: number | null): Pick<OpsStat, 'delta' | 'deltaTone'> {
  if (cur === null || !prev) return { delta: '', deltaTone: 'neutral' };
  const pct = Math.round((cur / prev - 1) * 100);
  if (pct === 0) return { delta: '0%', deltaTone: 'neutral' };
  return { delta: `${pct > 0 ? '+' : MINUS}${Math.abs(pct)}%`, deltaTone: pct > 0 ? 'good' : 'bad' };
}

const stat = (label: string, value: string, sub: string, d: Pick<OpsStat, 'delta' | 'deltaTone'> = { delta: '', deltaTone: 'neutral' }): OpsStat => ({
  label,
  value,
  sub,
  ...d,
});

/** "10 phút trước", "1 giờ trước", "hôm qua", "2 ngày trước", rồi ngày. */
function ago(input: string, now: Date): string {
  const min = Math.floor((now.getTime() - new Date(input).getTime()) / 60_000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const days = vnDay(now) - vnDay(input);
  if (days <= 0) return `${Math.floor(min / 60)} giờ trước`;
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return formatDate(input);
}

/** "1.15" → "1,15" */
const decimalText = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
/** "07:00" → "7:00" */
const shortClock = (hhmm: string) => hhmm.replace(/^0(\d)/, '$1');
const clockMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Số mã trong ghi chú trừ ví do job tạo (bảng wallet_transactions chưa có cột số mã). */
const codesInNote = (note: string): number | null => {
  // Cổng doanh nghiệp ghi "Mã được dùng ngày 21/11 · 19 mã Grab ô tô"; job cũ ghi "Trừ 17 mã ngày 21/11".
  const m = /(\d+)\s*mã/.exec(note);
  return m ? Number(m[1]) : null;
};

const collator = (a: string, b: string) => a.localeCompare(b, 'vi');

function toInt(v: string | number, field: string): number {
  const n = typeof v === 'number' ? v : parseVnd(String(v));
  if (n === null || !Number.isFinite(n)) throw new Error(`${field}: nhập số.`);
  return Math.round(n);
}

function toDecimal(v: string | number, field: string): number {
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`${field}: nhập số, VD 1,15.`);
  return n;
}

/** Bỏ dấu: dùng để tạo id đối tác. */
function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Đọc "28/11 17:30" (năm mặc định theo hiện tại) hoặc "28/11/2026 17:30" → Date (giờ VN). */
export function parseSendAt(input: string, now: Date): Date | null {
  const m = /^\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s+(\d{1,2})[:hg](\d{2})\s*$/.exec(input);
  if (!m) return null;
  const [day, month, hour, minute] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5])];
  if (hour > 23 || minute > 59) return null;
  const build = (year: number) => new Date(Date.UTC(year, month - 1, day, hour, minute) - VN_OFFSET_MS);
  const thisYear = vnParts(now).year;
  let d = build(m[3] ? Number(m[3]) : thisYear);
  // Không ghi năm và ngày đã qua hơn một tháng → hiểu là năm sau (VD gõ 02/01 vào cuối tháng 12).
  if (!m[3] && d.getTime() < now.getTime() - 31 * DAY_MS) d = build(thisYear + 1);
  const p = vnParts(d);
  if (p.day !== day || p.month !== month) return null;
  return d;
}

/** Giờ yên lặng: tin rơi vào khung này chuyển sang giờ kết thúc (7:00) — cùng ngày nếu sau nửa đêm, hôm sau nếu trước nửa đêm. */
export function shiftOutOfQuietHours(at: Date): { at: Date; shifted: boolean } {
  const from = clockMinutes(brand.quietHours.from);
  const to = clockMinutes(brand.quietHours.to);
  const p = vnParts(at);
  const m = p.hour * 60 + p.minute;
  const inQuiet = from > to ? m >= from || m < to : m >= from && m < to;
  if (!inQuiet) return { at, shifted: false };
  const day = vnDay(at) + (from > to && m >= from ? 1 : 0);
  return { at: new Date(vnDayStart(day).getTime() + to * 60_000), shifted: true };
}

/* ───────────────────────── Dịch vụ ───────────────────────── */

export function createAdminOpsService(db: Db) {
  const nowIso = () => db.now().toISOString();

  /** Số liệu tổng hợp cả nền tảng của các kỳ cho trước. */
  async function platformStats(periods: string[]) {
    const rows: StatRow[] = await db.list('stats', { where: { scope: 'platform' }, in: { period: periods } });
    const one = (metric: string, period: string, key = 'total'): number | null =>
      rows.find((r) => r.metric === metric && r.period === period && r.key === key)?.value ?? null;
    const byKey = (metric: string, period: string): Map<string, number> =>
      new Map(rows.filter((r) => r.metric === metric && r.period === period).map((r) => [r.key, r.value]));
    return { one, byKey };
  }

  async function businessMap(): Promise<Map<string, Business>> {
    const list = await db.list('businesses');
    return new Map(list.map((b) => [b.id, b]));
  }

  async function actor(): Promise<Pick<AuditLog, 'actorName' | 'actorRole'>> {
    const id = db.currentUserId();
    const p = id ? await db.get('profiles', id) : null;
    const role: AdminRole = p?.adminRole ?? 'ops';
    return { actorName: ACTOR_NAME[role], actorRole: role };
  }

  async function log(action: string) {
    await db.insert('audit_logs', { ...(await actor()), action, createdAt: nowIso() });
  }

  /** Số người nhận tin soạn tay: số tổng hợp (RLS không cho quản trị đọc từng cài đặt), không có thì đếm các dòng đọc được. */
  async function audienceSize(key: NotifPrefKey): Promise<number> {
    const { one } = await platformStats([monthKey(db.now())]);
    const agg = one('notif_opt_in', monthKey(db.now()), key);
    if (agg !== null) return agg;
    const prefs = await db.list('notification_prefs');
    return prefs.filter((p) => p[key]).length;
  }

  function fareLabel(t: Pick<FareTable, 'providerId' | 'vehicleClass'>) {
    return serviceFullLabel(t.providerId, t.vehicleClass);
  }

  async function testTrip(): Promise<FareTestTrip | null> {
    const [from, to] = await Promise.all([
      db.get('places', FARE_TEST_TRIP.fromPlaceId),
      db.get('places', FARE_TEST_TRIP.toPlaceId),
    ]);
    if (!from || !to) return null;
    const route = estimateRoute(from, to);
    const at = db.now();
    return {
      title: `${from.name} → ${to.name}`,
      km: route.km,
      minutes: route.minutes,
      distanceText: `${formatKm(route.km)}, ${route.minutes} phút`,
      at: at.toISOString(),
      peak: isPeak(at),
    };
  }

  function ticketNumber(t: SupportTicket) {
    const m = /(\d+)$/.exec(t.id);
    return `#${m ? m[1] : t.id.slice(0, 6).toUpperCase()}`;
  }

  const TOPIC: Record<SupportTicket['topic'], OpsLabel> = {
    code: { text: 'Mã', tone: 'orange' },
    billing: { text: 'Thanh toán', tone: 'blue' },
    data_delete: { text: 'Quyền riêng tư', tone: 'grey' },
    points: { text: 'Điểm', tone: 'blue' },
    other: { text: 'Khác', tone: 'grey' },
  };

  function ticketRow(t: SupportTicket, now: Date): TicketRowView {
    const number = ticketNumber(t);
    const label: OpsLabel =
      t.status === 'open'
        ? { text: 'Mới', tone: 'red' }
        : t.status === 'pending'
          ? { text: 'Đang xử lý', tone: 'amber' }
          : { text: t.topic === 'other' ? 'Đã trả lời' : 'Đã xong', tone: 'green' };
    return {
      id: t.id,
      number,
      subject: t.subject,
      sub: t.dueAt && t.status !== 'done' ? `${number} · hạn ${formatDate(t.dueAt)}` : number,
      requester: t.requesterName,
      requesterKindText: t.requesterKind === 'business' ? 'Doanh nghiệp' : 'Người dùng',
      topic: TOPIC[t.topic],
      timeText: ago(t.createdAt, now),
      status: t.status,
      label,
    };
  }

  const service = {
    db,

    /* ───────────── QT 7 · Tiền và đối soát ───────────── */

    async getMoney(): Promise<MoneyView> {
      const now = db.now();
      const cur = monthKey(now);
      const prev = prevMonthKey(cur);
      const [bizById, txs, invoices, partners, st] = await Promise.all([
        businessMap(),
        db.list('wallet_transactions', { order: { column: 'createdAt', ascending: false } }),
        db.list('invoices'),
        db.list('partners'),
        platformStats([cur, prev]),
      ]);
      const nameOf = (id: string) => bizById.get(id)?.name ?? 'Doanh nghiệp đã xóa';
      const fee = brand.serviceFeePerCode;

      // Ví đang giữ: số dư thật của doanh nghiệp đang hoạt động hoặc tạm khóa.
      const holding = [...bizById.values()].filter((b) => b.status === 'active' || b.status === 'locked');
      const held = holding.reduce((s, b) => s + b.walletBalance, 0);

      const deductedAgg = st.one('wallet_deducted', cur);
      const deductedLive = txs
        .filter((t) => t.kind === 'deduction' && t.status === 'done' && monthKey(t.createdAt) === cur)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      const recorded = st.byKey('recon_recorded', cur);
      const recordedPrev = st.byKey('recon_recorded', prev);
      const sum = (m: Map<string, number>) => [...m.values()].reduce((s, v) => s + v, 0);
      const codesUsed = sum(recorded);
      const codesUsedPrev = recordedPrev.size ? sum(recordedPrev) : null;

      const topupRows = txs.filter((t) => t.kind === 'topup');
      const pending = topupRows.filter((t) => t.status === 'pending');
      const pendingSum = pending.reduce((s, t) => s + t.amount, 0);

      const TOPUP_LABEL: Record<WalletTransaction['status'], OpsLabel> = {
        pending: { text: 'Chờ khớp', tone: 'amber' },
        done: { text: 'Đã cộng vào ví', tone: 'green' },
        failed: { text: 'Không khớp', tone: 'red' },
      };
      const topups: TopupRowView[] = topupRows.slice(0, 50).map((t) => ({
        id: t.id,
        businessId: t.businessId,
        businessName: nameOf(t.businessId),
        timeText: `${formatDayMonth(t.createdAt)} ${formatTime(t.createdAt)}`,
        reference: t.reference ?? '—',
        amountText: formatVnd(t.amount),
        status: t.status,
        label: TOPUP_LABEL[t.status],
      }));

      // Trừ ví: lần chạy gần nhất (00:05 mỗi ngày cho mã dùng hôm trước).
      const deductions = txs.filter((t) => t.kind === 'deduction');
      const runDay = deductions.length ? Math.max(...deductions.map((t) => vnDay(t.createdAt))) : vnDay(now);
      const runRows = deductions
        .filter((t) => vnDay(t.createdAt) === runDay)
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      const deductionRows: DeductionRowView[] = runRows.map((t) => {
        const total = Math.abs(t.amount);
        const codes = codesInNote(t.note);
        const feeTotal = codes !== null ? codes * fee : null;
        const balance = bizById.get(t.businessId)?.walletBalance ?? 0;
        const label: OpsLabel =
          t.status === 'done'
            ? { text: `Đã trừ ${formatTime(t.createdAt)}`, tone: 'green' }
            : t.status === 'failed'
              ? { text: balance < total ? 'Ví không đủ, đã dừng' : 'Chưa trừ được', tone: 'red' }
              : { text: 'Chờ trừ', tone: 'amber' };
        return {
          id: t.id,
          businessName: nameOf(t.businessId),
          codesText: codes !== null ? formatNumber(codes) : '—',
          discountText: feeTotal !== null ? formatVnd(total - feeTotal) : '—',
          feeText: feeTotal !== null ? formatVnd(feeTotal) : '—',
          totalText: formatVnd(total),
          label,
        };
      });

      // Đối soát hãng xe (số tổng hợp theo tháng).
      const confirmed = st.byKey('recon_confirmed', cur);
      const payable = st.byKey('recon_payable', cur);
      const reconRows: ReconRowView[] = PROVIDER_ORDER.filter((p) => recorded.has(p)).map((p) => {
        const rec = recorded.get(p) ?? 0;
        const conf = confirmed.get(p);
        const diff = conf === undefined ? null : rec - conf;
        const label: OpsLabel =
          diff === null
            ? { text: 'Chưa có số của hãng', tone: 'grey' }
            : diff === 0
              ? { text: 'Khớp', tone: 'green' }
              : { text: diff > 0 ? 'Chờ hãng kiểm tra' : 'Hãng ghi nhiều hơn', tone: 'amber' };
        return {
          providerId: p,
          name: PROVIDERS[p].name,
          recordedText: formatNumber(rec),
          confirmedText: conf === undefined ? '—' : formatNumber(conf),
          diffText: diff === null ? '—' : formatNumber(Math.abs(diff)),
          diffBad: diff !== null && diff !== 0,
          payableText: payable.has(p) ? formatVnd(payable.get(p)!) : '—',
          label,
        };
      });
      const monthNo = Number(cur.split('-')[1]);
      const anySigned = PROVIDER_ORDER.some(
        (p) => PROVIDER_PARTNERSHIP[p].contract === 'signed' || partners.some((x) => x.id === p && x.integration === 'live'),
      );
      const reconNote =
        `Tổng tiền giảm phải trả hãng tháng ${monthNo}: ${formatVnd(sum(payable))}.` +
        (anySigned ? '' : ' Hoa hồng từ hãng xe chưa có vì chưa ký hợp đồng.');

      const invoiceRows: InvoiceRowView[] = invoices
        .slice()
        .sort((a, b) => (a.month === b.month ? collator(nameOf(a.businessId), nameOf(b.businessId)) : a.month < b.month ? 1 : -1))
        .map((inv) => {
          const b = bizById.get(inv.businessId);
          return {
            id: inv.id,
            businessName: nameOf(inv.businessId),
            periodText: monthText(inv.month),
            amountText: formatVnd(inv.amount),
            sendTo: b?.invoiceEmail || b?.contactEmail || '—',
            label:
              inv.status === 'issued'
                ? { text: 'Đã gửi', tone: 'green' }
                : { text: `Xuất ngày ${firstOfNextMonth(inv.month)}`, tone: 'amber' },
          };
        });

      return {
        stats: {
          walletHeld: stat('Ví doanh nghiệp đang giữ', formatVnd(held), `tổng số dư của ${formatNumber(holding.length)} doanh nghiệp`),
          deducted: stat('Đã trừ ví tháng này', formatVnd(deductedAgg ?? deductedLive), 'giá trị giảm cộng phí dịch vụ'),
          serviceFee: stat(
            'Phí dịch vụ Frego',
            formatVnd(codesUsed * fee),
            `${formatNumber(codesUsed)} mã × ${formatVnd(fee)}`,
            deltaOf(codesUsed, codesUsedPrev),
          ),
          pendingTopups: stat('Nạp tiền chờ khớp', formatVnd(pendingSum), 'chuyển khoản chưa vào ví'),
        },
        topups,
        pendingTopups: pending.map((t) => ({ id: t.id, businessName: nameOf(t.businessId), amountText: formatVnd(t.amount) })),
        deductions: {
          runDayText: formatDayMonth(vnDayStart(runDay)),
          usedDayText: formatDayMonth(vnDayStart(runDay - 1)),
          rows: deductionRows,
        },
        recon: { rows: reconRows, note: reconNote },
        invoices: invoiceRows,
      };
    },

    /** Khớp tiền nạp (RPC confirm_topup: đánh dấu xong + cộng vào ví doanh nghiệp). */
    async confirmTopup(transactionId: string): Promise<{ message: string; balanceText: string }> {
      const tx = await db.get('wallet_transactions', transactionId);
      if (!tx || tx.kind !== 'topup') throw new Error('Không tìm thấy giao dịch nạp tiền.');
      const b = await db.get('businesses', tx.businessId);
      const name = b?.name ?? 'doanh nghiệp';
      if (tx.status === 'done') throw new Error(`Giao dịch này đã được cộng vào ví ${name}.`);
      const { balance } = await db.rpc('confirm_topup', { transactionId });
      return { message: `Đã cộng ${formatVnd(tx.amount)} vào ví ${name}`, balanceText: formatVnd(balance) };
    },

    /* ───────────── QT 8 · Điểm và mã Frego ───────────── */

    async getPointsAdmin(): Promise<PointsAdminView> {
      const now = db.now();
      const cur = monthKey(now);
      const prev = prevMonthKey(cur);
      const [codes, rewards, fares, partners, profiles, st] = await Promise.all([
        db.list('frego_codes'),
        db.list('rewards', { order: { column: 'cost' } }),
        db.list('fare_tables'),
        db.list('partners'),
        db.list('profiles', { where: { status: 'locked' } }),
        platformStats([cur, prev]),
      ]);

      // Điểm cộng tháng này: số tổng hợp; chưa có thì cộng sổ điểm (đọc được với quyền quản trị).
      let awarded = st.one('points_awarded', cur);
      if (awarded === null) {
        const ledger = await db.list('points_ledger');
        awarded = ledger.filter((e) => e.delta > 0 && monthKey(e.createdAt) === cur).reduce((s, e) => s + e.delta, 0);
      }
      const reports = st.one('price_reports', cur);
      const redeemedByReward = st.byKey('reward_redeemed', cur);
      const redeemedCount = rewards.reduce((s, r) => s + (redeemedByReward.get(r.id) ?? 0), 0);
      const redeemedPoints = rewards.reduce((s, r) => s + (redeemedByReward.get(r.id) ?? 0) * r.cost, 0);
      // Lượt dùng mã Frego trong tháng (số tổng hợp theo mã); mã chưa có số tổng hợp thì lấy bộ đếm của mã.
      const usedByCode = st.byKey('frego_code_used', cur);
      const usedOf = (c: FregoCode) => usedByCode.get(c.id) ?? c.usedCount;
      const used = codes.reduce((s, c) => s + usedOf(c), 0);
      const cost = codes.reduce((s, c) => s + usedOf(c) * c.amount, 0);
      const budget = st.one('frego_code_budget', cur);
      const welcome = codes.find((c) => c.kind === 'welcome' && c.active);

      const uses = st.byKey('points_rule_uses', cur);
      const usesText = (k: string, unit = '') => (uses.has(k) ? `${formatNumber(uses.get(k)!)}${unit}` : '—');
      const on: OpsLabel = { text: 'Đang bật', tone: 'green' };
      const gmail = partners.find((p) => p.kind === 'email')?.name ?? 'Gmail';
      const rules: PointsRuleView[] = [
        { key: 'tap', title: 'Báo giá một chạm', pointsText: `+${POINTS_RULES.tap}`, condition: 'Một lần mỗi chuyến đã dùng mã', usesText: usesText('tap'), label: on },
        {
          key: 'amount',
          title: 'Nhập số tiền đã trả',
          pointsText: `+${POINTS_RULES.amount}`,
          condition: `Số tiền lệch không quá ${formatPercent(AMOUNT_REPORT_MAX_DEVIATION)} so với ước tính`,
          usesText: usesText('amount'),
          label: on,
        },
        {
          key: 'receipt',
          title: 'Biên nhận email',
          pointsText: `+${POINTS_RULES.receipt}`,
          condition: `Tự đọc từ email của hãng, cần liên kết ${gmail}`,
          usesText: usesText('receipt'),
          label: on,
        },
        {
          key: 'daily_cap',
          title: 'Giới hạn mỗi người',
          pointsText: formatNumber(POINTS_DAILY_CAP),
          condition: 'Tối đa mỗi ngày, vượt thì giữ lại để kiểm tra',
          usesText: usesText('daily_cap', ' người'),
          label: on,
        },
      ];

      const noData = PROVIDER_ORDER.filter((p) => !fares.some((f) => f.providerId === p && f.enabled)).map((p) => PROVIDERS[p].name);
      const multiplierNote =
        `Điểm nhân ${POINTS_RULES.noDataMultiplier} khi báo giá cho hãng, loại xe chưa có ước tính giá` +
        (noData.length ? ` (hiện là ${noData.join(', ')}).` : '.');
      const flagged = profiles.find((p) => p.role === 'user' && /trùng/i.test(p.lockReason ?? ''));
      const fraudNote =
        'Báo giá trùng nhau nhiều lần trong thời gian ngắn sẽ bị giữ điểm và báo cho mục Hỗ trợ' +
        (flagged ? `, như trường hợp ${flagged.displayName}.` : '.');

      const rewardRows: RewardRowView[] = rewards.map((r) => {
        const n = redeemedByReward.get(r.id) ?? 0;
        return {
          id: r.id,
          providerId: r.providerId,
          title: `${serviceShortLabel(r.providerId, r.vehicleClass)} · ${formatDiscount(r.amount)}`,
          costText: formatNumber(r.cost),
          redeemedText: formatNumber(n),
          spendText: formatVnd(n * r.amount),
          label: r.active ? on : { text: 'Đã tắt', tone: 'grey' },
        };
      });

      const codeRows: FregoCodeRowView[] = codes
        .filter((c) => c.kind !== 'reward')
        .sort((a, b) => Number(b.active) - Number(a.active) || usedOf(b) - usedOf(a) || collator(a.code, b.code))
        .map((c) => ({
          id: c.id,
          code: c.code,
          kind: c.kind,
          active: c.active,
          providerId: c.providerId,
          offerText: `${serviceShortLabel(c.providerId, c.vehicleClass)} · ${formatDiscount(c.amount)}`,
          title: c.title,
          validityText: `${c.validDays} ngày sau khi nhận`,
          usedText: formatNumber(usedOf(c)),
          costText: formatVnd(usedOf(c) * c.amount),
          label: c.active
            ? { text: 'Đang chạy', tone: 'green' }
            : c.issuedCount === 0
              ? { text: 'Bản nháp', tone: 'grey' }
              : { text: 'Đã dừng', tone: 'grey' },
        }));

      return {
        stats: {
          awarded: stat(
            'Điểm cộng tháng này',
            formatNumber(awarded),
            reports !== null ? `từ ${formatNumber(reports)} báo giá` : 'từ báo giá của người dùng',
            deltaOf(awarded, st.one('points_awarded', prev)),
          ),
          redeemed: stat('Điểm đã đổi', formatNumber(redeemedPoints), `${formatNumber(redeemedCount)} voucher đổi điểm`),
          codesUsed: stat('Mã Frego đã dùng', formatNumber(used), welcome ? `${welcome.code} và voucher đổi điểm` : 'voucher đổi điểm'),
          codesCost: stat('Chi phí mã Frego', formatVnd(cost), budget !== null ? `trong ngân sách ${formatVnd(budget)}` : 'Frego tự trả, không trừ ví doanh nghiệp'),
        },
        rules,
        multiplierNote,
        fraudNote,
        rewards: rewardRows,
        codes: codeRows,
      };
    },

    /** Tạo mã Frego tự tài trợ (kind "promo"). Mã nháp chưa phát cho ai. */
    async createFregoCode(input: CreateFregoCodeInput): Promise<{ code: FregoCode; message: string }> {
      const code = input.code.trim().toUpperCase().replace(/\s+/g, '');
      if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new Error('Mã gồm 4–16 chữ in hoa hoặc số, không dấu, không khoảng trắng.');
      if (!PROVIDER_ORDER.includes(input.providerId as ProviderId)) throw new Error('Chọn hãng xe.');
      if (!VEHICLE_ORDER.includes(input.vehicleClass as VehicleClass)) throw new Error('Chọn loại xe.');
      const amount = toInt(input.amount, 'Mức giảm');
      if (amount < 1000 || amount > 200000 || amount % 1000 !== 0) throw new Error('Mức giảm từ 1.000đ đến 200.000đ, tròn nghìn.');
      const validDays = toInt(input.validDays, 'Hiệu lực');
      if (validDays < 1 || validDays > 365) throw new Error('Hiệu lực từ 1 đến 365 ngày.');
      const title = input.title.trim();
      if (!title) throw new Error('Nhập mô tả ngắn, VD "Chuyến đầu".');
      if (title.length > 60) throw new Error('Mô tả ngắn tối đa 60 ký tự.');
      const existing = await db.list('frego_codes', { where: { code } });
      if (existing.length) throw new Error(`Mã ${code} đã có.`);
      const row = await db.insert('frego_codes', {
        code,
        kind: 'promo',
        providerId: input.providerId as ProviderId,
        vehicleClass: input.vehicleClass as VehicleClass,
        amount,
        title,
        validDays,
        quota: null,
        issuedCount: 0,
        usedCount: 0,
        active: input.active,
      });
      await log(`Tạo mã Frego ${code}, ${serviceShortLabel(row.providerId, row.vehicleClass)} ${formatDiscount(amount)}${input.active ? '' : ' (nháp)'}`);
      return {
        code: row,
        message: input.active ? `Đã tạo mã ${code}, đang chạy.` : `Đã tạo mã ${code} ở dạng bản nháp.`,
      };
    },

    /** Chạy hoặc tạm dừng mã Frego (mã chào mừng, mã khuyến mãi; mã đổi điểm đi theo quà). */
    async setFregoCodeActive(id: string, active: boolean): Promise<{ message: string }> {
      const c = await db.get('frego_codes', id);
      if (!c) throw new Error('Không tìm thấy mã.');
      if (c.kind === 'reward') throw new Error('Mã đổi điểm bật, tắt theo quà ở tab Quà đổi điểm.');
      if (c.active !== active) {
        await db.update('frego_codes', id, { active });
        await log(`${active ? 'Chạy' : 'Tạm dừng'} mã Frego ${c.code}`);
      }
      return { message: active ? `Mã ${c.code} đang chạy.` : `Đã tạm dừng mã ${c.code}.` };
    },

    /* ───────────── QT 9 · Thông báo ───────────── */

    async getNotificationsAdmin(): Promise<NotificationsAdminView> {
      const now = db.now();
      const cur = monthKey(now);
      const [broadcasts, st, audience] = await Promise.all([
        db.list('broadcasts', { order: { column: 'createdAt', ascending: false } }),
        platformStats([cur]),
        audienceSize('promo'),
      ]);
      const sent = st.byKey('notif_sent', cur);
      const open = st.byKey('notif_open_rate', cur);
      const off = st.byKey('notif_off_rate', cur);
      const promoSent = broadcasts
        .filter((b) => b.status === 'sent' && monthKey(b.scheduledAt) === cur)
        .reduce((s, b) => s + b.recipients, 0);

      const types: NotificationTypeRowView[] = NOTIFICATION_TYPES.map((t) => {
        const manual = t.mode === 'manual';
        const sentN = manual ? promoSent : sent.get(t.key);
        return {
          key: t.key,
          title: t.title,
          trigger: t.trigger,
          sentText: sentN === undefined ? '—' : formatNumber(sentN),
          openText: open.has(t.key) ? formatPercent(open.get(t.key)!) : '—',
          // Tin soạn tay mặc định tắt nên không tính tỷ lệ tắt.
          offText: !manual && off.has(t.key) ? formatPercent(off.get(t.key)!) : '—',
          label: manual ? { text: 'Soạn tay', tone: 'blue' } : { text: 'Tự động', tone: 'green' },
        };
      });

      const week = weekStartDay(now);
      const used = broadcasts.filter(
        (b) => b.audience === 'promo' && (b.status === 'scheduled' || b.status === 'sent') && weekStartDay(b.scheduledAt) === week,
      ).length;
      const remaining = Math.max(0, PROMO_BROADCASTS_PER_WEEK - used);
      const draft = broadcasts.find((b) => b.status === 'draft') ?? null;
      const { from, to } = brand.quietHours;

      return {
        types,
        quietNote: `Giờ yên lặng ${shortClock(from)} – ${shortClock(to)} áp dụng cho mọi loại tin. Tin rơi vào giờ này chuyển sang ${shortClock(to)} sáng hôm sau.`,
        weekly: {
          limit: PROMO_BROADCASTS_PER_WEEK,
          used,
          remaining,
          label: remaining === 0
            ? { text: 'Tuần này đã đủ tin', tone: 'red' }
            : { text: `Còn ${remaining} tin tuần này`, tone: remaining < PROMO_BROADCASTS_PER_WEEK ? 'amber' : 'green' },
        },
        audience: { key: 'promo', label: BROADCAST_AUDIENCES.promo!, count: audience, countText: `${formatNumber(audience)} người đang bật` },
        draft: draft
          ? { id: draft.id, title: draft.title, body: draft.body, sendAtText: `${formatDayMonth(draft.scheduledAt)} ${formatTime(draft.scheduledAt)}` }
          : null,
        scheduled: broadcasts
          .filter((b) => b.status === 'scheduled')
          .sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1))
          .map((b) => ({
            id: b.id,
            title: b.title,
            whenText: `${formatTime(b.scheduledAt)} ngày ${formatDayMonth(b.scheduledAt)}`,
            recipientsText: `${formatNumber(b.recipients)} người`,
          })),
      };
    },

    /** Lưu nháp tin ưu đãi chung (tạo mới hoặc sửa bản nháp đang mở). */
    async saveBroadcastDraft(input: BroadcastInput): Promise<{ broadcast: Broadcast; message: string }> {
      const now = db.now();
      const title = input.title.trim();
      if (!title) throw new Error('Nhập tiêu đề tin.');
      const at = input.sendAt.trim() ? parseSendAt(input.sendAt, now) : now;
      if (!at) throw new Error('Nhập giờ gửi dạng 28/11 17:30.');
      const patch = { title, body: input.body.trim(), audience: 'promo', scheduledAt: at.toISOString(), status: 'draft' as const };
      const existing = input.id ? await db.get('broadcasts', input.id) : null;
      const broadcast =
        existing && existing.status === 'draft'
          ? await db.update('broadcasts', existing.id, patch)
          : await db.insert('broadcasts', { ...patch, recipients: 0, createdAt: now.toISOString() });
      return { broadcast, message: 'Đã lưu nháp. Tin chưa được gửi.' };
    },

    /**
     * Hẹn gửi tin ưu đãi chung cho người bật tin này. Kiểm tra: tiêu đề, nội dung, giờ trong tương lai,
     * giờ yên lặng (dời sang 7:00), tối đa PROMO_BROADCASTS_PER_WEEK tin trong tuần của giờ gửi.
     */
    async scheduleBroadcast(input: BroadcastInput): Promise<{ broadcast: Broadcast; message: string }> {
      const now = db.now();
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title) throw new Error('Nhập tiêu đề tin.');
      if (title.length > 65) throw new Error('Tiêu đề tối đa 65 ký tự để không bị cắt trên điện thoại.');
      if (!body) throw new Error('Nhập nội dung tin.');
      if (body.length > 180) throw new Error('Nội dung tối đa 180 ký tự.');
      const picked = parseSendAt(input.sendAt, now);
      if (!picked) throw new Error('Nhập giờ gửi dạng 28/11 17:30.');
      if (picked.getTime() <= now.getTime()) throw new Error('Giờ gửi đã qua. Chọn giờ sau thời điểm hiện tại.');
      const { at, shifted } = shiftOutOfQuietHours(picked);

      const all = await db.list('broadcasts');
      const week = weekStartDay(at);
      const sameWeek = all.filter(
        (b) =>
          b.id !== input.id &&
          b.audience === 'promo' &&
          (b.status === 'scheduled' || b.status === 'sent') &&
          weekStartDay(b.scheduledAt) === week,
      );
      if (sameWeek.length >= PROMO_BROADCASTS_PER_WEEK) {
        const startText = formatDayMonth(vnDayStart(week));
        const endText = formatDayMonth(vnDayStart(week + 6));
        throw new Error(`Tuần ${startText} – ${endText} đã có ${PROMO_BROADCASTS_PER_WEEK} tin ưu đãi chung. Chọn tuần khác.`);
      }

      const recipients = await audienceSize('promo');
      const patch = { title, body, audience: 'promo', scheduledAt: at.toISOString(), status: 'scheduled' as const, recipients };
      const existing = input.id ? await db.get('broadcasts', input.id) : null;
      const broadcast =
        existing && existing.status === 'draft'
          ? await db.update('broadcasts', existing.id, patch)
          : await db.insert('broadcasts', { ...patch, createdAt: now.toISOString() });
      const when = `${formatTime(at)} ngày ${formatDayMonth(at)}`;
      await log(`Hẹn gửi tin ưu đãi chung "${title}" lúc ${when} cho ${formatNumber(recipients)} người`);
      return {
        broadcast,
        message:
          (shifted ? `Giờ đã chọn rơi vào giờ yên lặng nên dời sang ${shortClock(brand.quietHours.to)}. ` : '') +
          `Đã hẹn gửi lúc ${when} cho ${formatNumber(recipients)} người.`,
      };
    },

    /* ───────────── QT 10 · Bảng giá ước tính ───────────── */

    async getFareTables(region: RegionId = 'hcm', selectedId?: string | null): Promise<FareAdminView> {
      const [all, test] = await Promise.all([db.list('fare_tables'), testTrip()]);
      const pOrder = (p: ProviderId) => PROVIDER_ORDER.indexOf(p);
      const vOrder = (v: VehicleClass) => VEHICLE_ORDER.indexOf(v);
      const tables = all
        .filter((t) => t.region === region)
        .sort((a, b) => pOrder(a.providerId) - pOrder(b.providerId) || vOrder(a.vehicleClass) - vOrder(b.vehicleClass));
      const min = brand.minReportsToEnableEstimate;

      const rows: FareRowView[] = tables.map((t) => {
        const acc = t.accuracy;
        const status: OpsLabel = !t.enabled
          ? { text: 'Chưa bật', tone: 'grey' }
          : acc !== null && acc < 0.75
            ? { text: 'Cần thêm dữ liệu', tone: 'amber' }
            : { text: 'Đang dùng', tone: 'green' };
        return {
          id: t.id,
          providerId: t.providerId,
          label: fareLabel(t),
          openText: formatVnd(t.openFare),
          perKmText: formatVnd(t.perKm),
          perMinText: formatVnd(t.perMin),
          peakText: `×${decimalText(t.peakFactor)}`,
          accuracyText: t.enabled && acc !== null ? formatPercent(acc) : '—',
          muted: !t.enabled,
          status,
        };
      });

      // Mặc định mở bảng có nhiều báo giá nhất (bảng app dùng nhiều nhất).
      const byReports = tables.slice().sort((a, b) => b.reportCount - a.reportCount)[0];
      const sel = tables.find((t) => t.id === selectedId) ?? byReports ?? null;
      let selected: FareEditView | null = null;
      if (sel) {
        const label = fareLabel(sel);
        const current = sel.enabled && test ? estimateFare(sel, { km: test.km, minutes: test.minutes, at: test.at }) : null;
        selected = {
          table: sel,
          label,
          title: `${label} · ${REGION_LABEL[sel.region]}`,
          sub: `Cập nhật ${formatDayMonth(sel.updatedAt)} từ ${formatNumber(sel.reportCount)} báo giá`,
          currentText: current ? formatVndRange(current.low, current.high) : null,
          canEnable: sel.reportCount >= min,
          enableHelp:
            sel.reportCount >= min
              ? `Đủ ${formatNumber(min)} báo giá để bật (có ${formatNumber(sel.reportCount)}).`
              : `Cần ${formatNumber(min)} báo giá để bật, hiện có ${formatNumber(sel.reportCount)}.`,
        };
      }

      // Hãng chưa bật ước tính ở khu vực này.
      const off = PROVIDER_ORDER.filter((p) => tables.some((t) => t.providerId === p) && !tables.some((t) => t.providerId === p && t.enabled));
      const note = off.length
        ? `${off.map((p) => PROVIDERS[p].name).join(', ')} bật ước tính khi đủ ${formatNumber(min)} báo giá ở mỗi khu vực. Hiện có ${formatNumber(
            tables.filter((t) => off.includes(t.providerId)).reduce((s, t) => s + t.reportCount, 0),
          )} báo giá.`
        : null;

      return {
        region,
        regions: REGION_ORDER.map((r) => {
          const n = all.filter((t) => t.region === r).length;
          return { key: r, label: REGION_LABEL[r], count: n ? String(n) : 'sắp có' };
        }),
        rows,
        selectedIndex: sel ? tables.indexOf(sel) : -1,
        selected,
        test,
        note,
        minReports: min,
      };
    },

    /** Lưu bảng giá. Ước tính mới dùng bảng này ngay; báo giá cũ không đổi. Ghi nhật ký các thay đổi. */
    async updateFareTable(id: string, input: FareTableInput): Promise<{ table: FareTable; message: string }> {
      const t = await db.get('fare_tables', id);
      if (!t) throw new Error('Không tìm thấy bảng giá.');
      const openFare = toInt(input.openFare, 'Giá mở cửa');
      const perKm = toInt(input.perKm, 'Mỗi km');
      const perMin = toInt(input.perMin, 'Mỗi phút');
      const peakFactor = Math.round(toDecimal(input.peakFactor, 'Hệ số giờ cao điểm') * 100) / 100;
      if (openFare < 1000 || openFare > 500000) throw new Error('Giá mở cửa từ 1.000đ đến 500.000đ.');
      if (perKm < 0 || perKm > 100000) throw new Error('Mỗi km từ 0đ đến 100.000đ.');
      if (perMin < 0 || perMin > 10000) throw new Error('Mỗi phút từ 0đ đến 10.000đ.');
      if (peakFactor < 1 || peakFactor > 2) throw new Error('Hệ số giờ cao điểm từ 1 đến 2 lần.');
      const min = brand.minReportsToEnableEstimate;
      if (input.enabled && !t.enabled && t.reportCount < min) {
        throw new Error(`Cần ${formatNumber(min)} báo giá để bật ước tính, hiện có ${formatNumber(t.reportCount)}.`);
      }
      const patch: Partial<FareTable> = {
        openFare,
        perKm,
        perMin,
        peakFactor,
        enabled: input.enabled,
        // Giá tối thiểu đi theo giá mở cửa khi hai số đang bằng nhau (quy ước của bảng mẫu).
        minFare: t.minFare === t.openFare ? openFare : t.minFare,
        updatedAt: nowIso(),
      };
      const changes: string[] = [];
      const money = (label: string, a: number, b: number) => a !== b && changes.push(`${label} ${formatVnd(a)} → ${formatVnd(b)}`);
      money('mở cửa', t.openFare, openFare);
      money('mỗi km', t.perKm, perKm);
      money('mỗi phút', t.perMin, perMin);
      if (t.peakFactor !== peakFactor) changes.push(`cao điểm ×${decimalText(t.peakFactor)} → ×${decimalText(peakFactor)}`);
      if (t.enabled !== input.enabled) changes.push(input.enabled ? 'bật ước tính' : 'tắt ước tính');
      const table = await db.update('fare_tables', id, patch);
      await log(`Sửa bảng giá ${fareLabel(t)} ${REGION_LABEL[t.region]}: ${changes.length ? changes.join(', ') : 'lưu lại, không đổi số'}`);
      return { table, message: 'Đã lưu. Ước tính mới dùng bảng giá này, giá đã báo trước đó không đổi.' };
    },

    /** Lịch sử sửa một bảng giá (từ nhật ký quản trị). */
    async getFareHistory(id: string): Promise<{ title: string; items: { id: string; time: string; text: string }[] }> {
      const t = await db.get('fare_tables', id);
      if (!t) return { title: 'Lịch sử bảng giá', items: [] };
      const prefix = `Sửa bảng giá ${fareLabel(t)} ${REGION_LABEL[t.region]}: `;
      const logs = await db.list('audit_logs', { order: { column: 'createdAt', ascending: false }, limit: 500 });
      const items = logs
        .filter((l) => l.action.startsWith(prefix))
        .map((l) => ({ id: l.id, time: formatDateTime(l.createdAt), text: `${l.actorName} · ${l.action.slice(prefix.length)}` }));
      return { title: `Lịch sử ${fareLabel(t)} · ${REGION_LABEL[t.region]}`, items };
    },

    /* ───────────── QT 11 · Đối tác và liên kết ───────────── */

    async getPartnersAdmin(): Promise<PartnersAdminView> {
      const cur = monthKey(db.now());
      const [partners, campaigns, fares, codes, links, st] = await Promise.all([
        db.list('partners', { order: { column: 'sortOrder' } }),
        db.list('campaigns', { where: { status: 'active' } }),
        db.list('fare_tables'),
        db.list('public_codes'),
        db.list('linked_accounts'),
        platformStats([cur]),
      ]);

      const providers: ProviderPartnerRowView[] = PROVIDER_ORDER.map((p) => {
        const info = PROVIDERS[p];
        const deal = PROVIDER_PARTNERSHIP[p];
        const running = campaigns.some((c) => c.providerId === p);
        const estimated = fares.some((f) => f.providerId === p && f.enabled);
        const linkable = partners.some((x) => x.id === p && x.kind === 'app');
        return {
          id: p,
          name: info.name,
          prefill: info.prefillsDestination
            ? { text: 'Có, qua link mở màn đặt xe', sub: deal.officialDeepLink ? 'Link chính thức của hãng' : 'Link không chính thức, cần theo dõi' }
            : { text: 'Chỉ mở trang chủ', sub: 'Người dùng dán địa chỉ đã chép' },
          sponsor: !running
            ? { text: 'Chưa có', tone: 'grey' }
            : estimated
              ? { text: 'Đang dùng', tone: 'green' }
              : { text: 'Thử nghiệm', tone: 'amber' },
          usage: {
            text: linkable ? 'Từ tài khoản người dùng liên kết' : 'Người dùng tự báo',
            sub: deal.dailyRecon ? 'và báo cáo đối soát hằng ngày' : 'chưa có báo cáo đối soát',
          },
          contract:
            deal.contract === 'signed'
              ? { text: 'Đã ký', tone: 'green' }
              : deal.contract === 'negotiating'
                ? { text: 'Đang đàm phán', tone: 'amber' }
                : { text: 'Chưa có', tone: 'grey' },
        };
      });

      const linkedAgg = st.byKey('partner_linked', cur);
      const KIND_TEXT: Record<PartnerKind, string> = { bank: 'Thẻ', wallet: 'Ví điện tử', app: 'App đặt xe', email: 'Email' };
      const payments: PaymentPartnerRowView[] = partners
        .filter((x) => x.kind !== 'app')
        .map((x) => {
          const mine = links.filter((l) => l.partnerId === x.id);
          const credit = mine.length > 0 && mine.every((l) => l.cardType === 'credit');
          const related = codes.filter((c) => c.requiresPartnerId === x.id && c.status !== 'expired');
          const products = [...new Set(related.flatMap((c) => c.vehicleClasses.map((v) => SERVICES[serviceKey(c.providerId, v)].productName)))];
          const purpose = related.length
            ? `Lọc mã ${related.map((c) => c.code).join(', ')}${related.length === 1 && products.length === 1 ? ` cho ${products[0]}` : ''}`
            : x.kind === 'wallet'
              ? `Lọc mã trả bằng ${x.name}`
              : x.kind === 'email'
                ? 'Đọc biên nhận chuyến để tự báo giá, chỉ email từ hãng xe'
                : x.description;
          const linked = linkedAgg.get(x.id) ?? mine.length;
          return {
            id: x.id,
            name: x.name,
            kindText: x.kind === 'bank' && credit ? 'Thẻ tín dụng' : KIND_TEXT[x.kind],
            purpose,
            linkedText: formatNumber(linked),
            // Mọi đối tác trong bảng đều hiện ở màn Liên kết của app.
            inApp: { text: 'Đang hiện', tone: 'green' },
          };
        });

      return { providers, payments };
    },

    /** Thêm ngân hàng, ví hoặc email cho người dùng liên kết (chỉ ghi nhận, chưa tích hợp). */
    async addPartner(input: AddPartnerInput): Promise<{ partner: Partner; message: string }> {
      const kind = input.kind as PartnerKind;
      if (!['bank', 'wallet', 'email'].includes(kind)) throw new Error('Chọn loại đối tác.');
      const name = input.name.trim();
      if (name.length < 2 || name.length > 40) throw new Error('Tên đối tác từ 2 đến 40 ký tự.');
      const description = input.description.trim();
      if (!description) throw new Error('Nhập mô tả hiện trong app, VD "Hợp mã đặt xe trả bằng ví".');
      const all = await db.list('partners');
      if (all.some((p) => p.name.toLowerCase() === name.toLowerCase())) throw new Error(`${name} đã có trong danh sách.`);
      let id = slug(name) || 'doi-tac';
      while (all.some((p) => p.id === id)) id += '-1';
      const words = name.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean);
      const mono = (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase();
      const partner = await db.insert('partners', {
        id,
        kind,
        name,
        mono: mono.charAt(0) + mono.slice(1).toLowerCase(),
        description,
        integration: 'record_only',
        sortOrder: Math.max(0, ...all.map((p) => p.sortOrder)) + 1,
      });
      await log(`Thêm đối tác ${name}`);
      return { partner, message: `Đã thêm ${name} vào màn Liên kết của app` };
    },

    /* ───────────── QT 12 · Hỗ trợ và nhật ký ───────────── */

    async getSupport(filter: TicketFilter = 'all', selectedId?: string | null): Promise<SupportView> {
      const now = db.now();
      const [tickets, logs, admins] = await Promise.all([
        db.list('support_tickets', { order: { column: 'createdAt', ascending: false } }),
        db.list('audit_logs', { order: { column: 'createdAt', ascending: false }, limit: 500 }),
        db.list('profiles', { where: { role: 'admin' } }),
      ]);
      const isDone = (t: SupportTicket) => t.status === 'done';
      const counts = { all: tickets.length, open: tickets.filter((t) => !isDone(t)).length, done: tickets.filter(isDone).length };
      const shown = tickets.filter((t) => filter === 'all' || (filter === 'done' ? isDone(t) : !isDone(t)));

      const sel = selectedId ? tickets.find((t) => t.id === selectedId) : undefined;
      const selected: TicketDetailView | null = sel
        ? { ...ticketRow(sel, now), createdText: formatDateTime(sel.createdAt), dueText: sel.dueAt ? formatDate(sel.dueAt) : null }
        : null;

      // Nhật ký hôm nay (giờ VN), bỏ dòng trùng hệt nhau.
      const today = vnDay(now);
      const seen = new Set<string>();
      const log = logs
        .filter((l) => vnDay(l.createdAt) === today)
        .filter((l) => {
          const k = `${l.createdAt}|${l.actorName}|${l.action}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((l) => ({ id: l.id, time: formatTime(l.createdAt), actor: l.actorName, action: l.action }));

      const active = admins.filter((p) => p.status === 'active' && p.adminRole);
      const roles = ADMIN_ROLE_ORDER.map((r) => ({
        role: r,
        label: ADMIN_ROLE_LABEL[r],
        countText: `${formatNumber(active.filter((p) => p.adminRole === r).length)} người`,
        scope: ADMIN_ROLE_SCOPE[r],
      }));

      return { filter, counts, rows: shown.map((t) => ticketRow(t, now)), selected, log, roles };
    },

    /** Đổi trạng thái yêu cầu hỗ trợ (nhận xử lý, xong, mở lại). Ghi nhật ký. */
    async setTicketStatus(id: string, status: SupportTicket['status']): Promise<{ message: string }> {
      if (!['open', 'pending', 'done'].includes(status)) throw new Error('Trạng thái không hợp lệ.');
      const t = await db.get('support_tickets', id);
      if (!t) throw new Error('Không tìm thấy yêu cầu.');
      if (t.status === status) return { message: 'Yêu cầu đã ở trạng thái này.' };
      await db.update('support_tickets', id, { status });
      const verb = status === 'done' ? 'Đóng' : status === 'pending' ? 'Nhận xử lý' : 'Mở lại';
      await log(`${verb} yêu cầu ${ticketNumber(t)} của ${t.requesterName}`);
      const msg = status === 'done' ? 'Đã đánh dấu xong.' : status === 'pending' ? 'Đã nhận xử lý.' : 'Đã mở lại yêu cầu.';
      return { message: msg };
    },
  };
  return service;
}

export type AdminOpsService = ReturnType<typeof createAdminOpsService>;
