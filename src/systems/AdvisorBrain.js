// FILE: src/systems/AdvisorBrain.js  (BARU)
// v2027.37 — "Otak" lokal Asisten Bisnis. Tanpa server / API key.
//
// Kemampuan:
//  - Memahami pertanyaan bebas (Indonesia + Inggris), toleran typo (fuzzy match).
//  - Mengingat konteks percakapan (topik terakhir, produk yang disebut,
//    pertanyaan lanjutan seperti "kenapa?" / "detail" / "lanjut").
//  - Menjawab dengan data nyata game: kas, runway, tim, riset, stok, produk, OS, fab.
//  - Skor kesehatan bisnis, prediksi kas, rencana langkah demi langkah.
//  - Perintah navigasi ("buka riset", "ke tim", "go to sales").
//  - Selalu mengembalikan tombol aksi + saran pertanyaan lanjutan.
//
// Kontrak: reply(text) -> { text, actions:[{label,nav,subtab}], chips:[string],
//                           intent, confidence }
// Tidak mengubah state game.

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

// Skor kecocokan token user vs kata kunci: 2 = persis, 1.5 = awalan, 1.1 = typo, 0 = tidak.
function matchWord(tok, kw) {
    if (tok === kw) return 2;
    if (tok.length >= 4 && kw.length >= 4 && (kw.indexOf(tok) === 0 || tok.indexOf(kw) === 0)) return 1.5;
    if (kw.length >= 5 && tok.length >= 4) {
        var max = kw.length >= 8 ? 2 : 1;
        if (lev(tok, kw, max) <= max) return 1.1;
    }
    return 0;
}

function money(n) { return Math.round(n).toLocaleString('en-US'); }
function arr(a) { return Array.isArray(a) ? a : []; }
function pick(list, n) { return list[n % list.length]; }

// ------------------------------------------------------------
// Kamus intent
// ------------------------------------------------------------
var INTENTS = {
    greet:     { w: 1, kw: ['halo', 'hai', 'hi', 'hello', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'woi'] },
    thanks:    { w: 1, kw: ['makasih', 'terima', 'kasih', 'thanks', 'thx', 'thank', 'mantap', 'sip', 'keren', 'good'] },
    help:      { w: 1, kw: ['bantuan', 'help', 'bisa', 'fitur', 'menu', 'cara', 'bantu', 'kemampuan', 'can'] },
    status:    { w: 1.2, kw: ['kondisi', 'keadaan', 'status', 'ringkasan', 'summary', 'overview', 'situasi', 'laporan', 'report', 'gimana', 'bagaimana', 'sehat', 'health', 'perusahaan', 'company', 'bisnis', 'business', 'skor', 'score'] },
    next:      { w: 1.3, kw: ['saran', 'next', 'prioritas', 'harus', 'lakukan', 'todo', 'langkah', 'rekomendasi', 'recommend', 'suggestion', 'priority', 'sekarang', 'now', 'selanjutnya', 'should', 'penting', 'urgent', 'mendesak'] },
    plan:      { w: 1.4, kw: ['rencana', 'strategi', 'plan', 'strategy', 'roadmap', 'panduan', 'guide', 'tahap', 'mulai', 'start', 'awal', 'pemula', 'beginner'] },
    cash:      { w: 1.4, kw: ['uang', 'kas', 'cash', 'duit', 'saldo', 'dana', 'bokek', 'runway', 'burn', 'biaya', 'pengeluaran', 'boros', 'hemat', 'cost', 'money', 'pinjaman', 'loan', 'gaji', 'bangkrut', 'bankrupt', 'napas'] },
    forecast:  { w: 1.5, kw: ['prediksi', 'forecast', 'proyeksi', 'depan', 'nanti', 'habis', 'kapan', 'when', 'predict', 'ramalan', 'bertahan', 'survive', 'lama'] },
    research:  { w: 1.4, kw: ['riset', 'research', 'teknologi', 'tech', 'slot', 'inovasi', 'unlock', 'node'] },
    team:      { w: 1.4, kw: ['tim', 'team', 'staf', 'staff', 'rekrut', 'hire', 'hiring', 'engineer', 'desainer', 'designer', 'marketer', 'karyawan', 'pegawai', 'employee', 'sdm', 'recruit', 'pecat', 'fire'] },
    product:   { w: 1.3, kw: ['produk', 'product', 'ponsel', 'phone', 'hp', 'smartphone', 'penjualan', 'sales', 'jual', 'laku', 'rilis', 'release', 'desain', 'design', 'rancang', 'harga', 'price', 'terjual', 'sold', 'katalog'] },
    stock:     { w: 1.5, kw: ['stok', 'stock', 'produksi', 'restock', 'persediaan', 'inventory', 'habis', 'produce', 'gudang'] },
    marketing: { w: 1.5, kw: ['iklan', 'kampanye', 'marketing', 'campaign', 'promosi', 'promo', 'ads', 'advertising', 'pemasaran'] },
    os:        { w: 1.5, kw: ['os', 'sistem', 'operasi', 'bug', 'software', 'update', 'versi', 'version', 'appstore'] },
    chip:      { w: 1.5, kw: ['chip', 'fab', 'pabrik', 'prosesor', 'processor', 'soc', 'semikonduktor', 'foundry', 'wafer'] },
    morale:    { w: 1.5, kw: ['moral', 'semangat', 'mood', 'bahagia', 'happy', 'morale', 'resign', 'keluar', 'quit', 'burnout'] },
    reputation:{ w: 1.4, kw: ['reputasi', 'reputation', 'ulasan', 'review', 'rating', 'pangsa', 'share', 'pasar', 'market', 'saingan', 'kompetitor', 'competitor', 'pesaing', 'brand', 'citra'] },
    silicon:   { w: 1.6, kw: ['silicon', 'sil', 'topup', 'top', 'up', 'premium', 'percepat', 'speed', 'boost', 'gem'] },
    glossary:  { w: 1.2, kw: ['itu', 'artinya', 'maksud', 'definisi', 'arti', 'what', 'means', 'meaning', 'define', 'istilah'] },
    why:       { w: 1.0, kw: ['kenapa', 'mengapa', 'why', 'alasan', 'sebab', 'reason', 'bagaimana'] },
    more:      { w: 0.5, kw: ['lanjut', 'detail', 'lagi', 'terus', 'jelasin', 'jelaskan', 'lengkap', 'more', 'continue', 'elaborate', 'next', 'oke', 'ok', 'ya', 'yes', 'iya', 'boleh'] }
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
    { id: 'market',   label: ['Pasar', 'Market'],              nav: 'market',   subtab: null,     kw: ['pasar', 'market', 'saham', 'stock market', 'kompetitor', 'saingan'] },
    { id: 'settings', label: ['Setelan', 'Settings'],          nav: 'settings', subtab: null,     kw: ['setelan', 'setting', 'settings', 'pengaturan', 'pinjaman', 'loan', 'opsi'] },
    { id: 'home',     label: ['Beranda', 'Home'],              nav: 'home',     subtab: null,     kw: ['beranda', 'home', 'utama', 'dashboard'] }
];

var GLOSSARY = {
    runway: ['Runway = berapa bulan uangmu bertahan dengan biaya bulanan sekarang (uang ÷ biaya bulanan). Di bawah 3 bulan itu zona bahaya.',
             'Runway = how many months your cash lasts at the current monthly cost (cash ÷ monthly cost). Under 3 months is the danger zone.'],
    burn:   ['Burn (biaya bulanan) = sewa HQ + utilitas + administrasi + gaji seluruh staf. Menambah staf langsung menaikkan burn.',
             'Burn (monthly cost) = HQ rent + utilities + admin + all staff salaries. Hiring raises burn immediately.'],
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
    campaign:['Ad campaigns push sales, most effective while a product is new (rise & peak phases). Needs a marketer.',
              'Ad campaigns push sales, most effective while a product is new (rise & peak phases). Needs a marketer.'],
    stok:   ['Stok = unit siap jual. Kalau habis penjualan berhenti. Aktifkan auto-restock agar produksi ulang otomatis.',
             'Stock = units ready to sell. At zero, sales stop. Enable auto-restock to re-produce automatically.'],
    stock:  ['Stock = units ready to sell. At zero, sales stop. Enable auto-restock to re-produce automatically.',
             'Stock = units ready to sell. At zero, sales stop. Enable auto-restock to re-produce automatically.']
};
GLOSSARY.stock[0] = GLOSSARY.stok[0];

// ------------------------------------------------------------
export class AdvisorBrain {
    // sys: AdvisorSystem (butuh _ctx(), getAdvice(), lang via sys.lang())
    constructor(sys) {
        this.sys = sys;
        this.mem = { last: null, lastProduct: null, depth: 0, turns: 0, asked: {} };
    }

    lang() { return this.sys._lang(); }
    L(id, en) { return this.lang() === 'id' ? id : en; }

    // ---------- skor kesehatan 0-100 ----------
    health() {
        var c = this.sys._ctx();
        var score = 100, notes = [];
        if (c.burn > 0) {
            if (c.cash < c.burn) { score -= 40; notes.push('cash'); }
            else if (c.runway < 3) { score -= 22; notes.push('cash'); }
            else if (c.runway < 6) { score -= 8; }
        }
        var adv = this.sys.getAdvice();
        adv.forEach(function (a) {
            if (a.sev === 'critical') score -= 12;
            else if (a.sev === 'warn') score -= 6;
        });
        if (!c.catalog.length) score -= 6;
        var staff = arr(c.d.staff);
        if (staff.length) {
            var avg = staff.reduce(function (s, x) { return s + (x.morale || 0); }, 0) / staff.length;
            if (avg < 50) score -= 8;
        }
        score = Math.max(5, Math.min(100, Math.round(score)));
        var label = score >= 80 ? this.L('Sangat baik', 'Excellent')
                  : score >= 60 ? this.L('Baik', 'Good')
                  : score >= 40 ? this.L('Waspada', 'Caution')
                  : this.L('Kritis', 'Critical');
        return { score: score, label: label };
    }

    // ---------- deteksi intent ----------
    _detect(text) {
        var toks = tokens(text);
        var scores = {}, self = this;
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
        // frasa khusus
        var n = norm(text);
        if (/apa (itu|arti|maksud)|what is|what does|apa yang dimaksud/.test(n)) scores.glossary += 3;
        if (/(apa|what).*(harus|should|lakukan|do)|(prioritas|priority)/.test(n)) scores.next += 3;
        if (/(bisa|can) .*(bertahan|survive)|kapan.*(habis|bangkrut)|berapa lama/.test(n)) scores.forecast += 3;
        if (/kondisi|keadaan|ringkasan|how am i|how is|gimana (bisnis|perusahaan)|status/.test(n)) scores.status += 2.5;
        if (/rekrut|hire|cari (staf|karyawan)/.test(n)) scores.team += 2;
        if (/(naik|tingkat|tambah)\w* (penjualan|sales)|jual lebih|(more|increase|boost|raise|improve) (my )?sales|sell more/.test(n)) scores.marketing += 4;
        // "habis" ambigu: stok vs uang
        if (/(uang|kas|cash|duit).*habis|habis.*(uang|kas|cash|duit)|running out of (cash|money)/.test(n)) { scores.forecast += 3; scores.stock -= 3; }
        if (/stok.*habis|habis.*stok|out of stock/.test(n)) { scores.stock += 3; scores.forecast -= 3; }

        var top = null, topS = 0, second = 0;
        Object.keys(scores).forEach(function (k) {
            if (k === 'more') return;
            if (scores[k] > topS) { second = topS; topS = scores[k]; top = k; }
            else if (scores[k] > second) second = scores[k];
        });
        // kalimat pendek lanjutan
        var moreScore = scores.more;
        var isFollow = toks.length <= 3 && moreScore >= 1 && topS < 2.5 && this.mem.last;
        var conf = top ? Math.min(1, (topS - second * 0.5) / 3) : 0;
        return { intent: top, score: topS, confidence: conf, follow: isFollow, toks: toks };
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
        // tolak jika kata "ke/to" saja tanpa target jelas
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

    // ---------- API utama ----------
    reply(text) {
        var m = this.mem;
        m.turns++;
        var nav = this._detectNav(text);
        if (nav) {
            m.last = 'navigate';
            return this._navigate(nav);
        }
        var d = this._detect(text);
        var prod = this._findProduct(text);
        if (prod) m.lastProduct = prod.id;

        var intent = d.intent;
        var detail = false;
        if (d.follow) { intent = m.last; detail = true; m.depth++; }
        else if (prod && (!intent || ['stock', 'marketing'].indexOf(intent) < 0 || d.score < 2.5)) { intent = 'product'; }
        else m.depth = 0;

        var minScore = prod ? 1 : 1.5;
        if (!intent || (!d.follow && d.score < minScore)) {
            return this._fallback(text);
        }
        var res = this._handle(intent, { detail: detail || m.depth > 0, text: text, product: prod, toks: d.toks });
        res.intent = intent;
        res.confidence = d.confidence;
        m.last = intent;
        return res;
    }

    // Jawaban pembuka saat panel dibuka.
    greeting() {
        var h = this.health();
        var adv = this.sys.getAdvice();
        var top = adv[0];
        var txt;
        if (top && top.id !== 'all_good') {
            txt = this.L('Halo! Skor kesehatan bisnismu **' + h.score + '/100** (' + h.label + '). Hal terpenting sekarang: **' + top.title + '**. Mau aku jelaskan atau antar langsung?',
                         'Hi! Your business health is **' + h.score + '/100** (' + h.label + '). Most important right now: **' + top.title + '**. Want me to explain or take you there?');
        } else {
            txt = this.L('Halo! Skor kesehatan bisnismu **' + h.score + '/100** (' + h.label + '). Semua terkendali, mau bahas strategi ke depan?',
                         'Hi! Your business health is **' + h.score + '/100** (' + h.label + '). Everything is under control; want to talk strategy?');
        }
        return { text: txt, actions: top && top.action ? [this._actionFor(top)] : [], chips: this.chips(), intent: 'greet', confidence: 1 };
    }

    chips() {
        var c = this.sys._ctx();
        var out = [this.L('Apa prioritas sekarang?', 'What should I do now?'),
                   this.L('Kondisi bisnis', 'Business status')];
        if (c.burn > 0) out.push(this.L('Prediksi uang', 'Cash forecast'));
        if (c.catalog.length) out.push(this.L('Analisis produk', 'Analyze products'));
        else out.push(this.L('Rencana awal', 'Starter plan'));
        out.push(this.L('Buka riset', 'Open research'));
        return out.slice(0, 5);
    }

    _actionFor(a) {
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

    // ---------- handler ----------
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
        var base = this.L('Hmm, aku belum yakin maksudmu. Aku paham soal uang, tim, riset, produk, stok, kampanye, OS, chip, moral, dan reputasi. Coba tanya seperti "kenapa uangku cepat habis?" atau "buka riset".',
                          'Hmm, I\'m not sure what you mean. I know about cash, team, research, products, stock, campaigns, OS, chips, morale and reputation. Try "why is my cash dropping?" or "open research".');
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
            cash: [L('Prediksi uang', 'Cash forecast'), L('Cara hemat', 'How to save'), L('Apa prioritas sekarang?', 'What should I do now?')],
            forecast: [L('Cara hemat', 'How to save'), L('Kondisi bisnis', 'Business status')],
            status: [L('Apa prioritas sekarang?', 'What should I do now?'), L('Prediksi uang', 'Cash forecast'), L('Analisis produk', 'Analyze products')],
            next: [L('Kenapa?', 'Why?'), L('Rencana awal', 'Starter plan'), L('Kondisi bisnis', 'Business status')],
            product: [L('Cek stok', 'Check stock'), L('Perlu kampanye?', 'Need a campaign?'), L('Kapan buat produk baru?', 'When to make a new one?')],
            stock: [L('Analisis produk', 'Analyze products'), L('Perlu kampanye?', 'Need a campaign?')],
            research: [L('Rekrut engineer?', 'Hire engineers?'), L('Buka riset', 'Open research')],
            team: [L('Cek moral tim', 'Check morale'), L('Kondisi bisnis', 'Business status')]
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
            'Aku bisa:\n• Menilai **kondisi bisnis** + skor kesehatan\n• Menentukan **prioritas** sekarang & **rencana** langkah demi langkah\n• Menganalisis **uang**, **prediksi kas**, produk, stok, tim, riset, OS, chip\n• Menjelaskan istilah (runway, burn, moral…)\n• **Navigasi**: "buka riset", "ke tim", "lihat penjualan"\n\nTanya bebas, aku mengerti bahasa sehari-hari.',
            'I can:\n• Rate your **business health** with a score\n• Pick current **priorities** and give a step-by-step **plan**\n• Analyze **cash**, **forecast**, products, stock, team, research, OS, chips\n• Explain terms (runway, burn, morale…)\n• **Navigate**: "open research", "go to team", "show sales"\n\nAsk freely; I understand everyday language.'),
            chips: this.chips() };
    }

    _h_status(o) {
        var c = this.sys._ctx(), h = this.health(), adv = this.sys.getAdvice();
        var L = this.L.bind(this);
        var lines = [L('Skor kesehatan bisnis: **' + h.score + '/100** (' + h.label + ')',
                       'Business health: **' + h.score + '/100** (' + h.label + ')')];
        lines.push(L('• Uang $' + money(c.cash) + ' · biaya $' + money(c.burn) + '/bulan · ' + (isFinite(c.runway) ? 'runway ' + c.runway.toFixed(1) + ' bln' : 'belum ada biaya'),
                     '• Cash $' + money(c.cash) + ' · cost $' + money(c.burn) + '/mo · ' + (isFinite(c.runway) ? 'runway ' + c.runway.toFixed(1) + ' mo' : 'no costs yet')));
        lines.push(L('• Tim: ' + c.team.engineers + ' engineer, ' + c.team.designers + ' desainer, ' + c.team.marketers + ' marketer',
                     '• Team: ' + c.team.engineers + ' engineers, ' + c.team.designers + ' designers, ' + c.team.marketers + ' marketers'));
        lines.push(L('• Produk: ' + c.catalog.length + ' (' + c.selling.length + ' dijual)', '• Products: ' + c.catalog.length + ' (' + c.selling.length + ' on sale)'));
        var top = adv.filter(function (a) { return a.id !== 'all_good'; }).slice(0, 2);
        if (top.length) {
            lines.push(L('\nPerlu perhatian:', '\nNeeds attention:'));
            top.forEach(function (a) { lines.push('• ' + a.title); });
        } else lines.push(L('\nTidak ada masalah mendesak.', '\nNothing urgent.'));
        var acts = top.filter(function (a) { return a.action; }).slice(0, 2).map(this._actionFor, this);
        return { text: lines.join('\n'), actions: acts };
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
        var lines = [L('Prioritas #1: **' + top.title + '**', 'Priority #1: **' + top.title + '**'), top.detail];
        if (o.detail && adv[1]) lines.push(L('\nSetelah itu: **' + adv[1].title + '** — ' + adv[1].detail, '\nThen: **' + adv[1].title + '** — ' + adv[1].detail));
        if (o.detail && adv[2]) lines.push(L('Lalu: **' + adv[2].title + '**', 'Then: **' + adv[2].title + '**'));
        if (!o.detail && adv.length > 1) lines.push(L('\nAda ' + (adv.length - 1) + ' saran lain. Ketik "lanjut" untuk lihat.', '\n' + (adv.length - 1) + ' more suggestions. Type "more" to see them.'));
        var acts = [];
        if (top.action) acts.push(this._actionFor(top));
        if (o.detail && adv[1] && adv[1].action) acts.push(this._actionFor(adv[1]));
        return { text: lines.join('\n'), actions: acts };
    }

    _h_why(o) {
        var last = this.mem.last;
        if (last && ['why', 'navigate', 'greet', 'thanks', 'help', 'unknown', 'more'].indexOf(last) < 0) {
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
            steps.push(L('Pastikan **stok** produk laris tidak habis (auto-restock).', 'Keep best sellers **in stock** (auto-restock).')); acts.push(this._act('sales'));
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
        var payroll = arr(c.d.staff).reduce(function (a, s) { return a + (s.salary || 0); }, 0);
        var share = c.burn > 0 ? Math.round(payroll / c.burn * 100) : 0;
        var lines = [L('Uang **$' + money(c.cash) + '**, biaya **$' + money(c.burn) + '/bulan** → runway **' + c.runway.toFixed(1) + ' bulan**.',
                       'Cash **$' + money(c.cash) + '**, cost **$' + money(c.burn) + '/mo** → runway **' + c.runway.toFixed(1) + ' months**.')];
        lines.push(L('Gaji staf ≈ ' + share + '% dari biaya bulanan.', 'Payroll ≈ ' + share + '% of monthly cost.'));
        if (c.cash < c.burn) lines.push(L('⚠ Kritis: uang kurang dari satu bulan biaya. Jual stok, tunda riset/rekrutmen, atau ambil pinjaman di Setelan.', 'Critical: cash is below one month of costs. Sell stock, delay research/hiring, or take a loan in Settings.'));
        else if (c.runway < 3) lines.push(L('Hati-hati: di bawah 3 bulan. Tahan rekrutmen sampai penjualan stabil.', 'Careful: under 3 months. Hold off hiring until sales stabilize.'));
        else if (c.runway >= 6) lines.push(L('Sehat. Ada ruang untuk investasi riset atau produk baru.', 'Healthy. You have room to invest in research or a new product.'));
        else lines.push(L('Cukup aman, tapi pantau saat menambah staf.', 'Reasonably safe, but watch it when hiring.'));
        if (o.detail) {
            lines.push(L('\nCara menaikkan runway: (1) naikkan penjualan lewat kampanye, (2) jaga stok, (3) hindari rekrut sebelum produk laku, (4) pinjaman hanya sebagai jaring pengaman.',
                         '\nWays to extend runway: (1) lift sales with campaigns, (2) keep stock, (3) avoid hiring before products sell, (4) loans only as a safety net.'));
        }
        return { text: lines.join('\n'), actions: [c.cash < c.burn ? this._act('settings') : this._act('sales')].filter(Boolean) };
    }

    _h_forecast() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        if (c.burn <= 0) return { text: L('Belum ada biaya bulanan, jadi belum ada yang perlu diprediksi.', 'No monthly costs yet, nothing to forecast.') };
        var lines = [L('Jika **tanpa pemasukan** dan biaya tetap $' + money(c.burn) + '/bulan:', 'With **no revenue** and costs fixed at $' + money(c.burn) + '/mo:')];
        [1, 3, 6].forEach(function (m) {
            var v = c.cash - c.burn * m;
            lines.push('• ' + m + L(' bulan: ', ' mo: ') + (v >= 0 ? '$' + money(v) : L('HABIS (kurang $', 'BROKE (short $') + money(-v) + ')'));
        });
        var zero = c.runway;
        lines.push(L('Uang habis sekitar **' + zero.toFixed(1) + ' bulan** lagi.', 'Cash runs out in about **' + zero.toFixed(1) + ' months**.'));
        if (c.selling.length) lines.push(L('Kamu sudah menjual produk, jadi kenyataannya lebih baik dari angka ini selama stok tersedia.', 'You are selling products, so reality beats this as long as stock lasts.'));
        else lines.push(L('Belum ada produk dijual; rilis produk pertama adalah cara tercepat memperpanjang napas.', 'No products on sale yet; releasing your first one is the fastest way to extend your runway.'));
        return { text: lines.join('\n'), actions: [this._act(c.selling.length ? 'sales' : 'design')].filter(Boolean) };
    }

    _h_research() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var r = c.d.research || {};
        var active = arr(r.active), max = r.maxSlots || 1;
        var lines = [L('Slot riset: **' + active.length + '/' + max + '** terpakai, ' + arr(r.completed).length + ' riset selesai.',
                       'Research slots: **' + active.length + '/' + max + '** used, ' + arr(r.completed).length + ' researched.')];
        if (active.length) lines.push(L('Sedang berjalan: ' + active.map(function (e) { return e.name; }).join(', ') + '.', 'In progress: ' + active.map(function (e) { return e.name; }).join(', ') + '.'));
        var idle = this.sys.getAdvice({ includeSnoozed: true }).filter(function (a) { return a.id === 'research_idle'; })[0];
        if (idle) lines.push('• ' + idle.detail);
        else if (active.length >= max) lines.push(L('Slot penuh. Tambah engineer untuk membuka slot berikutnya.', 'Slots full. Hire engineers to unlock the next slot.'));
        lines.push(L('Tips: riset murah dulu untuk cepat menaikkan skor produk; Silicon bisa mempercepat/membuka riset.', 'Tip: cheap research first to quickly raise product score; Silicon can speed up/unlock research.'));
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
        if (!(t.engineers + t.designers + t.marketers)) lines.push(L('Mulai dari engineer; ia membuka riset.', 'Start with an engineer; it unlocks research.'));
        else if (!t.designers && !c.catalog.length) lines.push(L('Kamu butuh desainer sebelum merancang ponsel.', 'You need a designer before designing a phone.'));
        else if (!t.marketers && c.selling.length) lines.push(L('Sudah menjual produk: rekrut marketer untuk kampanye.', 'You are selling: hire a marketer for campaigns.'));
        else lines.push(L('Komposisi tim sudah masuk akal. Tambah staf hanya jika runway > 3 bulan.', 'Team mix looks reasonable. Only add staff if runway > 3 months.'));
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
        var list = o.product ? [o.product]
                 : (this.mem.lastProduct && o.detail ? c.catalog.filter(function (p, i, a) { return p.id === this.mem.lastProduct; }, this) : c.catalog);
        if (!list.length) list = c.catalog;
        var self = this;
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
        var out = [], low = [], ok = 0;
        c.selling.forEach(function (p) {
            var cap = p.baseCapacity || p.totalProduced || 0;
            if ((p.stock || 0) <= 0) out.push(p.name);
            else if (cap && p.stock < cap * 0.2) low.push(p.name + ' (' + money(p.stock) + ')');
            else ok++;
        });
        var lines = [];
        if (out.length) lines.push(L('**Habis:** ', '**Out:** ') + out.join(', ') + L(' — penjualan berhenti, produksi ulang sekarang!', ' — sales stopped, re-produce now!'));
        if (low.length) lines.push(L('**Menipis:** ', '**Low:** ') + low.join(', '));
        if (ok) lines.push(L(ok + ' produk stoknya aman.', ok + ' product(s) well stocked.'));
        if (out.length || low.length) lines.push(L('Aktifkan auto-restock agar tidak kehilangan penjualan.', 'Enable auto-restock to avoid lost sales.'));
        return { text: lines.join('\n'), actions: [this._act('sales')] };
    }

    _h_marketing() {
        var c = this.sys._ctx(), L = this.L.bind(this);
        var camps = arr((c.d.marketing || {}).activeCampaigns);
        var lines = [L('Kampanye aktif: **' + camps.length + '**.', 'Active campaigns: **' + camps.length + '**.')];
        if (!c.team.marketers) lines.push(L('Kamu belum punya marketer; rekrut dulu untuk memperbesar jangkauan.', 'No marketer yet; hire one to widen reach.'));
        var cand = this.sys.getAdvice({ includeSnoozed: true }).filter(function (a) { return a.id.indexOf('campaign') === 0; })[0];
        if (cand) lines.push('• ' + cand.title + ' — ' + cand.detail);
        else if (c.selling.length) lines.push(L('Semua produk baru sudah punya kampanye atau sudah lewat masa efektif.', 'All new products have campaigns or are past the effective window.'));
        else lines.push(L('Rilis produk dulu, baru kampanye berguna.', 'Release a product first; campaigns help after that.'));
        lines.push(L('Kampanye paling efektif di fase naik & puncak produk.', 'Campaigns work best in a product\'s rise & peak phases.'));
        return { text: lines.join('\n'), actions: [this._act('sales'), c.team.marketers ? null : this._act('team')].filter(Boolean) };
    }

    _h_os() {
        var c = this.sys._ctx(), L = this.L.bind(this), o = c.d.os || {};
        var v = arr(o.versions).length, b = arr(o.bugs).length;
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
        return { text: this.L('Istilah mana yang ingin kamu ketahui? Contoh: runway, burn, moral, fab, kampanye, stok, reputasi, silicon.', 'Which term? For example: runway, burn, morale, fab, campaign, stock, reputation, silicon.') };
    }
}
