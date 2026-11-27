/**
 * Dữ liệu mẫu riêng cho web Quản trị Frego (QT 1–6). Agent/dev phụ trách quản trị sở hữu file này.
 * Mỗi bảng là danh sách dòng được NỐI THÊM vào seed chung (xem seed/index.ts).
 *
 * Quy ước để không ảnh hưởng app người dùng (test core):
 * - Doanh nghiệp thêm ở đây đều cách mọi địa điểm trong seed/base.ts hơn 2 km (hoặc chưa hoạt động).
 * - Chiến dịch đang chạy thêm ở đây giảm tối đa 8.000đ (thấp hơn mọi chiến dịch gốc, nên không chen vào "Ưu đãi" trang chủ app).
 * - Mã công khai thêm ở đây không ở trạng thái "live".
 * Tổng sau khi nối với seed gốc và seed/web-business.ts: 31 doanh nghiệp (28 hoạt động, 1 chờ duyệt, 2 tạm khóa),
 * 46 chiến dịch (38 đang chạy, 3 chờ duyệt, 2 doanh nghiệp tạm dừng, 1 Frego dừng, 2 đã kết thúc/từ chối).
 */
import type { Seed } from '../db/schema';
import type {
  AuditLog,
  Business,
  Campaign,
  CampaignEvent,
  CategoryKey,
  LinkedAccount,
  PointsEntry,
  Profile,
  ProviderId,
  PublicCode,
  Trip,
  VehicleClass,
} from '../types';
import { brand } from '../brand';
import { vn } from './base';

const GIA_HUY = '00000000-0000-4000-8000-000000000002';
const THU_HA = '00000000-0000-4000-8000-000000000003';
const QUOC_BAO = '00000000-0000-4000-8000-000000000004';
/** Người dùng mới thêm cho trang Người dùng (QT 4). */
export const NGOC_LINH_ID = '00000000-0000-4000-8000-0000000a0005';

/* ───────────── Doanh nghiệp thêm ───────────── */

type BizInput = {
  id: string;
  name: string;
  category: CategoryKey;
  industry: string;
  district: string;
  address: string;
  landmark: string;
  lat: number;
  lng: number;
  wallet: number;
  joined: string;
  tax: string;
  transfer: string;
} & Partial<Business>;

const bizRow = (b: BizInput): Business => {
  const { wallet, joined, tax, transfer, ...rest } = b;
  return {
    legalName: `Hộ kinh doanh ${b.name}`,
    taxCode: tax,
    representative: '',
    openHours: { weekdays: '07:00 – 22:00', saturday: '07:00 – 22:00', sunday: '07:00 – 22:00' },
    status: 'active',
    walletBalance: wallet,
    autoTopup: { enabled: false, amount: 2000000, threshold: 500000 },
    invoiceName: `Hộ kinh doanh ${b.name}`,
    invoiceEmail: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: null,
    storefrontVerified: true,
    transferCode: transfer,
    notifyPrefs: { review: true, lowBalance: true, weekly: true },
    joinedAt: vn(joined),
    ...rest,
  } as Business;
};

const extraBusinesses: Business[] = [
  bizRow({ id: 'biz-qt-ca-phe-song', name: 'Cà phê Sông', category: 'cafe', industry: 'Ăn uống · Cà phê', district: 'Quận 7', address: 'Đường Nguyễn Lương Bằng, Phú Mỹ Hưng, Quận 7, TP.HCM', landmark: 'Phú Mỹ Hưng', lat: 10.7295, lng: 106.7185, wallet: 3200000, joined: '2026-09-18 10:00', tax: '0317100101', transfer: 'FREGO CPS1101' }),
  bizRow({ id: 'biz-qt-bun-bo-ba-ba', name: 'Bún bò Bà Ba', category: 'bowl', industry: 'Ăn uống · Quán bún', district: 'Gò Vấp', address: 'Đường Quang Trung, Gò Vấp, TP.HCM', landmark: 'chợ Gò Vấp', lat: 10.8385, lng: 106.6655, wallet: 2400000, joined: '2026-09-20 09:30', tax: '0317100102', transfer: 'FREGO BBB1102' }),
  bizRow({ id: 'biz-qt-tra-moc-lan', name: 'Trà Mộc Lan', category: 'tea', industry: 'Ăn uống · Trà', district: 'Tân Phú', address: 'Đường Tân Kỳ Tân Quý, Tân Phú, TP.HCM', landmark: 'chợ Tân Hương', lat: 10.7905, lng: 106.6285, wallet: 1900000, joined: '2026-09-25 14:00', tax: '0317100103', transfer: 'FREGO TML1103' }),
  bizRow({ id: 'biz-qt-banh-mi-que', name: 'Bánh mì Quê', category: 'cake', industry: 'Ăn uống · Tiệm bánh', district: 'Quận 10', address: 'Đường Sư Vạn Hạnh, Quận 10, TP.HCM', landmark: 'Vạn Hạnh', lat: 10.7722, lng: 106.6672, wallet: 2800000, joined: '2026-09-28 08:00', tax: '0317100104', transfer: 'FREGO BMQ1104' }),
  bizRow({ id: 'biz-qt-phong-tap-song', name: 'Phòng tập Sóng', category: 'gym', industry: 'Thể thao · Phòng tập', district: 'Thủ Đức', address: 'Đường Võ Văn Ngân, Thủ Đức, TP.HCM', landmark: 'chợ Thủ Đức', lat: 10.8505, lng: 106.7705, wallet: 4600000, joined: '2026-10-01 09:00', tax: '0317100105', transfer: 'FREGO PTS1105', legalName: 'Công ty TNHH Thể thao Sóng', invoiceName: 'Công ty TNHH Thể thao Sóng' }),
  bizRow({ id: 'biz-qt-sach-mo', name: 'Nhà sách Mở', category: 'book', industry: 'Bán lẻ · Sách, văn phòng phẩm', district: 'Quận 5', address: 'Đường Trần Hưng Đạo, Quận 5, TP.HCM', landmark: 'chợ An Đông', lat: 10.7545, lng: 106.6635, wallet: 2100000, joined: '2026-10-02 10:00', tax: '0317100106', transfer: 'FREGO NSM1106' }),
  bizRow({ id: 'biz-qt-com-tam-phuc', name: 'Cơm tấm Phúc', category: 'bowl', industry: 'Ăn uống · Cơm tấm', district: 'Quận 8', address: 'Đường Phạm Thế Hiển, Quận 8, TP.HCM', landmark: 'cầu Chữ Y', lat: 10.7405, lng: 106.6605, wallet: 1600000, joined: '2026-10-04 11:00', tax: '0317100107', transfer: 'FREGO CTP1107' }),
  bizRow({ id: 'biz-qt-ca-phe-goc-pho', name: 'Cà phê Góc Phố', category: 'cafe', industry: 'Ăn uống · Cà phê', district: 'Bình Thạnh', address: 'Đường Bình Quới, Bình Thạnh, TP.HCM', landmark: 'bán đảo Thanh Đa', lat: 10.8255, lng: 106.7325, wallet: 3500000, joined: '2026-10-06 15:00', tax: '0317100108', transfer: 'FREGO GPH1108' }),
  bizRow({ id: 'biz-qt-banh-me-lam', name: 'Tiệm bánh Mẹ Làm', category: 'cake', industry: 'Ăn uống · Tiệm bánh', district: 'Tân Bình', address: 'Đường Bàu Cát, Tân Bình, TP.HCM', landmark: 'chợ Bàu Cát', lat: 10.7925, lng: 106.6455, wallet: 2300000, joined: '2026-10-08 09:00', tax: '0317100109', transfer: 'FREGO TML1109' }),
  bizRow({ id: 'biz-qt-tra-quan-la', name: 'Trà quán Lá', category: 'tea', industry: 'Ăn uống · Trà', district: 'Quận 6', address: 'Đường Hậu Giang, Quận 6, TP.HCM', landmark: 'chợ Bình Tây', lat: 10.7485, lng: 106.6355, wallet: 1700000, joined: '2026-10-09 10:30', tax: '0317100110', transfer: 'FREGO TQL1110' }),
  bizRow({ id: 'biz-qt-yoga-an', name: 'Yoga An', category: 'gym', industry: 'Thể thao · Yoga', district: 'Quận 7', address: 'Đường Nguyễn Thị Thập, Quận 7, TP.HCM', landmark: 'Tân Hưng', lat: 10.734, lng: 106.706, wallet: 3800000, joined: '2026-10-10 08:30', tax: '0317100111', transfer: 'FREGO YGA1111' }),
  bizRow({ id: 'biz-qt-pho-ha-thanh', name: 'Phở Hà Thành', category: 'bowl', industry: 'Ăn uống · Phở', district: 'Quận 11', address: 'Đường Lạc Long Quân, Quận 11, TP.HCM', landmark: 'công viên Đầm Sen', lat: 10.7635, lng: 106.6435, wallet: 2900000, joined: '2026-10-12 07:30', tax: '0317100112', transfer: 'FREGO PHT1112' }),
  bizRow({ id: 'biz-qt-ca-phe-vuon-nha', name: 'Cà phê Vườn Nhà', category: 'cafe', industry: 'Ăn uống · Cà phê', district: 'Quận 12', address: 'Đường Tô Ký, Quận 12, TP.HCM', landmark: 'công viên phần mềm Quang Trung', lat: 10.8675, lng: 106.6545, wallet: 2200000, joined: '2026-10-13 13:00', tax: '0317100113', transfer: 'FREGO CVN1113' }),
  bizRow({ id: 'biz-qt-sach-ben-doc', name: 'Nhà sách Bến Đọc', category: 'book', industry: 'Bán lẻ · Sách, văn phòng phẩm', district: 'Thủ Đức', address: 'Đường Kha Vạn Cân, Thủ Đức, TP.HCM', landmark: 'ga Bình Thái', lat: 10.8485, lng: 106.7755, wallet: 2600000, joined: '2026-10-15 09:00', tax: '0317100114', transfer: 'FREGO BDO1114' }),
  bizRow({ id: 'biz-qt-banh-cuon-thanh', name: 'Bánh cuốn Thanh', category: 'bowl', industry: 'Ăn uống · Bánh cuốn', district: 'Bình Tân', address: 'Đường Tên Lửa, Bình Tân, TP.HCM', landmark: 'vòng xoay An Lạc', lat: 10.7655, lng: 106.6035, wallet: 1500000, joined: '2026-10-17 06:30', tax: '0317100115', transfer: 'FREGO BCT1115' }),
  bizRow({ id: 'biz-qt-tra-dao-pho', name: 'Trà Đào Phố', category: 'tea', industry: 'Ăn uống · Trà', district: 'Gò Vấp', address: 'Đường Nguyễn Văn Lượng, Gò Vấp, TP.HCM', landmark: 'công viên Làng Hoa', lat: 10.8455, lng: 106.6805, wallet: 2000000, joined: '2026-10-19 14:30', tax: '0317100116', transfer: 'FREGO TDP1116' }),
  bizRow({ id: 'biz-qt-quyen-anh-lua', name: 'CLB Quyền Anh Lửa', category: 'gym', industry: 'Thể thao · Quyền anh', district: 'Tân Phú', address: 'Đường Lũy Bán Bích, Tân Phú, TP.HCM', landmark: 'chợ Tân Phú', lat: 10.8005, lng: 106.6255, wallet: 3000000, joined: '2026-10-21 17:00', tax: '0317100117', transfer: 'FREGO QAL1117' }),
  bizRow({ id: 'biz-qt-ca-phe-loi-nho', name: 'Cà phê Lối Nhỏ', category: 'cafe', industry: 'Ăn uống · Cà phê', district: 'Thủ Đức', address: 'Đường Song Hành, An Phú, Thủ Đức, TP.HCM', landmark: 'ga metro An Phú', lat: 10.8025, lng: 106.7505, wallet: 3400000, joined: '2026-10-23 08:00', tax: '0317100118', transfer: 'FREGO LNH1118' }),
  bizRow({ id: 'biz-qt-banh-bo-sua', name: 'Tiệm bánh Bơ Sữa', category: 'cake', industry: 'Ăn uống · Tiệm bánh', district: 'Quận 7', address: 'Đường Phạm Văn Nghị, Quận 7, TP.HCM', landmark: 'hồ Bán Nguyệt', lat: 10.7255, lng: 106.7275, wallet: 2700000, joined: '2026-10-25 10:00', tax: '0317100119', transfer: 'FREGO BBS1119' }),
  bizRow({ id: 'biz-qt-com-nha-sau', name: 'Cơm nhà Sáu', category: 'bowl', industry: 'Ăn uống · Cơm', district: 'Nhà Bè', address: 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM', landmark: 'phà Bình Khánh', lat: 10.6955, lng: 106.7405, wallet: 1800000, joined: '2026-10-27 11:00', tax: '0317100120', transfer: 'FREGO CNS1120' }),
  bizRow({ id: 'biz-qt-tra-thao-moc', name: 'Trà Thảo Mộc An', category: 'tea', industry: 'Ăn uống · Trà', district: 'Hóc Môn', address: 'Đường Lê Thị Hà, Hóc Môn, TP.HCM', landmark: 'chợ Hóc Môn', lat: 10.8865, lng: 106.5925, wallet: 500000, joined: '2026-11-10 09:00', tax: '0317100121', transfer: 'FREGO TTM1121' }),
  bizRow({ id: 'biz-qt-ca-phe-sach-cham', name: 'Cà phê Sách Chậm', category: 'book', industry: 'Ăn uống · Cà phê sách', district: 'Bình Chánh', address: 'Quốc lộ 50, Bình Chánh, TP.HCM', landmark: 'chợ Bình Chánh', lat: 10.7305, lng: 106.6205, wallet: 0, joined: '2026-11-15 15:00', tax: '0317100122', transfer: 'FREGO CSC1122' }),
  // Tạm khóa
  bizRow({ id: 'biz-qt-nail-xinh', name: 'Tiệm nail Xinh', category: 'tea', industry: 'Làm đẹp · Tiệm nail', district: 'Quận 10', address: 'Đường Ba Tháng Hai, Quận 10, TP.HCM', landmark: 'Vạn Hạnh', lat: 10.7735, lng: 106.665, wallet: 120000, joined: '2026-10-05 10:00', tax: '0317100123', transfer: 'FREGO NXI1123', status: 'locked' }),
  bizRow({ id: 'biz-qt-oc-ba-tu', name: 'Quán ốc Bà Tư', category: 'bowl', industry: 'Ăn uống · Quán ốc', district: 'Quận 8', address: 'Đường Dương Bá Trạc, Quận 8, TP.HCM', landmark: 'cầu Nguyễn Văn Cừ', lat: 10.7455, lng: 106.687, wallet: 350000, joined: '2026-09-30 18:00', tax: '0317100124', transfer: 'FREGO OBT1124', status: 'locked' }),
  // Hồ sơ đăng ký mới (chờ duyệt): cửa hàng thứ hai của Nhà sách Gió, cùng mã số thuế với cửa hàng đang hoạt động.
  bizRow({
    id: 'biz-qt-sach-gio-dk',
    name: 'Nhà sách Gió',
    category: 'book',
    industry: 'Bán lẻ · Sách, văn phòng phẩm',
    district: 'Quận 3',
    address: 'Đường Võ Văn Tần, Quận 3, TP.HCM',
    landmark: 'công viên Tao Đàn',
    lat: 10.7768,
    lng: 106.6902,
    wallet: 0,
    joined: '2026-11-21 16:30',
    tax: '0318456789',
    transfer: 'FREGO NSG2108',
    legalName: 'Công ty TNHH Nhà sách Gió',
    invoiceName: 'Công ty TNHH Nhà sách Gió',
    representative: 'Trần Minh Khoa',
    contactEmail: 'cuahang2@nhasachgio.vn',
    contactPhone: '0283 ••• 215',
    storefrontVerified: false,
    status: 'pending',
  }),
];

/* ───────────── Chiến dịch thêm ───────────── */

const FEE = brand.serviceFeePerCode;

type CampInput = {
  id: string;
  businessId: string;
  name: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  amount: number;
  radiusM: number;
  budget: number;
  used: number;
  issued: number;
} & Partial<Campaign>;

const campRow = (c: CampInput): Campaign => {
  const { used, issued, ...rest } = c;
  return {
    status: 'active',
    rejectReason: null,
    hoursFrom: '07:00',
    hoursTo: '22:00',
    onlyOpenHours: true,
    dailyCap: 30,
    spent: used * (c.amount + FEE),
    issuedCount: issued,
    usedCount: used,
    startsAt: vn('2026-11-01 00:00'),
    endsAt: vn('2026-11-30 23:59'),
    imageUrl: null,
    submittedAt: vn('2026-10-29 10:00'),
    approvedAt: vn('2026-10-30 09:00'),
    createdAt: vn('2026-10-29 09:30'),
    ...rest,
  } as Campaign;
};

const extraCampaigns: Campaign[] = [
  campRow({ id: 'cp-qt-song-chieu', businessId: 'biz-qt-ca-phe-song', name: 'Chiều cuối tuần Phú Mỹ Hưng', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 600, budget: 4000000, used: 48, issued: 210 }),
  campRow({ id: 'cp-qt-song-sang', businessId: 'biz-qt-ca-phe-song', name: 'Cà phê sáng đi làm', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 500, budget: 1500000, used: 30, issued: 140 }),
  campRow({ id: 'cp-qt-bunbo-trua', businessId: 'biz-qt-bun-bo-ba-ba', name: 'Bún bò trưa Gò Vấp', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 1000, budget: 2500000, used: 62, issued: 260 }),
  campRow({ id: 'cp-qt-moclan-chieu', businessId: 'biz-qt-tra-moc-lan', name: 'Trà chiều Tân Phú', providerId: 'be', vehicleClass: 'bike', amount: 8000, radiusM: 500, budget: 1000000, used: 84, issued: 300 }),
  campRow({ id: 'cp-qt-que-sang', businessId: 'biz-qt-banh-mi-que', name: 'Bánh mì sáng', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 500, budget: 2000000, used: 55, issued: 240, hoursFrom: '06:00', hoursTo: '10:00' }),
  campRow({ id: 'cp-qt-que-trua', businessId: 'biz-qt-banh-mi-que', name: 'Ăn trưa văn phòng Quận 10', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 800, budget: 1500000, used: 25, issued: 120 }),
  campRow({ id: 'cp-qt-song-toi', businessId: 'biz-qt-phong-tap-song', name: 'Tập tối Thủ Đức', providerId: 'gsm', vehicleClass: 'car4', amount: 8000, radiusM: 800, budget: 3000000, used: 40, issued: 190, hoursFrom: '17:00', hoursTo: '21:00' }),
  campRow({ id: 'cp-qt-song-bike', businessId: 'biz-qt-phong-tap-song', name: 'Đi xe máy điện tới phòng tập', providerId: 'gsm', vehicleClass: 'bike', amount: 5000, radiusM: 600, budget: 1500000, used: 22, issued: 110 }),
  campRow({ id: 'cp-qt-mo-cuoituan', businessId: 'biz-qt-sach-mo', name: 'Đọc sách Chủ nhật', providerId: 'be', vehicleClass: 'bike', amount: 8000, radiusM: 600, budget: 2000000, used: 36, issued: 170 }),
  campRow({ id: 'cp-qt-phuc-trua', businessId: 'biz-qt-com-tam-phuc', name: 'Cơm trưa Quận 8', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 800, budget: 950000, used: 78, issued: 280, hoursFrom: '10:30', hoursTo: '14:00' }),
  campRow({ id: 'cp-qt-phuc-toi', businessId: 'biz-qt-com-tam-phuc', name: 'Cơm tối gia đình', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 800, budget: 2000000, used: 6, issued: 60 }),
  campRow({ id: 'cp-qt-gocpho-toi', businessId: 'biz-qt-ca-phe-goc-pho', name: 'Cà phê tối Thanh Đa', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 700, budget: 3000000, used: 52, issued: 230, hoursFrom: '17:00', hoursTo: '22:00' }),
  campRow({ id: 'cp-qt-gocpho-bike', businessId: 'biz-qt-ca-phe-goc-pho', name: 'Ghé quán bằng xe máy', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 700, budget: 1500000, used: 28, issued: 150 }),
  campRow({ id: 'cp-qt-melam-cuoituan', businessId: 'biz-qt-banh-me-lam', name: 'Bánh sinh nhật cuối tuần', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 800, budget: 2500000, used: 44, issued: 200 }),
  campRow({ id: 'cp-qt-la-chieu', businessId: 'biz-qt-tra-quan-la', name: 'Trà chiều Chợ Lớn', providerId: 'be', vehicleClass: 'bike', amount: 8000, radiusM: 500, budget: 1500000, used: 47, issued: 210 }),
  campRow({ id: 'cp-qt-la-toi', businessId: 'biz-qt-tra-quan-la', name: 'Trà tối cuối tuần', providerId: 'gsm', vehicleClass: 'bike', amount: 5000, radiusM: 500, budget: 1000000, used: 20, issued: 100 }),
  campRow({ id: 'cp-qt-yoga-sang', businessId: 'biz-qt-yoga-an', name: 'Yoga sáng sớm', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 800, budget: 2000000, used: 38, issued: 160, hoursFrom: '05:30', hoursTo: '08:30' }),
  campRow({ id: 'cp-qt-yoga-toi', businessId: 'biz-qt-yoga-an', name: 'Yoga sau giờ làm', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 800, budget: 2500000, used: 26, issued: 130 }),
  campRow({ id: 'cp-qt-pho-sang', businessId: 'biz-qt-pho-ha-thanh', name: 'Phở sáng', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 700, budget: 1500000, used: 10, issued: 90, hoursFrom: '06:00', hoursTo: '10:00' }),
  campRow({ id: 'cp-qt-pho-toi', businessId: 'biz-qt-pho-ha-thanh', name: 'Phở đêm', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 700, budget: 850000, used: 70, issued: 220, hoursFrom: '19:00', hoursTo: '23:00' }),
  campRow({ id: 'cp-qt-vuon-cuoituan', businessId: 'biz-qt-ca-phe-vuon-nha', name: 'Cuối tuần ở Vườn Nhà', providerId: 'gsm', vehicleClass: 'car4', amount: 8000, radiusM: 1000, budget: 2000000, used: 33, issued: 150 }),
  campRow({ id: 'cp-qt-bendoc-sv', businessId: 'biz-qt-sach-ben-doc', name: 'Sinh viên đọc sách', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 800, budget: 1500000, used: 41, issued: 190 }),
  campRow({ id: 'cp-qt-bendoc-nhom', businessId: 'biz-qt-sach-ben-doc', name: 'Đi nhóm đến nhà sách', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 800, budget: 2000000, used: 12, issued: 90 }),
  campRow({ id: 'cp-qt-thanh-sang', businessId: 'biz-qt-banh-cuon-thanh', name: 'Bánh cuốn sáng', providerId: 'be', vehicleClass: 'bike', amount: 8000, radiusM: 600, budget: 780000, used: 64, issued: 230, hoursFrom: '06:00', hoursTo: '10:00' }),
  campRow({ id: 'cp-qt-dao-chieu', businessId: 'biz-qt-tra-dao-pho', name: 'Trà đào buổi chiều', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 600, budget: 1500000, used: 46, issued: 200 }),
  campRow({ id: 'cp-qt-dao-toi', businessId: 'biz-qt-tra-dao-pho', name: 'Trà tối Gò Vấp', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 600, budget: 1000000, used: 18, issued: 100 }),
  campRow({ id: 'cp-qt-lua-toi', businessId: 'biz-qt-quyen-anh-lua', name: 'Tập tối Tân Phú', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 800, budget: 2000000, used: 35, issued: 150, hoursFrom: '17:00', hoursTo: '21:30' }),
  campRow({ id: 'cp-qt-loinho-sang', businessId: 'biz-qt-ca-phe-loi-nho', name: 'Cà phê sáng An Phú', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 500, budget: 2000000, used: 50, issued: 210 }),
  campRow({ id: 'cp-qt-loinho-nhom', businessId: 'biz-qt-ca-phe-loi-nho', name: 'Họp nhóm ở Lối Nhỏ', providerId: 'grab', vehicleClass: 'car4', amount: 8000, radiusM: 500, budget: 2000000, used: 20, issued: 110 }),
  campRow({ id: 'cp-qt-bosua-chieu', businessId: 'biz-qt-banh-bo-sua', name: 'Bánh chiều Phú Mỹ Hưng', providerId: 'be', vehicleClass: 'bike', amount: 8000, radiusM: 600, budget: 1500000, used: 43, issued: 200 }),
  campRow({ id: 'cp-qt-bosua-dat', businessId: 'biz-qt-banh-bo-sua', name: 'Đặt bánh cuối tuần', providerId: 'gsm', vehicleClass: 'car4', amount: 8000, radiusM: 600, budget: 2000000, used: 15, issued: 90 }),
  campRow({ id: 'cp-qt-sau-trua', businessId: 'biz-qt-com-nha-sau', name: 'Cơm trưa Nhà Bè', providerId: 'grab', vehicleClass: 'bike', amount: 8000, radiusM: 1000, budget: 1500000, used: 39, issued: 180 }),
  // Doanh nghiệp tự tạm dừng
  campRow({ id: 'cp-qt-sau-toi', businessId: 'biz-qt-com-nha-sau', name: 'Cơm tối công nhân', status: 'paused', providerId: 'be', vehicleClass: 'bike', amount: 5000, radiusM: 1000, budget: 1000000, used: 21, issued: 120 }),
  // Tiệm nail Xinh (tạm khóa): chiến dịch bị Frego dừng vì bị báo lỗi.
  campRow({ id: 'cp-qt-xinh-noel', businessId: 'biz-qt-nail-xinh', name: 'Ưu đãi Noel', status: 'paused', providerId: 'grab', vehicleClass: 'bike', amount: 10000, radiusM: 500, budget: 3000000, used: 41, issued: 300, endsAt: vn('2026-12-25 23:59') }),
];

const extraCampaignEvents: CampaignEvent[] = [
  { id: 'ce-qt-1', campaignId: 'cp-qt-xinh-noel', at: vn('2026-11-20 10:00'), text: 'Frego tạm dừng vì bị báo lỗi' },
  { id: 'ce-qt-2', campaignId: 'cp-qt-xinh-noel', at: vn('2026-10-30 09:00'), text: 'Frego duyệt, bắt đầu chạy từ 01/11' },
  { id: 'ce-qt-3', campaignId: 'cp-qt-sau-toi', at: vn('2026-11-18 21:00'), text: 'Doanh nghiệp tạm dừng' },
];

/* ───────────── Người dùng, báo giá ───────────── */

const ngocLinh: Profile = {
  id: NGOC_LINH_ID,
  phone: '+84903552552',
  displayName: 'Ngọc Linh',
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
  createdAt: vn('2026-11-19 20:00'),
  onboardedAt: vn('2026-11-19 20:02'),
};

const tripRow = (t: Partial<Trip> & Pick<Trip, 'id' | 'userId' | 'originLabel' | 'destPlaceId' | 'destLabel' | 'createdAt'>): Trip => ({
  originPlaceId: null,
  distanceKm: 4.2,
  durationMin: 16,
  attached: [],
  chosenService: null,
  estimateLow: null,
  estimateHigh: null,
  comparedCount: 3,
  status: 'reported',
  verdict: null,
  paidAmount: null,
  reportSource: null,
  pointsAwarded: 0,
  openedAt: null,
  codeUsedAt: null,
  reportedAt: null,
  ...t,
});

const extraTrips: Trip[] = [
  tripRow({
    id: 'trip-qt-qb-1',
    userId: QUOC_BAO,
    originLabel: 'Landmark 81',
    originPlaceId: 'landmark81',
    destPlaceId: 'ben-thanh',
    destLabel: 'Chợ Bến Thành',
    distanceKm: 5.8,
    durationMin: 20,
    chosenService: 'be-bike',
    estimateLow: 21000,
    estimateHigh: 26000,
    verdict: 'cheaper',
    reportSource: 'tap',
    pointsAwarded: 10,
    createdAt: vn('2026-11-22 17:05'),
    openedAt: vn('2026-11-22 17:06'),
    codeUsedAt: vn('2026-11-22 17:28'),
    reportedAt: vn('2026-11-22 17:32'),
  }),
  tripRow({
    id: 'trip-qt-gh-1',
    userId: GIA_HUY,
    originLabel: 'Phú Nhuận',
    destPlaceId: 'ben-thanh',
    destLabel: 'Quận 1',
    distanceKm: 4.6,
    durationMin: 17,
    chosenService: 'grab-bike',
    estimateLow: 28000,
    estimateHigh: 33000,
    verdict: 'pricier',
    reportSource: 'tap',
    pointsAwarded: 10,
    createdAt: vn('2026-11-18 19:20'),
    openedAt: vn('2026-11-18 19:21'),
    codeUsedAt: vn('2026-11-18 19:30'),
    reportedAt: vn('2026-11-18 19:45'),
  }),
  tripRow({
    id: 'trip-qt-th-1',
    userId: THU_HA,
    originLabel: 'Quận 7',
    destPlaceId: 'landmark81',
    destLabel: 'Bình Thạnh',
    distanceKm: 9.4,
    durationMin: 28,
    chosenService: 'gsm-bike',
    comparedCount: 2,
    paidAmount: 41000,
    reportSource: 'amount',
    pointsAwarded: 100,
    createdAt: vn('2026-11-18 21:03'),
    openedAt: vn('2026-11-18 21:04'),
    codeUsedAt: vn('2026-11-18 21:15'),
    reportedAt: vn('2026-11-18 21:40'),
  }),
];

const extraLedger: PointsEntry[] = [
  { id: 'pe-qt-gh-0', userId: GIA_HUY, delta: 580, reason: 'Điểm tích lũy trước đó', tripId: null, createdAt: vn('2026-11-01 00:00') },
  { id: 'pe-qt-gh-1', userId: GIA_HUY, delta: 50, reason: 'Nhập số tiền chuyến Be, trả 22.000đ', tripId: null, createdAt: vn('2026-11-10 12:30') },
  { id: 'pe-qt-gh-2', userId: GIA_HUY, delta: 10, reason: 'Báo giá một chạm, Grab xe máy', tripId: 'trip-qt-gh-1', createdAt: vn('2026-11-18 19:45') },
  { id: 'pe-qt-th-0', userId: THU_HA, delta: 2080, reason: 'Điểm tích lũy trước đó', tripId: null, createdAt: vn('2026-11-01 00:00') },
  { id: 'pe-qt-th-1', userId: THU_HA, delta: 100, reason: 'Nhập số tiền chuyến Green SM, trả 41.000đ, nhân đôi vì chưa có dữ liệu', tripId: 'trip-qt-th-1', createdAt: vn('2026-11-18 21:40') },
  { id: 'pe-qt-qb-0', userId: QUOC_BAO, delta: 300, reason: 'Điểm tích lũy trước đó', tripId: null, createdAt: vn('2026-11-01 00:00') },
  { id: 'pe-qt-qb-1', userId: QUOC_BAO, delta: 10, reason: 'Báo giá một chạm, Be xe máy', tripId: 'trip-qt-qb-1', createdAt: vn('2026-11-22 17:32') },
];

const extraLinked: LinkedAccount[] = [
  { id: 'la-qt-1', userId: GIA_HUY, partnerId: 'klb', cardType: 'debit', linkedAt: vn('2026-09-03 08:00') },
  { id: 'la-qt-2', userId: QUOC_BAO, partnerId: 'zalo', cardType: null, linkedAt: vn('2026-10-28 18:40') },
  { id: 'la-qt-3', userId: THU_HA, partnerId: 'momo', cardType: null, linkedAt: vn('2026-10-11 12:10') },
];

/* ───────────── Kho mã: mã đã hết hạn ───────────── */

const thang10: PublicCode = {
  id: 'pc-qt-thang10',
  code: 'THANG10',
  providerId: 'grab',
  vehicleClasses: ['bike'],
  title: 'Giảm 12.000đ cho GrabBike',
  amount: 12000,
  percent: null,
  maxAmount: null,
  minFare: null,
  requiresPartnerId: null,
  airportOnly: false,
  notes: ['Mọi cách thanh toán'],
  conditions: ['Chuyến GrabBike.', 'Mỗi người dùng 1 lần.'],
  sourceName: 'grab.com',
  sourceUrl: 'https://www.grab.com/vn/promo/',
  sourceTitle: 'Ưu đãi tháng 10',
  lastCheckedAt: vn('2026-11-01 08:00'),
  expiresAt: vn('2026-10-31 23:59'),
  status: 'expired',
  okReports24h: 0,
  badReports24h: 0,
  usedCount: 380,
  createdAt: vn('2026-10-01 09:00'),
};

/* ───────────── Nhật ký ───────────── */

const extraAudit: AuditLog[] = [
  { id: 'al-qt-1', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Tạm khóa Quán ốc Bà Tư, lý do giấy phép kinh doanh hết hạn', createdAt: vn('2026-11-12 10:20') },
  { id: 'al-qt-2', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Tạm khóa Tiệm nail Xinh, lý do nhiều người báo mã không dùng được', createdAt: vn('2026-11-20 10:05') },
  { id: 'al-qt-3', actorName: 'Hệ thống', actorRole: 'system', action: 'Gửi email nhắc nạp ví cho Cà phê Mây', createdAt: vn('2026-11-22 08:00') },
];

export const adminSeed: Partial<Seed> = {
  profiles: [ngocLinh],
  linked_accounts: extraLinked,
  businesses: extraBusinesses,
  campaigns: extraCampaigns,
  campaign_events: extraCampaignEvents,
  public_codes: [thang10],
  trips: extraTrips,
  points_ledger: extraLedger,
  support_tickets: [
    { id: 'st-1', requesterName: 'Gia Huy', requesterKind: 'user', topic: 'points', subject: 'Chưa được cộng điểm báo giá', status: 'open', dueAt: null, createdAt: vn('2026-11-22 08:30') },
  ],
  audit_logs: [
    { id: 'al-1', actorName: 'Vận hành Frego', actorRole: 'ops', action: 'Xem chi tiết người dùng Minh Anh', createdAt: vn('2026-11-22 10:02') },
    ...extraAudit,
  ],
  broadcasts: [],
};
