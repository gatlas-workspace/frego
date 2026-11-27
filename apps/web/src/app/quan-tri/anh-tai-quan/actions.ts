'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type PhotoReviewState = { ok: boolean; message: string; field?: 'reason'; at: number } | null;

/** Duyệt (+50 điểm cho người chụp) hoặc từ chối (cần lý do, gửi người dùng) một ảnh tại quán. */
export async function reviewPhotoAction(_prev: PhotoReviewState, fd: FormData): Promise<PhotoReviewState> {
  const { svc } = await adminOpsService();
  const id = String(fd.get('id') ?? '');
  const decision = String(fd.get('decision') ?? '');
  const reason = String(fd.get('reason') ?? '').trim();
  if (decision === 'reject' && !reason) {
    return { ok: false, field: 'reason', message: 'Nhập lý do để gửi người dùng trước khi từ chối.', at: Date.now() };
  }
  try {
    const r = await svc.reviewShopPhoto(id, decision === 'approve', reason || null);
    revalidatePath('/quan-tri/anh-tai-quan');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa lưu được quyết định. Thử lại.', at: Date.now() };
  }
}
