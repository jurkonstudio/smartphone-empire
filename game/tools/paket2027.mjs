// Uji headless paket 2027-2028 + kompetitor. Pakai: node tools/paket2027.mjs <rootSrc>
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(11);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('GAGAL:', m); } };

const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
const SS = await load(root, 'data/supply-shock.data.js');
const MP = await load(root, 'data/material-plants.data.js');
const { COMPONENTS, getComponentById } = await load(root, 'data/components.data.js');
const OS = await load(root, 'data/os.data.js');
const OUC = await load(root, 'data/os-update-cards.data.js');
const { RESEARCH_NODES } = await load(root, 'data/research.data.js');
const { OS_UPDATE_CARDS_I18N } = await load(root, 'data/i18n/os-update-cards.i18n.js');
const NAV = await load(root, 'data/market-nav.data.js');
const { MONTHLY_HEADLINES_2027_2030: NEWS } = await load(root, 'data/news-headlines-2027-2030.data.js');
const CI = await load(root, 'data/competitors/index.js');
await load(root, 'systems/NewsSystem.js');
await load(root, 'systems/ComponentPlantSystem.js');
await load(root, 'systems/ProductSystem.js');
await load(root, 'ui/panels/DesignWizard.js').catch(() => null);

// --- indeks biaya RAM
const idx = y => SS.getComponentCostIndex('ram', y, 1);
console.log('Indeks RAM 2026..2031:', [2026,2027,2028,2029,2030,2031].map(y => idx(y).toFixed(2)).join(' '));
ok(idx(2026) === 1 && idx(2028) > idx(2027) && idx(2029) < idx(2028) && idx(2030) < idx(2029), 'bentuk indeks naik lalu turun');
ok(SS.getComponentCostIndex('display', 2028, 1) === 1, 'kategori lain x1');
const ram = getComponentById('ram_lpddr5x_16g');
const d28 = { time: { currentYear: 2028, currentMonth: 1 } }, d26 = { time: { currentYear: 2026, currentMonth: 1 } };
ok(MP.getMarketPrice(d26, ram) === 55, 'harga RAM 2026 tetap 55');
ok(Math.abs(MP.getMarketPrice(d28, ram) - 82.5) < 0.01, 'harga RAM 2028 = 82.5');
ok(MP.resolveComponentCost(d28, ram) === MP.getMarketPrice(d28, ram), 'tanpa pabrik: biaya = harga pasar');
ok(!!getComponentById('ram_lpddr6_24g'), 'komponen LPDDR6 ada');

// --- anchor pasar
const A = BALANCE.market;
console.log('unit/bln 2026-2030:', [2026,2027,2028,2029,2030].map(y => A.marketUnitsByYear[y]/1e6).join(' '), '| harga:', [2026,2027,2028,2029,2030].map(y => A.avgPriceByYear[y]).join(' '));
ok(A.avgPriceByYear[2029] < A.avgPriceByYear[2028], 'anchor pemulihan harga');

// --- OS
const feats = ['fw_agentic_os','fw_agent_guard','fw_agent_store'];
const ids = new Set(OS.OS_FEATURES.map(f => f.id));
feats.forEach(f => { ok(ids.has(f), 'fitur ' + f); });
OS.OS_FEATURES.forEach(f => (f.requiresFeatures||[]).forEach(r => ok(ids.has(r), f.id + ' requires ' + r)));
const rn = new Set(RESEARCH_NODES.map(n => n.id));
OS.OS_FEATURES.forEach(f => (f.requiresResearch||[]).forEach(r => ok(rn.has(r), f.id + ' riset ' + r)));
RESEARCH_NODES.forEach(n => (n.prerequisites||[]).forEach(p => ok(rn.has(p), n.id + ' prereq ' + p)));
ok(OUC.findUnmappedOsFeatures().length === 0, 'fitur OS belum dipetakan: ' + OUC.findUnmappedOsFeatures());
const bug = OS.OS_BUGS ? OS.OS_BUGS : Object.values(OS).find(v => Array.isArray(v) && v.some(x => x.id === 'bug_zero_day'));
ok(bug && bug.some(b => b.id === 'bug_agent_permission_leak' && ids.has(b.requiresFeature)), 'bug template baru valid');
for (const lang of ['id','en']) feats.forEach(f => { ['name','desc'].forEach(k => ok(OS_UPDATE_CARDS_I18N[lang]['osuc.feat.'+f+'.'+k], 'i18n '+lang+' '+f+'.'+k)); });
const rdEn = await load(root, 'data/i18n/research-data.en.js');
console.log('exports research-data.en:', Object.keys(rdEn).join(','));
const flat = JSON.stringify(rdEn);
ok(flat.includes('ai_agentic_runtime'), 'EN riset ai_agentic_runtime');
const osp = await load(root, 'data/i18n/os-panel.i18n.js');
ok(JSON.stringify(osp).includes('osp.bug.bug_agent_permission_leak'), 'EN bug name');

// --- tren & berita
['memory_crunch','agentic_ai','eu_battery_rule'].forEach(id => ok(NAV.getWave(id), 'gelombang ' + id));
NAV.TREND_WAVES.forEach(w => ok(w.from < w.peak && w.peak < w.to, 'wave ' + w.id + ' urutan'));
console.log('intensitas 2028.5:', ['memory_crunch','agentic_ai','eu_battery_rule'].map(id => NAV.waveIntensity(NAV.getWave(id), 2028.5).toFixed(2)).join(' '));
Object.entries(NEWS).forEach(([k, n]) => { ok(n.headline && n.text && n.headline_en && n.text_en, 'berita ' + k); ok(/^\d{4}-\d{1,2}$/.test(k), 'kunci ' + k); });

// --- kompetitor
ok(CI.getCompetitorById('novamind') && CI.getActiveCompetitors(2028).some(c => c.id === 'novamind') && !CI.getActiveCompetitors(2027).some(c => c.id === 'novamind'), 'novamind aktif mulai 2028');
const { CompetitorSystem } = await load(root, 'systems/CompetitorSystem.js');
const { CompetitorActionSystem } = await load(root, 'systems/CompetitorActionSystem.js');
const { MarketSystem } = await load(root, 'systems/MarketSystem.js');
state.reset('normal');
const t = state.data.time; t.currentYear = 2026; t.currentMonth = 12; t.currentDay = 15;
const cs = new CompetitorSystem(state); const as = new CompetitorActionSystem(state); const ms = new MarketSystem(state);
ms.setCompetitorSystem && ms.setCompetitorSystem(cs);
cs.start(); as.start(); ms.start();
const out = []; const withdrawnLog = [];
bus.on('competitor:deactivated', p => withdrawnLog.push(p.id + '@' + p.year));
let thrown = 0;
for (let y = 2027; y <= 2031; y++) {
  t.currentYear = y; t.currentMonth = 1;
  try { bus.emit('time:year-changed', { ...t }); } catch (e) { thrown++; console.log('ERR year', y, e.message); }
  for (let m = 1; m <= 12; m++) {
    t.currentYear = y; t.currentMonth = m;
    try { bus.emit('time:month-changed', { ...t }); } catch (e) { thrown++; console.log('ERR month', y, m, e.message); }
  }
  const shares = Object.fromEntries((state.data.market.competitors || []).map(c => [c.id, +(c.share * 100).toFixed(2)]));
  const sum = Object.values(shares).reduce((a, b) => a + b, 0) + state.data.market.share * 100;
  out.push([y, Object.keys(state.data.competitorState.entities).length, sum.toFixed(1), shares.samsung, shares.apple, shares.xiaomi, shares.novamind, shares.meizu]);
}
console.log('tahun | entitas | jumlah% (<100 = others) | samsung apple xiaomi novamind meizu');
out.forEach(r => console.log(r.join(' | ')));
console.log('menarik diri:', withdrawnLog.join(', ') || '-', '| withdrawn state:', JSON.stringify(state.data.competitorState.withdrawn));
ok(thrown === 0, 'tidak ada exception saat simulasi');
ok(state.data.competitorState.withdrawn.meizu, 'meizu menarik diri secara emergent');
ok(!state.data.competitorState.entities.meizu, 'meizu hilang dari entitas');
ok(state.data.competitorState.entities.samsung && state.data.competitorState.entities.novamind, 'samsung & novamind bertahan');
cs._seedForYear(2031); ok(!state.data.competitorState.entities.meizu, 'seed ulang tidak menghidupkan merek yang menarik diri');
ok(!state.data.competitorState.entities.google_android === false, 'ekosistem tetap');
for (const r of out) ok(parseFloat(r[2]) > 0 && parseFloat(r[2]) < 100, 'jumlah pangsa valid ' + r[0]);
console.log(fails ? 'TOTAL GAGAL: ' + fails : 'SEMUA LULUS');
process.exit(fails ? 1 : 0);
