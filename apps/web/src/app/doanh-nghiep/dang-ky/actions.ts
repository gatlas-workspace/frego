'use server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEMO_OWNER_ID, parseBizRegistration, registerBusiness, type Db, type MemoryDb } from '@frego/core';
import { MODE, getDb } from '@/lib/server/data';
import { failState } from '@/app/doanh-nghiep/_lib/fail';
import { formValues, type FormState } from '@/app/doanh-nghiep/_lib/form-state';

/**
 * DN 0 · Gửi đăng ký / lưu nháp hồ sơ doanh nghiệp (RPC register_business → hàng chờ "Duyệt" của quản trị).
 * Supabase: tạo tài khoản chủ cửa hàng bằng email + mật khẩu (auth.signUp) nếu chưa đăng nhập, rồi gọi RPC.
 * DEMO: người gửi là tài khoản chủ cửa hàng mẫu.
 */
export async function registerBusinessAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = formValues(fd);
  const draft = raw.intent === 'draft';
  const db = await getDb();
  const needPassword = MODE === 'supabase' && !db.currentUserId();
  const { input, password, errors } = parseBizRegistration(raw, { draft, needPassword });
  if (!input) {
    return { status: 'error', message: 'Kiểm tra lại các ô được đánh dấu.', fieldErrors: errors as Record<string, string>, at: Date.now() };
  }
  try {
    if (MODE === 'supabase') {
      const sdb = db as Db & { client: SupabaseClient; refreshUser(): Promise<string | null> };
      if (!sdb.currentUserId()) {
        const { data, error } = await sdb.client.auth.signUp({ email: input.contactEmail, password });
        if (error) {
          const exists = /already|registered|exists/i.test(error.message);
          return {
            status: 'error',
            message: exists ? 'Email này đã có tài khoản. Đăng nhập rồi mở lại trang đăng ký.' : 'Chưa tạo được tài khoản. Thử lại sau ít phút.',
            fieldErrors: exists ? { contactEmail: 'Email đã có tài khoản.' } : undefined,
            at: Date.now(),
          };
        }
        if (!data.session) {
          return {
            status: 'error',
            message: `Đã tạo tài khoản. Mở email xác nhận gửi tới ${input.contactEmail}, đăng nhập rồi gửi lại hồ sơ.`,
            at: Date.now(),
          };
        }
        await sdb.refreshUser();
      }
    } else if (!db.currentUserId()) {
      (db as MemoryDb).setUser(DEMO_OWNER_ID);
    }
    const b = await registerBusiness(db, input);
    const missing = [raw.hasLicense === '1' ? '' : 'giấy phép kinh doanh', raw.hasStorefront === '1' ? '' : 'ảnh mặt tiền'].filter(Boolean);
    return {
      status: 'ok',
      message: draft
        ? `Đã lưu nháp hồ sơ ${b.name}. Frego chưa xem hồ sơ cho tới khi bạn gửi đăng ký.`
        : `Đã gửi hồ sơ ${b.name}. Frego sẽ xem trong 1 ngày làm việc và báo qua email ${input.contactEmail}.`,
      note:
        !draft && missing.length
          ? `Hồ sơ còn thiếu ${missing.join(' và ')}. Bạn có thể bổ sung sau, Frego sẽ nhắc nếu cần để xác nhận vị trí.`
          : undefined,
      at: Date.now(),
    };
  } catch (e) {
    return failState(e, 'Chưa gửi được hồ sơ. Thử lại sau ít phút.');
  }
}
