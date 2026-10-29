// Uji kapal kargo: jalur di laut (margin 0.9), langkah antar frame wajar, fase approach->berth->depart->away,
// berth tetap di (16.6, 17.0), tidak tampil tanpa hub berdiri, tidak berlayar tanpa stok, statis saat ambien mati.
import { stubBrowser } from './boot.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
stubBrowser();
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.cancelAnimationFrame = () => {};
const smoke = fs.readFileSync('tools/scene-smoke.mjs', 'utf8');
const mockSrc = smoke.slice(smoke.indexOf('let meshes'), smoke.indexOf('const { createManufactureScene }'));
const THREE = new Function('mkEnv', mockSrc + '; return THREE;')();
const src = fs.readFileSync('src/ui/manufacture/ManufactureScene.js', 'utf8');
const { onIsland } = new Function(src.slice(src.indexOf('var ISLAND ='), src.indexOf('var ZC =')) + '; return { coastR, onIsland };')();
const mod = await import(pathToFileURL(path.resolve('src/ui/manufacture/ManufactureScene.probe.js')).href);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
window.__PERF = {};
const api = mod.createManufactureScene(THREE, container, {});
const hub = (level, stock, status = 'built') => ({ hub: { status, level, stock } });
let clock = 0;
function run(secs) {                                       // maju sec detik dalam langkah 0.1 s; kembalikan sampel
    const out = [];
    for (let i = 0; i < Math.round(secs / 0.1); i++) {
        clock += 0.1; api.__animAll(clock);
        const s = api.__ship(); const m = s.s.cur;
        out.push({ ph: s.s.ph, vis: !!(m && m.g.visible), x: m ? m.g.position.x : NaN, z: m ? m.g.position.z : NaN,
            ang: m ? m.g.rotation.y : NaN, foam: !!(m && m.foam.visible), m });
    }
    return out;
}
// 1) hub belum berdiri: tidak ada kapal yang tampil
api.__setAmbient(true);
api.__setStates(hub(0, 0, 'locked'));
let samp = run(5);
ok(samp.every(x => !x.vis), 'hub belum berdiri: kapal tidak tampil');
// 2) hub berdiri dengan stok, ambien hidup: satu siklus penuh
api.__setStates(hub(2, 100));
samp = run(120);
const phases = new Set(samp.map(x => x.ph));
ok(['approach', 'berth', 'depart', 'away'].every(p => phases.has(p)), 'fase approach/berth/depart/away semua terlihat: ' + [...phases].join(','));
const vis = samp.filter(x => x.vis);
ok(vis.length > 0, 'kapal tampil saat berlayar (' + vis.length + ' sampel)');
ok(samp.every(x => x.ph !== 'away' || !x.vis), 'saat away kapal disembunyikan');
ok(samp.every(x => x.ph !== 'berth' || (Math.abs(x.x - 16.6) < 1e-9 && Math.abs(x.z - 17.0) < 1e-9)), 'saat berth posisi tepat di (16.6, 17.0)');
ok(samp.filter(x => x.ph === 'approach' && x.vis).some(x => x.foam) && samp.some(x => x.ph === 'berth' && !x.foam), 'buih hanya saat bergerak');
const finite = samp.every(x => !x.vis || (Number.isFinite(x.x) && Number.isFinite(x.z) && Number.isFinite(x.ang)));
ok(finite, 'posisi & sudut selalu berhingga');
// langkah antar frame saat bergerak wajar (kecepatan puncak ~1.6 satuan/s -> langkah 0.1 s <= 0.25)
let maxStep = 0, prev = null;
for (const x of samp) {
    if (x.vis && prev && prev.vis && prev.m === x.m && x.ph !== 'berth' && prev.ph !== 'berth') maxStep = Math.max(maxStep, Math.hypot(x.x - prev.x, x.z - prev.z));
    prev = x;
}
ok(maxStep < 0.25, 'langkah antar frame wajar (maks ' + maxStep.toFixed(3) + ')');
// jalur di laut: pusat, haluan, dan buritan tidak di daratan (margin 0.9)
let landHits = 0;
for (const x of samp) {
    if (!x.vis) continue;
    const L = 1.9 * 0.78, fx = Math.sin(x.ang), fz = Math.cos(x.ang);
    for (const d of [0, L, -L]) if (onIsland(x.x + fx * d, x.z + fz * d, 0.9)) landHits++;
}
ok(landHits === 0, 'seluruh badan kapal di laut dengan margin 0.9 (menyentuh daratan: ' + landHits + ')');
// 3) stok habis: kapal tidak berlayar lagi setelah selesai siklus
api.__setStates(hub(2, 0));
samp = run(120);
ok(samp.slice(-600).every(x => x.ph === 'away' && !x.vis), 'tanpa stok: kapal tetap di laut (away)');
// 4) ukuran menurut level & stok: level 5 -> model besar (tier 2) dibuat saat dipakai
api.__setStates(hub(5, 0));
api.__setStates(hub(5, 800));
samp = run(80);
const tierUsed = api.__ship().s.cur;
ok(api.__ship().models[2] === tierUsed, 'level 5 & stok besar memakai model besar');
ok(api.__ship().models.filter(Boolean).length <= 3, 'model dibuat malas (maks 3)');
// 5) ambien mati: satu kapal bersandar statis, tanpa buih dan tanpa gerak
api.__setAmbient(false);
api.__setStates(hub(2, 100));
samp = run(30);
ok(samp.every(x => x.vis && x.ph === 'berth' && !x.foam && Math.abs(x.x - 16.6) < 1e-9 && Math.abs(x.z - 17.0) < 1e-9), 'ambien mati: kapal statis di berth tanpa buih');
console.log(fail ? 'ADA GAGAL' : 'SHIP LULUS');
process.exit(fail ? 1 : 0);
