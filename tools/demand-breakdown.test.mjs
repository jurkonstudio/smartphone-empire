// Tes Tahap 6A: getDemandBreakdown / getLaunchForecast harus memakai faktor yang SAMA dengan simulasi.
// Jalankan dari akar repo: node tools/demand-breakdown.test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(5);
console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { ID } = { ID: null };

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

state.reset('normal');
const ps = new ProductSystem(state);
const nav = new MarketNavSystem(state); nav._ensure();
ps._nav = nav;
const mk = (id, s, price, spread) => ({ id, status: 'selling', config: { formFactorId: 'ff_bar' }, price,
  stats: { display: s + (spread ? 10 : 0), camera: s + (spread ? 15 : 0), battery: s - (spread ? 10 : 0), performance: s + (spread ? 5 : 0), connectivity: s, design: s - (spread ? 5 : 0), usability: s, quality: s, qualityScore: s },
  releaseGameMinute: state.data.time.elapsedGameMinutes || 0, noiseState: 0, competitorPressure: 0 });

// (1) breakdown.final == _computeDailyDemand saat noise = 1 (Math.random = 0.5 -> rawNoise 0, noiseState 0).
const realRandom = Math.random;
let n = 0, mismatch = 0, nonFinite = 0, sameSet = true;
for (let y = 2000; y <= 2026; y += 2) {
  const t = state.data.time; t.currentYear = y; t.currentMonth = 6; t.currentDay = 15; nav._ctxKey = null;
  const macro = getMacro(t, BALANCE.macro);
  for (const s of [30, 50, 70, 90]) for (const spread of [false, true]) for (const pm of [0.7, 1, 1.6]) {
    const p = mk('p' + y + s + spread + pm, s, macro.priceRef * pm, spread);
    const before = JSON.stringify(state.data);
    const bd = ps.getDemandBreakdown(p);
    const after = JSON.stringify(state.data);
    if (before !== after) sameSet = false;
    p.noiseState = 0; Math.random = () => 0.5;
    const real = ps._computeDailyDemand(p);
    Math.random = realRandom;
    n++;
    if (bd.final !== real) { mismatch++; if (mismatch < 4) console.log('  beda', y, s, spread, pm, bd.final, real); }
    if (!isFinite(bd.final) || bd.factors.some(f => !isFinite(f.multiplier))) nonFinite++;
  }
}
ok(mismatch === 0, 'breakdown.final identik dengan _computeDailyDemand di ' + n + ' kasus (beda: ' + mismatch + ')');
ok(nonFinite === 0, 'tidak ada NaN/Infinity pada breakdown');
ok(sameSet, 'getDemandBreakdown tidak mengubah state');

// (2) struktur dan sentimen
const t0 = state.data.time; t0.currentYear = 2010; nav._ctxKey = null;
const m0 = getMacro(t0, BALANCE.macro);
const cheap = ps.getDemandBreakdown(mk('c', 60, m0.priceRef * 0.6, false));
const dear = ps.getDemandBreakdown(mk('d', 60, m0.priceRef * 2.0, false));
const fc = (bd, k) => bd.factors.find(f => f.key === k);
ok(cheap.factors.length === 15 && new Set(cheap.factors.map(f => f.key)).size === 15, '15 faktor unik');
ok(fc(dear, 'price').sentiment === 'bad' && fc(dear, 'price').ratio > 1.5, 'harga jauh di atas patokan = bad, ratio > 1,5');
ok(fc(cheap, 'price').sentiment === 'good', 'harga murah = good');
ok(fc(dear, 'price').multiplier < fc(cheap, 'price').multiplier, 'pengali harga turun saat harga naik');
const sentOk = cheap.factors.every(f => (f.multiplier >= 1.05 ? 'good' : f.multiplier <= 0.95 ? 'bad' : 'neutral') === f.sentiment);
ok(sentOk, 'sentimen konsisten dengan ambang 0,95 / 1,05');

// (3) perkiraan rilis: harian = estimateDemand (sumber yang sama), rentang masuk akal, dibatasi stok
const cfg = { formFactorId: 'ff_bar', price: Math.round(m0.priceRef), productionQty: 5000 };
let fcast = null, est = null, err = null;
try {
  est = ps.estimateDemand(cfg);
  fcast = ps.getLaunchForecast(cfg, 5000);
} catch (e) { err = e; }
if (err) { console.log('  catatan:', err.message); }
ok(!err && fcast && fcast.low <= fcast.high && fcast.low >= 0, 'forecast low <= high dan >= 0');
if (fcast && est != null) {
  ok(fcast.daily === est, 'forecast.daily == estimateDemand (' + fcast.daily + ' vs ' + est + ')');
  const f2 = ps.getLaunchForecast(cfg, 10);
  ok(f2.high <= 10 && f2.low <= f2.high, 'forecast dibatasi jumlah produksi');
  const n9 = BALANCE.products.dailyNoise;
  ok(Math.abs(fcast.high / Math.max(1, fcast.low) - (1 + n9) / (1 - n9)) < 0.05 || fcast.capped, 'lebar rentang mengikuti dailyNoise');
}

// (4) kunci i18n: id dan en lengkap
const keys = ['title', 'note', 'hurts', 'helps', 'none_bad', 'none_good'].map(k => 'why.' + k);
const fk = ['quality', 'price', 'reputation', 'marketing', 'os', 'trend', 'competitor', 'lifecycle', 'tech', 'nav', 'event', 'feature', 'channel', 'afterSales', 'ecosystem'];
fk.forEach(k => { keys.push('why.factor.' + k); keys.push('why.advice.' + k); });
['label', 'range', 'capped', 'note'].forEach(k => keys.push('wiz.forecast.' + k));
const idMod = await load(root, 'data/i18n/id.js'), enMod = await load(root, 'data/i18n/en.js');
const dict = m => { for (const k of Object.keys(m)) if (m[k] && typeof m[k] === 'object' && !Array.isArray(m[k]) && Object.keys(m[k]).some(x => x.startsWith('prod.detail'))) return m[k]; return m.default || {}; };
const D_id = dict(idMod), D_en = dict(enMod);
const miss = keys.filter(k => !D_id[k] || !D_en[k]);
ok(miss.length === 0, 'semua ' + keys.length + ' kunci i18n ada di id dan en' + (miss.length ? ' (hilang: ' + miss.join(',') + ')' : ''));
const bothVars = ['why.advice.price', 'wiz.forecast.range'].every(k => /\{(pct|low)\}/.test(D_id[k] || '') && /\{(pct|low)\}/.test(D_en[k] || ''));
ok(bothVars, 'placeholder {pct}/{low} ada di id dan en');

console.log(fail ? fail + ' GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
