-- Frego · schema chính
-- Tên cột snake_case khớp kiểu camelCase trong packages/core/src/types.ts (adapter tự đổi tên).
-- id dạng text để seed dùng id dễ đọc ('biz-cafe-may'); bản ghi mới tự sinh uuid.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

-- ───────────── Danh mục ─────────────

create table public.places (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  address text not null default '',
  district text not null default '',
  lat double precision not null,
  lng double precision not null,
  is_airport boolean not null default false
);

create table public.fare_tables (
  id text primary key default gen_random_uuid()::text,
  provider_id text not null check (provider_id in ('grab', 'be', 'gsm')),
  vehicle_class text not null check (vehicle_class in ('bike', 'car4', 'car7')),
  region text not null default 'hcm' check (region in ('hcm', 'hn')),
  open_fare integer not null,
  open_km numeric(5, 2) not null default 2,
  per_km integer not null,
  per_min integer not null,
  peak_factor numeric(4, 2) not null default 1.15,
  min_fare integer not null default 0,
  enabled boolean not null default false,
  report_count integer not null default 0,
  accuracy numeric(4, 3),
  median_bias numeric(5, 3),
  updated_at timestamptz not null default now(),
  unique (provider_id, vehicle_class, region)
);

create table public.partners (
  id text primary key,
  kind text not null check (kind in ('bank', 'wallet', 'app', 'email')),
  name text not null,
  mono text not null,
  description text not null default '',
  linked_description text,
  integration text not null default 'record_only' check (integration in ('live', 'record_only', 'planned')),
  sort_order integer not null default 0
);

-- ───────────── Người dùng ─────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null default '',
  display_name text not null default '',
  avatar_url text,
  birthday date,
  interests text[] not null default '{}',
  vehicle_prefs text[] not null default '{}',
  points integer not null default 0,
  saved_amount integer not null default 0,
  saved_count integer not null default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  admin_role text check (admin_role in ('ops', 'accounting', 'support')),
  status text not null default 'active' check (status in ('active', 'locked')),
  lock_reason text,
  created_at timestamptz not null default now(),
  onboarded_at timestamptz
);

create table public.consents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  location boolean not null default true,
  share_data boolean not null default false,
  personalized boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.notification_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  gift boolean not null default true,
  card boolean not null default true,
  expire boolean not null default true,
  report boolean not null default true,
  points boolean not null default true,
  promo boolean not null default false,
  quiet boolean not null default true
);

create table public.saved_places (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('home', 'work', 'school', 'gym', 'relative', 'other')),
  label text not null,
  place_id text not null references public.places (id),
  created_at timestamptz not null default now()
);

create table public.recent_searches (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id text not null references public.places (id),
  searched_at timestamptz not null default now(),
  unique (user_id, place_id)
);

create table public.linked_accounts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  partner_id text not null references public.partners (id),
  card_type text check (card_type in ('credit', 'debit')),
  linked_at timestamptz not null default now(),
  unique (user_id, partner_id)
);

-- ───────────── Doanh nghiệp, chiến dịch ─────────────

create table public.businesses (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  legal_name text not null default '',
  tax_code text not null default '',
  representative text not null default '',
  category text not null check (category in ('cafe', 'book', 'gym', 'cake', 'bowl', 'tea')),
  industry text not null default '',
  address text not null default '',
  district text not null default '',
  landmark text not null default '',
  lat double precision not null,
  lng double precision not null,
  open_hours jsonb not null default '{"weekdays":"07:00 – 22:00","saturday":"07:00 – 22:00","sunday":"07:00 – 22:00"}',
  status text not null default 'pending' check (status in ('draft', 'pending', 'active', 'locked', 'rejected')),
  wallet_balance bigint not null default 0,
  auto_topup jsonb not null default '{"enabled":false,"amount":2000000,"threshold":500000}',
  invoice_name text not null default '',
  invoice_email text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  logo_url text,
  storefront_verified boolean not null default false,
  transfer_code text not null default '',
  notify_prefs jsonb not null default '{"review":true,"lowBalance":true,"weekly":true}',
  joined_at timestamptz not null default now()
);

create table public.business_members (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  role text not null check (role in ('owner', 'accountant')),
  invited_at timestamptz not null default now(),
  unique (business_id, email)
);

create table public.campaigns (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'active', 'paused', 'ended', 'rejected')),
  reject_reason text,
  provider_id text not null check (provider_id in ('grab', 'be', 'gsm')),
  vehicle_class text not null check (vehicle_class in ('bike', 'car4', 'car7')),
  amount integer not null check (amount > 0),
  radius_m integer not null check (radius_m between 100 and 5000),
  hours_from text not null default '07:00',
  hours_to text not null default '22:00',
  only_open_hours boolean not null default true,
  daily_cap integer not null default 30,
  budget bigint not null default 0,
  spent bigint not null default 0,
  issued_count integer not null default 0,
  used_count integer not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  image_url text,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index campaigns_business_idx on public.campaigns (business_id);
create index campaigns_status_idx on public.campaigns (status);

create table public.campaign_events (
  id text primary key default gen_random_uuid()::text,
  campaign_id text not null references public.campaigns (id) on delete cascade,
  at timestamptz not null default now(),
  text text not null
);

-- ───────────── Mã, voucher ─────────────

create table public.frego_codes (
  id text primary key default gen_random_uuid()::text,
  code text not null,
  kind text not null check (kind in ('welcome', 'reward', 'promo')),
  provider_id text not null,
  vehicle_class text not null,
  amount integer not null,
  title text not null default '',
  valid_days integer not null default 30,
  issued_count integer not null default 0,
  used_count integer not null default 0,
  active boolean not null default true
);

create table public.rewards (
  id text primary key default gen_random_uuid()::text,
  provider_id text not null,
  vehicle_class text not null,
  amount integer not null,
  cost integer not null check (cost > 0),
  frego_code_id text not null references public.frego_codes (id),
  redeemed_count integer not null default 0,
  active boolean not null default true
);

create table public.user_vouchers (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source text not null check (source in ('sponsor', 'frego')),
  campaign_id text references public.campaigns (id),
  frego_code_id text references public.frego_codes (id),
  code text not null,
  provider_id text not null,
  vehicle_class text not null,
  amount integer not null,
  note text not null default '',
  reasons text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'used', 'expired')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  trip_id text
);
create index user_vouchers_user_idx on public.user_vouchers (user_id);

create table public.public_codes (
  id text primary key default gen_random_uuid()::text,
  code text not null,
  provider_id text not null check (provider_id in ('grab', 'be', 'gsm')),
  vehicle_classes text[] not null default '{bike,car4}',
  title text not null,
  amount integer,
  percent numeric(4, 3),
  max_amount integer,
  min_fare integer,
  requires_partner_id text references public.partners (id),
  airport_only boolean not null default false,
  notes text[] not null default '{}',
  conditions text[] not null default '{}',
  source_name text not null,
  source_url text not null,
  source_title text not null default '',
  last_checked_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'checking' check (status in ('live', 'checking', 'hidden', 'expired')),
  ok_reports_24h integer not null default 0,
  bad_reports_24h integer not null default 0,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  check (amount is not null or percent is not null)
);

create table public.code_votes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  public_code_id text not null references public.public_codes (id) on delete cascade,
  works boolean not null,
  created_at timestamptz not null default now(),
  unique (user_id, public_code_id)
);

-- ───────────── Chuyến, báo giá, điểm ─────────────

create table public.trips (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  origin_label text not null,
  origin_place_id text,
  dest_place_id text not null,
  dest_label text not null,
  distance_km numeric(6, 1) not null,
  duration_min integer not null,
  attached jsonb not null default '[]',
  chosen_service text,
  estimate_low integer,
  estimate_high integer,
  compared_count integer not null default 0,
  status text not null default 'compared' check (status in ('compared', 'opened', 'code_used', 'reported')),
  verdict text check (verdict in ('cheaper', 'within', 'pricier')),
  paid_amount integer,
  report_source text check (report_source in ('tap', 'amount', 'receipt')),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  code_used_at timestamptz,
  reported_at timestamptz
);
create index trips_user_idx on public.trips (user_id, created_at desc);

create table public.points_ledger (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  trip_id text,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

create table public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null check (category in ('voucher', 'trip')),
  kind text not null check (kind in ('code_used', 'gift', 'card_match', 'points', 'promo', 'expire')),
  icon text not null,
  tone text not null check (tone in ('tint', 'deal')),
  logo text not null,
  title text not null,
  body text not null,
  cta text not null default '',
  link text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ───────────── Tiền, đối soát, hỗ trợ ─────────────

create table public.wallet_transactions (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  kind text not null check (kind in ('topup', 'deduction', 'refund')),
  amount bigint not null,
  note text not null default '',
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  reference text,
  created_at timestamptz not null default now()
);
create index wallet_transactions_business_idx on public.wallet_transactions (business_id, created_at desc);

create table public.invoices (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  month text not null,
  amount bigint not null,
  status text not null default 'draft' check (status in ('draft', 'issued')),
  issued_at timestamptz,
  unique (business_id, month)
);

create table public.redemptions (
  id text primary key default gen_random_uuid()::text,
  source text not null check (source in ('sponsor', 'frego', 'public')),
  user_voucher_id text references public.user_vouchers (id),
  public_code_id text references public.public_codes (id),
  campaign_id text references public.campaigns (id),
  business_id text references public.businesses (id),
  provider_id text not null,
  vehicle_class text not null,
  amount integer not null,
  fee integer not null default 0,
  trip_id text,
  used_at timestamptz not null default now(),
  provider_confirmed boolean not null default false,
  deducted_at timestamptz
);
create index redemptions_business_idx on public.redemptions (business_id, used_at);

create table public.support_tickets (
  id text primary key default gen_random_uuid()::text,
  requester_name text not null,
  requester_kind text not null check (requester_kind in ('user', 'business')),
  topic text not null check (topic in ('data_delete', 'points', 'code', 'billing', 'other')),
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'done')),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id text primary key default gen_random_uuid()::text,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create table public.broadcasts (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  body text not null,
  audience text not null,
  scheduled_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  recipients integer not null default 0,
  created_at timestamptz not null default now()
);

-- Số liệu tổng hợp (job hằng đêm gộp từ redemptions, trips).
create table public.stats (
  id text primary key,
  scope text not null,
  metric text not null,
  period text not null,
  key text not null,
  value double precision not null,
  sort integer not null default 0
);
create index stats_scope_idx on public.stats (scope, metric, period);

-- ───────────── View công khai (chạy quyền chủ view, chỉ lộ cột an toàn) ─────────────

create view public.businesses_public with (security_invoker = false) as
select id, name, category, industry, landmark, address, district, lat, lng, open_hours, status, logo_url
from public.businesses
where status in ('active', 'locked');

create view public.campaigns_public with (security_invoker = false) as
select
  id, business_id, name, status, provider_id, vehicle_class, amount, radius_m, hours_from, hours_to,
  starts_at, ends_at, image_url,
  (status = 'active' and spent < budget and starts_at <= now() and ends_at > now()) as offering
from public.campaigns
where status in ('active', 'paused', 'ended');
