// Bóc biên nhận email (packages/core/src/receipts.ts) và RPC record_receipt (bản JS trong db/memory.ts).
// Mọi thư dưới đây là mẫu TỰ VIẾT (giả lập), chưa đối chiếu với thư thật của Grab / Be / Green SM.
import { describe, expect, it } from 'vitest';
import {
  createMemoryDb,
  createSeed,
  createUserService,
  DEMO_USER_ID,
  detectReceiptProvider,
  gmailReceiptQuery,
  htmlToText,
  parseReceipt,
  parseVndAmount,
  parseVnDateTime,
  type MemoryDb,
  type Trip,
} from '../src';

/* ───────────── Thư mẫu ───────────── */

const GRAB_HTML = {
  from: 'Grab <no-reply@grab.com>',
  subject: 'Biên nhận chuyến đi GrabCar của bạn',
  date: '2026-11-22T11:20:00.000Z',
  html: `<html><head><style>td{font-size:14px}</style></head><body>
    <table>
      <tr><td>Cảm ơn bạn đã đi GrabCar</td></tr>
      <tr><td>Thời gian đón</td><td>22/11/2026 17:58</td></tr>
      <tr><td>Điểm đón</td><td>Landmark 81, 720A Điện Biên Phủ, Bình Thạnh</td></tr>
      <tr><td>Điểm đến</td><td>Chợ Bến Thành, Lê Lợi, Quận 1</td></tr>
      <tr><td>Giá cước</td><td>145.000&nbsp;&#8363;</td></tr>
      <tr><td>Khuyến mãi (FREGO20)</td><td>−20.000 ₫</td></tr>
      <tr><td>Tổng cộng</td><td>125.000 ₫</td></tr>
    </table></body></html>`,
};

const GRAB_EN_TEXT = {
  from: '"Grab" <no-reply@grab.com>',
  subject: 'Your Grab E-Receipt',
  date: 'Sat, 22 Nov 2026 11:20:00 +0000',
  text: [
    'Hope you enjoyed your ride!',
    'Booking ID: A-5XYZ123',
    'Pick-up time: 22 Nov 2026 5:58 PM',
    'Pick-up: Landmark 81',
    'Drop-off: Ben Thanh Market',
    'Fare VND 145,000',
    'Promotion -VND 20,000',
    'TOTAL PAID ₫125,000',
  ].join('\n'),
};

const BE_TEXT = {
  from: 'be <no-reply@be.com.vn>',
  subject: 'Hóa đơn chuyến đi beBike',
  date: '2026-11-22T11:10:00.000Z',
  text: [
    'Cảm ơn bạn đã sử dụng dịch vụ beBike',
    'Mã chuyến: BE123456',
    'Đón tại: 12 Nguyễn Huệ, Quận 1',
    'Trả tại: 45 Lê Lợi, Quận 1',
    'Thời gian: 17:58 - 22/11/2026',
    'Cước phí: 32.000đ',
    'Mã giảm giá: BEMOI10 (-10.000đ)',
    'Thanh toán bằng tiền mặt',
    'Tổng tiền: 22.000 VNĐ',
  ].join('\n'),
};

const GSM_HTML = {
  from: 'Xanh SM <noreply@mail.xanhsm.com>',
  subject: 'Xanh SM - Biên nhận chuyến đi của bạn',
  date: '2026-11-22T11:30:00.000Z',
  html: `<div><p>Thời gian đón: 22 tháng 11, 2026 lúc 17:58</p>
    <p>Điểm đón: Vincom Đồng Khởi</p><p>Điểm đến: Sân bay Tân Sơn Nhất</p>
    <p>Tổng thanh toán: 189,000 đ</p></div>`,
};

/* ───────────── Bóc thư ───────────── */

describe('parseVndAmount', () => {
  it('đọc nhiều cách viết tiền VND', () => {
    expect(parseVndAmount('25.000 ₫')).toBe(25000);
    expect(parseVndAmount('25,000đ')).toBe(25000);
    expect(parseVndAmount('VND 25.000')).toBe(25000);
    expect(parseVndAmount('₫25,000')).toBe(25000);
    expect(parseVndAmount('25,000.00 VND')).toBe(25000);
    expect(parseVndAmount('1.250.000 VNĐ')).toBe(1250000);
    expect(parseVndAmount('25.000 đồng')).toBe(25000);
  });
  it('không nhầm năm, mã chuyến, chữ "đến"', () => {
    expect(parseVndAmount('năm 2026 đến Quận 1')).toBeNull();
    expect(parseVndAmount('Mã chuyến: BE123456')).toBeNull();
    expect(parseVndAmount('22/11/2026 17:58')).toBeNull();
  });
});

describe('parseVnDateTime', () => {
  it('giờ VN → ISO (UTC+7)', () => {
    expect(parseVnDateTime('22/11/2026 17:58')).toBe('2026-11-22T10:58:00.000Z');
    expect(parseVnDateTime('17:58 - 22/11/2026')).toBe('2026-11-22T10:58:00.000Z');
    expect(parseVnDateTime('22 Nov 2026 5:58 PM')).toBe('2026-11-22T10:58:00.000Z');
    expect(parseVnDateTime('22 tháng 11, 2026 lúc 17:58')).toBe('2026-11-22T10:58:00.000Z');
    expect(parseVnDateTime('31/02/2026 10:00')).toBeNull();
  });
});

describe('htmlToText', () => {
  it('mỗi ô bảng một dòng, giải mã &nbsp; và &#8363;', () => {
    const t = htmlToText('<table><tr><td>Giá</td><td>145.000&nbsp;&#8363;</td></tr></table><style>x{}</style>');
    expect(t.split('\n')).toEqual(['Giá', '145.000 ₫']);
  });
});

describe('parseReceipt', () => {
  it('Grab (HTML tiếng Việt): tổng sau giảm, giờ chuyến, điểm đón/đến, mã khuyến mãi', () => {
    expect(parseReceipt(GRAB_HTML)).toEqual({
      providerId: 'grab',
      total: 125000,
      tripAt: '2026-11-22T10:58:00.000Z',
      receivedAt: '2026-11-22T11:20:00.000Z',
      pickup: 'Landmark 81, 720A Điện Biên Phủ, Bình Thạnh',
      dropoff: 'Chợ Bến Thành, Lê Lợi, Quận 1',
      promoCode: 'FREGO20',
    });
  });

  it('Grab (chữ tiếng Anh)', () => {
    const r = parseReceipt(GRAB_EN_TEXT)!;
    expect(r.providerId).toBe('grab');
    expect(r.total).toBe(125000);
    expect(r.tripAt).toBe('2026-11-22T10:58:00.000Z');
    expect(r.pickup).toBe('Landmark 81');
    expect(r.dropoff).toBe('Ben Thanh Market');
    expect(r.promoCode).toBeNull();
    expect(r.receivedAt).toBe('2026-11-22T11:20:00.000Z');
  });

  it('Be: "Tổng tiền … VNĐ", bỏ qua dòng "Thanh toán bằng tiền mặt"', () => {
    const r = parseReceipt(BE_TEXT)!;
    expect(r).toMatchObject({
      providerId: 'be',
      total: 22000,
      tripAt: '2026-11-22T10:58:00.000Z',
      pickup: '12 Nguyễn Huệ, Quận 1',
      dropoff: '45 Lê Lợi, Quận 1',
      promoCode: 'BEMOI10',
    });
  });

  it('Green SM (tên miền con, "189,000 đ", ngày dạng "22 tháng 11, 2026")', () => {
    const r = parseReceipt(GSM_HTML)!;
    expect(r).toMatchObject({ providerId: 'gsm', total: 189000, tripAt: '2026-11-22T10:58:00.000Z' });
    expect(r.pickup).toBe('Vincom Đồng Khởi');
    expect(r.dropoff).toBe('Sân bay Tân Sơn Nhất');
  });

  it('bỏ qua thư khuyến mãi, đơn đồ ăn, người gửi lạ, thư không có tổng tiền', () => {
    expect(parseReceipt({ ...GRAB_HTML, from: 'Grab <info@news.grab.com>', subject: 'Ưu đãi 50% cuối tuần' })).toBeNull();
    expect(parseReceipt({ ...GRAB_EN_TEXT, subject: 'Your GrabFood E-Receipt' })).toBeNull();
    expect(parseReceipt({ ...GRAB_HTML, from: 'Grab <no-reply@grab.com.fake.vn>' })).toBeNull();
    expect(parseReceipt({ ...GRAB_HTML, from: 'Ai đó <no-reply@notgrab.com>' })).toBeNull();
    expect(parseReceipt({ ...BE_TEXT, text: 'Biên nhận\nCảm ơn bạn' })).toBeNull();
  });

  it('nhận diện hãng theo tên miền người gửi; chuỗi tìm kiếm Gmail có đủ tên miền', () => {
    expect(detectReceiptProvider({ from: 'no-reply@grab.com', subject: 'E-Receipt' })).toBe('grab');
    expect(detectReceiptProvider({ from: 'x@be.com.vn', subject: 'Biên nhận chuyến đi' })).toBe('be');
    expect(detectReceiptProvider({ from: 'x@greensm.com', subject: 'Hoá đơn chuyến xe' })).toBe('gsm');
    const q = gmailReceiptQuery(14);
    expect(q).toContain('grab.com');
    expect(q).toContain('be.com.vn');
    expect(q).toContain('xanhsm.com');
    expect(q).toContain('newer_than:14d');
  });
});

/* ───────────── record_receipt (khớp chuyến, cộng điểm) ───────────── */

const U = '00000000-0000-4000-8000-0000000000aa';
const AT = '2026-12-05T11:00:00.000Z'; // giờ trên biên nhận (xa mọi chuyến mẫu)

function setup() {
  const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
  const base = db.data.profiles.find((p) => p.id === DEMO_USER_ID)!;
  db.data.profiles.push({ ...base, id: U, points: 0, status: 'active' });
  db.data.gmail_connections.push({
    userId: U,
    email: 'khach@gmail.com',
    status: 'active',
    connectedAt: AT,
    lastSyncAt: null,
    lastError: null,
  });
  return db;
}

function addTrip(db: MemoryDb, patch: Partial<Trip> & Pick<Trip, 'id' | 'chosenService' | 'openedAt'>): Trip {
  const t: Trip = {
    userId: U,
    originLabel: 'Landmark 81',
    originPlaceId: 'landmark81',
    destPlaceId: 'ben-thanh',
    destLabel: 'Chợ Bến Thành',
    distanceKm: 5.8,
    durationMin: 18,
    attached: [],
    estimateLow: 120000,
    estimateHigh: 140000,
    comparedCount: 3,
    status: 'opened',
    verdict: null,
    paidAmount: null,
    reportSource: null,
    pointsAwarded: 0,
    createdAt: patch.openedAt!,
    codeUsedAt: null,
    reportedAt: null,
    adViewedAt: null,
    ...patch,
  };
  db.data.trips.push(t);
  return t;
}

const minus = (iso: string, min: number) => new Date(new Date(iso).getTime() - min * 60_000).toISOString();
const receipt = (messageId: string, extra: Record<string, unknown> = {}) => ({
  userId: U,
  messageId,
  providerId: 'grab' as const,
  paidAmount: 125000,
  receivedAt: AT,
  tripAt: AT,
  ...extra,
});
const pointsOf = (db: MemoryDb) => db.data.profiles.find((p) => p.id === U)!.points;

describe('record_receipt', () => {
  it('khớp chuyến cùng hãng mở app trong 3 giờ trước, ghi giá như nhập số tiền: +50 điểm', async () => {
    const db = setup();
    addTrip(db, { id: 'tr-old', chosenService: 'grab-car4', openedAt: minus(AT, 150) });
    addTrip(db, { id: 'tr-new', chosenService: 'grab-car4', openedAt: minus(AT, 30) });
    const r = await db.rpc('record_receipt', receipt('m-1', { promoCode: 'FREGO20' }));
    expect(r).toEqual({ status: 'matched', duplicate: false, tripId: 'tr-new', pointsAwarded: 50, held: null });
    const trip = db.data.trips.find((t) => t.id === 'tr-new')!;
    expect(trip).toMatchObject({ paidAmount: 125000, reportSource: 'receipt', status: 'reported', verdict: 'within', pointsAwarded: 50 });
    expect(pointsOf(db)).toBe(50);
    expect(db.data.points_ledger.at(-1)!.reason).toBe('Biên nhận email chuyến Grab, trả 125.000đ');
    expect(db.data.gmail_receipts).toHaveLength(1);
    expect(db.data.gmail_receipts[0]).toMatchObject({ messageId: 'm-1', tripId: 'tr-new', status: 'matched', promoCode: 'FREGO20' });
  });

  it('không ghi trùng cùng một thư; thư thứ hai cho chuyến đã có số tiền → already_reported', async () => {
    const db = setup();
    addTrip(db, { id: 'tr-1', chosenService: 'grab-bike', openedAt: minus(AT, 20), estimateLow: 30000, estimateHigh: 36000 });
    await db.rpc('record_receipt', receipt('m-1', { paidAmount: 33000 }));
    const again = await db.rpc('record_receipt', receipt('m-1', { paidAmount: 33000 }));
    expect(again).toMatchObject({ duplicate: true, pointsAwarded: 0, tripId: 'tr-1' });
    const other = await db.rpc('record_receipt', receipt('m-2', { paidAmount: 33000 }));
    expect(other).toMatchObject({ status: 'already_reported', duplicate: false, tripId: 'tr-1', pointsAwarded: 0 });
    expect(pointsOf(db)).toBe(50);
    expect(db.data.gmail_receipts).toHaveLength(2);
  });

  it('khác hãng, mở app quá 3 giờ trước hoặc sau biên nhận → unmatched, không cộng điểm', async () => {
    const db = setup();
    addTrip(db, { id: 'tr-be', chosenService: 'be-car4', openedAt: minus(AT, 30) });
    addTrip(db, { id: 'tr-early', chosenService: 'grab-car4', openedAt: minus(AT, 200) });
    addTrip(db, { id: 'tr-late', chosenService: 'grab-car4', openedAt: minus(AT, -30) });
    const r = await db.rpc('record_receipt', receipt('m-1'));
    expect(r).toMatchObject({ status: 'unmatched', tripId: null, pointsAwarded: 0 });
    expect(pointsOf(db)).toBe(0);
    expect(db.data.trips.find((t) => t.id === 'tr-be')!.paidAmount).toBeNull();
  });

  it('lệch hơn 30% so với ước tính: vẫn ghi giá nhưng giữ điểm', async () => {
    const db = setup();
    addTrip(db, { id: 'tr-1', chosenService: 'grab-car4', openedAt: minus(AT, 30) });
    const r = await db.rpc('record_receipt', receipt('m-1', { paidAmount: 250000 }));
    expect(r.status).toBe('matched');
    expect(r.pointsAwarded).toBe(0);
    expect(r.held).toMatch(/lệch hơn 30%/);
    expect(db.data.trips.find((t) => t.id === 'tr-1')).toMatchObject({ paidAmount: 250000, verdict: 'pricier' });
  });

  it('giới hạn 300 điểm/ngày; nơi chưa có bảng giá (Green SM) nhân đôi', async () => {
    const db = setup();
    const today = db.now().toISOString();
    db.data.points_ledger.push({ id: 'pl-x', userId: U, delta: 280, reason: 'Báo giá', tripId: 'tr-x', createdAt: today });
    addTrip(db, { id: 'tr-1', chosenService: 'grab-car4', openedAt: minus(AT, 30) });
    const r = await db.rpc('record_receipt', receipt('m-1'));
    expect(r.pointsAwarded).toBe(20);
    expect(r.held).toMatch(/giới hạn 300 điểm/);

    const db2 = setup();
    addTrip(db2, { id: 'tr-g', chosenService: 'gsm-car4', openedAt: minus(AT, 30) });
    const r2 = await db2.rpc('record_receipt', receipt('m-g', { providerId: 'gsm' }));
    expect(r2.pointsAwarded).toBe(100);
  });

  it('chưa liên kết Gmail hoặc số tiền sai → lỗi, không ghi gì', async () => {
    const db = setup();
    db.data.gmail_connections.length = 0;
    await expect(db.rpc('record_receipt', receipt('m-1'))).rejects.toThrow('Chưa liên kết Gmail');
    const db2 = setup();
    await expect(db2.rpc('record_receipt', receipt('m-1', { paidAmount: 9_000_000 }))).rejects.toThrow('Số tiền không hợp lệ');
    expect(db2.data.gmail_receipts).toHaveLength(0);
  });
});

/* ───────────── Dịch vụ người dùng (DEMO) ───────────── */

describe('Gmail trong app (DEMO)', () => {
  it('liên kết giả lập → đồng bộ tạo biên nhận mẫu, chạy đúng parseReceipt + record_receipt → gỡ liên kết', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    expect((await svc.getGmailStatus()).linked).toBe(false);

    await svc.demoLinkGmail();
    const st = await svc.getGmailStatus();
    expect(st).toMatchObject({ linked: true, demo: true, lastSyncText: null });

    const opened = db.now().toISOString(); // mới mở app hãng: chuyến gần nhất
    db.data.trips.push({
      ...db.data.trips[0]!,
      id: 'tr-demo',
      userId: DEMO_USER_ID,
      chosenService: 'grab-car4',
      attached: [],
      estimateLow: 120000,
      estimateHigh: 140000,
      status: 'opened',
      verdict: null,
      paidAmount: null,
      reportSource: null,
      pointsAwarded: 0,
      createdAt: opened,
      openedAt: opened,
      reportedAt: null,
    });
    const res = await svc.demoSyncGmail();
    expect(res.checked).toBe(1);
    expect(res.matched).toBe(1);
    expect(db.data.gmail_receipts.at(-1)).toMatchObject({ messageId: 'demo-tr-demo', status: 'matched', tripId: 'tr-demo' });
    expect(db.data.trips.find((t) => t.id === 'tr-demo')).toMatchObject({ paidAmount: 130000, reportSource: 'receipt' });
    const after = await svc.getGmailStatus();
    expect(after.matchedCount).toBe(1);
    expect(after.lastSyncText).toMatch(/^Đồng bộ lần cuối \d{2}:\d{2}, \d{2}\/\d{2}$/);

    // Đồng bộ lại: chuyến đã có số tiền không bị ghi lần nữa (lượt sau sang chuyến mẫu kế tiếp chưa có số tiền).
    await svc.demoSyncGmail();
    expect(db.data.gmail_receipts.filter((r) => r.tripId === 'tr-demo')).toHaveLength(1);
    expect(db.data.trips.find((t) => t.id === 'tr-demo')!.pointsAwarded).toBe(res.pointsAwarded);

    await svc.demoUnlinkGmail();
    expect((await svc.getGmailStatus()).linked).toBe(false);
  });

  it('Grab / Be / Green SM là "Đã cài app", không hứa biết khi mã được dùng; Gmail không nằm trong danh sách này', async () => {
    const svc = createUserService(createMemoryDb(createSeed(), { userId: DEMO_USER_ID }));
    const links = await svc.getLinks();
    expect(links.apps.map((a) => a.partnerId).sort()).toEqual(['be', 'grab', 'gsm']);
    for (const a of links.apps) expect(a.desc).not.toMatch(/mã được dùng/);
    expect(links.apps.find((a) => a.partnerId === 'be')!.desc).toMatch(/Đã cài app/);
  });
});
