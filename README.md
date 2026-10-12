# 📱 Smartphone Empire 2026

**Simulasi manajemen perusahaan ponsel — dari era feature phone tahun 2000 hingga era AI modern.**

🔗 **Demo**: https://jurkonstudio.github.io/smartphone-empire/

**Developed by [Jurkon Studio](https://github.com/jurkonstudio)** — Fan project, tidak berafiliasi dengan perusahaan mana pun.

---

## 📖 Tentang Game

Bangun perusahaan ponsel dari nol: riset teknologi, kembangkan OS sendiri, desain ponsel, produksi, jual ke pasar, dan bersaing dengan kompetitor dunia nyata seperti Nokia, Apple, Samsung, dan lainnya.

> ⚠️ **Disclaimer:** Nama merek (Nokia, Apple, Samsung, dll) dipakai sebagai referensi sejarah untuk keperluan edukasi dan simulasi. Proyek ini bukan produk komersial.

---

## 🎮 Fitur

### ✅ Fase 1 — Fondasi
- Sistem waktu global (kalender realistis: 31/28/29/30 hari per bulan + kabisat)
- Pause, kecepatan 1x/2x/5x/10x
- Onboarding nama perusahaan + 3 tingkat kesulitan
- Tutorial interaktif 8 langkah
- Auto-save 30 detik + Export/Import JSON
- Sistem ekonomi: gaji, sewa, pajak, pinjaman, game over
- Grafik keuangan 24 bulan (Canvas)
- Toast notifikasi + vibrate

### ✅ Batch A — Riset & OS
- **Tech tree** 5 kategori × 8 node (Layar, Kamera, Baterai, Chip, Jaringan), tersebar 2000-2025
- Antrian riset paralel (slot bertambah dengan engineer)
- Prasyarat + year gate — tidak bisa riset masa depan
- **Sistem OS**: 24 fitur dalam 4 era, 5 stat (Stabilitas, Kecepatan, Fitur, Keamanan, Desain)
- Bug OS acak + mekanisme patch
- Ekosistem aplikasi + lisensi OS pihak ketiga

### ✅ Batch B — Produk & Penjualan
- **Wizard desain ponsel** bertahap: nama, form factor, komponen, OS, bodi, harga, qty
- Preview real-time: biaya, kualitas, margin, estimasi permintaan
- Pengembangan 4 fase: Desain → Prototipe → Produksi → Rilis
- **Rumus permintaan transparan** (kualitas × harga × reputasi × pemasaran × OS × tren × kompetitor × lifecycle)
- Lifecycle produk (naik → puncak → turun → mati)
- Ulasan otomatis + reputasi
- Kampanye pemasaran + stok gudang
- Katalog + grafik penjualan

### ✅ Batch C — Kompetitor Dunia Nyata & Feedback Publik
- **18 kompetitor nyata**: Nokia, Motorola, Sony Ericsson, Samsung, LG, Siemens, Palm, BlackBerry, Apple, HTC, Google, Huawei, Xiaomi, Oppo, Vivo, Microsoft Lumia, Honor, Nothing
- **Life events sejarah** (iPhone 2007 menggerus Nokia, akuisisi Microsoft, dll)
- AI kompetitor naik tier + rilis produk berkala
- Pangsa pasar dihitung bulanan riil (24 bulan history)
- **Feedback publik lengkap**: sentimen 0-100, per aspek, feed 30 ulasan, event viral, saran pelanggan
- Viral event dengan respons (permintaan maaf, recall, klarifikasi, abaikan)

### 🚧 Roadmap
- **Batch D** — Event acak dengan pilihan, era transition screen, polish UI, balancing final
- **Patch UI Evolution** — Gaya notifikasi berubah per era (monokrom → glossy → flat → Dynamic Island)

---

## 🛠️ Teknologi

- **HTML, CSS, JavaScript vanilla** — ES Modules
- **Tanpa build tools** — tanpa npm, bundler, atau library eksternal
- **Mobile-first** — Chrome Android, GitHub Pages
- **Hemat baterai** — requestAnimationFrame + delta time, tanpa `setInterval` untuk logika game
- **Canvas** untuk grafik (keuangan, penjualan, pangsa pasar)
- **localStorage** untuk save (dengan migrasi versi)

---

## 📁 Struktur Folder

```

smartphone-empire/
├── index.html
├── style.css
├── README.md
└── src/
├── main.js                 # Router & bootstrap
├── config/                 # Konfigurasi & konstanta
│   ├── app.config.js
│   ├── constants.js
│   ├── time.config.js
│   └── events.md           # Dokumentasi event bus
├── core/                   # Inti sistem
│   ├── EventBus.js
│   ├── GameState.js
│   ├── TimeSystem.js
│   ├── SaveService.js
│   └── ToastService.js
├── data/                   # Data game (balancing & konten)
│   ├── balance.data.js
│   ├── research.data.js
│   ├── os.data.js
│   ├── components.data.js
│   ├── marketing.data.js
│   ├── competitors.data.js
│   └── feedback.data.js
├── systems/                # Business logic
│   ├── EconomySystem.js
│   ├── QuestSystem.js
│   ├── TutorialSystem.js
│   ├── ResearchSystem.js
│   ├── OSSystem.js
│   ├── ProductSystem.js
│   ├── MarketSystem.js
│   ├── CompetitorSystem.js
│   └── PublicOpinionSystem.js
└── ui/
├── modal.js
├── layout/
│   ├── Header.js
│   ├── MobileNav.js
│   └── Sidebar.js
└── panels/
├── DashboardPanel.js
├── ResearchPanel.js
├── OSPanel.js
├── ProductPanel.js
├── DesignWizard.js
├── MarketPanel.js
├── PublicOpinionPanel.js
├── CompetitorDetailModal.js
├── SettingsPanel.js
├── GuidePanel.js
└── ...

```

---

## 🚀 Cara Menjalankan

### Online (GitHub Pages)
1. Fork atau clone repositori ini.
2. Push ke GitHub.
3. Buka **Settings → Pages** → pilih branch `main` dan folder `/ (root)`.
4. Tunggu 1-2 menit, lalu buka `https://<username>.github.io/smartphone-empire/`.

### Offline (Lokal)
Karena menggunakan ES Modules, browser memblokir `file://` untuk import. Gunakan server lokal:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (jika ada)
npx serve .
```

Buka http://localhost:8000.

---

🎯 Cara Bermain

1. Onboarding — isi nama perusahaan, pilih kesulitan (Santai/Normal/Sulit).
2. Mulai waktu — tekan ▶ di header untuk menjalankan simulasi.
3. Riset — buka tab Riset → mulai riset untuk membuka komponen baru.
4. Kembangkan OS — tab Riset → OS → buat OS, kembangkan versi (pilih fitur).
5. Desain ponsel — tab Produk → Desain → wizard → rilis ponsel.
6. Jual — ponsel otomatis dijual harian; cek grafik di Produk → Penjualan.
7. Pantau pasar — tab Pasar untuk pangsa, kompetitor, tren, dan feedback publik.
8. Jangan bangkrut — uang negatif 2 bulan berturut-turut = game over.

Kalender

Game dimulai 1 Januari 2000. Kalender realistis dengan 12 bulan, tahun kabisat, dan nama bulan berbahasa Indonesia.

---

💾 Save System

· Auto-save setiap 30 detik ke localStorage.
· Manual save di Setelan → Simpan Manual.
· Export/Import JSON di Setelan — untuk backup ke catatan HP atau pindah perangkat.
· Reset game di Setelan → Reset (dengan konfirmasi).

Save menggunakan schema version dan mendukung migrasi dari versi lama. Save dari versi Fase 1 tetap bisa dimuat.

---

🎮 Cheat Console (Untuk Testing)

Buka Developer Tools (Chrome: chrome://inspect atau Kiwi Browser). Semua fungsi tersedia di window.__game:

```javascript
// Uang
__game.cheat.addCash(100000)

// Waktu
__game.cheat.skipDays(30)
__game.cheat.setYear(2007)        // lompat ke era iPhone

// Riset & OS
__game.cheat.completeAllResearch()
__game.cheat.completeResearch('layar_mono')
__game.cheat.startOsWith(['fw_sms', 'fw_contacts'])
__game.cheat.spawnOsBug()

// Tim & Produk
__game.cheat.addEngineers(4)
__game.cheat.quickRelease()       // rilis produk otomatis

// Kompetitor & Feedback
__game.cheat.forceCompetitorRelease('nokia')
__game.cheat.addCompetitorEvent('apple')
__game.cheat.spawnViralEvent('negative')
__game.cheat.forceReview()

// Debug state
__game.state.get()
__game.state.get().products.catalog
__game.opinion.getSentiment()
```

---

📊 Balancing

Semua angka balancing ada di src/data/balance.data.js — biaya riset, gaji tim, harga pinjaman, kurva permintaan, dan lain-lain. Ubah angka di satu tempat, seluruh sistem mengikuti.

Beberapa parameter penting:

· startingCash — modal awal per kesulitan
· salary — gaji bulanan per role (engineer/designer/marketer)
· research.baseSlots — slot riset dasar
· products.weights — bobot faktor permintaan
· competitors.aiResearchTierPerYear — kecepatan AI naik tier

---

🧪 Testing

Karena tidak ada test framework (sesuai aturan "tanpa build tools"), semua pengujian dilakukan manual di browser:

1. Buka game di Mode Incognito (untuk menghindari cache).
2. Buka Console (chrome://inspect di HP, atau DevTools di desktop).
3. Jalankan skrip cheat untuk mempersingkat waktu.

Setiap batch punya checklist uji manual (biasanya 10-12 poin) yang harus dilewati sebelum lanjut ke batch berikutnya.

---

📝 Dokumentasi Event

Semua komunikasi antar modul lewat EventBus (bukan direct import). Daftar lengkap event + payload tersedia di src/config/events.md.

Contoh:

· time:day-changed — setiap pergantian hari
· research:completed — riset selesai
· product:released — produk dirilis
· competitor:released-product — AI kompetitor merilis produk
· feedback:viral-started — viral event dimulai

---

🛣️ Roadmap

☑ Fase 1 — Fondasi (waktu, ekonomi, onboarding)
☑ Batch A — Riset & OS
☑ Batch B — Produk & Penjualan
☑ Batch C — Kompetitor Dunia Nyata & Feedback Publik
☐ Batch D — Event acak, era transition, polish
☐ Patch — Era UI Evolution (notifikasi ikut tren teknologi)

---

🤝 Kontribusi

Proyek ini dikembangkan sebagai eksperimen solo oleh Jurkon Studio dengan bantuan AI. Jika Anda ingin berkontribusi:

1. Fork repositori.
2. Buat branch baru (git checkout -b fitur-baru).
3. Commit perubahan (git commit -m 'Tambah fitur X').
4. Push ke branch (git push origin fitur-baru).
5. Buka Pull Request.

Aturan kontribusi:

· Gunakan ES Modules dengan ekstensi .js.
· Semua angka balancing di src/data/balance.data.js.
· Komunikasi antar sistem lewat EventBus.
· Jangan pakai setInterval untuk logika game — pakai time:day-changed.
· Auto-translate Chrome harus OFF saat mengedit kode.

---

👤 Developer

Jurkon Studio

· GitHub: @jurkonstudio
· Proyek: smartphone-empire

---

📜 Lisensi

MIT License — bebas digunakan, dimodifikasi, dan didistribusikan.

Catatan: Nama merek (Nokia, Apple, Samsung, dll) dan referensi sejarah dipakai sebagai fair use untuk keperluan edukasi dan simulasi. Proyek ini bukan produk komersial dan tidak berafiliasi dengan perusahaan mana pun.

---

🙏 Ucapan Terima Kasih

Dibangun dengan bantuan AI sebagai pair programmer. Terinspirasi dari:

· Game Dev Tycoon — mekanisme desain produk
· Game Dev Story (Kairosoft) — UI mobile-first
· Smartphone Tycoon / Phone Tycoon — konsep simulasi pasar

---

© 2025 Jurkon Studio. Dibuat dengan ❤️ untuk komunitas gamer dan developer Indonesia.

```

---

## 📌 Cara Pakai (30 detik)

1. Buka GitHub → repositori `smartphone-empire`.
2. Klik file **`README.md`**.
3. Klik ikon **pensil** (✏️).
4. **Select All** (`Ctrl+A` / `Cmd+A`) → **Hapus**.
5. **Paste** seluruh konten di atas.
6. Scroll ke bawah → **Commit changes**.

Selesai. README baru akan langsung tampil di halaman utama repositori dengan atribusi **Jurkon Studio** di bagian atas dan bawah.

> ⚠️ **Penting:** Auto-translate Chrome **harus OFF** sebelum paste. Kalau tidak, kata `Javascript`, `EventBus`, dll bisa berubah jadi bahasa Indonesia.

---

## 🎯 Perubahan dari Versi Sebelumnya

- ✅ **Atribusi "By Jurkon Studio"** di baris teratas (setelah tagline)
- ✅ **Bagian "Developer"** khusus dengan link GitHub
- ✅ **Footer © 2025 Jurkon Studio**
- ✅ **Kontribusi** menyebut Jurkon Studio sebagai pengembang
- ✅ Susunan lebih rapi & siap tampil di halaman GitHub

Silakan commit. Setelah itu, lanjut uji preview Batch C. Kabari saya hasilnya — kalau lolos, kita lanjut **Batch D (Event + Era + Polish)**. 👍
