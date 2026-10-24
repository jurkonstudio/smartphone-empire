// Uji perilaku truk kontainer: gerak dari asal ke dermaga, bongkar, kembali; posisi berhingga; kargo konsisten.
import { stubBrowser, load } from './boot.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
stubBrowser();
globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.cancelAnimationFrame = () => {};
// reuse mock THREE dari scene-smoke (tanpa menjalankan bagian dispose)
const smoke = (await import('node:fs')).readFileSync('tools/scene-smoke.mjs', 'utf8');
const mockSrc = smoke.slice(smoke.indexOf('let meshes'), smoke.indexOf('const { createManufactureScene }'));
const setup = new Function('mkEnv', mockSrc + '; return { THREE: THREE, mk: mk, meshes: () => meshes };');
const env = setup();
const THREE = env.THREE;

const mod = await import(pathToFileURL(path.resolve('src/ui/manufacture/ManufactureScene.probe.js')).href);
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
window.__PERF = {};
const api = mod.createManufactureScene(THREE, container, {});
api.__setAmbient(true);
const ct = api.__ct;
ok(ct.length === 6, 'enam truk kontainer dibuat (' + ct.length + ')');
ok(ct.every(t => t.fwd.total > 0 && t.back.total > 0), 'semua jalur punya panjang > 0');
ok(ct.every(t => t.cycle > 10 && Number.isFinite(t.cycle)), 'siklus berhingga: ' + ct.map(t => t.cycle.toFixed(1)).join(', '));
// aktifkan semua truk
ct.forEach(t => t.active = true);
let bad = 0, sawAtDock = 0, sawCargoOff = 0, sawCargoOn = 0, maxStep = 0, prev = null, offRoad = 0;
const dock = [14.7, 10.5];
const LG = await load('src', 'ui/manufacture/ManufactureLogic.js');
function segDist(px, pz, a, b) { const dx = b[0]-a[0], dz = b[1]-a[1], L2 = dx*dx+dz*dz || 1; let t = ((px-a[0])*dx+(pz-a[1])*dz)/L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(px-(a[0]+dx*t), pz-(a[1]+dz*t)); }
function nearNet(x, z) {
  for (const e of LG.ROAD_EDGES) if (segDist(x, z, LG.ROAD_NODES[e.a], LG.ROAD_NODES[e.b]) <= (e.w/2 + 0.45)) return true;
  if (x >= LG.APRON.x0 - 0.3 && x <= LG.APRON.x1 + 0.3 && z >= LG.APRON.z0 - 0.3 && z <= LG.APRON.z1 + 0.3) return true;
  return false;
}
for (let i = 0; i < 2000; i++) {
  const sec = i * 0.1;
  api.__anim(sec);
  for (const t of ct) {
    const p = t.g.position;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.z)) { bad++; continue; }
    if (Math.hypot(p.x - dock[0], p.z - dock[1]) < 1.5) sawAtDock++;
    if (t.cargo.visible === false) sawCargoOff++; else sawCargoOn++;
    // kendaraan tidak melompat jauh dalam 0.1 detik (kecepatan 1.5 -> langkah <= 0.2)
    if (t._lx !== undefined) maxStep = Math.max(maxStep, Math.hypot(p.x - t._lx, p.z - t._lz));
    t._lx = p.x; t._lz = p.z;
    // harus berada di jaringan: di dekat garis jalan atau apron (toleransi lajur + lebar)
    const onNet = nearNet(p.x, p.z);
    if (!onNet) offRoad++;
  }
}
ok(bad === 0, 'posisi selalu berhingga (' + bad + ' salah)');
ok(sawAtDock > 0, 'truk mencapai dermaga (' + sawAtDock + ' sampel)');
ok(sawCargoOff > 0 && sawCargoOn > 0, 'kargo berubah: saat bongkar hilang, saat muat ada');
ok(maxStep < 0.25, 'langkah antar frame wajar (maks ' + maxStep.toFixed(3) + ')');
ok(offRoad === 0, 'semua truk tetap di area jalan/apron (keluar: ' + offRoad + ')');
// ambient mati: truk diam di asal dengan kargo terlihat
api.__setAmbient(false);
api.__anim(123.4);
ok(ct.every(t => t.cargo.visible === true), 'ambient mati: kargo terlihat di asal (statis)');
// nonaktif: truk disembunyikan
ct.forEach(t => t.active = false); api.__anim(5);
ok(ct.every(t => t.g.visible === false), 'truk tidak aktif disembunyikan');
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
