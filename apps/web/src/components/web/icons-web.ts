import type { IconShape } from '@frego/core';

/**
 * Icon chỉ dùng trên web quản lý (lấy từ WebNenTang, WebTabs, WebTable, WebSidebar, WebTopbar).
 * Cùng quy ước với bộ icon trong @frego/core: khung 24×24, nét, không tô.
 * Không sửa packages/core: icon mới của web thêm ở đây.
 */
const p = (d: string): IconShape => ({ kind: 'path', d });
const c = (cx: number, cy: number, r: number): IconShape => ({ kind: 'circle', cx, cy, r });
const r = (x: number, y: number, width: number, height: number, rx?: number): IconShape => ({
  kind: 'rect',
  x,
  y,
  width,
  height,
  rx,
});

export const webIcons = {
  /** Lọc */
  filter: [p('M4 6.5h16M7 12h10M10 17.5h4')],
  /** Sắp xếp */
  sort: [p('M8 5v14M4.5 15.5 8 19l3.5-3.5M16 19V5M12.5 8.5 16 5l3.5 3.5')],
  /** Bảng (chế độ xem) */
  table: [r(3.5, 5, 17, 14, 2), p('M3.5 10h17M9.5 10v9')],
  /** Bảng cột (chế độ xem) */
  board: [r(3.5, 5, 5, 14, 1.5), r(10, 5, 5, 9, 1.5), r(16.5, 5, 4, 11, 1.5)],
  /** Ngày (tiêu đề cột) */
  calendar: [r(4, 5.5, 16, 14, 2), p('M4 10h16M8.5 3.5v4M15.5 3.5v4')],
  /** Trạng thái (tiêu đề cột) */
  status: [c(12, 12, 7.5), c(12, 12, 3)],
  /** Duyệt (hộp thư đến) */
  inbox: [
    p('M4 13.5 6.5 5.5h11L20 13.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z'),
    p('M4 13.5h4.5l1.2 2h4.6l1.2-2H20'),
  ],
  /** Mũi tên xuống (menu, chọn) */
  caret: [p('m7 10 5 5 5-5')],
  /** Tải về (bản web: nét dài hơn bản app) */
  downloadWeb: [p('M12 4v11'), p('m7 10 5 5 5-5'), p('M5 20h14')],
  /** Đánh dấu */
  star: [p('m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6L8.2 13.3l-4-3.7 5.4-.6Z')],
  /** Thêm thao tác */
  dots: [c(5.5, 12, 1.3), c(12, 12, 1.3), c(18.5, 12, 1.3)],
  /** Mở menu trên màn hình hẹp */
  menu: [p('M4.5 7h15M4.5 12h15M4.5 17h15')],
  /** Đăng xuất */
  logout: [p('M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10'), p('M14.5 8l4 4-4 4'), p('M18.5 12H9.5')],
} satisfies Record<string, IconShape[]>;

export type WebIconName = keyof typeof webIcons;
