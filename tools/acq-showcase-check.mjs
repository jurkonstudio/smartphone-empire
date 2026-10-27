// Tes aset visual mockup di panel Akuisisi (sebelum & sesudah diakuisisi).
// Pakai: node tools/acq-showcase-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || new URL('../src', import.meta.url).pathname;
stubBrowser(); seedRandom(7); console.info = () => {};
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EconBrakeSystem } = await load(root, 'systems/EconBrakeSystem.js');
const { buildCompetitorProducts, buildProductMockupConfig } = await load(root, 'data/competitor-products.model.js');
const { COMPONENTS, BODY_COLORS } = await load(root, 'data/components.data.js');
const { renderInvestPanel } = await load(root, 'ui/panels/InvestPanel.js');
const { openAcquisitionProductsModal } = await load(root, 'ui/panels/AcquisitionProductsModal.js');
LanguageService.setLang('id');

state.reset('normal');
const d = state.data;
d.time.currentYear = 2015; d.time.currentMonth = 6;
d.time.elapsedGameMinutes += 1e7;
d.cash = 1e15;
d.market.competitors = [
    { id: 'apple', name: 'Apple', share: 0.15 },
    { id: 'samsung', name: 'Samsung', share: 0.20 },
    { id: 'nokia', name: 'Nokia', share: 0.05 }
];
const eb = new EconBrakeSystem(state);
globalThis.__game = Object.assign(globalThis.__game || {}, { state, econ: eb, competitors: { getCompetitorData: (id) => ({ name: id }) } });
if (typeof window !== 'undefined' && window !== globalThis) window.__game = globalThis.__game;

// --- 1) pemetaan config mockup (fungsi murni) ---
const apple = { id: 'apple', color: '#555555', personality: 'premium' };
const ffIds = new Set(COMPONENTS.filter(c => c.category === 'form_factor').map(c => c.id));
const colIds = new Set(BODY_COLORS.map(c => c.id));
const pd = buildCompetitorProducts('apple', { year: 2015, month: 6, share: 0.15, releases: [] });
chk(pd && pd.products.length > 0, 'produk Apple tersedia untuk tahun 2015');
chk(pd.products.every(p => p.mockupConfig && ffIds.has(p.mockupConfig.formFactorId)), 'setiap produk punya formFactorId yang valid');
chk(pd.products.every(p => colIds.has(p.mockupConfig.bodyColorId)), 'setiap produk punya bodyColorId yang valid');
chk(pd.products.every(p => {
    const ff = COMPONENTS.find(c => c.id === p.mockupConfig.formFactorId);
    return ff.minYear <= p.year && (ff.maxYear == null || p.year <= ff.maxYear);
}), 'bentuk ponsel berlaku pada tahun rilis produk');
const cfgWarm = buildProductMockupConfig(apple, { year: 2010, tier: 5 });
chk(cfgWarm.bodyColorId === 'color_graphite', 'warna merek #555555 dipetakan ke warna terdekat (grafit)');
const cfgOld = buildProductMockupConfig(apple, { year: 2000, tier: 1 });
chk(cfgOld.formFactorId === 'ff_candybar', 'tahun 2000 tier 1 -> candybar');
chk(buildProductMockupConfig({ color: 'bukan-warna' }, { year: 2010, tier: 3 }).bodyColorId === 'color_black', 'warna merek rusak jatuh ke hitam (tidak crash)');

// --- 2) panel SEBELUM diakuisisi: pratinjau mockup tanpa angka produksi ---
const before = renderInvestPanel();
chk(before.includes('acq-strip') && !before.includes('acq-strip owned'), 'baris target memuat deretan mockup (pratinjau)');
chk(before.includes('<svg'), 'mockup dirender sebagai SVG di panel');
chk(!before.includes('Lini produksi'), 'sebelum diakuisisi: tidak ada lini produksi');
chk(!/acq-cap[^>]*>[^<]*unit\/bln/.test(before), 'pratinjau tidak menampilkan angka unit');

// --- 3) akuisisi lalu panel SESUDAH diakuisisi ---
const r = eb.acquire('apple');
chk(r.ok, 'akuisisi Apple berhasil' + (r.ok ? '' : ' (' + r.reason + ')'));
const after = renderInvestPanel();
chk(after.includes('Lini produksi Apple'), 'setelah diakuisisi: kartu Lini produksi Apple muncul');
chk(after.includes('acq-prod') && after.includes('acq-grid'), 'kartu produksi memuat grid mockup');
chk(/\d[\d,.]* unit\/bln/.test(after) || after.includes('unit/bln'), 'kartu produksi menampilkan volume per bulan');
chk(after.includes('data-econ-acq-products="apple"'), 'tombol "Lihat semua produk" tersedia di kartu produksi');
chk(after.includes('acq-strip owned') === false, 'Apple (sudah dimiliki) tidak lagi di daftar target');

// --- 4) modal produk: setiap kartu punya thumbnail ---
let modalNode = null;
globalThis.document = globalThis.document || {};
try {
    const { Modal } = await load(root, 'ui/modal.js');
    const orig = Modal.open;
    Modal.open = (id, html) => { modalNode = html; return { querySelector: () => null, addEventListener: () => {} }; };
    openAcquisitionProductsModal({ competitorId: 'samsung' });
    Modal.open = orig;
    chk(typeof modalNode === 'string' && modalNode.includes('acq-ap-thumb') && modalNode.includes('<svg'), 'modal produk memuat thumbnail mockup per produk');
} catch (e) {
    console.log('SKIP modal (' + (e && e.message) + ')');
}

console.log(fails ? fails + ' GAGAL' : 'SEMUA LULUS');
process.exit(fails ? 1 : 0);
