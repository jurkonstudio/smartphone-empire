# Peninjauan App Store (developer mengirim, pemain menyetujui/menolak)

## Ringkasan
Setelah OS pemain punya fitur App Store (`fw_appstore`), developer game dan aplikasi mulai mengirim karyanya.
Pemain memutuskan di **Pasar → Tinjauan App**: setujui, atau tolak dengan alasan.

## Alur
1. **Pengiriman masuk** per hari. Laju bergantung pada pengguna OS aktif, tahun, komisi App Store, goodwill developer, dan biaya pendaftaran.
2. **Info terbatas.** Pemain melihat judul, kategori, model bisnis, developer (reputasi, riwayat), dan perkiraan mutu (±18). Masalah tersembunyi (malware, privasi, hak cipta, penipuan, konten dewasa, spam) hanya terlihat lewat:
   - **Pemindai otomatis** (Dasar 55% / Lanjutan 85% deteksi, ada biaya pasang dan bulanan), atau
   - **Tinjau manual** per aplikasi (95% deteksi, membuka mutu asli, berbiaya).
3. **Keputusan.**
   - Setujui aplikasi bagus: katalog bertambah, belanja kotor toko naik (maks +15%).
   - Setujui aplikasi berbahaya: bisa jadi **insiden** → harus **ditarik** sebelum 3 bulan, atau jadi **skandal** (denda, goodwill turun, daya tarik toko turun).
   - Tolak aplikasi layak: goodwill developer turun, developer bisa mengeluh di publik.
   - Tolak dengan alasan yang meleset: goodwill turun sedikit.
4. **Developer jenis "shady"** disamarkan sebagai indie. Pemain bisa **memblokir** developer (tepat sasaran = tanpa penalti; developer bersih = goodwill turun).
5. **Kebijakan**: pemindai, biaya pendaftaran developer (0/25/99/299, masuk kas), setujui otomatis developer tepercaya.
6. **Kedaluwarsa**: pengiriman yang tidak diputuskan dalam 3 bulan hilang dan menurunkan goodwill.

## Efek ke ekonomi
- `EcosystemSystem` mengalikan belanja kotor App Store dengan `AppStoreReviewSystem.getStoreFactor()` (netral = 1.0 untuk save lama) dan menambah biaya pemindai ke biaya toko bulanan.
- Faktor dibatasi 0.7–1.2 dikali daya tarik goodwill 0.93–1.05.

## Berkas
Baru:
- `src/systems/AppStoreReviewSystem.js`
- `src/ui/panels/AppStoreReviewPanel.js`
- `src/data/appstore-review.data.js`
- `src/data/i18n/appstore-review.i18n.js` (id, en; bahasa lain jatuh ke en)
- `tools/appstore-review-test.mjs` (masuk `npm test`)

Diubah:
- `src/main.js` (instansiasi, `ecosystem.setAppReview`, `appReview.start()`, handler `data-asr-*`, sub-tab `appstore`, refresh)
- `src/ui/panels/MarketPanel.js` (tombol sub-tab "Tinjauan App" dengan jumlah antrean)
- `src/systems/EcosystemSystem.js` (`setAppReview`, faktor katalog, biaya pemindai)
- `src/data/i18n/index.js` (daftarkan kamus)
- `tools/run-all.mjs` (daftarkan tes)

## State save
`state.data.appStoreReview` dibuat otomatis (`ensureAppReviewState`); save lama aman.
