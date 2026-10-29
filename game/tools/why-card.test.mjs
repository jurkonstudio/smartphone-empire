// Tes P2: HTML kartu "Kenapa penjualannya begini?" (saran pemasaran, usia produk, format angka per bahasa).
// Jalankan dari akar repo: node tools/why-card.test.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(5);
console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { ProductSystem } = await load(root, 'systems/ProductSystem.js');
const { MarketNavSystem } = await load(root, 'systems/MarketNavSystem.js');
const { getMacro } = await load(root, 'core/MacroModel.js');
const { BALANCE } = await load(root, 'data/balance.data.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { _whyCardHtml } = await load(root, 'ui/panels/ProductPanel.js');

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('GAGAL:', m); } else console.log('ok:', m); };

state.reset('normal');
const ps = new ProductSystem(state);
const nav = new MarketNavSystem(state); nav._ensure();
ps._nav = nav; globalThis.__game.products = ps;
const tm = state.data.time; tm.currentYear = 2010; nav._ctxKey = null;
const mm = getMacro(tm, BALANCE.macro), now = tm.elapsedGameMinutes || 0;
const mk = (id, age, price) => ({ id, status: 'selling', config: { formFactorId: 'ff_bar' }, price,
  stats: { display: 60, camera: 60, battery: 60, performance: 60, connectivity: 60, design: 60, usability: 60, quality: 60, qualityScore: 60 },
  releaseGameMinute: now - age * 1440, noiseState: 0, competitorPressure: 0 });

// Produk sehat usia 90 hari tanpa kampanye: saran pemasaran muncul walau pengali = 1,00
LanguageService.setLang('id');
const base = mk('w1', 90, mm.priceRef);
let h = _whyCardHtml(base);
ok(h.includes('Pemasaran') && h.includes('Jalankan kampanye pemasaran'), 'tanpa kampanye: saran pemasaran muncul');
ok(!h.includes('Tidak ada faktor yang menekan'), 'saran pemasaran menggantikan teks "tidak ada faktor menekan"');
// Dengan kampanye aktif: saran tidak muncul
state.data.marketing.activeCampaigns.push({ productId: 'w1', effectiveReach: 0.2 });
h = _whyCardHtml(base);
ok(!h.includes('Jalankan kampanye pemasaran'), 'dengan kampanye aktif: tidak ada saran pemasaran');
state.data.marketing.activeCampaigns.pop();
// Koma desimal di id, titik di en
ok(/×\d,\d\d/.test(h) && !/×\d\.\d\d/.test(h), 'id: angka kartu memakai koma');
LanguageService.setLang('en');
h = _whyCardHtml(base);
ok(/×\d\.\d\d/.test(h) && !/×\d,\d\d/.test(h), 'en: angka kartu memakai titik');
LanguageService.setLang('id');
// Produk baru (fase naik): bukan "menua"
h = _whyCardHtml(mk('w2', 10, mm.priceRef));
ok(h.includes('Usia produk') && h.includes('Produk baru') && !h.includes('sudah menua'), 'produk 10 hari: saran "produk baru", bukan "sudah menua"');
ok(h.includes('Usia produk 10 hari'), 'usia produk tampil dalam hari');
// Produk tua (late): saran menua + usia, tanpa saran pemasaran
h = _whyCardHtml(mk('w3', 300, mm.priceRef));
ok(h.includes('sudah menua') && h.includes('Usia produk 300 hari'), 'produk 300 hari: saran menua + usia');
ok(!h.includes('Jalankan kampanye pemasaran'), 'produk surut (pengali usia < 0,5): tidak disarankan kampanye');
// Produk bukan "selling": kartu kosong
ok(_whyCardHtml({ ...base, status: 'discontinued' }) === '', 'bukan selling: kartu tidak muncul');
console.log(fail ? fail + ' GAGAL' : 'SEMUA LULUS');
process.exit(fail ? 1 : 0);
