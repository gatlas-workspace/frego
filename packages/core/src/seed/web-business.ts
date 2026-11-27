/**
 * Dữ liệu mẫu riêng cho Cổng doanh nghiệp (Cà phê Mây). Agent/dev phụ trách cổng doanh nghiệp sở hữu file này.
 * Mỗi bảng là danh sách dòng được NỐI THÊM vào seed chung (xem seed/index.ts).
 */
import type { Seed } from '../db/schema';
import { vn } from './base';

export const businessSeed: Partial<Seed> = {
  wallet_transactions: [
    { id: 'wt-1', businessId: 'biz-cafe-may', kind: 'deduction', amount: -391000, note: 'Trừ 17 mã ngày 21/11', status: 'done', reference: null, createdAt: vn('2026-11-22 00:05') },
    { id: 'wt-2', businessId: 'biz-cafe-may', kind: 'topup', amount: 5000000, note: 'Nạp chuyển khoản', status: 'pending', reference: 'FREGO CPM1024', createdAt: vn('2026-11-21 16:20') },
  ],
  invoices: [
    { id: 'inv-2026-11', businessId: 'biz-cafe-may', month: '2026-11', amount: 8138000, status: 'draft', issuedAt: null },
    { id: 'inv-2026-10', businessId: 'biz-cafe-may', month: '2026-10', amount: 1677000, status: 'issued', issuedAt: vn('2026-11-01 08:00') },
  ],
};
