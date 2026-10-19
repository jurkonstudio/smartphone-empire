-- ============================================================================
-- Smartphone Empire — PROFIL PEMAIN + LEADERBOARD (v2027.42)
-- Jalankan di Supabase SQL Editor SETELAH schema.sql & hardening.sql. Idempotent.
--
-- Isi:
--  1. kolom profil publik di public.profiles (nama pemain, nama perusahaan, statistik)
--  2. RPC sync_player_profile  -> satu-satunya jalan klien menulis nama perusahaan & statistik
--  3. view public_profiles     -> dipakai daftar pemain / leaderboard (nama pemain, bukan email)
--  4. policy storage           -> foto profil (avatar.*) boleh dilihat pemain lain
--
-- Catatan: statistik dilaporkan oleh klien (game jalan di browser), jadi leaderboard
-- ini "best effort". RPC sudah membatasi rentang nilai; anti-cheat penuh butuh
-- simulasi di server.
-- ============================================================================

-- 1. Kolom profil ------------------------------------------------------------
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
    add column if not exists stats_updated_at timestamptz;

-- Klien hanya boleh mengubah foto & display_name langsung.
-- Nama perusahaan / statistik wajib lewat RPC di bawah.
revoke insert, update on public.profiles from anon, authenticated;
grant update (display_name, avatar_path) on public.profiles to authenticated;

-- 2. RPC sinkron profil ------------------------------------------------------
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

revoke all on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) from public, anon;
grant execute on function public.sync_player_profile(text, text, integer, integer, numeric, bigint, numeric, numeric, numeric, integer, integer) to authenticated;

