// Tes Rapor Tahunan + Target Dewan.  Jalankan dari akar repo:
//   node --experimental-default-type=module tools/annual-review-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'src');
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const D = await load(root, 'data/annual-review.data.js');
const A = await load(root, 'systems/AnnualReviewSystem.js');
const { ensureEraEventState } = await load(root, 'systems/EraEventSystem.js');
const UI = await load(root, 'ui/panels/AnnualReviewModal.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };
const section = (s) => console.log('\n# ' + s);

// ---------- 1. validasi data
section('data');
const C = D.ANNUAL_CONFIG;
for (let i = 1; i < C.grades.length; i++) ok(C.grades[i - 1].min > C.grades[i].min, 'nilai menurun: ' + C.grades[i].id);
ok(C.grades[C.grades.length - 1].min === 0, 'nilai terendah min 0');
for (const g of C.grades) { ok(C.gradeEffects[g.id], 'efek nilai ' + g.id); ok(D.GRADE_TEXT[g.id].id && D.GRADE_TEXT[g.id].en, 'teks nilai ' + g.id); }
ok(D.FOCUS_OPTIONS.length === 3, '3 fokus');
ok(D.FOCUS_OPTIONS.some(f => f.cost === 0), 'ada fokus gratis');
const scopes = ['all', 'budget', 'premium', 'color', 'camera'];
for (const f of D.FOCUS_OPTIONS) {
  ok(f.label.id && f.label.en && f.tagline.id && f.tagline.en && f.outcome.id && f.outcome.en, f.id + ' teks id+en');
  for (const m of f.effects.demand) { ok(scopes.includes(m.scope), f.id + ' scope'); ok(m.mult >= 0.85 && m.mult <= 1.2, f.id + ' mult'); ok(m.days > 0 && m.days <= 400, f.id + ' days'); }
}
for (const g of C.grades) for (const m of C.gradeEffects[g.id].demand) ok(m.mult >= 0.85 && m.mult <= 1.2, 'mult nilai ' + g.id);
for (const d of ['santai', 'normal', 'sulit']) {
  ok(C.firstYear.revenue[d] > 0 && C.firstYear.share[d] > 0 && C.growth.revenue[d] >= 1 && C.growth.share[d] >= 1 && C.floors.revenue[d] > 0, 'konfigurasi ' + d);
}
ok(C.firstYear.revenue.santai < C.firstYear.revenue.normal && C.firstYear.revenue.normal < C.firstYear.revenue.sulit, 'sulit = target lebih tinggi');

ok(C.rival && C.rival.enabled && C.rival.minShare > 0 && C.rival.winEffects.cash >= 0 && C.rival.winEffects.reputation >= 0, 'konfigurasi rival');
ok(C.rival.skipAbove.santai === 0 && C.rival.skipAbove.sulit >= C.rival.skipAbove.normal, 'sulit melewati lebih banyak tingkat');
ok(D.TARGET_META.rival && D.TARGET_META.rival.label.id && D.TARGET_META.rival.label.en, 'meta rival id+en');

// ---------- 2. fungsi murni
section('fungsi murni');
const dN = { difficulty: 'normal' }, dS = { difficulty: 'sulit' }, dX = { difficulty: 'aneh' };
let t = A.buildTargets(dN, null, 0, 100000, null);
ok(t.revenue === 90000 && Math.abs(t.share - 0.003) < 1e-9 && t.netWorth === 60000, 'target tahun 1 normal: ' + JSON.stringify(t));
ok(A.buildTargets(dX, null, 0, 100000, null).revenue === 90000, 'kesulitan tak dikenal = normal');
t = A.buildTargets(dN, { revenueAnnual: 200000, avgShare: 0.02 }, 1, 150000, null);
ok(t.revenue === 230000 && Math.abs(t.share - 0.0224) < 1e-9 && t.netWorth === 135000, 'tahun 2: ' + JSON.stringify(t));
t = A.buildTargets(dN, { revenueAnnual: 0, avgShare: 0 }, 1, 100000, null);
ok(t.revenue === C.floors.revenue.normal && t.share === C.floors.share, 'lantai berlaku saat tahun lalu nol');
t = A.buildTargets(dN, { revenueAnnual: 200000, avgShare: 0.02 }, 5, 100000, 'expansion');
ok(t.revenue === 253000 && Math.abs(t.share - 0.0246) < 1e-9, 'ekspansi menaikkan target 10%: ' + JSON.stringify(t));
t = A.buildTargets(dN, { revenueAnnual: 200000, avgShare: 0.02 }, 5, 100000, 'efficiency');
ok(t.netWorth === Math.round(105000 * 1.1), 'efisiensi menaikkan target kekayaan bersih: ' + t.netWorth);
t = A.buildTargets(dN, null, 2, -100000, null);
ok(t.netWorth === -95000, 'kekayaan bersih negatif: target mendekati 0 saat faktor > 1 (' + t.netWorth + ')');
ok(A.buildTargets(dS, null, 0, 100000, null).revenue > A.buildTargets(dN, null, 0, 100000, null).revenue, 'sulit > normal');

ok(A.gradeFor(1.25) === 'S' && A.gradeFor(1.2499) === 'A' && A.gradeFor(1) === 'A' && A.gradeFor(0.8) === 'B' && A.gradeFor(0.5) === 'C' && A.gradeFor(0.49) === 'D' && A.gradeFor(0) === 'D', 'batas nilai');
ok(A.computeScale(0) === 1 && A.computeScale(30000) === 1 && A.computeScale(300000) === 10 && A.computeScale(1e12) === D.SCALE_MAX && A.computeScale(NaN) === 1, 'skala bisnis');
let ev = A.evaluateTargets({ revenue: 120000, share: 0.01, netWorth: 100000 }, { revenue: 60000, avgShare: 0.02 }, 50000, 6);
ok(ev.items[0].target === 60000 && ev.items[0].passed, 'omzet diprorata 6/12');
ok(ev.items[1].ratio === 2 && ev.items[2].ratio === 0.5, 'ratio dijepit 0..2: ' + ev.items.map(i => i.ratio));
ok(Math.abs(ev.avgRatio - (1 + 2 + 0.5) / 3) < 1e-9, 'rata-rata ratio');
ev = A.evaluateTargets({ revenue: 1000, share: 0.001, netWorth: -50000 }, { revenue: 0, avgShare: 0 }, -80000, 12);
ok(ev.items[2].ratio === 0 && !ev.items[2].passed, 'target negatif gagal bila aktual lebih rendah');
ok(Number.isFinite(ev.avgRatio), 'tanpa NaN');

// Rival Tahunan: pemilihan
const RV = [{ id: 'nokia', name: 'Nokia', share: 0.3 }, { id: 'moto', name: 'Motorola', share: 0.1 }, { id: 'sagem', name: 'Sagem', share: 0.02 }, { id: 'tiny', name: 'Tiny', share: 0.0001 }];
let pk = A.pickRival(RV, 0.015, 'normal', null);
ok(pk && pk.id === 'sagem' && pk.baseShare === 0.02, 'rival = pesaing terdekat di atas pemain: ' + (pk && pk.id));
pk = A.pickRival(RV, 0.015, 'sulit', null);
ok(pk.id === 'moto', 'sulit melewati satu tingkat: ' + pk.id);
pk = A.pickRival(RV, 0.2, 'sulit', null);
ok(pk.id === 'nokia', 'skip dibatasi jumlah merek di atas: ' + pk.id);
pk = A.pickRival(RV, 0.5, 'normal', null);
ok(pk.id === 'nokia', 'pemain #1: rival = pesaing terkuat');
pk = A.pickRival(RV, 0, 'normal', null);
ok(pk.id === 'sagem', 'pemain 0%: merek terkecil di atas minShare (Tiny 0,01% diabaikan): ' + pk.id);
pk = A.pickRival(RV, 0.015, 'normal', ['nokia', 'moto']);
ok(pk.id === 'moto', 'merek yang sudah mundur tidak dipilih');
ok(A.pickRival([], 0.01, 'normal', null) === null && A.pickRival(RV, 0.01, 'normal', []) === null, 'tanpa kandidat = null');
ok(A.pickRival([{ id: 'tiny', name: 'Tiny', share: 0.0001 }], 0, 'normal', null).id === 'tiny', 'bila hanya merek kecil, tetap dipakai');
ev = A.evaluateTargets({ revenue: 1, share: 0.001, netWorth: 0, rival: { id: 'moto', name: 'Motorola' } },
  { revenue: 10, avgShare: 0.05, rivalShares: { moto: 0.1 } }, 10, 12);
ok(ev.items.length === 4 && ev.items[3].key === 'rival' && !ev.items[3].passed && Math.abs(ev.items[3].ratio - 0.5) < 1e-9, 'item rival gagal: ratio 0,5');
ev = A.evaluateTargets({ revenue: 1, share: 0.001, netWorth: 0, rival: { id: 'moto', name: 'Motorola' } },
  { revenue: 10, avgShare: 0.12, rivalShares: { moto: 0.1 } }, 10, 12);
ok(ev.items[3].passed && ev.items[3].ratio === 1.2, 'item rival lulus');
ev = A.evaluateTargets({ revenue: 1, share: 0.001, netWorth: 0, rival: { id: 'gone', name: 'Gone' } },
  { revenue: 10, avgShare: 0, rivalShares: {} }, 10, 12);
ok(ev.items[3].passed && ev.items[3].withdrawn && ev.items[3].ratio === 1, 'rival mundur = otomatis lulus');
ev = A.evaluateTargets({ revenue: 1, share: 0.001, netWorth: 0 }, { revenue: 10, avgShare: 0.01 }, 10, 12);
ok(ev.items.length === 3, 'target lama tanpa rival tetap 3 item');

// ---------- 3. alur lengkap dengan GameState nyata
section('alur tahunan');
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
const sys = new A.AnnualReviewSystem(state);
const pend = [], resolved = [];
bus.on('annual:pending', d => pend.push(d.report));
bus.on('annual:resolved', d => resolved.push(d));
sys.start();
let a = state.data.annual;
ok(a && a.targets && a.targets.year === 2000, 'target 2000 dibuat saat start');
ok(a.targets.revenue === 90000 && a.targets.netWorth === 60000, 'target tahun pertama normal: ' + JSON.stringify(a.targets));
ok(!a.targets.rival, 'tahun pertama belum ada rival (belum ada data pesaing)');
ok(a.baseline.netWorth === state.data.cash, 'baseline kekayaan bersih = kas awal');

const mkHist = (rev, share, compShare) => Array.from({ length: 12 }, (_, i) => ({
  year: 2000, month: i + 1, playerShare: share, playerRevenue: rev, playerRevenueEq: rev, totalRevenue: rev * 50,
  competitors: [{ id: 'nokia', share: compShare }, { id: 'motorola', share: 0.01 }, { id: 'ghost', share: 0 }]
}));
state.data.market.competitors = [{ id: 'nokia', name: 'Nokia', share: 0.3 }, { id: 'motorola', name: 'Motorola', share: 0.01 }];
state.data.market.shareHistory = mkHist(12000, 0.004, 0.3);     // omzet 144K, share 0,4%: di atas target
state.data.products.catalog = [{ id: 'p1', name: 'Alpha', totalSold: 4000, status: 'selling' }, { id: 'p2', name: 'Beta', totalSold: 900, status: 'selling' }];
state.data.cash = 130000;
const rep0 = state.data.market.reputation, cash0 = state.data.cash;
const tm = state.data.time; tm.currentYear = 2001; tm.currentMonth = 1; tm.currentDay = 1; tm.elapsedGameMinutes += 365 * 1440;
bus.emit('time:year-changed', { currentYear: 2001 });
ok(pend.length === 1, 'annual:pending dipancarkan sekali');
let r = pend[0];
ok(r.year === 2000 && r.months === 12 && r.graded && r.grace, 'laporan 2000, 12 bulan, masa percobaan: ' + JSON.stringify({ y: r.year, m: r.months, g: r.graded, gr: r.grace }));
ok(r.revenue === 144000 && Math.abs(r.avgShare - 0.004) < 1e-9, 'omzet & share rata-rata');
ok(r.rank === 3 && r.brands === 3, 'peringkat #3 dari 3 (Nokia 30% dan Motorola 1% di depan 0,4%, "ghost" 0% tidak dihitung): ' + r.rank + '/' + r.brands);
ok(r.topRival && r.topRival.name === 'Nokia', 'pesaing terkuat Nokia');
ok(r.units === 4900 && r.bestPhone.name === 'Alpha', 'unit & ponsel terlaris');
ok(r.items.length === 3 && r.rival === null && r.items[0].passed && r.items[1].passed && r.items[2].passed, 'ketiga target lulus, tanpa rival: ' + r.items.map(i => i.key + ':' + i.passed));
ok(r.grade === 'S', 'nilai S (ratio rata-rata ' + r.avgRatio.toFixed(2) + ')');
ok(r.effects.cash === 12000 && r.effects.reputation === 4, 'hadiah S: ' + JSON.stringify(r.effects));
ok(state.data.cash === cash0 + 12000 && state.data.market.reputation >= rep0, 'kas & reputasi diterapkan');
ok(a.pending === r && a.targets === null && a.history.length === 1, 'pending ada, target kosong sampai fokus dipilih');
ok(a.baseline.year === 2001 && a.baseline.netWorth === 130000, 'baseline periode baru memakai kekayaan bersih sebelum hadiah');
bus.emit('time:year-changed', { currentYear: 2001 });
ok(pend.length === 1, 'tahun-berganti dobel tidak menggandakan rapor');
sys.reannounce(); ok(pend.length === 2 && pend[1] === r, 'reannounce mengirim ulang laporan yang sama');

// fokus
const prev = sys.getFocusPreview(r);
ok(prev.length === 3 && prev.find(p => p.def.id === 'efficiency').cost === 0, 'preview fokus');
const base = sys.previewBaseTargets();
ok(base.revenue > r.revenueAnnual && base.share > r.avgShare, 'target dasar tahun 2 naik dari capaian');
state.data.cash = 10;
ok(!sys.canChooseFocus('innovation').ok && sys.canChooseFocus('efficiency').ok, 'fokus berbayar ditolak saat kas minim, gratis selalu bisa');
ok(!sys.chooseFocus('innovation').ok, 'chooseFocus menolak karena dana');
state.data.cash = 100000;
const cashBefore = state.data.cash;
const modsBefore = ensureEraEventState(state.data).mods.length;
const res = sys.chooseFocus('expansion');
ok(res.ok && res.targets.year === 2001 && res.targets.focusId === 'expansion', 'fokus ekspansi dipilih');
ok(res.targets.rival && res.targets.rival.id === 'motorola' && res.targets.rival.name === 'Motorola' && Math.abs(res.targets.rival.baseShare - 0.01) < 1e-9, 'rival 2001 = Motorola (terdekat di atas 0,4%): ' + JSON.stringify(res.targets.rival));
ok(state.data.cash === cashBefore - 4000, 'biaya ekspansi dibayar: ' + (cashBefore - state.data.cash));
ok(ensureEraEventState(state.data).mods.length === modsBefore + 1, 'pengali permintaan terdaftar');
ok(res.targets.revenue === Math.round(144000 * 1.15 * 1.1 / 1000) * 1000 && res.targets.revenue > base.revenue, 'target omzet naik 10% oleh ekspansi: ' + res.targets.revenue + ' vs dasar ' + base.revenue);
ok(a.pending === null && a.targets && a.focus.id === 'expansion', 'pending bersih, target aktif');
ok(resolved.length === 1, 'annual:resolved dipancarkan');
ok(!sys.chooseFocus('efficiency').ok, 'tidak bisa memilih dua kali');

// kartu Home
const card = A.getBoardCardData(state.data);
ok(card && card.year === 2001 && card.months === 0 && card.items.length === 4 && card.items[3].key === 'rival' && !card.items[3].hasData, 'data kartu Home: 4 item (termasuk rival), bulan 0 di awal tahun');
ok(UI.renderBoardTargetsCard(state.data).indexOf('data-board-card') > 0, 'kartu Home dirender');

// ---------- 4. tahun kedua: nilai buruk setelah masa percobaan
section('tahun kedua (D, hukuman berlaku)');
state.data.market.shareHistory = mkHist(500, 0.0005, 0.3);       // sangat jelek
state.data.cash = 20000;
const repB = state.data.market.reputation;
tm.currentYear = 2002; tm.currentMonth = 1; tm.currentDay = 1; tm.elapsedGameMinutes += 365 * 1440;
bus.emit('time:year-changed', { currentYear: 2002 });
r = pend[pend.length - 1];
ok(r.year === 2001 && !r.grace && r.grade === 'D', 'rapor 2001 nilai D tanpa masa percobaan: ' + r.grade);
ok(r.items.length === 4 && r.rival && r.rival.id === 'motorola' && r.rival.beaten === false && !r.rival.withdrawn, 'rival 2001 tidak terkalahkan: ' + JSON.stringify(r.rival));
ok(r.effects.reputation === -3 && r.effects.cash === 0, 'rival kalah: tanpa bonus tambahan');
ok(a.history[1].rivalId === 'motorola' && a.history[1].rivalBeaten === false, 'riwayat mencatat rival');
ok(r.effects.reputation === -3 && r.effects.demand.length === 1, 'hukuman D: ' + JSON.stringify(r.effects));
ok(state.data.market.reputation <= repB, 'reputasi turun atau tertahan di batas bawah');
ok(a.history.length === 2 && a.history[1].grade === 'D', 'riwayat tersimpan');
ok(ensureEraEventState(state.data).mods.some(m => m.eventId === 'annual_grade:2001' && m.mult === 0.95), 'pengali 0,95 untuk 90 hari terdaftar');
ok(sys.chooseFocus('efficiency').ok && sys.chooseFocus('efficiency').ok === false, 'efisiensi gratis dan sekali pakai');

// pengali permintaan benar-benar dipakai ProductSystem
{
  const ps = new ProductSystem(state);
  const e = ensureEraEventState(state.data); e.mods = [];
  const prod = { id: 'p', status: 'selling', config: { formFactorId: 'ff_bar', displayId: 'scr_stn_color', cameraId: 'none' }, price: 150,
    stats: { display: 45, camera: 45, battery: 45, performance: 45, connectivity: 45, design: 45, usability: 45, quality: 45, qualityScore: 45 },
    releaseGameMinute: 0, noiseState: 0, competitorPressure: 0.2 };
  state.data.time.currentYear = 2002; seedRandom(3); const x = ps._computeDailyDemand(prod);
  e.mods.push({ eventId: 'annual_grade:2001', scope: 'all', mult: 0.95, untilMinute: 1e12 }); seedRandom(3); const y = ps._computeDailyDemand(prod);
  ok(x > 0 && Math.abs(y / x - 0.95) < 0.02, 'ProductSystem memakai pengali: ' + x + ' -> ' + y);
  e.mods = [];
}

// ---------- 4b. mengalahkan rival
section('mengalahkan rival');
sys.stop();
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
const sysR = new A.AnnualReviewSystem(state); sysR.start();
const pendR = []; bus.on('annual:pending', d => pendR.push(d.report));
state.data.market.competitors = [{ id: 'nokia', name: 'Nokia' }, { id: 'motorola', name: 'Motorola' }];
state.data.market.shareHistory = mkHist(12000, 0.004, 0.3);
state.data.cash = 130000;
tm.currentYear = 2001; tm.currentMonth = 1; tm.elapsedGameMinutes += 365 * 1440;
bus.emit('time:year-changed', { currentYear: 2001 });
sysR.chooseFocus('efficiency');
ok(state.data.annual.targets.rival.id === 'motorola', 'rival 2001 Motorola');
// 2001: pemain melonjak melewati Motorola (1%) tetapi Nokia tetap di atas
state.data.market.shareHistory = Array.from({ length: 12 }, (_, i) => ({ year: 2001, month: i + 1, playerShare: 0.02, playerRevenue: 40000, competitors: [{ id: 'nokia', share: 0.3 }, { id: 'motorola', share: 0.01 }] }));
state.data.cash = 140000;
const repW = state.data.market.reputation, cashW = state.data.cash;
const liveCard = A.getBoardCardData(state.data);
ok(liveCard.items[3].key === 'rival', 'kartu Home menampilkan rival');
tm.currentYear = 2002; tm.currentMonth = 1; tm.elapsedGameMinutes += 365 * 1440;
bus.emit('time:year-changed', { currentYear: 2002 });
r = pendR[pendR.length - 1];
ok(r.rival && r.rival.beaten && !r.rival.withdrawn && Math.abs(r.rival.playerShare - 0.02) < 1e-9 && Math.abs(r.rival.rivalShare - 0.01) < 1e-9, 'rival dikalahkan: ' + JSON.stringify(r.rival));
const gfx = C.gradeEffects[r.grade];
ok(r.effects.cash === Math.round(gfx.cash * r.scale) + Math.round(C.rival.winEffects.cash * r.scale), 'bonus kas rival ditambahkan ke hadiah nilai: ' + r.effects.cash);
ok(r.effects.reputation === gfx.reputation + C.rival.winEffects.reputation, 'bonus reputasi rival ditambahkan: ' + r.effects.reputation);
ok(state.data.cash === cashW + r.effects.cash, 'kas bertambah sesuai efek');
ok(state.data.annual.history[1].rivalBeaten === true, 'riwayat: rival terkalahkan');
ok(state.data.log.some(l => /rival/i.test(l.text || l.message || JSON.stringify(l))), 'log mencatat rival tahunan');
// rival tahun berikutnya: sekarang Nokia (satu-satunya di atas 2%)
sysR.chooseFocus('efficiency');
ok(state.data.annual.targets.rival.id === 'nokia', 'rival 2002 naik tingkat ke Nokia: ' + state.data.annual.targets.rival.id);

// rival mundur dari pasar di tengah tahun = lulus otomatis, tanpa bonus
state.data.market.competitors = [{ id: 'motorola', name: 'Motorola' }];
state.data.market.shareHistory = Array.from({ length: 12 }, (_, i) => ({ year: 2002, month: i + 1, playerShare: 0.001, playerRevenue: 1000, competitors: [{ id: 'motorola', share: 0.01 }] }));
tm.currentYear = 2003; tm.currentMonth = 1; tm.elapsedGameMinutes += 365 * 1440;
bus.emit('time:year-changed', { currentYear: 2003 });
r = pendR[pendR.length - 1];
ok(r.rival && r.rival.withdrawn && r.rival.beaten, 'rival mundur: lulus otomatis');
ok(r.effects.cash === Math.round(gfx.cash * 0) + Math.round((C.gradeEffects[r.grade].cash) * r.scale) && r.effects.reputation === C.gradeEffects[r.grade].reputation, 'rival mundur: tanpa bonus kemenangan');
sysR.stop();

// ---------- 5. keamanan alur
section('gating & save lama');
sys.stop();
state.reset('normal');
state.data.tutorial = { completed: false, skipped: false, currentStep: 1 };
const sys2 = new A.AnnualReviewSystem(state);
const pend2 = []; bus.on('annual:pending', d => pend2.push(d.report));
sys2.start();
state.data.market.shareHistory = mkHist(9000, 0.003, 0.2);
state.data.time.currentYear = 2001; state.data.time.currentMonth = 1;
bus.emit('time:year-changed', { currentYear: 2001 });
ok(state.data.annual.pending && pend2.length === 0, 'tutorial berjalan: rapor ditahan, tidak diumumkan');
state.data.tutorial.completed = true; bus.emit('time:day-changed', {});
ok(pend2.length === 1, 'diumumkan setelah tutorial selesai');
state.data.gameOver = { reason: 'x' };
state.data.annual.pending = null; state.data.annual.targets = { year: 2001, revenue: 1, share: 0.001, netWorth: 1, focusId: null };
bus.emit('time:year-changed', { currentYear: 2002 });
ok(state.data.annual.pending === null, 'gameOver: tidak ada rapor');
state.data.gameOver = null;
const endY = (await load(root, 'config/endgame.config.js')).ENDGAME.endYear;
bus.emit('time:year-changed', { currentYear: endY + 1 });
ok(state.data.annual.pending === null, 'melewati endYear: layar akhir musim yang tampil, bukan rapor');

// save lama tanpa data.annual, di tengah game
sys2.stop();
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
state.data.time.currentYear = 2015; state.data.time.currentMonth = 6;
delete state.data.annual;
state.data.market.shareHistory = Array.from({ length: 12 }, (_, i) => ({ year: 2015, month: i, playerShare: 0.05, playerRevenue: 2000000, competitors: [] }));
state.data.cash = 5000000;
const sys3 = new A.AnnualReviewSystem(state); sys3.start();
const at = state.data.annual.targets;
ok(at.year === 2015, 'save lama: target dibuat untuk tahun berjalan');
ok(at.revenue === Math.round(24000000 * 1.15 / 1000) * 1000, 'save lama: target dari capaian 12 bulan terakhir, bukan angka tahun pertama: ' + at.revenue);
ok(at.netWorth === Math.round(5000000 * 0.9), 'save lama: faktor kekayaan bersih tahun ke-2: ' + at.netWorth);
ok(!at.rival, 'save lama tanpa data pesaing: tanpa rival');
// save lama dengan data pesaing: rival ditunjuk
sys3.stop(); state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
state.data.time.currentYear = 2015; state.data.time.currentMonth = 6;
state.data.market.competitors = [{ id: 'samsung', name: 'Samsung' }, { id: 'apple', name: 'Apple' }];
state.data.market.shareHistory = Array.from({ length: 12 }, (_, i) => ({ year: 2015, month: i, playerShare: 0.05, playerRevenue: 2000000, competitors: [{ id: 'samsung', share: 0.2 }, { id: 'apple', share: 0.08 }] }));
state.data.cash = 5000000;
const sys3b = new A.AnnualReviewSystem(state); sys3b.start();
ok(state.data.annual.targets.rival && state.data.annual.targets.rival.id === 'apple', 'save lama dengan data pesaing: rival = Apple (terdekat di atas 5%)');
sys3b.stop();
// hydrate mempertahankan data.annual (termasuk rival)
const snap = JSON.parse(JSON.stringify(state.data));
state.hydrate(snap);
ok(state.data.annual && state.data.annual.targets && state.data.annual.targets.year === 2015, 'hydrate mempertahankan data.annual');
ok(state.data.annual.targets.rival && state.data.annual.targets.rival.id === 'apple', 'hydrate mempertahankan rival');

// ---------- 6. render
section('render');
sys3.stop();
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
const sys4 = new A.AnnualReviewSystem(state); sys4.start();
state.data.market.competitors = [{ id: 'nokia', name: 'Nokia' }, { id: 'motorola', name: 'Motorola' }];
state.data.market.shareHistory = mkHist(12000, 0.004, 0.3);
state.data.time.currentYear = 2001; state.data.time.currentMonth = 1;
let rep4 = null; bus.on('annual:pending', d => { rep4 = d.report; });
bus.emit('time:year-changed', { currentYear: 2001 });
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  const htmls = [UI.buildReportHtml(rep4), UI.buildFocusHtml(rep4, { annual: sys4 })];
  const rs = sys4.chooseFocus('innovation'); htmls.push(UI.buildResultHtml(rs));
  htmls.push(UI.renderBoardTargetsCard(state.data));
  htmls.forEach((h, i) => {
    ok(h.length > 80, lang + ' layar ' + i + ' terisi');
    ok(!/NaN|undefined|\[object|null/.test(h), lang + ' layar ' + i + ' tanpa NaN/undefined: ' + (h.match(/.{20}(NaN|undefined|\[object|null).{20}/) || [''])[0]);
  });
  ok(htmls[1].includes('Motorola') && htmls[2].includes('Motorola') && htmls[3].includes('Motorola'), lang + ' rival tampil di layar fokus, hasil, dan kartu');
  ok(lang === 'id' ? htmls[2].includes('Kalahkan Motorola') : htmls[2].includes('Beat Motorola'), lang + ' label rival');
  if (lang === 'id') { ok(htmls[0].includes('Rapor Tahun 2000') && htmls[1].includes('Fokus Strategis 2001'), 'teks Indonesia'); }
  else { ok(htmls[0].includes('Annual Report 2000') && htmls[1].includes('Strategic Focus 2001'), 'teks Inggris'); }
  // siapkan untuk putaran bahasa berikutnya
  state.data.annual.pending = rep4; state.data.annual.targets = null;
}
LanguageService.setLang('id');

// ---------- 7. Monte Carlo: 50 tahun acak tanpa NaN, nilai selalu valid
section('monte carlo');
sys4.stop();
seedRandom(99);
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
const sys5 = new A.AnnualReviewSystem(state); sys5.start();
state.data.market.competitors = [{ id: 'nokia', name: 'Nokia' }, { id: 'motorola', name: 'Motorola' }];
let rivalYears = 0;
const dist = { S: 0, A: 0, B: 0, C: 0, D: 0 };
let bad = 0, y = 2000;
for (let i = 0; i < 50; i++) {
  const rev = Math.random() < 0.15 ? 0 : Math.round(Math.random() * 40000 * (1 + i * 0.3));
  state.data.market.shareHistory = mkHist(rev, Math.random() * 0.03, 0.2);
  state.data.cash = Math.round(Math.random() * 300000 * (1 + i * 0.3));
  y++; state.data.time.currentYear = y; state.data.time.currentMonth = 1; state.data.time.elapsedGameMinutes += 365 * 1440;
  bus.emit('time:year-changed', { currentYear: y });
  const rp = state.data.annual.pending;
  if (!rp) { bad++; continue; }
  dist[rp.grade]++;
  const nums = [rp.revenue, rp.avgShare, rp.netWorth, rp.avgRatio, rp.effects.cash, rp.effects.reputation];
  if (nums.some(n => !Number.isFinite(n))) bad++;
  const pick = ['efficiency', 'innovation', 'expansion'][i % 3];
  state.data.cash = Math.max(state.data.cash, 500000 * (1 + i));
  const rc = sys5.chooseFocus(pick);
  if (!rc.ok) bad++;
  else if (rc.targets.rival) rivalYears++;
  if (rc.ok && !(rc.targets.revenue > 0 && rc.targets.share > 0 && Number.isFinite(rc.targets.netWorth))) bad++;
}
ok(bad === 0, 'tidak ada NaN/laporan hilang (' + bad + ')');
ok(state.data.annual.history.length === 50 && state.data.annual.history.length <= C.historyMax, 'riwayat 50 tahun');
ok(rivalYears >= 45, 'rival ditunjuk hampir tiap tahun (' + rivalYears + '/49)');
console.log('  distribusi nilai acak:', JSON.stringify(dist));

console.log(fails ? '\n' + fails + ' GAGAL' : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
