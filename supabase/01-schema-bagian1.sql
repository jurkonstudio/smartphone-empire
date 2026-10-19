-- ============================================================================
-- Smartphone Empire — skema Supabase (v2027.37a)
-- Cara pakai: Dashboard Supabase -> SQL Editor -> New query -> tempel semua -> Run.
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

-- ---------- Fungsi umum: isi updated_at otomatis ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ============================================================================
-- 1. PROFIL PEMAIN
-- ============================================================================
create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_path  text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();

-- Buat profil otomatis saat akun baru dibuat.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, split_part(coalesce(new.email, ''), '@', 1))
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================================
-- 2. SAVE GAME (3 slot per pemain)
-- ============================================================================
create table if not exists public.game_saves (
    user_id         uuid     not null references auth.users(id) on delete cascade,
    slot            smallint not null check (slot between 1 and 3),
    company_name    text,
    game_year       integer,
    game_month      smallint,
    game_minutes    bigint   not null default 0,
    schema_version  integer,
    device_id       text,
    client_saved_at bigint,
    data            jsonb    not null,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    primary key (user_id, slot),
    constraint game_saves_size check (octet_length(data::text) <= 5242880)   -- maks 5 MB
);

alter table public.game_saves enable row level security;

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own" on public.game_saves
    for select to authenticated using (auth.uid() = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own" on public.game_saves
    for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own" on public.game_saves
    for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "game_saves_delete_own" on public.game_saves;
create policy "game_saves_delete_own" on public.game_saves
    for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists game_saves_set_updated_at on public.game_saves;
create trigger game_saves_set_updated_at before update on public.game_saves
    for each row execute function public.set_updated_at();

