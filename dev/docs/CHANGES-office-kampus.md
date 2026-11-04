# v2027.54a — Kantor di dalam area kampus + tata letak lebih rapi

Tab **Kampus** (Home) memakai `OfficeScene.js`. Sebelumnya kantor berdiri di pulau kecil di tengah laut. Sekarang kantor berdiri di dalam **area kampus**.

## File pengganti (replace)
- `src/ui/office/OfficeScene.js`
- `src/ui/office/OfficeConfig.js` (hanya MENAMBAH 7 kunci warna; tidak ada yang dihapus karena `NeighborSilhouette.js` dan `ManufactureScene.js` masih memakai warna pulau/laut)
- `tools/office-smoke.mjs` (tes baru, bukan bagian game)

## Lingkungan (tidak ada laut/pulau lagi)
- Halaman kampus (rumput + bibir tanah), plaza paving di sekeliling gedung, trotoar.
- Jalan masuk dari gerbang depan ke pintu utama kantor (x = -3), jalan lintang depan, jalan kiri & belakang.
- Gedung kampus tetangga (perpustakaan, aula, student center, asrama, lab annex) hanya di sisi BELAKANG dan KIRI, karena kamera melihat dari +x,+z; sisi depan/kanan hanya benda rendah supaya denah kantor tidak tertutup.
- Taman depan: semak, 4 bangku, 4 tiang lampu, kolam air mancur, pohon di planter dan di tepi halaman, tiang bendera, gerbang depan.
- Warna mengikuti tema terang/gelap; jendela gedung tetangga ikut menyala di tema gelap.

## Gedung kantor
- Podium bertingkat (plaza -> undakan -> lantai kantor).
- Pintu utama di dinding depan (celah 1 unit, dua tiang, keset, tangga) sejajar lorong kantor.
- Kusen + ambang jendela, lis atas (cornice) di dinding tinggi.

## Tata letak lebih rapi
- Meja staf: dua baris pertama diisi per kolom (pasangan meja) dari tengah ke luar. Tim kecil membentuk satu blok rapi dekat pintu ruangan, bukan satu baris panjang + baris meja bayangan. Meja ke-13 dst. mengisi baris 3-5 seperti grid lama.
- Lobi di depan pintu utama (karpet + 2 tanaman) selama baris depan masih kosong (kapasitas <= 12 meja).
- Warna lantai antar ruangan diseragamkan (dicampur 40% ke netral); ruangan masih bisa dibedakan lewat label dan perabot.
- Tutup atas partisi seragam; kolam cahaya malam berbentuk persegi mengikuti ruangan (sebelumnya lingkaran besar yang menumpuk antar ruangan).

## Tidak berubah
Ukuran/posisi ruangan, `ROOM_DEFS`, lorong & rute jalan staf (`AISLES`, `CORRIDORS`, `DOOR_*`), kartu info, chip ruangan, kamera, efek event, logika game.

## Tes
`node tools/office-smoke.mjs src` memakai THREE & DOM tiruan (tanpa WebGL): adegan terbentuk untuk 6 dan 30 staf, tidak ada mesh bermaterial undefined, update/tema/bahasa/dispose berjalan, tidak ada "gagal bangun ruangan".
Jumlah mesh: 633 -> ~637 (6 staf), 1264 -> ~1167 (30 staf).

## Belum diuji
Tampilan di WebGL sungguhan di HP (lingkungan ini tanpa jaringan dan tanpa three.js). Pratinjau di `preview/` dirender dengan rasterizer sederhana dari data mesh yang sama; pencahayaan, bayangan nyata, dan tekstur label berbeda dari di game.
