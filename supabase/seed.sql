-- TỰ SINH bằng `pnpm db:seed:gen` từ packages/core/src/seed. Không sửa tay.
-- Dữ liệu mẫu: Minh Anh (app), Cà phê Mây (doanh nghiệp), Vận hành Frego (quản trị). Mốc thời gian 22/11/2026.

begin;

-- Tài khoản đăng nhập mẫu (môi trường dev/staging). Trigger on_auth_user_created tạo hồ sơ mặc định.
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', null, '84909555123', '2026-08-14T13:10:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', null, '84938222456', '2026-09-02T01:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', null, '84977111789', '2026-10-11T05:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', null, '84903444012', '2026-10-28T11:30:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'vanhanh@frego.vn', '84327878987', '2026-07-01T02:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000b1', 'authenticated', 'authenticated', 'chu@caphemay.vn', '84283000482', '2026-09-05T03:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000a0005', 'authenticated', 'authenticated', null, '84903552552', '2026-11-19T13:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated', null, '84327878902', '2026-07-01T02:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a3', 'authenticated', 'authenticated', null, '84327878903', '2026-07-01T02:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a4', 'authenticated', 'authenticated', null, '84327878904', '2026-07-01T02:00:00.000Z') on conflict (id) do nothing;
insert into auth.users (instance_id, id, aud, role, email, phone, created_at) values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a5', 'authenticated', 'authenticated', null, '84327878905', '2026-07-01T02:00:00.000Z') on conflict (id) do nothing;

-- places (11)
insert into public.places (id, name, address, district, lat, lng) values
  ('landmark81', 'Landmark 81', '720A Điện Biên Phủ, Bình Thạnh', 'Bình Thạnh', 10.7949, 106.7219),
  ('ben-thanh', 'Chợ Bến Thành', 'Đường Lê Lợi, phường Bến Thành', 'Quận 1', 10.7725, 106.698),
  ('ben-thanh-bac', 'Chợ Bến Thành, cửa Bắc', 'Đường Lê Thánh Tôn, phường Bến Thành', 'Quận 1', 10.7731, 106.6979),
  ('cho-dem-ben-thanh', 'Chợ đêm Bến Thành', 'Đường Phan Bội Châu, phường Bến Thành', 'Quận 1', 10.7712, 106.6975),
  ('metro-ben-thanh', 'Ga metro Bến Thành', 'Đường Lê Lợi, phường Bến Thành', 'Quận 1', 10.7705, 106.6935),
  ('tan-son-nhat', 'Sân bay Tân Sơn Nhất', 'Đường Trường Sơn', 'Tân Bình', 10.8188, 106.6519),
  ('nguyen-hue', 'Phố đi bộ Nguyễn Huệ', 'Phường Sài Gòn', 'Quận 1', 10.7741, 106.7038),
  ('ho-con-rua', 'Hồ Con Rùa', 'Công trường Quốc Tế, Quận 3', 'Quận 3', 10.7826, 106.6959),
  ('cho-tan-dinh', 'Chợ Tân Định', 'Đường Hai Bà Trưng, Quận 1', 'Quận 1', 10.7891, 106.6905),
  ('nha-minh-anh', 'Nhà', 'Đường Nguyễn Văn Đậu, Bình Thạnh', 'Bình Thạnh', 10.8061, 106.6935),
  ('cty-minh-anh', 'Công ty', 'Đường Nguyễn Đình Chiểu, Quận 3', 'Quận 3', 10.7786, 106.6906)
on conflict (id) do update set name = excluded.name, address = excluded.address, district = excluded.district, lat = excluded.lat, lng = excluded.lng;

-- partners (9)
insert into public.partners (id, kind, name, mono, description, integration, sort_order) values
  ('vpb', 'bank', 'VPBank', 'VP', 'Thẻ tín dụng · hợp mã VPBTRANSPORT', 'record_only', 1),
  ('klb', 'bank', 'KienLongBank', 'KL', 'Liên kết để mở mã KLBIKE cho GrabBike', 'record_only', 2),
  ('momo', 'wallet', 'MoMo', 'Mo', 'Hợp mã đặt xe trả bằng MoMo', 'record_only', 3),
  ('zalo', 'wallet', 'ZaloPay', 'Za', 'Hợp mã đặt xe trả bằng ZaloPay', 'record_only', 4),
  ('shopee', 'wallet', 'ShopeePay', 'Sh', 'Hợp mã đặt xe trả bằng ShopeePay', 'record_only', 5),
  ('be', 'app', 'Be', 'Be', 'Bấm nếu bạn có cài app Be để ưu tiên mã cho hãng này', 'record_only', 6),
  ('grab', 'app', 'Grab', 'Gr', 'Bấm nếu bạn có cài app Grab để ưu tiên mã cho hãng này', 'record_only', 7),
  ('gsm', 'app', 'Green SM', 'GS', 'Bấm nếu bạn có cài app Green SM để ưu tiên mã cho hãng này', 'record_only', 8),
  ('gmail', 'email', 'Gmail', 'Gm', 'Đọc biên nhận chuyến đi để tự báo giá', 'planned', 9)
on conflict (id) do update set kind = excluded.kind, name = excluded.name, mono = excluded.mono, description = excluded.description, integration = excluded.integration, sort_order = excluded.sort_order;

-- fare_tables (9)
insert into public.fare_tables (id, provider_id, vehicle_class, region, open_fare, open_km, per_km, per_min, peak_factor, min_fare, enabled, report_count, accuracy, median_bias, updated_at) values
  ('ft-be-bike', 'be', 'bike', 'hcm', 12000, 2, 4200, 160, 1.15, 12000, true, 1410, 0.78, 0.04, '2026-11-18T02:00:00.000Z'),
  ('ft-grab-bike', 'grab', 'bike', 'hcm', 13000, 2, 4300, 290, 1.15, 13000, true, 980, 0.81, -0.03, '2026-11-18T02:00:00.000Z'),
  ('ft-grab-car4', 'grab', 'car4', 'hcm', 29000, 2, 10000, 400, 1.15, 29000, true, 1240, 0.84, 0.02, '2026-11-18T02:00:00.000Z'),
  ('ft-be-car4', 'be', 'car4', 'hcm', 27000, 2, 10500, 380, 1.15, 27000, true, 320, 0.74, 0.06, '2026-11-18T02:00:00.000Z'),
  ('ft-grab-car7', 'grab', 'car7', 'hcm', 35000, 2, 13000, 440, 1.15, 35000, true, 210, 0.8, 0.03, '2026-11-18T02:00:00.000Z'),
  ('ft-be-car7', 'be', 'car7', 'hcm', 33000, 2, 12500, 420, 1.15, 33000, false, 12, null, null, '2026-11-18T02:00:00.000Z'),
  ('ft-gsm-bike', 'gsm', 'bike', 'hcm', 13000, 2, 4500, 200, 1.15, 13000, false, 46, null, null, '2026-11-18T02:00:00.000Z'),
  ('ft-gsm-car4', 'gsm', 'car4', 'hcm', 30000, 2, 11000, 400, 1.15, 30000, false, 18, null, null, '2026-11-18T02:00:00.000Z'),
  ('ft-gsm-car7', 'gsm', 'car7', 'hcm', 36000, 2, 13500, 450, 1.15, 36000, false, 4, null, null, '2026-11-18T02:00:00.000Z')
on conflict (id) do update set provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, region = excluded.region, open_fare = excluded.open_fare, open_km = excluded.open_km, per_km = excluded.per_km, per_min = excluded.per_min, peak_factor = excluded.peak_factor, min_fare = excluded.min_fare, enabled = excluded.enabled, report_count = excluded.report_count, accuracy = excluded.accuracy, median_bias = excluded.median_bias, updated_at = excluded.updated_at;

-- profiles (11)
insert into public.profiles (avatar_url, birthday, interests, vehicle_prefs, points, saved_amount, saved_count, role, admin_role, status, lock_reason, id, phone, display_name, created_at, onboarded_at) values
  (null, null, '{"cafe","food"}', '{"bike"}', 1250, 85000, 6, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000001', '+84909555123', 'Minh Anh', '2026-08-14T13:10:00.000Z', '2026-08-14T13:14:00.000Z'),
  (null, null, '{}', '{}', 640, 40000, 3, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000002', '+84938222456', 'Gia Huy', '2026-09-02T01:00:00.000Z', '2026-09-02T01:03:00.000Z'),
  (null, null, '{}', '{}', 2180, 30000, 2, 'user', null, 'locked', 'Nhiều báo giá trùng nhau trong thời gian ngắn', '00000000-0000-4000-8000-000000000003', '+84977111789', 'Thu Hà', '2026-10-11T05:00:00.000Z', '2026-10-11T05:02:00.000Z'),
  (null, null, '{}', '{}', 310, 20000, 2, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000004', '+84903444012', 'Quốc Bảo', '2026-10-28T11:30:00.000Z', '2026-10-28T11:31:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'ops', 'active', null, '00000000-0000-4000-8000-0000000000a1', '+84327878987', 'Vận hành Frego', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'user', null, 'active', null, '00000000-0000-4000-8000-0000000000b1', '+84283000482', 'Chủ Cà phê Mây', '2026-09-05T03:00:00.000Z', '2026-09-05T03:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'user', null, 'active', null, '00000000-0000-4000-8000-0000000a0005', '+84903552552', 'Ngọc Linh', '2026-11-19T13:00:00.000Z', '2026-11-19T13:02:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'ops', 'active', null, '00000000-0000-4000-8000-0000000000a2', '+84327878902', 'Đức Thịnh', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'accounting', 'active', null, '00000000-0000-4000-8000-0000000000a3', '+84327878903', 'Thanh Tâm', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'support', 'active', null, '00000000-0000-4000-8000-0000000000a4', '+84327878904', 'Ngọc Hân', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'support', 'active', null, '00000000-0000-4000-8000-0000000000a5', '+84327878905', 'Bảo Long', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z')
on conflict (id) do update set avatar_url = excluded.avatar_url, birthday = excluded.birthday, interests = excluded.interests, vehicle_prefs = excluded.vehicle_prefs, points = excluded.points, saved_amount = excluded.saved_amount, saved_count = excluded.saved_count, role = excluded.role, admin_role = excluded.admin_role, status = excluded.status, lock_reason = excluded.lock_reason, phone = excluded.phone, display_name = excluded.display_name, created_at = excluded.created_at, onboarded_at = excluded.onboarded_at;

-- consents (1)
insert into public.consents (user_id, location, share_data, personalized, updated_at) values
  ('00000000-0000-4000-8000-000000000001', true, false, true, '2026-08-14T13:14:00.000Z')
on conflict (user_id) do update set location = excluded.location, share_data = excluded.share_data, personalized = excluded.personalized, updated_at = excluded.updated_at;

-- notification_prefs (1)
insert into public.notification_prefs (user_id, gift, card, expire, report, points, promo, quiet) values
  ('00000000-0000-4000-8000-000000000001', true, true, true, true, true, false, true)
on conflict (user_id) do update set gift = excluded.gift, card = excluded.card, expire = excluded.expire, report = excluded.report, points = excluded.points, promo = excluded.promo, quiet = excluded.quiet;

-- saved_places (2)
insert into public.saved_places (id, user_id, kind, label, place_id, created_at) values
  ('sp-home', '00000000-0000-4000-8000-000000000001', 'home', 'Nhà', 'nha-minh-anh', '2026-08-14T13:20:00.000Z'),
  ('sp-work', '00000000-0000-4000-8000-000000000001', 'work', 'Công ty', 'cty-minh-anh', '2026-08-14T13:21:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, kind = excluded.kind, label = excluded.label, place_id = excluded.place_id, created_at = excluded.created_at;

-- recent_searches (3)
insert into public.recent_searches (id, user_id, place_id, searched_at) values
  ('rs-1', '00000000-0000-4000-8000-000000000001', 'ben-thanh', '2026-11-22T10:38:00.000Z'),
  ('rs-2', '00000000-0000-4000-8000-000000000001', 'tan-son-nhat', '2026-11-21T13:10:00.000Z'),
  ('rs-3', '00000000-0000-4000-8000-000000000001', 'nguyen-hue', '2026-11-20T12:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, place_id = excluded.place_id, searched_at = excluded.searched_at;

-- linked_accounts (6)
insert into public.linked_accounts (id, user_id, partner_id, card_type, linked_at) values
  ('la-1', '00000000-0000-4000-8000-000000000001', 'vpb', 'credit', '2026-08-20T14:00:00.000Z'),
  ('la-2', '00000000-0000-4000-8000-000000000001', 'momo', null, '2026-08-20T14:02:00.000Z'),
  ('la-3', '00000000-0000-4000-8000-000000000001', 'be', null, '2026-09-01T01:00:00.000Z'),
  ('la-qt-1', '00000000-0000-4000-8000-000000000002', 'klb', 'debit', '2026-09-03T01:00:00.000Z'),
  ('la-qt-2', '00000000-0000-4000-8000-000000000004', 'zalo', null, '2026-10-28T11:40:00.000Z'),
  ('la-qt-3', '00000000-0000-4000-8000-000000000003', 'momo', null, '2026-10-11T05:10:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, partner_id = excluded.partner_id, card_type = excluded.card_type, linked_at = excluded.linked_at;

-- businesses (31)
insert into public.businesses (legal_name, tax_code, representative, industry, address, district, open_hours, status, wallet_balance, auto_topup, invoice_name, invoice_email, contact_email, contact_phone, logo_url, storefront_verified, transfer_code, notify_prefs, joined_at, id, name, category, landmark, lat, lng) values
  ('Hộ kinh doanh Cà phê Mây', '0316742482', 'Nguyễn Thị Mây', 'Ăn uống · Cà phê', 'Đường Lê Thánh Tôn, gần Chợ Bến Thành, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1180000, '{"enabled":true,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Mây', 'ketoan@caphemay.vn', 'chu@caphemay.vn', '0283 ••• 482', null, true, 'FREGO CPM1024', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-05T03:00:00.000Z', 'biz-cafe-may', 'Cà phê Mây', 'cafe', 'Chợ Bến Thành', 10.7733, 106.699),
  ('Hộ kinh doanh Quán bún Ngõ Nhỏ', '0316000000', '', 'Ăn uống · Quán bún', 'Đường Tôn Thất Thiệp, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 4250000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Quán bún Ngõ Nhỏ', '', 'ngonho@gmail.com', '', null, true, 'FREGO BNN1031', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-bun-ngo-nho', 'Quán bún Ngõ Nhỏ', 'bowl', 'phố đi bộ Nguyễn Huệ', 10.7752, 106.7036),
  ('Hộ kinh doanh Tiệm trà Sen', '0316000000', '', 'Ăn uống · Trà', 'Đường Phan Chu Trinh, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2600000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm trà Sen', '', 'trasen@gmail.com', '', null, true, 'FREGO TSE1040', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-tra-sen', 'Tiệm trà Sen', 'tea', 'Chợ Bến Thành', 10.7738, 106.6985),
  ('Công ty TNHH Nhà sách Gió', '0318456789', 'Trần Minh Khoa', 'Bán lẻ · Sách, văn phòng phẩm', 'Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM', 'Quận 3', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3100000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Nhà sách Gió', '', 'lienhe@nhasachgio.vn', '', null, true, 'FREGO NSG1052', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-sach-gio', 'Nhà sách Gió', 'book', 'Hồ Con Rùa', 10.781, 106.695),
  ('Hộ kinh doanh Phòng tập Nhịp', '0316000000', '', 'Thể thao · Phòng tập', 'Đường Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', 'Bình Thạnh', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 5400000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Phòng tập Nhịp', '', 'nhip@nhipgym.vn', '', null, true, 'FREGO PTN1060', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-tap-nhip', 'Phòng tập Nhịp', 'gym', 'Landmark 81', 10.7942, 106.7205),
  ('Hộ kinh doanh Tiệm bánh Mộc', '0316000000', '', 'Ăn uống · Tiệm bánh', 'Đường Hai Bà Trưng, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1950000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm bánh Mộc', '', 'banhmoc@gmail.com', '', null, true, 'FREGO TBM1071', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-banh-moc', 'Tiệm bánh Mộc', 'cake', 'chợ Tân Định', 10.7895, 106.6898),
  ('Hộ kinh doanh Cà phê Sông', '0317100101', '', 'Ăn uống · Cà phê', 'Đường Nguyễn Lương Bằng, Phú Mỹ Hưng, Quận 7, TP.HCM', 'Quận 7', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3200000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Sông', '', '', '', null, true, 'FREGO CPS1101', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-18T03:00:00.000Z', 'biz-qt-ca-phe-song', 'Cà phê Sông', 'cafe', 'Phú Mỹ Hưng', 10.7295, 106.7185),
  ('Hộ kinh doanh Bún bò Bà Ba', '0317100102', '', 'Ăn uống · Quán bún', 'Đường Quang Trung, Gò Vấp, TP.HCM', 'Gò Vấp', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2400000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Bún bò Bà Ba', '', '', '', null, true, 'FREGO BBB1102', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-20T02:30:00.000Z', 'biz-qt-bun-bo-ba-ba', 'Bún bò Bà Ba', 'bowl', 'chợ Gò Vấp', 10.8385, 106.6655),
  ('Hộ kinh doanh Trà Mộc Lan', '0317100103', '', 'Ăn uống · Trà', 'Đường Tân Kỳ Tân Quý, Tân Phú, TP.HCM', 'Tân Phú', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1900000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Trà Mộc Lan', '', '', '', null, true, 'FREGO TML1103', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-25T07:00:00.000Z', 'biz-qt-tra-moc-lan', 'Trà Mộc Lan', 'tea', 'chợ Tân Hương', 10.7905, 106.6285),
  ('Hộ kinh doanh Bánh mì Quê', '0317100104', '', 'Ăn uống · Tiệm bánh', 'Đường Sư Vạn Hạnh, Quận 10, TP.HCM', 'Quận 10', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2800000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Bánh mì Quê', '', '', '', null, true, 'FREGO BMQ1104', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-28T01:00:00.000Z', 'biz-qt-banh-mi-que', 'Bánh mì Quê', 'cake', 'Vạn Hạnh', 10.7722, 106.6672),
  ('Công ty TNHH Thể thao Sóng', '0317100105', '', 'Thể thao · Phòng tập', 'Đường Võ Văn Ngân, Thủ Đức, TP.HCM', 'Thủ Đức', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 4600000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Công ty TNHH Thể thao Sóng', '', '', '', null, true, 'FREGO PTS1105', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-01T02:00:00.000Z', 'biz-qt-phong-tap-song', 'Phòng tập Sóng', 'gym', 'chợ Thủ Đức', 10.8505, 106.7705),
  ('Hộ kinh doanh Nhà sách Mở', '0317100106', '', 'Bán lẻ · Sách, văn phòng phẩm', 'Đường Trần Hưng Đạo, Quận 5, TP.HCM', 'Quận 5', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2100000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Nhà sách Mở', '', '', '', null, true, 'FREGO NSM1106', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-02T03:00:00.000Z', 'biz-qt-sach-mo', 'Nhà sách Mở', 'book', 'chợ An Đông', 10.7545, 106.6635),
  ('Hộ kinh doanh Cơm tấm Phúc', '0317100107', '', 'Ăn uống · Cơm tấm', 'Đường Phạm Thế Hiển, Quận 8, TP.HCM', 'Quận 8', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1600000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cơm tấm Phúc', '', '', '', null, true, 'FREGO CTP1107', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-04T04:00:00.000Z', 'biz-qt-com-tam-phuc', 'Cơm tấm Phúc', 'bowl', 'cầu Chữ Y', 10.7405, 106.6605),
  ('Hộ kinh doanh Cà phê Góc Phố', '0317100108', '', 'Ăn uống · Cà phê', 'Đường Bình Quới, Bình Thạnh, TP.HCM', 'Bình Thạnh', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3500000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Góc Phố', '', '', '', null, true, 'FREGO GPH1108', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-06T08:00:00.000Z', 'biz-qt-ca-phe-goc-pho', 'Cà phê Góc Phố', 'cafe', 'bán đảo Thanh Đa', 10.8255, 106.7325),
  ('Hộ kinh doanh Tiệm bánh Mẹ Làm', '0317100109', '', 'Ăn uống · Tiệm bánh', 'Đường Bàu Cát, Tân Bình, TP.HCM', 'Tân Bình', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2300000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm bánh Mẹ Làm', '', '', '', null, true, 'FREGO TML1109', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-08T02:00:00.000Z', 'biz-qt-banh-me-lam', 'Tiệm bánh Mẹ Làm', 'cake', 'chợ Bàu Cát', 10.7925, 106.6455),
  ('Hộ kinh doanh Trà quán Lá', '0317100110', '', 'Ăn uống · Trà', 'Đường Hậu Giang, Quận 6, TP.HCM', 'Quận 6', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1700000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Trà quán Lá', '', '', '', null, true, 'FREGO TQL1110', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-09T03:30:00.000Z', 'biz-qt-tra-quan-la', 'Trà quán Lá', 'tea', 'chợ Bình Tây', 10.7485, 106.6355),
  ('Hộ kinh doanh Yoga An', '0317100111', '', 'Thể thao · Yoga', 'Đường Nguyễn Thị Thập, Quận 7, TP.HCM', 'Quận 7', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3800000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Yoga An', '', '', '', null, true, 'FREGO YGA1111', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-10T01:30:00.000Z', 'biz-qt-yoga-an', 'Yoga An', 'gym', 'Tân Hưng', 10.734, 106.706),
  ('Hộ kinh doanh Phở Hà Thành', '0317100112', '', 'Ăn uống · Phở', 'Đường Lạc Long Quân, Quận 11, TP.HCM', 'Quận 11', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2900000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Phở Hà Thành', '', '', '', null, true, 'FREGO PHT1112', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-12T00:30:00.000Z', 'biz-qt-pho-ha-thanh', 'Phở Hà Thành', 'bowl', 'công viên Đầm Sen', 10.7635, 106.6435),
  ('Hộ kinh doanh Cà phê Vườn Nhà', '0317100113', '', 'Ăn uống · Cà phê', 'Đường Tô Ký, Quận 12, TP.HCM', 'Quận 12', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2200000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Vườn Nhà', '', '', '', null, true, 'FREGO CVN1113', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-13T06:00:00.000Z', 'biz-qt-ca-phe-vuon-nha', 'Cà phê Vườn Nhà', 'cafe', 'công viên phần mềm Quang Trung', 10.8675, 106.6545),
  ('Hộ kinh doanh Nhà sách Bến Đọc', '0317100114', '', 'Bán lẻ · Sách, văn phòng phẩm', 'Đường Kha Vạn Cân, Thủ Đức, TP.HCM', 'Thủ Đức', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2600000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Nhà sách Bến Đọc', '', '', '', null, true, 'FREGO BDO1114', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-15T02:00:00.000Z', 'biz-qt-sach-ben-doc', 'Nhà sách Bến Đọc', 'book', 'ga Bình Thái', 10.8485, 106.7755),
  ('Hộ kinh doanh Bánh cuốn Thanh', '0317100115', '', 'Ăn uống · Bánh cuốn', 'Đường Tên Lửa, Bình Tân, TP.HCM', 'Bình Tân', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1500000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Bánh cuốn Thanh', '', '', '', null, true, 'FREGO BCT1115', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-16T23:30:00.000Z', 'biz-qt-banh-cuon-thanh', 'Bánh cuốn Thanh', 'bowl', 'vòng xoay An Lạc', 10.7655, 106.6035),
  ('Hộ kinh doanh Trà Đào Phố', '0317100116', '', 'Ăn uống · Trà', 'Đường Nguyễn Văn Lượng, Gò Vấp, TP.HCM', 'Gò Vấp', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2000000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Trà Đào Phố', '', '', '', null, true, 'FREGO TDP1116', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-19T07:30:00.000Z', 'biz-qt-tra-dao-pho', 'Trà Đào Phố', 'tea', 'công viên Làng Hoa', 10.8455, 106.6805),
  ('Hộ kinh doanh CLB Quyền Anh Lửa', '0317100117', '', 'Thể thao · Quyền anh', 'Đường Lũy Bán Bích, Tân Phú, TP.HCM', 'Tân Phú', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3000000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh CLB Quyền Anh Lửa', '', '', '', null, true, 'FREGO QAL1117', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-21T10:00:00.000Z', 'biz-qt-quyen-anh-lua', 'CLB Quyền Anh Lửa', 'gym', 'chợ Tân Phú', 10.8005, 106.6255),
  ('Hộ kinh doanh Cà phê Lối Nhỏ', '0317100118', '', 'Ăn uống · Cà phê', 'Đường Song Hành, An Phú, Thủ Đức, TP.HCM', 'Thủ Đức', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3400000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Lối Nhỏ', '', '', '', null, true, 'FREGO LNH1118', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-23T01:00:00.000Z', 'biz-qt-ca-phe-loi-nho', 'Cà phê Lối Nhỏ', 'cafe', 'ga metro An Phú', 10.8025, 106.7505),
  ('Hộ kinh doanh Tiệm bánh Bơ Sữa', '0317100119', '', 'Ăn uống · Tiệm bánh', 'Đường Phạm Văn Nghị, Quận 7, TP.HCM', 'Quận 7', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2700000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm bánh Bơ Sữa', '', '', '', null, true, 'FREGO BBS1119', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-25T03:00:00.000Z', 'biz-qt-banh-bo-sua', 'Tiệm bánh Bơ Sữa', 'cake', 'hồ Bán Nguyệt', 10.7255, 106.7275),
  ('Hộ kinh doanh Cơm nhà Sáu', '0317100120', '', 'Ăn uống · Cơm', 'Đường Huỳnh Tấn Phát, Nhà Bè, TP.HCM', 'Nhà Bè', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1800000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cơm nhà Sáu', '', '', '', null, true, 'FREGO CNS1120', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-27T04:00:00.000Z', 'biz-qt-com-nha-sau', 'Cơm nhà Sáu', 'bowl', 'phà Bình Khánh', 10.6955, 106.7405),
  ('Hộ kinh doanh Trà Thảo Mộc An', '0317100121', '', 'Ăn uống · Trà', 'Đường Lê Thị Hà, Hóc Môn, TP.HCM', 'Hóc Môn', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 500000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Trà Thảo Mộc An', '', '', '', null, true, 'FREGO TTM1121', '{"review":true,"lowBalance":true,"weekly":true}', '2026-11-10T02:00:00.000Z', 'biz-qt-tra-thao-moc', 'Trà Thảo Mộc An', 'tea', 'chợ Hóc Môn', 10.8865, 106.5925),
  ('Hộ kinh doanh Cà phê Sách Chậm', '0317100122', '', 'Ăn uống · Cà phê sách', 'Quốc lộ 50, Bình Chánh, TP.HCM', 'Bình Chánh', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 0, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Sách Chậm', '', '', '', null, true, 'FREGO CSC1122', '{"review":true,"lowBalance":true,"weekly":true}', '2026-11-15T08:00:00.000Z', 'biz-qt-ca-phe-sach-cham', 'Cà phê Sách Chậm', 'book', 'chợ Bình Chánh', 10.7305, 106.6205),
  ('Hộ kinh doanh Tiệm nail Xinh', '0317100123', '', 'Làm đẹp · Tiệm nail', 'Đường Ba Tháng Hai, Quận 10, TP.HCM', 'Quận 10', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'locked', 120000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm nail Xinh', '', '', '', null, true, 'FREGO NXI1123', '{"review":true,"lowBalance":true,"weekly":true}', '2026-10-05T03:00:00.000Z', 'biz-qt-nail-xinh', 'Tiệm nail Xinh', 'tea', 'Vạn Hạnh', 10.7735, 106.665),
  ('Hộ kinh doanh Quán ốc Bà Tư', '0317100124', '', 'Ăn uống · Quán ốc', 'Đường Dương Bá Trạc, Quận 8, TP.HCM', 'Quận 8', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'locked', 350000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Quán ốc Bà Tư', '', '', '', null, true, 'FREGO OBT1124', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-30T11:00:00.000Z', 'biz-qt-oc-ba-tu', 'Quán ốc Bà Tư', 'bowl', 'cầu Nguyễn Văn Cừ', 10.7455, 106.687),
  ('Công ty TNHH Nhà sách Gió', '0318456789', 'Trần Minh Khoa', 'Bán lẻ · Sách, văn phòng phẩm', 'Đường Võ Văn Tần, Quận 3, TP.HCM', 'Quận 3', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'pending', 0, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Công ty TNHH Nhà sách Gió', '', 'cuahang2@nhasachgio.vn', '0283 ••• 215', null, false, 'FREGO NSG2108', '{"review":true,"lowBalance":true,"weekly":true}', '2026-11-21T09:30:00.000Z', 'biz-qt-sach-gio-dk', 'Nhà sách Gió Võ Văn Tần', 'book', 'công viên Tao Đàn', 10.7768, 106.6902)
on conflict (id) do update set legal_name = excluded.legal_name, tax_code = excluded.tax_code, representative = excluded.representative, industry = excluded.industry, address = excluded.address, district = excluded.district, open_hours = excluded.open_hours, status = excluded.status, wallet_balance = excluded.wallet_balance, auto_topup = excluded.auto_topup, invoice_name = excluded.invoice_name, invoice_email = excluded.invoice_email, contact_email = excluded.contact_email, contact_phone = excluded.contact_phone, logo_url = excluded.logo_url, storefront_verified = excluded.storefront_verified, transfer_code = excluded.transfer_code, notify_prefs = excluded.notify_prefs, joined_at = excluded.joined_at, name = excluded.name, category = excluded.category, landmark = excluded.landmark, lat = excluded.lat, lng = excluded.lng;

-- business_members (2)
insert into public.business_members (id, business_id, user_id, email, role, invited_at) values
  ('bm-1', 'biz-cafe-may', '00000000-0000-4000-8000-0000000000b1', 'chu@caphemay.vn', 'owner', '2026-09-05T03:00:00.000Z'),
  ('bm-2', 'biz-cafe-may', null, 'ketoan@caphemay.vn', 'accountant', '2026-09-06T02:00:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, user_id = excluded.user_id, email = excluded.email, role = excluded.role, invited_at = excluded.invited_at;

-- campaigns (46)
insert into public.campaigns (status, reject_reason, paused_by, ad_view_count, radius_m, hours_from, hours_to, only_open_hours, daily_cap, budget, spent, issued_count, used_count, starts_at, ends_at, image_url, submitted_at, approved_at, created_at, id, business_id, name, provider_id, vehicle_class, amount) values
  ('active', null, null, 86, 500, '13:00', '19:00', true, 40, 10000000, 7176000, 980, 312, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-may-chieu', 'biz-cafe-may', 'Khách chiều quanh Chợ Bến Thành', 'grab', 'car4', 20000),
  ('paused', null, 'business', 0, 500, '07:00', '22:00', true, 30, 3000000, 962000, 260, 74, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-may-xe-may', 'biz-cafe-may', 'Xe máy cuối tuần', 'be', 'bike', 10000),
  ('pending', null, null, 0, 800, '07:00', '22:00', true, 30, 4000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T08:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-may-mon-moi', 'biz-cafe-may', 'Khai trương món mới', 'gsm', 'bike', 15000),
  ('rejected', 'ảnh có số điện thoại và mã QR.', null, 0, 500, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-12-19T17:00:00.000Z', '2026-12-26T16:59:00.000Z', null, '2026-11-21T13:00:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-may-giang-sinh', 'biz-cafe-may', 'Ưu đãi Giáng sinh', 'grab', 'car4', 25000),
  ('active', null, null, 0, 1000, '06:00', '21:00', true, 30, 6000000, 2860000, 640, 220, '2026-10-31T17:00:00.000Z', '2026-12-15T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-bun-trua', 'biz-bun-ngo-nho', 'Bữa trưa phố đi bộ', 'grab', 'bike', 10000),
  ('active', null, null, 0, 300, '08:00', '21:00', true, 30, 3000000, 1170000, 300, 90, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-tra-sen', 'biz-tra-sen', 'Trà chiều Bến Thành', 'be', 'bike', 10000),
  ('pending', null, null, 0, 300, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T06:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-tra-sen-cuoi-tuan', 'biz-tra-sen', 'Trà chiều cuối tuần', 'be', 'bike', 10000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 4000000, 1404000, 410, 78, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-sach-gio', 'biz-sach-gio', 'Đọc sách cuối tuần', 'be', 'bike', 15000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 6000000, 2160000, 520, 120, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-tap-nhip', 'biz-tap-nhip', 'Tập tối Landmark', 'gsm', 'car4', 15000),
  ('pending', null, null, 0, 600, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T05:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-tap-sang', 'biz-tap-nhip', 'Tập sáng', 'grab', 'bike', 15000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 3000000, 1066000, 330, 82, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-banh-moc', 'biz-banh-moc', 'Bánh nóng buổi sáng', 'be', 'bike', 10000),
  ('ended', null, null, 0, 300, '07:00', '22:00', true, 20, 2000000, 1677000, 410, 129, '2026-09-30T17:00:00.000Z', '2026-10-31T16:59:00.000Z', null, '2026-09-28T03:00:00.000Z', '2026-09-29T02:00:00.000Z', '2026-09-28T02:30:00.000Z', 'cp-may-thang-10', 'biz-cafe-may', 'Thử nghiệm tháng 10', 'grab', 'bike', 10000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 4000000, 528000, 210, 48, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-song-chieu', 'biz-qt-ca-phe-song', 'Chiều cuối tuần Phú Mỹ Hưng', 'grab', 'car4', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 1500000, 240000, 140, 30, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-song-sang', 'biz-qt-ca-phe-song', 'Cà phê sáng đi làm', 'be', 'bike', 5000),
  ('active', null, null, 0, 1000, '07:00', '22:00', true, 30, 2500000, 682000, 260, 62, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-bunbo-trua', 'biz-qt-bun-bo-ba-ba', 'Bún bò trưa Gò Vấp', 'grab', 'bike', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 1000000, 924000, 300, 84, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-moclan-chieu', 'biz-qt-tra-moc-lan', 'Trà chiều Tân Phú', 'be', 'bike', 8000),
  ('active', null, null, 0, 500, '06:00', '10:00', true, 30, 2000000, 440000, 240, 55, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-que-sang', 'biz-qt-banh-mi-que', 'Bánh mì sáng', 'be', 'bike', 5000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 1500000, 275000, 120, 25, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-que-trua', 'biz-qt-banh-mi-que', 'Ăn trưa văn phòng Quận 10', 'grab', 'bike', 8000),
  ('active', null, null, 0, 800, '17:00', '21:00', true, 30, 3000000, 440000, 190, 40, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-song-toi', 'biz-qt-phong-tap-song', 'Tập tối Thủ Đức', 'gsm', 'car4', 8000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 1500000, 176000, 110, 22, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-song-bike', 'biz-qt-phong-tap-song', 'Đi xe máy điện tới phòng tập', 'gsm', 'bike', 5000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 2000000, 396000, 170, 36, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-mo-cuoituan', 'biz-qt-sach-mo', 'Đọc sách Chủ nhật', 'be', 'bike', 8000),
  ('active', null, null, 0, 800, '10:30', '14:00', true, 30, 950000, 858000, 280, 78, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-phuc-trua', 'biz-qt-com-tam-phuc', 'Cơm trưa Quận 8', 'grab', 'bike', 8000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 2000000, 66000, 60, 6, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-phuc-toi', 'biz-qt-com-tam-phuc', 'Cơm tối gia đình', 'grab', 'car4', 8000),
  ('active', null, null, 0, 700, '17:00', '22:00', true, 30, 3000000, 572000, 230, 52, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-gocpho-toi', 'biz-qt-ca-phe-goc-pho', 'Cà phê tối Thanh Đa', 'grab', 'car4', 8000),
  ('active', null, null, 0, 700, '07:00', '22:00', true, 30, 1500000, 224000, 150, 28, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-gocpho-bike', 'biz-qt-ca-phe-goc-pho', 'Ghé quán bằng xe máy', 'be', 'bike', 5000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 2500000, 484000, 200, 44, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-melam-cuoituan', 'biz-qt-banh-me-lam', 'Bánh sinh nhật cuối tuần', 'grab', 'car4', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 1500000, 517000, 210, 47, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-la-chieu', 'biz-qt-tra-quan-la', 'Trà chiều Chợ Lớn', 'be', 'bike', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 1000000, 160000, 100, 20, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-la-toi', 'biz-qt-tra-quan-la', 'Trà tối cuối tuần', 'gsm', 'bike', 5000),
  ('active', null, null, 0, 800, '05:30', '08:30', true, 30, 2000000, 418000, 160, 38, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-yoga-sang', 'biz-qt-yoga-an', 'Yoga sáng sớm', 'grab', 'bike', 8000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 2500000, 286000, 130, 26, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-yoga-toi', 'biz-qt-yoga-an', 'Yoga sau giờ làm', 'grab', 'car4', 8000),
  ('active', null, null, 0, 700, '06:00', '10:00', true, 30, 1500000, 80000, 90, 10, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-pho-sang', 'biz-qt-pho-ha-thanh', 'Phở sáng', 'be', 'bike', 5000),
  ('active', null, null, 0, 700, '19:00', '23:00', true, 30, 850000, 770000, 220, 70, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-pho-toi', 'biz-qt-pho-ha-thanh', 'Phở đêm', 'grab', 'bike', 8000),
  ('active', null, null, 0, 1000, '07:00', '22:00', true, 30, 2000000, 363000, 150, 33, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-vuon-cuoituan', 'biz-qt-ca-phe-vuon-nha', 'Cuối tuần ở Vườn Nhà', 'gsm', 'car4', 8000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 1500000, 328000, 190, 41, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-bendoc-sv', 'biz-qt-sach-ben-doc', 'Sinh viên đọc sách', 'be', 'bike', 5000),
  ('active', null, null, 0, 800, '07:00', '22:00', true, 30, 2000000, 132000, 90, 12, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-bendoc-nhom', 'biz-qt-sach-ben-doc', 'Đi nhóm đến nhà sách', 'grab', 'car4', 8000),
  ('active', null, null, 0, 600, '06:00', '10:00', true, 30, 780000, 704000, 230, 64, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-thanh-sang', 'biz-qt-banh-cuon-thanh', 'Bánh cuốn sáng', 'be', 'bike', 8000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 1500000, 506000, 200, 46, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-dao-chieu', 'biz-qt-tra-dao-pho', 'Trà đào buổi chiều', 'grab', 'bike', 8000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 1000000, 144000, 100, 18, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-dao-toi', 'biz-qt-tra-dao-pho', 'Trà tối Gò Vấp', 'be', 'bike', 5000),
  ('active', null, null, 0, 800, '17:00', '21:30', true, 30, 2000000, 385000, 150, 35, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-lua-toi', 'biz-qt-quyen-anh-lua', 'Tập tối Tân Phú', 'grab', 'bike', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 2000000, 550000, 210, 50, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-loinho-sang', 'biz-qt-ca-phe-loi-nho', 'Cà phê sáng An Phú', 'grab', 'bike', 8000),
  ('active', null, null, 0, 500, '07:00', '22:00', true, 30, 2000000, 220000, 110, 20, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-loinho-nhom', 'biz-qt-ca-phe-loi-nho', 'Họp nhóm ở Lối Nhỏ', 'grab', 'car4', 8000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 1500000, 473000, 200, 43, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-bosua-chieu', 'biz-qt-banh-bo-sua', 'Bánh chiều Phú Mỹ Hưng', 'be', 'bike', 8000),
  ('active', null, null, 0, 600, '07:00', '22:00', true, 30, 2000000, 165000, 90, 15, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-bosua-dat', 'biz-qt-banh-bo-sua', 'Đặt bánh cuối tuần', 'gsm', 'car4', 8000),
  ('active', null, null, 0, 1000, '07:00', '22:00', true, 30, 1500000, 429000, 180, 39, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-sau-trua', 'biz-qt-com-nha-sau', 'Cơm trưa Nhà Bè', 'grab', 'bike', 8000),
  ('paused', null, 'business', 0, 1000, '07:00', '22:00', true, 30, 1000000, 168000, 120, 21, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-sau-toi', 'biz-qt-com-nha-sau', 'Cơm tối công nhân', 'be', 'bike', 5000),
  ('paused', null, 'frego', 0, 500, '07:00', '22:00', true, 30, 3000000, 533000, 300, 41, '2026-10-31T17:00:00.000Z', '2026-12-25T16:59:00.000Z', null, '2026-10-29T03:00:00.000Z', '2026-10-30T02:00:00.000Z', '2026-10-29T02:30:00.000Z', 'cp-qt-xinh-noel', 'biz-qt-nail-xinh', 'Ưu đãi Noel', 'grab', 'bike', 10000)
on conflict (id) do update set status = excluded.status, reject_reason = excluded.reject_reason, paused_by = excluded.paused_by, ad_view_count = excluded.ad_view_count, radius_m = excluded.radius_m, hours_from = excluded.hours_from, hours_to = excluded.hours_to, only_open_hours = excluded.only_open_hours, daily_cap = excluded.daily_cap, budget = excluded.budget, spent = excluded.spent, issued_count = excluded.issued_count, used_count = excluded.used_count, starts_at = excluded.starts_at, ends_at = excluded.ends_at, image_url = excluded.image_url, submitted_at = excluded.submitted_at, approved_at = excluded.approved_at, created_at = excluded.created_at, business_id = excluded.business_id, name = excluded.name, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount;

-- campaign_events (17)
insert into public.campaign_events (id, campaign_id, at, text) values
  ('ce-1', 'cp-may-chieu', '2026-11-22T01:00:00.000Z', 'Ví còn dưới 1.500.000đ, Frego đã gửi email nhắc nạp'),
  ('ce-2', 'cp-may-chieu', '2026-11-14T15:00:00.000Z', 'Ngày nhiều mã được dùng nhất: 21 mã'),
  ('ce-3', 'cp-may-chieu', '2026-11-06T03:00:00.000Z', 'Tăng ngân sách từ 8.000.000đ lên 10.000.000đ'),
  ('ce-4', 'cp-may-chieu', '2026-10-31T02:00:00.000Z', 'Frego duyệt, bắt đầu chạy từ 01/11'),
  ('ce-5', 'cp-may-chieu', '2026-10-30T03:00:00.000Z', 'Gửi duyệt'),
  ('ce-may-xm-1', 'cp-may-xe-may', '2026-10-30T03:00:00.000Z', 'Gửi duyệt'),
  ('ce-may-xm-2', 'cp-may-xe-may', '2026-10-31T02:00:00.000Z', 'Frego duyệt, bắt đầu chạy từ 01/11'),
  ('ce-may-xm-3', 'cp-may-xe-may', '2026-11-16T01:00:00.000Z', 'Tạm dừng'),
  ('ce-may-mm-1', 'cp-may-mon-moi', '2026-11-22T08:45:00.000Z', 'Gửi duyệt'),
  ('ce-may-gs-1', 'cp-may-giang-sinh', '2026-11-21T13:00:00.000Z', 'Gửi duyệt'),
  ('ce-may-gs-2', 'cp-may-giang-sinh', '2026-11-22T02:30:00.000Z', 'Frego từ chối, lý do: ảnh có số điện thoại và mã QR.'),
  ('ce-may-t10-1', 'cp-may-thang-10', '2026-09-28T03:00:00.000Z', 'Gửi duyệt'),
  ('ce-may-t10-2', 'cp-may-thang-10', '2026-09-29T02:00:00.000Z', 'Frego duyệt, bắt đầu chạy từ 01/10'),
  ('ce-may-t10-3', 'cp-may-thang-10', '2026-10-31T16:59:00.000Z', 'Kết thúc, 129 mã được dùng'),
  ('ce-qt-1', 'cp-qt-xinh-noel', '2026-11-20T03:00:00.000Z', 'Frego tạm dừng vì bị báo lỗi'),
  ('ce-qt-2', 'cp-qt-xinh-noel', '2026-10-30T02:00:00.000Z', 'Frego duyệt, bắt đầu chạy từ 01/11'),
  ('ce-qt-3', 'cp-qt-sau-toi', '2026-11-18T14:00:00.000Z', 'Doanh nghiệp tạm dừng')
on conflict (id) do update set campaign_id = excluded.campaign_id, at = excluded.at, text = excluded.text;

-- frego_codes (5)
insert into public.frego_codes (id, code, kind, provider_id, vehicle_class, amount, title, valid_days, quota, issued_count, used_count, active) values
  ('fc-welcome', 'FREGO20', 'welcome', 'be', 'bike', 20000, 'Quà chào mừng', 30, 50, 46, 31, true),
  ('fc-r-be', 'FRBE10', 'reward', 'be', 'bike', 10000, 'Đổi 500 điểm', 30, null, 240, 190, true),
  ('fc-r-gsm', 'FRGS15', 'reward', 'gsm', 'bike', 15000, 'Đổi 1.000 điểm', 30, null, 82, 51, true),
  ('fc-r-grab', 'FRGR20', 'reward', 'grab', 'car4', 20000, 'Đổi 1.500 điểm', 30, null, 42, 33, true),
  ('fc-fregomoi', 'FREGOMOI', 'promo', 'grab', 'bike', 15000, 'Chuyến đầu', 30, null, 0, 0, false)
on conflict (id) do update set code = excluded.code, kind = excluded.kind, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, title = excluded.title, valid_days = excluded.valid_days, quota = excluded.quota, issued_count = excluded.issued_count, used_count = excluded.used_count, active = excluded.active;

-- rewards (3)
insert into public.rewards (id, provider_id, vehicle_class, amount, cost, frego_code_id, redeemed_count, active) values
  ('rw-be', 'be', 'bike', 10000, 500, 'fc-r-be', 240, true),
  ('rw-gsm', 'gsm', 'bike', 15000, 1000, 'fc-r-gsm', 82, true),
  ('rw-grab', 'grab', 'car4', 20000, 1500, 'fc-r-grab', 42, true)
on conflict (id) do update set provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, cost = excluded.cost, frego_code_id = excluded.frego_code_id, redeemed_count = excluded.redeemed_count, active = excluded.active;

-- user_vouchers (2)
insert into public.user_vouchers (id, user_id, source, campaign_id, frego_code_id, code, provider_id, vehicle_class, amount, note, reasons, status, issued_at, expires_at, used_at, trip_id) values
  ('uv-may7k2q', '00000000-0000-4000-8000-000000000001', 'sponsor', 'cp-may-chieu', null, 'MAY7K2Q', 'grab', 'car4', 20000, 'Tặng vì bạn hay đến khu Chợ Bến Thành', '{"4 chuyến có điểm đến quanh Chợ Bến Thành trong 30 ngày qua.","Bạn hay đi vào buổi chiều, lúc quán đang mở cửa."}', 'active', '2026-11-22T08:20:00.000Z', '2026-11-30T16:59:00.000Z', null, null),
  ('uv-welcome', '00000000-0000-4000-8000-000000000001', 'frego', null, 'fc-welcome', 'FREGO20', 'be', 'bike', 20000, 'Quà chào mừng khi bạn tham gia Frego', '{}', 'active', '2026-11-01T01:00:00.000Z', '2026-11-30T16:59:00.000Z', null, null)
on conflict (id) do update set user_id = excluded.user_id, source = excluded.source, campaign_id = excluded.campaign_id, frego_code_id = excluded.frego_code_id, code = excluded.code, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, note = excluded.note, reasons = excluded.reasons, status = excluded.status, issued_at = excluded.issued_at, expires_at = excluded.expires_at, used_at = excluded.used_at, trip_id = excluded.trip_id;

-- public_codes (6)
insert into public.public_codes (provider_id, vehicle_classes, amount, percent, max_amount, min_fare, requires_partner_id, airport_only, notes, conditions, source_name, source_url, source_title, last_checked_at, expires_at, status, ok_reports_24h, bad_reports_24h, used_count, created_at, id, code, title) values
  ('grab', '{"bike","car4"}', 15000, null, null, 50000, 'vpb', false, '{"1 lần mỗi tháng"}', '{"Thanh toán bằng thẻ VPBank đã liên kết vào Grab.","Chuyến GrabBike hoặc GrabCar từ 50.000đ.","Mỗi người dùng được 1 mã mỗi tháng.","Dùng chung được với các ưu đãi khác của Grab.","Chỉ áp dụng trên phiên bản app Grab mới nhất."}', 'grab.com', 'https://www.grab.com/vn/blog/uu-dai-the-vpbank/', 'Ưu đãi thẻ VPBank trên Grab', '2026-11-22T08:45:00.000Z', null, 'live', 18, 2, 1260, '2026-10-01T02:00:00.000Z', 'pc-vpb', 'VPBTRANSPORT', 'Giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ'),
  ('grab', '{"car4"}', null, 0.1, 30000, 160000, null, false, '{"Mọi cách thanh toán","Có thể hết sớm"}', '{"Chuyến GrabCar từ 160.000đ.","Giảm 10%, tối đa 30.000đ.","Số lượng có hạn mỗi ngày."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi chuyến xa GrabCar', '2026-11-22T05:45:00.000Z', null, 'live', 9, 0, 640, '2026-10-01T02:00:00.000Z', 'pc-chuyenxacar', 'CHUYENXACAR', 'Giảm 10%, tối đa 30.000đ cho GrabCar từ 160.000đ'),
  ('grab', '{"car4","car7"}', null, 0.2, 50000, 200000, null, true, '{"Đi, đến sân bay","Giới hạn lượt mỗi ngày"}', '{"Điểm đón hoặc điểm đến là sân bay.","Chuyến GrabCar từ 200.000đ.","Giảm 20%, tối đa 50.000đ."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi đi sân bay', '2026-11-21T13:00:00.000Z', null, 'live', 4, 0, 310, '2026-10-01T02:00:00.000Z', 'pc-sanbay', 'SANBAY', 'Giảm 20%, tối đa 50.000đ cho GrabCar từ 200.000đ'),
  ('grab', '{"bike"}', 15000, null, null, 40000, 'klb', false, '{"1 lần mỗi ngày"}', '{"Thanh toán bằng thẻ KienLongBank.","Chuyến GrabBike từ 40.000đ.","Mỗi ngày 1 lần."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi thẻ KienLongBank', '2026-11-22T07:45:00.000Z', null, 'live', 6, 0, 400, '2026-10-01T02:00:00.000Z', 'pc-klbike', 'KLBIKE', 'Giảm 15.000đ cho GrabBike từ 40.000đ'),
  ('be', '{"bike"}', 12000, null, null, null, null, false, '{"Tự ẩn do nhiều người báo lỗi"}', '{}', 'facebook.com/be', 'https://www.facebook.com/', 'Bài đăng khuyến mãi', '2026-11-22T02:00:00.000Z', null, 'hidden', 1, 14, 0, '2026-10-01T02:00:00.000Z', 'pc-benxe', 'BENXE', 'Giảm 12.000đ cho beBike'),
  ('grab', '{"bike"}', 12000, null, null, null, null, false, '{"Mọi cách thanh toán"}', '{"Chuyến GrabBike.","Mỗi người dùng 1 lần."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi tháng 10', '2026-11-01T01:00:00.000Z', '2026-10-31T16:59:00.000Z', 'expired', 0, 0, 380, '2026-10-01T02:00:00.000Z', 'pc-qt-thang10', 'THANG10', 'Giảm 12.000đ cho GrabBike')
on conflict (id) do update set provider_id = excluded.provider_id, vehicle_classes = excluded.vehicle_classes, amount = excluded.amount, percent = excluded.percent, max_amount = excluded.max_amount, min_fare = excluded.min_fare, requires_partner_id = excluded.requires_partner_id, airport_only = excluded.airport_only, notes = excluded.notes, conditions = excluded.conditions, source_name = excluded.source_name, source_url = excluded.source_url, source_title = excluded.source_title, last_checked_at = excluded.last_checked_at, expires_at = excluded.expires_at, status = excluded.status, ok_reports_24h = excluded.ok_reports_24h, bad_reports_24h = excluded.bad_reports_24h, used_count = excluded.used_count, created_at = excluded.created_at, code = excluded.code, title = excluded.title;

-- trips (7)
insert into public.trips (user_id, origin_label, origin_place_id, ad_viewed_at, distance_km, duration_min, attached, chosen_service, estimate_low, estimate_high, compared_count, status, verdict, paid_amount, report_source, points_awarded, opened_at, code_used_at, reported_at, id, dest_place_id, dest_label, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Landmark 81', 'landmark81', null, 5.8, 20, '[{"service":"be-bike","source":"frego","refId":"uv:uv-welcome","code":"FREGO20","label":"FREGO20","amount":20000}]', 'be-bike', 11000, 16000, 3, 'code_used', null, null, null, 0, '2026-11-22T10:41:00.000Z', '2026-11-22T11:05:00.000Z', null, 'trip-today', 'ben-thanh', 'Chợ Bến Thành', '2026-11-22T10:40:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Phố đi bộ Nguyễn Huệ', 'nguyen-hue', null, 2.1, 9, '{}', null, null, null, 3, 'compared', null, null, null, 0, null, null, null, 'trip-yday-eve', 'ho-con-rua', 'Hồ Con Rùa', '2026-11-21T12:05:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Nhà', 'nha-minh-anh', null, 5.8, 20, '{}', 'grab-car4', 75000, 86000, 3, 'reported', 'within', 78000, 'receipt', 50, '2026-11-21T01:16:00.000Z', '2026-11-21T01:40:00.000Z', '2026-11-21T01:52:00.000Z', 'trip-yday-am', 'cty-minh-anh', 'Công ty', '2026-11-21T01:15:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Chợ Tân Định', 'cho-tan-dinh', null, 3.4, 13, '[{"service":"be-bike","source":"sponsor","refId":"cp:cp-banh-moc","code":"MOC4H8T","label":"Tiệm bánh Mộc","amount":10000}]', 'be-bike', 21000, 25000, 3, 'reported', 'within', 24000, 'amount', 50, '2026-11-20T05:31:00.000Z', '2026-11-20T05:50:00.000Z', '2026-11-20T06:10:00.000Z', 'trip-fri', 'nha-minh-anh', 'Nhà', '2026-11-20T05:30:00.000Z'),
  ('00000000-0000-4000-8000-000000000004', 'Landmark 81', 'landmark81', null, 5.8, 20, '{}', 'be-bike', 21000, 26000, 3, 'reported', 'cheaper', null, 'tap', 10, '2026-11-22T10:06:00.000Z', '2026-11-22T10:28:00.000Z', '2026-11-22T10:32:00.000Z', 'trip-qt-qb-1', 'ben-thanh', 'Chợ Bến Thành', '2026-11-22T10:05:00.000Z'),
  ('00000000-0000-4000-8000-000000000002', 'Phú Nhuận', null, null, 4.6, 17, '{}', 'grab-bike', 28000, 33000, 3, 'reported', 'pricier', null, 'tap', 10, '2026-11-18T12:21:00.000Z', '2026-11-18T12:30:00.000Z', '2026-11-18T12:45:00.000Z', 'trip-qt-gh-1', 'ben-thanh', 'Quận 1', '2026-11-18T12:20:00.000Z'),
  ('00000000-0000-4000-8000-000000000003', 'Quận 7', null, null, 9.4, 28, '{}', 'gsm-bike', null, null, 2, 'reported', null, 41000, 'amount', 100, '2026-11-18T14:04:00.000Z', '2026-11-18T14:15:00.000Z', '2026-11-18T14:40:00.000Z', 'trip-qt-th-1', 'landmark81', 'Bình Thạnh', '2026-11-18T14:03:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, origin_label = excluded.origin_label, origin_place_id = excluded.origin_place_id, ad_viewed_at = excluded.ad_viewed_at, distance_km = excluded.distance_km, duration_min = excluded.duration_min, attached = excluded.attached, chosen_service = excluded.chosen_service, estimate_low = excluded.estimate_low, estimate_high = excluded.estimate_high, compared_count = excluded.compared_count, status = excluded.status, verdict = excluded.verdict, paid_amount = excluded.paid_amount, report_source = excluded.report_source, points_awarded = excluded.points_awarded, opened_at = excluded.opened_at, code_used_at = excluded.code_used_at, reported_at = excluded.reported_at, dest_place_id = excluded.dest_place_id, dest_label = excluded.dest_label, created_at = excluded.created_at;

-- points_ledger (12)
insert into public.points_ledger (id, user_id, delta, reason, trip_id, created_at) values
  ('pe-1', '00000000-0000-4000-8000-000000000001', 50, 'Nhập số tiền chuyến Be, trả 24.000đ', 'trip-fri', '2026-11-20T06:10:00.000Z'),
  ('pe-2', '00000000-0000-4000-8000-000000000001', 10, 'Báo giá một chạm, Grab ô tô', null, '2026-11-19T02:00:00.000Z'),
  ('pe-3', '00000000-0000-4000-8000-000000000001', 10, 'Báo giá một chạm, Be xe máy', null, '2026-11-15T11:00:00.000Z'),
  ('pe-4', '00000000-0000-4000-8000-000000000001', 50, 'Biên nhận email, Grab ô tô 78.000đ', 'trip-yday-am', '2026-11-12T02:00:00.000Z'),
  ('pe-0', '00000000-0000-4000-8000-000000000001', 1130, 'Điểm tích lũy trước đó', null, '2026-10-31T17:00:00.000Z'),
  ('pe-qt-gh-0', '00000000-0000-4000-8000-000000000002', 580, 'Điểm tích lũy trước đó', null, '2026-10-31T17:00:00.000Z'),
  ('pe-qt-gh-1', '00000000-0000-4000-8000-000000000002', 50, 'Nhập số tiền chuyến Be, trả 22.000đ', null, '2026-11-10T05:30:00.000Z'),
  ('pe-qt-gh-2', '00000000-0000-4000-8000-000000000002', 10, 'Báo giá một chạm, Grab xe máy', 'trip-qt-gh-1', '2026-11-18T12:45:00.000Z'),
  ('pe-qt-th-0', '00000000-0000-4000-8000-000000000003', 2080, 'Điểm tích lũy trước đó', null, '2026-10-31T17:00:00.000Z'),
  ('pe-qt-th-1', '00000000-0000-4000-8000-000000000003', 100, 'Nhập số tiền chuyến Green SM, trả 41.000đ, nhân đôi vì chưa có dữ liệu', 'trip-qt-th-1', '2026-11-18T14:40:00.000Z'),
  ('pe-qt-qb-0', '00000000-0000-4000-8000-000000000004', 300, 'Điểm tích lũy trước đó', null, '2026-10-31T17:00:00.000Z'),
  ('pe-qt-qb-1', '00000000-0000-4000-8000-000000000004', 10, 'Báo giá một chạm, Be xe máy', 'trip-qt-qb-1', '2026-11-22T10:32:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, delta = excluded.delta, reason = excluded.reason, trip_id = excluded.trip_id, created_at = excluded.created_at;

-- notifications (5)
insert into public.notifications (id, user_id, category, kind, icon, tone, logo, title, body, cta, link, created_at, read_at) values
  ('nt-used', '00000000-0000-4000-8000-000000000001', 'trip', 'code_used', 'receipt', 'tint', 'be', 'Mã FREGO20 đã được dùng cho chuyến Be', 'Giá thật tiết kiệm được bao nhiêu? Báo giá để được cộng điểm.', 'Báo giá ›', '/bao-gia/trip-today', '2026-11-22T11:05:00.000Z', null),
  ('nt-gift', '00000000-0000-4000-8000-000000000001', 'voucher', 'gift', 'gift', 'deal', 'cafe', 'Cà phê Mây tặng bạn voucher −20.000đ', 'Dùng cho chuyến Grab ô tô đến khu Chợ Bến Thành, hạn 30/11.', 'Xem mã ›', '/voucher/uv-may7k2q', '2026-11-22T08:20:00.000Z', null),
  ('nt-card', '00000000-0000-4000-8000-000000000001', 'voucher', 'card_match', 'card2', 'deal', 'grab', 'Mã mới hợp thẻ VPBank của bạn', 'VPBTRANSPORT giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ.', 'Chi tiết ›', '/ma/pc-vpb', '2026-11-22T02:12:00.000Z', null),
  ('nt-points', '00000000-0000-4000-8000-000000000001', 'trip', 'points', 'sparkplus', 'tint', 'frego', 'Bạn được cộng 50 điểm', 'Cảm ơn bạn đã báo giá chuyến Grab ô tô Nhà → Công ty. Bạn đang có 1.250 điểm.', 'Đổi voucher ›', '/diem-thuong', '2026-11-21T01:52:00.000Z', '2026-11-21T02:00:00.000Z'),
  ('nt-gsm', '00000000-0000-4000-8000-000000000001', 'voucher', 'promo', 'tag', 'deal', 'gsm', 'Green SM giảm 25% mọi chuyến', 'Tự áp đến hết 28/02/2027, không cần nhập mã.', 'Xem trong Ví ›', '/vi', '2026-11-08T03:00:00.000Z', '2026-11-08T05:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, category = excluded.category, kind = excluded.kind, icon = excluded.icon, tone = excluded.tone, logo = excluded.logo, title = excluded.title, body = excluded.body, cta = excluded.cta, link = excluded.link, created_at = excluded.created_at, read_at = excluded.read_at;

-- wallet_transactions (12)
insert into public.wallet_transactions (id, business_id, kind, amount, note, status, reference, created_at) values
  ('wt-1', 'biz-cafe-may', 'deduction', -437000, 'Mã được dùng ngày 21/11 · 19 mã Grab ô tô', 'done', null, '2026-11-21T17:05:00.000Z'),
  ('wt-2', 'biz-cafe-may', 'topup', 5000000, 'Nạp chuyển khoản', 'pending', 'FREGO CPM1024-2', '2026-11-21T09:20:00.000Z'),
  ('wt-3', 'biz-cafe-may', 'deduction', -299000, 'Mã được dùng ngày 20/11 · 13 mã Grab ô tô', 'done', null, '2026-11-20T17:05:00.000Z'),
  ('wt-4', 'biz-cafe-may', 'deduction', -253000, 'Mã được dùng ngày 19/11 · 11 mã Grab ô tô', 'done', null, '2026-11-19T17:05:00.000Z'),
  ('wt-5', 'biz-cafe-may', 'topup', 2000000, 'Nạp chuyển khoản', 'done', 'FREGO CPM1024-1', '2026-11-19T01:06:00.000Z'),
  ('wt-6', 'biz-cafe-may', 'deduction', -276000, 'Mã được dùng ngày 18/11 · 12 mã Grab ô tô', 'done', null, '2026-11-18T17:05:00.000Z'),
  ('wt-ops-tse-0451', 'biz-tra-sen', 'topup', 2000000, 'Nạp chuyển khoản', 'pending', 'FREGO TSE1040-1', '2026-11-21T04:02:00.000Z'),
  ('wt-ops-bnn-0317', 'biz-bun-ngo-nho', 'topup', 3000000, 'Nạp chuyển khoản', 'done', 'FREGO BNN1031-1', '2026-11-21T02:40:00.000Z'),
  ('wt-ops-bnn-1122', 'biz-bun-ngo-nho', 'deduction', -182000, 'Mã được dùng ngày 21/11 · 14 mã Grab xe máy', 'done', null, '2026-11-21T17:05:00.000Z'),
  ('wt-ops-tbm-1122', 'biz-banh-moc', 'deduction', -117000, 'Mã được dùng ngày 21/11 · 9 mã Be xe máy', 'done', null, '2026-11-21T17:05:00.000Z'),
  ('wt-ops-tse-1122', 'biz-tra-sen', 'deduction', -91000, 'Mã được dùng ngày 21/11 · 7 mã Be xe máy', 'done', null, '2026-11-21T17:05:00.000Z'),
  ('wt-ops-nxi-1122', 'biz-qt-nail-xinh', 'deduction', -130000, 'Mã được dùng ngày 21/11 · 10 mã Grab xe máy', 'failed', null, '2026-11-21T17:05:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, kind = excluded.kind, amount = excluded.amount, note = excluded.note, status = excluded.status, reference = excluded.reference, created_at = excluded.created_at;

-- invoices (4)
insert into public.invoices (id, business_id, month, amount, status, issued_at) values
  ('inv-2026-11', 'biz-cafe-may', '2026-11', 8138000, 'draft', null),
  ('inv-2026-10', 'biz-cafe-may', '2026-10', 1677000, 'issued', '2026-11-01T01:00:00.000Z'),
  ('inv-bnn-2026-11', 'biz-bun-ngo-nho', '2026-11', 2860000, 'draft', null),
  ('inv-bnn-2026-10', 'biz-bun-ngo-nho', '2026-10', 2418000, 'issued', '2026-11-01T01:00:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, month = excluded.month, amount = excluded.amount, status = excluded.status, issued_at = excluded.issued_at;

-- support_tickets (6)
insert into public.support_tickets (id, requester_name, requester_kind, topic, subject, status, due_at, created_at) values
  ('st-1043', 'Gia Huy', 'user', 'points', 'Chưa được cộng điểm báo giá', 'open', null, '2026-11-22T01:30:00.000Z'),
  ('st-1042', 'Minh Anh', 'user', 'code', 'Mã FREGO20 báo hết hạn khi nhập', 'open', null, '2026-11-22T10:35:00.000Z'),
  ('st-1041', 'Tiệm trà Sen', 'business', 'billing', 'Đã chuyển khoản nhưng ví chưa cộng', 'pending', null, '2026-11-22T09:45:00.000Z'),
  ('st-1040', 'Quốc Bảo', 'user', 'data_delete', 'Xin xóa dữ liệu tài khoản', 'pending', '2026-12-21T13:10:00.000Z', '2026-11-21T13:10:00.000Z'),
  ('st-1039', 'Phòng tập Nhịp', 'business', 'other', 'Hỏi lý do chiến dịch bị từ chối', 'done', null, '2026-11-21T08:20:00.000Z'),
  ('st-1038', 'Gia Huy', 'user', 'points', 'Báo giá không được cộng điểm', 'done', null, '2026-11-20T03:05:00.000Z')
on conflict (id) do update set requester_name = excluded.requester_name, requester_kind = excluded.requester_kind, topic = excluded.topic, subject = excluded.subject, status = excluded.status, due_at = excluded.due_at, created_at = excluded.created_at;

-- ticket_messages (9)
insert into public.ticket_messages (id, ticket_id, author_kind, author_name, body, created_at) values
  ('tm-1043-1', 'st-1043', 'requester', 'Gia Huy', 'Hôm qua mình báo giá chuyến Grab xe máy về Chợ Bến Thành mà chưa thấy cộng điểm.', '2026-11-22T01:30:00.000Z'),
  ('tm-1042-1', 'st-1042', 'requester', 'Minh Anh', 'Mình nhập FREGO20 trong app Be thì báo mã hết hạn, nhưng trong Ví Frego vẫn còn hạn tới 30/11.', '2026-11-22T10:35:00.000Z'),
  ('tm-1041-1', 'st-1041', 'requester', 'Tiệm trà Sen', 'Sáng 21/11 tiệm đã chuyển khoản 2.000.000đ, nội dung FREGO TSE1040-1, mà ví vẫn chưa cộng.', '2026-11-22T09:45:00.000Z'),
  ('tm-1041-2', 'st-1041', 'admin', 'Kế toán Frego', 'Frego đang đối chiếu sao kê, sẽ cộng vào ví ngay khi thấy giao dịch. Tiệm gửi giúp ảnh biên lai chuyển khoản nhé.', '2026-11-22T10:05:00.000Z'),
  ('tm-1040-1', 'st-1040', 'requester', 'Quốc Bảo', 'Mình muốn xóa tài khoản Frego và toàn bộ dữ liệu.', '2026-11-21T13:10:00.000Z'),
  ('tm-1039-1', 'st-1039', 'requester', 'Phòng tập Nhịp', 'Chiến dịch Tập sáng bị từ chối, cho mình hỏi lý do cụ thể.', '2026-11-21T08:20:00.000Z'),
  ('tm-1039-2', 'st-1039', 'admin', 'Vận hành Frego', 'Ảnh chiến dịch có số điện thoại nên chưa duyệt được. Bạn đổi ảnh khác rồi gửi lại, Frego duyệt trong 1 ngày làm việc.', '2026-11-21T09:02:00.000Z'),
  ('tm-1038-1', 'st-1038', 'requester', 'Gia Huy', 'Mình nhập số tiền chuyến Be 22.000đ nhưng không được cộng điểm.', '2026-11-20T03:05:00.000Z'),
  ('tm-1038-2', 'st-1038', 'admin', 'Hỗ trợ Frego', 'Frego đã cộng 50 điểm cho chuyến này. Cảm ơn bạn đã báo.', '2026-11-20T03:30:00.000Z')
on conflict (id) do update set ticket_id = excluded.ticket_id, author_kind = excluded.author_kind, author_name = excluded.author_name, body = excluded.body, created_at = excluded.created_at;

-- audit_logs (9)
insert into public.audit_logs (id, actor_name, actor_role, action, created_at) values
  ('al-1', 'Vận hành Frego', 'ops', 'Xem chi tiết người dùng Minh Anh', '2026-11-22T03:02:00.000Z'),
  ('al-qt-1', 'Vận hành Frego', 'ops', 'Tạm khóa Quán ốc Bà Tư, lý do giấy phép kinh doanh hết hạn', '2026-11-12T03:20:00.000Z'),
  ('al-qt-2', 'Vận hành Frego', 'ops', 'Tạm khóa Tiệm nail Xinh, lý do nhiều người báo mã không dùng được', '2026-11-20T03:05:00.000Z'),
  ('al-qt-3', 'Hệ thống', 'system', 'Gửi email nhắc nạp ví cho Cà phê Mây', '2026-11-22T01:00:00.000Z'),
  ('al-ops-0948', 'Kế toán', 'accounting', 'Khớp nạp tiền 3.000.000đ, Quán bún Ngõ Nhỏ', '2026-11-22T02:48:00.000Z'),
  ('al-ops-0930', 'Vận hành Frego', 'ops', 'Tạm khóa Thu Hà, lý do báo giá trùng', '2026-11-22T02:30:00.000Z'),
  ('al-ops-0912', 'Vận hành Frego', 'ops', 'Từ chối chiến dịch Ưu đãi Giáng sinh, Cà phê Mây', '2026-11-22T02:12:00.000Z'),
  ('al-ops-0840', 'Hỗ trợ', 'support', 'Xem lịch sử điểm của Gia Huy', '2026-11-22T01:40:00.000Z'),
  ('al-ops-bg-1118', 'Vận hành Frego', 'ops', 'Sửa bảng giá Be xe máy TP.HCM: cập nhật theo 1.410 báo giá', '2026-11-18T02:00:00.000Z')
on conflict (id) do update set actor_name = excluded.actor_name, actor_role = excluded.actor_role, action = excluded.action, created_at = excluded.created_at;

-- broadcasts (2)
insert into public.broadcasts (id, title, body, audience, scheduled_at, status, recipients, created_at) values
  ('bc-gsm-25', 'Green SM giảm 25% cả tuần', 'Green SM tự giảm 25% mọi chuyến, không cần mã, đến hết 28/02/2027.', 'promo', '2026-11-20T10:30:00.000Z', 'sent', 1880, '2026-11-19T03:00:00.000Z'),
  ('bc-grab-cuoi-tuan', 'Grab giảm 20% cuối tuần', 'Mã GRABCUOITUAN cho GrabCar từ 100.000đ, đến hết Chủ nhật.', 'promo', '2026-11-28T10:30:00.000Z', 'draft', 0, '2026-11-22T09:10:00.000Z')
on conflict (id) do update set title = excluded.title, body = excluded.body, audience = excluded.audience, scheduled_at = excluded.scheduled_at, status = excluded.status, recipients = excluded.recipients, created_at = excluded.created_at;

-- stats (254)
insert into public.stats (id, scope, metric, period, key, value, sort) values
  ('biz:biz-cafe-may|totals|2026-11|issued', 'biz:biz-cafe-may', 'totals', '2026-11', 'issued', 1240, 0),
  ('biz:biz-cafe-may|totals|2026-11|used', 'biz:biz-cafe-may', 'totals', '2026-11', 'used', 386, 1),
  ('biz:biz-cafe-may|totals|2026-11|spent', 'biz:biz-cafe-may', 'totals', '2026-11', 'spent', 8138000, 2),
  ('biz:biz-cafe-may|totals|2026-10|issued', 'biz:biz-cafe-may', 'totals', '2026-10', 'issued', 410, 0),
  ('biz:biz-cafe-may|totals|2026-10|used', 'biz:biz-cafe-may', 'totals', '2026-10', 'used', 129, 1),
  ('biz:biz-cafe-may|totals|2026-10|spent', 'biz:biz-cafe-may', 'totals', '2026-10', 'spent', 1677000, 2),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-01', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-01', 26, 0),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-02', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-02', 12, 1),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-03', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-03', 11, 2),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-04', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-04', 13, 3),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-05', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-05', 11, 4),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-06', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-06', 15, 5),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-07', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-07', 35, 6),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-08', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-08', 33, 7),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-09', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-09', 11, 8),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-10', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-10', 12, 9),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-11', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-11', 13, 10),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-12', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-12', 14, 11),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-13', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-13', 16, 12),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-14', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-14', 35, 13),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-15', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-15', 33, 14),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-16', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-16', 11, 15),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-17', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-17', 13, 16),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-18', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-18', 12, 17),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-19', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-19', 11, 18),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-20', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-20', 13, 19),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-21', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-21', 19, 20),
  ('biz:biz-cafe-may|arrivals_daily|2026-11|2026-11-22', 'biz:biz-cafe-may', 'arrivals_daily', '2026-11', '2026-11-22', 17, 21),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|7', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '7', 3, 0),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|8', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '8', 4, 1),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|9', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '9', 5, 2),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|10', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '10', 6, 3),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|11', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '11', 6, 4),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|12', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '12', 6, 5),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|13', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '13', 38, 6),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|14', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '14', 48, 7),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|15', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '15', 73, 8),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|16', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '16', 81, 9),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|17', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '17', 59, 10),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|18', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '18', 39, 11),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|19', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '19', 5, 12),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|20', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '20', 5, 13),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|21', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '21', 4, 14),
  ('biz:biz-cafe-may|arrivals_by_hour|2026-11|22', 'biz:biz-cafe-may', 'arrivals_by_hour', '2026-11', '22', 4, 15),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|1', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '1', 41, 0),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|2', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '2', 39, 1),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|3', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '3', 44, 2),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|4', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '4', 47, 3),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|5', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '5', 62, 4),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|6', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '6', 81, 5),
  ('biz:biz-cafe-may|arrivals_by_weekday|2026-11|0', 'biz:biz-cafe-may', 'arrivals_by_weekday', '2026-11', '0', 72, 6),
  ('biz:biz-cafe-may|arrivals_by_service|2026-11|grab-car4', 'biz:biz-cafe-may', 'arrivals_by_service', '2026-11', 'grab-car4', 312, 0),
  ('biz:biz-cafe-may|arrivals_by_service|2026-11|be-bike', 'biz:biz-cafe-may', 'arrivals_by_service', '2026-11', 'be-bike', 74, 1),
  ('biz:biz-cafe-may|origin_district|2026-11|Quận 3', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Quận 3', 93, 0),
  ('biz:biz-cafe-may|origin_district|2026-11|Bình Thạnh', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Bình Thạnh', 69, 1),
  ('biz:biz-cafe-may|origin_district|2026-11|Quận 7', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Quận 7', 58, 2),
  ('biz:biz-cafe-may|origin_district|2026-11|Phú Nhuận', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Phú Nhuận', 42, 3),
  ('biz:biz-cafe-may|origin_district|2026-11|Thủ Đức', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Thủ Đức', 35, 4),
  ('biz:biz-cafe-may|origin_district|2026-11|Quận khác', 'biz:biz-cafe-may', 'origin_district', '2026-11', 'Quận khác', 89, 5),
  ('biz:biz-cafe-may|avg_distance_m|2026-11|all', 'biz:biz-cafe-may', 'avg_distance_m', '2026-11', 'all', 210, 0),
  ('biz:biz-cafe-may|audience_by_radius|2026-11|300', 'biz:biz-cafe-may', 'audience_by_radius', '2026-11', '300', 900, 0),
  ('biz:biz-cafe-may|audience_by_radius|2026-11|500', 'biz:biz-cafe-may', 'audience_by_radius', '2026-11', '500', 2300, 1),
  ('biz:biz-cafe-may|audience_by_radius|2026-11|800', 'biz:biz-cafe-may', 'audience_by_radius', '2026-11', '800', 4100, 2),
  ('biz:biz-cafe-may|audience_by_radius|2026-11|1000', 'biz:biz-cafe-may', 'audience_by_radius', '2026-11', '1000', 5600, 3),
  ('biz:biz-cafe-may|updated_at|2026-11|at', 'biz:biz-cafe-may', 'updated_at', '2026-11', 'at', 1795343700000, 0),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-01', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-01', 11, 0),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-02', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-02', 12, 1),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-03', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-03', 11, 2),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-04', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-04', 13, 3),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-05', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-05', 11, 4),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-06', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-06', 15, 5),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-07', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-07', 19, 6),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-08', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-08', 18, 7),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-09', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-09', 11, 8),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-10', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-10', 12, 9),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-11', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-11', 13, 10),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-12', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-12', 14, 11),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-13', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-13', 16, 12),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-14', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-14', 21, 13),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-15', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-15', 19, 14),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-16', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-16', 11, 15),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-17', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-17', 13, 16),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-18', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-18', 12, 17),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-19', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-19', 11, 18),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-20', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-20', 13, 19),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-21', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-21', 19, 20),
  ('cp:cp-may-chieu|codes_used_daily|2026-11|2026-11-22', 'cp:cp-may-chieu', 'codes_used_daily', '2026-11', '2026-11-22', 17, 21),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-01', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-01', 15, 0),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-02', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-02', 0, 1),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-03', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-03', 0, 2),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-04', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-04', 0, 3),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-05', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-05', 0, 4),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-06', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-06', 0, 5),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-07', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-07', 16, 6),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-08', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-08', 15, 7),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-09', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-09', 0, 8),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-10', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-10', 0, 9),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-11', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-11', 0, 10),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-12', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-12', 0, 11),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-13', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-13', 0, 12),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-14', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-14', 14, 13),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-15', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-15', 14, 14),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-16', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-16', 0, 15),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-17', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-17', 0, 16),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-18', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-18', 0, 17),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-19', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-19', 0, 18),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-20', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-20', 0, 19),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-21', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-21', 0, 20),
  ('cp:cp-may-xe-may|codes_used_daily|2026-11|2026-11-22', 'cp:cp-may-xe-may', 'codes_used_daily', '2026-11', '2026-11-22', 0, 21),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-01', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-01', 3, 0),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-02', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-02', 4, 1),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-03', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-03', 6, 2),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-04', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-04', 6, 3),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-05', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-05', 4, 4),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-06', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-06', 3, 5),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-07', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-07', 3, 6),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-08', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-08', 4, 7),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-09', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-09', 3, 8),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-10', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-10', 6, 9),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-11', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-11', 6, 10),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-12', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-12', 3, 11),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-13', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-13', 4, 12),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-14', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-14', 3, 13),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-15', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-15', 3, 14),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-16', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-16', 4, 15),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-17', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-17', 6, 16),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-18', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-18', 6, 17),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-19', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-19', 3, 18),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-20', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-20', 4, 19),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-21', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-21', 3, 20),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-22', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-22', 3, 21),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-23', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-23', 4, 22),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-24', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-24', 6, 23),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-25', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-25', 6, 24),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-26', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-26', 3, 25),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-27', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-27', 4, 26),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-28', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-28', 3, 27),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-29', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-29', 3, 28),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-30', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-30', 4, 29),
  ('cp:cp-may-thang-10|codes_used_daily|2026-10|2026-10-31', 'cp:cp-may-thang-10', 'codes_used_daily', '2026-10', '2026-10-31', 6, 30),
  ('platform|kpi|2026-11|active_users', 'platform', 'kpi', '2026-11', 'active_users', 12480, 0),
  ('platform|kpi|2026-11|users_total', 'platform', 'kpi', '2026-11', 'users_total', 12480, 1),
  ('platform|kpi|2026-11|compares', 'platform', 'kpi', '2026-11', 'compares', 38920, 2),
  ('platform|kpi|2026-11|sponsor_codes_issued', 'platform', 'kpi', '2026-11', 'sponsor_codes_issued', 12960, 3),
  ('platform|kpi|2026-11|price_reports', 'platform', 'kpi', '2026-11', 'price_reports', 3996, 4),
  ('platform|kpi|2026-10|active_users', 'platform', 'kpi', '2026-10', 'active_users', 11450, 0),
  ('platform|kpi|2026-10|users_total', 'platform', 'kpi', '2026-10', 'users_total', 11620, 1),
  ('platform|kpi|2026-10|compares', 'platform', 'kpi', '2026-10', 'compares', 34140, 2),
  ('platform|kpi|2026-10|sponsor_codes_issued', 'platform', 'kpi', '2026-10', 'sponsor_codes_issued', 10210, 3),
  ('platform|kpi|2026-10|price_reports', 'platform', 'kpi', '2026-10', 'price_reports', 3410, 4),
  ('platform|codes_used_by_source|2026-11|sponsor', 'platform', 'codes_used_by_source', '2026-11', 'sponsor', 4120, 0),
  ('platform|codes_used_by_source|2026-11|public', 'platform', 'codes_used_by_source', '2026-11', 'public', 2610, 1),
  ('platform|codes_used_by_source|2026-11|frego', 'platform', 'codes_used_by_source', '2026-11', 'frego', 395, 2),
  ('platform|codes_used_by_source|2026-10|sponsor', 'platform', 'codes_used_by_source', '2026-10', 'sponsor', 3030, 0),
  ('platform|codes_used_by_source|2026-10|public', 'platform', 'codes_used_by_source', '2026-10', 'public', 2690, 1),
  ('platform|codes_used_by_source|2026-10|frego', 'platform', 'codes_used_by_source', '2026-10', 'frego', 352, 2),
  ('platform|codes_used_daily|2026-11|2026-11-01', 'platform', 'codes_used_daily', '2026-11', '2026-11-01', 404, 0),
  ('platform|codes_used_daily|2026-11|2026-11-02', 'platform', 'codes_used_daily', '2026-11', '2026-11-02', 278, 1),
  ('platform|codes_used_daily|2026-11|2026-11-03', 'platform', 'codes_used_daily', '2026-11', '2026-11-03', 302, 2),
  ('platform|codes_used_daily|2026-11|2026-11-04', 'platform', 'codes_used_daily', '2026-11', '2026-11-04', 268, 3),
  ('platform|codes_used_daily|2026-11|2026-11-05', 'platform', 'codes_used_daily', '2026-11', '2026-11-05', 271, 4),
  ('platform|codes_used_daily|2026-11|2026-11-06', 'platform', 'codes_used_daily', '2026-11', '2026-11-06', 316, 5),
  ('platform|codes_used_daily|2026-11|2026-11-07', 'platform', 'codes_used_daily', '2026-11', '2026-11-07', 381, 6),
  ('platform|codes_used_daily|2026-11|2026-11-08', 'platform', 'codes_used_daily', '2026-11', '2026-11-08', 408, 7),
  ('platform|codes_used_daily|2026-11|2026-11-09', 'platform', 'codes_used_daily', '2026-11', '2026-11-09', 321, 8),
  ('platform|codes_used_daily|2026-11|2026-11-10', 'platform', 'codes_used_daily', '2026-11', '2026-11-10', 269, 9),
  ('platform|codes_used_daily|2026-11|2026-11-11', 'platform', 'codes_used_daily', '2026-11', '2026-11-11', 313, 10),
  ('platform|codes_used_daily|2026-11|2026-11-12', 'platform', 'codes_used_daily', '2026-11', '2026-11-12', 285, 11),
  ('platform|codes_used_daily|2026-11|2026-11-13', 'platform', 'codes_used_daily', '2026-11', '2026-11-13', 267, 12),
  ('platform|codes_used_daily|2026-11|2026-11-14', 'platform', 'codes_used_daily', '2026-11', '2026-11-14', 380, 13),
  ('platform|codes_used_daily|2026-11|2026-11-15', 'platform', 'codes_used_daily', '2026-11', '2026-11-15', 417, 14),
  ('platform|codes_used_daily|2026-11|2026-11-16', 'platform', 'codes_used_daily', '2026-11', '2026-11-16', 305, 15),
  ('platform|codes_used_daily|2026-11|2026-11-17', 'platform', 'codes_used_daily', '2026-11', '2026-11-17', 270, 16),
  ('platform|codes_used_daily|2026-11|2026-11-18', 'platform', 'codes_used_daily', '2026-11', '2026-11-18', 287, 17),
  ('platform|codes_used_daily|2026-11|2026-11-19', 'platform', 'codes_used_daily', '2026-11', '2026-11-19', 272, 18),
  ('platform|codes_used_daily|2026-11|2026-11-20', 'platform', 'codes_used_daily', '2026-11', '2026-11-20', 318, 19),
  ('platform|codes_used_daily|2026-11|2026-11-21', 'platform', 'codes_used_daily', '2026-11', '2026-11-21', 414, 20),
  ('platform|codes_used_daily|2026-11|2026-11-22', 'platform', 'codes_used_daily', '2026-11', '2026-11-22', 379, 21),
  ('platform|estimate_gap|2026-11|gsm|Quận 1', 'platform', 'estimate_gap', '2026-11', 'gsm|Quận 1', 14, 0),
  ('platform|estimate_gap|2026-11|gsm|Quận 3', 'platform', 'estimate_gap', '2026-11', 'gsm|Quận 3', 9, 1),
  ('platform|estimate_gap|2026-11|gsm|Quận 7', 'platform', 'estimate_gap', '2026-11', 'gsm|Quận 7', 6, 2),
  ('platform|user_compares_30d|2026-11|00000000-0000-4000-8000-000000000001', 'platform', 'user_compares_30d', '2026-11', '00000000-0000-4000-8000-000000000001', 14, 0),
  ('platform|user_compares_30d|2026-11|00000000-0000-4000-8000-000000000002', 'platform', 'user_compares_30d', '2026-11', '00000000-0000-4000-8000-000000000002', 6, 1),
  ('platform|user_compares_30d|2026-11|00000000-0000-4000-8000-000000000003', 'platform', 'user_compares_30d', '2026-11', '00000000-0000-4000-8000-000000000003', 31, 2),
  ('platform|user_compares_30d|2026-11|00000000-0000-4000-8000-000000000004', 'platform', 'user_compares_30d', '2026-11', '00000000-0000-4000-8000-000000000004', 22, 3),
  ('platform|user_compares_30d|2026-11|00000000-0000-4000-8000-0000000a0005', 'platform', 'user_compares_30d', '2026-11', '00000000-0000-4000-8000-0000000a0005', 0, 4),
  ('platform|meta|2026-11|refreshed_at', 'platform', 'meta', '2026-11', 'refreshed_at', 1795344000000, 0),
  ('cp:cp-may-mon-moi|review_check|2026-11|image_width', 'cp:cp-may-mon-moi', 'review_check', '2026-11', 'image_width', 1080, 0),
  ('cp:cp-may-mon-moi|review_check|2026-11|image_height', 'cp:cp-may-mon-moi', 'review_check', '2026-11', 'image_height', 1080, 1),
  ('cp:cp-may-mon-moi|review_check|2026-11|image_phone', 'cp:cp-may-mon-moi', 'review_check', '2026-11', 'image_phone', 0, 2),
  ('cp:cp-may-mon-moi|review_check|2026-11|image_qr', 'cp:cp-may-mon-moi', 'review_check', '2026-11', 'image_qr', 0, 3),
  ('cp:cp-tra-sen-cuoi-tuan|review_check|2026-11|image_width', 'cp:cp-tra-sen-cuoi-tuan', 'review_check', '2026-11', 'image_width', 800, 0),
  ('cp:cp-tra-sen-cuoi-tuan|review_check|2026-11|image_height', 'cp:cp-tra-sen-cuoi-tuan', 'review_check', '2026-11', 'image_height', 800, 1),
  ('cp:cp-tra-sen-cuoi-tuan|review_check|2026-11|image_phone', 'cp:cp-tra-sen-cuoi-tuan', 'review_check', '2026-11', 'image_phone', 0, 2),
  ('cp:cp-tra-sen-cuoi-tuan|review_check|2026-11|image_qr', 'cp:cp-tra-sen-cuoi-tuan', 'review_check', '2026-11', 'image_qr', 0, 3),
  ('cp:cp-tap-sang|review_check|2026-11|image_width', 'cp:cp-tap-sang', 'review_check', '2026-11', 'image_width', 1080, 0),
  ('cp:cp-tap-sang|review_check|2026-11|image_height', 'cp:cp-tap-sang', 'review_check', '2026-11', 'image_height', 1080, 1),
  ('cp:cp-tap-sang|review_check|2026-11|image_phone', 'cp:cp-tap-sang', 'review_check', '2026-11', 'image_phone', 1, 2),
  ('cp:cp-tap-sang|review_check|2026-11|image_qr', 'cp:cp-tap-sang', 'review_check', '2026-11', 'image_qr', 1, 3),
  ('biz:biz-qt-sach-gio-dk|review_check|2026-11|tax_active', 'biz:biz-qt-sach-gio-dk', 'review_check', '2026-11', 'tax_active', 1, 0),
  ('biz:biz-qt-sach-gio-dk|review_check|2026-11|contact_verified', 'biz:biz-qt-sach-gio-dk', 'review_check', '2026-11', 'contact_verified', 1, 1),
  ('biz:biz-qt-sach-gio-dk|review_check|2026-11|license_address_match', 'biz:biz-qt-sach-gio-dk', 'review_check', '2026-11', 'license_address_match', 0, 2),
  ('biz:biz-qt-sach-gio-dk|review_check|2026-11|license_uploaded', 'biz:biz-qt-sach-gio-dk', 'review_check', '2026-11', 'license_uploaded', 1, 3),
  ('platform|wallet_deducted|2026-11|total', 'platform', 'wallet_deducted', '2026-11', 'total', 67808000, 0),
  ('platform|recon_recorded|2026-11|grab', 'platform', 'recon_recorded', '2026-11', 'grab', 2310, 0),
  ('platform|recon_recorded|2026-11|be', 'platform', 'recon_recorded', '2026-11', 'be', 1640, 1),
  ('platform|recon_recorded|2026-11|gsm', 'platform', 'recon_recorded', '2026-11', 'gsm', 170, 2),
  ('platform|recon_recorded|2026-10|grab', 'platform', 'recon_recorded', '2026-10', 'grab', 1700, 0),
  ('platform|recon_recorded|2026-10|be', 'platform', 'recon_recorded', '2026-10', 'be', 1210, 1),
  ('platform|recon_recorded|2026-10|gsm', 'platform', 'recon_recorded', '2026-10', 'gsm', 120, 2),
  ('platform|recon_confirmed|2026-11|grab', 'platform', 'recon_confirmed', '2026-11', 'grab', 2302, 0),
  ('platform|recon_confirmed|2026-11|be', 'platform', 'recon_confirmed', '2026-11', 'be', 1640, 1),
  ('platform|recon_confirmed|2026-11|gsm', 'platform', 'recon_confirmed', '2026-11', 'gsm', 165, 2),
  ('platform|recon_payable|2026-11|grab', 'platform', 'recon_payable', '2026-11', 'grab', 36371600, 0),
  ('platform|recon_payable|2026-11|be', 'platform', 'recon_payable', '2026-11', 'be', 16400000, 1),
  ('platform|recon_payable|2026-11|gsm', 'platform', 'recon_payable', '2026-11', 'gsm', 2475000, 2),
  ('platform|points_awarded|2026-11|total', 'platform', 'points_awarded', '2026-11', 'total', 86200, 0),
  ('platform|points_awarded|2026-10|total', 'platform', 'points_awarded', '2026-10', 'total', 74300, 0),
  ('platform|price_reports|2026-11|total', 'platform', 'price_reports', '2026-11', 'total', 3996, 0),
  ('platform|points_rule_uses|2026-11|tap', 'platform', 'points_rule_uses', '2026-11', 'tap', 2840, 0),
  ('platform|points_rule_uses|2026-11|amount', 'platform', 'points_rule_uses', '2026-11', 'amount', 736, 1),
  ('platform|points_rule_uses|2026-11|receipt', 'platform', 'points_rule_uses', '2026-11', 'receipt', 420, 2),
  ('platform|points_rule_uses|2026-11|daily_cap', 'platform', 'points_rule_uses', '2026-11', 'daily_cap', 12, 3),
  ('platform|reward_redeemed|2026-11|rw-be', 'platform', 'reward_redeemed', '2026-11', 'rw-be', 220, 0),
  ('platform|reward_redeemed|2026-11|rw-gsm', 'platform', 'reward_redeemed', '2026-11', 'rw-gsm', 80, 1),
  ('platform|reward_redeemed|2026-11|rw-grab', 'platform', 'reward_redeemed', '2026-11', 'rw-grab', 64, 2),
  ('platform|frego_code_used|2026-11|fc-welcome', 'platform', 'frego_code_used', '2026-11', 'fc-welcome', 31, 0),
  ('platform|frego_code_used|2026-11|fc-r-be', 'platform', 'frego_code_used', '2026-11', 'fc-r-be', 220, 1),
  ('platform|frego_code_used|2026-11|fc-r-gsm', 'platform', 'frego_code_used', '2026-11', 'fc-r-gsm', 80, 2),
  ('platform|frego_code_used|2026-11|fc-r-grab', 'platform', 'frego_code_used', '2026-11', 'fc-r-grab', 64, 3),
  ('platform|frego_code_budget|2026-11|total', 'platform', 'frego_code_budget', '2026-11', 'total', 10000000, 0),
  ('platform|notif_sent|2026-11|gift', 'platform', 'notif_sent', '2026-11', 'gift', 12960, 0),
  ('platform|notif_sent|2026-11|card', 'platform', 'notif_sent', '2026-11', 'card', 3420, 1),
  ('platform|notif_sent|2026-11|expire', 'platform', 'notif_sent', '2026-11', 'expire', 5870, 2),
  ('platform|notif_sent|2026-11|report', 'platform', 'notif_sent', '2026-11', 'report', 4120, 3),
  ('platform|notif_sent|2026-11|points', 'platform', 'notif_sent', '2026-11', 'points', 3996, 4),
  ('platform|notif_open_rate|2026-11|gift', 'platform', 'notif_open_rate', '2026-11', 'gift', 0.41, 0),
  ('platform|notif_open_rate|2026-11|card', 'platform', 'notif_open_rate', '2026-11', 'card', 0.33, 1),
  ('platform|notif_open_rate|2026-11|expire', 'platform', 'notif_open_rate', '2026-11', 'expire', 0.28, 2),
  ('platform|notif_open_rate|2026-11|report', 'platform', 'notif_open_rate', '2026-11', 'report', 0.62, 3),
  ('platform|notif_open_rate|2026-11|points', 'platform', 'notif_open_rate', '2026-11', 'points', 0.47, 4),
  ('platform|notif_open_rate|2026-11|promo', 'platform', 'notif_open_rate', '2026-11', 'promo', 0.19, 5),
  ('platform|notif_off_rate|2026-11|gift', 'platform', 'notif_off_rate', '2026-11', 'gift', 0.06, 0),
  ('platform|notif_off_rate|2026-11|card', 'platform', 'notif_off_rate', '2026-11', 'card', 0.11, 1),
  ('platform|notif_off_rate|2026-11|expire', 'platform', 'notif_off_rate', '2026-11', 'expire', 0.09, 2),
  ('platform|notif_off_rate|2026-11|report', 'platform', 'notif_off_rate', '2026-11', 'report', 0.04, 3),
  ('platform|notif_off_rate|2026-11|points', 'platform', 'notif_off_rate', '2026-11', 'points', 0.07, 4),
  ('platform|notif_opt_in|2026-11|promo', 'platform', 'notif_opt_in', '2026-11', 'promo', 1880, 0),
  ('platform|partner_linked|2026-11|vpb', 'platform', 'partner_linked', '2026-11', 'vpb', 3240, 0),
  ('platform|partner_linked|2026-11|klb', 'platform', 'partner_linked', '2026-11', 'klb', 610, 1),
  ('platform|partner_linked|2026-11|momo', 'platform', 'partner_linked', '2026-11', 'momo', 5120, 2),
  ('platform|partner_linked|2026-11|zalo', 'platform', 'partner_linked', '2026-11', 'zalo', 1980, 3),
  ('platform|partner_linked|2026-11|shopee', 'platform', 'partner_linked', '2026-11', 'shopee', 870, 4),
  ('platform|partner_linked|2026-11|gmail', 'platform', 'partner_linked', '2026-11', 'gmail', 2150, 5)
on conflict (id) do update set scope = excluded.scope, metric = excluded.metric, period = excluded.period, key = excluded.key, value = excluded.value, sort = excluded.sort;

-- ad_banners (2)
insert into public.ad_banners (id, business_id, image_url, title, body, status, reject_reason, submitted_at, reviewed_at, reviewed_by) values
  ('ad-may-1', 'biz-cafe-may', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22675%22%20viewBox%3D%220%200%201200%20675%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%236B4226%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23B07A4F%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221200%22%20height%3D%22675%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%221010%22%20cy%3D%22150%22%20r%3D%22230%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.10%22%2F%3E%3Ccircle%20cx%3D%221090%22%20cy%3D%22560%22%20r%3D%22160%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%22330%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2288%22%20font-weight%3D%22800%22%20fill%3D%22%23ffffff%22%3EC%C3%A0%20ph%C3%AA%20s%E1%BB%AFa%20%C4%91%C3%A1%3C%2Ftext%3E%3Ctext%20x%3D%2280%22%20y%3D%22420%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2244%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.9%22%3EMua%202%20t%E1%BA%B7ng%201%20%C2%B7%2013%3A00%E2%80%9319%3A00%3C%2Ftext%3E%3C%2Fsvg%3E', 'Cà phê sữa đá mua 2 tặng 1', 'Ghé Cà phê Mây cạnh chợ Bến Thành, đưa màn hình này để được tặng 1 ly khi mua 2. Áp dụng 13:00–19:00.', 'approved', null, '2026-11-18T03:00:00.000Z', '2026-11-19T02:30:00.000Z', 'Vận hành Frego'),
  ('ad-tra-sen-1', 'biz-tra-sen', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22675%22%20viewBox%3D%220%200%201200%20675%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%22%20stop-color%3D%22%232F6B4F%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%236FA47F%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%221200%22%20height%3D%22675%22%20fill%3D%22url(%23g)%22%2F%3E%3Ccircle%20cx%3D%221010%22%20cy%3D%22150%22%20r%3D%22230%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.10%22%2F%3E%3Ccircle%20cx%3D%221090%22%20cy%3D%22560%22%20r%3D%22160%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%2F%3E%3Ctext%20x%3D%2280%22%20y%3D%22330%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2288%22%20font-weight%3D%22800%22%20fill%3D%22%23ffffff%22%3ETr%C3%A0%20sen%20T%C3%A2y%20H%E1%BB%93%3C%2Ftext%3E%3Ctext%20x%3D%2280%22%20y%3D%22420%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2244%22%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.9%22%3EGi%E1%BA%A3m%2015%25%20cho%20kh%C3%A1ch%20%C4%91i%20Be%3C%2Ftext%3E%3C%2Fsvg%3E', 'Trà sen Tây Hồ giảm 15%', 'Khách đến bằng Be được giảm 15% mọi loại trà sen. Quán cách chợ Bến Thành 150 m.', 'pending', null, '2026-11-22T09:30:00.000Z', null, null)
on conflict (id) do update set business_id = excluded.business_id, image_url = excluded.image_url, title = excluded.title, body = excluded.body, status = excluded.status, reject_reason = excluded.reject_reason, submitted_at = excluded.submitted_at, reviewed_at = excluded.reviewed_at, reviewed_by = excluded.reviewed_by;

commit;
