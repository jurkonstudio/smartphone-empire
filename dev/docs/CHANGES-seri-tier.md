# Seri Rilis: Basic / Pro / Pro Max (kecanggihan & desain per varian)
Salin file-file berikut ke repo (path sama, timpa).

## Konsep
- Satu desain di wizard dirilis sebagai **seri** berisi 1–3 varian: Basic (wajib), Pro, Pro Max (opsional).
- Tiap varian punya **nama, harga, jumlah produksi, dan komponen sendiri**:
  - Kecanggihan: chip, layar, kamera, baterai.
  - Desain: bodi dan warna.
- Komponen yang dipilih harus sudah terbuka (tahun minimum dan riset), sama seperti langkah 2–3.
- Biaya desain seri dibayar sekali. Setiap varian dihitung dengan biaya komponennya sendiri.
- Kualitas, biaya per unit, dan harga minimum/maksimum dihitung dari komponen tiap varian.
- Bonus stat tetap per tier dihapus. Perbedaan datang dari pilihan komponen.

## Tier (src/data/product-tiers.data.js, BARU)
| Tier    | Bobot perakitan |
|---------|-----------------|
| Basic   | x1.00           |
| Pro     | x1.25           |
| Pro Max | x1.60           |

Bobot perakitan memengaruhi kapasitas dan jeda restock Pabrik Perakitan. Produk lama tanpa tier dianggap Basic.

## File
- BARU src/data/product-tiers.data.js
- UBAH src/systems/ProductSystem.js:
  - `_variantConfig` menimpa komponen per varian (displayId, cameraId, batteryId, chipId, bodyId, bodyColorId).
  - `_checkVariantParts` memvalidasi kategori, tahun minimum, riset, dan warna per varian.
  - `confirmTierFamily` dan `quoteTierFamily` memakai validasi dan konfigurasi per varian.
  - Bonus stat tier dihapus dari `computeStats` dan `computeUnitCost`.
- UBAH src/systems/AssemblySystem.js: kapasitas dan antrean berbobot tier.
- UBAH src/ui/panels/DesignWizard.js:
  - Panel "Komponen & desain" per varian (pilihan dari daftar yang sama dengan langkah 2–3).
  - Mockup dan harga saran ikut berubah saat komponen diganti.
  - Komponen Basic mengikuti langkah 2–3 sampai pemain mengubahnya di panel ini.

## Catatan
- Pengembangan tetap satu slot (satu seri dalam satu waktu).
- Antarmuka wizard belum diuji di browser.
