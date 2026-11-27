'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type CreateCodeState = { ok: boolean; message: string; code?: string; at: number } | null;

/** Tạo mã Frego tự tài trợ (form "Tạo mã Frego"). */
export async function createFregoCodeAction(_prev: CreateCodeState, formData: FormData): Promise<CreateCodeState> {
  const { svc } = await adminOpsService();
  const get = (k: string) => String(formData.get(k) ?? '');
  try {
    const r = await svc.createFregoCode({
      code: get('code'),
      providerId: get('providerId'),
      vehicleClass: get('vehicleClass'),
      amount: get('amount'),
      title: get('title'),
      validDays: get('validDays'),
      active: formData.get('active') === 'on',
    });
    revalidatePath('/quan-tri/diem');
    return { ok: true, message: r.message, code: r.code.code, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa tạo được mã. Thử lại.', at: Date.now() };
  }
}

/** Chạy / tạm dừng mã Frego từ khung chi tiết mã. */
export async function setFregoCodeActiveAction(formData: FormData) {
  const { svc } = await adminOpsService();
  await svc.setFregoCodeActive(String(formData.get('id') ?? ''), formData.get('active') === 'true');
  revalidatePath('/quan-tri/diem');
}
