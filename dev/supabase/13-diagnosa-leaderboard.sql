-- ============================================================================
-- Smartphone Empire — 13 DIAGNOSA (READ-ONLY, tidak mengubah data/aturan)
-- Ganti EMAIL di bawah dengan email akun yang bermasalah, lalu Run.
-- Kirim hasil setiap query ke developer jika masih bermasalah.
-- ============================================================================
with me as (
    select id, email from auth.users where lower(email) = lower('smartphoneempire025@gmail.com')
)
-- 1) Apakah akun ada & profilnya ada?
select 'akun' as cek, m.id::text as nilai from me m
union all
-- 2) Profil: company_name terisi? stats_flagged? stats_updated_at?
select 'profil.company_name', coalesce(p.company_name, '(NULL - tidak muncul di leaderboard)') from me m join public.profiles p on p.id = m.id
union all
select 'profil.stats_flagged', p.stats_flagged::text from me m join public.profiles p on p.id = m.id
union all
select 'profil.stats_updated_at', coalesce(p.stats_updated_at::text, '(belum pernah sinkron profil)') from me m join public.profiles p on p.id = m.id
union all
-- 3) Ada save di cloud?
select 'game_saves', count(*)::text from me m join public.game_saves g on g.user_id = m.id
union all
-- 4) Versi SQL: fungsi sync harus punya 15 parameter (file 12). Jika 0 baris -> file 12 belum dijalankan.
select 'sync_player_profile(15 arg)', count(*)::text from pg_proc
 where proname = 'sync_player_profile' and pronargs = 15
union all
-- 5) Izin klien pada tabel save (harus ada, tanpa diubah)
select 'grant game_saves ke authenticated', string_agg(privilege_type, ', ') from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'game_saves' and grantee = 'authenticated'
union all
-- 6) Kebijakan RLS game_saves (harus 4 kebijakan: select/insert/update/delete own)
select 'policy game_saves', string_agg(policyname, ', ') from pg_policies where schemaname = 'public' and tablename = 'game_saves';
