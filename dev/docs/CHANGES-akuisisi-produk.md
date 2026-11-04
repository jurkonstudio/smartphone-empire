# Akuisisi: lihat produk & margin rival

Di HQ > Invest > Akuisisi Merek, setiap merek rival kini punya:
- ringkasan di baris target (jumlah produk aktif, margin rata-rata), dan
- tombol **Lihat produk & margin** yang membuka modal berisi SEMUA produk merek itu
  (produk ikonik + rilis AI), lengkap dengan data dan margin.

Daftar target tidak lagi dibatasi 6 merek; sisanya ada di "Tampilkan N merek lainnya".

## Isi modal
KPI merek (unit/bln, pendapatan/bln, laba kotor/bln, margin rata-rata, penyumbang laba terbesar),
filter (Dijual / Semua / Berakhir / Mendatang), urut (Status / Margin / Laba / Harga), dan kartu
per produk yang bisa dibuka: tahun-bulan rilis, umur, tier, status, sumber data, boost pangsa,
harga, biaya/unit, margin/unit, margin %, volume/bln, pendapatan/bln, laba/bln, indeks RAM.

## Penting: angka adalah ESTIMASI
Data rival tidak punya harga/biaya asli. `src/data/competitor-products.model.js` menghitungnya dari
harga rata-rata pasar, tier, watak merek, umur produk (siklus hidup), dan indeks RAM 2027-2029.
Semua pengali ada di `PRODUCT_MODEL` agar mudah dikalibrasi.

## File
- BARU `src/data/competitor-products.model.js` (murni, bisa diuji dari Node)
- BARU `src/ui/panels/AcquisitionProductsModal.js`
- UBAH `src/ui/panels/InvestPanel.js`, `src/main.js` (import + handler `data-econ-acq-products`)
