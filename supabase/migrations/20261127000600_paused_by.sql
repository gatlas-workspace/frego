-- Frego · phân biệt chiến dịch do doanh nghiệp tự dừng và do Frego dừng.
-- Chiến dịch Frego dừng (bị báo lỗi, doanh nghiệp bị khóa) chỉ quản trị được cho chạy lại.

alter table public.campaigns
  add column paused_by text check (paused_by in ('business', 'frego'));

grant update (paused_by) on public.campaigns to authenticated;

create or replace function public._campaign_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.uid() is null then return new; end if;
  -- Chủ quán: nháp ↔ chờ duyệt; đang chạy ↔ tạm dừng (đã được duyệt, không phải Frego dừng); kết thúc.
  if new.status <> old.status and not (
       (old.status in ('draft', 'rejected') and new.status in ('draft', 'pending'))
    or (old.status = 'pending' and new.status = 'draft')
    or (old.status = 'active' and new.status in ('paused', 'ended'))
    or (old.status = 'paused' and new.status = 'ended')
    or (old.status = 'paused' and new.status = 'active' and old.approved_at is not null
        and old.paused_by is distinct from 'frego')
  ) then
    raise exception 'Không thể chuyển chiến dịch từ % sang %', old.status, new.status using errcode = '42501';
  end if;
  new.approved_at := old.approved_at;
  -- Chủ quán không tự gán "Frego dừng".
  new.paused_by := case
    when new.status = 'paused' and old.status = 'paused' then old.paused_by
    when new.status = 'paused' then 'business'
    else null end;
  if new.status = 'pending' then new.reject_reason := null; new.submitted_at := coalesce(new.submitted_at, now()); end if;
  if old.status in ('active', 'paused') and (new.provider_id, new.vehicle_class, new.amount, new.radius_m, new.image_url)
     is distinct from (old.provider_id, old.vehicle_class, old.amount, old.radius_m, old.image_url) then
    new.status := 'pending';
    new.submitted_at := now();
  end if;
  return new;
end $$;

create or replace function public.set_business_status(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b businesses;
begin
  perform public._require_admin('ops');
  if args->>'status' not in ('active', 'locked') then raise exception 'Trạng thái không hợp lệ'; end if;
  update businesses set status = args->>'status' where id = args->>'businessId' returning * into b;
  if b.status = 'locked' then
    update campaigns set status = 'paused', paused_by = 'frego' where business_id = b.id and status = 'active';
  end if;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops', case when b.status = 'locked' then 'Tạm khóa ' else 'Mở khóa ' end || b.name || coalesce(', lý do ' || (args->>'reason'), ''));
  return to_jsonb(b);
end $$;

create or replace function public.review_business(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b businesses; ok boolean := (args->>'approve')::boolean;
begin
  perform public._require_admin('ops');
  update businesses set status = case when ok then 'active' else 'rejected' end
    where id = args->>'businessId' returning * into b;
  insert into audit_logs (actor_name, actor_role, action)
  values ('Vận hành Frego', 'ops',
          case when ok then 'Duyệt doanh nghiệp ' else 'Từ chối doanh nghiệp ' end || b.name
          || case when not ok and args->>'reason' is not null then ', lý do ' || (args->>'reason') else '' end);
  return to_jsonb(b);
end $$;
