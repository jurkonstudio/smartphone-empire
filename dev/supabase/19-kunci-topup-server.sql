-- ============================================================================
-- Smartphone Empire — 19 KUNCI TOP UP DI SERVER
-- Jalankan SETELAH 04 dan 05. Aman diulang (idempoten).
--
-- Dulu kunci Top Up hanya di klien (TOPUP_LOCKED). Pemain yang login masih bisa membuat
-- pesanan 'pending' lewat API langsung. Sekarang create_payment_order memeriksa flag server.
-- Bawaan: TERBUKA (sama seperti sekarang). Tidak mengubah perilaku sampai kamu menutupnya.
--
-- Menutup  : update public.app_flags set value = false where key = 'topup_open';
-- Membuka  : update public.app_flags set value = true  where key = 'topup_open';
-- (dijalankan di SQL Editor, atau admin lewat fungsi set_app_flag di bawah)
-- ============================================================================

create table if not exists public.app_flags (
    key        text primary key,
    value      boolean not null,
    updated_at timestamptz not null default now()
);
alter table public.app_flags enable row level security;
revoke all on public.app_flags from anon, authenticated;   -- hanya fungsi security definer yang menyentuh

insert into public.app_flags (key, value) values ('topup_open', true)
on conflict (key) do nothing;

-- Admin (is_admin) dapat mengubah flag dari panel/RPC.
create or replace function public.set_app_flag(p_key text, p_value boolean)
returns boolean language plpgsql security definer set search_path = public as $$
begin
    if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
    if p_key not in ('topup_open') then raise exception 'unknown_flag'; end if;
    insert into public.app_flags (key, value, updated_at) values (p_key, p_value, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
    return p_value;
end $$;
revoke all on function public.set_app_flag(text, boolean) from public, anon;
grant execute on function public.set_app_flag(text, boolean) to authenticated;

-- Pemain boleh tahu status (untuk UI), tanpa membuka tabelnya.
create or replace function public.topup_is_open()
returns boolean language sql stable security definer set search_path = public as $$
    select coalesce((select value from public.app_flags where key = 'topup_open'), true);
$$;
revoke all on function public.topup_is_open() from public, anon;
grant execute on function public.topup_is_open() to authenticated;

-- Sama dengan versi di 04, ditambah pemeriksaan flag. Izin eksekusi tetap (create or replace).
create or replace function public.create_payment_order(p_order_id text, p_package_id text, p_amount numeric, p_sil_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pkg record; ord_owner uuid;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if not public.topup_is_open() then raise exception 'topup_closed'; end if;
    if p_order_id is null or length(p_order_id) not between 6 and 64 then raise exception 'invalid_order_id'; end if;
    select * into pkg from public._sil_packages() where id = p_package_id;
    if not found or pkg.price <> p_amount or pkg.sil <> p_sil_amount then raise exception 'invalid_package'; end if;

    select user_id into ord_owner from public.payment_orders where id = p_order_id;
    if ord_owner is not null then
        if ord_owner <> auth.uid() then raise exception 'invalid_order_id'; end if;
        return jsonb_build_object('status', 'pending');
    end if;

    if (select count(*) from public.payment_orders where user_id = auth.uid() and status = 'pending') >= 5 then
        raise exception 'too_many_pending';
    end if;
    insert into public.payment_orders (id, user_id, package_id, amount, sil_amount)
    values (p_order_id, auth.uid(), p_package_id, pkg.price, pkg.sil) on conflict (id) do nothing;
    return jsonb_build_object('status', 'pending');
end $$;

notify pgrst, 'reload schema';
