'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type CoverState = { ok: boolean; message: string; id?: string; at: number } | null;

/**
 * Lưu ảnh bìa (QT 13): có tệp mới thì tải lên trước (JPG/PNG/WebP ≤ 500 KB; trang đã kiểm 1170 × 630 và tương phản),
 * rồi lưu nháp hoặc hẹn hiện (intent=draft|scheduled). Dịch vụ kiểm khung giờ, lớp phủ, trùng lịch; ghi nhật ký.
 */
export async function saveCoverAction(_prev: CoverState, fd: FormData): Promise<CoverState> {
  const { svc } = await adminOpsService();
  const get = (k: string) => String(fd.get(k) ?? '');
  try {
    let imageUrl = get('imageUrl') || undefined;
    let storagePath = get('storagePath') || undefined;
    const f = fd.get('file');
    if (f && typeof f !== 'string' && f.size > 0) {
      const up = await svc.uploadHomeCover(f, f.name);
      imageUrl = up.imageUrl;
      storagePath = up.storagePath;
    }
    const r = await svc.saveHomeCover({
      id: get('id') || undefined,
      title: get('title'),
      startsAt: get('startsAt'),
      endsAt: get('endsAt'),
      overlay: Number(get('overlay')),
      status: get('intent') === 'scheduled' ? 'scheduled' : 'draft',
      imageUrl,
      storagePath,
    });
    revalidatePath('/quan-tri/anh-bia');
    return { ok: true, message: r.message, id: r.cover.id, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa lưu được ảnh bìa. Thử lại.', at: Date.now() };
  }
}

/** Gỡ ảnh bìa (xóa khỏi lịch, app quay về ảnh mặc định nếu ảnh này đang hiện). */
export async function deleteCoverAction(_prev: CoverState, fd: FormData): Promise<CoverState> {
  const { svc } = await adminOpsService();
  try {
    const r = await svc.deleteHomeCover(String(fd.get('id') ?? ''));
    revalidatePath('/quan-tri/anh-bia');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa gỡ được ảnh. Thử lại.', at: Date.now() };
  }
}
