/**
 * Số liệu tổng hợp cho Quản trị · QT 7–12. Agent/dev phụ trách nhóm này sở hữu file này.
 * scope "platform" (cả nền tảng), period "2026-11" (tháng 10 để tính % so với tháng trước).
 * Job hằng đêm gộp từ redemptions, wallet_transactions, points_ledger, notifications, linked_accounts.
 */
import type { StatRow } from '../db/schema';
import { series } from './stats';

const P = 'platform';
const NOV = '2026-11';
const OCT = '2026-10';

export const adminOpsStats: StatRow[] = [
  /* QT 7 · Tiền và đối soát */
  // Tổng đã trừ ví doanh nghiệp trong tháng (giá trị giảm + phí dịch vụ).
  ...series(P, 'wallet_deducted', NOV, [['total', 67808000]]),
  // Mã tài trợ Frego ghi nhận đã dùng, theo hãng (cơ sở tính phí dịch vụ và đối soát).
  ...series(P, 'recon_recorded', NOV, [['grab', 2310], ['be', 1640], ['gsm', 170]]),
  ...series(P, 'recon_recorded', OCT, [['grab', 1700], ['be', 1210], ['gsm', 120]]),
  // Số chuyến hãng xác nhận có dùng mã.
  ...series(P, 'recon_confirmed', NOV, [['grab', 2302], ['be', 1640], ['gsm', 165]]),
  // Tiền giảm Frego phải trả hãng (đ).
  ...series(P, 'recon_payable', NOV, [['grab', 36371600], ['be', 16400000], ['gsm', 2475000]]),

  /* QT 8 · Điểm và mã Frego */
  ...series(P, 'points_awarded', NOV, [['total', 186400]]),
  ...series(P, 'points_awarded', OCT, [['total', 158000]]),
  ...series(P, 'price_reports', NOV, [['total', 3996]]),
  // Lượt áp dụng từng quy tắc; daily_cap = số người chạm giới hạn ngày.
  ...series(P, 'points_rule_uses', NOV, [['tap', 2840], ['amount', 736], ['receipt', 420], ['daily_cap', 12]]),
  // Lượt đổi quà trong tháng, theo id quà.
  ...series(P, 'reward_redeemed', NOV, [['rw-be', 220], ['rw-gsm', 80], ['rw-grab', 64]]),
  // Lượt dùng mã Frego trong tháng, theo id mã (cộng lại = codes_used_by_source.frego ở seed/stats-admin.ts).
  ...series(P, 'frego_code_used', NOV, [['fc-welcome', 31], ['fc-r-be', 220], ['fc-r-gsm', 80], ['fc-r-grab', 64]]),
  ...series(P, 'frego_code_budget', NOV, [['total', 10000000]]),

  /* QT 9 · Thông báo (tin ưu đãi chung tính từ bảng broadcasts) */
  ...series(P, 'notif_sent', NOV, [['gift', 12960], ['card', 3420], ['expire', 5870], ['report', 4120], ['points', 3996]]),
  ...series(P, 'notif_open_rate', NOV, [['gift', 0.41], ['card', 0.33], ['expire', 0.28], ['report', 0.62], ['points', 0.47], ['promo', 0.19]]),
  ...series(P, 'notif_off_rate', NOV, [['gift', 0.06], ['card', 0.11], ['expire', 0.09], ['report', 0.04], ['points', 0.07]]),
  // Số người đang bật từng loại tin (RLS không cho quản trị đọc cài đặt từng người).
  ...series(P, 'notif_opt_in', NOV, [['promo', 1880]]),

  /* QT 11 · Đối tác và liên kết: số người đã liên kết */
  ...series(P, 'partner_linked', NOV, [['vpb', 3240], ['klb', 610], ['momo', 5120], ['zalo', 1980], ['shopee', 870], ['gmail', 2150]]),
];
