/**
 * Mọi thông tin thương hiệu nằm DUY NHẤT ở file này (theo CLAUDE.md).
 * Đổi tên, màu, hotline, phí dịch vụ… chỉ sửa ở đây.
 */
export const brand = {
  name: 'Frego',
  /** Logo chữ hai màu như thiết kế: "Fre" + "go". */
  logoParts: ['Fre', 'go'] as const,
  tagline: 'Voucher đặt xe công nghệ, gom về một chỗ',
  shortPitch:
    'Mã của Grab, Be, Green SM và quà nhãn hàng tặng riêng. Gắn mã rồi mới so giá, nên giá bạn thấy là giá sau giảm.',
  appVersion: '1.0',
  independenceNote: 'Ứng dụng độc lập, không thuộc Grab, Be hay Green SM.',
  company: {
    legalName: 'CÔNG TY TNHH GATLAS',
    hotline: '0327 878 987',
    supportEmail: 'hotro@frego.vn',
    businessEmail: 'doanhnghiep@frego.vn',
  },
  web: {
    domain: 'frego.vn',
    /** App bản web (Expo Hosting): đăng ký/đăng nhập và dùng ngay trên trình duyệt, cài được như app. */
    appUrl: 'https://frego.expo.app',
    // Chưa có link chính thức (ghi chú landing: cần chốt).
    appStoreUrl: '#tai-app',
    playStoreUrl: '#tai-app',
  },
  /**
   * Tài khoản nhận tiền nạp ví doanh nghiệp (chuyển khoản tay, khi chưa bật PayOS).
   * [ĐIỀN SỐ TÀI KHOẢN]: chủ dự án điền tên ngân hàng, số tài khoản, chủ tài khoản thật trước khi ra mắt.
   */
  bank: {
    bankName: '[ĐIỀN TÊN NGÂN HÀNG]',
    accountNumber: '[ĐIỀN SỐ TÀI KHOẢN]',
    accountName: 'CONG TY TNHH GATLAS',
    branch: '[ĐIỀN CHI NHÁNH]',
  },
  /** Số mẫu cần chốt (ghi chú thiết kế): phí dịch vụ mỗi mã được dùng. */
  serviceFeePerCode: 3000,
  /** Quà chào mừng khi đăng nhập lần đầu. */
  welcomeCode: 'FREGO20',
  welcomeAmount: 20000,
  /** Số suất quà chào mừng (phát cho người đăng nhập đầu tiên, hết suất thì dừng). */
  welcomeQuota: 50,
  /** Mỗi hãng dùng 1 mã mỗi chuyến. */
  maxCodesPerProviderPerTrip: 1,
  /** Ước tính chỉ bật khi đủ số báo giá mỗi khu vực. */
  minReportsToEnableEstimate: 30,
  /** Mã tự ẩn khi bị báo lỗi nhiều lần trong 24 giờ. */
  autoHideReportThreshold: 10,
  quietHours: { from: '22:00', to: '07:00' },
  locale: 'vi-VN',
  currency: 'VND',
  timeZone: 'Asia/Ho_Chi_Minh',
  colors: {
    /** Tím Frego: màu chính của app; trên web chỉ dùng cho logo. */
    primary: '#3D3BD4',
    primaryDeep: '#2E2CB0',
    primarySoft: '#ECEBFF',
    deal: '#FFF0E5',
    dealInk: '#9A3412',
    /** Lớp phủ tối trên ảnh bìa Trang chủ (QT 13) để chữ trắng dễ đọc. */
    coverOverlay: '#14152B',
  },
} as const;

export type Brand = typeof brand;
