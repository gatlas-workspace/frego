import { describe, expect, it } from 'vitest';
import {
  createAdminService,
  createBusinessService,
  createMemoryDb,
  createSeed,
  createUserService,
  DEMO_ADMIN_ID,
  DEMO_OWNER_ID,
  DEMO_USER_ID,
  type MemoryDb,
} from '../src';

const BIZ = 'biz-cafe-may';
const png = (n: number) => ({ bytes: new Uint8Array(n).fill(7), contentType: 'image/png', name: 'banner.png' });

/** Một CSDL dùng chung, đổi người đăng nhập theo vai trò (như web DEMO). */
function world() {
  const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
  const as = (id: string) => {
    db.setUser(id);
    return db;
  };
  return {
    db,
    user: () => createUserService(as(DEMO_USER_ID)),
    owner: () => createBusinessService(as(DEMO_OWNER_ID), BIZ),
    admin: () => createAdminService(as(DEMO_ADMIN_ID)),
  };
}

/** Chuyến tới Chợ Bến Thành, chọn hãng có mã của quán (Grab ô tô = Cà phê Mây tặng riêng). */
async function tripWithSponsor(db: MemoryDb, w: ReturnType<typeof world>) {
  const svc = w.user();
  const plan = await svc.planTrip('ben-thanh');
  const rows = (await svc.compare(plan, plan.selection, 'car4')).rows;
  const grab = rows.find((r) => r.providerId === 'grab')!;
  return { svc, plan, grab, rows, db };
}

describe('popup quảng cáo nhà tài trợ (màn 2c)', () => {
  it('hãng có mã của quán tài trợ → popup có banner đã duyệt, ghi 1 lượt xem mỗi chuyến', async () => {
    const w = world();
    const { svc, plan, grab } = await tripWithSponsor(w.db, w);
    const ad = await svc.sponsorAd(plan, grab);
    expect(ad).toMatchObject({
      name: 'Cà phê Mây',
      distanceText: 'Cách điểm đến 150 m',
      giftText: 'Voucher −20.000đ Grab ô tô chuyến này là quà của Cà phê Mây.',
      ctaLabel: 'Nhận mã giảm giá',
    });
    expect(ad!.banner?.title).toBe('Cà phê sữa đá mua 2 tặng 1');
    expect(ad!.banner?.imageUrl.startsWith('data:image/svg+xml')).toBe(true);

    const view = await svc.openProvider(plan, plan.selection, grab);
    expect(await svc.recordAdView(view.trip.id)).toBe(true);
    expect(await svc.recordAdView(view.trip.id)).toBe(false);
    expect(w.db.data.campaigns.find((c) => c.id === 'cp-may-chieu')!.adViewCount).toBe(87);
  });

  it('mã Frego / không mã → không có popup, không tính lượt xem', async () => {
    const w = world();
    const svc = w.user();
    const plan = await svc.planTrip('ben-thanh');
    const be = (await svc.compare(plan, plan.selection, 'bike')).rows.find((r) => r.providerId === 'be')!;
    expect(be.attached?.offer.code).toBe('FREGO20');
    expect(await svc.sponsorAd(plan, be)).toBeNull();
    const view = await svc.openProvider(plan, plan.selection, be);
    expect(await svc.recordAdView(view.trip.id)).toBe(false);
  });

  it('quán chưa có banner được duyệt → popup gọn (banner = null)', async () => {
    const w = world();
    const svc = w.user();
    const plan = await svc.planTrip('ben-thanh');
    // Grab xe máy: mã của Quán bún Ngõ Nhỏ (chưa có banner).
    const grabBike = (await svc.compare(plan, plan.selection, 'bike')).rows.find((r) => r.providerId === 'grab')!;
    const ad = await svc.sponsorAd(plan, grabBike);
    expect(ad?.name).toBe('Quán bún Ngõ Nhỏ');
    expect(ad?.banner).toBeNull();
    expect(ad?.giftText).toBe('Voucher −10.000đ Grab xe máy chuyến này là quà của Quán bún Ngõ Nhỏ.');
  });
});

describe('banner: doanh nghiệp gửi, Frego duyệt', () => {
  it('trang Quảng cáo: banner đang chạy, lượt xem, quy định', async () => {
    const w = world();
    const ad = await w.owner().getAd();
    expect(ad.running?.title).toBe('Cà phê sữa đá mua 2 tặng 1');
    expect(ad.running?.statusText).toBe('Đang hiện trong app từ 19/11/2026');
    expect(ad.pending).toBeNull();
    expect(ad.adViews.value).toBe('86');
    expect(ad.canSubmit).toBe(true);
  });

  it('kiểm tra ảnh, tiêu đề, nội dung trước khi gửi', async () => {
    const w = world();
    const o = w.owner();
    expect(await o.submitAd({ file: null, title: 'A', body: '' })).toMatchObject({ ok: false, field: 'file' });
    expect(await o.submitAd({ file: { ...png(10), contentType: 'image/gif' }, title: 'A', body: '' })).toMatchObject({ ok: false, field: 'file' });
    expect(await o.submitAd({ file: png(1024 * 1024 + 1), title: 'A', body: '' })).toMatchObject({ ok: false, error: 'Ảnh tối đa 1 MB.' });
    expect(await o.submitAd({ file: png(10), title: ' ', body: '' })).toMatchObject({ ok: false, field: 'title' });
    expect(await o.submitAd({ file: png(10), title: 'x'.repeat(41), body: '' })).toMatchObject({ ok: false, field: 'title' });
    expect(await o.submitAd({ file: png(10), title: 'Bánh mới', body: 'x'.repeat(121) })).toMatchObject({ ok: false, field: 'body' });
  });

  it('gửi → chờ duyệt (bản cũ vẫn chạy) → quản trị duyệt → bản mới hiện trong app, bản cũ thành "replaced"', async () => {
    const w = world();
    expect(await w.owner().submitAd({ file: png(10), title: 'Bánh croissant mới', body: 'Tặng kèm cà phê đen.' })).toEqual({ ok: true });
    const ad = await w.owner().getAd();
    expect(ad.pending?.title).toBe('Bánh croissant mới');
    expect(ad.running?.title).toBe('Cà phê sữa đá mua 2 tặng 1');
    expect(ad.canSubmit).toBe(false);
    expect(await w.owner().submitAd({ file: png(10), title: 'Lần 2', body: '' })).toMatchObject({ ok: false });

    const page = await w.admin().getReviewPage({ tab: 'banner' });
    expect(page.tabs.find((t) => t.key === 'banner')!.count).toBe('2'); // Cà phê Mây + Tiệm trà Sen
    const item = page.items.find((i) => i.title === 'Bánh croissant mới')!;
    const detail = (await w.admin().getReviewPage({ tab: 'banner', id: item.id })).selected!;
    expect(detail.kind).toBe('banner');
    expect(detail.banner?.imageUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(detail.checks[2]!.title).toBe('Quán đang có banner chạy');

    await w.admin().approveBanner(item.id);
    const banners = w.db.data.ad_banners.filter((a) => a.businessId === BIZ);
    expect(banners.find((a) => a.id === 'ad-may-1')!.status).toBe('replaced');
    expect(banners.find((a) => a.id === item.id)!.status).toBe('approved');

    const { svc, plan, grab } = await tripWithSponsor(w.db, w);
    expect((await svc.sponsorAd(plan, grab))!.banner?.title).toBe('Bánh croissant mới');
    expect(w.db.data.audit_logs.some((l) => l.action === 'Duyệt banner quảng cáo "Bánh croissant mới", Cà phê Mây')).toBe(true);
  });

  it('quản trị từ chối kèm lý do → doanh nghiệp thấy lý do, gửi lại được; app vẫn dùng bản cũ', async () => {
    const w = world();
    await w.owner().submitAd({ file: png(10), title: 'Có số điện thoại', body: 'Gọi 0909 000 000' });
    const id = w.db.data.ad_banners.find((a) => a.title === 'Có số điện thoại')!.id;
    await expect(w.admin().rejectBanner(id, '')).rejects.toThrow('Cần lý do từ chối');
    await w.admin().rejectBanner(id, 'Ảnh có số điện thoại.');
    const ad = await w.owner().getAd();
    expect(ad.rejected).toMatchObject({ title: 'Có số điện thoại', reason: 'ảnh có số điện thoại.' });
    expect(ad.canSubmit).toBe(true);
    expect(ad.running?.title).toBe('Cà phê sữa đá mua 2 tặng 1');
  });

  it('kế toán xem được nhưng không gửi được banner', async () => {
    const w = world();
    // Kế toán của Cà phê Mây (seed bm-2 chưa có tài khoản): gắn tạm một người dùng.
    w.db.data.business_members.find((m) => m.id === 'bm-2')!.userId = DEMO_USER_ID;
    const acc = createBusinessService((w.db.setUser(DEMO_USER_ID), w.db), BIZ);
    const ad = await acc.getAd();
    expect(ad.canSubmit).toBe(false);
    expect(ad.submitBlockedText).toBe('Chỉ chủ cửa hàng gửi được banner.');
    expect(await acc.submitAd({ file: png(10), title: 'X', body: '' })).toMatchObject({ ok: false });
  });

  it('báo cáo và chi tiết chiến dịch có ô Lượt xem quảng cáo', async () => {
    const w = world();
    const o = w.owner();
    expect((await o.getReport()).adViews).toMatchObject({ label: 'Lượt xem quảng cáo', value: '86' });
    expect((await o.getCampaignDetail('cp-may-chieu'))!.adViews.value).toBe('86');
  });
});

describe('logo quán (Hồ sơ cửa hàng)', () => {
  it('chủ quán đổi logo: lưu ảnh, hồ sơ có ảnh, app hiện logo ở popup quảng cáo', async () => {
    const w = world();
    await expect(w.owner().updateLogo({ ...png(10), contentType: 'image/gif' })).rejects.toThrow('Logo phải là ảnh JPG, PNG hoặc WebP.');
    await expect(w.owner().updateLogo(png(1024 * 1024 + 1))).rejects.toThrow('Logo tối đa 1 MB.');
    const { logoUrl } = await w.owner().updateLogo(png(10));
    expect(logoUrl.startsWith('data:image/png;base64,')).toBe(true);
    const profile = await w.owner().getProfile();
    expect(profile.logo).toMatchObject({ title: 'Logo · ảnh đã tải', imageUrl: logoUrl });
    const { svc, plan, grab } = await tripWithSponsor(w.db, w);
    expect((await svc.sponsorAd(plan, grab))!.logoUrl).toBe(logoUrl);
  });
});
