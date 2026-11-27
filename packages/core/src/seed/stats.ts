/**
 * Số liệu tổng hợp mẫu (bảng `stats`). Trong hệ thống thật, job hằng đêm gộp từ redemptions/trips.
 * scope: "platform" | "biz:<businessId>" | "cp:<campaignId>"; period: "2026-11".
 */
import type { StatRow } from '../db/schema';

export function series(scope: string, metric: string, period: string, points: [string, number][]): StatRow[] {
  return points.map(([key, value], i) => ({ id: `${scope}|${metric}|${period}|${key}`, scope, metric, period, key, value, sort: i }));
}

/** Ngày 1..n của tháng 11/2026 → "2026-11-01" … */
export const novDays = (values: number[]): [string, number][] =>
  values.map((v, i) => [`2026-11-${String(i + 1).padStart(2, '0')}`, v]);

/** Mở rộng ở seed/stats-business.ts và seed/stats-admin.ts. */
export const baseStats: StatRow[] = [];
