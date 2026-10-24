// Tes event pilihan + quest era 2000–2002.  Jalankan dari akar repo:
//   node tools/era-events-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'src');
stubBrowser(); seedRandom(7);
const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { ERA_EVENTS, ERA_EVENT_SCOPES } = await load(root, 'data/era-events.data.js');
const { EraEventSystem, getEraEventDemandFactor, ensureEraEventState } = await load(root, 'systems/EraEventSystem.js');
const { QuestSystem, QUEST_DEFS, localizeQuest } = await load(root, 'systems/QuestSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { describeEffects } = await load(root, 'ui/panels/EraEventModal.js').catch(() => ({}));

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };
const section = (s) => console.log('\n# ' + s);

// ---------- 1. validasi data
section('data');
const ids = new Set();
for (const e of ERA_EVENTS) {
  ok(!ids.has(e.id), 'id unik ' + e.id); ids.add(e.id);
  ok(e.title.id && e.title.en && e.body.id && e.body.en, e.id + ' teks id+en');
  ok(e.at.year >= 2000 && e.until.year <= 2002, e.id + ' di era 2000-2002');
  ok(e.at.year * 12 + e.at.month <= e.until.year * 12 + e.until.month, e.id + ' jendela valid');
  ok(e.choices.length >= 2 && e.choices.length <= 3, e.id + ' 2-3 pilihan');
  ok(e.choices.some(c => !c.cost), e.id + ' ada pilihan gratis');
  const cids = new Set();
  for (const c of e.choices) {
    ok(!cids.has(c.id), e.id + ' choice id unik'); cids.add(c.id);
    ok(c.label.id && c.label.en && c.outcome.id && c.outcome.en, e.id + '/' + c.id + ' teks id+en');
    ok(c.cost >= 0 && c.cost <= 20000, e.id + '/' + c.id + ' biaya wajar');
    for (const m of (c.effects && c.effects.demand) || []) {
      ok(ERA_EVENT_SCOPES.includes(m.scope), e.id + ' scope ' + m.scope);
      ok(m.mult >= 0.85 && m.mult <= 1.2, e.id + ' mult ' + m.mult);
      ok(m.days > 0 && m.days <= 400, e.id + ' days');
    }
  }
}
console.log('  ' + ERA_EVENTS.length + ' event, ' + ERA_EVENTS.reduce((a, e) => a + e.choices.length, 0) + ' pilihan');
if (describeEffects) {
  const txt = describeEffects(ERA_EVENTS[0].choices[2]).map(l => l.text).join(' | ');
  console.log('  contoh teks efek:', txt);
}

// ---------- 2. jadwal & keputusan
section('jadwal & keputusan');
state.reset('normal');
state.data.tutorial = { completed: true, skipped: false, currentStep: 0 };
const eras = new EraEventSystem(state);
const pendings = [];
bus.on('eraevent:pending', d => pendings.push(d.event.id));
eras.start();
const tick = (y, m) => { const t = state.data.time; t.currentYear = y; t.currentMonth = m; t.elapsedGameMinutes += 60 * 24 * 30; bus.emit('time:month-changed', {}); };
tick(2000, 3); ok(pendings.length === 0, 'belum ada event di Mar 2000');
tick(2000, 4); ok(pendings[0] === 'ev2000_3g_auction', 'lelang 3G muncul Apr 2000: ' + pendings[0]);
const cash0 = state.data.cash;
let r = eras.choose('ev2000_3g_auction', 'oem');
ok(r.ok, 'pilihan OEM berhasil'); ok(state.data.cash === cash0 - 6000 + 18000, 'kas OEM: ' + (state.data.cash - cash0));
ok(eras.getPending() === null, 'pending kosong setelah memilih');
r = eras.choose('ev2000_3g_auction', 'budget'); ok(!r.ok, 'tidak bisa memilih dua kali');
// event kedua muncul setelah advance()
tick(2000, 7); eras.advance();
ok(pendings.includes('ev2000_sms_boom'), 'SMS boom Jul 2000');
// Aug: 3310 antre di belakang SMS (belum diputuskan)
tick(2000, 8);
ok(ensureEraEventState(state.data).queue.includes('ev2000_nokia_3310'), '3310 mengantre');
// dana tak cukup
state.data.cash = 100;
ok(!eras.canChoose('ev2000_sms_boom', 'keypad').ok, 'keypad ditolak saat kas minim');
ok(eras.canChoose('ev2000_sms_boom', 'skip').ok, 'pilihan gratis selalu bisa');
r = eras.choose('ev2000_sms_boom', 'keypad'); ok(!r.ok && r.reason === 'funds', 'choose menolak karena dana');
state.data.cash = 100000;

// ---------- 3. efek permintaan
section('efek permintaan');
const ps = new ProductSystem(state);
const mk = (cfg, price) => ({ id: 'p', status: 'selling', config: Object.assign({ formFactorId: 'ff_bar' }, cfg), price,
  stats: { display: 45, camera: 45, battery: 45, performance: 45, connectivity: 45, design: 45, usability: 45, quality: 45, qualityScore: 45 },
  releaseGameMinute: 0, noiseState: 0, competitorPressure: 0.2 });
const cheap = mk({ displayId: 'scr_mono', cameraId: 'none' }, 90), colorCam = mk({ displayId: 'scr_stn_color', cameraId: 'cam_vga' }, 250);
const f = (p) => getEraEventDemandFactor(state.data, p);
ev0: {
  const e = ensureEraEventState(state.data);
  e.mods = [];
  ok(f(cheap) === 1, 'tanpa mod = 1');
  e.mods.push({ eventId: 't', scope: 'budget', mult: 1.12, untilMinute: state.data.time.elapsedGameMinutes + 1000 });
  e.mods.push({ eventId: 't', scope: 'color', mult: 1.15, untilMinute: state.data.time.elapsedGameMinutes + 1000 });
  e.mods.push({ eventId: 't', scope: 'camera', mult: 1.1, untilMinute: state.data.time.elapsedGameMinutes - 1 }); // kedaluwarsa
  ok(Math.abs(f(cheap) - 1.12) < 1e-9, 'budget kena x1.12: ' + f(cheap));
  ok(Math.abs(f(colorCam) - 1.15) < 1e-9, 'warna kena x1.15 (kamera kedaluwarsa tidak): ' + f(colorCam));
  e.mods = Array.from({ length: 10 }, () => ({ eventId: 't', scope: 'all', mult: 1.2, untilMinute: 1e12 }));
  ok(f(cheap) === 1.5, 'dijepit ke 1.5: ' + f(cheap));
  e.mods = [];
}
// integrasi ProductSystem
{
  const e = ensureEraEventState(state.data); e.mods = [];
  state.data.time.currentYear = 2001; seedRandom(3); const a = ps._computeDailyDemand(cheap);
  e.mods.push({ eventId: 't', scope: 'all', mult: 1.1, untilMinute: 1e12 }); seedRandom(3); const b = ps._computeDailyDemand(cheap);
  ok(b > a && Math.abs(b / a - 1.1) < 0.02, 'ProductSystem memakai faktor: ' + a + ' -> ' + b);
  e.mods = [];
}
// kedaluwarsa harian
{
  const e = ensureEraEventState(state.data);
  e.mods = [{ eventId: 't', scope: 'all', mult: 1.1, untilMinute: state.data.time.elapsedGameMinutes + 10 }];
  state.data.time.elapsedGameMinutes += 100; bus.emit('time:day-changed', {});
  ok(e.mods.length === 0, 'mod kedaluwarsa dibuang');
}

// ---------- 4. jendela & save lama & tutorial
section('jendela, save lama, tutorial');
state.reset('normal'); state.data.tutorial = { completed: true };
const eras2 = new EraEventSystem(state); const p2 = []; bus.on('eraevent:pending', d => p2.push(d.event.id));
state.data.time.currentYear = 2001; state.data.time.currentMonth = 1;   // load langsung di 2001
eras2.start();
ok(!p2.includes('ev2000_3g_auction'), 'event 2000 yang lewat batas hangus');
ok(ensureEraEventState(state.data).seen.includes('ev2000_3g_auction'), 'ditandai seen');
{ // save lama tanpa field baru
  const d = { events: { cooldownUntilMinute: 0, pending: null, history: [] } };
  ensureEraEventState(d); ok(Array.isArray(d.queue) || Array.isArray(d.events.queue), 'migrasi field events');
}
{ // tutorial aktif menahan event
  state.reset('normal'); state.data.tutorial = { completed: false, skipped: false };
  const e3 = new EraEventSystem(state); const p3 = []; bus.on('eraevent:pending', d => p3.push(d.event.id));
  e3.start(); tick(2000, 4); ok(p3.length === 0, 'tidak muncul saat tutorial');
  state.data.tutorial.completed = true; tick(2000, 5); ok(p3[0] === 'ev2000_3g_auction', 'muncul setelah tutorial (masih dalam jendela)');
}

// ---------- 5. quest
section('quest era');
state.reset('normal'); state.data.tutorial = { completed: true };
const qs = new QuestSystem(state); qs.start();
const act = () => state.data.quests.active.map(a => a.id);
ok(act().join() === 'first_start_research,first_recruit,first_product', 'awal: 3 quest pemula saja: ' + act());
state.data.products.catalog.push({ id: 1, totalSold: 0, config: { displayId: 'scr_mono', cameraId: 'cam_vga' } });
qs.evaluateAll();
ok(state.data.quests.completed.includes('first_product'), 'first_product selesai');
ok(act().includes('era_sales_5k') && act().includes('era_two_products') && act().includes('era_decide_2'), 'quest era 2000 terbuka: ' + act());
ok(!act().includes('era_color_phone') && !act().includes('era_camera_13mp') && !act().includes('era_sales_50k'), 'quest 2001/2002 belum');
state.data.products.catalog[0].totalSold = 6000; qs.evaluateAll();
ok(state.data.quests.completed.includes('era_sales_5k'), 'jual 5k selesai');
const cash1 = state.data.cash;
// pindah ke 2001
state.data.time.currentYear = 2001; state.data.time.currentMonth = 1; bus.emit('time:month-changed', {});
ok(act().includes('era_sales_50k') && act().includes('era_color_phone') && act().includes('era_own_os') && act().includes('era_rep_20'), 'quest 2001 terbuka: ' + act());
state.data.products.catalog.push({ id: 2, totalSold: 0, config: { displayId: 'scr_stn_color', cameraId: 'none' } });
qs.evaluateAll();
ok(state.data.quests.completed.includes('era_color_phone') && state.data.quests.completed.includes('era_two_products'), 'warna & dua produk selesai');
// kontrak operator: selesai hanya lewat pilihan OEM 3G / paket GPRS
ok(act().includes('era_carrier_deal'), 'quest kontrak operator aktif');
state.data.events.history.push({ eventId: 'ev2000_3g_auction', choiceId: 'budget' }); qs.evaluateAll();
ok(!state.data.quests.completed.includes('era_carrier_deal'), 'pilihan non-operator tidak menyelesaikan');
state.data.events.history.push({ eventId: 'ev2001_gprs_data', choiceId: 'partner' }); qs.evaluateAll();
ok(state.data.quests.completed.includes('era_carrier_deal'), 'paket operator GPRS menyelesaikan kontrak operator');
// kedaluwarsa
state.data.time.currentYear = 2002; state.data.time.currentMonth = 1; bus.emit('time:month-changed', {});
ok(!act().includes('era_decide_2') && (state.data.quests.completed.includes('era_decide_2') || state.data.quests.expired.includes('era_decide_2')), 'era_decide_2 tidak aktif lagi (selesai atau hangus)');
ok(state.data.quests.expired.includes('era_two_products') || state.data.quests.completed.includes('era_two_products'), 'era_two_products tidak tertinggal aktif');
ok(act().includes('era_camera_13mp'), 'quest kamera 2002 terbuka');
state.data.time.currentYear = 2003; state.data.time.currentMonth = 1; bus.emit('time:month-changed', {});
ok(act().filter(i => i.startsWith('era_')).length === 0, 'semua quest era hangus/selesai di 2003: ' + act());
ok(!act().includes('era_sales_5k'), 'quest selesai tidak aktif lagi');
// tidak reaktivasi
bus.emit('time:month-changed', {}); ok(!act().includes('era_decide_2'), 'tidak diaktifkan ulang');
// localize
state.data.time.currentYear = 2000;
ok(localizeQuest({ id: 'era_sales_5k' }).title.length > 0, 'localizeQuest era');
ok(localizeQuest({ id: 'first_product', title: 'X', description: 'Y' }).title === 'X', 'localizeQuest quest lama pakai teks tersimpan');
for (const d of QUEST_DEFS.filter(d => d.id.startsWith('era_'))) {
  ok(d.i18n && d.i18n.title.id && d.i18n.title.en && d.i18n.description.id && d.i18n.description.en, d.id + ' i18n');
  ok(d.rewards && d.rewards.cash > 0, d.id + ' reward');
}
console.log(fails ? '\nGAGAL: ' + fails : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
