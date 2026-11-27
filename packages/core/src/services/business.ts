/**
 * Dịch vụ Cổng doanh nghiệp (apps/web /doanh-nghiep). Chạy trên Db bất kỳ (DEMO hoặc Supabase).
 * Doanh nghiệp chỉ thấy số liệu tổng, không thấy người nhận mã.
 */
import type { Db } from '../db/types';

export function createBusinessService(db: Db, businessId: string) {
  return {
    db,
    businessId,
    async getBusiness() {
      return db.get('businesses', businessId);
    },
  };
}

export type BusinessService = ReturnType<typeof createBusinessService>;
