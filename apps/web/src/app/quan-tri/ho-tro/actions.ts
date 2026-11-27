'use server';
import { revalidatePath } from 'next/cache';
import type { SupportTicket } from '@frego/core';
import { adminOpsService } from '@/lib/server/data';

/** Đổi trạng thái yêu cầu hỗ trợ từ khung chi tiết (Nhận xử lý / Đánh dấu xong / Mở lại). */
export async function setTicketStatusAction(formData: FormData) {
  const { svc } = await adminOpsService();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as SupportTicket['status'];
  await svc.setTicketStatus(id, status);
  revalidatePath('/quan-tri/ho-tro');
}

export type ReplyState = { ok: boolean; message: string; at: number } | null;

/** Trả lời yêu cầu hỗ trợ (lưu vào ticket_messages, người gửi đọc được). */
export async function replyTicketAction(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const { svc } = await adminOpsService();
  try {
    const r = await svc.replyTicket(String(formData.get('id') ?? ''), String(formData.get('body') ?? ''));
    revalidatePath('/quan-tri/ho-tro');
    return { ok: true, message: r.message, at: Date.now() };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa gửi được trả lời. Thử lại.', at: Date.now() };
  }
}
