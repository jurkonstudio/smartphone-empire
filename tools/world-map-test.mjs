// Uji peta dunia: data (titik 29 negara, viewBox) + render HTML WorldMap. Jalankan dari akar repo: node tools/world-map-test.mjs
import { readFileSync } from 'node:fs';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

const { WORLD_MAP } = await import('../src/data/world-map.data.js');
const { COUNTRIES } = await import('../src/data/countries.data.js');

ok(WORLD_MAP.width > 0 && WORLD_MAP.height > 0, 'viewBox ' + WORLD_MAP.width + 'x' + WORLD_MAP.height);
ok(WORLD_MAP.land.length > 10 && WORLD_MAP.land.every(l => /^M[-\d. LZM]+Z$/.test(l.d)), 'path daratan valid (' + WORLD_MAP.land.length + ')');
const missing = COUNTRIES.filter(c => !WORLD_MAP.points[c.id]).map(c => c.id);
ok(!missing.length, 'semua ' + COUNTRIES.length + ' negara punya titik' + (missing.length ? ' — kurang: ' + missing : ''));
ok(Object.keys(WORLD_MAP.points).every(id => COUNTRIES.some(c => c.id === id)), 'tidak ada titik yatim');
ok(Object.values(WORLD_MAP.points).every(p => p[0] >= 0 && p[0] <= WORLD_MAP.width && p[1] >= 0 && p[1] <= WORLD_MAP.height), 'semua titik di dalam viewBox');
for (const k of ['world', 'americas', 'emea', 'apac']) {
  const v = WORLD_MAP.views[k];
  ok(Array.isArray(v) && v.length === 4 && v[2] > 0 && v[3] > 0 && v[0] >= 0 && v[0] + v[2] <= WORLD_MAP.width + 0.5, 'view ' + k + ' valid');
}
// GeoJSON sumber valid
for (const f of ['assets/geo/world-simplified.geojson', 'assets/geo/game-countries.geojson']) {
  const g = JSON.parse(readFileSync(f, 'utf8'));
  ok(g.type === 'FeatureCollection' && g.features.length > 0, f + ' FeatureCollection (' + g.features.length + ')');
}
const pts = JSON.parse(readFileSync('assets/geo/game-countries.geojson', 'utf8'));
ok(pts.features.length === COUNTRIES.length, 'game-countries.geojson memuat ' + COUNTRIES.length + ' negara');

// Render (tanpa DOM: gaya dilewati, string HTML tetap dihasilkan)
const { renderWorldMap } = await import('../src/ui/components/WorldMap.js');
const html = renderWorldMap({ id: 't1', year: 2005, tabs: true, items: [{ id: 'US', value: 100 }, { id: 'JP', value: 25 }], valueText: it => 'v' + it.value });
ok((html.match(/data-wm-country=/g) || []).length === COUNTRIES.length, 'satu penanda per negara');
ok((html.match(/wm-active/g) || []).length === 2, 'tepat 2 penanda berstatus aktif');
const locked = COUNTRIES.filter(c => c.since > 2005).length;
ok((html.match(/class="wm-pt wm-locked"/g) || []).length === locked, 'penanda terkunci = negara since > tahun (' + locked + ')');
ok((html.match(/data-wm-view=/g) || []).length === 4, '4 tombol zoom');
ok(!/data-wm-view/.test(renderWorldMap({ id: 't2', items: [] })), 'tanpa tabs → tanpa tombol zoom');
console.log(fail ? 'ADA GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
