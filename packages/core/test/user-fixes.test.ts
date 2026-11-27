// Sửa lỗi ưu tiên sau đợt thử vai trò (27/11/2026) — phần người dùng.
import { describe, expect, it } from 'vitest';
import { createMemoryDb, createSeed, createUserService, DEMO_OWNER_ID, DEMO_USER_ID } from '../src';

const setup = (userId = DEMO_USER_ID) => {
  const db = createMemoryDb(createSeed(), { userId });
  return { db, svc: createUserService(db) };
};

/** Khách "Xem voucher trước": hồ sơ không có số điện thoại. */
const guestSetup = async () => {
  const { db, svc } = setup();
  const guestId = '00000000-0000-4000-8000-00000000ff01';
  await db.insert('profiles', { ...db.data.profiles.find((p) => p.id === DEMO_USER_ID)!, id: guestId, phone: '', points: 0 });
  db.setUser(guestId);
  return { db, svc };
};

describe('tìm kiếm điểm đến', () => {
  it('từ đã gõ xong phải khớp nguyên từ: "nha tho duc ba" không ra Sân bay Tân Sơn Nhất', async () => {
    const { svc } = setup();
    const ids = (await svc.searchPlaces('nha tho duc ba')).map((p) => p.id);
    expect(ids).not.toContain('tan-son-nhat');
  });

  it('từ cuối vẫn khớp đầu từ khi đang gõ: "cho ben" ra Chợ Bến Thành', async () => {
    const { svc } = setup();
    expect((await svc.searchPlaces('cho ben')).map((p) => p.id)).toContain('ben-thanh');
  });
});

describe('điểm đón sửa được', () => {
  it('mặc định ghi rõ là điểm mặc định; đặt điểm đón tay thì tiêu đề chuyến và dòng Điểm đón đổi theo', async () => {
    const { svc } = setup();
    expect(await svc.currentOriginLabel()).toBe('Landmark 81 · điểm mặc định');
    const p = await svc.pickupFromPlace('ben-thanh');
    expect(p).toMatchObject({ name: 'Chợ Bến Thành', placeId: 'ben-thanh', source: 'manual' });
    svc.setPickup(p!);
    expect(await svc.currentOriginLabel()).toBe('Chợ Bến Thành');
    const plan = await svc.planTrip('tan-son-nhat');
    expect(plan.title).toBe('Chợ Bến Thành → Sân bay Tân Sơn Nhất');
    expect(plan.origin).toMatchObject({ placeId: 'ben-thanh' });
  });

  it('vị trí thật (GPS): bản đồ vẫn là "Vị trí hiện tại", tiêu đề dùng tên chỗ đứng', async () => {
    const { svc } = setup();
    svc.setPickup({ lat: 10.7769, lng: 106.7009, name: 'Đường Đồng Khởi', address: 'Đồng Khởi, Sài Gòn', placeId: null, source: 'gps' });
    expect(await svc.currentOriginLabel()).toBe('Vị trí hiện tại · Đường Đồng Khởi');
    const plan = await svc.planTrip('ben-thanh');
    expect(plan.origin.label).toBe('Vị trí hiện tại');
    expect(plan.title).toBe('Đường Đồng Khởi → Chợ Bến Thành');
  });
});

describe('khách chưa đăng nhập không nhận mã của quán tài trợ', () => {
  it('record_trip từ chối khi có mã chiến dịch ("cp:"), vẫn cho chuyến không có mã quán', async () => {
    const { svc } = await guestSetup();
    const plan = await svc.planTrip('ben-thanh');
    const rows = (await svc.compare(plan, plan.selection, 'car4')).rows;
    const grab = rows.find((r) => r.providerId === 'grab')!;
    expect(grab.attached?.offer.source).toBe('sponsor');
    await expect(svc.openProvider(plan, plan.selection, grab)).rejects.toThrow('Cần đăng nhập để nhận mã của quán');
    const be = rows.find((r) => r.providerId === 'be')!;
    const noSponsor = Object.fromEntries(
      Object.entries(plan.selection).filter(([, ref]) => !String(ref).startsWith('cp:')),
    );
    const view = await svc.openProvider(plan, noSponsor, be);
    expect(view.trip.attached.every((c) => !c.refId.startsWith('cp:'))).toBe(true);
  });
});

describe('mã tự nhập', () => {
  it('mã Frego chưa biết: không giả vờ "Đã thêm", trả về unknown để giữ trong danh sách', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const r = await svc.addCustomCode(plan, ' giam50k ');
    expect(r.matched).toBeNull();
    expect(r.unknown).toBe('GIAM50K');
    expect(r.message).toContain('chưa có thông tin mã GIAM50K');
  });
});

describe('Ví › Tại quán', () => {
  it('xem banner quán trong ngày → ưu đãi được lưu, mở lại được', async () => {
    const { svc } = setup();
    expect(await svc.shopOffers()).toEqual([]);
    const plan = await svc.planTrip('ben-thanh');
    const grab = (await svc.compare(plan, plan.selection, 'car4')).rows.find((r) => r.providerId === 'grab')!;
    const ad = await svc.sponsorAd(plan, grab);
    expect(ad?.banner).not.toBeNull();
    const view = await svc.openProvider(plan, plan.selection, grab);
    await svc.recordAdView(view.trip.id);
    const offers = await svc.shopOffers();
    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ name: 'Cà phê Mây', title: ad!.banner!.title });
    expect(offers[0].whenText).toMatch(/^Xem lúc \d{2}:\d{2} hôm nay/);
  });
});

describe('xóa tài khoản, tải dữ liệu', () => {
  it('tải dữ liệu gồm hồ sơ và lịch sử chuyến', async () => {
    const { svc } = setup();
    const data = JSON.parse(await svc.exportMyData());
    expect(data.hoSo.id).toBe(DEMO_USER_ID);
    expect(data.trips.length).toBeGreaterThan(0);
  });

  it('xóa tài khoản người dùng: mất hồ sơ, chuyến, voucher; số liệu tổng của quán giữ nguyên', async () => {
    const { db, svc } = setup();
    const issuedBefore = db.data.campaigns.map((c) => c.issuedCount);
    await svc.deleteMyAccount();
    expect(db.data.profiles.some((p) => p.id === DEMO_USER_ID)).toBe(false);
    expect(db.data.trips.some((t) => t.userId === DEMO_USER_ID)).toBe(false);
    expect(db.data.user_vouchers.some((v) => v.userId === DEMO_USER_ID)).toBe(false);
    expect(db.data.campaigns.map((c) => c.issuedCount)).toEqual(issuedBefore);
    expect(db.currentUserId()).toBeNull();
  });

  it('chủ quán không tự xóa được (tránh doanh nghiệp không còn chủ)', async () => {
    const { db, svc } = setup(DEMO_OWNER_ID);
    await expect(svc.deleteMyAccount()).rejects.toThrow('liên hệ Frego');
    expect(db.data.profiles.some((p) => p.id === DEMO_OWNER_ID)).toBe(true);
  });
});
