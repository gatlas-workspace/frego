/**
 * Dữ liệu mẫu riêng cho Cổng doanh nghiệp (Cà phê Mây). Agent/dev phụ trách cổng doanh nghiệp sở hữu file này.
 * Mỗi bảng là danh sách dòng được NỐI THÊM vào seed chung (xem seed/index.ts).
 *
 * Số liệu khớp thiết kế WebDn*.dc.html: ví 1.180.000đ sau các lần trừ 18/11 → 21/11 và một lần tự nạp 19/11,
 * chiến dịch thử nghiệm tháng 10 đã kết thúc (129 mã × 13.000đ = 1.677.000đ, bằng hóa đơn tháng 10).
 */
import type { Seed } from '../db/schema';
import { vn } from './base';

const BIZ = 'biz-cafe-may';

export const businessSeed: Partial<Seed> = {
  campaigns: [
    {
      // Đã kết thúc (không còn phát mã), nên không hiện trên app người dùng.
      id: 'cp-may-thang-10',
      businessId: BIZ,
      name: 'Thử nghiệm tháng 10',
      status: 'ended',
      rejectReason: null,
      pausedBy: null,
      providerId: 'grab',
      vehicleClass: 'bike',
      amount: 10000,
      radiusM: 300,
      hoursFrom: '07:00',
      hoursTo: '22:00',
      onlyOpenHours: true,
      dailyCap: 20,
      budget: 2000000,
      spent: 1677000,
      issuedCount: 410,
      usedCount: 129,
      startsAt: vn('2026-10-01 00:00'),
      endsAt: vn('2026-10-31 23:59'),
      imageUrl: null,
      submittedAt: vn('2026-09-28 10:00'),
      approvedAt: vn('2026-09-29 09:00'),
      createdAt: vn('2026-09-28 09:30'),
    },
  ],
  campaign_events: [
    { id: 'ce-may-xm-1', campaignId: 'cp-may-xe-may', at: vn('2026-10-30 10:00'), text: 'Gửi duyệt' },
    { id: 'ce-may-xm-2', campaignId: 'cp-may-xe-may', at: vn('2026-10-31 09:00'), text: 'Frego duyệt, bắt đầu chạy từ 01/11' },
    { id: 'ce-may-xm-3', campaignId: 'cp-may-xe-may', at: vn('2026-11-16 08:00'), text: 'Tạm dừng' },
    { id: 'ce-may-mm-1', campaignId: 'cp-may-mon-moi', at: vn('2026-11-22 15:45'), text: 'Gửi duyệt' },
    { id: 'ce-may-gs-1', campaignId: 'cp-may-giang-sinh', at: vn('2026-11-21 20:00'), text: 'Gửi duyệt' },
    {
      id: 'ce-may-gs-2',
      campaignId: 'cp-may-giang-sinh',
      at: vn('2026-11-22 09:30'),
      text: 'Frego từ chối, lý do: ảnh có số điện thoại và mã QR.',
    },
    { id: 'ce-may-t10-1', campaignId: 'cp-may-thang-10', at: vn('2026-09-28 10:00'), text: 'Gửi duyệt' },
    { id: 'ce-may-t10-2', campaignId: 'cp-may-thang-10', at: vn('2026-09-29 09:00'), text: 'Frego duyệt, bắt đầu chạy từ 01/10' },
    { id: 'ce-may-t10-3', campaignId: 'cp-may-thang-10', at: vn('2026-10-31 23:59'), text: 'Kết thúc, 129 mã được dùng' },
  ],
  // note: "Tiêu đề · dòng phụ" (cổng doanh nghiệp tách theo " · ").
  wallet_transactions: [
    { id: 'wt-1', businessId: BIZ, kind: 'deduction', amount: -437000, note: 'Mã được dùng ngày 21/11 · 19 mã Grab ô tô', status: 'done', reference: null, createdAt: vn('2026-11-22 00:05') },
    // Lần "Tôi đã chuyển khoản" còn chờ Frego khớp tiền (Quản trị · Tiền và đối soát).
    { id: 'wt-2', businessId: BIZ, kind: 'topup', amount: 5000000, note: 'Nạp chuyển khoản', status: 'pending', reference: 'FREGO CPM1024', createdAt: vn('2026-11-21 16:20') },
    { id: 'wt-3', businessId: BIZ, kind: 'deduction', amount: -299000, note: 'Mã được dùng ngày 20/11 · 13 mã Grab ô tô', status: 'done', reference: null, createdAt: vn('2026-11-21 00:05') },
    { id: 'wt-4', businessId: BIZ, kind: 'deduction', amount: -253000, note: 'Mã được dùng ngày 19/11 · 11 mã Grab ô tô', status: 'done', reference: null, createdAt: vn('2026-11-20 00:05') },
    { id: 'wt-5', businessId: BIZ, kind: 'topup', amount: 2000000, note: 'Tự nạp tiền · Số dư xuống dưới 500.000đ', status: 'done', reference: 'Thẻ đã lưu', createdAt: vn('2026-11-19 00:06') },
    { id: 'wt-6', businessId: BIZ, kind: 'deduction', amount: -276000, note: 'Mã được dùng ngày 18/11 · 12 mã Grab ô tô', status: 'done', reference: null, createdAt: vn('2026-11-19 00:05') },
  ],
  invoices: [
    { id: 'inv-2026-11', businessId: BIZ, month: '2026-11', amount: 8138000, status: 'draft', issuedAt: null },
    { id: 'inv-2026-10', businessId: BIZ, month: '2026-10', amount: 1677000, status: 'issued', issuedAt: vn('2026-11-01 08:00') },
  ],
};
