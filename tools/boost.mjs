import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(21);
const { state } = await load(root, 'core/GameState.js');
const { PromotionSystem } = await load(root, 'systems/PromotionSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const pd = await load(root, 'data/promotion.data.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
state.reset('normal'); const T = state.data.time; T.currentYear = 2018; T.currentMonth = 6; T.currentDay = 10; state.data.cash = 5e8;
const nav = new MarketNavSystem(state); nav._ensure(); const promo = new PromotionSystem(state); promo._ensure();
const ps = new ProductSystem(state); ps.setMarketNav(nav); ps.setPromotionSystem(promo);
const macro = getMacro(T, BALANCE.macro);
const S = (o) => Object.assign({ display: 60, camera: 60, battery: 60, performance: 60, connectivity: 60, design: 60, usability: 60, quality: 60, qualityScore: 60 }, o);
const profiles = {
  gamer_phone:   S({ performance: 92, display: 80, battery: 50, camera: 45, design: 55 }),
  creator_phone: S({ camera: 95, display: 70, battery: 50, performance: 60 }),
  pro_phone:     S({ battery: 90, connectivity: 85, usability: 75, camera: 45, design: 55 }),
  value_phone:   S({ battery: 80, quality: 75, camera: 40, performance: 45, display: 45, design: 40 }),
  balanced:      S({}),
};
for (const boost of [0.5, 1.0, 1.5, 2.0]) {
  console.log('== segmentBoost', boost);
  for (const [name, st] of Object.entries(profiles)) {
    const p = { id: 'p', name, status: 'selling', config: { formFactorId: 'ff_bar' }, price: macro.priceRef * 1.1, stats: st, releaseGameMinute: 0, noiseState: 0, competitorPressure: 0 };
    state.data.products.catalog = [p];
    const dem = () => { p.noiseState = 0; seedRandom(5); return ps._computeDailyDemand(p); };
    const mk = (seg) => ({ id: 'x', pkgId: 'seg_pro', scope: 'segment', productId: 'p', startedAtMinute: 0, endsAtMinute: 1e12, durationDays: 21, eff: promo._packageReach(pd.getPackageById('seg_pro')), brandGain: 0, segment: seg, segmentBoost: seg ? boost : 0 });
    promo.promo.campaigns = [mk(null)]; const d0 = dem();
    const row = [];
    for (const seg of ['value', 'youth', 'gamer', 'creator', 'pro', 'premium']) { promo.promo.campaigns = [mk(seg)]; row.push(seg + ' ' + (((dem() / d0) - 1) * 100).toFixed(1) + '%'); }
    console.log(name.padEnd(14), row.join(' | '));
  }
}
