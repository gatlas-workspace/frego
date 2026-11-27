import { describe, expect, it } from 'vitest';
import { DEST_RING_M, clusterPins, createGoongGeocoder, createPhotonGeocoder, geoPlaceId, parseGeoPlaceId, createValhallaRouter, decodePolyline, createMemoryDb, createSeed, createUserService, DEMO_USER_ID, formatVndRange, maskPhone, formatDiscount, projectPx, zoomFromLongitudeDelta } from '../src';

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
  it('gắn voucher tự động: Cà phê Mây (Grab ô tô), FREGO20 (Be xe máy), Quán bún (Grab xe máy)', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    expect(plan.title).toBe('Landmark 81 → Chợ Bến Thành');
    expect(plan.subtitle).toBe('5,8 km · khoảng 20 phút');
    const items = svc.attachItems(plan, plan.selection);
    const attached = items.filter((i) => i.attached).map((i) => i.name).sort();
    expect(attached).toEqual(['Cà phê Mây', 'FREGO20', 'Quán bún Ngõ Nhỏ']);
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
    expect(cafe.conditionLine).toBe('Tặng riêng cho bạn. Điểm đến cách quán 150 m, trong vùng 500 m.');
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
      ['Be', '11.000–16.000đ', '31.000–36.000đ'],
      ['Grab', '25.000–30.000đ', '35.000–40.000đ'],
      ['Green SM', '', ''],
    ]);
    expect(bike.rows[0].voucherText).toBe('Đã gắn FREGO20, giảm 20.000đ');
    expect(bike.rows[1].voucherText).toBe('Đã gắn mã Quán bún Ngõ Nhỏ, giảm 10.000đ');
    expect(bike.rows[2].autoNote).toBe('Green SM đang tự giảm 25%, không cần mã');
    expect(bike.insight).toBeNull();
    expect(bike.attachedLine).toBe('FREGO20 · Cà phê Mây · Quán bún Ngõ Nhỏ');
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

  it('mở app hãng → nhắc báo giá → báo giá → cộng điểm', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const cmp = await svc.compare(plan, plan.selection, 'bike');
    const open = await svc.openProvider(plan, plan.selection, cmp.rows[0]);
    expect(open.title).toBe('Mở app Be để đặt xe');
    expect(open.code).toBe('FREGO20');
    expect(open.estimateText).toBe('11.000–16.000đ');
    expect(open.prefillsDestination).toBe(false);
    expect(open.step1).toEqual(['Be chưa tự điền điểm đến,', ' địa chỉ đã được chép sẵn để bạn dán.']);
    expect(open.destAddress).toBe('Chợ Bến Thành, Đường Lê Lợi, phường Bến Thành');
    const used = await svc.simulateCodeUsed(open.trip.id);
    // Frego không biết mã có được dùng: chỉ nói người dùng đã mở app hãng kèm mã.
    expect(used.notification?.title).toBe('Chuyến Be với mã FREGO20 thế nào?');
    expect(used.notification?.body).toBe('Bạn vừa mở app Be kèm mã FREGO20. Báo giá thật để được cộng điểm.');
    expect(used.notification?.link).toBe(`/bao-gia/${open.trip.id}`);
    expect(used.notification?.kind).toBe('code_used');
    expect(used.notification?.title).not.toMatch(/được dùng/);
    const view = await svc.getTrip(open.trip.id);
    expect(view?.codeUsedChip).toBe('Chuyến Be ngày 22/11 · mã FREGO20');
    const r1 = await svc.reportPrice(open.trip.id, { verdict: 'within' });
    expect(r1.pointsAwarded).toBe(10);
    expect(r1.points).toBe(1260);
    const r2 = await svc.reportPrice(open.trip.id, { paidAmount: 15000 });
    expect(r2.pointsAwarded).toBe(50);
    const again = await svc.reportPrice(open.trip.id, { verdict: 'cheaper' });
    expect(again.pointsAwarded).toBe(0);
  });

  it('số tiền lệch quá 30% không được cộng điểm; tối đa 300 điểm mỗi ngày', async () => {
    const { svc, db } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const cmp = await svc.compare(plan, plan.selection, 'bike');
    const open = await svc.openProvider(plan, plan.selection, cmp.rows[0]);
    await svc.simulateCodeUsed(open.trip.id);
    const r = await svc.reportPrice(open.trip.id, { paidAmount: 90000 });
    expect(r.pointsAwarded).toBe(0);
    expect(r.held).toMatch(/lệch hơn 30%/);
    // Đã đủ 300 điểm báo giá hôm nay → giữ lại.
    await db.insert('points_ledger', { userId: DEMO_USER_ID, delta: 300, reason: 'test', tripId: 'trip-yday-am', createdAt: db.now().toISOString() });
    const open2 = await svc.openProvider(plan, plan.selection, cmp.rows[1]);
    await svc.simulateCodeUsed(open2.trip.id);
    const r2 = await svc.reportPrice(open2.trip.id, { verdict: 'pricier' });
    expect(r2.pointsAwarded).toBe(0);
    expect(r2.held).toMatch(/giới hạn 300 điểm/);
  });

  it('ưu đãi chiến dịch được phát mã riêng khi mở app hãng', async () => {
    const { svc, db } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const cmp = await svc.compare(plan, plan.selection, 'bike');
    const grab = cmp.rows.find((r) => r.providerId === 'grab')!;
    const open = await svc.openProvider(plan, plan.selection, grab);
    expect(open.code).toMatch(/^NHO[A-Z0-9]{4}$/);
    expect(open.deepLink).toContain('grab://open?screenType=BOOKING&dropOffLatitude=10.7725');
    const mine = await db.list('user_vouchers', { where: { userId: DEMO_USER_ID, campaignId: 'cp-bun-trua' } });
    expect(mine).toHaveLength(1);
  });
});

describe('quà chào mừng FREGO20', () => {
  it('20.000đ, phát tối đa 50 suất', async () => {
    const { db } = setup();
    const fc = (await db.get('frego_codes', 'fc-welcome'))!;
    expect([fc.code, fc.amount, fc.quota]).toEqual(['FREGO20', 20000, 50]);
    db.setUser('00000000-0000-4000-8000-000000000002');
    const v = await db.rpc('ensure_welcome_voucher', {});
    expect(v?.code).toBe('FREGO20');
    expect(await db.rpc('ensure_welcome_voucher', {})).toBeNull();
    await db.update('frego_codes', 'fc-welcome', { issuedCount: 50 });
    db.setUser('00000000-0000-4000-8000-000000000004');
    expect(await db.rpc('ensure_welcome_voucher', {})).toBeNull();
  });
});

describe('màn khác', () => {
  it('trang chủ, ví, điểm, lịch sử, tài khoản', async () => {
    const { svc } = setup();
    const home = await svc.getHome();
    expect(home.banner?.title).toBe('Giảm 20.000đ chuyến Be xe máy');
    expect(home.banner?.ticketAmount).toBe('−20K');
    expect(home.recent.map((r) => [r.name, r.voucherChip])).toEqual([
      ['Chợ Bến Thành', '3 voucher'],
      ['Sân bay Tân Sơn Nhất', ''],
    ]);
    const search = await svc.searchPlaces('Chợ Bến');
    expect(search.map((r) => [r.name, r.distanceText, r.voucherChip])).toEqual([
      ['Chợ Bến Thành', '5,8 km', '3 voucher'],
      ['Chợ Bến Thành, cửa Bắc', '5,7 km', '3 voucher'],
      ['Chợ đêm Bến Thành', '5,8 km', '2 voucher'],
      ['Ga metro Bến Thành', '5,9 km', ''],
    ]);
    const recent = await svc.recentSearches();
    expect(recent.map((r) => [r.name, r.voucherChip])).toEqual([
      ['Chợ Bến Thành', '3 voucher'],
      ['Sân bay Tân Sơn Nhất', ''],
      ['Phố đi bộ Nguyễn Huệ', '1 voucher'],
    ]);
    const deal = await svc.planTrip(home.deals[0].destPlaceId, { preferredCampaignId: home.deals[0].campaignId });
    expect(deal.selection['grab-car4']).toBe('uv:uv-may7k2q');
    expect(home.deals.map((d) => [d.brand, d.destPlaceId])).toEqual([
      ['Cà phê Mây', 'ben-thanh'],
      ['Nhà sách Gió', 'ho-con-rua'],
      ['Phòng tập Nhịp', 'landmark81'],
      ['Tiệm bánh Mộc', 'cho-tan-dinh'],
      ['Quán bún Ngõ Nhỏ', 'nguyen-hue'],
    ]);
    expect(home.deals[0]).toMatchObject({ brand: 'Cà phê Mây', serviceText: 'Mã Grab ô tô', amountText: '−20.000đ', area: 'Gần Chợ Bến Thành' });
    expect(home.unreadCount).toBe(3);

    const wallet = await svc.getWallet();
    expect(wallet.gifts.map((g) => g.title)).toEqual(['Cà phê Mây', 'Mã FREGO20']);
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
    expect(trips[0].line).toBe('Be xe máy · mã FREGO20 · ước tính sau mã 11.000–16.000đ');
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

describe('bản đồ chuyến: chỉ hiện quán có voucher dùng được cho điểm đến', () => {
  it('Chợ Bến Thành: 3 quán, khớp đúng voucher tài trợ ở màn Gắn voucher', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const pins = await svc.usableSponsors(plan);
    expect(pins.map((p) => [p.name, p.distanceText, p.amountText, p.serviceText])).toEqual([
      ['Cà phê Mây', 'Cách điểm đến 150 m', '−20.000đ', 'Grab ô tô'],
      ['Tiệm trà Sen', 'Cách điểm đến 150 m', '−10.000đ', 'Be xe máy'],
      ['Quán bún Ngõ Nhỏ', 'Cách điểm đến 700 m', '−10.000đ', 'Grab xe máy'],
    ]);
    // Cùng tập quán với voucher tài trợ trong danh sách Gắn voucher.
    const attachSponsors = svc.attachItems(plan, plan.selection).filter((i) => i.tag === 'sponsor').map((i) => i.name).sort();
    expect(pins.map((p) => p.name).sort()).toEqual(attachSponsors);
    expect(pins[0].hoursText).toBe('Tặng mã 13:00–19:00');
    expect(pins[0].statusText).toBe('Voucher tặng riêng cho bạn, điểm đến trong vùng 500 m quanh quán');
    expect(pins[1].statusText).toBe('Điểm đến nằm trong vùng tặng mã 300 m');
  });

  it('quán ở gần (trong 1 km) nhưng điểm đến ngoài vùng tặng mã của quán thì không hiện', async () => {
    const { svc } = setup();
    // Phố đi bộ Nguyễn Huệ: Cà phê Mây cách 550 m (vùng 500 m), Tiệm trà Sen cách 600 m (vùng 300 m) → không dùng được.
    const hue = await svc.usableSponsors(await svc.planTrip('nguyen-hue'));
    expect(hue.map((p) => p.name)).toEqual(['Quán bún Ngõ Nhỏ']);
    expect(await svc.usableSponsors(await svc.planTrip('tan-son-nhat'))).toEqual([]);
    expect(DEST_RING_M).toBe(1000);
  });

  it('chọn quán làm điểm đến: chuyến tới quán, mã của quán được gắn', async () => {
    const { svc } = setup();
    const pin = (await svc.usableSponsors(await svc.planTrip('ben-thanh'))).find((p) => p.name === 'Tiệm trà Sen')!;
    const plan = await svc.planTrip(`biz:${pin.businessId}`, { preferredCampaignId: pin.campaignId });
    expect(plan.dest.name).toBe('Tiệm trà Sen');
    expect(svc.attachItems(plan, plan.selection).find((i) => i.name === 'Tiệm trà Sen')?.attached).toBe(true);
  });
});

describe('bản đồ: gom cụm ghim', () => {
  it('Cà phê Mây và Tiệm trà Sen (cách nhau ~60 m) gom cụm khi zoom xa, tách ra khi zoom gần', async () => {
    const { svc } = setup();
    const pins = await svc.usableSponsors(await svc.planTrip('ben-thanh'));
    const at = (zoom: number) => clusterPins(pins, zoom, 44, (p) => p.businessId);
    const far = at(14);
    expect(far.filter((g) => g.kind === 'cluster').map((g) => (g.kind === 'cluster' ? g.items.map((p) => p.name).sort() : []))).toEqual([
      ['Cà phê Mây', 'Tiệm trà Sen'],
    ]);
    expect(far).toHaveLength(2);
    expect(at(19).every((g) => g.kind === 'single')).toBe(true);
  });

  it('zoom từ độ rộng khung nhìn khớp chiếu Mercator', () => {
    // 256 px phủ 360° ở zoom 0; 1024 px phủ 0,1° ⇒ zoom ≈ 13,8.
    expect(zoomFromLongitudeDelta(360, 256)).toBeCloseTo(0);
    expect(zoomFromLongitudeDelta(0.1, 1024)).toBeCloseTo(13.81, 1);
    const a = projectPx({ lat: 10.7725, lng: 106.698 }, 0);
    expect(a.x).toBeCloseTo(((106.698 + 180) / 360) * 256, 6);
  });
});

describe('tìm đường theo đường phố (Valhalla)', () => {
  // Mẫu chuẩn của Google: 3 điểm, độ chính xác 1e-5.
  it('giải mã polyline', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]);
  });

  // polyline6 của 3 điểm quanh Landmark 81 → Chợ Bến Thành (mã hóa sẵn bằng bộ mã hóa chuẩn).
  const encode6 = (pts: { lat: number; lng: number }[]) => {
    let out = '';
    let pl = 0;
    let pg = 0;
    const enc = (v: number) => {
      let n = v < 0 ? ~(v << 1) : v << 1;
      while (n >= 0x20) {
        out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
        n >>= 5;
      }
      out += String.fromCharCode(n + 63);
    };
    for (const p of pts) {
      const la = Math.round(p.lat * 1e6);
      const lo = Math.round(p.lng * 1e6);
      enc(la - pl);
      enc(lo - pg);
      pl = la;
      pg = lo;
    }
    return out;
  };
  const shape = [
    { lat: 10.7949, lng: 106.7219 },
    { lat: 10.7861, lng: 106.7052 },
    { lat: 10.7725, lng: 106.698 },
  ];
  const fakeFetch = (calls: string[], ok = true) =>
    (async (url: string) => {
      calls.push(String(url));
      return {
        ok,
        json: async () => ({ trip: { summary: { length: 5.874, time: 1043 }, legs: [{ shape: encode6(shape) }] } }),
      };
    }) as unknown as typeof fetch;

  it('xe máy dùng chi phí motor_scooter, ô tô dùng auto; trả km làm tròn và số phút', async () => {
    const calls: string[] = [];
    const router = createValhallaRouter({ baseUrl: 'https://valhalla.test/', fetch: fakeFetch(calls) });
    const r = await router.route(shape[0]!, shape[2]!, 'motorbike');
    expect(r?.km).toBe(5.9);
    expect(r?.minutes).toBe(17);
    expect(r?.coords).toEqual(shape);
    await router.route(shape[0]!, shape[2]!, 'car');
    expect(calls[0]!.startsWith('https://valhalla.test/route?json=')).toBe(true);
    expect(decodeURIComponent(calls[0]!)).toContain('"costing":"motor_scooter"');
    expect(decodeURIComponent(calls[0]!)).not.toContain('ignore_access');
    expect(decodeURIComponent(calls[1]!)).toContain('"costing":"auto"');
  });

  it('chuyến dùng số đường thật cho km, phút, dòng phụ; hỏi đường một lần', async () => {
    const calls: string[] = [];
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db, { router: createValhallaRouter({ baseUrl: 'https://valhalla.test', fetch: fakeFetch(calls) }) });
    const plan = await svc.planTrip('ben-thanh');
    expect(plan.subtitle).toBe('5,9 km · khoảng 17 phút');
    expect(plan.route.source).toBe('road');
    expect(plan.route.coords).toHaveLength(3);
    await svc.planTrip('ben-thanh');
    expect(await svc.routeLine(plan, 'bike')).toBe(plan.route);
    expect(calls).toHaveLength(1);
    expect((await svc.routeLine(plan, 'car4')).source).toBe('road');
    expect(calls).toHaveLength(2);
  });

  it('không có đường (lỗi 442, VD điểm trong sân bay) → hỏi lại một lần, bỏ qua giới hạn ra vào', async () => {
    const calls: string[] = [];
    const f = (async (url: string) => {
      calls.push(decodeURIComponent(String(url)));
      if (calls.length === 1) return { ok: false, json: async () => ({ error_code: 442, error: 'No path could be found for input' }) };
      return { ok: true, json: async () => ({ trip: { summary: { length: 10.3, time: 1920 }, legs: [{ shape: encode6(shape) }] } }) };
    }) as unknown as typeof fetch;
    const r = await createValhallaRouter({ baseUrl: 'https://valhalla.test', fetch: f }).route(shape[0]!, shape[2]!, 'motorbike');
    expect(r?.km).toBe(10.3);
    expect(r?.minutes).toBe(32);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain('"ignore_access":true');
  });

  it('lỗi khác 442 (VD 500) → không hỏi lại, dùng ước tính', async () => {
    const calls: string[] = [];
    const f = (async (url: string) => {
      calls.push(String(url));
      return { ok: false, json: async () => ({ error_code: 500 }) };
    }) as unknown as typeof fetch;
    expect(await createValhallaRouter({ baseUrl: 'https://valhalla.test', fetch: f }).route(shape[0]!, shape[2]!, 'car')).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it('máy chủ lỗi hoặc quá giờ → ước tính như cũ, đường nối thẳng', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const bad = createUserService(db, { router: createValhallaRouter({ baseUrl: 'https://x', fetch: fakeFetch([], false) }) });
    const p1 = await bad.planTrip('ben-thanh');
    expect(p1.subtitle).toBe('5,8 km · khoảng 20 phút');
    expect(p1.route.source).toBe('estimate');
    const hang = (() => new Promise(() => {})) as unknown as typeof fetch;
    const slow = createUserService(db, { router: createValhallaRouter({ baseUrl: 'https://x', fetch: hang, timeoutMs: 20 }) });
    expect((await slow.planTrip('ben-thanh')).route.source).toBe('estimate');
  });
});

describe('tìm địa chỉ (Goong / Photon) và điểm đến tự do', () => {
  const json = (body: unknown, ok = true) => ({ ok, json: async () => body });
  const photonFetch = (calls: string[]) =>
    (async (url: string) => {
      calls.push(String(url));
      if (String(url).includes('/reverse')) {
        return json({ features: [{ properties: { name: 'Cảnh sát PCCC Quận 3', street: 'Hẻm 82 Lý Chính Thắng', district: 'Xuân Hòa', city: 'Thành phố Hồ Chí Minh', osm_key: 'amenity' } }] });
      }
      return json({
        features: [
          { properties: { name: 'Hoàng Sa', district: 'Tân Định', osm_key: 'highway' }, geometry: { coordinates: [106.6905, 10.7905] } },
          { properties: { name: 'Hoàng Sa', district: 'Tân Định', osm_key: 'highway' }, geometry: { coordinates: [106.6911, 10.7912] } },
          { properties: { name: 'Bitexco Financial Tower', housenumber: '02', street: 'Hải Triều', district: 'Sài Gòn', osm_key: 'building' }, geometry: { coordinates: [106.7044, 10.7716] } },
        ],
      });
    }) as unknown as typeof fetch;

  it('id "geo:…" mang theo tọa độ, tên, địa chỉ (có dấu, có dấu phẩy)', () => {
    const id = geoPlaceId({ lat: 10.7905, lng: 106.6905, name: '571 Hoàng Sa', address: 'Tân Định, TP.HCM' });
    expect(parseGeoPlaceId(id)).toEqual({ id: 'geo:10.790500,106.690500', name: '571 Hoàng Sa', address: 'Tân Định, TP.HCM', district: '', lat: 10.7905, lng: 106.6905 });
    expect(parseGeoPlaceId('geo:abc')).toBeNull();
  });

  it('Photon: giới hạn TP.HCM, bỏ đoạn đường trùng, đường không số nhà thì mở bản đồ để ghim', async () => {
    const calls: string[] = [];
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db, { geocoder: createPhotonGeocoder({ baseUrl: 'https://photon.test', fetch: photonFetch(calls) }) });
    const res = await svc.searchPlaces('571 hoàng sa');
    expect(calls[0]).toContain('bbox=106.35,10.35,107.05,11.2');
    expect(res.map((p) => p.name)).toEqual(['Hoàng Sa', 'Bitexco Financial Tower']);
    expect(res[0]!.pickOnMap).toEqual({ lat: 10.7905, lng: 106.6905 });
    expect(res[1]!.address).toBe('02 Hải Triều, Sài Gòn');
    expect(res[1]!.pickOnMap).toBeNull();
    // Gõ 1 ký tự: không hỏi mạng.
    await svc.searchPlaces('h');
    expect(calls).toHaveLength(1);
  });

  it('địa điểm có sẵn vẫn lên đầu; mạng lỗi thì chỉ còn địa điểm có sẵn', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const down = (async () => json({}, false)) as unknown as typeof fetch;
    const svc = createUserService(db, { geocoder: createPhotonGeocoder({ fetch: down }) });
    expect((await svc.searchPlaces('chợ bến')).map((p) => p.name)[0]).toBe('Chợ Bến Thành');
  });

  it('chọn trên bản đồ: đổi tọa độ thành địa chỉ, lập chuyến tới đó, không lưu vào Tìm gần đây', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db, { geocoder: createPhotonGeocoder({ fetch: photonFetch([]) }) });
    const pt = await svc.describePoint({ lat: 10.7895, lng: 106.6855 });
    expect(pt.name).toBe('Cảnh sát PCCC Quận 3');
    expect(pt.address).toBe('Hẻm 82 Lý Chính Thắng, Xuân Hòa');
    const plan = await svc.planTrip(pt.id);
    expect(plan.title).toBe('Landmark 81 → Cảnh sát PCCC Quận 3');
    expect(plan.dest.id).toBe('geo:10.789500,106.685500');
    const before = (await svc.recentSearches(10)).length;
    await svc.openProvider(plan, plan.selection, (await svc.compare(plan, plan.selection, 'bike')).rows[0]!);
    expect((await svc.recentSearches(10)).length).toBe(before);
  });

  it('không tìm được địa chỉ vẫn đi được tới điểm đã ghim', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    const pt = await svc.describePoint({ lat: 10.78, lng: 106.69 });
    expect(pt.found).toBe(false);
    expect(pt.name).toBe('Điểm đã chọn trên bản đồ');
    expect((await svc.planTrip(pt.id)).dest.lat).toBe(10.78);
  });

  it('Goong: gợi ý theo place_id, chọn thì hỏi chi tiết lấy tọa độ; đổi tọa độ thành địa chỉ', async () => {
    const calls: string[] = [];
    const goongFetch = (async (url: string) => {
      calls.push(String(url));
      if (String(url).includes('/Place/AutoComplete')) {
        return json({
          predictions: [
            { place_id: 'abc', description: '571 Hoàng Sa, Tân Định, Hồ Chí Minh', structured_formatting: { main_text: '571 Hoàng Sa', secondary_text: 'Tân Định, Hồ Chí Minh' } },
          ],
          status: 'OK',
        });
      }
      if (String(url).includes('/Place/Detail')) return json({ result: { name: '571 Hoàng Sa', formatted_address: '571 Hoàng Sa, Tân Định, Hồ Chí Minh', geometry: { location: { lat: 10.7901, lng: 106.6899 } } } });
      return json({ results: [{ formatted_address: '571 Hoàng Sa, Tân Định, Hồ Chí Minh' }] });
    }) as unknown as typeof fetch;
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db, { geocoder: createGoongGeocoder({ apiKey: 'k', baseUrl: 'https://goong.test', fetch: goongFetch }) });
    const [hit] = await svc.searchPlaces('571 hoàng sa');
    expect(calls[0]).toContain('/Place/AutoComplete?api_key=k&input=571%20ho%C3%A0ng%20sa&location=');
    expect(hit).toMatchObject({ name: '571 Hoàng Sa', address: 'Tân Định, Hồ Chí Minh', distanceText: '', pickOnMap: null });
    const plan = await svc.planTrip(hit!.id);
    expect(calls[1]).toContain('/Place/Detail?api_key=k&place_id=abc');
    expect(plan.dest).toMatchObject({ name: '571 Hoàng Sa', lat: 10.7901, lng: 106.6899 });
    const pt = await svc.describePoint({ lat: 10.7901, lng: 106.6899 });
    expect([pt.name, pt.address]).toEqual(['571 Hoàng Sa', 'Tân Định, Hồ Chí Minh']);
    expect(svc.geocodingProvider()).toBe('goong');
  });
});

describe('quy tắc: mức giảm phải nhỏ hơn giá dự kiến (đầu thấp)', () => {
  it('chuyến ngắn: FREGO20 (20.000đ) lớn hơn giá Be xe máy → không gắn, ghi rõ lý do; giá sau giảm không về 0đ', async () => {
    const { svc } = setup();
    // ~700 m từ Landmark 81.
    const plan = await svc.planTrip(geoPlaceId({ lat: 10.79, lng: 106.718, name: 'Gần Landmark 81', address: '' }));
    const frego = plan.evaluation.ineligible.find((e) => e.offer.code === 'FREGO20');
    expect(frego?.line).toMatch(/^Be · mã giảm 20\.000đ, không nhỏ hơn giá dự kiến \d{1,3}\.000–\d{1,3}\.000đ$/);
    expect(plan.evaluation.eligible.some((e) => e.offer.code === 'FREGO20')).toBe(false);
    const rows = (await svc.compare(plan, plan.selection, 'bike')).rows;
    expect(rows.filter((r) => r.final).every((r) => r.final!.low > 0)).toBe(true);
  });

  it('chuyến dài (Chợ Bến Thành): FREGO20 vẫn gắn như thiết kế', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    expect(plan.evaluation.eligible.some((e) => e.offer.code === 'FREGO20')).toBe(true);
  });
});

describe('cách ưu tiên tự gắn mã (Giảm nhiều nhất / Quán gần nhất / Sắp hết hạn)', () => {
  const labelOf = (plan: Awaited<ReturnType<ReturnType<typeof setup>['svc']['planTrip']>>, sel: Record<string, string | null | undefined>, service: string) =>
    plan.evaluation.eligible.find((e) => e.service === service && e.offer.refId === sel[service])?.offer.label;

  it('mặc định giảm nhiều nhất (như thiết kế); bằng nhau thì quán gần hơn', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    expect(svc.autoSelection(plan, 'discount')).toEqual(plan.selection);
    expect(labelOf(plan, plan.selection, 'be-bike')).toBe('FREGO20');
    // Mã của quán có khoảng cách tới điểm đến; mã Frego thì không.
    expect(plan.evaluation.eligible.find((e) => e.offer.label === 'Tiệm trà Sen')!.distanceM).toBeGreaterThan(100);
    expect(plan.evaluation.eligible.find((e) => e.offer.label === 'FREGO20')!.distanceM).toBeNull();
  });

  it('Quán gần nhất: Be xe máy đổi sang mã Tiệm trà Sen (150 m) thay FREGO20; danh sách xếp quán gần trước', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const sel = svc.autoSelection(plan, 'nearest');
    expect(labelOf(plan, sel, 'be-bike')).toBe('Tiệm trà Sen');
    const items = svc.attachItems(plan, sel, 'nearest');
    const attachedSponsors = items.filter((i) => i.attached && i.tag === 'sponsor').map((i) => i.name);
    expect(attachedSponsors).toEqual(['Cà phê Mây', 'Tiệm trà Sen', 'Quán bún Ngõ Nhỏ']);
  });

  it('Sắp hết hạn: mỗi hãng gắn mã có hạn gần nhất', async () => {
    const { svc } = setup();
    const plan = await svc.planTrip('ben-thanh');
    const sel = svc.autoSelection(plan, 'expiring');
    for (const [service, refId] of Object.entries(sel)) {
      const group = plan.evaluation.eligible.filter((e) => e.service === service);
      const exp = (r: string) => {
        const x = group.find((e) => e.offer.refId === r)!.offer.expiresAt;
        return x ? new Date(x).getTime() : Infinity;
      };
      expect(exp(refId!)).toBe(Math.min(...group.map((e) => exp(e.offer.refId))));
    }
  });
});
