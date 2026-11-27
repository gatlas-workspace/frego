-- Frego · quà chào mừng FREGO20: 20.000đ cho chuyến Be xe máy, giới hạn 50 suất (brand.welcomeQuota).
alter table public.frego_codes add column quota integer check (quota is null or quota > 0);

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
  -- Giữ một suất (nguyên tử): hết suất thì không phát.
  update frego_codes set issued_count = issued_count + 1
  where id = fc.id and (quota is null or issued_count < quota)
  returning * into fc;
  if not found then return null; end if;
  insert into user_vouchers (user_id, source, frego_code_id, code, provider_id, vehicle_class, amount, note, expires_at)
  values (u, 'frego', fc.id, fc.code, fc.provider_id, fc.vehicle_class, fc.amount,
          'Quà chào mừng khi bạn tham gia Frego', now() + make_interval(days => fc.valid_days))
  returning * into v;
  return to_jsonb(v);
end $$;
