# Peta kampus 3D (Home) — perbaikan visual

Cara pakai: salin isi zip ini ke root proyek, timpa file dengan nama yang sama.

| File | Perubahan |
|---|---|
| src/ui/campus/CampusBuildings.js | Hapus ~150 gedung abu-abu acak di pinggiran (distrik kota 100x100) dan 6 blok kota "sprawl". Ganti dengan pulau organik di tengah laut: rumput, pantai pasir, pasir basah, busa ombak, perairan dangkal, laut dalam, riak ombak, batu pantai, bukit rendah, hutan berkelompok (+43 pohon), bercak rumput. |

Tidak berubah: semua gedung fungsional (HQ, Lab, Pabrik, Toko, OS, Monumen, Billboard, Akademi, Arena, Pelabuhan),
posisi slot, jalan, teluk, monorail, kincir angin, level/aturan game, kontrol kamera, kartu info.

Catatan: gedung kota dimatikan lewat `SPRAWL_SPOTS = []` (kode `buildSprawl` dibiarkan agar kompatibel).
Bentuk pantai diatur `ISLAND_R` / `islandRadius()`; bukit di `HILLS`; pohon pinggiran di `TREE_SPOTS`.
Lebih ringan dari sebelumnya: ratusan gedung instanced diganti beberapa lempengan + 4 instanced mesh kecil.
