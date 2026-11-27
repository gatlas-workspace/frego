/**
 * Bộ máy gắn voucher cho chuyến (màn 2 "Gắn voucher cho chuyến") và so giá sau voucher (màn 2b).
 *
 * Quy tắc theo thiết kế:
 * - Mỗi hãng + loại xe được tối đa 1 mã mỗi chuyến.
 * - Frego tự gắn mã giảm nhiều nhất cho từng nhóm; hòa thì mã hết hạn sớm hơn, rồi mã Frego trước.
 * - Frego gắn mã theo số tiền người dùng được giảm, không theo tiền tài trợ.
 * - Mã không đủ điều kiện ghi rõ lý do.
 */
import { PROVIDERS, PROVIDER_ORDER, SERVICES, VEHICLE_ORDER, serviceKey, serviceShortLabel } from './catalog';
import { formatDate, formatDiscount, formatMeters, formatVnd, formatVndRange } from './format';
import { distanceM, roundMeters, type LatLng } from './geo';
import { applyDiscount, discountFor, estimateFare, midpoint, roundDiff, type FareRange } from './pricing';
import type {
  CategoryKey,
  CodeSource,
  FareTable,
  ISODate,
  Place,
  ProviderId,
  ServiceKey,
  VehicleClass,
} from './types';

/** Một mã có thể gắn: đã chuẩn hóa từ voucher tặng riêng, ưu đãi chiến dịch, mã Frego hoặc mã công khai. */
export interface CodeOffer {
  /** "uv:<id>" (mã trong ví), "cp:<campaignId>" (ưu đãi chiến dịch chưa nhận), "pc:<id>" (mã công khai) */
  refId: string;
  source: CodeSource;
  /** Đã nằm trong ví người dùng (tặng riêng / FREGO10) */
  inWallet: boolean;
  code: string;
  /** Tên hiện trên vé: tên quán hoặc mã */
  label: string;
  logo: CategoryKey | 'frego' | ProviderId;
  providerId: ProviderId;
  vehicleClasses: VehicleClass[];
  amount: number | null;
  percent: number | null;
  maxAmount: number | null;
  minFare: number | null;
  requiresPartner: { id: string; name: string } | null;
  airportOnly: boolean;
  area: (LatLng & { radiusM: number }) | null;
  hours: { from: string; to: string } | null;
  expiresAt: ISODate | null;
  sourceName: string | null;
  /** Mô tả cố định cho mã Frego */
  description: string | null;
}

export interface TripContext {
  origin: (LatLng & { isAirport?: boolean }) | null;
  dest: Place;
  km: number;
  minutes: number;
  at: Date | string | number;
  linkedPartnerIds: string[];
  fareTables: FareTable[];
}

export interface EligibleOffer {
  offer: CodeOffer;
  service: ServiceKey;
  /** Số tiền giảm ở đầu thấp của khoảng giá (dùng để xếp hạng) */
  discount: number;
  amountText: string;
  serviceText: string;
  conditionLine: string;
  metaText: string;
  tag: 'sponsor' | 'frego' | 'public';
}

export interface IneligibleOffer {
  offer: CodeOffer;
  /** "Grab · cần chuyến GrabCar từ 160.000đ" */
  line: string;
}

export type Selection = Partial<Record<ServiceKey, string | null>>;

export function fareFor(ctx: TripContext, service: ServiceKey): FareRange | null {
  const { providerId, vehicleClass } = SERVICES[service];
  const table = ctx.fareTables.find((t) => t.providerId === providerId && t.vehicleClass === vehicleClass && t.enabled);
  if (!table) return null;
  const r = estimateFare(table, { km: ctx.km, minutes: ctx.minutes, at: ctx.at });
  return { low: r.low, high: r.high };
}

function hm(s: string) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function withinHours(at: Date | string | number, hours: { from: string; to: string }) {
  const d = new Date(new Date(at).getTime() + 7 * 3600_000);
  const m = d.getUTCHours() * 60 + d.getUTCMinutes();
  return m >= hm(hours.from) && m < hm(hours.to);
}

/** Lý do không hợp (null = hợp) cho một dịch vụ cụ thể. */
export function ineligibleReason(offer: CodeOffer, service: ServiceKey, ctx: TripContext): string | null {
  const svc = SERVICES[service];
  if (offer.expiresAt && new Date(offer.expiresAt).getTime() < new Date(ctx.at).getTime()) return 'mã đã hết hạn';
  if (offer.requiresPartner && !ctx.linkedPartnerIds.includes(offer.requiresPartner.id)) {
    return `cần thẻ ${offer.requiresPartner.name}`;
  }
  if (offer.airportOnly && !ctx.dest.isAirport && !ctx.origin?.isAirport) {
    return 'chỉ cho chuyến đi hoặc đến sân bay';
  }
  if (offer.minFare) {
    const fare = fareFor(ctx, service);
    if (!fare || fare.low < offer.minFare) return `cần chuyến ${svc.productName} từ ${formatVnd(offer.minFare)}`;
  }
  if (offer.area) {
    const d = distanceM(ctx.dest, offer.area);
    if (d > offer.area.radiusM) return `điểm đến ngoài vùng ${formatMeters(offer.area.radiusM)} quanh quán`;
  }
  if (offer.hours && !withinHours(ctx.at, offer.hours)) {
    return `chỉ dùng từ ${offer.hours.from} đến ${offer.hours.to}`;
  }
  return null;
}

function conditionLine(offer: CodeOffer, ctx: TripContext): string {
  if (offer.source === 'frego') return offer.description ?? 'Mã riêng Frego.';
  if (offer.source === 'sponsor' && offer.area) {
    const radius = formatMeters(offer.area.radiusM);
    if (offer.inWallet) return `Tặng riêng cho bạn. Điểm đến trong vùng ${radius} quanh quán.`;
    const d = formatMeters(roundMeters(distanceM(ctx.dest, offer.area)));
    return `Điểm đến cách quán ${d}, trong vùng áp dụng ${radius}.`;
  }
  const parts: string[] = [];
  if (offer.minFare) parts.push(`Chuyến từ ${formatVnd(offer.minFare)}`);
  if (offer.requiresPartner) parts.push(`trả bằng thẻ ${offer.requiresPartner.name} của bạn`);
  if (offer.airportOnly) parts.push('đi hoặc đến sân bay');
  if (parts.length === 0) return 'Mã công khai, mọi cách thanh toán.';
  const s = parts.join(', ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

function metaText(offer: CodeOffer): string {
  if (offer.source === 'public') return `Nguồn: ${offer.sourceName ?? 'web'}`;
  return offer.expiresAt ? `HSD ${formatDate(offer.expiresAt)}` : '';
}

function amountText(offer: CodeOffer, discount: number): string {
  if (offer.percent && !offer.amount) return formatDiscount(discount);
  return formatDiscount(offer.amount ?? discount);
}

export interface OfferEvaluation {
  eligible: EligibleOffer[];
  ineligible: IneligibleOffer[];
  /** Mã Frego tự gắn cho từng nhóm hãng + loại xe */
  autoSelection: Selection;
}

/** Đánh giá toàn bộ mã cho một chuyến. */
export function evaluateOffers(offers: CodeOffer[], ctx: TripContext): OfferEvaluation {
  const eligible: EligibleOffer[] = [];
  const ineligible: IneligibleOffer[] = [];

  for (const offer of offers) {
    const services = VEHICLE_ORDER.filter((v) => offer.vehicleClasses.includes(v)).map((v) =>
      serviceKey(offer.providerId, v),
    );
    if (services.length === 0) continue;
    // Mã hết hạn không hiện.
    if (offer.expiresAt && new Date(offer.expiresAt).getTime() < new Date(ctx.at).getTime()) continue;

    let best: EligibleOffer | null = null;
    let firstReason: string | null = null;
    for (const service of services) {
      const reason = ineligibleReason(offer, service, ctx);
      if (reason) {
        firstReason ??= reason;
        continue;
      }
      const fare = fareFor(ctx, service);
      const discount = fare ? discountFor(fare.low, offer) : offer.amount ?? 0;
      if (!best || discount > best.discount) {
        best = {
          offer,
          service,
          discount,
          amountText: amountText(offer, discount),
          serviceText: serviceShortLabel(offer.providerId, SERVICES[service].vehicleClass),
          conditionLine: conditionLine(offer, ctx),
          metaText: metaText(offer),
          tag: offer.source,
        };
      }
    }
    if (best) eligible.push(best);
    // Ưu đãi chiến dịch chưa nhận chỉ liên quan khi điểm đến nằm trong vùng: không hợp thì ẩn.
    else if (firstReason && (offer.inWallet || offer.source !== 'sponsor')) ineligible.push({ offer, line: `${PROVIDERS[offer.providerId].name} · ${firstReason}` });
  }

  const autoSelection: Selection = {};
  const rank = (e: EligibleOffer) => [
    -e.discount,
    e.offer.expiresAt ? new Date(e.offer.expiresAt).getTime() : Number.MAX_SAFE_INTEGER,
    e.offer.source === 'frego' ? 0 : e.offer.source === 'sponsor' ? 1 : 2,
  ];
  const groups = new Map<ServiceKey, EligibleOffer[]>();
  for (const e of eligible) groups.set(e.service, [...(groups.get(e.service) ?? []), e]);
  for (const [service, list] of groups) {
    const sorted = [...list].sort((a, b) => {
      const ra = rank(a);
      const rb = rank(b);
      for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
      return 0;
    });
    autoSelection[service] = sorted[0].offer.refId;
  }

  // Thứ tự hiển thị: theo thứ tự nhóm được gắn, mã đang gắn trước.
  eligible.sort((a, b) => {
    const aSel = autoSelection[a.service] === a.offer.refId ? 0 : 1;
    const bSel = autoSelection[b.service] === b.offer.refId ? 0 : 1;
    if (aSel !== bSel) return aSel - bSel;
    return b.discount - a.discount;
  });

  return { eligible, ineligible, autoSelection };
}

/** Bật/tắt gắn một mã: mỗi nhóm tối đa 1 mã. */
export function toggleSelection(sel: Selection, offer: EligibleOffer): Selection {
  const current = sel[offer.service];
  return { ...sel, [offer.service]: current === offer.offer.refId ? null : offer.offer.refId };
}

export function selectedOffers(sel: Selection, evaluation: OfferEvaluation): EligibleOffer[] {
  return evaluation.eligible.filter((e) => sel[e.service] === e.offer.refId);
}

/** Nút cuối màn gắn voucher. */
export function attachCtaText(count: number): string {
  return count > 0 ? `So giá với ${count} voucher đã gắn` : 'So giá không dùng voucher';
}

/* ───────────────────────── So giá sau voucher ───────────────────────── */

export interface PriceRow {
  service: ServiceKey;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  mono: string;
  name: string;
  /** "Xe máy", "Ô tô 4 chỗ" */
  serviceName: string;
  priced: boolean;
  final: FareRange | null;
  base: FareRange | null;
  finalText: string;
  baseText: string;
  voucherText: string;
  attached: EligibleOffer | null;
  autoNote: string | null;
}

export function comparePrices(
  ctx: TripContext,
  vehicleClass: VehicleClass,
  evaluation: OfferEvaluation,
  sel: Selection,
): { rows: PriceRow[]; insight: string | null } {
  const rows: PriceRow[] = PROVIDER_ORDER.map((providerId) => {
    const service = serviceKey(providerId, vehicleClass);
    const svc = SERVICES[service];
    const provider = PROVIDERS[providerId];
    const fare = fareFor(ctx, service);
    const attached = evaluation.eligible.find((e) => e.service === service && sel[service] === e.offer.refId) ?? null;
    const autoNote =
      provider.autoPromo && new Date(provider.autoPromo.until).getTime() > new Date(ctx.at).getTime()
        ? provider.autoPromo.note
        : null;
    let final: FareRange | null = null;
    let base: FareRange | null = null;
    let voucherText = '';
    if (fare) {
      if (attached) {
        const d = applyDiscount(fare, attached.offer);
        final = { low: d.low, high: d.high };
        base = fare;
        const what = attached.offer.source === 'sponsor' ? `mã ${attached.offer.label}` : attached.offer.code;
        voucherText = `Đã gắn ${what}, giảm ${formatVnd(attached.discount)}`;
      } else {
        final = fare;
      }
    }
    return {
      service,
      providerId,
      vehicleClass,
      mono: provider.mono,
      name: provider.name,
      serviceName: svc.name,
      priced: !!fare,
      final,
      base,
      finalText: final ? formatVndRange(final.low, final.high) : '',
      baseText: base ? formatVndRange(base.low, base.high) : '',
      voucherText,
      attached,
      autoNote,
    };
  });

  rows.sort((a, b) => {
    if (a.priced !== b.priced) return a.priced ? -1 : 1;
    if (!a.final || !b.final) return 0;
    return a.final.low - b.final.low;
  });

  const priced = rows.filter((r) => r.priced && r.final);
  let insight: string | null = null;
  if (priced.length >= 2) {
    const cheapestBefore = [...priced].sort((a, b) => (a.base ?? a.final!).low - (b.base ?? b.final!).low)[0];
    const cheapestAfter = priced[0];
    if (cheapestBefore.providerId !== cheapestAfter.providerId) {
      const diff = roundDiff(midpoint(cheapestBefore.final!) - midpoint(cheapestAfter.final!));
      insight = `Trước voucher ${cheapestBefore.name} rẻ hơn. Sau khi gắn voucher, ${cheapestAfter.name} rẻ hơn khoảng ${formatVnd(diff)}.`;
    }
  }
  return { rows, insight };
}
