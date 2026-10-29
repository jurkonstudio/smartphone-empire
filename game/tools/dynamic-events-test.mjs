// Tes insiden dinamis (dynamic-events.data.js + EraEventSystem).  Jalankan dari akar repo:
//   node tools/dynamic-events-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'src');
stubBrowser(); seedRandom(11);
const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { DYNAMIC_EVENTS, resolveDynamicEvent } = await load(root, 'data/dynamic-events.data.js');
const { EraEventSystem, ensureEraEventState, getEraEventDemandFactor } = await load(root, 'systems/EraEventSystem.js');
const { describeEffects } = await load(root, 'ui/panels/EraEventModal.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };
const section = (s) => console.log('\n# ' + s);

section('data');
const ids = new Set();
const checkFx = (fx, tag) => {
  for (const m of (fx && fx.demand) || []) {
    ok(['all', 'budget', 'premium', 'color', 'camera'].includes(m.scope), tag + ' scope');
    ok(m.mult >= 0.8 && m.mult <= 1.2, tag + ' mult ' + m.mult);
    ok(m.days > 0 && m.days <= 400, tag + ' days');
  }
};
for (const e of DYNAMIC_EVENTS) {
  ok(!ids.has(e.id), 'id unik ' + e.id); ids.add(e.id);
  ok(e.title.id && e.title.en && e.body.id && e.body.en, e.id + ' teks id+en');
  ok(e.minYear >= 2000 && e.maxYear <= 2050 && e.minYear <= e.maxYear, e.id + ' rentang tahun');
  ok(e.choices.length >= 2 && e.choices.length <= 3, e.id + ' 2-3 pilihan');
  ok(e.choices.some(c => !c.cost), e.id + ' ada pilihan gratis');
  for (const c of e.choices) {
    ok(c.label.id && c.label.en, e.id + '/' + c.id + ' label');
    checkFx(c.effects, e.id + '/' + c.id);
    if (c.risk) {
      ok(c.risk.p > 0 && c.risk.p < 1, e.id + '/' + c.id + ' p valid');
      ok(!c.outcome, e.id + '/' + c.id + ' risk memakai outcome per cabang');
      for (const br of ['success', 'fail']) {
        ok(c.risk[br] && c.risk[br].outcome && c.risk[br].outcome.id && c.risk[br].outcome.en, e.id + '/' + c.id + ' outcome ' + br);
        checkFx(c.risk[br].effects, e.id + '/' + c.id + '/' + br);
      }
    } else ok(c.outcome && c.outcome.id && c.outcome.en, e.id + '/' + c.id + ' outcome');
  }
}
console.log('  ' + DYNAMIC_EVENTS.length + ' insiden');
const r1 = resolveDynamicEvent(DYNAMIC_EVENTS[0], 1), r50 = resolveDynamicEvent(DYNAMIC_EVENTS[0], 50);
ok(r50.choices[0].cost === r1.choices[0].cost * 50, 'biaya diskalakan 50x: ' + r50.choices[0].cost);
ok(DYNAMIC_EVENTS[0].choices[0].cost === 9000, 'data asli tidak berubah');
console.log('  risk teks:', describeEffects(r1.choices[1]).map(l => l.text).join(' | '));

section('P4: 27 insiden baru (gerbang tahun, bobot, cooldown, isi)');
// id -> [minYear, maxYear, weight, cooldownMonths]  (daftar yang disetujui pemilik, 26 Okt 2026)
const NEW_EVENTS = {
  dyn_screen_defect_batch: [2000, 2050, 1, 18], dyn_factory_disruption: [2000, 2050, 1, 18],
  dyn_warranty_surge: [2000, 2050, 1, 18], dyn_expo_demo_slot: [2000, 2050, 1, 18],
  dyn_price_war: [2004, 2050, 1, 18], dyn_poach_engineer: [2003, 2050, 1, 18],
  dyn_prototype_leak: [2005, 2050, 1, 18], dyn_counterfeit_wave: [2006, 2050, 1, 18],
  dyn_celebrity_endorse: [2005, 2050, 1, 18], dyn_government_subsidy: [2005, 2050, 1, 24],
  dyn_data_leak: [2011, 2050, 0.6, 30], dyn_app_scam: [2010, 2050, 1, 18],
  dyn_influencer_review: [2010, 2050, 1, 18], dyn_bad_os_update: [2010, 2050, 1, 18],
  dyn_rare_material_cost: [2010, 2050, 1, 18], dyn_charger_regulation: [2012, 2050, 1, 24],
  dyn_ransomware: [2016, 2050, 0.6, 30], dyn_trade_tariff: [2018, 2050, 1, 24],
  dyn_chip_shortage: [2020, 2024, 1, 24], dyn_ai_feature_hype: [2023, 2050, 1, 18],
  // tahap 5: insiden segmen (scope) & peluang
  dyn_camera_craze: [2005, 2050, 1, 18], dyn_budget_wave: [2001, 2050, 1, 24],
  dyn_premium_swing: [2003, 2050, 1, 24], dyn_investor_offer: [2003, 2050, 1, 24],
  dyn_industry_award: [2003, 2050, 1, 30], dyn_loyal_community: [2008, 2050, 1, 24],
  dyn_rival_recall: [2002, 2050, 1, 24]
};
// Insiden segmen wajib benar-benar memakai scope-nya (bukan 'all' saja).
const SEGMENT_SCOPE = { dyn_camera_craze: 'camera', dyn_budget_wave: 'budget', dyn_premium_swing: 'premium', dyn_rival_recall: 'premium' };
ok(DYNAMIC_EVENTS.length === 32, 'total 32 insiden (5 lama + 27 baru): ' + DYNAMIC_EVENTS.length);
for (const id in SEGMENT_SCOPE) {
  const e = DYNAMIC_EVENTS.find(x => x.id === id);
  const scopes = new Set();
  if (e) for (const c of e.choices) for (const fx of [c.effects].concat(c.risk ? [c.risk.success.effects, c.risk.fail.effects] : [])) for (const m of (fx && fx.demand) || []) scopes.add(m.scope);
  ok(e && scopes.has(SEGMENT_SCOPE[id]), id + ' memakai scope ' + SEGMENT_SCOPE[id]);
}
for (const id in NEW_EVENTS) {
  const e = DYNAMIC_EVENTS.find(x => x.id === id), g = NEW_EVENTS[id];
  ok(!!e, 'insiden baru ada: ' + id);
  if (!e) continue;
  ok(e.kind === 'dynamic' && e.when === 'selling', id + ' kind/when');
  ok(e.minYear === g[0] && e.maxYear === g[1], id + ' gerbang tahun ' + e.minYear + '-' + e.maxYear);
  ok(e.weight === g[2] && e.cooldownMonths === g[3], id + ' bobot/cooldown ' + e.weight + '/' + e.cooldownMonths);
  ok(e.choices.length === 3, id + ' tepat 3 pilihan');
  ok(e.choices.filter(c => !c.cost).length === 1, id + ' tepat satu pilihan gratis');
  ok(e.choices.some(c => c.risk), id + ' ada pilihan berisiko');
}
// Cek umum untuk SEMUA insiden: nama merek nyata, istilah anakronistik, batas efek.
const BRANDS = /\b(apple|iphone|ipad|samsung|nokia|google|android|facebook|instagram|tiktok|youtube|whatsapp|amazon|microsoft|windows|huawei|xiaomi|oppo|vivo|blackberry|motorola|sony|intel|qualcomm|nvidia|tesla|openai|chatgpt|twitter|telkomsel|verizon)\b/i;
const TERMS = [[/\bawan\b|\bcloud\b/i, 2011, 'awan/cloud'], [/\bAI\b|kecerdasan buatan|artificial intelligence/, 2023, 'AI'],
  [/ransomware/i, 2016, 'ransomware'], [/toko aplikasi|app store|scam app|aplikasi penipuan/i, 2010, 'toko aplikasi'],
  [/kreator|creator/i, 2010, 'kreator'], [/media sosial|social media/i, 2010, 'media sosial'],
  [/kelangkaan cip|chip shortage/i, 2020, 'kelangkaan cip'], [/\btarif\b|\btariff/i, 2018, 'tarif'],
  [/standar pengisi daya|charger standard/i, 2012, 'standar pengisi']];
const textsOf = (e) => {
  const t = [e.title, e.body];
  for (const c of e.choices) { t.push(c.label); if (c.outcome) t.push(c.outcome); if (c.risk) { t.push(c.risk.success.outcome); t.push(c.risk.fail.outcome); } }
  return t.map(o => (o.id || '') + ' | ' + (o.en || '')).join(' || ');
};
const cashOf = (fx) => (fx && typeof fx.cash === 'number') ? fx.cash : 0;
for (const e of DYNAMIC_EVENTS) {
  const txt = textsOf(e);
  ok(!BRANDS.test(txt), e.id + ' tanpa nama merek nyata');
  for (const [re, yr, nm] of TERMS) ok(!re.test(txt) || e.minYear >= yr, e.id + ' istilah "' + nm + '" sebelum ' + yr);
  for (const c of e.choices) {
    // Skenario terburuk satu pilihan: biaya + kas negatif terburuk (cabang gagal bila berisiko).
    const worstFx = c.risk ? Math.min(cashOf(c.effects) + cashOf(c.risk.success.effects), cashOf(c.effects) + cashOf(c.risk.fail.effects)) : cashOf(c.effects);
    const worst = (c.cost || 0) - Math.min(0, worstFx);
    ok(worst <= 90000, e.id + '/' + c.id + ' kerugian terburuk <= 2x -45.000: ' + worst);
    if (e.minYear <= 2004) ok(worst <= 45000, e.id + '/' + c.id + ' awal game: kerugian terburuk <= 45.000: ' + worst);
    const branches = c.risk ? [c.effects, c.risk.success.effects, c.risk.fail.effects] : [c.effects];
    for (const fx of branches) {
      ok(((fx && fx.demand) || []).length <= 2, e.id + '/' + c.id + ' maks 2 efek permintaan per cabang');
      ok(Math.abs((fx && fx.reputation) || 0) <= 6, e.id + '/' + c.id + ' reputasi dalam batas');
    }
    if (c.risk) ok(!c.cost || c.risk.p >= 0.45, e.id + '/' + c.id + ' pilihan berbayar berisiko tidak terlalu timpang (p>=0,45): ' + c.risk.p);
    if (!c.cost && c.risk) ok(c.risk.p <= 0.6, e.id + '/' + c.id + ' pilihan gratis berisiko p<=0,6: ' + c.risk.p);
  }
}

section('simulasi 2000-2050 (600 bulan x 20 run)');
const stats = { total: 0, byId: {}, minGap: 99, runs: 20, rolls: { success: 0, fail: 0 }, nan: 0, maxPerYear: 0 };
for (let run = 0; run < stats.runs; run++) {
  seedRandom(100 + run);
  state.reset('normal');
  state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
  state.data.cash = 1e9;
  state.data.products.catalog = [{ id: 1, status: 'selling', price: 100, config: {} }];
  const sys = new EraEventSystem(state);
  const log = [];
  bus.on('eraevent:pending', d => log.push(d.event));
  sys.start();
  let lastAbs = null; const perYear = {};
  for (let y = 2000; y <= 2050; y++) for (let m = 1; m <= 12; m++) {
    const t = state.data.time; t.currentYear = y; t.currentMonth = m; t.elapsedGameMinutes += 60 * 24 * 30;
    state.data.market.revenueHistory = [{ playerRevenue: 30000 * Math.pow(1.12, y - 2000) }];
    log.length = 0;
    bus.emit('time:month-changed', {});
    let pend = sys.getPending();
    // Event era 2000–2002 yang tertunda: putuskan dengan pilihan gratis supaya antrean jalan.
    while (pend && pend.kind !== 'dynamic') {
      sys.choose(pend.id, pend.choices.find(c => !c.cost).id); sys.advance(); pend = sys.getPending();
    }
    if (pend && pend.kind === 'dynamic') {
      const a = y * 12 + m;
      if (lastAbs !== null) stats.minGap = Math.min(stats.minGap, a - lastAbs);
      lastAbs = a;
      stats.total++; stats.byId[pend.id] = (stats.byId[pend.id] || 0) + 1;
      perYear[y] = (perYear[y] || 0) + 1;
      ok(state.data.time.elapsedGameMinutes >= 120 * 1440, 'tidak ada insiden di 4 bulan pertama');
      const def = DYNAMIC_EVENTS.find(e => e.id === pend.id);
      ok(y >= def.minYear && y <= def.maxYear, pend.id + ' di luar rentang tahun ' + y);
      const ch = pend.choices[Math.floor(Math.random() * pend.choices.length)];
      const res = sys.choose(pend.id, ch.id);
      ok(res.ok, 'choose ok ' + pend.id + '/' + ch.id);
      if (res.roll) stats.rolls[res.roll]++;
      ok(typeof res.outcome === 'string' && res.outcome.length > 5, 'outcome teks ' + pend.id);
      if (ch.risk) ok(res.choice.effects !== undefined && !res.choice.risk, 'hasil cabang tanpa risk');
      sys.advance();
    }
    if (!Number.isFinite(state.data.cash) || !Number.isFinite(state.data.market.reputation)) stats.nan++;
    const f = getEraEventDemandFactor(state.data, { price: 100, config: {} });
    ok(f >= 0.6 && f <= 1.5 && Number.isFinite(f), 'faktor permintaan aman ' + f);
  }
  stats.maxPerYear = Math.max(stats.maxPerYear, ...Object.values(perYear));
  sys.stop();
}
const perRun = stats.total / stats.runs;
console.log('  rata-rata insiden per game:', perRun.toFixed(1), '(' + (perRun / 51).toFixed(2) + '/tahun)', '| jarak min antar insiden (bulan):', stats.minGap, '| maks/tahun:', stats.maxPerYear);
console.log('  sebaran:', JSON.stringify(stats.byId));
console.log('  undian:', JSON.stringify(stats.rolls));
ok(stats.minGap >= 5, 'jarak minimum antar insiden >= 5 bulan');
ok(perRun / 51 >= 0.6 && perRun / 51 <= 1.6, 'frekuensi wajar per tahun: ' + (perRun / 51).toFixed(2));
ok(stats.nan === 0, 'tidak ada NaN pada kas/reputasi');
ok(Object.keys(stats.byId).length === DYNAMIC_EVENTS.length, 'semua insiden pernah muncul');

section('syarat & save lama');
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
state.data.products.catalog = [];
const s2 = new EraEventSystem(state);
let seen = 0; bus.on('eraevent:pending', () => seen++);
s2.start();
for (let i = 0; i < 60; i++) { const t = state.data.time; t.currentYear = 2005; t.currentMonth = (i % 12) + 1; t.elapsedGameMinutes += 60 * 24 * 30; bus.emit('time:month-changed', {}); }
ok(seen === 0, 'tanpa ponsel dijual tidak ada insiden');
delete state.data.events.dynLast; delete state.data.events.dynScale; delete state.data.events.dynLastAny;
const e2 = ensureEraEventState(state.data);
ok(e2.dynLast && e2.dynScale && e2.dynLastAny === 0, 'save lama dilengkapi field dinamis');
console.log(fails ? '\nGAGAL: ' + fails : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
