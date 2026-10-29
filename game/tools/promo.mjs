import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(21);
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { PromotionSystem } = await load(root, 'systems/PromotionSystem.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const rg = await load(root, 'data/region.data.js');
const pd = await load(root, 'data/promotion.data.js');
const md = await load(root, 'data/market-nav.data.js');
const { DICTIONARIES } = await load(root, 'data/i18n/index.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
let fails = 0; const ok = (name, cond, extra) => { console.log((cond ? 'OK   ' : 'GAGAL') + ' ' + name + (extra ? '  ' + extra : '')); if (!cond) fails++; };

// ---- 1. data
const missing = [];
for (const lg of ['id', 'en']) {
  const d = DICTIONARIES[lg];
  for (const p of pd.PROMO_PACKAGES) for (const f of ['name', 'desc']) if (!d['promo.pkg.' + p.id + '.' + f]) missing.push(lg + ':promo.pkg.' + p.id + '.' + f);
  for (const s of rg.SEASON_EVENTS) if (!d[s.key]) missing.push(lg + ':' + s.key);
  for (const sc of rg.SCOPE_IDS) { if (!d['region.' + sc]) missing.push(lg + ':region.' + sc); if (!d['promo.scope.' + sc + '.desc']) missing.push(lg + ':promo.scope.' + sc + '.desc'); }
  for (const k of ['promo.seg_fit', 'promo.locked_year', 'promo.err.locked_year', 'promo.modal.segment', 'promo.modal.segment_hint']) if (!d[k]) missing.push(lg + ':' + k);
}
ok('kunci i18n lengkap (id+en)', missing.length === 0, missing.slice(0, 5).join(','));
ok('semua paket: scope valid', pd.PROMO_PACKAGES.every(p => rg.SCOPE_IDS.includes(p.scope)));
ok('paket segmen: segmen valid', pd.PROMO_PACKAGES.filter(p => p.scope === 'segment').every(p => md.getSegment(p.segment)));
ok('id paket unik', new Set(pd.PROMO_PACKAGES.map(p => p.id)).size === pd.PROMO_PACKAGES.length);
ok('cakupan rest = fokus 1.6 hanya di rest', JSON.stringify(pd.getCoverage(pd.getPackageById('rest_retail'))) === JSON.stringify({ asia: 0, europe: 0, rest: 1.6 }));
ok('cakupan segmen = menyebar 0.75', JSON.stringify(pd.getCoverage(pd.getPackageById('seg_pro'))) === JSON.stringify({ asia: .75, europe: .75, rest: .75 }));
ok('musim: tiap wilayah punya >=2 event', ['asia', 'europe', 'rest'].every(r => rg.SEASON_EVENTS.filter(e => e.region === r).length >= 2));
ok('tak ada 2 event musim sama (wilayah+bulan)', new Set(rg.SEASON_EVENTS.map(e => e.region + e.month)).size === rg.SEASON_EVENTS.length);

// ---- 2. perilaku
state.reset('normal');
const T = state.data.time; T.currentYear = 2015; T.currentMonth = 6; T.currentDay = 10;
state.data.cash = 5e8;
const nav = new MarketNavSystem(state); nav._ensure();
const promo = new PromotionSystem(state); promo._ensure();
const ps = new ProductSystem(state); ps.setMarketNav(nav); if (ps.setPromotion) ps.setPromotion(promo); else ps._promotion = promo;
const macro = getMacro(T, BALANCE.macro);
const mk = (id, over) => Object.assign({ id, name: 'Test ' + id, status: 'selling', config: { formFactorId: 'ff_bar' }, price: macro.priceRef * 1.2,
  stats: { display: 60, camera: 60, battery: 60, performance: 60, connectivity: 60, design: 60, usability: 60, quality: 60, qualityScore: 60 },
  releaseGameMinute: T.elapsedGameMinutes || 0, noiseState: 0, competitorPressure: 0 }, over || {});
const phone = mk('pA');
// ponsel kamera sangat kuat -> cocok creator, kurang cocok value
const camPhone = mk('pB', { stats: { display: 55, camera: 95, battery: 45, performance: 60, connectivity: 55, design: 70, usability: 55, quality: 60, qualityScore: 62 } });
state.data.products.catalog = [phone, camPhone];
const dem = (p) => { p.noiseState = 0; seedRandom(77); return ps._computeDailyDemand(p); };

const before = dem(camPhone);
const rSeg = promo.startCampaign('pB', 'seg_creator');
ok('kampanye segmen creator dimulai (2015)', rSeg.ok === true, rSeg.reason || '');
const camp = promo.getActive('pB')[0] || {};
ok('kampanye menyimpan segment + boost', camp.segment === 'creator' && camp.segmentBoost === 0.5);
ok('nav membaca boost segmen', nav._segBoostFor('pB') && nav._segBoostFor('pB').creator === 1.5);
const afterCreator = dem(camPhone);
promo.promo.campaigns = []; promo.promo.brand = { asia: 0, europe: 0, rest: 0 };
promo.startCampaign('pB', 'seg_value');
const afterValue = dem(camPhone);
// efek bersih segmen = bandingkan dgn kampanye global setara reach (menghilangkan efek marketing)
promo.promo.campaigns = []; promo.promo.brand = { asia: 0, europe: 0, rest: 0 };
const segFitCreator = nav.getSegmentFit(camPhone, 'creator'), segFitValue = nav.getSegmentFit(camPhone, 'value');
ok('ponsel kamera: cocok creator > value', segFitCreator > segFitValue, 'creator ' + segFitCreator.toFixed(2) + ' value ' + segFitValue.toFixed(2));
console.log('     permintaan: tanpa promo', before, '| +creator', afterCreator, '| +value', afterValue);
ok('kampanye creator menaikkan permintaan lebih dari value untuk ponsel kamera', afterCreator >= afterValue);

// pisahkan efek segmen murni: kampanye dgn segment=null vs segment='creator', reach sama
const mkCamp = (seg) => ({ id: 'x' + seg, pkgId: 'seg_creator', scope: 'segment', productId: 'pB', startedAtMinute: 0, endsAtMinute: 1e12, durationDays: 21, eff: promo._packageReach(pd.getPackageById('seg_creator')), brandGain: 0, segment: seg, segmentBoost: seg ? .5 : 0 });
promo.promo.campaigns = [mkCamp(null)]; const dNo = dem(camPhone);
promo.promo.campaigns = [mkCamp('creator')]; const dCr = dem(camPhone);
promo.promo.campaigns = [mkCamp('value')]; const dVa = dem(camPhone);
const effCr = dCr / dNo - 1, effVa = dVa / dNo - 1;
console.log('     efek segmen murni (ponsel kamera): creator ' + (effCr * 100).toFixed(1) + '% | value ' + (effVa * 100).toFixed(1) + '%');
ok('efek segmen murni terbatas (|x|<=8%)', Math.abs(effCr) <= .08 && Math.abs(effVa) <= .08);
ok('segmen cocok > segmen tak cocok', effCr > effVa);
promo.promo.campaigns = [];

// kunci tahun
T.currentYear = 2001; nav._ctxKey = null;
const rLock = promo.startCampaign('pA', 'seg_gamer');
ok('seg_gamer ditolak tahun 2001', rLock.ok === false, rLock.reason);
const cashB = state.data.cash; const rRest = promo.startCampaign('pA', 'rest_retail');
ok('rest_retail jalan, kas berkurang', rRest.ok && state.data.cash < cashB);
T.currentYear = 2015; nav._ctxKey = null;
ok('duplikat ditolak', promo.startCampaign('pA', 'rest_retail').ok === false);
promo.startCampaign('pA', 'rest_carrier'); promo.startCampaign('pA', 'rest_event');
ok('maks 3 aktif per produk', promo.startCampaign('pA', 'seg_pro').ok === false);

// brand rest naik, hari berjalan
const b0 = promo.promo.brand.rest; for (let i = 0; i < 10; i++) promo._onDay();
ok('brand rest naik oleh paket rest', promo.promo.brand.rest > b0, b0.toFixed(1) + ' -> ' + promo.promo.brand.rest.toFixed(1));
const lifts = promo.getRegionLifts('pA');
ok('lift rest > 0, asia = hanya brand 0', lifts.rest > 0 && lifts.asia === 0, JSON.stringify({ rest: +lifts.rest.toFixed(2), asia: lifts.asia }));
ok('lift total finite', isFinite(lifts.total));
// kampanye segmen menaikkan brand semua wilayah (broad)
promo.promo.campaigns = []; promo.promo.brand = { asia: 0, europe: 0, rest: 0 };
promo.startCampaign('pA', 'seg_pro'); for (let i = 0; i < 5; i++) promo._onDay();
ok('kampanye segmen menaikkan brand di 3 wilayah', ['asia', 'europe', 'rest'].every(r => promo.promo.brand[r] > 0));

// fit rest: netral rata-rata
let sum = 0, n = 0, mn = 9, mx = 0;
for (let y = 2000; y <= 2026; y += 2) { T.currentYear = y; for (const s of [40, 60, 80]) { const m2 = getMacro(T, BALANCE.macro); const p = mk('f' + y + s, { price: m2.priceRef * Math.pow(s / 50, 1.3), stats: { ...phone.stats, qualityScore: s } }); state.data.market.reputation = 40; const f = promo.getRegionFit(p, 'rest'); sum += f; n++; mn = Math.min(mn, f); mx = Math.max(mx, f); } }
console.log('     fit rest: rata-rata ' + (sum / n).toFixed(3) + ' min ' + mn.toFixed(2) + ' maks ' + mx.toFixed(2));
ok('fit rest finite dan dalam 0.7-1.4', isFinite(sum) && mn >= .7 && mx <= 1.4);
T.currentYear = 2015; nav._ctxKey = null;

// ---- 3. render
const panel = await load(root, 'ui/panels/PromotionPanel.js');
const { Modal } = await load(root, 'ui/modal.js');
let captured = ''; Modal.open = (a, h) => { captured = h || a; };
promo.promo.campaigns = []; promo.startCampaign('pA', 'seg_creator');
window.__game = { promotion: promo, marketNav: nav, state, LanguageService, Modal, products: ps };
panel.setPromoProduct('pA');
for (const lg of ['id', 'en']) {
  LanguageService.setLang(lg);
  let html = ''; try { html = panel.renderPromotionPanel(); } catch (e) { ok('render ' + lg, false, e.message); continue; }
  const raw = [...new Set(html.match(/\b(promo|region|season|opinion|market)\.[a-z_.0-9]+/g) || [])];
  ok('render ' + lg + ' bersih', !/undefined|NaN|\[object/.test(html) && raw.length === 0, raw.slice(0, 5).join(',') + ' len=' + html.length);
  ok('render ' + lg + ' memuat paket segmen + rest', html.includes('data-promo-open="seg_pro"') && html.includes('data-promo-open="rest_retail"'));
  ok('render ' + lg + ' ada tag kecocokan segmen', /(Cocok segmen|Segment fit): \d+%/.test(html));
  panel.openPromoConfirmModal('seg_pro');
  const raw2 = [...new Set(captured.match(/\b(promo|region|season)\.[a-z_.0-9]+/g) || [])];
  ok('modal ' + lg + ' segmen bersih', captured.length > 0 && !/undefined|NaN|\[object/.test(captured) && raw2.length === 0, raw2.join(','));
}
// tahun 2001: paket gamer terkunci di panel
T.currentYear = 2001; nav._ctxKey = null; LanguageService.setLang('en');
const html01 = panel.renderPromotionPanel();
ok('2001: gamer tampil terkunci (tombol disabled "Unlocks 2004")', html01.includes('Unlocks 2004') && !html01.includes('data-promo-open="seg_gamer"'));
console.log('\nGAGAL total:', fails);
process.exitCode = fails ? 1 : 0;
