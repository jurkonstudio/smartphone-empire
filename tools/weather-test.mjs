// Uji cuaca & senja (CampusWeather.js): fungsi murni, look, gerak hujan/salju, visibilitas, ambien mati, dispose.
// Tidak butuh probe: memakai THREE tiruan kecil. Jalankan: node tools/weather-test.mjs
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
const W = await load('src', 'ui/campus/CampusWeather.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

class Attr { constructor(a, n) { this.array = a; this.itemSize = n; this.needsUpdate = false; } setUsage() { return this; } }
class Geo { constructor() { this.attrs = {}; this.disposed = false; } setAttribute(k, v) { this.attrs[k] = v; } dispose() { this.disposed = true; } }
class Mat { constructor(o) { Object.assign(this, o); this.disposed = false; } dispose() { this.disposed = true; } }
class Obj { constructor(g, m) { this.geometry = g; this.material = m; this.visible = true; } }
class Fog { constructor(c, n, f) { this.color = { hex: c, setHex(h) { this.hex = h; } }; this.near = n; this.far = f; } }
const THREE = { BufferGeometry: Geo, BufferAttribute: Attr, LineBasicMaterial: Mat, PointsMaterial: Mat, LineSegments: Obj, Points: Obj, Fog, CanvasTexture: class { dispose() {} }, DynamicDrawUsage: 35048 };
const mkScene = () => { const kids = []; return { kids, fog: null, add(o) { kids.push(o); }, remove(o) { const i = kids.indexOf(o); if (i >= 0) kids.splice(i, 1); } }; };
const mkLight = () => ({ color: { hex: 0, setHex(h) { this.hex = h; } }, groundColor: { hex: 0, setHex(h) { this.hex = h; } }, intensity: 1 });
const mkLights = () => ({ hemi: mkLight(), sun: mkLight(), fill: mkLight(), rim: mkLight() });
const LIGHT = { hemiSky: 0xeaf2ff, hemiGround: 0xc2cfb8, hemiI: 1.05, sunCol: 0xffe6c2, sunI: 3.0, fillCol: 0xcfe0ff, fillI: 0.6, rimCol: 0xe3ecff, rimI: 0.6 };
const DARK = { hemiSky: 0x7f93bd, hemiGround: 0x1d2430, hemiI: 0.9, sunCol: 0xa9bde8, sunI: 1.7, fillCol: 0x6f8fd0, fillI: 0.35, rimCol: 0x8fb0ff, rimI: 0.55 };

// --- fungsi murni ---
ok(W.weatherForBlock(12345) === W.weatherForBlock(12345), 'weatherForBlock deterministik');
const cnt = { clear: 0, rain: 0, snow: 0 }; const N = 20000;
for (let b = 0; b < N; b++) cnt[W.weatherForBlock(b)]++;
ok(Math.abs(cnt.clear / N - 0.6) < 0.03 && Math.abs(cnt.rain / N - 0.3) < 0.03 && Math.abs(cnt.snow / N - 0.1) < 0.02,
  `distribusi ~60/30/10: ${(cnt.clear / N).toFixed(3)}/${(cnt.rain / N).toFixed(3)}/${(cnt.snow / N).toFixed(3)}`);
ok(W.blockOf(0) === 0 && W.blockOf(1800000 - 1) === 0 && W.blockOf(1800000) === 1, 'blok 30 menit');
ok(W.sunsetAmount(12) === 0 && W.sunsetAmount(16.5) === 0 && W.sunsetAmount(18) === 1 && W.sunsetAmount(19.5) === 0 && W.sunsetAmount(23) === 0, 'senja 0 siang, 1 pada 18.0, 0 pada 19.5');
ok(Math.abs(W.sunsetAmount(17.25) - 0.5) < 1e-9 && Math.abs(W.sunsetAmount(18.75) - 0.5) < 1e-9, 'senja naik/turun linear');
const o1 = W.readOverride('?weather=rain&sunset=0.5'), o2 = W.readOverride('?sunset=7&x=1'), o3 = W.readOverride('?weather=hujan');
ok(o1.weather === 'rain' && o1.sunset === 0.5 && o2.sunset === 1 && o2.weather === null && o3.weather === null && W.readOverride('').sunset === null, 'readOverride');
ok(W.mixHex(0x000000, 0xffffff, 0.5) === 0x808080 && W.mixHex(0x102030, 0x405060, 0) === 0x102030 && W.mixHex(0x102030, 0x405060, 1) === 0x405060, 'mixHex');

// --- weatherLook ---
const clear = W.weatherLook(LIGHT, 'clear', 0), rain = W.weatherLook(LIGHT, 'rain', 0), snow = W.weatherLook(LIGHT, 'snow', 0);
ok(!clear.fogOn && clear.sunI === LIGHT.sunI && clear.sunCol === LIGHT.sunCol, 'cerah tanpa senja = look asli, tanpa kabut');
ok(rain.sunI < clear.sunI && snow.sunI < clear.sunI && rain.fogOn && snow.fogOn, 'hujan & salju lebih redup dari cerah, berkabut');
ok(snow.hemiI > clear.hemiI, 'salju membuat hemi lebih terang');
const dusk = W.weatherLook(LIGHT, 'clear', 1);
ok(dusk.sunCol !== LIGHT.sunCol && dusk.sunI < LIGHT.sunI && ((dusk.sunCol >> 16) & 255) > (dusk.sunCol & 255), 'senja: matahari jingga & sedikit lebih redup');
ok(LIGHT.sunI === 3.0 && LIGHT.sunCol === 0xffe6c2, 'weatherLook tidak mengubah input');
ok(W.weatherLook(DARK, 'rain', 0).fogCol !== W.weatherLook(LIGHT, 'rain', 0).fogCol, 'warna kabut mengikuti tema');

// --- createWeather ---
const T0 = new Date(2026, 9, 24, 12, 0, 0).getTime();    // 12:00 lokal -> tanpa senja
const mk = (extra) => { const scene = mkScene(), lights = mkLights(); const w = W.createWeather(THREE, scene, Object.assign({ lights, tier: 'medium', now: () => T0, search: '', getCenter: () => ({ x: 0, z: 0 }), getHalf: () => 16 }, extra)); return { scene, lights, w }; };
const A = mk({});
ok(A.scene.kids.length === 2, 'menambah tepat 2 objek (hujan & salju)');
ok(A.w.getKind() === W.weatherForBlock(W.blockOf(T0)) && A.w.getSunset() === 0, 'jenis awal = weatherForBlock(blok sekarang); senja 0 pukul 12:00');

const R = mk({ search: '?weather=rain' });
ok(R.w.getKind() === 'rain' && R.w.rain.visible && !R.w.snow.visible, 'override hujan: hujan tampil, salju tidak');
R.w.applyLook(LIGHT);
ok(R.lights.sun.intensity < LIGHT.sunI && R.scene.fog && R.scene.fog.far === 100, 'hujan: cahaya redup + kabut terpasang');
R.w.setKind('clear');
ok(!R.w.rain.visible && !R.w.snow.visible && R.scene.fog === null && R.lights.sun.intensity === LIGHT.sunI, 'setKind(clear): partikel hilang, kabut lepas, cahaya pulih');
R.w.setKind('snow');
ok(R.w.snow.visible && !R.w.rain.visible && R.lights.hemi.intensity > LIGHT.hemiI, 'setKind(snow)');
R.w.setKind('bogus');
ok(R.w.getKind() === 'clear', 'jenis tidak dikenal -> cerah');

// gerak hujan
const Q = mk({ search: '?weather=rain', getCenter: () => ({ x: 5, z: -3 }) });
const half = 16, rp = Q.w.rainPos, nR = rp.length / 3;
Q.w.update(100, true);                       // frame pertama: dt = 0
const y0 = Array.from(rp).filter((_, i) => i % 3 === 1);
Q.w.update(100.05, true);
const y1 = Array.from(rp).filter((_, i) => i % 3 === 1);
let down = 0, wrapped = 0;
for (let i = 0; i < nR; i++) { if (y1[i] < y0[i]) down++; else if (y1[i] > y0[i]) wrapped++; }
ok(down > nR * 0.9, `hujan turun: ${down}/${nR}`);
for (let s = 0; s < 80; s++) Q.w.update(100.1 + s * 0.05, true);
let inBox = true, yOk = true;
for (let i = 0; i < nR; i++) {
  if (Math.abs(rp[i * 3] - 5) > half + 1e-6 || Math.abs(rp[i * 3 + 2] + 3) > half + 1e-6) inBox = false;
  if (rp[i * 3 + 1] < 0 || rp[i * 3 + 1] > 18) yOk = false;
}
ok(inBox && yOk, 'hujan tetap di dalam kotak dan membungkus ke atas (y 0..18)');
ok(Array.from(Q.w.rain.geometry.attrs.position.array).every(Number.isFinite), 'posisi garis hujan finite');

// gerak salju + sway
const S = mk({ search: '?weather=snow' });
const sp = S.w.snowPos, nS = sp.length / 3;
S.w.update(50, true); const sx0 = Array.from(sp).filter((_, i) => i % 3 === 0), sy0 = Array.from(sp).filter((_, i) => i % 3 === 1);
for (let s = 1; s <= 10; s++) S.w.update(50 + s * 0.1, true);
const sx1 = Array.from(sp).filter((_, i) => i % 3 === 0), sy1 = Array.from(sp).filter((_, i) => i % 3 === 1);
let sdown = 0, sway = 0;
for (let i = 0; i < nS; i++) { if (sy1[i] < sy0[i]) sdown++; if (sx1[i] !== sx0[i]) sway++; }
ok(sdown > nS * 0.9 && sway > nS * 0.9, `salju turun dan bergoyang: ${sdown}/${sway} dari ${nS}`);
ok(S.w.snow.geometry.attrs.position.needsUpdate === true, 'atribut salju ditandai needsUpdate');

// ambien mati -> diam
const D = mk({ search: '?weather=rain' });
D.w.update(10, true); D.w.update(10.05, true);
const before = Array.from(D.w.rainPos);
D.w.update(10.1, false); D.w.update(11, false);
ok(Array.from(D.w.rainPos).every((v, i) => v === before[i]), 'ambien mati: hujan diam');

// jumlah menurut tier
const cl = (t, k) => mk({ tier: t, search: '?weather=' + k });
ok(cl('low', 'rain').w.rainPos.length / 3 === 260 && cl('medium', 'rain').w.rainPos.length / 3 === 520 && cl('high', 'rain').w.rainPos.length / 3 === 900, 'jumlah hujan 260/520/900');
ok(cl('low', 'snow').w.snowPos.length / 3 === 200 && cl('medium', 'snow').w.snowPos.length / 3 === 360 && cl('high', 'snow').w.snowPos.length / 3 === 600, 'jumlah salju 200/360/600');

// senja dari jam lokal + onChange
let t = new Date(2026, 9, 24, 12, 0, 0).getTime(), changes = 0;
const Z = mk({ now: () => t, onChange: () => changes++, search: '?weather=clear' });
Z.w.applyLook(LIGHT);
ok(Z.w.getSunset() === 0 && Z.lights.sun.intensity === LIGHT.sunI, 'siang: tanpa senja');
t = new Date(2026, 9, 24, 18, 0, 0).getTime();
Z.w.update(1000, true);
ok(Math.abs(Z.w.getSunset() - 1) < 1e-9 && Z.lights.sun.intensity < LIGHT.sunI && changes === 1, 'pukul 18:00: senja penuh, cahaya bergeser, onChange dipanggil');
Z.w.update(1005, true);
ok(changes === 1, 'dicek hanya tiap ~20 detik (tidak ada onChange ganda)');
const SO = mk({ search: '?sunset=0.5' });
ok(SO.w.getSunset() === 0.5, 'override ?sunset=0.5');

// ganti blok
let tb = T0; const B = mk({ now: () => tb, onChange: () => changes++ });
const kinds = new Set(); for (let i = 0; i < 40; i++) { tb = T0 + i * 1800000; B.w.update(i * 100, true); kinds.add(B.w.getKind()); }
ok(kinds.size >= 2, 'jenis cuaca berganti antar blok: ' + Array.from(kinds).join(','));

// dispose
const X = mk({ search: '?weather=rain' }); X.w.applyLook(LIGHT);
const ro = X.w.rain, so = X.w.snow;
X.w.dispose();
ok(X.scene.kids.length === 0 && X.scene.fog === null && ro.geometry.disposed && so.geometry.disposed && ro.material.disposed && so.material.disposed, 'dispose: objek dilepas, kabut dilepas, geometri & material dibuang');
X.w.update(1, true); X.w.applyLook(LIGHT); X.w.dispose();
ok(true, 'dispose ganda & panggilan setelah dispose aman');

console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
