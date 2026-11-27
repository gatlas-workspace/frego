# Tiến độ

Cập nhật: 27/11/2026

## Đã xong

- **App người dùng (Expo)**: đủ 24 màn bản "UI nâng cấp" + 21 thành phần UI. Luồng chính chạy thật trên dữ liệu: tìm điểm đến → tự gắn voucher → so giá sau voucher → mở app hãng kèm mã (chép mã, deep link Grab mở sẵn điểm đến) → thông báo mã đã dùng → báo giá thật → cộng điểm. Ví voucher (3 tab, lọc "Hợp thẻ, ví của tôi"), chi tiết voucher/mã, điểm thưởng (đổi quà), lịch sử, tài khoản, liên kết, thông báo, cài đặt, đăng nhập OTP, chế độ khách.
- **Web**: landing page + chính sách dữ liệu + điều khoản (bản nháp); cổng doanh nghiệp DN 0–7; quản trị QT 1–12; đăng nhập (DEMO: chọn vai trò; Supabase: email + mật khẩu).
- **packages/core**: brand, định dạng VND/ngày, icon, ước tính giá, bộ máy gắn voucher, 4 services (người dùng, doanh nghiệp, quản trị, vận hành tiền-điểm-dữ liệu), dữ liệu mẫu khớp thiết kế.
- **Supabase**: 28 bảng + 2 view công khai, RLS mọi bảng, quyền cột, 17 RPC, trigger (tạo hồ sơ, chặn chủ quán tự duyệt/tự chạy lại chiến dịch Frego đã dừng, đổi địa chỉ thì duyệt lại), seed sinh từ TypeScript.
- **Quà chào mừng FREGO20**: 20.000đ chuyến Be xe máy, 50 suất (đã chốt 27/11/2026), hết suất thì dừng phát (JS + SQL, có test).
- **Quy tắc điểm** theo thiết kế: +10 một chạm, +50 nhập số tiền (chỉ khi lệch ≤ 30% ước tính), ×2 nơi chưa có dữ liệu, tối đa 300 điểm/ngày.
- **Kiểm tra**: `pnpm test` (7 test nghiệp vụ, khớp số liệu thiết kế), `pnpm db:test` (migration + seed + RLS theo 4 vai trò + RPC), `pnpm typecheck`, eslint web, `next build`, `expo export`; chụp màn hình mọi trang web ở 1440 và 390 px, mọi màn app ở 390 × 844 (và 320 × 568) — không lỗi console, không tràn ngang.
- Tài liệu: `docs/spec.md`, `docs/decisions/0001`, `0002`, README, CLAUDE.md, CI (gitleaks, typecheck, test, test SQL, build).

## Lệch thiết kế có chủ ý (đã ghi trong báo cáo)

- Số trên web quản trị tính từ dữ liệu nên vài con số khác ảnh thiết kế (VD tổng ví doanh nghiệp, điểm đã đổi) để nhất quán giữa các trang.
- Màu nút chính web #1C78D2 (thay #2383E2) để chữ trắng đạt tương phản 4,5:1.
- Logo Grab/Be/Green SM: dùng logo thật (theo quyết định 27/11/2026) ở cả app và web (`apps/web/public/logos`).
- Thêm vài thao tác thiết kế chưa vẽ nhưng cần để dùng thật: tên chiến dịch, lưu nháp, gỡ liên kết, chi tiết chiến dịch ở quản trị, chạy/tạm dừng mã Frego.

## Đang dở / để sau

- Chưa chạy trên dự án Supabase thật (chưa có project, nhà cung cấp SMS); adapter Supabase mới kiểm tra qua seed + test SQL, chưa qua PostgREST thật.
- Tải ảnh (logo, ảnh mặt tiền, giấy phép) chưa có kho file — mới ghi nhận tên file.
- QR nạp tiền là hình minh họa; chưa có VietQR / e-invoice / PDF.
- Email (nhắc nạp ví, báo duyệt), tin đẩy hệ thống (expo-notifications), webhook "mã đã dùng" từ hãng, đọc biên nhận Gmail: chưa tích hợp.
- `CategoryKey` chưa có ngành làm đẹp (tiệm nail đang dùng tạm "tea").
- Tab phân đoạn bị cắt chữ ở màn hình 320 px; nhãn "Đã đổi" ở Điểm thưởng chỉ nhớ trong phiên.

## Bước tiếp theo

1. Tạo dự án Supabase, `supabase db push`, bật Phone OTP (eSMS/Twilio), Email, Anonymous; tạo tài khoản quản trị; điền `.env`.
2. Chạy thử luồng app trên Supabase thật (OTP, gắn mã, báo giá) và cổng web (đăng ký doanh nghiệp → duyệt → nạp ví).
3. Analytics + UTM + sự kiện chuyển đổi (so giá → mở app hãng → báo giá), Sentry.
4. Pháp chế duyệt chính sách dữ liệu, điều khoản; chốt link App Store / Google Play.
5. Thử trong trình duyệt Zalo, Facebook, Safari iOS, Chrome Android; build EAS preview.
