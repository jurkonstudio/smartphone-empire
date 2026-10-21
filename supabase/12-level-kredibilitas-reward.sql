-- ============================================================================
-- Smartphone Empire — 12 LEVEL PEMAIN, KREDIBILITAS, SKOR LEADERBOARD, REWARD CASH (via Pesan)
-- Jalankan SETELAH 11 (butuh 09 + 10 + 11). Aman diulang (idempoten).
--
-- Yang ditambahkan
--   1. Kredibilitas (0-100): reputasi 30% + skor kredit bank 30% + sentimen publik 25% + integritas bayar 15%.
--   2. Level pemain (1-50) dari XP: pendapatan, unit terjual, lama bermain, kredibilitas, pangsa pasar.
--   3. Skor leaderboard (0-100): kekayaan (skala log) 40% + kredibilitas 40% + level 20%.
--   4. Reward cash: dikirim SERVER ke Pesan (kind 'reward'), diklaim lewat claim_inbox_reward().
--      - hadiah naik level (sekali per level, tidak berulang walau level turun-naik)
--      - hadiah tingkat kredibilitas Terpercaya / Terhormat / Terkemuka (sekali per tingkat)
--
-- Prinsip keamanan
--   * Klien TIDAK mengirim level/XP/kredibilitas. Klien hanya mengirim komponen mentah; server menghitung.
--   * Hadiah hanya dibuat server, hanya bisa diklaim SEKALI (UPDATE atomik), dan tahan retry jaringan (token).
--   * Hadiah belum diklaim tidak ikut terhapus oleh "Hapus semua", pembatasan 100 pesan, atau blokir.
--   * Profil yang statistiknya ditandai (stats_flagged) tidak menerima hadiah.
--   * Hadiah dibatasi oleh lama bermain di game: level maks 8 + 3 per tahun game; tingkat kredibilitas
--     butuh 1/2/3 tahun game. Statistik tetap dilaporkan klien (lihat catatan di 11): ini penghalang,
--     bukan validasi penuh.
-- Rumus di sini HARUS sama dengan src/systems/PlayerProgression.js (diuji paritasnya).
-- ============================================================================

-- ---------- Kolom baru ----------
alter table public.profiles
    add column if not exists stat_credit_score smallint     not null default 50,
    add column if not exists stat_missed       smallint     not null default 0,
    add column if not exists stat_sentiment    smallint     not null default 50,
    add column if not exists stat_game_minutes bigint       not null default 0,
    add column if not exists stat_credibility  numeric(5,1) not null default 0,
    add column if not exists stat_xp           integer      not null default 0,
    add column if not exists stat_level        smallint     not null default 1,
    add column if not exists stat_score        numeric(5,1) not null default 0,
    add column if not exists reward_level      smallint     not null default 1,
    add column if not exists reward_cred_tier  smallint     not null default 0;

-- Klien tidak boleh menulis kolom ini langsung (hanya grant update display_name/avatar_path dari 03).
revoke update (stat_credit_score, stat_missed, stat_sentiment, stat_game_minutes, stat_credibility,
               stat_xp, stat_level, stat_score, reward_level, reward_cred_tier)
    on public.profiles from anon, authenticated;

alter table public.inbox_messages
    add column if not exists reward_cash        bigint,
    add column if not exists reward_kind        text,
    add column if not exists reward_ref         integer,
    add column if not exists reward_claimed_at  timestamptz,
    add column if not exists reward_claim_token text;
alter table public.inbox_messages drop constraint if exists inbox_messages_reward_cash_check;
alter table public.inbox_messages add constraint inbox_messages_reward_cash_check
    check (reward_cash is null or reward_cash > 0);
alter table public.inbox_messages drop constraint if exists inbox_messages_kind_check;
alter table public.inbox_messages add constraint inbox_messages_kind_check
    check (kind in ('admin', 'sil', 'system', 'player', 'reward'));
create index if not exists inbox_messages_unclaimed_idx on public.inbox_messages (user_id)
    where reward_cash is not null and reward_claimed_at is null;

-- ============================================================================
-- Rumus murni (integer saja, supaya identik dengan JavaScript BigInt)
-- ============================================================================

-- Log10 linear-sepotong, dikali K: x di [10^k, 10^(k+1)) -> K * (k + (x-10^k)/(9*10^k)), dibulatkan ke bawah.
create or replace function public._lg_pts(p_x numeric, p_k bigint) returns bigint
language plpgsql immutable as $$
declare x numeric := floor(coalesce(p_x, 0)); p numeric := 1; kk int := 0;
begin
    if x < 1 then return 0; end if;
    while p * 10 <= x loop p := p * 10; kk := kk + 1; end loop;
    return div(p_k * (9 * kk * p + (x - p)), 9 * p)::bigint;
end $$;

-- Kredibilitas dalam persepuluhan (0..1000). Semua komponen dibulatkan ke bilangan bulat dulu.
create or replace function public._cred10(p_rep numeric, p_credit numeric, p_sent numeric, p_missed numeric) returns integer
language sql immutable as $$
    select div(
          30 * round(least(greatest(coalesce(p_rep, 0), 0), 100))
        + 30 * round(least(greatest(coalesce(p_credit, 0), 0), 100))
        + 25 * round(least(greatest(coalesce(p_sent, 0), 0), 100))
        + 15 * greatest(0, 100 - 25 * round(least(greatest(coalesce(p_missed, 0), 0), 20))), 10)::integer
$$;

-- Tingkat kredibilitas 0..4 (Meragukan, Biasa, Terpercaya, Terhormat, Terkemuka).
create or replace function public._cred_tier(p_cred10 integer) returns integer
language sql immutable as $$
    select case when p_cred10 >= 850 then 4 when p_cred10 >= 650 then 3 when p_cred10 >= 450 then 2
                when p_cred10 >= 250 then 1 else 0 end
$$;

-- XP total.
create or replace function public._xp(p_revenue numeric, p_sold numeric, p_minutes numeric, p_cred10 integer, p_share numeric)
returns integer language sql immutable as $$
    select (public._lg_pts(div(greatest(coalesce(p_revenue, 0), 0), 100000), 60)
          + public._lg_pts(greatest(coalesce(p_sold, 0), 0), 40)
          + least(400, div(greatest(coalesce(p_minutes, 0), 0), 43200))
          + least(300, greatest(0, div((p_cred10 - 400) * 5, 10)))
          + 3 * floor(least(greatest(coalesce(p_share, 0), 0), 100)))::integer
$$;

-- Ambang XP untuk mencapai level n (n >= 1). Level maksimum 50.
create or replace function public._level_xp(p_level integer) returns integer
language sql immutable as $$
    select (4 * (p_level - 1) * (p_level - 1)) / 5 + 5 * (p_level - 1)
$$;

create or replace function public._level_from_xp(p_xp bigint) returns integer
language plpgsql immutable as $$
declare n int := 1;
begin
    while n < 50 and p_xp >= public._level_xp(n + 1) loop n := n + 1; end loop;
    return n;
end $$;

-- Indeks kekayaan 0..1000 (skala log; $1 triliun = 1000).
create or replace function public._money10(p_revenue numeric) returns integer
language sql immutable as $$
    select least(1000, div(public._lg_pts(div(greatest(coalesce(p_revenue, 0), 0), 1000), 1000), 9))::integer
$$;

-- Skor leaderboard 0..1000 (tampil /10).
create or replace function public._score10(p_money10 integer, p_cred10 integer, p_level integer) returns integer
language sql immutable as $$
    select div(40 * p_money10 + 40 * p_cred10 + 20 * div((p_level - 1) * 1000, 49), 100)::integer
$$;

-- Nominal hadiah (dalam dolar game), mengikuti skala ekonomi yang sama dengan kurs SIL: +15% per tahun game.
create or replace function public._reward_scale_pct(p_year integer) returns integer
language sql immutable as $$
    select 100 + 15 * greatest(0, least(coalesce(p_year, 2000), 2100) - 2000)
$$;
create or replace function public._reward_level_cash(p_level integer, p_year integer) returns bigint
language sql immutable as $$
    select div((2000 + 250 * p_level)::numeric * public._reward_scale_pct(p_year), 10000)::bigint * 100
$$;
create or replace function public._reward_tier_cash(p_tier integer, p_year integer) returns bigint
language sql immutable as $$
    select div((case p_tier when 2 then 15000 when 3 then 40000 when 4 then 100000 else 0 end)::numeric
               * public._reward_scale_pct(p_year), 10000)::bigint * 100
$$;

revoke all on function public._lg_pts(numeric, bigint), public._cred10(numeric, numeric, numeric, numeric),
    public._cred_tier(integer), public._xp(numeric, numeric, numeric, integer, numeric),
    public._level_xp(integer), public._level_from_xp(bigint), public._money10(numeric),
    public._score10(integer, integer, integer), public._reward_scale_pct(integer),
    public._reward_level_cash(integer, integer), public._reward_tier_cash(integer, integer)
    from public, anon, authenticated;

-- ============================================================================
-- Pesan: pembatasan & hapus TIDAK boleh membuang hadiah yang belum diklaim
-- ============================================================================
create or replace function public._inbox_push(p_user uuid, p_kind text, p_title text, p_body text, p_amount bigint default null)
returns void language plpgsql security definer set search_path = public as $$
begin
    insert into public.inbox_messages (user_id, kind, title, body, amount)
    values (p_user, p_kind, left(p_title, 80), left(coalesce(p_body, ''), 1000), p_amount);
    delete from public.inbox_messages
     where user_id = p_user
       and not (reward_cash is not null and reward_claimed_at is null)
       and id not in (select id from public.inbox_messages where user_id = p_user order by id desc limit 100);
end $$;
revoke all on function public._inbox_push(uuid, text, text, text, bigint) from public, anon, authenticated;

create or replace function public.inbox_delete(p_ids bigint[] default null) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    delete from public.inbox_messages
     where user_id = auth.uid() and (p_ids is null or id = any(p_ids))
       and not (reward_cash is not null and reward_claimed_at is null);
    get diagnostics n = row_count;
    return n;
end $$;

-- ---------- Internal: kirim pesan hadiah ----------
create or replace function public._inbox_push_reward(p_user uuid, p_kind text, p_ref integer, p_title text, p_body text, p_cash bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
    if p_cash is null or p_cash <= 0 then return; end if;
    insert into public.inbox_messages (user_id, kind, title, body, reward_cash, reward_kind, reward_ref)
    values (p_user, 'reward', left(p_title, 80), left(coalesce(p_body, ''), 1000), p_cash, p_kind, p_ref);
end $$;
revoke all on function public._inbox_push_reward(uuid, text, integer, text, text, bigint) from public, anon, authenticated;

-- ---------- Klaim hadiah: atomik, sekali, aman di-retry dengan token yang sama ----------
create or replace function public.claim_inbox_reward(p_message_id bigint, p_token text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); v_cash bigint; m public.inbox_messages;
begin
    if me is null then raise exception 'not_authenticated'; end if;
    p_token := left(btrim(coalesce(p_token, '')), 64);
    if char_length(p_token) < 8 then raise exception 'invalid_token'; end if;

    update public.inbox_messages
       set reward_claimed_at = now(), reward_claim_token = p_token, read_at = coalesce(read_at, now())
     where id = p_message_id and user_id = me and reward_cash is not null and reward_claimed_at is null
    returning reward_cash into v_cash;
    if found then
        return jsonb_build_object('ok', true, 'cash', v_cash, 'replay', false);
    end if;

    select * into m from public.inbox_messages
     where id = p_message_id and user_id = me and reward_cash is not null;
    if not found then raise exception 'reward_not_found'; end if;
    -- Retry jaringan dengan token yang sama: kembalikan nominal yang sama (klien menjaga agar tidak dikredit dua kali).
    if m.reward_claim_token is not null and m.reward_claim_token = p_token then
        return jsonb_build_object('ok', true, 'cash', m.reward_cash, 'replay', true);
    end if;
    raise exception 'already_claimed';
end $$;

-- ============================================================================
-- Sinkron profil (menggantikan versi 11; parameter lama tetap ada, parameter baru opsional)
-- Klien lama yang belum mengirim komponen kredibilitas memakai nilai tersimpan.
-- ============================================================================
drop function if exists public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer);

create or replace function public.sync_player_profile(
    p_player_name   text    default null,
    p_company_name  text    default null,
    p_founded_year  integer default null,
    p_founded_month integer default null,
    p_revenue       numeric default 0,
    p_sold          bigint  default 0,
    p_reputation    numeric default 0,
    p_share         numeric default 0,
    p_cash          numeric default 0,
    p_products      integer default 0,
    p_name_changes  integer default 0,
    p_credit_score  integer default null,
    p_missed        integer default null,
    p_sentiment     integer default null,
    p_game_minutes  bigint  default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
    uid       uuid := auth.uid();
    c_max_active_products constant integer := 5;
    r         public.profiles;
    v_rev     numeric;
    v_sold    bigint;
    v_rep     numeric;
    v_share   numeric;
    v_prod    integer;
    v_credit  integer;
    v_missed  integer;
    v_sent    integer;
    v_min     bigint;
    v_flag    boolean := false;
    v_cred10  integer;
    v_xp      integer;
    v_level   integer;
    v_money10 integer;
    v_score10 integer;
    v_years   integer;
    v_year    integer;
    v_new_lv  integer;
    v_tier    integer;
    v_gate    integer;
    v_new_tr  integer;
    v_cash    bigint;
    v_rewards integer := 0;
    i         integer;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    insert into public.profiles (id) values (uid) on conflict (id) do nothing;
    select * into r from public.profiles where id = uid for update;

    -- Batas laju (sama seperti 11).
    if r.stats_updated_at is not null and r.stats_updated_at > now() - interval '30 seconds' then
        raise exception 'sync_too_fast';
    end if;

    v_rev    := coalesce(p_revenue, 0);
    v_sold   := coalesce(p_sold, 0);
    v_rep    := coalesce(p_reputation, 0);
    v_share  := coalesce(p_share, 0);
    v_prod   := coalesce(p_products, 0);
    v_credit := coalesce(p_credit_score, r.stat_credit_score);
    v_missed := coalesce(p_missed, r.stat_missed);
    v_sent   := coalesce(p_sentiment, r.stat_sentiment);
    v_min    := coalesce(p_game_minutes, r.stat_game_minutes);

    -- Invarian (klien sah tidak pernah melanggar).
    if v_rev < 0 or v_sold < 0 or v_prod < 0 then v_flag := true; end if;
    if v_rep < 0 or v_rep > 100 or v_share < 0 or v_share > 100 then v_flag := true; end if;
    if v_prod > c_max_active_products then v_flag := true; end if;
    if (v_sold = 0) <> (v_rev = 0) then v_flag := true; end if;
    if v_credit < 0 or v_credit > 100 or v_sent < 0 or v_sent > 100 then v_flag := true; end if;
    if v_missed < 0 or v_missed > 1000 or v_min < 0 then v_flag := true; end if;
    -- Harga rata-rata per unit tidak mungkin di atas $100.000, dan penjualan tidak mungkin melebihi pasar dunia.
    if v_sold > 0 and v_rev > v_sold::numeric * 100000 then v_flag := true; end if;
    if v_sold > 3000000000::bigint * (1 + div(greatest(v_min, 0), 525600)::bigint) then v_flag := true; end if;

    -- Batasi rentang.
    v_rev    := least(greatest(v_rev, 0), 1e15);
    v_sold   := least(greatest(v_sold, 0), 1000000000000);
    v_rep    := least(greatest(v_rep, 0), 100);
    v_share  := least(greatest(v_share, 0), 100);
    v_prod   := least(greatest(v_prod, 0), c_max_active_products);
    v_credit := least(greatest(v_credit, 0), 100);
    v_missed := least(greatest(v_missed, 0), 1000);
    v_sent   := least(greatest(v_sent, 0), 100);
    v_min    := least(greatest(v_min, 0), 52560000);   -- 100 tahun game

    -- Turunan dihitung SERVER.
    v_cred10  := public._cred10(v_rep, v_credit, v_sent, v_missed);
    v_xp      := public._xp(v_rev, v_sold, v_min, v_cred10, v_share);
    v_level   := public._level_from_xp(v_xp);
    v_money10 := public._money10(v_rev);
    v_score10 := public._score10(v_money10, v_cred10, v_level);

    update public.profiles set
        player_name       = nullif(left(btrim(coalesce(p_player_name, '')), 24), ''),
        company_name      = nullif(left(btrim(coalesce(p_company_name, '')), 24), ''),
        founded_year      = case when p_founded_year  between 1970 and 2100 then p_founded_year  end,
        founded_month     = case when p_founded_month between 1 and 12      then p_founded_month end,
        name_changes      = greatest(name_changes, least(greatest(coalesce(p_name_changes, 0), 0), 1000)),
        stat_revenue      = v_rev,
        stat_sold         = v_sold,
        stat_reputation   = v_rep,
        stat_share        = v_share,
        stat_cash         = least(greatest(coalesce(p_cash, 0), -1e15), 1e15),
        stat_products     = v_prod,
        stat_credit_score = v_credit,
        stat_missed       = v_missed,
        stat_sentiment    = v_sent,
        stat_game_minutes = v_min,
        stat_credibility  = v_cred10 / 10.0,
        stat_xp           = v_xp,
        stat_level        = v_level,
        stat_score        = v_score10 / 10.0,
        stats_flagged     = stats_flagged or v_flag,
        stats_updated_at  = now(),
        updated_at        = now()
    where id = uid;

    -- ---------- Hadiah (hanya untuk profil yang tidak ditandai) ----------
    if not (v_flag or r.stats_flagged) then
        v_years := div(v_min, 525600)::integer;
        v_year  := 2000 + v_years;

        -- Level: maksimal 10 level per sinkron, dan dibatasi lama bermain (8 + 3 per tahun game).
        v_new_lv := least(v_level, 8 + 3 * v_years, r.reward_level + 10);
        if v_new_lv > r.reward_level then
            v_cash := 0;
            for i in (r.reward_level + 1) .. v_new_lv loop
                v_cash := v_cash + public._reward_level_cash(i, v_year);
            end loop;
            perform public._inbox_push_reward(uid, 'level', v_new_lv,
                'Naik ke Level ' || v_new_lv,
                case when v_new_lv - r.reward_level > 1
                     then 'Selamat! Kamu naik dari Level ' || r.reward_level || ' ke Level ' || v_new_lv || '. Klaim hadiah cash-nya.'
                     else 'Selamat! Perusahaanmu mencapai Level ' || v_new_lv || '. Klaim hadiah cash-nya.' end,
                v_cash);
            update public.profiles set reward_level = v_new_lv where id = uid;
            v_rewards := v_rewards + 1;
        end if;

        -- Tingkat kredibilitas: butuh 1/2/3 tahun game untuk Terpercaya/Terhormat/Terkemuka.
        v_tier := public._cred_tier(v_cred10);
        v_gate := case when v_years >= 3 then 4 when v_years >= 2 then 3 when v_years >= 1 then 2 else 1 end;
        v_new_tr := least(v_tier, v_gate);
        if v_new_tr > r.reward_cred_tier then
            v_cash := 0;
            for i in greatest(r.reward_cred_tier + 1, 2) .. v_new_tr loop
                v_cash := v_cash + public._reward_tier_cash(i, v_year);
            end loop;
            if v_cash > 0 then
                perform public._inbox_push_reward(uid, 'tier', v_new_tr,
                    'Kredibilitas: ' || case v_new_tr when 2 then 'Terpercaya' when 3 then 'Terhormat' else 'Terkemuka' end,
                    'Reputasi, kredit, dan sentimen publik perusahaanmu terjaga baik. Klaim hadiah kredibilitasnya.',
                    v_cash);
                v_rewards := v_rewards + 1;
            end if;
            update public.profiles set reward_cred_tier = v_new_tr where id = uid;
        end if;
    end if;

    return jsonb_build_object('ok', true, 'level', v_level, 'xp', v_xp, 'credibility', v_cred10 / 10.0,
                              'score', v_score10 / 10.0, 'flagged', (v_flag or r.stats_flagged), 'rewards', v_rewards);
end $$;

-- ============================================================================
-- Peringkat saya (tanpa dibatasi 100 teratas)
-- ============================================================================
create or replace function public.leaderboard_my_rank(p_sort text default 'score') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); v_rank bigint; v_total bigint;
begin
    if me is null then raise exception 'not_authenticated'; end if;
    p_sort := lower(coalesce(p_sort, 'score'));
    if p_sort not in ('score', 'level', 'credibility', 'revenue', 'sold', 'reputation', 'share') then
        p_sort := 'score';
    end if;
    select count(*) into v_total from public.public_profiles;
    select x.rk into v_rank from (
        select q.id, rank() over (order by q.k desc, q.rev desc, q.id) as rk from (
            select p.id, p.stat_revenue as rev,
                   case p_sort when 'score' then p.stat_score
                               when 'level' then p.stat_xp::numeric
                               when 'credibility' then p.stat_credibility
                               when 'revenue' then p.stat_revenue
                               when 'sold' then p.stat_sold::numeric
                               when 'reputation' then p.stat_reputation
                               else p.stat_share end as k
              from public.public_profiles p) q) x
     where x.id = me;
    return jsonb_build_object('rank', v_rank, 'total', v_total);
end $$;

-- ============================================================================
-- View publik: tambah level, XP, kredibilitas, skor
-- ============================================================================
drop view if exists public.public_profiles;
create view public.public_profiles as
select * from (
    select
        p.id,
        p.public_id,
        p.player_name as display_name,
        p.avatar_path,
        coalesce(p.company_name,
                 (select h.company_name from public.save_heads h
                   where h.user_id = p.id order by h.updated_at desc limit 1)) as company_name,
        p.founded_year,
        p.founded_month,
        (select max(h.game_minutes) from public.save_heads h where h.user_id = p.id) as game_minutes,
        p.updated_at,
        p.created_at,
        p.stat_revenue,
        p.stat_sold,
        p.stat_reputation,
        p.stat_share,
        p.stats_flagged,
        p.stat_level,
        p.stat_xp,
        p.stat_credibility,
        p.stat_score
    from public.profiles p
) x
where x.company_name is not null
  and not x.stats_flagged;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;

-- ---------- Izin eksekusi ----------
revoke all on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer, integer, integer, integer, bigint) from public, anon;
grant execute on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer, integer, integer, integer, bigint) to authenticated;
revoke all on function public.claim_inbox_reward(bigint, text) from public, anon;
grant execute on function public.claim_inbox_reward(bigint, text) to authenticated;
revoke all on function public.leaderboard_my_rank(text) from public, anon;
grant execute on function public.leaderboard_my_rank(text) to authenticated;
revoke all on function public.inbox_delete(bigint[]) from public, anon;
grant execute on function public.inbox_delete(bigint[]) to authenticated;

notify pgrst, 'reload schema';
