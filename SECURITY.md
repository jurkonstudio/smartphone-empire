# Kebijakan Keamanan

Smartphone Empire adalah game web statis (HTML, CSS, JavaScript murni) yang memakai **Supabase** untuk login, cloud save, dompet Silicon (SIL), dan panel admin. Dokumen ini menjelaskan apa yang dilindungi, apa yang tidak, dan cara melapor.

## Versi yang didukung

Proyek ini di-deploy sebagai satu versi live, jadi perbaikan keamanan hanya diterapkan pada versi terbaru.

| Versi | Didukung |
| ----- | -------- |
| 0.2.x (terbaru, saat ini 0.2.1) | ✅ |
| < 0.2 | ❌ |

## Cara melapor celah keamanan

**Jangan membuka issue publik** untuk celah keamanan.

1. Gunakan **GitHub Private Vulnerability Reporting**: tab *Security* → *Report a vulnerability* di repo [jurkonstudio/smartphone-empire](https://github.com/jurkonstudio/smartphone-empire).
2. Jika fitur itu tidak tersedia, hubungi pemilik repo lewat profil GitHub **jurkonstudio** dan minta jalur kontak privat. Jangan menaruh detail teknis di tempat publik.

Sertakan: langkah mengulang, dampak yang kamu lihat, akun uji yang dipakai, dan jika ada, saran perbaikan.

**Yang bisa kamu harapkan** (proyek ini dikelola perorangan, jadi ini target upaya terbaik, bukan jaminan kontrak):
- Konfirmasi laporan dalam **7 hari**.
- Kabar perkembangan minimal tiap **14 hari** sampai selesai.
- Celah yang valid diperbaiki secepat mungkin, dan pelapor dicantumkan sebagai penemu bila bersedia.
- Laporan yang ditolak akan dijelaskan alasannya.

## Aturan pengujian

Boleh: menguji dengan **akunmu sendiri** dan data milikmu sendiri.
Tidak boleh: mengakses, mengubah, atau menghapus data pemain lain; mengganggu layanan (DoS, spam massal); mengirim top-up palsu atau menguras SIL orang lain; rekayasa sosial terhadap admin atau pemain. Temuan yang kamu dapat dengan cara di atas tidak akan dianggap itikad baik.

## Di dalam cakupan

- Kode di repo ini (`src/`, `index.html`, `031411/` panel admin).
- Skema dan fungsi SQL di `supabase/` serta Edge Function `supabase/function/advisor-chat`.
- Layanan Supabase milik proyek ini yang dipakai game.

Di luar cakupan: celah di Supabase, GitHub, CDN pihak ketiga (jsDelivr, esm.sh, Three.js), atau browser itu sendiri (laporkan ke penyedianya); serangan yang butuh perangkat korban sudah dibobol; dan temuan hanya berupa saran *best practice* tanpa dampak nyata.

## Model keamanan (apa yang dijaga dan di mana)

Prinsip utamanya: **kode klien bisa dibaca dan diubah siapa pun, jadi hal yang bernilai harus dijaga server.**

| Aset | Perlindungan |
| ---- | ------------ |
| Saldo SIL dan ledger | Dijaga di server. Pemain tidak punya hak `INSERT/UPDATE/DELETE` pada `silicon_wallets` dan `silicon_ledger`. Fungsi kredit `add_silicon` hanya bisa dipanggil `service_role`. Belanja SIL memakai fungsi server anti-ganda, dan tiap kredit tercatat di ledger. |
| Top-up SIL | Harga dan isi paket divalidasi di server (`_sil_packages`). Pesanan berstatus `pending` sampai admin menyetujui, dan satu pesanan tidak bisa dikredit dua kali. Pembayaran saat ini manual (GoPay/QRIS), belum ada provider otomatis. |
| Aksi admin | Diverifikasi di server lewat `is_admin()`, bukan di klien. Gate admin di sisi klien hanya kosmetik. Panel admin (`031411/`) bertanda `noindex`, tetapi **kerahasiaannya tidak bergantung pada URL-nya**. |
| Data pemain | *Row Level Security* aktif pada tabel inti. Fungsi `SECURITY DEFINER` memakai `set search_path` dan hak eksekusinya dicabut dari `public/anon` lalu diberikan hanya ke peran yang perlu. |
| Nama perusahaan unik | Ditegakkan di server, termasuk lewat trigger di jalur save (`14-nama-save-unik.sql`). |
| Input pemain di UI | Teks dari pemain atau server (nama, bio, pesan) wajib lewat `escapeHtml` (`src/utils/html.js`) sebelum masuk `innerHTML`. |
| Rahasia | Tidak ada `service_role` key atau API key AI di kode klien. Key Anthropic untuk Asisten hanya dibaca dari secret Edge Function (`ANTHROPIC_API_KEY`). |

### Yang sengaja BUKAN jaminan

- **Tanda tangan save (`src/core/Integrity.js`) bukan enkripsi.** Ia hanya membuat edit manual `localStorage` atau file export mudah terdeteksi, dan sanksinya mengembalikan SIL ke 0 serta menandai save (`tamperFlag`). Kuncinya ada di kode klien, jadi pemain yang berniat dan mampu tetap bisa memalsukannya. Perlindungan nyata ada di server.
- **Statistik leaderboard dilaporkan klien** (pendapatan, kas, dan sebagainya), sehingga belum bisa dianggap peringkat resmi. Validasi sisi server (`supabase/11-validasi-leaderboard.sql`) belum terhubung penuh.
- **Supabase URL dan *publishable key*** di `src/services/cloud/supabase.config.js` memang publik. Keamanan data bergantung pada RLS dan hak fungsi, bukan pada kerahasiaan key itu.
- **Save lokal tidak dienkripsi.** Siapa pun yang memakai perangkat yang sama bisa membacanya.

## Risiko yang sudah diketahui

Kami mencantumkannya terbuka agar peneliti tidak membuang waktu pada hal yang sudah diketahui, tetapi laporan dengan dampak baru tetap diterima.

1. **Edge Function Asisten Bisnis (`advisor-chat`)**: belum ada rate limit per pengguna dan header CORS-nya `Access-Control-Allow-Origin: *`. Karena memanggil API berbayar, **jangan diaktifkan untuk publik luas** sebelum rate limit (mis. per user di tabel Supabase) dan pembatasan origin ditambahkan. Input sudah dipotong (pertanyaan 300 karakter, riwayat 6 pesan, konteks 6.000 karakter).
2. **Leaderboard** berbasis angka klien (lihat di atas).
3. **Global error overlay** di `index.html` menampilkan pesan dan *stack trace* di layar saat terjadi error JavaScript. Ini berguna untuk debug, tetapi membocorkan path file ke pemain. Pertimbangkan menyembunyikannya di produksi.
4. **Dependensi CDN**: Three.js dan `supabase-js` dimuat dari CDN dengan versi dipin, tetapi **tanpa Subresource Integrity** (SRI) dan **tanpa Content-Security-Policy**. Kompromi CDN akan berdampak ke semua pemain.
5. **`DEV_BUILD`** harus tetap `false` di produksi (`src/config/dev.config.js`).
6. `supabase/BACA-DULU.md` belum memuat file SQL 10–13. Proyek yang melewatkan file tertentu bisa kehilangan perlindungannya (misalnya validasi nama unik di `14`).

## Panduan untuk yang menjalankan proyek sendiri

- Ganti `SUPABASE_URL` dan `SUPABASE_KEY` dengan milik proyekmu, dan jalankan SQL di `supabase/` **berurutan** sesuai README.
- Ganti email di `08-jadikan-admin.sql` dengan akun adminmu. Lindungi akun itu dengan password kuat dan 2FA di sisi penyedia email.
- Jangan pernah commit `service_role` key, token, atau `.env`. Jika terlanjur, **rotasi key sekarang** (menghapus commit saja tidak cukup).
- Simpan `ANTHROPIC_API_KEY` hanya sebagai secret Edge Function (`supabase secrets set`).
- Pertimbangkan menambah header keamanan di hosting-mu (CSP, `X-Content-Type-Options`, `Referrer-Policy`). GitHub Pages tidak mengizinkan header kustom, jadi untuk itu perlu CDN/proxy di depannya.
- Pastikan `DEV_BUILD = false` sebelum rilis.

## Lain-lain

Gambar QRIS/GoPay di repo (`qris-gopay.png`) berisi tujuan pembayaran top-up. Pastikan hanya berisi rekening yang memang untuk publik dan selalu cocokkan pesanan di panel admin sebelum menyetujui.
