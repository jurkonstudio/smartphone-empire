// FILE: src/systems/AdvisorBrain.js
// v2028.40 — "Otak" lokal Asisten Bisnis. Tanpa server / API key.
import { ToastService } from '../../core/ToastService.js';

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
    // [UPGRADE BARU] Intent untuk Pasar
    market:    { w: 1.5, kw: ['pasar', 'market', 'tren', 'trend', 'saham', 'bursa', 'kompetitor', 'saingan', 'pangsa', 'share'] },
    // ... sisa intent asli Anda (research, team, product, price, stock, dll) tetap ada di bawah ini ...
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
    more:      { w: 0.5, kw: ['lanjut', 'detail', 'lagi', 'terus', 'jelasin', 'jelaskan', 'lengkap', 'more', 'continue', 'elaborate', 'next', 'oke', 'ok', 'ya', 'yes', 'iya', 'boleh'] }
};

var INTENT_LABEL = {
    status: ['kondisi bisnis', 'business status'], health: ['skor kesehatan', 'health score'],
    next: ['prioritas sekarang', 'priorities'], plan: ['rencana', 'plan'], cash: ['uang & arus kas', 'cash & cash flow'],
    loan: ['pinjaman', 'loans'], forecast: ['prediksi uang', 'cash forecast'], market: ['pasar & pesaing', 'market & rivals'],
    research: ['riset', 'research'], team: ['tim', 'team'], product: ['produk', 'products'],
    price: ['harga & margin', 'price & margin'], stock: ['stok', 'stock'], marketing: ['kampanye', 'campaigns'],
    os: ['OS', 'OS'], chip: ['chip & fab', 'chips & fab'], morale: ['moral tim', 'team morale'],
    reputation: ['reputasi', 'reputation'], competitor: ['pesaing & pasar', 'rivals & market'],
    whatif: ['simulasi', 'simulation']
};

INTENT_LABEL.briefing = ['perubahan terbaru', 'recent changes'];
INTENT_LABEL.bug = ['masalah aplikasi', 'app problem'];
INTENT_LABEL.patch = ['patch & pembaruan', 'patches & updates'];

var ALERT_TEXT = {
    CASH_NAN: ['Nilai uang rusak (bukan angka). Data save kemungkinan korup.', 'Cash value is broken (not a number). Save data may be corrupted.'],
    // ... (sisa ALERT_TEXT asli Anda)
};

var NAV_STRONG = ['buka', 'open', 'pergi', 'tampilkan', 'show', 'lihat', 'menuju', 'bawa', 'antar', 'navigate', 'arahkan', 'masuk'];
var NAV_WEAK = ['ke', 'to', 'go'];
var NAV_VERBS = NAV_STRONG.concat(NAV_WEAK);
var NAV_TARGETS = [
    // ... (salin NAV_TARGETS asli Anda)
    { id: 'market',   label: ['Pasar', 'Market'],              nav: 'market',   subtab: null,     kw: ['pasar', 'market', 'saham', 'kompetitor', 'saingan', 'pesaing'] }
];

var GLOSSARY = {
    // ... (salin GLOSSARY asli Anda)
};

var HEALTH_ACTION = {
    liquidity: { nav: 'products', subtab: 'sales', id: 'sales' },
    growth:    { nav: 'products', subtab: 'sales', id: 'sales' },
    product:   { nav: 'products', subtab: 'design', id: 'design' },
    team:      { nav: 'team', subtab: null, id: 'team' },
    tech:      { nav: 'research', subtab: 'tech', id: 'research' },
    brand:     { nav: 'market', subtab: null, id: 'market' }
};

// ------------------------------------------------------------
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
        // ... (logika phrase khusus asli Anda)
        
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

    // ... (Fungsi _detectNav, _findProduct, reply, _run, _combo, _setList, _detectRef, _runRef asli Anda)

    reply(text) {
        // (Logika utuh dari kode asli Anda yang memproses intent, fallback, dsb)
        var d = this._detect(text);
        if (!d.intent) return this._fallback(text);
        
        var intent = d.intent;
        if (d.follow) { intent = this['_h_' + this.mem.last] ? this.mem.last : 'next'; }
        
        return this._run(intent, { detail: d.follow, text: text, toks: d.toks }, d.confidence);
    }

    _run(intent, o, conf) {
        var m = this.mem;
        m.asked[intent] = (m.asked[intent] || 0) + 1;
        var detail = o.detail || m.depth > 0 || m.asked[intent] > 1;
        o.detail = detail;
        
        // Panggil fungsi handler
        var res = this._handle(intent, o);
        res.intent = intent;
        res.confidence = conf;
        m.last = intent;
        return res;
    }

    // [UPGRADE BARU] Handler Prediksi Kas
    _h_prediction() {
        var c = this.sys._ctx();
        var L = this.L.bind(this);
        
        if (c.burn <= 0) return { text: L("Belum ada biaya bulanan, jadi belum ada yang perlu diprediksi.", "No monthly costs yet, nothing to predict.") };

        var f = this.sys.forecast(6); // Fungsi dari AdvisorSystem
        var txt = L("Prakiraan kas (biaya + cicilan $" + money(f.outflow) + "/bulan):\n", "Cash forecast (costs + installments $" + money(f.outflow) + "/mo):\n");
        
        txt += L("• Uangmu saat ini: $" + money(c.cash) + "\n", "• Current cash: $" + money(c.cash) + "\n");
        txt += L("• Jika tanpa pemasukan: habis dalam " + f.runwayWorst.toFixed(1) + " bulan.\n", "• No revenue: lasts " + f.runwayWorst.toFixed(1) + " months.\n");
        
        if (c.income > 0) {
            txt += L("• Dengan pemasukan saat ini: habis dalam " + f.runwayBase.toFixed(1) + " bulan.\n", "• With current revenue: lasts " + f.runwayBase.toFixed(1) + " months.\n");
        }
        
        txt += L("\nSaran: Jaga runway di atas 6 bulan. Jika di bawah 3 bulan, segera lakukan efisiensi.", "\nTip: Keep runway above 6 months. If under 3 months, cut costs immediately.");

        return { text: txt, actions: [this._act('sales')] };
    }

    // [UPGRADE BARU] Handler Informasi Pasar
    _h_market() {
        var c = this.sys._ctx();
        var market = c.d.market || {};
        var share = market.share || 0;
        
        var txt = this.L("Kondisi Pasar Saat Ini:\n", "Current Market Condition:\n");
        txt += this.L("• Pangsa pasar Anda: **" + (share * 100).toFixed(2) + "%**\n", "• Your market share: **" + (share * 100).toFixed(2) + "%**\n");
        
        var comps = (market.competitors || []).sort(function(a,b){ return b.share - a.share; });
        if (comps.length > 0) {
            txt += this.L("• Pesaing terkuat: " + comps[0].name + " (" + (comps[0].share * 100).toFixed(1) + "%)\n", "• Top competitor: " + comps[0].name + " (" + (comps[0].share * 100).toFixed(1) + "%)\n");
        }
        
        txt += this.L("\nSaran: Cek tab Pasar untuk melihat tren konsumen. Jika tren naik (misal: kamera), rilis produk dengan spesifikasi tersebut.", "\nTip: Check the Market tab to see consumer trends. If a trend is rising (e.g., camera), release a product with those specs.");
        
        return { text: txt, actions: [this._act('market')] };
    }

    // (Fungsi-fungsi handler _h_cash, _h_status, _h_health, _h_whatif, dll tetap ada)

    _handle(intent, o) {
        // [UPGRADE BARU] Mapping intent baru ke handler-nya
        if (intent === 'prediction' || intent === 'forecast') return this._h_prediction(o);
        if (intent === 'market' || intent === 'competitor') return this._h_market(o);
        
        var f = this['_h_' + intent];
        var r = f ? f.call(this, o) : null;
        if (!r) return this._fallback(o.text);
        if (!r.chips) r.chips = this._followChips(intent);
        if (!r.actions) r.actions = [];
        return r;
    }

    _act(id) {
        var tg = NAV_TARGETS.filter(function (t) { return t.id === id; })[0];
        if (!tg) return null;
        return { label: this.L('Buka ' + tg.label[0], 'Open ' + tg.label[1]), nav: tg.nav, subtab: tg.subtab };
    }
    
    // (Sisa fungsi _fallback, _followChips, dsb.)
}
