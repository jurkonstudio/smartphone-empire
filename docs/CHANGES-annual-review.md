# Rapor Tahunan + Target Dewan + Rival Tahunan

Tiap 1 Januari game berhenti sejenak dan menampilkan rapor tahun yang baru berakhir, lalu pemain memilih
satu Fokus Strategis. Dewan menetapkan 3 target per tahun, jadi tiap tahun punya taruhan sendiri.
Salin file ke lokasi yang sama (path relatif dari akar repo). Tidak ada langkah build.

## Baru
- `src/data/annual-review.data.js` — semua angka balance: target tahun pertama per kesulitan, pengali
  pertumbuhan, batas nilai S/A/B/C/D, hadiah/hukuman, 3 Fokus Strategis. Teks id + en.
- `src/systems/AnnualReviewSystem.js` — state `data.annual`, penutupan periode, penilaian, efek, pilihan fokus.
  Fungsi murni diekspor: `computeNetWorth`, `computePeriodMetrics`, `buildTargets`, `evaluateTargets`, `gradeFor`.
- `src/ui/panels/AnnualReviewModal.js` — modal 3 layar (Rapor → Fokus → Hasil) dan
  `renderBoardTargetsCard(state)` untuk kartu progres di Home.
- `tools/annual-review-test.mjs` — tes headless (sekitar 76 baris pemeriksaan, sebagian di dalam loop): `node --experimental-default-type=module tools/annual-review-test.mjs src`.

## Diubah
- `src/main.js` — import, instansiasi, `annualReview.start()`, handler `annual:pending` (jeda game,
  kembalikan setelah selesai, tidak menimpa modal lain), `__game.annual`.
- `src/ui/panels/HomePanel.js` — kartu "Target Dewan" di slide Focus (satu import + satu pemanggilan).
- `src/config/event.md` — dokumentasi event `annual:pending` / `annual:resolved`.

## Cara kerja
- **Tiga target dewan** (ditambah Rival Tahunan sebagai target ke-4, lihat bawah): omzet setahun, rata-rata pangsa pasar, kekayaan bersih akhir tahun
  (kas + simpanan bank − pinjaman; saham tidak dihitung, sama seperti skor akhir musim).
- **Tahun pertama**: angka dasar per kesulitan. **Tahun berikutnya**: capaian tahun lalu × pengali pertumbuhan,
  dengan lantai supaya target tak jatuh ke nol. Save lama di tengah game memakai capaian 12 bulan terakhir.
- **Rival Tahunan** (target ke-4, mulai tahun kedua saat data pesaing sudah ada): dewan menunjuk pesaing terdekat di atas
  pangsa pasarmu (sulit: satu tingkat lebih jauh; bila kamu sudah #1, pesaing terkuat). Targetnya: pangsa rata-ratamu
  melewati pangsa rata-rata rival di tahun yang sama. Dinilai langsung head-to-head, jadi rival yang ikut tumbuh tetap
  menantang. Menang = bonus kas dan reputasi di atas hadiah nilai, berlaku juga di masa percobaan. Rival yang mundur dari
  pasar = lulus otomatis tanpa bonus. Rival naik tingkat mengikuti kemajuanmu. Save lama yang tidak punya rival tetap 3 target.
  Angka ada di `ANNUAL_CONFIG.rival`.
- **Nilai**: rata-rata (aktual / target, tiap target dijepit 0..2). S ≥ 1,25, A ≥ 1,0, B ≥ 0,8, C ≥ 0,5, selebihnya D.
- **Hadiah/hukuman**: S dan A memberi kas (× skala bisnis) dan reputasi. C mengurangi reputasi. D mengurangi reputasi
  dan menurunkan permintaan 5% selama 90 hari. Rapor pertama adalah masa percobaan: tidak ada hukuman.
- **Fokus Strategis** (satu gratis, jadi pemain tak pernah terkunci):
  Efisiensi (kas +, permintaan premium −5%, target kekayaan bersih +10%),
  Inovasi (biaya, reputasi +3, permintaan premium +10%),
  Ekspansi (biaya, permintaan semua ponsel +5%, target omzet dan pangsa +10%).
- Pengali permintaan memakai slot `events.mods` milik EraEventSystem, yang sudah dibaca ProductSystem (dijepit 0,6–1,5).
- Rapor ditahan selama tutorial berjalan, dan tidak muncul bila game over atau melewati `endYear`.
- Biaya, kas, dan hadiah dikalikan skala bisnis (omzet bulanan / $30K, 1x..300x), sama seperti insiden dinamis.

## Save lama
Field baru `data.annual` dilengkapi otomatis oleh `ensureAnnualState`. `GameState.js` tidak diubah:
`hydrate` sudah menyalin key tingkat atas yang tidak dikenal. Diverifikasi di tes.

## Yang perlu diputuskan pemilik game
- **Angka balance belum dikalibrasi lewat bermain.** Terutama target tahun pertama (`firstYear`) dan pangsa pasar,
  karena nilai `playerShare` bergantung pada skala pasar. Mainkan 2–3 tahun di tiap kesulitan, lalu sesuaikan
  `firstYear`, `growth`, dan `floors` di `annual-review.data.js`.
- Hadiah kas S/A (`$12K` / `$6K` × skala) sengaja kecil. Naikkan bila ingin rapor terasa lebih bernilai.
- `patches.json` belum diubah (tidak ada nomor versi yang pasti). Tambahkan entri rilis sesuai versi yang dipakai.
- Teks rapor belum masuk kamus i18n; memakai pasangan id/en inline seperti `era-events.data.js`.
- Tampilan modal belum diuji di browser/perangkat asli (hanya tes headless dan render HTML sebagai teks).

## Ide lanjutan yang sudah disiapkan datanya
- Headline berita saat rival dikalahkan: sekarang hanya masuk log dan toast, karena artikel NewsSystem butuh media dan jurnalis.
- Milestone "Rival Tahunan" ke skor akhir musim: sengaja belum, karena tiap milestone bernilai 100 poin dan mengubah balance skor.
- Riwayat nilai per tahun sudah tersimpan di `data.annual.history`, siap ditampilkan di HQ → History.
