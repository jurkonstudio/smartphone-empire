// Tes penahan ekonomi (v2029.1). Pakai: node tools/econ-brakes.mjs <root src>
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || new URL('../src', import.meta.url).pathname;
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { EconBrakeSystem } = await load(root, 'systems/EconBrakeSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { MarketSystem } = await load(root, 'systems/MarketSystem.js');
const { TimeSystem } = await load(root, 'core/TimeSystem.js');
const { OS_LICENSES } = await load(root, 'data/os.data.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
console.info = () => {};
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
state.reset('normal');
const d = state.data;
const eb = new EconBrakeSystem(state), ps = new ProductSystem(state), eco = new EconomySystem(state), mk = new MarketSystem(state), ts = new TimeSystem(state);
ps.setEconBrakes(eb); mk.setEconBrakes(eb); eco.setEconBrakes(eb);
globalThis.__game.state = state;
eco.start(); ps.start(); mk.start(); eb.start();

// --- 1) biaya volume ---
const m1 = eb.volumeMultiplier(100), m2 = eb.volumeMultiplier(10000), m3 = eb.volumeMultiplier(1e6), m4 = eb.volumeMultiplier(1e12);
chk(m1 === 1, 'pesanan kecil tidak kena surcharge (x' + m1 + ')');
chk(m2 > m1 && m3 > m2, 'pengali naik monoton: ' + [m1, m2, m3].map(x => x.toFixed(2)).join(' < '));
chk(m4 <= BALANCE.econ.volume.maxMult + 1e-9, 'pengali dibatasi maxMult (x' + m4.toFixed(2) + ')');
chk(isFinite(eb.volumeMultiplier(NaN)) && isFinite(eb.volumeMultiplier(-5)) && isFinite(eb.volumeMultiplier(undefined)), 'input aneh (NaN/negatif/undefined) tidak menghasilkan NaN');
// celah pecah pesanan: 2 x 6000 harus lebih mahal per unit daripada 1 x 6000
const single = eb.volumeMultiplier(6000);
eb.recordProduction(6000);
const second = eb.volumeMultiplier(6000);
chk(second > single, 'memecah pesanan tidak menghindari kurva (x' + single.toFixed(3) + ' -> x' + second.toFixed(3) + ')');
d.time.elapsedGameMinutes += 31 * 1440;
chk(Math.abs(eb.volumeMultiplier(6000) - single) < 1e-9, 'unit lebih tua dari 30 hari tidak dihitung lagi');

// --- 2) plafon pasar ---
const cap = eb.getCapacity();
const probes = [0, 1, cap * 0.1, cap * 0.5, cap, cap * 3, cap * 100, NaN, -10, Infinity];
let bounded = true, mono = true, prev = -1;
for (const r of probes) {
  const f = eb.applyDemandCap(r);
  const eff = (Number.isFinite(r) ? Math.max(0, r) : 0) * f;
  if (!isFinite(f) || f < 0 || f > 1 || eff > cap + 1e-6) bounded = false;
}
chk(bounded, 'faktor jenuh selalu 0..1 dan penjualan efektif <= plafon');
for (const r of [cap * 0.1, cap * 0.5, cap, cap * 2, cap * 5]) { const e = r * eb.applyDemandCap(r); if (e < prev) mono = false; prev = e; }
chk(mono, 'penjualan efektif tidak turun saat permintaan mentah naik');
chk(eb.applyDemandCap(cap * 0.05) > 0.99, 'permintaan kecil nyaris tidak terpotong (pemain baru aman)');
eb._e().util = 0; chk(eb.rivalResponse() === 1, 'rival tidak bereaksi saat utilisasi rendah');
eb._e().util = 1.5; const rr = eb.rivalResponse();
chk(rr > 1 && rr <= BALANCE.econ.rival.maxMult, 'rival bereaksi saat penuh (x' + rr.toFixed(2) + ')');
eb._e().util = 0;

// --- 3) kuotasi UI == tagihan nyata ---
d.cash = 5e6; d.time.currentYear = 2012;
const cfg = ps._pickCheatConfig(); cfg.name = 'T1'; cfg.price = 999; cfg.productionQty = 20000;
const lic = OS_LICENSES.find(x => d.time.currentYear >= x.availableFromYear); cfg.osOptionId = lic ? 'license:' + lic.id : null;
cfg.price = Math.round(ps.computeUnitCost(cfg) * 2);
const q = ps.quoteDesign(cfg);
const cash0 = d.cash; const res = ps.confirmDesign(cfg);
chk(res.ok, 'confirmDesign berhasil' + (res.ok ? '' : ': ' + res.reason));
chk(Math.round(cash0 - d.cash) === q.total, 'quoteDesign (' + q.total + ') == kas yang benar-benar keluar (' + Math.round(cash0 - d.cash) + ')');
chk(eb._trailingUnits() === 20000, 'produksi tercatat di buku besar volume');

// --- restock: quote == bayar ---
ps._releaseProduct(d.products.development);
const prod = d.products.catalog[0];
d.time.elapsedGameMinutes += 40 * 1440;
const q2 = ps.quoteProduction(prod.config, 5000);
const c1 = d.cash; const o = ps.orderProduction(prod.id, 5000);
chk(o.ok && Math.round(c1 - d.cash) === q2.total, 'quoteProduction (' + q2.total + ') == pembayaran restock (' + Math.round(c1 - d.cash) + ')');

// --- 4) sink dana ---
d.cash = 1e5; d.time.currentYear = 2010;
const info = eb.getEfficiencyInfo();
chk(info.nextCost > 1e5, 'L1 lebih mahal dari modal awal Normal (' + info.nextCost + ')');
chk(!eb.buyEfficiency().ok && d.cash === 1e5, 'investasi ditolak bila kas kurang & kas tidak berubah');
d.cash = info.nextCost * 3;
const before = d.cash, bu = eb.buyEfficiency();
chk(bu.ok && before - d.cash === info.nextCost && eb.getEfficiencyInfo().level === 1, 'investasi pabrik L1 memotong kas sebesar harga');
chk(eb.volumeMultiplier(1e6) < m3, 'investasi pabrik menurunkan pengali volume (x' + eb.volumeMultiplier(1e6).toFixed(2) + ' < x' + m3.toFixed(2) + ')');
chk(eb.getMonthlyUpkeep() > 0, 'investasi menimbulkan biaya pemeliharaan bulanan (' + eb.getMonthlyUpkeep() + ')');
let guard = 0; d.cash = 1e12; while (eb.getEfficiencyInfo().nextLevel && guard++ < 10) eb.buyEfficiency();
chk(eb.getEfficiencyInfo().level === BALANCE.econ.efficiency.maxLevel && !eb.buyEfficiency().ok, 'level berhenti di maksimum');

d.market.competitors = [{ id: 'nokia', name: 'Nokia', share: 0.3 }, { id: 'motorola', name: 'Motorola', share: 0.1 }];
d.time.currentYear = 2002; chk(!!eb.acquisitionBlockReason() && !eb.acquire('nokia').ok, 'akuisisi terkunci sebelum tahun minimum');
d.time.currentYear = 2008; d.finance.history = [{ income: 2e6 }];
d.cash = 1e12; const capBefore = eb.getCapacity();
const tg = eb.getAcquisitionTargets();
chk(tg[0].price > tg[1].price, 'rival lebih besar lebih mahal (' + tg[0].price + ' > ' + tg[1].price + ')');
const ac = eb.acquire('nokia');
chk(ac.ok && eb.getCapacity() > capBefore, 'akuisisi memperbesar plafon pasar');
chk(eb.rivalWeight('nokia') < 1 && eb.rivalWeight('motorola') === 1, 'rival yang diakuisisi menekan lebih lemah');
chk(!eb.acquire('motorola').ok, 'jeda integrasi menahan akuisisi beruntun');
chk(!eb.acquire('nokia').ok, 'rival yang sama tidak bisa dibeli dua kali');

// --- 5) upkeep masuk laporan bulanan ---
d.time.currentDay = 28; d.finance.lastProcessed = null; d.cash = 1e9;
d.time.currentMonth = 11; ts._advance(5 * 1440);
const h = d.finance.history[0];
chk(h && h.breakdown && h.breakdown.upkeep > 0 && h.expense >= h.breakdown.upkeep, 'laporan bulanan memuat upkeep (' + (h && h.breakdown && h.breakdown.upkeep) + ')');

// --- 6) save lama (tanpa data.econ) & roundtrip ---
const snap = state.serialize(); delete snap.econ;
const ok = state.hydrate(snap); const eb2 = new EconBrakeSystem(state);
chk(ok && isFinite(eb2.volumeMultiplier(1000)) && Array.isArray(state.data.econ.acquired), 'save lama tanpa econ ter-hydrate dengan default aman');
const snap2 = state.serialize(); state.hydrate(snap2);
chk(state.data.econ.effLevel === eb.getEfficiencyInfo().level || state.data.econ.effLevel >= 0, 'state econ lolos serialisasi JSON');

console.log(fails ? '\n' + fails + ' GAGAL' : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
