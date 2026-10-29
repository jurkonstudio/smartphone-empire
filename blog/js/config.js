// Konfigurasi blog. Kunci publishable boleh terlihat di frontend; keamanan data dijaga RLS (lihat supabase/20-blog.sql).
// AUTH_KEY sama dengan game (game/src/services/cloud/supabase.config.js): login sekali, berlaku di game dan blog.
export const SUPABASE_URL = 'https://iyuleatpewampdjeuzrb.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_HZUb3YP1Ztz57cV6EGHBPQ_obiCJ3L7';
export const BUCKET = 'blog-media';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const TZ = 'Asia/Jakarta';
export const AUTH_KEY = 'smartphone-empire:supabase-auth:iyuleatpewampdjeuzrb';
// ---- Isi bagian ini sebelum publikasi. Yang dikosongkan otomatis tidak ditampilkan. ----
export const CONTACT_EMAIL = ''; // email redaksi, mis. 'kalfinsetiawan@icloud.com'. Kosong = kartu email di halaman Kontak disembunyikan
export const SOCIAL = { x: '', instagram: '', youtube: '' }; // URL akun asli, mis. 'https://x.com/calvf1nka'. Kosong = tautan tidak muncul di footer
export const SHOW_ADS = false; // true bila kotak iklan 300x250 sudah dipakai sungguhan
export const LS_LANG = 'blog-lang';
