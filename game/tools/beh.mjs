import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2];
stubBrowser(); seedRandom(3);
const { state } = await load(root, 'core/GameState.js');
const { PublicOpinionSystem } = await load(root, 'systems/PublicOpinionSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const { VIRAL_RESPONSES } = await load(root, 'data/feedback.data.js');
const md = await load(root, 'data/market-nav.data.js');
const log=(k,v)=>console.log(k.padEnd(34),v);
let fails=0; // jumlah pemuatan save yang gagal (lihat catch di bawah)
state.reset('normal');
state.data.cash = 1e9; if (state.addCash) state.addCash(1e9);
const op = new PublicOpinionSystem(state); op._onHydrated();
// viral negatif
let ok=false;
for (let i=0;i<40 && !ok;i++){ const r=op.forceViral('negative'); ok=!!(r&&r.ok); }
const v = op.getActiveViral()[0];
log('viral negatif dibuat', !!v);
const rep0 = state.data.market.reputation;
const r1 = op.respondToViral(v.id,'ignore'); const rep1=state.data.market.reputation;
const r2 = op.respondToViral(v.id,'ignore'); const r3 = op.respondToViral(v.id,'ignore'); const rep2=state.data.market.reputation;
log('abaikan #1 / #2 / #3', [r1.ok,r2.ok,r3.ok].join(' / '));
log('reputasi 0 -> 1 -> setelah spam', rep0+' -> '+rep1+' -> '+rep2);
// respons non-abaikan -> archive
const r4 = op.respondToViral(v.id, VIRAL_RESPONSES.find(r=>r.id!=='ignore').id);
log('respons lain ok', r4.ok);
log('viralHistory terisi', op.getViralHistory().length);
log('viral aktif tersisa', op.getActiveViral().length);
// respons baru ada & dwibahasa
for (const id of ['community_ama','software_fix','goodwill_voucher']) { const r=VIRAL_RESPONSES.find(x=>x.id===id); log('respons '+id, r? (r.i18n&&r.i18n.label&&r.i18n.label.id&&r.i18n.label.en?'dwibahasa':'KURANG i18n'):'HILANG'); }
// aspek baru -> saran
const asp = state.data.feedback.aspectSentiment||{};
log('aspek dihitung', Object.keys(asp).join(','));
for (const a of ['display','connectivity','usability']) log('aspek '+a+' dihitung', a in asp);
const fdm = await load(root,'data/feedback.data.js');
log('CUSTOMER_SUGGESTIONS aspek', fdm.CUSTOMER_SUGGESTIONS.map(x=>x.aspect).join(','));
// save roundtrip
const nav = new MarketNavSystem(state); nav._ensure();
state.data.marketNav.ext.connectivity = 77;
const json = JSON.stringify(state.data);
log('serialize berisi marketNav', json.includes('"marketNav"'));
const old = JSON.parse(json); delete old.marketNav;
const s2 = state; 
try { if (s2.hydrate) s2.hydrate(old); const n2 = new MarketNavSystem(s2); n2._ensure(); log('save lama dimuat -> ext dibuat', Object.keys(s2.data.marketNav.ext).join(',')); } catch(e){ fails++; log('hydrate save lama GAGAL', e.message); }
try { s2.hydrate(JSON.parse(json)); log('save baru dimuat, connectivity', s2.data.marketNav && s2.data.marketNav.ext.connectivity); } catch(e){ fails++; log('hydrate save baru GAGAL', e.message); }
log('validateMarketNavData', JSON.stringify(md.validateMarketNavData()));
console.log(fails ? fails + ' GAGAL' : 'SEMUA LULUS');
process.exit(fails ? 1 : 0);
