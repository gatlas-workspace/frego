-- Frego · UI v3 (bản 3.0, docs/plan.md GĐ 4, GĐ 5, GĐ 5b — duyệt 27/11/2026):
--   1. Giới thiệu bạn bè: profiles.referral_code, bảng referrals, RPC check/apply_referral_code, my_referrals,
--      referral_owner_name (trang mời /moi/[ma]), admin_set_referral_status; cộng thưởng trong report_price và record_receipt.
--   2. Ảnh bìa Trang chủ (QT 13): bảng app_banners + kho ảnh công khai app-banners, RPC active_home_cover.
--   3. Ảnh tại quán (+50 điểm): bảng shop_photos + kho ảnh riêng checkin-photos, RPC submit_shop_photo, review_shop_photo.
-- Bản JS tương ứng: packages/core/src/db/memory.ts — sửa một bên phải sửa bên kia. Số liệu khớp POINTS_RULES.referral,
-- POINTS_RULES.shopPhoto, SHOP_PHOTO_RULES, HOME_COVER_RULES trong packages/core/src/catalog.ts.

-- ───────────── Trợ giúp chung ─────────────

-- Khách: tài khoản ẩn danh hoặc chưa có số điện thoại (JS: !profile.phone).
create or replace function public._is_guest(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
      or coalesce((select phone from profiles where id = u), '') = '';
$$;

-- "Lan Nguyễn" → "Lan N.", một chữ giữ nguyên, rỗng → "Bạn Frego" (JS: maskName trong format.ts).
create or replace function public._mask_name(n text)
returns text language plpgsql immutable as $$
declare
  parts text[];
  k int;
begin
  select coalesce(array_agg(w order by ord), '{}') into parts
  from unnest(regexp_split_to_array(coalesce(n, ''), '\s+')) with ordinality as t(w, ord)
  where w <> '';
  k := coalesce(array_length(parts, 1), 0);
  if k = 0 then return 'Bạn Frego'; end if;
  if k = 1 then return parts[1]; end if;
  return parts[1] || ' ' || upper(left(parts[k], 1)) || '.';
end $$;

-- Khoảng cách đường chim bay (m), cùng công thức haversine với distanceM trong packages/core/src/geo.ts.
create or replace function public._distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- ═════════════════════════════ 1. GIỚI THIỆU BẠN BÈ ═════════════════════════════

-- Mã: tối đa 4 chữ đầu của từ đầu + chữ đầu của từ cuối (không dấu, in hoa), thêm ký tự ngẫu nhiên bỏ 0/O/1/I,
-- tổng 6–7 ký tự ("Minh Anh" → "MINHA7K", tên rỗng → "FRE…"). Trùng thì thử lại. JS: genReferralCode.
create or replace function public._gen_referral_code(p_name text)
returns text language plpgsql volatile security definer set search_path = public as $$
declare
  words text[];
  full_prefix text;
  prefix text;
  n int;
  code text;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  select coalesce(array_agg(x order by ord), '{}') into words
  from (
    select regexp_replace(w, '[^A-Z]', '', 'g') as x, ord
    from unnest(regexp_split_to_array(upper(unaccent(coalesce(p_name, ''))), '\s+')) with ordinality as t(w, ord)
  ) s
  where x <> '';
  if coalesce(array_length(words, 1), 0) = 0 then
    full_prefix := 'FRE';
  else
    full_prefix := left(left(words[1], 4)
      || case when array_length(words, 1) > 1 then left(words[array_length(words, 1)], 1) else '' end, 5);
  end if;
  for i in 0..39 loop
    if i < 10 then
      prefix := full_prefix;
      n := greatest(2, 6 - length(prefix));
    else
      prefix := left(full_prefix, 4);
      n := 7 - length(prefix);
    end if;
    code := prefix;
    for k in 1..n loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from profiles where referral_code = code) then return code; end if;
  end loop;
  raise exception 'Không tạo được mã giới thiệu';
end $$;

alter table public.profiles add column referral_code text;

-- Điền mã cho tài khoản cũ (từng dòng để hàm thấy mã vừa sinh, tránh trùng).
do $$
declare r record;
begin
  for r in select id, display_name from public.profiles where referral_code is null order by created_at loop
    update public.profiles set referral_code = public._gen_referral_code(r.display_name) where id = r.id;
  end loop;
end $$;

alter table public.profiles alter column referral_code set not null;
alter table public.profiles add constraint profiles_referral_code_key unique (referral_code);
alter table public.profiles add constraint profiles_referral_code_check check (referral_code ~ '^[A-Z0-9]{4,10}$');
-- Người dùng không tự sửa mã: cột không nằm trong danh sách grant update (display_name, avatar_url, …) của profiles.

-- Hồ sơ mới tự có mã (trigger chạy cả khi handle_new_user tạo hồ sơ).
create or replace function public._profiles_referral_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referral_code is null or new.referral_code = '' then
    new.referral_code := public._gen_referral_code(new.display_name);
  end if;
  return new;
end $$;

create trigger profiles_referral_code before insert on public.profiles
for each row execute function public._profiles_referral_code();

-- Tài khoản đăng nhập số điện thoại thường chưa có tên lúc tạo (mã "FRE…"): đặt tên lần đầu thì sinh lại mã theo tên,
-- nếu chưa ai nhập mã cũ. JS: hook update profiles trong memory.ts.
create or replace function public._profiles_referral_code_rename()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Không đè mã khi chính lệnh cập nhật đặt mã (VD seed.sql ghi lại hồ sơ mẫu).
  if coalesce(old.display_name, '') = '' and coalesce(new.display_name, '') <> ''
     and new.referral_code is not distinct from old.referral_code
     and not exists (select 1 from referrals where referrer_id = new.id) then
    new.referral_code := public._gen_referral_code(new.display_name);
  end if;
  return new;
end $$;

-- ───────────── Bảng referrals ─────────────

create table public.referrals (
  id text primary key default gen_random_uuid()::text,
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referee_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'rewarded', 'held', 'expired', 'rejected')),
  created_at timestamptz not null default now(),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  note text,
  check (referrer_id <> referee_id)
);
create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);
create index referrals_status_idx on public.referrals (status, created_at desc);

-- Trigger đổi mã khi đặt tên cần bảng referrals nên tạo sau bảng.
create trigger profiles_referral_code_rename before update of display_name on public.profiles
for each row execute function public._profiles_referral_code_rename();

alter table public.referrals enable row level security;
-- Người dùng đọc dòng mình là người giới thiệu hoặc người mới (bảng không có số điện thoại; tên lấy qua RPC đã che).
-- Doanh nghiệp không thấy gì. Quản trị ops/support đọc, ops sửa trạng thái. Ghi lượt mới chỉ qua RPC.
create policy referrals_read on public.referrals for select
  using (referrer_id = auth.uid() or referee_id = auth.uid() or public.is_admin('support'));
create policy referrals_ops_update on public.referrals for update
  using (public.is_admin('ops')) with check (public.is_admin('ops'));
revoke all on public.referrals from public, anon, authenticated;
grant select, update on public.referrals to authenticated;
grant select, insert, update, delete on public.referrals to service_role;

-- ───────────── Trợ giúp giới thiệu ─────────────

-- Kiểm tra mã theo thứ tự: khách → đã nhập → quá 7 ngày → không có mã → mã của mình → chủ mã tạo sau.
-- Trả { reason } hoặc { reason: null, owner_id, owner_name }.
create or replace function public._referral_check(u uuid, raw text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  me profiles;
  owner profiles;
  c text := regexp_replace(upper(coalesce(raw, '')), '[^A-Z0-9]', '', 'g');
begin
  select * into me from profiles where id = u;
  if not found then raise exception 'Không tìm thấy người dùng'; end if;
  if public._is_guest(u) then return jsonb_build_object('reason', 'guest'); end if;
  if exists (select 1 from referrals where referee_id = u) then return jsonb_build_object('reason', 'already'); end if;
  if now() - me.created_at > interval '7 days' then return jsonb_build_object('reason', 'too_late'); end if;
  if c = '' then return jsonb_build_object('reason', 'not_found'); end if;
  select * into owner from profiles where referral_code = c;
  if not found then return jsonb_build_object('reason', 'not_found'); end if;
  if owner.id = u then return jsonb_build_object('reason', 'own'); end if;
  if owner.created_at > me.created_at then return jsonb_build_object('reason', 'newer'); end if;
  return jsonb_build_object('reason', null, 'owner_id', owner.id, 'owner_name', public._mask_name(owner.display_name));
end $$;

create or replace function public._referral_message(reason text)
returns text language sql immutable as $$
  select case reason
    when 'guest' then 'Đăng nhập bằng số điện thoại để nhập mã giới thiệu.'
    when 'already' then 'Bạn đã nhập mã giới thiệu rồi. Mỗi tài khoản chỉ nhập được một mã.'
    when 'too_late' then 'Chỉ nhập được mã trong 7 ngày đầu sau khi tạo tài khoản.'
    when 'not_found' then 'Không tìm thấy mã này. Kiểm tra lại chữ và số.'
    when 'own' then 'Đây là mã của bạn. Hãy nhập mã của bạn bè.'
    when 'newer' then 'Mã này của tài khoản tạo sau bạn nên không áp dụng được.'
    else 'Mã không hợp lệ.'
  end;
$$;

-- Lượt chờ quá 30 ngày kể từ lúc nhập mã → hết hạn (tính lúc đọc).
create or replace function public._referral_expire_for(u uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update referrals set status = 'expired', note = 'Quá 30 ngày chưa có chuyến đầu'
  where (referrer_id = u or referee_id = u) and status = 'pending' and now() - created_at > interval '30 days';
end $$;

-- Cộng thưởng cả hai bên (không tính vào giới hạn 300 điểm/ngày vì trip_id null), đánh dấu rewarded, báo người giới thiệu.
create or replace function public._referral_reward(rid text)
returns void language plpgsql security definer set search_path = public as $$
declare
  r referrals;
  referrer_name text;
  referee_name text;
begin
  select * into r from referrals where id = rid for update;
  if not found then return; end if;
  select public._mask_name(display_name) into referrer_name from profiles where id = r.referrer_id;
  select public._mask_name(display_name) into referee_name from profiles where id = r.referee_id;
  perform public._ledger(r.referee_id, 100, 'Nhập mã giới thiệu của ' || referrer_name, null);
  perform public._ledger(r.referrer_id, 200, 'Giới thiệu bạn bè: ' || referee_name, null);
  update referrals set status = 'rewarded', rewarded_at = now(), qualified_at = coalesce(qualified_at, now()), note = null
  where id = r.id;
  if coalesce((select points from notification_prefs where user_id = r.referrer_id), true) then
    insert into notifications (user_id, category, kind, icon, tone, logo, title, body, cta, link)
    values (r.referrer_id, 'trip', 'points', 'sparkplus', 'tint', 'frego',
            referee_name || ' vừa hoàn tất chuyến đầu, bạn được +200 điểm',
            'Cảm ơn bạn đã giới thiệu Frego. Điểm dùng để đổi voucher ở mục Điểm thưởng.',
            'Xem bạn bè ›', '/gioi-thieu');
  end if;
end $$;

-- Gọi khi người dùng vừa được cộng điểm báo giá: lần đầu sau khi nhập mã → thưởng, hoặc giữ lại khi người giới thiệu
-- đã đủ 10 lượt trong tháng (giờ VN) hay một trong hai tài khoản đang khóa.
create or replace function public._referral_qualify(u uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  r referrals;
  referrer profiles;
  referee_status text;
  month_count int;
begin
  select * into r from referrals where referee_id = u and status = 'pending' for update;
  if not found then return; end if;
  if now() - r.created_at > interval '30 days' then
    update referrals set status = 'expired', note = 'Quá 30 ngày chưa có chuyến đầu' where id = r.id;
    return;
  end if;
  update referrals set qualified_at = now() where id = r.id;
  -- Khóa hồ sơ người giới thiệu để hai lượt cùng lúc không vượt trần tháng.
  select * into referrer from profiles where id = r.referrer_id for update;
  select status into referee_status from profiles where id = u;
  select count(*) into month_count from referrals
  where referrer_id = r.referrer_id and status = 'rewarded' and rewarded_at is not null
    and date_trunc('month', rewarded_at at time zone 'Asia/Ho_Chi_Minh') = date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh');
  if referrer.status = 'locked' or referee_status = 'locked' then
    update referrals set status = 'held',
      note = case when referrer.status = 'locked' then 'Tài khoản người giới thiệu đang tạm khóa' else 'Tài khoản người mới đang tạm khóa' end
    where id = r.id;
  elsif month_count >= 10 then
    update referrals set status = 'held', note = 'Người giới thiệu đã đạt 10 lượt thưởng trong tháng' where id = r.id;
  else
    perform public._referral_reward(r.id);
  end if;
end $$;

-- ───────────── RPC giới thiệu ─────────────

create or replace function public.check_referral_code(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  r jsonb := public._referral_check(u, args->>'code');
begin
  if r->>'reason' is null then
    return jsonb_build_object('ok', true, 'owner_name', r->>'owner_name');
  end if;
  return jsonb_build_object('ok', false,
    'reason', case when r->>'reason' = 'newer' then 'not_found' else r->>'reason' end,
    'message', public._referral_message(r->>'reason'));
end $$;

create or replace function public.apply_referral_code(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  r jsonb;
begin
  -- Khóa hồ sơ của mình: hai lần bấm cùng lúc không tạo hai lượt.
  perform 1 from profiles where id = u for update;
  r := public._referral_check(u, args->>'code');
  if r->>'reason' is not null then raise exception '%', public._referral_message(r->>'reason'); end if;
  insert into referrals (referrer_id, referee_id) values ((r->>'owner_id')::uuid, u)
  on conflict (referee_id) do nothing;
  if not found then raise exception '%', public._referral_message('already'); end if;
  return jsonb_build_object('owner_name', r->>'owner_name');
end $$;

create or replace function public.my_referrals(args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  me profiles;
begin
  perform public._referral_expire_for(u);
  select * into me from profiles where id = u;
  return jsonb_build_object(
    'code', me.referral_code,
    'account_created_at', me.created_at,
    'guest', public._is_guest(u),
    'month_rewarded', (
      select count(*) from referrals
      where referrer_id = u and status = 'rewarded' and rewarded_at is not null
        and date_trunc('month', rewarded_at at time zone 'Asia/Ho_Chi_Minh') = date_trunc('month', now() at time zone 'Asia/Ho_Chi_Minh')),
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
          'id', r.id, 'name', public._mask_name(p.display_name), 'status', r.status, 'created_at', r.created_at,
          'qualified_at', r.qualified_at, 'rewarded_at', r.rewarded_at)
        order by r.created_at desc)
      from referrals r join profiles p on p.id = r.referee_id
      where r.referrer_id = u), '[]'::jsonb),
    'entered_by', (
      select jsonb_build_object('name', public._mask_name(p.display_name), 'status', r.status, 'created_at', r.created_at)
      from referrals r join profiles p on p.id = r.referrer_id
      where r.referee_id = u)
  );
end $$;

-- Trang mời công khai: chỉ tên đã che của chủ mã (không có số điện thoại, id).
create or replace function public.referral_owner_name(args jsonb)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('owner_name', (
    select public._mask_name(display_name) from profiles
    where referral_code = nullif(regexp_replace(upper(coalesce(args->>'code', '')), '[^A-Z0-9]', '', 'g'), '')
  ));
$$;

create or replace function public.admin_set_referral_status(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  r referrals;
  v_status text := args->>'status';
  v_note text := nullif(btrim(coalesce(args->>'note', '')), '');
begin
  perform public._require_admin('ops');
  if v_status is null or v_status not in ('rewarded', 'rejected', 'held') then raise exception 'Trạng thái không hợp lệ'; end if;
  select * into r from referrals where id = args->>'id' for update;
  if not found then raise exception 'Không tìm thấy lượt giới thiệu'; end if;
  if r.status = 'rewarded' then raise exception 'Lượt này đã cộng điểm, không đổi được'; end if;
  if v_status = 'rewarded' then
    perform public._referral_reward(r.id);
  else
    update referrals set status = v_status,
      note = coalesce(v_note, case when v_status = 'rejected' then 'Frego từ chối sau khi kiểm tra' else note end)
    where id = r.id;
  end if;
  insert into audit_logs (actor_name, actor_role, action)
  select 'Vận hành Frego', 'ops',
    case v_status when 'rewarded' then 'Duyệt thưởng' when 'rejected' then 'Từ chối' else 'Giữ lại' end
    || ' lượt giới thiệu ' || public._mask_name(a.display_name) || ' → ' || public._mask_name(b.display_name)
    || coalesce(', ghi chú ' || v_note, '')
  from profiles a, profiles b where a.id = r.referrer_id and b.id = r.referee_id;
  select * into r from referrals where id = r.id;
  return to_jsonb(r);
end $$;

-- ───────────── report_price / record_receipt: cộng thưởng giới thiệu ─────────────
-- Giữ nguyên quy tắc của 20261127000500_points_rules.sql và 20261127001100_gmail_receipts.sql, chỉ thêm
-- "nếu vừa được cộng điểm → _referral_qualify".

create or replace function public.report_price(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  t trips;
  pv text;
  vc text;
  mult int := 1;
  awarded int := 0;
  give int;
  used_today int;
  cap constant int := 300;
  max_dev constant numeric := 0.3;
  held text;
  reported boolean := false;
  v_verdict text := args->>'verdict';
  v_paid int := (args->>'paidAmount')::int;
  label text;
begin
  select * into t from trips where id = args->>'tripId' and user_id = u for update;
  if not found then raise exception 'Không tìm thấy chuyến'; end if;
  if t.chosen_service is null then raise exception 'Chuyến chưa chọn hãng'; end if;
  if (select status from profiles where id = u) = 'locked' then raise exception 'Tài khoản đang tạm khóa'; end if;
  pv := split_part(t.chosen_service, '-', 1);
  vc := split_part(t.chosen_service, '-', 2);
  label := public._service_short(pv, vc);
  if not exists (select 1 from fare_tables where provider_id = pv and vehicle_class = vc and enabled) then mult := 2; end if;

  select coalesce(sum(delta), 0) into used_today from points_ledger
  where user_id = u and trip_id is not null and delta > 0
    and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date;

  if v_verdict is not null and t.verdict is null then
    if v_verdict not in ('cheaper', 'within', 'pricier') then raise exception 'Giá trị không hợp lệ'; end if;
    update trips set verdict = v_verdict, report_source = coalesce(report_source, 'tap') where id = t.id;
    reported := true;
    give := greatest(0, least(10 * mult, cap - used_today));
    if give < 10 * mult then held := 'Đã đạt giới hạn 300 điểm hôm nay, phần còn lại được giữ để kiểm tra.'; end if;
    if give > 0 then
      perform public._ledger(u, give, 'Báo giá một chạm, ' || label, t.id);
      used_today := used_today + give;
      awarded := awarded + give;
    end if;
  end if;

  if v_paid is not null and v_paid > 0 and t.paid_amount is null then
    if v_paid > 5000000 then raise exception 'Số tiền không hợp lệ'; end if;
    update trips set paid_amount = v_paid, report_source = 'amount',
      verdict = coalesce(trips.verdict, case
        when t.estimate_low is null then null
        when v_paid < t.estimate_low then 'cheaper'
        when v_paid > t.estimate_high then 'pricier'
        else 'within' end)
    where id = t.id;
    reported := true;
    if t.estimate_low is not null and t.estimate_high is not null
       and (v_paid < t.estimate_low * (1 - max_dev) or v_paid > t.estimate_high * (1 + max_dev)) then
      held := 'Số tiền lệch hơn 30% so với ước tính nên chưa cộng điểm. Frego sẽ kiểm tra lại.';
    else
      give := greatest(0, least(50 * mult, cap - used_today));
      if give < 50 * mult then held := 'Đã đạt giới hạn 300 điểm hôm nay, phần còn lại được giữ để kiểm tra.'; end if;
      if give > 0 then
        perform public._ledger(u, give, 'Nhập số tiền chuyến ' || public._provider_name(pv) || ', trả ' || public._fmt_vnd(v_paid), t.id);
        awarded := awarded + give;
      end if;
    end if;
  end if;

  if reported then
    update trips set status = 'reported', reported_at = now(), points_awarded = points_awarded + awarded where id = t.id;
  end if;
  -- Giới thiệu bạn bè: lần báo giá được cộng điểm đầu tiên sau khi nhập mã.
  if awarded > 0 then perform public._referral_qualify(u); end if;
  select * into t from trips where id = t.id;
  return jsonb_build_object('trip', to_jsonb(t), 'points_awarded', awarded,
                            'points', (select points from profiles where id = u), 'held', held);
end $$;

create or replace function public.record_receipt(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := nullif(args->>'userId', '')::uuid;
  v_msg text := args->>'messageId';
  v_pv text := args->>'providerId';
  v_paid int := (args->>'paidAmount')::int;
  v_received timestamptz := (args->>'receivedAt')::timestamptz;
  v_at timestamptz;
  prev gmail_receipts;
  t trips;
  vc text;
  mult int := 1;
  give int;
  used_today int;
  cap constant int := 300;
  pts_base constant int := 50;
  max_dev constant numeric := 0.3;
  v_status text := 'unmatched';
  v_trip text;
  awarded int := 0;
  held text;
begin
  if u is null then raise exception 'Thiếu userId'; end if;
  if coalesce(v_msg, '') = '' then raise exception 'Thiếu messageId'; end if;
  select * into prev from gmail_receipts where user_id = u and message_id = v_msg;
  if found then
    return jsonb_build_object('status', prev.status, 'duplicate', true, 'trip_id', prev.trip_id,
                              'points_awarded', 0, 'held', prev.held);
  end if;
  if not exists (select 1 from gmail_connections where user_id = u) then raise exception 'Chưa liên kết Gmail'; end if;
  if v_pv is null or v_pv not in ('grab', 'be', 'gsm') then raise exception 'Hãng không hợp lệ'; end if;
  if v_paid is null or v_paid <= 0 or v_paid > 5000000 then raise exception 'Số tiền không hợp lệ'; end if;
  if v_received is null then raise exception 'Thời gian không hợp lệ'; end if;
  if (select status from profiles where id = u) = 'locked' then raise exception 'Tài khoản đang tạm khóa'; end if;
  v_at := coalesce(nullif(args->>'tripAt', '')::timestamptz, v_received);

  select * into t from trips
  where user_id = u and chosen_service is not null and split_part(chosen_service, '-', 1) = v_pv
    and opened_at between v_at - interval '3 hours' and v_at + interval '15 minutes'
    and paid_amount is null
  order by opened_at desc
  limit 1
  for update;

  if found then
    v_status := 'matched';
    v_trip := t.id;
    vc := split_part(t.chosen_service, '-', 2);
    if not exists (select 1 from fare_tables where provider_id = v_pv and vehicle_class = vc and enabled) then mult := 2; end if;

    select coalesce(sum(delta), 0) into used_today from points_ledger
    where user_id = u and trip_id is not null and delta > 0
      and (created_at at time zone 'Asia/Ho_Chi_Minh')::date = (now() at time zone 'Asia/Ho_Chi_Minh')::date;

    update trips set paid_amount = v_paid, report_source = 'receipt',
      verdict = coalesce(trips.verdict, case
        when t.estimate_low is null or t.estimate_high is null then null
        when v_paid < t.estimate_low then 'cheaper'
        when v_paid > t.estimate_high then 'pricier'
        else 'within' end)
    where id = t.id;

    if t.estimate_low is not null and t.estimate_high is not null
       and (v_paid < t.estimate_low * (1 - max_dev) or v_paid > t.estimate_high * (1 + max_dev)) then
      held := 'Số tiền lệch hơn 30% so với ước tính nên chưa cộng điểm. Frego sẽ kiểm tra lại.';
    else
      give := greatest(0, least(pts_base * mult, cap - used_today));
      if give < pts_base * mult then held := 'Đã đạt giới hạn 300 điểm hôm nay, phần còn lại được giữ để kiểm tra.'; end if;
      if give > 0 then
        perform public._ledger(u, give, 'Biên nhận email chuyến ' || public._provider_name(v_pv) || ', trả ' || public._fmt_vnd(v_paid), t.id);
        awarded := give;
      end if;
    end if;

    update trips set status = 'reported', reported_at = now(), points_awarded = points_awarded + awarded where id = t.id;
    -- Giới thiệu bạn bè: lần báo giá được cộng điểm đầu tiên sau khi nhập mã.
    if awarded > 0 then perform public._referral_qualify(u); end if;
  else
    select id into v_trip from trips
    where user_id = u and chosen_service is not null and split_part(chosen_service, '-', 1) = v_pv
      and opened_at between v_at - interval '3 hours' and v_at + interval '15 minutes'
    order by opened_at desc
    limit 1;
    if v_trip is not null then v_status := 'already_reported'; end if;
  end if;

  insert into gmail_receipts (user_id, message_id, provider_id, paid_amount, received_at, trip_at, pickup, dropoff,
                              promo_code, trip_id, status, points_awarded, held)
  values (u, v_msg, v_pv, v_paid, v_received, nullif(args->>'tripAt', '')::timestamptz,
          left(nullif(args->>'pickup', ''), 200), left(nullif(args->>'dropoff', ''), 200),
          left(nullif(args->>'promoCode', ''), 40), v_trip, v_status, awarded, held)
  on conflict (user_id, message_id) do nothing;

  return jsonb_build_object('status', v_status, 'duplicate', false, 'trip_id', v_trip,
                            'points_awarded', awarded, 'held', held);
end $$;

-- ═════════════════════════════ 2. ẢNH BÌA TRANG CHỦ (QT 13) ═════════════════════════════

create table public.app_banners (
  id text primary key default gen_random_uuid()::text,
  title text not null check (char_length(title) between 1 and 60),
  -- URL công khai trong bucket app-banners
  image_url text not null,
  storage_path text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Lớp phủ tối #14152B để chữ trắng đạt tương phản 4,5:1
  overlay numeric(3, 2) not null default 0.4 check (overlay in (0, 0.2, 0.4, 0.6)),
  status text not null default 'draft' check (status in ('draft', 'scheduled')),
  created_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index app_banners_window_idx on public.app_banners (status, starts_at desc);

-- Ảnh đã hẹn không được trùng khung giờ (dịch vụ quản trị cũng kiểm và báo tên ảnh trùng).
create or replace function public._app_banners_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'scheduled' and exists (
    select 1 from app_banners b
    where b.id <> new.id and b.status = 'scheduled' and b.starts_at < new.ends_at and new.starts_at < b.ends_at
  ) then
    raise exception 'Trùng thời gian với ảnh bìa đã hẹn khác' using errcode = '23P01';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger app_banners_guard before insert or update on public.app_banners
for each row execute function public._app_banners_guard();

alter table public.app_banners enable row level security;
-- Chỉ quản trị ops đọc/ghi bảng. App (khách, người dùng) đọc ảnh đang hiện qua RPC active_home_cover.
create policy app_banners_admin on public.app_banners for all
  using (public.is_admin('ops')) with check (public.is_admin('ops'));
revoke all on public.app_banners from public, anon, authenticated;
grant select, insert, update, delete on public.app_banners to authenticated;

-- Ảnh đang hiện: bản "scheduled" có khung giờ chứa hiện tại, bắt đầu muộn nhất thắng; không có → null.
create or replace function public.active_home_cover(args jsonb default '{}'::jsonb)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('image_url', image_url, 'overlay', overlay, 'title', title)
  from app_banners
  where status = 'scheduled' and starts_at <= now() and ends_at > now()
  order by starts_at desc
  limit 1;
$$;

-- ═════════════════════════════ 3. ẢNH TẠI QUÁN (+50 ĐIỂM) ═════════════════════════════

create table public.shop_photos (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  trip_id text not null unique references public.trips (id) on delete cascade,
  business_id text not null references public.businesses (id) on delete cascade,
  -- "<user_id>/<tệp>" trong bucket riêng checkin-photos
  storage_path text not null,
  -- Tên cột theo quy ước adapter (sha256 → sha_256, xem packages/core/src/supabase/case.ts)
  sha_256 text not null unique check (sha_256 ~ '^[0-9a-f]{64}$'),
  taken_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  distance_m integer not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index shop_photos_queue_idx on public.shop_photos (status, created_at desc);
create index shop_photos_user_idx on public.shop_photos (user_id, created_at desc);
create index shop_photos_business_idx on public.shop_photos (business_id, status);

alter table public.shop_photos enable row level security;
-- Người dùng đọc ảnh của mình; quản trị ops/support đọc để duyệt. Doanh nghiệp không đọc bảng (không thấy ảnh,
-- người chụp) — chỉ có số tổng qua business_checkin_count. Ghi chỉ qua RPC submit_shop_photo / review_shop_photo.
create policy shop_photos_read on public.shop_photos for select
  using (user_id = auth.uid() or public.is_admin('support'));
revoke all on public.shop_photos from public, anon, authenticated;
grant select on public.shop_photos to authenticated;
grant select, insert, update, delete on public.shop_photos to service_role;

-- Quán tài trợ của chuyến: mã của quán đã gắn (ưu tiên hãng đã chọn); "uv:" → chiến dịch của voucher, "cp:" → chiến dịch.
-- JS: tripSponsorShop trong memory.ts.
create or replace function public._trip_sponsor_business(t trips)
returns text language sql stable security definer set search_path = public as $$
  select c.business_id
  from jsonb_array_elements(t.attached) with ordinality as e(item, ord)
  left join user_vouchers v
    on (e.item->>'refId') like 'uv:%' and v.id = substr(e.item->>'refId', 4) and v.user_id = t.user_id
  join campaigns c on c.id = case
    when (e.item->>'refId') like 'uv:%' then v.campaign_id
    when (e.item->>'refId') like 'cp:%' then substr(e.item->>'refId', 4)
  end
  join businesses b on b.id = c.business_id
  where e.item->>'source' = 'sponsor'
  order by (e.item->>'service' = t.chosen_service) desc nulls last, e.ord
  limit 1;
$$;

create or replace function public.submit_shop_photo(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  t trips;
  b businesses;
  p shop_photos;
  bid text;
  v_sha text := lower(coalesce(args->>'sha256', ''));
  v_path text := coalesce(args->>'storagePath', '');
  v_taken timestamptz;
  v_lat double precision;
  v_lng double precision;
  d int;
begin
  if public._is_guest(u) then raise exception 'Đăng nhập bằng số điện thoại để gửi ảnh tại quán'; end if;
  if (select status from profiles where id = u) = 'locked' then raise exception 'Tài khoản đang tạm khóa'; end if;
  select * into t from trips where id = args->>'tripId' and user_id = u for update;
  if not found then raise exception 'Không tìm thấy chuyến'; end if;
  bid := public._trip_sponsor_business(t);
  if bid is null then raise exception 'Chuyến này không dùng mã của quán tài trợ'; end if;
  if exists (select 1 from shop_photos where trip_id = t.id) then raise exception 'Chuyến này đã gửi ảnh tại quán rồi'; end if;
  if v_sha !~ '^[0-9a-f]{64}$' then raise exception 'Ảnh không hợp lệ'; end if;
  if exists (select 1 from shop_photos where sha_256 = v_sha) then
    raise exception 'Ảnh này đã được gửi trước đây. Hãy chụp ảnh mới tại quán';
  end if;
  if left(v_path, length(u::text) + 1) <> u::text || '/' then raise exception 'Ảnh không hợp lệ'; end if;
  begin
    v_taken := nullif(args->>'takenAt', '')::timestamptz;
  exception when others then
    raise exception 'Giờ chụp không hợp lệ';
  end;
  if v_taken is null or v_taken > now() + interval '5 minutes' then raise exception 'Giờ chụp không hợp lệ'; end if;
  if v_taken < t.created_at or v_taken > t.created_at + interval '24 hours' then
    raise exception 'Ảnh phải chụp trong 24 giờ sau chuyến đi';
  end if;
  begin
    v_lat := (args->>'lat')::double precision;
    v_lng := (args->>'lng')::double precision;
  exception when others then
    raise exception 'Chưa có vị trí lúc chụp';
  end;
  if v_lat is null or v_lng is null or v_lat = 'NaN'::double precision or v_lng = 'NaN'::double precision
     or abs(v_lat) > 90 or abs(v_lng) > 180 then
    raise exception 'Chưa có vị trí lúc chụp';
  end if;
  select * into b from businesses where id = bid;
  d := round(public._distance_m(v_lat, v_lng, b.lat, b.lng))::int;
  if d > 150 then
    raise exception 'Vị trí chụp cách quán % m, cần ở trong vòng 150 m quanh quán', d;
  end if;
  insert into shop_photos (user_id, trip_id, business_id, storage_path, sha_256, taken_at, lat, lng, distance_m)
  values (u, t.id, bid, v_path, v_sha, v_taken, v_lat, v_lng, d)
  returning * into p;
  return to_jsonb(p);
end $$;

create or replace function public.review_shop_photo(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p shop_photos;
  v_approve boolean := coalesce((args->>'approve')::boolean, false);
  v_reason text := regexp_replace(coalesce(args->>'reason', ''), '^\s+|\s+$', '', 'g');
  shop text;
  actor text;
begin
  perform public._require_admin('ops');
  select * into p from shop_photos where id = args->>'id' for update;
  if not found then raise exception 'Không tìm thấy ảnh'; end if;
  if p.status <> 'pending' then raise exception 'Ảnh này đã được xử lý'; end if;
  if not v_approve and v_reason = '' then raise exception 'Nhập lý do từ chối'; end if;
  select coalesce(name, 'quán') into shop from businesses where id = p.business_id;
  shop := coalesce(shop, 'quán');
  select nullif(display_name, '') into actor from profiles where id = auth.uid();
  update shop_photos set
    status = case when v_approve then 'approved' else 'rejected' end,
    reject_reason = case when v_approve then null else v_reason end,
    reviewed_by = coalesce(actor, 'Vận hành Frego'),
    reviewed_at = now()
  where id = p.id;
  if v_approve then perform public._ledger(p.user_id, 50, 'Ảnh tại quán ' || shop, null); end if;
  if coalesce((select points from notification_prefs where user_id = p.user_id), true) then
    insert into notifications (user_id, category, kind, icon, tone, logo, title, body, cta, link)
    values (p.user_id, 'trip', 'points', case when v_approve then 'sparkplus' else 'camera' end, 'tint', 'frego',
            case when v_approve then 'Ảnh tại ' || shop || ' đã được duyệt, +50 điểm' else 'Ảnh tại ' || shop || ' chưa được duyệt' end,
            case when v_approve then 'Cảm ơn bạn đã ghé quán. Điểm dùng để đổi voucher ở mục Điểm thưởng.' else 'Lý do: ' || v_reason end,
            case when v_approve then 'Đổi voucher ›' else '' end,
            '/diem-thuong');
  end if;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops',
          case when v_approve then 'Duyệt' else 'Từ chối' end || ' ảnh tại quán ' || shop
          || case when v_approve then '' else ', lý do ' || v_reason end);
  select * into p from shop_photos where id = p.id;
  return to_jsonb(p);
end $$;

-- Doanh nghiệp: chỉ số lượt check-in có ảnh đã duyệt của quán mình (không ảnh, không người chụp).
create or replace function public.business_checkin_count(args jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare bid text := args->>'businessId';
begin
  if not (public.is_member(bid) or public.is_admin()) then raise exception 'Không có quyền' using errcode = '42501'; end if;
  return jsonb_build_object('count', (select count(*) from shop_photos where business_id = bid and status = 'approved'));
end $$;

-- ═════════════════════════════ Quyền gọi ═════════════════════════════

revoke all on function
  public._is_guest(uuid), public._gen_referral_code(text), public._referral_check(uuid, text),
  public._referral_expire_for(uuid), public._referral_reward(text), public._referral_qualify(uuid),
  public._trip_sponsor_business(trips)
from public, anon, authenticated;

revoke all on function
  public.check_referral_code(jsonb), public.apply_referral_code(jsonb), public.my_referrals(jsonb),
  public.admin_set_referral_status(jsonb), public.submit_shop_photo(jsonb), public.review_shop_photo(jsonb),
  public.business_checkin_count(jsonb)
from public, anon;
grant execute on function
  public.check_referral_code(jsonb), public.apply_referral_code(jsonb), public.my_referrals(jsonb),
  public.admin_set_referral_status(jsonb), public.submit_shop_photo(jsonb), public.review_shop_photo(jsonb),
  public.business_checkin_count(jsonb)
to authenticated;
-- Trang mời công khai và ảnh bìa: khách chưa đăng nhập cũng gọi được (chỉ trả tên đã che / ảnh đang hiện).
grant execute on function public.referral_owner_name(jsonb), public.active_home_cover(jsonb) to anon, authenticated;

-- ═════════════════════════════ Kho ảnh (Supabase Storage) ═════════════════════════════
-- Chỉ chạy khi có schema storage (Supabase thật). Postgres local của `pnpm db:test` không có storage → bỏ qua.
-- app-banners: công khai (app đọc), chỉ quản trị ops ghi/xóa, ≤ 500 KB.
-- checkin-photos: riêng tư, người dùng chỉ tải vào thư mục "<uid>/…" của mình; quản trị ops/support xem (URL ký).

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('app-banners', 'app-banners', true, 512000, array['image/jpeg', 'image/png', 'image/webp']),
      ('checkin-photos', 'checkin-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
    on conflict (id) do nothing;

    execute $p$
      create policy app_banners_ops_read on storage.objects for select to authenticated
      using (bucket_id = 'app-banners' and public.is_admin('ops'))
    $p$;
    execute $p$
      create policy app_banners_ops_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'app-banners' and public.is_admin('ops'))
    $p$;
    execute $p$
      create policy app_banners_ops_delete on storage.objects for delete to authenticated
      using (bucket_id = 'app-banners' and public.is_admin('ops'))
    $p$;

    execute $p$
      create policy checkin_photos_owner_insert on storage.objects for insert to authenticated
      with check (
        bucket_id = 'checkin-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
        and not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
      )
    $p$;
    execute $p$
      create policy checkin_photos_admin_read on storage.objects for select to authenticated
      using (bucket_id = 'checkin-photos' and public.is_admin('support'))
    $p$;
  end if;
end $$;
