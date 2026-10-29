// Uji Overview v2: strip perhatian adaptif, aksi cepat yang disorot, dan sinyal runway.
// Pakai: node tools/overview-v2-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { renderDashboard } = await load(root, 'ui/panels/DashboardPanel.js');
const { computeRunway, computeAttention } = await load(root, 'ui/panels/OverviewSignals.js');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

const team = (n) => ({ getTeamCounts: () => ({ engineers: n, designers: 0, marketers: 0 }), getAverageMorale: () => 60 });
const hist = (cash, income, expense) => [
  { month: 6, year: 2010, cash, income, expense, net: income - expense },
  { month: 5, year: 2010, cash: cash + 1000, income, expense, net: income - expense },
  { month: 4, year: 2010, cash: cash + 2000, income, expense, net: income - expense }];
const healthy = { cash: 900000, finance: { history: hist(900000, 300000, 200000), negativeMonths: 0 },
  market: { reputation: 80 }, feedback: { sentiment: 70, feed: [], activeViral: [] }, log: [],
  products: { catalog: [{ id: 'p', status: 'selling' }] }, era: null, time: { currentYear: 2010 } };
const crisis = { cash: 40000, finance: { history: hist(40000, 10000, 40000), negativeMonths: 2 },
  market: { reputation: 20 }, feedback: { sentiment: 25, feed: [], activeViral: [{ type: 'negative', title: 'Baterai meledak' }] }, log: [],
  products: { catalog: [] }, era: null, time: { currentYear: 2010 } };
const snap = { currentYear: 2010, currentMonth: 6, currentDay: 1 };

for (const lang of ['id', 'en']) {
  LanguageService.setLang(lang);

  const hOk = renderDashboard(healthy, snap, null, team(5));
  chk(!/NaN|undefined/.test(hOk), `${lang}/sehat: tanpa NaN/undefined`);
  chk(!hOk.includes('ov-attn-chip'), `${lang}/sehat: strip perhatian tersembunyi`);
  chk(!hOk.includes('ov-qa--hot'), `${lang}/sehat: tidak ada aksi cepat yang disorot`);
  chk(hOk.includes('data-ov-live="runway-bar"'), `${lang}/sehat: bar runway live hadir`);
  chk(hOk.includes('class="ov-spark"'), `${lang}/sehat: sparkline kas hadir`);

  const hCr = renderDashboard(crisis, snap, null, team(0));
  chk(!/NaN|undefined/.test(hCr), `${lang}/krisis: tanpa NaN/undefined`);
  const chips = (hCr.match(/class="ov-attn-chip"/g) || []).length;
  chk(chips >= 3, `${lang}/krisis: ${chips} chip perhatian tampil`);
  chk(hCr.includes('data-hq-subtab="team"') && hCr.includes('ov-qa--hot'), `${lang}/krisis: rekrut & aksi cepat disorot`);
  chk(hCr.includes('data-nav="products"') && hCr.indexOf('ov-attn') < hCr.indexOf('ov-metrics'), `${lang}/krisis: strip di bawah hero, sebelum metrik`);
}

const r = computeRunway(crisis);
chk(r.kind === 'months' && r.months < 6 && r.tone === 'var(--danger)', 'runway krisis dihitung dan bernada bahaya');
chk(computeRunway(healthy).kind === 'positive', 'runway sehat = positif');
chk(computeRunway({ cash: 5, finance: { history: [] } }).kind === 'nodata', 'runway tanpa data');
console.log(fails ? `GAGAL: ${fails}` : 'SEMUA OVERVIEW LULUS');
process.exit(fails ? 1 : 0);
