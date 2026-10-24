Tes headless peta manufaktur (bukan bagian repo; taruh di tools/ repo bila ingin dipakai).
- road-graph-test.mjs : graf jalan, rute truk ke dermaga  (node tools/road-graph-test.mjs src)
- geo-test.mjs        : apron/dermaga/kapal/petak di daratan atau laut, jembatan tidak bergeser
- scene-smoke.mjs     : bangun adegan dengan THREE tiruan (Proxy), cek tidak error
- ct-test.mjs         : perilaku truk kontainer. Butuh file probe: salin ManufactureScene.js ke
                        src/ui/manufacture/ManufactureScene.probe.js dan tambahkan di return:
                        __ct: ctList, __anim: animateContainers, __setAmbient: v => ambient = v
