// Uji manusia realistis (CampusPeople.js + integrasi CampusLife): proporsi, ayunan, arah badan, payung saat hujan,
// variasi, budget mesh, dispose. THREE tiruan kecil; jalankan: node tools/people-test.mjs
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
const P = await load('src', 'ui/campus/CampusPeople.js');
const LIFE = await load('src', 'ui/campus/CampusLife.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

class V { constructor() { this.x = 0; this.y = 0; this.z = 0; } set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } copy(o) { return this.set(o.x, o.y, o.z); } setScalar(s) { return this.set(s, s, s); } }
class Obj3 { constructor() { this.children = []; this.position = new V(); this.rotation = { x: 0, y: 0, z: 0 }; this.scale = new V().set(1, 1, 1); this.visible = true; } add() { for (const c of arguments) this.children.push(c); return this; } remove(o) { const i = this.children.indexOf(o); if (i >= 0) this.children.splice(i, 1); } }
let meshes = 0;
class Mesh extends Obj3 { constructor(g, m) { super(); this.geometry = g; this.material = m; meshes++; } }
class Group extends Obj3 {}
const allMats = [];
class Mat { constructor(o) { allMats.push(this); Object.assign(this, o); this.disposed = false; this.color = { hex: o && o.color, setHex(h) { this.hex = h; } }; } dispose() { this.disposed = true; } }
const THREE = { Group, Mesh, MeshStandardMaterial: Mat };
const geoCache = {};
const A = new Proxy({ track() {} }, { get: (t, k) => k in t ? t[k] : (...a) => { const key = k + a.join('_'); return geoCache[key] || (geoCache[key] = { key, w: a[0], h: a[1] }); } });
const mats = [];
const mk = c => { const m = new Mat({ color: c }); mats.push(m); return m; };
const put = (g, m, x, y, z) => { const o = new Mesh(g, m); o.position.set(x, y, z); return o; };
const walk = (o, f) => { f(o); (o.children || []).forEach(c => walk(c, f)); };

// --- fungsi murni ---
ok(P.yawFor('x', true) === 0 && Math.abs(P.yawFor('x', false) - Math.PI) < 1e-9 && P.yawFor('z', true) > 0 && P.yawFor('z', false) < 0, 'yawFor: arah badan sesuai sumbu jalan');
ok(Math.abs(P.wrapAngle(3 * Math.PI) - Math.PI) < 1e-9 || Math.abs(P.wrapAngle(3 * Math.PI) + Math.PI) < 1e-9, 'wrapAngle ke -PI..PI');
const looks = Array.from({ length: 10 }, (_, i) => P.personLook(i));
ok(new Set(looks.map(l => l.skin)).size >= 4 && new Set(looks.map(l => l.shirt)).size >= 8 && new Set(looks.map(l => l.hair)).size >= 4, 'variasi kulit/baju/rambut antar 10 orang');
ok(new Set(looks.map(l => [l.skin, l.hair, l.shirt, l.pants].join())).size === 10, '10 orang punya kombinasi unik');
ok(P.personLook(3).pack && !P.personLook(1).pack && looks.some(l => !l.umb) && looks.some(l => l.umb), 'sebagian membawa ransel; sebagian tanpa payung');

// --- satu orang ---
const root = new Group();
const people = P.createPeople(THREE, A, root, mk, put);
const before = meshes;
const p = people.add({ axis: 'x', side: 1.22, speed: 0.045, s0: 0.1, index: 0 });
const perPerson = meshes - before;
ok(perPerson >= 9 && perPerson <= 12, 'mesh per orang 9..12: ' + perPerson);
ok(root.children.length === 1 && root.children[0] === p.g, 'satu grup per orang di root');
let top = 0; walk(p.g, o => { if (o instanceof Mesh && !(p.umb && p.umb.children.includes(o))) top = Math.max(top, o.position.y + (o.geometry.h && o.geometry.key.startsWith('sph') ? 0 : 0)); });
ok(top > 0.3 && top < 0.5, 'tinggi manusia wajar (kepala ~0.37): ' + top.toFixed(2));
ok(p.umb && p.umb.visible === false, 'payung tersembunyi saat tidak hujan');

// ayunan
people.pose(p, 0.0, true, 1); people.endFrame(1);
ok(p.legL.rotation.z === 0 && p.armL.rotation.z === 0, 'fase 0: kaki dan lengan lurus');
people.pose(p, 0.04, true, 1.02); people.endFrame(1.02);
ok(Math.sign(p.legL.rotation.z) === -Math.sign(p.legR.rotation.z) && p.legL.rotation.z !== 0, 'kaki kiri-kanan berayun berlawanan');
ok(Math.sign(p.armL.rotation.z) === -Math.sign(p.legL.rotation.z), 'lengan berlawanan dengan kaki sisi yang sama');
let maxS = 0; for (let d = 0; d < 3; d += 0.01) { people.pose(p, d, true, 2 + d); maxS = Math.max(maxS, Math.abs(p.legL.rotation.z)); }
ok(maxS <= 0.6 + 1e-9 && maxS > 0.55, 'ayunan kaki dibatasi <= 0.6 rad: ' + maxS.toFixed(3));

// belok halus
p.yaw = 0; people.endFrame(10); people.pose(p, 0, false, 10.05);
ok(p.yaw > 0 && p.yaw < Math.PI * 0.5, 'berbalik arah berputar halus (tidak melompat): ' + p.yaw.toFixed(2));
for (let k = 0; k < 40; k++) { people.pose(p, 0, false, 10.05 + k * 0.05); people.endFrame(10.05 + k * 0.05); }
ok(Math.abs(Math.abs(p.yaw) - Math.PI) < 1e-6, 'akhirnya menghadap arah baru');

// payung
people.setRain(true);
ok(p.umb.visible === true, 'hujan: payung terbuka');
people.pose(p, 0.2, true, 20);
ok(p.armR.rotation.z === -0.5, 'hujan: lengan pemegang payung tidak berayun');
people.setRain(false);
ok(p.umb.visible === false, 'cerah: payung ditutup');
const noUmb = people.add({ axis: 'z', side: -1.22, speed: 0.04, s0: 1, index: 3 });
people.setRain(true);
ok(noUmb.umb === null, 'orang tanpa payung tetap tanpa (tidak error)');

// --- integrasi CampusLife ---
meshes = 0;
const scene = new Group();
const forest = { }; 
const A2 = new Proxy({ track() {}, mat: () => new Mat({ emissiveIntensity: 0, emissive: { setHex() {} } }), facadeKeys: [] }, { get: (t, k) => k in t ? t[k] : (...a) => { const key = k + a.join('_'); return geoCache[key] || (geoCache[key] = { key, w: a[0], h: a[1] }); } });
const link = { heightAt: () => 0, deckY: 0 };
let life = null, buildErr = null;
try { life = LIFE.createCampusLife(THREE, A2, scene, [], link); } catch (e) { buildErr = e; }
if (buildErr) console.log(buildErr.stack.split('\n').slice(0, 4).join('\n'));
ok(!buildErr && life && typeof life.setSky === 'function', 'CampusLife dibuat dengan pejalan baru');
let umbs = 0; walk(scene, o => { if (o.children && o.children.length === 2 && o.children.every(c => c instanceof Mesh) && o.visible === false) umbs++; });
ok(umbs >= 7, 'pejalan membawa payung (tersembunyi saat cerah): ' + umbs + ' grup payung');
life.setSky('rain', 0);
let shown = 0; walk(scene, o => { if (o.children && o.children.length === 2 && o.children.every(c => c instanceof Mesh) && o.visible === true && o.children[0].geometry.key.startsWith('cyl0.004')) shown++; });
ok(shown >= 7, 'life.setSky(rain): payung terbuka: ' + shown);
life.setSky('sunny', 1);
let shown2 = 0; walk(scene, o => { if (o.children && o.children.length === 2 && o.children.every(c => c instanceof Mesh) && o.visible === true && o.children[0].geometry.key.startsWith('cyl0.004')) shown2++; });
ok(shown2 === 0, 'life.setSky(sunny): payung tertutup');
let threw = false;
try { for (let t = 0; t < 120; t += 0.033) life.update(t); } catch (e) { threw = e; }
ok(!threw, 'update 120 detik tanpa error' + (threw ? ': ' + threw.stack : ''));
life.dispose();
ok(scene.children.length === 0, 'dispose CampusLife melepas root dari scene');
const lifeMats = allMats.filter(m => m.roughness !== undefined);
ok(lifeMats.length > 20 && lifeMats.every(m => m.disposed), 'dispose membuang semua material (termasuk manusia): ' + lifeMats.length);

console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
