# Registry (tahap 2, di kartu Registrar panel Future)

Pemain melamar ekstensi domain sendiri. Terbuka mulai 2012 (`unlockYear` di `registry.data.js`). Satu lamaran sekali; banyak ekstensi bisa aktif.
Teks UI: English sumber, Indonesia terjemahan, bahasa lain jatuh ke English. Pemain hanya melihat tingkat peluang dari Asisten Bisnis, tanpa persen.

## Alur
1. **Pilih ekstensi** (prasetel: .web/.online populer, .tech/.shop/.music niche, .brand merek) dan **0-3 sponsor** ($15.000 per sponsor, tidak kembali).
2. **Lamar**: $185.000 + sponsor. Kas harus cukup juga untuk biaya tahunan pertama ($25.000).
3. **Evaluasi 12 bulan** (+3 bila diminta melengkapi, 20%, hanya menunda). Lolos: 70% dasar, +5 per sponsor (bagian sponsor maks 85%), +5 kas >= 3x biaya, +5 registrar terakreditasi > 2 tahun, maks 95%. Gagal: biaya hilang, ajukan lagi setelah 3 bulan.
4. **Keberatan**: 15% - 5 per sponsor. Tunda 6 bulan, pemain menang 40%.
5. **Kontensi**: populer 35%, niche 10%, merek 0%. Pemain pilih tawaran ($0,5 / 1 / 2 / 3 juta) melawan NPC acak $400 ribu-$3 juta. Menang membayar harga NPC (bukan tawaran). Kalah: biaya hilang. Mundur: refund 70%. Tidak memutuskan 30 hari = mundur. Lelang menambah 6-12 bulan.
6. **Kontrak**: tanda tangan di kartu (bukan halaman terpisah), bayar $25.000. Tawaran kedaluwarsa 30 hari tanpa refund.
7. **Uji teknis 3 bulan**, gagal 5% (ulang 2 bulan, sekali), lalu **sunrise 2 bulan**, **landrush 1 bulan**, **terbuka umum**.
8. **Pendapatan**: domain x harga/tahun / 12, dikurangi $25.000/12 + $6.000 per bulan per ekstensi. Domain tumbuh menuju batas (dikali `economyScale` 0,25). Merek tidak berpendapatan, tapi +4 reputasi saat terbuka umum.
Durasi pra-kontrak dibatasi 36 bulan.

## Hasil simulasi (tools/registry-test.mjs)
Niche 0 sponsor sekitar 62%, niche 2 sponsor sekitar 76% (rancangan: 60% dan 74%). Syaratnya: kas di bawah 3x biaya dan lelang dimenangkan sekitar 60%. Dengan kas tebal dan tawaran selalu tertinggi, hasilnya lebih tinggi (sekitar 69% dan 82%).

## Berkas
Baru: `src/data/registry.data.js`, `src/systems/RegistrySystem.js`, `src/ui/panels/RegistryPanel.js`, `src/data/i18n/registry.i18n.js`, `tools/registry-test.mjs`, dokumen ini.
Diubah: `src/systems/RegistrarSystem.js` (ekspor `sendIcannLetter`), `src/ui/panels/FuturePanel.js`, `src/ui/panels/InboxPanel.js` (tombol surat kontensi/kontrak), `src/data/i18n/index.js`, `src/main.js`, `tools/run-all.mjs`.
Save: `data.registry` (app, live, cooldownUntil, earned, last, draft), semua punya nilai bawaan.

## Belum ada / belum dicek
- Sponsor masih generik (tidak terhubung ke Kompetitor). Keberatan juga tidak memakai sponsor kompetitor sungguhan.
- Ekstensi sendiri belum menambah pasokan ke penjualan Registrar (margin ritel) dan belum ke App Store/Bank/Berita.
- Putaran 2008/2026 belum ada; hanya satu tahun buka (2012).
- Angka desain (harga, batas domain, biaya operasi, `economyScale`) belum dikalibrasi dengan bot simulasi.
- Belum dibuka di browser/ponsel; dites lewat Node (logika + render HTML).
- Tahap 3 (akses OS) dan tahap 4 (lobi) belum dikerjakan.
