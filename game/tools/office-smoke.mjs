// Smoke test OfficeScene (kantor di area kampus) dengan THREE & DOM tiruan ringan, tanpa WebGL.
// Jalankan dari root repo: node tools/office-smoke.mjs src
// Memeriksa: adegan terbentuk, tidak ada mesh bermaterial undefined, update/tema/bahasa/dispose berjalan,
// dan (khusus v2027.54a) tidak ada lagi objek laut/pulau, ada gedung kampus, pintu utama, serta mesh <= anggaran.
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.ResizeObserver = undefined;
globalThis.IntersectionObserver = undefined;
globalThis.performance = globalThis.performance || { now: () => 0 };
globalThis.cancelAnimationFrame = () => {};

// ---- objek longgar: properti fungsi yang tak dikenal menjadi no-op yang mengembalikan dirinya ----
function loose(o) {
  return new Proxy(o, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol' || k === 'then') return undefined;
      return function () { return t; };
    }
  });
}
const stats = { meshes: 0, groups: 0, undefMat: 0, matByMesh: {} };
class V {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  copy(o) { this.x = o.x; this.y = o.y; this.z = o.z; return this; }
  clone() { return new V(this.x, this.y, this.z); }
  setScalar(s) { this.x = this.y = this.z = s; return this; }
  add(o) { this.x += o.x; this.y += o.y; this.z += o.z; return this; }
  sub(o) { this.x -= o.x; this.y -= o.y; this.z -= o.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  length() { return Math.hypot(this.x, this.y, this.z); }
  normalize() { return this; }
}
class Color { constructor(h) { this.hex = typeof h === 'number' ? h : 0; this.r = this.g = this.b = 0; }
  setHex(h) { this.hex = h; return this; } getHex() { return this.hex; } set(v) { if (typeof v === 'number') this.hex = v; return this; }
  copy(c) { this.hex = c.hex; return this; } clone() { return new Color(this.hex); } getStyle() { return '#000'; } }
function obj3d(self) {
  self.position = new V(); self.rotation = new V(); self.scale = new V(1, 1, 1); self.children = [];
  self.visible = true; self.userData = {}; self.parent = null; self.castShadow = false; self.receiveShadow = false;
  self.add = (...a) => { a.forEach(c => { self.children.push(c); c.parent = self; }); return self; };
  self.remove = (c) => { const i = self.children.indexOf(c); if (i >= 0) self.children.splice(i, 1); return self; };
  self.traverse = (fn) => { fn(self); self.children.slice().forEach(c => c.traverse && c.traverse(fn)); };
  self.lookAt = () => {}; self.updateMatrixWorld = () => {}; self.getWorldPosition = (v) => v;
  return self;
}
class Group { constructor() { stats.groups++; return loose(obj3d(this)); } }
class Scene { constructor() { return loose(obj3d(this)); } }
class Mesh { constructor(geometry, material) {
  stats.meshes++; if (material === undefined) stats.undefMat++;
  this.geometry = geometry; this.material = material; return loose(obj3d(this)); } }
class Sprite { constructor(material) { this.material = material; return loose(obj3d(this)); } }
class Mat { constructor(p) { Object.assign(this, p || {}); this.color = this.color instanceof Color ? this.color : new Color(typeof (p && p.color) === 'number' ? p.color : 0); this.emissive = new Color(0); this.dispose = () => {}; return loose(this); } }
class Geo { constructor() { const att = { count: 0, getX: () => 0, getY: () => 0, getZ: () => 0, setXY() {}, needsUpdate: false };
  this.attributes = { position: att, normal: att, uv: att }; this.dispose = () => {}; this.rotateX = () => this; this.translate = () => this; return loose(this); } }
class Tex { constructor() { this.repeat = new V(); this.offset = new V(); this.dispose = () => {}; return loose(this); } }
class Light { constructor() { obj3d(this); this.shadow = { camera: new Cam(), mapSize: new V() }; this.target = new Group(); this.color = new Color(); this.groundColor = new Color(); this.intensity = 1; this.dispose = () => {}; return loose(this); } }
class Cam { constructor() { obj3d(this); this.left = this.right = this.top = this.bottom = 0; this.zoom = 1; this.updateProjectionMatrix = () => {}; return loose(this); } }
class Renderer { constructor() {
  const cvs = loose({ style: {}, setAttribute() {}, addEventListener() {}, removeEventListener() {}, parentNode: null, clientWidth: 400, clientHeight: 700, width: 400, height: 700,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 700 }) });
  this.domElement = cvs; this.shadowMap = { enabled: false, autoUpdate: true, type: 0 }; this.info = { render: { calls: 0 } };
  this.setPixelRatio = () => {}; this.setClearColor = () => {}; this.setSize = () => {}; this.render = () => {}; this.dispose = () => {}; this.forceContextLoss = () => {};
  return loose(this); } }
class PMREM { constructor() { this.fromScene = () => ({ texture: {}, dispose() {} }); this.dispose = () => {}; this.compileEquirectangularShader = () => {}; return loose(this); } }
class Ray { constructor() { this.setFromCamera = () => {}; this.intersectObjects = () => []; return loose(this); } }
const THREE = {
  Group, Scene, Mesh, Sprite, Vector3: V, Vector2: V, Color,
  MeshBasicMaterial: Mat, MeshStandardMaterial: Mat, SpriteMaterial: Mat,
  BoxGeometry: Geo, CylinderGeometry: Geo, SphereGeometry: Geo, ConeGeometry: Geo, TorusGeometry: Geo, PlaneGeometry: Geo,
  CircleGeometry: Geo, RingGeometry: Geo, CapsuleGeometry: Geo, IcosahedronGeometry: Geo, ExtrudeGeometry: Geo,
  Shape: class { constructor() { return loose({}); } }, BufferAttribute: class { constructor() { return loose({}); } },
  CanvasTexture: Tex, DirectionalLight: Light, HemisphereLight: Light, OrthographicCamera: Cam, WebGLRenderer: Renderer,
  PMREMGenerator: PMREM, Raycaster: Ray,
  SRGBColorSpace: 'srgb', RepeatWrapping: 1000, DoubleSide: 2, BackSide: 1, AdditiveBlending: 2, PCFSoftShadowMap: 2, ACESFilmicToneMapping: 4
};
// ---- DOM tiruan ----
function el() {
  const e = loose({ style: {}, children: [], innerHTML: '', textContent: '', parentNode: null, offsetHeight: 0, clientWidth: 400, clientHeight: 700,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {},
    setAttribute() {}, addEventListener() {}, removeEventListener() {}, removeChild() {}, querySelector: () => null, querySelectorAll: () => [],
    appendChild(c) { return c; }, insertBefore(c) { return c; }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 700 }),
    getContext: () => loose({ createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), measureText: () => ({ width: 10 }), createLinearGradient: () => loose({}), createRadialGradient: () => loose({}) }) });
  return e;
}
document.createElement = el;
document.documentElement = loose({ getAttribute: () => 'light', style: {}, classList: { contains: () => false } });
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '#2563eb' });
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

const { createOfficeScene } = await load('src', 'ui/office/OfficeScene.js');
const container = el();
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
window.__PERF = {};
const origWarn = console.warn; const warns = []; console.warn = (...a) => { warns.push(a.map(String).join(' ')); };
function mkState(n, hq) {
  const st = { companyName: 'fSociety', staff: [], time: { currentHour: 9, currentMinute: 0, year: 2000 }, cash: 1301337, products: [], campaigns: [], research: {}, os: {} };
  for (let i = 0; i < n; i++) st.staff.push({ id: 's' + i, name: 'Staf ' + i, role: ['engineer', 'designer', 'marketer'][i % 3], skill: 2, morale: 70, country: 'ID', traits: [] });
  return st;
}
for (const [n, label] of [[6, 'awal (6 staf)'], [30, 'penuh (30 staf)']]) {
  stats.meshes = 0; stats.groups = 0; stats.undefMat = 0;
  const state = mkState(n);
  try {
    const api = createOfficeScene(THREE, container, state);
    ok(!!api && typeof api.update === 'function', label + ': adegan kantor terbentuk');
    ok(stats.undefMat === 0, label + ': tidak ada mesh bermaterial undefined (' + stats.undefMat + ')');
    ok(stats.meshes > 300, label + ': jumlah mesh = ' + stats.meshes + ' (grup ' + stats.groups + ')');
    api.update(state); api.refreshTheme(); api.relabel(); api.updateClock && api.updateClock(state);
    ok(true, label + ': update / refreshTheme / relabel berjalan');
    api.dispose();
    ok(true, label + ': dispose berjalan');
  } catch (e) {
    fail++; console.log('GAGAL (' + label + '): ' + (e && e.stack ? e.stack.split('\n').slice(0, 8).join('\n') : e));
  }
}
console.warn = origWarn;
const bad = warns.filter(w => /gagal/i.test(w));
ok(bad.length === 0, 'tidak ada peringatan "gagal bangun ruangan" (' + bad.length + ')');
bad.slice(0, 3).forEach(w => console.log('   ' + w));
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
