-- Belanja: hanya mengurangi, dibatasi saldo & jumlah wajar.
create or replace function public.spend_silicon(p_amount bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_amount is null or p_amount <= 0 or p_amount > 5000 then raise exception 'invalid_amount'; end if;
    w := public._wallet(auth.uid());
    if w.balance < p_amount then raise exception 'insufficient_silicon'; end if;
    update public.silicon_wallets set balance = balance - p_amount, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (auth.uid(), -p_amount, 'spend', w.balance);
    return w.balance;
end $$;

-- Hadiah harian: tanggal & streak dihitung SERVER (jam HP tidak berpengaruh).
create or replace function public.claim_daily_silicon()
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; s int; r int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    w := public._wallet(auth.uid());
    if w.last_daily = (now() at time zone 'utc')::date then return w.balance; end if;
    s := case when w.last_daily = (now() at time zone 'utc')::date - 1 then w.streak + 1 else 1 end;
    r := least(s, 7);
    update public.silicon_wallets
        set balance = balance + r, streak = s, last_daily = (now() at time zone 'utc')::date, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (auth.uid(), r, 'daily', w.balance);
    return w.balance;
end $$;

-- Kredit (top-up terverifikasi): HANYA service_role (webhook/Edge Function).
create or replace function public.add_silicon(p_user uuid, p_delta bigint, p_reason text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets;
begin
    if p_delta is null or p_delta <= 0 then raise exception 'invalid_amount'; end if;
    w := public._wallet(p_user);
    update public.silicon_wallets set balance = balance + p_delta, updated_at = now()
        where user_id = p_user returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance) values (p_user, p_delta, coalesce(p_reason,'topup'), w.balance);
    return w.balance;
end $$;
-- Hapus versi lama yang bisa dipanggil klien (add_silicon(p_delta)).
drop function if exists public.add_silicon(bigint);
drop function if exists public.add_silicon(integer);
revoke all on function public.add_silicon(uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.add_silicon(uuid, bigint, text) to service_role;

grant execute on function public.get_silicon()          to authenticated;
grant execute on function public.spend_silicon(bigint)  to authenticated;
grant execute on function public.claim_daily_silicon()  to authenticated;
revoke execute on function public.get_silicon(), public.spend_silicon(bigint), public.claim_daily_silicon() from anon;

-- Save cloud tidak boleh membawa saldo SIL buatan klien: paksa nilai dari dompet.
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
