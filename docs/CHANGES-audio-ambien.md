# v2028.40 — Audio ambien adaptif untuk peta 3D

Suara latar disintesis langsung dengan Web Audio (tanpa file audio baru, tanpa jaringan). Mengikuti Setelan > Efek Suara.

## File
- BARU `src/core/AmbienceService.js` — mesin audio (4 adegan, crossfade, kompresor, gema per adegan, hemat baterai saat tab tersembunyi)
- BARU `src/ui/ambience/AmbienceParams.js` — state game -> parameter audio
- UBAH `src/ui/campus/CampusMap.js`, `manufacture/ManufactureMap.js`, `office/OfficeMap.js`, `server/ServerMap.js` — masuk/keluar adegan
- UBAH `src/main.js` — init + ikut toggle suara
- BARU `tools/ambience-smoke.mjs` (tes), `ambience-test.html` (uji dengar dengan slider)

## Suara per peta & apa yang mengubahnya
| Peta | Suara | Beradaptasi dengan |
|---|---|---|
| Kampus | ombak pantai, angin, kicau burung & merpati, lonceng jauh, air mancur, gumam keramaian; malam: jangkrik | jam perangkat (siang/malam), cuaca (hujan/salju/mendung) |
| Manufaktur | dengung listrik 50 Hz, motor, sabuk konveyor, mesin press, semburan pneumatik, bip robot/forklift, dentang kontainer, klakson kapal, ombak | jumlah pabrik yang berproduksi, ada konstruksi (palu), cuaca |
| Kantor | AC/ruang, gumam percakapan, ketikan, klik mouse, langkah, telepon jauh, hujan samar dari jendela | jumlah staf, malam (lebih sepi), cuaca |
| Server | tekanan air dalam, kipas rak, dengung trafo, klik relay/HDD, gelembung, ping sonar, kawanan ikan | beban server (kipas makin cepat), beban >100% = bip peringatan lembut |

## Kontrol
- Matikan hanya ambien: `localStorage.setItem('se.ambience','0')` atau `?ambience=off`
- Volume: `AmbienceService.setVolume(0..1)` (tersimpan di `se.ambienceVol`)
- Uji waktu/cuaca: `?hour=22` `?weather=rain` (sama dengan peta 3D)

## Tes
`node tools/ambience-smoke.mjs` — Web Audio tiruan: adegan terbangun, kejadian acak, pindah adegan, leave/dispose, toggle suara, tab tersembunyi.

## Belum diuji
Didengarkan di perangkat sungguhan. Level suara ditentukan dari perhitungan; bila terasa kurang pas, ubah angka `setT(...)` di adegan terkait atau `MASTER` di bagian atas AmbienceService.js.
