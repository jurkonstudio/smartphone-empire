// Kalibrasi ekosistem terhadap pendapatan ponsel nyata (sistem permainan asli).
// Pakai: node tools/eco-calib.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(7);
console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { TimeSystem } = await load(root, 'core/TimeSystem.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketSystem } = await load(root, 'systems/MarketSystem.js');
const { EcosystemSystem } = await load(root, 'systems/EcosystemSystem.js');
const { EconBrakeSystem } = await load(root, 'systems/EconBrakeSystem.js');
const { ECO_LINES, ECO_SERVICES } = await load(root, 'data/ecosystem.data.js');
const { ECO_CONST } = await load(root, 'data/ecosystem.data.js');
{ // Pengali uji (sapuan parameter): A=attach lini, S=belanja toko, F=biaya tetap, V=attach layanan
  const A = Number(process.env.CALIB_A || 1), S = Number(process.env.CALIB_S || ECO_CONST.storeSpendBase), F = Number(process.env.CALIB_F || 1), V = Number(process.env.CALIB_V || 1);
  ECO_LINES.forEach(l => { l.attach *= A; l.monthlyFixed *= F; });
  ECO_SERVICES.forEach(v => { v.attach *= V; v.monthlyFixed *= F; });
  ECO_CONST.storeSpendBase = S; ECO_CONST.storeFixedMonthly *= F;
}
const { OS_LICENSES } = await load(root, 'data/os.data.js');

state.reset('normal');
const d = state.data;
const ts = new TimeSystem(state), eco = new EconomySystem(state), ps = new ProductSystem(state);
const mk = new MarketSystem(state), ecosys = new EcosystemSystem(state), eb = new EconBrakeSystem(state);
ps.setEconBrakes(eb); mk.setEconBrakes(eb); eco.setEconBrakes(eb);
ps.setEcosystem(ecosys); eco.setEcosystem(ecosys);
eco.start(); ps.start(); mk.start(); eb.start(); ecosys.start(); ts.start();
globalThis.__game = { state };

d.os = d.os || {};
d.os.versions = [{ id: 'v1', features: [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }];
d.os.currentVersionId = 'v1'; d.os.bugs = [];
const OS_BY_YEAR = [['fw_appstore', 2008], ['fw_siri', 2011], ['fw_cloud_sync', 2012]];
const START = Number(process.env.CALIB_START || 2000), END = Number(process.env.CALIB_END || 2026);
const rows = [];
for (let y = START; y <= END; y++) {
  for (let m = 1; m <= 12; m++) {
    d.time.currentYear = y; d.time.currentMonth = m;
    d.cash = Math.max(d.cash, 1e9);
    OS_BY_YEAR.forEach(([f, fy]) => { if (y >= fy && d.os.versions[0].features.indexOf(f) < 0) d.os.versions[0].features.push(f); });
    // Harness uji: pastikan versi OS punya fitur layanan & App Store (lisensi OS tidak membawanya).
    (d.os.versions || []).forEach(v => { v.features = v.features || []; ['fw_appstore','fw_cloud_sync','fw_siri'].forEach(f => { if (!v.features.includes(f)) v.features.push(f); }); });
    // Lini & layanan dibuka sesuai tahun (uji: semua dibuka bila memungkinkan)
    ECO_LINES.forEach(l => { if (y >= l.minYear && !ecosys.isLineOpen(l.id)) ecosys.openLine(l.id); });
    ECO_SERVICES.forEach(v => { if (!ecosys.isServiceOpen(v.id) && ecosys.getServiceAvailability(v.id).ok) ecosys.openService(v.id); });
    if (m === 1 || m === 7) { const cfg = ps._pickCheatConfig(); cfg.name = 'C' + y + m; const lic = OS_LICENSES.find(x => y >= x.availableFromYear); cfg.osOptionId = 'own:v1'; const rr = ps.quickRelease(cfg); if (!rr.ok && (y === START || y === 2008) && m === 1) console.error('rilis gagal:', rr.reason); }
    ts.fastForwardDays(30);
    const phone = (d.market.revenueHistory[0] || {}).playerRevenue || 0;
    const sum = ecosys.getSummary();
    rows.push({ y, m, phone, eco: sum.last.revenue || 0, svc: sum.last.serviceRevenue || 0, line: sum.last.lineRevenue || 0, store: sum.last.storeRevenue || 0, cost: sum.last.cost || 0 });
  }
}
// Ringkasan tahunan: rata-rata bulanan
const byY = {};
for (const r of rows) { (byY[r.y] = byY[r.y] || []).push(r); }
if (process.env.CALIB_BRIEF) {
  const pick = y => { const a = byY[y], av = k => a.reduce((t, r) => t + r[k], 0) / a.length; const p = av('phone'); return `${y}: total ${(100*av('eco')/p).toFixed(1)}% (lini ${(100*av('line')/p).toFixed(1)} toko ${(100*av('store')/p).toFixed(1)} layanan ${(100*av('svc')/p).toFixed(1)}) bersih ${(100*(av('eco')-av('cost'))/Math.max(1,av('eco'))).toFixed(0)}%`; };
  console.log([2004, 2012, 2026].map(pick).join(' | '));
  const gm = [...ECO_LINES.map(l => [l.id, ecosys.getLinePreview(l.id)]), ...ECO_SERVICES.map(v => [v.id, ecosys.getServicePreview(v.id)])];
  console.log('margin kotor 2026: ' + gm.map(([id, pv]) => id + ' ' + (100 * pv.margin).toFixed(0) + '%').join(', '));
  process.exit(0);
}
console.log('Tahun  phone($/bln)  eco($/bln)  %eco  svc  line  store  cost  margin');
for (const y of Object.keys(byY)) {
  const a = byY[y], avg = k => a.reduce((s, r) => s + r[k], 0) / a.length;
  const p = avg('phone'), e = avg('eco'), c = avg('cost');
  const margin = e > 0 ? (e - c) / e : 0;
  console.log(String(y).padEnd(6), Math.round(p).toString().padEnd(12), Math.round(e).toString().padEnd(11),
    (p > 0 ? (100 * e / p).toFixed(1) : '-').toString().padEnd(5),
    Math.round(avg('svc')).toString().padEnd(5), Math.round(avg('line')).toString().padEnd(5),
    Math.round(avg('store')).toString().padEnd(6), Math.round(c).toString().padEnd(5), (100 * margin).toFixed(0) + '%');
}

process.exit(0);
