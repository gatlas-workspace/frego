'use server';
import { revalidatePath } from 'next/cache';
import { adminService } from '@/lib/server/data';

export type BizActionState = { ok: boolean; op: string; message: string; field?: 'reason'; at: number } | null;

/** Nhắc nạp ví (ghi nhận), tạm khóa / mở khóa doanh nghiệp (RPC set_business_status: khóa thì dừng chiến dịch đang chạy). */
export async function bizAction(_prev: BizActionState, formData: FormData): Promise<BizActionState> {
  const { svc } = await adminService();
  const op = String(formData.get('op') ?? '');
  const id = String(formData.get('businessId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const at = Date.now();
  try {
    if (op === 'remind') {
      const r = await svc.remindTopup(id);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, op, message: `Đã gửi email nhắc nạp ví cho ${r.name}.`, at };
    }
    if (op === 'lock') {
      if (!reason) return { ok: false, op, message: 'Nhập lý do để gửi doanh nghiệp.', field: 'reason', at };
      await svc.setBusinessLocked(id, true, reason);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, op, message: 'Đã tạm khóa, doanh nghiệp được báo qua email.', at };
    }
    if (op === 'unlock') {
      await svc.setBusinessLocked(id, false);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, op, message: 'Đã mở khóa. Chiến dịch đã dừng cần cho chạy lại ở mục Chiến dịch.', at };
    }
    return { ok: false, op, message: 'Thao tác không hợp lệ.', at };
  } catch (e) {
    return { ok: false, op, message: e instanceof Error ? e.message : 'Chưa lưu được. Thử lại.', at };
  }
}
