-- ============================================================================
-- Smartphone Empire — 04 PEMBAYARAN (top-up SIL manual GoPay/QRIS) & TRANSFER SIL
-- Jalankan SETELAH 03. Aman diulang (idempoten).
-- Alur: pemain buat pesanan (pending) -> admin setujui di /fsociety -> SIL masuk (file 05).
-- Harga & isi paket HANYA dipercaya dari daftar di server (_sil_packages).
-- Jika src/data/silicon.data.js berubah, ubah daftar _sil_packages di bawah (sil = sil + bonus).
-- ============================================================================

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
alter table public.payment_orders add column if not exists decided_at timestamptz;
alter table public.payment_orders add column if not exists decided_by uuid;
create index if not exists payment_orders_status_idx on public.payment_orders (status, created_at desc);
create index if not exists payment_orders_user_idx   on public.payment_orders (user_id, status);

alter table public.payment_orders enable row level security;
drop policy if exists "orders_select_own" on public.payment_orders;
create policy "orders_select_own" on public.payment_orders
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.payment_orders from anon, authenticated;

-- Daftar paket (satu-satunya sumber harga di server).
create or replace function public._sil_packages()
returns table (id text, price numeric, sil bigint) language sql immutable as $$
    select * from (values
        ('pkg_s',   15000::numeric,   50::bigint),
        ('pkg_m',   35000::numeric,  130::bigint),
        ('pkg_l',   79000::numeric,  345::bigint),
        ('pkg_xl', 169000::numeric,  840::bigint),
        ('pkg_xxl',329000::numeric, 1900::bigint)
    ) v(id, price, sil);
$$;
revoke all on function public._sil_packages() from public, anon, authenticated;

-- Dipanggil game saat pemain menekan "Bayar".
create or replace function public.create_payment_order(p_order_id text, p_package_id text, p_amount numeric, p_sil_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pkg record; ord_owner uuid;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_order_id is null or length(p_order_id) not between 6 and 64 then raise exception 'invalid_order_id'; end if;
    select * into pkg from public._sil_packages() where id = p_package_id;
    if not found or pkg.price <> p_amount or pkg.sil <> p_sil_amount then raise exception 'invalid_package'; end if;

    select user_id into ord_owner from public.payment_orders where id = p_order_id;
    if ord_owner is not null then
        if ord_owner <> auth.uid() then raise exception 'invalid_order_id'; end if;   -- id milik orang lain
        return jsonb_build_object('status', 'pending');                            -- retry: idempoten
    end if;

    if (select count(*) from public.payment_orders where user_id = auth.uid() and status = 'pending') >= 5 then
        raise exception 'too_many_pending';
    end if;
    insert into public.payment_orders (id, user_id, package_id, amount, sil_amount)
    values (p_order_id, auth.uid(), p_package_id, pkg.price, pkg.sil) on conflict (id) do nothing;
    return jsonb_build_object('status', 'pending');
end $$;

-- Game mengecek status: approved -> 'paid' (game lalu memuat saldo dari server).
create or replace function public.check_payment_status(p_order_id text) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object('status', case o.status when 'approved' then 'paid' when 'pending' then 'pending' else 'cancelled' end)
      from public.payment_orders o where o.id = p_order_id and o.user_id = auth.uid();
$$;

-- Untuk WEB TOP-UP (backend/Edge Function dengan service_role): cek ID & buat pesanan berdasarkan ID pemain.
create or replace function public.lookup_player_by_public_id(p_public_id bigint) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object('public_id', p.public_id, 'user_id', p.id,
                              'company_name', p.company_name, 'player_name', p.player_name)
      from public.profiles p where p.public_id = p_public_id;
$$;

create or replace function public.create_topup_order_by_public_id(p_public_id bigint, p_package_id text, p_order_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid; pkg record;
begin
    select id into uid from public.profiles where public_id = p_public_id;
    if uid is null then raise exception 'player_not_found'; end if;
    select * into pkg from public._sil_packages() where id = p_package_id;
    if not found then raise exception 'invalid_package'; end if;
    if p_order_id is null or length(p_order_id) not between 6 and 64 then raise exception 'invalid_order_id'; end if;
    if (select count(*) from public.payment_orders where user_id = uid and status = 'pending') >= 5 then
        raise exception 'too_many_pending';
    end if;
    insert into public.payment_orders (id, user_id, package_id, amount, sil_amount)
    values (p_order_id, uid, p_package_id, pkg.price, pkg.sil) on conflict (id) do nothing;
    return jsonb_build_object('status', 'pending', 'order_id', p_order_id, 'amount', pkg.price, 'sil_amount', pkg.sil);
end $$;

-- ---------- Kirim SIL antar pemain ----------
create or replace function public.get_player_by_id(p_public_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p record;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    select id, public_id, company_name, player_name into p from public.profiles where public_id = p_public_id;
    if not found then return jsonb_build_object('ok', false, 'error', 'player_not_found'); end if;
    if p.id = auth.uid() then return jsonb_build_object('ok', false, 'error', 'cannot_transfer_to_self'); end if;
    return jsonb_build_object('ok', true, 'public_id', p.public_id,
                              'company_name', p.company_name, 'player_name', p.player_name);
end $$;

-- Atomik: kunci dua dompet dengan urutan tetap (anti deadlock), batas kirim 5000 SIL / 24 jam.
create or replace function public.transfer_silicon(p_receiver_id bigint, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; sender uuid := auth.uid(); ws public.silicon_wallets; wr public.silicon_wallets; sent24 bigint;
begin
    if sender is null then raise exception 'not_authenticated'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'invalid_amount'; end if;
    select id into rid from public.profiles where public_id = p_receiver_id;
    if rid is null then raise exception 'player_not_found'; end if;
    if rid = sender then raise exception 'cannot_transfer_to_self'; end if;

    if sender < rid then ws := public._wallet(sender); wr := public._wallet(rid);
    else                 wr := public._wallet(rid);    ws := public._wallet(sender); end if;

    select coalesce(sum(-delta), 0) into sent24 from public.silicon_ledger
        where user_id = sender and reason like 'transfer_out:%' and created_at > now() - interval '24 hours';
    if sent24 + p_amount > 5000 then raise exception 'transfer_limit_reached'; end if;
    if ws.balance < p_amount then raise exception 'insufficient_silicon'; end if;

    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = sender returning * into ws;
    update public.silicon_wallets set balance = balance + p_amount, updated_at = now()
        where user_id = rid returning * into wr;
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (sender, -p_amount, 'transfer_out:' || p_receiver_id, ws.balance);
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (rid, p_amount, 'transfer_in', wr.balance);
    return jsonb_build_object('ok', true, 'balance', ws.balance);
end $$;

-- ---------- Izin eksekusi ----------
do $$
declare f text;
begin
    foreach f in array array['create_payment_order(text, text, numeric, bigint)', 'check_payment_status(text)',
                             'get_player_by_id(bigint)', 'transfer_silicon(bigint, bigint)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
    foreach f in array array['lookup_player_by_public_id(bigint)', 'create_topup_order_by_public_id(bigint, text, text)'] loop
        execute format('revoke all on function public.%s from public, anon, authenticated', f);
        execute format('grant execute on function public.%s to service_role', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
