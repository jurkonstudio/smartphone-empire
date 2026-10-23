# Kebijakan Keamanan

Smartphone Empire adalah game web statis (HTML, CSS, JavaScript murni) yang memakai **Supabase** untuk login, cloud save, profil dan pesan pemain, dompet Silicon (SIL), dan panel admin. Dokumen ini menjelaskan apa yang dilindungi, apa yang tidak, dan cara melapor.

## Versi yang didukung

Proyek ini di-deploy sebagai satu versi live, jadi perbaikan keamanan hanya diterapkan pada versi terbaru.

| Versi | Didukung |
| ----- | -------- |
| 0.2.x (terbaru, saat ini 0.2.2) | ✅ |
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
Tidak boleh: mengakses, mengubah, atau menghapus data pemain lain; mengganggu layanan (DoS, spam massal); mengirim top-up palsu atau menguras SIL orang lain; mengirim pesan massal atau spam ke pemain lain; menebak atau mengumpulkan ID Pemain secara massal; rekayasa sosial terhadap admin atau pemain. Temuan yang kamu dapat dengan cara di atas tidak akan dianggap itikad baik.

## Di dalam cakupan

- Kode di repo ini (`src/`, `index.html`, `web.html` (landing page), `031411/` panel admin). Folder `tools/` berisi skrip uji lokal dan tidak dimuat game, jadi bukan permukaan serangan produksi.
- Skema dan fungsi SQL di `supabase/` (termasuk `12` dan `15` untuk level dan reward) serta Edge Function `supabase/function/advisor-chat`.
- Layanan Supabase milik proyek ini yang dipakai game.

Di luar cakupan: celah di Supabase, GitHub, CDN pihak ketiga (jsDelivr, esm.sh, Three.js), atau browser itu sendiri (laporkan ke penyedianya); serangan yang butuh perangkat korban sudah dibobol; dan temuan hanya berupa saran *best practice* tanpa dampak nyata.

## Model keamanan (apa yang dijaga dan di mana)

Prinsip utamanya: **kode klien bisa dibaca dan diubah siapa pun, jadi hal yang bernilai harus dijaga server.**

| Aset | Perlindungan |
| ---- | ------------ |
| Saldo SIL dan ledger | Dijaga di server. Pemain tidak punya hak `INSERT/UPDATE/DELETE` pada `silicon_wallets` dan `silicon_ledger`. Fungsi kredit `add_silicon` hanya bisa dipanggil `service_role`. Belanja SIL memakai fungsi server anti-ganda, dan tiap kredit tercatat di ledger. |
| Top-up SIL | Harga dan isi paket divalidasi di server (`_sil_packages`). Pesanan berstatus `pending` sampai admin menyetujui, satu pesanan tidak bisa dikredit dua kali, dan satu akun maksimal punya 5 pesanan `pending`. Pembayaran saat ini manual (GoPay/QRIS), belum ada provider otomatis. Fungsi pembuatan pesanan lewat ID pemain (`create_topup_order_by_public_id`) dan `lookup_player_by_public_id` hanya bisa dipanggil `service_role`. |
| Kirim SIL antar pemain | Dilakukan atomik di server dengan penguncian dua dompet berurutan (anti deadlock), batas kirim 5.000 SIL per 24 jam, dan tercatat di ledger. |
| Aksi admin | Diverifikasi di server lewat `is_admin()`, bukan di klien. Gate admin di sisi klien hanya kosmetik. Panel admin (`031411/`) bertanda `noindex`, tetapi **kerahasiaannya tidak bergantung pada URL-nya**. |
| Data pemain | *Row Level Security* aktif pada tabel inti. Fungsi `SECURITY DEFINER` memakai `set search_path` dan hak eksekusinya dicabut dari `public/anon` lalu diberikan hanya ke peran yang perlu. |
| Level, XP, dan kredibilitas | Klien **tidak** mengirim level atau XP. Server menghitungnya dari komponen mentah (`12-level-kredibilitas-reward.sql` dan `15-level-perusahaan.sql`). Kolom turunan di `profiles` tidak bisa ditulis langsung dari klien (`revoke update` pada kolom itu). |
| Hadiah level dan kredibilitas | Dibuat hanya oleh server dan masuk ke Pesan. Klaimnya memakai pembaruan atomik sehingga hanya bisa **sekali**, dan tahan terhadap pengulangan permintaan karena jaringan. |
| Statistik leaderboard | Sebagian divalidasi (lihat bagian *Yang sengaja BUKAN jaminan*): frekuensi sinkron dibatasi, invarian diperiksa, dan profil yang melanggar disembunyikan dari leaderboard sampai ditinjau admin (`11-validasi-leaderboard.sql`). |
| Nama perusahaan unik | Ditegakkan di server, termasuk lewat trigger di jalur save (`14-nama-save-unik.sql`). |
| Input pemain di UI | Teks dari pemain atau server (nama, bio, pesan, judul inbox) wajib lewat `escapeHtml` (`src/utils/html.js`) atau `textContent` sebelum masuk `innerHTML`. Pemeriksaan acak pada panel Pesan, profil, dan daftar pemain menunjukkan aturan ini dijalankan, tetapi belum ada pemindaian otomatis (lihat risiko 8). |
| Rahasia | Tidak ada `service_role` key atau API key AI di kode klien. Key Anthropic untuk Asisten hanya dibaca dari secret Edge Function (`ANTHROPIC_API_KEY`). |

### Yang sengaja BUKAN jaminan

- **Tanda tangan save (`src/core/Integrity.js`) bukan enkripsi.** Ia hanya membuat edit manual `localStorage` atau file export mudah terdeteksi, dan sanksinya mengembalikan SIL ke 0 serta menandai save (`tamperFlag`). Kuncinya ada di kode klien, jadi pemain yang berniat dan mampu tetap bisa memalsukannya. Perlindungan nyata ada di server.
- **Statistik leaderboard tetap dilaporkan klien** (pendapatan, kas, dan sebagainya). Server menangkap pemalsuan kasar (angka mustahil, sinkron terlalu sering), tetapi nilai yang masih di dalam batas wajar tetap bisa dipalsukan. Validasi penuh butuh simulasi atau audit di server, jadi peringkat belum resmi. Level dan skor yang diturunkan darinya ikut mewarisi batas ini.
- **Penguncian Top Up hanya di sisi klien.** Game (`TOPUP_LOCKED` di `src/ui/panels/SiliconStorePanel.js`) dan landing page (`web.html`) menyembunyikan atau menonaktifkan pembayaran, tetapi fungsi server `create_payment_order` tidak mengecek flag apa pun. Pemain yang login tetap bisa membuat pesanan `pending` lewat API langsung. Pesanan itu tidak otomatis mengkredit SIL (tetap butuh persetujuan admin), tetapi kalau top-up harus tertutup total, kuncinya perlu ditambahkan di server.
- **ID Pemain bersifat publik.** Ia tampil di profil dan bisa dilihat pemain lain, jadi jangan dianggap rahasia dan jangan dipakai sebagai bukti identitas.
- **Supabase URL dan *publishable key*** di `src/services/cloud/supabase.config.js` memang publik. Keamanan data bergantung pada RLS dan hak fungsi, bukan pada kerahasiaan key itu.
- **Save lokal tidak dienkripsi.** Siapa pun yang memakai perangkat yang sama bisa membacanya.

## Risiko yang sudah diketahui

Kami mencantumkannya terbuka agar peneliti tidak membuang waktu pada hal yang sudah diketahui, tetapi laporan dengan dampak baru tetap diterima.

1. **Edge Function Asisten Bisnis (`advisor-chat`)**: belum ada rate limit per pengguna dan header CORS-nya `Access-Control-Allow-Origin: *`. Karena memanggil API berbayar, **jangan diaktifkan untuk publik luas** sebelum rate limit (mis. per user di tabel Supabase) dan pembatasan origin ditambahkan. Input sudah dipotong (pertanyaan 300 karakter, riwayat 6 pesan, konteks 6.000 karakter).
2. **Leaderboard** berbasis angka klien yang divalidasi sebagian (lihat di atas).
3. **Top Up hanya dikunci di klien** (lihat di atas). Landing page juga memuat QRIS pembayaran (`qris-gopay.png`) sebagai berkas statis publik.
4. **Global error overlay** di `index.html` menampilkan pesan dan *stack trace* di layar saat terjadi error JavaScript, dan tidak dibatasi oleh `DEV_BUILD`. Ini berguna untuk debug, tetapi membocorkan path file ke pemain. Pertimbangkan menyembunyikannya di produksi.
5. **Dependensi CDN**: Three.js (`cdn.jsdelivr.net`, v0.160.0) dan `supabase-js` (`cdn.jsdelivr.net` dengan cadangan `esm.sh`, v2.49.4) dimuat dengan versi dipin, tetapi **tanpa Content-Security-Policy**. Subresource Integrity (SRI) juga belum ada, dan tidak bisa dipasang langsung pada `import()` dinamis. Opsi perbaikannya: simpan salinan library di repo (self-host) atau pakai import map dengan atribut `integrity`. Kompromi CDN akan berdampak ke semua pemain.
6. **`DEV_BUILD`** harus tetap `false` di produksi (`src/config/dev.config.js`).
7. **Enumerasi ID Pemain**: fungsi `get_player_by_id` mengembalikan nama perusahaan dan nama pemain untuk ID mana pun kepada pengguna yang login, tanpa rate limit. Karena ID Pemain publik, ini by design, tetapi pengumpulan massal tetap dilarang (lihat aturan pengujian).
8. **Belum ada pemindaian otomatis untuk XSS.** Kode memiliki puluhan titik `innerHTML` dan aturan `escapeHtml`, tetapi belum ada linter atau test yang memeriksanya. Komponen baru yang menampilkan teks pemain perlu diperiksa manual.
9. **Panel admin (`031411/`) punya konsol RPC bebas.** Admin bisa memanggil fungsi apa pun dengan argumen JSON. Pengamannya hanya `is_admin()` di server, jadi akun admin wajib memakai password kuat dan 2FA.
10. `supabase/BACA-DULU.md` belum memuat file SQL 10–13. Proyek yang melewatkan file tertentu bisa kehilangan perlindungannya (misalnya validasi nama unik di `14`, validasi leaderboard di `11`, atau perhitungan level di server pada `12` dan `15`).
11. **Data dan logika game ada di klien.** Paket skenario 2027–2030 (indeks biaya komponen, pangsa merek, penarikan merek, berita) seluruhnya dihitung di browser dan tersimpan di save lokal (`competitorState.withdrawn`, `lowShareYears`). Seperti save lain, ia dilindungi tanda tangan integritas yang bukan enkripsi, jadi nilainya bisa diubah pemain. Tidak ada saldo SIL atau data akun yang bergantung padanya, dan skor leaderboard tetap mewarisi batas yang dijelaskan di atas.
12. Komentar di `src/core/Integrity.js` masih merujuk `supabase/hardening.sql`, yang sudah digabung ke file bernomor.

## Panduan untuk yang menjalankan proyek sendiri

- Ganti `SUPABASE_URL` dan `SUPABASE_KEY` dengan milik proyekmu, dan jalankan SQL di `supabase/` **berurutan** sesuai README (rantai level: `09` → `10` → `11` → `12` → `15`).
- Ganti email di `08-jadikan-admin.sql` dengan akun adminmu. Lindungi akun itu dengan password kuat dan 2FA di sisi penyedia email.
- Ganti `qris-gopay.png` dengan kode pembayaranmu sendiri, atau hapus kalau kamu tidak membuka top-up.
- Kalau ingin menutup top-up, jangan hanya mengandalkan flag di klien. Tambahkan pengecekan di fungsi `create_payment_order` (mis. tabel pengaturan atau flag yang hanya bisa diubah admin).
- Jangan pernah commit `service_role` key, token, atau `.env`. Jika terlanjur, **rotasi key sekarang** (menghapus commit saja tidak cukup).
- Simpan `ANTHROPIC_API_KEY` hanya sebagai secret Edge Function (`supabase secrets set`).
- Pertimbangkan menambah header keamanan di hosting-mu (CSP, `X-Content-Type-Options`, `Referrer-Policy`). GitHub Pages tidak mengizinkan header kustom, jadi untuk itu perlu CDN/proxy di depannya.
- Pastikan `DEV_BUILD = false` sebelum rilis.

## Lain-lain

Gambar QRIS/GoPay di repo (`qris-gopay.png`) berisi tujuan pembayaran top-up. Pastikan hanya berisi rekening yang memang untuk publik dan selalu cocokkan pesanan di panel admin sebelum menyetujui.
