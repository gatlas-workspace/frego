-- Frego · phân quyền (RLS bật trên MỌI bảng)
-- Vai trò:
--   người dùng app  → chỉ đọc/ghi dữ liệu của chính mình
--   doanh nghiệp    → thành viên business_members (owner, accountant) của quán; chỉ số liệu tổng, không thấy người nhận mã
--   quản trị Frego  → profiles.role = 'admin' (admin_role: ops | accounting | support)
-- Lệnh nhạy cảm (cộng điểm, phát mã, khớp tiền) chỉ qua hàm RPC security definer (migration _rpc).

-- ───────────── Hàm trợ giúp ─────────────

create or replace function public.is_admin(required text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
      and (required is null or p.admin_role = required or p.admin_role = 'ops')
  );
$$;

create or replace function public.is_member(bid text, required text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = bid
      and m.user_id = auth.uid()
      and (required is null or m.role = required)
  );
$$;

create or replace function public.my_business_ids()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.business_members where user_id = auth.uid();
$$;

-- ───────────── Bật RLS ─────────────

do $$
declare t text;
begin
  foreach t in array array[
    'places', 'fare_tables', 'partners', 'profiles', 'consents', 'notification_prefs', 'saved_places',
    'recent_searches', 'linked_accounts', 'businesses', 'business_members', 'campaigns', 'campaign_events',
    'frego_codes', 'rewards', 'user_vouchers', 'public_codes', 'code_votes', 'trips', 'points_ledger',
    'notifications', 'wallet_transactions', 'invoices', 'redemptions', 'support_tickets', 'audit_logs',
    'broadcasts', 'stats'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- ───────────── Danh mục: ai cũng đọc, chỉ quản trị sửa ─────────────

create policy places_read on public.places for select using (true);
create policy places_admin on public.places for all using (public.is_admin()) with check (public.is_admin());

create policy fare_tables_read on public.fare_tables for select using (true);
create policy fare_tables_admin on public.fare_tables for all using (public.is_admin('ops')) with check (public.is_admin('ops'));

create policy partners_read on public.partners for select using (true);
create policy partners_admin on public.partners for all using (public.is_admin('ops')) with check (public.is_admin('ops'));

create policy rewards_read on public.rewards for select using (active or public.is_admin());
create policy rewards_admin on public.rewards for all using (public.is_admin('ops')) with check (public.is_admin('ops'));

create policy frego_codes_admin on public.frego_codes for all using (public.is_admin()) with check (public.is_admin('ops'));

create policy public_codes_read on public.public_codes for select using (status = 'live' or public.is_admin());
create policy public_codes_admin on public.public_codes for all using (public.is_admin('ops')) with check (public.is_admin('ops'));

-- ───────────── Dữ liệu của người dùng ─────────────

create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
-- Người dùng chỉ sửa được cột hồ sơ (cột điểm, vai trò, khóa bị chặn bằng quyền cột bên dưới).
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());

create policy consents_self on public.consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy consents_admin_read on public.consents for select using (public.is_admin());

create policy prefs_self on public.notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy saved_places_self on public.saved_places for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy recent_searches_self on public.recent_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy linked_accounts_self on public.linked_accounts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy linked_accounts_admin_read on public.linked_accounts for select using (public.is_admin());

create policy user_vouchers_self_read on public.user_vouchers for select using (user_id = auth.uid() or public.is_admin());
create policy code_votes_self_read on public.code_votes for select using (user_id = auth.uid() or public.is_admin());
create policy trips_self_read on public.trips for select using (user_id = auth.uid() or public.is_admin());
create policy points_ledger_self_read on public.points_ledger for select using (user_id = auth.uid() or public.is_admin());

create policy notifications_self_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_self_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───────────── Doanh nghiệp ─────────────

create policy businesses_member_read on public.businesses for select using (public.is_member(id) or public.is_admin());
create policy businesses_owner_update on public.businesses for update using (public.is_member(id, 'owner')) with check (public.is_member(id, 'owner'));
create policy businesses_admin on public.businesses for all using (public.is_admin()) with check (public.is_admin());
-- Đăng ký doanh nghiệp: người đã đăng nhập tạo hồ sơ chờ duyệt (thành viên owner thêm bằng RPC register_business).

create policy members_read on public.business_members for select using (public.is_member(business_id) or public.is_admin());
create policy members_owner_write on public.business_members for all
  using (public.is_member(business_id, 'owner')) with check (public.is_member(business_id, 'owner'));
create policy members_admin on public.business_members for all using (public.is_admin()) with check (public.is_admin());

create policy campaigns_member_read on public.campaigns for select using (public.is_member(business_id) or public.is_admin());
-- Chủ quán tạo nháp / gửi duyệt / tạm dừng; không tự chuyển sang 'active' (chỉ quản trị duyệt).
create policy campaigns_owner_insert on public.campaigns for insert
  with check (public.is_member(business_id, 'owner') and status in ('draft', 'pending'));
create policy campaigns_owner_update on public.campaigns for update
  using (public.is_member(business_id, 'owner'))
  with check (public.is_member(business_id, 'owner') and status in ('draft', 'pending', 'paused', 'active', 'ended'));
create policy campaigns_admin on public.campaigns for all using (public.is_admin()) with check (public.is_admin());

create policy campaign_events_read on public.campaign_events for select
  using (public.is_admin() or exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.business_id)));
create policy campaign_events_write on public.campaign_events for insert
  with check (public.is_admin() or exists (select 1 from public.campaigns c where c.id = campaign_id and public.is_member(c.business_id, 'owner')));

create policy wallet_tx_read on public.wallet_transactions for select using (public.is_member(business_id) or public.is_admin());
-- Doanh nghiệp chỉ báo "đã chuyển khoản" (topup chờ khớp); khớp tiền qua RPC confirm_topup.
create policy wallet_tx_member_topup on public.wallet_transactions for insert
  with check (public.is_member(business_id) and kind = 'topup' and status = 'pending' and amount > 0);
create policy wallet_tx_admin on public.wallet_transactions for all using (public.is_admin('accounting')) with check (public.is_admin('accounting'));

create policy invoices_read on public.invoices for select using (public.is_member(business_id) or public.is_admin());
create policy invoices_admin on public.invoices for all using (public.is_admin('accounting')) with check (public.is_admin('accounting'));

-- Doanh nghiệp không đọc redemptions từng dòng (có liên kết người dùng); chỉ xem stats tổng hợp.
create policy redemptions_admin on public.redemptions for select using (public.is_admin());

create policy stats_read on public.stats for select
  using (
    public.is_admin()
    or (scope like 'biz:%' and public.is_member(substr(scope, 5)))
    or (scope like 'cp:%' and exists (select 1 from public.campaigns c where c.id = substr(scope, 4) and public.is_member(c.business_id)))
  );
create policy stats_admin on public.stats for all using (public.is_admin()) with check (public.is_admin());

-- ───────────── Hệ thống ─────────────

create policy support_admin on public.support_tickets for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());
create policy audit_admin_insert on public.audit_logs for insert with check (public.is_admin());
create policy broadcasts_admin on public.broadcasts for all using (public.is_admin('ops')) with check (public.is_admin('ops'));

-- ───────────── Quyền bảng và cột ─────────────

grant usage on schema public to anon, authenticated;
grant select on public.places, public.fare_tables, public.partners, public.rewards, public.public_codes to anon, authenticated;
grant select on public.businesses_public, public.campaigns_public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Người dùng không tự sửa điểm, vai trò, trạng thái khóa: chỉ cho update các cột hồ sơ.
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, birthday, interests, vehicle_prefs, onboarded_at) on public.profiles to authenticated;
-- Quản trị khóa/mở người dùng qua RPC set_user_status (security definer), không qua quyền cột.

-- Chủ quán không tự sửa số dư ví, trạng thái duyệt.
revoke update on public.businesses from authenticated;
grant update (name, industry, address, landmark, lat, lng, open_hours, auto_topup, invoice_name, invoice_email, contact_email,
  contact_phone, logo_url, notify_prefs) on public.businesses to authenticated;

-- Chiến dịch: chủ quán không tự sửa số đã chi, số mã.
revoke update on public.campaigns from authenticated;
grant update (name, status, provider_id, vehicle_class, amount, radius_m, hours_from, hours_to, only_open_hours, daily_cap, budget,
  starts_at, ends_at, image_url, submitted_at, reject_reason, approved_at) on public.campaigns to authenticated;

-- Bảng chỉ ghi qua RPC.
revoke insert, update, delete on public.user_vouchers, public.trips, public.points_ledger, public.code_votes, public.redemptions
  from authenticated;
revoke insert, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
