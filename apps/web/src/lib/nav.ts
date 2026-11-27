/** Menu thanh bên (WebSidebar). key trùng với thuộc tính active trong thiết kế. */
export type BizNavKey = 'tongquan' | 'chiendich' | 'baocao' | 'vi' | 'hoso';
export type AdminNavKey =
  | 'tongquan'
  | 'duyet'
  | 'doanhnghiep'
  | 'chiendich'
  | 'tien'
  | 'nguoidung'
  | 'diem'
  | 'thongbao'
  | 'khoma'
  | 'banggia'
  | 'doitac'
  | 'hotro';

export const BIZ_NAV: { group: string; items: { key: BizNavKey; label: string; href: string; icon: string }[] }[] = [
  {
    group: 'Cửa hàng',
    items: [
      { key: 'tongquan', label: 'Tổng quan', href: '/doanh-nghiep', icon: 'home' },
      { key: 'chiendich', label: 'Chiến dịch', href: '/doanh-nghiep/chien-dich', icon: 'ticket' },
      { key: 'baocao', label: 'Báo cáo', href: '/doanh-nghiep/bao-cao', icon: 'chart' },
      { key: 'vi', label: 'Ví và hóa đơn', href: '/doanh-nghiep/vi', icon: 'wallet' },
      { key: 'hoso', label: 'Hồ sơ cửa hàng', href: '/doanh-nghiep/ho-so', icon: 'brief' },
    ],
  },
];

export const ADMIN_NAV: { group: string; items: { key: AdminNavKey; label: string; href: string; icon: string }[] }[] = [
  {
    group: 'Vận hành',
    items: [
      { key: 'tongquan', label: 'Tổng quan', href: '/quan-tri', icon: 'home' },
      { key: 'duyet', label: 'Duyệt', href: '/quan-tri/duyet', icon: 'check' },
      { key: 'doanhnghiep', label: 'Doanh nghiệp', href: '/quan-tri/doanh-nghiep', icon: 'brief' },
      { key: 'chiendich', label: 'Chiến dịch', href: '/quan-tri/chien-dich', icon: 'ticket' },
      { key: 'tien', label: 'Tiền và đối soát', href: '/quan-tri/tien', icon: 'wallet' },
      { key: 'nguoidung', label: 'Người dùng, báo giá', href: '/quan-tri/nguoi-dung', icon: 'user' },
      { key: 'diem', label: 'Điểm và mã Frego', href: '/quan-tri/diem', icon: 'sparkplus' },
      { key: 'thongbao', label: 'Thông báo', href: '/quan-tri/thong-bao', icon: 'bell' },
    ],
  },
  {
    group: 'Dữ liệu',
    items: [
      { key: 'khoma', label: 'Kho mã công khai', href: '/quan-tri/kho-ma', icon: 'tag' },
      { key: 'banggia', label: 'Bảng giá ước tính', href: '/quan-tri/bang-gia', icon: 'compare' },
      { key: 'doitac', label: 'Đối tác, liên kết', href: '/quan-tri/doi-tac', icon: 'link' },
    ],
  },
  {
    group: 'Hệ thống',
    items: [{ key: 'hotro', label: 'Hỗ trợ và nhật ký', href: '/quan-tri/ho-tro', icon: 'shield' }],
  },
];
