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
