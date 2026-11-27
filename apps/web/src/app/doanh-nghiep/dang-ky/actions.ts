'use server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BizServiceError,
  DEMO_OWNER_ID,
  createBusinessService,
  createPhotonGeocoder,
  parseBizRegistration,
  registerBusiness,
  type Db,
  type MemoryDb,
} from '@frego/core';
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
    // Gợi ý chỗ đặt ghim: tìm địa chỉ đã khai (Photon/OSM, tối đa 4 giây); không thấy thì giữa TP.HCM.
    let pin = { lat: b.lat, lng: b.lng };
    if (!draft) {
      try {
        const hits = await createPhotonGeocoder({ timeoutMs: 4000 }).search(input.address, pin);
        const hit = hits.find((h) => typeof h.lat === 'number' && typeof h.lng === 'number');
        if (hit) pin = { lat: hit.lat!, lng: hit.lng! };
      } catch {
        /* giữ tọa độ mặc định */
      }
    }
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
      data: draft ? undefined : { businessId: b.id, lat: pin.lat, lng: pin.lng, email: input.contactEmail },
      at: Date.now(),
    };
  } catch (e) {
    return failState(e, 'Chưa gửi được hồ sơ. Thử lại sau ít phút.');
  }
}

/**
 * Bước 2 sau khi gửi hồ sơ: lưu vị trí ghim trên bản đồ (cột lat, lng của cửa hàng; chủ cửa hàng mới được sửa).
 * Vùng áp dụng của mã tính từ ghim này.
 */
export async function saveRegisteredPinAction(businessId: string, lat: number, lng: number): Promise<FormState> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { status: 'error', message: 'Vị trí không hợp lệ.', at: Date.now() };
  }
  // Ghim phải nằm trong khu vực đang phục vụ (TP.HCM và lân cận).
  if (lat < 10.3 || lat > 11.2 || lng < 106.3 || lng > 107.1) {
    return { status: 'error', message: 'Ghim đang nằm ngoài TP.HCM. Kéo bản đồ về đúng cửa hàng.', at: Date.now() };
  }
  try {
    const db = await getDb();
    if (MODE === 'demo' && !db.currentUserId()) (db as MemoryDb).setUser(DEMO_OWNER_ID);
    if (!db.currentUserId()) throw new BizServiceError('Đăng nhập lại để lưu vị trí.');
    await createBusinessService(db, businessId).updateProfile({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
    return { status: 'ok', message: 'Đã lưu vị trí cửa hàng.', at: Date.now() };
  } catch (e) {
    return failState(e, 'Chưa lưu được vị trí. Thử lại sau ít phút.');
  }
}
