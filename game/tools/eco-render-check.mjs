// Uji render panel ekosistem (kartu layanan) di id dan en, pada beberapa kondisi.
// Pakai: node tools/eco-render-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { renderEcosystemPanel } = await load(root, 'ui/panels/EcosystemPanel.js');
let fails = 0;
const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
state.reset('normal');
const d = state.data;
d.os = { versions: [{ id: 'v1', features: [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }], currentVersionId: 'v1', bugs: [] };
d.products = { catalog: [{ id: 'p1', name: 'U', totalSold: 2000000, releaseDate: { year: 2008, month: 6 }, status: 'selling', config: { osOptionId: 'own:v1' } }] };
d.cash = 1e9;
const eco = new EcosystemSystem(state);
const scenarios = [
  { name: 'terkunci 2000', year: 2000, feats: [] },
  { name: 'tahun ok, belum ada fitur', year: 2013, feats: [] },
  { name: 'fitur ada, belum buka', year: 2013, feats: ['fw_cloud_sync', 'fw_siri', 'fw_appstore'] },
  { name: 'cloud terbuka, tier gratis', year: 2013, feats: ['fw_cloud_sync', 'fw_siri', 'fw_appstore'], open: ['cloud'], tier: 'free' },
  { name: 'AI terbuka, premium', year: 2013, feats: ['fw_cloud_sync', 'fw_siri', 'fw_appstore'], open: ['ai'], tier: 'premium' },
];
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  for (const sc of scenarios) {
    d.time.currentYear = sc.year; d.time.currentMonth = 6;
    d.os.versions[0].features = sc.feats;
    const e = ensureEcosystemState(d);
    (sc.open || []).forEach(id => { e.services[id].open = true; });
    if (sc.tier) e.services[sc.open[0]].tier = sc.tier;
    e.services.cloud.open = (sc.open || []).includes('cloud');
    e.services.ai.open = (sc.open || []).includes('ai');
    if (sc.tier) { if (sc.tier === 'free') e.services[sc.open[0]].price = 0; }
    eco._refreshScore();
    let html = '';
    try { html = renderEcosystemPanel({ ecosystemSystem: eco }); } catch (err) { chk(false, `${lang}/${sc.name}: error render ${err.message}`); continue; }
    const bad = html.match(/NaN|undefined|\{(n|year|price|feature)\}|eco\.[a-z.]+/g) || [];
    chk(bad.length === 0, `${lang}/${sc.name}: tanpa NaN/undefined/placeholder/key mentah ${bad.length ? '(' + [...new Set(bad)].join(',') + ')' : ''}`);
    chk(html.includes('data-eco-svc-open') || html.includes('data-eco-svc-close') || html.includes('Gratis') || html.includes('Free') || html.includes('locked') || html.includes('Terbuka tahun') || html.includes('Unlocks'), `${lang}/${sc.name}: kartu layanan ada`);
  }
}
console.log(fails ? `GAGAL: ${fails}` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
