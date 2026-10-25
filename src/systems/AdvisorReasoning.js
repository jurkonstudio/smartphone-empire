// FILE: src/systems/AdvisorReasoning.js
// v2029.0 — Mesin penalaran analitis untuk Asisten Bisnis.
// Modul murni (pure): tanpa DOM, tanpa state global, tanpa jaringan.
// Input : objek konteks dari AdvisorSystem._ctx().
// Output: laporan terstruktur (level risiko, temuan berbukti angka, rencana tindakan).
//
// Asumsi model (disamakan dengan AdvisorSystem.simulate / forecast):
//   - outflow bulanan = burn (sewa + utilitas + admin + gaji) + cicilan pinjaman
//   - pemasukan bulanan = rata-rata pendapatan 3 periode terakhir (c.income)
//   - penjualan harian dari c.trends.salesRecent, dikonversi x30 untuk estimasi bulanan
//   - pinjaman baru: bunga 3% per periode, tenor 12 periode (anuitas)

var LOAN_RATE = 0.03;
var LOAN_TERM = 12;

var LEVEL_ORDER = ['low', 'medium', 'high', 'critical'];
var SEV_WEIGHT = { critical: 100, high: 70, medium: 40, low: 10 };
var SEV_PENALTY = { critical: 35, high: 20, medium: 10, low: 0 };

// ------------------------------------------------------------
// Util
// ------------------------------------------------------------
function num(x, d) {
    var v = Number(x);
    return isFinite(v) ? v : (d || 0);
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function money(n) { return Math.round(num(n)).toLocaleString('en-US'); }
function pct(x) { return isFinite(x) ? Math.round(x * 100) + '%' : '—'; }
function mo(x, isId) {
    if (!isFinite(x)) return isId ? 'tak terbatas' : 'unlimited';
    return x.toFixed(1) + (isId ? ' bln' : ' mo');
}
// Bulan sampai kas habis pada defisit tertentu (Infinity jika tidak defisit).
function monthsUntilZero(cash, deficit) {
    return deficit > 0 ? Math.max(0, cash) / deficit : Infinity;
}
function worse(a, b) {
    return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

// Anuitas: cicilan bulanan untuk pokok tertentu (identik dengan simulate()).
export function amortInstallment(principal, rate, term) {
    var p = num(principal);
    var r = (rate === undefined) ? LOAN_RATE : rate;
    var n = term || LOAN_TERM;
    if (p <= 0) return 0;
    return p * r / (1 - Math.pow(1 + r, -n));
}

// ------------------------------------------------------------
// 0. Validasi data (guardrail): jangan menebak jika input rusak.
// ------------------------------------------------------------
export function validate(c) {
    var bad = [];
    ['cash', 'burn', 'income', 'debtService'].forEach(function (k) {
        if (!isFinite(Number(c && c[k]))) bad.push(k);
    });
    return { ok: bad.length === 0, bad: bad };
}

// ------------------------------------------------------------
// 1. Likuiditas: runway, tren kas, dan uji stres pemasukan.
// ------------------------------------------------------------
export function liquidity(c) {
    var cash = num(c.cash);
    var income = num(c.income);
    var outflow = num(c.burn) + num(c.debtService);
    var net = income - outflow;

    var stress = [0.3, 0.5].map(function (drop) {
        var n = income * (1 - drop) - outflow;
        return { drop: drop, net: n, months: monthsUntilZero(cash, -n) };
    });

    var runway = outflow > 0 ? Math.max(0, cash) / outflow : Infinity;
    var trendMonths = monthsUntilZero(cash, -net);

    var level = 'low';
    if (runway < 1 || trendMonths < 2) level = 'critical';
    else if (runway < 3 || trendMonths < 4) level = 'high';
    else if (trendMonths < 6 || net < 0) level = 'medium';

    return {
        cash: cash, outflow: outflow, net: net,
        runway: runway, trendMonths: trendMonths,
        coverRatio: outflow > 0 ? income / outflow : Infinity,
        stress: stress, level: level
    };
}

// ------------------------------------------------------------
// 2. Ekonomi unit: margin, titik impas, dan cakupan kontribusi.
// ------------------------------------------------------------
export function unitEconomics(c) {
    var rows = (c.catalog || []).filter(function (p) { return num(p.price) > 0; }).map(function (p) {
        var price = num(p.price), cost = num(p.unitCost);
        var contrib = price - cost;
        var margin = contrib / price;
        var flag = margin < 0 ? 'loss' : margin < 0.12 ? 'thin' : margin > 0.45 ? 'rich' : 'healthy';
        return {
            id: p.id, name: p.name, status: p.status, stock: num(p.stock),
            price: price, unitCost: cost, contrib: contrib, margin: margin, flag: flag
        };
    }).sort(function (a, b) { return a.margin - b.margin; });

    var selling = rows.filter(function (r) { return r.status === 'selling'; });
    var avgContrib = selling.length
        ? selling.reduce(function (s, r) { return s + r.contrib; }, 0) / selling.length
        : 0;

    var unitsPerMonth = Math.max(0, num(c.trends && c.trends.salesRecent)) * 30;
    var fixedOutflow = num(c.burn) + num(c.debtService);
    var monthlyContribution = unitsPerMonth * avgContrib;

    return {
        rows: rows,
        selling: selling,
        avgContrib: avgContrib,
        unitsPerMonth: unitsPerMonth,
        breakevenUnits: avgContrib > 0 ? fixedOutflow / avgContrib : Infinity,
        coverage: fixedOutflow > 0 ? monthlyContribution / fixedOutflow : Infinity,
        outOfStock: selling.filter(function (r) { return r.stock <= 0; })
    };
}

// ------------------------------------------------------------
// 3. Kesehatan utang: rasio cicilan terhadap pemasukan, dan gagal bayar.
// ------------------------------------------------------------
export function debtHealth(c) {
    var income = num(c.income), debt = num(c.debtService);
    var ratio = income > 0 ? debt / income : (debt > 0 ? Infinity : 0);
    var missed = (c.loans || []).filter(function (l) { return num(l.missed) > 0; }).length;
    var level = missed > 0 ? 'critical'
              : ratio > 0.4 ? 'high'
              : ratio > 0.25 ? 'medium'
              : 'low';
    return { ratio: ratio, missed: missed, level: level };
}

// ------------------------------------------------------------
// 4. Momentum: arah penjualan dan perubahan skor kesehatan.
// ------------------------------------------------------------
export function momentum(c) {
    var t = c.trends || {};
    var drop = t.salesDrop;
    var signal = 'stable', level = 'low';
    if (typeof drop === 'number') {
        if (drop > 0.3) { signal = 'declining'; level = 'high'; }
        else if (drop > 0.15) { signal = 'softening'; level = 'medium'; }
        else if (drop < -0.2) { signal = 'accelerating'; }
    }
    if (typeof t.healthDelta === 'number' && t.healthDelta <= -8) level = worse(level, 'medium');
    return { signal: signal, level: level, salesDrop: drop, healthDelta: t.healthDelta };
}

// ------------------------------------------------------------
// 5. Simulasi keputusan: pinjaman dan perekrutan (dengan kebutuhan pemasukan).
// ------------------------------------------------------------
export function evaluateLoan(c, amount) {
    var amt = Math.max(0, num(amount));
    var base = liquidity(c);
    var inst = amortInstallment(amt);
    var outflowAfter = base.outflow + inst;
    var cashAfter = base.cash + amt;
    var income = num(c.income);
    var netAfter = income - outflowAfter;
    var debtRatioAfter = income > 0 ? (num(c.debtService) + inst) / income : Infinity;
    var trendAfter = monthsUntilZero(cashAfter, -netAfter);

    var verdict = 'ok';
    if (netAfter < 0 && trendAfter < 6) verdict = 'reject';
    else if (debtRatioAfter > 0.4 || (outflowAfter > 0 && cashAfter / outflowAfter < 3)) verdict = 'caution';

    return {
        amount: amt, installment: inst,
        totalInterest: inst * LOAN_TERM - amt,
        cashAfter: cashAfter, netAfter: netAfter,
        runwayAfter: outflowAfter > 0 ? cashAfter / outflowAfter : Infinity,
        trendAfter: trendAfter, debtRatioAfter: debtRatioAfter,
        verdict: verdict
    };
}

export function evaluateHire(c, role, n, salary) {
    var k = Math.max(0, Math.floor(num(n, 1)));
    var addBurn = k * num(salary);
    var outflow = num(c.burn) + num(c.debtService) + addBurn;
    var cash = num(c.cash);
    var net = num(c.income) - outflow;
    var verdict = net >= 0 ? 'ok'
                : monthsUntilZero(cash, -net) < 6 ? 'reject'
                : 'caution';
    return {
        role: role, count: k, addBurn: addBurn, net: net,
        gapPerMonth: Math.max(0, -net),
        runwayAfter: outflow > 0 ? cash / outflow : Infinity,
        verdict: verdict
    };
}

// ------------------------------------------------------------
// 6. Laporan terpadu: temuan berbukti + rencana tindakan berurutan.
// ------------------------------------------------------------
var ACTION_MAP = {
    liquidity: { nav: 'products', subtab: 'sales',
        id: 'Tambah pemasukan atau tekan biaya: prioritaskan produk dengan kontribusi terbesar dan pastikan stok tersedia.',
        en: 'Raise income or cut costs: focus on the products with the biggest contribution and keep them in stock.' },
    unit: { nav: 'products', subtab: 'design',
        id: 'Perbaiki margin produk yang tipis atau merugi (harga naik, atau biaya unit diturunkan lewat riset/fab).',
        en: 'Fix thin or negative margins (raise price, or lower unit cost through research/fab).' },
    coverage: { nav: 'products', subtab: 'sales',
        id: 'Naikkan volume penjualan: kampanye iklan saat produk masih baru lebih efektif.',
        en: 'Grow sales volume: ad campaigns work best while a product is still new.' },
    stockout: { nav: 'products', subtab: 'sales',
        id: 'Isi ulang stok produk yang habis, atau aktifkan auto-restock.',
        en: 'Restock products that ran out, or enable auto-restock.' },
    debt: { nav: 'settings', subtab: null,
        id: 'Tahan pinjaman baru dan lunasi sebagian pokok agar cicilan di bawah ~25% pemasukan.',
        en: 'Hold new loans and prepay part of the principal to bring installments under ~25% of revenue.' },
    momentum: { nav: 'market', subtab: null,
        id: 'Periksa penyebab penurunan penjualan: bandingkan harga dengan pesaing dan cek ulasan publik.',
        en: 'Find the cause of the sales drop: compare your prices with rivals and check public reviews.' }
};

export function buildReport(c, isId) {
    var v = validate(c);
    if (!v.ok) return { ok: false, bad: v.bad, level: 'unknown', score: 0, findings: [], actions: [] };

    var T = function (id, en) { return isId ? id : en; };
    var L = liquidity(c), U = unitEconomics(c), D = debtHealth(c), M = momentum(c);
    var findings = [];
    var add = function (key, level, text) { findings.push({ key: key, level: level, text: text }); };

    if (L.level !== 'low') {
        add('liquidity', L.level, T(
            'Runway ' + mo(L.runway, true) + '; pada arus kas sekarang kas habis dalam ~' + mo(L.trendMonths, true) + '.',
            'Runway ' + mo(L.runway, false) + '; at the current cash flow, cash runs out in ~' + mo(L.trendMonths, false) + '.'));
    }
    if (L.stress[0].months < 6) {
        add('liquidity', 'medium', T(
            'Jika pemasukan turun 30%, kas habis dalam ~' + mo(L.stress[0].months, true) + '.',
            'If revenue drops 30%, cash runs out in ~' + mo(L.stress[0].months, false) + '.'));
    }

    var losing = U.rows.filter(function (r) { return r.flag === 'loss'; });
    var thin = U.rows.filter(function (r) { return r.flag === 'thin'; });
    if (losing.length) {
        add('unit', 'high', T(
            'Merugi per unit: ' + losing.slice(0, 2).map(function (r) { return r.name; }).join(', ') + '.',
            'Losing money per unit: ' + losing.slice(0, 2).map(function (r) { return r.name; }).join(', ') + '.'));
    } else if (thin.length) {
        add('unit', 'medium', T(
            'Margin tipis (<12%): ' + thin.slice(0, 2).map(function (r) { return r.name; }).join(', ') + '.',
            'Thin margin (<12%): ' + thin.slice(0, 2).map(function (r) { return r.name; }).join(', ') + '.'));
    }

    if (isFinite(U.coverage) && U.coverage < 1) {
        add('coverage', U.coverage < 0.5 ? 'high' : 'medium', T(
            'Kontribusi margin hanya menutup ' + pct(U.coverage) + ' dari biaya bulanan (titik impas ~' +
                Math.ceil(U.breakevenUnits) + ' unit/bulan, estimasi penjualan ~' + Math.round(U.unitsPerMonth) + ').',
            'Contribution margin covers only ' + pct(U.coverage) + ' of monthly costs (break-even ~' +
                Math.ceil(U.breakevenUnits) + ' units/mo, estimated sales ~' + Math.round(U.unitsPerMonth) + ').'));
    }
    if (U.outOfStock.length) {
        add('stockout', 'medium', T(
            U.outOfStock.length + ' produk aktif kehabisan stok, penjualannya berhenti.',
            U.outOfStock.length + ' active product(s) out of stock; their sales have stopped.'));
    }

    if (D.level !== 'low') {
        add('debt', D.level, D.missed
            ? T(D.missed + ' pinjaman gagal bayar. Prioritas pertama.', D.missed + ' loan(s) missed payments. Top priority.')
            : T('Cicilan ' + pct(D.ratio) + ' dari pemasukan (batas aman ~25%).',
                'Installments are ' + pct(D.ratio) + ' of revenue (safe limit ~25%).'));
    }
    if (M.level !== 'low') {
        add('momentum', M.level, T(
            'Penjualan turun ' + pct(M.salesDrop) + ' dibanding periode sebelumnya.',
            'Sales fell ' + pct(M.salesDrop) + ' versus the previous period.'));
    }

    var overall = 'low';
    var penalty = 0;
    findings.forEach(function (f) { overall = worse(overall, f.level); penalty += SEV_PENALTY[f.level] || 0; });

    var actions = findings
        .filter(function (f) { return f.level !== 'low' && ACTION_MAP[f.key]; })
        .sort(function (a, b) { return SEV_WEIGHT[b.level] - SEV_WEIGHT[a.level]; })
        .reduce(function (acc, f) {
            if (!acc.some(function (x) { return x.key === f.key; })) {
                var m = ACTION_MAP[f.key];
                acc.push({ key: f.key, nav: m.nav, subtab: m.subtab, text: T(m.id, m.en), why: f.text });
            }
            return acc;
        }, [])
        .slice(0, 3);

    return {
        ok: true,
        level: overall,
        score: clamp(100 - penalty, 0, 100),
        findings: findings,
        actions: actions,
        detail: { liquidity: L, unit: U, debt: D, momentum: M }
    };
}

// Teks siap tampil untuk panel chat. Tanpa markdown, aman untuk UI game.
export function formatReport(rep, isId) {
    var T = function (id, en) { return isId ? id : en; };
    if (!rep.ok) {
        return T('Data belum lengkap untuk analisis (' + rep.bad.join(', ') + ').',
                 'Not enough data for analysis (' + rep.bad.join(', ') + ').');
    }
    var LEVEL_TXT = {
        low: T('Aman', 'Safe'), medium: T('Perlu perhatian', 'Needs attention'),
        high: T('Berisiko', 'At risk'), critical: T('Kritis', 'Critical')
    };
    var out = [];
    out.push(T('Audit bisnis: ', 'Business audit: ') + LEVEL_TXT[rep.level] + ' (' + rep.score + '/100).');
    if (!rep.findings.length) {
        out.push(T('Tidak ada temuan berisiko. Pertahankan pola sekarang.',
                   'No risk findings. Keep the current pattern.'));
        return out.join('\n');
    }
    out.push(T('Temuan:', 'Findings:'));
    rep.findings.forEach(function (f) { out.push('• ' + f.text); });
    if (rep.actions.length) {
        out.push(T('Langkah berikutnya:', 'Next steps:'));
        rep.actions.forEach(function (a, i) { out.push((i + 1) + '. ' + a.text); });
    }
    return out.join('\n');
}

// Ringkasan keputusan untuk pertanyaan "kalau pinjam / rekrut ...".
export function formatLoanVerdict(r, isId) {
    var T = function (id, en) { return isId ? id : en; };
    var V = { ok: T('Aman', 'OK'), caution: T('Hati-hati', 'Caution'), reject: T('Tidak disarankan', 'Not advised') };
    return V[r.verdict] + ': ' + T(
        'cicilan ~' + money(r.installment) + '/bln, total bunga ~' + money(r.totalInterest) +
        ', runway setelahnya ' + mo(r.runwayAfter, true) + '.',
        'installment ~' + money(r.installment) + '/mo, total interest ~' + money(r.totalInterest) +
        ', runway afterwards ' + mo(r.runwayAfter, false) + '.');
}

export function formatHireVerdict(r, isId) {
    var T = function (id, en) { return isId ? id : en; };
    var V = { ok: T('Aman', 'OK'), caution: T('Hati-hati', 'Caution'), reject: T('Tidak disarankan', 'Not advised') };
    var gap = r.gapPerMonth > 0
        ? T(' Agar impas, butuh tambahan pemasukan ~' + money(r.gapPerMonth) + '/bln.',
            ' To break even you need ~' + money(r.gapPerMonth) + '/mo in extra revenue.')
        : '';
    return V[r.verdict] + ': ' + T(
        'tambah ' + r.count + ' ' + r.role + ' menambah biaya ~' + money(r.addBurn) + '/bln.',
        'adding ' + r.count + ' ' + r.role + ' adds ~' + money(r.addBurn) + '/mo in cost.') + gap;
}

// ============================================================
// v2029.1 — Pemahaman tindakan pemain.
// Mengenali apa yang BARU dilakukan atau yang AKAN dilakukan pemain
// (rekrut, pecat, pinjam, ubah harga, produksi, kampanye), lalu menjelaskan
// dampaknya memakai angka dari konteks. Tidak mengubah state game.
// ============================================================

var ROLE_WORDS = 'engineer|insinyur|desainer|designer|marketer|pemasar';
var ROLE_MAP = { engineer: 'engineer', insinyur: 'engineer', desainer: 'designer', designer: 'designer', marketer: 'marketer', pemasar: 'marketer' };
var ROLE_ID = { engineer: 'engineer', designer: 'desainer', marketer: 'marketer' };

function parseAmt(numStr, unit) {
    var s = String(numStr || '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');
    var v = parseFloat(s);
    if (!isFinite(v)) return 0;
    var u = String(unit || '').toLowerCase();
    if (u === 'k' || u === 'rb' || u === 'ribu') v *= 1000;
    else if (u === 'jt' || u === 'juta' || u === 'm') v *= 1000000;
    return Math.round(v);
}

// Mengubah kalimat pemain menjadi objek tindakan. Null jika bukan tindakan.
// Pertanyaan ("berapa", "apa", "?") dan skenario ("kalau", "jika") dibiarkan
// ke handler lain agar tidak bentrok.
export function parseAction(text) {
    var s = String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!s || s.split(' ').length > 14) return null;
    if (/\b(kalau|jika|seandainya|andai|what if|if i|simulasi)\b/.test(s)) return null;
    if (/\?|\b(berapa|apa|apakah|kenapa|mengapa|bagaimana|gimana|kapan|how much|how many|what|why|when|how)\b/.test(s)) return null;

    var tense = /\b(sudah|udah|udh|sdh|baru|barusan|telah|tadi|already|just)\b/.test(s) ? 'done' : 'plan';
    var roleM = new RegExp('(\\d+)?\\s*(' + ROLE_WORDS + ')\\b').exec(s);
    var role = roleM ? ROLE_MAP[roleM[2]] : null;
    var count = roleM && roleM[1] ? parseInt(roleM[1], 10) : 1;

    if (role && /\b(pecat|memecat|berhentikan|keluarkan|fire)\b/.test(s)) {
        return { type: 'fire', tense: tense, role: role, count: count };
    }
    if (role && /\b(rekrut|merekrut|hire|recruit|tambah|tambahin|menambah)\b/.test(s)) {
        return { type: 'hire', tense: tense, role: role, count: count };
    }
    if (/\b(pinjam|meminjam|borrow|ambil pinjaman|kredit)\b/.test(s)) {
        var lm = /(\d[\d.,]*)\s*(k|rb|ribu|jt|juta|m)?\b/.exec(s);
        var amt = lm ? parseAmt(lm[1], lm[2]) : 0;
        if (amt > 0) return { type: 'loan', tense: tense, amount: amt };
        return null;
    }
    if (/\b(harga|price)\b/.test(s) && /\b(naik\w*|raise|increase|turun\w*|lower|decrease|ubah|ganti|set|jadi|menjadi|change)\b/.test(s)) {
        var dir = /\b(naik\w*|raise|increase)\b/.test(s) ? 'up'
                : /\b(turun\w*|lower|decrease)\b/.test(s) ? 'down' : 'set';
        var pm = /(\d+(?:[.,]\d+)?)\s*%/.exec(s);
        var vm = /(?:harga|price)[^\d]{0,24}?(\d[\d.,]*)\s*(k|rb|ribu|jt|juta|m)?\b/.exec(s);
        var pct = pm ? parseFloat(pm[1].replace(',', '.')) : null;
        var value = (!pm && vm) ? parseAmt(vm[1], vm[2]) : null;
        if (pct === null && !value && dir === 'set') return null;
        return { type: 'price', tense: tense, dir: dir, pct: pct, value: value || null };
    }
    if (/\b(produksi|memproduksi|produce|restock|isi stok|tambah stok)\b/.test(s)) {
        var um = /(\d+)\s*(unit|buah|pcs|ponsel|hp)?\b/.exec(s);
        return { type: 'restock', tense: tense, units: um ? parseInt(um[1], 10) : null };
    }
    if (/\b(kampanye|iklan|promosi|campaign|ads|promo)\b/.test(s) &&
        /\b(mulai|jalankan|buat|bikin|start|launch|pasang|run|luncurkan|sudah)\b/.test(s)) {
        return { type: 'campaign', tense: tense };
    }
    return null;
}

function summarizeLiquidity(c, isId) {
    var L = liquidity(c);
    var T = function (id, en) { return isId ? id : en; };
    var verdict = L.level === 'low'
        ? T('kondisi kas masih aman', 'cash position is safe')
        : L.level === 'medium'
            ? T('perlu dipantau', 'needs monitoring')
            : T('perlu tindakan segera', 'needs action soon');
    return T(
        'runway ' + mo(L.runway, true) + ', arus kas bersih ' + (L.net >= 0 ? '+' : '−') + '$' + money(Math.abs(L.net)) + '/bln; ' + verdict + '.',
        'runway ' + mo(L.runway, false) + ', net cash flow ' + (L.net >= 0 ? '+' : '−') + '$' + money(Math.abs(L.net)) + '/mo; ' + verdict + '.');
}

// Menjelaskan dampak tindakan. ctx: { isId, salaryOf(role), product }.
// Mengembalikan { text, need } — need = 'product' | 'value' | null bila info kurang.
export function actionAdvice(c, act, ctx) {
    if (!act) return { text: null, need: null };
    var isId = !!ctx.isId;
    var T = function (id, en) { return isId ? id : en; };
    var done = act.tense === 'done';
    var p = ctx.product || null;

    if (act.type === 'hire') {
        var roleName = isId ? (ROLE_ID[act.role] || act.role) : act.role;
        if (done) {
            return { text: T('Dicatat: kamu merekrut ' + act.count + ' ' + roleName + '. ', 'Noted: you hired ' + act.count + ' ' + roleName + '. ') +
                summarizeLiquidity(c, isId), need: null };
        }
        return { text: formatHireVerdict(evaluateHire(c, act.role, act.count, ctx.salaryOf(act.role)), isId), need: null };
    }

    if (act.type === 'fire') {
        var saved = ctx.salaryOf(act.role) * act.count;
        var after = liquidity(Object.assign({}, c, { burn: num(c.burn) - saved }));
        return { text: T(
            (done ? 'Dicatat: ' : '') + 'pemecatan ' + act.count + ' ' + (ROLE_ID[act.role] || act.role) + ' menghemat ~$' + money(saved) + '/bln. Runway menjadi ' + mo(after.runway, true) + '. Moral tim bisa turun, dan kapasitas kerja berkurang.',
            (done ? 'Noted: ' : '') + 'firing ' + act.count + ' ' + act.role + ' saves ~$' + money(saved) + '/mo. Runway becomes ' + mo(after.runway, false) + '. Team morale may drop and capacity shrinks.'), need: null };
    }

    if (act.type === 'loan') {
        if (done) return { text: T('Dicatat: pinjaman baru. ', 'Noted: new loan. ') + summarizeLiquidity(c, isId), need: null };
        return { text: formatLoanVerdict(evaluateLoan(c, act.amount), isId), need: null };
    }

    if (act.type === 'price') {
        if (!p) return { text: null, need: 'product' };
        var cost = num(p.unitCost), price = num(p.price);
        var target = price;
        if (!done) {
            if (act.value) target = act.value;
            else if (act.pct !== null && act.dir === 'up') target = price * (1 + act.pct / 100);
            else if (act.pct !== null && act.dir === 'down') target = price * (1 - act.pct / 100);
            else if (act.dir === 'set' && !act.value) return { text: null, need: 'value' };
            else return { text: null, need: 'value' };
            target = Math.round(target);
        }
        var mOld = price > 0 ? (price - cost) / price : 0;
        var mNew = target > 0 ? (target - cost) / target : 0;
        var warn = target <= cost
            ? T(' Harga di bawah biaya unit: setiap penjualan merugi.', ' Price is below unit cost: every sale loses money.')
            : mNew < 0.12 ? T(' Margin di bawah 12% terlalu tipis.', ' Margin below 12% is too thin.') : '';
        var head = done ? T('Harga ' + p.name + ' sekarang $' + money(price), p.name + ' price is now $' + money(price))
                        : T('Harga ' + p.name + ' $' + money(price) + ' → $' + money(target), p.name + ' price $' + money(price) + ' → $' + money(target));
        return { text: head + T('. Margin ' + pct(mOld) + ' → ' + pct(mNew) + '. ', '. Margin ' + pct(mOld) + ' → ' + pct(mNew) + '. ') +
            (target > price ? T(' Harga naik biasanya menurunkan volume; pantau tren penjualan beberapa hari.', ' Higher prices usually reduce volume; watch the sales trend for a few days.')
                            : T(' Harga turun biasanya menaikkan volume, tapi cek margin dulu.', ' Lower prices usually raise volume, but check the margin first.')) + warn, need: null };
    }

    if (act.type === 'restock') {
        if (!p) return { text: null, need: 'product' };
        if (!act.units) return { text: null, need: 'value' };
        var costR = act.units * num(p.unitCost);
        var cashAfter = num(c.cash) - costR;
        var outflow = num(c.burn) + num(c.debtService);
        return { text: T(
            'Produksi ' + act.units + ' unit ' + p.name + ' butuh ~$' + money(costR) + '. Sisa uang ~$' + money(cashAfter) + ', runway ' + (outflow > 0 ? mo(cashAfter / outflow, true) : '∞') + '.',
            'Producing ' + act.units + ' units of ' + p.name + ' costs ~$' + money(costR) + '. Cash left ~$' + money(cashAfter) + ', runway ' + (outflow > 0 ? mo(cashAfter / outflow, false) : '∞') + '.'), need: null };
    }

    if (act.type === 'campaign') {
        var noMarketer = !(c.team && c.team.marketers > 0);
        var hint = p ? T(' untuk ' + p.name, ' for ' + p.name) : '';
        if (noMarketer) return { text: T('Kampanye' + hint + ' butuh marketer. Rekrut marketer dulu.', 'A campaign' + hint + ' needs a marketer. Hire a marketer first.'), need: null };
        return { text: T('Kampanye' + hint + ' paling efektif saat produk masih baru (fase naik dan puncak).', 'A campaign' + hint + ' works best while the product is new (rise and peak phases).'), need: null };
    }

    return { text: null, need: null };
}
