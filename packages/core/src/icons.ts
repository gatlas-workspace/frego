/**
 * Bộ icon nét 1,8 dùng chung cho app và web (lấy từ "Nền tảng: màu, chữ, bo góc, icon").
 * Mỗi icon là danh sách phần tử SVG trên khung 24×24, vẽ bằng stroke, không fill.
 * App (react-native-svg) và web (<svg>) tự render từ dữ liệu này.
 */
export type IconShape =
  | { kind: 'path'; d: string; dash?: string }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number };

const p = (d: string, dash?: string): IconShape => ({ kind: 'path', d, dash });
const c = (cx: number, cy: number, r: number): IconShape => ({ kind: 'circle', cx, cy, r });
const r = (x: number, y: number, width: number, height: number, rx?: number): IconShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

export const icons = {
  /** Vị trí */
  pin: [p('M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z'), c(12, 10, 2.4)],
  /** Điểm đến đúng */
  pinok: [p('M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z'), p('m9.4 10 1.8 1.8 3.4-3.5')],
  /** Mũi tên phải */
  chev: [p('m10 6.5 5.5 5.5-5.5 5.5')],
  /** Quay lại */
  back: [p('M14.5 6 8.5 12l6 6')],
  home: [p('M4.5 11 12 4.8l7.5 6.2'), p('M6.5 9.6V19h11V9.6')],
  /** Công ty */
  brief: [
    r(4, 7.5, 16, 11.5, 2),
    p('M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5'),
    p('M4 12.5h16'),
  ],
  plus: [p('M12 5.5v13M5.5 12h13')],
  /** Thu nhỏ (bản đồ) */
  minus: [p('M5.5 12h13')],
  /** Về vị trí / canh lại bản đồ */
  locate: [c(12, 12, 6.5), c(12, 12, 2), p('M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3')],
  clock: [c(12, 12, 8), p('M12 7.8V12l3 1.8')],
  /** Voucher */
  ticket: [p('M4 7h16v3.2a1.8 1.8 0 0 0 0 3.6V17H4v-3.2a1.8 1.8 0 0 0 0-3.6Z'), p('M14.5 7.5v9', '1.6 2.2')],
  /** Thông báo */
  bell: [p('M6 10a6 6 0 0 1 12 0c0 5.5 2 7.5 2 7.5H4s2-2 2-7.5Z'), p('M10 19.5a2 2 0 0 0 4 0')],
  /** Tài khoản */
  user: [c(12, 8.5, 3.5), p('M5 19.5a7 7 0 0 1 14 0')],
  /** Xóa */
  x: [p('M7 7l10 10M17 7 7 17')],
  /** Đóng */
  close: [p('M6.5 6.5l11 11M17.5 6.5l-11 11')],
  map: [p('M9 5 3.5 7v12L9 17l6 2 5.5-2V5L15 7Z'), p('M9 5v12M15 7v12')],
  /** Xong */
  check: [p('m5.5 12.5 4 4 9-9.5')],
  /** Gợi ý */
  spark: [p('M12 4l1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7-4.7-1.8 4.7-1.8Z')],
  /** Cộng điểm */
  sparkplus: [p('M12 4l1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7-4.7-1.8 4.7-1.8Z'), p('M18.5 16.5v3M17 18h3')],
  /** Chép */
  copy: [r(8.5, 8.5, 10.5, 10.5, 2), p('M5 15.5V6a1 1 0 0 1 1-1h9.5')],
  /** Mở ngoài */
  external: [
    p('M13.5 5H19v5.5'),
    p('M19 5l-8 8'),
    p('M17 13.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4.5'),
  ],
  /** Rẻ hơn */
  cheaper: [p('M3.5 7.5l6 6 4-4 7 7'), p('M20.5 11.5v5h-5')],
  /** Đắt hơn */
  pricier: [p('M3.5 16.5l6-6 4 4 7-7'), p('M15.5 7.5h5v5')],
  /** Đúng khoảng */
  range: [p('M5 9.6c2.3-2.1 4.6-2.1 7 0s4.7 2.1 7 0'), p('M5 15.4c2.3-2.1 4.6-2.1 7 0s4.7 2.1 7 0')],
  /** Báo cáo */
  chart: [p('M4 20h16'), p('M7 16v-5M12 16V7M17 16v-8')],
  /** Ví */
  wallet: [
    p('M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3'),
    p('M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5Z'),
    c(16, 13.5, 1.1),
  ],
  mail: [r(3.5, 5.5, 17, 13, 2), p('m4.5 7 7.5 6 7.5-6')],
  /** Thẻ */
  card: [r(3.5, 6, 17, 12, 2), p('M3.5 10h17')],
  /** Thẻ mới */
  card2: [r(3.5, 6, 17, 12, 2), p('M3.5 10h17'), p('M7 14.5h3')],
  /** Nguồn web */
  globe: [
    c(12, 12, 8.5),
    p('M3.5 12h17'),
    p('M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5Z'),
  ],
  /** Liên kết */
  link: [p('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1'), p('M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1')],
  /** Quyền dữ liệu */
  shield: [p('M12 3.5 5 6.5v5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9v-5Z'), p('m9 12 2 2 4-4.5')],
  /** Cài đặt */
  sliders: [p('M4 7h9M17 7h3M4 17h3M11 17h9'), c(15, 7, 2), c(9, 17, 2)],
  /** Biên nhận */
  receipt: [p('M6.5 3.5h11v17l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.3-1.5Z'), p('M9.5 8.5h5M9.5 12h5')],
  /** Quà */
  gift: [
    p('M4.5 10.5h15v9h-15Z'),
    p('M3.5 7.5h17v3h-17Z'),
    p('M12 7.5v12'),
    p('M12 7.5C10.5 4.5 7 4 7 6.3 7 8 10 7.5 12 7.5Zm0 0c1.5-3 5-3.5 5-1.2 0 1.7-3 1.2-5 1.2Z'),
  ],
  /** Khuyến mãi */
  tag: [p('M4 12.5V5.5A1.5 1.5 0 0 1 5.5 4h7l7.5 7.5-8 8Z'), c(8.5, 8.5, 1.5)],
  /** So giá */
  compare: [p('M8 5v14M5 8l3-3 3 3M16 19V5M13 16l3 3 3-3')],
  /** Ảnh */
  camera: [
    p('M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.4-2h5.8l1.4 2h2.2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z'),
    c(12, 12.8, 3.3),
  ],
  search: [c(11, 11, 6.5), p('m16 16 4.5 4.5')],
  /** Cà phê */
  cup: [
    p('M8.5 9.5h7a2 2 0 0 0 .2-4 2.8 2.8 0 0 0-5.3-.8A2.4 2.4 0 0 0 8.5 9.5Z'),
    p('M6.5 12.5h10V15a5 5 0 0 1-10 0Z'),
    p('M16.5 13.5h1.2a1.9 1.9 0 0 1 0 3.8h-1.6'),
  ],
  /** Nhà sách */
  book: [
    p('M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5Z'),
    p('M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3'),
    p('M9 8h6'),
  ],
  /** Phòng tập */
  gym: [p('M6.5 8v8M17.5 8v8M4 10v4M20 10v4M6.5 12h11')],
  /** Tiệm bánh */
  cake: [
    p('M5 20h14v-6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2Z'),
    p('M5 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 5 0'),
    p('M12 12V8.5'),
    p('M12 5.5v.5'),
  ],
  /** Quán bún */
  bowl: [p('M4.5 12.5h15a7.5 7.5 0 0 1-15 0Z'), p('m9.5 12.5 1.6-7.5M13.5 12.5l2.3-7')],
  /** Tiệm trà */
  lotus: [
    p('M12 5.5c2.2 2.6 2.2 6.2 0 8.8-2.2-2.6-2.2-6.2 0-8.8Z'),
    p('M5 9.5c3.2.2 5.6 2 7 4.8-3.2.4-6-1.3-7-4.8Z'),
    p('M19 9.5c-3.2.2-5.6 2-7 4.8 3.2.4 6-1.3 7-4.8Z'),
    p('M7 18h10'),
  ],
  /** Thông tin */
  info: [c(12, 12, 8.5), p('M12 11v5'), p('M12 8h.01')],
  /** Tải về (web) */
  download: [p('M12 4.5v10'), p('m7.5 10.5 4.5 4.5 4.5-4.5'), p('M5 19.5h14')],
} satisfies Record<string, IconShape[]>;

export type IconName = keyof typeof icons;

/** Ngành của cửa hàng → icon ô vuông trên vé voucher. */
export const categoryIcon = {
  cafe: 'cup',
  book: 'book',
  gym: 'gym',
  cake: 'cake',
  bowl: 'bowl',
  tea: 'lotus',
} as const satisfies Record<string, IconName>;
