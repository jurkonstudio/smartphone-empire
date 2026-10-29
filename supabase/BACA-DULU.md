# Supabase — urutan menjalankan

Buka **Supabase Dashboard → SQL Editor → New query**, tempel isi file, klik **Run**.
Jalankan **berurutan**, satu file satu kali. Semua file aman diulang (idempoten).
Hasil "Success" → lanjut ke file berikutnya. Jika error: berhenti, jangan lanjut, kirim teks errornya.

| # | File | Isi | Wajib? |
|---|------|-----|--------|
| 01 | `01-inti-game.sql` | Profil dasar, save cloud (1 slot), ringkasan save, storage foto | **Wajib** |
| 02 | `02-sil-dompet.sql` | Dompet SIL, ledger, harian, quest, belanja anti-ganda, refund | **Wajib** |
| 03 | `03-profil-leaderboard.sql` | Nama perusahaan unik, ID pemain 8 digit, leaderboard | **Wajib** |
| 04 | `04-pembayaran-transfer.sql` | Pesanan top-up (GoPay/QRIS manual), kirim SIL antar pemain | **Wajib** (pembayaran) |
| 05 | `05-admin-inti.sql` | Admin, setujui/tolak pesanan, atur SIL, terjemahan | **Wajib** (agar admin bisa menyetujui pembayaran) |
| 06 | `06-admin-data-pemain.sql` | Panel /031411/: dashboard & data pemain | Opsional (panel admin) |
| 07 | `07-admin-aksi-sistem.sql` | Panel /031411/: blokir, hapus save, info sistem, audit SIL | Opsional (panel admin) |
| 08 | `08-jadikan-admin.sql` | Jadikan akunmu admin (**ganti email dulu**) | **Wajib** (sekali) |
| 09 | `09-pesan-inbox.sql` | Pesan pemain: notifikasi SIL masuk otomatis + pesan/broadcast dari panel admin | Opsional (fitur Pesan) |
| 10 | `10-pesan-antar-pemain.sql` | Pesan antar pemain (dengan blokir) | Opsional (setelah 09) |
| 10 | `10-tukar-sil.sql` | Tukar SIL menjadi uang di game | Opsional (tanpa ini tombol tukar gagal, SIL tidak terpotong) |
| 11 | `11-validasi-leaderboard.sql` | Validasi leaderboard di server | Opsional |
| 12 | `12-level-kredibilitas-reward.sql` | Level, kredibilitas, dan hadiah | Opsional (setelah 09, 10, 11) |
| 13 | `13-diagnosa-leaderboard.sql` | Diagnosa leaderboard (hanya baca) | Opsional |
| 14 | `14-nama-save-unik.sql` | Nama perusahaan unik juga di jalur save (trigger game_saves) | **Wajib** (setelah 03) |
| 15 | `15-level-perusahaan.sql` | Level perusahaan dihitung & disimpan di server (leaderboard/profil) | **Wajib** (setelah 12) |
| 16 | `16-diagnosa-skema.sql` | Diagnosa skema (hanya baca) | Opsional |
| 17 | `17-perbaiki-view-leaderboard.sql` | Bangun ulang view `public_profiles` (jalankan bila 16 melaporkan kolom view hilang; ulangi setelah menjalankan 03 atau 11 lagi) | Opsional (setelah 11, 12, 15) |
| 18 | `18-izin-tabel-save.sql` | GRANT tabel save/profil/dompet untuk pemain (wajib di proyek Supabase baru; tanpa ini save tidak tersimpan) | **Wajib** |
| 19 | `19-kunci-topup-server.sql` | Kunci Top Up di server (flag `topup_open`, bawaan terbuka) | Disarankan (setelah 04 dan 05) |
| 15b | `15b-uji-paritas-level-perusahaan.sql` | Uji paritas rumus level perusahaan (hanya baca) | Opsional (setelah 15) |
| 20 | `20-blog.sql` | Blog berita: artikel, jadwal rilis, komentar, jajak pendapat, bucket `blog-media` | Opsional (blog di `/`; butuh 08 dulu) |

Minimum agar game tidak crash + pembayaran jalan: **01 → 05, lalu 08**. File 06–07 melengkapi panel admin.

## Proyek lama (game sudah berjalan)
Cukup jalankan 01 → 08 berurutan. File ini menggantikan semua file lama (schema, hardening, silicon-fix, admin, admin-v2, player-id, dst.) dan mempertahankan data yang ada.
Catatan: file 01 mengubah save menjadi **1 slot** (menyimpan save terbaru tiap pemain, membuang slot lama).

## Alur pembayaran
Pemain memilih paket di game → pesanan `pending` dibuat di server (harga & isi SIL divalidasi server) →
admin menyetujui di `/031411/` → SIL otomatis masuk dompet (tercatat di ledger, tidak bisa dikredit dua kali).

## Bila harga paket atau reward quest di game berubah
- Paket SIL: ubah daftar `_sil_packages` di `04-pembayaran-transfer.sql` (nilai `sil` = SIL + bonus), jalankan ulang.
- Reward quest: ubah `claim_quest_silicon` di `02-sil-dompet.sql`, jalankan ulang.

## Opsional
`function/advisor-chat/` — Edge Function Asisten Bisnis (AI). Tidak dibutuhkan untuk game & pembayaran.
