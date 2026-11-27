'use server';
import { revalidatePath } from 'next/cache';
import { adminOpsService } from '@/lib/server/data';

export type BroadcastState = {
  ok: boolean;
  intent: 'draft' | 'schedule';
  message: string;
  /** id bản tin vừa lưu (để lưu nháp lần sau sửa đúng dòng). */
  id?: string;
  at: number;
} | null;

/** Lưu nháp hoặc hẹn gửi tin ưu đãi chung (trường ẩn intent = draft | schedule). */
export async function broadcastAction(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const { svc } = await adminOpsService();
  const intent = formData.get('intent') === 'draft' ? 'draft' : 'schedule';
  const input = {
    id: String(formData.get('id') ?? '') || null,
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? ''),
    sendAt: String(formData.get('sendAt') ?? ''),
  };
  try {
    const r = intent === 'draft' ? await svc.saveBroadcastDraft(input) : await svc.scheduleBroadcast(input);
    revalidatePath('/quan-tri/thong-bao');
    return { ok: true, intent, message: r.message, id: r.broadcast.id, at: Date.now() };
  } catch (e) {
    return { ok: false, intent, message: e instanceof Error ? e.message : 'Chưa lưu được tin. Thử lại.', id: input.id ?? undefined, at: Date.now() };
  }
}
