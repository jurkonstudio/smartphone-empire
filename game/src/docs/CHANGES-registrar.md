# Registrar (panel Future)

Kartu baru di panel Future. Terbuka mulai 2000 (reseller). Akreditasi registrar butuh tahun 2003 dan riset 3G (`net_3g`, yang baru bisa selesai 2005, jadi efektifnya 2005).
Semua teks UI memakai kamus i18n: English sebagai sumber (singkat), Indonesia sebagai terjemahan. Bahasa lain jatuh ke English.

## Alur
1. **Reseller** (opsional): tanpa biaya, margin tipis, pangsa maksimal 2%.
2. **Pengajuan ICANN**: berkas + $3.500 + asuransi $6.000/tahun (wajib), kas minimal $70.000 + biaya. Kalau kas kurang, tombol kirim nonaktif.
3. **Review** 2 bulan (±1). Hasil lewat surat di Pesan: diterima, diminta melengkapi, atau ditolak.
   - Diminta melengkapi (25%): kirim dokumen dalam 30 hari, gratis, review +1 bulan, lalu pasti diterima. Dibiarkan lewat 30 hari: berkas ditutup, biaya hilang.
   - Ditolak: biaya hilang, ajukan ulang setelah 3 bulan.
4. **Terima Kontrak**: halaman tanda tangan RAA + escrow data, bayar biaya tahunan $4.000. Tawaran kedaluwarsa 30 hari (tanpa pengembalian).
5. **Registry** (.com): onboarding 1 bulan, deposit grosir $5.000 (tertahan). Baru setelah aktif bisa menjual.
6. **Penjualan**: pangsa tumbuh 0,25 poin/bulan, harga jual diatur 50%-200% (jeda 3 bulan). Harga tidak ikut grosir otomatis; kalau grosir naik dan harga tidak diperbarui, margin menipis.
7. **Kepatuhan**: laporan penyalahgunaan yang dibiarkan = +1 poin/bulan. Poin 3 = audit (Peringatan), 6 = Dicabut. Poin turun 1 per 3 bulan bersih. Staf kepatuhan (maks. 2) memangkas poin baru 30% per staf. Perpanjangan tiap 5 tahun.

## Peluang (disembunyikan dari pemain)
Peluang ditolak = 5% + 15% (kas < 1,5× syarat) + 20% (ada catatan pelanggaran) + 10% (reputasi < 40), maksimal 60%.
Akhirnya diterima = 1 − peluang ditolak: sekitar 95% kondisi normal, sekitar 50% kondisi lemah.
Pemain hanya melihat kalimat Asisten Bisnis (tinggi/cukup/rendah + alasan), tanpa persen.

## Angka
Semua di `src/data/registrar.data.js`. **Fakta**: urutan proses ICANN, biaya lamar $3.500, modal kerja $70.000, biaya tahunan $4.000, $0,18 per transaksi, masa 5 tahun, harga grosir .com, total domain dunia (titik terverifikasi). **Angka desain**: peluang, durasi review, batas pangsa, skor kepatuhan, tarif staf, deposit registry, `economyScale`.

## Berkas
Baru: `src/data/registrar.data.js`, `src/systems/RegistrarSystem.js`, `src/ui/panels/RegistrarContract.js`, `src/data/i18n/registrar.i18n.js`, `tools/registrar-test.mjs`, dokumen ini.
Diubah: `src/data/future-panels.data.js` (kartu `registrar`), `src/data/i18n/index.js`, `src/data/i18n/research-data.en.js`, `src/ui/panels/FuturePanel.js`, `src/services/InboxService.js` (surat ICANN dari `data.registrar.letters`, teks dibuat saat ditampilkan), `src/ui/panels/InboxPanel.js` (jenis ICANN + tombol Lihat kontrak), `src/main.js`, `tools/run-all.mjs`.

## Data di save (semua punya nilai bawaan)
`data.registrar`: stage, reseller, share, priceMult, priceRef, app, acc, registries, letters, violations, earned.

## Belum ada / belum dicek
- **Belum dikerjakan**: tahap Registry (ekstensi sendiri, sponsor, kontensi/lelang), jalur akses OS (tahap 3), lobi (tahap 4), integrasi App Store/Kompetitor/Bank/Berita/Tim, tahun 2008/2012/2026.
- Staf kepatuhan dipilih langsung di kartu Registrar (belum terhubung ke panel Tim).
- `economyScale` (0,25) dan batas pangsa 5% belum dikalibrasi dengan bot simulasi.
- Belum dibuka di browser/ponsel sungguhan; dites lewat Node (logika + render HTML).
- Teks di panel Pesan lain masih Indonesia (kondisi lama); hanya surat ICANN yang mengikuti bahasa.
