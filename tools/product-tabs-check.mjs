// Uji tab Produk pasca-pemindahan: Desain memuat kontrol aksesori; Aksesori sub-tab sudah tidak ada.
// Pakai: node tools/product-tabs-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { renderProductPanel, setDesignTrack } = await load(root, 'ui/panels/ProductPanel.js');
setDesignTrack('earbuds');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
state.reset('normal');
const d = state.data;
d.os = { versions: [{ id: 'v1', features: [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }], currentVersionId: 'v1', bugs: [] };
d.products = { catalog: [{ id: 'p1', name: 'U', totalSold: 2000000, releaseDate: { year: 2008, month: 6 }, status: 'selling', config: { osOptionId: 'own:v1' } }] };
d.cash = 1e9; d.time.currentYear = 2020;
const eco = new EcosystemSystem(state);
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  const design = renderProductPanel({ subtab: 'design', productSystem: null, researchSystem: null, osSystem: null, ecosystemSystem: eco });
  chk(design.includes('data-design-track="earbuds"'), `${lang} desain memuat bilah kategori`);
  chk(design.includes('data-eco-open') || design.includes('data-eco-tier'), `${lang} desain memuat kontrol lini aksesori`);
  chk(!/dt\.[a-z._]+|eco\.[a-z._]+/.test(design), `${lang} desain tanpa kunci mentah`);
  const cat = renderProductPanel({ subtab: 'catalog', productSystem: null, researchSystem: null, osSystem: null, ecosystemSystem: eco });
  chk(cat.includes('data-catalog-cat="acc"'), `${lang} katalog memuat filter kategori`);
  chk(!/cat\.[a-z._]+/.test(cat), `${lang} katalog tanpa kunci mentah`);
  const acc = renderProductPanel({ subtab: 'accessories', productSystem: null, researchSystem: null, osSystem: null, ecosystemSystem: eco });
  chk(!acc.includes('data-prod-subtab="accessories"') && acc.includes('data-design-track'), `${lang} subtab aksesori dialihkan ke desain`);
}
console.log(fails ? `${fails} GAGAL` : 'SEMUA TAB LULUS');
process.exit(fails ? 1 : 0);
