'use server';
import { revalidatePath } from 'next/cache';
import { formatNumber, parseVnd } from '@frego/core';
import { adminService } from '@/lib/server/data';

export type UserActionState = { ok: boolean; message: string; field?: 'delta' | 'reason'; at: number } | null;

/** Điều chỉnh điểm (RPC adjust_points), tạm khóa / mở khóa người dùng (RPC set_user_status). */
export async function userAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const { svc } = await adminService();
  const op = String(formData.get('op') ?? '');
  const userId = String(formData.get('userId') ?? '');
  const name = String(formData.get('name') ?? 'người dùng');
  const reason = String(formData.get('reason') ?? '').trim();
  const at = Date.now();
  try {
    if (op === 'points') {
      const raw = String(formData.get('delta') ?? '').trim().replace(/\s/g, '').replace('−', '-');
      const sign = raw.startsWith('-') ? -1 : 1;
      const abs = parseVnd(raw.replace(/^[+-]/, ''));
      if (!abs) return { ok: false, message: 'Nhập số điểm, VD: 50 hoặc -20.', field: 'delta', at };
      if (!reason) return { ok: false, message: 'Nhập lý do để ghi vào nhật ký.', field: 'reason', at };
      const delta = sign * abs;
      const r = await svc.adjustPoints(userId, delta, reason);
      revalidatePath('/quan-tri', 'layout');
      return {
        ok: true,
        message: `Đã ${delta > 0 ? 'cộng' : 'trừ'} ${formatNumber(Math.abs(delta))} điểm cho ${name}. Hiện có ${formatNumber(r.points)} điểm.`,
        at,
      };
    }
    if (op === 'lock') {
      if (!reason) return { ok: false, message: 'Nhập lý do tạm khóa.', field: 'reason', at };
      await svc.setUserLocked(userId, true, reason);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, message: `Đã tạm khóa ${name}. Người dùng không báo giá, đổi điểm được cho tới khi mở khóa.`, at };
    }
    if (op === 'unlock') {
      await svc.setUserLocked(userId, false);
      revalidatePath('/quan-tri', 'layout');
      return { ok: true, message: `Đã mở khóa ${name}.`, at };
    }
    return { ok: false, message: 'Thao tác không hợp lệ.', at };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Chưa lưu được. Thử lại.', at };
  }
}
