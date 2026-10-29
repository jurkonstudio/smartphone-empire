// Uji modal Kontrak Grosir: placeholder terisi, progres & hitung mundur, tombol Perluas.
// Pakai: node tools/wholesale-modal-check.mjs src
import { stubBrowser, load, seedRandom } from './boot.mjs';
const root = process.argv[2] || 'src';
stubBrowser(); seedRandom(9); console.info = () => {};
const { state } = await load(root, 'core/GameState.js');
const { LanguageService } = await load(root, 'core/LanguageService.js');
const { buildWholesaleHtml } = await load(root, 'ui/panels/WholesalePanel.js');
let fails = 0; const chk = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
LanguageService.setLang('id');
state.reset('normal');
const d = state.data;
d.time.elapsedGameMinutes = 0;

const sys = {
  getSnapshot: () => ({
    offers: [],
    shipping: [{ id: 'c1', buyerName: 'NEC', productName: 'fSociety Joy Pro Max', qty: 100, total: 8000,
                 acceptedAtMinute: 0, deliverAtMinute: 2 * 1440 }],
    revenueTotal: 8000, delivered: 0, history: []
  })
};

const html = buildWholesaleHtml(sys, false);
chk(!/\{n\}|\{p\}|\{r\}|\{g\}/.test(html), 'tidak ada placeholder mentah {n}');
chk(html.includes('bayar 2 hari lagi'), 'hitung mundur terisi: "bayar 2 hari lagi"');
chk(/aria-valuenow="0"/.test(html), 'progres 0% saat kontrak baru diterima');
chk(html.includes('data-wh-expand') && html.includes('aria-expanded="false"'), 'tombol Perluas tersedia (tertutup)');
chk(html.includes('>Perluas<'), 'label tombol Perluas');
chk(html.includes('data-wh-sec="shipping"') && html.includes('data-wh-sec="history"'), 'bagian bisa dilipat');

// Progres separuh jalan: 1 hari dari 2 hari.
d.time.elapsedGameMinutes = 1440;
const half = buildWholesaleHtml(sys, false);
chk(/aria-valuenow="50"/.test(half), 'progres 50% setelah 1 dari 2 hari');
chk(half.includes('bayar 1 hari lagi'), 'hitung mundur turun menjadi 1 hari');

const wide = buildWholesaleHtml(sys, true);
chk(wide.includes('aria-expanded="true"') && wide.includes('>Kecilkan<'), 'mode lebar menampilkan Kecilkan');

console.log(fails ? `GAGAL: ${fails}` : 'SEMUA RENDER LULUS');
process.exit(fails ? 1 : 0);
