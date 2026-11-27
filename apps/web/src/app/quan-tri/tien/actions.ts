'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type TopupMatchState = { ok: boolean; message: string; at: number } | null;

/** Khớp giao dịch nạp tiền đang chờ (RPC confirm_topup: cộng vào ví doanh nghiệp). */
export async function confirmTopupAction(_prev: TopupMatchState, formData: FormData): Promise<TopupMatchState> {
  const { svc } = await adminOpsService();
  const id = String(formData.get('transactionId') ?? '');
  try {
    const r = await svc.confirmTopup(id);
    revalidatePath('/quan-tri/tien');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa khớp được giao dịch. Thử lại.', at: Date.now() };
  }
}
