'use server';
import { revalidatePath } from 'next/cache';
import { newPayosOrderCode } from '@frego/core';
import { bizService } from '@/lib/server/data';
import { createPayosPaymentLink, payosEnabled } from '@/lib/server/payos';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';

/**
 * "Tôi đã chuyển khoản": ghi lần nạp chờ khớp với nội dung chuyển khoản RIÊNG của lần này
 * (Frego khớp từng dòng ở Quản trị · Tiền và đối soát).
 */
export async function reportTransferAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const { message, transaction } = await svc.reportTransfer(Number(fd.get('amount')), String(fd.get('reference') ?? '') || null);
    revalidatePath('/doanh-nghiep/vi');
    return okState(message, transaction.reference ?? undefined);
  } catch (e) {
    return failState(e, 'Chưa ghi nhận được. Thử lại sau ít phút.');
  }
}

/**
 * Nạp qua PayOS (chỉ khi máy chủ có khóa PayOS): ghi lần nạp chờ với mã đơn, tạo link thanh toán VietQR ở máy chủ,
 * trả link để trình duyệt chuyển sang trang PayOS. Webhook /api/payos/webhook tự cộng tiền khi thanh toán xong.
 */
export async function startPayosTopupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!payosEnabled()) return { status: 'error', message: 'Chưa bật thanh toán PayOS. Dùng chuyển khoản bên dưới.', at: Date.now() };
  try {
    const { svc } = await bizService();
    const amount = Number(fd.get('amount'));
    const orderCode = newPayosOrderCode(Date.now());
    await svc.startPayosTopup(amount, orderCode);
    const url = await createPayosPaymentLink({ orderCode, amount, returnPath: `/doanh-nghiep/vi?payos=${orderCode}` });
    revalidatePath('/doanh-nghiep/vi');
    return okState('Đang mở trang thanh toán PayOS…', url);
  } catch (e) {
    return failState(e, 'Chưa tạo được link thanh toán PayOS. Thử lại, hoặc dùng chuyển khoản bên dưới.');
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
