# v2029.1 — Penahan Ekonomi

Masalah: kas bisa menumpuk tanpa batas (bot sederhana mencapai $1,5 M di 2026, bot kuat $15 M)
karena biaya per unit datar, permintaan tak bertepi, dan tidak ada tempat membelanjakan kas.

## Rem
1. **Biaya naik seiring volume** — pengali biaya komponen = 1 + 0,12·log2(volume / q0), maks x2,2.
   q0 = 0,5 x permintaan dasar/hari (ikut zaman). Unit yang diproduksi 30 hari terakhir ikut dihitung,
   jadi memecah pesanan tidak menghindari kurva. Berlaku di desain, restock manual, dan auto-restock.
2. **Permintaan dibatasi pasar** — total penjualan SEMUA produk jenuh di plafon
   (santai 0,45 / normal 0,35 / sulit 0,28 x permintaan dasar/hari). Pemain biasa nyaris tak terpotong.
3. **Respons kompetitor** — di atas utilisasi 60%, tekanan rival pada produk pemain naik hingga x1,8.

## Sink dana (tab HQ > Investasi)
- **Investasi Pabrik** L1–L5: melandaikan kurva volume & memangkas biaya komponen. Harga = max(lantai x CPI, N bulan pendapatan).
  Ada biaya pemeliharaan bulanan (masuk laporan bulanan: `breakdown.upkeep`).
- **Akuisisi merek rival** (mulai 2003, maks 5, jeda 6 bulan): memperbesar plafon pasar, melemahkan tekanan rival itu.

## File
- Baru: `src/systems/EconBrakeSystem.js`, `src/ui/panels/InvestPanel.js`, `tools/econ-brakes.mjs`
- Diubah: `balance.data.js` (blok `econ`), `ProductSystem.js` (quoteDesign/quoteProduction, plafon harian),
  `MarketSystem.js`, `EconomySystem.js`, `main.js`, `HqPanel.js`, `DesignWizard.js`, `ProductPanel.js`, `regional.i18n.js`
- Semua angka di `BALANCE.econ`. Save lama aman (`data.econ` dibuat lazy).
- Tes: `node tools/econ-brakes.mjs` (29 assertion).
