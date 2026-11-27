# Hướng dẫn chạy và review Frego

Mọi thứ chạy ở chế độ **DEMO** (dữ liệu mẫu trong bộ nhớ, không cần Supabase). Đồng hồ demo bắt đầu ở **22/11/2026 17:45** để các nhãn "Hôm nay", "2 giờ trước", HSD 30/11 khớp thiết kế.

## 0. Review không cần cài gì (Expo, tài khoản gatlas.workspace)

- **Dự án trên Expo**: https://expo.dev/accounts/gatlas.workspace/projects/frego
- **App bản web** (Expo Hosting, mở trên điện thoại hoặc máy tính): https://frego--3lrl6iki63.expo.app (bản 3.0 · UI v3, 27/11/2026; nhánh `ban-3-ui-v3`) — trên máy tính bật chế độ điện thoại (F12) cho đúng khung 390 px.
- **App Android cài thử (APK)**: expo.dev → dự án frego → Builds → bản "preview" mới nhất → Install (quét mã QR bằng điện thoại Android, cho phép cài từ nguồn ngoài).
- **Expo Go (iPhone và Android)**: mở Expo Go (đăng nhập gatlas.workspace) → Projects → frego → nhánh **preview** → chọn bản mới nhất. Hoặc mở link `exp://u.expo.dev/6fc10379-54e7-47b4-a681-27e55ebacfac?channel-name=preview` trên điện thoại. Bản cập nhật 3.0: nhóm cập nhật `a6e00240-5fe7-483a-b595-1cd61f52ef53`. Dữ liệu demo cũ trên máy được nạp lại tự động (đổi khóa lưu sang v3).
- Bản cài riêng trên iPhone (không qua Expo Go) cần tài khoản Apple Developer (TestFlight) — chưa làm.

Đẩy bản mới lên Expo (đăng nhập `npx eas-cli@latest login` hoặc `EXPO_TOKEN` của tài khoản gatlas.workspace; thư mục làm việc không phải git repo thì thêm `EAS_NO_VCS=1` trước lệnh eas):

```bash
cd apps/mobile && npx expo export --platform web && npx eas-cli@latest deploy
```

```bash
cd apps/mobile && npx eas-cli@latest update --branch preview --environment preview --message "Mô tả thay đổi"
```

```bash
cd apps/mobile && npx eas-cli@latest build --platform android --profile preview
```

## 1. Chuẩn bị máy

| Cần | Dùng cho | Cài |
| --- | --- | --- |
| Node 22 trở lên | tất cả | nodejs.org hoặc `nvm install 22` |
| pnpm 10 | tất cả | `corepack enable` (đi kèm Node) |
| Postgres 16 | chỉ `pnpm db:test` | macOS: `brew install postgresql@16` · Ubuntu: `sudo apt install postgresql-16` |
| App Expo Go (bản mới, hỗ trợ SDK 58) | xem app trên điện thoại | App Store / Google Play |

```bash
git clone https://github.com/gatlas-workspace/frego.git
cd frego
pnpm install
```

## 2. Kiểm tra tự động (≈ 3 phút)

| Lệnh | Kiểm tra gì | Kết quả đúng |
| --- | --- | --- |
| `pnpm typecheck` | kiểu TypeScript của core, web, app | 3 dòng `typecheck: Done` |
| `pnpm test` | nghiệp vụ: số liệu khớp thiết kế, gắn mã, so giá, điểm, FREGO20 50 suất | `Tests 8 passed` |
| `pnpm lint` | eslint web, kiểm tra kiểu app | không có lỗi |
| `pnpm db:test` | migration + seed + phân quyền RLS cho khách, người dùng, chủ quán, quản trị + các RPC | `OK: migration, seed và toàn bộ test SQL đều qua.` |
| `pnpm build:web` | build production web | danh sách route, không lỗi |

`db:test` tự tìm Postgres 16; nếu cài ở chỗ khác: `PGBIN=/đường/dẫn/bin pnpm db:test`.

## 3. Review web (landing, cổng doanh nghiệp, quản trị)

```bash
pnpm dev:web
```

Mở http://localhost:3000. Thu nhỏ cửa sổ hoặc bật chế độ thiết bị di động (F12) để xem bản 390 px.

**Landing `/`**: logo Grab/Be/Green SM thật; khung điện thoại "So giá sau voucher" (Be xe máy 11.000–16.000đ, gắn FREGO20); mục Tải app ghi "dành cho 50 người đầu tiên"; câu hỏi thường gặp mở/đóng được.

**Cổng doanh nghiệp**: `/dang-nhap` → "Cổng doanh nghiệp · Cà phê Mây".

- [ ] Tổng quan: Mã đã tặng 1.240 · Mã đã dùng 386 · Đã chi 8.138.000đ · Chi phí mỗi chuyến đến 21.083đ; số dư ví 1.180.000đ.
- [ ] Chiến dịch → "Khách chiều quanh Chợ Bến Thành": bấm Tạm dừng rồi Tiếp tục chạy; Sửa ngân sách → 15.000.000 → Lưu (lịch sử ghi "Tăng ngân sách…").
- [ ] Tạo chiến dịch: đổi bán kính, hãng, mức giảm → vé xem trước và "Ước tính chi phí" đổi theo; Gửi Frego duyệt → chiến dịch nằm ở tab "Chờ duyệt".
- [ ] Ví và hóa đơn: chọn số tiền → "Tôi đã chuyển khoản" → thêm dòng chờ xác nhận.
- [ ] `/doanh-nghiep/dang-ky`: gửi hồ sơ (mở trong cửa sổ khác, không cần đăng nhập).

**Quản trị**: menu tên ở đầu thanh bên → Đăng xuất → "Quản trị Frego".

- [ ] Duyệt (số đỏ 4, cộng thêm hồ sơ/chiến dịch bạn vừa gửi): duyệt "Khai trương món mới" → số đỏ giảm; Từ chối cần nhập lý do.
- [ ] Tiền và đối soát: "Khớp giao dịch của Cà phê Mây" → "Đã cộng 5.000.000đ vào ví Cà phê Mây" (quay lại cổng doanh nghiệp: số dư tăng).
- [ ] Bảng giá ước tính → Be xe máy: đổi "Mỗi phút" 160 → 300 → ước tính thử đổi từ 31.000–36.000đ thành 33.000–39.000đ.
- [ ] Người dùng → Minh Anh: điểm 1.250; Điều chỉnh điểm; Tạm khóa / Mở khóa.
- [ ] Thông báo: sửa tiêu đề → bản xem trước tin đẩy đổi theo; Hẹn gửi.
- [ ] Điểm và mã Frego: FREGO20 −20.000đ.

Dữ liệu web dùng chung trong tiến trình server: thao tác ở cổng doanh nghiệp hiện ngay ở quản trị. Tắt rồi chạy lại `pnpm dev:web` để về dữ liệu mẫu ban đầu.

## 4. Review app người dùng

Trên trình duyệt (nhanh nhất):

```bash
pnpm --filter mobile web
```

Mở http://localhost:8081, F12 → chế độ thiết bị di động 390 × 844.

Trên điện thoại: chạy `pnpm dev:mobile`, điện thoại và máy tính cùng Wi-Fi, mở Expo Go quét mã QR.

- [ ] Chào mừng → Bắt đầu → số điện thoại bất kỳ → mã 6 số bất kỳ → lời chào kèm quà FREGO20 → Thông tin (bỏ qua được) → Quyền dữ liệu → Trang chủ.
- [ ] Trang chủ: banner "Giảm 20.000đ chuyến Be xe máy"; Tìm gần đây: Chợ Bến Thành (3 voucher), Sân bay Tân Sơn Nhất; 5 thẻ tài trợ.
- [ ] "Bạn muốn đi đâu?" → gõ "Chợ Bến" → 4 kết quả → chọn Chợ Bến Thành.
- [ ] Gắn voucher: đã gắn Cà phê Mây, FREGO20, Quán bún Ngõ Nhỏ; bấm Gắn ở Tiệm trà Sen để đổi; "Không hợp chuyến này": CHUYENXACAR, SANBAY, KLBIKE (có lý do).
- [ ] So giá: Xe máy — Be 11.000–16.000đ (gạch 31.000–36.000đ), Grab 25.000–30.000đ, Green SM chưa có giá; tab Ô tô 4 chỗ — "Trước voucher Be rẻ hơn. Sau khi gắn voucher, Grab rẻ hơn khoảng 20.000đ."
- [ ] Bấm Grab → "Mở app Grab để đặt xe", mã MAY7K2Q, Chép mã → "Đã chép"; Mở app Grab → khoảng 4 giây sau có thông báo trượt xuống → bấm → Báo giá.
- [ ] Báo giá: Đúng khoảng → "Đã cộng 10 điểm"; nhập số tiền hợp lý → "+50 điểm"; nhập số lệch quá 30% → báo không cộng điểm.
- [ ] Ví voucher: mở ở tab Mã công khai (4 mã); "Hợp thẻ, ví của tôi" ẩn KLBIKE; Tặng bạn → Cà phê Mây → mã MAY7K2Q, vùng 500 m.
- [ ] Tài khoản → Điểm thưởng: 1.250 → Đổi Be xe máy → 750; Liên kết → Liên kết KienLongBank → về Ví thấy KLBIKE "Thẻ KienLongBank của bạn".
- [ ] Thông báo: 3 chưa đọc → "Đánh dấu đã đọc hết" → số đỏ ở thanh dưới mất.
- [ ] "Xem voucher trước, đăng nhập sau" (sau khi Đăng xuất): vào được trang chủ với hồ sơ trống.

App lưu dữ liệu demo trên máy (localStorage / bộ nhớ app). Về dữ liệu ban đầu: trình duyệt → xóa dữ liệu trang localhost:8081; điện thoại → xóa dữ liệu Expo Go.

## 5. Đối chiếu thiết kế

Mở canvas thiết kế song song. Các lệch có chủ ý và phần chưa làm: `docs/progress.md`. Quy tắc nghiệp vụ: `docs/spec.md`.
