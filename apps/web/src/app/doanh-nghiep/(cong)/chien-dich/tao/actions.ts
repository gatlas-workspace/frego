'use server';
import { revalidatePath } from 'next/cache';
import { parseBizCampaignForm } from '@frego/core';
import { bizService } from '@/lib/server/data';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import { formValues, type FormState } from '@/app/doanh-nghiep/_lib/form-state';

/** Gửi Frego duyệt (intent=submit) hoặc lưu nháp (intent=draft). fromId: sửa chiến dịch nháp / bị từ chối. */
export async function createCampaignAction(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const { svc } = await bizService();
    const raw = formValues(fd);
    const { input, errors } = parseBizCampaignForm(raw, svc.db.now());
    if (!input) {
      return { status: 'error', message: 'Kiểm tra lại các ô được đánh dấu.', fieldErrors: errors as Record<string, string>, at: Date.now() };
    }
    const { campaign, message } = await svc.createCampaign(input, { draft: raw.intent === 'draft', fromId: raw.fromId || null });
    revalidatePath('/doanh-nghiep', 'layout');
    return { ...okState(message), note: campaign.id };
  } catch (e) {
    return failState(e);
  }
}
