// tools/user-control-test.mjs — Kontrol Pengguna (0.2.14): Wawasan Pengguna, Kemudi Algoritma,
// Monetisasi Data, Regulasi per negara, dan survei di Inbox. Murni logika, tanpa DOM/cloud.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src') + '/';
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL: ' + m); } };

const F = await import(R + 'systems/FutureEffects.js');
const U = await import(R + 'systems/UserControlSystem.js');
const { bus } = await import(R + 'core/EventBus.js');

const mkData = (pol) => ({
    time: { currentYear: 2024, currentMonth: 6, currentDay: 1 }, cash: 5e6,
    research: { completed: ['sensor_face3d'] },
    os: { versions: [{ id: 'v1', features: ['fw_privacy'], releaseDate: { year: 2022, month: 1, day: 1 }, versionString: '1.0' }], currentVersionId: 'v1', adoption: { history: [] }, bugs: [] },
    products: { catalog: [{ id: 'p1', name: 'X', totalSold: 400000, price: 400, status: 'selling', releaseDate: { year: 2023, month: 1, day: 1 }, config: { osOptionId: 'own:v1' } }] },
    userControl: { policy: pol }
});

// Regulasi: naik seiring tahun
ok(U.getRegulationLevel('DE', 2010) === 2 && U.getRegulationLevel('DE', 2020) === 3, 'regulasi Jerman naik tahun 2018');
ok(U.getRegulationLevel('US', 2010) === 0 && U.getRegulationLevel('ZZ', 2024) === 0, 'tingkat dasar 0 / negara tak dikenal');

// Wawasan: porsi berjumlah 1, kedalaman mengikuti kebijakan
const d = mkData('open');
let mix = F.computeUsageMix(d, 1e6);
ok(Math.abs(mix.cats.reduce((a, c) => a + c.share, 0) - 1) < 1e-9, 'porsi pemakaian berjumlah 1');
ok(mix.level === 2, 'kebijakan Terbuka = level 2');
d.userControl.policy = 'strict'; ok(F.computeUsageMix(d, 1e6).level === 0, 'Privasi Ketat = level 0');
d.userControl.policy = 'open';

// Algoritma: netral di 50, geser di ujung
ok(F.getAlgoStoreMult(d) === 1 && F.getAlgoDemandBonus(d) === 0, 'algoritma netral di 50');
F.setUserControlAlgo('recommend', 100, d); F.setUserControlAlgo('personal', 100, d);
ok(F.getAlgoStoreMult(d) > 1.1, 'rekomendasi tinggi menaikkan belanja toko');
ok(F.getAlgoScareMult(d) > 1.4, 'personalisasi tinggi menaikkan peluang isu privasi');
ok(F.setUserControlAlgo('ngawur', 10, d) === false, 'slider tak dikenal ditolak');

// Monetisasi
const m0 = U.describeMonetization(d);
ok(m0.users > 1000 && m0.revenue > 0, 'monetisasi punya pendapatan bila pengguna cukup');
ok(U.setDataMonetization(true, d) === true && d.userControl.monetize.on, 'monetisasi bisa dinyalakan');
const ds = mkData('strict'); ok(U.setDataMonetization(true, ds) === false, 'Privasi Ketat menolak monetisasi');

// Bulanan: kas bertambah, survei terkirim (ditangkap lewat addLocal)
const state = { data: d, addCash(x) { d.cash += x; }, addLog() {}, addReputation() {}, addSentiment() {} };
const sys = new U.UserControlSystem(state);
const cash0 = d.cash;
Math.random = () => 0.99;   // tanpa sanksi
for (let m = 1; m <= 12; m++) { d.time.currentMonth = m; bus.emit('time:month-changed', {}); }
ok(d.cash > cash0 && d.userControl.monetize.earned > 0, 'pendapatan data masuk kas');
ok(d.userControl.surveySeq === 4, 'survei dibuat tiap 3 bulan (4 dalam 12 bulan)');
sys.destroy();

// Survei: lima topik, semua berteks
for (let i = 0; i < 5; i++) { const s = U.buildSurvey(d, i); ok(s && s.title && s.body.length > 20, 'survei topik ' + i); }
ok(U.buildSurvey(mkData('open') && { ...mkData('open'), products: { catalog: [] } }, 0) === null, 'tanpa pengguna tidak ada survei');

console.log(fail ? 'ADA GAGAL' : 'user-control-test: semua lulus');
process.exit(fail ? 1 : 0);
