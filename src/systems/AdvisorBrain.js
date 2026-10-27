// FILE: src/systems/AdvisorBrain.js
// v2028.40 — "Otak" lokal Asisten Bisnis. Tanpa server / API key.

import { buildReport, formatReport, evaluateLoan, formatLoanVerdict, evaluateHire, formatHireVerdict, parseAction, actionAdvice } from './AdvisorReasoning.js';

var DAY = 1440;

// ------------------------------------------------------------
// Util teks
// ------------------------------------------------------------
function norm(s) {
    return String(s || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s$%]/g, ' ').replace(/\s+/g, ' ').trim();
}
function tokens(s) { var n = norm(s); return n ? n.split(' ') : []; }

function lev(a, b, max) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
        cur[0] = i;
        var rowMin = cur[0];
        for (j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (cur[j] < rowMin) rowMin = cur[j];
        }
        if (rowMin > max) return max + 1;
        var t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
}

function matchWord(tok, kw) {
    if (tok === kw) return 2;
    if (tok.length >= 4 && kw.length >= 4 && (kw.indexOf(tok) === 0 || tok.indexOf(kw) === 0)) return 1.5;
    if (kw.length >= 5 && tok.length >= 4) {
        var max = kw.length >= 8 ? 2 : 1;
        if (lev(tok, kw, max) <= max) return 1.1;
    }
    return 0;
}

function money(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function arr(a) { return Array.isArray(a) ? a : []; }
function pick(list, n) { return list[n % list.length]; }
function pct(x, d) { return (x * 100).toFixed(d === undefined ? 0 : d) + '%'; }

function parseAmount(numStr, unit) {
    var s = String(numStr || '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');
    var v = parseFloat(s);
    if (!isFinite(v)) return 0;
    var u = String(unit || '').toLowerCase();
    if (u === 'k' || u === 'rb' || u === 'ribu') v *= 1000;
    else if (u === 'jt' || u === 'juta' || u === 'm') v *= 1000000;
    return Math.round(v);
}

// ------------------------------------------------------------
// Kamus intent
// ------------------------------------------------------------
var INTENTS = {
    greet:     { w: 1, kw: ['halo', 'hai', 'hi', 'hello', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'woi'] },
    thanks:    { w: 1, kw: ['makasih', 'terima', 'kasih', 'thanks', 'thx', 'thank', 'mantap', 'sip', 'keren', 'good'] },
    help:      { w: 1, kw: ['bantuan', 'help', 'bisa', 'fitur', 'menu', 'cara', 'bantu', 'kemampuan', 'can'] },
    status:    { w: 1.2, kw: ['kondisi', 'keadaan', 'status', 'ringkasan', 'summary', 'overview', 'situasi', 'laporan', 'report', 'gimana', 'bagaimana', 'perusahaan', 'company', 'bisnis', 'business', 'briefing'] },
    health:    { w: 1.6, kw: ['sehat', 'health', 'skor', 'score', 'nilai', 'rapor', 'terlemah', 'weakest', 'kelemahan', 'weakness'] },
    next:      { w: 1.3, kw: ['saran', 'next', 'prioritas', 'harus', 'lakukan', 'todo', 'langkah', 'rekomendasi', 'recommend', 'suggestion', 'priority', 'sekarang', 'now', 'selanjutnya', 'should', 'penting', 'urgent', 'mendesak'] },
    plan:      { w: 1.4, kw: ['rencana', 'strategi', 'plan', 'strategy', 'roadmap', 'panduan', 'guide', 'tahap', 'mulai', 'start', 'awal', 'pemula', 'beginner'] },
    cash:      { w: 1.4, kw: ['uang', 'kas', 'cash', 'duit', 'saldo', 'dana', 'bokek', 'runway', 'burn', 'biaya', 'pengeluaran', 'boros', 'hemat', 'cost', 'money', 'gaji', 'bangkrut', 'bankrupt', 'napas', 'pemasukan', 'income', 'revenue', 'pendapatan', 'profit', 'untung', 'rugi'] },
    loan:      { w: 1.7, kw: ['pinjaman', 'loan', 'utang', 'hutang', 'cicilan', 'kredit', 'bank', 'bunga', 'interest', 'debt', 'installment', 'lunasi', 'melunasi', 'tunggakan'] },
    forecast:  { w: 1.5, kw: ['prediksi', 'forecast', 'proyeksi', 'depan', 'nanti', 'habis', 'kapan', 'when', 'predict', 'ramalan', 'bertahan', 'survive', 'lama'] },
    trend:     { w: 1.6, kw: ['tren', 'trend', 'naik', 'turun', 'menurun', 'meningkat', 'perkembangan', 'progress', 'grafik', 'laju', 'melambat', 'anjlok', 'slump', 'growth', 'pertumbuhan', 'declining'] },
    research:  { w: 1.4, kw: ['riset', 'research', 'teknologi', 'tech', 'slot', 'inovasi', 'unlock', 'node'] },
    team:      { w: 1.4, kw: ['tim', 'team', 'staf', 'staff', 'rekrut', 'hire', 'hiring', 'engineer', 'desainer', 'designer', 'marketer', 'karyawan', 'pegawai', 'employee', 'sdm', 'recruit', 'pecat', 'fire'] },
    product:   { w: 1.3, kw: ['produk', 'product', 'ponsel', 'phone', 'hp', 'smartphone', 'penjualan', 'sales', 'jual', 'laku', 'rilis', 'release', 'desain', 'design', 'rancang', 'terjual', 'sold', 'katalog'] },
    price:     { w: 1.7, kw: ['harga', 'price', 'pricing', 'margin', 'markup', 'diskon', 'discount', 'mahal', 'murah', 'expensive', 'cheap', 'tarif'] },
    stock:     { w: 1.5, kw: ['stok', 'stock', 'produksi', 'restock', 'persediaan', 'inventory', 'habis', 'produce', 'gudang'] },
    marketing: { w: 1.5, kw: ['iklan', 'kampanye', 'marketing', 'campaign', 'promosi', 'promo', 'ads', 'advertising', 'pemasaran'] },
    os:        { w: 1.5, kw: ['os', 'sistem', 'operasi', 'bug', 'software', 'update', 'versi', 'version', 'appstore'] },
    chip:      { w: 1.5, kw: ['chip', 'fab', 'pabrik', 'prosesor', 'processor', 'soc', 'semikonduktor', 'foundry', 'wafer'] },
    morale:    { w: 1.5, kw: ['moral', 'semangat', 'mood', 'bahagia', 'happy', 'morale', 'resign', 'keluar', 'quit', 'burnout'] },
    reputation:{ w: 1.4, kw: ['reputasi', 'reputation', 'ulasan', 'review', 'rating', 'brand', 'citra'] },
    competitor:{ w: 1.7, kw: ['pesaing', 'saingan', 'kompetitor', 'competitor', 'rival', 'lawan', 'pangsa', 'share', 'pasar', 'market', 'apple', 'samsung', 'nokia'] },
    whatif:    { w: 1.0, kw: ['simulasi', 'simulate', 'seandainya', 'misalnya', 'andai', 'bagaimana', 'jika', 'kalau', 'if'] },
    silicon:   { w: 1.6, kw: ['silicon', 'sil', 'topup', 'top', 'up', 'premium', 'percepat', 'speed', 'boost', 'gem'] },
    glossary:  { w: 1.2, kw: ['itu', 'artinya', 'maksud', 'definisi', 'arti', 'what', 'means', 'meaning', 'define', 'istilah'] },
    why:       { w: 1.0, kw: ['kenapa', 'mengapa', 'why', 'alasan', 'sebab', 'reason', 'bagaimana'] },
    bug:       { w: 1.2, kw: ['error', 'eror', 'rusak', 'macet', 'hang', 'crash', 'glitch', 'freeze', 'broken', 'diagnosa', 'diagnostic', 'lag'] },
    quant:     { w: 1.8, kw: ['audit', 'analisis', 'analysis', 'stress', 'skenario', 'scenario', 'dscr', 'breakeven', 'impas', 'risiko', 'risk', 'evaluasi', 'evaluate'] },
    more:      { w: 0.5, kw: ['lanjut', 'detail', 'lagi', 'terus', 'jelasin', 'jelaskan', 'lengkap', 'more', 'continue', 'elaborate', 'next', 'oke', 'ok', 'ya', 'yes', 'iya', 'boleh'] }
};

// Nama intent untuk pertanyaan klarifikasi.
var INTENT_LABEL = {
    status: ['kondisi bisnis', 'business status'], health: ['skor kesehatan', 'health score'],
    next: ['prioritas sekarang', 'priorities'], plan: ['rencana', 'plan'], cash: ['uang & arus kas', 'cash & cash flow'],
    loan: ['pinjaman', 'loans'], forecast: ['prediksi uang', 'cash forecast'], trend: ['tren', 'trends'],
    research: ['riset', 'research'], team: ['tim', 'team'], product: ['produk', 'products'],
    price: ['harga & margin', 'price & margin'], stock: ['stok', 'stock'], marketing: ['kampanye', 'campaigns'],
    os: ['OS', 'OS'], chip: ['chip & fab', 'chips & fab'], morale: ['moral tim', 'team morale'],
    reputation: ['reputasi', 'reputation'], competitor: ['pesaing & pasar', 'rivals & market'],
    whatif: ['simulasi', 'simulation']
};

INTENT_LABEL.briefing = ['perubahan terbaru', 'recent changes'];
INTENT_LABEL.bug = ['masalah aplikasi', 'app problem'];
INTENT_LABEL.patch = ['patch & pembaruan', 'patches & updates'];
INTENT_LABEL.quant = ['audit bisnis', 'business audit'];

// Penjelasan awam untuk kode anomali dari DiagnosticReport.
var ALERT_TEXT = {
    CASH_NAN: ['Nilai uang rusak (bukan angka). Data save kemungkinan korup.', 'Cash value is broken (not a number). Save data may be corrupted.'],
    CASH_NON_INTEGER: ['Uang berisi pecahan desimal; biasanya tidak berbahaya.', 'Cash has a decimal part; usually harmless.'],
    CASH_NEGATIVE: ['Uang negatif tetapi game belum berakhir.', 'Cash is negative but the game has not ended.'],
    TIME_INVALID: ['Waktu game tidak valid; game bisa macet.', 'Game time is invalid; the game may stall.'],
    PRODUCT_BAD_STOCK: ['Ada produk dengan stok tidak valid.', 'A product has an invalid stock value.'],
    PRODUCT_NO_ID: ['Ada produk tanpa ID.', 'A product has no ID.'],
    STAFF_NO_ID: ['Ada staf tanpa ID.', 'A staff member has no ID.'],
    STAFF_BAD_ROLE: ['Ada staf dengan peran tidak valid.', 'A staff member has an invalid role.'],
    RESEARCH_DUPLICATE: ['Ada riset yang tercatat ganda.', 'A research item is recorded twice.'],
    FINANCE_HISTORY_OVERFLOW: ['Riwayat keuangan terlalu panjang.', 'Finance history is too long.'],
    PORTFOLIO_MISMATCH: ['Nilai portofolio saham tidak cocok.', 'Stock portfolio value does not match.'],
    MARKET_COMPETITORS_NOT_ARRAY: ['Data pesaing rusak.', 'Competitor data is broken.']
};

var NAV_STRONG = ['buka', 'open', 'pergi', 'tampilkan', 'show', 'lihat', 'menuju', 'bawa', 'antar', 'navigate', 'arahkan', 'masuk'];
var NAV_WEAK = ['ke', 'to', 'go'];
var NAV_VERBS = NAV_STRONG.concat(NAV_WEAK);
var NAV_TARGETS = [
    { id: 'os',       label: ['Riset OS', 'OS Research'],      nav: 'research', subtab: 'os',     kw: ['os', 'sistem', 'operasi'] },
    { id: 'chip',     label: ['Riset Chip', 'Chip Research'],  nav: 'research', subtab: 'chip',   kw: ['chip', 'fab', 'pabrik'] },
    { id: 'research', label: ['Riset', 'Research'],            nav: 'research', subtab: 'tech',   kw: ['riset', 'research', 'teknologi', 'tech'] },
    { id: 'team',     label: ['Tim', 'Team'],                  nav: 'team',     subtab: null,     kw: ['tim', 'team', 'staf', 'staff', 'rekrut', 'hire', 'markas', 'hq'] },
    { id: 'design',   label: ['Rancang Ponsel', 'Design Phone'], nav: 'products', subtab: 'design', kw: ['desain', 'design', 'rancang', 'wizard'] },
    { id: 'sales',    label: ['Penjualan', 'Sales'],           nav: 'products', subtab: 'sales',  kw: ['penjualan', 'sales', 'stok', 'stock', 'jual', 'kampanye', 'campaign'] },
    { id: 'products', label: ['Produk', 'Products'],           nav: 'products', subtab: null,     kw: ['produk', 'product', 'ponsel', 'phone', 'hp'] },
    { id: 'market',   label: ['Pasar', 'Market'],              nav: 'market',   subtab: null,     kw: ['pasar', 'market', 'saham', 'kompetitor', 'saingan', 'pesaing'] },
    { id: 'settings', label: ['Setelan', 'Settings'],          nav: 'settings', subtab: null,     kw: ['setelan', 'setting', 'settings', 'pengaturan', 'pinjaman', 'loan', 'opsi', 'bank'] },
    { id: 'home',     label: ['Beranda', 'Home'],              nav: 'home',     subtab: null,     kw: ['beranda', 'home', 'utama', 'dashboard'] }
];

var GLOSSARY = {
    runway: ['Runway = berapa bulan uangmu bertahan dengan biaya bulanan sekarang (uang ÷ biaya bulanan). Di bawah 3 bulan itu zona bahaya.',
             'Runway = how many months your cash lasts at the current monthly cost (cash ÷ monthly cost). Under 3 months is the danger zone.'],
    burn:   ['Burn (biaya bulanan) = sewa HQ + utilitas + administrasi + gaji seluruh staf. Menambah staf langsung menaikkan burn.',
             'Burn (monthly cost) = HQ rent + utilities + admin + all staff salaries. Hiring raises burn immediately.'],
    margin: ['Margin = (harga − biaya per unit) ÷ harga. Di bawah ~12% terlalu tipis; 25–45% biasanya sehat.',
             'Margin = (price − unit cost) ÷ price. Under ~12% is too thin; 25–45% is usually healthy.'],
    cicilan:['Cicilan = pembayaran bulanan pinjaman (pokok + bunga). Total cicilan sebaiknya di bawah ~40% pemasukan.',
             'Installment = the monthly loan payment (principal + interest). Keep total installments under ~40% of revenue.'],
    arus:   ['Arus kas bersih = pemasukan − biaya bulanan − cicilan. Negatif berarti uangmu menyusut tiap bulan.',
             'Net cash flow = revenue − monthly cost − installments. Negative means your cash shrinks every month.'],
    moral:  ['Moral staf (0-100) dipengaruhi kondisi kerja. Di bawah 50 kinerja turun dan staf bisa keluar.',
             'Staff morale (0-100) reflects working conditions. Below 50 performance drops and staff may quit.'],
    morale: ['Moral staf (0-100) dipengaruhi kondisi kerja. Di bawah 50 kinerja turun dan staf bisa keluar.',
             'Staff morale (0-100) reflects working conditions. Below 50 performance drops and staff may quit.'],
    fab:    ['Fab = pabrik chip milikmu. Butuh riset Fab Construction. Dengan fab sendiri biaya chip turun, tapi investasi awalnya besar.',
             'A fab is your own chip factory. Needs Fab Construction research. It lowers chip costs but is a big upfront investment.'],
    sil:    ['Silicon (SIL) = mata uang premium untuk percepatan waktu dan membuka/menyelesaikan riset lebih cepat. Bisa di-top up lewat tombol di header.',
             'Silicon (SIL) is the premium currency for speeding up time and unlocking/finishing research faster. Top up via the header button.'],
    silicon:['Silicon (SIL) = mata uang premium untuk percepatan waktu dan membuka/menyelesaikan riset lebih cepat. Bisa di-top up lewat tombol di header.',
             'Silicon (SIL) is the premium currency for speeding up time and unlocking/finishing research faster. Top up via the header button.'],
    reputasi:['Reputasi (0-100) naik lewat produk berkualitas dan ulasan bagus. Reputasi tinggi memudahkan penjualan.',
              'Reputation (0-100) grows with quality products and good reviews. High reputation makes selling easier.'],
    reputation:['Reputasi (0-100) naik lewat produk berkualitas dan ulasan bagus. Reputasi tinggi memudahkan penjualan.',
              'Reputation (0-100) grows with quality products and good reviews. High reputation makes selling easier.'],
    kampanye:['Kampanye iklan mendorong penjualan produk, paling efektif saat produk masih baru (fase naik & puncak). Butuh marketer.',
              'Ad campaigns push sales, most effective while a product is new (rise & peak phases). Needs a marketer.'],
    campaign:['Kampanye iklan mendorong penjualan produk, paling efektif saat produk masih baru (fase naik & puncak). Butuh marketer.',
              'Ad campaigns push sales, most effective while a product is new (rise & peak phases). Needs a marketer.'],
    stok:   ['Stok = unit siap jual. Kalau habis penjualan berhenti. Aktifkan auto-restock agar produksi ulang otomatis.',
             'Stock = units ready to sell. At zero, sales stop. Enable auto-restock to re-produce automatically.'],
    stock:  ['Stok = unit siap jual. Kalau habis penjualan berhenti. Aktifkan auto-restock agar produksi ulang otomatis.',
             'Stock = units ready to sell. At zero, sales stop. Enable auto-restock to re-produce automatically.']
};

var HEALTH_ACTION = {
    liquidity: { nav: 'products', subtab: 'sales', id: 'sales' },
    growth:    { nav: 'products', subtab: 'sales', id: 'sales' },
    product:   { nav: 'products', subtab: 'design', id: 'design' },
    team:      { nav: 'team', subtab: null, id: 'team' },
    tech:      { nav: 'research', subtab: 'tech', id: 'research' },
    brand:     { nav: 'market', subtab: null, id: 'market' }
};

export class AdvisorBrain {
    constructor(sys) {
        this.sys = sys;
        this.resetMemory();
    }

    resetMemory() { this.mem = { last: null, lastProduct: null, depth: 0, turns: 0, asked: {}, pending: null, list: [], refIdx: 0 }; }

    lang() { return this.sys._lang(); }
    L(id, en) { return this.lang() === 'id' ? id : en; }

    health() {
        var h = this.sys.getHealth();
        return { score: h.score, label: h.label, parts: h.parts, weakest: h.weakest };
    }

    _detect(text) {
        var toks = tokens(text);
        var scores = {};
        Object.keys(INTENTS).forEach(function (k) {
            var def = INTENTS[k], s = 0;
            toks.forEach(function (tk) {
                var best = 0;
                def.kw.forEach(function (kw) {
                    var m = matchWord(tk, kw);
                    if (m > best) best = m;
                });
                s += best * def.w;
            });
            scores[k] = s;
        });
        var n = norm(text);
        if (/apa (itu|arti|maksud)|what is|what does|apa yang dimaksud/.test(n)) scores.glossary += 3;
        if (/(apa|what).*(harus|should|lakukan|do)|(prioritas|priority)/.test(n)) scores.next += 3;
        if (/(bisa|can) .*(bertahan|survive)|kapan.*(habis|bangkrut)|berapa lama/.test(n)) scores.forecast += 3;
        if (/kondisi|keadaan|ringkasan|how am i|how is (my )?(business|company)|gimana (bisnis|perusahaan)|status|briefing/.test(n)) scores.status += 2.5;
        if (/skor|score|nilai (bisnis|perusahaan)|kesehatan|health|terlemah|weakest|kelemahan/.test(n)) scores.health += 3;
        if (/rekrut|hire|cari (staf|karyawan)/.test(n)) scores.team += 2;
        if (/(naik|tingkat|tambah)\w* (penjualan|sales)|jual lebih|(more|increase|boost|raise|improve) (my )?sales|sell more/.test(n)) scores.marketing += 4;
        if (/(pinjam|pinjaman|loan|utang|hutang|cicilan)/.test(n)) scores.loan += 2;
        if (/(harga|price|margin)/.test(n)) scores.price += 2;
        if (/(tren|trend|menurun|melambat|anjlok|naik turun)/.test(n)) scores.trend += 2;
        if (/(pesaing|saingan|kompetitor|competitor|rival|pangsa|market share)/.test(n)) scores.competitor += 2;
        if (/(kalau|jika|bagaimana jika|gimana kalau|what if|if i|seandainya|misal)/.test(n) &&
            /(rekrut|hire|tambah|pinjam|loan|utang|kredit|\d+ (engineer|desainer|designer|marketer))/.test(n)) {
            scores.whatif += 6; scores.team -= 2; scores.loan -= 2;
        }
        if (/(uang|kas|cash|duit).*habis|habis.*(uang|kas|cash|duit)|running out of (cash|money)/.test(n)) { scores.forecast += 3; scores.stock -= 3; }
        if (/stok.*habis|habis.*stok|out of stock/.test(n)) { scores.stock += 3; scores.forecast -= 3; }
        if (/(harga).*(naik|turun)|(naik|turun).*(harga)/.test(n)) { scores.price += 2; scores.trend -= 1.5; }

        var top = null, topS = 0, second = 0, secondK = null;
        Object.keys(scores).forEach(function (k) {
            if (k === 'more') return;
            if (scores[k] > topS) { second = topS; secondK = top; topS = scores[k]; top = k; }
            else if (scores[k] > second) { second = scores[k]; secondK = k; }
        });
        var moreScore = scores.more;
        var isFollow = toks.length <= 3 && moreScore >= 1 && topS < 2.5 && this.mem.last;
        var conf = top ? Math.min(1, (topS - second * 0.5) / 3) : 0;
        return { intent: top, score: topS, second: second, secondIntent: secondK, confidence: conf, follow: isFollow, toks: toks };
    }

    _detectNav(text) {
        var toks = tokens(text);
        var hasVerb = toks.length <= 8 && toks.some(function (tk) { return NAV_STRONG.indexOf(tk) >= 0; }) ||
            toks.length <= 4 && toks.some(function (tk) { return NAV_WEAK.indexOf(tk) >= 0; });
        if (!hasVerb) return null;
        var best = null, bestS = 0;
        NAV_TARGETS.forEach(function (tg) {
            var s = 0;
            toks.forEach(function (tk) {
                if (NAV_VERBS.indexOf(tk) >= 0) return;
                tg.kw.forEach(function (kw) { var m = matchWord(tk, kw); if (m > s) s = m; });
            });
            if (s > bestS) { bestS = s; best = tg; }
        });
        return bestS >= 1.1 ? best : null;
    }

    _findProduct(text) {
        var c = this.sys._ctx();
        var toks = tokens(text);
        var best = null, bestS = 0;
        c.catalog.forEach(function (p) {
            var pt = tokens(p.name || '');
            var s = 0;
            pt.forEach(function (w) {
                if (w.length < 2) return;
                toks.forEach(function (tk) {
                    var m = (w.length < 4) ? (tk === w ? 2 : 0) : matchWord(tk, w);
                    if (m > s) s = m;
                });
            });
            if (s > bestS) { bestS = s; best = p; }
        });
        return bestS >= 1.5 ? best : null;
    }

    // Perintah membersihkan chat lewat kalimat ("bersihkan chat", "clear", "hapus riwayat", "chat baru", ...).
    // Sengaja ketat: kata kerja tanpa objek chat hanya dihitung bila pesannya sangat pendek,
    // supaya "reset game" / "hapus staf" tidak ikut menghapus percakapan.
    _isClearCommand(text) {
        var n = norm(text);
        if (!n) return false;
        if (/^(tolong |please )?(mulai (baru|ulang|dari awal)|chat baru|obrolan baru|percakapan baru|new chat|new conversation|start over|fresh start|ulang dari awal)( dong| ya| aja| saja| please)*$/.test(n)) return true;
        var toks = n.split(' ');
        if (toks.length > 7) return false;
        var VERB = ['bersihkan', 'bersihin', 'membersihkan', 'hapus', 'hapuskan', 'hapusin', 'menghapus', 'kosongkan', 'kosongin', 'reset', 'clear', 'clean', 'wipe', 'delete', 'erase', 'lupakan', 'lupain', 'forget', 'cls'];
        var BARE = ['bersihkan', 'bersihin', 'membersihkan', 'kosongkan', 'kosongin', 'reset', 'clear', 'clean', 'wipe', 'cls'];
        var NOUN = ['chat', 'chats', 'percakapan', 'obrolan', 'riwayat', 'history', 'pesan', 'message', 'messages', 'log', 'conversation', 'layar', 'screen', 'ingatan', 'memori', 'memory'];
        var FILL = ['tolong', 'please', 'bisa', 'can', 'could', 'you', 'dong', 'ya', 'aja', 'saja', 'deh', 'sekarang', 'now', 'ini', 'itu', 'nya', 'the', 'this', 'my', 'isi', 'yang', 'kamu', 'kita', 'saya', 'dan', 'and', 'lama', 'old', 'sebelumnya', 'previous'];
        var ALL = ['semua', 'all', 'everything', 'seluruh'];
        var rest = [], sawAll = false;
        toks.forEach(function (t) {
            if (ALL.indexOf(t) >= 0) sawAll = true;
            else if (FILL.indexOf(t) < 0) rest.push(t);
        });
        var verbs = rest.filter(function (t) { return VERB.indexOf(t) >= 0; });
        var nouns = rest.filter(function (t) { return NOUN.indexOf(t) >= 0; });
        if (verbs.length !== 1 || rest.length > 2) return false;
        if (rest.length === 1) return BARE.indexOf(verbs[0]) >= 0 || sawAll;
        return nouns.length === 1;
    }

    _clearChatReply() {
        this.resetMemory();
        return {
            text: this.L('Chat dibersihkan. Kita mulai dari awal.', 'Chat cleared. Fresh start.'),
            actions: [], chips: this.chips(), intent: 'clear', confidence: 1, clearChat: true
        };
    }

    reply(text) {
        var m = this.mem;
        m.turns++;

        if (this._isClearCommand(text)) return this._clearChatReply();

        if (m.pending) {
            var pend = m.pending; m.pending = null;
            var nq = norm(text);
            for (var i = 0; i < pend.length; i++) {
                var lab = INTENT_LABEL[pend[i]];
                if (lab && (nq.indexOf(norm(lab[0])) >= 0 || nq.indexOf(norm(lab[1])) >= 0)) {
                    return this._run(pend[i], { detail: false, text: text, product: null, toks: tokens(text) }, 0.8);
                }
            }
        }

        var ref = this._detectRef(text);
        if (ref) { m.last = 'ref'; return this._runRef(ref); }

        var nqb = norm(text);
        if (/ada apa (baru|aja)|apa (yang )?(baru|berubah)|perubahan|what s new|what is new|what changed|any news|sejak (terakhir|tadi)|since (last|i left)/.test(nqb)) {
            return this._run('briefing', { detail: false, text: text, product: null, toks: tokens(text) }, 0.9);
        }

        if (!/\bos\b|sistem operasi|operating system/.test(nqb) &&
            (/\b(patch|hotfix|changelog|release notes?)\b|catatan (rilis|patch|perubahan)|bug ?fix(es)?|perbaikan bug|bug (sudah )?(diperbaiki|difix|fixed)|(update|pembaruan|versi) (game|aplikasi|app|baru|terbaru)|(game|app|aplikasi) (update|versi)|new version|latest version|(ada|any|cek|check|is there|apakah).*(update|pembaruan)/.test(nqb))) {
            return this._run('patch', { detail: false, text: text, product: null, toks: tokens(text) }, 0.9);
        }

        if (/(aplikasi|app|game|permainan).*(bug|error|eror|rusak|macet|hang|crash|lag|freeze)|(bug|error|eror|rusak|macet|hang|crash|freeze).*(aplikasi|app|game|permainan)|lapor(kan)? (bug|error|masalah)|bug report|ada (error|eror)|force close|layar (putih|hitam)|(tidak|ga|gak|nggak) (bisa|jalan|respon|muncul)|something (broke|is broken|went wrong)|not working|does not work|doesn t work|keluar sendiri/.test(nqb)) {
            return this._run('bug', { detail: false, text: text, product: null, toks: tokens(text) }, 0.9);
        }

        var act = parseAction(text);
        if (act) { m.last = 'action'; return this._doAction(act, text); }

        var nav = this._detectNav(text);
        if (nav) {
            m.last = 'navigate';
            return this._navigate(nav);
        }
        var nq0 = norm(text);
        if (/apa (itu|arti|maksud)|what is|what does|apa yang dimaksud|arti dari|definisi/.test(nq0)) {
            var tk0 = tokens(text);
            for (var gi = 0; gi < tk0.length; gi++) {
                for (var gk in GLOSSARY) {
                    if (matchWord(tk0[gi], gk) >= 1.5) {
                        m.last = 'glossary';
                        return { text: GLOSSARY[gk][this.lang() === 'id' ? 0 : 1], actions: [], chips: this.chips(), intent: 'glossary', confidence: 1 };
                    }
                }
            }
        }
        if (/(kalau|jika|bagaimana jika|gimana kalau|what if|if i|seandainya|misal)/.test(nq0) && this._parseWhatIf(text)) {
            return this._run('whatif', { detail: false, text: text, product: null, toks: tokens(text) }, 0.95);
        }

        var d = this._detect(text);
        var prod = this._findProduct(text);
        if (prod) m.lastProduct = prod.id;

        var intent = d.intent;
        var detail = false;
        if (d.follow) { intent = this['_h_' + m.last] ? m.last : 'next'; detail = true; m.depth++; }
        else if (prod && (!intent || ['stock', 'marketing', 'price'].indexOf(intent) < 0 || d.score < 2.5)) { intent = 'product'; }
        else m.depth = 0;

        var minScore = prod ? 1 : 1.5;
        if (!intent || (!d.follow && d.score < minScore)) {
            return this._fallback(text);
        }

        if (!d.follow && !prod && d.secondIntent && INTENT_LABEL[d.intent] && INTENT_LABEL[d.secondIntent] &&
            d.second >= d.score * 0.8 && d.score < 4 && d.toks.length >= 3) {
            if (/(\bdan\b|\band\b|\bsama\b|\bserta\b|\bsekaligus\b|&|,| plus )/.test(String(text).toLowerCase()) &&
                ['whatif', 'plan', 'status'].indexOf(d.intent) < 0 && ['whatif', 'plan', 'status'].indexOf(d.secondIntent) < 0) {
                return this._combo(d.intent, d.secondIntent, text, d.toks);
            }
            return this._clarify(d.intent, d.secondIntent);
        }
        return this._run(intent, { detail: detail, text: text, product: prod, toks: d.toks }, d.confidence);
    }

    _run(intent, o, conf) {
        var m = this.mem;
        m.asked[intent] = (m.asked[intent] || 0) + 1;
        var detail = o.detail || m.depth > 0 || m.asked[intent] > 1;
        o.detail = detail;
        var res = this._handle(intent, o);
        res.intent = intent;
        res.confidence = conf;
        m.last = intent;
        return res;
    }

    _combo(a, b, text, toks) {
        var self = this, m = this.mem;
        var parts = [a, b].map(function (k) {
            m.asked[k] = (m.asked[k] || 0) + 1;
            return self._handle(k, { detail: false, text: text, product: null, toks: toks });
        });
        var acts = [], seen = {};
        parts.forEach(function (r) {
            (r.actions || []).forEach(function (x) {
                var key = x.nav + '|' + (x.subtab || '');
                if (!seen[key] && acts.length < 2) { seen[key] = 1; acts.push(x); }
            });
        });
        m.last = b;
        return { text: parts[0].text + '\n\n' + parts[1].text, actions: acts, chips: this._followChips(b), intent: 'combo', confidence: 0.8 };
    }

    _setList(list) {
        this.mem.list = (list || []).filter(function (a) { return a && a.id && a.id !== 'all_good'; }).slice(0, 5);
    }

    _detectRef(text) {
        var list = this.mem.list;
        if (!list || !list.length) return null;
        var n = norm(text), toks = tokens(text);
        if (toks.length > 8) return null;
        var idx = -1;
        var words = { pertama: 0, satu: 0, first: 0, kedua: 1, dua: 1, second: 1, ketiga: 2, tiga: 2, third: 2, keempat: 3, empat: 3, fourth: 3 };
        for (var i = 0; i < toks.length; i++) {
            if (Object.prototype.hasOwnProperty.call(words, toks[i])) { idx = words[toks[i]]; break; }
            if (/^\d$/.test(toks[i]) && (toks[i - 1] === 'no' || toks[i - 1] === 'nomor' || toks[i - 1] === 'number' || toks[i - 1] === 'yang' || toks.length <= 2)) {
                idx = parseInt(toks[i], 10) - 1; break;
            }
        }
        var snooze = /(tunda|snooze|abaikan|ignore|nanti dulu|skip)/.test(n);
        var itRef = /(buka|open|antar|jelas|explain|detail|tunda|snooze|abaikan|ignore).*\b(itu|ini|that|this|it)\b|\b(itu|that|it)\b.*(buka|open)/.test(n) && idx < 0;
        if (idx < 0 && !itRef) return null;
        if (idx < 0) idx = Math.min(this.mem.refIdx || 0, list.length - 1);
        if (idx >= list.length) return null;
        var hasCue = snooze || /\b(yang|no|nomor|number|buka|open|jelas|explain|detail|itu|ini|that|this|it)\b/.test(n) || toks.length <= 2;
        return hasCue ? { item: list[idx], idx: idx, snooze: snooze } : null;
    }

    _runRef(r) {
        var L = this.L.bind(this), a = r.item;
        this.mem.refIdx = r.idx;
        if (r.snooze) {
            this.sys.snooze(a.id);
            return { text: L('Oke, saran **' + a.title + '** kutunda 30 hari. Kalau kondisinya memburuk, aku akan kabari lagi.',
                             'Okay, I snoozed **' + a.title + '** for 30 days. If it gets worse I\'ll flag it again.'),
                     actions: [], chips: this.chips(), intent: 'ref', confidence: 1 };
        }
        var acts = a.action ? [this._actionFor(a)] : [];
        return { text: L('Saran #' + (r.idx + 1) + ': **' + a.title + '**\n' + a.detail, 'Suggestion #' + (r.idx + 1) + ': **' + a.title + '**\n' + a.detail),
                 actions: acts, chips: [L('Tunda saran ini', 'Snooze this'), L('Apa prioritas sekarang?', 'What should I do now?')],
                 intent: 'ref', confidence: 1 };
    }

    // Menanggapi tindakan pemain (sudah / akan merekrut, pinjam, ubah harga, dst.).
    _doAction(act, text) {
        var L = this.L.bind(this), isId = this.lang() === 'id', self = this;
        var c = this.sys._ctx();
        var product = (act.type === 'price' || act.type === 'restock' || act.type === 'campaign')
            ? this._findProduct(text) : null;
        var r = actionAdvice(c, act, {
            isId: isId, product: product,
            salaryOf: function (role) { return self.sys.salaryOf(role); }
        });
        if (r.need === 'product') {
            var names = c.catalog.slice(0, 4).map(function (p) { return p.name; });
            return { text: L('Produk yang mana? Sebutkan namanya.', 'Which product? Name it, please.'),
                     chips: names.length ? names : [L('Rancang ponsel dulu', 'Design a phone first')], actions: [] };
        }
        if (r.need === 'value') {
            var q = act.type === 'restock'
                ? L('Berapa unit yang mau diproduksi? Contoh: "produksi 100 unit".', 'How many units? For example: "produce 100 units".')
                : L('Harga barunya berapa? Contoh: "naikkan harga ke 800" atau "turunkan 10%".', 'What is the new price? For example: "raise price to 800" or "lower 10%".');
            return { text: q, chips: [L('Cek harga & margin', 'Check price & margin'), L('Kondisi bisnis', 'Business status')], actions: [] };
        }
        this.mem.lastAction = act.type;
        return { text: r.text, chips: [L('Kondisi bisnis', 'Business status'), L('Prediksi uang', 'Cash forecast'), L('Audit bisnis', 'Business audit')], actions: [] };
    }

    _h_quant() {
        var isId = this.lang() === 'id';
        var rep = buildReport(this.sys._ctx(), isId);
        return { text: formatReport(rep, isId), intent: 'quant', confidence: 1 };
    }

    _h_patch() {
        var L = this.L.bind(this), p = this.sys.getPatchStatus();
        var lines = [], acts = [];
        if (!p.checked) {
            lines.push(L('Aku belum bisa memeriksa patch sekarang (mungkin kamu sedang offline). Kamu memakai **v' + p.cur + '**. Coba tanya lagi sebentar lagi.',
                         'I can\'t check for patches right now (you may be offline). You are on **v' + p.cur + '**. Ask again in a moment.'));
        } else if (p.kind === 'update') {
            lines.push(L('Ada **pembaruan v' + p.ver + '** (kamu di v' + p.cur + ').', 'There is an **update v' + p.ver + '** (you are on v' + p.cur + ').'));
            if (p.sum) lines.push(p.sum);
            lines.push(L('Simpan lalu muat ulang agar versi terbaru terpakai.', 'Save, then reload to get the latest version.'));
            acts.push({ label: L('Simpan & muat ulang', 'Save & reload'), patch: 'reload' });
        } else if (p.kind) {
            lines.push(p.kind === 'fix'
                ? L('Versi **v' + p.ver + '** membawa perbaikan bug:', '**v' + p.ver + '** brought bug fixes:')
                : L('Versi **v' + p.ver + '** membawa perubahan baru:', '**v' + p.ver + '** brought new changes:'));
            if (p.sum) lines.push(p.sum);
            acts.push({ label: L('Tandai dibaca', 'Mark as read'), patch: 'ack', ver: p.ver });
        } else {
            lines.push(L('Kamu sudah memakai versi terbaru (**v' + p.cur + '**).', 'You are on the latest version (**v' + p.cur + '**).'));
            if (p.lastSum) lines.push(L('Catatan terakhir (v' + p.lastVer + '): ', 'Latest notes (v' + p.lastVer + '): ') + p.lastSum);
        }
        return { text: lines.join('\n'), actions: acts,
                 chips: [L('Kondisi bisnis', 'Business status'), L('Apa prioritas sekarang?', 'What should I do now?')] };
    }

    _h_bug() {
        var L = this.L.bind(this), d = this.sys.getDiagnostics(), lang = this.lang() === 'id' ? 0 : 1;
        var lines = [];
        if (!d.alerts.length && !d.errors.length) {
            lines.push(L('Aku sudah memeriksa data game: **tidak ada anomali** dan tidak ada error baru.', 'I checked the game data: **no anomalies** and no new errors.'));
            lines.push(L('Kalau masalahnya spesifik (mis. tombol tidak merespons), salin laporan lalu kirim ke pengembang bersama deskripsi singkat: apa yang kamu tekan dan apa yang terjadi.',
                         'If the problem is specific (e.g. a button does nothing), copy the report and send it to the developer with a short note: what you tapped and what happened.'));
        } else {
            lines.push(L('Hasil pemeriksaan: **' + d.alerts.length + ' anomali data**, **' + d.errors.length + ' error** baru.', 'Check result: **' + d.alerts.length + ' data anomalies**, **' + d.errors.length + ' new error(s)**.'));
            d.alerts.slice(0, 4).forEach(function (a) {
                lines.push('• ' + (ALERT_TEXT[a.code] ? ALERT_TEXT[a.code][lang] : a.msg));
            });
            if (d.errors.length) lines.push(L('• Error terakhir: ', '• Latest error: ') + d.errors[d.errors.length - 1].msg);
            lines.push(L('\nSimpan permainanmu dulu, lalu salin laporan dan kirim ke pengembang agar bisa diperbaiki.', '\nSave your game first, then copy the report and send it to the developer so it can be fixed.'));
        }
        return { text: lines.join('\n'), actions: [{ label: L('Salin laporan bug', 'Copy bug report'), report: 'copy' }, { label: L('Lihat detail', 'View details'), report: 'open' }], chips: [L('Kondisi bisnis', 'Business status'), L('Apa prioritas sekarang?', 'What should I do now?')] };
    }

    _h_briefing() {
        var L = this.L.bind(this), b = this.sys.getBriefing();
        if (!b) {
            return { text: L('Belum ada perubahan berarti sejak terakhir kamu cek. Aman, lanjutkan strategimu.', 'Nothing significant has changed since you last checked. All steady, carry on.'),
                     chips: [L('Apa prioritas sekarang?', 'What should I do now?'), L('Skor kesehatan', 'Health score')] };
        }
        var sgn = function (v) { return (v >= 0 ? '+' : '−') + '$' + money(Math.abs(v)); };
        var lines = [L('Sejak ' + b.days + ' hari lalu:', 'Over the last ' + b.days + ' day(s):')];
        lines.push(L('• Uang ' + sgn(b.cashDelta), '• Cash ' + sgn(b.cashDelta)));
        if (b.soldDelta > 0) lines.push(L('• Terjual ' + money(b.soldDelta) + ' unit', '• ' + money(b.soldDelta) + ' units sold'));
        if (b.healthDelta !== null && b.healthDelta !== 0) lines.push(L('• Skor kesehatan ' + (b.healthDelta > 0 ? 'naik ' : 'turun ') + Math.abs(b.healthDelta) + ' poin', '• Health score ' + (b.healthDelta > 0 ? 'up ' : 'down ') + Math.abs(b.healthDelta) + ' pts'));
        if (b.resolved) lines.push(L('• ' + b.resolved + ' masalah sudah beres', '• ' + b.resolved + ' issue(s) resolved'));
        if (b.fresh.length) {
            lines.push(L('\nMasalah baru:', '\nNew issues:'));
            b.fresh.forEach(function (a) { lines.push('• ' + a.title); });
        }
        var adv = this.sys.getAdvice().filter(function (a) { return b.fresh.some(function (f) { return f.id === a.id; }); });
        this._setList(adv);
        return { text: lines.join('\n'), actions: adv.filter(function (a) { return a.action; }).slice(0, 2).map(this._actionFor, this) };
    }

    _clarify(a, b) {
        var la = INTENT_LABEL[a], lb = INTENT_LABEL[b];
        this.mem.pending = [a, b];
        var A = this.L(la[0], la[1]), B = this.L(lb[0], lb[1]);
        return {
            text: this.L('Maksudmu **' + A + '** atau **' + B + '**? Pilih salah satu biar jawabanku tepat.',
                         'Do you mean **' + A + '** or **' + B + '**? Pick one so I can answer precisely.'),
            actions: [], chips: [A, B], intent: 'clarify', confidence: 0.4
        };
    }

    greeting() {
        var h = this.health();
        var adv = this.sys.getAdvice();
        var top = adv[0];
        this._setList(adv);
        var txt;
        var weak = h.weakest ? h.weakest.label : '';
        if (top && top.id !== 'all_good') {
            txt = this.L('Halo! Skor kesehatan bisnismu **' + h.score + '/100** (' + h.label + '), area terlemah: **' + weak + '**. Hal terpenting sekarang: **' + top.title + '**. Mau aku jelaskan atau antar langsung?',
                         'Hi! Your business health is **' + h.score + '/100** (' + h.label + '), weakest area: **' + weak + '**. Most important right now: **' + top.title + '**. Want me to explain or take you there?');
        } else {
            txt = this.L('Halo! Skor kesehatan bisnismu **' + h.score + '/100** (' + h.label + '). Semua terkendali, mau bahas strategi ke depan?',
                         'Hi! Your business health is **' + h.score + '/100** (' + h.label + '). Everything is under control; want to talk strategy?');
        }
        return { text: txt, actions: top && top.action ? [this._actionFor(top)] : [], chips: this.chips(), intent: 'greet', confidence: 1 };
    }

    chips() {
        var c = this.sys._ctx();
        var out = [this.L('Apa prioritas sekarang?', 'What should I do now?'),
                   this.L('Skor kesehatan', 'Health score')];
        if (c.burn > 0) out.push(this.L('Prediksi uang', 'Cash forecast'));
        if (c.loans.length) out.push(this.L('Cek pinjaman', 'Check loans'));
        if (c.catalog.length) out.push(this.L('Cek harga & margin', 'Check price & margin'));
        else out.push(this.L('Rencana awal', 'Starter plan'));
        out.push(this.L('Kalau rekrut 1 engineer?', 'What if I hire 1 engineer?'));
        return out.slice(0, 5);
    }

    _actionFor(a) {
        if (a.action && a.action.report) return { label: this.L('Salin laporan bug', 'Copy bug report'), report: 'copy' };
        if (a.action && a.action.patch === 'reload') return { label: this.L('Simpan & muat ulang', 'Save & reload'), patch: 'reload' };
        if (a.action && a.action.patch) return { label: this.L('Tandai dibaca', 'Mark as read'), patch: 'ack', ver: a.action.ver };
        var nav = a.action.nav, sub = a.action.subtab || null;
        var tg = NAV_TARGETS.filter(function (t) { return t.nav === nav && t.subtab === sub; })[0] ||
                 NAV_TARGETS.filter(function (t) { return t.nav === nav; })[0];
        var name = tg ? this.L(tg.label[0], tg.label[1]) : '';
        return { label: this.L('Buka', 'Open') + (name ? ' ' + name : ''), nav: nav, subtab: sub };
    }
    
    _act(id) {
        var tg = NAV_TARGETS.filter(function (t) { return t.id === id; })[0];
        if (!tg) return null;
        return { label: this.L('Buka ' + tg.label[0], 'Open ' + tg.label[1]), nav: tg.nav, subtab: tg.subtab };
    }

    _navigate(tg) {
        var lbl = this.L(tg.label[0], tg.label[1]);
        return {
            text: this.L('Siap, membuka **' + lbl + '**.', 'On it, opening **' + lbl + '**.'),
            actions: [], navigate: { nav: tg.nav, subtab: tg.subtab },
            chips: this.chips(), intent: 'navigate', confidence: 1
        };
    }

    _fallback(text) {
        var adv = this.sys.getAdvice();
        var top = adv[0];
        var base = this.L('Hmm, aku belum yakin maksudmu. Aku paham soal uang, pinjaman, harga, tim, riset, produk, stok, kampanye, pesaing, OS, chip, moral, dan reputasi. Coba tanya seperti "kenapa uangku cepat habis?", "kalau rekrut 2 engineer?" atau "buka riset".',
                          'Hmm, I\'m not sure what you mean. I know about cash, loans, pricing, team, research, products, stock, campaigns, rivals, OS, chips, morale and reputation. Try "why is my cash dropping?", "what if I hire 2 engineers?" or "open research".');
        var acts = [];
        if (top && top.id !== 'all_good') {
            base += this.L('\n\nSementara itu, saran teratas: **' + top.title + '**.', '\n\nMeanwhile, top suggestion: **' + top.title + '**.');
            if (top.action) acts.push(this._actionFor(top));
        }
        return { text: base, actions: acts, chips: this.chips(), intent: 'unknown', confidence: 0 };
    }

    _handle(intent, o) {
        var f = this['_h_' + intent];
        var r = f ? f.call(this, o) : null;
        if (!r) return this._fallback(o.text);
        if (!r.chips) r.chips = this._followChips(intent);
        if (!r.actions) r.actions = [];
        return r;
    }

    _followChips(intent) {
        var L = this.L.bind(this);
        var map = {
            cash: [L('Prediksi uang', 'Cash forecast'), L('Cara hemat', 'How to save'), L('Cek pinjaman', 'Check loans')],
            loan: [L('Kalau pinjam 50 ribu?', 'What if I borrow 50k?'), L('Prediksi uang', 'Cash forecast')],
            forecast: [L('Cara hemat', 'How to save'), L('Tren penjualan', 'Sales trend'), L('Kondisi bisnis', 'Business status')],
            trend: [L('Cek harga & margin', 'Check price & margin'), L('Perlu kampanye?', 'Need a campaign?')],
            status: [L('Apa prioritas sekarang?', 'What should I do now?'), L('Skor kesehatan', 'Health score'), L('Prediksi uang', 'Cash forecast')],
            health: [L('Apa prioritas sekarang?', 'What should I do now?'), L('Rencana awal', 'Starter plan')],
            next: [L('Kenapa?', 'Why?'), L('Skor kesehatan', 'Health score'), L('Kondisi bisnis', 'Business status')],
            product: [L('Cek stok', 'Check stock'), L('Cek harga & margin', 'Check price & margin'), L('Kapan buat produk baru?', 'When to make a new one?')],
            price: [L('Tren penjualan', 'Sales trend'), L('Perlu kampanye?', 'Need a campaign?')],
            stock: [L('Analisis produk', 'Analyze products'), L('Perlu kampanye?', 'Need a campaign?')],
            research: [L('Rekrut engineer?', 'Hire engineers?'), L('Buka riset', 'Open research')],
            team: [L('Cek moral tim', 'Check morale'), L('Kalau rekrut 1 desainer?', 'What if I hire 1 designer?')],
            competitor: [L('Tren penjualan', 'Sales trend'), L('Cek reputasi', 'Check reputation')],
            whatif: [L('Prediksi uang', 'Cash forecast'), L('Kondisi bisnis', 'Business status')]
        };
        return map[intent] || this.chips();
    }

    _h_greet() {
        var n = this.mem.turns;
        return { text: pick([
            this.L('Halo, bos! Ada yang bisa kubantu soal bisnis ponselmu?', 'Hey boss! How can I help with your phone business?'),
            this.L('Hai! Mau cek kondisi perusahaan atau cari prioritas berikutnya?', 'Hi! Want a company check-up or the next priority?'),
            this.L('Siap membantu. Tanya apa saja, atau ketik "buka riset" untuk pindah halaman.', 'Ready to help. Ask anything, or type "open research" to jump.')
        ], n), chips: this.chips() };
    }
    _h_thanks() {
        return { text: pick([
            this.L('Sama-sama! Kabari kalau butuh analisis lagi.', 'You\'re welcome! Ping me if you need more analysis.'),
            this.L('Senang membantu. Semoga produkmu laris!', 'Glad to help. May your phones sell out!')
        ], this.mem.turns), chips: this.chips() };
    }
    _h_help() {
        return { text: this.L(
            'Aku bisa:\n• Menilai **kondisi bisnis** + **skor kesehatan** 6 dimensi\n• Menentukan **prioritas** & **rencana** langkah demi langkah\n• Menganalisis **uang & arus kas**, **pinjaman**, **harga & margin**, **tren**, **pesaing**, produk, stok, tim, riset, OS, chip\n• **Prakiraan kas** dan simulasi: "kalau rekrut 2 engineer?", "kalau pinjam 50 ribu?"\n• Menjelaskan istilah (runway, burn, margin, cicilan…)\n• **Navigasi**: "buka riset", "ke tim", "lihat penjualan"\n\nTanya bebas, aku mengerti bahasa sehari-hari.',
            'I can:\n• Rate your **business health** across 6 dimensions\n• Pick **priorities** and give a step-by-step **plan**\n• Analyze **cash & cash flow**, **loans**, **price & margin**, **trends**, **rivals**, products, stock, team, research, OS, chips\n• **Cash forecast** and simulations: "what if I hire 2 engineers?", "what if I borrow 50k?"\n• Explain terms (runway, burn, margin, installment…)\n• **Navigate**: "open research", "go to team", "show sales"\n\nAsk freely; I understand everyday language.'),
            chips: this.chips() };
    }

    _h_status() {
        var c = this.sys._ctx(), h = this.health(), adv = this.sys.getAdvice();
        var L = this.L.bind(this);
        var lines = [L('Skor kesehatan bisnis: **' + h.score + '/100** (' + h.label + ')',
                       'Business health: **' + h.score + '/100** (' + h.label + ')')];
        lines.push(L('• Uang $' + money(c.cash) + ' · biaya $' + money(c.burn) + '/bulan · ' + (isFinite(c.runway) ? 'runway ' + c.runway.toFixed(1) + ' bln' : 'belum ada biaya'),
                     '• Cash $' + money(c.cash) + ' · cost $' + money(c.burn) + '/mo · ' + (isFinite(c.runway) ? 'runway ' + c.runway.toFixed(1) + ' mo' : 'no costs yet')));
        if (c.income > 0) {
            lines.push(L('• Pemasukan ≈ $' + money(c.income) + '/bulan · arus kas bersih ' + (c.net >= 0 ? '+' : '−') + '$' + money(Math.abs(c.net)),
                         '• Revenue ≈ $' + money(c.income) + '/mo · net cash flow ' + (c.net >= 0 ? '+' : '−') + '$' + money(Math.abs(c.net))));
        }
        lines.push(L('• Tim: ' + c.team.engineers + ' engineer, ' + c.team.designers + ' desainer, ' + c.team.marketers + ' marketer',
                     '• Team: ' + c.team.engineers + ' engineers, ' + c.team.designers + ' designers, ' + c.team.marketers + ' marketers'));
        lines.push(L('• Produk: ' + c.catalog.length + ' (' + c.selling.length + ' dijual)', '• Products: ' + c.catalog.length + ' (' + c.selling.length + ' on sale)'));
        if (c.loans.length) lines.push(L('• Pinjaman aktif: ' + c.loans.length + ' · cicilan $' + money(c.debtService) + '/bulan', '• Active loans: ' + c.loans.length + ' · installments $' + money(c.debtService) + '/mo'));
        var top = adv.filter(function (a) { return a.id !== 'all_good'; }).slice(0, 2);
        this._setList(top);
        if (top.length) {
            lines.push(L('\nPerlu perhatian:', '\nNeeds attention:'));
            top.forEach(function (a) { lines.push('• ' + a.title); });
        } else lines.push(L('\nTidak ada masalah mendesak.', '\nNothing urgent.'));
        var acts = top.filter(function (a) { return a.action; }).slice(0, 2).map(this._actionFor, this);
        return { text: lines.join('\n'), actions: acts };
    }

    _h_health(o) {
        var h = this.health(), L = this.L.bind(this);
        var bar = function (s) { var n = Math.round(s / 10); return '█'.repeat(n) + '░'.repeat(10 - n); };
        var lines = [L('Skor kesehatan: **' + h.score + '/100** (' + h.label + ')', 'Health score: **' + h.score + '/100** (' + h.label + ')'), ''];
        h.parts.forEach(function (p) {
            lines.push('• ' + p.label + ' ' + bar(p.score) + ' ' + p.score + (p.note ? ' (' + p.note + ')' : ''));
        });
        var w = h.weakest;
        var acts = [];
        if (w) {
            lines.push('');
            var tips = {
                liquidity: L('Tambah pemasukan (kampanye, stok), tunda rekrutmen, dan lunasi cicilan berat.', 'Raise revenue (campaigns, stock), pause hiring, and clear heavy installments.'),
                growth:    L('Jalankan kampanye, cek harga, dan siapkan produk penerus.', 'Run campaigns, review pricing, and prepare a successor product.'),
                product:   L('Jaga stok, perbaiki bug OS, dan rancang produk yang lebih disukai.', 'Keep stock, fix OS bugs, and design a better-liked product.'),
                team:      L('Naikkan moral staf dan lengkapi peran yang kosong.', 'Raise staff morale and fill missing roles.'),
                tech:      L('Isi semua slot riset dan rilis versi OS.', 'Fill every research slot and ship an OS version.'),
                brand:     L('Rilis produk berkualitas dan jaga ulasan.', 'Ship quality products and watch reviews.')
            };
            lines.push(L('Area terlemah: **' + w.label + '** (' + w.score + '). ', 'Weakest area: **' + w.label + '** (' + w.score + '). ') + (tips[w.id] || ''));
            var ha = HEALTH_ACTION[w.id];
            if (ha) acts.push(this._act(ha.id));
        }
        return { text: lines.join('\n'), actions: acts.filter(Boolean) };
    }

    _h_next(o) {
        var adv = this.sys.getAdvice();
        var L = this.L.bind(this);
        if (!adv.length || adv[0].id === 'all_good') {
            return { text: L('Tidak ada yang mendesak. Waktu bagus untuk investasi: riset baru, produk penerus, atau kampanye. Mau kubuatkan rencana?',
                             'Nothing urgent. Good time to invest: new research, a successor product, or a campaign. Want a plan?'),
                     chips: [L('Rencana awal', 'Starter plan'), L('Analisis produk', 'Analyze products')] };
        }
        var top = adv[0];
        this._setList(adv);
        var lines = [L('Prioritas #1: **' + top.title + '**', 'Priority #1: **' + top.title + '**'), top.detail];
        if (o.detail && adv[1]) lines.push(L('\nSetelah itu: **' + adv[1].title + '** — ' + adv[1].detail, '\nThen: **' + adv[1].title + '** — ' + adv[1].detail));
        if (o.detail && adv[2]) lines.push(L('Lalu: **' + adv[2].title + '** — ' + adv[2].detail, 'Then: **' + adv[2].title + '** — ' + adv[2].detail));
        if (o.detail && adv[3]) lines.push(L('Berikutnya: **' + adv[3].title + '**', 'Next: **' + adv[3].title + '**'));
        if (!o.detail && adv.length > 1) lines.push(L('\nAda ' + (adv.length - 1) + ' saran lain. Ketik "lanjut" untuk lihat.', '\n' + (adv.length - 1) + ' more suggestions. Type "more" to see them.'));
        var acts = [];
        if (top.action) acts.push(this._actionFor(top));
        if (o.detail && adv[1] && adv[1].action) acts.push(this._actionFor(adv[1]));
        return { text: lines.join('\n'), actions: acts };
    }

    _h_why(o) {
        var last = this.mem.last;
        if (last && ['why', 'navigate', 'greet', 'thanks', 'help', 'unknown', 'more', 'clarify', 'ref', 'combo'].indexOf(last) < 0) {
            var r = this._handle(last, { detail: true, text: o.text, product: o.product });
            r.text = this.L('Alasannya:\n', 'The reasoning:\n') + r.text;
            return r;
        }
        return this._h_next({ detail: true });
    }

    _h_more(o) { return this._h_next({ detail: true }); }

    _h_plan() {
        var c = this.sys._ctx(), L = this.L.bind(this), steps = [], acts = [];
        var t = c.team, total = t.engineers + t.designers + t.marketers;
        if (total === 0) {
            steps.push(L('Rekrut **1 engineer** dulu (membuka riset).', 'Hire **1 engineer** first (unlocks research).')); acts.push(this._act('team'));
            steps.push(L('Mulai riset termurah yang tersedia.', 'Start the cheapest available research.'));
            steps.push(L('Tambah **1 desainer**, lalu rancang ponsel pertama.', 'Add **1 designer**, then design your first phone.'));
        } else if (!c.catalog.length) {
            if (!t.designers) { steps.push(L('Rekrut **desainer** untuk mempercepat pengembangan.', 'Hire a **designer** to speed up development.')); acts.push(this._act('team')); }
            steps.push(L('Rancang & rilis **ponsel pertama** agar ada pemasukan.', 'Design & release your **first phone** to earn revenue.')); acts.push(this._act('design'));
            steps.push(L('Jaga uang > 3 bulan biaya selama pengembangan.', 'Keep cash above 3 months of costs during development.'));
        } else {
            if (c.runway < 3) steps.push(L('**Amankan kas dulu**: tunda rekrutmen & riset mahal sampai runway > 3 bulan.', '**Secure cash first**: pause hiring & costly research until runway > 3 months.'));
            steps.push(L('Pastikan **stok** produk laris tidak habis (auto-restock).', 'Keep best sellers **in stock** (auto-restock).')); acts.push(this._act('sales'));
            steps.push(L('Cek **harga & margin** tiap produk (target margin 25–45%).', 'Check each product\'s **price & margin** (target 25–45%).'));
            if (!t.marketers) steps.push(L('Rekrut **marketer**, jalankan kampanye saat produk masih baru.', 'Hire a **marketer**; run campaigns while the product is new.'));
            else steps.push(L('Jalankan **kampanye** untuk produk baru.', 'Run **campaigns** for new products.'));
            steps.push(L('Pakai slot riset penuh; kejar teknologi yang menaikkan skor produk.', 'Keep research slots busy; chase tech that raises product score.')); acts.push(this._act('research'));
            steps.push(L('Mulai rancang **penerus** sebelum penjualan menurun.', 'Start designing a **successor** before sales decline.'));
            steps.push(L('Jangka panjang: **OS sendiri** → **Fab chip** untuk menekan biaya.', 'Long term: **own OS** → **chip fab** to cut costs.'));
        }
        var txt = L('Rencana untuk fase kamu sekarang:\n', 'Plan for your current phase:\n') +
            steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n');
        return { text: txt, actions: acts.filter(Boolean).slice(0, 2) };
    }

    _h_cash(o) {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (c.burn <= 0) return { text: L('Belum ada biaya bulanan berarti, uangmu $' + money(c.cash) + ' aman untuk sekarang.', 'No significant monthly costs yet; your $' + money(c.cash) + ' is safe for now.') };
        var share = c.burn > 0 ? Math.round(c.payroll / c.burn * 100) : 0;
        var lines = [L('Uang **$' + money(c.cash) + '**, biaya **$' + money(c.burn) + '/bulan** → runway **' + c.runway.toFixed(1) + ' bulan**.',
                       'Cash **$' + money(c.cash) + '**, cost **$' + money(c.burn) + '/mo** → runway **' + c.runway.toFixed(1) + ' months**.')];
        if (c.income > 0 || c.debtService > 0) {
            lines.push(L('Pemasukan rata-rata ≈ $' + money(c.income) + '/bulan, cicilan $' + money(c.debtService) + '/bulan → arus kas bersih **' + (c.net >= 0 ? '+' : '−') + '$' + money(Math.abs(c.net)) + '/bulan**.',
                         'Average revenue ≈ $' + money(c.income) + '/mo, installments $' + money(c.debtService) + '/mo → net cash flow **' + (c.net >= 0 ? '+' : '−') + '$' + money(Math.abs(c.net)) + '/mo**.'));
            if (c.net < 0 && isFinite(c.trendRunway)) lines.push(L('Dengan tren ini uang habis ≈ **' + c.trendRunway.toFixed(1) + ' bulan** lagi.', 'At this pace cash runs out in ≈ **' + c.trendRunway.toFixed(1) + ' months**.'));
        }
        lines.push(L('Gaji staf ≈ ' + share + '% dari biaya bulanan.', 'Payroll ≈ ' + share + '% of monthly cost.'));
        if (c.cash < c.burn) lines.push(L('⚠ Kritis: uang kurang dari satu bulan biaya. Jual stok, tunda riset/rekrutmen, atau ambil pinjaman di Setelan.', 'Critical: cash is below one month of costs. Sell stock, delay research/hiring, or take a loan in Settings.'));
        else if (c.runway < 3) lines.push(L('Hati-hati: di bawah 3 bulan. Tahan rekrutmen sampai penjualan stabil.', 'Careful: under 3 months. Hold off hiring until sales stabilize.'));
        else if (c.runway >= 6) lines.push(L('Sehat. Ada ruang untuk investasi riset atau produk baru.', 'Healthy. You have room to invest in research or a new product.'));
        else lines.push(L('Cukup aman, tapi pantau saat menambah staf.', 'Reasonably safe, but watch it when hiring.'));
        if (o.detail) {
            lines.push(L('\nCara menaikkan runway: (1) naikkan penjualan lewat kampanye, (2) jaga stok, (3) cek margin harga, (4) hindari rekrut sebelum produk laku, (5) pinjaman hanya sebagai jaring pengaman.',
                         '\nWays to extend runway: (1) lift sales with campaigns, (2) keep stock, (3) check price margins, (4) avoid hiring before products sell, (5) loans only as a safety net.'));
        }
        return { text: lines.join('\n'), actions: [c.cash < c.burn ? this._act('settings') : this._act('sales')].filter(Boolean) };
    }

    _h_forecast() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (c.burn <= 0) return { text: L('Belum ada biaya bulanan, jadi belum ada yang perlu diprediksi.', 'No monthly costs yet, nothing to forecast.') };
        var f = this.sys.forecast(6);
        var lines = [L('Prakiraan kas (biaya + cicilan $' + money(f.outflow) + '/bulan):', 'Cash forecast (costs + installments $' + money(f.outflow) + '/mo):')];
        lines.push(L('• **Skenario dasar** (pemasukan ≈ $' + money(f.income) + '/bulan):', '• **Base case** (revenue ≈ $' + money(f.income) + '/mo):'));
        [1, 3, 6].forEach(function (m) {
            var v = f.base[m - 1].cash;
            lines.push('   ' + m + L(' bln: ', ' mo: ') + (v >= 0 ? '$' + money(v) : L('HABIS (kurang $', 'BROKE (short $') + money(-v) + ')'));
        });
        lines.push(L('• **Skenario pesimis** (tanpa pemasukan):', '• **Worst case** (no revenue):'));
        [1, 3, 6].forEach(function (m) {
            var v = f.worst[m - 1].cash;
            lines.push('   ' + m + L(' bln: ', ' mo: ') + (v >= 0 ? '$' + money(v) : L('HABIS (kurang $', 'BROKE (short $') + money(-v) + ')'));
        });
        lines.push(isFinite(f.runwayBase)
            ? L('\nDengan pemasukan sekarang, uang habis ≈ **' + f.runwayBase.toFixed(1) + ' bulan**. Tanpa pemasukan: **' + f.runwayWorst.toFixed(1) + ' bulan**.',
                '\nAt current revenue, cash lasts ≈ **' + f.runwayBase.toFixed(1) + ' months**. With none: **' + f.runwayWorst.toFixed(1) + ' months**.')
            : L('\nPemasukanmu menutup biaya — kas tidak menyusut. Pertahankan!', '\nYour revenue covers costs — cash is not shrinking. Keep it up!'));
        if (!c.selling.length) lines.push(L('Belum ada produk dijual; rilis produk pertama adalah cara tercepat memperpanjang napas.', 'No products on sale yet; releasing your first one is the fastest way to extend your runway.'));
        return { text: lines.join('\n'), actions: [this._act(c.selling.length ? 'sales' : 'design')].filter(Boolean) };
    }

    _h_trend() {
        var c = this.sys._ctx(), L = this.L.bind(this), t = c.trends;
        var lines = [];
        if (t.points < 2) {
            lines.push(L('Data tren masih terkumpul (butuh beberapa minggu permainan). Cek lagi nanti.', 'Trend data is still being collected (needs a few in-game weeks). Check back later.'));
        } else {
            if (t.salesRecent !== null) lines.push(L('• Laju jual terkini: **' + t.salesRecent.toFixed(1) + ' unit/hari**', '• Current sales pace: **' + t.salesRecent.toFixed(1) + ' units/day**'));
            if (t.salesDrop !== null && t.salesPrev >= 1) {
                var dir = t.salesDrop >= 0.15 ? L('turun', 'down') : t.salesDrop <= -0.15 ? L('naik', 'up') : L('stabil', 'steady');
                lines.push(L('• Dibanding periode sebelumnya: **' + dir + (Math.abs(t.salesDrop) >= 0.15 ? ' ' + Math.abs(Math.round(t.salesDrop * 100)) + '%' : '') + '**',
                             '• Versus the previous period: **' + dir + (Math.abs(t.salesDrop) >= 0.15 ? ' ' + Math.abs(Math.round(t.salesDrop * 100)) + '%' : '') + '**'));
            }
            if (t.cashPerDay !== null) lines.push(L('• Perubahan kas: **' + (t.cashPerDay >= 0 ? '+' : '−') + '$' + money(Math.abs(t.cashPerDay * 30)) + '/bulan** (rata-rata terakhir)',
                                                    '• Cash change: **' + (t.cashPerDay >= 0 ? '+' : '−') + '$' + money(Math.abs(t.cashPerDay * 30)) + '/mo** (recent average)'));
        }
        var sh = arr((c.d.market || {}).shareHistory);
        if (sh.length >= 2 && typeof sh[0].playerShare === 'number') {
            var k = sh[0].playerShare <= 1 ? 100 : 1;
            lines.push(L('• Pangsa pasar: ' + (sh[1].playerShare * k).toFixed(1) + '% → **' + (sh[0].playerShare * k).toFixed(1) + '%**',
                         '• Market share: ' + (sh[1].playerShare * k).toFixed(1) + '% → **' + (sh[0].playerShare * k).toFixed(1) + '%**'));
        }
        if (!lines.length) lines.push(L('Belum ada data tren. Rilis produk dan biarkan waktu berjalan.', 'No trend data yet. Release a product and let time pass.'));
        if (t.salesDrop !== null && t.salesDrop >= 0.4 && t.salesPrev >= 5) lines.push(L('\nPenjualan melambat tajam: coba kampanye, tinjau harga, atau siapkan penerus.', '\nSales are slowing sharply: try a campaign, review pricing, or prep a successor.'));
        return { text: lines.join('\n'), actions: [this._act('sales')] };
    }

    _h_loan(o) {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (!c.loans.length) {
            return { text: L('Kamu tidak punya pinjaman aktif. Pinjaman hanya sebagai jaring pengaman; bunganya menggerus margin. Mau simulasi? Ketik "kalau pinjam 50 ribu".',
                             'You have no active loans. Use loans only as a safety net; interest erodes margin. Want a simulation? Type "what if I borrow 50k".'),
                     actions: [this._act('settings')] };
        }
        var left = c.loans.reduce(function (a, l) { return a + (l.remaining || 0); }, 0);
        var late = c.loans.filter(function (l) { return (l.missed || 0) > 0; }).length;
        var base = c.income > 0 ? c.income : c.burn;
        var ratio = base > 0 ? c.debtService / base : 0;
        var lines = [L('Pinjaman aktif: **' + c.loans.length + '** · sisa total **$' + money(left) + '** · cicilan **$' + money(c.debtService) + '/bulan**.',
                       'Active loans: **' + c.loans.length + '** · total remaining **$' + money(left) + '** · installments **$' + money(c.debtService) + '/mo**.')];
        lines.push(L('Cicilan = ' + pct(ratio) + ' dari ' + (c.income > 0 ? 'pemasukan' : 'biaya bulanan') + (ratio > 0.4 ? ' (terlalu berat)' : ' (aman)') + '.',
                     'Installments = ' + pct(ratio) + ' of ' + (c.income > 0 ? 'revenue' : 'monthly cost') + (ratio > 0.4 ? ' (too heavy)' : ' (OK)') + '.'));
        if (late) lines.push(L('⚠ ' + late + ' pinjaman menunggak — bayar segera agar tidak kena denda & blokir bank.', '⚠ ' + late + ' loan(s) overdue — pay now to avoid fees and a bank block.'));
        else if (c.cash > left * 1.5 + c.burn * 6) lines.push(L('Uangmu longgar: pertimbangkan **pelunasan dini** untuk menghemat bunga.', 'Your cash is comfortable: consider **early repayment** to save interest.'));
        if (o.detail) lines.push(L('\nUrutan bijak: lunasi yang bunganya tertinggi dulu, jangan ambil pinjaman baru saat arus kas bersih negatif.', '\nSmart order: repay the highest-interest loan first; do not borrow more while net cash flow is negative.'));
        return { text: lines.join('\n'), actions: [this._act('settings')] };
    }

    _h_price(o) {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var list = o.product ? [o.product] : c.selling;
        if (!c.catalog.length) return { text: L('Belum ada produk, jadi belum ada harga untuk dianalisis.', 'No products yet, so no pricing to analyze.'), actions: [this._act('design')] };
        if (!list.length) list = c.catalog;
        var lines = [], t = c.trends;
        list.slice(0, 4).forEach(function (p) {
            if (!(p.price > 0) || typeof p.unitCost !== 'number') return;
            var m = (p.price - p.unitCost) / p.price;
            var verdict;
            if (m < 0) verdict = L('RUGI per unit — naikkan harga!', 'LOSS per unit — raise the price!');
            else if (m < 0.12) verdict = L('terlalu tipis — naikkan sedikit', 'too thin — raise slightly');
            else if (m > 0.55 && t.salesDrop !== null && t.salesDrop > 0.2) verdict = L('margin tebal tapi penjualan turun — pertimbangkan diskon', 'fat margin but sales falling — consider a discount');
            else if (m > 0.55) verdict = L('margin tebal; aman selama laku', 'fat margin; fine while it sells');
            else verdict = L('sehat', 'healthy');
            lines.push('**' + p.name + '** — ' + L('harga $', 'price $') + money(p.price) + L(', biaya $', ', cost $') + money(p.unitCost) + ', margin ' + pct(m) + ' → ' + verdict);
        });
        if (!lines.length) return { text: L('Data biaya produk belum tersedia.', 'Product cost data is not available yet.') };
        lines.push(L('\nPatokan: margin 25–45% sehat; di bawah 12% terlalu tipis.', '\nRule of thumb: 25–45% margin is healthy; under 12% is too thin.'));
        return { text: lines.join('\n'), actions: [this._act('sales')] };
    }

    _h_competitor() {
        var c = this.sys._ctx(), L = this.L.bind(this), m = c.d.market || {};
        var comps = arr(m.competitors).slice().sort(function (a, b) { return (b.share || 0) - (a.share || 0); });
        var k = (typeof m.share === 'number' && m.share <= 1) ? 100 : 1;
        var lines = [];
        if (typeof m.share === 'number') lines.push(L('Pangsa pasarmu: **' + (m.share * k).toFixed(1) + '%**', 'Your market share: **' + (m.share * k).toFixed(1) + '%**'));
        if (comps.length) {
            var ks = (comps[0].share <= 1) ? 100 : 1;
            lines.push(L('Pesaing terbesar:', 'Top rivals:'));
            comps.slice(0, 3).forEach(function (cp) {
                lines.push('• ' + (cp.name || cp.id) + ' — ' + ((cp.share || 0) * ks).toFixed(1) + '%');
            });
        }
        var sh = arr(m.shareHistory);
        if (sh.length >= 2 && typeof sh[0].playerShare === 'number') {
            var kk = sh[0].playerShare <= 1 ? 100 : 1;
            var diff = (sh[0].playerShare - sh[1].playerShare) * kk;
            lines.push(L('Bulan ini pangsamu ' + (diff >= 0 ? 'naik ' : 'turun ') + Math.abs(diff).toFixed(1) + ' poin.', 'This month your share ' + (diff >= 0 ? 'rose ' : 'fell ') + Math.abs(diff).toFixed(1) + ' pts.'));
        }
        if (!lines.length) lines.push(L('Data pasar belum tersedia. Rilis produk agar masuk persaingan.', 'No market data yet. Release a product to enter the competition.'));
        lines.push(L('Cara melawan: produk berkualitas, harga kompetitif, kampanye saat rilis, dan reputasi yang kuat.', 'How to compete: quality products, competitive pricing, launch campaigns, and strong reputation.'));
        return { text: lines.join('\n'), actions: [this._act('market')] };
    }

    _parseWhatIf(text) {
        var s = String(text || '').toLowerCase();
        var hire = {}, found = false;
        var roleMap = { engineer: 'engineer', insinyur: 'engineer', desainer: 'designer', designer: 'designer', marketer: 'marketer', pemasar: 'marketer' };
        var re = /(\d+)\s*(engineer|insinyur|desainer|designer|marketer|pemasar)/g, mt;
        while ((mt = re.exec(s))) { hire[roleMap[mt[2]]] = (hire[roleMap[mt[2]]] || 0) + parseInt(mt[1], 10); found = true; }
        if (!found) {
            var re2 = /(rekrut|hire|tambah)\s+(engineer|insinyur|desainer|designer|marketer|pemasar)/g;
            while ((mt = re2.exec(s))) { hire[roleMap[mt[2]]] = (hire[roleMap[mt[2]]] || 0) + 1; found = true; }
        }
        var loan = 0;
        var lm = /(pinjam|pinjaman|loan|utang|kredit|borrow)\D{0,14}?\$?\s*(\d[\d.,]*)\s*(k|rb|ribu|jt|juta|m)?\b/.exec(s);
        if (lm) { loan = parseAmount(lm[2], lm[3]); if (loan > 0) found = true; }
        return found ? { hire: hire, loan: loan } : null;
    }

    _h_whatif(o) {
        var L = this.L.bind(this);
        var p = this._parseWhatIf(o.text);
        if (!p) {
            return { text: L('Simulasi apa? Contoh: "kalau rekrut 2 engineer", "kalau rekrut 1 desainer dan 1 marketer", atau "kalau pinjam 50 ribu".',
                             'Simulate what? For example: "what if I hire 2 engineers", "what if I hire 1 designer and 1 marketer", or "what if I borrow 50k".'),
                     chips: [L('Kalau rekrut 1 engineer?', 'What if I hire 1 engineer?'), L('Kalau pinjam 50 ribu?', 'What if I borrow 50k?')] };
        }
        var s = this.sys.simulate(p);
        var lines = [];
        var what = [];
        if (s.desc.length) what.push(L('rekrut ', 'hire ') + s.desc.map(function (x) { return L(x.replace('designer', 'desainer'), x); }).join(', '));
        if (s.loanAmt > 0) what.push(L('pinjam $', 'borrow $') + money(s.loanAmt));
        lines.push(L('Simulasi: **' + what.join(' + ') + '**', 'Simulation: **' + what.join(' + ') + '**'));
        if (s.upfront > 0) lines.push(L('• Biaya rekrut sekali bayar: $' + money(s.upfront), '• One-off hiring cost: $' + money(s.upfront)));
        if (s.addBurn > 0) lines.push(L('• Gaji bulanan bertambah: +$' + money(s.addBurn), '• Monthly payroll increases: +$' + money(s.addBurn)));
        if (s.loanAmt > 0) lines.push(L('• Cicilan perkiraan (12 bln, 3%/bln): ≈ $' + money(s.loanInst) + '/bulan', '• Estimated installment (12 mo, 3%/mo): ≈ $' + money(s.loanInst) + '/mo'));
        lines.push(L('• Uang setelahnya: $' + money(s.cashAfter), '• Cash afterwards: $' + money(s.cashAfter)));
        lines.push(L('• Runway: ' + (isFinite(s.runwayBefore) ? s.runwayBefore.toFixed(1) : '∞') + ' → **' + (isFinite(s.runwayAfter) ? s.runwayAfter.toFixed(1) : '∞') + ' bulan**',
                     '• Runway: ' + (isFinite(s.runwayBefore) ? s.runwayBefore.toFixed(1) : '∞') + ' → **' + (isFinite(s.runwayAfter) ? s.runwayAfter.toFixed(1) : '∞') + ' months**'));
        lines.push(L('• Arus kas bersih: ' + (s.netBefore >= 0 ? '+' : '−') + '$' + money(Math.abs(s.netBefore)) + ' → **' + (s.netAfter >= 0 ? '+' : '−') + '$' + money(Math.abs(s.netAfter)) + '/bulan**',
                     '• Net cash flow: ' + (s.netBefore >= 0 ? '+' : '−') + '$' + money(Math.abs(s.netBefore)) + ' → **' + (s.netAfter >= 0 ? '+' : '−') + '$' + money(Math.abs(s.netAfter)) + '/mo**'));
        if (s.cashAfter < 0) lines.push(L('\n⛔ Uangmu **tidak cukup** untuk ini.', '\n⛔ You **cannot afford** this.'));
        else if (s.safe) lines.push(L('\n✅ Aman dilakukan: runway tetap sehat.', '\n✅ Safe to do: runway stays healthy.'));
        else lines.push(L('\n⚠ Berisiko: runway jadi tipis. Tunggu penjualan naik atau kecilkan skalanya.', '\n⚠ Risky: runway gets thin. Wait for sales to grow or scale it down.'));
        return { text: lines.join('\n'), actions: [this._act(s.loanAmt > 0 ? 'settings' : 'team')].filter(Boolean) };
    }

    _h_research() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var r = c.d.research || {};
        var active = arr(r.active), max = r.maxSlots || 1;
        var lines = [L('Slot riset: **' + active.length + '/' + max + '** terpakai, ' + arr(r.completed).length + ' riset selesai.',
                       'Research slots: **' + active.length + '/' + max + '** used, ' + arr(r.completed).length + ' researched.')];
        if (active.length) lines.push(L('Sedang berjalan: ' + active.map(function (e) { return e.name; }).join(', ') + '.', 'In progress: ' + active.map(function (e) { return e.name; }).join(', ') + '.'));
        var pickRs = active.length < max ? c.bestResearch() : null;
        if (pickRs) {
            lines.push(L('Rekomendasi: **' + pickRs.node.name + '** ($' + money(pickRs.node.cost) + ') — ' + pickRs.why + '.',
                         'Recommended: **' + pickRs.node.name + '** ($' + money(pickRs.node.cost) + ') — ' + pickRs.why + '.'));
        } else if (active.length >= max) {
            lines.push(L('Slot penuh. Tambah engineer untuk membuka slot berikutnya.', 'Slots full. Hire engineers to unlock the next slot.'));
        } else if (this.sys.deps.research) {
            lines.push(L('Tidak ada riset terjangkau saat ini — kumpulkan uang atau selesaikan prasyaratnya.', 'No affordable research right now — gather cash or finish prerequisites.'));
        }
        lines.push(L('Tips: riset yang membuka banyak riset lanjutan memberi nilai terbesar; Silicon bisa mempercepat/membuka riset.', 'Tip: research that unlocks many follow-ups gives the most value; Silicon can speed up/unlock research.'));
        return { text: lines.join('\n'), actions: [this._act('research')] };
    }

    _h_team() {
        var c = this.sys._ctx(), L = this.L.bind(this), t = c.team;
        var staff = arr(c.d.staff);
        var lines = [L('Tim: **' + t.engineers + '** engineer, **' + t.designers + '** desainer, **' + t.marketers + '** marketer.',
                       'Team: **' + t.engineers + '** engineers, **' + t.designers + '** designers, **' + t.marketers + '** marketers.')];
        if (staff.length) {
            var avg = Math.round(staff.reduce(function (a, x) { return a + (x.morale || 0); }, 0) / staff.length);
            lines.push(L('Moral rata-rata: ' + avg + '/100' + (avg < 50 ? ' (rendah!)' : ''), 'Average morale: ' + avg + '/100' + (avg < 50 ? ' (low!)' : '')));
        }
        var role = null, why = '';
        if (!(t.engineers + t.designers + t.marketers)) { role = 'engineer'; why = L('membuka riset', 'unlocks research'); }
        else if (!t.designers && !c.catalog.length) { role = 'designer'; why = L('dibutuhkan sebelum merancang ponsel', 'needed before designing a phone'); }
        else if (!t.marketers && c.selling.length) { role = 'marketer'; why = L('sudah menjual, saatnya kampanye', 'you are selling, time for campaigns'); }
        else if (t.engineers < 2 * ((c.d.research || {}).maxSlots || 1) && t.engineers > 0) { role = 'engineer'; why = L('membuka slot riset berikutnya', 'unlocks the next research slot'); }
        if (role) {
            var s = this.sys.simulate({ hire: (function (r) { var h = {}; h[r] = 1; return h; })(role) });
            var rn = role === 'engineer' ? 'engineer' : role === 'designer' ? L('desainer', 'designer') : 'marketer';
            lines.push(L('Rekrut berikutnya: **' + rn + '** (' + why + '). Gaji +$' + money(s.addBurn) + '/bln, runway jadi ' + (isFinite(s.runwayAfter) ? s.runwayAfter.toFixed(1) : '∞') + ' bln — ' + (s.safe ? 'aman ✅' : 'berisiko ⚠') + '.',
                         'Next hire: **' + rn + '** (' + why + '). Salary +$' + money(s.addBurn) + '/mo, runway becomes ' + (isFinite(s.runwayAfter) ? s.runwayAfter.toFixed(1) : '∞') + ' mo — ' + (s.safe ? 'safe ✅' : 'risky ⚠') + '.'));
        } else {
            lines.push(L('Komposisi tim sudah masuk akal. Tambah staf hanya jika runway > 3 bulan.', 'Team mix looks reasonable. Only add staff if runway > 3 months.'));
        }
        return { text: lines.join('\n'), actions: [this._act('team')] };
    }

    _h_morale() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var s = arr(c.d.staff);
        if (!s.length) return { text: L('Belum ada staf, jadi belum ada moral untuk dipantau.', 'No staff yet, so no morale to track.') };
        var avg = Math.round(s.reduce(function (a, x) { return a + (x.morale || 0); }, 0) / s.length);
        var low = s.filter(function (x) { return (x.morale || 0) < 40; }).length;
        var txt = L('Moral rata-rata **' + avg + '/100**' + (low ? ', ' + low + ' staf di bawah 40 (risiko keluar).' : '.'),
                    'Average morale **' + avg + '/100**' + (low ? ', ' + low + ' staff below 40 (quit risk).' : '.'));
        txt += '\n' + (avg < 50 ? L('Cek detail staf di halaman Tim dan perbaiki kondisi kerja.', 'Check individual staff in Team and improve conditions.')
                                 : L('Aman. Pertahankan.', 'Fine. Keep it up.'));
        return { text: txt, actions: [this._act('team')] };
    }

    _h_product(o) {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (!c.catalog.length) {
            return { text: L('Belum ada produk. Rancang ponsel pertamamu di Produk → Rancang.', 'No products yet. Design your first phone in Products → Design.'), actions: [this._act('design')] };
        }
        var self = this;
        var list = o.product ? [o.product]
                 : (this.mem.lastProduct && o.detail ? c.catalog.filter(function (p) { return p.id === self.mem.lastProduct; }) : c.catalog);
        if (!list.length) list = c.catalog;
        var sat = (c.d.feedback && c.d.feedback.perProductSatisfaction) || {};
        var lines = [];
        list.slice(0, 4).forEach(function (p) {
            var age = Math.floor((c.now - (p.releaseGameMinute || 0)) / DAY);
            var cap = p.baseCapacity || p.totalProduced || 0;
            var tags = [];
            if (p.status !== 'selling') tags.push(L('belum dijual', 'not on sale'));
            else {
                if ((p.stock || 0) <= 0) tags.push(L('STOK HABIS', 'OUT OF STOCK'));
                else if (cap && p.stock < cap * 0.2) tags.push(L('stok menipis', 'low stock'));
                var camps = arr((c.d.marketing || {}).activeCampaigns).some(function (m) { return m.productId === p.id; });
                if (!camps && age < 180) tags.push(L('tanpa kampanye', 'no campaign'));
                if (age > 180) tags.push(L('mulai menua', 'aging'));
                if (p.price > 0 && typeof p.unitCost === 'number' && (p.price - p.unitCost) / p.price < 0.12) tags.push(L('margin tipis', 'thin margin'));
                if (typeof sat[p.id] === 'number' && sat[p.id] < 45) tags.push(L('pengguna kurang puas', 'users unhappy'));
                // [Fitur Ponsel] sebut fitur standar yang kurang / regulasi (produk lama tanpa featureIds dilewati).
                try {
                    var psx = window.__game && window.__game.products;
                    if (psx && psx.getFeatureAnalysisFor && p.config && Array.isArray(p.config.featureIds)) {
                        var fa = psx.getFeatureAnalysisFor(p);
                        if (fa.regulations && fa.regulations.length) tags.push(L(fa.regulations[0].label, fa.regulations[0].labelEn || fa.regulations[0].label));
                        else {
                            var tp = (fa.penalties || []).slice().sort(function (x, y) { return y.value - x.value; })[0];
                            if (tp && tp.value >= 0.03) tags.push(L(tp.label, tp.labelEn || tp.label));
                        }
                    }
                } catch (e) {}
            }
            lines.push('**' + p.name + '** — ' + L('terjual ', 'sold ') + money(p.totalSold || 0) + L(', stok ', ', stock ') + money(p.stock || 0) +
                       (p.status === 'selling' ? L(', umur ' + age + ' hari', ', age ' + age + ' days') : '') +
                       (tags.length ? ' [' + tags.join(', ') + ']' : ''));
        });
        if (c.catalog.length > list.length && list.length >= 4) lines.push(L('…dan ' + (c.catalog.length - 4) + ' produk lain.', '…and ' + (c.catalog.length - 4) + ' more.'));
        var best = c.catalog.slice().sort(function (a, b) { return (b.totalSold || 0) - (a.totalSold || 0); })[0];
        if (!o.product && best && (best.totalSold || 0) > 0) lines.push(L('\nTerlaris: **' + best.name + '**.', '\nBest seller: **' + best.name + '**.'));
        return { text: lines.join('\n'), actions: [this._act('sales')] };
    }

    _h_stock() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (!c.selling.length) return { text: L('Belum ada produk yang dijual, jadi belum ada stok untuk dipantau.', 'No products on sale yet, so no stock to monitor.') };
        var out = [], low = [], ok = 0, soon = [];
        var pp = (c.trends && c.trends.perProduct) || {};
        c.selling.forEach(function (p) {
            var cap = p.baseCapacity || p.totalProduced || 0;
            if ((p.stock || 0) <= 0) out.push(p.name);
            else if (cap && p.stock < cap * 0.2) low.push(p.name + ' (' + money(p.stock) + ')');
            else {
                var pace = pp[p.id];
                if (pace > 0.5 && p.stock / pace <= 14) soon.push(p.name + ' (~' + Math.max(1, Math.round(p.stock / pace)) + L(' hari', ' days') + ')');
                else ok++;
            }
        });
        var lines = [];
        if (out.length) lines.push(L('**Habis:** ', '**Out:** ') + out.join(', ') + L(' — penjualan berhenti, produksi ulang sekarang!', ' — sales stopped, re-produce now!'));
        if (low.length) lines.push(L('**Menipis:** ', '**Low:** ') + low.join(', '));
        if (soon.length) lines.push(L('**Prakiraan habis:** ', '**Projected to run out:** ') + soon.join(', '));
        if (ok) lines.push(L(ok + ' produk stoknya aman.', ok + ' product(s) well stocked.'));
        if (out.length || low.length || soon.length) lines.push(L('Aktifkan auto-restock agar tidak kehilangan penjualan.', 'Enable auto-restock to avoid lost sales.'));
        return { text: lines.join('\n'), actions: [this._act('sales')] };
    }

    _h_marketing() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var camps = arr((c.d.marketing || {}).activeCampaigns);
        var lines = [L('Kampanye aktif: **' + camps.length + '**.', 'Active campaigns: **' + camps.length + '**.')];
        if (!c.team.marketers) lines.push(L('Kamu belum punya marketer; rekrut dulu untuk memperbesar jangkauan.', 'No marketer yet; hire one to widen reach.'));
        var cand = this.sys.getAdvice({ includeSnoozed: true }).filter(function (a) { return a.id.indexOf('campaign') === 0 || a.id === 'viral_opportunity'; })[0];
        if (cand) lines.push('• ' + cand.title + ' — ' + cand.detail);
        else if (c.selling.length) lines.push(L('Semua produk baru sudah punya kampanye atau sudah lewat masa efektif.', 'All new products have campaigns or are past the effective window.'));
        else lines.push(L('Rilis produk dulu, baru kampanye berguna.', 'Release a product first; campaigns help after that.'));
        lines.push(L('Kampanye paling efektif di fase naik & puncak produk.', 'Campaigns work best in a product\'s rise & peak phases.'));
        return { text: lines.join('\n'), actions: [this._act('sales'), c.team.marketers ? null : this._act('team')].filter(Boolean) };
    }

    _h_os() {
        var c = this.sys._ctx(), L = this.L.bind(this), o = c.d.os || {};
        var v = arr(o.versions).length;
        var b = arr(o.bugs).filter(function (x) { return x && x.status === 'active'; }).length;
        var txt;
        if (!v) txt = L('Kamu belum punya OS sendiri. OS stabil menaikkan skor produk dan membuka toko aplikasi; mulai setelah ada produk dan engineer.', 'You have no OS of your own yet. A stable OS raises product score and unlocks the app store; start once you have a product and engineers.');
        else txt = L('OS: ' + v + ' versi, ' + b + ' bug aktif.' + (b >= 3 ? ' Bug menumpuk — perbaiki agar kepuasan pengguna tidak turun.' : ' Kondisi baik.'),
                     'OS: ' + v + ' version(s), ' + b + ' active bug(s).' + (b >= 3 ? ' Bugs piling up — fix them to protect satisfaction.' : ' Looking good.'));
        return { text: txt, actions: [this._act('os')] };
    }

    _h_chip() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var f = c.d.fab || {};
        var done = arr((c.d.chipResearch || {}).completed).indexOf('fab_construction') >= 0;
        var txt = f.built ? L('Fab milikmu sudah berdiri' + (f.level ? ' (level ' + f.level + ')' : '') + '. Terus tingkatkan untuk menekan biaya chip.', 'Your fab is built' + (f.level ? ' (level ' + f.level + ')' : '') + '. Keep upgrading to cut chip costs.')
                : done ? L('Riset Fab Construction selesai — saatnya membangun pabrik chip sendiri.', 'Fab Construction is researched — time to build your own chip fab.')
                : L('Fab butuh riset Fab Construction di Riset Chip. Investasi besar, jadi pastikan runway aman dulu.', 'A fab needs Fab Construction in Chip Research. Big investment, so secure your runway first.');
        return { text: txt, actions: [this._act('chip')] };
    }

    _h_reputation() {
        var c = this.sys._ctx(), L = this.L.bind(this), m = c.d.market || {};
        var rep = typeof m.reputation === 'number' ? Math.round(m.reputation) : null;
        var lines = [];
        if (rep !== null) lines.push(L('Reputasi: **' + rep + '/100**' + (rep < 20 ? ' (rendah)' : rep > 60 ? ' (kuat)' : '') + '.', 'Reputation: **' + rep + '/100**' + (rep < 20 ? ' (low)' : rep > 60 ? ' (strong)' : '') + '.'));
        if (typeof m.share === 'number') lines.push(L('Pangsa pasar: ' + (m.share * (m.share <= 1 ? 100 : 1)).toFixed(1) + '%.', 'Market share: ' + (m.share * (m.share <= 1 ? 100 : 1)).toFixed(1) + '%.'));
        if (!lines.length) lines.push(L('Data pasar belum tersedia. Rilis produk agar reputasi mulai terbentuk.', 'No market data yet. Release a product to start building reputation.'));
        lines.push(L('Naikkan reputasi: rilis produk berkualitas, jaga stok, dan hindari bug OS.', 'Raise reputation: ship quality products, keep stock, avoid OS bugs.'));
        return { text: lines.join('\n'), actions: [this._act('market')] };
    }

    _h_silicon() {
        var g = GLOSSARY.silicon[this.lang() === 'id' ? 0 : 1];
        return { text: g };
    }

    _h_glossary(o) {
        var toks = o.toks || [];
        for (var i = 0; i < toks.length; i++) {
            for (var k in GLOSSARY) {
                if (matchWord(toks[i], k) >= 1.5) return { text: GLOSSARY[k][this.lang() === 'id' ? 0 : 1] };
            }
        }
        return { text: this.L('Istilah mana yang ingin kamu ketahui? Contoh: runway, burn, margin, cicilan, arus kas, moral, fab, kampanye, stok, reputasi, silicon.', 'Which term? For example: runway, burn, margin, installment, cash flow, morale, fab, campaign, stock, reputation, silicon.') };
    }
                        }
