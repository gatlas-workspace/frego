-- Frego · Tự lấy giá từ biên nhận email (Gmail) — chủ dự án duyệt làm ngay 27/11/2026 (docs/plan.md, "Đã chốt").
-- Máy chủ web (apps/web/src/app/api/gmail/*) giữ refresh token Gmail đã mã hóa AES-256-GCM, đọc thư biên nhận
-- Grab / Be / Green SM, bóc bằng packages/core/src/receipts.ts rồi gọi record_receipt bằng service role.
-- Bản JS tương ứng: packages/core/src/db/memory.ts (view gmail_connections_public, RPC record_receipt) — sửa một bên
-- phải sửa bên kia. Phần cộng điểm giống nhánh "nhập số tiền" của report_price (20261127000500_points_rules.sql).

-- ───────────── Kết nối Gmail ─────────────

create table public.gmail_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email text not null,
  -- "v1.<iv>.<tag>.<ciphertext>" (base64url), khóa GMAIL_TOKEN_KEY chỉ có ở máy chủ web. Không bao giờ trả cho app.
  refresh_token_enc text not null,
  status text not null default 'active' check (status in ('active', 'error')),
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_error text
);
alter table public.gmail_connections enable row level security;
-- Không có policy cho người dùng: anon/authenticated không đọc/ghi được bảng (kể cả cột token).
-- Chỉ service role (máy chủ web) ghi; người dùng xem trạng thái của mình qua view bên dưới.
revoke all on public.gmail_connections from public, anon, authenticated;
grant select, insert, update, delete on public.gmail_connections to service_role;

-- View chạy quyền chủ view, chỉ lộ cột an toàn và chỉ dòng của người đang đăng nhập (giống businesses_public).
create view public.gmail_connections_public with (security_invoker = false) as
select user_id, email, status, connected_at, last_sync_at, last_error
from public.gmail_connections
where user_id = auth.uid();

revoke all on public.gmail_connections_public from public, anon, authenticated;
grant select on public.gmail_connections_public to authenticated;

-- ───────────── Biên nhận đã ghi ─────────────

create table public.gmail_receipts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.profiles (id) on delete cascade,
  message_id text not null,
  provider_id text not null check (provider_id in ('grab', 'be', 'gsm')),
  paid_amount integer not null check (paid_amount > 0 and paid_amount <= 5000000),
  received_at timestamptz not null,
  trip_at timestamptz,
  pickup text,
  dropoff text,
  promo_code text,
  trip_id text references public.trips (id) on delete set null,
  status text not null check (status in ('matched', 'unmatched', 'already_reported')),
  points_awarded integer not null default 0,
  held text,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);
create index gmail_receipts_user_idx on public.gmail_receipts (user_id, created_at desc);
create index gmail_receipts_trip_idx on public.gmail_receipts (trip_id);

alter table public.gmail_receipts enable row level security;
-- Người dùng chỉ đọc biên nhận của mình; quản trị đọc để xử lý khiếu nại điểm. Chỉ RPC record_receipt ghi.
create policy gmail_receipts_self_read on public.gmail_receipts for select using (user_id = auth.uid() or public.is_admin());
revoke all on public.gmail_receipts from public, anon, authenticated;
grant select on public.gmail_receipts to authenticated;
grant select, insert, update, delete on public.gmail_receipts to service_role;

-- ───────────── RPC: ghi 1 biên nhận (chỉ service role) ─────────────
-- args: { userId, messageId, providerId, paidAmount, receivedAt, tripAt?, pickup?, dropoff?, promoCode? }
-- Khớp chuyến của userId, cùng hãng, mở app hãng trong 3 giờ trước biên nhận (lệch đồng hồ 15 phút), chưa có số tiền.
-- Không ghi trùng: mỗi (userId, messageId) một lần.

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

revoke all on function public.record_receipt(jsonb) from public, anon, authenticated;
grant execute on function public.record_receipt(jsonb) to service_role;

-- ───────────── "Đã cài app" thay cho "Liên kết" Grab / Be / Green SM ─────────────
-- Frego chỉ ghi nhận người dùng có cài app để ưu tiên mã; không biết khi mã được dùng (biết qua biên nhận Gmail
-- hoặc người dùng báo). Khớp packages/core/src/seed/base.ts (partners).

update public.partners set
  description = 'Bấm nếu bạn có cài app ' || name || ' để ưu tiên mã cho hãng này',
  linked_description = 'Đã cài app · ưu tiên mã ' || name || ' khi so giá',
  integration = 'record_only'
where id in ('grab', 'be', 'gsm');
