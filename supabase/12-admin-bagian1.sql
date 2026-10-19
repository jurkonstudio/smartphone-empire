-- ============================================================================
-- Smartphone Empire — ADMIN (server-authoritative)  |  /fsociety
-- Jalankan di Supabase SQL Editor SETELAH schema.sql & hardening.sql. Idempotent.
-- Keamanan ada DI SINI: semua fungsi admin memeriksa is_admin() di server.
-- Menyembunyikan URL /fsociety bukan pengaman; tabel admin_users inilah pengamannya.
-- Jika harga/isi paket di src/data/silicon.data.js berubah, ubah juga daftar paket di create_payment_order.
-- ============================================================================

create table if not exists public.admin_users (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;   -- tanpa policy: tak terbaca dari API

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public._assert_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
    if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
end $$;
revoke all on function public._assert_admin() from public, anon, authenticated;

-- Jejak audit (append-only, hanya terbaca lewat service_role / SQL Editor).
create table if not exists public.admin_audit (
    id         bigserial primary key,
    admin_id   uuid not null,
    action     text not null,
    target     text,
    detail     jsonb,
    created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon, authenticated;

-- Pesanan top-up SIL (pembayaran manual GoPay/QRIS, disetujui admin).
create table if not exists public.payment_orders (
    id         text primary key,
    user_id    uuid not null references auth.users(id) on delete cascade,
    package_id text not null,
    amount     numeric not null,
    sil_amount bigint not null,
    status     text not null default 'pending' check (status in ('pending','approved','rejected')),
    created_at timestamptz not null default now(),
    decided_at timestamptz,
    decided_by uuid
);
create index if not exists payment_orders_status_idx on public.payment_orders (status, created_at desc);
alter table public.payment_orders enable row level security;
drop policy if exists "orders_select_own" on public.payment_orders;
create policy "orders_select_own" on public.payment_orders for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.payment_orders from anon, authenticated;

-- ---------- Sisi pemain (dipakai game) ----------
create or replace function public.create_payment_order(p_order_id text, p_package_id text, p_amount numeric, p_sil_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pkg record;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    select * into pkg from (values ('pkg_s',15000,50),('pkg_m',35000,130),('pkg_l',79000,345),('pkg_xl',169000,840),('pkg_xxl',329000,1900))
        v(id, price, sil) where v.id = p_package_id;
    if not found or pkg.price <> p_amount or pkg.sil <> p_sil_amount then raise exception 'invalid_package'; end if;
    if (select count(*) from public.payment_orders where user_id = auth.uid() and status = 'pending') >= 5 then
        raise exception 'too_many_pending';
    end if;
    insert into public.payment_orders (id, user_id, package_id, amount, sil_amount)
    values (p_order_id, auth.uid(), p_package_id, p_amount, p_sil_amount) on conflict (id) do nothing;
    return jsonb_build_object('status', 'pending');
end $$;

create or replace function public.check_payment_status(p_order_id text) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object('status', case o.status when 'approved' then 'paid' when 'pending' then 'pending' else 'cancelled' end)
    from public.payment_orders o where o.id = p_order_id and o.user_id = auth.uid();
$$;

grant execute on function public.create_payment_order(text, text, numeric, bigint), public.check_payment_status(text) to authenticated;
revoke execute on function public.create_payment_order(text, text, numeric, bigint), public.check_payment_status(text) from anon;

