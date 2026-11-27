/**
 * Dữ liệu mẫu riêng cho web Quản trị Frego. Agent/dev phụ trách quản trị sở hữu file này.
 * Mỗi bảng là danh sách dòng được NỐI THÊM vào seed chung (xem seed/index.ts).
 */
import type { Seed } from '../db/schema';
import { vn } from './base';

export const adminSeed: Partial<Seed> = {
  support_tickets: [
    { id: 'st-1', requesterName: 'Gia Huy', requesterKind: 'user', topic: 'points', subject: 'Chưa được cộng điểm báo giá', status: 'open', dueAt: null, createdAt: vn('2026-11-22 08:30') },
  ],
  audit_logs: [
    { id: 'al-1', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Xem chi tiết người dùng Minh Anh', createdAt: vn('2026-11-22 10:02') },
  ],
  broadcasts: [],
};
