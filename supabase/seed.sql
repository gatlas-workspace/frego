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

-- places (11)
insert into public.places (id, name, address, district, lat, lng) values
  ('landmark81', 'Landmark 81', '720A Điện Biên Phủ, Bình Thạnh', 'Bình Thạnh', 10.7949, 106.7219),
  ('ben-thanh', 'Chợ Bến Thành', 'Đường Lê Lợi, phường Bến Thành', 'Quận 1', 10.7725, 106.698),
  ('ben-thanh-bac', 'Chợ Bến Thành, cửa Bắc', 'Đường Lê Thánh Tôn, phường Bến Thành', 'Quận 1', 10.7731, 106.6979),
  ('cho-dem-ben-thanh', 'Chợ đêm Bến Thành', 'Đường Phan Bội Châu, phường Bến Thành', 'Quận 1', 10.7722, 106.6987),
  ('metro-ben-thanh', 'Ga metro Bến Thành', 'Đường Lê Lợi, phường Bến Thành', 'Quận 1', 10.7716, 106.6991),
  ('tan-son-nhat', 'Sân bay Tân Sơn Nhất', 'Đường Trường Sơn, Tân Bình', 'Tân Bình', 10.8188, 106.6519),
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
  ('be', 'app', 'Be', 'Be', 'Biết khi mã được dùng để nhắc báo giá', 'planned', 6),
  ('grab', 'app', 'Grab', 'Gr', 'Biết khi mã được dùng để nhắc báo giá', 'planned', 7),
  ('gsm', 'app', 'Green SM', 'GS', 'Biết khi mã được dùng để nhắc báo giá', 'planned', 8),
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

-- profiles (6)
insert into public.profiles (avatar_url, birthday, interests, vehicle_prefs, points, saved_amount, saved_count, role, admin_role, status, lock_reason, id, phone, display_name, created_at, onboarded_at) values
  (null, null, '{"cafe","food"}', '{"bike"}', 1250, 85000, 6, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000001', '+84909555123', 'Minh Anh', '2026-08-14T13:10:00.000Z', '2026-08-14T13:14:00.000Z'),
  (null, null, '{}', '{}', 640, 40000, 3, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000002', '+84938222456', 'Gia Huy', '2026-09-02T01:00:00.000Z', '2026-09-02T01:03:00.000Z'),
  (null, null, '{}', '{}', 2180, 30000, 2, 'user', null, 'locked', 'Nhiều báo giá trùng nhau trong thời gian ngắn', '00000000-0000-4000-8000-000000000003', '+84977111789', 'Thu Hà', '2026-10-11T05:00:00.000Z', '2026-10-11T05:02:00.000Z'),
  (null, null, '{}', '{}', 310, 20000, 2, 'user', null, 'active', null, '00000000-0000-4000-8000-000000000004', '+84903444012', 'Quốc Bảo', '2026-10-28T11:30:00.000Z', '2026-10-28T11:31:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'admin', 'ops', 'active', null, '00000000-0000-4000-8000-0000000000a1', '+84327878987', 'Vận hành Frego', '2026-07-01T02:00:00.000Z', '2026-07-01T02:00:00.000Z'),
  (null, null, '{}', '{}', 0, 0, 0, 'user', null, 'active', null, '00000000-0000-4000-8000-0000000000b1', '+84283000482', 'Chủ Cà phê Mây', '2026-09-05T03:00:00.000Z', '2026-09-05T03:00:00.000Z')
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
  ('rs-2', '00000000-0000-4000-8000-000000000001', 'tan-son-nhat', '2026-11-18T23:10:00.000Z'),
  ('rs-3', '00000000-0000-4000-8000-000000000001', 'nguyen-hue', '2026-11-21T12:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, place_id = excluded.place_id, searched_at = excluded.searched_at;

-- linked_accounts (3)
insert into public.linked_accounts (id, user_id, partner_id, card_type, linked_at) values
  ('la-1', '00000000-0000-4000-8000-000000000001', 'vpb', 'credit', '2026-08-20T14:00:00.000Z'),
  ('la-2', '00000000-0000-4000-8000-000000000001', 'momo', null, '2026-08-20T14:02:00.000Z'),
  ('la-3', '00000000-0000-4000-8000-000000000001', 'be', null, '2026-09-01T01:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, partner_id = excluded.partner_id, card_type = excluded.card_type, linked_at = excluded.linked_at;

-- businesses (6)
insert into public.businesses (legal_name, tax_code, representative, industry, address, district, open_hours, status, wallet_balance, auto_topup, invoice_name, invoice_email, contact_email, contact_phone, logo_url, storefront_verified, transfer_code, notify_prefs, joined_at, id, name, category, landmark, lat, lng) values
  ('Hộ kinh doanh Cà phê Mây', '0316742482', 'Nguyễn Thị Mây', 'Ăn uống · Cà phê', 'Đường Lê Thánh Tôn, gần Chợ Bến Thành, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1180000, '{"enabled":true,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Cà phê Mây', 'ketoan@caphemay.vn', 'chu@caphemay.vn', '0283 ••• 482', null, true, 'FREGO CPM1024', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-05T03:00:00.000Z', 'biz-cafe-may', 'Cà phê Mây', 'cafe', 'Chợ Bến Thành', 10.7733, 106.699),
  ('Hộ kinh doanh Quán bún Ngõ Nhỏ', '0316000000', '', 'Ăn uống · Quán bún', 'Đường Tôn Thất Thiệp, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 4250000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Quán bún Ngõ Nhỏ', '', 'ngonho@gmail.com', '', null, true, 'FREGO BNN1031', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-bun-ngo-nho', 'Quán bún Ngõ Nhỏ', 'bowl', 'phố đi bộ Nguyễn Huệ', 10.7752, 106.7036),
  ('Hộ kinh doanh Tiệm trà Sen', '0316000000', '', 'Ăn uống · Trà', 'Đường Phan Chu Trinh, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 2600000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm trà Sen', '', 'trasen@gmail.com', '', null, true, 'FREGO TSE1040', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-tra-sen', 'Tiệm trà Sen', 'tea', 'Chợ Bến Thành', 10.7738, 106.6985),
  ('Công ty TNHH Nhà sách Gió', '0318456789', 'Trần Minh Khoa', 'Bán lẻ · Sách, văn phòng phẩm', 'Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM', 'Quận 3', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 3100000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Nhà sách Gió', '', 'lienhe@nhasachgio.vn', '', null, true, 'FREGO NSG1052', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-sach-gio', 'Nhà sách Gió', 'book', 'Hồ Con Rùa', 10.781, 106.695),
  ('Hộ kinh doanh Phòng tập Nhịp', '0316000000', '', 'Thể thao · Phòng tập', 'Đường Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', 'Bình Thạnh', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 5400000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Phòng tập Nhịp', '', 'nhip@nhipgym.vn', '', null, true, 'FREGO PTN1060', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-tap-nhip', 'Phòng tập Nhịp', 'gym', 'Landmark 81', 10.7942, 106.7205),
  ('Hộ kinh doanh Tiệm bánh Mộc', '0316000000', '', 'Ăn uống · Tiệm bánh', 'Đường Hai Bà Trưng, Quận 1, TP.HCM', 'Quận 1', '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}', 'active', 1950000, '{"enabled":false,"amount":2000000,"threshold":500000}', 'Hộ kinh doanh Tiệm bánh Mộc', '', 'banhmoc@gmail.com', '', null, true, 'FREGO TBM1071', '{"review":true,"lowBalance":true,"weekly":true}', '2026-09-10T02:00:00.000Z', 'biz-banh-moc', 'Tiệm bánh Mộc', 'cake', 'chợ Tân Định', 10.7895, 106.6898)
on conflict (id) do update set legal_name = excluded.legal_name, tax_code = excluded.tax_code, representative = excluded.representative, industry = excluded.industry, address = excluded.address, district = excluded.district, open_hours = excluded.open_hours, status = excluded.status, wallet_balance = excluded.wallet_balance, auto_topup = excluded.auto_topup, invoice_name = excluded.invoice_name, invoice_email = excluded.invoice_email, contact_email = excluded.contact_email, contact_phone = excluded.contact_phone, logo_url = excluded.logo_url, storefront_verified = excluded.storefront_verified, transfer_code = excluded.transfer_code, notify_prefs = excluded.notify_prefs, joined_at = excluded.joined_at, name = excluded.name, category = excluded.category, landmark = excluded.landmark, lat = excluded.lat, lng = excluded.lng;

-- business_members (2)
insert into public.business_members (id, business_id, user_id, email, role, invited_at) values
  ('bm-1', 'biz-cafe-may', '00000000-0000-4000-8000-0000000000b1', 'chu@caphemay.vn', 'owner', '2026-09-05T03:00:00.000Z'),
  ('bm-2', 'biz-cafe-may', null, 'ketoan@caphemay.vn', 'accountant', '2026-09-06T02:00:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, user_id = excluded.user_id, email = excluded.email, role = excluded.role, invited_at = excluded.invited_at;

-- campaigns (11)
insert into public.campaigns (status, reject_reason, radius_m, hours_from, hours_to, only_open_hours, daily_cap, budget, spent, issued_count, used_count, starts_at, ends_at, image_url, submitted_at, approved_at, created_at, id, business_id, name, provider_id, vehicle_class, amount) values
  ('active', null, 500, '13:00', '19:00', true, 40, 10000000, 7176000, 980, 312, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-may-chieu', 'biz-cafe-may', 'Khách chiều quanh Chợ Bến Thành', 'grab', 'car4', 20000),
  ('paused', null, 500, '07:00', '22:00', true, 30, 3000000, 962000, 260, 74, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-may-xe-may', 'biz-cafe-may', 'Xe máy cuối tuần', 'be', 'bike', 10000),
  ('pending', null, 800, '07:00', '22:00', true, 30, 4000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T08:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-may-mon-moi', 'biz-cafe-may', 'Khai trương món mới', 'gsm', 'bike', 15000),
  ('rejected', 'ảnh có số điện thoại và mã QR.', 500, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-12-19T17:00:00.000Z', '2026-12-26T16:59:00.000Z', null, '2026-11-21T13:00:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-may-giang-sinh', 'biz-cafe-may', 'Ưu đãi Giáng sinh', 'grab', 'car4', 25000),
  ('active', null, 1000, '06:00', '21:00', true, 30, 6000000, 2860000, 640, 220, '2026-10-31T17:00:00.000Z', '2026-12-15T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-bun-trua', 'biz-bun-ngo-nho', 'Bữa trưa phố đi bộ', 'grab', 'bike', 10000),
  ('active', null, 300, '08:00', '21:00', true, 30, 3000000, 1170000, 300, 90, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-tra-sen', 'biz-tra-sen', 'Trà chiều Bến Thành', 'be', 'bike', 10000),
  ('pending', null, 300, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T06:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-tra-sen-cuoi-tuan', 'biz-tra-sen', 'Trà chiều cuối tuần', 'be', 'bike', 10000),
  ('active', null, 600, '07:00', '22:00', true, 30, 4000000, 1404000, 410, 78, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-sach-gio', 'biz-sach-gio', 'Đọc sách cuối tuần', 'be', 'bike', 15000),
  ('active', null, 600, '07:00', '22:00', true, 30, 6000000, 2160000, 520, 120, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-tap-nhip', 'biz-tap-nhip', 'Tập tối Landmark', 'gsm', 'car4', 15000),
  ('pending', null, 600, '07:00', '22:00', true, 30, 5000000, 0, 0, 0, '2026-11-30T17:00:00.000Z', '2026-12-31T16:59:00.000Z', null, '2026-11-22T05:45:00.000Z', null, '2026-10-30T02:30:00.000Z', 'cp-tap-sang', 'biz-tap-nhip', 'Tập sáng', 'grab', 'bike', 15000),
  ('active', null, 500, '07:00', '22:00', true, 30, 3000000, 1066000, 330, 82, '2026-10-31T17:00:00.000Z', '2026-11-30T16:59:00.000Z', null, '2026-10-30T03:00:00.000Z', '2026-10-31T02:00:00.000Z', '2026-10-30T02:30:00.000Z', 'cp-banh-moc', 'biz-banh-moc', 'Bánh nóng buổi sáng', 'be', 'bike', 10000)
on conflict (id) do update set status = excluded.status, reject_reason = excluded.reject_reason, radius_m = excluded.radius_m, hours_from = excluded.hours_from, hours_to = excluded.hours_to, only_open_hours = excluded.only_open_hours, daily_cap = excluded.daily_cap, budget = excluded.budget, spent = excluded.spent, issued_count = excluded.issued_count, used_count = excluded.used_count, starts_at = excluded.starts_at, ends_at = excluded.ends_at, image_url = excluded.image_url, submitted_at = excluded.submitted_at, approved_at = excluded.approved_at, created_at = excluded.created_at, business_id = excluded.business_id, name = excluded.name, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount;

-- campaign_events (5)
insert into public.campaign_events (id, campaign_id, at, text) values
  ('ce-1', 'cp-may-chieu', '2026-11-22T01:00:00.000Z', 'Ví còn dưới 1.500.000đ, Frego đã gửi email nhắc nạp'),
  ('ce-2', 'cp-may-chieu', '2026-11-14T15:00:00.000Z', 'Ngày nhiều mã được dùng nhất: 21 mã'),
  ('ce-3', 'cp-may-chieu', '2026-11-06T03:00:00.000Z', 'Tăng ngân sách từ 8.000.000đ lên 10.000.000đ'),
  ('ce-4', 'cp-may-chieu', '2026-10-31T02:00:00.000Z', 'Frego duyệt, bắt đầu chạy từ 01/11'),
  ('ce-5', 'cp-may-chieu', '2026-10-30T03:00:00.000Z', 'Gửi duyệt')
on conflict (id) do update set campaign_id = excluded.campaign_id, at = excluded.at, text = excluded.text;

-- frego_codes (4)
insert into public.frego_codes (id, code, kind, provider_id, vehicle_class, amount, title, valid_days, issued_count, used_count, active) values
  ('fc-frego10', 'FREGO10', 'welcome', 'be', 'bike', 10000, 'Quà chào mừng', 30, 2120, 1640, true),
  ('fc-r-be', 'FRBE10', 'reward', 'be', 'bike', 10000, 'Đổi 500 điểm', 30, 240, 190, true),
  ('fc-r-gsm', 'FRGS15', 'reward', 'gsm', 'bike', 15000, 'Đổi 1.000 điểm', 30, 82, 51, true),
  ('fc-r-grab', 'FRGR20', 'reward', 'grab', 'car4', 20000, 'Đổi 1.500 điểm', 30, 42, 33, true)
on conflict (id) do update set code = excluded.code, kind = excluded.kind, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, title = excluded.title, valid_days = excluded.valid_days, issued_count = excluded.issued_count, used_count = excluded.used_count, active = excluded.active;

-- rewards (3)
insert into public.rewards (id, provider_id, vehicle_class, amount, cost, frego_code_id, redeemed_count, active) values
  ('rw-be', 'be', 'bike', 10000, 500, 'fc-r-be', 240, true),
  ('rw-gsm', 'gsm', 'bike', 15000, 1000, 'fc-r-gsm', 82, true),
  ('rw-grab', 'grab', 'car4', 20000, 1500, 'fc-r-grab', 42, true)
on conflict (id) do update set provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, cost = excluded.cost, frego_code_id = excluded.frego_code_id, redeemed_count = excluded.redeemed_count, active = excluded.active;

-- user_vouchers (2)
insert into public.user_vouchers (id, user_id, source, campaign_id, frego_code_id, code, provider_id, vehicle_class, amount, note, reasons, status, issued_at, expires_at, used_at, trip_id) values
  ('uv-may7k2q', '00000000-0000-4000-8000-000000000001', 'sponsor', 'cp-may-chieu', null, 'MAY7K2Q', 'grab', 'car4', 20000, 'Tặng vì bạn hay đến khu Chợ Bến Thành', '{"4 chuyến có điểm đến quanh Chợ Bến Thành trong 30 ngày qua.","Bạn hay đi vào buổi chiều, lúc quán đang mở cửa."}', 'active', '2026-11-22T08:20:00.000Z', '2026-11-30T16:59:00.000Z', null, null),
  ('uv-frego10', '00000000-0000-4000-8000-000000000001', 'frego', null, 'fc-frego10', 'FREGO10', 'be', 'bike', 10000, 'Quà chào mừng khi bạn tham gia Frego', '{}', 'active', '2026-11-01T01:00:00.000Z', '2026-11-30T16:59:00.000Z', null, null)
on conflict (id) do update set user_id = excluded.user_id, source = excluded.source, campaign_id = excluded.campaign_id, frego_code_id = excluded.frego_code_id, code = excluded.code, provider_id = excluded.provider_id, vehicle_class = excluded.vehicle_class, amount = excluded.amount, note = excluded.note, reasons = excluded.reasons, status = excluded.status, issued_at = excluded.issued_at, expires_at = excluded.expires_at, used_at = excluded.used_at, trip_id = excluded.trip_id;

-- public_codes (5)
insert into public.public_codes (provider_id, vehicle_classes, amount, percent, max_amount, min_fare, requires_partner_id, airport_only, notes, conditions, source_name, source_url, source_title, last_checked_at, expires_at, status, ok_reports_24h, bad_reports_24h, used_count, created_at, id, code, title) values
  ('grab', '{"bike","car4"}', 15000, null, null, 50000, 'vpb', false, '{"1 lần mỗi tháng"}', '{"Thanh toán bằng thẻ VPBank đã liên kết vào Grab.","Chuyến GrabBike hoặc GrabCar từ 50.000đ.","Mỗi người dùng được 1 mã mỗi tháng.","Dùng chung được với các ưu đãi khác của Grab.","Chỉ áp dụng trên phiên bản app Grab mới nhất."}', 'grab.com', 'https://www.grab.com/vn/blog/uu-dai-the-vpbank/', 'Ưu đãi thẻ VPBank trên Grab', '2026-11-22T08:45:00.000Z', null, 'live', 18, 2, 1260, '2026-10-01T02:00:00.000Z', 'pc-vpb', 'VPBTRANSPORT', 'Giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ'),
  ('grab', '{"car4"}', null, 0.1, 30000, 160000, null, false, '{"Mọi cách thanh toán","Có thể hết sớm"}', '{"Chuyến GrabCar từ 160.000đ.","Giảm 10%, tối đa 30.000đ.","Số lượng có hạn mỗi ngày."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi chuyến xa GrabCar', '2026-11-22T05:45:00.000Z', null, 'live', 9, 0, 640, '2026-10-01T02:00:00.000Z', 'pc-chuyenxacar', 'CHUYENXACAR', 'Giảm 10%, tối đa 30.000đ cho GrabCar từ 160.000đ'),
  ('grab', '{"car4","car7"}', null, 0.2, 50000, 200000, null, true, '{"Đi, đến sân bay","Giới hạn lượt mỗi ngày"}', '{"Điểm đón hoặc điểm đến là sân bay.","Chuyến GrabCar từ 200.000đ.","Giảm 20%, tối đa 50.000đ."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi đi sân bay', '2026-11-21T13:00:00.000Z', null, 'live', 4, 0, 310, '2026-10-01T02:00:00.000Z', 'pc-sanbay', 'SANBAY', 'Giảm 20%, tối đa 50.000đ cho GrabCar từ 200.000đ'),
  ('grab', '{"bike"}', 15000, null, null, 40000, 'klb', false, '{"1 lần mỗi ngày"}', '{"Thanh toán bằng thẻ KienLongBank.","Chuyến GrabBike từ 40.000đ.","Mỗi ngày 1 lần."}', 'grab.com', 'https://www.grab.com/vn/promo/', 'Ưu đãi thẻ KienLongBank', '2026-11-22T07:45:00.000Z', null, 'live', 6, 0, 400, '2026-10-01T02:00:00.000Z', 'pc-klbike', 'KLBIKE', 'Giảm 15.000đ cho GrabBike từ 40.000đ'),
  ('be', '{"bike"}', 12000, null, null, null, null, false, '{"Tự ẩn do nhiều người báo lỗi"}', '{}', 'facebook.com/be', 'https://www.facebook.com/', 'Bài đăng khuyến mãi', '2026-11-22T02:00:00.000Z', null, 'hidden', 1, 14, 0, '2026-10-01T02:00:00.000Z', 'pc-benxe', 'BENXE', 'Giảm 12.000đ cho beBike')
on conflict (id) do update set provider_id = excluded.provider_id, vehicle_classes = excluded.vehicle_classes, amount = excluded.amount, percent = excluded.percent, max_amount = excluded.max_amount, min_fare = excluded.min_fare, requires_partner_id = excluded.requires_partner_id, airport_only = excluded.airport_only, notes = excluded.notes, conditions = excluded.conditions, source_name = excluded.source_name, source_url = excluded.source_url, source_title = excluded.source_title, last_checked_at = excluded.last_checked_at, expires_at = excluded.expires_at, status = excluded.status, ok_reports_24h = excluded.ok_reports_24h, bad_reports_24h = excluded.bad_reports_24h, used_count = excluded.used_count, created_at = excluded.created_at, code = excluded.code, title = excluded.title;

-- trips (4)
insert into public.trips (user_id, origin_label, origin_place_id, distance_km, duration_min, attached, chosen_service, estimate_low, estimate_high, compared_count, status, verdict, paid_amount, report_source, points_awarded, opened_at, code_used_at, reported_at, id, dest_place_id, dest_label, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Landmark 81', 'landmark81', 5.8, 20, '[{"service":"be-bike","source":"frego","refId":"uv:uv-frego10","code":"FREGO10","label":"FREGO10","amount":10000}]', 'be-bike', 21000, 26000, 3, 'code_used', null, null, null, 0, '2026-11-22T10:41:00.000Z', '2026-11-22T11:05:00.000Z', null, 'trip-today', 'ben-thanh', 'Chợ Bến Thành', '2026-11-22T10:40:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Phố đi bộ Nguyễn Huệ', 'nguyen-hue', 2.1, 9, '{}', null, null, null, 3, 'compared', null, null, null, 0, null, null, null, 'trip-yday-eve', 'ho-con-rua', 'Hồ Con Rùa', '2026-11-21T12:05:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Nhà', 'nha-minh-anh', 5.8, 20, '{}', 'grab-car4', 75000, 86000, 3, 'reported', 'within', 78000, 'receipt', 50, '2026-11-21T01:16:00.000Z', '2026-11-21T01:40:00.000Z', '2026-11-21T01:52:00.000Z', 'trip-yday-am', 'cty-minh-anh', 'Công ty', '2026-11-21T01:15:00.000Z'),
  ('00000000-0000-4000-8000-000000000001', 'Chợ Tân Định', 'cho-tan-dinh', 3.4, 13, '[{"service":"be-bike","source":"sponsor","refId":"cp:cp-banh-moc","code":"MOC4H8T","label":"Tiệm bánh Mộc","amount":10000}]', 'be-bike', 21000, 25000, 3, 'reported', 'within', 24000, 'amount', 50, '2026-11-20T05:31:00.000Z', '2026-11-20T05:50:00.000Z', '2026-11-20T06:10:00.000Z', 'trip-fri', 'nha-minh-anh', 'Nhà', '2026-11-20T05:30:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, origin_label = excluded.origin_label, origin_place_id = excluded.origin_place_id, distance_km = excluded.distance_km, duration_min = excluded.duration_min, attached = excluded.attached, chosen_service = excluded.chosen_service, estimate_low = excluded.estimate_low, estimate_high = excluded.estimate_high, compared_count = excluded.compared_count, status = excluded.status, verdict = excluded.verdict, paid_amount = excluded.paid_amount, report_source = excluded.report_source, points_awarded = excluded.points_awarded, opened_at = excluded.opened_at, code_used_at = excluded.code_used_at, reported_at = excluded.reported_at, dest_place_id = excluded.dest_place_id, dest_label = excluded.dest_label, created_at = excluded.created_at;

-- points_ledger (5)
insert into public.points_ledger (id, user_id, delta, reason, trip_id, created_at) values
  ('pe-1', '00000000-0000-4000-8000-000000000001', 50, 'Nhập số tiền chuyến Be, trả 24.000đ', 'trip-fri', '2026-11-20T06:10:00.000Z'),
  ('pe-2', '00000000-0000-4000-8000-000000000001', 10, 'Báo giá một chạm, Grab ô tô', null, '2026-11-19T02:00:00.000Z'),
  ('pe-3', '00000000-0000-4000-8000-000000000001', 10, 'Báo giá một chạm, Be xe máy', null, '2026-11-15T11:00:00.000Z'),
  ('pe-4', '00000000-0000-4000-8000-000000000001', 50, 'Biên nhận email, Grab ô tô 78.000đ', 'trip-yday-am', '2026-11-12T02:00:00.000Z'),
  ('pe-0', '00000000-0000-4000-8000-000000000001', 1130, 'Điểm tích lũy trước đó', null, '2026-10-31T17:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, delta = excluded.delta, reason = excluded.reason, trip_id = excluded.trip_id, created_at = excluded.created_at;

-- notifications (5)
insert into public.notifications (id, user_id, category, kind, icon, tone, logo, title, body, cta, link, created_at, read_at) values
  ('nt-used', '00000000-0000-4000-8000-000000000001', 'trip', 'code_used', 'receipt', 'tint', 'be', 'Mã FREGO10 đã được dùng cho chuyến Be', 'Giá thật tiết kiệm được bao nhiêu? Báo giá để được cộng điểm.', 'Báo giá ›', '/bao-gia/trip-today', '2026-11-22T11:05:00.000Z', null),
  ('nt-gift', '00000000-0000-4000-8000-000000000001', 'voucher', 'gift', 'gift', 'deal', 'cafe', 'Cà phê Mây tặng bạn voucher −20.000đ', 'Dùng cho chuyến Grab ô tô đến khu Chợ Bến Thành, hạn 30/11.', 'Xem mã ›', '/voucher/uv-may7k2q', '2026-11-22T08:20:00.000Z', null),
  ('nt-card', '00000000-0000-4000-8000-000000000001', 'voucher', 'card_match', 'card2', 'deal', 'grab', 'Mã mới hợp thẻ VPBank của bạn', 'VPBTRANSPORT giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ.', 'Chi tiết ›', '/ma/pc-vpb', '2026-11-22T02:12:00.000Z', null),
  ('nt-points', '00000000-0000-4000-8000-000000000001', 'trip', 'points', 'sparkplus', 'tint', 'frego', 'Bạn được cộng 50 điểm', 'Cảm ơn bạn đã báo giá chuyến Grab ô tô Nhà → Công ty. Bạn đang có 1.250 điểm.', 'Đổi voucher ›', '/diem-thuong', '2026-11-21T01:52:00.000Z', '2026-11-21T02:00:00.000Z'),
  ('nt-gsm', '00000000-0000-4000-8000-000000000001', 'voucher', 'promo', 'tag', 'deal', 'gsm', 'Green SM giảm 25% mọi chuyến', 'Tự áp đến hết 28/02/2027, không cần nhập mã.', 'Xem trong Ví ›', '/vi', '2026-11-08T03:00:00.000Z', '2026-11-08T05:00:00.000Z')
on conflict (id) do update set user_id = excluded.user_id, category = excluded.category, kind = excluded.kind, icon = excluded.icon, tone = excluded.tone, logo = excluded.logo, title = excluded.title, body = excluded.body, cta = excluded.cta, link = excluded.link, created_at = excluded.created_at, read_at = excluded.read_at;

-- wallet_transactions (2)
insert into public.wallet_transactions (id, business_id, kind, amount, note, status, reference, created_at) values
  ('wt-1', 'biz-cafe-may', 'deduction', -391000, 'Trừ 17 mã ngày 21/11', 'done', null, '2026-11-21T17:05:00.000Z'),
  ('wt-2', 'biz-cafe-may', 'topup', 5000000, 'Nạp chuyển khoản', 'pending', 'FREGO CPM1024', '2026-11-21T09:20:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, kind = excluded.kind, amount = excluded.amount, note = excluded.note, status = excluded.status, reference = excluded.reference, created_at = excluded.created_at;

-- invoices (2)
insert into public.invoices (id, business_id, month, amount, status, issued_at) values
  ('inv-2026-11', 'biz-cafe-may', '2026-11', 8138000, 'draft', null),
  ('inv-2026-10', 'biz-cafe-may', '2026-10', 1677000, 'issued', '2026-11-01T01:00:00.000Z')
on conflict (id) do update set business_id = excluded.business_id, month = excluded.month, amount = excluded.amount, status = excluded.status, issued_at = excluded.issued_at;

-- support_tickets (1)
insert into public.support_tickets (id, requester_name, requester_kind, topic, subject, status, due_at, created_at) values
  ('st-1', 'Gia Huy', 'user', 'points', 'Chưa được cộng điểm báo giá', 'open', null, '2026-11-22T01:30:00.000Z')
on conflict (id) do update set requester_name = excluded.requester_name, requester_kind = excluded.requester_kind, topic = excluded.topic, subject = excluded.subject, status = excluded.status, due_at = excluded.due_at, created_at = excluded.created_at;

-- audit_logs (1)
insert into public.audit_logs (id, actor_name, actor_role, action, created_at) values
  ('al-1', 'Vận hành Frego', 'ops', 'Xem chi tiết người dùng Minh Anh', '2026-11-22T03:02:00.000Z')
on conflict (id) do update set actor_name = excluded.actor_name, actor_role = excluded.actor_role, action = excluded.action, created_at = excluded.created_at;

commit;
