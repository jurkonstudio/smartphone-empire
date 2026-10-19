-- ============================================================================
-- Smartphone Empire — HARDENING SIL (server-authoritative)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql. Idempotent.
-- Prinsip: klien tidak pernah boleh MENAMBAH saldo. Hanya server
-- (webhook pembayaran via service_role, atau claim_daily_silicon) yang boleh.
-- ============================================================================

create table if not exists public.silicon_wallets (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    balance    bigint not null default 10 check (balance >= 0),
    last_daily date,
    streak     int not null default 0,
    updated_at timestamptz not null default now()
);
alter table public.silicon_wallets enable row level security;

-- Pemain hanya boleh MEMBACA dompetnya. Tidak ada policy insert/update/delete.
drop policy if exists "wallet_select_own" on public.silicon_wallets;
create policy "wallet_select_own" on public.silicon_wallets
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.silicon_wallets from anon, authenticated;

-- Ledger audit (append-only).
create table if not exists public.silicon_ledger (
    id         bigserial primary key,
    user_id    uuid not null references auth.users(id) on delete cascade,
    delta      bigint not null,
    reason     text not null,
    balance    bigint not null,
    created_at timestamptz not null default now()
);
alter table public.silicon_ledger enable row level security;
drop policy if exists "ledger_select_own" on public.silicon_ledger;
create policy "ledger_select_own" on public.silicon_ledger
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.silicon_ledger from anon, authenticated;

-- Pastikan dompet ada (dipanggil internal).
create or replace function public._wallet(p_user uuid)
returns public.silicon_wallets language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    insert into public.silicon_wallets (user_id) values (p_user) on conflict do nothing;
    select * into w from public.silicon_wallets where user_id = p_user for update;
    return w;
end $$;
revoke all on function public._wallet(uuid) from public, anon, authenticated;

create or replace function public.get_silicon()
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    w := public._wallet(auth.uid());
    return w.balance;
end $$;

