/**
 * Số liệu tổng hợp cho web Quản trị (QT 1–6). Agent/dev phụ trách quản trị sở hữu file này.
 * Hệ thống thật: job hằng đêm gộp từ trips, redemptions, kết quả kiểm tra tự động khi gửi duyệt.
 *
 * scope "platform":
 * - kpi: active_users, users_total, compares, sponsor_codes_issued, price_reports (tháng 2026-11 và 2026-10 để so sánh)
 * - codes_used_by_source: sponsor | public | frego
 * - codes_used_daily: "2026-11-01" … (cộng lại bằng tổng mã được dùng)
 * - estimate_gap: "<hãng>|<quận>" → số báo giá đã có ở khu chưa đủ dữ liệu
 * - user_compares_30d: <userId> → lượt so giá 30 ngày qua
 * - meta: refreshed_at → mốc gộp số liệu (ms)
 * scope "cp:<id>" / "biz:<id>", metric review_check: kết quả kiểm tra tự động khi gửi duyệt (ảnh, mã số thuế…).
 */
import type { StatRow } from '../db/schema';
import { vn } from './base';
import { novDays, series } from './stats';
import { NGOC_LINH_ID } from './web-admin';

const NOV = '2026-11';
const OCT = '2026-10';

export const adminStats: StatRow[] = [
  ...series('platform', 'kpi', NOV, [
    ['active_users', 12480],
    ['users_total', 12480],
    ['compares', 38920],
    ['sponsor_codes_issued', 12960],
    ['price_reports', 3996],
  ]),
  ...series('platform', 'kpi', OCT, [
    ['active_users', 11450],
    ['users_total', 11620],
    ['compares', 34140],
    ['sponsor_codes_issued', 10210],
    ['price_reports', 3410],
  ]),
  ...series('platform', 'codes_used_by_source', NOV, [
    ['sponsor', 4120],
    ['public', 2610],
    ['frego', 395],
  ]),
  ...series('platform', 'codes_used_by_source', OCT, [
    ['sponsor', 3030],
    ['public', 2690],
    ['frego', 352],
  ]),
  ...series(
    'platform',
    'codes_used_daily',
    NOV,
    novDays([404, 278, 302, 268, 271, 316, 381, 408, 321, 269, 313, 285, 267, 380, 417, 305, 270, 287, 272, 318, 414, 379]),
  ),
  ...series('platform', 'estimate_gap', NOV, [
    ['gsm|Quận 1', 14],
    ['gsm|Quận 3', 9],
    ['gsm|Quận 7', 6],
  ]),
  ...series('platform', 'user_compares_30d', NOV, [
    ['00000000-0000-4000-8000-000000000001', 14],
    ['00000000-0000-4000-8000-000000000002', 6],
    ['00000000-0000-4000-8000-000000000003', 31],
    ['00000000-0000-4000-8000-000000000004', 22],
    [NGOC_LINH_ID, 0],
  ]),
  ...series('platform', 'meta', NOV, [['refreshed_at', new Date(vn('2026-11-22 17:40')).getTime()]]),
  // Kiểm tra tự động lúc gửi duyệt
  ...series('cp:cp-may-mon-moi', 'review_check', NOV, [
    ['image_width', 1080],
    ['image_height', 1080],
    ['image_phone', 0],
    ['image_qr', 0],
  ]),
  ...series('cp:cp-tra-sen-cuoi-tuan', 'review_check', NOV, [
    ['image_width', 800],
    ['image_height', 800],
    ['image_phone', 0],
    ['image_qr', 0],
  ]),
  ...series('cp:cp-tap-sang', 'review_check', NOV, [
    ['image_width', 1080],
    ['image_height', 1080],
    ['image_phone', 1],
    ['image_qr', 1],
  ]),
  ...series('biz:biz-qt-sach-gio-dk', 'review_check', NOV, [
    ['tax_active', 1],
    ['contact_verified', 1],
    ['license_address_match', 0],
    ['license_uploaded', 1],
  ]),
];
