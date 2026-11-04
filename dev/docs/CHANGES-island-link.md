# Jembatan Kampus <-> Manufaktur (v2027.65)
Salin isi zip ke root repo (path sama, timpa). Tidak ada perubahan logika game/ekonomi/state.

| File | Status | Isi |
|---|---|---|
| src/ui/campus/IslandLink.js | BARU | Konstanta jarak pulau, builder jembatan (tanjakan, dek, pilar, pagar, lampu, gapura), siluet Pulau Manufaktur & Pulau Kampus |
| src/ui/campus/CampusScene.js | REPLACE | Memasang siluet Manufaktur (barat) + jembatan; batas geser kamera ke barat; tema; dispose |
| src/ui/campus/CampusLife.js | REPLACE | Jalan barat diperpanjang lewat jembatan; mobil naik-turun mengikuti dek; +4 mobil |
| src/ui/campus/CampusControls.js | REPLACE | Opsi `bounds` (batas geser tak simetris). Tanpa `bounds` = perilaku lama (Office tidak berubah) |
| src/ui/campus/CampusBuildings.js | REPLACE | Pohon/bukit/batu di koridor jembatan dikosongkan (3 pohon, jalur z = 0 sebelah barat) |
| src/ui/manufacture/ManufactureScene.js | REPLACE | Memasang siluet Kampus (timur) + jembatan; truk menyeberang sampai jalan Kampus; batas geser ke timur; tema; dispose |

Tata letak: Manufaktur pusat x = -55 (dari Kampus), jalan raya z = 0 lurus dengan jalan barat Kampus. Selat air ~12 unit.
Ubah `LINK.OFFSET` di IslandLink.js untuk menggeser jarak pulau (jembatan menyesuaikan otomatis).
