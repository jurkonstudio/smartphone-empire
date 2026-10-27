-- ============================================================
-- 20-blog.sql — Portal berita (/blog) untuk Smartphone Empire
-- Tabel: blog_posts (artikel), blog_releases (jadwal rilis)
-- Storage: bucket blog-media (gambar sampul, baca publik)
-- Prasyarat: 05-admin-inti.sql (fungsi is_admin) dan 08-jadikan-admin.sql
-- Aman dijalankan ulang (idempoten).
-- ============================================================

-- ---------- 1. Tabel artikel ----------
create table if not exists public.blog_posts (
    id           uuid primary key default gen_random_uuid(),
    slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
    title        text not null check (char_length(title) between 3 and 200),
    category     text not null check (category in ('rilis', 'spek', 'rumor', 'jadwal')),
    excerpt      text check (char_length(excerpt) <= 300),
    body         text not null default '' check (char_length(body) <= 30000),
    cover_url    text check (cover_url is null or cover_url ~ '^https://'),
    source_url   text check (source_url is null or source_url ~ '^https?://'),
    is_featured  boolean not null default false,
    status       text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create index if not exists blog_posts_status_idx on public.blog_posts (status, published_at desc);

-- ---------- 2. Tabel jadwal rilis ----------
create table if not exists public.blog_releases (
    id             uuid primary key default gen_random_uuid(),
    device_name    text not null check (char_length(device_name) between 2 and 120),
    brand          text check (char_length(brand) <= 60),
    expected_date  date,
    expected_label text check (char_length(expected_label) <= 60),  -- mis. "Q3 2027" jika tanggal belum pasti
    status         text not null default 'rumor' check (status in ('rumor', 'dikonfirmasi', 'resmi')),
    source_url     text check (source_url is null or source_url ~ '^https?://'),
    notes          text check (char_length(notes) <= 1000),
    created_at     timestamptz not null default now()
);

create index if not exists blog_releases_date_idx on public.blog_releases (expected_date);

-- ---------- 3. Trigger: isi published_at & updated_at otomatis ----------
create or replace function public.blog_touch() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    if new.status = 'published' and new.published_at is null then
        new.published_at := now();
    end if;
    return new;
end $$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
    before insert or update on public.blog_posts
    for each row execute function public.blog_touch();

-- ---------- 4. Row Level Security ----------
alter table public.blog_posts    enable row level security;
alter table public.blog_releases enable row level security;

-- Artikel: pengunjung hanya melihat yang sudah terbit; admin melihat semua (termasuk draf).
drop policy if exists "blog_posts_read" on public.blog_posts;
create policy "blog_posts_read" on public.blog_posts
    for select to anon, authenticated
    using (status = 'published' or public.is_admin());

-- Artikel: hanya admin yang boleh menambah, mengubah, menghapus.
drop policy if exists "blog_posts_admin_write" on public.blog_posts;
create policy "blog_posts_admin_write" on public.blog_posts
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Jadwal rilis: semua orang bisa membaca; hanya admin yang menulis.
drop policy if exists "blog_releases_read" on public.blog_releases;
create policy "blog_releases_read" on public.blog_releases
    for select to anon, authenticated
    using (true);

drop policy if exists "blog_releases_admin_write" on public.blog_releases;
create policy "blog_releases_admin_write" on public.blog_releases
    for all to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ---------- 5. Izin tabel (proyek Supabase baru butuh GRANT eksplisit, lihat 18-izin-tabel-save.sql) ----------
grant select on public.blog_posts    to anon, authenticated;
grant insert, update, delete on public.blog_posts    to authenticated;
grant select on public.blog_releases to anon, authenticated;
grant insert, update, delete on public.blog_releases to authenticated;

-- ---------- 6. Storage: bucket gambar sampul ----------
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do update set public = true;

drop policy if exists "blog_media_read" on storage.objects;
create policy "blog_media_read" on storage.objects
    for select to anon, authenticated
    using (bucket_id = 'blog-media');

drop policy if exists "blog_media_admin_insert" on storage.objects;
create policy "blog_media_admin_insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'blog-media' and public.is_admin());

drop policy if exists "blog_media_admin_update" on storage.objects;
create policy "blog_media_admin_update" on storage.objects
    for update to authenticated
    using (bucket_id = 'blog-media' and public.is_admin())
    with check (bucket_id = 'blog-media' and public.is_admin());

drop policy if exists "blog_media_admin_delete" on storage.objects;
create policy "blog_media_admin_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'blog-media' and public.is_admin());

-- ---------- 7. Uji cepat (opsional, jalankan terpisah) ----------
-- Sebagai pengunjung (tanpa login) hasilnya hanya artikel terbit:
--   select slug, status from public.blog_posts;
-- Setelah login admin di blog.html, panggil:
--   select public.is_admin();   -- harus true
