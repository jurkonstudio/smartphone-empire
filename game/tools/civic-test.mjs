// Uji Bank Kota + Perumahan Karyawan + Jalan Permukiman (registri, level, tata letak, builder 3D, kendaraan/penghuni).
// THREE & aset tiruan; jalankan: node tools/civic-test.mjs
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
const D = await load('src', 'data/campus-buildings.data.js');
const B = await load('src', 'ui/campus/CampusBuildings.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

// --- registri ---
const errs = D.validateCampusRegistry(B.BUILDER_IDS);
ok(errs.length === 0, 'registri valid + semua gedung punya builder' + (errs.length ? ': ' + errs.join('; ') : ''));
ok(B.BUILDER_IDS.includes('bank') && B.BUILDER_IDS.includes('housing') && D.CAMPUS_BY_ID.bank && D.CAMPUS_BY_ID.housing, 'bank & housing terdaftar');
ok(D.CAMPUS_BY_ID.bank.nav.view === 'team' && D.CAMPUS_BY_ID.bank.nav.sub === 'bank', 'tombol "Buka Bank" menuju Tim > Bank');

// --- level ---
const lvl = (id, d) => B.computePlan(d).levels[id];
ok(lvl('bank', {}) === 1, 'bank sudah berdiri sejak awal (Lv1) walau belum memakai layanan');
const fin = (loans, deps, drawn) => ({ finance: { loans: new Array(loans).fill({}), bank: { deposits: new Array(deps).fill({}), line: { drawn: drawn || 0 } } } });
ok(lvl('bank', fin(1, 0)) === 1 && lvl('bank', fin(1, 1)) === 2 && lvl('bank', fin(2, 2, 1)) === 3 && lvl('bank', fin(0, 0, 500)) === 1, 'bank: Lv1 -> Lv2 pada 2 layanan -> Lv3 pada 5 (kredit modal kerja dihitung 1)');
ok(lvl('bank', { finance: {} }) === 1 && lvl('bank', { finance: { bank: null, loans: 'x' } }) === 1, 'bank: data finance rusak/kosong tidak error');
const staff = n => ({ staff: new Array(n).fill({}) });
ok(lvl('housing', {}) === 0 && lvl('housing', staff(2)) === 0 && lvl('housing', staff(3)) === 1 && lvl('housing', staff(10)) === 2 && lvl('housing', staff(25)) === 3 && lvl('housing', staff(99)) === 3, 'perumahan: Lv0/1/2/3 pada staf 0-2 / 3 / 10 / 25');
const pr = D.CAMPUS_BUILDINGS.find(b => b.id === 'housing').progressFn(staff(5));
ok(pr.next === 10 && pr.cur === 5, 'progres perumahan menuju level berikutnya');

// --- tata letak ---
const fpOf = id => { const e = D.CAMPUS_BY_ID[id], p = e.slot; return { id, x0: p[0] + e.fp[0], x1: p[0] + e.fp[1], z0: p[1] + e.fp[2], z1: p[1] + e.fp[3] }; };
const over = (a, b, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.z0 < b.z1 + pad && a.z1 > b.z0 - pad;
const ids = D.CAMPUS_SLOT_ORDER;
let overl = [];
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if ((ids[i] === 'bank' || ids[j] === 'bank' || ids[i] === 'housing' || ids[j] === 'housing') && over(fpOf(ids[i]), fpOf(ids[j]))) overl.push(ids[i] + '/' + ids[j]);
ok(overl.length === 0, 'lahan bank & perumahan tidak bertumpuk dengan gedung lain' + (overl.length ? ': ' + overl.join(',') : ''));
const hq = { x0: -3.4, x1: 4.5, z0: -3.4, z1: 3.4 };
ok(!over(fpOf('bank'), hq) , 'bank tidak menabrak HQ');
const roadRect = D.CAMPUS_ROADS[0];
const others = ids.filter(i => i !== 'housing').filter(i => over(fpOf(i), roadRect));
ok(others.length === 0, 'Jalan Permukiman tidak menembus gedung lain' + (others.length ? ': ' + others.join(',') : ''));
ok(over(fpOf('housing'), roadRect), 'Jalan Permukiman berada di dalam lahan Perumahan');
const inRect = (p, r, pad) => p[0] > r.x0 - pad && p[0] < r.x1 + pad && p[1] > r.z0 - pad && p[1] < r.z1 + pad;
ok(D.CAMPUS_ROADS.every(r => !B.TREE_SPOTS.some(p => inRect(p, r, 0.3)) && !B.LAMP_SPOTS.some(p => inRect(p, r, 0)) && !B.SHRUB_SPOTS.some(p => inRect(p, r, 0))), 'pohon, lampu, semak lama tidak berdiri di jalan baru');
ok(!B.TREE_SPOTS.some(p => inRect(p, fpOf('housing'), 0)) && !B.TREE_SPOTS.some(p => inRect(p, fpOf('bank'), 0)), 'tidak ada pohon di lahan bank / perumahan');
ok(Math.hypot(D.CAMPUS_BY_ID.housing.slot[0] - 0, D.CAMPUS_BY_ID.housing.slot[1]) < 20, 'perumahan di dalam pulau');

// --- builder 3D dengan THREE tiruan ---
class V { constructor() { this.x = 0; this.y = 0; this.z = 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }
class O3 { constructor() { this.children = []; this.position = new V(); this.rotation = { x: 0, y: 0, z: 0 }; this.scale = new V().set(1, 1, 1); this.userData = {}; } add(...c) { c.forEach(k => this.children.push(k)); return this; } traverse(f) { f(this); this.children.forEach(c => c.traverse(f)); } }
class Mesh extends O3 { constructor(g, m) { super(); this.geometry = g; this.material = m; this.isMesh = true; } }
class Group extends O3 {}
class Inst extends Mesh { constructor(g, m, n) { super(g, m); this.count = n; this.isInstancedMesh = true; this.instanceMatrix = { needsUpdate: false }; } setMatrixAt() {} setColorAt() {} dispose() {} }
const THREE = { Group, Mesh, InstancedMesh: Inst, Matrix4: class { compose() {} }, Quaternion: class { setFromEuler() {} }, Euler: class { set() {} }, Vector3: class { set() {} }, Color: class { setRGB() {} } };
const A = new Proxy({ variantSeed: 0, roofAlt: false, realShadows: true, facadeRole: () => 'facade', mat: r => ({ role: r }) }, {
  get: (t, k) => k in t ? t[k] : (...a) => ({ g: k, a })
});
function world(o, base, out) {
  // posisi dunia pusat mesh (hanya putaran Y; cukup untuk uji batas)
  const c = Math.cos(base.ry), s = Math.sin(base.ry);
  const wx = base.x + (o.position.x * c + o.position.z * s), wz = base.z + (-o.position.x * s + o.position.z * c);
  const nb = { x: wx, z: wz, ry: base.ry + (o.rotation.y || 0) };
  if (o.isMesh && !o.isInstancedMesh) out.push([wx, wz, o.material && o.material.role, o.geometry]);
  o.children.forEach(ch => world(ch, nb, out));
}
const stats = {};
for (const id of ['bank', 'housing']) {
  stats[id] = [];
  for (const level of [1, 2, 3]) for (const era of [0, 5]) {
    let g = null, err = null;
    try { g = B.buildSlot(A, THREE, id, level, era); } catch (e) { err = e; }
    ok(!err && g, `${id} Lv${level} era${era}: terbangun` + (err ? ' ' + err.message : ''));
    if (!g) continue;
    ok(g.position.x === D.CAMPUS_BY_ID[id].slot[0] && g.position.z === D.CAMPUS_BY_ID[id].slot[1] && g.userData.id === id && g.userData.level === level, `${id} Lv${level}: posisi slot & userData`);
    const pts = []; world(g, { x: 0, z: 0, ry: 0 }, pts);
    const fp = fpOf(id), m = 0.55;
    const inRoad = p => D.CAMPUS_ROADS.some(r => p[1] > r.z0 - 0.1 && p[1] < r.z1 + 0.1 && p[0] > r.x0 - 0.1 && p[0] < r.x1 + 0.1);   // badan jalan boleh keluar dari lahan gedung
    const out = pts.filter(p => !inRoad(p) && (p[0] < fp.x0 - m || p[0] > fp.x1 + m || p[1] < fp.z0 - m || p[1] > fp.z1 + m));
    ok(out.length === 0, `${id} Lv${level} era${era}: semua bagian di dalam lahan (+${m})` + (out.length ? ' keluar: ' + out.length + ' contoh ' + out[0].slice(0, 2).map(v => v.toFixed(1)) : ''));
    let n = 0; g.traverse(o => { if (o.isMesh) n++; });
    if (era === 0) stats[id].push(n);
  }
}
ok(stats.bank[0] < stats.bank[1] && stats.bank[1] < stats.bank[2], 'bank makin kompleks per level: ' + stats.bank.join('<'));
ok(stats.housing[0] < stats.housing[1] && stats.housing[1] < stats.housing[2], 'perumahan makin ramai per level: ' + stats.housing.join('<'));
ok(Math.max(...stats.bank, ...stats.housing) < 140, 'budget mesh per gedung < 140 (maks ' + Math.max(...stats.bank, ...stats.housing) + ')');
ok(B.buildSlot(A, THREE, 'bank', 0, 0) === null && B.buildSlot(A, THREE, 'housing', 0, 0) === null, 'level 0 = tidak dibangun');
// jumlah rumah per level: hitung grup rumah (anak langsung g yang punya rotation dan >5 mesh)
const houses = lv => B.buildSlot(A, THREE, 'housing', lv, 0).children.filter(c => c.children && c.children.length >= 8 && c.children.every(k => k.isMesh)).length;
ok(houses(1) === 3 && houses(2) === 6 && houses(3) === 10, `rumah per level 3/6/8 (+apartemen & taman di Lv3): ${houses(1)}/${houses(2)}/${houses(3)} grup`);
const hs = B.buildSlot(A, THREE, 'housing', 3, 0), pts = []; world(hs, { x: 0, z: 0, ry: 0 }, pts);
ok(pts.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1])), 'posisi finite');

console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
