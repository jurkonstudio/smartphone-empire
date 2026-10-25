# Navigasi Pasar v2 — zip pengganti (di atas v1 yang sudah di-commit)

Salin isi `src/` ke `src/` repo dan timpa (path sama). Tidak ada perubahan `main.js` di tahap ini.

## File (8): 1 baru, 7 diganti
BARU : `src/ui/panels/MarketNavPanels.js`
GANTI: `src/data/region.data.js`, `src/data/promotion.data.js`, `src/data/i18n/market-nav.i18n.js`,
       `src/systems/PromotionSystem.js`, `src/systems/MarketNavSystem.js`,
       `src/ui/panels/PromotionPanel.js`, `src/ui/panels/MarketPanel.js`

## Yang baru
- Promosi Amerika & Lainnya (`rest`): 3 paket (`rest_retail`, `rest_carrier`, `rest_event`) + kecocokan `rest` (kualitas dan reputasi, dinormalkan rata-rata ~1,0).
- Promosi segmen: 6 paket (value, youth, gamer, creator, pro, premium). Menyebar seperti global (0,75x) tetapi menargetkan satu segmen:
  produk yang COCOK mendapat tambahan permintaan (sekitar +4–7%), produk yang TIDAK cocok justru turun (sekitar −4–6%). Panel menampilkan "Cocok segmen: n%" sebelum membeli.
  gamer dan creator terkunci sebelum 2004 (segmennya belum ada).
- Musim promo baru: Asia (Okt Golden Week/Diwali, Des akhir tahun), Amerika & Lainnya (Feb karnaval, Agu back to school).
- Tab Pasar: Pangsa memuat Peluang Terbaik, Segmen, dan Sub-Wilayah; Tren memuat Gelombang Tren dan Tren Tambahan (arah 6 bulan); Publik memuat Reaksi per segmen/wilayah dan Riwayat Viral.
  Kartu ini dibungkus try/catch: kalau gagal, sub-tab lama tetap tampil.
- Kamus ID/EN lengkap untuk semuanya.

## Catatan keseimbangan
- Efek penargetan segmen dibatasi 0,90–1,12 per produk (konstanta `TARGET_GAIN`, `TARGET_MIN/MAX` di MarketNavSystem). Mau lebih kuat/lemah: ubah `TARGET_GAIN` (0,15).
- Paket segmen sengaja berharga mirip `global_digital` (17–24 rb dasar) dengan jangkauan setara, jadi nilainya ada di penargetan, bukan di jangkauan yang lebih murah.

## Hasil uji (Node 22)
- 262 file .js: syntax 0 gagal, import hilang 0.
- Regresi v1 (uni, sim, beh, render) identik dengan hasil sebelumnya: faktor permintaan rata-rata 0,997, 0 NaN; viral dan "Abaikan" tetap benar.
- `promo.mjs` (data, perilaku, render): semua lolos. Kunci i18n paket/musim/cakupan lengkap di ID dan EN; kampanye segmen tersimpan dan terbaca nav; seg_gamer ditolak di 2001; maks 3 kampanye aktif; brand naik di wilayah yang benar; panel dan modal ID/EN bersih.
- `navui.mjs`: 3 sub-tab x 4 tahun (2001, 2008, 2018, 2026) x 2 bahasa = 24 render, tanpa undefined/NaN/kunci mentah; tanpa `marketNav` sub-tab tetap tampil.
- TIDAK diuji: browser/Chromium, perangkat mobile, simulasi 26 tahun dengan game utuh, tata letak (CSS) kartu baru di layar 390px.

## Belum dikerjakan
- Teks ulasan/viral lain yang masih Indonesia-saja di mode EN (di luar kartu baru).
- Entri `patches.json` (0.2.2) dan README — sengaja tidak disentuh agar tidak memicu notifikasi patch sebelum kamu siap.
