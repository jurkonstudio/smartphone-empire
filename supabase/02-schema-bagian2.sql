-- ============================================================================
-- 3. SAVE HEADS — ringkasan kecil tiap slot (tanpa kolom data besar).
--    Dipakai untuk daftar slot & Realtime, supaya pesan realtime tetap ringan.
-- ============================================================================
create table if not exists public.save_heads (
    user_id         uuid     not null references auth.users(id) on delete cascade,
    slot            smallint not null,
    company_name    text,
    game_year       integer,
    game_month      smallint,
    game_minutes    bigint   not null default 0,
    schema_version  integer,
    device_id       text,
    client_saved_at bigint,
    updated_at      timestamptz not null default now(),
    primary key (user_id, slot)
);

alter table public.save_heads enable row level security;

drop policy if exists "save_heads_select_own" on public.save_heads;
create policy "save_heads_select_own" on public.save_heads
    for select to authenticated using (auth.uid() = user_id);
-- Tidak ada policy insert/update/delete: hanya trigger (security definer) di bawah yang menulis.

create or replace function public.sync_save_head()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if (tg_op = 'DELETE') then
        delete from public.save_heads where user_id = old.user_id and slot = old.slot;
        return old;
    end if;
    insert into public.save_heads
        (user_id, slot, company_name, game_year, game_month, game_minutes,
         schema_version, device_id, client_saved_at, updated_at)
    values
        (new.user_id, new.slot, new.company_name, new.game_year, new.game_month, new.game_minutes,
         new.schema_version, new.device_id, new.client_saved_at, now())
    on conflict (user_id, slot) do update set
        company_name    = excluded.company_name,
        game_year       = excluded.game_year,
        game_month      = excluded.game_month,
        game_minutes    = excluded.game_minutes,
        schema_version  = excluded.schema_version,
        device_id       = excluded.device_id,
        client_saved_at = excluded.client_saved_at,
        updated_at      = now();
    return new;
end;
$$;

drop trigger if exists game_saves_sync_head on public.game_saves;
create trigger game_saves_sync_head after insert or update or delete on public.game_saves
    for each row execute function public.sync_save_head();

-- Realtime: aktifkan untuk save_heads (abaikan jika sudah terdaftar).
do $$
begin
    alter publication supabase_realtime add table public.save_heads;
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- 4. STORAGE
--    player-assets : privat, tiap pemain hanya akses folder bernama user-id miliknya.
--    game-assets   : publik (baca bebas); unggah lewat Dashboard.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-assets', 'player-assets', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('game-assets', 'game-assets', true)
on conflict (id) do nothing;

drop policy if exists "player_assets_select_own" on storage.objects;
create policy "player_assets_select_own" on storage.objects
    for select to authenticated
    using (bucket_id = 'player-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "player_assets_insert_own" on storage.objects;
create policy "player_assets_insert_own" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'player-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "player_assets_update_own" on storage.objects;
create policy "player_assets_update_own" on storage.objects
    for update to authenticated
    using (bucket_id = 'player-assets' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'player-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "player_assets_delete_own" on storage.objects;
create policy "player_assets_delete_own" on storage.objects
    for delete to authenticated
    using (bucket_id = 'player-assets' and (storage.foldername(name))[1] = auth.uid()::text);
