<div align="center">

# JURKON STUDIO

### Smartphone Empire

**Bangun perusahaan ponsel dari nol. Mulai 1 Januari 2000, lawan Nokia, Apple, Samsung, dan 22 kompetitor lain, sampai era AI dan foldable.**

Dibuat oleh **Kalfin Agus Setiawan** di bawah bendera **Jurkon Studio**.

[🎮 Coba Game](https://jurkonstudio.github.io/smartphone-empire/) · [🐛 Laporkan Bug](https://github.com/jurkonstudio/smartphone-empire/issues)

</div>

---

## Kenapa saya bikin game ini

Saya suka game simulasi. Tapi yang bikin saya penasaran: kenapa nggak ada game yang bener-bener nyeritain **evolusi ponsel dari awal sampai sekarang**? Rasanya seru kalau kita bisa ngerasain jadi perusahaan kecil tahun 2000 yang harus bersaing sama Nokia yang lagi jaya-jayanya, terus pelan-pelan naik kelas sambil lihat industri berubah, dari candybar monokrom sampai ponsel lipat.

Jadi saya bikin. Pelan-pelan, sambil belajar, dibantu AI sebagai pair programmer.

Ini proyek fan project. Bukan produk komersial. Nggak ada afiliasi sama Nokia, Apple, Samsung, atau perusahaan manapun.

---

## Gameplay-nya gimana

Kamu jadi CEO perusahaan ponsel yang baru berdiri 1 Januari 2000. Uang awal terbatas (**$200K / $100K / $50K** untuk level Santai / Normal / Sulit). Tugas kamu:

- Rekrut engineer, designer, dan marketer
- Riset teknologi biar nggak ketinggalan zaman
- Bangun OS sendiri (atau lisensi dari pihak ketiga, tapi mahal)
- Desain ponsel, rilis ke pasar, baca ulasan dan reaksi publik
- Kelola uang: gaji, sewa, pajak, pinjaman, deposito, bahkan saham
- Jangan bangkrut. Kas negatif **2 bulan berturut-turut** = game over

Waktu berjalan real-time: **1 hari game = 60 detik**, bisa dipause atau dipercepat 2x / 5x / 10x. Sementara kamu kerja, kompetitor ikut bergerak: rilis produk, naik tier riset, dan makan pangsa pasar. Ada juga **life events historis** yang mengubah permainan. Tahun 2007 iPhone muncul dan Nokia mulai goyah. Kalau kamu di posisi Nokia, apa yang kamu lakuin?

---

## Isi game saat ini

Angka di bawah dihitung langsung dari file data di repo ini.

### 🏢 Kantor, Kampus, dan Tim

- **Peta Kampus 3D** di Home: gedung tumbuh dan naik level otomatis seiring progres (HQ, Lab R&D, Pabrik Chip, Toko Flagship, Pusat OS, Billboard, Monumen), gaya bangunan ikut era, ada siang/malam mengikuti tema, dan animasi kota.
- **Office 3D Map** di HQ → Kantor: interior kantor isometrik dengan 9 ruangan yang terhubung ke data game. Staf duduk di meja (warna = peran, bola kecil = moral), lab menampilkan riset aktif, rak server menampilkan versi OS dan bug, showroom menampilkan produk yang dijual, dan seterusnya. Ruangan yang belum memenuhi syarat tampil terkunci. Ketuk ruangan untuk kartu info dan tombol ke panel terkait.
- **Tim**: 3 peran (Engineer, Designer, Marketer), 5 tingkat skill (Junior sampai Principal), 8 trait, kandidat internasional dari 7 region, dan maksimal 20 orang per peran. Skill naik seiring waktu, moral dan gaji ikut berubah.

### 🔬 Riset dan OS

- **Tech tree**: 5 kategori × 8 node = **40 node** (2000 sampai 2025), dengan antrian riset paralel. Makin banyak engineer, makin banyak slot.
- **OS sendiri**: **64 fitur** dalam 5 era (Firmware Dasar → Era Layar Sentuh → Smartphone Modern → AI & Ekosistem → AI On-Device), versi OS, bug acak (10 template) lengkap dengan patch, 10 aplikasi bawaan, dan ekosistem aplikasi pihak ketiga.
- **Lisensi OS**: 4 paket lisensi kalau kamu nggak mau bikin sendiri.

### 📱 Produk dan Penjualan

- **Wizard desain ponsel** dengan preview real-time. Ada **87 komponen** dalam 7 kategori (layar, kamera, baterai, chip, jaringan, bodi, form factor) dan 8 warna bodi. Pilihan ikut tahun, jadi nggak ada layar OLED di 2001.
- **Pengembangan 4 fase**: Desain → Prototipe → Produksi → Rilis.
- **Rumus permintaan transparan**: kualitas × harga × reputasi × pemasaran × OS × tren × kompetitor × lifecycle × kondisi makro.
- **Lifecycle produk**: naik → puncak → turun → mati. Ada stok gudang, restock otomatis, dan maksimal 5 produk aktif.
- **Pemasaran**: 5 jenis kampanye (Iklan Online, Sponsor Event, Peluncuran Produk, Billboard Kota, Kampanye Influencer).
- **Promosi regional**: 9 paket di 3 wilayah (Global, Asia, Eropa) dengan **8 event musiman** seperti Imlek, 618, Singles Day 11.11, Summer Sales, Black Friday, dan Natal.

### 🧠 Chip dan Fab

- **Riset chip**: 52 node dalam 6 kategori (desain, arsitektur, proses, grafis, daya, bisnis).
- **Desain chip sendiri**: 8 arsitektur, 14 process node, 24 fitur chip.
- **Fab** dengan 4 tingkat, dari Small Fab (kapasitas 5.000 chip/bulan, biaya $5 juta) sampai Mega Fab (5 juta chip/bulan, biaya $600 juta). Ada waktu bangun, upgrade, antrian produksi, dan yield.

### 🌍 Kompetitor dan Pasar

- **25 perusahaan** dengan personality (dominant, aggressive, premium, follower, innovator, declining): Nokia, Motorola, Sony Ericsson, Siemens, Palm, BlackBerry, Samsung, LG, HTC, Apple, Android, Huawei, Oppo, Vivo, Microsoft Lumia, Honor, OnePlus, Nothing, Asus, Sony Mobile, Realme, Meizu, Lenovo, Tecno, dan ZTE. Masing-masing punya tahun aktif, pangsa pasar historis per tahun, produk ikonik, milestone, dan **life events**. Ada penanda tingkat faktualitas dan catatan sumber, supaya jelas mana yang fakta dan mana yang disederhanakan.
- **Mode nama**: pakai nama asli atau nama parodi fiktif (misalnya "Nokio", "Apel", "Samsul").
- **Aksi dinamis kompetitor**: mereka bisa agresif, menekan harga, atau melemah, tergantung personality dan tingkat kesulitan.
- **Pangsa pasar** dihitung bulanan (riwayat 24 bulan). Ada model makro (GDP, inflasi, suku bunga 2000 sampai 2026) yang memengaruhi permintaan.
- **Opini publik**: sentimen per aspek (desain, kamera, baterai, performa, harga, keandalan, OS, support), feed ulasan, dan **10 viral event** yang bisa kamu tanggapi (minta maaf, recall, klarifikasi, atau diabaikan).
- **Berita**: headline otomatis dari 20 media (dengan jurnalis dan dateline per negara) yang menyoroti rilis produk, milestone, dan kejadian industri.

### 💰 Keuangan

- **Ekonomi**: gaji, sewa, pajak (12% / 15% / 20% sesuai kesulitan), burn-rate warning, dan riwayat kas.
- **Bank**: 3 bank (Global, Asia, Euro), pinjaman dengan bunga dan tenor, deposito fleksibel dan berjangka, dan **credit rating 8 tingkat (AAA sampai D)**. Telat bayar kena denda dan bisa memblokir akses pinjaman.
- **Bursa saham**: **38 emiten** dalam 8 kategori (ponsel, chip, software, sosial media, streaming, e-commerce, dan lainnya), 3 indeks (NASDAQ, Dow Jones, S&P 500), 5 mata uang (USD, KRW, TWD, HKD, IDR) dengan kurs historis, serta emiten fiktif untuk gameplay. Ada juga saham perusahaanmu sendiri.

### 🎯 Bantuan dan Progres

- **Asisten Bisnis** berbasis aturan: saran berurutan dari kritis sampai info, bisa ditunda, plus tanya-jawab lokal. Sudah disiapkan titik sambung kalau suatu saat mau dihubungkan ke AI.
- **Tutorial** 8 langkah, **quest** pemula, tips kontekstual, dan log/milestone.
- **Panduan** dan panel **Timeline** sejarah (17 ponsel ikonik, 12 tonggak OS).

### 🎨 Tampilan dan Bahasa

- **Era-aware visual**: 7 era desain (LCD Monokrom → TFT Warna → Revolusi Touchscreen → Smartphone Matang → Premium & Bezel-less → AI & Notch → Foldable & Ultra). Phone mockup, layar, dan notifikasi berubah per era.
- **Tema** gelap dan terang, dengan **6 warna aksen** (blue, emerald, violet, amber, rose, cyan).
- **Bilingual penuh**: Indonesia 🇮🇩 dan English 🇬🇧, bisa ganti kapan aja di Settings.
- **Audio** tap sound sintetis (Web Audio API), plus getar di perangkat yang mendukung.
- Layout mobile-first, ada swipe antar sub-tab.

### ☁️ Cloud, Akun, dan Save

- **Save lokal** otomatis, plus export/import file save.
- **Cloud save** lewat Supabase: login, **3 slot**, profil pemain (nama tampil dan avatar), dan pengecekan nama perusahaan unik.
- **Silicon (SIL)**: mata uang premium untuk mempercepat waktu dan riset, dengan bonus login harian. Skema top-up sudah disiapkan (daftar metode pembayaran dan alur order), tapi provider pembayaran produksi belum terhubung.
- **Keamanan**: save diberi tanda tangan integritas (penghalang edit manual, bukan enkripsi). Proteksi sesungguhnya ada di sisi server lewat Row Level Security dan skrip `supabase/hardening.sql` (wallet dan ledger SIL). Detail ada di `SECURITY.md`.

---

## Cara main

Buka https://jurkonstudio.github.io/smartphone-empire/ di HP atau desktop. Butuh koneksi internet untuk load pertama (library 3D dan cloud dimuat dari CDN).

### Jalanin di lokal

Karena pakai ES Modules, kamu butuh server lokal (browser blokir `file://`):

```bash
python3 -m http.server 8000
# atau
npx serve .
```

Lalu buka `http://localhost:8000`. Tidak ada langkah build dan tidak ada `npm install`.

---

## Teknologi

- **JavaScript murni (ES Modules)**, HTML, dan CSS. Tanpa framework dan tanpa bundler.
- **Three.js** (versi dipin, dimuat lazy dari CDN) untuk Peta Kampus dan Office 3D Map. Kalau WebGL atau CDN gagal, game tetap jalan dengan tampilan cadangan.
- **Supabase** (`supabase-js` dari CDN) untuk auth, cloud save, profil, dan storage avatar.
- Komunikasi antar sistem lewat **event bus** (daftar event ada di `src/config/event.md`).
- Total sekitar **200 file JS dan 50 ribu baris**.

### Struktur folder

```
smartphone-empire/
├─ index.html · style.css · density.css · profile-ui.css
├─ supabase/            skema SQL: schema, player-profile, company-name-unique, hardening
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

Data dipisah dari logika: menambah komponen, saham, kompetitor, atau headline cukup lewat file di `src/data/`.

---

## Yang belum kelar

Proyek ini masih jalan. Catatan roadmap saya:

- ⏳ **Office 3D Map tahap lanjut**: upgrade fasilitas langsung dari peta, aktivitas staf yang lebih hidup, dan tampilan lebih rapi di HP
- ⏳ **Event acak dengan pilihan**, era transition screen, dan polish UI
- ⏳ **Patch UI Evolution**: tampilan notifikasi berubah per era (monokrom → glossy → flat → Dynamic Island)
- ⏳ **Berita bilingual**: headline versi English sudah ada, sebagian template ulasan masih Indonesia
- ⏳ **Pembayaran Silicon**: menghubungkan provider pembayaran produksi dengan verifikasi server

---

## Kontribusi dan laporan bug

Bug atau saran? Buka [issue](https://github.com/jurkonstudio/smartphone-empire/issues). Kalau menemukan celah keamanan, baca dulu `SECURITY.md`.

Nama dan merek perusahaan dalam game dipakai untuk tujuan edukasi dan hiburan, dan hak ciptanya milik pemiliknya masing-masing. Data historis disederhanakan untuk kebutuhan gameplay.
