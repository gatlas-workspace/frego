/**
 * Cơ sở dữ liệu trong bộ nhớ cho chế độ DEMO (không cần Supabase).
 * Lệnh RPC được cài lại bằng JS, cùng quy tắc với hàm SQL trong supabase/migrations.
 */
import { brand } from '../brand';
import { PROVIDERS, SERVICES, parseServiceKey, serviceShortLabel } from '../catalog';
import { formatDiscount, formatNumber, formatVnd, maskName, vnParts } from '../format';
import { POINTS_RULES, SHOP_PHOTO_RULES } from '../catalog';
import { distanceM } from '../geo';
import { DEMO_NOW } from '../seed/base';
import type { Db, FileStore, ListOptions, RpcName, Rpcs } from './types';
import { PRIMARY_KEYS, type BaseTableName, type Row, type Seed, type TableName } from './schema';
import type { AppNotification, Profile, Referral, ReferralStatus, ShopPhoto, Trip, UserVoucher } from '../types';
import type { ReferralCheckReason } from './types';

/** Biên nhận khớp chuyến mở app hãng trong 3 giờ trước đó (SQL: interval '3 hours'). */
export const RECEIPT_MATCH_WINDOW_MS = 3 * 3600_000;
/** Cho phép giờ trên biên nhận sớm hơn lúc mở app tối đa 15 phút (lệch đồng hồ; SQL: interval '15 minutes'). */
export const RECEIPT_CLOCK_SKEW_MS = 15 * 60_000;

export function uid(): string {
  // UUID v4 đủ dùng cho DEMO (Hermes không chắc có crypto.randomUUID).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function genCode(prefix: string): string {
  let s = prefix.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'F');
  for (let i = 0; i < 4; i++) s += ALNUM[Math.floor(Math.random() * ALNUM.length)];
  return s;
}

/** Bỏ dấu tiếng Việt: "Cà phê Mây" → "Ca phe May" */
export function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Mã giới thiệu: chữ đầu tên (tối đa 4 chữ của từ đầu + chữ đầu của từ cuối, không dấu) + ký tự ngẫu nhiên (bỏ 0/O/1/I),
 * tổng 6–7 ký tự: "Minh Anh" → "MINHA7K", "Lan" → "LAN7QX". Trùng thì thử lại (SQL: public._gen_referral_code).
 */
export function genReferralCode(name: string, taken: (code: string) => boolean): string {
  const words = stripDiacritics(name)
    .toUpperCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Z]/g, ''))
    .filter(Boolean);
  const full = words.length ? (words[0].slice(0, 4) + (words.length > 1 ? words[words.length - 1][0] : '')).slice(0, 5) : 'FRE';
  for (let i = 0; i < 40; i++) {
    // Sau 10 lần trùng: rút tiền tố còn 4 chữ để có thêm ký tự ngẫu nhiên (vẫn ≤ 7 ký tự).
    const prefix = i < 10 ? full : full.slice(0, 4);
    const n = i < 10 ? Math.max(2, 6 - prefix.length) : 7 - prefix.length;
    let code = prefix;
    for (let k = 0; k < n; k++) code += ALNUM[Math.floor(Math.random() * ALNUM.length)];
    if (!taken(code)) return code;
  }
  throw new Error('Không tạo được mã giới thiệu');
}

/** Chuẩn hóa mã người dùng gõ: in hoa, bỏ khoảng trắng / ký tự lạ. */
export function normalizeReferralCode(code: string): string {
  return String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function codePrefix(name: string): string {
  const words = stripDiacritics(name).split(/\s+/).filter(Boolean);
  const last = words[words.length - 1] ?? 'FRE';
  return last.slice(0, 3);
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export interface MemoryDbOptions {
  userId?: string | null;
  /** Mốc giờ bắt đầu của đồng hồ DEMO (mặc định 22/11/2026 17:45). Đồng hồ chạy tiếp theo thời gian thật. */
  startAt?: string;
  /** Gọi sau mỗi lần ghi (để app lưu lại AsyncStorage, v.v.). */
  onChange?: (data: Seed) => void;
}

export interface MemoryDb extends Db {
  data: Seed;
  setUser(userId: string | null): void;
  snapshot(): Seed;
}

export function createMemoryDb(seed: Seed, opts: MemoryDbOptions = {}): MemoryDb {
  const data = clone(seed);
  let userId = opts.userId ?? null;
  const bootReal = Date.now();
  const startAt = new Date(opts.startAt ?? DEMO_NOW).getTime();
  const now = () => new Date(startAt + (Date.now() - bootReal));
  const changed = () => opts.onChange?.(data);
  // Bảng thêm sau (dữ liệu DEMO cũ đã lưu có thể thiếu) + mã giới thiệu cho hồ sơ cũ (như phần điền mã trong migration).
  data.referrals ??= [];
  data.app_banners ??= [];
  data.shop_photos ??= [];
  const codeTaken = (c: string) => data.profiles.some((p) => p.referralCode === c);
  for (const p of data.profiles) if (!p.referralCode) p.referralCode = genReferralCode(p.displayName, codeTaken);

  const pk = <T extends TableName>(t: T) => PRIMARY_KEYS[t] as keyof Row<T>;

  /** Bảng thật hoặc view chỉ đọc (giống view SQL businesses_public, campaigns_public). */
  function rowsOf<T extends TableName>(t: T): Row<T>[] {
    if (t === 'businesses_public') {
      return data.businesses
        .filter((b) => b.status === 'active' || b.status === 'locked')
        .map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          industry: b.industry,
          landmark: b.landmark,
          address: b.address,
          district: b.district,
          lat: b.lat,
          lng: b.lng,
          openHours: b.openHours,
          status: b.status,
          logoUrl: b.logoUrl,
        })) as unknown as Row<T>[];
    }
    if (t === 'campaigns_public') {
      const nowT = now().getTime();
      return data.campaigns
        .filter((c) => c.status === 'active' || c.status === 'paused' || c.status === 'ended')
        .map((c) => ({
          id: c.id,
          businessId: c.businessId,
          name: c.name,
          status: c.status,
          providerId: c.providerId,
          vehicleClass: c.vehicleClass,
          amount: c.amount,
          radiusM: c.radiusM,
          hoursFrom: c.hoursFrom,
          hoursTo: c.hoursTo,
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          imageUrl: c.imageUrl,
          offering:
            c.status === 'active' &&
            c.spent < c.budget &&
            new Date(c.startsAt).getTime() <= nowT &&
            new Date(c.endsAt).getTime() > nowT,
        })) as unknown as Row<T>[];
    }
    if (t === 'ad_banners_public') {
      // Giống view SQL: banner đã duyệt mới nhất của mỗi quán đang hoạt động.
      const active = new Set(data.businesses.filter((b) => b.status === 'active').map((b) => b.id));
      const latest = new Map<string, (typeof data.ad_banners)[number]>();
      for (const a of data.ad_banners ?? []) {
        if (a.status !== 'approved' || !active.has(a.businessId)) continue;
        const cur = latest.get(a.businessId);
        if (!cur || (a.reviewedAt ?? '') > (cur.reviewedAt ?? '')) latest.set(a.businessId, a);
      }
      return [...latest.values()].map((a) => ({
        id: a.id,
        businessId: a.businessId,
        imageUrl: a.imageUrl,
        title: a.title,
        body: a.body,
        reviewedAt: a.reviewedAt,
      })) as unknown as Row<T>[];
    }
    if (t === 'gmail_connections_public') {
      // Giống view SQL gmail_connections_public: chỉ dòng của người đang đăng nhập, không có token.
      return (data.gmail_connections ?? []).filter((c) => c.userId === userId) as unknown as Row<T>[];
    }
    return (data as unknown as Record<string, Row<T>[]>)[t];
  }
  const isView = (t: TableName) =>
    t === 'businesses_public' || t === 'campaigns_public' || t === 'ad_banners_public' || t === 'gmail_connections_public';
  const base = <T extends TableName>(t: T): Row<T>[] => {
    if (isView(t)) throw new Error(`${t} là view chỉ đọc`);
    return (data as unknown as Record<string, Row<T>[]>)[t as BaseTableName];
  };
  const find = <T extends TableName>(t: T, id: string) =>
    rowsOf(t).find((r) => (r[pk(t)] as unknown as string) === id) ?? null;

  const db: MemoryDb = {
    mode: 'demo',
    data,
    setUser(id) {
      userId = id;
    },
    snapshot: () => clone(data),
    currentUserId: () => userId,
    now,
    files: memoryFiles,

    async list<T extends TableName>(table: T, o: ListOptions<Row<T>> = {}) {
      let rows = rowsOf(table).slice();
      if (o.where) {
        const entries = Object.entries(o.where) as [keyof Row<T>, unknown][];
        rows = rows.filter((r) => entries.every(([k, v]) => r[k] === v));
      }
      if (o.in) {
        const entries = Object.entries(o.in) as [keyof Row<T>, unknown[]][];
        rows = rows.filter((r) => entries.every(([k, vs]) => vs.includes(r[k])));
      }
      if (o.order) {
        const { column, ascending = true } = o.order;
        rows.sort((a, b) => {
          const x = a[column as keyof Row<T>] as unknown as string | number;
          const y = b[column as keyof Row<T>] as unknown as string | number;
          if (x === y) return 0;
          return (x > y ? 1 : -1) * (ascending ? 1 : -1);
        });
      }
      if (o.limit) rows = rows.slice(0, o.limit);
      return clone(rows);
    },

    async get<T extends TableName>(table: T, id: string) {
      const r = find(table, id);
      return r ? clone(r) : null;
    },

    async insert<T extends TableName>(table: T, row: Partial<Row<T>>) {
      const key = pk(table);
      const full = { ...row } as Row<T>;
      if (!full[key]) (full as unknown as Record<string, unknown>)[key as string] = uid();
      // Như trigger SQL profiles_referral_code: hồ sơ mới tự có mã giới thiệu.
      if (table === 'profiles') {
        const p = full as unknown as Profile;
        if (!p.referralCode) p.referralCode = genReferralCode(p.displayName ?? '', codeTaken);
      }
      base(table).push(full);
      changed();
      return clone(full);
    },

    async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
      if (isView(table)) throw new Error(`${table} là view chỉ đọc`);
      const r = find(table, id);
      if (!r) throw new Error(`Không tìm thấy ${table}/${id}`);
      // Như trigger SQL profiles_referral_code_rename: mã sinh lúc chưa có tên ("FRE…") đổi theo tên đầu tiên,
      // khi chưa ai nhập mã này.
      if (table === 'profiles') {
        const p = r as unknown as Profile;
        const name = (patch as Partial<Profile>).displayName;
        const setsCode = (patch as Partial<Profile>).referralCode !== undefined;
        if (name && !p.displayName && !setsCode && !data.referrals.some((x) => x.referrerId === p.id)) {
          p.referralCode = genReferralCode(name, codeTaken);
        }
      }
      Object.assign(r, patch);
      changed();
      return clone(r);
    },

    async remove<T extends TableName>(table: T, id: string) {
      const list = base(table);
      const i = list.findIndex((r) => (r[pk(table)] as unknown as string) === id);
      if (i >= 0) list.splice(i, 1);
      changed();
    },

    async rpc<N extends RpcName>(name: N, args: Rpcs[N]['args']): Promise<Rpcs[N]['result']> {
      const fn = rpcs[name] as (a: Rpcs[N]['args']) => Rpcs[N]['result'];
      const result = fn(args);
      changed();
      return clone(result);
    },
  };

  /* ───────────────────────── RPC (giống supabase/migrations/*_rpc.sql) ───────────────────────── */

  const requireUser = () => {
    if (!userId) throw new Error('Cần đăng nhập');
    return userId;
  };
  const profile = (id: string) => {
    const p = find('profiles', id);
    if (!p) throw new Error('Không tìm thấy người dùng');
    return p;
  };
  const prefsOf = (id: string) => find('notification_prefs', id);
  const pushNotification = (n: Omit<AppNotification, 'id' | 'createdAt' | 'readAt'>) => {
    const row: AppNotification = { ...n, id: uid(), createdAt: now().toISOString(), readAt: null };
    data.notifications.push(row);
    return row;
  };
  const ledger = (u: string, delta: number, reason: string, tripId: string | null) => {
    data.points_ledger.push({ id: uid(), userId: u, delta, reason, tripId, createdAt: now().toISOString() });
    profile(u).points += delta;
  };
  const tripOf = (id: string, u: string) => {
    const t = find('trips', id);
    if (!t || t.userId !== u) throw new Error('Không tìm thấy chuyến');
    return t;
  };

  /* ───── Giới thiệu bạn bè (SQL: _referral_check, _referral_qualify, _referral_reward) ───── */

  const DAY_MS = 86_400_000;
  const R = POINTS_RULES.referral;
  const monthOf = (iso: string | Date) => {
    const p = vnParts(iso);
    return p.year * 12 + p.month;
  };
  /** Khách: tài khoản ẩn danh, chưa có số điện thoại (SQL: auth.jwt() is_anonymous). */
  const isGuest = (u: string) => !profile(u).phone;
  const nameOf = (id: string) => maskName(find('profiles', id)?.displayName ?? '');

  const REFERRAL_MSG: Record<ReferralCheckReason | 'newer', string> = {
    guest: 'Đăng nhập bằng số điện thoại để nhập mã giới thiệu.',
    already: 'Bạn đã nhập mã giới thiệu rồi. Mỗi tài khoản chỉ nhập được một mã.',
    too_late: `Chỉ nhập được mã trong ${R.enterDays} ngày đầu sau khi tạo tài khoản.`,
    not_found: 'Không tìm thấy mã này. Kiểm tra lại chữ và số.',
    own: 'Đây là mã của bạn. Hãy nhập mã của bạn bè.',
    newer: 'Mã này của tài khoản tạo sau bạn nên không áp dụng được.',
  };

  /** Kiểm tra mã theo thứ tự: khách → đã nhập → quá hạn → không có mã → mã của mình → chủ mã tạo sau. */
  const referralCheck = (u: string, raw: string): { owner: Profile } | { reason: ReferralCheckReason | 'newer' } => {
    const me = profile(u);
    if (isGuest(u)) return { reason: 'guest' };
    if (data.referrals.some((r) => r.refereeId === u)) return { reason: 'already' };
    if (now().getTime() - new Date(me.createdAt).getTime() > R.enterDays * DAY_MS) return { reason: 'too_late' };
    const code = normalizeReferralCode(raw);
    const owner = code ? data.profiles.find((p) => p.referralCode === code) : undefined;
    if (!owner) return { reason: 'not_found' };
    if (owner.id === u) return { reason: 'own' };
    if (new Date(owner.createdAt).getTime() > new Date(me.createdAt).getTime()) return { reason: 'newer' };
    return { owner };
  };

  /** Cộng thưởng cho cả hai bên, đánh dấu rewarded, báo người giới thiệu. */
  const referralReward = (r: Referral) => {
    const t = now().toISOString();
    ledger(r.refereeId, R.referee, `Nhập mã giới thiệu của ${nameOf(r.referrerId)}`, null);
    ledger(r.referrerId, R.referrer, `Giới thiệu bạn bè: ${nameOf(r.refereeId)}`, null);
    r.status = 'rewarded';
    r.rewardedAt = t;
    r.qualifiedAt ??= t;
    r.note = null;
    if (prefsOf(r.referrerId)?.points !== false) {
      pushNotification({
        userId: r.referrerId,
        category: 'trip',
        kind: 'points',
        icon: 'sparkplus',
        tone: 'tint',
        logo: 'frego',
        title: `${nameOf(r.refereeId)} vừa hoàn tất chuyến đầu, bạn được +${R.referrer} điểm`,
        body: 'Cảm ơn bạn đã giới thiệu Frego. Điểm dùng để đổi voucher ở mục Điểm thưởng.',
        cta: 'Xem bạn bè ›',
        link: '/gioi-thieu',
      });
    }
  };

  /** Hết hạn lượt chờ quá 30 ngày kể từ lúc nhập mã (tính lúc đọc). */
  const referralExpire = (r: Referral) => {
    if (r.status === 'pending' && now().getTime() - new Date(r.createdAt).getTime() > R.qualifyDays * DAY_MS) {
      r.status = 'expired';
      r.note = `Quá ${R.qualifyDays} ngày chưa có chuyến đầu`;
    }
  };

  /** Gọi khi người dùng vừa được cộng điểm báo giá: lần đầu sau khi nhập mã → thưởng / giữ lại. */
  const referralQualify = (u: string) => {
    const r = data.referrals.find((x) => x.refereeId === u && x.status === 'pending');
    if (!r) return;
    referralExpire(r);
    if (r.status !== 'pending') return;
    const t = now().toISOString();
    r.qualifiedAt = t;
    const referrer = profile(r.referrerId);
    const monthCount = data.referrals.filter(
      (x) => x.referrerId === r.referrerId && x.status === 'rewarded' && !!x.rewardedAt && monthOf(x.rewardedAt) === monthOf(t),
    ).length;
    if (referrer.status === 'locked' || profile(u).status === 'locked') {
      r.status = 'held';
      r.note = referrer.status === 'locked' ? 'Tài khoản người giới thiệu đang tạm khóa' : 'Tài khoản người mới đang tạm khóa';
    } else if (monthCount >= R.monthlyCap) {
      r.status = 'held';
      r.note = `Người giới thiệu đã đạt ${R.monthlyCap} lượt thưởng trong tháng`;
    } else {
      referralReward(r);
    }
  };

  /* ───── Ảnh tại quán (SQL: _trip_sponsor_shop) ───── */

  /** Quán tài trợ của chuyến: mã của quán đã gắn (ưu tiên hãng đã chọn), "uv:" → chiến dịch của voucher, "cp:" → chiến dịch. */
  const tripSponsorShop = (trip: Trip) => {
    const codes = trip.attached
      .filter((c) => c.source === 'sponsor')
      .sort((a, b) => Number(b.service === trip.chosenService) - Number(a.service === trip.chosenService));
    for (const code of codes) {
      const campaignId = code.refId.startsWith('uv:')
        ? (data.user_vouchers.find((v) => v.id === code.refId.slice(3) && v.userId === trip.userId)?.campaignId ?? null)
        : code.refId.startsWith('cp:')
          ? code.refId.slice(3)
          : null;
      const camp = campaignId ? find('campaigns', campaignId) : null;
      const biz = camp ? find('businesses', camp.businessId) : null;
      if (biz) return biz;
    }
    return null;
  };
  const actorName = () => (userId ? find('profiles', userId)?.displayName : '') || 'Vận hành Frego';

  const rpcs: { [N in RpcName]: (a: Rpcs[N]['args']) => Rpcs[N]['result'] } = {
    record_trip(a) {
      const u = requireUser();
      // Như SQL: khách (chưa có số điện thoại) không được phát mã của quán tài trợ.
      if (!profile(u).phone && a.attached.some((c) => c.refId.startsWith('cp:'))) {
        throw new Error('Cần đăng nhập để nhận mã của quán');
      }
      const t = now().toISOString();
      const attached = a.attached.map((c) => {
        if (!c.refId.startsWith('cp:')) return c;
        const campaignId = c.refId.slice(3);
        const camp = find('campaigns', campaignId);
        if (!camp || camp.status !== 'active') throw new Error('Chiến dịch đã dừng');
        const existing = data.user_vouchers.find(
          (v) => v.userId === u && v.campaignId === campaignId && v.status === 'active',
        );
        if (existing) return { ...c, refId: `uv:${existing.id}`, code: existing.code };
        const bizRow = find('businesses', camp.businessId)!;
        const v: UserVoucher = {
          id: uid(),
          userId: u,
          source: 'sponsor',
          campaignId,
          fregoCodeId: null,
          code: genCode(codePrefix(bizRow.name)),
          providerId: camp.providerId,
          vehicleClass: camp.vehicleClass,
          amount: camp.amount,
          note: `Ưu đãi khi đến gần ${bizRow.name}`,
          reasons: [`Điểm đến nằm trong vùng ${camp.radiusM} m quanh quán.`],
          status: 'active',
          issuedAt: t,
          expiresAt: camp.endsAt,
          usedAt: null,
          tripId: null,
        };
        data.user_vouchers.push(v);
        camp.issuedCount += 1;
        return { ...c, refId: `uv:${v.id}`, code: v.code };
      });
      const trip: Trip = {
        id: uid(),
        userId: u,
        originLabel: a.originLabel,
        originPlaceId: a.originPlaceId,
        destPlaceId: a.destPlaceId,
        destLabel: a.destLabel,
        distanceKm: a.distanceKm,
        durationMin: a.durationMin,
        attached,
        chosenService: a.chosenService,
        estimateLow: a.estimateLow,
        estimateHigh: a.estimateHigh,
        comparedCount: a.comparedCount,
        status: a.chosenService ? 'opened' : 'compared',
        verdict: null,
        paidAmount: null,
        reportSource: null,
        pointsAwarded: 0,
        createdAt: t,
        openedAt: a.chosenService ? t : null,
        codeUsedAt: null,
        reportedAt: null,
        adViewedAt: null,
      };
      data.trips.push(trip);
      // Như SQL (record_trip): chỉ lưu "Tìm gần đây" khi điểm đến có trong places (không lưu "biz:…", "geo:…").
      if (data.places.some((p) => p.id === a.destPlaceId)) {
        const recent = data.recent_searches.find((r) => r.userId === u && r.placeId === a.destPlaceId);
        if (recent) recent.searchedAt = t;
        else data.recent_searches.push({ id: uid(), userId: u, placeId: a.destPlaceId, searchedAt: t });
      }
      return trip;
    },

    mark_code_used({ tripId }) {
      const u = requireUser();
      const trip = tripOf(tripId, u);
      if (trip.status !== 'opened' || !trip.chosenService) return { trip, notification: null };
      const t = now().toISOString();
      trip.status = 'code_used';
      trip.codeUsedAt = t;
      const code = trip.attached.find((c) => c.service === trip.chosenService) ?? null;
      const { providerId, vehicleClass } = parseServiceKey(trip.chosenService);
      if (code) {
        let campaignId: string | null = null;
        let userVoucherId: string | null = null;
        if (code.refId.startsWith('uv:')) {
          const v = find('user_vouchers', code.refId.slice(3));
          if (v) {
            v.status = 'used';
            v.usedAt = t;
            v.tripId = trip.id;
            campaignId = v.campaignId;
            userVoucherId = v.id;
          }
        } else if (code.refId.startsWith('pc:')) {
          const pcRow = find('public_codes', code.refId.slice(3));
          if (pcRow) pcRow.usedCount += 1;
        }
        const camp = campaignId ? find('campaigns', campaignId) : null;
        const fee = camp ? brand.serviceFeePerCode : 0;
        if (camp) {
          camp.usedCount += 1;
          camp.spent += code.amount + fee;
        }
        data.redemptions.push({
          id: uid(),
          source: code.source,
          userVoucherId,
          publicCodeId: code.refId.startsWith('pc:') ? code.refId.slice(3) : null,
          campaignId,
          businessId: camp?.businessId ?? null,
          providerId,
          vehicleClass,
          amount: code.amount,
          fee,
          tripId: trip.id,
          usedAt: t,
          providerConfirmed: false,
          deductedAt: null,
        });
        const p = profile(u);
        p.savedAmount += code.amount;
        p.savedCount += 1;
      }
      let notification: AppNotification | null = null;
      if (prefsOf(u)?.report !== false) {
        notification = pushNotification({
          userId: u,
          category: 'trip',
          kind: 'code_used',
          icon: 'receipt',
          tone: 'tint',
          logo: providerId,
          title: code
            ? `Mã ${code.code} vừa được dùng cho chuyến ${PROVIDERS[providerId].name}`
            : `Chuyến ${PROVIDERS[providerId].name} đã hoàn tất`,
          body: 'Giá thật tiết kiệm được bao nhiêu? Bấm đánh giá để được cộng điểm.',
          cta: 'Báo giá ›',
          link: `/bao-gia/${trip.id}`,
        });
      }
      return { trip, notification };
    },

    report_price({ tripId, verdict, paidAmount }) {
      const u = requireUser();
      const trip = tripOf(tripId, u);
      if (!trip.chosenService) throw new Error('Chuyến chưa chọn hãng');
      if (profile(u).status === 'locked') throw new Error('Tài khoản đang tạm khóa');
      const svc = SERVICES[trip.chosenService];
      const label = serviceShortLabel(svc.providerId, svc.vehicleClass);
      const noData = !data.fare_tables.some(
        (f) => f.providerId === svc.providerId && f.vehicleClass === svc.vehicleClass && f.enabled,
      );
      const mult = noData ? POINTS_RULES.noDataMultiplier : 1;
      const t = now().toISOString();
      // Giới hạn điểm báo giá mỗi ngày (giờ VN).
      const dayOf = (iso: string) => Math.floor((new Date(iso).getTime() + 7 * 3600_000) / 86_400_000);
      const today = dayOf(t);
      let usedToday = data.points_ledger
        .filter((e) => e.userId === u && e.tripId && e.delta > 0 && dayOf(e.createdAt) === today)
        .reduce((sum, e) => sum + e.delta, 0);
      let held: string | null = null;
      const grant = (pts: number, reason: string) => {
        const give = Math.max(0, Math.min(pts, POINTS_RULES.dailyCap - usedToday));
        if (give < pts) held = `Đã đạt giới hạn ${POINTS_RULES.dailyCap} điểm hôm nay, phần còn lại được giữ để kiểm tra.`;
        if (give > 0) {
          ledger(u, give, reason, trip.id);
          usedToday += give;
        }
        return give;
      };
      let awarded = 0;
      let reported = false;
      if (verdict && trip.verdict === null) {
        trip.verdict = verdict;
        trip.reportSource ??= 'tap';
        awarded += grant(POINTS_RULES.tap * mult, `Báo giá một chạm, ${label}`);
        reported = true;
      }
      if (typeof paidAmount === 'number' && paidAmount > 0 && trip.paidAmount === null) {
        if (paidAmount > 5_000_000) throw new Error('Số tiền không hợp lệ');
        trip.paidAmount = paidAmount;
        trip.reportSource = 'amount';
        reported = true;
        const lo = trip.estimateLow;
        const hi = trip.estimateHigh;
        if (!trip.verdict && lo !== null && hi !== null) {
          trip.verdict = paidAmount < lo ? 'cheaper' : paidAmount > hi ? 'pricier' : 'within';
        }
        const tooFar =
          lo !== null && hi !== null &&
          (paidAmount < lo * (1 - POINTS_RULES.maxDeviation) || paidAmount > hi * (1 + POINTS_RULES.maxDeviation));
        if (tooFar) {
          held = 'Số tiền lệch hơn 30% so với ước tính nên chưa cộng điểm. Frego sẽ kiểm tra lại.';
        } else {
          awarded += grant(
            POINTS_RULES.amount * mult,
            `Nhập số tiền chuyến ${PROVIDERS[svc.providerId].name}, trả ${formatVnd(paidAmount)}`,
          );
        }
      }
      if (reported) {
        trip.status = 'reported';
        trip.reportedAt = t;
        trip.pointsAwarded += awarded;
      }
      // Giới thiệu bạn bè: lần báo giá được cộng điểm đầu tiên sau khi nhập mã (điểm giới thiệu không tính vào giới hạn ngày).
      if (awarded > 0) referralQualify(u);
      return { trip, pointsAwarded: awarded, points: profile(u).points, held };
    },

    delete_my_account() {
      const u = requireUser();
      // Như SQL: tài khoản quản lý doanh nghiệp / quản trị phải liên hệ Frego (tránh mồ côi doanh nghiệp).
      if (profile(u).adminRole || data.business_members.some((m) => m.userId === u)) {
        throw new Error('Tài khoản đang quản lý doanh nghiệp hoặc quản trị: liên hệ Frego để xóa');
      }
      // Như "on delete cascade" từ profiles: xóa mọi dòng có userId của người này.
      for (const rows of Object.values(data) as unknown[][]) {
        for (let i = rows.length - 1; i >= 0; i--) {
          const r = rows[i] as { userId?: string };
          if (r && typeof r === 'object' && r.userId === u) rows.splice(i, 1);
        }
      }
      data.profiles = data.profiles.filter((p) => p.id !== u);
      // referrals: "on delete cascade" từ cả hai phía; app_banners.created_by: "on delete set null".
      data.referrals = data.referrals.filter((r) => r.referrerId !== u && r.refereeId !== u);
      for (const b of data.app_banners) if (b.createdBy === u) b.createdBy = null;
      userId = null;
      return { deleted: true as const };
    },
    redeem_reward({ rewardId }) {
      const u = requireUser();
      const reward = find('rewards', rewardId);
      if (!reward || !reward.active) throw new Error('Quà không còn');
      const p = profile(u);
      if (p.points < reward.cost) throw new Error(`Thiếu ${formatNumber(reward.cost - p.points)} điểm`);
      const fc = find('frego_codes', reward.fregoCodeId)!;
      const label = serviceShortLabel(reward.providerId, reward.vehicleClass);
      ledger(u, -reward.cost, `Đổi voucher ${label} ${formatDiscount(reward.amount)}`, null);
      reward.redeemedCount += 1;
      fc.issuedCount += 1;
      const issued = now();
      const v: UserVoucher = {
        id: uid(),
        userId: u,
        source: 'frego',
        campaignId: null,
        fregoCodeId: fc.id,
        code: fc.code,
        providerId: reward.providerId,
        vehicleClass: reward.vehicleClass,
        amount: reward.amount,
        note: `Đổi từ ${formatNumber(reward.cost)} điểm thưởng`,
        reasons: [],
        status: 'active',
        issuedAt: issued.toISOString(),
        expiresAt: new Date(issued.getTime() + fc.validDays * 86_400_000).toISOString(),
        usedAt: null,
        tripId: null,
      };
      data.user_vouchers.push(v);
      return { voucher: v, points: p.points };
    },

    vote_public_code({ publicCodeId, works }) {
      const u = requireUser();
      const code = find('public_codes', publicCodeId);
      if (!code) throw new Error('Không tìm thấy mã');
      const prev = data.code_votes.find((v) => v.userId === u && v.publicCodeId === publicCodeId);
      if (prev) {
        if (prev.works !== works) {
          if (prev.works) code.okReports24h -= 1;
          else code.badReports24h -= 1;
          prev.works = works;
          if (works) code.okReports24h += 1;
          else code.badReports24h += 1;
        }
      } else {
        data.code_votes.push({ id: uid(), userId: u, publicCodeId, works, createdAt: now().toISOString() });
        if (works) code.okReports24h += 1;
        else code.badReports24h += 1;
      }
      if (code.badReports24h >= brand.autoHideReportThreshold) code.status = 'hidden';
      return { ok: code.okReports24h, bad: code.badReports24h };
    },

    mark_all_notifications_read() {
      const u = requireUser();
      const t = now().toISOString();
      let count = 0;
      for (const n of data.notifications) {
        if (n.userId === u && !n.readAt) {
          n.readAt = t;
          count++;
        }
      }
      return { count };
    },

    ensure_welcome_voucher() {
      const u = requireUser();
      const fc = data.frego_codes.find((c) => c.kind === 'welcome' && c.active);
      if (!fc) return null;
      if (data.user_vouchers.some((v) => v.userId === u && v.fregoCodeId === fc.id)) return null;
      // Hết suất quà chào mừng thì không phát nữa.
      if (fc.quota !== null && fc.issuedCount >= fc.quota) return null;
      const issued = now();
      const v: UserVoucher = {
        id: uid(),
        userId: u,
        source: 'frego',
        campaignId: null,
        fregoCodeId: fc.id,
        code: fc.code,
        providerId: fc.providerId,
        vehicleClass: fc.vehicleClass,
        amount: fc.amount,
        note: 'Quà chào mừng khi bạn tham gia Frego',
        reasons: [],
        status: 'active',
        issuedAt: issued.toISOString(),
        expiresAt: new Date(issued.getTime() + fc.validDays * 86_400_000).toISOString(),
        usedAt: null,
        tripId: null,
      };
      data.user_vouchers.push(v);
      fc.issuedCount += 1;
      return v;
    },

    confirm_topup({ transactionId }) {
      const tx = find('wallet_transactions', transactionId);
      if (!tx || tx.kind !== 'topup') throw new Error('Không tìm thấy giao dịch nạp');
      const b = find('businesses', tx.businessId)!;
      if (tx.status !== 'done') {
        tx.status = 'done';
        b.walletBalance += tx.amount;
        data.audit_logs.push({
          id: uid(),
          actorName: 'Kế toán',
          actorRole: 'accounting',
          action: `Khớp nạp tiền ${formatVnd(tx.amount)}, ${b.name}`,
          createdAt: now().toISOString(),
        });
      }
      return { balance: b.walletBalance };
    },

    // Giống SQL payos_credit_topup (supabase/migrations/20261127001000_web_fixes.sql).
    payos_credit_topup({ orderCode, amount, reference }) {
      const tx = data.wallet_transactions.find((x) => x.kind === 'topup' && x.orderCode === orderCode);
      if (!tx) return { credited: false, balance: null, reason: 'not_found' };
      const b = find('businesses', tx.businessId)!;
      if (tx.status === 'done') return { credited: false, balance: b.walletBalance, reason: 'already' };
      if (tx.amount !== amount) return { credited: false, balance: b.walletBalance, reason: 'amount_mismatch' };
      tx.status = 'done';
      if (reference) tx.note = `Nạp qua PayOS · mã giao dịch ${reference}`;
      b.walletBalance += tx.amount;
      data.audit_logs.push({
        id: uid(),
        actorName: 'PayOS',
        actorRole: 'system',
        action: `Tự khớp nạp tiền ${formatVnd(tx.amount)} qua PayOS, ${b.name}`,
        createdAt: now().toISOString(),
      });
      return { credited: true, balance: b.walletBalance, reason: 'ok' };
    },

    register_business(a) {
      const u = requireUser();
      const t = now().toISOString();
      const b = {
        id: uid(),
        name: a.name,
        legalName: a.legalName ?? '',
        taxCode: a.taxCode ?? '',
        representative: a.representative ?? '',
        category: a.category ?? 'cafe',
        industry: a.industry ?? '',
        address: a.address ?? '',
        district: a.district ?? '',
        landmark: a.landmark ?? '',
        lat: a.lat ?? 10.7769,
        lng: a.lng ?? 106.7009,
        openHours: { weekdays: '07:00 – 22:00', saturday: '07:00 – 22:00', sunday: '07:00 – 22:00' },
        status: a.draft ? ('draft' as const) : ('pending' as const),
        walletBalance: 0,
        autoTopup: { enabled: false, amount: 2000000, threshold: 500000 },
        invoiceName: a.legalName ?? '',
        invoiceEmail: a.contactEmail ?? '',
        contactEmail: a.contactEmail ?? '',
        contactPhone: a.contactPhone ?? '',
        logoUrl: null,
        storefrontVerified: false,
        transferCode: 'FREGO ' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        notifyPrefs: { review: true, lowBalance: true, weekly: true },
        joinedAt: t,
      };
      data.businesses.push(b);
      data.business_members.push({ id: uid(), businessId: b.id, userId: u, email: a.contactEmail ?? '', role: 'owner', invitedAt: t });
      return b;
    },

    review_business({ businessId, approve, reason }) {
      const b = find('businesses', businessId);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      b.status = approve ? 'active' : 'rejected';
      data.audit_logs.push({
        id: uid(),
        actorName: 'Vận hành Frego',
        actorRole: 'ops',
        action: `${approve ? 'Duyệt' : 'Từ chối'} doanh nghiệp ${b.name}${!approve && reason ? `, lý do ${reason}` : ''}`,
        createdAt: now().toISOString(),
      });
      return b;
    },

    set_business_status({ businessId, status, reason }) {
      const b = find('businesses', businessId);
      if (!b) throw new Error('Không tìm thấy doanh nghiệp');
      b.status = status;
      if (status === 'locked') {
        for (const c of data.campaigns) {
          if (c.businessId === b.id && c.status === 'active') {
            c.status = 'paused';
            c.pausedBy = 'frego';
          }
        }
      }
      data.audit_logs.push({
        id: uid(),
        actorName: 'Vận hành Frego',
        actorRole: 'ops',
        action: `${status === 'locked' ? 'Tạm khóa' : 'Mở khóa'} ${b.name}${reason ? `, lý do ${reason}` : ''}`,
        createdAt: now().toISOString(),
      });
      return b;
    },

    set_user_status({ userId: target, status, reason }) {
      const p = profile(target);
      p.status = status;
      p.lockReason = status === 'locked' ? (reason ?? null) : null;
      data.audit_logs.push({
        id: uid(),
        actorName: 'Vận hành Frego',
        actorRole: 'ops',
        action: `${status === 'locked' ? 'Tạm khóa' : 'Mở khóa'} ${p.displayName}${reason ? `, lý do ${reason}` : ''}`,
        createdAt: now().toISOString(),
      });
      return p;
    },

    adjust_points({ userId: target, delta, reason }) {
      ledger(target, delta, reason, null);
      data.audit_logs.push({
        id: uid(),
        actorName: 'Hỗ trợ',
        actorRole: 'support',
        action: `Điều chỉnh ${delta > 0 ? '+' : ''}${delta} điểm cho ${profile(target).displayName}: ${reason}`,
        createdAt: now().toISOString(),
      });
      return { points: profile(target).points };
    },

    // Giống SQL record_ad_view (supabase/migrations/20261127000800_ad_banners.sql).
    record_ad_view({ tripId }) {
      const u = requireUser();
      const trip = tripOf(tripId, u);
      if (trip.adViewedAt) return { counted: false, campaignId: null };
      const code = trip.attached.find((c) => c.service === trip.chosenService && c.source === 'sponsor');
      if (!code) return { counted: false, campaignId: null };
      const campaignId = code.refId.startsWith('uv:')
        ? (find('user_vouchers', code.refId.slice(3))?.campaignId ?? null)
        : code.refId.startsWith('cp:')
          ? code.refId.slice(3)
          : null;
      const camp = campaignId ? find('campaigns', campaignId) : null;
      if (!camp) return { counted: false, campaignId: null };
      camp.adViewCount = (camp.adViewCount ?? 0) + 1;
      trip.adViewedAt = now().toISOString();
      return { counted: true, campaignId: camp.id };
    },

    // Giống SQL record_receipt (supabase/migrations/20261127001100_gmail_receipts.sql).
    record_receipt(a) {
      const u = a.userId ?? requireUser();
      data.gmail_receipts ??= [];
      data.gmail_connections ??= [];
      const prev = data.gmail_receipts.find((r) => r.userId === u && r.messageId === a.messageId);
      if (prev) return { status: prev.status, duplicate: true, tripId: prev.tripId, pointsAwarded: 0, held: prev.held };
      if (!data.gmail_connections.some((c) => c.userId === u)) throw new Error('Chưa liên kết Gmail');
      if (!(a.paidAmount > 0) || a.paidAmount > 5_000_000) throw new Error('Số tiền không hợp lệ');
      if (profile(u).status === 'locked') throw new Error('Tài khoản đang tạm khóa');
      const at = new Date(a.tripAt ?? a.receivedAt).getTime();
      if (Number.isNaN(at)) throw new Error('Thời gian không hợp lệ');

      // Chuyến cùng hãng, mở app hãng trong 3 giờ trước biên nhận (cho lệch đồng hồ 15 phút), mới nhất trước.
      const candidates = data.trips
        .filter((t) => {
          if (t.userId !== u || !t.chosenService || !t.openedAt) return false;
          if (parseServiceKey(t.chosenService).providerId !== a.providerId) return false;
          const o = new Date(t.openedAt).getTime();
          return o >= at - RECEIPT_MATCH_WINDOW_MS && o <= at + RECEIPT_CLOCK_SKEW_MS;
        })
        .sort((x, y) => (x.openedAt! < y.openedAt! ? 1 : -1));
      const trip = candidates.find((t) => t.paidAmount === null) ?? null;

      let status: 'matched' | 'unmatched' | 'already_reported' = 'unmatched';
      let tripId: string | null = null;
      let awarded = 0;
      let held: string | null = null;
      const t = now().toISOString();
      if (trip) {
        status = 'matched';
        tripId = trip.id;
        const svc = SERVICES[trip.chosenService!];
        const noData = !data.fare_tables.some(
          (f) => f.providerId === svc.providerId && f.vehicleClass === svc.vehicleClass && f.enabled,
        );
        const mult = noData ? POINTS_RULES.noDataMultiplier : 1;
        const dayOf = (iso: string) => Math.floor((new Date(iso).getTime() + 7 * 3600_000) / 86_400_000);
        const usedToday = data.points_ledger
          .filter((e) => e.userId === u && e.tripId && e.delta > 0 && dayOf(e.createdAt) === dayOf(t))
          .reduce((sum, e) => sum + e.delta, 0);
        const paid = a.paidAmount;
        trip.paidAmount = paid;
        trip.reportSource = 'receipt';
        const lo = trip.estimateLow;
        const hi = trip.estimateHigh;
        if (!trip.verdict && lo !== null && hi !== null) {
          trip.verdict = paid < lo ? 'cheaper' : paid > hi ? 'pricier' : 'within';
        }
        const tooFar =
          lo !== null && hi !== null &&
          (paid < lo * (1 - POINTS_RULES.maxDeviation) || paid > hi * (1 + POINTS_RULES.maxDeviation));
        if (tooFar) {
          held = 'Số tiền lệch hơn 30% so với ước tính nên chưa cộng điểm. Frego sẽ kiểm tra lại.';
        } else {
          const pts = POINTS_RULES.receipt * mult;
          const give = Math.max(0, Math.min(pts, POINTS_RULES.dailyCap - usedToday));
          if (give < pts) held = `Đã đạt giới hạn ${POINTS_RULES.dailyCap} điểm hôm nay, phần còn lại được giữ để kiểm tra.`;
          if (give > 0) {
            ledger(u, give, `Biên nhận email chuyến ${PROVIDERS[svc.providerId].name}, trả ${formatVnd(paid)}`, trip.id);
            awarded = give;
          }
        }
        trip.status = 'reported';
        trip.reportedAt = t;
        trip.pointsAwarded += awarded;
        if (awarded > 0) referralQualify(u);
      } else if (candidates[0]) {
        status = 'already_reported';
        tripId = candidates[0].id;
      }

      data.gmail_receipts.push({
        id: uid(),
        userId: u,
        messageId: a.messageId,
        providerId: a.providerId,
        paidAmount: a.paidAmount,
        receivedAt: new Date(a.receivedAt).toISOString(),
        tripAt: a.tripAt ?? null,
        pickup: a.pickup ?? null,
        dropoff: a.dropoff ?? null,
        promoCode: a.promoCode ?? null,
        tripId,
        status,
        pointsAwarded: awarded,
        held,
        createdAt: t,
      });
      return { status, duplicate: false, tripId, pointsAwarded: awarded, held };
    },

    /* ───── Giới thiệu bạn bè — giống SQL trong supabase/migrations/20261127001200_v3_referral_cover_photo.sql ───── */

    check_referral_code({ code }) {
      const u = requireUser();
      const r = referralCheck(u, code);
      if ('owner' in r) return { ok: true as const, ownerName: maskName(r.owner.displayName) };
      return {
        ok: false as const,
        reason: r.reason === 'newer' ? ('not_found' as const) : r.reason,
        message: REFERRAL_MSG[r.reason],
      };
    },

    apply_referral_code({ code }) {
      const u = requireUser();
      const r = referralCheck(u, code);
      if (!('owner' in r)) throw new Error(REFERRAL_MSG[r.reason]);
      data.referrals.push({
        id: uid(),
        referrerId: r.owner.id,
        refereeId: u,
        status: 'pending',
        createdAt: now().toISOString(),
        qualifiedAt: null,
        rewardedAt: null,
        note: null,
      });
      return { ownerName: maskName(r.owner.displayName) };
    },

    my_referrals() {
      const u = requireUser();
      const me = profile(u);
      if (!me.referralCode) me.referralCode = genReferralCode(me.displayName, codeTaken);
      const mine = data.referrals.filter((r) => r.referrerId === u || r.refereeId === u);
      mine.forEach(referralExpire);
      const t = now();
      const friends = mine
        .filter((r) => r.referrerId === u)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .map((r) => ({
          id: r.id,
          name: nameOf(r.refereeId),
          status: r.status,
          createdAt: r.createdAt,
          qualifiedAt: r.qualifiedAt,
          rewardedAt: r.rewardedAt,
        }));
      const entered = mine.find((r) => r.refereeId === u) ?? null;
      return {
        code: me.referralCode,
        accountCreatedAt: me.createdAt,
        guest: isGuest(u),
        monthRewarded: friends.filter((f) => f.status === 'rewarded' && f.rewardedAt && monthOf(f.rewardedAt) === monthOf(t)).length,
        friends,
        enteredBy: entered ? { name: nameOf(entered.referrerId), status: entered.status, createdAt: entered.createdAt } : null,
      };
    },

    referral_owner_name({ code }) {
      const c = normalizeReferralCode(code);
      const owner = c ? data.profiles.find((p) => p.referralCode === c) : undefined;
      return { ownerName: owner ? maskName(owner.displayName) : null };
    },

    admin_set_referral_status({ id, status, note }) {
      const r = find('referrals', id);
      if (!r) throw new Error('Không tìm thấy lượt giới thiệu');
      if (!(['rewarded', 'rejected', 'held'] as ReferralStatus[]).includes(status)) throw new Error('Trạng thái không hợp lệ');
      if (r.status === 'rewarded') throw new Error('Lượt này đã cộng điểm, không đổi được');
      if (status === 'rewarded') {
        referralReward(r);
      } else {
        r.status = status;
        r.note = note?.trim() || (status === 'rejected' ? 'Frego từ chối sau khi kiểm tra' : r.note);
      }
      data.audit_logs.push({
        id: uid(),
        actorName: 'Vận hành Frego',
        actorRole: 'ops',
        action: `${status === 'rewarded' ? 'Duyệt thưởng' : status === 'rejected' ? 'Từ chối' : 'Giữ lại'} lượt giới thiệu ${nameOf(r.referrerId)} → ${nameOf(r.refereeId)}${note?.trim() ? `, ghi chú ${note.trim()}` : ''}`,
        createdAt: now().toISOString(),
      });
      return r;
    },

    /* ───── Ảnh bìa Trang chủ ───── */

    active_home_cover() {
      const t = now().getTime();
      const cur = data.app_banners
        .filter((b) => b.status === 'scheduled' && new Date(b.startsAt).getTime() <= t && new Date(b.endsAt).getTime() > t)
        .sort((a, b) => (a.startsAt < b.startsAt ? 1 : -1))[0];
      return cur ? { imageUrl: cur.imageUrl, overlay: cur.overlay, title: cur.title } : null;
    },

    /* ───── Ảnh tại quán ───── */

    submit_shop_photo(a) {
      const u = requireUser();
      if (isGuest(u)) throw new Error('Đăng nhập bằng số điện thoại để gửi ảnh tại quán');
      if (profile(u).status === 'locked') throw new Error('Tài khoản đang tạm khóa');
      const trip = tripOf(a.tripId, u);
      const biz = tripSponsorShop(trip);
      if (!biz) throw new Error('Chuyến này không dùng mã của quán tài trợ');
      if (data.shop_photos.some((p) => p.tripId === trip.id)) throw new Error('Chuyến này đã gửi ảnh tại quán rồi');
      const sha = String(a.sha256 ?? '').toLowerCase();
      if (!/^[0-9a-f]{64}$/.test(sha)) throw new Error('Ảnh không hợp lệ');
      if (data.shop_photos.some((p) => p.sha256 === sha)) throw new Error('Ảnh này đã được gửi trước đây. Hãy chụp ảnh mới tại quán');
      if (!String(a.storagePath ?? '').startsWith(`${u}/`)) throw new Error('Ảnh không hợp lệ');
      const taken = new Date(a.takenAt).getTime();
      if (Number.isNaN(taken)) throw new Error('Giờ chụp không hợp lệ');
      if (taken > now().getTime() + 5 * 60_000) throw new Error('Giờ chụp không hợp lệ');
      const created = new Date(trip.createdAt).getTime();
      if (taken < created || taken > created + SHOP_PHOTO_RULES.windowHours * 3600_000) {
        throw new Error(`Ảnh phải chụp trong ${SHOP_PHOTO_RULES.windowHours} giờ sau chuyến đi`);
      }
      const lat = Number(a.lat);
      const lng = Number(a.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        throw new Error('Chưa có vị trí lúc chụp');
      }
      const d = Math.round(distanceM({ lat, lng }, biz));
      if (d > SHOP_PHOTO_RULES.maxDistanceM) {
        throw new Error(`Vị trí chụp cách quán ${d} m, cần ở trong vòng ${SHOP_PHOTO_RULES.maxDistanceM} m quanh quán`);
      }
      const row: ShopPhoto = {
        id: uid(),
        userId: u,
        tripId: trip.id,
        businessId: biz.id,
        storagePath: a.storagePath,
        sha256: sha,
        takenAt: new Date(taken).toISOString(),
        lat,
        lng,
        distanceM: d,
        status: 'pending',
        rejectReason: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now().toISOString(),
      };
      data.shop_photos.push(row);
      return row;
    },

    business_checkin_count({ businessId }) {
      return { count: data.shop_photos.filter((p) => p.businessId === businessId && p.status === 'approved').length };
    },

    review_shop_photo({ id, approve, reason }) {
      const photo = find('shop_photos', id);
      if (!photo) throw new Error('Không tìm thấy ảnh');
      if (photo.status !== 'pending') throw new Error('Ảnh này đã được xử lý');
      const why = (reason ?? '').trim();
      if (!approve && !why) throw new Error('Nhập lý do từ chối');
      const shop = find('businesses', photo.businessId)?.name ?? 'quán';
      const t = now().toISOString();
      photo.status = approve ? 'approved' : 'rejected';
      photo.rejectReason = approve ? null : why;
      photo.reviewedBy = actorName();
      photo.reviewedAt = t;
      if (approve) ledger(photo.userId, POINTS_RULES.shopPhoto, `Ảnh tại quán ${shop}`, null);
      if (prefsOf(photo.userId)?.points !== false) {
        pushNotification({
          userId: photo.userId,
          category: 'trip',
          kind: 'points',
          icon: approve ? 'sparkplus' : 'camera',
          tone: 'tint',
          logo: 'frego',
          title: approve ? `Ảnh tại ${shop} đã được duyệt, +${POINTS_RULES.shopPhoto} điểm` : `Ảnh tại ${shop} chưa được duyệt`,
          body: approve ? 'Cảm ơn bạn đã ghé quán. Điểm dùng để đổi voucher ở mục Điểm thưởng.' : `Lý do: ${why}`,
          cta: approve ? 'Đổi voucher ›' : '',
          link: '/diem-thuong',
        });
      }
      data.audit_logs.push({
        id: uid(),
        actorName: 'Vận hành Frego',
        actorRole: 'ops',
        action: `${approve ? 'Duyệt' : 'Từ chối'} ảnh tại quán ${shop}${approve ? '' : `, lý do ${why}`}`,
        createdAt: t,
      });
      return photo;
    },
  };

  return db;
}

/** Mã hóa base64 không cần Buffer (chạy được cả Node, trình duyệt, Hermes). */
function toBase64(bytes: Uint8Array): string {
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += abc[a >> 2]! + abc[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    out += b === undefined ? '=' : abc[((b & 15) << 2) | ((c ?? 0) >> 6)]!;
    out += c === undefined ? '=' : abc[c & 63]!;
  }
  return out;
}

/** DEMO: ảnh lưu thẳng dạng data URL; "công khai" và "riêng" là một. */
export const memoryFiles: FileStore = {
  async uploadPrivate(_businessId, file) {
    return `data:${file.contentType};base64,${toBase64(file.bytes)}`;
  },
  async viewUrl(ref) {
    return ref;
  },
  async publish(ref) {
    return ref;
  },
  async uploadLogo(_businessId, file) {
    return `data:${file.contentType};base64,${toBase64(file.bytes)}`;
  },
  async uploadHomeCover(file) {
    const storagePath = `demo/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${file.ext}`;
    return { imageUrl: `data:${file.contentType};base64,${toBase64(file.bytes)}`, storagePath };
  },
  async removeHomeCover() {
    /* DEMO: ảnh nằm trong dòng dữ liệu, không có kho riêng */
  },
  async uploadCheckinPhoto(userId, file) {
    const ext = 'uri' in file ? 'jpg' : file.ext;
    const path = `${userId}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    demoCheckinPhotos.set(path, 'uri' in file ? file.uri : `data:${file.contentType};base64,${toBase64(file.bytes)}`);
    return path;
  },
  async checkinPhotoUrl(storagePath) {
    return demoCheckinPhotos.get(storagePath) ?? null;
  },
};

/** DEMO: ảnh tại quán giữ trong bộ nhớ tiến trình (theo đường dẫn), mất khi tải lại — đủ cho bản chạy thử. */
const demoCheckinPhotos = new Map<string, string>();
