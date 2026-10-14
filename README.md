<div align="center">

<img src="assets/logo.png" alt="Jurkon Studio" width="180" />

# Smartphone Empire

**Bangun perusahaan ponsel dari nol. Mulai dari tahun 2000, bersaing dengan Nokia, Apple, Samsung, sampai era AI.**

Dibuat oleh **Kalfin Agus Setiawan** di bawah bendera **Jurkon Studio**.

[🎮 Coba Game](https://jurkonstudio.github.io/smartphone-empire/) · [🐛 Laporkan Bug](https://github.com/jurkonstudio/smartphone-empire/issues)

</div>

---

## Kenapa saya bikin game ini

Saya suka game simulasi. Tapi yang bikin saya penasaran: kenapa nggak ada game yang bener-bener nyeritain **evolusi ponsel dari awal sampai sekarang**? Rasanya seru kalau kita bisa ngerasain jadi perusahaan kecil tahun 2000 yang harus bersaing sama Nokia yang lagi jaya-jayanya, terus pelan-pelan naik kelas sambil lihat industri berubah — dari candybar monokrom jadi ponsel lipat.

Jadi saya bikin. Pelan-pelan, sambil belajar, dibantu AI sebagai pair programmer.

Ini proyek fan project. Bukan produk komersial. Nggak ada afiliasi sama Nokia, Apple, Samsung, atau perusahaan manapun.

---

## Gameplay-nya gimana

Anggap aja kamu jadi CEO perusahaan ponsel yang baru berdiri 1 Januari 2000. Uang cuma cukup buat beberapa bulan. Tugas kamu:

- Riset teknologi biar bisa bikin ponsel yang nggak ketinggalan zaman
- Bangun OS sendiri (atau lisensi dari pihak ketiga, tapi mahal)
- Desain ponsel: layar, kamera, baterai, chip, jaringan, bodi, warna
- Rilis ke pasar, lihat reaksinya
- Jangan bangkrut

Sambil kamu kerja, **18 kompetitor nyata** (Nokia, Motorola, Samsung, Apple, Huawei, Xiaomi, dll) juga jalan. Mereka rilis produk, naik tier riset, dan ngambil pangsa pasar. Kalau kamu lambat, mereka yang makan pasar.

Yang bikin menarik: ada **life events nyata** yang bikin permainan berubah. Tahun 2007 iPhone muncul dan Nokia mulai goyah. Kalau kamu di posisi Nokia, apa yang kamu lakuin?

---

## Fitur yang udah ada

**Fondasi**
- Sistem waktu realistis (bulan 28-31 hari, tahun kabisat)
- Pause + speed 1x/2x/5x/10x
- Onboarding, tutorial, auto-save, export/import save
- Ekonomi lengkap: gaji, sewa, pajak, pinjaman, game over

**Riset & OS**
- Tech tree 5 kategori × 8 node, dari 2000 sampai 2025
- Antrian riset paralel — makin banyak engineer, makin banyak slot
- OS sendiri: 24 fitur, 5 stat (stabilitas, kecepatan, fitur, keamanan, desain)
- Bug acak + patch
- Ekosistem aplikasi + lisensi OS pihak ketiga

**Produk & Penjualan**
- Wizard desain ponsel bertahap dengan preview real-time
- Pengembangan 4 fase: Desain → Prototipe → Produksi → Rilis
- Rumus permintaan transparan (kualitas × harga × reputasi × pemasaran × OS × tren × kompetitor × lifecycle)
- Lifecycle produk: naik → puncak → turun → mati
- Ulasan otomatis, reputasi, kampanye pemasaran, stok gudang

**Kompetitor & Pasar**
- 18 perusahaan nyata dengan personality masing-masing
- AI kompetitor naik tier + rilis produk berkala
- Pangsa pasar dihitung bulanan (24 bulan history)
- Feedback publik: sentimen, per aspek, feed 30 ulasan, viral event
- Viral bisa direspons: minta maaf, recall, klarifikasi, atau diabaikan

**i18n**
- Full bilingual: Indonesia 🇮🇩 + English 🇬🇧
- Ganti bahasa kapan aja di Settings

**Audio**
- Tap sound synth (Web Audio API) — 5 suara: tap, select, toggle, success, error

---

## Yang belum kelar

Proyek ini masih jalan. Roadmap saya:

- ⏳ **Batch D** — Event acak dengan pilihan, era transition screen, polish UI
- ⏳ **Patch UI Evolution** — Tampilan notifikasi berubah per era (monokrom → glossy → flat → Dynamic Island)
- ⏳ **Berita bilingual** — Template ulasan produk masih Indonesia, lagi dikerjain

---

## Cara main

Buka https://jurkonstudio.github.io/smartphone-empire/ di HP atau desktop. Butuh koneksi internet buat load pertama, setelah itu bisa offline.

**Mau jalanin di lokal?**
Karena pakai ES Modules, kamu butuh server lokal (browser blokir `file://`):

```bash
python3 -m http.server 8000
# atau
npx serve .
