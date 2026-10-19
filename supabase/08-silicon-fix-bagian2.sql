-- ---------- 2) Reward quest dari server ----------
create table if not exists public.silicon_quest_claims (
    user_id    uuid not null references auth.users(id) on delete cascade,
    quest_id   text not null,
    claimed_at timestamptz not null default now(),
    primary key (user_id, quest_id)
);
alter table public.silicon_quest_claims enable row level security;
revoke all on public.silicon_quest_claims from anon, authenticated;

create or replace function public.claim_quest_silicon(p_quest_id text)
returns bigint language plpgsql security definer set search_path = public as $$
declare w public.silicon_wallets; r bigint;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    -- Whitelist nominal (sumber kebenaran ada di server).
    r := case p_quest_id
            when 'first_start_research' then 3
            when 'first_recruit'        then 3
            when 'first_product'        then 5
            else null end;
    if r is null then raise exception 'invalid_quest'; end if;

    w := public._wallet(auth.uid());   -- kunci dompet (serialisasi klaim ganda)

    insert into public.silicon_quest_claims(user_id, quest_id) values (auth.uid(), p_quest_id)
        on conflict do nothing;
    if not found then return w.balance; end if;   -- sudah pernah diklaim: tanpa tambahan

    update public.silicon_wallets set balance = balance + r, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), r, 'quest:' || p_quest_id, w.balance);
    return w.balance;
end $$;

grant execute on function public.claim_quest_silicon(text) to authenticated;
revoke execute on function public.claim_quest_silicon(text) from anon, public;

-- Muat ulang skema PostgREST agar RPC baru langsung terlihat.
notify pgrst, 'reload schema';
