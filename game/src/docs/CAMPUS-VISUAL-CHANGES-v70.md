# v2027.70 — Peta Kampus: kontras siang + detail tanah/gedung

Cara pakai: salin isi zip ke root proyek, timpa file bernama sama.

| File | Perubahan |
|---|---|
| style.css | `.card.home-map{padding:0}` (kanvas kini memenuhi bingkai); `.map-hint` jadi pil kontras |
| src/ui/campus/CampusLook.js | Cahaya siang: hemi turun, matahari naik, AO lebih kuat (warna tidak pucat) |
| src/ui/campus/SeaWater.js | Kilau & buih laut terbuka dikecilkan (bintik putih berkurang) |
| src/ui/campus/CampusScene.js | Anchor label +1.1 (tidak menutupi atap) |
| src/ui/campus/CampusBuildings.js | Role `grass3`; `DETAIL` (bercak rumput, halaman paving, batu pijakan, semak sudut, bunga, bangku, lampu); lampu halaman masuk `LAMP_SPOTS` |
| src/ui/campus/CampusControls.js | Zoom awal & tombol reset 1.0 -> 1.15 (`HOME_ZOOM`) |
| src/ui/manufacture/ManufactureScene.js, src/ui/office/OfficeScene.js | class `map-hint` |

Tuning cepat: jumlah/lokasi detail ada di blok `DETAIL` (CampusBuildings.js); zoom awal di `HOME_ZOOM`.
Untuk mematikan detail: ganti `addDetail(g, A, THREE);` di buildGround menjadi komentar.
