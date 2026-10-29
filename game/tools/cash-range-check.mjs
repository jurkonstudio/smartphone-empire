// Uji pemilih rentang grafik kas (6 / 12 / 24 bulan) dan markup tombolnya.
// Pakai: node tools/cash-range-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { CASH_RANGES, cashHistoryView, renderCashChart } = await load(root, 'ui/panels/CashChart.js');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

LanguageService.setLang('id');
chk(JSON.stringify(CASH_RANGES) === '[6,12,24]', 'rentang tersedia 6, 12, 24');

// Riwayat terbaru di depan, 24 bulan seperti EconomySystem.
const hist = Array.from({ length: 24 }, (_, i) => ({ year: 2010, month: 12 - (i % 12), cash: 1000 - i * 10 }));
chk(cashHistoryView(hist, 6).length === 6, 'rentang 6 memotong ke 6 bulan');
chk(cashHistoryView(hist, 12).length === 12, 'rentang 12 memotong ke 12 bulan');
chk(cashHistoryView(hist, 24).length === 24, 'rentang 24 mengambil semua');
chk(cashHistoryView(hist, 6)[0] === hist[0], 'potongan mempertahankan urutan terbaru di depan');
chk(cashHistoryView(hist, 7).length === 24, 'rentang tidak valid jatuh ke 24');
chk(cashHistoryView(null, 6).length === 0, 'riwayat kosong/null aman');

const state = { finance: { history: hist } };
const html = renderCashChart(state);
const btns = html.match(/data-cash-range="\d+"/g) || [];
chk(btns.length === 3, 'tiga tombol rentang dirender');
chk(/data-cash-range="24" aria-pressed="true"/.test(html), 'default 24 bulan ditandai aktif');
chk(/data-cash-range="6" aria-pressed="false"/.test(html), '6 bulan tidak aktif saat default');
chk(html.includes('role="group"') && html.includes('aria-label='), 'kontrol punya role dan label');
chk(!/NaN|undefined/.test(html), 'markup tanpa NaN/undefined');

LanguageService.setLang('en');
const en = renderCashChart(state);
chk(en.includes('Time range') && en.includes('24 mo'), 'label bahasa Inggris dipakai');

console.log(fails ? `GAGAL: ${fails}` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
