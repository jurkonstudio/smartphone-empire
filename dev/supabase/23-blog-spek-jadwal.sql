-- ============================================================
-- 23-blog-spek-jadwal.sql — Data spek untuk tabel perbandingan di halaman Jadwal
-- Prasyarat: 20-blog.sql. Aman dijalankan ulang (idempoten).
-- Isi kolom specs: {"chipset":"...","layar":"...","ram":"...","kamera":"...","baterai":"...","harga":"..."}
-- Izin baca/tulis mengikuti kebijakan blog_releases yang sudah ada (baca publik, tulis admin).
-- ============================================================
alter table public.blog_releases
    add column if not exists specs jsonb
    check (specs is null or jsonb_typeof(specs) = 'object');
