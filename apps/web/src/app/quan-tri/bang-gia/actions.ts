'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type FareSaveState = { ok: boolean; message: string; at: number } | null;

/** Lưu bảng giá ước tính (form bên phải trang Bảng giá). */
export async function saveFareTableAction(_prev: FareSaveState, formData: FormData): Promise<FareSaveState> {
  const { svc } = await adminOpsService();
  const get = (k: string) => String(formData.get(k) ?? '');
  try {
    const r = await svc.updateFareTable(get('id'), {
      openFare: get('openFare'),
      perKm: get('perKm'),
      perMin: get('perMin'),
      peakFactor: get('peakFactor'),
      enabled: formData.get('enabled') === 'on',
    });
    revalidatePath('/quan-tri/bang-gia');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa lưu được bảng giá. Thử lại.', at: Date.now() };
  }
}
