'use server';
import { revalidatePath } from 'next/cache';
import { adminService } from '@/lib/server/data';

export type CampaignActionState = { ok: boolean; message: string; field?: 'reason'; at: number } | null;

/** Frego tạm dừng ngay chiến dịch có vấn đề (kèm lý do) hoặc cho chạy lại chiến dịch Frego đã dừng. */
export async function campaignAction(_prev: CampaignActionState, formData: FormData): Promise<CampaignActionState> {
  const { svc } = await adminService();
  const op = String(formData.get('op') ?? '');
  const id = String(formData.get('campaignId') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  const at = Date.now();
  try {
    if (op === 'pause') {
      if (!reason) return { ok: false, message: 'Nhập lý do để báo doanh nghiệp.', field: 'reason', at };
      await svc.pauseCampaign(id, reason);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, message: 'Đã tạm dừng chiến dịch, doanh nghiệp được báo qua email. Mã đã phát vẫn dùng được đến hết hạn.', at };
    }
    if (op === 'resume') {
      await svc.resumeCampaign(id);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, message: 'Chiến dịch chạy lại, app phát mã như trước.', at };
    }
    return { ok: false, message: 'Thao tác không hợp lệ.', at };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa lưu được. Thử lại.', at };
  }
}
