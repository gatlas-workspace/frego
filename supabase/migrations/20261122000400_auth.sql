-- Frego · tạo hồ sơ khi có tài khoản Supabase Auth mới (OTP số điện thoại, email, hoặc khách ẩn danh).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, display_name)
  values (new.id, coalesce(new.phone, ''), coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  insert into public.consents (user_id) values (new.id) on conflict do nothing;
  insert into public.notification_prefs (user_id) values (new.id) on conflict do nothing;
  -- Lời mời thành viên doanh nghiệp theo email: gắn tài khoản vừa tạo.
  if new.email is not null then
    update public.business_members set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  end if;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
