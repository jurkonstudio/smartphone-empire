-- ============================================================================
-- Smartphone Empire — 10 TUKAR SIL -> UANG (exchange_silicon)
-- Jalankan SETELAH 02. Aman diulang (idempoten).
-- Klien hanya mengirim ID paket + tahun + request_id. SIL dipotong di server dan
-- jumlah uang dihitung server. Retry dengan request_id sama: hasil lama dikembalikan,
-- SIL tidak dipotong dua kali dan uang tidak diberikan dua kali.
-- Daftar paket HARUS sama dengan _getExchangePackages() di src/ui/panels/SiliconStorePanel.js.
-- ============================================================================

-- ---------- Tabel: jejak tukar (idempotensi) ----------
-- Dipisah dari silicon_requests supaya tukar TIDAK ikut fitur refund belanja.
create table if not exists public.silicon_exchanges (
    user_id    uuid not null references auth.users(id) on delete cascade,
    request_id text not null,
    package    text not null,
    year       int not null,
    sil        bigint not null,
    cash       bigint not null,
    created_at timestamptz not null default now(),
    primary key (user_id, request_id)
);
alter table public.silicon_exchanges enable row level security;
revoke all on public.silicon_exchanges from anon, authenticated;

-- ---------- Kurs uang per SIL (sama dengan getCashPerSil() di src/data/silicon.data.js) ----------
create or replace function public._cash_per_sil(p_year int)
returns numeric language sql immutable as $$
    select greatest(1, round(2500 * (1 + 0.15 * greatest(0, p_year - 2000))));
$$;
revoke all on function public._cash_per_sil(int) from public, anon, authenticated;

-- ---------- Tukar SIL -> uang ----------
create or replace function public.exchange_silicon(p_package text, p_year int, p_request_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
    w      public.silicon_wallets;
    ex     public.silicon_exchanges;
    v_sil  bigint;
    v_base bigint;
    v_cash bigint;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if p_request_id is null or length(p_request_id) = 0 or length(p_request_id) > 64 then
        raise exception 'invalid_request';
    end if;
    if p_year is null or p_year < 1970 or p_year > 2100 then
        raise exception 'invalid_request';
    end if;

    -- Harga paket (SIL yang dipotong, uang dasar pada kurs tahun 2000).
    case p_package
        when 'small'    then v_sil := 10;  v_base := 25000;
        when 'big'      then v_sil := 50;  v_base := 150000;
        when 'suitcase' then v_sil := 100; v_base := 400000;
        when 'truck'    then v_sil := 500; v_base := 2500000;
        else raise exception 'invalid_package';
    end case;

    w := public._wallet(auth.uid());                      -- kunci dompet

    -- Sudah pernah diproses: kembalikan hasil lama, jangan potong atau beri uang lagi.
    select * into ex from public.silicon_exchanges
        where user_id = auth.uid() and request_id = p_request_id;
    if found then
        return jsonb_build_object('balance', w.balance, 'sil', ex.sil, 'cash', ex.cash, 'replayed', true);
    end if;

    if w.balance < v_sil then raise exception 'insufficient_silicon'; end if;

    v_cash := round(v_base * public._cash_per_sil(p_year) / 2500)::bigint;

    update public.silicon_wallets set balance = balance - v_sil, updated_at = now()
        where user_id = auth.uid() returning * into w;
    insert into public.silicon_ledger(user_id, delta, reason, balance)
        values (auth.uid(), -v_sil, 'exchange:' || p_package, w.balance);
    insert into public.silicon_exchanges(user_id, request_id, package, year, sil, cash)
        values (auth.uid(), p_request_id, p_package, p_year, v_sil, v_cash);

    return jsonb_build_object('balance', w.balance, 'sil', v_sil, 'cash', v_cash);
end $$;

revoke all on function public.exchange_silicon(text, int, text) from public, anon;
grant execute on function public.exchange_silicon(text, int, text) to authenticated;

notify pgrst, 'reload schema';
