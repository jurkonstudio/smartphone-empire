-- ============================================================================
-- Smartphone Empire — 16 DIAGNOSA SKEMA LEADERBOARD (HANYA BACA, tidak mengubah apa pun)
-- Jalankan di SQL Editor, lihat kolom "status" dan "tindakan".
-- Pesan "Database leaderboard belum lengkap" berarti ada baris MISSING di bawah.
-- ============================================================================
with need_cols(kolom, file_sql) as (values
    ('player_name','03'),('company_name','03'),('public_id','03'),('stat_revenue','03'),('stats_updated_at','03'),
    ('stats_flagged','11'),
    ('stat_credit_score','12'),('stat_credibility','12'),('stat_xp','12'),('stat_level','12'),('stat_score','12'),('reward_level','12'),
    ('stat_company_xp','15'),('stat_company_level','15')
),
view_cols(kolom, file_sql) as (values
    ('public_id','03'),('display_name','03'),('company_name','03'),('stat_revenue','03'),
    ('stat_level','12'),('stat_xp','12'),('stat_credibility','12'),('stat_score','12'),
    ('stat_company_level','15'),('stat_company_xp','15')
)
select 'kolom profiles.' || n.kolom as cek,
       case when exists (select 1 from information_schema.columns c
                          where c.table_schema='public' and c.table_name='profiles' and c.column_name=n.kolom)
            then 'OK' else 'MISSING' end as status,
       'jalankan SQL ' || n.file_sql as tindakan
  from need_cols n
union all
select 'view public_profiles ada',
       case when exists (select 1 from information_schema.views where table_schema='public' and table_name='public_profiles')
            then 'OK' else 'MISSING' end,
       'jalankan SQL 03 lalu 11, 12, 15'
union all
select 'view public_profiles.' || v.kolom,
       case when exists (select 1 from information_schema.columns c
                          where c.table_schema='public' and c.table_name='public_profiles' and c.column_name=v.kolom)
            then 'OK' else 'MISSING' end,
       'jalankan ulang SQL ' || v.file_sql || ' (bagian view)'
  from view_cols v
union all
select 'fungsi sync_player_profile (15 argumen)',
       case when exists (select 1 from pg_proc p join pg_namespace s on s.oid=p.pronamespace
                          where s.nspname='public' and p.proname='sync_player_profile' and p.pronargs=15)
            then 'OK' else 'MISSING' end,
       'jalankan SQL 12 (tanpa ini pemain TIDAK masuk leaderboard)'
union all
select 'fungsi sync_company_level',
       case when exists (select 1 from pg_proc p join pg_namespace s on s.oid=p.pronamespace
                          where s.nspname='public' and p.proname='sync_company_level')
            then 'OK' else 'MISSING' end,
       'jalankan SQL 15'
union all
select 'fungsi leaderboard_my_rank',
       case when exists (select 1 from pg_proc p join pg_namespace s on s.oid=p.pronamespace
                          where s.nspname='public' and p.proname='leaderboard_my_rank')
            then 'OK' else 'MISSING' end,
       'jalankan SQL 12'
union all
select 'izin SELECT public_profiles untuk authenticated',
       case when exists (select 1 from information_schema.role_table_grants
                          where table_schema='public' and table_name='public_profiles'
                            and grantee='authenticated' and privilege_type='SELECT')
            then 'OK' else 'MISSING' end,
       'jalankan ulang SQL 15 (bagian grant)'
union all
select 'jumlah akun di auth.users', count(*)::text, '' from auth.users
union all
select 'profil punya company_name (syarat tampil)',
       (select count(*) from public.profiles where company_name is not null and btrim(company_name) <> '')::text,
       'bila 0: buka game, login, tunggu sinkron (min. 30 detik) setelah SQL 12 dijalankan'
union all
select 'profil ditandai stats_flagged (disembunyikan)',
       coalesce((select count(*)::text from public.profiles where to_jsonb(profiles) ? 'stats_flagged' and (to_jsonb(profiles)->>'stats_flagged')::boolean), 'kolom belum ada'),
       'tinjau di panel admin; pemain flagged tidak tampil'
union all
select 'baris yang tampil di public_profiles',
       coalesce((select count(*)::text from public.public_profiles), 'view belum ada'),
       'ini jumlah pemain yang tampil di leaderboard'
order by 1;
