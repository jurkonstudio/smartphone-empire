-- ============================================================================
-- Smartphone Empire — FIX SALDO SIL HILANG (idempoten + klaim quest server-side)
-- Jalankan di Supabase SQL Editor SETELAH hardening.sql. Aman diulang.
--
-- 1) spend_silicon(p_amount, p_request_id): belanja IDEMPOTEN. Retry (timeout / koneksi putus)
--    atau dua tab yang mengirim antrean yang sama tidak lagi memotong saldo dua kali.
-- 2) claim_quest_silicon(p_quest_id): reward quest dikreditkan SERVER (nominal dari whitelist
--    di bawah, sekali per akun). Dulu reward quest hanya naik di klien lalu ditimpa saldo server.
--
-- Jika nominal quest di src/systems/QuestSystem.js berubah, ubah juga daftar di claim_quest_silicon.
-- ============================================================================

-- ---------- 1) Belanja idempoten ----------
create table if not exists public.silicon_requests (
    user_id    uuid not null references auth.users(id) on delete cascade,
    request_id text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, request_id)
);
alter table public.silicon_requests enable row level security;
revoke all on public.silicon_requests from anon, authenticated;   -- internal, tanpa policy

-- Versi lama (satu argumen) dibuang supaya tidak ambigu di PostgREST.
drop function if exists public.spend_silicon(bigint);

create or replace function public.spend_silicon(p_amount bigint, p_request_id text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'invalid_amount'; end if;
    if p_request_id is not null and (length(p_request_id) = 0 or length(p_request_id) > 64) then
        raise exception 'invalid_request';
    end if;

    -- Mengunci baris dompet: dua request dengan id yang sama dieksekusi berurutan, bukan bersamaan.
    w := public._wallet(auth.uid());

    if p_request_id is not null then
        -- Sudah pernah diproses -> jangan potong lagi; kembalikan saldo saat ini.
        if exists (select 1 from public.silicon_requests
                    where user_id = auth.uid() and request_id = p_request_id) then
            return w.balance;
        end if;
    end if;

    if w.balance < p_amount then raise exception 'insufficient_silicon'; end if;

    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), -p_amount, 'spend', w.balance);

    if p_request_id is not null then
        insert into public.silicon_requests(user_id, request_id) values (auth.uid(), p_request_id)
            on conflict do nothing;
        -- Kebersihan: buang catatan lama (retry tak mungkin setelah 30 hari).
        delete from public.silicon_requests
            where user_id = auth.uid() and created_at < now() - interval '30 days';
    end if;
    return w.balance;
end $$;

grant execute on function public.spend_silicon(bigint, text) to authenticated;
revoke execute on function public.spend_silicon(bigint, text) from anon, public;

