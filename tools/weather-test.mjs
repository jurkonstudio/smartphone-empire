// Uji cuaca (5 kondisi: clear, sunny, overcast, rain, snow) & senja (CampusWeather.js): fungsi murni, look, gerak hujan/salju, visibilitas, ambien mati, dispose.
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
const cnt = { clear: 0, sunny: 0, overcast: 0, rain: 0, snow: 0 }; const N = 40000;
for (let b = 0; b < N; b++) cnt[W.weatherForBlock(b)]++;
const exp5 = { clear: 0.40, sunny: 0.20, overcast: 0.15, rain: 0.15, snow: 0.10 };
ok(Object.keys(exp5).every(k => Math.abs(cnt[k] / N - exp5[k]) < 0.02) && Object.keys(cnt).length === 5,
  'distribusi ~40/20/15/15/10: ' + Object.keys(exp5).map(k => (cnt[k] / N).toFixed(3)).join('/'));
ok(W.KINDS.length === 5 && W.KINDS.every(k => W.isKind(k)) && !W.isKind('hujan'), 'daftar 5 kondisi');
ok(W.blockOf(0) === 0 && W.blockOf(1800000 - 1) === 0 && W.blockOf(1800000) === 1, 'blok 30 menit');
ok(W.sunsetAmount(12) === 0 && W.sunsetAmount(16.5) === 0 && W.sunsetAmount(18) === 1 && W.sunsetAmount(19.5) === 0 && W.sunsetAmount(23) === 0, 'senja 0 siang, 1 pada 18.0, 0 pada 19.5');
ok(Math.abs(W.sunsetAmount(17.25) - 0.5) < 1e-9 && Math.abs(W.sunsetAmount(18.75) - 0.5) < 1e-9, 'senja naik/turun linear');
const o1 = W.readOverride('?weather=rain&sunset=0.5'), o2 = W.readOverride('?sunset=7&x=1'), o3 = W.readOverride('?weather=hujan');
ok(o1.weather === 'rain' && o1.sunset === 0.5 && o2.sunset === 1 && o2.weather === null && o3.weather === null && W.readOverride('').sunset === null, 'readOverride');
ok(['clear', 'sunny', 'overcast', 'rain', 'snow'].every(k => W.readOverride('?weather=' + k).weather === k) && W.readOverride('?weather=sunnyy').weather === null, 'override URL untuk kelima kondisi');

// --- senja bergantung cuaca ---
ok(W.sunsetFor('sunny', 18) === 1 && W.sunsetFor('clear', 18) === 0 && W.sunsetFor('rain', 18) === 0 && W.sunsetFor('snow', 18) === 0, 'senja: penuh di sunny; nol di clear/rain/snow pada 18.0');
ok(W.sunsetFor('overcast', 18) > 0 && W.sunsetFor('overcast', 18) <= 0.1 + 1e-9, 'senja mendung sangat kecil (<=0.1)');
ok(W.sunsetFor('sunny', 12) === 0 && W.sunsetFor('sunny', 17.25) === 0.5 && W.sunsetFor('bogus', 18) === 0, 'senja sunny mengikuti jam; kondisi asing = 0');
ok(W.mixHex(0x000000, 0xffffff, 0.5) === 0x808080 && W.mixHex(0x102030, 0x405060, 0) === 0x102030 && W.mixHex(0x102030, 0x405060, 1) === 0x405060, 'mixHex');

// --- weatherLook ---
const clear = W.weatherLook(LIGHT, 'clear', 0), rain = W.weatherLook(LIGHT, 'rain', 0), snow = W.weatherLook(LIGHT, 'snow', 0);
const sunny = W.weatherLook(LIGHT, 'sunny', 0), over = W.weatherLook(LIGHT, 'overcast', 0);
ok(!clear.fogOn && clear.sunI === LIGHT.sunI && clear.sunCol === LIGHT.sunCol, 'cerah tanpa senja = look asli, tanpa kabut');
ok(sunny.sunI > clear.sunI && !sunny.fogOn && sunny.rimI > clear.rimI, 'sangat cerah: matahari lebih kuat dari cerah, tanpa kabut');
ok(over.sunI < clear.sunI * 0.4 && over.hemiI > clear.hemiI && over.hemiI / over.sunI > clear.hemiI / clear.sunI * 2, 'mendung: matahari <40% cerah, hemisphere dominan');
ok(over.fogOn && over.fogFar > rain.fogFar && over.fogNear > rain.fogNear, 'mendung: kabut tipis (lebih jauh dari hujan)');
ok(((over.hemiSky >> 16) & 255) - (over.hemiSky & 255) < ((LIGHT.hemiSky >> 16) & 255) - (LIGHT.hemiSky & 255) + 1 && over.hemiSky !== LIGHT.hemiSky, 'mendung: langit abu dingin (bukan hangat)');
ok(rain.sunI < clear.sunI && snow.sunI < clear.sunI && rain.fogOn && snow.fogOn, 'hujan & salju lebih redup dari cerah, berkabut');
ok(snow.hemiI > clear.hemiI, 'salju membuat hemi lebih terang');
ok(over.sunI > rain.sunI * 0.5 && rain.fogFar < snow.fogFar + 20, 'hujan tetap lebih gelap/berkabut dari mendung');
const dusk = W.weatherLook(LIGHT, 'sunny', 1);
ok(dusk.sunCol !== sunny.sunCol && dusk.sunI < sunny.sunI && ((dusk.sunCol >> 16) & 255) - (dusk.sunCol & 255) > 120, 'senja (sunny): matahari jingga & sedikit lebih redup');
ok(['clear', 'rain', 'snow'].every(k => JSON.stringify(W.weatherLook(LIGHT, k, 1)) === JSON.stringify(W.weatherLook(LIGHT, k, 0))), 'clear/rain/snow tidak menerima senja (weatherLook)');
const od = W.weatherLook(LIGHT, 'overcast', 1);
ok(od.sunCol !== over.sunCol && ((od.sunCol >> 16) & 255) - (od.sunCol & 255) < 60 && od.sunCol !== dusk.sunCol, 'mendung: rona senja hanya samar');
// semua kondisi x tema x senja: tidak NaN, warna valid
let lookOk = true;
for (const L of [LIGHT, DARK]) for (const k of W.KINDS) for (const sv of [0, 0.5, 1]) {
  const w = W.weatherLook(L, k, sv);
  for (const key of ['hemiI', 'sunI', 'fillI', 'rimI']) if (!Number.isFinite(w[key]) || w[key] < 0) lookOk = false;
  for (const key of ['hemiSky', 'hemiGround', 'sunCol', 'fillCol', 'rimCol', 'fogCol']) if (!Number.isInteger(w[key]) || w[key] < 0 || w[key] > 0xffffff) lookOk = false;
}
ok(lookOk, 'weatherLook: 5 kondisi x 2 tema x 3 senja tanpa NaN, warna 0..0xffffff');
// awan
const cc = W.cloudLook('clear', 0, false), co = W.cloudLook('overcast', 0, false), cr = W.cloudLook('rain', 0, false), cs = W.cloudLook('sunny', 1, false), cd = W.cloudLook('clear', 1, false);
ok(cc.color === 0xffffff && cc.opacity === 0.8 && cc.y === 9, 'awan cerah = tampilan asli');
ok(co.color !== 0xffffff && co.y < cc.y && co.opacity > cc.opacity && cr.y <= co.y, 'awan mendung/hujan: lebih gelap, rendah, pekat');
ok(cs.color !== 0xffffff && ((cs.color >> 16) & 255) > (cs.color & 255) && cd.color === 0xffffff, 'awan senja jingga hanya saat sunny');
ok(W.cloudLook('clear', 0, true).opacity === 0.45 && W.cloudLook('clear', 0, true).shadow === 0.16, 'awan tema gelap = tampilan asli');
ok(LIGHT.sunI === 3.0 && LIGHT.sunCol === 0xffe6c2, 'weatherLook tidak mengubah input');
ok(W.weatherLook(DARK, 'rain', 0).fogCol !== W.weatherLook(LIGHT, 'rain', 0).fogCol, 'warna kabut mengikuti tema');

// --- createWeather ---
const T0 = new Date(2026, 9, 24, 12, 0, 0).getTime();    // 12:00 lokal -> tanpa senja
const mk = (extra) => { const scene = mkScene(), lights = mkLights(); const w = W.createWeather(THREE, scene, Object.assign({ lights, tier: 'medium', now: () => T0, search: '', getCenter: () => ({ x: 0, z: 0 }), getHalf: () => 16 }, extra)); return { scene, lights, w }; };
const A = mk({});
ok(A.scene.kids.length === 3, 'menambah tepat 3 objek (hujan, percikan, salju)');
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

// lima kondisi di createWeather
const kinds5 = {};
for (const k of W.KINDS) {
  const M5 = mk({ search: '?weather=' + k + '&sunset=1' }); M5.w.applyLook(LIGHT);
  kinds5[k] = { w: M5.w, lights: M5.lights, scene: M5.scene };
}
ok(W.KINDS.every(k => kinds5[k].w.getKind() === k), 'override memilih tiap kondisi');
ok(kinds5.rain.w.rain.visible && !kinds5.rain.w.snow.visible && kinds5.snow.w.snow.visible && !kinds5.snow.w.rain.visible, 'partikel hanya untuk hujan/salju');
ok(['clear', 'sunny', 'overcast'].every(k => !kinds5[k].w.rain.visible && !kinds5[k].w.snow.visible && !kinds5[k].w.splash.visible), 'cerah/sangat cerah/mendung tanpa partikel');
ok(kinds5.sunny.w.getSunset() === 1 && kinds5.clear.w.getSunset() === 0 && kinds5.rain.w.getSunset() === 0 && kinds5.snow.w.getSunset() === 0 && Math.abs(kinds5.overcast.w.getSunset() - 0.1) < 1e-9, 'senja efektif per kondisi saat ?sunset=1');
ok(kinds5.sunny.scene.fog === null && kinds5.clear.scene.fog === null && kinds5.overcast.scene.fog && kinds5.overcast.scene.fog.far === 160 && kinds5.rain.scene.fog && kinds5.snow.scene.fog, 'kabut hanya untuk mendung, hujan, salju');
const sl = kinds5.sunny.lights, ol = kinds5.overcast.lights, cl5 = kinds5.clear.lights;
const warm = h => ((h >> 16) & 255) - (h & 255);
ok(warm(sl.sun.color.hex) > warm(LIGHT.sunCol) + 50 && cl5.sun.color.hex === LIGHT.sunCol, 'sunny senja jingga di lampu; clear tetap asli walau ?sunset=1');
ok(ol.sun.intensity < LIGHT.sunI * 0.4, 'mendung: intensitas matahari <40% dari cerah');
// sunny siang hari tanpa senja tetap lebih kuat dari cerah
const SD = mk({ search: '?weather=sunny' }); SD.w.applyLook(LIGHT);
ok(SD.w.getSunset() === 0 && SD.lights.sun.intensity > LIGHT.sunI, 'sunny siang: tanpa senja tapi lebih terang dari cerah');
// ganti kondisi di tempat mengikuti faktor senja
const SW = mk({ search: '?sunset=1' }); SW.w.applyLook(LIGHT);
SW.w.setKind('sunny'); const sunnySun = SW.w.getSunset();
SW.w.setKind('rain'); const rainSun = SW.w.getSunset();
SW.w.setKind('overcast');
ok(sunnySun === 1 && rainSun === 0 && Math.abs(SW.w.getSunset() - 0.1) < 1e-9, 'setKind menghitung ulang senja efektif');
for (const k of W.KINDS) kinds5[k].w.dispose();
ok(W.KINDS.every(k => kinds5[k].scene.kids.length === 0 && kinds5[k].scene.fog === null), 'dispose membersihkan semua kondisi');

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
for (let i = 0; i < nS; i++) { if (sy1[i] !== sy0[i]) sdown++; if (sx1[i] !== sx0[i]) sway++; }   // bergerak (butiran yang membungkus ke atas tetap dihitung)
ok(sdown > nS * 0.95 && sway > nS * 0.9, `salju bergerak dan bergoyang: ${sdown}/${sway} dari ${nS}`);
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
const Z = mk({ now: () => t, onChange: () => changes++, search: '?weather=sunny' });
Z.w.applyLook(LIGHT);
const noonSun = Z.lights.sun.intensity;
ok(Z.w.getSunset() === 0 && noonSun > LIGHT.sunI, 'siang (sunny): tanpa senja');
t = new Date(2026, 9, 24, 18, 0, 0).getTime();
Z.w.update(1000, true);
ok(Math.abs(Z.w.getSunset() - 1) < 1e-9 && Z.lights.sun.intensity < noonSun && changes === 1, 'pukul 18:00 (sunny): senja penuh, cahaya bergeser, onChange dipanggil');
const ZC = mk({ now: () => t, search: '?weather=clear' }); ZC.w.applyLook(LIGHT);
ok(ZC.w.getSunset() === 0 && ZC.lights.sun.intensity === LIGHT.sunI && ZC.lights.sun.color.hex === LIGHT.sunCol, 'pukul 18:00 (clear): tanpa senja sama sekali');
const ZR = mk({ now: () => t, search: '?weather=rain' }); ZR.w.applyLook(LIGHT);
const ZR0 = mk({ now: () => T0, search: '?weather=rain' }); ZR0.w.applyLook(LIGHT);
ok(ZR.lights.sun.color.hex === ZR0.lights.sun.color.hex && ZR.lights.sun.intensity === ZR0.lights.sun.intensity, 'pukul 18:00 (hujan): sama persis dengan siang (tanpa oranye)');
Z.w.update(1005, true);
ok(changes === 1, 'dicek hanya tiap ~20 detik (tidak ada onChange ganda)');
const SO = mk({ search: '?weather=sunny&sunset=0.5' });
ok(SO.w.getSunset() === 0.5, 'override ?sunset=0.5 (sunny)');
ok(mk({ search: '?weather=snow&sunset=0.5' }).w.getSunset() === 0, 'override ?sunset tetap dikalikan faktor cuaca (salju = 0)');

// ganti blok
let tb = T0; const B = mk({ now: () => tb, onChange: () => changes++ });
const kinds = new Set(); for (let i = 0; i < 40; i++) { tb = T0 + i * 1800000; B.w.update(i * 100, true); kinds.add(B.w.getKind()); }
ok(kinds.size >= 3, 'jenis cuaca berganti antar blok: ' + Array.from(kinds).join(','));

// dispose
const X = mk({ search: '?weather=rain' }); X.w.applyLook(LIGHT);
const ro = X.w.rain, so = X.w.snow;
X.w.dispose();
ok(X.scene.kids.length === 0 && X.scene.fog === null && ro.geometry.disposed && so.geometry.disposed && ro.material.disposed && so.material.disposed, 'dispose: objek dilepas, kabut dilepas, geometri & material dibuang');
X.w.update(1, true); X.w.applyLook(LIGHT); X.w.dispose();
ok(true, 'dispose ganda & panggilan setelah dispose aman');

// hujan organik: warna memudar di tepi kotak, goresan miring, panjang bervariasi
const F = mk({ search: '?weather=rain', getCenter: () => ({ x: 0, z: 0 }) });
F.w.applyLook(DARK);
const col = F.w.rain.geometry.attrs.color.array, pos = F.w.rain.geometry.attrs.position.array;
let edgeSum = 0, edgeN = 0, midSum = 0, midN = 0, lenMin = 1e9, lenMax = -1e9, slantOk = true;
for (let i = 0; i < F.w.rainPos.length / 3; i++) {
  const x = F.w.rainPos[i * 3], z = F.w.rainPos[i * 3 + 2], br = col[i * 6];
  const ex = Math.min(1 - Math.abs(x) / 16, 1 - Math.abs(z) / 16);
  if (ex < 0.05) { edgeSum += br; edgeN++; } else if (ex > 0.5) { midSum += br; midN++; }
  const L = pos[i * 6 + 4] - pos[i * 6 + 1];
  lenMin = Math.min(lenMin, L); lenMax = Math.max(lenMax, L);
  if (!(pos[i * 6 + 3] < pos[i * 6])) slantOk = false;
}
ok(edgeN > 0 && midN > 0 && edgeSum / edgeN < midSum / midN * 0.5, 'tepi kotak lebih redup dari tengah');
ok(lenMax - lenMin > 0.5, 'panjang goresan bervariasi: ' + lenMin.toFixed(2) + '..' + lenMax.toFixed(2));
ok(slantOk, 'semua goresan miring ke arah angin');
ok(Array.from(col).every(Number.isFinite) && Array.from(col).every(v => v >= 0 && v <= 1), 'warna hujan finite & 0..1');
F.w.applyLook(LIGHT);
ok(F.w.rain.material.needsUpdate === true, 'pergantian tema menandai ulang material hujan');

// hujan realistis (rev. 2): angin berubah, goresan miring searah angin, percikan di tanah
ok(W.windAt(0) > 0 && W.windAt(0) < 0.4, 'angin positif & wajar');
let wmin = 9, wmax = -9; for (let t = 0; t < 300; t += 0.5) { const v = W.windAt(t); wmin = Math.min(wmin, v); wmax = Math.max(wmax, v); }
ok(wmax - wmin > 0.05 && wmin > 0, 'angin berubah pelan: ' + wmin.toFixed(3) + '..' + wmax.toFixed(3));
const RW = mk({ search: '?weather=rain', getCenter: () => ({ x: 0, z: 0 }) });
RW.w.applyLook(DARK);
RW.w.update(200, true);
let spawned = 0;
for (let s = 1; s <= 60; s++) RW.w.update(200 + s * 0.05, true);       // 3 detik ambien
for (const a of RW.w.spAge) if (a < 0.22) spawned++;
ok(spawned > 0, 'percikan muncul saat tetes menyentuh tanah: ' + spawned + ' aktif');
ok(RW.w.spAge.some(a => a >= 0.22), 'percikan lama mati (tidak menumpuk)');


RW.w.update(203.05, true);
const pos2 = RW.w.rain.geometry.attrs.position.array;
let ratioOk = 0, ratioN = 0;
for (let i = 0; i < RW.w.rainLen.length; i++) {
  const L = pos2[i * 6 + 4] - pos2[i * 6 + 1];
  if (L > 0.1) { ratioN++; const r = (pos2[i * 6 + 3] - pos2[i * 6]) / L; if (Math.abs(r + W.windAt(203.05) * 1.0) < W.windAt(203.05) * 0.4) ratioOk++; }
}
ok(ratioN > 0 && ratioOk / ratioN > 0.8, 'goresan miring sesuai angin: ' + ratioOk + '/' + ratioN);
ok(RW.w.splash.visible === true && RW.w.snow.visible === false, 'percikan tampil saat hujan');
const dsp = mk({ search: '?weather=snow' });
ok(dsp.w.splash.visible === false, 'percikan tersembunyi saat salju');
RW.w.setKind('clear');
ok(RW.w.splash.visible === false, 'percikan hilang saat cerah');
RW.w.dispose();
ok(RW.scene.kids.length === 0, 'dispose membuang percikan juga');

console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
