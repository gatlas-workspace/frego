'use server';
import { revalidatePath } from 'next/cache';
import { adminService } from '@/lib/server/data';

export type ReviewState = { error: string; field?: 'reason'; at: number } | null;

/**
 * Duyệt / từ chối chiến dịch, hồ sơ doanh nghiệp hoặc banner quảng cáo. Từ chối cần lý do (gửi cho doanh nghiệp).
 * Làm mới cả khung quản trị để số chờ duyệt ở thanh bên giảm theo.
 */
export async function reviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const { svc } = await adminService();
  const kind = String(formData.get('kind') ?? '');
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '').trim();
  if (decision === 'reject' && !reason) {
    return { error: 'Nhập lý do để gửi doanh nghiệp trước khi từ chối.', field: 'reason', at: Date.now() };
  }
  try {
    if (kind === 'campaign') {
      if (decision === 'approve') await svc.approveCampaign(id);
      else await svc.rejectCampaign(id, reason);
    } else if (kind === 'business') {
      if (decision === 'approve') await svc.approveBusiness(id, { confirmMissing: formData.get('confirmMissing') === '1' });
      else await svc.rejectBusiness(id, reason);
    } else if (kind === 'banner') {
      if (decision === 'approve') await svc.approveBanner(id);
      else await svc.rejectBanner(id, reason);
    } else {
      return { error: 'Không rõ hồ sơ cần duyệt.', at: Date.now() };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Chưa lưu được quyết định. Thử lại.', at: Date.now() };
  }
  revalidatePath('/quan-tri', 'layout');
  return null;
}
