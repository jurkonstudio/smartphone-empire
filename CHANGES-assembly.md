# Assembly (Pabrik Perakitan) — tab di Manufaktur + peta 3D
Salin isi zip ke root repo (path sama, timpa).

## Aturan
- Boleh mulai dibangun 2001 (peta 3D menampilkan konstruksi), baru BERPRODUKSI mulai 2002.
- Pekerja = kelompok headcount per peran (operator, QC, teknisi, supervisor), bukan individu. Level 1 ~120 orang, Lv4 ~1.500.
- Sebelum beroperasi, produksi tetap lewat kontrak manufaktur tanpa penalti (ekonomi awal tidak berubah).
- Setelah beroperasi: biaya restock turun 5/9/13/17% (dikali tingkat staf), jeda produksi = antrean / kapasitas, kapasitas dipengaruhi staf operator, teknisi, moral, lembur. QC menekan cacat (2-6%).
- Gaji + perawatan dipotong harian; tunggakan menurunkan moral.

## File
- BARU src/data/assembly.data.js, src/systems/AssemblySystem.js, src/ui/panels/AssemblyPanel.js
- UBAH src/core/GameState.js (state `assembly` + hydrate), src/systems/ProductSystem.js (biaya + jeda restock), src/main.js (wiring + aksi data-asm-action), src/ui/panels/ManufacturePanel.js & ResearchPanel.js (bagian Assembly), style.css (gaya asm-*)
- UBAH src/ui/manufacture/ManufactureLogic.js (petak `assembly`, kartu info, aksi), ManufactureScene.js (pabrik 3D, daratan tambahan di selatan, jalan akses, perlebar bayangan)
Peta: pulau diperluas ke selatan hanya di sisi barat/tengah; dermaga Pusat Logistik tetap di air.
Catatan: adegan 3D belum diuji di browser/WebGL (hanya uji sintaks + simulasi builder dengan THREE tiruan).
