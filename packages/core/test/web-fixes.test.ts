/**
 * Sửa lỗi cổng doanh nghiệp + quản trị (docs/plan.md mục 10–16, 27/11/2026):
 * chiến dịch chưa tới ngày, nội dung chuyển khoản riêng + khớp từng dòng, PayOS (chữ ký, cộng tiền một lần),
 * điểm cộng tháng khớp bảng quy tắc, đổi địa chỉ quay lại duyệt, duyệt hồ sơ thiếu giấy tờ, trả lời hỗ trợ.
 */
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  BIZ_EV_ADDRESS_REREVIEW,
  createAdminOpsService,
  createAdminService,
  createBusinessService,
  createMemoryDb,
  createSeed,
  DEMO_ADMIN_ID,
  DEMO_OWNER_ID,
  imageFileName,
  newPayosOrderCode,
  nextTopupNumber,
  payosDataSignString,
  payosDescription,
  payosRequestSignData,
  pointsFromRuleUses,
  verifyPayosWebhook,
} from '../src';

const BIZ = 'biz-cafe-may';
const hmac = (key: string, msg: string) => createHmac('sha256', key).update(msg, 'utf8').digest('hex');

function world() {
  const db = createMemoryDb(createSeed(), { userId: DEMO_OWNER_ID });
  const as = (id: string) => {
    db.setUser(id);
    return db;
  };
  return {
    db,
    owner: () => createBusinessService(as(DEMO_OWNER_ID), BIZ),
    admin: () => createAdminService(as(DEMO_ADMIN_ID)),
    ops: () => createAdminOpsService(as(DEMO_ADMIN_ID)),
  };
}

describe('10 · chiến dịch đã duyệt nhưng chưa tới ngày', () => {
  it('hiện "Đã duyệt · chạy từ 01/12", không tính là đang chạy, không là chiến dịch chính', async () => {
    const w = world();
    // Chỉ còn chiến dịch chưa tới ngày: dừng chiến dịch đang chạy, rồi duyệt "Khai trương món mới" (từ 01/12).
    await w.owner().setCampaignPaused('cp-may-chieu', true);
    await w.admin().approveCampaign('cp-may-mon-moi');
    expect((await w.db.get('campaigns', 'cp-may-mon-moi'))!.status).toBe('active');

    const list = await w.owner().listCampaigns();
    const row = list.rows.find((r) => r.id === 'cp-may-mon-moi')!;
    expect(row.status).toBe('scheduled');
    expect(row.statusLabel).toBe('Đã duyệt · chạy từ 01/12');
    expect(list.running).toBeNull();
    expect(list.tabs.find((t) => t.key === 'dang-chay')!.count).toBe(0);
    expect(list.tabs.find((t) => t.key === 'sap-chay')!.count).toBe(1);

    const detail = await w.owner().getCampaignDetail('cp-may-mon-moi');
    expect(detail!.statusLabel).toBe('Đã duyệt · chạy từ 01/12');
    // Ví không tính chiến dịch chưa chạy.
    expect((await w.owner().getWallet()).coverText).toContain('Chưa có chiến dịch đang chạy');

    const page = await w.admin().getCampaignsPage({ tab: 'sap-chay', id: 'cp-may-mon-moi' });
    expect(page.rows.map((r) => r.id)).toEqual(['cp-may-mon-moi']);
    expect(page.selected!.chip).toEqual({ text: 'Đã duyệt · chạy từ 01/12', tone: 'blue' });
    const running = await w.admin().getCampaignsPage({ tab: 'dang-chay' });
    expect(running.rows.some((r) => r.id === 'cp-may-mon-moi')).toBe(false);
  });
});

describe('11 · nạp ví: nội dung riêng, khớp từng dòng, PayOS', () => {
  it('mỗi lần "Tôi đã chuyển khoản" có nội dung chuyển khoản riêng', async () => {
    const w = world();
    const before = await w.owner().getWallet();
    expect(before.nextReference).toBe('FREGO CPM1024-3'); // -1, -2 đã có trong dữ liệu mẫu
    const a = await w.owner().reportTransfer(5_000_000, before.nextReference);
    const b = await w.owner().reportTransfer(5_000_000, before.nextReference); // bấm lại với nội dung cũ → vẫn mã mới
    expect(a.transaction.reference).toBe('FREGO CPM1024-3');
    expect(b.transaction.reference).toBe('FREGO CPM1024-4');
    const refs = w.db.data.wallet_transactions.filter((t) => t.kind === 'topup' && t.reference).map((t) => t.reference);
    expect(new Set(refs).size).toBe(refs.length);
    expect(nextTopupNumber('FREGO X1', ['FREGO X1-2', 'FREGO X1-10', 'khác', null])).toBe(11);
  });

  it('quản trị khớp đúng một dòng, dòng kia vẫn chờ; khớp lại thì báo đã cộng', async () => {
    const w = world();
    const a = await w.owner().reportTransfer(5_000_000);
    const b = await w.owner().reportTransfer(5_000_000);
    const balance = (await w.db.get('businesses', BIZ))!.walletBalance;
    const money = await w.ops().getMoney();
    const mine = money.pendingTopups.filter((p) => p.id === a.transaction.id || p.id === b.transaction.id);
    expect(mine.map((p) => p.reference)).toEqual(expect.arrayContaining(['FREGO CPM1024-3', 'FREGO CPM1024-4']));

    await w.ops().confirmTopup(b.transaction.id);
    expect((await w.db.get('businesses', BIZ))!.walletBalance).toBe(balance + 5_000_000);
    expect((await w.db.get('wallet_transactions', a.transaction.id))!.status).toBe('pending');
    await expect(w.ops().confirmTopup(b.transaction.id)).rejects.toThrow(/đã được cộng/);
    expect((await w.db.get('businesses', BIZ))!.walletBalance).toBe(balance + 5_000_000);
  });

  it('PayOS: cộng tiền một lần theo mã đơn, đúng số tiền', async () => {
    const w = world();
    const orderCode = newPayosOrderCode(Date.parse('2026-11-27T03:00:00Z'), () => 0.123);
    expect(Number.isSafeInteger(orderCode)).toBe(true);
    expect(payosDescription(orderCode).length).toBeLessThanOrEqual(9);
    await w.owner().startPayosTopup(2_000_000, orderCode);
    const balance = (await w.db.get('businesses', BIZ))!.walletBalance;

    expect(await w.db.rpc('payos_credit_topup', { orderCode, amount: 1_000_000 })).toMatchObject({ credited: false, reason: 'amount_mismatch' });
    expect(await w.db.rpc('payos_credit_topup', { orderCode: 42, amount: 2_000_000 })).toMatchObject({ credited: false, reason: 'not_found' });
    const first = await w.db.rpc('payos_credit_topup', { orderCode, amount: 2_000_000, reference: 'FT123' });
    expect(first).toEqual({ credited: true, balance: balance + 2_000_000, reason: 'ok' });
    const again = await w.db.rpc('payos_credit_topup', { orderCode, amount: 2_000_000 });
    expect(again).toMatchObject({ credited: false, reason: 'already', balance: balance + 2_000_000 });
    expect(await w.owner().getPayosTopup(orderCode)).toEqual({ status: 'done', amountText: '2.000.000đ' });
  });

  it('PayOS: chuỗi ký và kiểm chữ ký webhook', () => {
    expect(
      payosRequestSignData({ orderCode: 123, amount: 2000, description: 'FR0000123', returnUrl: 'https://a/r', cancelUrl: 'https://a/c' }),
    ).toBe('amount=2000&cancelUrl=https://a/c&description=FR0000123&orderCode=123&returnUrl=https://a/r');
    const data = { orderCode: 123, amount: 3000, description: 'VQRIO123', reference: 'TF230204212323', counterAccountName: null, code: '00' };
    expect(payosDataSignString(data)).toBe(
      'amount=3000&code=00&counterAccountName=&description=VQRIO123&orderCode=123&reference=TF230204212323',
    );
    const key = 'khoa-thu';
    const signature = hmac(key, payosDataSignString(data));
    expect(verifyPayosWebhook({ data, signature }, key, hmac)).toBe(true);
    expect(verifyPayosWebhook({ data: { ...data, amount: 300000 }, signature }, key, hmac)).toBe(false);
    expect(verifyPayosWebhook({ data, signature }, 'khoa-khac', hmac)).toBe(false);
    expect(verifyPayosWebhook({ data }, key, hmac)).toBe(false);
  });

  it('bỏ tự nạp từ thẻ đã lưu (dữ liệu mẫu không còn "Thẻ đã lưu")', async () => {
    const w = world();
    expect(w.db.data.wallet_transactions.some((t) => /thẻ đã lưu/i.test(`${t.reference} ${t.note}`))).toBe(false);
    expect('autoTopup' in (await w.owner().getWallet())).toBe(false);
  });
});

describe('12 · đổi địa chỉ → chờ duyệt lại, kiểm tra tự động không báo "khớp"', () => {
  it('ghi lý do, cập nhật quận, quản trị thấy cảnh báo', async () => {
    const w = world();
    const r = await w.owner().updateProfile({ address: '12 Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM' });
    expect(r.rereview).toBe(1);
    expect((await w.db.get('businesses', BIZ))!.district).toBe('Quận 3');
    const evs = w.db.data.campaign_events.filter((e) => e.campaignId === 'cp-may-chieu');
    expect(evs.some((e) => e.text === BIZ_EV_ADDRESS_REREVIEW)).toBe(true);

    const page = await w.admin().getReviewPage({ id: 'cp-may-chieu' });
    const d = page.selected!;
    expect(d.id).toBe('cp-may-chieu');
    expect(d.checks.some((c) => /khớp vị trí/.test(c.title))).toBe(false);
    expect(d.checks.some((c) => c.tone === 'amber' && /đổi địa chỉ/.test(c.title))).toBe(true);
    expect(d.facts.find((f) => f.label === 'Lý do chờ duyệt')!.value).toMatch(/đổi địa chỉ/);
    // Không mâu thuẫn "Ảnh do doanh nghiệp tải lên" với "Chưa có ảnh chiến dịch".
    const noImage = d.checks.some((c) => c.title === 'Chưa có ảnh chiến dịch');
    expect(noImage && d.preview!.meta === 'Ảnh do doanh nghiệp tải lên').toBe(false);

    const biz = await w.admin().getBusinessesPage({ all: true });
    expect(biz.rows.find((x) => x.id === BIZ)!.sub).toMatch(/^Quận 3 · /);
  });
});

describe('13 · duyệt hồ sơ thiếu giấy tờ', () => {
  it('hiện email, số điện thoại; thiếu giấy tờ phải xác nhận lại', async () => {
    const w = world();
    const page = await w.admin().getReviewPage({ tab: 'doanh-nghiep', id: 'biz-qt-sach-gio-dk' });
    const d = page.selected!;
    expect(d.facts.find((f) => f.label === 'Email liên hệ')!.value).toBe('cuahang2@nhasachgio.vn');
    expect(d.facts.find((f) => f.label === 'Số điện thoại')).toBeTruthy();
    expect(d.facts.find((f) => f.label === 'Ngành')!.value).toBe('Bán lẻ · Sách, văn phòng phẩm');
    expect(d.approveConfirm).toMatch(/ảnh mặt tiền/);
    await expect(w.admin().approveBusiness('biz-qt-sach-gio-dk')).rejects.toThrow(/Xác nhận lại/);
    await w.admin().approveBusiness('biz-qt-sach-gio-dk', { confirmMissing: true });
    expect((await w.db.get('businesses', 'biz-qt-sach-gio-dk'))!.status).toBe('active');
  });
});

describe('14 · số liệu khớp nhau', () => {
  it('điểm cộng tháng = tổng theo bảng quy tắc', async () => {
    const w = world();
    const v = await w.ops().getPointsAdmin();
    const n = (t: string) => Number(t.replace(/\D/g, ''));
    const fromRules = n(v.rules.find((r) => r.key === 'tap')!.usesText) * 10 + n(v.rules.find((r) => r.key === 'amount')!.usesText) * 50 + n(v.rules.find((r) => r.key === 'receipt')!.usesText) * 50;
    expect(n(v.stats.awarded.value)).toBe(fromRules);
    expect(v.stats.awarded.value).toBe('86.200');
    expect(pointsFromRuleUses(new Map([['tap', 2], ['amount', 1], ['nodata_bonus', 50]]))).toBe(120);
    expect(pointsFromRuleUses(new Map())).toBeNull();
  });

  it('hóa đơn tạm tính tháng 11 = "Đã chi tháng 11" (Quán bún Ngõ Nhỏ)', async () => {
    const w = world();
    const page = await w.admin().getBusinessesPage({ id: 'biz-bun-ngo-nho', all: true });
    const spent = page.selected!.facts.find((f) => f.label === 'Đã chi tháng 11')!.value;
    const inv = (await w.ops().getMoney()).invoices.find((i) => i.businessName === 'Quán bún Ngõ Nhỏ' && i.periodText === 'Tháng 11/2026')!;
    expect(inv.amountText).toBe(spent);
  });

  it('lượt xem quảng cáo ghi rõ mốc đếm, không đặt cạnh số mã đã dùng', async () => {
    const w = world();
    const r = await w.owner().getReport();
    expect(r.adViews.sub).toMatch(/^từ \d{2}\/\d{2}\/\d{4} \(ngày banner được duyệt\)/);
    expect(r.adViews.sub).not.toMatch(/mã đã dùng/);
    expect(r.hours.note).toMatch(/Grab ô tô 4 chỗ 13:00–19:00/);
  });

  it('nhãn Duyệt tính cả banner chờ duyệt; số yêu cầu hỗ trợ liền mạch; không trùng tên Nhà sách Gió', async () => {
    const w = world();
    w.db.data.ad_banners.push({
      id: 'ab-cho', businessId: BIZ, imageUrl: 'data:image/png;base64,AA==', title: 'Mua 2 tặng 1', body: '', status: 'pending',
      rejectReason: null, submittedAt: '2026-11-22T09:00:00.000Z', reviewedAt: null, reviewedBy: null,
    });
    const o = await w.admin().getOverview();
    expect(o.todo.find((t) => t.key === 'review')!.sub).toMatch(/banner quảng cáo/);
    const s = await w.ops().getSupport('all');
    expect(s.rows.map((r) => r.number)).not.toContain('#1');
    const names = w.db.data.businesses.filter((b) => b.name === 'Nhà sách Gió');
    expect(names.length).toBe(1);
  });

  it('tên ảnh dùng lại không lấy đuôi base64 ("Z")', () => {
    expect(imageFileName('data:image/png;base64,AAAZ')).toBe('');
    expect(imageFileName('https://x.vn/a/logo-may.png?t=1')).toBe('logo-may.png');
  });
});

describe('Hỗ trợ: trả lời yêu cầu', () => {
  it('mở yêu cầu thấy lời người gửi; trả lời được lưu, yêu cầu chuyển "Đang xử lý"', async () => {
    const w = world();
    const before = await w.ops().getSupport('all', 'st-1042');
    expect(before.selected!.messages[0]).toMatchObject({ fromFrego: false, author: 'Minh Anh' });
    await w.ops().replyTicket('st-1042', 'Frego đã kiểm tra, mã FREGO20 dùng được cho Be xe máy từ 20.000đ.');
    const after = await w.ops().getSupport('all', 'st-1042');
    expect(after.selected!.messages.at(-1)).toMatchObject({ fromFrego: true, body: expect.stringContaining('FREGO20') });
    expect(after.selected!.status).toBe('pending');
    expect(w.db.data.ticket_messages.filter((m) => m.ticketId === 'st-1042').length).toBe(2);
    await expect(w.ops().replyTicket('st-1042', '   ')).rejects.toThrow(/Nhập nội dung/);
    // "Đánh dấu đã xong" vẫn chạy.
    await w.ops().setTicketStatus('st-1042', 'done');
    expect((await w.db.get('support_tickets', 'st-1042'))!.status).toBe('done');
  });

  it('hủy tin ưu đãi đã hẹn', async () => {
    const w = world();
    const ops = w.ops();
    const { broadcast } = await ops.scheduleBroadcast({ title: 'Thử hủy', body: 'Nội dung thử', sendAt: '25/11 17:30' });
    expect((await ops.getNotificationsAdmin()).scheduled.some((b) => b.id === broadcast.id)).toBe(true);
    await ops.cancelBroadcast(broadcast.id);
    expect((await w.db.get('broadcasts', broadcast.id))!.status).toBe('draft');
  });

  it('xóa thành viên cửa hàng (không xóa chính mình)', async () => {
    const w = world();
    await expect(w.owner().removeMember('bm-1')).rejects.toThrow(/chính mình/);
    await w.owner().removeMember('bm-2');
    expect(w.db.data.business_members.some((m) => m.id === 'bm-2')).toBe(false);
  });
});
