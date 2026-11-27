/**
 * Số liệu tổng hợp cho Cổng doanh nghiệp. Agent/dev phụ trách cổng doanh nghiệp sở hữu file này.
 * Doanh nghiệp chỉ thấy số tổng (không có người nhận mã). Khớp thiết kế WebDnTongQuan, WebDnBaoCao, WebDnChiTietChienDich.
 *
 * scope "biz:<id>":
 *   totals (issued | used | spent)           tổng tháng: mã đã tặng, mã đã dùng, đã chi (giảm + phí)
 *   arrivals_daily ("2026-11-01"…)            chuyến đến vùng quán mỗi ngày (= mã được dùng)
 *   arrivals_by_hour ("7"…"22")              theo giờ trong ngày
 *   arrivals_by_weekday ("1"…"6", "0" = CN)   theo thứ trong tuần
 *   arrivals_by_service ("grab-car4"…)        theo hãng và loại xe
 *   origin_district ("Quận 3"…)               số chuyến theo quận nơi đón
 *   avg_distance_m ("all")                    điểm đến cách quán trung bình (m)
 *   audience_by_radius ("300"…"1000")         người dùng hay đặt xe tới vùng mỗi tháng (ước tính khi tạo chiến dịch)
 *   updated_at ("at")                         thời điểm gộp số liệu (ms)
 * scope "cp:<id>":
 *   codes_used_daily                          mã của chiến dịch được dùng mỗi ngày
 */
import type { StatRow } from '../db/schema';
import { vn } from './base';
import { novDays, series } from './stats';

const BIZ = 'biz:biz-cafe-may';
const NOV = '2026-11';
const OCT = '2026-10';

const octDays = (values: number[]): [string, number][] =>
  values.map((v, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, v]);

// Chiến dịch "Khách chiều quanh Chợ Bến Thành" (Grab ô tô 4 chỗ): 312 mã, cao nhất 21 mã ngày 14/11.
const chieu = [11, 12, 11, 13, 11, 15, 19, 18, 11, 12, 13, 14, 16, 21, 19, 11, 13, 12, 11, 13, 19, 17];
// "Xe máy cuối tuần" (Be xe máy): chỉ thứ Bảy, Chủ nhật; tạm dừng từ 16/11. 74 mã.
const xeMay = [15, 0, 0, 0, 0, 0, 16, 15, 0, 0, 0, 0, 0, 14, 14, 0, 0, 0, 0, 0, 0, 0];

export const businessStats: StatRow[] = [
  ...series(BIZ, 'totals', NOV, [
    ['issued', 1240],
    ['used', 386],
    ['spent', 8138000],
  ]),
  ...series(BIZ, 'totals', OCT, [
    ['issued', 410],
    ['used', 129],
    ['spent', 1677000],
  ]),
  // Tổng hai chiến dịch: 386 chuyến, cao nhất 35 ngày 7/11 và 14/11.
  ...series(BIZ, 'arrivals_daily', NOV, novDays(chieu.map((v, i) => v + xeMay[i]))),
  ...series(BIZ, 'arrivals_by_hour', NOV, [
    ['7', 6],
    ['8', 9],
    ['9', 12],
    ['10', 14],
    ['11', 18],
    ['12', 21],
    ['13', 26],
    ['14', 33],
    ['15', 52],
    ['16', 58],
    ['17', 45],
    ['18', 32],
    ['19', 24],
    ['20', 17],
    ['21', 12],
    ['22', 7],
  ]),
  ...series(BIZ, 'arrivals_by_weekday', NOV, [
    ['1', 41],
    ['2', 39],
    ['3', 44],
    ['4', 47],
    ['5', 62],
    ['6', 81],
    ['0', 72],
  ]),
  ...series(BIZ, 'arrivals_by_service', NOV, [
    ['grab-car4', 312],
    ['be-bike', 74],
  ]),
  // 24% · 18% · 15% · 11% · 9% · 23% của 386 chuyến.
  ...series(BIZ, 'origin_district', NOV, [
    ['Quận 3', 93],
    ['Bình Thạnh', 69],
    ['Quận 7', 58],
    ['Phú Nhuận', 42],
    ['Thủ Đức', 35],
    ['Quận khác', 89],
  ]),
  ...series(BIZ, 'avg_distance_m', NOV, [['all', 210]]),
  ...series(BIZ, 'audience_by_radius', NOV, [
    ['300', 900],
    ['500', 2300],
    ['800', 4100],
    ['1000', 5600],
  ]),
  ...series(BIZ, 'updated_at', NOV, [['at', Date.parse(vn('2026-11-22 17:35'))]]),

  ...series('cp:cp-may-chieu', 'codes_used_daily', NOV, novDays(chieu)),
  ...series('cp:cp-may-xe-may', 'codes_used_daily', NOV, novDays(xeMay)),
  // Thử nghiệm tháng 10 (Grab xe máy): 129 mã.
  ...series(
    'cp:cp-may-thang-10',
    'codes_used_daily',
    OCT,
    octDays([3, 4, 6, 6, 4, 3, 3, 4, 3, 6, 6, 3, 4, 3, 3, 4, 6, 6, 3, 4, 3, 3, 4, 6, 6, 3, 4, 3, 3, 4, 6]),
  ),
];
