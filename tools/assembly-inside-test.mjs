// Uji Assembly mode masuk: atap gergaji tersembunyi saat "masuk" dan kembali saat keluar, tetap tersembunyi
// saat petak dibangun ulang, kamera menuju hall, label stasiun maks 4 dan hanya saat masuk, serta
// masuk/keluar tidak membuat mesh baru. Butuh probe (lihat tools/README.md).
import { stubBrowser } from './boot.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
stubBrowser();
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.cancelAnimationFrame = () => {};
const smoke = fs.readFileSync('tools/scene-smoke.mjs', 'utf8');
const mockSrc = smoke.slice(smoke.indexOf('let meshes'), smoke.indexOf('const { createManufactureScene }'));
const { THREE, cnt } = new Function('mkEnv', mockSrc + '; return { THREE, cnt: () => meshes };')();
const mod = await import(pathToFileURL(path.resolve('src/ui/manufacture/ManufactureScene.probe.js')).href);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
window.__PERF = {};
const api = mod.createManufactureScene(THREE, container, {});
const P = api.__plots(), A = P.assembly;
const ASM_X = -4.5, ASM_Z = 14.0, ASM_ZC = -1.2;      // def PLOTS assembly + ASM_ZC di ManufactureScene.js
const crew = { operator: 320, qc: 40, technician: 24, supervisor: 16 };
const built = (lv) => ({ status: 'built', level: lv, building: null, producing: null, stock: 0, unlock: { ok: true }, alert: null,
    asm: { workers: Object.assign({}, crew), levelInfo: { crew }, utilization: 0.5, operating: true, total: 376 } });
const allRoofHidden = () => A.roofMeshes.length > 0 && A.roofMeshes.every(m => m.visible === false);
const allRoofShown = () => A.roofMeshes.length > 0 && A.roofMeshes.every(m => m.visible !== false);

api.__sync({ assembly: built(2) });
ok(A.roofMeshes.length > 0, 'atap gergaji terdaftar saat dibangun: ' + A.roofMeshes.length);
ok(allRoofShown(), 'di luar: atap tampil');
ok(A.stations.every(s => s.visible === false), 'di luar: label stasiun tersembunyi');

api.select('assembly');
ok(A.inside === true, 'Assembly dipilih: mode masuk aktif');
ok(allRoofHidden(), 'masuk: atap gergaji tersembunyi');
const v = api.__view();
ok(Math.abs(v.x - ASM_X) < 1e-6 && Math.abs(v.z - (ASM_Z + ASM_ZC)) < 1e-6, 'kamera menuju pusat hall (' + v.x + ', ' + v.z + ')');
ok(v.zoom >= 1.6 - 1e-9, 'zoom masuk >= 1.6: ' + v.zoom);
ok(A.stations.length >= 1 && A.stations.length <= 4, 'label stasiun 1..4: ' + A.stations.length);
ok(A.stations.every(s => s.visible === true), 'masuk: label stasiun tampil');

api.__sync({ assembly: built(3) });
ok(allRoofHidden(), 'dibangun ulang saat masuk: atap tetap tersembunyi');
ok(A.stations.length >= 1 && A.stations.length <= 4 && A.stations.every(s => s.visible === true), 'dibangun ulang: label tetap 1..4 dan tampil');

api.select(null);
ok(A.inside === false, 'keluar (pilih kosong): mode masuk mati');
ok(allRoofShown(), 'keluar: atap kembali tampil');
ok(A.stations.every(s => s.visible === false), 'keluar: label stasiun tersembunyi');

api.select('fab');
ok(A.inside === false, 'pilih petak lain: tidak masuk');
api.select('assembly');
ok(A.inside === true, 'pilih lagi: masuk');
api.select('hub');
ok(A.inside === false && allRoofShown(), 'pindah ke Pusat Logistik: keluar');

const m0 = cnt();
api.select('assembly'); api.select(null); api.select('assembly'); api.select(null);
const m1 = cnt();
ok(m1 === m0, 'masuk/keluar tidak membuat mesh baru (' + m0 + ' -> ' + m1 + ')');
api.__setAmbient(false);
api.select('assembly');
ok(A.inside === true && allRoofHidden(), 'ambien mati: masuk tetap berfungsi');
api.select(null);
ok(allRoofShown(), 'ambien mati: keluar tetap berfungsi');
api.__setAmbient(true);


api.__sync({ assembly: { status: 'empty', level: 0, building: null, producing: null, stock: 0, unlock: { ok: true }, alert: null } });
api.select('assembly');
ok(A.roofMeshes.length === 0 && A.stations.length === 0, 'belum dibangun: tidak ada atap atau label');
api.select(null);

api.__sync({ assembly: built(1) });
ok(A.stations.length >= 1 && A.stations.length <= 4, 'kembali dibangun: label tidak menumpuk');
api.dispose();
ok(api.isDisposed() === true, 'dispose berjalan');
console.log(fail ? 'ADA GAGAL' : 'ASSEMBLY MASUK LULUS');
process.exit(fail ? 1 : 0);
