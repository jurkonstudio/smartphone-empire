# v2027.71 — Peta Kampus: tampilan malam + alat tuning

Cara pakai: salin isi zip ke root proyek, timpa file bernama sama.
STATUS: belum diuji di WebGL/browser nyata (hanya `node --check` + uji logika blend di Node). Angka = tebakan terarah.

| File | Perubahan |
|---|---|
| src/ui/campus/CampusLook.js | `CAMPUS_LOOK.dark`: hemiI 0.9→1.15, hemiSky/Ground lebih terang, sunI 1.7→2.1, fillI 0.35→0.7, rimI 0.55→1.0, envI 0.22→0.32, exposure 0.95→1.08, aoOpacity 0.5→0.4. `colors` malam diangkat (dinding, rumput, plaza, jalan, trotoar, daun, pasir). `colors` siang = cermin PALETTES.light (nilai sama, siang TIDAK berubah). Override URL `?lk=` (siang) dan `?lkn=` (malam). |
| src/ui/campus/CampusBuildings.js | Peta emissive jendela dicampur hangat; emissive malam putih hangat, intensitas maks 1.4 (sebelumnya 0.9); halo lampu 0.22→0.3; `addDetail` melewati bunga & bangku di tier `low`. |

## Tuning cepat lewat URL (tanpa edit file)
- Siang: `?lk=sunI:3,hemiI:0.8,exposure:1,rimI:0.7,envI:0.4,aoOpacity:0.46`
- Malam: `?lkn=hemiI:1.3,fillI:0.8,rimI:1.2,exposure:1.1` + paksa jam: `&hour=22`
- Tier: `&campusq=low|medium|high`. Hanya kunci numerik yang ada, rentang 0..10.

## Catatan
- Kunci baru di `colors` WAJIB ada di light dan dark (blendObj hanya mengulang kunci milik light).
- Tampilan malam lewat `CAMPUS_LOOK.dark` juga dipakai ManufactureScene (applyNight) dan OfficeScene (applyTheme); `colors` malam hanya dipakai CampusScene.
- Rollback malam: kembalikan blok `dark` ke nilai v70 (lihat .patch).
