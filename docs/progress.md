# Tiến độ

## Đã xong
- Nền móng monorepo: packages/core (brand, định dạng VND/ngày, icon, ước tính giá, bộ máy gắn voucher, services, dữ liệu mẫu), Expo Router, Next.js 16, proxy phiên Supabase.
- Supabase: schema 28 bảng + 2 view công khai, RLS mọi bảng theo vai trò, quyền cột, 13 RPC, trigger tạo hồ sơ, seed sinh từ TypeScript, test SQL local (`pnpm db:test`).
- Test nghiệp vụ khớp số liệu thiết kế (`pnpm test`).

## Đang dở
- Thành phần UI và màn hình app/web, landing page.

## Bước tiếp theo
- Tạo dự án Supabase thật, áp migration, bật OTP SMS (cần nhà cung cấp SMS), tạo tài khoản quản trị.
- Analytics + UTM, Sentry, thử trong trình duyệt Zalo/Facebook.
