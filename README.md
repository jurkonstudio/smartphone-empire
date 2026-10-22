<div align="center">

# JURKON STUDIO

### Smartphone Empire

**Bangun perusahaan ponsel dari nol. Mulai 1 Januari 2000, lawan Nokia, Apple, Samsung, dan 22 kompetitor lain, sampai era AI dan foldable.**

Dibuat oleh **Kalfin Agus Setiawan** di bawah bendera **Jurkon Studio**.

[🎮 Coba Game](https://jurkonstudio.github.io/smartphone-empire/) · [🐛 Laporkan Bug](https://github.com/jurkonstudio/smartphone-empire/issues)

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
- Mendesain ponsel, merilisnya ke pasar, lalu membaca ulasan dan reaksi publik
- Mengelola uang: gaji, sewa, pajak, pinjaman, deposito, sampai saham
- Jangan sampai bangkrut. Kas negatif **2 bulan berturut-turut** = game over

Waktu berjalan real-time: **1 hari game = 60 detik**. Bisa dipause atau dipercepat 2x, 5x, atau 10x. Selama kamu bekerja, kompetitor juga bergerak: merilis produk, naik tier riset, dan merebut pangsa pasar. Ada juga **life events historis** yang mengubah permainan. Tahun 2007, iPhone muncul dan Nokia mulai goyah. Kalau kamu di posisi Nokia, apa yang akan kamu lakukan?

---

## Isi game

Angka di bawah dihitung dari file data di repo ini (v0.2.1).

### 🏢 Kampus, Kantor, dan Tim

- **Peta Kampus 3D** di Home: gedung tumbuh dan naik level seiring progres (HQ, Lab R&D, Pabrik Chip, Toko Flagship, Pusat OS, Billboard, Monumen). Gaya bangunan mengikuti era, ada siang dan malam sesuai tema, dan kota ikut beranimasi.
- **Office 3D Map** di HQ → Kantor: interior kantor isometrik dengan **9 ruangan** yang terhubung ke data game.
  - Staf duduk di meja. Warna menunjukkan peran, dan bola kecil menunjukkan moral.
  - Lab menampilkan riset aktif, rak server menampilkan versi OS dan bug, showroom menampilkan produk yang dijual.
  - Ruangan yang belum memenuhi syarat tampil terkunci.
  - Ketuk ruangan untuk kartu info dan tombol ke panel terkait. Dari kartu itu kamu bisa langsung membangun atau mengupgrade Fab (konstruksinya tumbuh di 3D sesuai progres) dan melatih staf tanpa pindah panel.
  - Ketuk staf untuk kartu detail. Dari kartu itu tersedia tombol "Kelola Tim" dan pelatihan staf.
  - Ruang Work punya tombol **Rekrut** yang langsung membuka mode rekrutmen di panel Team.
- **Tim**: 3 peran (Engineer, Designer, Marketer), 5 tingkat skill (Junior sampai Principal), 8 trait, dan kandidat dari 7 negara. Maksimal 20 orang per peran. Skill naik seiring waktu, dan moral serta gaji ikut berubah.
  - Dari detail staf ada tombol **Lihat di kantor** yang memindahkan kamu ke peta kantor dan menyorot staf tersebut.
  - Headhunter bisa mengganti seluruh kandidat dengan bayaran dan cooldown. Tawar gaji punya peluang sukses yang bergantung pada trait kandidat.

### 🔬 Riset dan OS

- **Tech tree**: **70 node** dalam **8 kategori** (display, kamera, baterai, chip, jaringan, bodi, sensor, audio), dari 2000 sampai 2025. Antrian riset berjalan paralel, dan makin banyak engineer makin banyak slot.
- **OS sendiri**: **35 fitur OS** dalam **5 era** (Firmware Dasar, Era Layar Sentuh, Smartphone Modern, AI & Ekosistem, AI On-Device). Ada versi OS, bug acak (**45 template** bug, lengkap dengan patch), **7 aplikasi bawaan**, dan ekosistem aplikasi pihak ketiga.
- **Lisensi OS**: **5 paket** kalau kamu tidak mau membangun OS sendiri.
- **Fitur ponsel**: **59 fitur** dalam 10 grup (konektivitas, keamanan, audio, kamera tambahan, daya tahan, daya, sensor, UX, penyimpanan, AI).

### 📱 Produk dan Penjualan

- **Wizard desain ponsel** dengan preview real-time. Ada **117 komponen** dalam **9 kategori** (display, kamera, baterai, chip, jaringan, bodi, sensor, audio, bentuk) dan **8 warna bodi**. Pilihan mengikuti tahun, jadi tidak ada layar OLED di tahun 2001.
- **Pengembangan 4 fase**: Desain → Prototipe → Produksi → Rilis.
- **Rumus permintaan yang transparan**: kualitas × harga × reputasi × pemasaran × OS × tren × kompetitor × lifecycle × kondisi makro.
- **Lifecycle produk**: naik → puncak → turun → mati. Ada stok gudang, restock otomatis, dan maksimal **5 produk aktif**.
- **Pemasaran**: **5 jenis kampanye** (Iklan Online, Sponsor Event, Peluncuran Produk, Billboard Kota, Kampanye Influencer).
- **Promosi**: **18 paket**: 12 paket regional (Global, Asia, Eropa, Amerika & Lainnya, masing-masing 3 paket) dan 6 paket per segmen konsumen. Ada **8 event musiman** seperti Imlek, 618, Singles Day 11.11, Summer Sales, Black Friday, dan Natal.
- **Navigasi Pasar**: pasar dibaca per **8 segmen konsumen** (value, mainstream, premium, gamer, creator, pro, youth, senior) dan **8 sub-wilayah**. Ada **16 gelombang tren** ditambah 4 tren tambahan, dan faktor ini ikut masuk ke rumus permintaan. Datanya bisa dibaca lewat `window.__game.marketNav`. Panel kartu segmen/wilayah/peluang di `MarketPanel` masih dalam pengerjaan.

### 🧠 Chip dan Fab

- **Riset chip**: **52 node** dalam **6 kategori** (desain, arsitektur, proses, grafis, daya, bisnis).
- **Desain chip sendiri**: **8 arsitektur**, **14 process node**, dan **24 fitur chip** dalam 7 kategori.
- **Fab** dengan 4 tingkat, dari Small Fab (5.000 chip/bulan, biaya $5 juta) sampai Mega Fab (5 juta chip/bulan, biaya $600 juta). Ada waktu bangun, upgrade, antrian produksi, dan yield.
- **Pabrik komponen** (material plant) menurunkan biaya komponen seiring level pabrik.

### 🌍 Kompetitor dan Pasar

- **26 perusahaan** dengan kepribadian (dominant, aggressive, premium, follower, innovator, declining). Contoh: Nokia, Motorola, Sony Ericsson, Siemens, Palm, BlackBerry, Samsung, LG, HTC, Apple, Android, Huawei, Oppo, Vivo, Microsoft Lumia, Honor, OnePlus, Nothing, Asus, Sony Mobile, Realme, Meizu, Lenovo, Tecno, ZTE, dan Xiaomi.
  - Setiap perusahaan punya tahun aktif, pangsa pasar historis per tahun, produk ikonik, milestone, dan life events.
  - Ada penanda tingkat faktualitas dan catatan sumber, supaya jelas mana yang fakta dan mana yang disederhanakan.
- **Mode nama**: pakai nama asli atau nama parodi fiktif (misalnya "Nokio", "Apel", "Samsul").
- **Aksi dinamis kompetitor**: mereka bisa agresif, menekan harga, atau melemah, tergantung kepribadian dan tingkat kesulitan.
- **Pangsa pasar** dihitung bulanan dengan riwayat 24 bulan. Model makro (GDP, inflasi, suku bunga, 2000–2026) memengaruhi permintaan.
- **Opini publik**: sentimen per **11 aspek** (desain, kamera, baterai, performa, harga, keandalan, OS, support, layar, konektivitas, kemudahan pakai), feed ulasan, dan **26 viral event** yang bisa kamu tanggapi (minta maaf, recall, klarifikasi, atau diabaikan; "Abaikan" hanya bisa sekali per event). Efek viral kini benar-benar memengaruhi penjualan harian.
- **Berita**: headline otomatis dari **20 media**, dengan jurnalis dan dateline per negara. Ada **72 headline bulanan** dan template berita yang menyoroti rilis produk, milestone, dan kejadian industri.

### 💰 Keuangan

- **Ekonomi**: gaji, sewa, pajak (12% / 15% / 20% sesuai kesulitan), peringatan burn-rate, dan riwayat kas.
- **Bank**: **3 bank** (Global, Asia, Euro), pinjaman dengan bunga dan tenor, deposito fleksibel dan berjangka, dan **credit rating 8 tingkat (AAA sampai D)**. Telat bayar kena denda dan bisa memblokir akses pinjaman.
- **Bursa saham**: **84 saham** dalam **12 kategori**, **9 indeks**, dan **5 mata uang** (USD, KRW, TWD, HKD, IDR) dengan kurs historis. Ada juga saham perusahaanmu sendiri.

### 🎯 Bantuan dan Progres

- **Asisten Bisnis** berbasis aturan: saran berurutan dari kritis sampai info, bisa ditunda, dan tanya-jawab lokal. Asisten juga memberi tahu kalau ada patch baru. Titik sambung ke AI sudah disiapkan.
- **Tutorial** 8 langkah, **quest** pemula, tips kontekstual, dan log serta milestone.
- **Panduan** dan panel **Timeline** sejarah (17 ponsel ikonik, 12 tonggak OS).

### 🎨 Tampilan dan Bahasa

- **Era-aware visual**: **7 era desain** (LCD Monokrom → TFT Warna → Revolusi Touchscreen → Smartphone Matang → Premium & Bezel-less → AI & Notch → Foldable & Ultra). Mockup ponsel, layar, dan notifikasi berubah per era.
- **Tema** gelap dan terang, dengan **6 warna aksen** (blue, emerald, violet, amber, rose, cyan).
- **Dua bahasa penuh**: Indonesia dan English, bisa diganti kapan saja di Setelan. Kamus berisi sekitar 615 kunci per bahasa.
- **Audio** tap sound sintetis (Web Audio API), plus getar di perangkat yang mendukung.
- **Mode hemat** otomatis di HP kelas bawah (RAM, CPU, Data Saver, dan baterai dideteksi saat start). Bisa dipaksa lewat `?perf=lite`, `?perf=full`, atau `?perf=auto`.
- **Loading screen acak**: tiap web dibuka, salah satu dari 3 gambar sampul tampil (versi Inggris berwarna, versi Indonesia abu-abu, dan varian berwarna lain), tidak pernah sama dua kali berturut-turut. Persen di bawah gambar adalah progres nyata (modul JS yang terunduh + tahap boot). Gambar ada di `assets/img/loading/`, dan menambah gambar baru cukup menambah satu baris di daftar `SCREENS` pada `index.html`. Kalau gambar gagal dimuat, dipakai `assets/img/loading-screen.jpg`.
- Layout mobile-first, dengan swipe antar sub-tab.

### ☁️ Cloud, Akun, dan Save

- **Save lokal** otomatis, plus export dan import file save.
- **Cloud save** lewat Supabase: login, **1 slot** (menyimpan save terbaru), profil pemain (nama tampil dan avatar), pengecekan nama perusahaan yang unik, dan leaderboard.
- **Dompet Universal**: uang ($) dan Silicon (SIL) bisa dipakai untuk hampir semua hal. Biaya dalam uang boleh ditutup dengan SIL, dan sebaliknya. Kurs mengikuti inflasi (tahun 2000: 1 SIL = $2.500). SIL tidak pernah dicetak dari uang. Mode bayar (Otomatis, Uang dulu, SIL dulu, Terpisah) dan Dana Darurat SIL ada di Setelan → Keuangan.
- **Silicon (SIL)**: mata uang premium untuk mempercepat waktu dan riset, dengan bonus login harian dan reward quest. Top-up saat ini manual (GoPay/QRIS) dan disetujui admin lewat panel `/fsociety`. Provider pembayaran otomatis belum terhubung.
- **Keamanan**: save diberi tanda tangan integritas (penghalang edit manual, bukan enkripsi). Saldo SIL dan ledger dijaga di server lewat Row Level Security dan fungsi yang hanya bisa dipanggil server. Kebijakan keamanan lengkap dan cara melapor ada di [`SECURITY.md`](SECURITY.md).

### ⚠️ Known issues

- **Statistik leaderboard dilaporkan klien.** Angka seperti pendapatan dan kas dikirim dari perangkat pemain, sehingga belum bisa dianggap peringkat resmi. Rencana validasi ada di `supabase/11-validasi-leaderboard.sql`, tetapi belum terhubung penuh.
- **`supabase/BACA-DULU.md` belum lengkap.** Tabelnya hanya memuat 01–09 dan 14, sementara file 10 (dua file), 11, 12, dan 13 belum tercantum. Selain itu, ia menyebut `functions/advisor-chat/` padahal foldernya `supabase/function/advisor-chat/`.
- **Tukar SIL → uang** memerlukan `supabase/10-tukar-sil.sql`. Tanpa file ini, pemanggilan gagal dan SIL tidak terpotong.
- **Edge Function Asisten Bisnis (AI)** belum punya rate limit per pengguna dan CORS-nya terbuka (`*`). Jangan diaktifkan untuk publik luas sebelum itu ditambahkan. Detail di `SECURITY.md`.
- **Catatan rilis belum lengkap.** `patches.json` baru memuat 0.2.1 (Asisten Bisnis). Navigasi Pasar, loading screen acak, dan integrasi peta kantor belum tercatat.
- **Gate admin di sisi klien hanya kosmetik.** Admin yang sebenarnya diverifikasi di server lewat `is_admin()`.
- **Office 3D Map** belum menampilkan dampak rekrut dan bonus trait dari `TeamSystem`. Ringkasan di peta masih dihitung sendiri.

---

## Cara main

Buka https://jurkonstudio.github.io/smartphone-empire/ di HP atau desktop. Butuh koneksi internet untuk load pertama, karena library 3D dan cloud dimuat dari CDN.

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
- **Three.js 0.160.0** (versi dipin, dimuat lazy dari CDN) untuk Peta Kampus dan Office 3D Map. Kalau WebGL atau CDN gagal, game tetap jalan dengan tampilan cadangan.
- **Supabase** (`supabase-js` dari CDN) untuk auth, cloud save, profil, dan storage avatar.
- Komunikasi antar sistem lewat **event bus** (`src/core/EventBus.js`). Daftar event ada di `src/config/event.md`.
- Ukuran kode: **262 file JS** dengan sekitar **72 ribu baris** di `src/`.
- Belum ada test otomatis resmi, linter, atau `package.json`. Folder `tools/` berisi 9 skrip uji manual (Node, ES Modules) untuk kalibrasi, simulasi permintaan, dan render panel; skrip ini tidak dimuat game. Contoh: `node --experimental-default-type=module tools/sim.mjs src`.

### Struktur folder

```
smartphone-empire/
├─ index.html · style.css · density.css · profile-ui.css · desktop.css
├─ 031411/              panel admin (dashboard data pemain, persetujuan SIL), noindex
├─ supabase/            skema SQL 01–14, Edge Function Asisten (function/), panduan (BACA-DULU.md)
├─ tools/               skrip uji manual (bukan bagian game)
├─ _diff/               diff perubahan lama untuk referensi
├─ assets/              ikon, audio, gambar (img/loading = loading screen acak, img/landing)
├─ patches.json         catatan rilis yang dibaca Asisten Bisnis
├─ CHANGES*.md · PERF-CHANGES.md   catatan perubahan per paket update
└─ src/
   ├─ main.js           boot, routing tab, binding event
   ├─ config/           konstanta, waktu, dev flag, dokumentasi event
   ├─ core/             state, waktu, save, event bus, tema, bahasa, audio, integritas
   ├─ data/             data murni: riset, OS, komponen, kompetitor, saham, bank, berita, i18n
   ├─ systems/          logika game: riset, OS, produk, pasar, tim, bank, saham, fab, chip, berita, advisor
   ├─ services/         cloud (Supabase), i18n cloud
   ├─ diagnostics/      laporan diagnostik untuk debug
   └─ ui/               panel, layout, modal, chart, ikon, avatar, peta kampus (campus/), peta kantor (office/)
```

Data dipisah dari logika. Untuk menambah komponen, saham, kompetitor, atau headline, cukup ubah file di `src/data/`.

---

## Setup Supabase (cloud save, SIL, dan panel admin)

Game bisa jalan tanpa Supabase, tapi cloud save, SIL, dan panel admin membutuhkannya. Jalankan file di `supabase/` **berurutan** lewat SQL Editor (lihat `supabase/BACA-DULU.md`):

- **Wajib:** `01` → `05`, lalu `08` (ganti email di `08-jadikan-admin.sql` dulu), dan `14` setelah `03` (nama perusahaan unik di jalur save).
- **Opsional:** `06`–`07` (panel admin lengkap), `09` (pesan pemain), `10-pesan-antar-pemain` dan `10-tukar-sil` (pesan antar pemain dan tukar SIL), `11` (validasi leaderboard), `12` (level kredibilitas dan reward), `13` (diagnosa leaderboard, hanya untuk pengecekan).
- **Opsional, AI:** `function/advisor-chat/` (Edge Function Asisten Bisnis). Butuh secret `ANTHROPIC_API_KEY` di Supabase, bukan di kode klien.
- URL dan *publishable key* Supabase di `src/services/cloud/supabase.config.js` memang boleh publik. Kalau kamu menjalankan proyek sendiri, ganti keduanya dengan milik proyekmu. Jangan pernah menaruh `service_role` key di repo.

Semua file aman dijalankan ulang. Proyek lama cukup menjalankan file yang belum pernah dijalankan dengan urutan yang sama.

> Catatan: `BACA-DULU.md` belum memuat file 10–13. Jalankan secara manual sesuai fiturnya, setelah 01–09.

---

## Yang belum kelar

Proyek ini masih berjalan. Catatan roadmap:

- ✅ **Office 3D Map tahap 3**: bangun atau upgrade Fab dan latih staf langsung dari peta, konstruksi Fab 3D, aktivitas staf yang lebih hidup, dan tampilan yang lebih rapi di HP
- ✅ **Integrasi Office ↔ Tim**: dari kartu staf di peta bisa membuka detail staf, dari detail staf bisa melihat staf di kantor, dan ruang Work punya jalan pintas ke rekrutmen
- ✅ **Navigasi Pasar (data, permintaan, opini, promosi Amerika & Lainnya)**
- ⏳ **Panel UI Navigasi Pasar** (kartu segmen, wilayah, peluang, dan gelombang tren di Pasar)
- ⏳ **Peta kantor membaca TeamSystem**: dampak rekrut, bonus trait, dan ringkasan tim dihitung dari satu sumber
- ⏳ **Event acak dengan pilihan**, transisi layar per era, dan polish UI
- ⏳ **Patch UI Evolution**: tampilan notifikasi berubah per era (monokrom → glossy → flat → Dynamic Island)
- ⏳ **Berita bilingual**: headline versi English sudah ada, sebagian template ulasan masih Indonesia
- ⏳ **Pembayaran Silicon**: menghubungkan provider pembayaran produksi dengan verifikasi server
- ⏳ **Perbaikan known issues** di atas

---

## Versi

Versi terbaru: **0.2.1** (18 Oktober 2026). Daftar perubahan ada di `patches.json` dan `PERF-CHANGES.md`.

Perubahan yang belum masuk `patches.json`:
- Navigasi Pasar (segmen, sub-wilayah, gelombang tren, 11 aspek opini, 26 viral event, promosi Amerika & Lainnya dan per segmen).
- Integrasi peta kantor dengan panel Tim (deep-link staf, tombol Lihat di kantor, jalan pintas Rekrut dari ruang Work).
- Loading screen acak dengan 3 gambar sampul.

---

## Kontribusi dan laporan bug

Bug atau saran? Buka [issue](https://github.com/jurkonstudio/smartphone-empire/issues). Kalau menemukan celah keamanan, **jangan** buka issue publik. Ikuti cara pelaporan privat di [`SECURITY.md`](SECURITY.md).

Nama dan merek perusahaan dalam game dipakai untuk tujuan edukasi dan hiburan. Hak ciptanya milik masing-masing pemiliknya. Data historis disederhanakan untuk kebutuhan gameplay.
