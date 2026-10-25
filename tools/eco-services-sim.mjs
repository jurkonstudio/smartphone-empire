// Simulasi layanan berlangganan (Cloud & Asisten AI) + lini aksesori, 2000–2026.
// Jalankan dari root repo: node tools/eco-services-sim.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { ECO_CONST, ECO_LINES, ECO_SERVICES } = await load(root, 'data/ecosystem.data.js');

let fails = 0;
const check = (ok, msg) => { console.log((ok ? 'OK   ' : 'FAIL ') + msg); if (!ok) fails++; };
const finite = v => typeof v === 'number' && isFinite(v);

state.reset('normal');
const d = state.data;
// Dunia uji: katalog ponsel dan OS yang punya fitur layanan.
d.products = d.products || {};
d.products.catalog = [
  { id: 'p1', name: 'Uji 1', totalSold: 2000000, releaseDate: { year: 2008, month: 6 }, status: 'selling', config: { osOptionId: 'own:v1' } },
  { id: 'p2', name: 'Uji 2', totalSold: 1500000, releaseDate: { year: 2016, month: 3 }, status: 'selling', config: { osOptionId: 'own:v1' } }
];
d.os = d.os || {};
d.os.versions = [{ id: 'v1', features: ['fw_appstore', 'fw_cloud_sync', 'fw_siri', 'fw_voice_assistant'], releasedAt: { year: 2008, month: 1 }, stats: { stability: 70 } }];
d.os.currentVersionId = 'v1';
d.os.bugs = [];

// --- 1. Save lama (tanpa field layanan) harus aman
const legacy = { lines: {}, store: {}, score: 0.5, stats: {}, pending: {}, history: [] };
const old = { time: d.time, ecosystem: JSON.parse(JSON.stringify(legacy)) };
delete old.ecosystem.services;
const e0 = ensureEcosystemState(old);
check(e0.services && e0.services.cloud && e0.services.ai, 'save lama: state layanan dibuat dengan default');
check(!e0.services.cloud.open && !e0.services.ai.open, 'save lama: layanan default tertutup');
check(finite(e0.stats.serviceRevenue) && finite(e0.stats.subscribers), 'save lama: statistik layanan numerik');

const eco = new EcosystemSystem(state);
ensureEcosystemState(d);

// --- 2. Kunci tahun dan fitur
d.time.currentYear = 2000; d.time.currentMonth = 1;
let r = eco.openService('cloud');
check(!r.ok && r.reason === 'locked', 'cloud terkunci sebelum 2012 (' + JSON.stringify(r) + ')');
d.time.currentYear = 2013; d.time.currentMonth = 1;
d.os.versions[0].features = d.os.versions[0].features.filter(f => f !== 'fw_cloud_sync');
r = eco.openService('cloud');
check(!r.ok && r.reason === 'unavailable', 'cloud butuh fitur fw_cloud_sync (' + JSON.stringify(r) + ')');
d.os.versions[0].features.push('fw_cloud_sync');

// --- 3. Buka layanan dengan dana cukup
state.addCash(1e9);
check(eco.openService('cloud').ok, 'buka cloud ketika fitur & tahun terpenuhi');
{ const prevY = d.time.currentYear, prevM = d.time.currentMonth;
  d.time.currentYear = 2022;
  const early = eco.openService('ai');
  check(!early.ok && early.reason === 'locked', 'asisten AI terkunci sebelum 2023 (' + JSON.stringify(early) + ')');
  d.time.currentYear = 2023;
  const noFeat = eco.openService('ai');
  check(!noFeat.ok && noFeat.reason === 'unavailable', 'asisten AI butuh fitur fw_ai_on_device (' + JSON.stringify(noFeat) + ')');
  d.os.versions[0].features.push('fw_ai_on_device');
  check(eco.openService('ai').ok, 'buka asisten AI');
  d.time.currentYear = prevY; d.time.currentMonth = prevM; }
check(!eco.openService('ai').ok, 'tidak bisa membuka dua kali');

// --- 4. Batas harga dan kunci tier
const cloudBase = 2 * 1; // refPrice * priceMult standard
let p1 = eco.getServicePreview('cloud');
check(p1.price === cloudBase, 'harga awal cloud = harga dasar tier standard');
let stepped = 0;
for (let i = 0; i < 40; i++) {
  const x = eco.setServicePriceStep('cloud', i % 2 ? -1 : 1);
  if (x.ok) stepped++;
  const cur = eco.getServicePreview('cloud').price;
  if (cur < p1.priceMin - 1e-9 || cur > p1.priceMax + 1e-9) { check(false, 'harga di luar batas: ' + cur); break; }
}
check(stepped >= 1, 'harga bisa diubah (langkah berhasil: ' + stepped + ')');
const lockedStep = eco.setServicePriceStep('cloud', 1);
check(!lockedStep.ok && lockedStep.reason === 'lock', 'harga terkunci 3 bulan setelah perubahan');
const tierLock = eco.setServiceTier('cloud', 'free');
check(!tierLock.ok && tierLock.reason === 'lock', 'tier terkunci setelah perubahan harga');
// Majukan waktu melewati kunci, lalu uji tier gratis
for (let i = 0; i < 4; i++) { d.time.currentMonth++; if (d.time.currentMonth > 12) { d.time.currentMonth = 1; d.time.currentYear++; } }
d.time.currentYear = 2014; d.time.currentMonth = 1;
const toFree = eco.setServiceTier('cloud', 'free');
check(toFree.ok, 'pindah ke tier gratis setelah kunci habis');
check(eco.getServicePreview('cloud').price === 0, 'tier gratis tanpa harga');
check(eco.setServicePriceStep('cloud', 1).reason === 'free', 'harga tidak bisa diubah di tier gratis');
d.time.currentMonth = 6;   // lewati kunci 3 bulan dulu
const backToStd = eco.setServiceTier('cloud', 'standard');
check(backToStd.ok, 'kembali ke tier standard setelah kunci habis');

// --- 5. Simulasi bulanan 2013–2026
const rows = [];
let nanCount = 0, capBreach = 0, freeRev = 0, guardOk = true, negative = 0;
for (let y = 2013; y <= 2026; y++) {
  for (let m = 1; m <= 12; m++) {
    d.time.currentYear = y; d.time.currentMonth = m;
    
    const cost = eco.processMonth();
    const again = eco.processMonth();           // penjaga bulan ganda
    if (again !== 0) guardOk = false;
    const last = eco.getSummary().last;
    for (const k of ['revenue', 'cost', 'units', 'serviceRevenue', 'subscribers']) if (!finite(last[k])) nanCount++;
    if (!finite(cost)) nanCount++;
    if (last.cost < 0 || last.revenue < 0) negative++;
    const cloud = eco.getServicePreview('cloud'), ai = eco.getServicePreview('ai');
    if (cloud.subscribers > cloud.base * ECO_CONST.maxAttachShare + 1) capBreach++;
    if (ai.subscribers > ai.base * ECO_CONST.maxAttachShare + 1) capBreach++;
    const rev = eco.takeMonthlyRevenue();
    if (!finite(rev)) nanCount++;
    if (m === 6) rows.push({ y, cloudSubs: cloud.subscribers, aiSubs: ai.subscribers, svcRev: last.serviceRevenue, lineRev: last.lineRevenue, storeRev: last.storeRevenue, score: eco.getSummary().score.toFixed(3) });
  }
}
check(nanCount === 0, 'tanpa NaN/undefined selama 2013–2026 (' + nanCount + ')');
check(capBreach === 0, 'pelanggan tidak melewati batas maxAttachShare');
check(guardOk, 'penjaga bulan ganda: panggilan kedua mengembalikan 0');
check(negative === 0, 'tidak ada pendapatan/biaya negatif');
console.log('\nTahun  cloudSubs  aiSubs  svcRev($)  lineRev($)  storeRev($)  score');
for (const r of rows) console.log(String(r.y).padEnd(6), String(r.cloudSubs).padEnd(11), String(r.aiSubs).padEnd(8), String(r.svcRev).padEnd(11), String(r.lineRev).padEnd(12), String(r.storeRev).padEnd(13), r.score);

// --- 6. Bobot skor lock-in
eco.closeService('cloud');   // mungkin masih komitmen; cek hasil apa adanya
const sumWeights = ECO_CONST.scoreWeightLines + ECO_CONST.scoreWeightStore + ECO_CONST.scoreWeightServices;
check(Math.abs(sumWeights - 1) < 1e-9, 'bobot skor lock-in berjumlah 1.0');
d.time.currentYear = 2026; d.time.currentMonth = 12;
const onlyAi = (() => { const s = state.data.ecosystem; s.lines.earbuds.open = s.lines.watch.open = s.lines.charger.open = false; s.store.commission = ECO_CONST.commissionDefault; return s; })();
ECO_SERVICES.forEach(v => { onlyAi.services[v.id].open = false; });
onlyAi.services.ai.open = true;
eco._refreshScore();
const { computeOsAdoption } = await load(root, 'systems/OsAdoptionModel.js');
const storeUsers = computeOsAdoption(state.data).activeUsers || 0;
const storeScore = Math.min(1, storeUsers / ECO_CONST.storeUsersForFullScore);
const expect = ECO_CONST.scoreWeightServices * 0.5 + ECO_CONST.scoreWeightStore * storeScore;
check(Math.abs(onlyAi.score - expect) < 1e-9, 'skor = 0.2 x (1 dari 2 layanan) + 0.4 x toko (' + onlyAi.score.toFixed(3) + ' = ' + expect.toFixed(3) + ')');
check(finite(onlyAi.score) && onlyAi.score >= 0 && onlyAi.score <= 1, 'skor selalu di 0..1');

console.log('\n' + (fails ? `GAGAL: ${fails} cek` : 'SEMUA CEK LULUS'));
process.exit(fails ? 1 : 0);
