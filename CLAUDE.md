# Frego – hướng dẫn cho AI agent

## Sản phẩm
- Là gì: app voucher đặt xe công nghệ. Gom mã Grab, Be, Green SM và quà nhãn hàng tặng riêng; gắn mã rồi mới so giá (giá thấy là giá sau giảm); mở app hãng kèm mã; báo giá thật để nhận điểm đổi voucher. Cho ai: người đặt xe ở TP.HCM; doanh nghiệp tài trợ (quán gần điểm đến); đội vận hành Frego.
- Phiên bản này GỒM: app người dùng (24 màn bản "UI nâng cấp"), cổng doanh nghiệp (DN 0–7), quản trị (QT 1–12), landing page. ĐỂ SAU: tab Ăn uống, Lưu trú; tích hợp API đối tác (Grab/Be/Green SM, ngân hàng, ví) — hiện chỉ ghi nhận; đọc biên nhận Gmail; thanh toán thẻ tự nạp. Không tự làm phần "để sau".
- Thiết kế gốc: canvas "Frego – app voucher đặt xe công nghệ" (Claude Design). Spec: docs/spec.md. Quyết định kiến trúc: docs/decisions/.

## Cấu trúc
- apps/mobile: app người dùng (Expo SDK 58, Expo Router, `src/app`) · apps/web: Next.js 16 (landing `/`, cổng doanh nghiệp `/doanh-nghiep`, quản trị `/quan-tri`) · packages/core: nghiệp vụ dùng chung · supabase/: migration, RLS, seed
- Tên thương hiệu, màu, hotline, phí dịch vụ: CHỈ trong `packages/core/src/brand.ts`.
- Token giao diện: app `apps/mobile/src/theme/tokens.ts`; web `apps/web/src/app/globals.css` (@theme). Không viết mã màu rời.
- Dữ liệu: màn hình gọi services trong packages/core (`createUserService`, `createBusinessService`, `createAdminService`, `createAdminOpsService`) trên interface `Db`. Hai cài đặt: `createMemoryDb` (DEMO, dữ liệu mẫu `packages/core/src/seed`) và `createSupabaseDb`. Không có biến môi trường Supabase → tự chạy DEMO.
- Lệnh tin cậy (cộng điểm, phát mã, khớp tiền) là RPC: JS trong `packages/core/src/db/memory.ts` và SQL trong `supabase/migrations` — sửa một bên phải sửa bên kia.

## Lệnh
- Cài: `pnpm install` · Chạy: `pnpm dev:web`, `pnpm dev:mobile` (web của app: `pnpm --filter mobile web`) · Test: `pnpm test` (vitest trong core), `pnpm db:test` (SQL trên Postgres local) · Lint/kiểu: `pnpm typecheck`, `pnpm lint`
- Thêm thư viện cho app: `cd apps/mobile && EXPO_OFFLINE=1 npx expo install <gói>` (đúng phiên bản SDK).
- Xong mỗi task phải chạy test + typecheck và báo kết quả.

## Cách làm việc
1. Nghĩ trước khi code: nói rõ giả định; chưa chắc thì HỎI, không đoán.
2. Đơn giản trước: giải pháp nhỏ nhất chạy được, không thêm thư viện khi chưa hỏi.
3. Sửa đúng chỗ: chỉ đụng code liên quan task, không tự ý refactor chỗ khác.
4. Có tiêu chí xong: mỗi task có test hoặc bước kiểm tra cụ thể.
5. Task lớn: viết kế hoạch vào docs/plan.md, chờ duyệt rồi mới code.

## Quy tắc bắt buộc
- Giao diện tiếng Việt có dấu; font app Be Vietnam Pro, web Inter (hỗ trợ tiếng Việt).
- Tiền tệ VND ("21.000đ", khoảng "21.000–26.000đ", giảm "−20.000đ" dùng dấu U+2212), ngày dd/mm/yyyy, múi giờ Asia/Ho_Chi_Minh — dùng hàm trong `packages/core/src/format.ts`.
- Mọi bảng Supabase bật RLS; vai trò: người dùng (chỉ dữ liệu của mình), doanh nghiệp (owner/accountant của business_members, chỉ số liệu tổng, không thấy người nhận mã), quản trị (admin_role ops/accounting/support).
- Không commit .env, key, token. Không chạy migration trên production khi chưa hỏi.
- Không xóa file/dữ liệu khi chưa được yêu cầu.
- Trang web phải chạy tốt trong trình duyệt của Zalo và Facebook (không dùng API trình duyệt mới chưa phổ biến, có fallback khi không chép được vào clipboard).
- Tiếp cận: nút thật (`Pressable` có accessibilityRole/`<button>`), nhãn cho nút chỉ có icon, vùng chạm ≥ 44px, chữ đạt tương phản 4.5:1.

## Khi kết thúc phiên
- Cập nhật docs/progress.md: đã xong, đang dở, bước tiếp theo.
