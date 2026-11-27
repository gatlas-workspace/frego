// DEMO: số điện thoại mới tạo tài khoản riêng (như trigger handle_new_user), số của Minh Anh vẫn vào Minh Anh.
// Kèm: ví voucher có hãng / loại xe / hạn ngắn gọn; nhắc báo giá không nói mã "đã được dùng".
import { describe, expect, it } from 'vitest';
import { createMemoryDb, createSeed, createUserService, demoSignUp, DEMO_USER_ID } from '../src';

describe('DEMO: đăng nhập bằng số điện thoại', () => {
  it('số của Minh Anh vào tài khoản mẫu Minh Anh, không tạo hồ sơ mới', async () => {
    const db = createMemoryDb(createSeed());
    const before = db.data.profiles.length;
    expect(await demoSignUp(db, '+84909555123')).toEqual({ userId: DEMO_USER_ID, created: false });
    expect(db.data.profiles.length).toBe(before);
  });

  it('số mới tạo tài khoản trống lúc này; lần sau vào lại đúng tài khoản đó', async () => {
    const db = createMemoryDb(createSeed());
    const first = await demoSignUp(db, '+84912345678');
    expect(first.created).toBe(true);
    expect(first.userId).not.toBe(DEMO_USER_ID);
    const p = db.data.profiles.find((x) => x.id === first.userId)!;
    expect(p).toMatchObject({ phone: '+84912345678', displayName: '', points: 0, role: 'user', status: 'active', onboardedAt: null });
    expect(Math.abs(new Date(p.createdAt).getTime() - db.now().getTime())).toBeLessThan(5_000);
    expect(p.referralCode).toMatch(/^[A-Z0-9]{4,10}$/);
    expect(db.data.profiles.filter((x) => x.referralCode === p.referralCode)).toHaveLength(1);
    expect(db.data.consents.find((c) => c.userId === first.userId)).toMatchObject({ location: true, shareData: false, personalized: false });
    expect(db.data.notification_prefs.find((n) => n.userId === first.userId)).toMatchObject({ report: true, promo: false });

    const again = await demoSignUp(db, '+84912345678');
    expect(again).toEqual({ userId: first.userId, created: false });
    const other = await demoSignUp(db, '+84987654321');
    expect(other.created).toBe(true);
    expect(other.userId).not.toBe(first.userId);
  });

  it('tài khoản mới nhận quà chào mừng, chưa điền Thông tin, nhập được mã MINHA7K của Minh Anh', async () => {
    const db = createMemoryDb(createSeed());
    const { userId } = await demoSignUp(db, '+84912345678');
    db.setUser(userId);
    const svc = createUserService(db);
    const welcome = await svc.ensureWelcomeVoucher();
    expect(welcome?.code).toBe('FREGO20');
    expect((await svc.getReferral()).canEnter).toBe(true);
    expect(await svc.applyReferralCode('MINHA7K')).toEqual({ ownerName: 'Minh A.' });
    expect(db.data.referrals.find((r) => r.refereeId === userId)?.referrerId).toBe(DEMO_USER_ID);
  });

  it('dữ liệu đã lưu (JSON) nạp lại vẫn giữ tài khoản mới', async () => {
    const db = createMemoryDb(createSeed());
    const { userId } = await demoSignUp(db, '+84912345678');
    const saved = JSON.stringify(db.data);
    const db2 = createMemoryDb(createSeed());
    Object.assign(db2.data, JSON.parse(saved));
    expect(await demoSignUp(db2, '+84912345678')).toEqual({ userId, created: false });
    expect(await demoSignUp(db2, '+84909555123')).toEqual({ userId: DEMO_USER_ID, created: false });
  });
});

describe('ví voucher: hãng, loại xe, hạn', () => {
  it('mỗi quà có providerId / vehicleClass của voucher và endsText ngắn gọn', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    const wallet = await svc.getWallet();
    expect(wallet.gifts.length).toBeGreaterThan(0);
    for (const g of wallet.gifts) {
      const v = db.data.user_vouchers.find((x) => x.id === g.id)!;
      expect(g.providerId).toBe(v.providerId);
      expect(g.vehicleClass).toBe(v.vehicleClass);
      const soon = new Date(v.expiresAt).getTime() - db.now().getTime() <= 7 * 86_400_000;
      expect(g.endsText).toMatch(soon ? /^(Còn \d+ ngày|Hết hạn hôm nay)$/ : /^HSD \d{2}\/\d{2}$/);
    }
  });
});

describe('nhắc báo giá không nói mã "đã được dùng"', () => {
  it('thông báo mẫu và tiêu đề màn báo giá của chuyến cũ', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    for (const n of db.data.notifications) expect(n.title + n.body).not.toMatch(/được dùng/);
    const old = db.data.trips.find((t) => t.userId === DEMO_USER_ID && t.chosenService && t.id !== 'trip-today')!;
    const view = (await svc.getTrip(old.id))!;
    expect(view.codeUsedChip).not.toMatch(/vừa|được dùng/);
    expect(view.codeUsedChip).toMatch(new RegExp(`^Chuyến ${view.providerName} ngày \\d{2}/\\d{2}`));
  });
});
