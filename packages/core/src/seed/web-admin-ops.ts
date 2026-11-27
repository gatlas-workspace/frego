/**
 * Dữ liệu mẫu cho Quản trị · nhóm Tiền, điểm, thông báo, bảng giá, đối tác, hỗ trợ (QT 7–12).
 * Agent/dev phụ trách nhóm này sở hữu file này. Dòng được NỐI THÊM vào seed chung.
 *
 * Dùng lại dòng của file khác, không chép: giao dịch 'wt-1' (trừ ví) và 'wt-2' (nạp 5.000.000đ chờ khớp) của
 * Cà phê Mây ở seed/web-business.ts; yêu cầu 'st-1043' và nhật ký 'al-1' (10:02) ở seed/web-admin.ts.
 * Dòng nào đã có ở seed/web-admin.ts (cùng id, cùng tên quán, cùng giờ + nội dung nhật ký) thì bỏ qua ở đây.
 */
import type { Seed } from '../db/schema';
import type { AuditLog, Business, Profile, SupportTicket } from '../types';
import { vn } from './base';
import { adminSeed } from './web-admin';

/* ───────────── Tiệm nail Xinh: quán tạm khóa, ví không đủ để trừ (QT 3, QT 4, QT 7) ───────────── */

const sharedNail = adminSeed.businesses?.find((b) => b.name === 'Tiệm nail Xinh');
const NAIL_ID = sharedNail?.id ?? 'biz-nail-xinh';
const nailXinh: Business = {
  id: NAIL_ID,
  name: 'Tiệm nail Xinh',
  legalName: 'Hộ kinh doanh Tiệm nail Xinh',
  taxCode: '0316998877',
  representative: 'Lê Thị Xinh',
  // Chưa có nhóm "Làm đẹp" trong CategoryKey; tạm dùng biểu tượng phòng tập cho logo.
  category: 'gym',
  industry: 'Làm đẹp · Tiệm nail',
  address: 'Đường Ba Tháng Hai, Quận 10, TP.HCM',
  district: 'Quận 10',
  landmark: 'Vạn Hạnh Mall',
  lat: 10.7706,
  lng: 106.6694,
  openHours: { weekdays: '09:00 – 21:00', saturday: '09:00 – 21:00', sunday: '09:00 – 21:00' },
  status: 'locked',
  walletBalance: 120000,
  autoTopup: { enabled: false, amount: 2000000, threshold: 500000 },
  invoiceName: 'Hộ kinh doanh Tiệm nail Xinh',
  invoiceEmail: '',
  contactEmail: 'nailxinh@gmail.com',
  contactPhone: '',
  logoUrl: null,
  storefrontVerified: true,
  transferCode: 'FREGO NXI1088',
  notifyPrefs: { review: true, lowBalance: true, weekly: true },
  joinedAt: vn('2026-10-02 10:00'),
};

/* ───────────── Quản trị viên (Vận hành 2, Kế toán 1, Hỗ trợ 2; "Vận hành Frego" có sẵn ở base) ───────────── */

const staff = (id: string, displayName: string, adminRole: Profile['adminRole'], phone: string, referralCode: string): Profile => ({
  id,
  phone,
  displayName,
  referralCode,
  avatarUrl: null,
  birthday: null,
  interests: [],
  vehiclePrefs: [],
  points: 0,
  savedAmount: 0,
  savedCount: 0,
  role: 'admin',
  adminRole,
  status: 'active',
  lockReason: null,
  createdAt: vn('2026-07-01 09:00'),
  onboardedAt: vn('2026-07-01 09:00'),
});

const staffProfiles: Profile[] = [
  staff('00000000-0000-4000-8000-0000000000a2', 'Đức Thịnh', 'ops', '+84327878902', 'DUCT6W'),
  staff('00000000-0000-4000-8000-0000000000a3', 'Thanh Tâm', 'accounting', '+84327878903', 'THANT3J'),
  staff('00000000-0000-4000-8000-0000000000a4', 'Ngọc Hân', 'support', '+84327878904', 'NGOCH7E'),
  staff('00000000-0000-4000-8000-0000000000a5', 'Bảo Long', 'support', '+84327878905', 'BAOL4Z'),
].filter((p) => !adminSeed.profiles?.some((x) => x.id === p.id));

/* ───────────── Yêu cầu hỗ trợ (#1038–#1042) ───────────── */

const tickets: SupportTicket[] = (
  [
  { id: 'st-1042', requesterName: 'Minh Anh', requesterKind: 'user', topic: 'code', subject: 'Mã FREGO20 báo hết hạn khi nhập', status: 'open', dueAt: null, createdAt: vn('2026-11-22 17:35') },
  { id: 'st-1041', requesterName: 'Tiệm trà Sen', requesterKind: 'business', topic: 'billing', subject: 'Đã chuyển khoản nhưng ví chưa cộng', status: 'pending', dueAt: null, createdAt: vn('2026-11-22 16:45') },
  // Yêu cầu xóa dữ liệu: phải xong trong 30 ngày.
  { id: 'st-1040', requesterName: 'Quốc Bảo', requesterKind: 'user', topic: 'data_delete', subject: 'Xin xóa dữ liệu tài khoản', status: 'pending', dueAt: vn('2026-12-21 20:10'), createdAt: vn('2026-11-21 20:10') },
  { id: 'st-1039', requesterName: 'Phòng tập Nhịp', requesterKind: 'business', topic: 'other', subject: 'Hỏi lý do chiến dịch bị từ chối', status: 'done', dueAt: null, createdAt: vn('2026-11-21 15:20') },
  { id: 'st-1038', requesterName: 'Gia Huy', requesterKind: 'user', topic: 'points', subject: 'Báo giá không được cộng điểm', status: 'done', dueAt: null, createdAt: vn('2026-11-20 10:05') },
  ] satisfies SupportTicket[]
).filter((t) => !adminSeed.support_tickets?.some((x) => x.id === t.id));

/* ───────────── Nhật ký hôm nay (10:02 có sẵn ở seed/web-admin.ts) ───────────── */

const logs: AuditLog[] = (
  [
    { id: 'al-ops-0948', actorName: 'Kế toán', actorRole: 'accounting', action: 'Khớp nạp tiền 3.000.000đ, Quán bún Ngõ Nhỏ', createdAt: vn('2026-11-22 09:48') },
    { id: 'al-ops-0930', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Tạm khóa Thu Hà, lý do báo giá trùng', createdAt: vn('2026-11-22 09:30') },
    { id: 'al-ops-0912', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Từ chối chiến dịch Ưu đãi Giáng sinh, Cà phê Mây', createdAt: vn('2026-11-22 09:12') },
    { id: 'al-ops-0840', actorName: 'Hỗ trợ', actorRole: 'support', action: 'Xem lịch sử điểm của Gia Huy', createdAt: vn('2026-11-22 08:40') },
    { id: 'al-ops-bg-1118', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Sửa bảng giá Be xe máy TP.HCM: cập nhật theo 1.410 báo giá', createdAt: vn('2026-11-18 09:00') },
  ] satisfies AuditLog[]
).filter((l) => !adminSeed.audit_logs?.some((x) => x.id === l.id || (x.createdAt === l.createdAt && x.action === l.action)));

export const adminOpsSeed: Partial<Seed> = {
  businesses: sharedNail ? [] : [nailXinh],
  profiles: staffProfiles,

  wallet_transactions: [
    // Nạp tiền (wt-2 của Cà phê Mây 5.000.000đ chờ khớp nằm ở seed/web-business.ts).
    { id: 'wt-ops-tse-0451', businessId: 'biz-tra-sen', kind: 'topup', amount: 2000000, note: 'Nạp chuyển khoản', status: 'pending', reference: 'FREGO TSE1040-1', createdAt: vn('2026-11-21 11:02') },
    { id: 'wt-ops-bnn-0317', businessId: 'biz-bun-ngo-nho', kind: 'topup', amount: 3000000, note: 'Nạp chuyển khoản', status: 'done', reference: 'FREGO BNN1031-1', createdAt: vn('2026-11-21 09:40') },
    // Trừ ví 00:05 ngày 22/11 cho mã dùng 21/11 (wt-1 của Cà phê Mây ở seed/web-business.ts). Mỗi mã: mức giảm + phí dịch vụ.
    // Ghi chú theo quy ước của cổng doanh nghiệp: "Tiêu đề · N mã …". Tiệm nail Xinh: ví không đủ 130.000đ nên chưa trừ.
    { id: 'wt-ops-bnn-1122', businessId: 'biz-bun-ngo-nho', kind: 'deduction', amount: -182000, note: 'Mã được dùng ngày 21/11 · 14 mã Grab xe máy', status: 'done', reference: null, createdAt: vn('2026-11-22 00:05') },
    { id: 'wt-ops-tbm-1122', businessId: 'biz-banh-moc', kind: 'deduction', amount: -117000, note: 'Mã được dùng ngày 21/11 · 9 mã Be xe máy', status: 'done', reference: null, createdAt: vn('2026-11-22 00:05') },
    { id: 'wt-ops-tse-1122', businessId: 'biz-tra-sen', kind: 'deduction', amount: -91000, note: 'Mã được dùng ngày 21/11 · 7 mã Be xe máy', status: 'done', reference: null, createdAt: vn('2026-11-22 00:05') },
    { id: 'wt-ops-nxi-1122', businessId: NAIL_ID, kind: 'deduction', amount: -130000, note: 'Mã được dùng ngày 21/11 · 10 mã Grab xe máy', status: 'failed', reference: null, createdAt: vn('2026-11-22 00:05') },
  ],

  invoices: [
    // Tạm tính = đã chi tháng 11 của chiến dịch Bữa trưa phố đi bộ (220 mã × 13.000đ).
    { id: 'inv-bnn-2026-11', businessId: 'biz-bun-ngo-nho', month: '2026-11', amount: 2860000, status: 'draft', issuedAt: null },
    { id: 'inv-bnn-2026-10', businessId: 'biz-bun-ngo-nho', month: '2026-10', amount: 2418000, status: 'issued', issuedAt: vn('2026-11-01 08:00') },
  ],

  frego_codes: [
    // Mã nháp chưa phát cho ai (QT 8 · Mã Frego).
    { id: 'fc-fregomoi', code: 'FREGOMOI', kind: 'promo', providerId: 'grab', vehicleClass: 'bike', amount: 15000, title: 'Chuyến đầu', validDays: 30, quota: null, issuedCount: 0, usedCount: 0, active: false },
  ],

  support_tickets: tickets,
  // Lời người gửi và trả lời của Frego (bảng ticket_messages).
  ticket_messages: [
    { id: 'tm-1043-1', ticketId: 'st-1043', authorKind: 'requester', authorName: 'Gia Huy', body: 'Hôm qua mình báo giá chuyến Grab xe máy về Chợ Bến Thành mà chưa thấy cộng điểm.', createdAt: vn('2026-11-22 08:30') },
    { id: 'tm-1042-1', ticketId: 'st-1042', authorKind: 'requester', authorName: 'Minh Anh', body: 'Mình nhập FREGO20 trong app Be thì báo mã hết hạn, nhưng trong Ví Frego vẫn còn hạn tới 30/11.', createdAt: vn('2026-11-22 17:35') },
    { id: 'tm-1041-1', ticketId: 'st-1041', authorKind: 'requester', authorName: 'Tiệm trà Sen', body: 'Sáng 21/11 tiệm đã chuyển khoản 2.000.000đ, nội dung FREGO TSE1040-1, mà ví vẫn chưa cộng.', createdAt: vn('2026-11-22 16:45') },
    { id: 'tm-1041-2', ticketId: 'st-1041', authorKind: 'admin', authorName: 'Kế toán Frego', body: 'Frego đang đối chiếu sao kê, sẽ cộng vào ví ngay khi thấy giao dịch. Tiệm gửi giúp ảnh biên lai chuyển khoản nhé.', createdAt: vn('2026-11-22 17:05') },
    { id: 'tm-1040-1', ticketId: 'st-1040', authorKind: 'requester', authorName: 'Quốc Bảo', body: 'Mình muốn xóa tài khoản Frego và toàn bộ dữ liệu.', createdAt: vn('2026-11-21 20:10') },
    { id: 'tm-1039-1', ticketId: 'st-1039', authorKind: 'requester', authorName: 'Phòng tập Nhịp', body: 'Chiến dịch Tập sáng bị từ chối, cho mình hỏi lý do cụ thể.', createdAt: vn('2026-11-21 15:20') },
    { id: 'tm-1039-2', ticketId: 'st-1039', authorKind: 'admin', authorName: 'Vận hành Frego', body: 'Ảnh chiến dịch có số điện thoại nên chưa duyệt được. Bạn đổi ảnh khác rồi gửi lại, Frego duyệt trong 1 ngày làm việc.', createdAt: vn('2026-11-21 16:02') },
    { id: 'tm-1038-1', ticketId: 'st-1038', authorKind: 'requester', authorName: 'Gia Huy', body: 'Mình nhập số tiền chuyến Be 22.000đ nhưng không được cộng điểm.', createdAt: vn('2026-11-20 10:05') },
    { id: 'tm-1038-2', ticketId: 'st-1038', authorKind: 'admin', authorName: 'Hỗ trợ Frego', body: 'Frego đã cộng 50 điểm cho chuyến này. Cảm ơn bạn đã báo.', createdAt: vn('2026-11-20 10:30') },
  ],
  audit_logs: logs,

  broadcasts: [
    // Tin đã gửi tuần này (16/11–22/11) → "Còn 1 tin tuần này".
    {
      id: 'bc-gsm-25',
      title: 'Green SM giảm 25% cả tuần',
      body: 'Green SM tự giảm 25% mọi chuyến, không cần mã, đến hết 28/02/2027.',
      audience: 'promo',
      scheduledAt: vn('2026-11-20 17:30'),
      status: 'sent',
      recipients: 1880,
      createdAt: vn('2026-11-19 10:00'),
    },
    // Bản nháp đang soạn (mở sẵn trong khung "Soạn tin ưu đãi chung").
    {
      id: 'bc-grab-cuoi-tuan',
      title: 'Grab giảm 20% cuối tuần',
      body: 'Mã GRABCUOITUAN cho GrabCar từ 100.000đ, đến hết Chủ nhật.',
      audience: 'promo',
      scheduledAt: vn('2026-11-28 17:30'),
      status: 'draft',
      recipients: 0,
      createdAt: vn('2026-11-22 16:10'),
    },
  ],
};
