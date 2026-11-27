'use server';
import { revalidatePath } from 'next/cache';
import { bizService } from '@/lib/server/data';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';

/** "Gửi duyệt" ở trang Quảng cáo: ảnh + tiêu đề + nội dung → banner chờ Frego duyệt (kiểm tra trong submitAd). */
export async function submitAdAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const f = fd.get('file');
    const file =
      f && typeof f !== 'string' && f.size > 0
        ? { bytes: new Uint8Array(await f.arrayBuffer()), contentType: f.type, name: f.name }
        : null;
    const res = await svc.submitAd({
      file,
      title: String(fd.get('title') ?? ''),
      body: String(fd.get('body') ?? ''),
    });
    if (!res.ok) {
      return {
        status: 'error',
        message: res.error,
        fieldErrors: res.field ? { [res.field]: res.error } : undefined,
        at: Date.now(),
      };
    }
    revalidatePath('/doanh-nghiep/quang-cao');
    return okState('Đã gửi banner. Frego duyệt trong 1 ngày làm việc, banner đang chạy (nếu có) vẫn hiện tới lúc đó.');
  } catch (e) {
    return failState(e, 'Chưa gửi được banner. Thử lại sau ít phút.');
  }
}
