'use server';
import { revalidatePath } from 'next/cache';
import { parseVnd } from '@frego/core';
import { bizService } from '@/lib/server/data';
import { failState, okState } from '@/app/doanh-nghiep/_lib/fail';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';

/** Tạm dừng / chạy tiếp chiến dịch (WebDnChiTietChienDich: "Tạm dừng", "Tiếp tục chạy"). */
export async function setCampaignPausedAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get('id') ?? '');
  const paused = fd.get('paused') === '1';
  try {
    const { svc } = await bizService();
    const { message } = await svc.setCampaignPaused(id, paused);
    revalidatePath('/doanh-nghiep', 'layout');
    return okState(message);
  } catch (e) {
    return failState(e);
  }
}

/** Đổi ngân sách tối đa (không cần Frego duyệt lại). */
export async function updateCampaignBudgetAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const id = String(fd.get('id') ?? '');
  const budget = parseVnd(String(fd.get('budget') ?? ''));
  if (budget === null) return { status: 'error', message: 'Nhập số tiền, VD 15.000.000.', fieldErrors: { budget: 'Nhập số tiền, VD 15.000.000.' }, at: Date.now() };
  try {
    const { svc } = await bizService();
    const { message } = await svc.updateCampaignBudget(id, budget);
    revalidatePath('/doanh-nghiep', 'layout');
    return okState(message);
  } catch (e) {
    return failState(e);
  }
}
