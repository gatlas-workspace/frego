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

-- ───────────── Khách chưa đăng nhập (anon) ─────────────
set role anon;
do $$ begin
  assert (select count(*) from public.places) = 11, 'anon đọc được danh mục địa điểm';
  assert (select count(*) from public.businesses_public) = 6, 'anon thấy thông tin quán công khai';
  assert (select count(*) from public.campaigns_public where offering) = 6, 'anon thấy 6 chiến dịch đang phát mã';
  assert (select count(*) from public.public_codes) = 4, 'mã công khai bị ẩn không hiện';
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
  assert (select count(*) from public.user_vouchers) = 2, 'ví có MAY7K2Q và FREGO10';
  assert (select count(*) from public.trips) = 4, 'lịch sử 4 chuyến';
  assert (select count(*) from public.businesses) = 0, 'không đọc bảng businesses (ví, mã số thuế)';
  assert (select count(*) from public.redemptions) = 0, 'không đọc redemptions';
  assert (select count(*) from public.notifications where read_at is null) = 3, '3 thông báo chưa đọc';

  -- Báo giá chuyến hôm nay: +10 một chạm, +50 nhập số tiền, không cộng lần hai.
  r := public.report_price('{"tripId":"trip-today","verdict":"within"}');
  assert (r->>'points_awarded')::int = 10, 'một chạm +10';
  r := public.report_price('{"tripId":"trip-today","paidAmount":24000}');
  assert (r->>'points_awarded')::int = 50 and (r->>'points')::int = 1310, 'nhập số tiền +50 → 1.310';
  r := public.report_price('{"tripId":"trip-today","verdict":"cheaper"}');
  assert (r->>'points_awarded')::int = 0, 'không cộng điểm hai lần';

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

  -- Bình chọn mã công khai.
  r := public.vote_public_code('{"publicCodeId":"pc-vpb","works":true}');
  assert (r->>'ok')::int = 19, 'thêm lượt dùng được';

  r := public.mark_all_notifications_read('{}');
  assert (select count(*) from public.notifications where read_at is null) = 0, 'đã đọc hết';

  -- Quà chào mừng không phát lại.
  assert public.ensure_welcome_voucher('{}') is null, 'FREGO10 không phát lần hai';
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

-- Người dùng khác không thấy dữ liệu của Minh Anh.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000002'); end $$;
do $$ begin
  assert (select count(*) from public.trips) = 0, 'Gia Huy không thấy chuyến của Minh Anh';
  assert (select count(*) from public.user_vouchers) = 0, 'Gia Huy không thấy ví của Minh Anh';
  assert (select count(*) from public.profiles) = 1, 'Gia Huy chỉ thấy hồ sơ của mình';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- ───────────── Chủ quán: Cà phê Mây ─────────────
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-0000000000b1'); end $$;
do $$
declare b jsonb;
begin
  assert (select count(*) from public.businesses) = 1, 'chỉ thấy quán của mình';
  assert (select wallet_balance from public.businesses) = 1180000, 'thấy số dư ví 1.180.000đ';
  assert (select count(*) from public.campaigns) = 4, '4 chiến dịch của Cà phê Mây';
  assert (select count(*) from public.user_vouchers) = 0, 'không thấy người nhận mã';
  assert (select count(*) from public.profiles) = 1, 'không thấy hồ sơ người dùng khác';
  assert (select count(*) from public.redemptions) = 0, 'không thấy từng lượt dùng mã';
  assert (select count(*) from public.wallet_transactions) = 2, 'thấy giao dịch ví của quán';

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
  assert (select count(*) from public.profiles) = 6, 'quản trị thấy mọi người dùng';
  assert (select count(*) from public.businesses) = 6, 'quản trị thấy mọi doanh nghiệp';
  assert (select count(*) from public.redemptions) >= 1, 'quản trị thấy lượt dùng mã';
  r := public.confirm_topup('{"transactionId":"wt-2"}');
  assert (r->>'balance')::bigint = 6180000, 'khớp nạp 5.000.000đ → 6.180.000đ';
  update public.campaigns set status = 'active', approved_at = now() where id = 'cp-may-mon-moi';
  assert (select status from public.campaigns where id = 'cp-may-mon-moi') = 'active', 'quản trị duyệt chiến dịch';
  r := public.set_user_status('{"userId":"00000000-0000-4000-8000-000000000004","status":"locked","reason":"thử"}');
  assert r->>'status' = 'locked', 'tạm khóa người dùng';
  r := public.adjust_points('{"userId":"00000000-0000-4000-8000-000000000002","delta":50,"reason":"Bù điểm báo giá"}');
  assert (r->>'points')::int = 690, 'điều chỉnh điểm';
  assert (select count(*) from public.audit_logs) >= 4, 'thao tác quản trị được ghi nhật ký';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

-- Người dùng bị khóa không báo giá được.
do $$ begin perform pg_temp.act_as('00000000-0000-4000-8000-000000000003'); end $$;
do $$ begin
  assert (select status from public.profiles) = 'locked', 'Thu Hà đang bị khóa';
end $$;
do $$ begin perform pg_temp.reset(); end $$;

\echo '  RLS + RPC: tất cả kiểm tra đều đúng'
