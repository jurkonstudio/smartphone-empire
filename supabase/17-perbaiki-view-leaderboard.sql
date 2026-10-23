-- ============================================================================
-- Smartphone Empire — 17 PERBAIKI VIEW LEADERBOARD (public_profiles)
-- Jalankan kapan saja SETELAH 11, 12 dan 15. Aman diulang (idempoten). Tidak mengubah data pemain.
--
-- Kapan dipakai: 16-diagnosa-skema.sql menunjukkan kolom profiles OK, tetapi baris
-- "view public_profiles.stat_level / stat_score / stat_xp / stat_credibility /
-- stat_company_level / stat_company_xp" berstatus MISSING. Artinya view dibuat ulang oleh
-- file yang lebih lama (03 atau 11) setelah 12/15 dijalankan.
-- JANGAN menjalankan ulang 03 atau 11 sesudah ini tanpa menjalankan file ini lagi.
-- Isi di bawah identik dengan bagian view di 15-level-perusahaan.sql (versi terbaru: level, XP,
-- kredibilitas, skor, level perusahaan, dan menyembunyikan profil stats_flagged).
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
