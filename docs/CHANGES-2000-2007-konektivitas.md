# Perbaikan 2000–2007: Inframerah, MMS, Wi-Fi
Salin file ke lokasi yang sama (path relatif dari akar repo).
- `src/data/os.data.js`: fitur baru `fw_irda` (2001), `fw_mms` (2002), `fw_wifi` (2005). Bug `bug_ir_fail`, `bug_mms_fail`, `bug_wifi_drop` kini terikat ke fitur masing-masing (Wi-Fi mulai 2006).
- `src/data/research.data.js`: riset `net_irda` (2001) dan `net_wifi` (2005).
- `src/data/os-update-cards.data.js`: fitur baru dipetakan ke jalur pesan/konektivitas.
- `src/data/i18n/os-update-cards.i18n.js`, `src/data/i18n/research-data.en.js`: teks id+en.
- `src/ui/phone/OsScreenMockup.js`: baris Wi-Fi mengikuti `fw_wifi`.
Catatan: tanpa komponen perangkat keras baru (software-only), karena kategori audio hanya bisa satu pilihan.
