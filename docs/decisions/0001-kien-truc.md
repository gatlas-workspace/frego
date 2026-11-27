# 0001 · Kiến trúc: monorepo Expo + Next.js + Supabase, lõi nghiệp vụ dùng chung

Ngày: 27/11/2026 · Trạng thái: đã chọn

## Bối cảnh

Một dev cùng AI agent. Ba sản phẩm (app người dùng, cổng doanh nghiệp, quản trị) dùng chung dữ liệu và quy tắc (gắn mã, ước tính giá, điểm). Tài liệu khởi động đề xuất: web/admin Next.js trên Vercel, Supabase (auth + RLS), app Expo/React Native dùng chung backend.

## Quyết định

- **pnpm monorepo**: `apps/mobile` (Expo SDK 58, Expo Router), `apps/web` (Next.js 16: landing `/`, `/doanh-nghiep`, `/quan-tri` trong một dự án Vercel), `packages/core`, `supabase/`.
- **packages/core** chứa toàn bộ quy tắc và chuỗi hiển thị (định dạng VND, khoảng giá, lý do mã không hợp…). Màn hình chỉ hiển thị view model từ services. Nhờ vậy app và web hiện cùng con số.
- **Interface `Db`** với hai cài đặt: `createMemoryDb` (DEMO) và `createSupabaseDb` (PostgREST + RPC). Services không biết đang chạy cài đặt nào.
- **Phân quyền ở Postgres**: RLS trên mọi bảng; quyền cột chặn người dùng tự sửa điểm, chủ quán tự sửa số dư/trạng thái duyệt; view `businesses_public`, `campaigns_public` chỉ lộ cột an toàn cho app. Lệnh nhạy cảm là hàm `security definer`.
- **Một nguồn dữ liệu mẫu**: `packages/core/src/seed` dùng cho DEMO và sinh `supabase/seed.sql`.

## Hệ quả

- Lệnh RPC có hai bản (JS cho DEMO, SQL cho Supabase) → test cả hai: `pnpm test` (vitest) và `pnpm db:test` (Postgres 16 local, giả lập `auth.uid()`).
- Landing và portal chung một app Next: một lần deploy; nếu cần tách tên miền (frego.vn, doanhnghiep.frego.vn) dùng rewrite theo host.
- Web portal dùng cookie phiên của Supabase (`@supabase/ssr`), không dùng service-role key trong luồng thường.
