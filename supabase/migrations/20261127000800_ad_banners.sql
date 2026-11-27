-- Frego · banner quảng cáo nhà tài trợ (popup sau màn So giá) + đếm lượt xem (chốt 27/11/2026, docs/plan.md).
-- Doanh nghiệp gửi banner, Frego (quản trị ops) duyệt. App chỉ đọc banner đã duyệt qua view ad_banners_public.
-- Bản JS tương ứng: packages/core/src/db/memory.ts (view ad_banners_public, RPC record_ad_view).

-- ───────────── Bảng ─────────────

create table public.ad_banners (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses (id) on delete cascade,
  -- Chờ duyệt: ref vùng riêng "storage:ad-uploads/<business_id>/…"; đã duyệt: URL công khai (bucket ad-banners).
  image_url text not null,
  title text not null check (char_length(title) between 1 and 40),
  body text not null default '' check (char_length(body) <= 120),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'replaced')),
  reject_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);
create index ad_banners_business_idx on public.ad_banners (business_id, status, reviewed_at desc);

alter table public.campaigns add column ad_view_count integer not null default 0;
alter table public.trips add column ad_viewed_at timestamptz;

-- ───────────── RLS ─────────────

alter table public.ad_banners enable row level security;

create policy ad_banners_member_read on public.ad_banners for select
  using (public.is_member(business_id) or public.is_admin());
-- Chủ quán chỉ gửi bản chờ duyệt; không sửa, không tự duyệt (gửi bản mới thay vì sửa).
create policy ad_banners_owner_insert on public.ad_banners for insert
  with check (
    public.is_member(business_id, 'owner')
    and status = 'pending' and reviewed_at is null and reviewed_by is null and reject_reason is null
  );
create policy ad_banners_admin on public.ad_banners for all
  using (public.is_admin('ops')) with check (public.is_admin('ops'));

grant select, insert, update, delete on public.ad_banners to authenticated;
-- campaigns.ad_view_count: chủ quán không sửa được (quyền update trên campaigns chỉ cấp theo cột, cột mới không nằm trong
-- danh sách); chỉ RPC record_ad_view cộng. trips: người dùng không ghi trực tiếp (chỉ qua RPC).

-- ───────────── View công khai: banner đã duyệt mới nhất của mỗi quán đang hoạt động ─────────────

create view public.ad_banners_public with (security_invoker = false) as
select distinct on (a.business_id) a.id, a.business_id, a.image_url, a.title, a.body, a.reviewed_at
from public.ad_banners a
join public.businesses b on b.id = a.business_id and b.status = 'active'
where a.status = 'approved'
order by a.business_id, a.reviewed_at desc;

grant select on public.ad_banners_public to anon, authenticated;

-- ───────────── RPC: ghi 1 lượt xem popup quảng cáo cho chuyến ─────────────

create or replace function public.record_ad_view(args jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  u uuid := public._require_user();
  t trips;
  code jsonb;
  cid text;
begin
  select * into t from trips where id = args->>'tripId' and user_id = u for update;
  if not found then raise exception 'Không tìm thấy chuyến' using errcode = '42501'; end if;
  if t.ad_viewed_at is not null then return jsonb_build_object('counted', false, 'campaignId', null); end if;

  -- Mã đã gắn cho đúng hãng người dùng chọn, của quán tài trợ.
  select item into code from jsonb_array_elements(t.attached) item
  where item->>'service' = t.chosen_service and item->>'source' = 'sponsor'
  limit 1;
  if code is null then return jsonb_build_object('counted', false, 'campaignId', null); end if;

  if code->>'refId' like 'uv:%' then
    select campaign_id into cid from user_vouchers where id = substr(code->>'refId', 4) and user_id = u;
  elsif code->>'refId' like 'cp:%' then
    cid := substr(code->>'refId', 4);
  end if;
  if cid is null or not exists (select 1 from campaigns where id = cid) then
    return jsonb_build_object('counted', false, 'campaignId', null);
  end if;

  update campaigns set ad_view_count = ad_view_count + 1 where id = cid;
  update trips set ad_viewed_at = now() where id = t.id;
  return jsonb_build_object('counted', true, 'campaignId', cid);
end $$;

grant execute on function public.record_ad_view(jsonb) to authenticated;

-- ───────────── Kho ảnh (Supabase Storage) ─────────────
-- Chỉ chạy khi có schema storage (Supabase thật). Postgres local của `pnpm db:test` không có storage → bỏ qua.
-- ad-uploads: riêng tư, đường dẫn "<business_id>/<file>"; chủ quán tải lên, thành viên quán + quản trị xem.
-- ad-banners: công khai (app đọc); chỉ quản trị ops ghi (chép sang khi duyệt).

do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('ad-uploads', 'ad-uploads', false, 1048576, array['image/jpeg', 'image/png', 'image/webp']),
      ('ad-banners', 'ad-banners', true, 1048576, array['image/jpeg', 'image/png', 'image/webp']),
      -- Logo quán (Hồ sơ cửa hàng): công khai, chủ quán tải thẳng vào thư mục của quán mình.
      ('business-logos', 'business-logos', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
    on conflict (id) do nothing;

    execute $p$
      create policy business_logos_owner_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'business-logos' and public.is_member((storage.foldername(name))[1], 'owner'))
    $p$;

    execute $p$
      create policy ad_uploads_owner_insert on storage.objects for insert to authenticated
      with check (bucket_id = 'ad-uploads' and public.is_member((storage.foldername(name))[1], 'owner'))
    $p$;
    execute $p$
      create policy ad_uploads_read on storage.objects for select to authenticated
      using (bucket_id = 'ad-uploads' and (public.is_member((storage.foldername(name))[1]) or public.is_admin()))
    $p$;
    execute $p$
      create policy ad_banners_admin_write on storage.objects for insert to authenticated
      with check (bucket_id = 'ad-banners' and public.is_admin('ops'))
    $p$;
  end if;
end $$;
