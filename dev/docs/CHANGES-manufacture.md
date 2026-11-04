# Manufaktur: Pabrik SoC, Kamera, RAM
Salin isi zip ke root repo (path sama, timpa).

- Pabrik baru di panel Manufaktur: SoC (kategori chip, butuh fab), Kamera, RAM (butuh fab). Tiap pabrik 4 level: diskon harga, kapasitas, yield, perawatan, bonus spesifikasi (SoC +performa, Kamera +kualitas foto, RAM +kegunaan).
- Kategori komponen baru `ram` (10 modul LPDDR, 2000–2024), opsional di Desain (default "RAM Standar", tanpa biaya) dengan `ramId` di config produk.
- Stok pabrik dipakai saat rilis/restok untuk baterai, layar, SoC, kamera, RAM; kekurangan dibeli harga pasar.
- Panel: ringkasan (pabrik berdiri, perawatan/bulan, tunggakan, total stok) dan detail yield/perawatan/bonus per pabrik. Teks ID/EN.

## Tambahan: integrasi mockup & wizard
- Mockup tampak belakang menampilkan lencana "Internal" (SoC/Kamera/RAM/Baterai/Layar + level) untuk komponen dari pabrik yang sudah berdiri (`listInHouseParts` di PhoneMockup.js, style di style.css).
- Pratinjau wizard Desain menampilkan baris "Bonus pabrik" (mis. Performa +4%).

## Tambahan: pajak infrastruktur & margin
- Pajak properti + utilitas infrastruktur: 0,2%/bulan dari modal terpasang (biaya bangun + upgrade sampai level sekarang) untuk setiap pabrik komponen dan fab chip. Dipotong lewat EconomySystem (ikut pengali kesulitan, tampil di ringkasan bulanan dan `finance.history.breakdown.infraTax`). Konstanta di `material-plants.data.js`.
- Margin: stok surplus bisa dijual grosir (harga pasar x 0,92, kuota bulanan 40% kapasitas, harga turun sampai -35% saat kuota penuh). Omzet masuk laporan bulanan dan kena pajak laba. Biaya efektif = biaya internal / yield, jadi pabrik level rendah bisa rugi di jual grosir, level tinggi untung (skala = margin).
- Panel Manufaktur: pajak infrastruktur, hemat vs pasar, omzet grosir, margin jual per komponen, tombol "Jual grosir", sisa kuota.
- Wiring: `economy.setPlants(componentPlants)` di main.js; aksi `data-mf-action="sell"`.
