<div align="center">

# JURKON STUDIO

### Smartphone Empire

**Bangun perusahaan ponsel dari nol. Mulai 1 Januari 2000, lawan Nokia, Apple, Samsung, dan 23 kompetitor lain, sampai era AI dan foldable.**

Dibuat oleh **Kalfin Agus Setiawan** di bawah bendera **Jurkon Studio**.

[🎮 Coba Game](https://www.smartphone-empire.my.id/) · [🐛 Laporkan Bug](https://github.com/jurkonstudio/smartphone-empire/issues) · [🔒 Kebijakan Keamanan](SECURITY.md)

</div>

---

## Kenapa game ini dibuat

Saya suka game simulasi. Tapi yang bikin penasaran: kenapa belum ada game yang benar-benar menceritakan **evolusi ponsel dari awal sampai sekarang**? Rasanya seru bisa merasakan jadi perusahaan kecil tahun 2000 yang harus bersaing dengan Nokia yang sedang jaya-jayanya, lalu pelan-pelan naik kelas sambil melihat industrinya berubah, dari candybar monokrom sampai ponsel lipat.

Ini proyek fan project, bukan produk komersial. Tidak ada afiliasi dengan Nokia, Apple, Samsung, atau perusahaan mana pun.

---

## Gameplay

Kamu adalah CEO perusahaan ponsel yang baru berdiri pada 1 Januari 2000. Modal awal terbatas: **$200K / $100K / $50K** untuk tingkat kesulitan Santai / Normal / Sulit.

Tugasmu:

- Merekrut engineer, designer, dan marketer
- Riset teknologi supaya tidak tertinggal
- Membangun OS sendiri, atau melisensi OS pihak ketiga (lebih mahal)
- Mendesain ponsel, memproduksinya (dengan pabrik komponen sendiri kalau mau), merilisnya ke pasar, lalu membaca ulasan dan reaksi publik
- Mengelola uang: gaji, sewa, pajak, pinjaman, deposito, saham, dan investasi pabrik
- Jangan sampai bangkrut. Kas negatif **2 bulan berturut-turut** = game over

Waktu berjalan real-time: **1 hari game = 60 detik**. Bisa dipause atau dipercepat 2x, 5x, atau 10x. Selama kamu bekerja, kompetitor juga bergerak: merilis produk, naik tier riset, dan merebut pangsa pasar. Ada juga **life events historis** yang mengubah permainan. Tahun 2007, iPhone muncul dan Nokia mulai goyah. Kalau kamu di posisi Nokia, apa yang akan kamu lakukan?

Satu musim berakhir saat tanggal game memasuki **2051** (batas `endYear` 2050 di `src/config/endgame.config.js`). Skor akhir dihitung dari milestone, produk di katalog, riset selesai, staf aktif, dan kekayaan bersih.

---

## Isi game

Angka di bawah dihitung langsung dari file data di repo ini (v0.2.2, sudah tercatat di `patches.json`).

### 🧭 Navigasi

Bar bawah: **Home · HQ · Riset · Produk · Pasar · Setelan**.

- **Home** punya sakelar **Kampus | Kantor** (peta 3D kampus atau peta 3D kantor).
- **HQ** punya 6 sub-tab: **Ringkasan, Tim, Bursa, Bank, Investasi, Riwayat**.
- Tampilan desktop punya tata letak sendiri (`desktop.css`), jadi game nyaman dipakai di layar lebar, bukan hanya di HP.

### 🏢 Kampus, Kantor, dan Tim

- **Peta Kampus 3D** di Home: gedung tumbuh dan naik level seiring progres (HQ, Lab R&D, Pabrik Chip, Toko Flagship, Pusat OS, Billboard, Monumen). Gaya bangunan mengikuti era, ada siang dan malam sesuai tema, dan kota ikut beranimasi.
  - **Pulau Manufaktur** terhubung ke kampus lewat jembatan. Truk menyeberang di antara dua pulau, dan kamera bisa digeser ke sana.
- **Office 3D Map** (Home → Kantor): interior kantor isometrik dengan **9 ruangan** yang terhubung ke data game.
  - Staf duduk di meja. Warna menunjukkan peran, dan bola kecil menunjukkan moral.
  - Lab menampilkan riset aktif, rak server menampilkan versi OS dan bug, showroom menampilkan produk yang dijual.
  - Ruangan yang belum memenuhi syarat tampil terkunci.
  - Ketuk ruangan untuk kartu info dan tombol ke panel terkait. Dari kartu itu kamu bisa langsung membangun atau mengupgrade Fab (konstruksinya tumbuh di 3D sesuai progres) dan melatih staf tanpa pindah panel.
  - Ketuk staf untuk kartu detail. Dari kartu itu tersedia tombol "Kelola Tim" dan pelatihan staf.
  - Ruang Work punya tombol **Rekrut** yang langsung membuka mode rekrutmen di panel Tim.
- **Tim**: 3 peran (Engineer, Designer, Marketer), 5 tingkat skill (Junior sampai Principal), 8 trait, dan kandidat dari **9 wilayah** (AS, Eropa, Jepang, Korea, Tiongkok, India, Indonesia, Rusia, Amerika Latin). Maksimal 20 orang per peran. Skill naik seiring waktu, dan moral serta gaji ikut berubah.
  - Dari detail staf ada tombol **Lihat di kantor** yang memindahkan kamu ke peta kantor dan menyorot staf tersebut.
  - Headhunter bisa mengganti seluruh kandidat dengan bayaran dan cooldown. Tawar gaji punya peluang sukses yang bergantung pada trait kandidat.
- **HQ → Ringkasan** (dirancang mobile-first): kartu keuangan utama, metrik 2x2 (reputasi, sentimen, tim, era), aktivitas live, grafik 24 bulan, aksi cepat, lalu sorotan publik dan timeline yang bisa dilipat.

### 🔬 Riset dan OS

- **Tech tree**: **70 node** dalam **8 kategori** (display, kamera, baterai, chip, jaringan, bodi, sensor, audio), dari 2000 sampai 2025. Antrian riset berjalan paralel, dan makin banyak engineer makin banyak slot. Termasuk riset kabel USB Tipe-C.
- **OS sendiri**: **35 fitur OS** dalam **5 era** (Firmware Dasar, Era Layar Sentuh, Smartphone Modern, AI & Ekosistem, AI On-Device). Ada versi OS, bug acak (**45 template** bug, lengkap dengan patch), **7 aplikasi bawaan**, dan ekosistem aplikasi pihak ketiga.
- **Lisensi OS**: **5 paket** kalau kamu tidak mau membangun OS sendiri.
- **Fitur ponsel**: **59 fitur** dalam 10 grup (konektivitas, keamanan, audio, kamera tambahan, daya tahan, daya, sensor, UX, penyimpanan, AI).

### 📱 Produk dan Penjualan

- **Wizard desain ponsel** dengan preview real-time. Ada **127 komponen** dalam **10 kategori** (display, kamera, baterai, chip, RAM, jaringan, bodi, sensor, audio, bentuk) dan **8 warna bodi**. Pilihan mengikuti tahun, jadi tidak ada layar OLED di tahun 2001. RAM bersifat opsional (default "RAM Standar", tanpa biaya).
- **Mockup ponsel 3 tampilan**: depan, belakang, dan **kemasan retail** (kotak yang mengikuti era, lengkap dengan isi kotak seperti kabel, charger, dan earphone). Tampak belakang menampilkan lencana **Internal** untuk komponen dari pabrikmu sendiri.
- **Pengembangan 4 fase**: Desain → Prototipe → Produksi → Rilis.
- **Rumus permintaan yang transparan**: kualitas × harga × reputasi × pemasaran × OS × tren × kompetitor × lifecycle × kondisi makro.
- **Lifecycle produk**: naik → puncak → turun → mati. Ada stok gudang, restock otomatis, dan maksimal **5 produk aktif**.
- **Pemasaran**: **5 jenis kampanye** (Iklan Online, Sponsor Event, Peluncuran Produk, Billboard Kota, Kampanye Influencer).
- **Promosi**: **18 paket**: 12 paket regional (Global, Asia, Eropa, Amerika & Lainnya, masing-masing 3 paket) dan 6 paket per segmen konsumen. Ada **12 event musiman** seperti Imlek, 618, Singles Day 11.11, Golden Week/Diwali, Karnaval, Back to School, Summer Sales, Black Friday, dan Natal. Maksimal 3 kampanye promosi aktif per produk.
- **Navigasi Pasar**: pasar dibaca per **8 segmen konsumen** (value, mainstream, premium, gamer, creator, pro, youth, senior) dan **8 sub-wilayah**. Ada **16 gelombang tren** ditambah 4 tren tambahan, dan faktor ini ikut masuk ke rumus permintaan. Tab **Pasar** menampilkan kartu Peluang Terbaik, Segmen, Sub-Wilayah, Gelombang Tren, Reaksi per segmen, dan Riwayat Viral. Datanya juga bisa dibaca lewat `window.__game.marketNav`.

### 🧠 Chip, Fab, dan Manufaktur

- **Riset chip**: **52 node** dalam **6 kategori** (desain, arsitektur, proses, grafis, daya, bisnis).
- **Desain chip sendiri**: **8 arsitektur**, **14 process node**, dan **24 fitur chip** dalam 7 kategori.
- **Fab** dengan 4 tingkat, dari Small Fab (5.000 chip/bulan, biaya $5 juta) sampai Mega Fab (5 juta chip/bulan, biaya $600 juta). Ada waktu bangun, upgrade, antrian produksi, dan yield.
- **Pabrik komponen** (panel Manufaktur): **5 jenis pabrik** (Baterai, Layar, SoC, Kamera, RAM) dengan 4 level. Tiap level memberi diskon harga, kapasitas, yield, dan bonus spesifikasi (misalnya SoC menambah performa, Kamera menambah kualitas foto). SoC dan RAM butuh Fab.
  - Stok pabrik dipakai saat rilis dan restok. Kekurangan dibeli dengan harga pasar.
  - Ada **biaya perawatan** bulanan dan **pajak infrastruktur** 0,2% per bulan dari modal terpasang.
  - Stok surplus bisa **dijual grosir** (harga pasar × 0,92, kuota bulanan 40% kapasitas). Pabrik level rendah bisa rugi di grosir, level tinggi untung.

### 🌍 Kompetitor dan Pasar

- **26 perusahaan** dengan kepribadian (dominant, aggressive, premium, follower, innovator, declining). Contoh: Nokia, Motorola, Sony Ericsson, Siemens, Palm, BlackBerry, Samsung, LG, HTC, Apple, Android, Huawei, Oppo, Vivo, Microsoft Lumia, Honor, OnePlus, Nothing, Asus, Sony Mobile, Realme, Meizu, Lenovo, Tecno, ZTE, dan Xiaomi.
  - Setiap perusahaan punya tahun aktif, pangsa pasar historis per tahun, produk ikonik, milestone, dan life events.
  - Ada penanda tingkat faktualitas dan catatan sumber, supaya jelas mana yang fakta dan mana yang disederhanakan.
- **Mode nama**: pakai nama asli atau nama parodi fiktif (misalnya "Nokio", "Apel", "Samsul").
- **Aksi dinamis kompetitor**: mereka bisa agresif, menekan harga, atau melemah, tergantung kepribadian dan tingkat kesulitan.
- **Pangsa pasar** dihitung bulanan dengan riwayat 24 bulan. Model makro (GDP, inflasi, suku bunga, 2000–2026) memengaruhi permintaan.
- **Opini publik**: sentimen per **11 aspek** (desain, kamera, baterai, performa, harga, keandalan, OS, support, layar, konektivitas, kemudahan pakai), feed ulasan yang makin beragam dari era ke era, dan **26 viral event** yang bisa kamu tanggapi (minta maaf, recall, klarifikasi, atau diabaikan; "Abaikan" hanya bisa sekali per event). Efek viral memengaruhi penjualan harian.
- **Berita**: headline otomatis dari **20 media**, dengan jurnalis dan dateline per negara. Ada **72 headline bulanan** dan template berita yang menyoroti rilis produk, milestone, dan kejadian industri.

### 💰 Keuangan

- **Ekonomi**: gaji, sewa, pajak (12% / 15% / 20% sesuai kesulitan), peringatan burn-rate, dan riwayat kas.
- **Penahan ekonomi** (supaya kas tidak menumpuk tanpa batas):
  - Biaya komponen naik seiring volume produksi (maksimal ×2,2).
  - Permintaan dibatasi plafon pasar yang bergantung pada kesulitan.
  - Tekanan kompetitor naik saat utilisasi tinggi.
  - Tempat membelanjakan kas di **HQ → Investasi**: Investasi Pabrik (L1–L5, melandaikan kurva biaya) dan **akuisisi merek rival** (mulai 2003, maksimal 5, jeda 6 bulan).
- **Bank**: **3 bank** (Global, Asia, Euro), pinjaman dengan bunga dan tenor, deposito fleksibel dan berjangka, dan **credit rating 8 tingkat (AAA sampai D)**. Telat bayar kena denda dan bisa memblokir akses pinjaman.
- **Bursa saham** (HQ → Bursa): **84 saham** dalam **12 kategori** (Ponsel, Chip, Software, Media Sosial, Streaming, E-commerce, Keuangan, Energi & Tambang, Konsumen, Telekomunikasi, Lainnya, dan Perusahaanmu), **9 indeks** (NASDAQ, Dow, S&P 500, IHSG, Nikkei, FTSE, DAX, Hang Seng, KOSPI), dan **5 mata uang** (USD, KRW, TWD, HKD, IDR) dengan kurs historis.
  - Daftar emiten mengikuti tahun game: tahun 2000 ada 42 emiten aktif, tahun 2026 ada 77. Kategori seperti Media Sosial dan Streaming baru terisi setelah perusahaannya ada di dunia nyata.
  - **Aksi beli dan jual kamu menggerakkan harga.** Satu transaksi maksimal menggeser harga 3%, dampaknya meluruh tiap bulan, dan emiten besar (tier mega) lebih sulit digeser.
  - Harga di antara dua tahun data diinterpolasi, dan setelah tahun data terakhir harga diproyeksikan.
  - Tiap emiten punya penanda kepercayaan data (`verified`, `trend`, `fictional`).

### 🎯 Bantuan dan Progres

- **Asisten Bisnis** berbasis aturan: saran berurutan dari kritis sampai info, bisa ditunda, dan tanya-jawab lokal. Asisten juga memberi tahu kalau ada patch baru. Titik sambung ke AI sudah disiapkan.
- **Tutorial** 8 langkah, **quest** pemula, tips kontekstual, dan log serta milestone.
- **Panduan** dan panel **Timeline** sejarah (17 ponsel ikonik, 12 tonggak OS).
- **Level pemain** (1–50), **level perusahaan**, dan **kredibilitas** (reputasi, skor kredit, sentimen, integritas bayar). Level dan skor leaderboard dihitung di server. Naik level dan mencapai tingkat kredibilitas tertentu memberi hadiah yang diklaim lewat Pesan.

### 🎨 Tampilan dan Bahasa

- **Era-aware visual**: **7 era desain** (LCD Monokrom → TFT Warna → Revolusi Touchscreen → Smartphone Matang → Premium & Bezel-less → AI & Notch → Foldable & Ultra). Mockup ponsel, layar, dan notifikasi berubah per era.
- **Tema** gelap dan terang, dengan **6 warna aksen** (blue, emerald, violet, amber, rose, cyan).
- **12 bahasa**: English, Bahasa Indonesia, Mandarin (Sederhana), Korea, Jepang, Prancis, Jerman, Spanyol, Italia, Rusia, Polandia, dan Hindi. Bisa diganti kapan saja di Setelan.
  - **Indonesia dan English penuh**, masing-masing sekitar **2.700 kunci** (gabungan kamus utama dan kamus per fitur).
  - **10 bahasa lain** memakai kamus inti (sekitar 235 kunci) dan **kembali ke English** untuk teks yang belum diterjemahkan.
  - Nama dan deskripsi komponen ponsel masih dalam bahasa Indonesia (rencana terjemahan ada di roadmap).
- **Audio** tap sound sintetis (Web Audio API), plus getar di perangkat yang mendukung.
- **Mode hemat** otomatis di HP kelas bawah (RAM, CPU, Data Saver, dan baterai dideteksi saat start). Bisa dipaksa lewat `?perf=lite`, `?perf=full`, atau `?perf=auto`. Loop waktu game berhenti total saat tab tersembunyi, dan loop 3D tidak lagi bangun di setiap vsync.
- **Loading screen** mengikuti bahasa: sampul versi Indonesia (`assets/img/loading-id.webp`) atau English (`assets/img/loading-en.webp`), dipilih sebelum halaman digambar. Persen di bawah gambar adalah progres nyata (modul JS yang terunduh + tahap boot). Kalau gambar gagal dimuat, dipakai `assets/img/loading-screen.jpg`. Bahasa lain memakai sampul English.
- Layout mobile-first, dengan swipe antar sub-tab. Game juga bisa dipasang sebagai **PWA** (`manifest.webmanifest`), dan APK Android hanya pembungkus (WebAPK) dari versi web.

### ☁️ Cloud, Akun, dan Save

- **Save lokal** otomatis (dijalankan saat browser idle), plus export dan import file save.
- **Cloud save** lewat Supabase: login, **1 slot** (menyimpan save terbaru), profil pemain (nama tampil dan avatar), pengecekan nama perusahaan yang unik, dan leaderboard.
- **Profil Pemain**: **ID Pemain** (8 digit) tampil di panel Profil Pemain dan **bisa dilihat pemain lain**. Jangan anggap ID ini rahasia. Setelan kini hanya berisi pengaturan, terpisah dari profil.
- **Pesan**: inbox untuk notifikasi sistem dan hadiah, pesan antar pemain (dengan blokir), dan kirim SIL antar pemain (maksimal 5.000 SIL per 24 jam).
- **Dompet Universal**: uang ($) dan Silicon (SIL) bisa dipakai untuk hampir semua hal. Biaya dalam uang boleh ditutup dengan SIL, dan sebaliknya. Kurs mengikuti inflasi (tahun 2000: 1 SIL = $2.500). SIL tidak pernah dicetak dari uang. Mode bayar (Otomatis, Uang dulu, SIL dulu, Terpisah) dan Dana Darurat SIL ada di Setelan → Keuangan.
- **Silicon (SIL)**: mata uang premium untuk mempercepat waktu dan riset, dengan bonus login harian dan reward quest.
  - **Top-up sedang ditutup sementara.** Tab Beli dan panel pembayaran di game dikunci lewat flag `TOPUP_LOCKED` di `src/ui/panels/SiliconStorePanel.js`, dan halaman landing (`web.html`) mengikutinya. Saldo, bonus harian, reward, dan penggunaan SIL tetap berjalan.
  - Saat dibuka, top-up masih manual (GoPay/QRIS) dan disetujui admin lewat panel `/fsociety`. Provider pembayaran otomatis belum terhubung.
  - Penguncian saat ini hanya di sisi klien. Detailnya ada di Known issues dan [`SECURITY.md`](SECURITY.md).
- **Keamanan**: save diberi tanda tangan integritas (penghalang edit manual, bukan enkripsi). Saldo SIL dan ledger dijaga di server lewat Row Level Security dan fungsi yang hanya bisa dipanggil server. Kebijakan keamanan lengkap dan cara melapor ada di [`SECURITY.md`](SECURITY.md).

### ⚠️ Known issues

- **Leaderboard sebagian divalidasi server.** Statistik masih dikirim dari perangkat pemain. Server membatasi frekuensi sinkron, memeriksa invarian, dan menyembunyikan profil yang mencurigakan (`supabase/11`), serta menghitung level dan skor sendiri (`supabase/12` dan `15`). Nilai yang masih di dalam batas wajar tetap bisa dipalsukan, jadi belum bisa dianggap peringkat resmi.
- **Penguncian top-up hanya di klien.** Fungsi server `create_payment_order` tetap bisa dipanggil akun yang login lewat API langsung. Pesanan tetap `pending` sampai admin menyetujui, tetapi kalau top-up memang harus tertutup total, tambahkan flag di server.
- **Teks mentah di beberapa tempat.** Empat kunci terjemahan dipakai tanpa teks cadangan dan belum ada di kamus: `main.toast.fab_unlocked`, `wiz.warn.volume_cost`, `wiz.preview.unit_design`, `wiz.preview.unit_parts`. Selain itu ada 38 kunci baru (misalnya `team.recruit.*`, `team.nego.*`, `silstore.locked.*`) yang masih memakai teks cadangan dan belum digabung ke `src/data/i18n/en.js` dan `id.js`.
- **`supabase/BACA-DULU.md` belum lengkap.** Tabelnya sudah memuat 01–09, 14, dan 15, tetapi file 10 (dua file), 11, 12, dan 13 belum tercantum. Selain itu, ia menyebut `functions/advisor-chat/` padahal foldernya `supabase/function/advisor-chat/` (sudah diperbaiki di 0.2.2).
- **Tukar SIL → uang** memerlukan `supabase/10-tukar-sil.sql`. Tanpa file ini, pemanggilan gagal dan SIL tidak terpotong.
- **Edge Function Asisten Bisnis (AI)** belum punya rate limit per pengguna dan CORS-nya terbuka (`*`). Jangan diaktifkan untuk publik luas sebelum itu ditambahkan. Detail di `SECURITY.md`.
- **Catatan rilis belum lengkap.** `patches.json` sekarang memuat 0.2.2 (dan 0.2.1). Beberapa entri di bagian Versi di bawah belum dipindahkan ke `patches.json`.
- **Screenshot di landing page** (`assets/img/landing/`) perlu diambil ulang. Gambar HQ masih menampilkan tab Kantor dan tata letak Ringkasan yang lama.
- **Gate admin di sisi klien hanya kosmetik.** Admin yang sebenarnya diverifikasi di server lewat `is_admin()`.
- **Office 3D Map** belum menampilkan dampak rekrut dan bonus trait dari `TeamSystem`. Ringkasan di peta masih dihitung sendiri.

---

## Cara main

Buka https://www.smartphone-empire.my.id/ (atau https://jurkonstudio.github.io/smartphone-empire/) di HP atau desktop. Butuh koneksi internet untuk load pertama, karena library 3D dan cloud dimuat dari CDN. Halaman perkenalan game ada di `web.html`.

### Jalankan di lokal

Karena memakai ES Modules, kamu butuh server lokal (browser memblokir `file://`):

```bash
python3 -m http.server 8000
# atau
npx serve .
```

Lalu buka `http://localhost:8000`. Tidak ada langkah build dan tidak ada `npm install`.

---

## Teknologi

- **JavaScript murni (ES Modules)**, HTML, dan CSS. Tanpa framework dan tanpa bundler.
- **Three.js 0.160.0** (versi dipin, dimuat lazy dari CDN) untuk Peta Kampus, Office 3D Map, dan peta Manufaktur. Kalau WebGL atau CDN gagal, game tetap jalan dengan tampilan cadangan.
- **Supabase** (`supabase-js` 2.49.4 dari CDN) untuk auth, cloud save, profil, pesan, dan storage avatar.
- Komunikasi antar sistem lewat **event bus** (`src/core/EventBus.js`). Daftar event ada di `src/config/event.md`.
- Ukuran kode: **286 file JS** dengan sekitar **79 ribu baris** di `src/`.
- Belum ada test otomatis resmi, linter, atau `package.json`. Folder `tools/` berisi 12 skrip uji manual (Node, ES Modules) untuk kalibrasi, simulasi permintaan, penahan ekonomi, promosi, dan render panel; skrip ini tidak dimuat game. Contoh: `node --experimental-default-type=module tools/sim.mjs src`.

### Struktur folder

```
smartphone-empire/
├─ index.html           game utama (+ style.css · density.css · profile-ui.css · desktop.css)
├─ web.html             landing page (ID/EN, login, status akun, dan halaman Silicon)
├─ Welcome.html · campus-verify.html   halaman pendukung
├─ 031411/              panel admin (dashboard data pemain, persetujuan SIL), noindex
├─ supabase/            skema SQL 01–15, Edge Function Asisten (function/), panduan (BACA-DULU.md)
├─ tools/               skrip uji manual (bukan bagian game)
├─ _diff/               diff perubahan lama untuk referensi
├─ assets/              ikon, audio, gambar (loading screen per bahasa, img/landing = screenshot landing)
├─ patches.json         catatan rilis yang dibaca Asisten Bisnis
├─ manifest.webmanifest · CNAME · .nojekyll   PWA dan hosting GitHub Pages
├─ CHANGES*.md · PERF-CHANGES.md · econ-brakes.patch   catatan perubahan per paket update
└─ src/
   ├─ main.js           boot, routing tab, binding event
   ├─ config/           konstanta, waktu, endgame, dev flag, dokumentasi event
   ├─ core/             state, waktu, save, event bus, tema, bahasa, audio, integritas, model makro
   ├─ data/             data murni: riset, OS, komponen, kompetitor, saham, bank, berita, i18n/
   ├─ systems/          logika game: riset, OS, produk, pasar, tim, bank, saham, fab, chip, berita, advisor, penahan ekonomi
   ├─ services/         cloud (Supabase), i18n cloud
   ├─ diagnostics/      laporan diagnostik untuk debug
   └─ ui/               panel, layout, modal, chart, ikon, avatar, sosial, peta kampus (campus/), kantor (office/), manufaktur (manufacture/)
```

Data dipisah dari logika. Untuk menambah komponen, saham, kompetitor, atau headline, cukup ubah file di `src/data/`.

---

## Setup Supabase (cloud save, SIL, dan panel admin)

Game bisa jalan tanpa Supabase, tapi cloud save, SIL, dan panel admin membutuhkannya. Jalankan file di `supabase/` **berurutan** lewat SQL Editor (lihat `supabase/BACA-DULU.md`):

- **Wajib:** `01` → `05`, lalu `08` (ganti email di `08-jadikan-admin.sql` dulu), `14` setelah `03` (nama perusahaan unik di jalur save), dan `15` setelah `12` (level perusahaan di server).
- **Opsional:** `06`–`07` (panel admin lengkap), `09` (pesan pemain), `10-pesan-antar-pemain` dan `10-tukar-sil` (pesan antar pemain dan tukar SIL), `11` (validasi leaderboard), `12` (level kredibilitas dan reward), `13` (diagnosa leaderboard, hanya untuk pengecekan), `15b` (uji paritas rumus level, hanya baca).
- **Catatan urutan:** `12` butuh `09`, `10`, dan `11`, sedangkan `15` butuh `12`. Kalau mau memakai level dan reward, jalankan rantai itu lengkap.
- **Opsional, AI:** `function/advisor-chat/` (Edge Function Asisten Bisnis). Butuh secret `ANTHROPIC_API_KEY` di Supabase, bukan di kode klien.
- URL dan *publishable key* Supabase di `src/services/cloud/supabase.config.js` memang boleh publik. Kalau kamu menjalankan proyek sendiri, ganti keduanya dengan milik proyekmu. Jangan pernah menaruh `service_role` key di repo.

Semua file aman dijalankan ulang. Proyek lama cukup menjalankan file yang belum pernah dijalankan dengan urutan yang sama.

> Catatan: `BACA-DULU.md` belum memuat file 10–13. Jalankan secara manual sesuai fiturnya, setelah 01–09.

---

## Yang belum kelar

Proyek ini masih berjalan. Catatan roadmap:

- ✅ **Office 3D Map tahap 3**: bangun atau upgrade Fab dan latih staf langsung dari peta, konstruksi Fab 3D, aktivitas staf yang lebih hidup, dan tampilan yang lebih rapi di HP
- ✅ **Integrasi Office ↔ Tim**: dari kartu staf di peta bisa membuka detail staf, dari detail staf bisa melihat staf di kantor, dan ruang Work punya jalan pintas ke rekrutmen
- ✅ **Navigasi Pasar** (data, permintaan, opini, promosi Amerika & Lainnya, promosi per segmen, dan panel UI di tab Pasar)
- ✅ **Manufaktur**: pabrik komponen (Baterai, Layar, SoC, Kamera, RAM), jual grosir, pajak infrastruktur, dan jembatan Kampus ↔ Pulau Manufaktur
- ✅ **Penahan ekonomi dan tab Investasi**
- ✅ **Bursa saham v2**: dampak transaksi pemain, lebih banyak emiten dan indeks dunia/IDX, tier emiten
- ✅ **Kemasan retail di mockup** dan riset USB Tipe-C
- ✅ **12 bahasa** (Indonesia dan English penuh, 10 lainnya kamus inti)
- ✅ **Level pemain dan perusahaan di server**, Pesan, dan hadiah
- ⏳ **Perbaikan terjemahan (i18n)**: ganti sisa teks hardcoded dengan kunci, gabungkan kunci baru ke `en.js` dan `id.js`, lalu terjemahkan nama dan deskripsi 127 komponen
- ⏳ **Peta kantor membaca TeamSystem**: dampak rekrut, bonus trait, dan ringkasan tim dihitung dari satu sumber
- ⏳ **Event acak dengan pilihan**, transisi layar per era, dan polish UI
- ⏳ **Patch UI Evolution**: tampilan notifikasi berubah per era (monokrom → glossy → flat → Dynamic Island)
- ⏳ **Berita bilingual**: headline versi English sudah ada, sebagian template ulasan masih Indonesia
- ⏳ **Pembayaran Silicon**: membuka kembali top-up dengan provider pembayaran produksi dan verifikasi server (termasuk penguncian di server)
- ⏳ **Perbaikan known issues** di atas

---

## Versi

Versi terbaru yang tercatat: **0.2.2** (23 Oktober 2026). Daftar perubahan resmi ada di `patches.json` dan `PERF-CHANGES.md`.

Perubahan yang sudah ada di kode tetapi belum masuk `patches.json`:
- Navigasi Pasar (segmen, sub-wilayah, gelombang tren, 11 aspek opini, 26 viral event, promosi Amerika & Lainnya dan per segmen, panel UI di tab Pasar).
- Integrasi peta kantor dengan panel Tim (deep-link staf, tombol Lihat di kantor, jalan pintas Rekrut dari ruang Work).
- Manufaktur, penahan ekonomi, tab Investasi, dan jembatan Kampus ↔ Pulau Manufaktur.
- Bursa saham v2 (dampak transaksi, emiten dan indeks baru).
- Mockup kemasan retail dan riset USB Tipe-C.
- 12 bahasa dan perbaikan teks mentah.
- Perombakan HQ → Ringkasan, tab Kantor dipindah ke sakelar di Home, dan ID Pemain dipindah ke Profil Pemain.
- Top-up Silicon ditutup sementara.
- Loading screen per bahasa (Indonesia dan English).

---

## Kontribusi dan laporan bug

Bug atau saran? Buka [issue](https://github.com/jurkonstudio/smartphone-empire/issues). Kalau menemukan celah keamanan, **jangan** buka issue publik. Ikuti cara pelaporan privat di [`SECURITY.md`](SECURITY.md).

Nama dan merek perusahaan dalam game dipakai untuk tujuan edukasi dan hiburan. Hak ciptanya milik masing-masing pemiliknya. Data historis disederhanakan untuk kebutuhan gameplay.
