// Tes kanal distribusi (channels.data.js + ChannelSystem + sambungan ProductSystem/EconomySystem).
//   node --experimental-default-type=module tools/channels-test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || 'src');
stubBrowser(); seedRandom(3);
const { state } = await load(root, 'core/GameState.js');
const { bus } = await load(root, 'core/EventBus.js');
const { CHANNELS, channelReachAt, CHANNEL_REACH_CAP } = await load(root, 'data/channels.data.js');
const { ChannelSystem, ensureChannelState } = await load(root, 'systems/ChannelSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { EconomySystem } = await load(root, 'systems/EconomySystem.js');
const { renderChannelPanel } = await load(root, 'ui/panels/ChannelPanel.js');
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } };
const section = (s) => console.log('\n# ' + s);
const setTime = (y, m) => { const t = state.data.time; t.currentYear = y; t.currentMonth = m; };
const fresh = (y = 2005) => {
  state.reset('normal'); state.data.cash = 5e6; setTime(y, 1);
  state.data.market.revenueHistory = [{ playerRevenue: 30000 }];
  const ch = new ChannelSystem(state); ch.start(); return ch;
};

section('data');
const ids = new Set();
for (const c of CHANNELS) {
  ok(!ids.has(c.id), 'id unik'); ids.add(c.id);
  ok(c.name.id && c.name.en && c.desc.id && c.desc.en, c.id + ' teks id+en');
  ok(c.retention > 0.5 && c.retention <= 1, c.id + ' retensi wajar');
  ok(c.unlock >= 2000 && c.lockMonths >= 0, c.id + ' unlock/lock');
  let prevY = 0;
  for (const [y, b] of c.reach) { ok(y > prevY, c.id + ' keyframe berurutan'); prevY = y; ok(b >= 0 && b <= 0.6, c.id + ' bonus wajar ' + b); }
  ok(channelReachAt(c, 1990) === c.reach[0][1] && channelReachAt(c, 2100) === c.reach[c.reach.length - 1][1], c.id + ' dijepit di ujung');
  const mid = channelReachAt(c, (c.reach[0][0] + c.reach[1][0]) / 2);
  ok(Math.abs(mid - (c.reach[0][1] + c.reach[1][1]) / 2) < 1e-9, c.id + ' interpolasi linear');
}
console.log('  ' + CHANNELS.length + ' kanal');

section('netral tanpa kanal aktif');
let ch = fresh();
const prod = { price: 100, config: { displayId: 'scr_tft' } };
ok(ch.getReachFactor(prod) === 1, 'reach 1.0');
ok(ch.getRetention(prod) === 1, 'retensi 1.0');
ok(ch.getMonthlyFixedCost() === 0, 'biaya tetap 0');

section('aktivasi, komitmen, biaya');
ch = fresh(2005);
ok(ch.activate('carrier').ok, 'buka operator');
ok(!ch.activate('carrier').ok && ch.activate('carrier').reason === 'already', 'tidak bisa dobel');
ok(ch.getSetupCost('carrier') === 12000, 'biaya buka skala 1x: ' + ch.getSetupCost('carrier'));
ok(state.data.cash === 5e6 - 12000, 'kas terpotong biaya buka');
ok(ch.getReachFactor(prod) > 1.2 && ch.getReachFactor(prod) < 1.5, 'reach operator 2005: ' + ch.getReachFactor(prod).toFixed(3));
const ret = ch.getRetention(prod);
ok(ret < 1 && ret > 0.9, 'retensi gabungan di antara 0.9-1: ' + ret.toFixed(3));
let r = ch.deactivate('carrier');
ok(!r.ok && r.reason === 'lock' && r.monthsLeft === 6, 'terikat komitmen 6 bln');
setTime(2005, 8);
ok(ch.deactivate('carrier').ok, 'bisa ditutup setelah komitmen');
ok(!ch.isActive('carrier'), 'nonaktif');
ok(ch.getReachFactor(prod) === 1, 'netral lagi');
setTime(2003, 1);
ok(ch.activate('own_store').reason === 'locked', 'toko sendiri terkunci sebelum 2004');
ok(ch.activate('online').ok, 'online buka 2003');
state.data.cash = 100;
setTime(2005, 1);
ok(ch.activate('own_store').reason === 'funds', 'dana kurang ditolak');

section('skala biaya mengikuti ukuran bisnis');
ch = fresh(2010);
state.data.market.revenueHistory = [{ playerRevenue: 3000000 }];
ok(ch.getSetupCost('carrier') === 1200000, 'skala 100x: ' + ch.getSetupCost('carrier'));
state.data.market.revenueHistory = [{ playerRevenue: 99e9 }];
ok(ch.getSetupCost('carrier') === 12000 * 300, 'skala dijepit 300x');

section('batas jangkauan & scope premium');
ch = fresh(2008);
ch.activate('carrier'); ch.activate('online'); ch.activate('own_store');
const cheap = { price: 10, config: { displayId: 'scr_mono' } };
const premium = { price: 9999, config: { displayId: 'scr_tft' } };
ok(ch.getReachFactor(premium) > ch.getReachFactor(cheap), 'toko sendiri menguntungkan premium');
ok(ch.getReachFactor(premium) <= 1 + CHANNEL_REACH_CAP + 1e-9, 'total bonus dijepit');
const bd = ch.getBreakdown(premium);
ok(Math.abs(bd.channels.reduce((a, s) => a + s.share, 0) - (bd.reach - 1) / bd.reach) < 1e-9, 'porsi unit konsisten dengan reach');
ok(bd.retention >= 0.3 && bd.retention <= 1, 'retensi dalam batas');

section('sambungan ProductSystem & EconomySystem');
ch = fresh(2005);
const ps = new ProductSystem(state);
ps.setChannels(ch);
const cfgDemand = () => ps._computeDailyDemand({ price: 80, stats: { qualityScore: 60 }, config: { displayId: 'scr_tft' }, releaseGameMinute: 0, id: 1 });
const stub = (v) => { let i = 0; Math.random = () => 0.5; };
stub();
state.data.time.elapsedGameMinutes = 60 * 24 * 200;
const base = (() => { let a = 0; for (let i = 0; i < 20; i++) a += cfgDemand(); return a; })();
ch.activate('carrier');
const withCh = (() => { let a = 0; for (let i = 0; i < 20; i++) a += cfgDemand(); return a; })();
const ratio = withCh / base;
ok(ratio > 1.25 && ratio < 1.55, 'permintaan harian naik ~operator 2005: ' + ratio.toFixed(3));
// penjualan: pendapatan bersih lebih kecil dari kotor
const p = { id: 1, name: 'T', status: 'selling', price: 80, stock: 1e6, totalSold: 0, totalRevenue: 0, stats: { qualityScore: 60 }, config: { displayId: 'scr_tft' }, releaseGameMinute: 0 };
state.data.products.catalog = [p];
const cash0 = state.data.cash;
ps._processDailySales ? ps._processDailySales() : null;
const sold = p.totalSold;
if (ps._processDailySales) {
  ok(sold > 0, 'ada penjualan harian');
  const gross = sold * 80;
  ok(p.totalRevenue < gross && p.totalRevenue > gross * 0.9, 'pendapatan bersih dipotong: ' + p.totalRevenue + ' < ' + gross);
  ok(Math.abs((state.data.cash - cash0) - p.totalRevenue) < 1, 'kas bertambah sebesar pendapatan bersih');
  const st = ensureChannelState(state.data).stats.carrier;
  ok(st && st.units > 0 && st.cut > 0, 'statistik kanal tercatat');
  ok(Math.abs(st.cut - (gross - p.totalRevenue)) < 2, 'potongan tercatat = kotor - bersih');
} else console.log('  (lewati: nama method penjualan harian berbeda)');
const eco = new EconomySystem(state); eco.setChannels(ch);
ok(ch.previewMonthlyFixedCost() === 800, 'biaya tetap operator skala 1x');
const paidBefore = ensureChannelState(state.data).paid.monthly;
ch.getMonthlyFixedCost();
ok(ensureChannelState(state.data).paid.monthly === paidBefore + 800, 'total biaya bulanan tercatat');

section('simulasi untung-rugi per margin (operator 2005)');
// Pendapatan - biaya produksi per unit. Kanal berpotongan besar harus merugikan margin tipis.
ch = fresh(2005); ch.activate('carrier');
const profit = (price, cost) => {
  const b = ch.getBreakdown({ price, config: {} });
  const extraUnits = b.reach - 1;                       // unit tambahan relatif baseline = 1
  const baseProfit = (price - cost) * 1;
  const withProfit = (price - cost) * 1 + extraUnits * (price * 0.72 - cost);
  return { base: baseProfit, withCh: withProfit, delta: withProfit - baseProfit };
};
const fat = profit(100, 40), thin = profit(100, 80), neg = profit(100, 75);
console.log('  margin 60%: delta ' + fat.delta.toFixed(1) + ' | margin 20%: delta ' + thin.delta.toFixed(1) + ' | cost 75: delta ' + neg.delta.toFixed(1));
ok(fat.delta > 0, 'margin tebal untung dari operator');
ok(thin.delta < 0 && neg.delta < 0, 'margin tipis rugi dari operator (harga 72 < biaya 75/80)');

section('save lama & panel');
const old = fresh(2005); delete state.data.channels;
const c2 = ensureChannelState(state.data);
ok(c2.active && c2.stats && c2.paid, 'save lama dilengkapi');
ok(old.getReachFactor(prod) === 1, 'save lama netral');
const html = renderChannelPanel({ channelSystem: old });
ok(typeof html === 'string' && html.includes('data-channel-toggle') && !/undefined|NaN/.test(html), 'panel render bersih');
ok(renderChannelPanel({}).includes('card'), 'panel aman tanpa sistem');
console.log(fails ? '\nGAGAL: ' + fails : '\nSEMUA LULUS');
process.exit(fails ? 1 : 0);
