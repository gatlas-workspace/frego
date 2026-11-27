/**
 * Dịch vụ Quản trị Frego — nhóm "Tiền, dữ liệu, hệ thống": tiền và đối soát, điểm và mã Frego,
 * thông báo, bảng giá ước tính, đối tác, hỗ trợ và nhật ký.
 */
import type { Db } from '../db/types';

export function createAdminOpsService(db: Db) {
  return {
    db,
  };
}

export type AdminOpsService = ReturnType<typeof createAdminOpsService>;
