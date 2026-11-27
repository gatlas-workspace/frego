-- Frego · quy tắc điểm theo trang "Điểm và mã Frego" (QT 8):
--   nhập số tiền chỉ cộng điểm khi lệch không quá 30% so với ước tính;
--   tối đa 300 điểm báo giá mỗi người mỗi ngày (giờ VN), vượt thì giữ lại để kiểm tra.
-- Khớp packages/core/src/db/memory.ts (report_price) và POINTS_RULES trong catalog.ts.

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
  select * into t from trips where id = t.id;
  return jsonb_build_object('trip', to_jsonb(t), 'points_awarded', awarded,
                            'points', (select points from profiles where id = u), 'held', held);
end $$;

-- Quản trị đếm người nhận tin theo cài đặt thông báo (QT 9).
create policy prefs_admin_read on public.notification_prefs for select using (public.is_admin());
