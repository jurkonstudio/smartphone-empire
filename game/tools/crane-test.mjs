// Uji crane & kontainer: invarian pool (24 kontainer selalu terhitung dan lokasinya cocok), kargo truk
// terlihat tepat saat pesanan ditolak, kapal memuat dari tumpukan dan dek sampai kapasitas, dek kosong saat
// berangkat, kait bergerak wajar, diam saat ambien mati, dan tersembunyi tanpa hub.
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
const mod = await import(pathToFileURL(path.resolve('src/ui/manufacture/ManufactureScene.probe.js')).href);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
window.__PERF = {};
const api = mod.createManufactureScene(THREE, container, {});
const T = [13.5, 12.6], RMIN = 1.6, RMAX = 7.6;
let clock = 0, bad = 0, phases = new Set(), sawHook = false, maxStep = 0, prevHook = null;
let departBad = 0, prevShipN = 0, stackDrop = 0, prevStack = null, shipMax = 0, shipPosBad = 0, awayLoaded = 0, cargoBad = 0, stackMax = 0;
function step(n) {
    for (let i = 0; i < n; i++) {
        clock += 0.1; api.__animAll(clock);
        const c = api.__crane(), pool = c.pool;
        const inUse = pool.filter(p => p.at !== 'free').length;
        if (inUse + c.free.length !== pool.length) bad++;
        const cnt = (k) => pool.filter(p => p.at === k).length;
        const stackN = c.stack.filter(Boolean).length;
        const shipPh = api.__ship().s.ph;
        const shipN = c.models.reduce((a, m) => a + (m ? m.loaded.length : 0), 0);
        if (cnt('stack') !== stackN || cnt('ship') !== shipN) bad++;
        if (cnt('job') !== c.q.length + (c.s.job && c.s.job.cont.at === 'job' ? 1 : 0)) bad++;
        stackMax = Math.max(stackMax, stackN);
        if (c.s.st) phases.add(c.s.st);
        if (c.s.held) sawHook = true;
        if (c.s.job && c.s.st !== 'idle') {
            const hx = T[0] + c.s.r * Math.cos(c.s.th), hz = T[1] + c.s.r * Math.sin(c.s.th);
            if (c.s.r < RMIN - 1e-6 || c.s.r > RMAX + 1e-6) bad++;
            if (prevHook) maxStep = Math.max(maxStep, Math.hypot(hx - prevHook[0], hz - prevHook[1]));
            prevHook = [hx, hz];
        } else prevHook = null;
        if (prevStack !== null && stackN < prevStack && c.s.job && c.s.job.kind === 'stack') stackDrop++;
        prevStack = stackN;
        shipMax = Math.max(shipMax, shipN);
        c.models.forEach(m => { if (m) m.loaded.forEach(p => { if (p.mesh.position.y !== 0.625 || !(Math.abs(p.mesh.position.z) < 1.2)) shipPosBad++; }); });
        if (shipN > prevShipN && shipPh !== 'berth') departBad++;
        prevShipN = shipN;
        if (shipPh === 'away' && c.models.some(m => m && m.loaded.length)) awayLoaded++;
        // kargo truk: saat pesanan diterima hilang, saat ditolak tetap terlihat
        api.__ct.forEach(t => { if (t.ordered && (t.okOrder ? t.cargo.visible : !t.cargo.visible)) cargoBad++; });
    }
}
// 1) tanpa kapal (stok 0): truk membongkar, kontainer menumpuk di apron
api.__setAmbient(true);
api.__setStates({ assembly: { producing: true }, hub: { status: 'built', level: 3, stock: 0 } });
step(3000);
ok(bad === 0, 'invarian pool & lokasi kontainer selalu cocok (' + bad + ' salah)');
ok(cargoBad === 0, 'kargo truk hilang tepat saat pesanan diterima, tetap terlihat saat ditolak (' + cargoBad + ' salah)');
ok(stackMax >= 6, 'tanpa kapal: tumpukan apron terisi (maks ' + stackMax + ')');
ok(['toPick', 'down', 'up', 'swing', 'downD', 'rel', 'upD'].every(p => phases.has(p)) && sawHook, 'semua tahap crane dijalani');
// 2) kapal datang (stok 100, level 3 -> kapasitas 3): tumpukan dimuat ke kapal, dek kosong saat berangkat
api.__setStates({ assembly: { producing: true }, hub: { status: 'built', level: 3, stock: 100 } });
step(900);
ok(shipMax >= 1 && shipMax <= 3, 'kapal memuat, tidak melebihi kapasitas 3 (maks ' + shipMax + ')');
ok(stackDrop > 0, 'tumpukan dimuat ke kapal saat sandar (' + stackDrop + ' kali)');
ok(departBad === 0, 'kontainer hanya dilepas saat kapal sandar (' + departBad + ' pelanggaran)');
ok(awayLoaded === 0, 'saat kapal away, dek kosong (' + awayLoaded + ' pelanggaran)');
ok(shipPosBad === 0, 'kontainer di dek berada di slot dek yang benar');
ok(maxStep < 0.45, 'kait bergerak wajar (langkah maks ' + maxStep.toFixed(3) + ')');
// 3) ambien mati: crane diam
api.__setAmbient(false);
const b = api.__crane().s, snap = [b.th, b.r, b.h, b.t];
step(200);
const a = api.__crane().s;
ok(a.th === snap[0] && a.r === snap[1] && a.h === snap[2] && a.t === snap[3], 'ambien mati: crane diam');
// 4) hub belum berdiri: crane tersembunyi, tidak ada pesanan baru
api.__setAmbient(true);
api.__setStates({ assembly: { producing: true }, hub: { status: 'locked', level: 0, stock: 0 } });
step(5);
const q0 = api.__crane().q.length;
step(500);
ok(api.__crane().obj.hook.visible === false, 'hub belum berdiri: crane tersembunyi');
ok(api.__crane().q.length === q0, 'hub belum berdiri: tidak ada pesanan baru');
ok(bad === 0 && cargoBad === 0, "invarian & kargo tetap benar sepanjang uji");
console.log(fail ? 'ADA GAGAL' : 'CRANE LULUS');
process.exit(fail ? 1 : 0);
