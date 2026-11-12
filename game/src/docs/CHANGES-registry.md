# Registry (tahap 2, di kartu Registrar panel Future)

Pemain melamar ekstensi domain sendiri. Putaran: 2008, 2012, 2026 (`REGISTRY_ROUNDS` di `registry.data.js`). Lamaran membawa biaya putaran saat diajukan. Satu lamaran sekali; banyak ekstensi bisa aktif.
Teks UI: English sumber, Indonesia terjemahan, bahasa lain jatuh ke English. Pemain hanya melihat tingkat peluang dari Asisten Bisnis, tanpa persen.

## Alur
1. **Pilih ekstensi** (prasetel: .web/.online populer, .tech/.shop/.music niche, .brand merek) dan **0-3 sponsor dari kompetitor aktif** ($15.000 per sponsor, tidak kembali). Sponsor yang menarik diri tidak bisa dipilih.
2. **Lamar**: biaya putaran (2012: $185.000; 2008 dan 2026 sementara) + sponsor. Kas harus cukup juga untuk biaya tahunan pertama ($25.000).
3. **Evaluasi 12 bulan** (+3 bila diminta melengkapi, 20%, hanya menunda). Lolos: 70% dasar, +5 per sponsor (dikali bobot pangsa kompetitor, 0,5-1,5; bagian sponsor maks 85%), +5 kas >= 3x biaya, +5 registrar terakreditasi > 2 tahun, maks 95%. Gagal: biaya hilang, ajukan lagi setelah 3 bulan.
4. **Keberatan**: 5% + 4% per kompetitor besar (pangsa ≥ 8%) yang TIDAK jadi sponsor (maks 30%). Keberatan memakai nama kompetitor itu. Tunda 6 bulan, pemain menang 40%.
5. **Kontensi**: populer 35%, niche 10%, merek 0%. Penawar: kompetitor besar yang bukan sponsor (kalau tidak ada, pelamar NPC). Pemain pilih tawaran ($0,5 / 1 / 2 / 3 juta) melawan penawar $400 ribu-$3 juta. Menang membayar harga NPC (bukan tawaran). Kalah: biaya hilang. Mundur: refund 70%. Tidak memutuskan 30 hari = mundur. Lelang menambah 6-12 bulan.
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

## Perubahan terbaru: putaran + sponsor kompetitor
- Putaran 2008, 2012, 2026 (`REGISTRY_ROUNDS`). 2012 = fakta ($185.000). 2008 ($100.000) dan 2026 ($227.000) = angka SEMENTARA, perlu dicek ke sumber resmi ICANN dan dokumen desain. Catatan: di dunia nyata 2008 hanya menetapkan aturan; pelamaran dibuka 2012.
- Sponsor = kompetitor aktif (`getCompetitorCandidates`), disimpan di `draft.sponsorIds` dan `app.sponsorIds`.
- Bobot sponsor mengikuti pangsa kompetitor. Pesaing besar yang bukan sponsor bisa keberatan (nama tampil di surat) atau menawar (nama tampil di surat kontensi).
- Lamaran menyimpan `app.fee` dan `app.round`, sehingga pembatalan memakai biaya lamaran asli.
- Save lama (sponsor berbentuk angka) dibersihkan otomatis ke daftar kosong.
- `tools/registry-test.mjs` ditulis ulang untuk API baru (`node tools/registry-test.mjs`: semua lulus).

## Belum ada / belum dicek
- Ekstensi sendiri belum menambah pasokan ke penjualan Registrar (margin ritel) dan belum ke App Store/Bank/Berita.
- Angka 2008 dan 2026 belum diverifikasi; angka desain sponsor/keberatan belum dikalibrasi bot simulasi.
- Angka desain (harga, batas domain, biaya operasi, `economyScale`) belum dikalibrasi dengan bot simulasi.
- Belum dibuka di browser/ponsel; dites lewat Node (logika + render HTML).
- Tahap 3 (akses OS) dan tahap 4 (lobi) belum dikerjakan.
