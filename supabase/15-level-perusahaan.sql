-- ============================================================================
-- 15: LEVEL PERUSAHAAN DI SERVER
-- Jalankan SETELAH 12. Aman diulang (idempoten).
--
-- Rumus harus sama dengan deriveCompany() di src/systems/PlayerProgression.js:
--   XP perusahaan = aktivitas (pendapatan, unit, produk, tim, riset, lama operasi, pangsa)
--                 + kredibilitas (maks 300) ; level dibatasi _level_cap(tahun game).
-- Dihitung di sync_company_level(), yang dipanggil klien SETELAH sync_player_profile.
-- Komponen yang sudah ada di server (pendapatan, unit, reputasi, kredit, sentimen,
-- pangsa, lama main) diambil dari profiles; hanya staf, moral, dan riset yang dikirim klien.
-- ============================================================================

-- ---------- Kolom baru ----------
alter table public.profiles
    add column if not exists stat_staff         integer  not null default 0,
    add column if not exists stat_research      integer  not null default 0,
    add column if not exists stat_morale        integer  not null default 50,
    add column if not exists stat_company_xp    integer  not null default 0,
    add column if not exists stat_company_level smallint not null default 1;

-- Kolom turunan hanya boleh ditulis lewat fungsi (bukan langsung dari klien).
revoke update (stat_staff, stat_research, stat_morale, stat_company_xp, stat_company_level)
    on public.profiles from authenticated;

-- ---------- Rumus XP perusahaan ----------
create or replace function public._company_xp(
    p_rev numeric, p_sold bigint, p_products integer, p_staff integer, p_research integer,
    p_minutes bigint, p_rep numeric, p_credit numeric, p_sent numeric, p_morale numeric, p_share numeric
) returns integer language plpgsql immutable as $$
declare
    w   integer;
    act bigint;
    cx  bigint;
begin
    -- Kredibilitas x10 (bilangan bulat), sama dengan companyCred() * 10 di klien.
    w := 30 * round(least(greatest(coalesce(p_rep, 0), 0), 100))::integer
       + 30 * round(least(greatest(coalesce(p_credit, 0), 0), 100))::integer
       + 25 * round(least(greatest(coalesce(p_sent, 0), 0), 100))::integer
       + 15 * round(least(greatest(coalesce(p_morale, 0), 0), 100))::integer;

    -- Aktivitas
    act := public._lg_pts(div(greatest(coalesce(p_rev, 0), 0), 100000), 60)
         + public._lg_pts(greatest(coalesce(p_sold, 0), 0), 40)
         + least(40, 4 * greatest(coalesce(p_products, 0), 0))
         + least(60, 2 * greatest(coalesce(p_staff, 0), 0))
         + least(150, 3 * greatest(coalesce(p_research, 0), 0))
         + least(400, div(greatest(coalesce(p_minutes, 0), 0), 43200))
         + 3 * floor(least(greatest(coalesce(p_share, 0), 0), 100))::bigint;

    -- Bonus kredibilitas (maks 300)
    cx := least(300, greatest(0, div((w - 4000)::numeric, 20)::bigint));

    return (act + cx)::integer;
end $$;

revoke all on function public._company_xp(numeric, bigint, integer, integer, integer, bigint, numeric, numeric, numeric, numeric, numeric)
    from public, anon, authenticated;

-- ---------- RPC: hitung & simpan level perusahaan ----------
create or replace function public.sync_company_level(
    p_staff integer default 0,
    p_morale integer default 50,
    p_research integer default 0
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
    uid     uuid := auth.uid();
    r       public.profiles;
    v_staff integer;
    v_morale integer;
    v_res   integer;
    v_xp    integer;
    v_year  integer;
    v_cap   integer;
    v_lv    integer;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    select * into r from public.profiles where id = uid for update;
    if not found then raise exception 'profile_missing'; end if;

    v_staff  := least(greatest(coalesce(p_staff, 0), 0), 1000);
    v_morale := least(greatest(coalesce(p_morale, 50), 0), 100);
    v_res    := least(greatest(coalesce(p_research, 0), 0), 5000);

    v_xp   := public._company_xp(r.stat_revenue, r.stat_sold, r.stat_products, v_staff, v_res,
                                 r.stat_game_minutes, r.stat_reputation, r.stat_credit_score,
                                 r.stat_sentiment, v_morale, r.stat_share);
    v_year := 2000 + div(r.stat_game_minutes, 525600)::integer;
    v_cap  := public._level_cap(v_year);
    v_lv   := least(public._level_from_xp(v_xp::bigint), v_cap);

    update public.profiles set
        stat_staff         = v_staff,
        stat_research      = v_res,
        stat_morale        = v_morale,
        stat_company_xp    = v_xp,
        stat_company_level = v_lv,
        updated_at         = now()
    where id = uid;

    return jsonb_build_object('ok', true, 'level', v_lv, 'xp', v_xp, 'cap', v_cap);
end $$;

revoke all on function public.sync_company_level(integer, integer, integer) from public, anon;
grant execute on function public.sync_company_level(integer, integer, integer) to authenticated;

-- Baris lama: staf/riset/moral belum pernah dikirim, jadi level perusahaan dihitung
-- ulang saat klien sinkron berikutnya (sync_company_level).

-- ---------- View publik: tambah level perusahaan ----------
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
        p.stat_score,
        p.stat_company_level,
        p.stat_company_xp
    from public.profiles p
) x
where x.company_name is not null
  and not x.stats_flagged;
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;

notify pgrst, 'reload schema';
