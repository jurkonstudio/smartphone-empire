# Audit logika & perbaikan (build 0.2.14)

## Temuan dan perbaikan
1. **HPP tidak masuk laba-rugi/pajak** (EconomySystem, ProductSystem). Biaya produksi dibayar langsung dari kas tanpa dicatat,
   sehingga "net" bulanan melebihi kas riil (A/B 2007-2008: net dilaporkan $59,4jt vs kas naik $25,6jt) dan pajak 15% dihitung dari angka salah.
   Perbaikan: ProductSystem emit `economy:add-cogs` saat unit terjual; EconomySystem mengurangkan dari laba kena pajak (kas tidak dipotong dua kali).
   Setelah perbaikan: net $32,9jt vs kas naik $30,6jt.
2. **Pajak tanpa pengalihan rugi.** Ditambah `finance.taxLossCarry`: rugi bulan sebelumnya mengurangi laba kena pajak berikutnya.
3. **Bunga pinjaman dikali pengali kesulitan** padahal bank mencatat bunga asli. Sekarang hanya biaya operasi yang dikali.
Field baru (`monthCogs`, `taxLossCarry`) aman untuk save lama (hydrate memakai nilai default).

## Pengujian
- `node tools/accounting-test.mjs src` (baru, 11 cek) lulus; terdaftar di `npm test`.
- Suite bawaan: 49 lulus, 3 gagal (sama seperti sebelum patch: tutorial-flow, people-test, office-smoke = tes basi/tiruan THREE).
- Chromium: permainan nyata 2000-2026 dengan bot, semua tab dibuka berkala: 0 error JS.

## Belum ditangani / perlu keputusan
- Tes basi: `tutorial-flow`, `people-test`, `office-smoke`.
- `assets/audio/select.mp3` tidak ada (404; AudioService sudah menoleransi).
- Dugaan belum terbukti: permintaan tiap produk memakai permintaan dasar penuh dan hanya dibatasi plafon total.
- Peta 3D tidak diuji (THREE dari CDN, sandbox offline).
- Keseimbangan: pajak efektif turun dan laba tampak lebih jujur; cek ulang tingkat kesulitan bila perlu.
