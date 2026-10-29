# Kontrol Pengguna v2 (patch 0.2.14)

Kontrol Pengguna (panel Future, terbuka mulai 2019 dan setelah riset Face ID 3D) sebelumnya hanya punya kebijakan data. Patch ini menambah lima hal.

## Yang baru
1. **Wawasan Pengguna.** 8 kategori pemakaian (sosial, game, kamera, kerja, video, belanja, belajar, telepon/pesan), dihitung dari segmen pasar × pengguna aktif OS. Kedalaman: Terbuka = plus rincian segmen, Seimbang = semua kategori, Privasi Ketat = perkiraan 3 teratas.
2. **Kemudi Algoritma.** Slider Rekomendasi Aplikasi, Notifikasi, Personalisasi AI (0–100, netral 50). Memengaruhi belanja App Store, permintaan produk, dan peluang event isu privasi.
3. **Monetisasi Data.** Jual data teragregasi: pendapatan bulanan, tetapi ada peluang sanksi regulator (denda, reputasi, sentimen). Tidak tersedia pada Privasi Ketat atau di bawah 1.000 pengguna.
4. **Regulasi per negara.** 29 negara, tingkat 0–3 menurut tahun (`REGULATION_TIMELINE`). Paparan regulasi = rata-rata tingkat berbobot pengguna OS per negara. Angkanya perkiraan untuk game.
5. **Survei di Pesan.** Tiap 3 bulan satu survei lokal (5 topik berputar). Disimpan di save, bukan di server.

## Angka keseimbangan
- `src/systems/FutureEffects.js`: `ALGO_CONFIG`, `USER_CONTROL_CONFIG.policies[*].insight`.
- `src/systems/UserControlSystem.js`: `MONETIZE_CONFIG` (ARPU 0.45 USD, peluang sanksi dasar 3% + 12% × paparan, `fineMonths` 2, batas denda 25% kas), `REGULATION_FACTORS`, `SURVEY_EVERY_MONTHS`.

## Data di save (semua punya nilai bawaan)
`data.userControl.algo`, `.monetize` ({on, earned, last, fines, incidents}), `.surveys` (maks. 12, id negatif), `.surveySeq`.

## Berkas
Baru: `src/systems/UserControlSystem.js`, `tools/user-control-test.mjs`, dokumen ini.
Diubah: `src/systems/FutureEffects.js`, `src/systems/EcosystemSystem.js` (belanja toko × `getAlgoStoreMult`, di bulanan dan `getStorePreview`), `src/ui/panels/FuturePanel.js`, `src/services/InboxService.js` (pesan lokal: `addLocal`, gabung di `getItems`, tandai baca, hapus), `src/ui/panels/InboxPanel.js` (jenis Survei, bisa dibuka tanpa Cloud bila ada pesan lokal), `src/main.js` (slider, tombol monetisasi, `UserControlSystem`), `tools/run-all.mjs`.

## Belum dicek
Panel belum dibuka di browser/ponsel sungguhan. Angka ARPU, denda, dan peluang belum diseimbangkan dengan permainan penuh. Teks panel dan survei ada di kode (id/en), belum di kamus i18n.
