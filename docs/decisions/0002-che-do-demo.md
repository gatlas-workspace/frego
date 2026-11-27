# 0002 · Chế độ DEMO khi chưa cấu hình Supabase

Ngày: 27/11/2026 · Trạng thái: đã chọn

## Bối cảnh

Cần xem và thử toàn bộ luồng ngay (người duyệt thiết kế, nhà đầu tư, tester) trước khi có dự án Supabase, nhà cung cấp SMS và hợp đồng với hãng xe.

## Quyết định

- Thiếu `EXPO_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` → app và web tự chạy DEMO trên dữ liệu mẫu trong bộ nhớ.
- Đồng hồ DEMO bắt đầu ở 22/11/2026 17:45 (giờ VN) rồi chạy tiếp, để "Hôm nay", "2 giờ trước", HSD 30/11 khớp thiết kế.
- App: OTP bất kỳ 6 số đăng nhập vào tài khoản mẫu Minh Anh; dữ liệu lưu trên máy (AsyncStorage). "Xem voucher trước, đăng nhập sau" vào chế độ khách.
- Web: trang `/dang-nhap` có hai nút vào Cổng doanh nghiệp (Cà phê Mây) hoặc Quản trị; vai trò lưu ở cookie; dữ liệu dùng chung trong tiến trình server.
- "Hãng báo mã đã dùng" được giả lập sau khi mở app hãng (thật: webhook đối tác — để sau).

## Hệ quả

- DEMO không phải bảo mật: không deploy DEMO ra môi trường có dữ liệu thật.
- Seed cho staging: `SEED_SHIFT=now pnpm db:seed:gen` dời mốc thời gian về hiện tại để chiến dịch, voucher còn hạn.
