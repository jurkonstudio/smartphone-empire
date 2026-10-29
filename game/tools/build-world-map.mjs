// Membangun data peta dunia (SVG path) dari GeoJSON. Jalankan dari akar repo:
//   node tools/build-world-map.mjs                      -> pakai assets/geo/world-simplified.geojson (gambar tangan, kasar)
//   node tools/build-world-map.mjs path/ke/ne_110m_admin_0_countries.geojson
//        -> pakai Natural Earth asli (properti ISO_A2 / iso_a2 / ISO3166-1-Alpha-2 dipakai sebagai id negara,
//           jadi poligon negara permainan ikut bisa diwarnai oleh WorldMap.js)
// Keluaran:
//   src/data/world-map.data.js            (dipakai UI; tanpa langkah build di game)
//   assets/geo/world-simplified.svg       (SVG mandiri, bisa dibuka / dipakai ulang)
//   assets/geo/game-countries.geojson     (titik jangkar 29 negara permainan)
// Proyeksi: Miller cylindrical, lintang dipotong -58 … 84 (tanpa Antartika).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const W = 1000;
const LAT_MIN = -58, LAT_MAX = 84;
const rad = (d) => d * Math.PI / 180;
const millerY = (lat) => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * rad(lat)));
const SCALE = W / (2 * Math.PI);
const Y0 = millerY(LAT_MAX);
const H = Math.round((millerY(LAT_MAX) - millerY(LAT_MIN)) * SCALE);
const project = (lon, lat) => {
  const la = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  return [(lon + 180) / 360 * W, (Y0 - millerY(la)) * SCALE];
};
const r1 = (n) => Math.round(n * 10) / 10;

// Titik jangkar [lon, lat] 29 negara permainan (countries.data.js). Perkiraan visual, bukan centroid resmi.
export const ANCHORS = {
  US: [-98, 39], JP: [138, 36.5], GB: [-2, 53], DE: [10.5, 51], FR: [2.5, 46.6], KR: [127.8, 36.5], CN: [104, 35],
  IT: [12.5, 42.8], CA: [-100, 58], AU: [134, -25], RU: [60, 58], IN: [79, 22], BR: [-52, -11], ES: [-3.7, 40.2],
  MX: [-102, 23.5], ID: [113, -1.5], TR: [35, 39], TH: [101, 15], ZA: [24.5, -29], PH: [122, 12.5], VN: [106, 15],
  SA: [45, 24], EG: [30, 26.5], NG: [8, 9.5], PK: [69.5, 29.5], BD: [90, 23.8], KE: [37.8, 0.5], ET: [40, 8.5],
  AE: [54.5, 24]
};

// Preset zoom: [lonMin, latMin, lonMax, latMax] -> viewBox "x y w h".
const VIEW_BOUNDS = {
  world:    [-180, LAT_MIN, 180, LAT_MAX],
  americas: [-170, -57, -33, 75],
  emea:     [-26, -37, 100, 72],
  apac:     [60, -48, 180, 60]
};
function viewBox(b) {
  const p1 = project(b[0], b[3]), p2 = project(b[2], b[1]);
  return [r1(p1[0]), r1(p1[1]), r1(p2[0] - p1[0]), r1(p2[1] - p1[1])];
}
const views = {};
for (const k of Object.keys(VIEW_BOUNDS)) views[k] = viewBox(VIEW_BOUNDS[k]);

function ringToPath(ring) {
  return ring.map((p, i) => {
    const q = project(p[0], p[1]);
    return (i ? 'L' : 'M') + r1(q[0]) + ' ' + r1(q[1]);
  }).join('') + 'Z';
}
function geomToPath(g) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  return polys.map((rings) => rings.map(ringToPath).join('')).join('');
}

const input = process.argv[2] || 'assets/geo/world-simplified.geojson';
const gj = JSON.parse(readFileSync(input, 'utf8'));
const land = [];
for (const f of gj.features || []) {
  if (!f.geometry) continue;
  const p = f.properties || {};
  const iso = p.ISO_A2 || p.iso_a2 || p['ISO3166-1-Alpha-2'] || '';
  const id = (iso && iso !== '-99' && ANCHORS[iso]) ? iso : '';
  const d = geomToPath(f.geometry);
  if (d) land.push({ id, name: p.id || p.NAME || p.name || '', d });
}

const points = {};
const features = [];
for (const id of Object.keys(ANCHORS)) {
  const a = ANCHORS[id];
  const q = project(a[0], a[1]);
  points[id] = [r1(q[0]), r1(q[1])];
  features.push({ type: 'Feature', properties: { id }, geometry: { type: 'Point', coordinates: a } });
}

const js = [
  '// FILE: src/data/world-map.data.js  (DIHASILKAN oleh tools/build-world-map.mjs — jangan edit manual)',
  '// Peta dunia untuk WorldMap.js. Proyeksi Miller, viewBox 0 0 ' + W + ' ' + H + '.',
  '//   land   : [{ id, name, d }]  id = kode negara permainan bila poligon = satu negara (data Natural Earth), selain itu ""',
  '//   points : { US: [x, y], ... } titik jangkar tiap negara permainan (untuk penanda)',
  '//   views  : { world|americas|emea|apac: [x, y, w, h] } preset viewBox untuk zoom wilayah',
  '// Sumber default: poligon gambar tangan yang KASAR (bukan batas resmi). Ganti dengan Natural Earth lewat skrip build.',
  'export const WORLD_MAP = ' + JSON.stringify({ width: W, height: H, land, points, views }) + ';',
  ''
].join('\n');

mkdirSync('src/data', { recursive: true });
mkdirSync('assets/geo', { recursive: true });
writeFileSync('src/data/world-map.data.js', js);
writeFileSync('assets/geo/game-countries.geojson', JSON.stringify({ type: 'FeatureCollection', features }));

const dots = Object.keys(points).map((id) =>
  '<circle cx="' + points[id][0] + '" cy="' + points[id][1] + '" r="5" fill="#4f8cff" stroke="#fff" stroke-width="1.5"><title>' + id + '</title></circle>').join('');
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="World map">' +
  '<rect width="' + W + '" height="' + H + '" fill="#0f1b2d"/>' +
  '<g fill="#2b3f5c" stroke="#2b3f5c" stroke-width="0.6" stroke-linejoin="round" fill-rule="evenodd">' +
  land.map((l) => '<path d="' + l.d + '"/>').join('') + '</g>' + dots + '</svg>\n';
writeFileSync('assets/geo/world-simplified.svg', svg);

console.log('input: ' + input + ' | land: ' + land.length + ' | viewBox: ' + W + 'x' + H + ' | js: ' + (js.length / 1024).toFixed(1) + ' KB');
