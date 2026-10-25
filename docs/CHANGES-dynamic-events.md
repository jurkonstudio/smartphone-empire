# Insiden Dinamis (event pilihan acak 2000–2050)

Event pilihan sebelumnya hanya skrip 2000–2002. Sekarang ada **insiden acak** yang muncul sepanjang game
sesuai kondisi perusahaan, memakai antrean, modal, dan jeda game yang sama dengan event era.

## File
BARU : `src/data/dynamic-events.data.js`, `tools/dynamic-events-test.mjs`
GANTI: `src/systems/EraEventSystem.js`, `src/ui/panels/EraEventModal.js`, `src/config/event.md`
`main.js` tidak berubah (handler `eraevent:pending` sudah generik).

## Cara kerja
- Tiap bulan, bila tidak ada event menunggu: peluang 22% ada insiden, minimal 5 bulan antar insiden,
  tidak muncul di 120 hari pertama, dan hanya bila syarat (`when`) terpenuhi (saat ini: ada ponsel berstatus `selling`).
- Tiap insiden punya `minYear/maxYear`, `weight`, `cooldownMonths` (tidak berulang terlalu cepat).
- **Biaya dan kas diskalakan** dengan rata-rata omzet 3 bulan terakhir (skala 1x s/d 300x dari omzet $30K/bulan)
  supaya tetap relevan di 2000 maupun 2025. Skala disimpan saat dijadwalkan, jadi stabil setelah load save.
- **Pilihan berisiko**: `risk: { p, success:{effects,outcome}, fail:{effects,outcome} }`. Modal menampilkan peluang
  dan dampak tiap cabang; layar hasil menampilkan "Berhasil / Gagal".
- Selalu ada satu pilihan gratis, jadi pemain tidak pernah terkunci.

## 5 insiden awal
Baterai panas (recall / firmware / abaikan), gangguan pemasok, kontrak eksklusif operator (2000–2012),
gugatan paten (mulai 2002), ritel bangkrut. Semuanya dwibahasa ID/EN.

## Menambah insiden
Tambah objek ke `DYNAMIC_EVENTS` (format di header file). Syarat baru: tambahkan nama di `DYNAMIC_WHEN`
dan cabang di `EraEventSystem._cond`.

## Save lama
Field baru di `data.events`: `dynLast`, `dynScale`, `dynLastAny` — dilengkapi otomatis oleh `ensureEraEventState`.

## Uji
`node --experimental-default-type=module tools/dynamic-events-test.mjs src`
(validasi data, 20 simulasi x 600 bulan: frekuensi ~1,4/tahun, jarak min 5 bulan, tanpa NaN, semua insiden pernah muncul,
syarat tanpa ponsel dijual, save lama). `era-events-test`, `sim`, `econ-brakes`, `render` tetap lulus.
TIDAK diuji: tampilan modal di browser/perangkat asli, dan keseimbangan ekonomi lewat bermain nyata.
