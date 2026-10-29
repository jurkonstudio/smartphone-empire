// Tes perluasan Kampus (v2027.73): data murni + adegan dengan THREE tiruan (tanpa WebGL).
//   node tools/campus-expansion-smoke.mjs
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.removeEventListener = globalThis.removeEventListener || (() => {});
globalThis.ResizeObserver = undefined;
globalThis.performance = globalThis.performance || { now: () => 0 };
globalThis.cancelAnimationFrame = () => {};
let meshes = 0, instancedN = 0;
function mk(kind) {
  const target = function () {};
  target.kind = kind;
  return new Proxy(target, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (k === 'kind') return t.kind;
      if (!(k in t)) {
        if (k === 'children') return [];
        if (k === 'userData') return (t.userData = t.userData || {});
        if (k === 'position') return (t.position = t.position || { x: 0, y: 0, z: 0, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
        if (k === 'holes') return (t.holes = t.holes || []);
        if (k === 'visible') return t.visible === undefined ? true : t.visible;
        t[k] = mk(String(k));
      }
      return t[k];
    },
    set(t, k, v) { Object.defineProperty(t, k, { value: v, writable: true, configurable: true, enumerable: true }); return true; },
    apply() { return mk('ret'); },
    construct(t) { if (t.kind === 'Mesh') meshes++; if (t.kind === 'InstancedMesh') instancedN++; return mk('inst:' + t.kind); }
  });
}
document.createElement = () => mk('El');
document.documentElement = mk('html');
globalThis.getComputedStyle = () => mk('cs');
globalThis.matchMedia = () => mk('mq');
const THREE = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = mk(String(k)))) });
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

const B = await load('src', 'ui/campus/CampusBuildings.js');
const D = await load('src', 'data/campus-expansion.data.js');
const R = await load('src', 'data/campus-buildings.data.js');

// 1) barat tidak bergeser (jembatan Manufaktur), timur/utara/selatan melebar
ok(Math.abs(B.islandRadius(Math.PI) - 22 * (1 + 0.045 * Math.sin(3 * Math.PI + 0.8) + 0.03 * Math.sin(5 * Math.PI + 2.1) + 0.02 * Math.sin(9 * Math.PI + 0.3))) < 1e-9, 'sisi barat (th=PI) sama seperti sebelum perluasan');
ok(B.islandRadius(0) > 28 && B.islandRadius(-Math.PI / 2) > 24 && B.islandRadius(Math.PI / 2) > 23, 'pulau melebar ke timur/utara/selatan');
// 2) tiap footprint berada di dalam tepi rumput (margin >= 1.2) dan tidak menimpa gedung inti
for (const e of D.CAMPUS_EXPANSION) {
  let worst = 1e9;
  for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
    const x = e.x0 + (e.x1 - e.x0) * i / 24, z = e.z0 + (e.z1 - e.z0) * j / 24;
    worst = Math.min(worst, B.islandRadius(Math.atan2(z, x)) - Math.hypot(x, z));
  }
  ok(worst >= 1.2, `${e.id}: margin ke pantai ${worst.toFixed(2)} >= 1.2`);
  const hit = R.CAMPUS_RESERVED.find(r => e.x0 < r.x1 && e.x1 > r.x0 && e.z0 < r.z1 && e.z1 > r.z0);
  ok(!hit, `${e.id}: tidak menimpa lahan gedung ${hit ? hit.id : ''}`);
}
for (let a = 0; a < D.CAMPUS_EXPANSION.length; a++) for (let b = a + 1; b < D.CAMPUS_EXPANSION.length; b++) {
  const p = D.CAMPUS_EXPANSION[a], q = D.CAMPUS_EXPANSION[b];
  ok(!(p.x0 < q.x1 && p.x1 > q.x0 && p.z0 < q.z1 && p.z1 > q.z0), `${p.id} x ${q.id}: tidak saling menimpa`);
}
// 3) pohon & bukit tidak masuk distrik baru
const inside = (x, z, pad) => D.CAMPUS_EXPANSION.some(e => x > e.x0 - pad && x < e.x1 + pad && z > e.z0 - pad && z < e.z1 + pad);
ok(!B.TREE_SPOTS.some(p => inside(p[0], p[1], 0.3)), 'tidak ada pohon di dalam distrik perluasan (' + B.TREE_SPOTS.length + ' pohon)');
ok(!B.HILLS.some(h => inside(h[0], h[1], 0.0)), 'tidak ada bukit di dalam distrik perluasan');
ok(!B.TREE_SPOTS.some(p => p[0] < -14.5 && Math.abs(p[1]) < 3.4), 'jalur jembatan barat tetap bebas pohon');
// 4) bangun distrik
const { buildExpansion } = await load('src', 'ui/campus/CampusExpansion.js');
window.__PERF = {};
const A = B.createAssets(THREE, { shadows: true, env: true });
const ex = buildExpansion(A, THREE);
ok(!!ex.group && Array.isArray(ex.lights) && ex.lights.length >= 12, 'distrik terbentuk, lampu bloom: ' + ex.lights.length);
ok(meshes + instancedN > 100, 'mesh dibuat: ' + meshes + ' + instanced ' + instancedN);
ok(ex.lights.every(l => [l.x, l.y, l.z].every(Number.isFinite)), 'koordinat lampu valid');
ex.update(1.5, 0.8); ex.update(2.0, 0);
ok(true, 'update (berkas mercusuar, perahu) berjalan');
ex.dispose();
ok(true, 'dispose berjalan');
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
