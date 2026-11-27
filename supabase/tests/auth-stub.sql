-- Giả lập tối thiểu những gì Supabase có sẵn, để chạy migration trên Postgres thường (chỉ dùng cho test local).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;
create schema if not exists auth;
create table if not exists auth.users (
  instance_id uuid,
  id uuid primary key,
  aud text,
  role text,
  created_at timestamptz default now(),
  email text,
  phone text,
  is_anonymous boolean not null default false,
  raw_user_meta_data jsonb not null default '{}'
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub', '')::uuid;
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;
grant usage on schema auth to anon, authenticated;
grant select on auth.users to authenticated;
