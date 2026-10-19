-- ============================================================================
-- Smartphone Empire — ID PEMAIN JADI PUBLIK (tampil di profil pemain lain)
-- Jalankan SETELAH player-profile.sql & player-id.sql. Idempotent.
--
-- Menambah kolom public_id (angka 8 digit) ke view public_profiles. Sebelumnya ID
-- hanya diketahui pemilik & admin; sekarang pemain lain bisa melihatnya di profil publik.
-- Catatan: ID hanya dipakai untuk TOP-UP lewat backend (service_role) dan tidak memberi
-- akses ke akun, jadi aman dibuka. Game tetap jalan bila file ini belum dijalankan
-- (ID publik saja yang belum tampil).
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
        p.stat_share
    from public.profiles p
) x
where x.company_name is not null;

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;
