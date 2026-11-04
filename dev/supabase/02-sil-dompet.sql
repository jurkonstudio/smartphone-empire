-- ============================================================================
-- Smartphone Empire — 02 SIL (dompet, harian, quest, belanja, refund)
-- Jalankan SETELAH 01. Aman diulang (idempoten).
-- Prinsip: klien TIDAK BOLEH menambah saldo. Saldo hanya naik lewat server:
-- klaim harian, klaim quest, refund sah, transfer antar pemain, atau admin menyetujui pesanan.
-- ============================================================================

-- ---------- Tabel ----------
create table if not exists public.silicon_wallets (
    user_id    uuid primary key references auth.users(id) on delete cascade,
    balance    bigint not null default 10 check (balance >= 0),
    last_daily date,
    streak     int not null default 0,
    updated_at timestamptz not null default now()
);
alter table public.silicon_wallets enable row level security;
drop policy if exists "wallet_select_own" on public.silicon_wallets;
create policy "wallet_select_own" on public.silicon_wallets
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.silicon_wallets from anon, authenticated;

create table if not exists public.silicon_ledger (          -- jejak audit (append-only)
    id         bigserial primary key,
    user_id    uuid not null references auth.users(id) on delete cascade,
    delta      bigint not null,
    reason     text not null,
    balance    bigint not null,
    created_at timestamptz not null default now()
);
create index if not exists silicon_ledger_user_idx on public.silicon_ledger (user_id, id desc);
alter table public.silicon_ledger enable row level security;
drop policy if exists "ledger_select_own" on public.silicon_ledger;
create policy "ledger_select_own" on public.silicon_ledger
    for select to authenticated using (auth.uid() = user_id);
revoke insert, update, delete on public.silicon_ledger from anon, authenticated;

create table if not exists public.silicon_requests (        -- belanja idempoten + dasar refund
    user_id     uuid not null references auth.users(id) on delete cascade,
    request_id  text not null,
    amount      bigint,
    reason      text,
    refunded_at timestamptz,
    created_at  timestamptz not null default now(),
    primary key (user_id, request_id)
);
alter table public.silicon_requests add column if not exists amount bigint;
alter table public.silicon_requests add column if not exists reason text;
alter table public.silicon_requests add column if not exists refunded_at timestamptz;
alter table public.silicon_requests enable row level security;
revoke all on public.silicon_requests from anon, authenticated;

create table if not exists public.silicon_quest_claims (
    user_id    uuid not null references auth.users(id) on delete cascade,
    quest_id   text not null,
    claimed_at timestamptz not null default now(),
    primary key (user_id, quest_id)
);
alter table public.silicon_quest_claims enable row level security;
revoke all on public.silicon_quest_claims from anon, authenticated;

-- Realtime: saldo di game ikut berubah saat admin/pembayaran mengubah SIL.
do $$ begin
    alter publication supabase_realtime add table public.silicon_wallets;
exception when duplicate_object then null; end $$;

-- ---------- Fungsi internal ----------
create or replace function public._wallet(p_user uuid)
returns public.silicon_wallets language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    insert into public.silicon_wallets (user_id) values (p_user) on conflict do nothing;
    select * into w from public.silicon_wallets where user_id = p_user for update;
    return w;
end $$;
revoke all on function public._wallet(uuid) from public, anon, authenticated;

-- Kredit SIL: HANYA server (dipanggil fungsi admin / service_role).
create or replace function public.add_silicon(p_user uuid, p_delta bigint, p_reason text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    if p_delta is null or p_delta <= 0 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user);
    update public.silicon_wallets set balance = balance + p_delta, updated_at = now()
        where user_id = p_user returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (p_user, p_delta, coalesce(p_reason, 'topup'), w.balance);
    return w.balance;
end $$;
drop function if exists public.add_silicon(bigint);
drop function if exists public.add_silicon(integer);
revoke all on function public.add_silicon(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.add_silicon(uuid, bigint, text) to service_role;

-- Save cloud tidak boleh membawa saldo SIL buatan klien: nilai dipaksa dari dompet server.
create or replace function public.force_save_silicon()
returns trigger language plpgsql security definer set search_path = public as $$
declare b bigint;
begin
    b := (public._wallet(new.user_id)).balance;
    new.data := jsonb_set(new.data, '{silicon}', to_jsonb(b), true);
    return new;
end $$;
drop trigger if exists game_saves_force_silicon on public.game_saves;
create trigger game_saves_force_silicon before insert or update on public.game_saves
    for each row execute function public.force_save_silicon();

-- ---------- Sisi pemain (dipanggil game) ----------
create or replace function public.get_silicon()
returns bigint language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    return (public._wallet(auth.uid())).balance;
end $$;

-- Hadiah harian: tanggal & streak dihitung server (UTC), jam HP tidak berpengaruh.
create or replace function public.claim_daily_silicon()
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; s int; r int; today date := (now() at time zone 'utc')::date;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    w := public._wallet(auth.uid());
    if w.last_daily = today then return w.balance; end if;
    s := case when w.last_daily = today - 1 then w.streak + 1 else 1 end;
    r := least(s, 7);
    update public.silicon_wallets set balance = balance + r, streak = s, last_daily = today, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (auth.uid(), r, 'daily', w.balance);
    return w.balance;
end $$;

-- Reward quest (nominal whitelist; ubah juga di src/systems/QuestSystem.js bila berubah).
create or replace function public.claim_quest_silicon(p_quest_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; r bigint;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    r := case p_quest_id when 'first_start_research' then 3 when 'first_recruit' then 3
                         when 'first_product' then 5 else null end;
    if r is null then raise exception 'invalid_quest'; end if;
    w := public._wallet(auth.uid());
    insert into public.silicon_quest_claims(user_id, quest_id) values (auth.uid(), p_quest_id) on conflict do nothing;
    if not found then return w.balance; end if;          -- sudah diklaim
    update public.silicon_wallets set balance = balance + r, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), r, 'quest:' || p_quest_id, w.balance);
    return w.balance;
end $$;

-- Belanja IDEMPOTEN: retry / dua tab dengan request_id sama tidak memotong dua kali.
drop function if exists public.spend_silicon(bigint);
drop function if exists public.spend_silicon(bigint, text);
create or replace function public.spend_silicon(p_amount bigint, p_request_id text default null, p_reason text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; rsn text;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'invalid_amount'; end if;
    if p_request_id is not null and (length(p_request_id) = 0 or length(p_request_id) > 64) then
        raise exception 'invalid_request';
    end if;
    rsn := left(coalesce(nullif(btrim(p_reason), ''), 'spend'), 80);
    w := public._wallet(auth.uid());                      -- kunci dompet
    if p_request_id is not null and exists (select 1 from public.silicon_requests
            where user_id = auth.uid() and request_id = p_request_id) then
        return w.balance;                                  -- sudah diproses
    end if;
    if w.balance < p_amount then raise exception 'insufficient_silicon'; end if;
    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), -p_amount, 'spend:' || rsn, w.balance);
    if p_request_id is not null then
        insert into public.silicon_requests(user_id, request_id, amount, reason)
            values (auth.uid(), p_request_id, p_amount, rsn) on conflict do nothing;
        delete from public.silicon_requests where user_id = auth.uid() and created_at < now() - interval '30 days';
    end if;
    return w.balance;
end $$;

-- Refund aksi gagal yang sah: sekali per potongan, maks 10 menit, maks 30x/24 jam.
create or replace function public.refund_silicon(p_request_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; r public.silicon_requests; n int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_request_id is null or length(p_request_id) = 0 or length(p_request_id) > 64 then
        raise exception 'invalid_request';
    end if;
    w := public._wallet(auth.uid());
    select * into r from public.silicon_requests where user_id = auth.uid() and request_id = p_request_id for update;
    if not found then raise exception 'request_not_found'; end if;
    if r.refunded_at is not null then return w.balance; end if;
    if r.amount is null or r.amount <= 0 then raise exception 'not_refundable'; end if;
    if r.created_at < now() - interval '10 minutes' then raise exception 'refund_window_expired'; end if;
    select count(*) into n from public.silicon_ledger
        where user_id = auth.uid() and reason like 'refund:%' and created_at > now() - interval '24 hours';
    if n >= 30 then raise exception 'refund_limit_reached'; end if;
    update public.silicon_requests set refunded_at = now() where user_id = auth.uid() and request_id = p_request_id;
    update public.silicon_wallets set balance = balance + r.amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), r.amount, 'refund:' || left(coalesce(r.reason, 'spend'), 70), w.balance);
    return w.balance;
end $$;

do $$
declare f text;
begin
    foreach f in array array['get_silicon()', 'claim_daily_silicon()', 'claim_quest_silicon(text)',
                             'spend_silicon(bigint, text, text)', 'refund_silicon(text)'] loop
        execute format('revoke all on function public.%s from public, anon', f);
        execute format('grant execute on function public.%s to authenticated', f);
    end loop;
end $$;

notify pgrst, 'reload schema';
