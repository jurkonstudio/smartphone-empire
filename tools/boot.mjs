// Harness util: stub browser globals, seed RNG, import project modules from a root dir.
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export function seedRandom(seed) {
  let s = seed >>> 0;
  Math.random = function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stubBrowser() {
  const store = {};
  globalThis.window = globalThis;
  globalThis.document = {
    addEventListener() {}, removeEventListener() {}, getElementById() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    createElement() { return { style: {}, setAttribute() {}, appendChild() {}, classList: { add() {}, remove() {} } }; },
    head: { appendChild() {} }, body: { appendChild() {}, classList: { toggle() {}, add() {}, remove() {} } },
    visibilityState: 'visible'
  };
  globalThis.localStorage = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  };
  try { Object.defineProperty(globalThis, 'navigator', { value: { vibrate() {}, userAgent: 'node' }, configurable: true }); } catch (e) {}
  globalThis.requestAnimationFrame = f => setTimeout(f, 0);
  globalThis.__game = globalThis.__game || {};
}

export async function load(root, rel) {
  return import(pathToFileURL(path.join(root, rel)).href);
}
