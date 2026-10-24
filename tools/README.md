Tes Manufaktur (jalankan dari root repo; tes bawaan di tools/ tidak diubah kecuali ct-test ikut kondisi hub).
- paket2027.mjs, assembly-test.mjs, road-graph-test.mjs, scene-smoke.mjs : node tools/<nama>.mjs src
- geo-test.mjs : butuh ../proj-orig (salinan src/ sebelum sesi 2, dengan dua baris lobe tenggara dihapus)
- ship-test.mjs : siklus kapal (tahap 1)
- crane-test.mjs : crane & kontainer (tahap 2)
- ct-test.mjs : perilaku truk kontainer (butuh probe, lihat di bawah)

Probe untuk ship-test, crane-test, dan ct-test: salin ManufactureScene.js ke src/ui/manufacture/ManufactureScene.probe.js lalu tambahkan di awal "return {" pada createManufactureScene:
  __setAmbient: function (v) { ambient = !!v; }, __anim: animateContainers, __animAll: animateShell,
  __ship: function () { return { s: shipS, models: shipModels }; },
  __crane: function () { return { s: craneS, q: craneQ, stack: stackOcc, pool: cntPool, free: cntFree, models: shipModels, obj: craneObj, cap: shipCap }; },
  __setStates: function (v) { states = v; syncShell(); },
  __ct: ctList,
Catatan: __setStates memanggil syncShell() agar truk ikut status baru (sama seperti update() di permainan).
