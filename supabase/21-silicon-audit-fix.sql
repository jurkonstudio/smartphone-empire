-- ============================================================================
-- Smartphone Empire — AUDIT SILICON (perbaikan server)  |  file 21
-- Jalankan di Supabase > SQL Editor SETELAH file 01–20. Aman diulang (idempoten).
--
-- Isi:
--  1) transfer_silicon + get_player_by_id  -> dipanggil game (Kirim SIL) tetapi SEBELUMNYA TIDAK ADA di SQL mana pun.
--  2) spend_silicon (+ p_reason opsional)  -> ledger mencatat alasan belanja, jumlah disimpan untuk refund.
--  3) refund_silicon                        -> refund aksi-gagal yang sah, hanya sekali per potongan.
--  4) payment_orders: pastikan kolom decided_at / decided_by ada (cegah error "o.decided_at does not exist").
--  5) admin_silicon_audit()                 -> rekonsiliasi saldo dompet vs ledger (deteksi saldo tak wajar).
-- ============================================================================

-- ---------- 4) Kolom order (cegah error decided_at pada tabel lama) ----------
alter table public.payment_orders add column if not exists decided_at timestamptz;
alter table public.payment_orders add column if not exists decided_by uuid;

-- ---------- 2) spend_silicon: simpan jumlah + alasan ----------
alter table public.silicon_requests add column if not exists amount bigint;
alter table public.silicon_requests add column if not exists reason text;
alter table public.silicon_requests add column if not exists refunded_at timestamptz;

drop function if exists public.spend_silicon(bigint, text);
drop function if exists public.spend_silicon(bigint);

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

    w := public._wallet(auth.uid());   -- kunci dompet: request ber-id sama dieksekusi berurutan

    if p_request_id is not null then
        if exists (select 1 from public.silicon_requests
                    where user_id = auth.uid() and request_id = p_request_id) then
            return w.balance;          -- sudah diproses: jangan potong lagi
        end if;
    end if;

    if w.balance < p_amount then raise exception 'insufficient_silicon'; end if;

    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), -p_amount, 'spend:' || rsn, w.balance);

    if p_request_id is not null then
        insert into public.silicon_requests(user_id, request_id, amount, reason)
            values (auth.uid(), p_request_id, p_amount, rsn)
            on conflict do nothing;
        delete from public.silicon_requests
            where user_id = auth.uid() and created_at < now() - interval '30 days';
    end if;
    return w.balance;
end $$;

grant execute on function public.spend_silicon(bigint, text, text) to authenticated;
revoke execute on function public.spend_silicon(bigint, text, text) from anon, public;

-- ---------- 3) refund_silicon ----------
create or replace function public.refund_silicon(p_request_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; r public.silicon_requests; n int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_request_id is null or length(p_request_id) = 0 or length(p_request_id) > 64 then
        raise exception 'invalid_request';
    end if;

    w := public._wallet(auth.uid());   -- kunci dompet

    select * into r from public.silicon_requests
        where user_id = auth.uid() and request_id = p_request_id for update;
    if not found then raise exception 'request_not_found'; end if;
    if r.refunded_at is not null then return w.balance; end if;               -- sudah di-refund: idempoten
    if r.amount is null or r.amount <= 0 then raise exception 'not_refundable'; end if;
    if r.created_at < now() - interval '10 minutes' then raise exception 'refund_window_expired'; end if;

    -- Batas wajar agar refund tidak bisa dipakai sebagai "pakai gratis".
    select count(*) into n from public.silicon_ledger
        where user_id = auth.uid() and reason like 'refund:%' and created_at > now() - interval '24 hours';
    if n >= 30 then raise exception 'refund_limit_reached'; end if;

    update public.silicon_requests set refunded_at = now()
        where user_id = auth.uid() and request_id = p_request_id;
    update public.silicon_wallets set balance = balance + r.amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), r.amount, 'refund:' || left(coalesce(r.reason, 'spend'), 70), w.balance);
    return w.balance;
end $$;

grant execute on function public.refund_silicon(text) to authenticated;
revoke execute on function public.refund_silicon(text) from anon, public;

-- ---------- 1) Kirim SIL antar pemain ----------
-- Cek penerima (hanya info publik minimal). Dipanggil modal "Kirim SIL".
create or replace function public.get_player_by_id(p_public_id bigint)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare p record;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    select id, public_id, company_name, player_name into p
        from public.profiles where public_id = p_public_id;
    if not found then return jsonb_build_object('ok', false, 'error', 'player_not_found'); end if;
    if p.id = auth.uid() then return jsonb_build_object('ok', false, 'error', 'cannot_transfer_to_self'); end if;
    return jsonb_build_object('ok', true, 'public_id', p.public_id,
                              'company_name', p.company_name, 'player_name', p.player_name);
end $$;
revoke all on function public.get_player_by_id(bigint) from public, anon;
grant execute on function public.get_player_by_id(bigint) to authenticated;

-- Transfer atomik: kunci kedua dompet dengan urutan tetap (cegah deadlock), cek saldo, catat ledger dua sisi.
create or replace function public.transfer_silicon(p_receiver_id bigint, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rid uuid; sender uuid := auth.uid(); ws public.silicon_wallets; wr public.silicon_wallets; sent24 bigint;
begin
    if sender is null then raise exception 'not_authenticated'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'invalid_amount'; end if;

    select id into rid from public.profiles where public_id = p_receiver_id;
    if rid is null then raise exception 'player_not_found'; end if;
    if rid = sender then raise exception 'cannot_transfer_to_self'; end if;

    -- Kunci dompet berurutan berdasarkan uuid.
    if sender < rid then
        ws := public._wallet(sender); wr := public._wallet(rid);
    else
        wr := public._wallet(rid); ws := public._wallet(sender);
    end if;

    -- Batas kirim 24 jam terakhir (anti pencucian / farming antar-akun).
    select coalesce(sum(-delta), 0) into sent24 from public.silicon_ledger
        where user_id = sender and reason like 'transfer_out:%' and created_at > now() - interval '24 hours';
    if sent24 + p_amount > 5000 then raise exception 'transfer_limit_reached'; end if;

    if ws.balance < p_amount then raise exception 'insufficient_silicon'; end if;

    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = sender returning * into ws;
    update public.silicon_wallets set balance = balance + p_amount, updated_at = now()
        where user_id = rid returning * into wr;

    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (sender, -p_amount, 'transfer_out:' || p_receiver_id, ws.balance);
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (rid, p_amount, 'transfer_in', wr.balance);

    return jsonb_build_object('ok', true, 'balance', ws.balance);
end $$;
revoke all on function public.transfer_silicon(bigint, bigint) from public, anon;
grant execute on function public.transfer_silicon(bigint, bigint) to authenticated;

-- ---------- 5) Rekonsiliasi admin: saldo dompet vs jumlah ledger ----------
-- Dompet baru bernilai awal 10 (default tabel). Dompet yang dibuat sebelum ledger ada bisa selisih tetap — bukan bug baru.
create or replace function public.admin_silicon_audit() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
    perform public._assert_admin();
    return coalesce((select jsonb_agg(r order by abs(r.selisih) desc) from (
        select w.user_id, u.email, w.balance,
               10 + coalesce(l.total, 0) as expected_from_ledger,
               w.balance - (10 + coalesce(l.total, 0)) as selisih
          from public.silicon_wallets w
          join auth.users u on u.id = w.user_id
          left join (select user_id, sum(delta) as total from public.silicon_ledger group by user_id) l on l.user_id = w.user_id
         where w.balance <> 10 + coalesce(l.total, 0)
         order by abs(w.balance - (10 + coalesce(l.total, 0))) desc limit 200) r), '[]'::jsonb);
end $$;
revoke all on function public.admin_silicon_audit() from public, anon;
grant execute on function public.admin_silicon_audit() to authenticated;

notify pgrst, 'reload schema';
