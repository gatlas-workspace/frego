/**
 * Ước tính giá trước khi trừ mã (bảng giá QT 10) và giá sau voucher.
 *
 * E = giá mở cửa + mỗi km × (km − km mở cửa) + mỗi phút × phút
 * Khoảng giá: thấp = E làm tròn xuống nghìn; cao = E × hệ số (giờ cao điểm: peakFactor, thường: 1,05) làm tròn nghìn.
 * Giá cuối cùng luôn do app hãng hiển thị.
 */
import type { FareTable } from './types';
import { vnParts } from './format';

export interface FareRange {
  low: number;
  high: number;
}

export const OFF_PEAK_SPREAD = 1.05;

/** Khung giờ cao điểm TP.HCM: 07:00–09:00 và 16:30–19:30. */
export function isPeak(at: Date | string | number): boolean {
  const { hour, minute } = vnParts(at);
  const m = hour * 60 + minute;
  return (m >= 7 * 60 && m < 9 * 60) || (m >= 16 * 60 + 30 && m < 19 * 60 + 30);
}

export function baseFare(table: FareTable, km: number, minutes: number): number {
  const e = table.openFare + table.perKm * Math.max(0, km - table.openKm) + table.perMin * minutes;
  return Math.max(table.minFare, e);
}

export function estimateFare(
  table: FareTable,
  trip: { km: number; minutes: number; at: Date | string | number },
): FareRange & { peak: boolean } {
  const e = baseFare(table, trip.km, trip.minutes);
  const peak = isPeak(trip.at);
  const low = Math.floor(e / 1000) * 1000;
  const high = Math.round((e * (peak ? table.peakFactor : OFF_PEAK_SPREAD)) / 1000) * 1000;
  return { low, high: Math.max(high, low), peak };
}

/** Số tiền mã giảm cho một mức giá. */
export function discountFor(
  fare: number,
  code: { amount: number | null; percent: number | null; maxAmount: number | null },
): number {
  if (code.percent) {
    const d = Math.round((fare * code.percent) / 1000) * 1000;
    return Math.min(d, code.maxAmount ?? d, fare);
  }
  return Math.min(code.amount ?? 0, fare);
}

export function applyDiscount(
  range: FareRange,
  code: { amount: number | null; percent: number | null; maxAmount: number | null },
): FareRange & { discountLow: number; discountHigh: number } {
  const discountLow = discountFor(range.low, code);
  const discountHigh = discountFor(range.high, code);
  return { low: range.low - discountLow, high: range.high - discountHigh, discountLow, discountHigh };
}

export const midpoint = (r: FareRange) => (r.low + r.high) / 2;

/** Làm tròn chênh lệch để nói "khoảng 20.000đ". */
export function roundDiff(n: number, step = 5000): number {
  return Math.max(step, Math.round(Math.abs(n) / step) * step);
}
