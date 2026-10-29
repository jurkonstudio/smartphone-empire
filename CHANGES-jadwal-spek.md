# Halaman Jadwal rilis visual + tabel perbandingan spek
Salin ke ROOT repo (struktur folder sama), timpa file yang sama:
- blog/js/jadwal.js        (BARU)  linimasa per bulan, filter status, hitung mundur, tabel perbandingan
- blog/css/jadwal.css      (BARU)
- blog/js/main.js          jadwal kini dimuat untuk SEMUA pengunjung (sebelumnya hanya admin); form jadwal punya isian spek
- index.html               #scheduleView, isian spek di dialog jadwal, tautan jadwal.css, main.js?v=13
- supabase/23-blog-spek-jadwal.sql (BARU)  jalankan sekali di Supabase SQL Editor

Urutan: 1) jalankan 23-blog-spek-jadwal.sql  2) commit file di atas  3) buka #/k/jadwal, login admin, "+ Jadwal rilis".
Tanpa langkah 1, jadwal tetap tersimpan, hanya isian spek yang ditolak (admin diberi tahu lewat toast).
Tabel perbandingan muncul otomatis setelah minimal satu jadwal punya data spek; pembaca mencentang 2-3 perangkat.
