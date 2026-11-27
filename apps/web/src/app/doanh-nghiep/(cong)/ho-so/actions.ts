'use server';
import { revalidatePath } from 'next/cache';
import type { BusinessMember } from '@frego/core';
import { bizService } from '@/lib/server/data';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import { formValues, type FormState } from '@/app/doanh-nghiep/_lib/form-state';

/** "Lưu thay đổi" ở Hồ sơ cửa hàng: chỉ các cột hồ sơ thành viên được sửa (xem BIZ_PROFILE_FIELDS). */
export async function saveProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const v = formValues(fd);
  try {
    const { svc } = await bizService();
    // Logo mới (ô chọn ảnh gửi kèm form với name="logo"); không chọn ảnh thì trình duyệt gửi tệp rỗng.
    const logo = fd.get('logo');
    let logoSaved = false;
    if (logo && typeof logo === 'object' && 'arrayBuffer' in logo && logo.size > 0) {
      await svc.updateLogo({ bytes: new Uint8Array(await logo.arrayBuffer()), contentType: logo.type, name: logo.name });
      logoSaved = true;
    }
    const { message } = await svc.updateProfile({
      name: v.name ?? '',
      industry: (v.industry ?? '').trim(),
      address: v.address ?? '',
      invoiceName: (v.invoiceName ?? '').trim(),
      invoiceEmail: v.invoiceEmail ?? '',
      notifyPrefs: { review: v.notifyReview === 'on', lowBalance: v.notifyLowBalance === 'on', weekly: v.notifyWeekly === 'on' },
    });
    revalidatePath('/doanh-nghiep', 'layout');
    return okState(logoSaved ? `Đã đổi logo. ${message}` : message);
  } catch (e) {
    return failState(e);
  }
}

/** Mời thành viên theo email. */
export async function inviteMemberAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const role: BusinessMember['role'] = fd.get('role') === 'owner' ? 'owner' : 'accountant';
  try {
    const { svc } = await bizService();
    const { message } = await svc.inviteMember(String(fd.get('email') ?? ''), role);
    revalidatePath('/doanh-nghiep/ho-so');
    return okState(message);
  } catch (e) {
    return failState(e);
  }
}

/** Xóa thành viên (chủ cửa hàng; không tự xóa mình, không xóa chủ cuối cùng). */
export async function removeMemberAction(memberId: string): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const { message } = await svc.removeMember(memberId);
    revalidatePath('/doanh-nghiep/ho-so');
    return okState(message);
  } catch (e) {
    return failState(e);
  }
}
