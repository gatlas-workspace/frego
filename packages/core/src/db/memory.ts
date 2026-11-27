/**
 * Cơ sở dữ liệu trong bộ nhớ cho chế độ DEMO (không cần Supabase).
 * Lệnh RPC được cài lại bằng JS, cùng quy tắc với hàm SQL trong supabase/migrations.
 */
import { brand } from '../brand';
import { PROVIDERS, SERVICES, parseServiceKey, serviceShortLabel } from '../catalog';
import { formatDiscount, formatNumber, formatVnd } from '../format';
import { POINTS_RULES } from '../catalog';
import { DEMO_NOW } from '../seed/base';
import type { Db, ListOptions, RpcName, Rpcs } from './types';
import { PRIMARY_KEYS, type Row, type Seed, type TableName } from './schema';
import type { AppNotification, Trip, UserVoucher } from '../types';

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

  const pk = <T extends TableName>(t: T) => PRIMARY_KEYS[t] as keyof Row<T>;
  const find = <T extends TableName>(t: T, id: string) =>
    (data[t] as Row<T>[]).find((r) => (r[pk(t)] as unknown as string) === id) ?? null;

  const db: MemoryDb = {
    mode: 'demo',
    data,
    setUser(id) {
      userId = id;
    },
    snapshot: () => clone(data),
    currentUserId: () => userId,
    now,

    async list<T extends TableName>(table: T, o: ListOptions<Row<T>> = {}) {
      let rows = (data[table] as Row<T>[]).slice();
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
      (data[table] as Row<T>[]).push(full);
      changed();
      return clone(full);
    },

    async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
      const r = find(table, id);
      if (!r) throw new Error(`Không tìm thấy ${table}/${id}`);
      Object.assign(r, patch);
      changed();
      return clone(r);
    },

    async remove<T extends TableName>(table: T, id: string) {
      const list = data[table] as Row<T>[];
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

  const rpcs: { [N in RpcName]: (a: Rpcs[N]['args']) => Rpcs[N]['result'] } = {
    record_trip(a) {
      const u = requireUser();
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
      };
      data.trips.push(trip);
      const recent = data.recent_searches.find((r) => r.userId === u && r.placeId === a.destPlaceId);
      if (recent) recent.searchedAt = t;
      else data.recent_searches.push({ id: uid(), userId: u, placeId: a.destPlaceId, searchedAt: t });
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
      const svc = SERVICES[trip.chosenService];
      const label = serviceShortLabel(svc.providerId, svc.vehicleClass);
      const noData = !data.fare_tables.some(
        (f) => f.providerId === svc.providerId && f.vehicleClass === svc.vehicleClass && f.enabled,
      );
      const mult = noData ? POINTS_RULES.noDataMultiplier : 1;
      let awarded = 0;
      const t = now().toISOString();
      const alreadyTapped = trip.verdict !== null;
      const alreadyAmount = trip.paidAmount !== null;
      if (verdict && !alreadyTapped) {
        trip.verdict = verdict;
        trip.reportSource ??= 'tap';
        const pts = POINTS_RULES.tap * mult;
        ledger(u, pts, `Báo giá một chạm, ${label}`, trip.id);
        awarded += pts;
      }
      if (typeof paidAmount === 'number' && paidAmount > 0 && !alreadyAmount) {
        trip.paidAmount = paidAmount;
        trip.reportSource = 'amount';
        if (!trip.verdict && trip.estimateLow !== null && trip.estimateHigh !== null) {
          trip.verdict =
            paidAmount < trip.estimateLow ? 'cheaper' : paidAmount > trip.estimateHigh ? 'pricier' : 'within';
        }
        const pts = POINTS_RULES.amount * mult;
        ledger(u, pts, `Nhập số tiền chuyến ${PROVIDERS[svc.providerId].name}, trả ${formatVnd(paidAmount)}`, trip.id);
        awarded += pts;
      }
      if (awarded > 0) {
        trip.status = 'reported';
        trip.reportedAt = t;
        trip.pointsAwarded += awarded;
      }
      return { trip, pointsAwarded: awarded, points: profile(u).points };
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
      }
      return { balance: b.walletBalance };
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
  };

  return db;
}
