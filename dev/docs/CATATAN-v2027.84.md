# Patch v2027.84 — manusia & kendaraan Peta Kampus 3D lebih nyata

Berkas berubah (timpa ke proyek, path sama):
- src/ui/campus/CampusPeople.js  (ditulis ulang)
- src/ui/campus/CampusLife.js    (blok mobil/bus diganti + motor + animasi roda)
- tools/people-test.mjs          (uji disesuaikan + uji baru)

## Pejalan kaki
- Sendi lutut dan siku (kaki/lengan dua ruas), leher, sepatu, mata.
- 5 gaya kepala: rambut pendek, rambut panjang, kerudung, topi, cepol.
- Tinggi bervariasi, termasuk anak (0.78). Lengan baju pendek/panjang.
- Sebagian menunduk menatap ponsel sambil berjalan.
- Langkah: lutut menekuk hanya saat kaki diayun ke depan, lengan berlawanan, badan condong ke depan dan memuntir halus.
- Hujan: pemegang payung mengangkat lengan kanan, payung miring di atas kepala (ponsel disimpan).
- API publik sama (add/pose/endFrame/setRain/list). Field baru di objek orang: torso, headG, kneeL/R, elbowL/R, phone.

## Kendaraan
- Roda berputar sesuai jarak tempuh (ban + palang pelek).
- 3 model mobil (sedan, SUV, hatchback), kaca, lampu depan, lampu belakang yang lebih terang di malam hari.
- Bus: jendela samping, kaca depan/belakang, papan tujuan menyala, garis putih, AC atap.
- BARU 3 motor berpengendara berhelm (di jalan selatan dan barat).
- Bayangan kontak di jalan; kendaraan miring mengikuti tanjakan jembatan.
- Cat dipakai bersama per warna (material tidak membengkak).

## Biaya (perlu dicek di HP)
- Mesh meningkat: orang ~10 -> ~18-22, mobil 5 -> 15-21 (draw call tidak di-instance).
- Tier 'low' (tanpa shadow map, A.realShadows = false) otomatis memakai model lebih ringan: tanpa mata, palang pelek, dan bayangan kontak.
- Jika terasa berat: kurangi jumlah addWalker/addCar di CampusLife.js.

## Pengujian
- node tools/people-test.mjs, campus-expansion-smoke.mjs, scene-smoke.mjs, check-syntax.mjs: lulus.
- Belum dilihat di WebGL/browser sungguhan (lingkungan ini tidak bisa mengunduh Three.js). Bentuk sudah diperiksa lewat render sederhana dari kode asli.

## Usul catatan rilis (patches.json, belum saya ubah)
id: "Pejalan kaki dan kendaraan di Peta Kampus lebih nyata: orang punya sendi, gaya rambut/kerudung/topi, ada yang menatap ponsel; mobil, bus, dan motor berpengendara punya roda berputar, kaca, dan lampu."
en: "Pedestrians and vehicles on the Campus map look more real: people have joints, hair/headscarf/cap styles, some look at their phones; cars, buses, and motorbikes with riders have spinning wheels, windows, and lights."
