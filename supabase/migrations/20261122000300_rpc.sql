-- Frego · lệnh tin cậy (RPC). Mỗi hàm nhận một tham số jsonb "args" (khóa camelCase như TypeScript)
-- và trả jsonb (khóa snake_case; adapter đổi sang camelCase).
-- Phải khớp cài đặt JS trong packages/core/src/db/memory.ts.

-- ───────────── Trợ giúp ─────────────

create or replace function public._require_user()
returns uuid language plpgsql stable as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'Cần đăng nhập' using errcode = '42501'; end if;
  return u;
end $$;

create or replace function public._require_admin(required text default null)
returns uuid language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin(required) then raise exception 'Cần quyền quản trị' using errcode = '42501'; end if;
  return auth.uid();
end $$;

-- "Cà phê Mây" → "MAY" + 4 ký tự ngẫu nhiên (bỏ chữ dễ nhầm I, O, 0, 1)
create or replace function public._gen_code(biz_name text)
returns text language plpgsql volatile as $$
declare
  words text[] := regexp_split_to_array(upper(unaccent(coalesce(biz_name, 'FREGO'))), '\s+');
  prefix text := rpad(left(regexp_replace(words[array_length(words, 1)], '[^A-Z]', '', 'g'), 3), 3, 'F');
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  s text := prefix;
begin
  for i in 1..4 loop
    s := s || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return s;
end $$;

create or replace function public._fmt_vnd(n bigint)
returns text language sql immutable as $$
  select regexp_replace(abs(n)::text, '(\d)(?=(\d{3})+$)', '\1.', 'g') || 'đ';
$$;

create or replace function public._provider_name(p text)
returns text language sql immutable as $$
  select case p when 'grab' then 'Grab' when 'be' then 'Be' when 'gsm' then 'Green SM' else p end;
$$;

create or replace function public._service_short(p text, v text)
returns text language sql immutable as $$
  select public._provider_name(p) || ' ' || case v when 'bike' then 'xe máy' when 'car4' then 'ô tô' else 'ô tô 7 chỗ' end;
$$;

create or replace function public._ledger(u uuid, d integer, why text, trip text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into points_ledger (user_id, delta, reason, trip_id) values (u, d, why, trip);
  update profiles set points = points + d where id = u;
end $$;

-- ───────────── record_trip: ghi lần so giá, phát mã cho ưu đãi chiến dịch ("cp:") ─────────────

create or replace function public.record_trip(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  item jsonb;
  out_attached jsonb := '[]'::jsonb;
  camp campaigns;
  biz businesses;
  v user_vouchers;
  t trips;
  cid text;
begin
  for item in select * from jsonb_array_elements(coalesce(args->'attached', '[]'::jsonb)) loop
    if item->>'refId' like 'cp:%' then
      cid := substr(item->>'refId', 4);
      select * into camp from campaigns where id = cid for update;
      if not found or camp.status <> 'active' or camp.spent >= camp.budget then
        raise exception 'Chiến dịch đã dừng';
      end if;
      select * into v from user_vouchers
        where user_id = u and campaign_id = cid and status = 'active' limit 1;
      if not found then
        select * into biz from businesses where id = camp.business_id;
        insert into user_vouchers (user_id, source, campaign_id, code, provider_id, vehicle_class, amount, note, reasons, expires_at)
        values (u, 'sponsor', cid, public._gen_code(biz.name), camp.provider_id, camp.vehicle_class, camp.amount,
                'Ưu đãi khi đến gần ' || biz.name,
                array['Điểm đến nằm trong vùng ' || camp.radius_m || ' m quanh quán.'],
                camp.ends_at)
        returning * into v;
        update campaigns set issued_count = issued_count + 1 where id = cid;
      end if;
      item := item || jsonb_build_object('refId', 'uv:' || v.id, 'code', v.code);
    elsif item->>'refId' like 'uv:%' then
      -- Mã trong ví phải là của chính người dùng.
      if not exists (select 1 from user_vouchers where id = substr(item->>'refId', 4) and user_id = u and status = 'active') then
        raise exception 'Mã không còn dùng được';
      end if;
    end if;
    out_attached := out_attached || jsonb_build_array(item);
  end loop;

  insert into trips (user_id, origin_label, origin_place_id, dest_place_id, dest_label, distance_km, duration_min, attached,
                     chosen_service, estimate_low, estimate_high, compared_count, status, opened_at)
  values (u, args->>'originLabel', args->>'originPlaceId', args->>'destPlaceId', args->>'destLabel',
          (args->>'distanceKm')::numeric, (args->>'durationMin')::int, out_attached,
          args->>'chosenService', (args->>'estimateLow')::int, (args->>'estimateHigh')::int,
          coalesce((args->>'comparedCount')::int, 0),
          case when args->>'chosenService' is null then 'compared' else 'opened' end,
          case when args->>'chosenService' is null then null else now() end)
  returning * into t;

  if exists (select 1 from places where id = args->>'destPlaceId') then
    insert into recent_searches (user_id, place_id, searched_at) values (u, args->>'destPlaceId', now())
    on conflict (user_id, place_id) do update set searched_at = excluded.searched_at;
  end if;

  return to_jsonb(t);
end $$;

-- ───────────── mark_code_used: hãng báo mã đã dùng (tạm thời: người dùng xác nhận đã đặt xe) ─────────────

create or replace function public.mark_code_used(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  t trips;
  v_code jsonb;
  pv text;
  vc text;
  v user_vouchers;
  camp campaigns;
  fee int := 0;
  note notifications;
begin
  select * into t from trips where id = args->>'tripId' and user_id = u for update;
  if not found then raise exception 'Không tìm thấy chuyến'; end if;
  if t.status <> 'opened' or t.chosen_service is null then
    return jsonb_build_object('trip', to_jsonb(t), 'notification', null);
  end if;
  pv := split_part(t.chosen_service, '-', 1);
  vc := split_part(t.chosen_service, '-', 2);
  select e into v_code from jsonb_array_elements(t.attached) e where e->>'service' = t.chosen_service limit 1;

  update trips set status = 'code_used', code_used_at = now() where id = t.id returning * into t;

  if v_code is not null then
    if v_code->>'refId' like 'uv:%' then
      update user_vouchers set status = 'used', used_at = now(), trip_id = t.id
        where id = substr(v_code->>'refId', 4) and user_id = u returning * into v;
      if v.campaign_id is not null then
        select * into camp from campaigns where id = v.campaign_id for update;
        fee := 3000; -- brand.serviceFeePerCode
        update campaigns set used_count = used_count + 1, spent = spent + (v_code->>'amount')::int + fee where id = camp.id;
      end if;
      if v.frego_code_id is not null then
        update frego_codes set used_count = used_count + 1 where id = v.frego_code_id;
      end if;
    elsif v_code->>'refId' like 'pc:%' then
      update public_codes set used_count = used_count + 1 where id = substr(v_code->>'refId', 4);
    end if;
    insert into redemptions (source, user_voucher_id, public_code_id, campaign_id, business_id, provider_id, vehicle_class, amount, fee, trip_id)
    values (v_code->>'source', v.id, case when v_code->>'refId' like 'pc:%' then substr(v_code->>'refId', 4) end,
            camp.id, camp.business_id, pv, vc, (v_code->>'amount')::int, fee, t.id);
    update profiles set saved_amount = saved_amount + (v_code->>'amount')::int, saved_count = saved_count + 1 where id = u;
  end if;

  if coalesce((select report from notification_prefs where user_id = u), true) then
    insert into notifications (user_id, category, kind, icon, tone, logo, title, body, cta, link)
    values (u, 'trip', 'code_used', 'receipt', 'tint', pv,
            case when v_code is null then 'Chuyến ' || public._provider_name(pv) || ' đã hoàn tất'
                 else 'Mã ' || (v_code->>'code') || ' vừa được dùng cho chuyến ' || public._provider_name(pv) end,
            'Giá thật tiết kiệm được bao nhiêu? Bấm đánh giá để được cộng điểm.', 'Báo giá ›', '/bao-gia/' || t.id)
    returning * into note;
  end if;

  return jsonb_build_object('trip', to_jsonb(t), 'notification', case when note.id is null then null else to_jsonb(note) end);
end $$;

-- ───────────── report_price: báo giá thật, cộng điểm (+10 một chạm, +50 nhập số tiền, x2 nơi chưa có dữ liệu) ─────────────

create or replace function public.report_price(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  t trips;
  pv text;
  vc text;
  mult int := 1;
  awarded int := 0;
  pts int;
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

  if v_verdict is not null and t.verdict is null then
    if v_verdict not in ('cheaper', 'within', 'pricier') then raise exception 'Giá trị không hợp lệ'; end if;
    pts := 10 * mult;
    update trips set verdict = v_verdict, report_source = coalesce(report_source, 'tap') where id = t.id;
    perform public._ledger(u, pts, 'Báo giá một chạm, ' || label, t.id);
    awarded := awarded + pts;
  end if;

  if v_paid is not null and v_paid > 0 and t.paid_amount is null then
    if v_paid > 5000000 then raise exception 'Số tiền không hợp lệ'; end if;
    pts := 50 * mult;
    update trips set paid_amount = v_paid, report_source = 'amount',
      verdict = coalesce(trips.verdict, case
        when t.estimate_low is null then null
        when v_paid < t.estimate_low then 'cheaper'
        when v_paid > t.estimate_high then 'pricier'
        else 'within' end)
    where id = t.id;
    perform public._ledger(u, pts, 'Nhập số tiền chuyến ' || public._provider_name(pv) || ', trả ' || public._fmt_vnd(v_paid), t.id);
    awarded := awarded + pts;
  end if;

  if awarded > 0 then
    update trips set status = 'reported', reported_at = now(), points_awarded = points_awarded + awarded where id = t.id;
  end if;
  select * into t from trips where id = t.id;
  return jsonb_build_object('trip', to_jsonb(t), 'points_awarded', awarded, 'points', (select points from profiles where id = u));
end $$;

-- ───────────── redeem_reward: đổi điểm lấy voucher Frego ─────────────

create or replace function public.redeem_reward(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  r rewards;
  fc frego_codes;
  p profiles;
  v user_vouchers;
begin
  select * into r from rewards where id = args->>'rewardId' and active;
  if not found then raise exception 'Quà không còn'; end if;
  select * into p from profiles where id = u for update;
  if p.points < r.cost then raise exception 'Thiếu % điểm', r.cost - p.points; end if;
  select * into fc from frego_codes where id = r.frego_code_id;
  perform public._ledger(u, -r.cost, 'Đổi voucher ' || public._service_short(r.provider_id, r.vehicle_class) || ' −' || public._fmt_vnd(r.amount), null);
  update rewards set redeemed_count = redeemed_count + 1 where id = r.id;
  update frego_codes set issued_count = issued_count + 1 where id = fc.id;
  insert into user_vouchers (user_id, source, frego_code_id, code, provider_id, vehicle_class, amount, note, expires_at)
  values (u, 'frego', fc.id, fc.code, r.provider_id, r.vehicle_class, r.amount,
          'Đổi từ ' || regexp_replace(r.cost::text, '(\d)(?=(\d{3})+$)', '\1.', 'g') || ' điểm thưởng',
          now() + make_interval(days => fc.valid_days))
  returning * into v;
  return jsonb_build_object('voucher', to_jsonb(v), 'points', (select points from profiles where id = u));
end $$;

-- ───────────── vote_public_code: "Dùng được" / "Không dùng được" ─────────────

create or replace function public.vote_public_code(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  cid text := args->>'publicCodeId';
  v_works boolean := (args->>'works')::boolean;
  prev code_votes;
  c public_codes;
begin
  select * into c from public_codes where id = cid for update;
  if not found then raise exception 'Không tìm thấy mã'; end if;
  select * into prev from code_votes where user_id = u and public_code_id = cid;
  if found then
    if prev.works <> v_works then
      update code_votes set works = v_works, created_at = now() where id = prev.id;
      update public_codes set
        ok_reports_24h = ok_reports_24h + case when v_works then 1 else -1 end,
        bad_reports_24h = bad_reports_24h + case when v_works then -1 else 1 end
      where id = cid;
    end if;
  else
    insert into code_votes (user_id, public_code_id, works) values (u, cid, v_works);
    update public_codes set
      ok_reports_24h = ok_reports_24h + case when v_works then 1 else 0 end,
      bad_reports_24h = bad_reports_24h + case when v_works then 0 else 1 end
    where id = cid;
  end if;
  -- Tự ẩn khi bị báo lỗi nhiều (brand.autoHideReportThreshold = 10).
  update public_codes set status = 'hidden' where id = cid and bad_reports_24h >= 10;
  select * into c from public_codes where id = cid;
  return jsonb_build_object('ok', c.ok_reports_24h, 'bad', c.bad_reports_24h);
end $$;

create or replace function public.mark_all_notifications_read(args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare u uuid := public._require_user(); n int;
begin
  update notifications set read_at = now() where user_id = u and read_at is null;
  get diagnostics n = row_count;
  return jsonb_build_object('count', n);
end $$;

-- ───────────── ensure_welcome_voucher: quà chào mừng FREGO10 (một lần) ─────────────

create or replace function public.ensure_welcome_voucher(args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  fc frego_codes;
  v user_vouchers;
begin
  if coalesce((select is_anonymous from auth.users where id = u), false) then
    return null; -- khách chưa đăng nhập bằng số điện thoại không nhận quà
  end if;
  select * into fc from frego_codes where kind = 'welcome' and active limit 1;
  if not found then return null; end if;
  if exists (select 1 from user_vouchers where user_id = u and frego_code_id = fc.id) then return null; end if;
  insert into user_vouchers (user_id, source, frego_code_id, code, provider_id, vehicle_class, amount, note, expires_at)
  values (u, 'frego', fc.id, fc.code, fc.provider_id, fc.vehicle_class, fc.amount,
          'Quà chào mừng khi bạn tham gia Frego', now() + make_interval(days => fc.valid_days))
  returning * into v;
  update frego_codes set issued_count = issued_count + 1 where id = fc.id;
  return to_jsonb(v);
end $$;

-- ───────────── Doanh nghiệp ─────────────

-- Đăng ký doanh nghiệp (DN 0): tạo hồ sơ chờ duyệt, người gửi là chủ cửa hàng.
create or replace function public.register_business(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  b businesses;
begin
  insert into businesses (name, legal_name, tax_code, representative, category, industry, address, district, landmark,
                          lat, lng, status, contact_email, contact_phone, invoice_name, invoice_email, transfer_code)
  values (args->>'name', coalesce(args->>'legalName', ''), coalesce(args->>'taxCode', ''), coalesce(args->>'representative', ''),
          coalesce(args->>'category', 'cafe'), coalesce(args->>'industry', ''), coalesce(args->>'address', ''),
          coalesce(args->>'district', ''), coalesce(args->>'landmark', ''),
          coalesce((args->>'lat')::float8, 10.7769), coalesce((args->>'lng')::float8, 106.7009),
          case when coalesce((args->>'draft')::boolean, false) then 'draft' else 'pending' end,
          coalesce(args->>'contactEmail', ''), coalesce(args->>'contactPhone', ''),
          coalesce(args->>'legalName', ''), coalesce(args->>'contactEmail', ''),
          'FREGO ' || upper(substr(md5(random()::text), 1, 6)))
  returning * into b;
  insert into business_members (business_id, user_id, email, role) values (b.id, u, coalesce(args->>'contactEmail', ''), 'owner');
  return to_jsonb(b);
end $$;

-- ───────────── Quản trị ─────────────

create or replace function public.review_business(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b businesses;
begin
  perform public._require_admin('ops');
  update businesses set status = case when (args->>'approve')::boolean then 'active' else 'rejected' end
    where id = args->>'businessId' returning * into b;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops', case when (args->>'approve')::boolean then 'Duyệt doanh nghiệp ' else 'Từ chối doanh nghiệp ' end || b.name);
  return to_jsonb(b);
end $$;

create or replace function public.set_business_status(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b businesses;
begin
  perform public._require_admin('ops');
  if args->>'status' not in ('active', 'locked') then raise exception 'Trạng thái không hợp lệ'; end if;
  update businesses set status = args->>'status' where id = args->>'businessId' returning * into b;
  if b.status = 'locked' then
    update campaigns set status = 'paused' where business_id = b.id and status = 'active';
  end if;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops', case when b.status = 'locked' then 'Tạm khóa ' else 'Mở khóa ' end || b.name || coalesce(', lý do ' || (args->>'reason'), ''));
  return to_jsonb(b);
end $$;

create or replace function public.set_user_status(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  perform public._require_admin();
  if args->>'status' not in ('active', 'locked') then raise exception 'Trạng thái không hợp lệ'; end if;
  update profiles set status = args->>'status', lock_reason = case when args->>'status' = 'locked' then args->>'reason' end
    where id = (args->>'userId')::uuid returning * into p;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops', case when p.status = 'locked' then 'Tạm khóa ' else 'Mở khóa ' end || p.display_name || coalesce(', lý do ' || (args->>'reason'), ''));
  return to_jsonb(p);
end $$;

create or replace function public.confirm_topup(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tx wallet_transactions; b businesses;
begin
  perform public._require_admin('accounting');
  select * into tx from wallet_transactions where id = args->>'transactionId' and kind = 'topup' for update;
  if not found then raise exception 'Không tìm thấy giao dịch nạp'; end if;
  if tx.status <> 'done' then
    update wallet_transactions set status = 'done' where id = tx.id;
    update businesses set wallet_balance = wallet_balance + tx.amount where id = tx.business_id;
    insert into audit_logs (actor_name, actor_role, action)
    select 'Kế toán', 'accounting', 'Khớp nạp tiền ' || public._fmt_vnd(tx.amount) || ', ' || name from businesses where id = tx.business_id;
  end if;
  select * into b from businesses where id = tx.business_id;
  return jsonb_build_object('balance', b.wallet_balance);
end $$;

create or replace function public.adjust_points(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare target uuid := (args->>'userId')::uuid; d int := (args->>'delta')::int;
begin
  perform public._require_admin('support');
  perform public._ledger(target, d, args->>'reason', null);
  insert into audit_logs (actor_name, actor_role, action)
  select 'Hỗ trợ', 'support', 'Điều chỉnh ' || case when d > 0 then '+' else '' end || d || ' điểm cho ' || display_name || ': ' || (args->>'reason')
  from profiles where id = target;
  return jsonb_build_object('points', (select points from profiles where id = target));
end $$;

-- ───────────── Ràng buộc chuyển trạng thái chiến dịch (chủ quán không tự duyệt) ─────────────

create or replace function public._campaign_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  -- Chủ quán: nháp ↔ chờ duyệt; đang chạy ↔ tạm dừng (đã được duyệt); kết thúc.
  if new.status <> old.status and not (
       (old.status in ('draft', 'rejected') and new.status in ('draft', 'pending'))
    or (old.status = 'pending' and new.status = 'draft')
    or (old.status = 'active' and new.status in ('paused', 'ended'))
    or (old.status = 'paused' and new.status in ('active', 'ended') and old.approved_at is not null)
  ) then
    raise exception 'Không thể chuyển chiến dịch từ % sang %', old.status, new.status using errcode = '42501';
  end if;
  new.approved_at := old.approved_at;
  if new.status = 'pending' then new.reject_reason := null; new.submitted_at := coalesce(new.submitted_at, now()); end if;
  -- Đổi hãng, loại xe, mức giảm, vùng khi đang chạy → cần duyệt lại. Đổi ngân sách thì không.
  if old.status in ('active', 'paused') and (new.provider_id, new.vehicle_class, new.amount, new.radius_m, new.image_url)
     is distinct from (old.provider_id, old.vehicle_class, old.amount, old.radius_m, old.image_url) then
    new.status := 'pending';
    new.submitted_at := now();
  end if;
  return new;
end $$;

create trigger campaigns_guard before update on public.campaigns
for each row execute function public._campaign_guard();

-- Đổi địa chỉ quán → chiến dịch đang chạy cần duyệt lại.
create or replace function public._business_address_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null
     and (new.lat, new.lng, new.address) is distinct from (old.lat, old.lng, old.address) then
    update campaigns set status = 'pending', submitted_at = now() where business_id = new.id and status = 'active';
  end if;
  return new;
end $$;

create trigger businesses_address_guard after update on public.businesses
for each row execute function public._business_address_guard();

-- ───────────── Quyền gọi ─────────────

revoke all on function public._ledger(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public._gen_code(text) from public, anon, authenticated;
grant execute on function
  public.record_trip(jsonb), public.mark_code_used(jsonb), public.report_price(jsonb), public.redeem_reward(jsonb),
  public.vote_public_code(jsonb), public.mark_all_notifications_read(jsonb), public.ensure_welcome_voucher(jsonb),
  public.register_business(jsonb), public.review_business(jsonb), public.set_business_status(jsonb),
  public.set_user_status(jsonb), public.confirm_topup(jsonb), public.adjust_points(jsonb)
to authenticated;
