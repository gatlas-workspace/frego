-- Frego · sửa lỗi cổng doanh nghiệp + quản trị sau đợt thử 27/11/2026 (docs/plan.md mục 10–16, "làm hết").
-- Bản JS tương ứng: packages/core/src/db/memory.ts (RPC payos_credit_topup) và services/business.ts, admin-ops.ts.
--
-- 1. Nạp ví: mỗi lần nạp một nội dung chuyển khoản riêng (chỉ mục duy nhất), mã đơn PayOS, RPC webhook PayOS.
-- 2. Đổi địa chỉ quán: chiến dịch quay lại chờ duyệt kèm sự kiện ghi rõ lý do; chủ quán được cập nhật quận.
-- 3. Trả lời yêu cầu hỗ trợ: bảng ticket_messages (RLS: người gửi xem yêu cầu của mình, quản trị hỗ trợ xem tất cả).
-- Trạng thái "Đã duyệt · chạy từ dd/mm" KHÔNG lưu riêng: tính từ status = 'active' và starts_at > now()
-- (view campaigns_public đã có cột offering = … and starts_at <= now()).

-- ───────────── 1. Nạp ví ─────────────

alter table public.wallet_transactions add column order_code bigint;
create unique index wallet_transactions_order_code_uidx on public.wallet_transactions (order_code) where order_code is not null;

-- Dữ liệu cũ dùng chung nội dung chuyển khoản ("FREGO CPM1024") cho mọi lần nạp: đánh số lại các dòng trùng.
with d as (
  select id, reference, row_number() over (partition by reference order by created_at, id) as rn,
         count(*) over (partition by reference) as n
  from public.wallet_transactions
  where kind = 'topup' and reference is not null
)
update public.wallet_transactions w
set reference = d.reference || '-cu' || d.rn
from d
where w.id = d.id and d.n > 1;

create unique index wallet_transactions_topup_reference_uidx on public.wallet_transactions (reference)
  where kind = 'topup' and reference is not null;

-- Webhook PayOS (máy chủ web, đã kiểm chữ ký HMAC): cộng tiền cho lần nạp có mã đơn. Không cộng hai lần; số tiền phải khớp.
create or replace function public.payos_credit_topup(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare tx wallet_transactions; b businesses; amt bigint := (args->>'amount')::bigint;
begin
  select * into tx from wallet_transactions
  where kind = 'topup' and order_code = (args->>'orderCode')::bigint
  for update;
  if not found then
    return jsonb_build_object('credited', false, 'balance', null, 'reason', 'not_found');
  end if;
  select * into b from businesses where id = tx.business_id for update;
  if tx.status = 'done' then
    return jsonb_build_object('credited', false, 'balance', b.wallet_balance, 'reason', 'already');
  end if;
  if tx.amount <> amt then
    return jsonb_build_object('credited', false, 'balance', b.wallet_balance, 'reason', 'amount_mismatch');
  end if;
  update wallet_transactions
  set status = 'done',
      note = case when nullif(args->>'reference', '') is not null
                  then 'Nạp qua PayOS · mã giao dịch ' || (args->>'reference') else note end
  where id = tx.id;
  update businesses set wallet_balance = wallet_balance + tx.amount where id = tx.business_id
  returning * into b;
  insert into audit_logs (actor_name, actor_role, action)
  values ('PayOS', 'system', 'Tự khớp nạp tiền ' || public._fmt_vnd(tx.amount) || ' qua PayOS, ' || b.name);
  return jsonb_build_object('credited', true, 'balance', b.wallet_balance, 'reason', 'ok');
end $$;

-- Chỉ máy chủ (service_role) gọi được; người dùng, doanh nghiệp, quản trị đều không.
revoke all on function public.payos_credit_topup(jsonb) from public, anon, authenticated;
grant execute on function public.payos_credit_topup(jsonb) to service_role;

-- ───────────── 2. Đổi địa chỉ quán ─────────────

-- Quận đi theo địa chỉ mới (danh sách quản trị hiển thị quận).
grant update (district) on public.businesses to authenticated;

create or replace function public._business_address_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.uid() is not null
     and (new.lat, new.lng, new.address) is distinct from (old.lat, old.lng, old.address) then
    -- Cùng chữ với BIZ_EV_ADDRESS_REREVIEW (packages/core/src/services/business.ts): quản trị đọc để ghi rõ lý do.
    insert into campaign_events (campaign_id, text)
    select id, 'Quay lại chờ duyệt vì quán đổi địa chỉ' from campaigns where business_id = new.id and status = 'active';
    update campaigns set status = 'pending', submitted_at = now() where business_id = new.id and status = 'active';
  end if;
  return new;
end $$;

-- ───────────── 3. Trả lời yêu cầu hỗ trợ ─────────────

alter table public.support_tickets add column requester_id uuid references public.profiles (id) on delete set null;

create table public.ticket_messages (
  id text primary key default gen_random_uuid()::text,
  ticket_id text not null references public.support_tickets (id) on delete cascade,
  author_kind text not null check (author_kind in ('requester', 'admin')),
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

alter table public.ticket_messages enable row level security;
alter table public.ticket_messages force row level security;

-- Người gửi (người dùng app) xem yêu cầu và tin nhắn của chính mình, gửi thêm lời của mình.
create policy support_self_read on public.support_tickets for select using (requester_id = auth.uid());
create policy ticket_messages_self_read on public.ticket_messages for select
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = auth.uid()));
create policy ticket_messages_self_insert on public.ticket_messages for insert
  with check (
    author_kind = 'requester'
    and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.requester_id = auth.uid())
  );
-- Quản trị: vai trò hỗ trợ (và vận hành, theo is_admin) đọc, trả lời mọi yêu cầu.
create policy ticket_messages_admin on public.ticket_messages for all
  using (public.is_admin('support')) with check (public.is_admin('support'));

grant select, insert on public.ticket_messages to authenticated;
grant update, delete on public.ticket_messages to authenticated; -- chỉ quản trị qua policy ticket_messages_admin
