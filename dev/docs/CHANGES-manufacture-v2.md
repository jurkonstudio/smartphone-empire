# Manufaktur v2 — panel lebih rapi & terintegrasi
Salin isi zip ke root repo (path sama, timpa).

## Navigasi
- Sub-tab Manufaktur dibagi 4 bagian lewat bar segmented (menempel di atas): **Ringkasan · Assembly · Komponen · Chip**. Titik merah/kuning di tab Assembly = ada peringatan.
- Bagian aktif diingat selama sesi (`ManufactureUiState.js`). Tombol "Buka Panel ..." di kartu peta 3D kini membuka bagian yang tepat (Assembly / Komponen / Chip / Ringkasan).

## Ringkasan (baru)
- Rantai produksi Chip → Komponen → Assembly → Produk (tiap simpul bisa diketuk; Produk membuka Katalog).
- Statistik: kas, biaya tetap/bulan (semua pabrik + gaji Assembly), hemat komponen, hemat restock (perkiraan), stok, kapasitas.
- "Perlu perhatian": gabungan peringatan Assembly, tunggakan pabrik komponen, stok kosong, node chip yang sudah terjangkau.
- "Langkah berikutnya": saran satu langkah sesuai kondisi.

## Assembly (dirombak)
- Hero status + gauge utilisasi 30 hari.
- Peringatan terurut (tunggakan, staf kurang, moral rendah, lembur saat moral rendah, beban >100%, cacat tinggi, ROI negatif) dengan tombol aksi langsung (Isi tim, Matikan lembur).
- KPI dikelompokkan: Produksi · Kualitas · Keuangan (termasuk hemat restock 30 hari dan selisih bersih).
- Antrean produksi: pesanan produk yang sedang dirakit (nama, unit, sisa hari, progres) — terhubung ke Katalog Produk.
- Tenaga kerja: kartu per peran dengan bar berwarna (hijau/kuning/merah), tombol −10 / +10 / +50 / **Isi {n}**, dan **Isi semua peran** (prioritas operator > teknisi > QC > supervisor, dibatasi kas).
- Lembur jadi saklar. Upgrade menampilkan tabel perbandingan Sekarang vs Berikutnya (kapasitas, diskon, pekerja, biaya tetap, waktu). Bantuan bisa dibuka/tutup.

## Komponen (dirapikan)
- Kartu pabrik bisa dilipat (header: status + stok + aksi bangun/upgrade); pabrik berdiri ≤2 terbuka otomatis.
- Pilihan ukuran batch (10 rb / 50 rb / 100 rb / kapasitas penuh); tombol Produksi menampilkan jumlah + total biaya; tombol Jual grosir dan kuota dalam satu baris aksi.

## Sistem
- `AssemblySystem`: `getAlerts`, `getPendingOrders`, `getProjection`, `getFillPlan`, `hireFill`, `getUpgradePreview`, `getFullWages`; `hire(role, 'max')`; `recordOrder(qty, effort, paid)` mencatat hemat per pesanan (`savedTotal`). Save lama kompatibel (field baru diisi otomatis).
- `ProductSystem.orderProduction` meneruskan total tagihan ke `recordOrder`.
- Hemat restock adalah PERKIRAAN (tagihan / pengali biaya − tagihan; biaya setup ikut terhitung).

## File
- BARU src/ui/panels/ManufactureUiState.js
- UBAH src/ui/panels/AssemblyPanel.js, ManufacturePanel.js, src/systems/AssemblySystem.js, ProductSystem.js, src/main.js (handler `data-mf-ui`, aksi `fill`/`max`, refresh event assembly, `advisor:go` + section), src/ui/manufacture/ManufactureLogic.js & ManufactureScene.js (tujuan tombol peta), style.css (blok `mfx-*` / `asm2-*` di akhir).
- Teks ID/EN. Bagian Riset Chip tidak diubah.
- Diuji: sintaks seluruh file + simulasi render dengan data tiruan (30 pemeriksaan). Belum diuji di browser sungguhan.
