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
    const { message } = await svc.updateProfile({
      name: v.name ?? '',
      industry: (v.industry ?? '').trim(),
      address: v.address ?? '',
      invoiceName: (v.invoiceName ?? '').trim(),
      invoiceEmail: v.invoiceEmail ?? '',
      notifyPrefs: { review: v.notifyReview === 'on', lowBalance: v.notifyLowBalance === 'on', weekly: v.notifyWeekly === 'on' },
    });
    revalidatePath('/doanh-nghiep', 'layout');
    return okState(message);
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
