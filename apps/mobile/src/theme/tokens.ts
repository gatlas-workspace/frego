/**
 * Token giao diện app Frego — hướng A "Sáng, bo mềm" (trang "Nền tảng: màu, chữ, bo góc, icon").
 * Mọi màu, cỡ chữ, bo góc, bóng đổ trong app lấy từ đây; không viết mã màu rời trong màn hình.
 */
import { brand } from '@frego/core';

export const colors = {
  /** Nền trang */
  bg: '#F4F5FA',
  /** Bề mặt thẻ */
  surface: '#FFFFFF',
  /** Nền phụ, ô nhập */
  surfaceAlt: '#F1F2F8',
  /** Rãnh tab */
  track: '#E9EBF3',
  /** Chữ chính */
  ink: '#14152B',
  /** Chữ phụ */
  ink2: '#4A4E66',
  /** Chữ mờ */
  muted: '#62677E',
  /** Đường kẻ */
  line: '#E8EAF2',
  /** Thanh kéo của tấm trượt */
  handle: '#C9CDD8',
  /** Màu chính */
  primary: brand.colors.primary,
  /** Màu chính đậm (nhấn, hover) */
  primaryDeep: brand.colors.primaryDeep,
  /** Nền màu chính nhạt */
  primarySoft: brand.colors.primarySoft,
  /** Chữ trên màu chính */
  onPrimarySoft: '#DCDBFF',
  /** Nền ưu đãi */
  deal: brand.colors.deal,
  /** Chữ ưu đãi */
  dealInk: brand.colors.dealInk,
  /** Huy hiệu số */
  badge: '#C2410C',
  /** Công tắc tắt */
  toggleOff: '#8A8FA6',
  /** Icon đồng hồ giờ cao điểm */
  amber: '#7A4B00',
  white: '#FFFFFF',
  /** Nền khung thông báo đẩy */
  pushBg: '#E9EBF3',

  /* ── Bổ sung từ trang "Thành phần UI" ── */
  /** Viền nét đứt / viền nhãn "Tài trợ" (nút dashed, ô thêm, nhãn outline) */
  dash: '#8E92A6',
  /** Vạch ngăn tiền tố trong ô nhập (+84) */
  fieldDivider: '#DADDE8',
  /** Đường răng cưa trên vé voucher */
  ticketDash: '#E8B48F',
  /** Lớp phủ tối sau tấm trượt dạng hộp thoại */
  scrim: 'rgba(20,21,43,0.50)',
  /** Thanh tiến độ trên nền màu chính (rãnh) */
  onPrimaryTrack: 'rgba(255,255,255,0.28)',
  /** Khối giữ chỗ (skeleton) sau hộp thoại */
  skeleton: '#E2E5EF',
  /** Vòng trang trí nhạt trên nền màu chính nhạt (màn chào mừng) */
  primarySoft2: '#E3E2FF',
  /** Báo giá: rẻ hơn */
  good: '#13884A',
  goodSoft: '#E3F5EA',
  /** Báo giá: đắt hơn */
  bad: '#D63A3A',
  badSoft: '#FDECEC',
  /** Vùng bán kính quanh quán trên bản đồ nhỏ */
  areaFill: 'rgba(194,65,12,0.10)',

  /** Banner trang chủ: hai vòng trang trí và thẻ nghiêng phía sau */
  bannerCircle1: '#4B49E0',
  bannerCircle2: '#5A58EA',

  /** Màu thân xe theo hãng (minh họa xe) */
  providerGrab: '#02B150',
  providerBe: '#FFD21F',
  providerGsm: '#00B8D9',
  providerOther: '#5B59E6',
  /** Chi tiết minh họa xe */
  vehicleDark: '#23263F',
  vehicleHub: '#D9DCE6',
  vehicleGlass: '#DCE3F5',
  vehicleHeadlight: '#FFD27A',
  vehicleTaillight: '#FF8A65',
  vehicleShadow: 'rgba(20,21,43,0.10)',

  /** Ô vuông ngành của quán (logo nhãn hàng) */
  catCafe: '#6B4226',
  catBook: '#2D5A88',
  catGym: '#1F6B5C',
  catCake: '#A8522A',
  catBowl: '#B4442B',
  catTea: '#2F6B4F',

  /** Bản đồ minh họa */
  mapBg: '#EEF1F6',
  mapWater: '#D3E4F7',
  mapPark: '#D9EEDF',
  mapBlock: '#E2E6EF',
} as const;

export const radius = {
  /** Thẻ */
  card: 24,
  /** Khối, ô nhập, nút */
  block: 16,
  /** Phần tử nhỏ */
  small: 12,
  /** Nhãn, viên */
  pill: 999,
  /** Tấm trượt trên bản đồ */
  sheet: 28,
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 } as const;

/** Bóng đổ (RN 0.88 hỗ trợ boxShadow dạng chuỗi CSS trên iOS, Android, web). */
export const shadow = {
  card: '0 1px 2px rgba(20,21,43,0.05), 0 12px 28px -14px rgba(41,43,120,0.28)',
  bottomBar: '0 -10px 28px -16px rgba(41,43,120,0.30)',
  sheet: '0 -10px 30px -12px rgba(20,21,43,0.25)',
  float: '0 2px 8px rgba(20,21,43,0.16)',
  /** Nút/viên trắng nổi nhẹ (Button white, Pill mặc định) */
  raised: '0 1px 2px rgba(20,21,43,0.06), 0 6px 14px -8px rgba(41,43,120,0.30)',
  /** Nút quay lại nổi trên bản đồ */
  floatButton: '0 4px 14px rgba(20,21,43,0.18)',
  /** Ô đang chọn trong tab phân đoạn */
  segment: '0 1px 3px rgba(20,21,43,0.12)',
  /** Núm công tắc */
  knob: '0 1px 3px rgba(20,21,43,0.25)',
  /** Logo hãng gắn góc ô minh họa xe */
  logoBadge: '0 2px 6px rgba(20,21,43,0.18)',
  /** Nhãn điểm đi/đến trên bản đồ */
  mapLabel: '0 4px 12px rgba(20,21,43,0.16)',
  /** Vé nghiêng trên banner */
  bannerTicket: '0 10px 22px rgba(10,10,40,0.28)',
  /** Vé minh họa ở màn chào mừng */
  illoTicket: '0 10px 22px -10px rgba(41,43,120,0.35)',
  /** Thẻ giá minh họa (nền màu chính) ở màn chào mừng */
  illoPrimary: '0 14px 26px -12px rgba(41,43,120,0.6)',
} as const;

/** Thang chữ Be Vietnam Pro (cỡ/độ đậm). */
export const type = {
  display: { fontSize: 28, weight: 800, lineHeight: 34, letterSpacing: -0.5 },
  tabTitle: { fontSize: 26, weight: 800, lineHeight: 32, letterSpacing: -0.4 },
  screenTitle: { fontSize: 20, weight: 800, lineHeight: 26, letterSpacing: -0.3 },
  section: { fontSize: 17, weight: 800, lineHeight: 22, letterSpacing: -0.2 },
  itemTitle: { fontSize: 15, weight: 700, lineHeight: 20, letterSpacing: 0 },
  body: { fontSize: 15, weight: 400, lineHeight: 22, letterSpacing: 0 },
  sub: { fontSize: 13, weight: 400, lineHeight: 19, letterSpacing: 0 },
  label: { fontSize: 12, weight: 700, lineHeight: 16, letterSpacing: 0 },
  amount: { fontSize: 17, weight: 800, lineHeight: 22, letterSpacing: -0.2 },
} as const;

export type TypeVariant = keyof typeof type;
export type FontWeight = 400 | 500 | 600 | 700 | 800;

/** Họ font theo độ đậm (React Native cần tên riêng cho mỗi độ đậm). */
export const fontFamily: Record<FontWeight, string> = {
  400: 'BeVietnamPro_400Regular',
  500: 'BeVietnamPro_500Medium',
  600: 'BeVietnamPro_600SemiBold',
  700: 'BeVietnamPro_700Bold',
  800: 'BeVietnamPro_800ExtraBold',
};

/** Vùng chạm tối thiểu. */
export const HIT = 44;

/** Khung thiết kế: 390 × 844, lề trang 20. */
export const layout = { gutter: 20, topInset: 56, headerTop: 48 } as const;
