-- Test phân quyền và lệnh RPC theo từng vai trò (chạy bằng supabase/tests/run-local.sh).
-- Mỗi khối đóng vai một người dùng bằng request.jwt.claims như Supabase.

create or replace function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false);
  execute 'set role authenticated';
end $$;

create or replace function pg_temp.reset() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', false);
end $$;

-- Số kỳ vọng tính từ dữ liệu (seed có thể thêm dòng), đọc bằng quyền chủ CSDL trước khi đóng vai.
create temp table expect as select
  (select count(*) from public.businesses where status in ('active', 'locked')) as biz_public,
  (select count(*) from public.campaigns where status = 'active' and spent < budget and starts_at <= now() and ends_at > now()) as offering,
  (select count(*) from public.public_codes where status = 'live') as live_codes,
  (select count(*) from public.places) as places,
  (select count(*) from public.profiles) as profiles,
  (select count(*) from public.businesses) as businesses,
  (select count(*) from public.user_vouchers where user_id = '00000000-0000-4000-8000-000000000001') as ma_vouchers,
  (select count(*) from public.trips where user_id = '00000000-0000-4000-8000-000000000001') as ma_trips,
  (select count(*) from public.notifications where user_id = '00000000-0000-4000-8000-000000000001' and read_at is null) as ma_unread,
  (select count(*) from public.campaigns where business_id = 'biz-cafe-may') as may_campaigns,
  (select count(*) from public.wallet_transactions where business_id = 'biz-cafe-may') as may_tx,
  (select wallet_balance from public.businesses where id = 'biz-cafe-may') as may_balance,
  (select amount from public.wallet_transactions where id = 'wt-2') as wt2_amount,
  (select count(*) from public.audit_logs) as audit_before,
  (select count(*) from public.trips where user_id = '00000000-0000-4000-8000-000000000002') as gh_trips,
  (select count(*) from public.user_vouchers where user_id = '00000000-0000-4000-8000-000000000002') as gh_vouchers,
  (select points from public.profiles where id = '00000000-0000-4000-8000-000000000002') as gh_points;
grant select on expect to anon, authenticated;

-- ───────────── Khách chưa đăng nhập (anon) ─────────────
set role anon;
do $$ begin
  assert (select count(*) from public.places) = (select places from expect), 'anon đọc được danh mục địa điểm';
  assert (select count(*) from public.businesses_public) = (select biz_public from expect), 'anon thấy thông tin quán công khai';
  assert (select count(*) from public.campaigns_public where offering) = (select offering from expect), 'anon thấy chiến dịch đang phát mã';
  assert (select count(*) from public.public_codes) = (select live_codes from expect), 'mã công khai bị ẩn không hiện';
end $$;
do $$ begin
  perform 1 from public.profiles;
  raise exception 'anon không được đọc profiles';
exception when insufficient_privilege then null;
end $$;
reset role;

-- ───────────── Người dùng app: Minh Anh ─────────────
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000001'); end $$;
do $$
declare r jsonb; v_trip jsonb; n int;
begin
  assert (select count(*) from public.profiles) = 1, 'chỉ thấy hồ sơ của mình';
  assert (select points from public.profiles) = 1250, 'điểm ban đầu 1.250';
  assert (select count(*) from public.user_vouchers) = (select ma_vouchers from expect), 'chỉ thấy ví của mình';
  assert (select count(*) from public.trips) = (select ma_trips from expect), 'chỉ thấy chuyến của mình';
  assert (select count(*) from public.businesses) = 0, 'không đọc bảng businesses (ví, mã số thuế)';
  assert (select count(*) from public.redemptions) = 0, 'không đọc redemptions';
  assert (select count(*) from public.notifications where read_at is null) = (select ma_unread from expect), 'thông báo chưa đọc của mình';

  -- Báo giá chuyến hôm nay: +10 một chạm, +50 nhập số tiền, không cộng lần hai.
  r := public.report_price('{"tripId":"trip-today","verdict":"within"}');
  assert (r->>'points_awarded')::int = 10, 'một chạm +10';
  r := public.report_price('{"tripId":"trip-today","paidAmount":15000}');
  assert (r->>'points_awarded')::int = 50 and (r->>'points')::int = 1310, 'nhập số tiền +50 → 1.310';
  r := public.report_price('{"tripId":"trip-today","verdict":"cheaper"}');
  assert (r->>'points_awarded')::int = 0, 'không cộng điểm hai lần';

  -- Chuyến khác: số tiền lệch quá 30% so với ước tính → không cộng điểm.
  r := public.report_price('{"tripId":"trip-fri","paidAmount":24000}');
  assert (r->>'points_awarded')::int = 0, 'chuyến đã báo giá không cộng lại';

  -- Đổi điểm.
  r := public.redeem_reward('{"rewardId":"rw-be"}');
  assert (r->>'points')::int = 810, 'đổi 500 điểm còn 810';
  assert (r->'voucher'->>'code') = 'FRBE10', 'nhận mã đổi điểm';

  -- Ghi chuyến có ưu đãi chiến dịch → phát mã riêng.
  v_trip := public.record_trip('{"originLabel":"Landmark 81","originPlaceId":"landmark81","destPlaceId":"ben-thanh","destLabel":"Chợ Bến Thành","distanceKm":5.8,"durationMin":20,"attached":[{"service":"grab-bike","source":"sponsor","refId":"cp:cp-bun-trua","code":"","label":"Quán bún Ngõ Nhỏ","amount":10000}],"chosenService":"grab-bike","estimateLow":25000,"estimateHigh":30000,"comparedCount":3}');
  assert v_trip->>'status' = 'opened', 'chuyến đã mở app hãng';
  assert (v_trip->'attached'->0->>'code') ~ '^NHO[A-Z0-9]{4}$', 'mã phát theo tên quán';
  assert (select count(*) from public.user_vouchers where campaign_id = 'cp-bun-trua') = 1, 'voucher mới nằm trong ví';

  r := public.mark_code_used(jsonb_build_object('tripId', v_trip->>'id'));
  assert r->'trip'->>'status' = 'code_used', 'mã đã dùng';
  assert (r->'notification'->>'title') like 'Mã NHO% vừa được dùng cho chuyến Grab', 'có thông báo nhắc báo giá';
  assert (select saved_amount from public.profiles) = 95000, 'cộng tiền đã tiết kiệm';
  r := public.report_price(jsonb_build_object('tripId', v_trip->>'id', 'paidAmount', 90000));
  assert (r->>'points_awarded')::int = 0 and r->>'held' like '%lệch hơn 30%%', 'lệch quá 30% thì giữ điểm';

  -- Bình chọn mã công khai.
  r := public.vote_public_code('{"publicCodeId":"pc-vpb","works":true}');
  assert (r->>'ok')::int = 19, 'thêm lượt dùng được';

  r := public.mark_all_notifications_read('{}');
  assert (select count(*) from public.notifications where read_at is null) = 0, 'đã đọc hết';

  -- Quà chào mừng không phát lại.
  assert public.ensure_welcome_voucher('{}') is null, 'FREGO20 không phát lần hai';
end $$;

-- Không tự sửa điểm.
do $$ begin
  update public.profiles set points = 999999;
  raise exception 'người dùng không được sửa điểm';
exception when insufficient_privilege then null;
end $$;
-- Được sửa tên gọi.
do $$ begin
  update public.profiles set display_name = 'Minh Anh Nguyễn';
  assert (select display_name from public.profiles) = 'Minh Anh Nguyễn', 'sửa được tên gọi';
end $$;
-- Không tự tạo voucher.
do $$ begin
  insert into public.user_vouchers (user_id, source, code, provider_id, vehicle_class, amount, expires_at)
  values ('00000000-0000-4000-8000-000000000001', 'frego', 'FREE', 'be', 'bike', 99000, now() + interval '1 day');
  raise exception 'người dùng không được tự tạo voucher';
exception when insufficient_privilege then null;
end $$;
-- Không gọi được lệnh quản trị.
do $$ begin
  perform public.adjust_points('{"userId":"00000000-0000-4000-8000-000000000001","delta":1000,"reason":"x"}');
  raise exception 'người dùng không được gọi adjust_points';
exception when insufficient_privilege then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Quà chào mừng: còn suất thì phát, hết suất thì dừng.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000002'); end $$;
do $$
declare r jsonb;
begin
  r := public.ensure_welcome_voucher('{}');
  assert r->>'code' = 'FREGO20' and (r->>'amount')::int = 20000, 'Gia Huy nhận FREGO20 −20.000đ';
end $$;
do $$ begin perform pg_temp.reset(); end $$;
update public.frego_codes set issued_count = quota where kind = 'welcome';
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000004'); end $$;
do $$ begin
  assert public.ensure_welcome_voucher('{}') is null, 'hết 50 suất thì không phát';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Người dùng khác không thấy dữ liệu của Minh Anh.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000002'); end $$;
do $$ begin
  assert (select count(*) from public.trips) = (select gh_trips from expect), 'Gia Huy chỉ thấy chuyến của mình';
  assert (select count(*) from public.trips where user_id <> auth.uid()) = 0, 'Gia Huy không thấy chuyến của Minh Anh';
  assert (select count(*) from public.user_vouchers) = (select gh_vouchers + 1 from expect), 'Gia Huy chỉ thấy ví của mình (thêm quà chào mừng)';
  assert (select count(*) from public.profiles) = 1, 'Gia Huy chỉ thấy hồ sơ của mình';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- ───────────── Chủ quán: Cà phê Mây ─────────────
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
do $$
declare b jsonb;
begin
  assert (select count(*) from public.businesses) = 1, 'chỉ thấy quán của mình';
  assert (select wallet_balance from public.businesses) = (select may_balance from expect), 'thấy số dư ví của quán';
  assert (select count(*) from public.campaigns) = (select may_campaigns from expect), 'chỉ thấy chiến dịch của Cà phê Mây';
  assert (select count(*) from public.user_vouchers) = 0, 'không thấy người nhận mã';
  assert (select count(*) from public.profiles) = 1, 'không thấy hồ sơ người dùng khác';
  assert (select count(*) from public.redemptions) = 0, 'không thấy từng lượt dùng mã';
  assert (select count(*) from public.wallet_transactions) = (select may_tx from expect), 'chỉ thấy giao dịch ví của quán';

  -- Tạm dừng rồi chạy tiếp chiến dịch đã duyệt; đổi ngân sách không cần duyệt lại.
  update public.campaigns set status = 'paused' where id = 'cp-may-chieu';
  update public.campaigns set status = 'active', budget = 15000000 where id = 'cp-may-chieu';
  assert (select status from public.campaigns where id = 'cp-may-chieu') = 'active', 'chạy tiếp được';
  -- Đổi mức giảm khi đang chạy → chờ duyệt lại.
  update public.campaigns set amount = 25000 where id = 'cp-may-xe-may';
  assert (select status from public.campaigns where id = 'cp-may-xe-may') = 'pending', 'đổi mức giảm phải duyệt lại';
  -- Báo đã chuyển khoản.
  insert into public.wallet_transactions (business_id, kind, amount, note, status, reference)
  values ('biz-cafe-may', 'topup', 2000000, 'Nạp chuyển khoản', 'pending', 'FREGO CPM1024');
end $$;
-- Không tự duyệt chiến dịch.
do $$ begin
  update public.campaigns set status = 'active' where id = 'cp-may-mon-moi';
  raise exception 'chủ quán không được tự duyệt';
exception when insufficient_privilege then null;
end $$;
-- Không tự chạy lại chiến dịch Frego đã dừng.
do $$ begin
  update public.campaigns set status = 'paused', paused_by = 'frego' where id = 'cp-may-chieu';
exception when others then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;
update public.campaigns set status = 'paused', paused_by = 'frego' where id = 'cp-may-chieu';
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
do $$ begin
  update public.campaigns set status = 'active' where id = 'cp-may-chieu';
  raise exception 'chủ quán không được chạy lại chiến dịch Frego đã dừng';
exception when insufficient_privilege then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;
update public.campaigns set status = 'active', paused_by = null where id = 'cp-may-chieu';
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
-- Không tự sửa số dư ví.
do $$ begin
  update public.businesses set wallet_balance = 99999999;
  raise exception 'chủ quán không được sửa số dư';
exception when insufficient_privilege then null;
end $$;
-- Không sửa quán khác.
do $$ begin
  update public.businesses set name = 'X' where id = 'biz-tra-sen';
  assert (select count(*) from public.businesses where name = 'X') = 0, 'không sửa được quán khác';
end $$;
-- Không tự khớp tiền nạp.
do $$ begin
  perform public.confirm_topup('{"transactionId":"wt-2"}');
  raise exception 'chủ quán không được khớp tiền';
exception when insufficient_privilege then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- ───────────── Quản trị: Vận hành Frego ─────────────
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1'); end $$;
do $$
declare r jsonb;
begin
  assert (select count(*) from public.profiles) = (select profiles from expect), 'quản trị thấy mọi người dùng';
  assert (select count(*) from public.businesses) >= (select businesses from expect), 'quản trị thấy mọi doanh nghiệp';
  assert (select count(*) from public.redemptions) >= 1, 'quản trị thấy lượt dùng mã';
  r := public.confirm_topup('{"transactionId":"wt-2"}');
  assert (r->>'balance')::bigint = (select may_balance + wt2_amount from expect), 'khớp nạp tiền cộng vào ví';
  update public.campaigns set status = 'active', approved_at = now() where id = 'cp-may-mon-moi';
  assert (select status from public.campaigns where id = 'cp-may-mon-moi') = 'active', 'quản trị duyệt chiến dịch';
  r := public.set_user_status('{"userId":"00000000-0000-4000-8000-000000000004","status":"locked","reason":"thử"}');
  assert r->>'status' = 'locked', 'tạm khóa người dùng';
  r := public.adjust_points('{"userId":"00000000-0000-4000-8000-000000000002","delta":50,"reason":"Bù điểm báo giá"}');
  assert (r->>'points')::int = (select gh_points + 50 from expect), 'điều chỉnh điểm';
  assert (select count(*) from public.audit_logs) >= (select audit_before + 3 from expect), 'thao tác quản trị được ghi nhật ký';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Người dùng bị khóa không báo giá được.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000003'); end $$;
do $$ begin
  assert (select status from public.profiles) = 'locked', 'Thu Hà đang bị khóa';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- ───────────── Banner quảng cáo + lượt xem (migration 20261127000800_ad_banners) ─────────────

-- Khách / người dùng app chỉ thấy banner đã duyệt qua view công khai.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000001'); end $$;
do $$ begin
  assert (select count(*) from public.ad_banners) = 0, 'người dùng app không đọc bảng ad_banners';
  assert (select count(*) from public.ad_banners_public) = 1, 'view công khai chỉ có banner đã duyệt (Cà phê Mây)';
  assert (select business_id from public.ad_banners_public) = 'biz-cafe-may', 'banner đã duyệt là của Cà phê Mây';
end $$;
-- Lượt xem: chuyến Grab ô tô có mã tặng riêng của Cà phê Mây → cộng 1 lần, gọi lại không cộng.
do $$
declare t jsonb; r jsonb;
begin
  t := public.record_trip(jsonb_build_object(
    'originLabel', 'Landmark 81', 'destPlaceId', 'ben-thanh', 'destLabel', 'Chợ Bến Thành', 'distanceKm', 5.8, 'durationMin', 20,
    'attached', jsonb_build_array(jsonb_build_object('service', 'grab-car4', 'source', 'sponsor', 'refId', 'uv:uv-may7k2q',
      'code', 'MAY7K2Q', 'label', 'Cà phê Mây', 'amount', 20000)),
    'chosenService', 'grab-car4', 'comparedCount', 3));
  r := public.record_ad_view(jsonb_build_object('tripId', t->>'id'));
  assert (r->>'counted')::boolean, 'chuyến có mã của quán tài trợ được tính 1 lượt xem';
  assert r->>'campaignId' = 'cp-may-chieu', 'tính cho đúng chiến dịch';
  r := public.record_ad_view(jsonb_build_object('tripId', t->>'id'));
  assert not (r->>'counted')::boolean, 'mỗi chuyến chỉ tính 1 lần';
end $$;
-- Không ghi lượt xem cho chuyến của người khác.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000002'); end $$;
do $$ begin
  perform public.record_ad_view(jsonb_build_object('tripId', (select id from public.trips limit 1)));
  raise exception 'không được ghi lượt xem cho chuyến không phải của mình';
exception when insufficient_privilege then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;
do $$ begin
  assert (select ad_view_count from public.campaigns where id = 'cp-may-chieu') = 87, 'ad_view_count 86 → 87 sau một lượt';
end $$;

-- Chủ quán: gửi banner chờ duyệt; không tự duyệt, không sửa, không đếm lượt xem, không đụng quán khác.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
do $$ begin
  insert into public.ad_banners (business_id, image_url, title, body) values ('biz-cafe-may', 'storage:ad-uploads/biz-cafe-may/x.png', 'Bánh mới', 'Thử');
  assert (select count(*) from public.ad_banners where business_id = 'biz-cafe-may') = 2, 'chủ quán thấy banner của quán mình';
  assert (select count(*) from public.ad_banners where business_id = 'biz-tra-sen') = 0, 'không thấy banner quán khác';
end $$;
do $$ begin
  insert into public.ad_banners (business_id, image_url, title, status) values ('biz-cafe-may', 'x', 'Tự duyệt', 'approved');
  raise exception 'chủ quán không được tự duyệt banner';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into public.ad_banners (business_id, image_url, title) values ('biz-tra-sen', 'x', 'Quán khác');
  raise exception 'chủ quán không được gửi banner cho quán khác';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  update public.ad_banners set status = 'approved' where business_id = 'biz-cafe-may' and status = 'pending';
  assert (select count(*) from public.ad_banners where status = 'approved' and title = 'Bánh mới') = 0, 'chủ quán không sửa được banner';
end $$;
do $$ begin
  update public.campaigns set ad_view_count = 99999 where id = 'cp-may-chieu';
  raise exception 'chủ quán không được sửa lượt xem';
exception when insufficient_privilege then null;
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Quản trị ops duyệt banner chờ của Tiệm trà Sen.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1'); end $$;
do $$ begin
  update public.ad_banners set status = 'approved', reviewed_at = now(), reviewed_by = 'Vận hành Frego' where id = 'ad-tra-sen-1';
  assert (select count(*) from public.ad_banners_public) = 2, 'banner vừa duyệt hiện ở view công khai';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- ───────────── UI v3: giới thiệu bạn bè, ảnh bìa, ảnh tại quán (20261127001200_v3_referral_cover_photo.sql) ─────────────

-- Hồ sơ cũ có mã giới thiệu; seed giữ đúng mã mẫu.
do $$ begin
  assert (select count(*) from public.profiles where referral_code is null) = 0, 'mọi hồ sơ có mã giới thiệu';
  assert (select referral_code from public.profiles where id = '00000000-0000-4000-8000-000000000001') = 'MINHA7K', 'mã mẫu của Minh Anh';
end $$;

-- Tài khoản mới (đăng nhập số điện thoại hôm nay) để thử nhập mã.
insert into auth.users (instance_id, id, aud, role, phone, created_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000d1', 'authenticated', 'authenticated', '84900000001', now());
update public.profiles set display_name = 'Tú Lê' where id = '00000000-0000-4000-8000-0000000000d1';
do $$ begin
  assert (select referral_code from public.profiles where id = '00000000-0000-4000-8000-0000000000d1') ~ '^TUL[A-Z2-9]{3}$', 'mã sinh theo tên (TUL + 3 ký tự)';
end $$;

-- Khách chưa đăng nhập: chỉ đọc tên đã che của chủ mã, không đọc bảng referrals.
set role anon;
do $$ begin
  assert public.referral_owner_name('{"code":"minha7k"}')->>'owner_name' = 'Minh A.', 'trang mời: tên chủ mã đã che';
  assert public.referral_owner_name('{"code":"KHONGCO"}')->>'owner_name' is null, 'mã không có → null';
  assert public.active_home_cover('{}') is null, 'chưa có ảnh bìa → null';
end $$;
do $$ begin
  perform 1 from public.referrals;
  raise exception 'anon không được đọc referrals';
exception when insufficient_privilege then null;
end $$;
reset role;

do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000d1'); end $$;
do $$
declare r jsonb; t jsonb;
begin
  r := public.check_referral_code('{"code":"lan7qx"}');
  assert (r->>'ok')::boolean and r->>'owner_name' = 'Lan N.', 'LAN7QX hợp lệ, tên đã che';
  r := public.check_referral_code(jsonb_build_object('code', (select referral_code from public.profiles)));
  assert r->>'reason' = 'own', 'không tự nhập mã của mình';
  r := public.check_referral_code('{"code":"ZZZZZZ"}');
  assert r->>'reason' = 'not_found' and r->>'message' like 'Không tìm thấy mã%', 'mã sai';
  r := public.apply_referral_code('{"code":"LAN7QX"}');
  assert r->>'owner_name' = 'Lan N.', 'nhập mã thành công';
  begin
    perform public.apply_referral_code('{"code":"MINHA7K"}');
    raise exception 'không được nhập mã lần hai';
  exception when raise_exception then
    if sqlerrm not like 'Bạn đã nhập mã giới thiệu rồi%' then raise; end if;
  end;
  assert (select count(*) from public.referrals) = 1, 'chỉ thấy lượt của mình';

  -- Báo giá chuyến đầu được cộng điểm → +100 cho người mới (ngoài điểm báo giá).
  t := public.record_trip('{"originLabel":"Nhà","destPlaceId":"ben-thanh","destLabel":"Chợ Bến Thành","distanceKm":3,"durationMin":10,"attached":[],"chosenService":"grab-bike","comparedCount":3}');
  r := public.report_price(jsonb_build_object('tripId', t->>'id', 'verdict', 'within'));
  assert (r->>'points')::int = (r->>'points_awarded')::int + 100, 'người mới +100 điểm giới thiệu';
  r := public.my_referrals('{}');
  assert r->'entered_by'->>'status' = 'rewarded' and r->'entered_by'->>'name' = 'Lan N.', 'lượt đã thưởng';
end $$;
do $$ begin perform pg_temp.reset(); end $$;
do $$ begin
  assert (select points from public.profiles where id = '00000000-0000-4000-8000-0000000000c1') = 300, 'Lan 100 → 300 (+200)';
  assert (select count(*) from public.notifications where user_id = '00000000-0000-4000-8000-0000000000c1' and link = '/gioi-thieu') = 1, 'báo người giới thiệu';
  assert (select count(*) from public.points_ledger where user_id = '00000000-0000-4000-8000-0000000000d1' and trip_id is null and delta = 100) = 1, 'thưởng đúng một lần, không gắn chuyến';
end $$;

-- Minh Anh xem danh sách bạn đã mời (tên đã che).
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000001'); end $$;
do $$
declare r jsonb;
begin
  r := public.my_referrals('{}');
  assert r->>'code' = 'MINHA7K' and jsonb_array_length(r->'friends') = 4, 'Minh Anh có 4 bạn';
  assert not (r->'friends')::text like '%+849%', 'không lộ số điện thoại';
  begin
    perform public.admin_set_referral_status('{"id":"ref-vy","status":"rewarded"}');
    raise exception 'người dùng không được đổi trạng thái giới thiệu';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.app_banners (title, image_url, starts_at, ends_at) values ('X', 'https://x/y.jpg', now(), now() + interval '1 day');
    raise exception 'người dùng không được thêm ảnh bìa';
  exception when insufficient_privilege then null;
  end;
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Ảnh tại quán: Gia Huy chụp ở Cà phê Mây sau chuyến dùng mã của quán (chuyến tạo ở khối record_ad_view phía trên).
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000002'); end $$;
do $$
declare tid text; r jsonb;
begin
  select id into tid from public.trips where attached @> '[{"source":"sponsor"}]' order by created_at desc limit 1;
  begin
    perform public.submit_shop_photo(jsonb_build_object('tripId', tid, 'storagePath', '00000000-0000-4000-8000-000000000002/a.jpg',
      'sha256', repeat('a', 64), 'takenAt', now(), 'lat', 10.7833, 'lng', 106.699));
    raise exception 'ảnh xa quán phải bị chặn';
  exception when raise_exception then
    if sqlerrm not like 'Vị trí chụp cách quán%' then raise; end if;
  end;
  begin
    perform public.submit_shop_photo(jsonb_build_object('tripId', tid, 'storagePath', '00000000-0000-4000-8000-000000000001/a.jpg',
      'sha256', repeat('a', 64), 'takenAt', now(), 'lat', 10.7734, 'lng', 106.699));
    raise exception 'ảnh ở thư mục người khác phải bị chặn';
  exception when raise_exception then
    if sqlerrm <> 'Ảnh không hợp lệ' then raise; end if;
  end;
  r := public.submit_shop_photo(jsonb_build_object('tripId', tid, 'storagePath', '00000000-0000-4000-8000-000000000002/a.jpg',
    'sha256', repeat('a', 64), 'takenAt', now(), 'lat', 10.7734, 'lng', 106.699));
  assert r->>'status' = 'pending' and (r->>'distance_m')::int <= 150, 'ảnh tại quán chờ duyệt';
  begin
    perform public.submit_shop_photo(jsonb_build_object('tripId', tid, 'storagePath', '00000000-0000-4000-8000-000000000002/b.jpg',
      'sha256', repeat('b', 64), 'takenAt', now(), 'lat', 10.7734, 'lng', 106.699));
    raise exception 'mỗi chuyến một ảnh';
  exception when raise_exception then
    if sqlerrm not like 'Chuyến này đã gửi ảnh%' then raise; end if;
  end;
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Chủ quán không thấy ảnh, người chụp; chỉ có số tổng.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
do $$ begin
  assert (select count(*) from public.shop_photos) = 0, 'chủ quán không đọc shop_photos';
  assert (select count(*) from public.referrals) = 0, 'chủ quán không đọc referrals của người khác';
  assert (public.business_checkin_count('{"businessId":"biz-cafe-may"}')->>'count')::int = 0, 'chưa duyệt thì chưa tính';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Quản trị ops: duyệt ảnh (+50 đúng một lần), hẹn ảnh bìa (không trùng khung giờ).
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000a1'); end $$;
do $$
declare pid text; before int; r jsonb;
begin
  select id into pid from public.shop_photos where user_id = '00000000-0000-4000-8000-000000000002' and status = 'pending';
  select points into before from public.profiles where id = '00000000-0000-4000-8000-000000000002';
  r := public.review_shop_photo(jsonb_build_object('id', pid, 'approve', true));
  assert r->>'status' = 'approved', 'đã duyệt';
  assert (select points from public.profiles where id = '00000000-0000-4000-8000-000000000002') = before + 50, '+50 điểm';
  begin
    perform public.review_shop_photo(jsonb_build_object('id', pid, 'approve', true));
    raise exception 'không duyệt hai lần';
  exception when raise_exception then
    if sqlerrm <> 'Ảnh này đã được xử lý' then raise; end if;
  end;

  insert into public.app_banners (title, image_url, starts_at, ends_at, overlay, status)
  values ('Ảnh thử', 'https://example.com/a.jpg', now() - interval '1 hour', now() + interval '1 day', 0.4, 'scheduled');
  begin
    insert into public.app_banners (title, image_url, starts_at, ends_at, overlay, status)
    values ('Trùng giờ', 'https://example.com/b.jpg', now(), now() + interval '2 days', 0.4, 'scheduled');
    raise exception 'ảnh bìa trùng khung giờ phải bị chặn';
  exception when exclusion_violation then null;
  end;

  r := public.admin_set_referral_status('{"id":"ref-vy","status":"rejected","note":"Thử"}');
  assert r->>'status' = 'rejected', 'ops từ chối lượt giới thiệu';
end $$;
do $$ begin perform pg_temp.reset(); end $$;
set role anon;
do $$ begin
  assert public.active_home_cover('{}')->>'title' = 'Ảnh thử', 'app thấy ảnh bìa đang hiện';
end $$;
reset role;

\echo '  RLS + RPC: tất cả kiểm tra đều đúng'
