// Tes Peninjauan App Store: mesin (pengiriman, setuju/tolak, insiden, efek ke toko), render panel id/en,
// kelengkapan kamus asr.*, dan kabel klik data-asr-* di main.js.
// Pakai: node tools/appstore-review-test.mjs src
import fs from 'node:fs';
import path from 'node:path';
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(11); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { AppStoreReviewSystem, ensureAppReviewState } = await load(root, 'systems/AppStoreReviewSystem.js');
const { renderAppStoreReviewPanel } = await load(root, 'ui/panels/AppStoreReviewPanel.js');
const { ASR_CONST, ASR_REASONS, ASR_FLAG_IDS, ASR_CATEGORIES, ASR_MODELS, ASR_DEV_TYPE_IDS } = await load(root, 'data/appstore-review.data.js');
const { APPSTORE_REVIEW_I18N } = await load(root, 'data/i18n/appstore-review.i18n.js');

let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

function fresh(year, withStore) {
  state.reset('normal');
  const d = state.data;
  d.time.currentYear = year; d.time.currentMonth = 6;
  d.os = { versions: [{ id: 'v1', features: withStore ? ['fw_appstore'] : [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }], currentVersionId: 'v1', bugs: [] };
  d.products = { catalog: [{ id: 'p1', name: 'U', totalSold: 3000000, releaseDate: { year: 2008, month: 6 }, status: 'selling', config: { osOptionId: 'own:v1' } }] };
  d.cash = 1e9;
  return d;
}
function nextMonth(d) { d.time.currentMonth += 1; if (d.time.currentMonth > 12) { d.time.currentMonth = 1; d.time.currentYear += 1; } }

// ---- 1. Netral dan tidak aktif tanpa fitur App Store
let d = fresh(2012, false);
let sys = new AppStoreReviewSystem(state);
sys.start();
chk(!sys.isAvailable(), 'tanpa fitur App Store: tidak tersedia');
for (let i = 0; i < 200; i++) bus.emit('time:day-changed', {});
chk(sys.getQueue().length === 0, 'tanpa fitur: tidak ada pengiriman masuk');
chk(sys.getStoreFactor() === 1, 'netral: faktor toko = 1 saat belum ada aktivitas');
chk(sys.approve(1).ok === false, 'approve tanpa pengiriman ditolak');
sys.stop();

// ---- 2. Pengiriman masuk lewat hari
d = fresh(2012, true);
sys = new AppStoreReviewSystem(state);
sys.start();
for (let i = 0; i < 120; i++) bus.emit('time:day-changed', {});
const q0 = sys.getQueue();
chk(q0.length > 0, `pengiriman masuk seiring waktu (${q0.length} dalam 120 hari)`);
chk(q0.length <= ASR_CONST.queueMax, 'antrean tidak melewati batas');
chk(q0.every(s => s.title && s.devName && s.category && s.model), 'setiap pengiriman punya judul, developer, kategori, model');
chk(q0.every(s => s.devType !== 'shady'), 'jenis developer berbahaya disamarkan sebagai indie');
chk(q0.every(s => ASR_CATEGORIES.some(c => c.id === s.category) && ASR_MODELS.includes(s.model)), 'kategori/model valid');
chk(q0.every(s => s.category !== 'ai'), 'kategori AI belum muncul sebelum 2023');
sys.stop();

// ---- 3. Setuju / tolak / tinjau / biaya
d = fresh(2014, true);
sys = new AppStoreReviewSystem(state);
sys.start();
const r = ensureAppReviewState(d);
// bangun antrean terkontrol
function inject(over) {
  const dev = sys._newDev();
  const sub = Object.assign({ id: r.nextId++, devId: dev.id, title: 'Tes App ' + r.nextId, category: 'tools', model: 'free',
    quality: 80, est: 78, flags: [], seen: [], inspected: false, submittedAbs: sys._now(), deadlineAbs: sys._now() + 3 }, over || {});
  r.queue.push(sub);
  return sub;
}
const good = inject({});
const bad = inject({ flags: ['malware'], quality: 50, est: 60 });
const lowq = inject({ quality: 30, est: 35 });
const bad2 = inject({ flags: ['copyright'], quality: 70, est: 70 });
const good2 = inject({ quality: 85 });
const cashBefore = d.cash;
let gw0 = r.goodwill;
r.policy.fee = 2;                       // biaya 99
let res = sys.approve(good.id);
chk(res.ok && res.outcome === 'good', 'setujui aplikasi bagus -> outcome good');
chk(d.cash - cashBefore === 99, `biaya pendaftaran masuk kas (${d.cash - cashBefore})`);
chk(r.goodwill >= gw0, 'goodwill naik/tetap setelah setujui aplikasi bagus');
res = sys.reject(good2.id, 'security');
chk(res.ok && res.outcome === 'wrong', 'menolak aplikasi layak -> outcome wrong');
chk(r.goodwill < gw0, 'goodwill turun setelah menolak aplikasi layak');
chk(r.stats.wrongRejects === 1, 'hitungan tolak keliru bertambah');
res = sys.reject(bad.id, 'security');
chk(res.ok && res.outcome === 'caught', 'menolak malware dengan alasan Keamanan -> tertangkap');
res = sys.reject(bad2.id, 'spam');
chk(res.ok && res.outcome === 'caughtWrong', 'menolak pelanggaran hak cipta dengan alasan meleset -> tetap tertangkap, alasan salah');
res = sys.reject(lowq.id, 'quality');
chk(res.ok && res.outcome === 'lowq', 'menolak mutu rendah dengan alasan Mutu -> tepat');
chk(sys.getQueue().length === 0, 'antrean kosong setelah semua diputuskan');
chk(sys.reject(9999, 'quality').ok === false, 'tolak id tak dikenal gagal');
const t1 = inject({});
chk(sys.reject(t1.id, 'bogus').ok === false, 'alasan tolak tidak valid ditolak');

// tinjau manual
const hid = inject({ flags: ['privacy'], quality: 66, est: 40 });
const c0 = d.cash;
res = sys.inspect(hid.id);
chk(res.ok && d.cash < c0, 'tinjau manual memotong kas');
chk(sys.getQueue().find(s => s.id === hid.id).qualityExact === true, 'tinjau manual membuka mutu asli');
chk(sys.inspect(hid.id).reason === 'already', 'tinjau manual hanya sekali');

// persetujuan aplikasi bermasalah -> katalog + insiden
const evil = inject({ flags: ['malware'], quality: 55 });
res = sys.approve(evil.id);
chk(res.ok && res.outcome === 'missed', 'menyetujui malware -> outcome missed');
let incidents = 0;
for (let m = 0; m < 24 && !incidents; m++) { nextMonth(d); bus.emit('time:month-changed', {}); incidents = sys.getIncidents().length; }
chk(incidents >= 1, 'aplikasi bermasalah akhirnya menjadi insiden');
const fBad = sys.getStoreFactor();
res = sys.takedown(sys.getIncidents()[0].appId);
chk(res.ok && sys.getIncidents().length === 0, 'takedown menyelesaikan insiden');
chk(sys.getStoreFactor() >= fBad, 'faktor toko pulih setelah takedown');

// skandal bila dibiarkan
const evil2 = inject({ flags: ['malware'], quality: 55 });
sys.approve(evil2.id);
const app2 = r.catalog.find(a => a.id === evil2.id);
app2.status = 'incident'; r.incidents.push({ appId: app2.id, flag: 'malware', sinceAbs: sys._now() });
const cs = d.cash;
for (let m = 0; m < ASR_CONST.incidentEscalateMonths + 1; m++) { nextMonth(d); bus.emit('time:month-changed', {}); }
chk(r.stats.scandals >= 1 && d.cash < cs + 1e6, 'insiden dibiarkan -> skandal');
chk(r.stats.finesPaid > 0, 'denda skandal tercatat');

// kedaluwarsa
const old = inject({ deadlineAbs: sys._now() + 1 });
const gwx = r.goodwill;
nextMonth(d); bus.emit('time:month-changed', {});
chk(!sys.getQueue().some(s => s.id === old.id) && r.stats.expired >= 1, 'pengiriman kedaluwarsa dibuang');
chk(r.goodwill <= gwx + 1, 'goodwill tidak naik karena kedaluwarsa');

// blokir
const dv = sys._newDev(); dv.flagged = 2;
inject({ devId: dv.id });
const gwb = r.goodwill;
res = sys.banDeveloper(dv.id);
chk(res.ok && res.justified && !sys.getQueue().some(s => s.devId === dv.id), 'blokir developer bermasalah membersihkan antreannya');
chk(r.goodwill >= gwb - 0.0001, 'blokir yang tepat tidak menurunkan goodwill');
const clean = sys._newDev();
const gwc = r.goodwill;
sys.banDeveloper(clean.id);
chk(r.goodwill < gwc, 'blokir developer bersih menurunkan goodwill');

// kebijakan
res = sys.setScan('advanced');
chk(res.ok && res.cost > 0, 'pasang pemindai lanjutan membayar biaya pasang');
chk(sys.setScan('basic').ok && sys.setScan('advanced').cost === 0, 'ganti level tidak membayar pasang ulang');
chk(sys.getMonthlyCost() > 0, 'pemindai punya biaya bulanan');
chk(sys.setScan('bogus').ok === false, 'level pemindai tak dikenal ditolak');
r.policy.fee = 0;
chk(sys.setFeeStep(-1).ok === false && sys.setFeeStep(1).ok, 'langkah biaya dibatasi');
const rate0 = (r.policy.fee = 0, sys.getArrivalRate());
r.policy.fee = 3;
chk(sys.getArrivalRate() < rate0, 'biaya pendaftaran tinggi menurunkan laju pengiriman');
r.policy.fee = 0;
// pemindai mendeteksi
r.policy.scan = 'advanced';
let detected = 0, total = 0;
for (let i = 0; i < 300; i++) { const s = sys._generate(); if (s && s.flags.length) { total++; detected += s.seen.length > 0 ? 1 : 0; } r.queue.length = 0; }
chk(total === 0 || detected / total > 0.5, `pemindai lanjutan mendeteksi mayoritas masalah (${detected}/${total})`);

// persetujuan otomatis hanya untuk developer tepercaya
r.policy.autoTrusted = true; r.policy.scan = 'off';
const tdev = sys._newDev(); tdev.rep = 90; tdev.clean = 5;
const before = r.catalog.length;
let autoSeen = false;
for (let i = 0; i < 400 && !autoSeen; i++) {
  const origChoose = sys._chooseDev; sys._chooseDev = () => tdev;
  sys._generate(); sys._chooseDev = origChoose;
  if (r.catalog.length > before) autoSeen = true;
  r.queue.length = 0;
}
chk(autoSeen, 'developer tepercaya disetujui otomatis saat opsi aktif');
sys.stop();

// ---- 4. Efek ke EcosystemSystem (faktor katalog, biaya pemindai) dan netral tanpa sistem tinjauan
d = fresh(2014, true);
const eco = new EcosystemSystem(state);
eco.start();
ensureEcosystemState(d);
const spNeutral = eco.getStorePreview();
chk(spNeutral.catalogFactor === 1, 'tanpa sistem tinjauan: faktor katalog toko = 1');
const rev0 = spNeutral.revenue;
sys = new AppStoreReviewSystem(state);
sys.start();
eco.setAppReview(sys);
chk(Math.abs(eco.getStorePreview().revenue - rev0) < 1e-6, 'dengan sistem tinjauan tapi tanpa aktivitas: pendapatan toko tidak berubah');
const rr = ensureAppReviewState(d);
for (let i = 0; i < 25; i++) {
  rr.catalog.push({ id: 100 + i, title: 'App ' + i, category: 'tools', devId: 'd0', model: 'free', quality: 80, flags: [], approvedAbs: 0, retireAbs: 9e9, status: 'active' });
}
const spGood = eco.getStorePreview();
chk(spGood.catalogFactor > 1 && spGood.revenue > rev0, `katalog bagus menaikkan pendapatan toko (x${spGood.catalogFactor.toFixed(3)})`);
chk(spGood.catalogFactor <= ASR_CONST.factorMax * 1.05 + 1e-9, 'faktor katalog dalam batas');
rr.catalog.forEach(a => { a.quality = 20; });
const spJunk = eco.getStorePreview();
chk(spJunk.catalogFactor < spGood.catalogFactor, 'katalog sampah menurunkan faktor toko');
rr.catalog.forEach(a => { a.quality = 80; });
rr.policy.scan = 'basic';
const costNoScan = (rr.policy.scan = 'off', eco.getStorePreview().cost);
rr.policy.scan = 'basic';
chk(eco.getStorePreview().cost > costNoScan, 'biaya pemindai masuk biaya toko');
d.time.currentMonth = 9;
const mc = eco.processMonth();
chk(isFinite(mc) && mc > 0, 'processMonth tetap menghasilkan biaya sah dengan tinjauan aktif');
sys.stop();

// ---- 5. Render panel id/en, tanpa NaN/undefined/key mentah
d = fresh(2014, true);
sys = new AppStoreReviewSystem(state);
sys.start();
const rp = ensureAppReviewState(d);
for (let i = 0; i < 6; i++) { const dev = sys._newDev(); rp.queue.push({ id: rp.nextId++, devId: dev.id, title: 'Render ' + i, category: ASR_CATEGORIES[i % 4].id, model: ASR_MODELS[i % 4],
  quality: 50 + i * 7, est: 55 + i * 5, flags: i % 2 ? ['scam'] : [], seen: i % 2 ? ['scam'] : [], inspected: i === 2, submittedAbs: sys._now(), deadlineAbs: sys._now() + 2 }); }
const dv1 = sys._newDev(); dv1.approved = 4; dv1.clean = 4; dv1.rep = 88; dv1.rejected = 1;
rp.catalog.push({ id: 900, title: 'Live', category: 'game', devId: dv1.id, model: 'paid', quality: 77, flags: [], approvedAbs: 0, retireAbs: 9e9, status: 'active' });
rp.catalog.push({ id: 901, title: 'Bad', category: 'tools', devId: dv1.id, model: 'free', quality: 40, flags: ['malware'], approvedAbs: 0, retireAbs: 9e9, status: 'incident' });
rp.incidents.push({ appId: 901, flag: 'malware', sinceAbs: sys._now() });
sys._pushHistory({ abs: 1, title: 'X', devName: 'Y', decision: 'approve', outcome: 'good', auto: true, fee: 25 });
sys._pushHistory({ abs: 1, title: 'X', devName: 'Y', decision: 'reject', reason: 'spam', outcome: 'wrong', auto: false, fee: 0 });
sys._pushHistory({ abs: 1, title: 'X', devName: '', decision: 'scandal', outcome: 'fine', auto: true, fee: -20000 });
sys._pushHistory({ abs: 1, title: '-', devName: 'Y', decision: 'ban', outcome: 'justified', auto: false, fee: 0 });
sys._pushHistory({ abs: 1, title: 'X', devName: 'Y', decision: 'expired', outcome: 'expired', auto: true, fee: 0 });
sys._pushHistory({ abs: 1, title: 'X', devName: 'Y', decision: 'takedown', outcome: 'removed', auto: false, fee: 0 });
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  for (const available of [true, false]) {
    d.os.versions[0].features = available ? ['fw_appstore'] : [];
    let html = '';
    try { html = renderAppStoreReviewPanel({ appReviewSystem: sys }); } catch (err) { chk(false, `${lang}/${available}: render error ${err.message}`); continue; }
    const bad = html.match(/NaN|undefined|\{[a-z]+\}|asr\.[a-z.]+/g) || [];
    chk(bad.length === 0, `${lang}/tersedia=${available}: tanpa NaN/undefined/placeholder/key mentah ${bad.length ? '(' + [...new Set(bad)].join(',') + ')' : ''}`);
    if (available) chk(html.includes('data-asr-approve') && html.includes('data-asr-reject') && html.includes('data-asr-takedown'), `${lang}: tombol setujui/tolak/takedown ada`);
  }
}
sys.stop();

// ---- 6. Kamus: id dan en sama, semua key asr.* yang dipakai ada
const idKeys = new Set(Object.keys(APPSTORE_REVIEW_I18N.id)), enKeys = new Set(Object.keys(APPSTORE_REVIEW_I18N.en));
const onlyId = [...idKeys].filter(k => !enKeys.has(k)), onlyEn = [...enKeys].filter(k => !idKeys.has(k));
chk(!onlyId.length && !onlyEn.length, `kamus id/en seimbang ${onlyId.concat(onlyEn).join(',')}`);
const need = [];
ASR_FLAG_IDS.forEach(f => need.push('asr.flag.' + f));
ASR_REASONS.forEach(x => need.push('asr.reason.' + x));
ASR_CATEGORIES.forEach(c => need.push('asr.cat.' + c.id));
ASR_MODELS.forEach(m => need.push('asr.model.' + m));
['indie', 'studio', 'corp'].forEach(x => need.push('asr.devtype.' + x));
ASR_CONST.scanLevels.forEach(x => need.push('asr.scan.' + x));
['active', 'incident', 'removed', 'retired'].forEach(x => need.push('asr.status.' + x));
['approve', 'approveAuto', 'reject', 'takedown', 'ban', 'expired', 'scandal'].forEach(x => need.push('asr.hist.' + x));
['good', 'junk', 'missed', 'caught', 'caughtWrong', 'lowq', 'lowWrong', 'wrong', 'removed', 'justified', 'unjustified', 'expired', 'fine'].forEach(x => need.push('asr.out.' + x));
const missingDyn = need.filter(k => !idKeys.has(k) || !enKeys.has(k));
chk(!missingDyn.length, `key dinamis asr.* lengkap ${missingDyn.join(',')}`);
ASR_DEV_TYPE_IDS.forEach(() => {});

// key literal yang dipakai di kode
const used = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (p.endsWith('.js') && !p.endsWith('appstore-review.i18n.js')) {
      const src = fs.readFileSync(p, 'utf8');
      for (const m of src.matchAll(/\b(?:tr|t)\(\s*['"](asr\.[\w.]+)['"]/g)) if (!m[1].endsWith('.')) used.add(m[1]);
    }
  }
}
walk(root);
const missingLit = [...used].filter(k => !idKeys.has(k) || !enKeys.has(k));
chk(!missingLit.length, `key literal asr.* lengkap (${used.size} dipakai) ${missingLit.join(',')}`);

// ---- 7. Kabel klik: setiap data-asr-* di panel punya handler di main.js
const panelSrc = fs.readFileSync(path.join(root, 'ui/panels/AppStoreReviewPanel.js'), 'utf8');
const mainSrc = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const attrs = [...new Set([...panelSrc.matchAll(/data-asr-([a-z]+)=/g)].map(m => m[1]))].filter(a => a !== 'val');
const unwired = attrs.filter(a => !mainSrc.includes('[data-asr-' + a + ']'));
chk(!unwired.length, `semua data-asr-* punya handler di main.js (${attrs.join(',')}) ${unwired.join(',')}`);
chk(mainSrc.includes('ecosystem.setAppReview(appReview)') && mainSrc.includes('appReview.start()'), 'main.js memasang dan menjalankan AppStoreReviewSystem');
chk(mainSrc.includes("'appstore'") && fs.readFileSync(path.join(root, 'ui/panels/MarketPanel.js'), 'utf8').includes('data-market-subtab="appstore"'), 'sub-tab appstore terpasang di Pasar');

console.log(fails ? `GAGAL: ${fails}` : 'SEMUA TES TINJAUAN APP STORE LULUS');
process.exit(fails ? 1 : 0);
