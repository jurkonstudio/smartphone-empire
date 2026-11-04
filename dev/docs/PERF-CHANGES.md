# Optimasi baterai & HP kelas bawah (resolusi dan fitur tidak dikurangi)

Cara pakai: salin isi folder ini ke root proyek, timpa file dengan nama yang sama.

| File | Perubahan |
|---|---|
| src/core/TimeSystem.js | Loop waktu game dari rAF 60-120 Hz terus-menerus -> timer 10 Hz saat jalan, 1 Hz saat pause, berhenti total saat tab tersembunyi. Dibangunkan seketika oleh pause/resume/boost. |
| src/ui/office/OfficeScene.js, src/ui/campus/CampusScene.js | Loop 3D tidak lagi bangun di tiap vsync (tidur dengan setTimeout antar frame). Cleanup timer saat dispose. Antialias mati hanya di HP lemah (DPR tetap). |
| style.css | Hapus animasi latar 80 dtk yang repaint layar penuh. Animasi box-shadow/filter/background-position diganti opacity/transform (GPU). Mode hemat `html[data-perf="lite"]` mematikan blur kaca & animasi berulang. |
| index.html | Deteksi otomatis mode hemat sebelum render pertama (RAM<=3GB, CPU<=4 core, Data Saver, baterai<=20% tidak mengisi). Paksa: `?perf=lite`, `?perf=full`, `?perf=auto`. |
| src/core/SaveService.js | Autosave dijalankan saat browser idle supaya tidak patah-patah. |
