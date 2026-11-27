-- Frego · Lời nhắc báo giá không nói mã "đã được dùng".
-- Frego chưa có API đối tác nên không biết mã có được dùng hay không: chỉ biết người dùng đã mở app hãng kèm mã
-- (sau đó mới biết qua biên nhận Gmail hoặc người dùng tự báo). Thông báo của mark_code_used đổi thành câu hỏi
-- "Chuyến Be với mã FREGO20 thế nào?". Giữ nguyên kind 'code_used' và link /bao-gia/<tripId>.
-- Bản JS tương ứng: packages/core/src/db/memory.ts (RPC mark_code_used) — sửa một bên phải sửa bên kia.
-- Phần còn lại của hàm giữ nguyên như 20261122000300_rpc.sql.

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
            case when v_code is null then 'Chuyến ' || public._provider_name(pv) || ' thế nào?'
                 else 'Chuyến ' || public._provider_name(pv) || ' với mã ' || (v_code->>'code') || ' thế nào?' end,
            case when v_code is null then 'Bạn vừa mở app ' || public._provider_name(pv) || '. Báo giá thật để được cộng điểm.'
                 else 'Bạn vừa mở app ' || public._provider_name(pv) || ' kèm mã ' || (v_code->>'code')
                      || '. Báo giá thật để được cộng điểm.' end,
            'Báo giá ›', '/bao-gia/' || t.id)
    returning * into note;
  end if;

  return jsonb_build_object('trip', to_jsonb(t), 'notification', case when note.id is null then null else to_jsonb(note) end);
end $$;
