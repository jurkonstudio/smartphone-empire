// Uji panel Aksesori (AccessoriesTab + AccessoryMockup) dengan data ekosistem asli.
// Pakai: node tools/accessories-mockup-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { renderAccessoriesTab } = await load(root, 'ui/panels/AccessoriesTab.js');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
state.reset('normal');
const d = state.data;
d.os = { versions: [{ id: 'v1', features: [], releasedAt: { year: 2000, month: 1 }, stats: { stability: 60, speed: 60, features: 60, security: 60, design: 60 } }], currentVersionId: 'v1', bugs: [] };
d.products = { catalog: [{ id: 'p1', name: 'U', totalSold: 2000000, releaseDate: { year: 2008, month: 6 }, status: 'selling', config: { osOptionId: 'own:v1' } }] };
d.cash = 1e9;
const eco = new EcosystemSystem(state);
for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);
  for (const year of [2000, 2010, 2020]) {
    d.time.currentYear = year; d.time.currentMonth = 6;
    const e = ensureEcosystemState(d);
    e.lines.earbuds.open = year >= 2004; e.lines.earbuds.tier = 'premium';
    e.lines.watch.open = false;
    e.lines.charger.open = true; e.lines.charger.tier = 'mid';
    let html = '';
    try { html = renderAccessoriesTab({ ecosystemSystem: eco }); } catch (err) { chk(false, `${lang}/${year} error ${err.message}`); continue; }
    const bad = html.match(/NaN|undefined|eco\.[a-z.]+/g) || [];
    chk(bad.length === 0, `${lang}/${year}: tanpa NaN/undefined/key mentah`);
    chk((html.match(/<svg class="acc-mockup"/g) || []).length >= 3, `${lang}/${year}: tiga mockup dirender`);
    chk(!html.includes('acc-hr') && html.includes('acc-led') === true, `${lang}/${year}: jam tertutup tanpa jarum bergerak`);
  }
}
console.log(fails ? `GAGAL: ${fails}` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
