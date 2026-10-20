-- ============================================================================
-- Smartphone Empire — 03 PROFIL PEMAIN, ID PEMAIN, LEADERBOARD
-- Jalankan SETELAH 02. Aman diulang (idempoten).
-- Statistik leaderboard dilaporkan klien (best effort; RPC membatasi rentang nilai).
-- ============================================================================

-- ---------- Kolom profil ----------
alter table public.profiles
    add column if not exists player_name      text,
    add column if not exists company_name     text,
    add column if not exists founded_year     integer,
    add column if not exists founded_month    smallint,
    add column if not exists name_changes     integer      not null default 0,
    add column if not exists stat_revenue     numeric      not null default 0,
    add column if not exists stat_sold        bigint       not null default 0,
    add column if not exists stat_reputation  numeric(5,2) not null default 0,
    add column if not exists stat_share       numeric(5,2) not null default 0,
    add column if not exists stat_cash        numeric      not null default 0,
    add column if not exists stat_products    integer      not null default 0,
    add column if not exists stats_updated_at timestamptz,
    add column if not exists public_id        bigint;

-- Klien hanya boleh mengubah foto & display_name langsung; sisanya lewat RPC.
revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- ---------- ID pemain: angka acak 8 digit, unik, permanen ----------
create or replace function public._gen_public_id() returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint; tries int := 0;
begin
    loop
        v := 10000000 + floor(random() * 90000000)::bigint;
        exit when not exists (select 1 from public.profiles where public_id = v);
        tries := tries + 1;
        if tries > 50 then raise exception 'public_id_exhausted'; end if;
    end loop;
    return v;
end $$;
revoke all on function public._gen_public_id() from public, anon, authenticated;

create or replace function public.profiles_public_id_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if new.public_id is null then new.public_id := public._gen_public_id(); end if;
    else
        new.public_id := coalesce(old.public_id, new.public_id);
    end if;
    return new;
end $$;
drop trigger if exists profiles_public_id_guard on public.profiles;
create trigger profiles_public_id_guard before insert or update on public.profiles
    for each row execute function public.profiles_public_id_guard();

-- Pemain lama: buat profil yang belum ada, lalu beri ID.
insert into public.profiles (id) select u.id from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id) on conflict do nothing;
update public.profiles set public_id = public._gen_public_id() where public_id is null;
create unique index if not exists profiles_public_id_key on public.profiles (public_id);
alter table public.profiles alter column public_id set not null;

create or replace function public.get_my_public_id() returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    insert into public.profiles (id) values (auth.uid()) on conflict (id) do nothing;
    select public_id into v from public.profiles where id = auth.uid();
    return v;
end $$;

-- ---------- Nama perusahaan UNIK ----------
-- Jika langkah index gagal: ada nama kembar. Cek dengan:
--   select public.normalize_company_name(company_name), count(*) from public.profiles
--    where company_name is not null group by 1 having count(*) > 1;
create or replace function public.normalize_company_name(p text) returns text
language sql immutable as $$
    select lower(regexp_replace(btrim(coalesce(p, '')), '[^[:alnum:]]+', '', 'g'))
$$;

create unique index if not exists profiles_company_name_unique
    on public.profiles (public.normalize_company_name(company_name))
    where company_name is not null and btrim(company_name) <> '';

-- Hanya true/false. Nama milik akun sendiri dianggap tersedia. Boleh dipanggil sebelum login.
create or replace function public.company_name_available(p_name text) returns boolean
language sql stable security definer set search_path = public as $$
    select public.normalize_company_name(p_name) <> ''
       and not exists (select 1 from public.profiles p
             where p.company_name is not null
               and public.normalize_company_name(p.company_name) = public.normalize_company_name(p_name)
               and p.id is distinct from auth.uid())
       and not exists (select 1 from public.save_heads h
             where h.company_name is not null
               and public.normalize_company_name(h.company_name) = public.normalize_company_name(p_name)
               and h.user_id is distinct from auth.uid());
$$;

-- ---------- Sinkron profil dari game ----------
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
declare uid uuid := auth.uid();
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    insert into public.profiles (id) values (uid) on conflict (id) do nothing;
    update public.profiles set
        player_name      = nullif(left(btrim(coalesce(p_player_name, '')), 24), ''),
        company_name     = nullif(left(btrim(coalesce(p_company_name, '')), 24), ''),
        founded_year     = case when p_founded_year  between 1970 and 2100 then p_founded_year  end,
        founded_month    = case when p_founded_month between 1 and 12      then p_founded_month end,
        name_changes     = greatest(name_changes, least(greatest(coalesce(p_name_changes, 0), 0), 1000)),
        stat_revenue     = least(greatest(coalesce(p_revenue, 0), 0), 1e15),
        stat_sold        = least(greatest(coalesce(p_sold, 0), 0), 1000000000000),
        stat_reputation  = least(greatest(coalesce(p_reputation, 0), 0), 100),
        stat_share       = least(greatest(coalesce(p_share, 0), 0), 100),
        stat_cash        = least(greatest(coalesce(p_cash, 0), -1e15), 1e15),
        stat_products    = least(greatest(coalesce(p_products, 0), 0), 10000),
        stats_updated_at = now(),
        updated_at       = now()
    where id = uid;
end $$;

-- ---------- View publik (leaderboard / profil pemain) ----------
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

-- ---------- Izin eksekusi ----------
revoke all on function public.get_my_public_id() from public, anon;
grant execute on function public.get_my_public_id() to authenticated;
revoke all on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) from public, anon;
grant execute on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) to authenticated;
revoke all on function public.company_name_available(text) from public;
grant execute on function public.company_name_available(text) to anon, authenticated;

notify pgrst, 'reload schema';
