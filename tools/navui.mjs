import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(31);
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketSystem } = await load(root, 'systems/MarketSystem.js');
const { CompetitorSystem } = await load(root, 'systems/CompetitorSystem.js');
const { PublicOpinionSystem } = await load(root, 'systems/PublicOpinionSystem.js');
const { PromotionSystem } = await load(root, 'systems/PromotionSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const panel = await load(root, 'ui/panels/MarketPanel.js');
const fd = await load(root, 'data/feedback.data.js');
const { DICTIONARIES } = await load(root, 'data/i18n/index.js');
const { getMacro } = await load(root, 'core/MacroModel.js'); const { BALANCE } = await load(root, 'data/balance.data.js');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'OK   ' : 'GAGAL') + ' ' + n + (x ? '  ' + x : '')); if (!c) fails++; };

// kunci i18n market.nav.* yang dipakai kode harus ada di id & en
const fs = await import('node:fs'); const src = fs.readFileSync(root + '/ui/panels/MarketNavPanels.js', 'utf8');
const used = new Set([...src.matchAll(/'(market\.nav\.[a-z_.]+|market\.trend\.[a-z]+)'/g)].map(m => m[1]).filter(k => !k.endsWith('.')));
['market.nav.kind.segment','market.nav.kind.region','market.nav.outcome.ignored','market.nav.outcome.expired','market.nav.outcome.responded','market.nav.dir.up','market.nav.dir.down','market.nav.dir.flat'].forEach(k => used.add(k));
['connectivity','usability','durability','foldform'].forEach(k => used.add('market.trend.' + k));
const miss = []; for (const lg of ['id', 'en']) for (const k of used) if (!DICTIONARIES[lg][k]) miss.push(lg + ':' + k);
ok('semua kunci market.nav/trend ada (id+en)', miss.length === 0, miss.slice(0, 6).join(','));

async function setup(year, withProduct, withViral) {
  state.reset('normal'); const T = state.data.time; T.currentYear = year; T.currentMonth = 6; T.currentDay = 10; state.data.cash = 1e8;
  const nav = new MarketNavSystem(state); nav._ensure();
  state.data.market.trends = Object.assign({}, getMacro(T, BALANCE.macro).trends);
  const mk = new MarketSystem(state); const comp = new CompetitorSystem(state);
  const op = new PublicOpinionSystem(state); op._onHydrated();
  const promo = new PromotionSystem(state); promo._ensure();
  const ps = new ProductSystem(state); ps.setMarketNav(nav); ps.setPromotionSystem(promo);
  const m = getMacro(T, BALANCE.macro);
  state.data.products.catalog = withProduct ? [{ id: 'p1', name: 'Alpha', status: 'selling', config: { formFactorId: 'ff_bar' }, price: m.priceRef * 1.1,
    stats: { display: 62, camera: 70, battery: 55, performance: 60, connectivity: 58, design: 66, usability: 60, quality: 62, qualityScore: 62 },
    releaseGameMinute: 0, noiseState: 0, competitorPressure: 0, dailySales: [] }] : [];
  window.__game = { marketNav: nav, opinion: op, promotion: promo, state, LanguageService, products: ps, market: mk };
  if (withProduct) { op.recomputeNow(); for (let i = 0; i < 2; i++) nav._onMonth({ currentYear: year, currentMonth: 6 + i }); }
  if (withViral) { op.forceViral('negative'); const v = op.getActiveViral()[0]; op.respondToViral(v.id, 'ignore'); op.forceViral('positive'); op._tickViral(); }
  return { nav, mk, comp, op };
}
const cases = [[2001, false, false], [2008, true, true], [2018, true, true], [2026, true, false]];
for (const [year, wp, wv] of cases) {
  const { mk, comp, op } = await setup(year, wp, wv);
  for (const lg of ['id', 'en']) {
    LanguageService.setLang(lg);
    for (const sub of ['share', 'trends', 'public']) {
      let html = '';
      try { html = panel.renderMarketPanel({ subtab: sub, marketSystem: mk, competitorSystem: comp, opinionSystem: op }); }
      catch (e) { ok(`render ${year} ${lg} ${sub}`, false, e.message.slice(0, 120)); continue; }
      const raw = [...new Set(html.match(/\b(market|promo|region|season|opinion)\.[a-z_.0-9]+/g) || [])];
      const bad = /undefined|NaN|\[object|Infinity/.test(html);
      const hasNav = sub === 'share' ? html.includes('Segmen') || html.includes('Segments') : sub === 'trends' ? /Gelombang|Trend Waves/.test(html) : /Reaksi|Reactions/.test(html);
      ok(`${year} ${lg} ${sub}`, !bad && raw.length === 0 && hasNav, (raw.slice(0, 4).join(',') || '') + ' len=' + html.length);
    }
  }
}
// kartu navigasi tidak merusak sub-tab bila sistem nav hilang
const { mk, comp, op } = await setup(2018, true, false); delete window.__game.marketNav;
const h = panel.renderMarketPanel({ subtab: 'share', marketSystem: mk, competitorSystem: comp, opinionSystem: op });
ok('tanpa marketNav: sub-tab share tetap tampil', h.length > 500);
console.log('\nGAGAL total:', fails); process.exitCode = fails ? 1 : 0;
