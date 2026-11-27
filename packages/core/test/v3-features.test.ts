/**
 * UI v3 (bản 3.0): giới thiệu bạn bè, ảnh bìa Trang chủ (QT 13), ảnh tại quán (+50 điểm).
 * Chạy trên CSDL bộ nhớ (cùng quy tắc với SQL trong supabase/migrations/20261127001200_v3_referral_cover_photo.sql).
 */
import { describe, expect, it } from 'vitest';
import {
  coverContrastFromPixels,
  createAdminOpsService,
  createMemoryDb,
  createSeed,
  createUserService,
  DEMO_ADMIN_ID,
  DEMO_USER_ID,
  maskName,
  POINTS_RULES,
  sha256HexSync,
  uid,
  type MemoryDb,
  type Profile,
} from '../src';

const LAN_ID = '00000000-0000-4000-8000-0000000000c1';
const DAY = 86_400_000;

/** Tài khoản mới đăng nhập số điện thoại (tạo lúc "bây giờ" của đồng hồ DEMO, trừ khi truyền createdAt). */
async function addUser(db: MemoryDb, name: string, extra: Partial<Profile> = {}): Promise<string> {
  const id = uid();
  await db.insert('profiles', {
    id,
    phone: '+8490' + String(Math.floor(Math.random() * 1e7)).padStart(7, '0'),
    displayName: name,
    avatarUrl: null,
    birthday: null,
    interests: [],
    vehiclePrefs: [],
    points: 0,
    savedAmount: 0,
    savedCount: 0,
    role: 'user',
    adminRole: null,
    status: 'active',
    lockReason: null,
    createdAt: db.now().toISOString(),
    onboardedAt: db.now().toISOString(),
    ...extra,
  });
  return id;
}

/** Chuyến đã mở app hãng (không mã) để báo giá. */
async function openTrip(db: MemoryDb) {
  return db.rpc('record_trip', {
    originLabel: 'Nhà',
    originPlaceId: null,
    destPlaceId: 'ben-thanh',
    destLabel: 'Chợ Bến Thành',
    distanceKm: 3,
    durationMin: 10,
    attached: [],
    chosenService: 'grab-bike',
    estimateLow: 20000,
    estimateHigh: 25000,
    comparedCount: 3,
  });
}

const pointsOf = (db: MemoryDb, id: string) => db.data.profiles.find((p) => p.id === id)!.points;
const referralOf = (db: MemoryDb, refereeId: string) => db.data.referrals.find((r) => r.refereeId === refereeId)!;

describe('Giới thiệu bạn bè · mã và nhập mã', () => {
  it('mã sinh theo tên (6–7 ký tự in hoa), hồ sơ cũ có mã, che tên', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const id = await addUser(db, 'Tú Lê');
    const code = db.data.profiles.find((p) => p.id === id)!.referralCode!;
    expect(code).toMatch(/^TUL[A-Z2-9]{3}$/);
    expect(db.data.profiles.every((p) => /^[A-Z0-9]{6,7}$/.test(p.referralCode ?? ''))).toBe(true);
    expect(new Set(db.data.profiles.map((p) => p.referralCode)).size).toBe(db.data.profiles.length);
    expect(maskName('Lan Nguyễn')).toBe('Lan N.');
    expect(maskName('Minh Anh')).toBe('Minh A.');
    expect(maskName('Vy')).toBe('Vy');
    expect(maskName('  ')).toBe('Bạn Frego');
  });

  it('tài khoản mới (chưa có tên) đặt tên lần đầu thì mã đổi theo tên', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const id = await addUser(db, '');
    expect(db.data.profiles.find((p) => p.id === id)!.referralCode).toMatch(/^FRE/);
    db.setUser(id);
    await createUserService(db).updateProfile({ displayName: 'Hoa Trần' });
    expect(db.data.profiles.find((p) => p.id === id)!.referralCode).toMatch(/^HOAT[A-Z2-9]{2}$/);
  });

  it('kiểm tra / nhập mã: hợp lệ, mã của mình, mã sai, nhập lần hai', async () => {
    const db = createMemoryDb(createSeed());
    const me = await addUser(db, 'Tú Lê');
    db.setUser(me);
    const svc = createUserService(db);
    expect(await svc.checkReferralCode('lan7qx')).toEqual({ ok: true, ownerName: 'Lan N.' });
    const own = db.data.profiles.find((p) => p.id === me)!.referralCode!;
    expect(await svc.checkReferralCode(own)).toMatchObject({ ok: false, reason: 'own' });
    await expect(svc.applyReferralCode(own)).rejects.toThrow('Đây là mã của bạn');
    expect(await svc.checkReferralCode('ZZZZZZ')).toMatchObject({ ok: false, reason: 'not_found' });
    await expect(svc.applyReferralCode('ZZZZZZ')).rejects.toThrow('Không tìm thấy mã này');
    expect(await svc.applyReferralCode(' lan-7qx ')).toEqual({ ownerName: 'Lan N.' });
    expect(referralOf(db, me)).toMatchObject({ referrerId: LAN_ID, status: 'pending' });
    expect(await svc.checkReferralCode('MINHA7K')).toMatchObject({ ok: false, reason: 'already' });
    await expect(svc.applyReferralCode('MINHA7K')).rejects.toThrow('Bạn đã nhập mã giới thiệu rồi');
    const view = await svc.getReferral();
    expect(view.enteredBy).toEqual({ name: 'Lan N.' });
    expect(view.canEnter).toBe(false);
  });

  it('quá 7 ngày, khách ẩn danh, chủ mã tạo sau mình thì không nhập được', async () => {
    const db = createMemoryDb(createSeed());
    const old = await addUser(db, 'Cũ', { createdAt: new Date(db.now().getTime() - 8 * DAY).toISOString() });
    db.setUser(old);
    await expect(createUserService(db).applyReferralCode('LAN7QX')).rejects.toThrow('7 ngày đầu');
    expect(await createUserService(db).checkReferralCode('LAN7QX')).toMatchObject({ ok: false, reason: 'too_late' });

    const guest = await addUser(db, '', { phone: '' });
    db.setUser(guest);
    await expect(createUserService(db).applyReferralCode('LAN7QX')).rejects.toThrow('Đăng nhập bằng số điện thoại');
    expect(await createUserService(db).checkReferralCode('LAN7QX')).toMatchObject({ ok: false, reason: 'guest' });
    expect((await createUserService(db).getReferral()).canEnter).toBe(false);

    const early = await addUser(db, 'Sớm', { createdAt: new Date(db.now().getTime() - 2 * DAY).toISOString() });
    const late = await addUser(db, 'Muộn');
    const lateCode = db.data.profiles.find((p) => p.id === late)!.referralCode!;
    db.setUser(early);
    await expect(createUserService(db).applyReferralCode(lateCode)).rejects.toThrow('tài khoản tạo sau bạn');
    const r = await createUserService(db).checkReferralCode(lateCode);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('tạo sau bạn');
    const view = await createUserService(db).getReferral();
    expect(view.canEnter).toBe(true);
    expect(view.enterDaysLeft).toBe(5);
  });

  it('màn Giới thiệu của Minh Anh: mã, link, 4 bạn đã che tên, 2/10 lượt, 400 điểm', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const v = await createUserService(db).getReferral();
    expect(v.code).toBe('MINHA7K');
    expect(v.link).toBe('https://frego.vn/moi/MINHA7K');
    expect([v.rewardReferrer, v.rewardReferee, v.monthlyCap]).toEqual([200, 100, 10]);
    expect(v.monthRewarded).toBe(2);
    expect(v.pointsEarned).toBe(400);
    expect(v.canEnter).toBe(false);
    expect(v.enterDaysLeft).toBeNull();
    expect(v.friends.map((f) => [f.name, f.initial, f.status, f.points])).toEqual([
      ['Vy P.', 'V', 'pending', 0],
      ['Hùng T.', 'H', 'rewarded', 200],
      ['Lan N.', 'L', 'rewarded', 200],
      ['Khoa L.', 'K', 'expired', 0],
    ]);
    expect(v.friends[0]!.sub).toBe('Nhập mã 20/11 · còn 28 ngày');
    expect(v.friends[1]!.sub).toBe('Báo giá chuyến đầu 18/11');
    expect(v.friends[3]!.sub).toBe('Nhập mã 12/10, chưa có chuyến');
    expect(JSON.stringify(v)).not.toMatch(/\+84|Nguyễn|Trần/);
  });

  it('trang mời công khai: chỉ tên đã che', async () => {
    const db = createMemoryDb(createSeed());
    expect(await db.rpc('referral_owner_name', { code: 'minha7k' })).toEqual({ ownerName: 'Minh A.' });
    expect(await db.rpc('referral_owner_name', { code: 'KHONGCO' })).toEqual({ ownerName: null });
  });
});

describe('Giới thiệu bạn bè · cộng thưởng', () => {
  async function referred(referrerCode = 'LAN7QX') {
    const db = createMemoryDb(createSeed());
    const me = await addUser(db, 'Tú Lê');
    db.setUser(me);
    await createUserService(db).applyReferralCode(referrerCode);
    return { db, me, svc: createUserService(db) };
  }

  it('báo giá đầu tiên được cộng điểm → người mới +100, người giới thiệu +200, đúng một lần', async () => {
    const { db, me, svc } = await referred();
    const lanBefore = pointsOf(db, LAN_ID);
    const t1 = await openTrip(db);
    const r1 = await svc.reportPrice(t1.id, { verdict: 'within' });
    expect(r1.points).toBe(r1.pointsAwarded + POINTS_RULES.referral.referee);
    expect(pointsOf(db, LAN_ID)).toBe(lanBefore + POINTS_RULES.referral.referrer);
    const ref = referralOf(db, me);
    expect(ref.status).toBe('rewarded');
    expect(ref.rewardedAt).not.toBeNull();
    // Sổ điểm: lý do rõ, không gắn chuyến (không tính vào giới hạn 300 điểm/ngày).
    const mine = db.data.points_ledger.filter((e) => e.userId === me && e.reason.startsWith('Nhập mã giới thiệu'));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ delta: 100, tripId: null, reason: 'Nhập mã giới thiệu của Lan N.' });
    expect(db.data.points_ledger.filter((e) => e.userId === LAN_ID && e.reason === 'Giới thiệu bạn bè: Tú L.')).toHaveLength(1);
    const note = db.data.notifications.find((n) => n.userId === LAN_ID && n.link === '/gioi-thieu');
    expect(note?.title).toBe('Tú L. vừa hoàn tất chuyến đầu, bạn được +200 điểm');

    // Báo giá chuyến sau, thêm số tiền: không thưởng giới thiệu lần nữa.
    await svc.reportPrice(t1.id, { paidAmount: 22000 });
    const t2 = await openTrip(db);
    await svc.reportPrice(t2.id, { verdict: 'cheaper' });
    expect(db.data.points_ledger.filter((e) => e.reason.includes('giới thiệu') || e.reason.startsWith('Giới thiệu'))).toHaveLength(
      createSeed().points_ledger.filter((e) => e.reason.includes('giới thiệu') || e.reason.startsWith('Giới thiệu')).length + 2,
    );
    expect(pointsOf(db, LAN_ID)).toBe(lanBefore + 200);
  });

  it('báo giá không được cộng điểm (lệch > 30%) thì chưa thưởng', async () => {
    const { db, me, svc } = await referred();
    const t = await openTrip(db);
    const r = await svc.reportPrice(t.id, { paidAmount: 90000 });
    expect(r.pointsAwarded).toBe(0);
    expect(referralOf(db, me).status).toBe('pending');
  });

  it('điểm giới thiệu không tính vào giới hạn 300 điểm/ngày', async () => {
    const { db, me, svc } = await referred();
    db.data.points_ledger.push({ id: 'cap', userId: me, delta: 295, reason: 'Báo giá', tripId: 'x', createdAt: db.now().toISOString() });
    const t = await openTrip(db);
    const r = await svc.reportPrice(t.id, { verdict: 'within' });
    expect(r.pointsAwarded).toBe(5);
    expect(referralOf(db, me).status).toBe('rewarded');
    expect(db.data.points_ledger.some((e) => e.userId === me && e.delta === 100 && e.tripId === null)).toBe(true);
  });

  it('người giới thiệu đã đủ 10 lượt trong tháng → giữ để kiểm tra, không cộng điểm', async () => {
    const { db, me, svc } = await referred();
    for (let i = 0; i < 10; i++) {
      db.data.referrals.push({
        id: `fake-${i}`,
        referrerId: LAN_ID,
        refereeId: `fake-user-${i}`,
        status: 'rewarded',
        createdAt: db.now().toISOString(),
        qualifiedAt: db.now().toISOString(),
        rewardedAt: db.now().toISOString(),
        note: null,
      });
    }
    const lanBefore = pointsOf(db, LAN_ID);
    const t = await openTrip(db);
    const r = await svc.reportPrice(t.id, { verdict: 'within' });
    expect(r.points).toBe(r.pointsAwarded);
    expect(pointsOf(db, LAN_ID)).toBe(lanBefore);
    expect(referralOf(db, me)).toMatchObject({ status: 'held', note: 'Người giới thiệu đã đạt 10 lượt thưởng trong tháng' });

    // Quản trị duyệt lượt đang giữ → cộng điểm cả hai bên đúng một lần.
    db.setUser(DEMO_ADMIN_ID);
    const ops = createAdminOpsService(db);
    const adminView = await ops.getReferralAdmin();
    expect(adminView.held.map((h) => h.id)).toContain(referralOf(db, me).id);
    await ops.setReferralStatus(referralOf(db, me).id, 'rewarded');
    expect(referralOf(db, me).status).toBe('rewarded');
    expect(pointsOf(db, LAN_ID)).toBe(lanBefore + 200);
    expect(pointsOf(db, me)).toBe(r.points + 100);
    await expect(ops.setReferralStatus(referralOf(db, me).id, 'rejected', 'x')).rejects.toThrow('đã cộng điểm');
    expect(db.data.audit_logs.at(-1)!.action).toContain('Duyệt thưởng lượt giới thiệu Lan N. → Tú L.');
  });

  it('tài khoản người giới thiệu bị khóa → giữ lại; quản trị từ chối cần lý do', async () => {
    const { db, me, svc } = await referred();
    db.data.profiles.find((p) => p.id === LAN_ID)!.status = 'locked';
    const lanBefore = pointsOf(db, LAN_ID);
    const t = await openTrip(db);
    await svc.reportPrice(t.id, { verdict: 'within' });
    expect(referralOf(db, me)).toMatchObject({ status: 'held', note: 'Tài khoản người giới thiệu đang tạm khóa' });
    expect(pointsOf(db, LAN_ID)).toBe(lanBefore);
    db.setUser(DEMO_ADMIN_ID);
    const ops = createAdminOpsService(db);
    await expect(ops.setReferralStatus(referralOf(db, me).id, 'rejected')).rejects.toThrow('lý do');
    await ops.setReferralStatus(referralOf(db, me).id, 'rejected', 'Tài khoản trùng thiết bị');
    expect(referralOf(db, me)).toMatchObject({ status: 'rejected', note: 'Tài khoản trùng thiết bị' });
  });

  it('quá 30 ngày chưa báo giá → hết hạn, không thưởng', async () => {
    const { db, me, svc } = await referred();
    referralOf(db, me).createdAt = new Date(db.now().getTime() - 31 * DAY).toISOString();
    const t = await openTrip(db);
    await svc.reportPrice(t.id, { verdict: 'within' });
    expect(referralOf(db, me).status).toBe('expired');
    expect(db.data.points_ledger.some((e) => e.userId === me && e.delta === 100)).toBe(false);
  });

  it('hết hạn tính lúc đọc màn Giới thiệu', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    db.data.referrals.find((r) => r.id === 'ref-vy')!.createdAt = new Date(db.now().getTime() - 31 * DAY).toISOString();
    const v = await createUserService(db).getReferral();
    expect(v.friends.find((f) => f.name === 'Vy P.')!.status).toBe('expired');
    expect(db.data.referrals.find((r) => r.id === 'ref-vy')!.status).toBe('expired');
  });

  it('biên nhận Gmail được cộng điểm cũng tính là báo giá đầu', async () => {
    const { db, me } = await referred();
    db.data.gmail_connections.push({
      userId: me,
      email: 'a@gmail.com',
      status: 'active',
      connectedAt: db.now().toISOString(),
      lastSyncAt: null,
      lastError: null,
    } as never);
    await openTrip(db);
    const r = await db.rpc('record_receipt', { messageId: 'm1', providerId: 'grab', paidAmount: 22000, receivedAt: db.now().toISOString() });
    expect(r.status).toBe('matched');
    expect(r.pointsAwarded).toBeGreaterThan(0);
    expect(referralOf(db, me).status).toBe('rewarded');
  });
});

describe('Ảnh bìa Trang chủ (QT 13)', () => {
  const png = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: 'image/png' });

  it('chưa có ảnh → null; tải ảnh kiểm loại và dung lượng', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_ADMIN_ID });
    expect(await createUserService(db).getHomeCover()).toBeNull();
    const ops = createAdminOpsService(db);
    await expect(ops.uploadHomeCover(new Blob(['x'], { type: 'image/gif' }), 'a.gif')).rejects.toThrow('JPG, PNG hoặc WebP');
    await expect(ops.uploadHomeCover(png(600 * 1024), 'a.png')).rejects.toThrow('tối đa 500 KB');
    const up = await ops.uploadHomeCover(png(1000), 'a.png');
    expect(up.imageUrl).toMatch(/^data:image\/png;base64,/);
    expect(up.storagePath).toMatch(/^demo\/.+\.png$/);
  });

  it('kiểm thời gian, lớp phủ, trùng lịch; hẹn hiện → app thấy ảnh, ghi nhật ký', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_ADMIN_ID });
    const ops = createAdminOpsService(db);
    const up = await ops.uploadHomeCover(png(1000), 'a.png');
    const base = { title: 'Black Friday', overlay: 0.4, status: 'scheduled' as const, ...up };
    await expect(ops.saveHomeCover({ ...base, startsAt: '22/11/2026 20:00', endsAt: '22/11/2026 19:00' })).rejects.toThrow('phải sau');
    await expect(ops.saveHomeCover({ ...base, overlay: 0.3, startsAt: '22/11/2026 00:00', endsAt: '23/11/2026 23:59' })).rejects.toThrow('Lớp phủ');
    await expect(ops.saveHomeCover({ ...base, startsAt: '31/02/2026 00:00', endsAt: '23/11/2026 23:59' })).rejects.toThrow('bắt đầu');
    await expect(ops.saveHomeCover({ ...base, imageUrl: undefined, storagePath: undefined, startsAt: '22/11/2026 00:00', endsAt: '23/11/2026 23:59' })).rejects.toThrow('Tải ảnh');

    const { cover } = await ops.saveHomeCover({ ...base, startsAt: '22/11/2026 00:00', endsAt: '23/11/2026 23:59' });
    expect(cover.startsAt).toBe('2026-11-21T17:00:00.000Z');
    expect(cover.createdBy).toBe(DEMO_ADMIN_ID);
    expect(db.data.audit_logs.at(-1)!.action).toContain('Hẹn hiện ảnh bìa app "Black Friday"');
    expect(await createUserService(db).getHomeCover()).toEqual({ imageUrl: up.imageUrl, overlay: 0.4, title: 'Black Friday' });

    await expect(ops.saveHomeCover({ ...base, title: 'Trùng', startsAt: '23/11/2026 08:00', endsAt: '25/11/2026 23:59' })).rejects.toThrow(
      'Trùng thời gian với ảnh "Black Friday"',
    );
    // Nháp được trùng giờ; sửa chính ảnh đó không tính là trùng.
    await ops.saveHomeCover({ ...base, status: 'draft', title: 'Nháp', startsAt: '23/11/2026 08:00', endsAt: '25/11/2026 23:59' });
    await ops.saveHomeCover({ ...base, id: cover.id, startsAt: '22/11/2026 00:00', endsAt: '24/11/2026 23:59', overlay: 0.6 });

    const rows = await ops.listHomeCovers();
    const live = rows.find((r) => r.id === cover.id)!;
    expect(live.live).toBe(true);
    expect(live.label.text).toBe('Đang hiện');
    expect(live.windowText).toBe('22/11 00:00 – 24/11/2026 23:59');
    expect(live.editorText).toContain('Vận hành Frego · vận hành');
    expect(rows.find((r) => r.title === 'Nháp')!.label.text).toBe('Nháp');

    await ops.deleteHomeCover(cover.id);
    expect(await createUserService(db).getHomeCover()).toBeNull();
    expect(db.data.audit_logs.at(-1)!.action).toBe('Gỡ ảnh bìa app "Black Friday"');
  });

  it('chọn ảnh đang hiện: đã hẹn, trong khung giờ, bắt đầu muộn nhất thắng', async () => {
    const db = createMemoryDb(createSeed());
    const now = db.now().getTime();
    const row = (title: string, startOff: number, endOff: number, status: 'draft' | 'scheduled' = 'scheduled') => ({
      id: title,
      title,
      imageUrl: `https://cdn.example/${title}.webp`,
      storagePath: null,
      startsAt: new Date(now + startOff * 3600_000).toISOString(),
      endsAt: new Date(now + endOff * 3600_000).toISOString(),
      overlay: 0.2,
      status,
      createdBy: null,
      updatedAt: new Date(now).toISOString(),
    });
    db.data.app_banners.push(row('cu', -48, -1), row('som', -10, 10), row('muon', -2, 5), row('nhap', -1, 5, 'draft'), row('sau', 1, 9));
    expect(await db.rpc('active_home_cover', {})).toEqual({ imageUrl: 'https://cdn.example/muon.webp', overlay: 0.2, title: 'muon' });
  });

  it('tương phản chữ trắng: ảnh trắng cần lớp phủ 60%, ảnh tối đạt sẵn', () => {
    const white = new Array(4 * 50).fill(255);
    expect(coverContrastFromPixels(white, 0.4)!).toBeLessThan(4.5);
    expect(coverContrastFromPixels(white, 0.6)!).toBeGreaterThanOrEqual(4.5);
    const dark = Array.from({ length: 50 }, () => [20, 30, 60, 255]).flat();
    expect(coverContrastFromPixels(dark, 0)!).toBeGreaterThanOrEqual(4.5);
    expect(coverContrastFromPixels([], 0.4)).toBeNull();
  });
});

describe('Ảnh tại quán (+50 điểm)', () => {
  /** Chuyến dùng mã của Quán bún Ngõ Nhỏ (10.7752, 106.7036). */
  async function shopTrip(db: MemoryDb) {
    return db.rpc('record_trip', {
      originLabel: 'Landmark 81',
      originPlaceId: 'landmark81',
      destPlaceId: 'ben-thanh',
      destLabel: 'Chợ Bến Thành',
      distanceKm: 5.8,
      durationMin: 20,
      attached: [{ service: 'grab-bike', source: 'sponsor', refId: 'cp:cp-bun-trua', code: '', label: 'Quán bún Ngõ Nhỏ', amount: 10000 }],
      chosenService: 'grab-bike',
      estimateLow: 25000,
      estimateHigh: 30000,
      comparedCount: 3,
    });
  }
  const photo = (seed: number) => new Blob([new Uint8Array([seed, 1, 2, 3, 4])], { type: 'image/jpeg' });
  const near = { lat: 10.7753, lng: 106.7037 };

  it('SHA-256 bản JS đúng chuẩn', () => {
    const abc = new Uint8Array([0x61, 0x62, 0x63]);
    expect(sha256HexSync(abc)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256HexSync(new Uint8Array(0))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('chuyến không có mã của quán → null; chuyến có mã → trạng thái theo ảnh', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    expect(await svc.getShopPhotoState('trip-today')).toBeNull();
    expect(await svc.getShopPhotoState('trip-fri')).toEqual({ shopName: 'Tiệm bánh Mộc', status: 'pending', points: 50, rejectReason: null });
    const t = await shopTrip(db);
    expect(await svc.getShopPhotoState(t.id)).toMatchObject({ shopName: 'Quán bún Ngõ Nhỏ', status: 'none' });
  });

  it('gửi ảnh: kiểm vị trí, giờ chụp, mỗi chuyến một ảnh, ảnh không trùng', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    const t = await shopTrip(db);
    const now = db.now().getTime();
    await expect(svc.submitShopPhoto(t.id, { file: photo(1), takenAt: new Date(now).toISOString(), lat: 10.7852, lng: 106.7036 })).rejects.toThrow(
      /Vị trí chụp cách quán \d+ m, cần ở trong vòng 150 m/,
    );
    await expect(svc.submitShopPhoto(t.id, { file: photo(1), takenAt: new Date(now - 3600_000).toISOString(), ...near })).rejects.toThrow(
      'trong 24 giờ sau chuyến đi',
    );
    await expect(svc.submitShopPhoto(t.id, { file: photo(1), takenAt: new Date(now + 3600_000).toISOString(), ...near })).rejects.toThrow(
      'Giờ chụp không hợp lệ',
    );
    const sent = await svc.submitShopPhoto(t.id, { file: photo(1), takenAt: new Date(now).toISOString(), ...near });
    expect(sent).toMatchObject({ status: 'pending', businessId: 'biz-bun-ngo-nho', userId: DEMO_USER_ID });
    expect(sent.distanceM).toBeLessThanOrEqual(20);
    expect(sent.sha256).toBe(sha256HexSync(new Uint8Array([1, 1, 2, 3, 4])));
    expect(sent.storagePath.startsWith(`${DEMO_USER_ID}/`)).toBe(true);
    expect(await svc.getShopPhotoState(t.id)).toMatchObject({ status: 'pending' });
    await expect(svc.submitShopPhoto(t.id, { file: photo(2), takenAt: new Date(now).toISOString(), ...near })).rejects.toThrow('đã gửi ảnh');

    // Cùng ảnh cho chuyến khác → chặn trùng.
    const t2 = await shopTrip(db);
    await expect(svc.submitShopPhoto(t2.id, { file: photo(1), takenAt: new Date(now).toISOString(), ...near })).rejects.toThrow(
      'Ảnh này đã được gửi trước đây',
    );
    // Ảnh từ uri (React Native, DEMO): băm uri.
    const viaUri = await svc.submitShopPhoto(t2.id, { file: { uri: 'file:///anh.jpg' }, takenAt: db.now().toISOString(), ...near });
    expect(viaUri.status).toBe('pending');
    // RPC chặn đường dẫn thư mục người khác.
    const t3 = await shopTrip(db);
    await expect(
      db.rpc('submit_shop_photo', { tripId: t3.id, storagePath: 'nguoi-khac/a.jpg', sha256: 'c'.repeat(64), takenAt: db.now().toISOString(), ...near }),
    ).rejects.toThrow('Ảnh không hợp lệ');
  });

  it('khách ẩn danh và chuyến không có mã quán không gửi được', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const t = await shopTrip(db);
    await expect(
      createUserService(db).submitShopPhoto('trip-today', { file: photo(9), takenAt: db.now().toISOString(), ...near }),
    ).rejects.toThrow('không dùng mã của quán');
    db.data.profiles.find((p) => p.id === DEMO_USER_ID)!.phone = '';
    await expect(
      db.rpc('submit_shop_photo', { tripId: t.id, storagePath: `${DEMO_USER_ID}/a.jpg`, sha256: 'd'.repeat(64), takenAt: db.now().toISOString(), ...near }),
    ).rejects.toThrow('Đăng nhập bằng số điện thoại');
  });

  it('quản trị duyệt → +50 điểm đúng một lần + thông báo; từ chối cần lý do', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const svc = createUserService(db);
    const t = await shopTrip(db);
    const sent = await svc.submitShopPhoto(t.id, { file: photo(5), takenAt: db.now().toISOString(), ...near });
    const before = pointsOf(db, DEMO_USER_ID);

    db.setUser(DEMO_ADMIN_ID);
    const ops = createAdminOpsService(db);
    const queue = await ops.listShopPhotos();
    expect(queue.pendingCount).toBe(2);
    const row = queue.rows.find((r) => r.id === sent.id)!;
    expect(row).toMatchObject({ shopName: 'Quán bún Ngõ Nhỏ', userText: 'Minh A. · 0909 ••• 123', label: { text: 'Chờ duyệt', tone: 'amber' } });
    expect(row.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(row.distanceText).toMatch(/^Cách quán \d+ m$/);

    await ops.reviewShopPhoto(sent.id, true);
    expect(pointsOf(db, DEMO_USER_ID)).toBe(before + 50);
    expect(db.data.points_ledger.at(-1)).toMatchObject({ delta: 50, reason: 'Ảnh tại quán Quán bún Ngõ Nhỏ', tripId: null });
    expect(db.data.notifications.at(-1)).toMatchObject({ userId: DEMO_USER_ID, kind: 'points', title: 'Ảnh tại Quán bún Ngõ Nhỏ đã được duyệt, +50 điểm' });
    await expect(ops.reviewShopPhoto(sent.id, true)).rejects.toThrow('đã được xử lý');
    expect(pointsOf(db, DEMO_USER_ID)).toBe(before + 50);
    expect(await db.rpc('business_checkin_count', { businessId: 'biz-bun-ngo-nho' })).toEqual({ count: 1 });

    await expect(ops.reviewShopPhoto('sph-banh-moc', false, '  ')).rejects.toThrow('lý do');
    await ops.reviewShopPhoto('sph-banh-moc', false, 'Ảnh không thấy quán');
    expect(db.data.shop_photos.find((p) => p.id === 'sph-banh-moc')).toMatchObject({
      status: 'rejected',
      rejectReason: 'Ảnh không thấy quán',
      reviewedBy: 'Vận hành Frego',
    });
    expect(pointsOf(db, DEMO_USER_ID)).toBe(before + 50);
    db.setUser(DEMO_USER_ID);
    expect(await svc.getShopPhotoState('trip-fri')).toMatchObject({ status: 'rejected', rejectReason: 'Ảnh không thấy quán' });
    expect((await ops.listShopPhotos()).pendingCount).toBe(0);
  });
});

describe('Trang chủ v3', () => {
  it('lời chào, chip ví, hạn ưu đãi', async () => {
    const db = createMemoryDb(createSeed(), { userId: DEMO_USER_ID });
    const home = await createUserService(db).getHome();
    expect(home.greetingName).toBe('Minh Anh');
    expect(home.walletChip).toMatch(/^\d+ mã · 1\.250 điểm$/);
    expect(home.deals.length).toBeGreaterThan(0);
    for (const d of home.deals) expect(d.endsInText).toMatch(/^(Còn \d+ ngày|Hết hạn hôm nay)$/);
    const guest = await addUser(db, '', { phone: '' });
    db.setUser(guest);
    const g = await createUserService(db).getHome();
    expect(g.greetingName).toBe('');
    expect(g.walletChip).toBe('Mã công khai');
  });
});
