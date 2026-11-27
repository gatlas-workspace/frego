'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type AddPartnerState = { ok: boolean; message: string; at: number } | null;

/** Thêm ngân hàng, ví hoặc email cho người dùng liên kết (chỉ ghi nhận, chưa tích hợp). */
export async function addPartnerAction(_prev: AddPartnerState, formData: FormData): Promise<AddPartnerState> {
  const { svc } = await adminOpsService();
  const get = (k: string) => String(formData.get(k) ?? '');
  try {
    const r = await svc.addPartner({ kind: get('kind'), name: get('name'), description: get('description') });
    revalidatePath('/quan-tri/doi-tac');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa thêm được đối tác. Thử lại.', at: Date.now() };
  }
}
