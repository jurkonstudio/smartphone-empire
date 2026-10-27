# Peta Manufaktur 3D v2027.80 — detail industri realistis
Salin file ke path yang sama (timpa ManufactureScene.js, tambah ManufactureDetail.js).

- BARU src/ui/manufacture/ManufactureDetail.js (buildHallDetail, buildYardDetail)
- UBAH src/ui/manufacture/ManufactureScene.js (import modul, hallDetail/yardDetail, hall() menerima tk/on)

Tambahan visual (semua pabrik):
- Pilaster sudut + plinth beton, parapet atap, unit HVAC dengan kipas berputar (lebih cepat saat produksi), ventilasi kecil.
- Skylight kaca, kanopi pintu berlampu + papan aksen, pipa utilitas + penyangga + talang air di dinding timur.
- Halaman: garis tepi pad kuning putus-putus, bollard, hidran, trafo listrik (mulai level 2).
- Pabrik SoC: tanpa detail atap (atap gergaji dipertahankan). Pabrik Layar: tanpa skylight/pintu. Hub & Assembly: logika lama tetap.

Performa: bentuk statis digabung per material (mergedBoxes); hanya kipas atap yang beranimasi. Logika game tidak diubah.
Diuji: sintaks, tools/scene-smoke.mjs lulus, uji unit builder level 1-5 (tanpa NaN). Belum diuji di browser sungguhan.
