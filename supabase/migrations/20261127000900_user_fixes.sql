-- Frego · sửa lỗi ưu tiên sau đợt thử vai trò (27/11/2026) — phần người dùng.
-- Khớp JS trong packages/core/src/db/memory.ts.

-- ───────────── record_trip: khách (tài khoản ẩn danh) không nhận mã của quán tài trợ ─────────────

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
  -- Tài khoản ẩn danh (khách "Xem voucher trước") không được phát mã của quán tài trợ: mỗi mã là tiền của quán
  -- (chốt 27/11/2026). Khách vẫn so giá, dùng mã công khai được.
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false)
     and exists (select 1 from jsonb_array_elements(coalesce(args->'attached', '[]'::jsonb)) e where e->>'refId' like 'cp:%') then
    raise exception 'Cần đăng nhập để nhận mã của quán' using errcode = '42501';
  end if;
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

-- ───────────── delete_my_account: người dùng tự xóa tài khoản và dữ liệu ─────────────
-- Mọi bảng của người dùng tham chiếu profiles(id) "on delete cascade"; profiles tham chiếu auth.users "on delete cascade".
-- Số liệu tổng của doanh nghiệp (issued_count, used_count, spent) giữ nguyên vì không gắn với người nhận.

create or replace function public.delete_my_account(args jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
begin
  if public.is_admin() or exists (select 1 from business_members where user_id = u) then
    raise exception 'Tài khoản đang quản lý doanh nghiệp hoặc quản trị: liên hệ Frego để xóa' using errcode = '42501';
  end if;
  delete from auth.users where id = u;
  return jsonb_build_object('deleted', true);
end $$;

revoke all on function public.delete_my_account(jsonb) from public, anon;
grant execute on function public.delete_my_account(jsonb) to authenticated;
