# Fitur Ponsel (features.data.js) — sekarang aktif
Salin file ke lokasi yang sama (path relatif dari akar repo). Uji: `node tools/features-test.mjs src`.

## Yang berubah
- **Riset (Tahap A)**: `research.data.js` menggabungkan kategori `feature` (kategori ke-9) + 44 node riset fitur (total 134 node). `validateResearchData` ikut menjalankan `validateFeatureData` (hasil: 0 masalah). Jalur R&D `feature` ditambahkan ke `RND_TRACKS`. Nama/deskripsi EN 44 node + kategori + jalur R&D ada di `research-data.en.js`.
- **Tech Edge tetap sama**: kategori `feature` dikecualikan dari rata-rata `computeTechEdge` (`TECH_EDGE_EXCLUDED_CATEGORIES`) supaya save lama tidak kena nerf tersembunyi (mastery fitur mulai 0).
- **Data produk (Tahap B)**: `config.featureIds` (array). Produk/save lama tanpa `featureIds` = netral (`factor === 1`). Tanpa migrasi, `schemaVersion` tidak diubah.
- **Wizard (Tahap C)**: langkah 3 punya bagian "Fitur Tambahan" per kelompok (biaya/unit, kunci + alasan riset, grup eksklusif otomatis menggantikan). Pilihan kedaluwarsa (`maxYear`) / belum riset dibuang otomatis. Isi Otomatis memilih fitur termurah untuk tiap standar pasar + regulasi, dan kini ikut memilih komponen Penyimpanan. Pratinjau (langkah 4) menampilkan efek ke permintaan beserta daftar kekurangan/keunggulan.
- **Stat & biaya (Tahap D)**: `ProductSystem.computeStats` menambah `getFeatureStats`; `computeUnitCost` menambah `getFeatureUnitCost` (juga pada `excludePlantParts=true`, jadi ikut tagihan desain dan produksi ulang).
- **Permintaan (Tahap E)**: `ProductSystem._getFeatureFactor` (memakai `getFeatureAnalysisFor`) dikalikan di `estimateDemand` DAN permintaan harian nyata, fungsi yang sama.
- **Ulasan & advisor (Tahap F)**: skor ulasan ikut faktor fitur (batas -2..+1); ulasan menyebut kekurangan/pujian fitur (ID/EN). `AdvisorSystem` punya aturan `feature_gap` (warn/tip), `AdvisorBrain._h_product` menambah tag fitur.
- **Dokumen (Tahap G)**: README diperbarui; file ini.

## Keputusan desain
- **Tumpang tindih**: sensor/audio di `components.data.js` tidak masuk stat produk, jadi tidak ada hitung ganda; fitur menjadi lapisan tambahan (opsi a). Satu-satunya tumpang tindih nyata adalah **penyimpanan**: tier `ft_stor_*` disembunyikan dari wizard; analisis memori memakai komponen `storage` pilihan pemain lewat `STORAGE_COMPONENT_GB` / argumen ketiga `getFeatureAnalysis(featureIds, year, { storageGB })` (tambahan kecil di `features.data.js`, kompatibel mundur). Tanpa komponen penyimpanan dianggap 4 MB (penalti "memori internal terlalu kecil").
- Syarat panel Kontrol Pengguna **tidak diubah** (tetap `sensor_face3d`); beralih ke `ft_secure` bersifat opsional.

## Hasil uji (`tools/features-test.mjs`)
- Validasi data 0 masalah; 9 kategori / 134 node; produk lama netral; kedaluwarsa tidak crash; biometrik eksklusif.
- Faktor fitur "standar" (Isi Otomatis) 1.00–1.08 untuk 2000–2030; tanpa fitur turun bertahap hingga ±0.65 (batas 0.6).
- Browser (Playwright): tab Riset menampilkan kategori Fitur, wizard + pratinjau tanpa `undefined`/`NaN`, 0 error konsol.

## Belum dicakup / catatan
- Simulasi keseimbangan multi-tahun lewat `tools/sim.mjs` belum dijalankan; sebelum rilis sebaiknya diuji dengan `tools/` yang ada.
- Teks EN ulasan memakai `labelEn` dari data; label seperti "memori internal terlalu kecil" bergantung pada data itu.
