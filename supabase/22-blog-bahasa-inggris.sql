-- ============================================================
-- 22-blog-bahasa-inggris.sql — Terjemahan English untuk artikel blog
-- Kolom opsional: kalau kosong, pembaca EN melihat versi Indonesia.
-- Aman dijalankan ulang (idempoten). Jalankan SEBELUM memakai kolom English di editor.
-- ============================================================
alter table public.blog_posts add column if not exists title_en   text;
alter table public.blog_posts add column if not exists excerpt_en text;
alter table public.blog_posts add column if not exists body_en    text;

alter table public.blog_posts drop constraint if exists blog_posts_en_len;
alter table public.blog_posts add constraint blog_posts_en_len check (
    (title_en   is null or char_length(title_en)   between 3 and 200) and
    (excerpt_en is null or char_length(excerpt_en) <= 300) and
    (body_en    is null or char_length(body_en)    <= 30000)
);
