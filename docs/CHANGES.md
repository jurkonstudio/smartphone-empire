# Navigasi Pasar v1 — zip pengganti (Smartphone Empire v0.2.1)

Uji: `node --experimental-default-type=module tools/<nama>.mjs <path-ke>/src` (nama: calib, uni, sim, beh, render).
Struktur: salin isi folder `src/` ke `src/` repo (path sama, timpa). `tools/` opsional (harness uji, tidak dimuat game).

## File (9)
BARU : `src/data/market-nav.data.js`, `src/systems/MarketNavSystem.js`, `src/data/i18n/market-nav.i18n.js`
GANTI: `src/main.js` (+4 baris: import, instansiasi, `start()`, `window.__game.marketNav`), `src/systems/ProductSystem.js`,
       `src/systems/PublicOpinionSystem.js`, `src/data/feedback.data.js`, `src/data/i18n/index.js`, `src/ui/panels/PublicOpinionPanel.js`

## Yang aktif
- 8 segmen konsumen, 8 sub-wilayah, 16 gelombang tren + 4 tren tambahan (di `data.marketNav.ext`, `data.market.trends` tidak diubah).
- Faktor permintaan `navF` masuk ke `estimateDemand` dan `_computeDailyDemand`.
- Viral: `dailyDemandBoost` kini benar-benar memengaruhi penjualan (sebelumnya tidak pernah dipakai); 26 event viral, riwayat viral terisi, "Abaikan" hanya sekali.
- 11 aspek opini (display/connectivity/usability baru), sentimen kompetitor berbasis data, 3 respons viral baru (dwibahasa).
- Panel Opini: 3 aspek baru tampil, respons viral mengikuti bahasa.

## BELUM dikerjakan (tidak ada di zip ini)
- Paket promosi wilayah `rest` dan promosi per segmen (region.data, promotion.data, PromotionSystem, PromotionPanel).
- Panel UI Navigasi Pasar (kartu segmen/wilayah/peluang/gelombang di MarketPanel). Data sudah tersedia lewat `window.__game.marketNav`.
- Teks viral/ulasan lain yang masih Indonesia-saja di mode EN.
- Entri `patches.json` / README.

## Hasil uji (Node 22, harness di tools/)
- Syntax 261 file .js: 0 gagal. Import relatif: 0 hilang. `validateMarketNavData()` = kosong.
- `uni.mjs`: stat seragam, 2175 kombinasi (2000–2028, 5 harga): rata-rata faktor 0,994, min 0,90, maks 1,12, 0 NaN/Infinity.
- `sim.mjs`: permintaan harian baru/lama, 42 produk lintas 2000–2026: rata-rata rasio 0,997, rentang 0,90–1,13, 0 NaN. Viral +25% -> x1,25; -25% -> x0,75; produk lain tak terpengaruh; batas 1,5 / 0,55 terjaga.
- `beh.mjs`: Abaikan #1 ok, #2 dan #3 ditolak, reputasi tidak terkuras ulang; `viralHistory` terisi; 3 aspek baru dihitung; save lama (tanpa `marketNav`) dan save baru termuat.
- `render.mjs`: Panel Opini ID dan EN bersih (tanpa undefined/NaN/kunci mentah); modal respons viral ID dan EN benar.
- TIDAK diuji: simulasi hari-demi-hari 26 tahun dengan game utuh, tampilan di browser/Chromium, perangkat mobile asli.
