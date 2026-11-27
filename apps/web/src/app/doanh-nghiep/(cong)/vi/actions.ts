'use server';
import { revalidatePath } from 'next/cache';
import { bizService } from '@/lib/server/data';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';

/** "Tôi đã chuyển khoản": ghi lần nạp chờ khớp (Frego khớp ở Quản trị · Tiền và đối soát). */
export async function reportTransferAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const { message } = await svc.reportTransfer(Number(fd.get('amount')));
    revalidatePath('/doanh-nghiep/vi');
    return okState(message);
  } catch (e) {
    return failState(e, 'Chưa ghi nhận được. Thử lại sau ít phút.');
  }
}

/** Bật/tắt tự nạp khi số dư thấp. */
export async function setAutoTopupAction(enabled: boolean): Promise<FormState> {
  try {
    const { svc } = await bizService();
    await svc.setAutoTopup(enabled);
    revalidatePath('/doanh-nghiep/vi');
    return okState(enabled ? 'Đã bật tự nạp.' : 'Đã tắt tự nạp.');
  } catch (e) {
    return failState(e);
  }
}

/** Email nhận hóa đơn (cùng cột với Hồ sơ cửa hàng · Xuất hóa đơn). */
export async function saveInvoiceEmailAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const email = String(fd.get('invoiceEmail') ?? '').trim();
    if (!email) return { status: 'error', message: 'Nhập email nhận hóa đơn.', at: Date.now() };
    const { business } = await svc.updateProfile({ invoiceEmail: email });
    revalidatePath('/doanh-nghiep', 'layout');
    return okState(`Đã lưu. Hóa đơn gửi tới ${business.invoiceEmail}.`);
  } catch (e) {
    return failState(e);
  }
}
