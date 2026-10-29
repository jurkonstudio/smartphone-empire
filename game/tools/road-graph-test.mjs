// Uji data jaringan jalan: node valid, graf terhubung, setiap truk punya rute ke dermaga.
import { stubBrowser, load } from './boot.mjs';
stubBrowser();
const root = process.argv[2] || 'src';
const L = await load(root, 'ui/manufacture/ManufactureLogic.js');
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };
const N = L.ROAD_NODES, E = L.ROAD_EDGES;
ok(E.every(e => N[e.a] && N[e.b]), 'semua ruas menghubungkan node yang ada');
ok(E.every(e => e.a !== e.b), 'tidak ada ruas kosong');
const seen = new Set(['hwW']); let grow = true;
while (grow) { grow = false; for (const e of E) { if (seen.has(e.a) !== seen.has(e.b)) { seen.add(e.a); seen.add(e.b); grow = true; } } }
ok(Object.keys(N).every(k => seen.has(k)), 'graf jalan terhubung (semua node tercapai dari hwW)');
for (const s of L.CT_SLOTS) {
  const r = L.shortestRoute(s.origin, 'dock');
  ok(r && r[0] === s.origin && r[r.length - 1] === 'dock', 'rute ' + s.id + ': ' + (r ? r.join(' > ') : 'TIDAK ADA'));
}
ok(L.shortestRoute('dock', 'hwW') !== null, 'dermaga terhubung kembali ke jalan barat');
ok(L.CT_SLOTS.every(s => { const r = L.shortestRoute(s.origin, 'dock'); return new Set(r).size === r.length; }), 'rute tanpa simpul berulang');
ok(L.shortestRoute('asm', 'tidakAda') === null, 'node tak dikenal -> null');
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
