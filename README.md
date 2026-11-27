# Frego – app voucher đặt xe công nghệ

Gom mã Grab, Be, Green SM và quà nhãn hàng tặng riêng về một chỗ. Gắn mã rồi mới so giá, mở app hãng kèm mã, báo giá thật để nhận điểm đổi voucher.

| Sản phẩm | Thư mục | Công nghệ |
| --- | --- | --- |
| App người dùng (24 màn) | `apps/mobile` | Expo SDK 58, Expo Router, React Native 0.88 |
| Landing page `/`, Cổng doanh nghiệp `/doanh-nghiep`, Quản trị `/quan-tri` | `apps/web` | Next.js 16, Tailwind CSS 4 |
| Nghiệp vụ dùng chung (giá, gắn mã, điểm, định dạng VND) | `packages/core` | TypeScript, vitest |
| Cơ sở dữ liệu, RLS, RPC | `supabase` | Postgres 16 (Supabase) |

Spec: [docs/spec.md](docs/spec.md) · Quyết định: [docs/decisions](docs/decisions) · Tiến độ: [docs/progress.md](docs/progress.md) · Quy tắc cho AI agent: [CLAUDE.md](CLAUDE.md)

## Chạy thử ngay (chế độ DEMO, không cần Supabase)

```bash
pnpm install
```

```bash
pnpm dev:web
```

Mở http://localhost:3000 (landing), http://localhost:3000/dang-nhap → chọn "Cổng doanh nghiệp · Cà phê Mây" hoặc "Quản trị Frego".

```bash
pnpm dev:mobile
```

Quét mã bằng Expo Go, hoặc bấm `w` để mở bản web. Đăng nhập: số điện thoại bất kỳ, mã OTP bất kỳ 6 số → tài khoản mẫu Minh Anh (1.250 điểm). Dữ liệu mẫu bắt đầu ở 22/11/2026 17:45 để khớp thiết kế.

## Kiểm tra

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm db:test
```

`db:test` dựng Postgres 16 tạm, chạy toàn bộ migration + seed, rồi kiểm tra RLS cho từng vai trò (khách, người dùng, chủ quán, quản trị) và các lệnh RPC.

## Nối Supabase thật

1. Tạo dự án Supabase, áp migration: `supabase link --project-ref <ref>` rồi `supabase db push`. Môi trường dev/staging có thể nạp dữ liệu mẫu: `SEED_SHIFT=now pnpm db:seed:gen` rồi chạy `supabase/seed.sql`.
2. Auth: bật Phone (OTP SMS, cần nhà cung cấp SMS) cho app; Email cho doanh nghiệp và quản trị; bật Anonymous sign-ins cho chế độ "xem voucher trước".
3. Tài khoản quản trị: đặt `profiles.role = 'admin'`, `admin_role = 'ops' | 'accounting' | 'support'` bằng SQL editor.
4. Biến môi trường (xem `.env.example`): `apps/web/.env.local` có `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `apps/mobile/.env` có `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Có biến → tự chuyển từ DEMO sang Supabase.

## Deploy

- Web: Vercel, Root Directory `apps/web`, Framework Next.js, khai báo biến môi trường như trên.
- App: EAS (`apps/mobile/eas.json`): `npx eas-cli@latest build --profile preview`.

## Cấu trúc dữ liệu

Màn hình chỉ gọi services trong `packages/core` (`createUserService`, `createBusinessService`, `createAdminService`, `createAdminOpsService`) trên interface `Db`. Hai cài đặt cùng hành vi: `createMemoryDb` (DEMO) và `createSupabaseDb`. Lệnh tin cậy (cộng điểm, phát mã, khớp tiền) có bản JS (`packages/core/src/db/memory.ts`) và bản SQL (`supabase/migrations/*_rpc.sql`).

Thông tin pháp lý: CÔNG TY TNHH GATLAS · Hotline 0327 878 987 (cấu hình ở `packages/core/src/brand.ts`).
