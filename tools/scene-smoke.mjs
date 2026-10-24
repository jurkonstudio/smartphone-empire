// Smoke test adegan: bangun ManufactureScene dengan THREE tiruan (Proxy), pastikan tidak error dan
// truk kontainer + jalan + dermaga terpasang. Tidak menjalankan loop animasi (tanpa WebGL).
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.removeEventListener = globalThis.removeEventListener || (() => {});
globalThis.ResizeObserver = undefined;
globalThis.performance = globalThis.performance || { now: () => 0 };
globalThis.cancelAnimationFrame = () => {};
let meshes = 0, groups = 0;
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
        if (k === 'visible') return t.visible === undefined ? true : t.visible;
        t[k] = mk(String(k));
      }
      return t[k];
    },
    set(t, k, v) { Object.defineProperty(t, k, { value: v, writable: true, configurable: true, enumerable: true }); return true; },
    apply() { return mk('ret'); },
    construct(t, args) { if (t.kind === 'Mesh') meshes++; if (t.kind === 'Group') groups++; return mk('inst:' + t.kind); }
  });
}
document.createElement = () => mk('El');
document.documentElement = mk('html');
globalThis.getComputedStyle = () => mk('cs');
globalThis.matchMedia = () => mk('mq');
const THREE = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = mk(String(k)))) });
const { createManufactureScene } = await load('src', 'ui/manufacture/ManufactureScene.js');
const container = { clientWidth: 400, clientHeight: 300, innerHTML: '', style: {}, appendChild() {}, addEventListener() {}, removeChild() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) };
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
window.__PERF = {};
try {
  const api = createManufactureScene(THREE, container, {});
  ok(!!api && typeof api.update === 'function', 'adegan terbentuk tanpa error');
  ok(meshes > 400, 'jumlah mesh dibuat: ' + meshes);
  ok(api.isDisposed() === false, 'belum di-dispose');
  api.dispose && api.dispose();
  ok(api.isDisposed() === true, 'dispose berjalan');
} catch (e) {
  fail++; console.log('GAGAL: error saat membangun adegan:', e && e.stack ? e.stack.split('\n').slice(0, 6).join('\n') : e);
}
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
