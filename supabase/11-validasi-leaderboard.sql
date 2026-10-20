-- ============================================================================
-- Smartphone Empire — 11 VALIDASI LEADERBOARD
-- Jalankan SETELAH 03. Aman diulang (idempoten).
-- Statistik tetap dilaporkan klien, tetapi server kini:
--   1. membatasi sinkron (maks 1x per 30 detik, lewat stats_updated_at);
--   2. memeriksa invarian yang tidak mungkin dihasilkan klien yang sah;
--   3. bila ada pelanggaran: nilai dibatasi, stats_flagged = true, dan profil
--      disembunyikan dari public_profiles (leaderboard) sampai ditinjau admin.
-- Catatan: ini menangkap pemalsuan yang kasar. Nilai yang masih di dalam batas
-- tetap bisa dipalsukan; validasi penuh butuh simulasi/audit di server.
-- ============================================================================

alter table public.profiles
    add column if not exists stats_flagged boolean not null default false;

-- Hanya admin / service_role yang boleh mengubah flag (klien tidak punya grant update).
revoke update (stats_flagged) on public.profiles from anon, authenticated;

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
    p_name_changes  integer default 0
) returns void language plpgsql security definer set search_path = public as $$
declare
    uid       uuid := auth.uid();
    c_max_active_products constant integer := 5;   -- sama dengan BALANCE.products.maxActiveProducts
    v_last    timestamptz;
    v_rev     numeric;
    v_sold    bigint;
    v_rep     numeric;
    v_share   numeric;
    v_prod    integer;
    v_flag    boolean := false;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    insert into public.profiles (id) values (uid) on conflict (id) do nothing;

    -- Batas laju: sinkron beruntun (mis. skrip yang memanggil RPC langsung) ditolak.
    select stats_updated_at into v_last from public.profiles where id = uid;
    if v_last is not null and v_last > now() - interval '30 seconds' then
        raise exception 'sync_too_fast';
    end if;

    -- Nilai mentah dari klien.
    v_rev   := coalesce(p_revenue, 0);
    v_sold  := coalesce(p_sold, 0);
    v_rep   := coalesce(p_reputation, 0);
    v_share := coalesce(p_share, 0);
    v_prod  := coalesce(p_products, 0);

    -- Invarian: klien yang sah tidak pernah melanggar ini.
    if v_rev < 0 or v_sold < 0 or v_prod < 0 then v_flag := true; end if;
    if v_rep < 0 or v_rep > 100 or v_share < 0 or v_share > 100 then v_flag := true; end if;
    if v_prod > c_max_active_products then v_flag := true; end if;
    if (v_sold = 0) <> (v_rev = 0) then v_flag := true; end if;   -- sold 0 wajib revenue 0, dan sebaliknya

    -- Batasi ke rentang yang wajar, apa pun hasil pemeriksaan di atas.
    v_rev   := least(greatest(v_rev, 0), 1e15);
    v_sold  := least(greatest(v_sold, 0), 1000000000000);
    v_rep   := least(greatest(v_rep, 0), 100);
    v_share := least(greatest(v_share, 0), 100);
    v_prod  := least(greatest(v_prod, 0), c_max_active_products);

    update public.profiles set
        player_name      = nullif(left(btrim(coalesce(p_player_name, '')), 24), ''),
        company_name     = nullif(left(btrim(coalesce(p_company_name, '')), 24), ''),
        founded_year     = case when p_founded_year  between 1970 and 2100 then p_founded_year  end,
        founded_month    = case when p_founded_month between 1 and 12      then p_founded_month end,
        name_changes     = greatest(name_changes, least(greatest(coalesce(p_name_changes, 0), 0), 1000)),
        stat_revenue     = v_rev,
        stat_sold        = v_sold,
        stat_reputation  = v_rep,
        stat_share       = v_share,
        stat_cash        = least(greatest(coalesce(p_cash, 0), -1e15), 1e15),
        stat_products    = v_prod,
        stats_flagged    = stats_flagged or v_flag,
        stats_updated_at = now(),
        updated_at       = now()
    where id = uid;
end $$;

-- Leaderboard: profil yang statistiknya ditandai tidak ikut ditampilkan.
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
        p.stats_flagged
    from public.profiles p
) x
where x.company_name is not null
  and not x.stats_flagged;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;

-- Izin tetap seperti 03 (signature tidak berubah).
revoke all on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) from public, anon;
grant execute on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) to authenticated;

notify pgrst, 'reload schema';
