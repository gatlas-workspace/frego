# Kế hoạch: sửa lỗi ưu tiên sau đợt thử vai trò (27/11/2026)

Trạng thái: **đã làm xong 27/11/2026** (chưa chạy test SQL local, chưa thử Google/PayOS thật — xem docs/progress.md). Nguồn: đợt thử người dùng / doanh nghiệp / quản trị ngày 27/11/2026 (tóm tắt ở docs/progress.md).

## Nhóm A · Người dùng (app)

1. **Điểm đón sửa được** — ô Điểm đón ở Trang chủ và Chọn điểm đến bấm được: tìm địa chỉ (dùng lại `searchPlaces`), "Chọn trên bản đồ", "Vị trí hiện tại". `planTrip` nhận điểm đón tự do (`geo:`), không cần migration. Vị trí thật: xem câu hỏi 1.
2. **Ưu đãi tại quán không mất** — Ví có tab "Tại quán": các chuyến đã xem popup quảng cáo có banner đã duyệt, còn trong ngày → mở lại được để đưa nhân viên. Lấy từ `trips.ad_viewed_at` + `ad_banners_public` (không cần bảng mới).
3. **Tính năng chưa làm không được giả vờ chạy** — Gmail, liên kết Grab/Be/Green SM (app), tự nạp từ thẻ (cổng DN), "+50 điểm khi đọc biên nhận email" (landing): xem câu hỏi 2.
4. **Khách chưa đăng nhập không lấy được mã tài trợ** — xem câu hỏi 3.
5. **Mã tự nhập** — mã chưa biết: hiện trong danh sách "Mã bạn nhập" (chưa xác minh) và vẫn còn ô nhập để thử mã khác.
6. **Đổi điểm hỏi lại** trước khi trừ điểm; **Đăng xuất** hỏi lại.
7. **Sửa hồ sơ** từ Tài khoản (mở lại màn Thông tin); "Ngày sinh không tồn tại" báo đúng lỗi.
8. **Tìm kiếm**: từ đã gõ xong phải khớp nguyên từ, chỉ từ cuối khớp đầu từ ("nha tho duc ba" không ra Sân bay); bỏ trùng giữa địa điểm có sẵn và gợi ý bản đồ.
9. **Dữ liệu mẫu**: FREGO20 không vừa "đã dùng" vừa còn trong Ví; "Mở app" trên web thử deep link trước rồi mới tới trang tải app.

## Nhóm B · Cổng doanh nghiệp + quản trị (web)

10. **Trạng thái chiến dịch**: đã duyệt nhưng chưa tới ngày bắt đầu → "Đã duyệt · chạy từ dd/mm" (không phải "Đang chạy"), không được chọn làm chiến dịch chính.
11. **Khớp nạp tiền**: mỗi lần "Tôi đã chuyển khoản" tạo nội dung chuyển khoản riêng (VD FREGO CPM1024-2); ở quản trị mỗi dòng chờ có nút "Khớp 5.000.000đ" riêng, hỏi lại trước khi cộng, không tự nhảy sang dòng kế.
12. **Kiểm tra tự động khi duyệt**: đổi địa chỉ → không báo "Đạt: địa chỉ khớp"; ghi rõ "quay lại chờ duyệt vì đổi địa chỉ"; bỏ mâu thuẫn ảnh chiến dịch.
13. **Duyệt doanh nghiệp**: thiếu giấy phép/ảnh mặt tiền → cảnh báo + hỏi lại; hiện email, số điện thoại.
14. **Số liệu lệch**: điểm cộng tháng (186.400 vs 86.200), hóa đơn vs "Đã chi", lượt xem quảng cáo vs mã đã dùng (ghi rõ khoảng thời gian), badge Duyệt tính cả banner, Nhà sách Gió chờ duyệt mà có chiến dịch chạy, địa chỉ quản trị cập nhật theo hồ sơ.
15. **Nút chết**: Lọc/Sắp xếp, Chia sẻ/ngôi sao/… ở thanh trên, Tải PDF → ẩn hoặc làm chạy; bỏ "Z" ở tên ảnh, lỗi "Chọn ảnh banner." còn sau khi đã chọn.
16. **Nạp ví trên điện thoại**: hiện số tài khoản, tên ngân hàng, nút Chép nội dung (có dự phòng khi không chép được, cho trình duyệt Zalo/Facebook).

## Để đợt sau (đề xuất)

- Xóa tài khoản + tải dữ liệu của tôi (cần RPC + migration SQL).
- Trả lời yêu cầu hỗ trợ ở quản trị (cần bảng tin nhắn).
- Đăng ký doanh nghiệp: bước ghim bản đồ sau khi gửi.

## Kiểm tra

- Test mới trong `packages/core` cho: tìm kiếm, trạng thái chiến dịch chưa tới ngày, khớp nạp tiền theo từng dòng, điểm cộng tháng, mã tự nhập, ưu đãi tại quán, khách không lấy được mã tài trợ.
- SQL tương ứng trong `supabase/migrations` nếu đổi RPC (sửa một bên phải sửa bên kia); `pnpm db:test` chưa chạy được trên máy này (thiếu Postgres 16).
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, thử lại các luồng trên trình duyệt (app 375×812, web 1440 + 390).

## Đẩy code và bản Expo

- Thư mục này chưa phải git repo. Cách làm: clone `github.com/gatlas-workspace/frego` vào thư mục tạm, chép code hiện tại sang (theo .gitignore, không .env), commit lên **nhánh mới** `sua-loi-uu-tien`, push. Không đẩy thẳng `main`.
- Expo: máy chưa đăng nhập EAS. Bạn tự chạy `npx eas-cli login` (tài khoản gatlas.workspace) hoặc đặt biến `EXPO_TOKEN`; sau đó tôi chạy `eas update --branch preview` (Expo Go) và `eas deploy` (bản web).

## Đã chốt (27/11/2026)

- Điểm đón: **thêm `expo-location`** (web: định vị trình duyệt), vẫn sửa tay được.
- Tính năng "để sau" được **chủ dự án yêu cầu làm luôn** (thay quy định "Không tự làm phần để sau" trong CLAUDE.md cho các mục dưới):
  - **Gmail**: dựng đủ (đăng nhập Google, đọc và bóc biên nhận Grab/Be/Green SM ở máy chủ), chỉ bật khi có `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`; chưa có key → "Sắp có". Scope `gmail.readonly` cần Google thẩm định trước khi mở cho mọi người.
  - **PayOS** cho nạp ví doanh nghiệp: tạo link VietQR, webhook tự khớp tiền (kiểm chữ ký), chỉ bật khi có `PAYOS_CLIENT_ID`/`PAYOS_API_KEY`/`PAYOS_CHECKSUM_KEY`; chưa có → luồng chuyển khoản + khớp tay như cũ (đã sửa lỗi). Bỏ "tự nạp từ thẻ đã lưu" (PayOS không trừ thẻ định kỳ).
  - **Liên kết Grab/Be/Green SM** → đổi thành "Đã cài app" (chỉ ghi nhận để ưu tiên mã); biết mã đã dùng qua biên nhận Gmail hoặc người dùng báo.
- Khách chưa đăng nhập: **bắt đăng nhập** khi bấm "Nhận mã giảm giá" (vẫn so giá được). Chặn cả ở RPC SQL (tài khoản ẩn danh không phát mã).
- Phạm vi: **làm hết**, gồm xóa tài khoản + tải dữ liệu, trả lời hỗ trợ ở quản trị, bước ghim bản đồ khi đăng ký doanh nghiệp.

## Chia việc (cùng một thư mục, mỗi bên giữ file riêng)

- **App người dùng + core user** (phiên chính): mục 1, 2, 4–9, xóa tài khoản, sửa hồ sơ. Migration `20261127000900_*`.
- **Web doanh nghiệp + quản trị + PayOS** (agent): mục 10–16, trả lời hỗ trợ, ghim bản đồ khi đăng ký. Migration `20261127001000_*`.
- **Gmail + màn Liên kết** (agent): mục 3 phần Gmail và "Đã cài app". Migration `20261127001100_*`.

## Câu hỏi đã hỏi

1. Vị trí thật cho điểm đón: thêm thư viện `expo-location` hay chỉ cho sửa tay?
2. Tính năng chưa làm (Gmail, liên kết hãng, tự nạp thẻ): ẩn hẳn hay hiện "Sắp có"?
3. Khách chưa đăng nhập bấm "Nhận mã giảm giá": bắt đăng nhập hay giới hạn số mã?
4. Phạm vi đợt này: nhóm A + B như trên, hay thêm cả phần "để đợt sau"?

---

# Kế hoạch: popup quảng cáo nhà tài trợ sau khi chọn hãng ở So giá

Ngày: 27/11/2026 · Trạng thái: **đã làm xong 27/11/2026** (chưa chạy test SQL local, chưa thử Storage thật — xem docs/progress.md) — quy tắc giá so với **đầu thấp**; quán chưa có banner duyệt → **popup gọn**.

## Ý tưởng (chủ dự án, 27/11/2026)

Ở màn 2b So giá, bấm một hãng có gắn **voucher của quán tài trợ** → hiện popup quảng cáo của đúng quán đó → bấm tiếp mới sang màn Mở app hãng. Hãng không gắn voucher tài trợ (mã Frego như FREGO20, mã công khai, không mã) thì đi thẳng như hiện nay.

## Dữ liệu đang có

- Chiến dịch: `name` (tên nội bộ, VD "Xe máy cuối tuần", không phải lời quảng cáo), `image_url` (ảnh chiến dịch; phần tải ảnh lên chưa làm, mọi chiến dịch mẫu đều chưa có ảnh).
- Quán: tên, ngành, địa chỉ, giờ mở cửa, logo (chưa có), tọa độ → khoảng cách tới điểm đến.

## Đã chốt (27/11/2026)

- **Banner quảng cáo riêng**: doanh nghiệp đăng ở cổng DN, **Frego duyệt** ở quản trị (cần migration, form cổng DN, bước duyệt).
- Nút "Tiếp tục" trên popup **bấm được ngay**.
- **Đếm lượt xem quảng cáo** làm luôn (chỉ số liệu tổng cho doanh nghiệp).
- **Quy tắc mới**: mã giảm giá chỉ dùng được khi số tiền giảm **nhỏ hơn giá dự kiến** của chuyến.

## Việc cần làm

### 1. Quy tắc "mã nhỏ hơn giá dự kiến" (core)
- `ineligibleReason` (`vouchers.ts`): mã giảm số tiền cố định (và mã % có mức trần) bị loại nếu mức giảm ≥ **đầu thấp** khoảng giá dự kiến của hãng + loại xe đó. Lý do hiện ở "Không hợp chuyến này": "Grab · mã giảm 20.000đ, không nhỏ hơn giá dự kiến 12.000–14.000đ". Chưa có bảng giá (VD Green SM ở khu vực này) → không chặn, như hiện nay.
- Áp dụng cho mọi loại mã (Frego, tài trợ, công khai). Bộ tự gắn sẽ chọn mã khác hợp hơn nếu có.
- Hiện chỉ đánh giá mã trong core (SQL không kiểm tra lại) → chỉ sửa JS. Cập nhật spec "Quy tắc nghiệp vụ" + test.

### 2. Cơ sở dữ liệu (migration mới, JS `memory.ts` + SQL, có test SQL)
- Bảng `ad_banners`: `business_id`, `image_url`, `title` (≤ 40 ký tự), `body` (≤ 120 ký tự), `status` (`pending` / `approved` / `rejected` / `replaced`), `reject_reason`, `submitted_at`, `reviewed_at`, `reviewed_by`. Mỗi quán hiện **1 banner đã duyệt mới nhất**; gửi banner mới thì banner cũ vẫn chạy tới khi bản mới được duyệt.
- RLS: chủ quán / kế toán (business_members) xem & gửi banner của quán mình (chỉ được tạo `pending`, không tự duyệt); quản trị `ops` duyệt; người dùng app chỉ đọc qua view công khai `ad_banners_public` (chỉ `approved`).
- Ảnh: Supabase Storage — bucket riêng tư `ad-uploads/<business_id>/…` (chủ quán tải lên, quản trị xem), khi duyệt thì chép sang bucket công khai `ad-banners` (server action quản trị). JPG/PNG/WebP, ≤ 1 MB, gợi ý 1200×675 (16:9). DEMO: lưu ảnh dạng data URL trong bộ nhớ.
- Lượt xem: cột `trips.ad_viewed_at`, `campaigns.ad_view_count`; RPC `record_ad_view(trip_id)` (security definer): chỉ chủ chuyến, chuyến có mã của quán tài trợ, mỗi chuyến tính 1 lần. Không lưu ai xem.

### 3. Cổng doanh nghiệp
- Trang mới **Quảng cáo** (`/doanh-nghiep/quang-cao`): tải ảnh, tiêu đề, nội dung; xem trước đúng như popup trong app; gửi duyệt; thấy trạng thái (Chờ duyệt / Đang chạy / Bị từ chối + lý do).
- Báo cáo + Chi tiết chiến dịch: thêm số **Lượt xem quảng cáo**.

### 4. Quản trị
- Trang Duyệt: thêm mục **Banner quảng cáo** (xem ảnh + chữ, Duyệt / Từ chối kèm lý do), ghi nhật ký như các bước duyệt khác.

### 5. App (màn 2c, mới)
- So giá → bấm hãng → ghi chuyến, phát mã (như cũ) → nếu mã gắn ở hãng đó là **của quán tài trợ** (kể cả tặng riêng trong ví) thì hiện popup quảng cáo, ghi 1 lượt xem → "Nhận mã giảm giá" (bấm được ngay; trước đây là "Tiếp tục mở app Grab") → màn Mở app. Có nút đóng (cũng sang Mở app, không mất mã). Nhãn "Tài trợ" rõ ràng.
- Nội dung: banner đã duyệt (ảnh + tiêu đề + nội dung) + tên quán, địa chỉ, khoảng cách tới điểm đến, "Voucher −10.000đ chuyến này là quà của …".
- Hãng không gắn mã tài trợ → đi thẳng như hiện nay.

### 6. Kiểm tra
- `pnpm test`, `pnpm db:test` (cần Postgres local), `pnpm typecheck`, lint web; xem web 375×812 (app) và 1440 (cổng DN, quản trị); đóng gói Android. Cập nhật spec, progress.

## Còn cần chốt

- Quán có voucher tài trợ nhưng **chưa có banner được duyệt**: hiện popup gọn (tên quán, địa chỉ, "voucher là quà của …") hay **không hiện popup**?
- Quy tắc mới so với **đầu thấp** khoảng giá (an toàn: giá sau giảm luôn > 0) — đúng ý bạn?
- Migration chạy trên Supabase **local** và test SQL; **không** chạy lên production khi chưa hỏi.

---

# Kế hoạch: gợi ý địa chỉ khi gõ + chọn điểm đến trên bản đồ

Ngày: 27/11/2026 · Trạng thái: **đã làm xong 27/11/2026** (Goong chưa thử với key thật; xem docs/progress.md) — chọn **Goong** (bạn tạo key). Bộ tìm địa chỉ đổi được nhà cung cấp: có `EXPO_PUBLIC_GOONG_API_KEY` thì dùng Goong, chưa có thì tạm dùng Photon.

## Hiện trạng

- Ô "Bạn muốn đi đâu?" chỉ tìm trong ~11 địa điểm mẫu (`searchPlaces`), nên gõ "571 hoàng sa" thì báo không thấy.
- Nút "Chọn trên bản đồ" ở màn Tìm kiếm chỉ hiện dòng "chưa có trong bản này".

## Đã thử (27/11/2026, mạng VNPT)

| Dịch vụ | Kết quả |
| --- | --- |
| **Photon** `photon.komoot.io` (OSM, thongtincty đang dùng: Photon → Nominatim) | Vào được. Có giới hạn TP.HCM thì tìm tốt địa danh và tên đường ("Landmark 81", "Chợ Tân Định", "Bitexco", "Hoàng Sa"). **Thiếu số nhà**: "571 hoàng sa" chỉ ra đường Hoàng Sa. Đổi tọa độ thành địa chỉ (reverse) chạy tốt, VD "Hẻm 82 Lý Chính Thắng, Xuân Hòa" |
| Nominatim `nominatim.openstreetmap.org` | Không vào được (DNS VNPT chặn `*.openstreetmap.org`) |
| Goong (Việt Nam) | Chưa thử (cần key). Thường có số nhà tốt hơn OSM; tính phí theo lượt |

## Việc cần làm

1. **core `geocoding.ts`**: `createPhotonGeocoder({ baseUrl })` với `search(q, gần điểm)` (giới hạn khung TP.HCM, ưu tiên gần vị trí) và `reverse(lat, lng)`. Kết quả thành `Place` có `id = "geo:<lat>,<lng>"`, tên + địa chỉ tiếng Việt ("Hẻm 82 Lý Chính Thắng, Xuân Hòa"). Có test (fetch giả). Địa chỉ máy chủ: `EXPO_PUBLIC_GEOCODING_URL` (mặc định Photon công cộng khi thử; ra mắt: tự chạy Photon hoặc dùng Goong).
2. **Gợi ý khi gõ**: `searchPlaces` = địa điểm mẫu trước, rồi kết quả Photon (bỏ trùng), chờ người dùng ngừng gõ 300 ms và gõ từ 2 ký tự mới hỏi. Kết quả là **con đường** (không có số nhà) → mở màn chọn trên bản đồ tại đường đó để ghim đúng nhà.
3. **Màn "Chọn trên bản đồ"** (`/chon-tren-ban-do`): bản đồ toàn màn (web: Leaflet + Positron; app: react-native-maps), ghim cố định giữa màn, kéo bản đồ để đặt ghim. Dừng kéo → đổi tọa độ thành địa chỉ, hiện ở thẻ dưới đáy kèm nút "Đến đây", cùng nút về vị trí và nút +/−. Bấm "Đến đây" → lập chuyến → màn Gắn voucher.
4. **Lập chuyến tới địa chỉ tự do**: `planTrip` nhận thêm một `Place` (không chỉ id). Chuyến lưu `destPlaceId = "geo:…"` và `destLabel`, không cần migration.
5. **Tìm gần đây**: địa chỉ tự do chưa lưu vào "Tìm gần đây", vì bảng này cần địa điểm có trong `places`. Bản DEMO (JS) sửa cho giống SQL: chỉ lưu khi địa điểm có thật (quy tắc sửa một bên phải sửa bên kia).
6. **Quyền riêng tư**: thêm vào Chính sách dữ liệu một câu: chữ bạn gõ khi tìm điểm đến và điểm chọn trên bản đồ được gửi tới máy chủ tìm địa chỉ.
7. Kiểm tra: test, typecheck, web 375×812, đóng gói Android.

## Chưa làm

- "Chọn trên bản đồ" ở màn Thêm địa điểm (Nhà, Công ty): lưu địa điểm riêng cần thêm bảng hoặc migration.
- Lưu địa chỉ tự do vào "Tìm gần đây" (cần migration).

---

# Kế hoạch: nền bản đồ như thongtincty + đường đi thật

Ngày: 27/11/2026 · Trạng thái: **đã làm xong 27/11/2026** (cả A và B; **dùng số đường thật** cho km, phút và giá — xem mục cuối; chi tiết ở docs/progress.md) · Nghiên cứu: `docs/research/tim-duong.md`

## A. Màu nền bản đồ giống thongtincty

- thongtincty web dùng nền **CARTO Positron** (cần key CARTO; không có key thì ô bản đồ chỉ hiện chữ "API KEY REQUIRED"). App thongtincty dùng bản đồ mặc định của Apple/Google.
- **Web của app Frego**: dùng kiểu **Positron** của **OpenFreeMap** (cùng thiết kế Positron, dữ liệu OSM, miễn phí, không key; đã thử vào được từ mạng VNPT: style, tile vector, font, sprite). Đổi nhãn sang tên tiếng Việt (`name`), vì mặc định kiểu này ưu tiên `name_en`. Bỏ lớp lọc màu CSS hiện tại.
  - Cần 2 thư viện: `maplibre-gl` (vẽ bản đồ vector bằng WebGL) + `@maplibre/maplibre-gl-leaflet` (gắn vào Leaflet, giữ nguyên ghim, cụm, vòng tròn đã làm).
  - Máy không có WebGL → tự quay về nền OSM raster như hiện tại.
- **App iOS/Android**: giữ bản đồ mặc định Apple/Google như app thongtincty.

## B. Đường đi thật thay đường thẳng

1. `packages/core/src/routing.ts`: `createValhallaRouter({ baseUrl })` → `{ coords, km, minutes, source }`; giải mã polyline6; xe máy → chi phí `motorcycle`, ô tô 4 / 6–7 chỗ → `auto`; hết 6 giây hoặc lỗi → trả đường thẳng, `source: 'estimate'`. Có test (fetch giả).
2. Địa chỉ máy chủ trong biến môi trường `EXPO_PUBLIC_ROUTING_URL` (mặc định khi phát triển: FOSSGIS Valhalla `https://valhalla1.openstreetmap.de`). Trước khi ra mắt đổi sang Valhalla tự chạy, không sửa code.
3. App: hỏi đường một lần cho mỗi chuyến + loại xe, nhớ kết quả (react-query), không gọi lặp → đúng giới hạn 1 lượt/giây của FOSSGIS. Màn Gắn voucher: đường xe máy. Màn So giá: theo tab loại xe đang chọn.
4. Bản đồ (web + app): vẽ đường theo phố, nét liền màu chính có viền trắng (kiểu Grab). Khung nhìn ôm cả đường. Khi đang dùng đường thẳng thì vẽ nét đứt như bây giờ.
5. Quyền riêng tư: thêm vào bản nháp Chính sách dữ liệu (web) một câu: tọa độ điểm đi/đến được gửi tới máy chủ tìm đường để vẽ đường đi.
6. Kiểm tra: `pnpm test`, `pnpm typecheck`, xem trên web 375×812, đóng gói Android.

## Đã chốt thêm khi duyệt

- **Dùng số đường thật** cho dòng "x km · khoảng y phút" và giá ước tính (đường xe máy); lỗi mạng thì quay về cách cũ (đường chim bay × 1,6).

## Chưa làm

- Hướng dẫn rẽ từng bước, thời gian theo kẹt xe.

---

# Kế hoạch: bản đồ thật + quán tài trợ quanh điểm đến

Ngày: 27/11/2026 · Trạng thái: **đã làm xong 27/11/2026** (trừ thử trên máy thật; xem docs/progress.md)

Đã chốt: thêm `react-native-maps`; bản web của app dùng **Leaflet + nền OpenStreetMap**; bán kính tìm quán quanh điểm đến **1 km**. Google Maps API key cho Android: chưa có — cấu hình đọc từ biến môi trường, tạm kiểm tra trên web/iOS.

## Bối cảnh

- Màn 2 Gắn voucher và 2b So giá đang dùng `MapRoute`: hình SVG vẽ tay, không theo tọa độ thật.
- Dữ liệu đã đủ: `TripPlan.origin`, `TripPlan.dest` có lat/lng; quán (`businesses_public`) có lat/lng, địa chỉ; chiến dịch (`campaigns_public`) có `radius_m`, giờ, mức giảm, `offering`. Không cần migration.
- Đã xong (27/11): kéo/chạm thanh kéo để thu gọn tấm trượt, bản đồ giãn ra hết màn.

## Cách làm theo dự án thongtincty (đã tham khảo)

| Phần | thongtincty | Frego làm theo |
| --- | --- | --- |
| Bản đồ trong app (iOS/Android) | `react-native-maps`: Apple Maps trên iOS (không cần key), Google Maps trên Android | Giống vậy |
| Cách tách nền tảng | `MapSurface.tsx` (file duy nhất import `react-native-maps`) + `MapSurface.web.tsx` | Giống vậy |
| Bản web của app | Nền phẳng, tự chiếu tọa độ, vẽ marker lên trên (không kéo, không chụm) | Giống vậy (không thêm thư viện). Tùy chọn: Leaflet + nền OSM như web thongtincty |
| Nền bản đồ web | Leaflet + CARTO Positron (từ 23/09/2026 cần key) / OSM | Chỉ dùng nếu chọn tùy chọn Leaflet ở trên |

## Việc cần làm

1. **Thư viện** (cần bạn đồng ý): `react-native-maps` qua `EXPO_OFFLINE=1 npx expo install react-native-maps`.
   - Android cần Google Maps API key (`android.config.googleMaps.apiKey` trong app.json, đọc từ biến môi trường, không commit key). iOS dùng Apple Maps, không cần key.
2. **packages/core** — `geo.ts`: `regionFor(points, padding)` (khung nhìn ôm điểm đi, điểm đến và các quán), `projectToView` cho bản web. Có test.
3. **packages/core** — `createUserService().nearbySponsors(plan)`: quán có chiến dịch đang `offering` trong bán kính 1 km quanh điểm đến (đã chốt). Trả view model: tên, ngành (icon), địa chỉ, khoảng cách tới điểm đến ("cách điểm đến 350 m"), mức giảm ("−20.000đ Grab ô tô"), giờ tặng, vùng tặng mã (tâm + bán kính), `destInside` (điểm đến đã nằm trong vùng → mã đã được gắn). Không trả gì về người nhận mã (đúng phân quyền doanh nghiệp). Chạy trên cả `createMemoryDb` và `createSupabaseDb` (chỉ đọc view công khai, không RPC mới). Có test.
4. **apps/mobile** — `components/map/`: `MapSurface.tsx` (react-native-maps: điểm đi, điểm đến, đường nối, ghim quán, vòng tròn vùng tặng mã) + `MapSurface.web.tsx` (nền phẳng như thongtincty). `MapHeader` dùng `MapSurface` thay `MapRoute`; giữ `MapRoute` cho các màn khác đang dùng làm nền trang trí.
5. **Ghim quán**: chạm ghim → thẻ nhỏ trên bản đồ: tên, địa chỉ, mức giảm, giờ, "Điểm đến nằm trong vùng tặng mã" hoặc "Đi tới quán này". Bấm "Đi tới quán này" → lập lại chuyến với điểm đến là quán (dùng luồng chọn điểm đến hiện có). Ghim là nút thật, có nhãn đọc màn hình, vùng chạm ≥ 44px.
6. **Kiểm tra**: `pnpm test`, `pnpm typecheck`, mở bản web ở 375×812 và 320×568, thử kéo tấm trượt, chạm ghim. Trên máy thật cần dev build (EAS) hoặc Expo Go.
7. Cập nhật `docs/spec.md` (thêm tính năng vào bảng), `docs/progress.md`.

## Chưa làm trong đợt này

- **Đường đi thật theo đường phố**: cần dịch vụ chỉ đường (Goong / Google Directions / OSRM tự dựng), tốn phí hoặc phải dựng máy chủ. Đợt này vẽ đường nối thẳng giữa điểm đi và điểm đến, ghi rõ "Quãng đường ước tính".
- Tìm địa chỉ thật (geocoding) khi gõ điểm đến: thongtincty dùng Photon → Nominatim; để đợt sau.
- Bản đồ quán tài trợ toàn màn ở Trang chủ.

## Cần bạn chốt

- Đồng ý thêm `react-native-maps`? Bản web của app: nền phẳng (không thêm gì) hay Leaflet + OSM (thêm `leaflet`, `react-leaflet`)?
- Bán kính tìm quán quanh điểm đến: 1,5 km?
- Có Google Maps API key cho Android chưa (hoặc tạm chỉ kiểm tra trên iOS và web)?

# Kế hoạch: giới thiệu bạn bè (referral) — CHỜ DUYỆT

## Mục tiêu
Người dùng có mã giới thiệu riêng, chia sẻ cho bạn. Bạn tải app, đăng nhập bằng số điện thoại, nhập mã. Khi bạn mới **báo giá thật chuyến đầu tiên**, cả hai được cộng điểm; điểm dùng để đổi voucher ở màn Điểm thưởng như hiện nay (500 điểm → Be xe máy −10.000đ…).

## Tham khảo
- Xanh SM: người được giới thiệu điền mã khi đăng ký, hai bên cùng nhận quà; cấm tạo nhiều tài khoản, mua bán mã, dùng bot; hãng có quyền dừng chương trình.
- Thực hành chống gian lận: chỉ thưởng khi có hành động thật (không thưởng lúc đăng ký), có trần số lượt, giữ để kiểm tra khi bất thường.
- Pháp lý VN: chỉ **một tầng** (không thưởng cho người giới thiệu của người giới thiệu) và thưởng gắn với việc người mới thật sự dùng dịch vụ, tránh dáng dấp đa cấp (NĐ 40/2018). Thể lệ hiển thị trong app. Việc có cần thông báo khuyến mại với Sở Công Thương (NĐ 81/2018, sửa bởi NĐ 128/2024 và NĐ 239/2026) cần người phụ trách pháp lý xác nhận trước khi chạy thật.

## Quy tắc đề xuất (số nằm trong `POINTS_RULES.referral`, đổi được)
| Mục | Đề xuất |
|---|---|
| Người giới thiệu nhận | 200 điểm / bạn đạt điều kiện |
| Người mới nhận | 100 điểm khi đạt điều kiện |
| Điều kiện đạt | Lần báo giá đầu tiên được cộng điểm (một chạm, nhập số tiền hợp lệ hoặc biên nhận) trong 30 ngày kể từ khi nhập mã |
| Nhập mã khi nào | Trong 7 ngày đầu sau khi tạo tài khoản; mỗi tài khoản 1 lần, không đổi được |
| Ai được nhập | Tài khoản đăng nhập số điện thoại (khách ẩn danh không được); không tự giới thiệu; không nhập mã của người đăng ký sau mình |
| Trần | Người giới thiệu tối đa 10 lượt được thưởng mỗi tháng (giờ VN); vượt thì lượt đó "giữ lại để kiểm tra" |
| Tài khoản khóa | Không cộng; lượt chuyển "giữ lại để kiểm tra" (held) để quản trị xem ở QT 8 |
| Điểm giới thiệu | Không tính vào trần 300 điểm báo giá/ngày |

## Việc cần làm
1. **Dữ liệu** (`packages/core` + migration mới `supabase/migrations/2026112700xx_referrals.sql`)
   - `profiles.referral_code` (6–7 ký tự, bỏ ký tự dễ nhầm 0/O/1/I, duy nhất), sinh khi tạo hồ sơ; điền cho tài khoản cũ.
   - Bảng `referrals(id, referrer_id, referee_id unique, status pending|rewarded|held|expired|rejected, created_at, qualified_at, rewarded_at, note)`, bật RLS: người dùng chỉ đọc dòng mình là người giới thiệu hoặc người được giới thiệu; doanh nghiệp không thấy; quản trị ops/support đọc, ops sửa trạng thái.
   - RPC (viết cả JS trong `memory.ts` lẫn SQL): `apply_referral_code({code})`, `my_referrals()` (tên bạn che bớt: "Lan N.", trạng thái, điểm), cộng thưởng ngay trong `report_price` và nhánh biên nhận Gmail khi đây là lần báo giá được cộng điểm đầu tiên; `admin_set_referral_status` cho QT.
   - Thông báo `points` cho người giới thiệu: "Lan N. vừa hoàn tất chuyến đầu, bạn được +200 điểm".
2. **Dịch vụ** `createUserService`: `myReferral()` (mã, link, số bạn, điểm đã nhận, danh sách), `applyReferralCode(code)`; `createAdminService`: thống kê + danh sách cần kiểm tra.
3. **App** (`apps/mobile`)
   - Màn mới `gioi-thieu.tsx`: mã lớn + "Chép mã" (có phương án dự phòng khi không chép được), "Chia sẻ" bằng `Share` có sẵn của React Native (không thêm thư viện), 3 bước cách nhận thưởng, danh sách bạn với trạng thái, thể lệ ngắn.
   - Ô "Mã giới thiệu · nếu có" (ô thường, không làm nổi) ở cuối màn Thông tin (`thong-tin.tsx`) khi tạo tài khoản mới — chỉ tài khoản mới thấy, đã xác thực OTP; không hiện ở chế độ sửa từ Tài khoản (`?tu=tai-khoan`). Mở từ link `/moi/<mã>` thì điền sẵn. Mã hợp lệ vẫn được ghi nhận khi bấm "Bỏ qua, điền sau". Ai bỏ qua vẫn nhập được ở màn Giới thiệu trong 7 ngày đầu.
   - Lối vào: hàng "Giới thiệu bạn bè · +200 điểm" ở Tài khoản và mục "Cách kiếm điểm" trong Điểm thưởng.
4. **Web** (`apps/web`): trang `/moi/[ma]` hiện mã, nút chép (có dự phòng cho trình duyệt Zalo/Facebook), nút tải app; chưa làm tự điền mã sau khi cài (deferred deep link — để sau).
5. **Quản trị**: trên trang Điểm và mã (QT 8) thêm khối "Giới thiệu": số lượt tháng này, điểm đã phát, danh sách "giữ lại để kiểm tra" với nút Duyệt/Từ chối.
6. **Canvas UI v3** (tùy chọn): thêm 1 bảng "Giới thiệu bạn bè" cùng phong cách.
7. **Kiểm tra**: vitest cho apply (mã sai, tự giới thiệu, quá 7 ngày, nhập lần 2, khách ẩn danh), thưởng khi báo giá đầu (đúng một lần, cả hai bên), trần 10/tháng, tài khoản khóa, hết hạn 30 ngày, RLS; chạy `pnpm test`, `pnpm typecheck`, `pnpm lint`; thử trên web của app.

## Chưa làm trong đợt này
Tự điền mã sau khi cài từ link (cần Play Install Referrer/deep link), nhận diện thiết bị trùng, thưởng bằng tiền mặt.

## Cần bạn chốt
- Mức thưởng 200/100 điểm và điều kiện "báo giá chuyến đầu" có ổn không?
- Có vẽ thêm màn Giới thiệu trên canvas UI v3 không?

# Kế hoạch: đưa UI v3 vào code (bản 3.0) — ĐÃ DUYỆT 27/11/2026 (làm hết 6 GĐ, thưởng giới thiệu 200/100, làm luôn ảnh tại quán)

## Mục tiêu
App người dùng (`apps/mobile`) đổi sang giao diện UI v3 trên canvas (29 màn, trang "UI v3 · gọn, chuyên nghiệp"), kèm các tính năng mới đã vẽ: giới thiệu bạn bè, ảnh bìa Trang chủ đổi được ở quản trị (QT 13), Ví lần đầu, Tài khoản khách, trang mời `/moi/[ma]`. Không thêm thư viện: hiệu ứng dùng `Animated` có sẵn của React Native.

## Nguyên tắc tối ưu code
- **Token trước, màn sau:** sửa `theme/tokens.ts` theo v3 (bo góc thẻ 16, viền 1px `#E8EAF2` thay bóng đổ đậm, nền `#F5F6FA`), để phần lớn màn đổi theo mà không sửa từng chỗ.
- **Thành phần dùng chung thay vì style rời:** thêm `HeroHeader` (dải màu + ảnh bìa), `SegmentTabs` (tab có huy hiệu số), `PriceOption` (hàng giá kiểu So giá v3), `EmptyState`, `ReferralCodeField`; màn chỉ ghép thành phần.
- **Một bộ hiệu ứng nhỏ** trong `components/motion/`: `Rise` (hiện dần, có thứ tự), `SlideUp` (tấm trượt), `Pop`, `Shimmer` (một vòng lặp dùng chung cho mọi khung xương), `Fill` (thanh tiến độ), `pressScale` cho `Button`/`ListRow`. Tất cả `useNativeDriver: true`, tắt khi máy bật "giảm chuyển động" (`AccessibilityInfo`).
- **Danh sách dài dùng `FlatList`** (Thông báo, Lịch sử, Ví công khai); danh sách ngắn giữ `map`. Hàng danh sách bọc `memo`, hàm xử lý ổn định để không vẽ lại cả danh sách khi bấm.
- **Truy vấn:** giữ React Query, dùng `select` để màn chỉ nhận phần cần; ảnh bìa và mã giới thiệu cache dài (`staleTime`).
- **Tách màn quá dài** (`lien-ket.tsx` 417 dòng, `ma/[id].tsx`, `tim-kiem.tsx`) thành phần con khi đụng tới.
- Thành phần v2 không còn dùng sau khi chuyển (`Banner`, `DealRow`, `Shortcut`…) sẽ liệt kê để bạn duyệt xóa, không tự xóa.

## Giai đoạn
**GĐ 1 · Nền tảng** — token v3, bộ hiệu ứng, `HeroHeader` + `UiBannerTrangChu` (SVG Sài Gòn tím, cảnh dự phòng khi không có ảnh), `SegmentTabs`, `EmptyState`, sửa `Button`/`ListRow`/`Sheet` cho nhấn thu nhỏ và trượt lên.

**GĐ 2 · Luồng đặt xe (hàng 1–2 canvas)** — Trang chủ (ảnh bìa, lời chào + nút điểm một hàng, ưu đãi cuộn ngang có dừng đúng thẻ), Tìm kiếm, Điểm đón, Chọn trên bản đồ, Thêm địa điểm (chỉnh nhẹ), Gắn voucher (đầu nhóm gọn), So giá (mã + chip số tiền giảm cạnh giá, "tới nơi ~giờ", khung xương khi đổi loại xe, tuyến đường vẽ dần), Khách: đăng nhập để nhận mã quán, Quảng cáo, Mở app, Báo giá.

**GĐ 3 · Ví, điểm, tài khoản (hàng 3–4)** — Ví (tab + huy hiệu, Ví lần đầu trống), Chi tiết voucher/mã, Điểm thưởng (thanh điểm chạy, dòng Giới thiệu), Tài khoản (thẻ Giới thiệu), Tài khoản khách, Lịch sử, Liên kết, Thông báo, Cài đặt thông báo; onboarding (Chào mừng có thẻ trôi nhẹ, ô OTP nhấp nháy, ô mã giới thiệu cuối màn Thông tin).

**GĐ 4 · Giới thiệu bạn bè (theo mục kế hoạch referral ở trên)** — core + `memory.ts` + migration SQL (`referrals`, `profiles.referral_code`, RPC `apply_referral_code`, `my_referrals`, cộng thưởng trong `report_price`), màn `gioi-thieu.tsx`, trang web `/moi/[ma]`, test vitest.

**GĐ 5 · Ảnh bìa đổi được** — bảng `app_banners` (ảnh, thời gian hiện, lớp phủ, trạng thái) + kho ảnh Supabase Storage (đọc công khai, chỉ quản trị ops ghi), RPC `active_banner`, `createAdminOpsService` thêm CRUD; web quản trị trang `/quan-tri/anh-bia` (QT 13) có tải ảnh, kiểm 1170×630 ≤ 500 KB, lớp phủ, tương phản; app đọc ảnh đang hiện, lỗi thì dùng SVG mặc định.

**GĐ 6 · Kiểm tra** — `pnpm test`, `pnpm typecheck`, `pnpm lint`; chạy bản web của app và web quản trị, so từng màn với canvas; cập nhật `docs/progress.md`.

**GĐ 5b · Ảnh tại quán +50 điểm** — người dùng có chuyến dùng mã của quán chụp ảnh tại quán (máy ảnh + vị trí), ảnh vào kho riêng tư `checkin-photos`; máy chủ kiểm: chuyến của chính người đó, trong 24 giờ sau chuyến, vị trí lúc chụp cách quán ≤ 150 m, mỗi chuyến một ảnh, mã băm ảnh không trùng ảnh cũ; ảnh vào hàng chờ duyệt ở web quản trị, duyệt thì cộng 50 điểm (ghi sổ điểm), từ chối có lý do. Quán tài trợ chỉ thấy số lượt check-in, không thấy ảnh hay người chụp.

## Chưa làm trong đợt này
- Tự điền mã sau khi cài app từ link (deferred deep link).
