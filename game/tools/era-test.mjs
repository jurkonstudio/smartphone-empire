// Tes lapisan era Peta Manufaktur (ManufactureEra.js): aturan buka bertahap (tahun + level pemain + level pabrik),
// pertumbuhan 1..3, tata letak stabil, dan pembangunan semua fitur dengan THREE tiruan (tanpa WebGL).
// Jalankan dari root repo: node tools/era-test.mjs src
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
function mk(kind) {
  const target = function () {}; target.kind = kind;
  return new Proxy(target, {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (!(k in t)) {
        if (k === 'children') return [];
        if (k === 'userData') return (t.userData = t.userData || {});
        if (k === 'traverse') return (fn) => fn(t);
        if (k === 'position' || k === 'scale' || k === 'rotation') return (t[k] = { x: 0, y: 0, z: 0, set(a, b, c) { this.x = a; this.y = b; this.z = c; return this; } });
        t[k] = mk(String(k));
      }
      return t[k];
    },
    set(t, k, v) { Object.defineProperty(t, k, { value: v, writable: true, configurable: true, enumerable: true }); return true; },
    apply() { return mk('ret'); },
    construct(t) { if (t.kind === 'Mesh') meshes++; return mk('inst:' + t.kind); }
  });
}
let meshes = 0;
const THREE = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = mk(String(k)))) });
const E = await load('src', 'ui/manufacture/ManufactureEra.js');
const built = (n) => { const o = {}; n.forEach(([id, lv]) => { o[id] = { status: 'built', level: lv }; }); return o; };
const d = (y) => ({ time: { currentYear: y } });

// 1) aturan buka
let e = E.computeEra(d(2000), built([['fab', 1]]), 1);
ok(Object.keys(e.n).length === 0, '2000 / Lv1 / pabrik Lv1: belum ada fasilitas (pemain baru)');
ok(e.next && e.next.id === 'fence' && e.missing.lv, 'fasilitas berikutnya = pagar, kurang level pemain');
e = E.computeEra(d(2000), built([['fab', 3], ['soc', 3]]), 5);
ok(e.n.fence === 1 && !e.n.flood, 'tahun 2000 Lv5: hanya pagar (lampu sorot baru 2002)');
ok(!e.n.parking && !e.n.solar, 'tahun belum cukup: parkir/surya belum ada');
e = E.computeEra(d(2026), built([['fab', 1]]), 1);
ok(Object.keys(e.n).length === 0, 'tahun 2026 tapi level rendah: tidak ada fasilitas (level pemain tetap menahan)');
e = E.computeEra(d(2009), built([['fab', 3], ['soc', 2], ['ram', 2]]), 12);
ok(e.n.fence && e.n.flood && e.n.parking && e.n.mast && !e.n.solar, '2009 Lv12: fasilitas awal ada, ladang surya (2010) belum');
const late = built([['fab', 5], ['soc', 5], ['ram', 5], ['display', 5], ['camera', 5], ['battery', 5], ['assembly', 5], ['hub', 6]]);
e = E.computeEra(d(2026), late, 45);
ok(E.ERA_FEATURES.every(f => e.n[f.id] >= 1), '2026 Lv45 pabrik penuh: semua 11 fasilitas terbuka');
ok(Object.values(e.n).every(v => v >= 1 && v <= 3), 'pertumbuhan selalu 1..3');
ok(e.next === null && e.roofSolar && e.led && e.fiveG, 'semua terbuka; LED + 5G aktif');
const e2 = E.computeEra(d(2026), late, 45), e3 = E.computeEra(d(2027), late, 46);
ok(e.sig === e2.sig, 'sig stabil untuk data sama');
ok(typeof E.eraBadgeText(e).line1 === 'string' && E.eraBadgeText(E.computeEra(d(2003), built([['fab', 1]]), 3)).line2.includes('('), 'teks lencana ada (+ syarat berikutnya)');

// 2) lapisan 3D: semua fitur terbangun, tick & dispose aman, tata letak stabil
const placed = [];
const mkMesh = () => { meshes++; return mk('Mesh'); };
const kit = {
  THREE, parent: mk('Group'), M: new Proxy({}, { get: () => mk('mat') }), G: new Proxy({}, { get: () => mk('geo') }), look: { shadows: false },
  mesh: mkMesh, box: mkMesh, cyl: mkMesh, sph: mkMesh, mergedBoxes: (p, m, l) => { meshes += l.length ? 1 : 0; return l.length ? mk('Mesh') : null; },
  clear: (x, z, r) => !placed.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2] + r),
  reserve: (x, z, r) => placed.push([x, z, r]), ambient: () => true, aura: () => mk('tex')
};
const layer = E.createEraLayer(kit);
meshes = 0;
ok(layer.apply(E.computeEra(d(2000), built([['fab', 1]]), 1)) === true, 'apply pertama mengembalikan true');
ok(meshes === 0, 'pemain baru: tidak ada mesh era');
const t0 = placed.length;
ok(t0 >= 8, 'lokasi semua fitur dipesan sejak awal (tata letak tetap): ' + t0);
meshes = 0;
layer.apply(e);
ok(meshes > 40, 'semua fitur terbangun: mesh=' + meshes);
['fence', 'flood', 'parking', 'mast', 'solar', 'wind', 'drone', 'agv', 'ev', 'tower'].forEach(id => ok(layer.has(id), 'grup ' + id + ' ada'));
let thrown = null; try { for (let s = 0; s < 50; s++) layer.tick(s * 0.5, s % 2); } catch (x) { thrown = x; }
ok(!thrown, 'tick 50 frame tanpa error' + (thrown ? ': ' + thrown.message : ''));
ok(layer.apply(e2) === false, 'data sama: tidak membangun ulang');
meshes = 0; layer.apply(E.computeEra(d(2000), built([['fab', 1]]), 1));
ok(!layer.has('solar') && !layer.has('tower'), 'level/tahun turun (muat save lain): fasilitas dibuang');
thrown = null; try { layer.dispose(); } catch (x) { thrown = x; }
ok(!thrown, 'dispose aman');
console.log(fail ? ('\n' + fail + ' GAGAL') : '\nSEMUA LULUS');
process.exit(fail ? 1 : 0);
