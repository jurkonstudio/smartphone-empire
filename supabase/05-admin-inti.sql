-- ============================================================================
-- Smartphone Empire — 05 ADMIN INTI (panel /fsociety: admin, persetujuan pembayaran)
-- Jalankan SETELAH 04. Aman diulang (idempoten).
-- Keamanan ada DI SINI: semua fungsi admin memeriksa is_admin() di server.
-- ============================================================================

create table if not exists public.admin_users (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;     -- tanpa policy: tak terbaca dari API

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

-- Admin boleh membaca pesanan (syarat notifikasi Realtime di panel); pemain tetap hanya miliknya.
drop policy if exists "orders_select_admin" on public.payment_orders;
create policy "orders_select_admin" on public.payment_orders
    for select to authenticated using (public.is_admin());
do $$ begin
    alter publication supabase_realtime add table public.payment_orders;
exception when duplicate_object then null; end $$;

-- ---------- Terjemahan yang bisa diedit admin (dibaca semua pemain login) ----------
create table if not exists public.i18n_strings (
    key        text not null,
    lang       text not null,
    value      text not null,
    updated_by uuid,
    updated_at timestamptz not null default now(),
    primary key (key, lang)
);
alter table public.i18n_strings enable row level security;
drop policy if exists "i18n_select" on public.i18n_strings;
create policy "i18n_select" on public.i18n_strings for select to authenticated using (true);
drop policy if exists "i18n_admin_write" on public.i18n_strings;
create policy "i18n_admin_write" on public.i18n_strings for all to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- ---------- Pesanan top-up ----------
create or replace function public.admin_list_orders(p_status text default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by r.created_at desc) from (
        select o.id, u.email, p.company_name, p.public_id, o.package_id, o.amount, o.sil_amount,
               o.status, o.created_at, o.decided_at
          from public.payment_orders o
          join auth.users u on u.id = o.user_id
          left join public.profiles p on p.id = o.user_id
         where p_status is null or o.status = p_status
         order by o.created_at desc limit 300) r), '[]'::jsonb);
end $$;

create or replace function public.get_pending_payments() returns jsonb
language sql stable security definer set search_path = public as $$
    select public.admin_list_orders('pending');
$$;

-- Setujui/tolak: baris dikunci, hanya dari 'pending' -> tidak mungkin kredit dua kali.
create or replace function public._decide_order(p_order_id text, p_to text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.payment_orders;
begin
    perform public._assert_admin();
    select * into o from public.payment_orders where id = p_order_id for update;
    if not found then raise exception 'order_not_found'; end if;
    if o.status <> 'pending' then raise exception 'order_not_pending'; end if;
    if p_to = 'approved' then
        perform public.add_silicon(o.user_id, o.sil_amount, 'topup:' || o.package_id);
    end if;
    update public.payment_orders set status = p_to, decided_at = now(), decided_by = auth.uid() where id = p_order_id;
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'order_' || p_to, p_order_id,
            jsonb_build_object('user', o.user_id, 'sil', o.sil_amount, 'amount', o.amount));
    return jsonb_build_object('ok', true, 'status', p_to);
end $$;
revoke all on function public._decide_order(text, text) from public, anon, authenticated;

create or replace function public.admin_approve_payment(p_order_id text) returns jsonb
language sql security definer set search_path = public as $$ select public._decide_order(p_order_id, 'approved'); $$;
create or replace function public.admin_reject_payment(p_order_id text) returns jsonb
language sql security definer set search_path = public as $$ select public._decide_order(p_order_id, 'rejected'); $$;

-- ---------- Atur SIL pemain ----------
create or replace function public.admin_set_silicon(p_user_id uuid, p_amount bigint, p_reason text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; old bigint;
begin
    perform public._assert_admin();
    if p_amount is null or p_amount < 0 or p_amount > 10000000 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user_id); old := w.balance;
    update public.silicon_wallets set balance = p_amount, updated_at = now() where user_id = p_user_id returning * into w;
    insert into public.silicon_ledger (user_id, delta, reason, balance)
    values (p_user_id, p_amount - old, 'admin:' || left(coalesce(nullif(btrim(p_reason), ''), 'set'), 80), w.balance);
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'set_silicon', p_user_id::text, jsonb_build_object('from', old, 'to', p_amount, 'reason', p_reason));
    return w.balance;
end $$;

create or replace function public.admin_add_silicon(p_user_id uuid, p_delta bigint, p_reason text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; old bigint;
begin
    perform public._assert_admin();
    if p_delta is null or p_delta = 0 or abs(p_delta) > 10000000 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user_id); old := w.balance;
    if old + p_delta < 0 then raise exception 'insufficient_silicon'; end if;
    update public.silicon_wallets set balance = balance + p_delta, updated_at = now()
        where user_id = p_user_id returning * into w;
    insert into public.silicon_ledger (user_id, delta, reason, balance)
    values (p_user_id, p_delta, 'admin:' || left(coalesce(nullif(btrim(p_reason), ''), 'adjust'), 80), w.balance);
    insert into public.admin_audit (admin_id, action, target, detail)
    values (auth.uid(), 'add_silicon', p_user_id::text, jsonb_build_object('from', old, 'delta', p_delta, 'reason', p_reason));
    return w.balance;
end $$;

-- ---------- Izin eksekusi ----------
do $$
declare f text;
begin
    foreach f in array array[
        'admin_list_orders(text)', 'get_pending_payments()', 'admin_approve_payment(text)', 'admin_reject_payment(text)',
        'admin_set_silicon(uuid, bigint, text)', 'admin_add_silicon(uuid, bigint, text)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
