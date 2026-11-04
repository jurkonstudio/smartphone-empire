# Event pilihan + quest era 2000–2002
Salin file ke lokasi yang sama (path relatif dari akar repo). Tidak ada langkah build.

## Baru
- `src/data/era-events.data.js` — 11 event historis, 29 pilihan (id + en). Semua angka balance ada di sini.
- `src/systems/EraEventSystem.js` — penjadwal, keputusan, dan efek (kas, reputasi, pengali permintaan sementara).
- `src/ui/panels/EraEventModal.js` — modal keputusan + layar hasil. Teks efek dibuat otomatis dari data.
- `tools/era-events-test.mjs` — tes headless: `node tools/era-events-test.mjs src`.

## Diubah
- `src/systems/QuestSystem.js` — 9 quest era. Field baru `from` / `until` / `requires` / `i18n`; quest bertenggat yang lewat batas hangus tanpa hadiah (`quests.expired`). `localizeQuest()` diekspor.
- `src/systems/ProductSystem.js` — `_computeDailyDemand` mengalikan `getEraEventDemandFactor` (1.0 bila tak ada event aktif; dijepit 0.6–1.5).
- `src/core/GameState.js` — default `events.{queue,seen,mods}` dan `quests.expired` (save lama aman lewat hydrate).
- `src/main.js` — instansiasi + start `EraEventSystem`, handler `eraevent:pending` (jeda game, kembalikan setelah selesai), `__game.eraEvents`.
- `src/ui/modal.js` — `Modal.hasOpen()` (event tidak menimpa modal lain).
- `src/ui/panels/QuestsPanel.js`, `ProgressPanel.js` — judul/deskripsi quest mengikuti bahasa.
- `src/data/balance.data.js` — `questRewards` untuk quest era.
- `src/config/event.md`, `README.md` — dokumentasi event dan roadmap.

## Perilaku
- Event muncul pada bulan yang disejajarkan dengan headline berita yang sudah ada. Bila save dimuat setelah bulan itu tetapi masih dalam jendela `until`, event tetap muncul; lewat jendela = hangus.
- Event tidak muncul selama tutorial berjalan. Bila beberapa event jatuh di bulan yang sama, mereka mengantre.
- Game dijeda saat modal muncul dan kembali ke kecepatan semula setelah layar hasil ditutup.
- Setiap event punya satu pilihan gratis, jadi pemain tak pernah terkunci walau kas habis. Biaya dibayar lewat WalletService (mengikuti mode bayar uang/SIL).

## Quest era (aktif bertahap; Home menampilkan 3 teratas)
2000: Dua lini produk, Pengambil keputusan (2 event), Kontrak operator pertama (pilih OEM di event 3G atau paket operator di event GPRS), Jual 5.000 unit.
2001: Ponsel layar warna pertama, OS buatan sendiri, Reputasi 20, Jual 50.000 unit (setelah 5.000).
2002: Ponsel kamera 1,3 MP.
Semua butuh `first_product` selesai dan hangus tanpa hadiah setelah akhir 2001/2002 (lihat `until`).

## Yang perlu diputuskan pemilik game
- Hadiah SIL quest era (total 8 SIL, di `balance.data.js`). SIL bernilai ~$2.500 di 2000; set `silicon: 0` bila tak mau menambah penerbitan SIL.
- `patches.json` belum diubah (tidak ada nomor versi yang pasti). Tambahkan entri rilis sesuai versi yang Anda pakai.
- Angka efek event (±3–15% permintaan, biaya $2–14K) belum dikalibrasi lewat bermain; semuanya ada di `era-events.data.js`.
