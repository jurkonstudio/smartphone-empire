# Office Modern v84 — kantor 3D bertahap menurut level + tahun

Kantor tidak lagi sama dari 2000 sampai 2026. Dekorasi baru muncul bertahap, dan tiap fitur butuh
**level ruangan** (dari exp/aktivitas pemain) **dan era desain** (dari tahun game) sekaligus.
Aturannya ada di satu tempat: `src/ui/office/OfficeProgress.js` (tabel `FEATURES`, murni, mudah diubah).

| Fitur | Level min | Era min (tahun) | Ruangan |
|---|---|---|---|
| Lampu lantai | 1 | 2 (2007) | CEO |
| Galeri dinding | 2 | 1 (2003) | Work |
| Resepsionis (HQ kecil) | 2 | 2 (2007) | Work |
| Taman dalam ruangan | 3 | 2 (2007) | Work |
| Strip LED aksen | 2 | 3 (2011) | semua ruangan |
| Layar pintar dinding | 2 | 3 (2011) | CEO |
| Cincin LED Lab | 2 | 3 (2011) | Lab |
| Running text bursa | 2 | 3 (2011) | Keuangan |
| Video wall | 2 | 4 (2015) | Showroom |
| Hologram meja kerja | 3 | 5 (2019) | Work |
| Panel data holografik | 3 | 5 (2019) | Lab |

Tambahan: warna vignette siang ikut era (hijau LCD -> cyan AI -> ungu foldable) lewat `OfficeLook.setEra()`.
Tier kualitas "low" melewati benda beranimasi/transparan.

File: `OfficeProgress.js` (aturan), `OfficeModern.js` (benda 3D), hook di `OfficeScene.rebuildRoom()`.
Logika game, rute staf, dan kartu tidak berubah. Tes: `tools/office-progress-test.mjs`, `tools/office-smoke.mjs`
(stub THREE diperbaiki: Object3D, InstancedMesh, setRGB; skenario tahun 2000/2012/2026).
