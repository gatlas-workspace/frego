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
