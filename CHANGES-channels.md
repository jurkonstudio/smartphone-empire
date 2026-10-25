# Kanal Distribusi (operator, online, toko sendiri)

Sub-tab baru **Pasar → Kanal**. Distributor & ritel tetap baseline (ekonomi game yang sudah ada, tidak berubah).
Tiga kanal tambahan memperluas permintaan, tetapi unit yang lewat kanal itu dipotong margin dan ada biaya tetap.

## File
BARU : `src/data/channels.data.js`, `src/systems/ChannelSystem.js`, `src/ui/panels/ChannelPanel.js`, `tools/channels-test.mjs`
GANTI: `src/systems/ProductSystem.js` (+pengali permintaan, +potongan pendapatan), `src/systems/EconomySystem.js` (+biaya tetap bulanan),
       `src/ui/panels/MarketPanel.js` (+sub-tab), `src/main.js` (+instansiasi, wiring, klik, swipe, `window.__game.channels`),
       `src/config/event.md`, `README.md`

## Kanal
| Kanal | Terbuka | Jangkauan (bonus permintaan) | Margin diterima | Buka | Tetap/bln | Komitmen |
|---|---|---|---|---|---|---|
| Operator Seluler | 2000 | +45% (2000) → +30% (2008) → +10% (2016) → +3% (2030) | 72% | $12K | $800 | 6 bln |
| Toko Online | 2003 | +1% (2003) → +10% (2010) → +30% (2020) → +38% (2030) | 94% | $6K | $500 | 3 bln |
| Toko Sendiri | 2004 | +4% → +15%, +6% ekstra untuk ponsel premium | 100% | $40K | $3,5K | 12 bln |
Biaya dikali skala ukuran bisnis (rata-rata omzet 3 bln / $30K, dijepit 1–300x), sama dengan insiden dinamis.

## Rumus
- Permintaan harian dan estimasi wizard dikali `1 + B` (B = total bonus kanal aktif, maks 0,9).
- Porsi unit kanal c = `b_c / (1 + B)`. Pendapatan bersih = penjualan kotor × `1 − Σ porsi_c × (1 − margin_c)`.
- Biaya produksi per unit tidak berubah → kanal berpotongan besar **merugikan ponsel bermargin tipis**
  (uji: operator 2005, margin 60% untung +12, margin 20% rugi −3 per unit baseline).
- Tanpa kanal aktif semuanya netral (faktor 1,0): save lama dan kalibrasi tidak terpengaruh.

## Biaya & komitmen
Biaya buka dibayar lewat WalletService. Biaya tetap bulanan masuk `expenseBase` EconomySystem (muncul di laporan bulanan).
Kanal tidak bisa ditutup sebelum masa komitmen habis.

## Save lama
`data.channels` (`active`, `stats`, `paid`) dibuat otomatis oleh `ensureChannelState`.

## Uji
`node --experimental-default-type=module tools/channels-test.mjs src` — validasi data, netral tanpa kanal, aktivasi/komitmen/biaya,
skala biaya, batas jangkauan & scope premium, sambungan ke `_computeDailyDemand` dan `_processDailySales` (pendapatan bersih,
kas, statistik), untung-rugi per margin, save lama, render panel.
Regresi tetap lulus: `dynamic-events-test`, `era-events-test`, `econ-brakes`, `sim`, `render`, `calib`, `uni`.
TIDAK diuji: tampilan panel di browser/perangkat asli dan keseimbangan lewat bermain nyata. Angka bonus/potongan adalah tebakan awal
dan mudah disetel di `channels.data.js`.

## Ide lanjutan
Kontrak operator dengan komitmen volume dan penalti, kanal regional (ekspor), event insiden yang memengaruhi kanal
(operator batal, toko online diretas), dan saran Advisor saat sebuah kanal sudah tidak menguntungkan.
