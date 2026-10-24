// Uji kerja di Assembly: tangan pekerja & ponsel di ban berjalan hanya tampil saat mode masuk, bergerak hanya
// saat operasi aktif dan ambien hidup, diam saat ambien mati atau di luar, tidak ada saat belum dibangun, dan
// jumlahnya tidak melewati budget +40 mesh. Butuh probe (lihat tools/README.md).
import { stubBrowser } from './boot.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
stubBrowser();
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.cancelAnimationFrame = () => {};
const smoke = fs.readFileSync('tools/scene-smoke.mjs', 'utf8');
const mockSrc = smoke.slice(smoke.indexOf('let meshes'), smoke.indexOf('const { createManufactureScene }'));
const { THREE } = new Function('mkEnv', mockSrc + '; return { THREE };')();
const mod = await import(pathToFileURL(path.resolve('src/ui/manufacture/ManufactureScene.probe.js')).href);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
window.__PERF = {};
const api = mod.createManufactureScene(THREE, container, {});
const A = api.__plots().assembly;
const crew = { operator: 320, qc: 40, technician: 24, supervisor: 16 };
const built = (lv, operating = true, total = 376) => ({ status: 'built', level: lv, building: null, producing: null, stock: 0, unlock: { ok: true }, alert: null,
    asm: { workers: Object.assign({}, crew), levelInfo: { crew }, utilization: 0.5, operating, total } });
const rig = () => A.furn.userData.asmRig;
const posOf = (arr) => arr.map(o => [o.m.position.x, o.m.position.y, o.m.position.z].join(','));
const allVis = (arr, want) => arr.length > 0 && arr.every(o => (o.m.visible === true) === want);

api.__sync({ assembly: built(2) });
const R = rig();
ok(R && R.hands.length > 0 && R.phones.length > 0, 'rig dibuat saat dibangun: tangan ' + R.hands.length + ', ponsel ' + R.phones.length);
ok(allVis(R.hands, false) && allVis(R.phones, false), 'di luar: tangan & ponsel tersembunyi');

api.__setAmbient(true);            // uji stub menganggap gerak dikurangi; nyalakan ambien secara eksplisit
api.select('assembly');
ok(allVis(R.hands, true) && allVis(R.phones, true), 'masuk & operasi: tangan & ponsel tampil');

api.__tickPlots(1.0); const h1 = posOf(R.hands), p1 = posOf(R.phones);
api.__tickPlots(2.3);
ok(posOf(R.hands).join() !== h1.join(), 'tangan bergerak saat masuk & ambien');
ok(posOf(R.phones).join() !== p1.join(), 'ponsel bergerak di ban berjalan');
const p2 = posOf(R.phones);
const lanesFixed = R.phones.every((o, i) => Math.abs(o.m.position.z - R.phones[i].m.position.z) === 0 && Math.abs(o.m.position.y - 0.25) < 1e-9);
const xsInSpan = R.phones.every(o => o.m.position.x > -10 && o.m.position.x < 10);
ok(lanesFixed && xsInSpan && p2.length === R.phones.length, 'ponsel tetap di lajurnya (z) dan di atas ban (y)');

api.__setAmbient(false);
api.__tickPlots(3.0); const hs = posOf(R.hands), ps = posOf(R.phones);
api.__tickPlots(9.0);
ok(posOf(R.hands).join() === hs.join() && posOf(R.phones).join() === ps.join(), 'ambien mati: tangan & ponsel diam');
api.__setAmbient(true);

api.select(null);
api.__tickPlots(4.0); const ho = posOf(R.hands), po = posOf(R.phones);
api.__tickPlots(7.0);
ok(allVis(R.hands, false) && allVis(R.phones, false), 'keluar: tangan & ponsel tersembunyi lagi');
ok(posOf(R.hands).join() === ho.join() && posOf(R.phones).join() === po.join(), 'di luar: tidak bergerak');

api.select('assembly');
api.__sync({ assembly: built(2, false) });
const R2 = rig();
ok(allVis(R2.hands, true) && allVis(R2.phones, false), 'tidak beroperasi: tangan tampil, ponsel tidak');
api.__sync({ assembly: built(2) });
ok(allVis(rig().hands, true) && allVis(rig().phones, true), 'operasi lagi: ponsel kembali');

api.__sync({ assembly: built(4, true, 2800) });
const R4 = rig();
const total4 = R4.hands.length + R4.phones.length;
ok(R4.phones.length === 12, 'Lv4: 12 ponsel (3 per lajur)');
ok(total4 <= 40, 'Lv4: tangan + ponsel <= 40 mesh (' + total4 + ')');

api.__sync({ assembly: { status: 'empty', level: 0, building: null, producing: null, stock: 0, unlock: { ok: true }, alert: null } });
ok(!A.furn.userData.asmRig, 'belum dibangun: tidak ada rig');
api.dispose();
ok(api.isDisposed() === true, 'dispose berjalan');
console.log(fail ? 'ADA GAGAL' : 'ASSEMBLY KERJA LULUS');
process.exit(fail ? 1 : 0);
