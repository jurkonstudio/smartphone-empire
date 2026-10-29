// Tes runway (v2030). Pakai: node tools/runway.mjs <root src>
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || new URL('../src', import.meta.url).pathname;
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { TeamSystem } = await load(root, 'systems/TeamSystem.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
const { bus } = await load(root, 'core/EventBus.js');
console.info = () => {};
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

state.reset('normal');
const d = state.data;
globalThis.__game.state = state;
const eco = new EconomySystem(state);
const ts = new TeamSystem(state);
ts.setEconomy(eco);
eco.start();
d.finance.history = [];

// --- 1) dasar: nilai terhitung dan tidak NaN ---
const base = eco.getRunway();
chk(base.burn > 0, 'biaya bulanan awal > 0 (' + Math.round(base.burn) + ')');
chk(!Number.isNaN(base.months) && base.months >= 0, 'runway awal bukan NaN dan tidak negatif');

// --- 2) monoton terhadap kas ---
const cashes = [0, 1e4, 1e5, 5e5, 2e6];
let mono = true, prev = -1;
for (const c of cashes) { d.cash = c; const m = eco.getRunway().months; if (m < prev) mono = false; prev = m; }
chk(mono, 'runway tidak turun saat kas naik');

// --- 3) input aneh tidak menghasilkan NaN ---
d.cash = NaN; chk(!Number.isNaN(eco.getRunway().months), 'kas NaN ditangani (0)');
d.cash = -5e5; const neg = eco.getRunway();
chk(neg.cash === 0 && neg.months === 0, 'kas negatif dihitung sebagai 0');
d.cash = 1e5;
chk(!Number.isNaN(eco.getRunway({ extraMonthlyCost: NaN, extraCash: 'x' }).months), 'opsi NaN/string diabaikan');

// --- 4) Infinity: biaya nol -> aman ---
const zero = eco.getRunway({ extraMonthlyCost: -1e12 });
chk(zero.netBurn === 0 && zero.months === Infinity, 'biaya nol menghasilkan runway tak hingga');
chk(EconomySystem.runwayLevel(Infinity, 'sulit') === 'ok', 'runway tak hingga = ok di Sulit');

// --- 5) pendapatan menurunkan netBurn, konservatif tetap sama ---
d.cash = 1e5;
d.finance.history = [{ income: 1e9 }, { income: 1e9 }, { income: 1e9 }];
const withInc = eco.getRunway();
chk(withInc.months === Infinity, 'pendapatan besar -> runway bersih tak hingga');
chk(Number.isFinite(withInc.monthsConservative), 'runway konservatif tetap berhingga');
d.finance.history = [];

// --- 6) ambang: Sulit lebih ketat ---
const S = BALANCE.runway.safeMonths, D = BALANCE.runway.dangerMonths;
chk(S.sulit > S.normal && S.normal > S.santai, 'batas aman Sulit > Normal > Santai');
chk(D.sulit > D.normal && D.normal > D.santai, 'batas bahaya Sulit > Normal > Santai');
chk(EconomySystem.runwayLevel(S.normal - 0.01, 'normal') !== 'ok', 'di bawah batas aman bukan ok');
chk(EconomySystem.runwayLevel(S.normal, 'normal') === 'ok', 'tepat di batas aman = ok');
chk(EconomySystem.runwayLevel(0, 'sulit') === 'danger', 'runway 0 = danger');
chk(EconomySystem.runwayLevel(NaN, 'normal') === 'danger', 'NaN = danger (aman dari salah tampil)');

// --- 7) rekrut menurunkan runway, dan belowSafe menandai bila di bawah batas ---
const cand = { id: 'tst', name: 'Tes', role: 'engineer', skill: 60, traits: [], salary: 8000 };
const imp = ts.getHireImpact(cand);
chk(imp.runwayAfter <= imp.runwayBefore, 'rekrut tidak menaikkan runway (' + Math.round(imp.runwayBefore) + ' -> ' + Math.round(imp.runwayAfter) + ')');
chk(typeof imp.belowSafe === 'boolean', 'belowSafe berupa boolean');
d.cash = 1e5;
const heavy = ts.getHireImpact({ id: 'big', name: 'Besar', role: 'engineer', skill: 60, traits: [], salary: 500000 });
chk(heavy.belowSafe === true, 'gaji besar menandai belowSafe');
chk(heavy.safeMonths === BALANCE.runway.safeMonths.normal, 'batas aman yang dipakai sesuai kesulitan');
const cheap = ts.getHireImpact({ id: 'c', name: 'Murah', role: 'engineer', skill: 60, traits: [], salary: 1 });
chk(cheap.runwayBefore === eco.getRunway().months || Math.abs(cheap.runwayBefore - eco.getRunway().months) < 1e-6, 'runway sebelum rekrut konsisten dengan getRunway');

// --- 8) biaya di getHireImpact == biaya yang ditagih hireCandidate ---
const noTot = { id: 'nt', name: 'NT', role: 'designer', skill: 50, traits: [], salary: 6000 };
chk(ts.getHireImpact(noTot).cost === ts._hireTotalCost(noTot), 'kuotasi rekrut sama dengan tagihan');

// --- 9) emit hanya saat level naik peringkat ---
const got = [];
bus.on('economy:runway-low', (x) => got.push(x.level));
d.finance.history = [];
d.cash = 5e6; eco._runwayLevel = null; eco._checkRunway();          // inisialisasi diam-diam
chk(got.length === 0, 'pengecekan pertama tidak membunyikan peringatan');
d.cash = 1; eco._checkRunway();                                       // ok -> danger
d.cash = 1; eco._checkRunway();                                       // tetap danger
chk(got.length === 1 && got[0] === 'danger', 'turun ke danger membunyikan sekali');
d.cash = 5e6; eco._checkRunway();                                     // turun peringkat (pulih)
chk(got.length === 1, 'pemulihan tidak membunyikan peringatan');
d.cash = 1; eco._checkRunway();                                       // lintasan baru
chk(got.length === 2, 'lintasan baru membunyikan lagi');

console.log(fails === 0 ? '\nSEMUA LULUS' : '\nGAGAL: ' + fails);
process.exit(fails === 0 ? 0 : 1);
