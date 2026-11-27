# Frego · Spec phiên bản 1.0

Nguồn: canvas thiết kế "Frego – app voucher đặt xe công nghệ" (Claude Design, 6 trang) và tài liệu "Bộ khởi động dự án với AI". Khi định vị thay đổi, sửa file này trước, rồi mới sửa code.

## Định vị

App voucher đặt xe công nghệ: gom mã của Grab, Be, Green SM, mã ngân hàng/ví và quà nhãn hàng tặng riêng về một chỗ. **Gắn mã rồi mới so giá**, nên giá người dùng thấy là giá sau giảm. Frego không đặt xe thay người dùng: mở app hãng kèm mã. Người dùng báo giá thật để nhận điểm đổi voucher (như GasBuddy, Fetch).

Frego là ứng dụng độc lập, không thuộc Grab, Be hay Green SM.

## Vai trò

| Vai trò | Sản phẩm | Thấy gì |
| --- | --- | --- |
| Người đặt xe | App Frego (iOS, Android) | Dữ liệu của chính mình |
| Doanh nghiệp tài trợ (chủ quán, kế toán) | Cổng doanh nghiệp `/doanh-nghiep` | Quán của mình, chỉ số liệu tổng, không biết người nhận mã |
| Quản trị Frego (vận hành, kế toán, hỗ trợ) | Quản trị `/quan-tri` | Toàn hệ thống; mỗi lần xem chi tiết người dùng được ghi nhật ký |
| Khách | Landing page `/`, app ở chế độ "xem voucher trước" | Danh mục công khai |

## Phiên bản này GỒM

Bản đồ tính năng (một luồng qua ba sản phẩm):

| Tính năng | App người dùng | Cổng doanh nghiệp | Quản trị Frego |
| --- | --- | --- | --- |
| Đăng nhập, hồ sơ | 0a–0d Chào mừng, đăng nhập SĐT, mã OTP, thông tin | — | Người dùng, báo giá |
| Quyền dữ liệu | 6 Xin quyền dữ liệu, Tài khoản | Báo cáo chỉ có số liệu tổng | Hỗ trợ và nhật ký: xóa dữ liệu, nhật ký truy cập |
| Tìm điểm đến, địa điểm đã lưu | 1 Trang chủ, 1b Chọn điểm đến, Thêm địa điểm | — | Bảng giá ước tính: dữ liệu tìm kiếm ẩn danh |
| Gắn voucher cho chuyến | 2 Gắn voucher | Tạo chiến dịch | Chiến dịch, Kho mã công khai, Điểm và mã Frego |
| So giá sau voucher | 2b So giá sau voucher | — | Bảng giá ước tính |
| Mở app hãng kèm mã | 3 Mở app Be, Mở app Grab | — | Đối tác, liên kết |
| Biết khi mã được dùng | 3b Thông báo | Ví và hóa đơn: trừ tiền mỗi ngày | Tiền và đối soát |
| Báo giá thật, cộng điểm | 4 Báo giá thật, 7 Điểm thưởng | — | Người dùng, báo giá; Điểm và mã Frego |
| Voucher tặng riêng | Ví voucher, 5b Chi tiết voucher | Tạo chiến dịch, Chi tiết chiến dịch, Báo cáo | Duyệt, Chiến dịch, Doanh nghiệp |
| Mã công khai | Ví voucher, 5c Chi tiết mã | — | Kho mã công khai |
| Liên kết thẻ, ví, ứng dụng | 11 Liên kết | — | Đối tác, liên kết |
| Thông báo | 10 Thông báo, 10b Cài đặt | Hồ sơ cửa hàng: email thông báo | Thông báo |
| Nạp ví, trừ tiền, hóa đơn | — | Ví và hóa đơn | Tiền và đối soát |
| Đăng ký, hồ sơ doanh nghiệp | — | Đăng ký, Hồ sơ cửa hàng | Duyệt, Doanh nghiệp |
| Báo mã lỗi, hỗ trợ | 5c: dùng được hay không | — | Kho mã: tự ẩn; Hỗ trợ và nhật ký |

Cộng thêm: landing page cho người đặt xe (cùng màu, font, thành phần với app), trang Chính sách dữ liệu và Điều khoản (bản nháp).

## ĐỂ SAU

- Đặt xe ngay trong Frego cho Be và Green SM, khi có hợp đồng API.
- Tab Ăn uống, Lưu trú trên trang chủ app.
- Bản đồ nhiệt cho tài xế, dùng dữ liệu tìm kiếm ẩn danh.
- Hà Nội và các thành phố khác trong bảng giá ước tính.
- Tích hợp thật với hãng xe (webhook mã đã dùng), ngân hàng, ví; đọc biên nhận Gmail; tự nạp ví bằng thẻ.

## Quy tắc nghiệp vụ

- **Gắn mã**: mỗi hãng + loại xe tối đa 1 mã mỗi chuyến. Frego tự gắn mã giảm nhiều nhất; hòa thì mã hết hạn sớm hơn, rồi mã Frego trước. Gắn theo số tiền người dùng được giảm, không theo tiền tài trợ. Mã không đủ điều kiện ghi rõ lý do.
- **Giá ước tính** (`packages/core/src/pricing.ts`): E = giá mở cửa + mỗi km sau 2 km + mỗi phút. Khoảng giá: thấp = E làm tròn xuống nghìn; cao = E × hệ số cao điểm (07:00–09:00, 16:30–19:30) hoặc ×1,05. Chỉ bật khi đủ 30 báo giá mỗi khu vực. Giá sau voucher trừ đúng số tiền của mã.
- **Ưu đãi chiến dịch**: đặt điểm đến trong vùng quanh quán (bán kính 300 m–1 km), đúng khung giờ → được tặng mã riêng khi mở app hãng. Voucher tặng riêng (chủ động gửi) chỉ khi người dùng bật "Voucher tặng riêng".
- **Tiền doanh nghiệp**: nạp trước; mỗi mã được dùng trừ giá trị giảm + 3.000đ phí dịch vụ (số mẫu, cần chốt), trừ 00:05 mỗi ngày cho mã hôm trước. Ví hết thì chiến dịch tự dừng. Mã tặng mà không dùng không mất tiền.
- **Duyệt**: chiến dịch, doanh nghiệp mới phải được Frego duyệt (mục tiêu 1 ngày làm việc). Đổi ngân sách không cần duyệt lại; đổi hãng, mức giảm, vùng, ảnh hoặc địa chỉ quán thì duyệt lại.
- **Điểm**: báo giá một chạm +10, nhập số tiền +50, biên nhận email +50, nơi chưa có dữ liệu ×2. Điểm không đổi ra tiền mặt. Quà: Be xe máy −10.000đ (500 điểm), Green SM −15.000đ (1.000), Grab ô tô −20.000đ (1.500).
- **Mã công khai**: luôn ghi nguồn và giờ kiểm tra; ≥ 10 lượt báo "không dùng được" trong 24 giờ → tự ẩn.
- **Thông báo**: giờ yên lặng 22:00–7:00; tin ưu đãi chung tối đa 2 tin/tuần, mặc định tắt.
- **Quyền dữ liệu**: vị trí khi dùng app (bật), góp dữ liệu ẩn danh (tắt), voucher tặng riêng (tắt). Yêu cầu xóa dữ liệu xong trong 30 ngày.

## Tiêu chí "xong" của phiên bản này

- [x] Dữ liệu mẫu tái tạo đúng số trong thiết kế (test `packages/core/test/user-flow.test.ts`).
- [x] RLS bật trên mọi bảng; test từng vai trò: người dùng, chủ quán, quản trị, khách (`pnpm db:test`).
- [ ] 24 màn app, 21 màn web, landing page giống thiết kế (so ảnh chụp).
- [ ] Chạy được trên Supabase thật: OTP SMS, đăng nhập email cho doanh nghiệp/quản trị.
- [ ] Analytics + UTM + sự kiện chuyển đổi chính (so giá → mở app hãng → báo giá).
- [ ] Thử trong trình duyệt Zalo, Facebook, Safari iOS, Chrome Android.
- [ ] Pháp chế duyệt Chính sách dữ liệu, Điều khoản.

## Số liệu mẫu cần chốt

Phí dịch vụ 3.000đ mỗi mã; quà chào mừng FREGO10; link App Store, Google Play, mã QR; màu, logo, tên các quán (đang là tạm).
