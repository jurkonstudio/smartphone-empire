// FILE: src/systems/BankSystem.js  (BARU)
// ============================================================
// Bank v2 — menggantikan pinjaman "bunga saja" di EconomySystem.
//
//   - Peringkat kredit AAA..D (skor 0-100) dari 5 faktor: profit, likuiditas,
//     beban utang, keandalan bayar, reputasi & pangsa pasar.
//   - Plafon total mengikuti peringkat + rata-rata pendapatan 6 bulan.
//   - 3 bank: Global, Asia (butuh brand Asia), Eropa (butuh track record profit).
//   - Pinjaman bertenor dengan cicilan anuitas (pokok + bunga) yang benar-benar
//     mengurangi sisa utang, biaya provisi, dan denda pelunasan dipercepat.
//   - Kredit Modal Kerja (revolving): tarik/bayar kapan saja, bunga hanya di saldo terpakai.
//   - Telat bayar -> denda + skor turun; 3x telat -> bank memblokir pengajuan.
//
// State: state.data.finance.loans (diperluas) + state.data.finance.bank.
// Pinjaman lama (bunga saja) dimigrasi otomatis ke anuitas.
// ============================================================
import { bus } from '../core/EventBus.js';
import { BALANCE } from '../data/balance.data.js';
import { LOG_TYPES } from '../config/constants.js';
import { getMacro } from '../core/MacroModel.js';
import { t } from '../core/LanguageService.js';
import {
    RATINGS, AGE_SCORE_CAPS, BANK_RULES, BANKS, DEPOSIT_CONFIG,
    getBankById, getProductById, getRatingById, ratingRank, ratingFromScore
} from '../data/bank.data.js';
import { WalletService } from './WalletService.js';

var MINUTES_PER_MONTH = 30 * 24 * 60;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Pembulatan "enak dibaca": kelipatan 5 pada 2 digit pertama (37.500, 75.000, 112.500 -> 115.000).
function niceRound(n, floor) {
    if (!(n > 0)) return 0;
    var digits = Math.floor(Math.log10(n)) + 1;
    var step = digits >= 3 ? 5 * Math.pow(10, digits - 3) : 1;
    var q = n / step;
    return (floor ? Math.floor(q) : Math.round(q)) * step;
}

// Diekspor agar bisa diuji (tests/bank.test.mjs). Tidak dipakai di luar modul ini.
export function annuity(principal, rate, months) {
    if (months <= 0) return principal;
    if (rate <= 0) return Math.round(principal / months);
    return Math.round((principal * rate) / (1 - Math.pow(1 + rate, -months)));
}

export class BankSystem {
    constructor(gameState) {
        this.state = gameState;
        this._unsubs = [];
        this._promotion = null;   // untuk baca brand wilayah
    }

    setPromotionSystem(ps) { this._promotion = ps; }

    start() {
        var self = this;
        this._ensure();
        this._unsubs.push(bus.on('state:hydrated', function () { self._ensure(); }));
        console.info('[BankSystem] siap.');
    }

    stop() {
        this._unsubs.forEach(function (u) { u(); });
        this._unsubs = [];
    }

    // ------------------------------------------------------------ state

    _ensure() {
        var f = this.state.data.finance;
        if (!Array.isArray(f.loans)) f.loans = [];
        if (!f.bank || typeof f.bank !== 'object') f.bank = {};
        var b = f.bank;
        if (!Array.isArray(b.log)) b.log = [];
        if (!Array.isArray(b.missed)) b.missed = [];           // [{abs: bulan absolut}]
        if (typeof b.seq !== 'number') b.seq = 1;
        if (typeof b.blockedUntilMinute !== 'number') b.blockedUntilMinute = 0;
        if (!Array.isArray(b.deposits)) b.deposits = [];
        if (typeof b.autoCover !== 'boolean') b.autoCover = true;
        if (typeof b.depSeq !== 'number') b.depSeq = 1;
        if (!b.line || typeof b.line !== 'object') b.line = { drawn: 0 };
        if (typeof b.line.drawn !== 'number') b.line.drawn = 0;
        this._migrateLegacyLoans();
        return b;
    }

    get bank() { return this._ensure(); }

    _macro() { return getMacro(this.state.data.time, BALANCE.macro); }

    _scale() {
        return Math.pow(Math.max(1, this._macro().baseDemand / 5000), 0.6);
    }

    _absMonth() {
        var tm = this.state.data.time;
        return tm.currentYear * 12 + (tm.currentMonth - 1);
    }

    // Pinjaman lama (hanya bunga) -> anuitas dengan sisa tenor.
    _migrateLegacyLoans() {
        var loans = this.state.data.finance.loans;
        var self = this;
        loans.forEach(function (l) {
            if (typeof l.installment === 'number' && l.kind) return;
            var term = Math.max(1, (l.termMonths || 12) - (l.paidMonths || 0));
            l.kind = 'term';
            l.bankId = l.bankId || 'legacy';
            l.productId = l.productId || 'legacy';
            l.remainingTerm = term;
            l.prepayPenalty = 0;
            l.fee = 0;
            l.missed = l.missed || 0;
            l.installment = annuity(l.remaining, l.monthlyInterestRate || 0.03, term);
            if (!l.uid) l.uid = 'ln_legacy_' + l.id;
        });
    }

    _log(type, amount, labelKey, vars) {
        var tm = this.state.data.time;
        var b = this.bank;
        b.log.unshift({
            y: tm.currentYear, m: tm.currentMonth, type: type,
            amount: Math.round(amount || 0), key: labelKey, vars: vars || null
        });
        if (b.log.length > 20) b.log.length = 20;
    }

    // ------------------------------------------------------------ peringkat kredit

    _history() { return this.state.data.finance.history || []; }

    _avgIncome() {
        var h = this._history().slice(0, 6);
        if (!h.length) return 0;
        var s = 0;
        h.forEach(function (e) { s += e.income || 0; });
        return s / h.length;
    }

    getTotalDebt() {
        var s = 0;
        this.state.data.finance.loans.forEach(function (l) { s += l.remaining; });
        return s + this.bank.line.drawn;
    }

    getCompanyAgeMonths() {
        return Math.floor(this.state.data.time.elapsedGameMinutes / MINUTES_PER_MONTH);
    }

    getRecentMissed() {
        var now = this._absMonth();
        var win = BANK_RULES.missedWindowMonths;
        return this.bank.missed.filter(function (m) { return now - m.abs < win; }).length;
    }

    getCreditScore() {
        var d = this.state.data;
        var hist = this._history().slice(0, 6);
        var avgIncome = this._avgIncome();

        // 1) Profitabilitas (0-25)
        var profit = 10;
        if (hist.length) {
            var pos = hist.filter(function (e) { return (e.net || 0) > 0; }).length;
            profit = (pos / hist.length) * 25;
        }

        // 2) Likuiditas / runway (0-20)
        var monthlyCost = Math.max(1, this.state.getMonthlySalary() + this.state.getMonthlyFixedCost());
        var dep = this.getDepositTotals();
        var liquid = Math.max(0, d.cash) + dep.flex + dep.term * 0.5;
        var runway = liquid > 0 ? liquid / monthlyCost : 0;
        var liquidity = clamp(runway / 6, 0, 1) * 20;

        // 3) Beban utang (0-20)
        var debt = this.getTotalDebt();
        var base = Math.max(1, Math.max(0, d.cash) + dep.total + avgIncome * 6);
        var leverage = (1 - clamp((debt / base) / 1.5, 0, 1)) * 20;

        // 4) Keandalan bayar (0-20)
        var reliability = Math.max(0, 20 - this.getRecentMissed() * 6);

        // 5) Reputasi & pangsa pasar (0-15)
        var rep = clamp((d.market.reputation || 0) / 100, 0, 1) * 10;
        var shr = clamp(((d.market.share || 0) * 100) / 20, 0, 1) * 5;
        var standing = rep + shr;

        var raw = profit + liquidity + leverage + reliability + standing;

        // Perusahaan baru dibatasi
        var age = this.getCompanyAgeMonths();
        var cap = 100;
        for (var i = 0; i < AGE_SCORE_CAPS.length; i++) {
            if (age < AGE_SCORE_CAPS[i].months) { cap = AGE_SCORE_CAPS[i].cap; break; }
        }
        var score = Math.round(Math.min(raw, cap));
        var rating = ratingFromScore(score);

        return {
            score: score,
            rating: rating,
            capped: raw > cap,
            ageCap: cap,
            factors: {
                profit:      { value: profit,      max: 25 },
                liquidity:   { value: liquidity,   max: 20 },
                leverage:    { value: leverage,    max: 20 },
                reliability: { value: reliability, max: 20 },
                standing:    { value: standing,    max: 15 }
            }
        };
    }

    // Faktor yang paling lemah (rasio terhadap maksimum) -> untuk tips.
    getWeakestFactor(info) {
        var worst = null;
        var f = (info || this.getCreditScore()).factors;
        Object.keys(f).forEach(function (k) {
            var r = f[k].value / f[k].max;
            if (!worst || r < worst.ratio) worst = { key: k, ratio: r };
        });
        return worst;
    }

    // ------------------------------------------------------------ plafon

    getLimits() {
        var info = this.getCreditScore();
        var r = info.rating;
        var total = Math.round(r.limitBase * this._scale() + r.incomeMult * this._avgIncome());
        if (r.id === 'D') total = 0;
        var used = this.getTotalDebt();
        var lineLimit = 0;
        if (ratingRank(r.id) <= ratingRank(BANK_RULES.creditLineMinRating)) {
            lineLimit = Math.round(total * BANK_RULES.creditLineShare);
        }
        return {
            info: info,
            total: total,
            used: used,
            available: Math.max(0, total - used),
            lineLimit: lineLimit,
            lineDrawn: this.bank.line.drawn,
            lineAvailable: Math.max(0, Math.min(lineLimit - this.bank.line.drawn, total - used))
        };
    }

    isBlocked() {
        return this.state.data.time.elapsedGameMinutes < this.bank.blockedUntilMinute;
    }

    // ------------------------------------------------------------ bunga & penawaran

    _brandOf(region) {
        var ps = this._promotion;
        if (!ps) return 0;
        var b = ps.getBrand();
        return b[region] || 0;
    }

    // Bunga bulanan sebuah produk bank pada kondisi sekarang.
    getMonthlyRate(bankId, productId, ratingOverride) {
        var bank = getBankById(bankId);
        if (!bank) return 0;
        var product = getProductById(bank, productId);
        var rating = ratingOverride || this.getCreditScore().rating;
        var spread = rating.spread == null ? 0.6 : rating.spread;
        var discount = 0;
        if (bank.brandDiscountMax && (bank.region === 'asia' || bank.region === 'europe')) {
            discount = bank.brandDiscountMax * clamp(this._brandOf(bank.region) / 100, 0, 1);
        }
        var rate = bank.baseRate * (1 + spread) + (bank.riskPremium || 0) - discount;
        if (product && product.rateAdd) rate += product.rateAdd;
        rate *= this._macro().rateFactor;
        return Math.round(Math.max(BANK_RULES.minMonthlyRate, rate) * 10000) / 10000;
    }

    // Syarat bank -> { ok, reasons:[ {key, vars} ] }
    checkEligibility(bankId) {
        var bank = getBankById(bankId);
        if (!bank) return { ok: false, reasons: [{ key: 'bank.lock.unknown' }] };
        var reasons = [];
        var info = this.getCreditScore();
        if (this.isBlocked()) reasons.push({ key: 'bank.lock.blocked' });
        if (info.rating.id === 'D') reasons.push({ key: 'bank.lock.rating_d' });
        else if (ratingRank(info.rating.id) > ratingRank(bank.minRating)) {
            reasons.push({ key: 'bank.lock.rating', vars: { r: bank.minRating } });
        }
        if (bank.minBrand && this._brandOf(bank.region) < bank.minBrand) {
            reasons.push({ key: 'bank.lock.brand', vars: { n: bank.minBrand, region: t('region.' + bank.region) } });
        }
        if (bank.minHistoryMonths) {
            var h = this._history().slice(0, 6);
            var pos = h.filter(function (e) { return (e.net || 0) > 0; }).length;
            if (h.length < bank.minHistoryMonths || pos < (bank.minProfitMonths || 0)) {
                reasons.push({ key: 'bank.lock.track', vars: { n: bank.minProfitMonths || 0 } });
            }
        }
        return { ok: reasons.length === 0, reasons: reasons };
    }

    // Rentang jumlah & tenor yang boleh diajukan.
    getProductRange(bankId, productId) {
        var bank = getBankById(bankId);
        var product = getProductById(bank, productId);
        if (!bank || !product || product.kind !== 'term') return null;
        var limits = this.getLimits();
        var scale = this._scale();
        var min = niceRound(product.min * scale);
        var max = niceRound(Math.min(product.max * scale, limits.available), true);
        return { min: min, max: max, terms: product.terms.slice(), ok: max >= min };
    }

    // Opsi nominal (25/50/75/100% dari maksimum).
    getAmountOptions(bankId, productId) {
        var range = this.getProductRange(bankId, productId);
        if (!range || !range.ok) return [];
        var out = [];
        [0.25, 0.5, 0.75, 1].forEach(function (p) {
            var v = niceRound(range.max * p);
            if (v >= range.min && out.indexOf(v) < 0) out.push(v);
        });
        if (!out.length) out.push(range.max);
        return out;
    }

    // ------------------------------------------------------------ pengajuan pinjaman

    quote(req) {
        var bank = getBankById(req.bankId);
        var product = getProductById(bank, req.productId);
        if (!bank || !product || product.kind !== 'term') return { ok: false, error: t('bank.err.product') };
        var elig = this.checkEligibility(bank.id);
        if (!elig.ok) return { ok: false, error: t(elig.reasons[0].key, elig.reasons[0].vars) };
        var range = this.getProductRange(bank.id, product.id);
        if (!range || !range.ok) return { ok: false, error: t('bank.err.limit') };
        var amount = Math.round(req.amount || 0);
        if (amount < range.min || amount > range.max) return { ok: false, error: t('bank.err.amount') };
        var term = req.term;
        if (product.terms.indexOf(term) < 0) return { ok: false, error: t('bank.err.term') };

        var rate = this.getMonthlyRate(bank.id, product.id);
        var installment = annuity(amount, rate, term);
        var fee = Math.round(amount * bank.fee);
        var totalPaid = installment * term;
        return {
            ok: true, bank: bank, product: product, amount: amount, term: term, rate: rate,
            installment: installment, fee: fee, net: amount - fee,
            totalInterest: Math.max(0, totalPaid - amount), totalPaid: totalPaid
        };
    }

    applyForLoan(req) {
        var d = this.state.data;
        if (d.gameOver) return { ok: false, error: t('bank.err.gameover') };
        var q = this.quote(req);
        if (!q.ok) return q;
        var b = this.bank;
        var loan = {
            id: 'ln_' + (b.seq++),
            uid: 'ln_' + d.time.elapsedGameMinutes + '_' + b.seq,
            kind: 'term',
            bankId: q.bank.id,
            productId: q.product.id,
            label: t('bank.name.' + q.bank.id),
            principal: q.amount,
            remaining: q.amount,
            monthlyInterestRate: q.rate,
            termMonths: q.term,
            remainingTerm: q.term,
            paidMonths: 0,
            installment: q.installment,
            fee: q.fee,
            prepayPenalty: q.bank.prepayPenalty,
            missed: 0,
            takenAtYear: d.time.currentYear,
            takenAtMonth: d.time.currentMonth
        };
        d.finance.loans.push(loan);
        this.state.addCash(q.net);
        this._log('loan', q.net, 'bank.log.loan', { bank: loan.label, amount: q.amount });
        this.state.addLog(t('bank.log.loan_main', { bank: loan.label, amount: '$' + q.amount.toLocaleString('en-US') }), LOG_TYPES.info);
        bus.emit('economy:loan-taken', { amount: q.amount, interestRate: q.rate });
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true, loan: loan, quote: q };
    }

    // ------------------------------------------------------------ pelunasan

    getPrepayQuote(uid, fraction) {
        var l = this.state.data.finance.loans.find(function (x) { return x.uid === uid || x.id === uid; });
        if (!l) return null;
        var amount = fraction >= 1 ? l.remaining : Math.max(1, Math.round(l.remaining * fraction));
        var progress = clamp((l.paidMonths || 0) / Math.max(1, l.termMonths || 1), 0, 1);
        var penalty = Math.round(amount * (l.prepayPenalty || 0) * (1 - progress));
        var total = amount + penalty;
        return {
            loan: l, amount: amount, penalty: penalty, total: total,
            full: amount >= l.remaining,
            affordable: WalletService.canAfford(total)
        };
    }

    prepay(uid, fraction) {
        var d = this.state.data;
        var pq = this.getPrepayQuote(uid, fraction);
        if (!pq) return { ok: false, error: t('bank.err.loan_missing') };
        if (!pq.affordable) return { ok: false, error: t('bank.err.no_cash') };
        var l = pq.loan;
        WalletService.pay(pq.total, 'loan-prepay');
        if (pq.full) {
            d.finance.loans = d.finance.loans.filter(function (x) { return x !== l; });
            this.state.addLog(t('bank.log.paid_off', { bank: l.label }), LOG_TYPES.success);
        } else {
            l.remaining -= pq.amount;
            var term = Math.max(1, l.remainingTerm || 1);
            l.installment = annuity(l.remaining, l.monthlyInterestRate, term);
            this.state.addLog(t('bank.log.prepaid', { bank: l.label, amount: '$' + pq.amount.toLocaleString('en-US') }), LOG_TYPES.info);
        }
        this._log('prepay', pq.total, 'bank.log.prepay', { bank: l.label });
        bus.emit('economy:loan-repaid', { loanId: l.id });
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true, quote: pq };
    }

    // ------------------------------------------------------------ kredit modal kerja

    getLineRate() {
        return this.getMonthlyRate('global_bank', 'gb_line');
    }

    drawLine(amount) {
        var d = this.state.data;
        if (d.gameOver) return { ok: false, error: t('bank.err.gameover') };
        var elig = this.checkEligibility('global_bank');
        if (!elig.ok) return { ok: false, error: t(elig.reasons[0].key, elig.reasons[0].vars) };
        var lim = this.getLimits();
        amount = Math.round(amount || 0);
        if (amount <= 0) return { ok: false, error: t('bank.err.amount') };
        if (amount > lim.lineAvailable) return { ok: false, error: t('bank.err.limit') };
        this.bank.line.drawn += amount;
        this.state.addCash(amount);
        this._log('draw', amount, 'bank.log.draw');
        this.state.addLog(t('bank.log.draw_main', { amount: '$' + amount.toLocaleString('en-US') }), LOG_TYPES.info);
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true };
    }

    repayLine(amount) {
        var d = this.state.data;
        var drawn = this.bank.line.drawn;
        if (drawn <= 0) return { ok: false, error: t('bank.err.nothing') };
        amount = Math.min(drawn, Math.round(amount || 0));
        if (amount <= 0) return { ok: false, error: t('bank.err.amount') };
        if (!WalletService.canAfford(amount)) return { ok: false, error: t('bank.err.no_cash') };
        WalletService.pay(amount, 'credit-line-repay');
        this.bank.line.drawn -= amount;
        this._log('repay', amount, 'bank.log.repay');
        this.state.addLog(t('bank.log.repay_main', { amount: '$' + amount.toLocaleString('en-US') }), LOG_TYPES.success);
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true };
    }

    // ------------------------------------------------------------ proses bulanan

    // Estimasi tanpa mengubah state (untuk getMonthlyCostEstimate & UI).
    previewMonthly() {
        var loans = this.state.data.finance.loans;
        var interest = 0, principal = 0;
        loans.forEach(function (l) {
            var i = Math.round(l.remaining * l.monthlyInterestRate);
            interest += i;
            var last = (l.remainingTerm || 1) <= 1;
            principal += last ? l.remaining : Math.max(0, Math.min(l.remaining, l.installment - i));
        });
        interest += Math.round(this.bank.line.drawn * this.getLineRate());
        return { interest: interest, principal: principal, total: interest + principal };
    }

    // Dipanggil EconomySystem._processMonth. Mengubah sisa utang & mengembalikan rincian.
    // Kas TIDAK diubah di sini; EconomySystem yang memotong (agar urutan laporan konsisten).
    processMonthly() {
        var d = this.state.data;
        var b = this._ensure();
        var self = this;
        var interestTotal = 0, principalTotal = 0, lateFees = 0;
        var depRes = this.processDeposits();
        var opCosts = this.state.getMonthlySalary() + this.state.getMonthlyFixedCost();
        var available = d.cash - opCosts + (b.autoCover ? this.getDepositTotals().flex : 0);
        var abs = this._absMonth();

        var survivors = [];
        d.finance.loans.forEach(function (l) {
            var interest = Math.round(l.remaining * l.monthlyInterestRate);
            var last = (l.remainingTerm || 1) <= 1;
            var principal = last ? l.remaining : Math.max(0, Math.min(l.remaining, l.installment - interest));
            var payment = interest + principal;

            if (available < payment) {
                var fee = Math.round(payment * BANK_RULES.lateFeePct);
                lateFees += fee;
                l.missed = (l.missed || 0) + 1;
                b.missed.push({ abs: abs });
                self.state.addLog(t('bank.log.late', { bank: l.label }), LOG_TYPES.warning);
                bus.emit('bank:late-payment', { loanId: l.id });
            }
            available -= payment;

            interestTotal += interest;
            principalTotal += principal;
            l.remaining = Math.max(0, l.remaining - principal);
            l.paidMonths = (l.paidMonths || 0) + 1;
            l.remainingTerm = Math.max(0, (l.remainingTerm || 1) - 1);

            if (l.remaining <= 0 || l.remainingTerm <= 0) {
                self.state.addLog(t('bank.log.paid_off', { bank: l.label }), LOG_TYPES.success);
                self._log('payoff', 0, 'bank.log.payoff', { bank: l.label });
            } else {
                survivors.push(l);
            }
        });
        d.finance.loans = survivors;

        // Kredit modal kerja: bunga saja
        var lineInterest = Math.round(b.line.drawn * this.getLineRate());
        interestTotal += lineInterest;

        b.missed = b.missed.filter(function (m) { return abs - m.abs < BANK_RULES.missedWindowMonths; });

        // Blokir bila terlalu sering telat
        if (this.getRecentMissed() >= BANK_RULES.defaultMissedLimit && !this.isBlocked()) {
            b.blockedUntilMinute = d.time.elapsedGameMinutes + BANK_RULES.blockMonths * MINUTES_PER_MONTH;
            this.state.addReputation(-BANK_RULES.defaultRepPenalty);
            this.state.addLog(t('bank.log.blocked'), LOG_TYPES.danger);
            this._log('blocked', 0, 'bank.log.blocked_short');
            bus.emit('bank:blocked', {});
        }

        if (principalTotal + interestTotal > 0) {
            this._log('payment', principalTotal + interestTotal + lateFees, 'bank.log.payment');
        }
        bus.emit('bank:changed', {});
        return {
            interest: interestTotal, principal: principalTotal, lateFees: lateFees,
            depositInterest: depRes.interest, depositTax: depRes.tax
        };
    }

    // ------------------------------------------------------------ simpanan (tabungan & deposito)

    getDepositTotals() {
        var flex = 0, term = 0;
        (this.bank.deposits || []).forEach(function (x) {
            if (x.kind === 'flex') flex += x.balance; else term += x.balance;
        });
        return { flex: flex, term: term, total: flex + term };
    }

    // Bunga tahunan (%) untuk jenis simpanan di bank tertentu.
    getDepositAnnualPct(bankId, kind, term) {
        var bank = getBankById(bankId);
        var pr = this._macro().policyRate || 0;
        var mult = kind === 'flex' ? DEPOSIT_CONFIG.flexMult : (DEPOSIT_CONFIG.termMult[term] || 1);
        var pct = pr * mult + (kind === 'term' ? (DEPOSIT_CONFIG.termBonusPct[term] || 0) : 0);
        pct = Math.max(DEPOSIT_CONFIG.minAnnualPct, pct) * ((bank && bank.depositMult) || 1);
        return Math.round(pct * 100) / 100;
    }

    getDepositMonthlyRate(bankId, kind, term) {
        return this.getDepositAnnualPct(bankId, kind, term) / 100 / 12;
    }

    getDepositMin() {
        return niceRound(DEPOSIT_CONFIG.minDeposit * this._scale(), true) || DEPOSIT_CONFIG.minDeposit;
    }

    getDepositAmountOptions() {
        var cash = this.state.data.cash;
        var min = this.getDepositMin();
        var out = [];
        [0.1, 0.25, 0.5, 1].forEach(function (p) {
            var v = niceRound(cash * p, true);
            if (p === 1) v = Math.floor(cash);
            if (v >= min && v <= cash && out.indexOf(v) < 0) out.push(v);
        });
        return out;
    }

    quoteDeposit(req) {
        var bank = getBankById(req.bankId);
        if (!bank) return { ok: false, error: t('bank.err.product') };
        var kind = req.kind === 'term' ? 'term' : 'flex';
        var term = kind === 'term' ? req.term : 0;
        if (kind === 'term' && DEPOSIT_CONFIG.termOptions.indexOf(term) < 0) return { ok: false, error: t('bank.err.term') };
        var amount = Math.floor(req.amount || 0);
        var min = this.getDepositMin();
        if (amount < min) return { ok: false, error: t('dep.err.min', { n: '$' + min.toLocaleString('en-US') }) };
        if (!WalletService.canAfford(amount)) return { ok: false, error: t('bank.err.no_cash') };

        var annual = this.getDepositAnnualPct(bank.id, kind, term);
        var r = annual / 100 / 12;
        var netR = r * (1 - DEPOSIT_CONFIG.taxPct);
        var out = {
            ok: true, bank: bank, kind: kind, term: term, amount: amount, annualPct: annual,
            monthlyNet: Math.round(amount * netR), taxPct: DEPOSIT_CONFIG.taxPct
        };
        if (kind === 'term') {
            out.maturity = Math.round(amount * Math.pow(1 + netR, term));
            out.profit = out.maturity - amount;
        }
        return out;
    }

    deposit(req) {
        var d = this.state.data;
        if (d.gameOver) return { ok: false, error: t('bank.err.gameover') };
        var q = this.quoteDeposit(req);
        if (!q.ok) return q;
        var b = this.bank;
        WalletService.pay(q.amount, 'deposit');
        var kindLabel = q.kind === 'flex' ? t('dep.kind.flex') : t('dep.kind.term', { n: q.term });
        var bankName = t('bank.name.' + q.bank.id);
        var acc = null;
        if (q.kind === 'flex') {
            acc = b.deposits.find(function (x) { return x.kind === 'flex' && x.bankId === q.bank.id; });
            if (acc) { acc.balance += q.amount; acc.principal += q.amount; }
        }
        if (!acc) {
            b.deposits.push({
                uid: 'dp_' + (b.depSeq++), kind: q.kind, bankId: q.bank.id,
                principal: q.amount, balance: q.amount,
                term: q.term, remainingTerm: q.term,
                rate: q.kind === 'term' ? q.annualPct / 100 / 12 : 0,
                openedY: d.time.currentYear, openedM: d.time.currentMonth
            });
        }
        this._log('deposit', q.amount, 'dep.log.deposit', { bank: bankName });
        this.state.addLog(t('dep.log.deposit_main', { amount: '$' + q.amount.toLocaleString('en-US'), bank: bankName, kind: kindLabel }), LOG_TYPES.info);
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true, quote: q };
    }

    getWithdrawQuote(uid, fraction) {
        var dep = this.bank.deposits.find(function (x) { return x.uid === uid; });
        if (!dep) return null;
        if (dep.kind === 'flex') {
            var amount = fraction >= 1 ? dep.balance : Math.max(1, Math.round(dep.balance * fraction));
            return { dep: dep, flex: true, amount: amount, penalty: 0, forfeited: 0, payout: amount, full: amount >= dep.balance };
        }
        var matured = dep.remainingTerm <= 0;
        var penalty = matured ? 0 : Math.round(dep.principal * DEPOSIT_CONFIG.earlyPenaltyPct);
        var forfeited = matured ? 0 : Math.max(0, dep.balance - dep.principal);
        var payout = matured ? dep.balance : Math.max(0, dep.principal - penalty);
        return { dep: dep, flex: false, amount: dep.balance, penalty: penalty, forfeited: forfeited, payout: payout, full: true };
    }

    withdraw(uid, fraction) {
        var d = this.state.data;
        var wq = this.getWithdrawQuote(uid, fraction);
        if (!wq) return { ok: false, error: t('dep.err.missing') };
        var dep = wq.dep;
        var b = this.bank;
        this.state.addCash(wq.payout);
        if (wq.full) b.deposits = b.deposits.filter(function (x) { return x !== dep; });
        else { dep.balance -= wq.amount; dep.principal = Math.max(0, dep.principal - wq.amount); }
        var bankName = t('bank.name.' + dep.bankId);
        this._log('withdraw', wq.payout, 'dep.log.withdraw', { bank: bankName });
        this.state.addLog(t('dep.log.withdraw_main', { amount: '$' + wq.payout.toLocaleString('en-US'), bank: bankName }), LOG_TYPES.info);
        bus.emit('bank:changed', {});
        bus.emit('state:changed', d);
        return { ok: true, quote: wq };
    }

    setAutoCover(on) {
        this.bank.autoCover = !!on;
        bus.emit('bank:changed', {});
        return this.bank.autoCover;
    }

    // Menutup kekurangan kas dari tabungan fleksibel. Kas TIDAK diubah di sini (EconomySystem yang set).
    coverShortfall(need) {
        var b = this.bank;
        if (!b.autoCover || !(need > 0)) return 0;
        var flex = b.deposits.filter(function (x) { return x.kind === 'flex' && x.balance > 0; })
            .sort(function (x, y) { return y.balance - x.balance; });
        var covered = 0;
        for (var i = 0; i < flex.length && covered < need; i++) {
            var take = Math.min(flex[i].balance, Math.ceil(need - covered));
            flex[i].balance -= take;
            flex[i].principal = Math.max(0, flex[i].principal - take);
            covered += take;
        }
        b.deposits = b.deposits.filter(function (x) { return x.kind !== 'flex' || x.balance > 0; });
        if (covered > 0) {
            this.state.addLog(t('dep.log.cover', { amount: '$' + covered.toLocaleString('en-US') }), LOG_TYPES.warning);
            this._log('cover', covered, 'dep.log.cover_short');
            bus.emit('bank:changed', {});
        }
        return covered;
    }

    // Bunga bulanan simpanan (bersih pajak) masuk ke saldo; deposito jatuh tempo cair ke kas.
    processDeposits() {
        var b = this.bank;
        var self = this;
        var interest = 0, tax = 0;
        var keep = [];
        b.deposits.forEach(function (x) {
            var r = x.kind === 'flex' ? self.getDepositMonthlyRate(x.bankId, 'flex', 0) : x.rate;
            var gross = Math.round(x.balance * r);
            var tx = Math.round(gross * DEPOSIT_CONFIG.taxPct);
            var net = gross - tx;
            x.balance += net;
            interest += net; tax += tx;
            if (x.kind === 'term') {
                x.remainingTerm = Math.max(0, x.remainingTerm - 1);
                if (x.remainingTerm <= 0) {
                    self.state.addCash(x.balance);
                    var nm = t('bank.name.' + x.bankId);
                    self.state.addLog(t('dep.log.matured', { bank: nm, amount: '$' + x.balance.toLocaleString('en-US') }), LOG_TYPES.success);
                    self._log('matured', x.balance, 'dep.log.matured_short', { bank: nm });
                    return;
                }
            }
            keep.push(x);
        });
        b.deposits = keep;
        return { interest: interest, tax: tax };
    }

    // ------------------------------------------------------------ ringkasan

    getSummary() {
        var lim = this.getLimits();
        var pm = this.previewMonthly();
        return {
            rating: lim.info.rating.id, score: lim.info.score,
            total: lim.total, used: lim.used, available: lim.available,
            monthly: pm.total, loans: this.state.data.finance.loans.length,
            deposits: this.getDepositTotals().total
        };
    }

    // Kompatibilitas pemanggil lama (Settings lama / cheat): ambil pinjaman standar.
    takeLegacyLoan(def) {
        return this.applyForLoan({
            bankId: 'global_bank', productId: 'gb_term',
            amount: def.principal, term: def.termMonths
        });
    }
}

export { BANKS };
