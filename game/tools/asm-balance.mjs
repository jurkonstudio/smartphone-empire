// Simulasi keseimbangan Assembly: titik impas per level vs biaya unit & volume pemain.
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { ASSEMBLY_LEVELS, ASSEMBLY_ROLES } = await load(root, 'data/assembly.data.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
state.reset('normal');
const ps = new ProductSystem(state);
const lv = ASSEMBLY_LEVELS;
const wages = l => ASSEMBLY_ROLES.reduce((n, r) => n + (l.crew[r.id] || 0) * r.wage, 0);
const { getAssemblyWageIndex } = await load(root, 'data/assembly.data.js');
// biaya unit nyata per era: komponen termurah / menengah / termahal yang tersedia pada tahun itu
const { COMPONENTS } = await load(root, 'data/components.data.js');
const catKey = { display:'displayId', camera:'cameraId', battery:'batteryId', chip:'chipId', network:'networkId', body:'bodyId', form_factor:'formFactorId', ram:'ramId', storage:'storageId' };
function cfgFor(y, pick) {
  const cfg = {};
  Object.keys(catKey).forEach(cat => {
    const list = COMPONENTS.filter(c => c.category === cat && (c.minYear || 0) <= y).sort((a, b) => (a.cost || 0) - (b.cost || 0));
    if (list.length) cfg[catKey[cat]] = list[pick === 'low' ? 0 : pick === 'high' ? list.length - 1 : Math.floor((list.length - 1) / 2)].id;
  });
  return cfg;
}
const { getMacro } = await load(root, 'core/MacroModel.js');
console.log('Tahun | unit cost low/mid/high | demand dasar/hari (mid, harga 2x biaya)');
for (const y of [2002, 2004, 2006, 2008, 2010, 2015, 2020, 2026]) {
  const t = state.data.time; t.currentYear = y; t.currentMonth = 6;
  const out = ['low', 'mid', 'high'].map(k => ps.computeUnitCost(cfgFor(y, k), false));
  let dem = '?';
  try { const c = cfgFor(y, 'mid'); c.price = out[1] * 2; dem = ps.estimateDemand(c); } catch (e) { dem = 'err ' + e.message; }
  console.log(y, '|', out.join(' / '), '|', dem, '=> unit/bln', typeof dem === 'number' ? dem * 30 : '-');
}

// Laba bersih bulanan Assembly (hemat biaya - gaji - perawatan) untuk pemain dengan P produk volume "mid".
const pts = { 2002: [26, 11220, 2], 2004: [37, 20550, 2], 2006: [45, 24540, 3], 2008: [66, 43950, 3], 2010: [77, 68550, 3],
  2015: [94, 215880, 4], 2020: [164, 418140, 4], 2026: [289, 766230, 4] };
console.log('\nLaba bersih/bln (juta $) per level; * = kapasitas level kurang dari volume pemain');
console.log('Tahun | idx | belanja/bln | L1 | L2 | L3 | L4');
for (const y of Object.keys(pts)) {
  const [uc, units, P] = pts[y], spend = uc * units * P, idx = getAssemblyWageIndex(+y), vol = units * P;
  const cols = lv.map(l => {
    const net = spend * l.discount - (wages(l) + l.maintenanceMonthly) * idx;
    return (net / 1e6).toFixed(2) + (vol > l.capacityMonthly ? '*' : '');
  });
  console.log(y, '|', idx.toFixed(2), '|', (spend / 1e6).toFixed(2), '|', cols.join(' | '));
}
