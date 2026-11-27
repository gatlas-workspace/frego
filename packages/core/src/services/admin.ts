/**
 * Dịch vụ Quản trị Frego — nhóm "Vận hành": tổng quan, duyệt, doanh nghiệp, chiến dịch, người dùng, kho mã.
 * Chạy trên Db bất kỳ (DEMO hoặc Supabase; RLS cho phép quản trị viên đọc toàn bộ).
 */
import type { Db } from '../db/types';

export function createAdminService(db: Db) {
  return {
    db,
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
