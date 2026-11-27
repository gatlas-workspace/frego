import { describe, expect, it } from 'vitest';
import { createMemoryDb, createSeed, createUserService, DEMO_USER_ID, formatVndRange, maskPhone, formatDiscount } from '../src';

const setup = () => {
  const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
  return { db, svc: createUserService(db) };
};

describe('định dạng', () => {
  it('VND, khoảng giá, dấu trừ, số điện thoại', () => {
    expect(formatVndRange(21000, 26000)).toBe('21.000–26.000đ');
    expect(formatDiscount(20000)).toBe('−20.000đ');
    expect(maskPhone('+84909555123')).toBe('0909 ••• 123');
  });
});

describe('luồng chính khớp thiết kế: Landmark 81 → Chợ Bến Thành', () => {
  it('gắn voucher tự động: Cà phê Mây (Grab ô tô), FREGO10 (Be xe máy), Quán bún (Grab xe máy)', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    expect(plan.title).toBe('Landmark 81 → Chợ Bến Thành');
    expect(plan.subtitle).toBe('5,8 km · khoảng 20 phút');
    const items = svc.attachItems(plan, plan.selection);
    const attached = items.filter((i) => i.attached).map((i) => i.name).sort();
    expect(attached).toEqual(['Cà phê Mây', 'FREGO10', 'Quán bún Ngõ Nhỏ']);
    const names = items.map((i) => i.name);
    expect(names).toContain('Tiệm trà Sen');
    expect(names).toContain('VPBTRANSPORT');
    const tra = items.find((i) => i.name === 'Tiệm trà Sen')!;
    expect(tra.conditionLine).toBe('Điểm đến cách quán 150 m, trong vùng áp dụng 300 m.');
    expect(tra.metaText).toBe('Đang dùng mã khác');
    const bun = items.find((i) => i.name === 'Quán bún Ngõ Nhỏ')!;
    expect(bun.conditionLine).toBe('Điểm đến cách quán 700 m, trong vùng áp dụng 1 km.');
    expect(bun.metaText).toBe('HSD 15/12/2026');
    const cafe = items.find((i) => i.name === 'Cà phê Mây')!;
    expect(cafe.conditionLine).toBe('Tặng riêng cho bạn. Điểm đến trong vùng 500 m quanh quán.');
    const vpb = items.find((i) => i.name === 'VPBTRANSPORT')!;
    expect(vpb.conditionLine).toBe('Chuyến từ 50.000đ, trả bằng thẻ VPBank của bạn.');
    expect(vpb.metaText).toBe('Đang dùng mã khác');
    expect(svc.attachCta(plan.selection)).toBe('So giá với 3 voucher đã gắn');
    const bad = plan.evaluation.ineligible.map((i) => `${i.offer.code}: ${i.line}`);
    expect(bad).toEqual([
      'CHUYENXACAR: Grab · cần chuyến GrabCar từ 160.000đ',
      'SANBAY: Grab · chỉ cho chuyến đi hoặc đến sân bay',
      'KLBIKE: Grab · cần thẻ KienLongBank',
    ]);
  });

  it('so giá sau voucher: số tiền và thứ tự như thiết kế', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const bike = await svc.compare(plan, plan.selection, 'bike');
    expect(bike.rows.map((r) => [r.name, r.finalText, r.baseText])).toEqual([
      ['Be', '21.000–26.000đ', '31.000–36.000đ'],
      ['Grab', '25.000–30.000đ', '35.000–40.000đ'],
      ['Green SM', '', ''],
    ]);
    expect(bike.rows[0].voucherText).toBe('Đã gắn FREGO10, giảm 10.000đ');
    expect(bike.rows[1].voucherText).toBe('Đã gắn mã Quán bún Ngõ Nhỏ, giảm 10.000đ');
    expect(bike.rows[2].autoNote).toBe('Green SM đang tự giảm 25%, không cần mã');
    expect(bike.insight).toBeNull();
    expect(bike.peakNote).toBe('17:45 là giờ cao điểm, khoảng giá đã nới rộng. Giá cuối cùng do app hãng hiển thị.');

    const car = await svc.compare(plan, plan.selection, 'car4');
    expect(car.rows.map((r) => [r.name, r.finalText, r.baseText])).toEqual([
      ['Grab', '55.000–66.000đ', '75.000–86.000đ'],
      ['Be', '74.000–86.000đ', ''],
      ['Green SM', '', ''],
    ]);
    expect(car.insight).toBe('Trước voucher Be rẻ hơn. Sau khi gắn voucher, Grab rẻ hơn khoảng 20.000đ.');
    const suv = await svc.compare(plan, plan.selection, 'car7');
    expect(suv.rows[0].finalText).toBe('93.000–107.000đ');
    expect(suv.rows.filter((r) => r.priced).length).toBe(1);
  });

  it('mở app hãng → mã được dùng → báo giá → cộng điểm', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const cmp = await svc.compare(plan, plan.selection, 'bike');
    const open = await svc.openProvider(plan, plan.selection, cmp.rows[0]);
    expect(open.title).toBe('Mở app Be để đặt xe');
    expect(open.code).toBe('FREGO10');
    expect(open.estimateText).toBe('21.000–26.000đ');
    expect(open.prefillsDestination).toBe(false);
    const used = await svc.simulateCodeUsed(open.trip.id);
    expect(used.notification?.title).toBe('Mã FREGO10 vừa được dùng cho chuyến Be');
    const r1 = await svc.reportPrice(open.trip.id, { verdict: 'within' });
    expect(r1.pointsAwarded).toBe(10);
    expect(r1.points).toBe(1260);
    const r2 = await svc.reportPrice(open.trip.id, { paidAmount: 24000 });
    expect(r2.pointsAwarded).toBe(50);
    const again = await svc.reportPrice(open.trip.id, { verdict: 'cheaper' });
    expect(again.pointsAwarded).toBe(0);
  });

  it('ưu đãi chiến dịch được phát mã riêng khi mở app hãng', async () => {
    const { svc, db } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const cmp = await svc.compare(plan, plan.selection, 'bike');
    const grab = cmp.rows.find((r) => r.providerId === 'grab')!;
    const open = await svc.openProvider(plan, plan.selection, grab);
    expect(open.code).toMatch(/^NHO[A-Z0-9]{4}$/);
    const mine = await db.list('user_vouchers', { where: { userId: DEMO_USER_ID, campaignId: 'cp-bun-trua' } });
    expect(mine).toHaveLength(1);
  });
});

describe('màn khác', () => {
  it('trang chủ, ví, điểm, lịch sử, tài khoản', async () => {
    const { svc } = setup();
    const home = await svc.getHome();
    expect(home.banner?.title).toBe('Giảm 10.000đ chuyến Be xe máy');
    expect(home.recent.map((r) => [r.name, r.voucherChip])).toEqual([
      ['Chợ Bến Thành', '3 voucher'],
      ['Phố đi bộ Nguyễn Huệ', '1 voucher'],
    ]);
    expect(home.deals[0]).toMatchObject({ brand: 'Cà phê Mây', serviceText: 'Mã Grab ô tô', amountText: '−20.000đ', area: 'Gần Chợ Bến Thành' });
    expect(home.unreadCount).toBe(3);

    const wallet = await svc.getWallet();
    expect(wallet.gifts.map((g) => g.title)).toEqual(['Cà phê Mây', 'Mã FREGO10']);
    expect(wallet.publicCodes.map((c) => c.code)).toEqual(['VPBTRANSPORT', 'CHUYENXACAR', 'SANBAY', 'KLBIKE']);
    expect(wallet.publicCodes[0].okText).toBe('Thẻ VPBank của bạn');
    expect(wallet.publicCodes[3].warnText).toBe('Cần thẻ KienLongBank');
    expect(wallet.publicCodes[0].metaText).toBe('Nguồn: grab.com · kiểm tra 2 giờ trước');

    const pts = await svc.getPoints();
    expect(pts.pointsText).toBe('1.250');
    expect(pts.progressText).toBe('Còn 250 điểm nữa để đổi Grab ô tô −20.000đ');
    const redeemed = await svc.redeemReward('rw-be');
    expect(redeemed.points).toBe(750);

    const trips = await svc.listTrips();
    expect(trips[0]).toMatchObject({ group: 'Hôm nay', time: '17:40', chip: 'Chưa báo giá', title: 'Landmark 81 → Chợ Bến Thành' });
    expect(trips[0].line).toBe('Be xe máy · mã FREGO10 · ước tính sau mã 21.000–26.000đ');
    expect(trips[1]).toMatchObject({ group: 'Hôm qua', chip: 'Chỉ xem giá', line: 'Đã so 3 hãng, chưa mở app hãng nào.' });
    expect(trips[2].line).toBe('Grab ô tô 4 chỗ · ước tính 75.000–86.000đ');
    expect(trips[3]).toMatchObject({ group: 'Thứ Sáu, 20/11', line: 'Be xe máy · voucher Tiệm bánh Mộc −10.000đ', paidText: 'Bạn trả 24.000đ' });

    const me = await svc.getMe();
    expect(me.maskedPhone).toBe('0909 ••• 123');
    expect(me.linkedSummary).toBe('VPBank, MoMo, Be đã liên kết');
    expect(me.notifOnCount).toBe(5);
    expect(me.pendingReports).toBe(1);

    const notifs = await svc.listNotifications();
    expect(notifs[0].metaText).toBe('18:05 · Chuyến đi');
    expect(notifs[3].metaText).toBe('Hôm qua, 08:52 · Chuyến đi');
    expect(notifs[4].metaText).toBe('8/11 · Voucher');
  });
});
