# v2027.73 — Peta Kampus: Perluasan Pulau + Distrik Baru

Cara pakai: salin isi zip ke root proyek, timpa file bernama sama.
STATUS: lolos `node --check`, `tools/check-syntax.mjs`, dan `node tools/campus-expansion-smoke.mjs` (THREE tiruan).
BELUM diuji di WebGL/browser nyata. Posisi dan ukuran objek adalah hasil hitungan, bukan hasil melihat layar.

## Yang berubah
| File | Perubahan |
|---|---|
| src/data/campus-expansion.data.js (BARU) | Data murni: 8 distrik perluasan + parameter pelebaran pulau (`EXPAND_GAIN`, `EXPAND_POWER`). |
| src/ui/campus/CampusExpansion.js (BARU) | Pembangun 3D distrik (±140 mesh, sebagian besar InstancedMesh). |
| src/ui/campus/CampusBuildings.js | `islandRadius` melebar ke timur/utara/selatan (sisi barat tetap). Footprint distrik jadi lahan terjaga (pohon, bukit, semak, lampu, bercak rumput menghindar). Tambah 9 kebun pohon kecil di tanah baru. `mesh` dan `instanced` kini diekspor. |
| src/ui/campus/CampusScene.js | Memasang distrik, lampu bloom malam, update animasi, dispose, batas geser kamera diperluas (maxX 27, minZ -23, maxZ 24), `quality.shadowHalf = 34`. |
| src/ui/campus/CampusLook.js | Frustum bayangan dapat diatur lewat `quality.shadowHalf` (bawaan 24, jadi ManufactureScene tidak berubah). |
| tools/campus-expansion-smoke.mjs (BARU) | Tes: sisi barat tidak bergeser, margin ke pantai, tidak menimpa gedung, tidak ada pohon di distrik, distrik terbentuk, dispose. |

## Ukuran pulau (jari-jari ke tepi rumput)
Timur 22 -> 30,4 | Utara 22 -> 26,2 | Selatan 22 -> 24,8 | Barat 20,6 (TIDAK berubah, jembatan Manufaktur aman).

## Distrik baru (dekoratif: tidak bisa di-tap, tanpa level/kartu info, logika game tidak disentuh)
- Timur: Kompleks Olahraga (lintasan lari, lapangan bergaris, gawang, tribun beratap, 4 lampu sorot).
- Timur: Kedai Pantai (kanopi, meja, payung), dermaga kayu bertiang pancang, perahu layar yang bergoyang pelan (3 perahu).
- Timur laut: Mercusuar belang merah-putih + rumah penjaga. Berkas cahaya berputar muncul saat malam.
- Utara: Taman Botani (rumah kaca berkaca tembus pandang, bedeng bunga, pergola, palem). Ladang Surya (18 panel miring).
- Selatan: Bundaran dengan patung cincin cahaya, Area Parkir (stall bergaris, mobil berwarna acak, stasiun EV), Amfiteater tribun melengkung.

## Tuning cepat
- Lebar pulau: `EXPAND_GAIN` (0 = pulau lama) di campus-expansion.data.js.
- Geser/ubah distrik: edit footprint di `CAMPUS_EXPANSION` dan koordinat di CampusExpansion.js (tes smoke akan memberi tahu bila menembus pantai atau gedung).
- Bayangan terasa kurang tajam di tier high: naikkan `shadowMap` high di CampusLook.js (2048 -> 3072).

## Rollback
Hapus 2 file baru, kembalikan CampusBuildings.js/CampusScene.js/CampusLook.js ke versi v72.
