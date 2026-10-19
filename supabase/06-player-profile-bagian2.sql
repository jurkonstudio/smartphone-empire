-- 3. View publik (leaderboard) ------------------------------------------------
--    display_name di view = nama pemain pilihan user (BUKAN awalan email).
drop view if exists public.public_profiles;
create view public.public_profiles as
select * from (
    select
        p.id,
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

-- 4. Storage: foto profil boleh dilihat pemain lain ---------------------------
drop policy if exists "player_assets_select_avatars" on storage.objects;
create policy "player_assets_select_avatars" on storage.objects
    for select to authenticated
    using (bucket_id = 'player-assets' and storage.filename(name) like 'avatar.%');
