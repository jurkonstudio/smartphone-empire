// Simulasi penuh 2000-2026 dengan sistem asli (tanpa browser) + pemeriksaan invarian tiap bulan.
// Pakai: node tools/fullrun.mjs src [seed] [difficulty]
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src', seed = Number(process.argv[3] || 7), diff = process.argv[4] || 'normal';
stubBrowser(); seedRandom(seed);
const logs = []; const origWarn = console.warn, origErr = console.error;
console.info = () => {}; console.log = (...a) => logs.push(['log', a.join(' ')]); console.warn = (...a) => logs.push(['warn', a.join(' ')]); console.error = (...a) => logs.push(['err', a.join(' ')]);
const out = (...a) => process.stdout.write(a.join(' ') + '\n');
const L = async (p, n) => (await load(root, p))[n];
const state = await L('core/GameState.js', 'state');
const names = ['TimeSystem:core/TimeSystem.js','EconomySystem:systems/EconomySystem.js','ResearchSystem:systems/ResearchSystem.js','ChipResearchSystem:core/ChipResearchSystem.js','OSSystem:systems/OSSystem.js','ProductSystem:systems/ProductSystem.js','MarketSystem:systems/MarketSystem.js','CompetitorSystem:systems/CompetitorSystem.js','CompetitorActionSystem:systems/CompetitorActionSystem.js','PublicOpinionSystem:systems/PublicOpinionSystem.js','MarketNavSystem:systems/MarketNavSystem.js','HypeCycleSystem:systems/HypeCycleSystem.js','EraSystem:systems/EraSystem.js','TeamSystem:systems/TeamSystem.js','ChipSystem:systems/ChipSystem.js','FabSystem:systems/FabSystem.js','ComponentPlantSystem:systems/ComponentPlantSystem.js','AssemblySystem:systems/AssemblySystem.js','WholesaleContractSystem:systems/WholesaleContractSystem.js','StockSystem:systems/StockSystem.js','PromotionSystem:systems/PromotionSystem.js','ChannelSystem:systems/ChannelSystem.js','AfterSalesSystem:systems/AfterSalesSystem.js','EcosystemSystem:systems/EcosystemSystem.js','AppStoreReviewSystem:systems/AppStoreReviewSystem.js','BankSystem:systems/BankSystem.js','EconBrakeSystem:systems/EconBrakeSystem.js','EraEventSystem:systems/EraEventSystem.js','QuestSystem:systems/QuestSystem.js','SeasonEndSystem:systems/SeasonEndSystem.js'];
const C = {};
for (const n of names) { const [c, p] = n.split(':'); try { C[c] = await L(p, c); } catch (e) { out('IMPORT GAGAL', c, e.message); } }
state.reset(diff);
globalThis.__game = { state };
const mk = c => C[c] ? new C[c](state) : null;
const S = {}; for (const c of Object.keys(C)) S[c] = mk(c);
const set = (a, f, b) => { if (S[a] && S[b] && S[a][f]) S[a][f](S[b]); };
set('ProductSystem','setMarketNav','MarketNavSystem'); set('ProductSystem','setHypeCycle','HypeCycleSystem'); set('ProductSystem','setMarketSystem','MarketSystem');
if (S.HypeCycleSystem) S.HypeCycleSystem.setSources({ os: S.OSSystem, chip: S.ChipSystem });
set('WholesaleContractSystem','setCompetitorActions','CompetitorActionSystem'); set('MarketSystem','setCompetitorSystem','CompetitorSystem');
set('ProductSystem','setPromotionSystem','PromotionSystem'); set('ProductSystem','setComponentPlantSystem','ComponentPlantSystem'); set('ProductSystem','setAssemblySystem','AssemblySystem');
set('BankSystem','setPromotionSystem','PromotionSystem'); set('EconomySystem','setBank','BankSystem');
for (const a of ['ProductSystem','MarketSystem','EconomySystem']) set(a,'setEconBrakes','EconBrakeSystem');
set('EconomySystem','setPlants','ComponentPlantSystem'); set('ProductSystem','setChannels','ChannelSystem'); set('EconomySystem','setChannels','ChannelSystem');
set('AfterSalesSystem','setAssembly','AssemblySystem'); set('ProductSystem','setAfterSales','AfterSalesSystem'); set('ProductSystem','setEcosystem','EcosystemSystem');
set('EconomySystem','setAfterSales','AfterSalesSystem'); set('EconomySystem','setEcosystem','EcosystemSystem'); set('EcosystemSystem','setAppReview','AppStoreReviewSystem'); set('TeamSystem','setEconomy','EconomySystem');
const order = ['EraSystem','SeasonEndSystem','EconomySystem','QuestSystem','TeamSystem','ResearchSystem','ChipResearchSystem','OSSystem','ProductSystem','CompetitorSystem','CompetitorActionSystem','MarketSystem','PublicOpinionSystem','MarketNavSystem','ChipSystem','FabSystem','ComponentPlantSystem','AssemblySystem','WholesaleContractSystem','EraEventSystem','StockSystem','PromotionSystem','ChannelSystem','AfterSalesSystem','EcosystemSystem','AppStoreReviewSystem','BankSystem','EconBrakeSystem'];
for (const c of order) { try { S[c] && S[c].start && S[c].start(); } catch (e) { out('START GAGAL', c, e.message); } }
export { state, S, C, out, logs, seedRandom };
