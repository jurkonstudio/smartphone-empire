Tes Manufaktur (jalankan dari root repo; tes bawaan di tools/ tidak diubah kecuali ct-test ikut kondisi hub).
- paket2027.mjs, assembly-test.mjs, road-graph-test.mjs, scene-smoke.mjs : node tools/<nama>.mjs src
- geo-test.mjs : butuh ../proj-orig (salinan src/ sebelum sesi 2, dengan dua baris lobe tenggara dihapus)
- ship-test.mjs : siklus kapal (tahap 1)
- crane-test.mjs : crane & kontainer (tahap 2)
- ct-test.mjs : perilaku truk kontainer (butuh probe, lihat di bawah)
- assembly-inside-test.mjs : mode masuk Assembly (tahap 5): atap tersembunyi saat masuk, label stasiun, kamera, tanpa mesh baru (butuh probe)
- assembly-kerja-test.mjs : tangan pekerja & ponsel di ban berjalan saat mode masuk, operasi, dan ambien; budget +40 mesh (butuh probe)

Probe untuk ship-test, crane-test, ct-test, dan assembly-inside-test: salin ManufactureScene.js ke src/ui/manufacture/ManufactureScene.probe.js lalu tambahkan di awal "return {" pada createManufactureScene:
  __setAmbient: function (v) { ambient = !!v; }, __anim: animateContainers, __animAll: animateShell,
  __ship: function () { return { s: shipS, models: shipModels }; },
  __crane: function () { return { s: craneS, q: craneQ, stack: stackOcc, pool: cntPool, free: cntFree, models: shipModels, obj: craneObj, cap: shipCap }; },
  __setStates: function (v) { states = v; syncShell(); },
  __ct: ctList,
  __plots: function () { return plots; }, __view: function () { return controls.view; },
  __tickPlots: function (sec) { for (var i = 0; i < animPlots.length; i++) animPlots[i].tick(sec); },
  __sync: function (v) { states = v; plotList.forEach(function (r) { if (states[r.def.id]) rebuildPlot(r, states[r.def.id]); }); syncShell(); refreshStations(plots.assembly); requestRender(); },
Catatan: __setStates memanggil syncShell() agar truk ikut status baru (sama seperti update() di permainan). __sync membangun ulang petak yang ada di states. __tickPlots menjalankan tick petak (di permainan dipanggil dari frame(), bukan animateShell). Uji memakai ambient: panggil __setAmbient(true) bila ingin melihat gerak, karena stub menganggap gerak dikurangi.
Probe hanya untuk uji; jangan ikut dikirim sebagai file pengganti.
