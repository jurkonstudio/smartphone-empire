// Uji panel Aksesori (AccessoriesTab + AccessoryMockup) dengan data ekosistem asli.
// Pakai: node tools/accessories-mockup-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { EcosystemSystem, ensureEcosystemState } = await load(root, 'systems/EcosystemSystem.js');
const { renderAccessoriesTab } = await load(root, 'ui/panels/AccessoriesTab.js');
const { renderAccessoryMockup, watchHandAngles } = await load(root, 'ui/phone/AccessoryMockup.js');
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
    chk(!html.includes('data-hand') && !html.includes('data-acc-watch'), `${lang}/${year}: jam tertutup tanpa jarum/hidup`);
  }
}

// Jam pintar terbuka: sudut jarum harus sesuai waktu yang diberikan (10:10:30 pagi).
const t = new Date(2026, 0, 1, 10, 10, 30).getTime();
const a = watchHandAngles(t);
chk(Math.abs(a.hr - 305) < 0.01, `sudut jam 10:10:30 = ${a.hr.toFixed(2)} (harap 305)`);
chk(Math.abs(a.min - 63) < 0.01, `sudut menit 10:10:30 = ${a.min.toFixed(2)} (harap 63)`);
chk(Math.abs(a.sec - 180) < 0.01, `sudut detik 30 = ${a.sec.toFixed(2)} (harap 180)`);
const w = renderAccessoryMockup('watch', 'premium', { size: 120, open: true, now: t });
chk(w.includes('data-acc-watch="1"'), 'jam terbuka ditandai hidup');
chk(w.includes('data-hand="hr" transform="rotate(305.00 50 50)"'), 'jarum jam memakai waktu nyata');
chk(w.includes('data-hand="min" transform="rotate(63.00 50 50)"'), 'jarum menit memakai waktu nyata');
chk(w.includes('data-hand="sec" transform="rotate(180.00 50 50)"'), 'jarum detik memakai waktu nyata');
chk(!w.includes('acc-sec') && !w.includes('acc-hr'), 'jarum tidak lagi memakai loop CSS tetap');
const wc = renderAccessoryMockup('watch', 'premium', { size: 120, open: false });
chk(!wc.includes('data-hand') && !wc.includes('data-acc-watch'), 'jam tertutup statis');
console.log(fails ? `GAGAL: ${fails}` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
