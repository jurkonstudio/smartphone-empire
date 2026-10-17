// FILE: src/ui/panels/BankPanel.js  (BARU)
// Tab "Bank" di panel HQ: peringkat kredit, plafon, 3 bank, kredit modal kerja,
// pinjaman aktif (cicilan + bayar awal), dan riwayat bank. Plus modal ajukan & bayar awal.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { BANKS, DEPOSIT_CONFIG } from '../../data/bank.data.js';
import { REGION_COLORS } from '../../data/region.data.js';
import { ensureRegionalStyle } from './RegionalStyle.js';

var _apply = null;    // { bankId, productId, amount, term }
var _prepay = null;   // { uid, fraction }
var _dep = null;      // { bankId, kind:'flex'|'term', term, amount }
var _wd = null;       // { uid, fraction }

var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function dot(color) { return '<span class="rg-dot" style="background:' + color + '"></span>'; }
function money(n) { return formatCurrency(n); }
function ratePct(r) { return (r * 100).toFixed(2) + '%'; }

function _meter(ratio, color) {
    return '<div class="rg-meter"><i style="width:' + Math.round(Math.max(0, Math.min(1, ratio)) * 100) +
        '%;background:' + color + '"></i></div>';
}

// ------------------------------------------------------------ bagian-bagian

function _ratingCard(bank, lim) {
    var info = lim.info;
    var r = info.rating;
    var f = info.factors;
    var names = ['profit', 'liquidity', 'leverage', 'reliability', 'standing'];

    var factors = names.map(function (k) {
        var ratio = f[k].value / f[k].max;
        var color = ratio >= 0.7 ? '#34c759' : (ratio >= 0.4 ? '#ff9f0a' : '#ff453a');
        return '<div class="rg-factor"><span class="rg-factor-name">' + esc(t('bank.factor.' + k)) + '</span>' +
            _meter(ratio, color) + '</div>';
    }).join('');

    var weakest = bank.getWeakestFactor(info);
    var tip = weakest ? '<div class="rg-tip">' + esc(t('bank.tip.' + weakest.key)) + '</div>' : '';
    var capped = info.capped
        ? '<div class="rg-row-meta" style="margin-bottom:6px;">' + esc(t('bank.capped', { n: info.ageCap })) + '</div>' : '';
    var blocked = bank.isBlocked()
        ? '<div class="rg-lock">' + esc(t('bank.lock.blocked')) + '</div>' : '';

    return '<div class="card"><div class="card-title">' + esc(t('bank.rating')) + '</div>' +
        '<div class="rg-rating"><div class="rg-rating-badge" style="background:' + r.color + '">' + esc(r.id) + '</div>' +
        '<div class="rg-rating-info"><div class="rg-rating-score">' + esc(t('bank.score', { n: info.score })) + '</div>' +
        capped + _meter(info.score / 100, r.color) + '</div></div>' +
        factors + tip + blocked + '</div>';
}

function _kpis(bank, lim) {
    var pm = bank.previewMonthly();
    function k(label, val) {
        return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
    }
    return '<div class="rg-kpis">' +
        k(t('bank.kpi.limit'), money(lim.total)) +
        k(t('bank.kpi.used'), money(lim.used)) +
        k(t('bank.kpi.available'), money(lim.available)) +
        k(t('bank.kpi.monthly'), money(pm.total)) + '</div>';
}

function _bankCards(bank) {
    return BANKS.map(function (b) {
        var elig = bank.checkEligibility(b.id);
        var color = REGION_COLORS[b.region] || REGION_COLORS.global;
        var termProduct = b.products.find(function (p) { return p.kind === 'term'; });
        var rate = termProduct ? bank.getMonthlyRate(b.id, termProduct.id) : 0;

        var tags =
            '<span class="rg-tag info">' + esc(t('bank.rate_from', { r: ratePct(rate) })) + '</span>' +
            '<span class="rg-tag">' + esc(t('bank.fee', { n: (b.fee * 100).toFixed(1) })) + '</span>' +
            '<span class="rg-tag">' + esc(t('bank.prepay', { n: (b.prepayPenalty * 100).toFixed(0) })) + '</span>' +
            '<span class="rg-tag">' + esc(t('bank.min_rating', { r: b.minRating })) + '</span>';

        var status;
        if (elig.ok) {
            status = '<div class="rg-ok">' + esc(t('bank.eligible')) + '</div>';
        } else {
            status = elig.reasons.map(function (rs) {
                return '<div class="rg-lock">' + esc(t(rs.key, rs.vars)) + '</div>';
            }).join('');
        }

        var action = '';
        if (termProduct) {
            var range = bank.getProductRange(b.id, termProduct.id);
            var canApply = elig.ok && range && range.ok;
            var rangeTxt = range && range.ok
                ? '<div class="rg-row-meta" style="margin-top:6px;">' + esc(t('bank.range', { min: money(range.min), max: money(range.max) })) +
                  ' · ' + esc(t('bank.terms', { list: range.terms.join('/') })) + '</div>'
                : '';
            action = rangeTxt + '<div class="rg-btn-row"><button class="' + (canApply ? 'btn-primary' : 'btn-secondary') +
                '" data-bank-apply="' + b.id + '|' + termProduct.id + '"' + (canApply ? '' : ' disabled') + '>' +
                esc(canApply ? t('bank.btn.apply') : t('bank.btn.locked')) + '</button></div>';
        }

        return '<div class="card"><div class="rg-title">' + dot(color) + esc(t('bank.name.' + b.id)) + '</div>' +
            '<div class="rg-desc">' + esc(t('bank.desc.' + b.id)) + '</div>' +
            '<div class="rg-pkg-meta">' + tags + '</div>' + status + action + '</div>';
    }).join('');
}

function _lineCard(bank, lim) {
    var rateTxt = ratePct(bank.getLineRate());
    var elig = bank.checkEligibility('global_bank');
    var body;
    if (lim.lineLimit <= 0) {
        body = '<div class="rg-lock">' + esc(t('bank.line.locked', { r: 'BB' })) + '</div>';
        if (lim.lineDrawn > 0) body += '<div class="rg-row-meta">' + esc(t('bank.line.drawn')) + ': ' + esc(money(lim.lineDrawn)) + '</div>';
    } else {
        body = '<div class="rg-row"><div class="rg-row-main">' +
            '<div class="rg-row-name">' + esc(t('bank.line.drawn')) + ': ' + esc(money(lim.lineDrawn)) + ' / ' + esc(money(lim.lineLimit)) + '</div>' +
            '<div class="rg-row-meta">' + esc(t('bank.line.rate', { r: rateTxt })) + '</div>' +
            _meter(lim.lineLimit > 0 ? lim.lineDrawn / lim.lineLimit : 0, '#0a84ff') + '</div></div>';
    }
    var canDraw = elig.ok && lim.lineAvailable > 0;
    var drawBtns = [0.25, 0.5, 1].map(function (p) {
        var amt = Math.round(lim.lineAvailable * p / 1000) * 1000 || Math.round(lim.lineAvailable * p);
        return '<button class="btn-secondary" data-bank-draw="' + amt + '"' + (canDraw && amt > 0 ? '' : ' disabled') + '>' +
            esc(t('bank.btn.draw')) + ' ' + (p === 1 ? 'MAX' : (p * 100) + '%') + '</button>';
    }).join('');
    var canRepay = lim.lineDrawn > 0;
    var repayBtns = [0.25, 0.5, 1].map(function (p) {
        var amt = p === 1 ? lim.lineDrawn : Math.round(lim.lineDrawn * p);
        return '<button class="btn-secondary" data-bank-repay="' + amt + '"' + (canRepay ? '' : ' disabled') + '>' +
            esc(p === 1 ? t('bank.btn.repay_all') : t('bank.btn.repay') + ' ' + (p * 100) + '%') + '</button>';
    }).join('');
    if (lim.lineLimit > 0) {
        body += '<div class="rg-btn-row">' + drawBtns + '</div><div class="rg-btn-row">' + repayBtns + '</div>';
    }
    return '<div class="card"><div class="card-title">' + esc(t('bank.section.line')) + '</div>' + body + '</div>';
}

function _loansCard(bank, data) {
    var loans = data.finance.loans || [];
    var body;
    if (!loans.length) {
        body = '<div class="rg-row-meta">' + esc(t('bank.loan.none')) + '</div>';
    } else {
        body = loans.map(function (l) {
            var paid = l.paidMonths || 0;
            var term = Math.max(1, l.termMonths || 1);
            return '<div class="rg-pkg"><div class="rg-pkg-head"><div class="rg-pkg-name">' + esc(l.label || l.id) + '</div>' +
                '<span class="rg-tag info">' + esc(ratePct(l.monthlyInterestRate || 0)) + '/' + esc(t('bank.per_month')) + '</span></div>' +
                '<div class="rg-pkg-meta" style="margin-top:6px;">' +
                '<span class="rg-tag">' + esc(t('bank.loan.remaining')) + ' ' + esc(money(l.remaining)) + '</span>' +
                '<span class="rg-tag">' + esc(t('bank.loan.installment')) + ' ' + esc(money(l.installment || 0)) + '</span>' +
                '<span class="rg-tag">' + esc(t('bank.loan.progress', { a: paid, b: term })) + '</span>' +
                ((l.missed || 0) > 0 ? '<span class="rg-tag warn">' + esc(t('bank.loan.late', { n: l.missed })) + '</span>' : '') +
                '</div>' + _meter(paid / term, '#34c759') +
                '<div class="rg-btn-row"><button class="btn-secondary" data-bank-prepay="' + esc(String(l.uid || l.id)) + '">' +
                esc(t('bank.btn.prepay')) + '</button></div></div>';
        }).join('');
    }
    return '<div class="card"><div class="card-title">' + esc(t('bank.section.loans')) + '</div>' + body + '</div>';
}

function _logCard(data) {
    var log = (data.finance.bank && data.finance.bank.log) || [];
    if (!log.length) return '';
    var rows = log.slice(0, 8).map(function (e) {
        var vars = Object.assign({}, e.vars || {});
        if (typeof vars.amount === 'number') vars.amount = money(vars.amount);
        return '<div class="rg-log"><span>' + esc(MONTH_SHORT[(e.m || 1) - 1] + ' ' + e.y) + '</span><span style="flex:1;text-align:left;">' +
            esc(t(e.key, vars)) + '</span><b>' + (e.amount ? esc(money(e.amount)) : '') + '</b></div>';
    }).join('');
    return '<div class="card"><div class="card-title">' + esc(t('bank.section.log')) + '</div>' + rows + '</div>';
}

function _depositCard(bank, data) {
    var tot = bank.getDepositTotals();
    var auto = bank.bank.autoCover;
    var min = bank.getDepositMin();

    var kpis = '<div class="rg-kpis">' +
        '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(t('dep.kpi.total')) + '</div><div class="rg-kpi-value">' + esc(money(tot.total)) + '</div></div>' +
        '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(t('dep.kpi.flex')) + '</div><div class="rg-kpi-value">' + esc(money(tot.flex)) + '</div></div>' +
        '</div>';

    var autoRow = '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(t('dep.autocover')) + '</div>' +
        '<div class="rg-row-meta">' + esc(t('dep.autocover.hint')) + '</div></div>' +
        '<button class="' + (auto ? 'btn-primary' : 'btn-secondary') + '" data-dep-autocover style="min-width:72px;min-height:34px;">' +
        esc(auto ? t('dep.on') : t('dep.off')) + '</button></div>';

    var banks = BANKS.map(function (b) {
        var color = REGION_COLORS[b.region] || REGION_COLORS.global;
        var flexPct = bank.getDepositAnnualPct(b.id, 'flex', 0);
        var t12 = bank.getDepositAnnualPct(b.id, 'term', 12);
        return '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + dot(color) + esc(t('bank.name.' + b.id)) + '</div>' +
            '<div class="rg-row-meta">' + esc(t('dep.rates', { a: flexPct.toFixed(2), b: t12.toFixed(2) })) + '</div></div>' +
            '<button class="btn-primary" data-dep-open="' + b.id + '" style="min-width:76px;min-height:34px;">' + esc(t('dep.btn.open')) + '</button></div>';
    }).join('');

    var list = (bank.bank.deposits || []);
    var items;
    if (!list.length) {
        items = '<div class="rg-row-meta" style="margin-top:4px;">' + esc(t('dep.none')) + '</div>';
    } else {
        items = list.map(function (x) {
            var kindLabel = x.kind === 'flex' ? t('dep.kind.flex') : t('dep.kind.term', { n: x.term });
            var annual = x.kind === 'flex' ? bank.getDepositAnnualPct(x.bankId, 'flex', 0) : (x.rate * 12 * 100);
            var progress = x.kind === 'term' && x.term > 0 ? (x.term - x.remainingTerm) / x.term : 0;
            return '<div class="rg-pkg"><div class="rg-pkg-head"><div class="rg-pkg-name">' + esc(t('bank.name.' + x.bankId)) + '</div>' +
                '<span class="rg-tag info">' + esc(kindLabel) + '</span></div>' +
                '<div class="rg-pkg-meta" style="margin-top:6px;">' +
                '<span class="rg-tag good">' + esc(t('dep.balance')) + ' ' + esc(money(x.balance)) + '</span>' +
                '<span class="rg-tag">' + esc(t('dep.rate', { r: annual.toFixed(2) })) + '</span>' +
                (x.kind === 'term' ? '<span class="rg-tag">' + esc(t('dep.matures', { n: x.remainingTerm })) + '</span>' : '') +
                '</div>' + (x.kind === 'term' ? _meter(progress, '#0a84ff') : '') +
                '<div class="rg-btn-row"><button class="btn-secondary" data-dep-withdraw="' + esc(x.uid) + '">' + esc(t('dep.btn.withdraw')) + '</button></div></div>';
        }).join('');
    }

    return '<div class="card"><div class="card-title">' + esc(t('dep.section')) + '</div>' + kpis + autoRow +
        '<div class="rg-row-meta" style="margin:8px 0;">' + esc(t('dep.modal.min', { n: money(min) })) + '</div>' +
        banks + '<div style="margin-top:8px;">' + items + '</div></div>';
}

// ------------------------------------------------------------ panel utama

export function renderBankPanel() {
    ensureRegionalStyle();
    var g = window.__game;
    var bank = g.bank;
    var data = g.state.get();
    var lim = bank.getLimits();

    return '<div class="rg-sub">' + esc(t('bank.sub')) + '</div>' +
        _ratingCard(bank, lim) + _kpis(bank, lim) + _depositCard(bank, data) +
        '<div class="card-title" style="margin:6px 4px;">' + esc(t('bank.section.banks')) + '</div>' +
        _bankCards(bank) + _lineCard(bank, lim) + _loansCard(bank, data) + _logCard(data);
}

// ------------------------------------------------------------ modal ajukan pinjaman

function _applyHtml() {
    var g = window.__game;
    var bank = g.bank;
    var b = BANKS.find(function (x) { return x.id === _apply.bankId; });
    var product = b.products.find(function (p) { return p.id === _apply.productId; });
    var amounts = bank.getAmountOptions(_apply.bankId, _apply.productId);
    var q = bank.quote(_apply);

    var amountChips = '<div class="rg-modal-chips">' + amounts.map(function (a) {
        return '<button class="rg-chip' + (a === _apply.amount ? ' active' : '') + '" data-bank-amount="' + a + '">' + esc(money(a)) + '</button>';
    }).join('') + '</div>';

    var termChips = '<div class="rg-modal-chips">' + product.terms.map(function (n) {
        return '<button class="rg-chip' + (n === _apply.term ? ' active' : '') + '" data-bank-term="' + n + '">' +
            esc(t('bank.modal.months', { n: n })) + '</button>';
    }).join('') + '</div>';

    var summary;
    if (q.ok) {
        summary =
            '<div class="rg-sum"><span>' + esc(t('bank.modal.rate')) + '</span><b>' + esc(ratePct(q.rate)) + '/' + esc(t('bank.per_month')) + '</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('bank.modal.installment')) + '</span><b>' + esc(money(q.installment)) + '</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('bank.modal.fee')) + '</span><b>-' + esc(money(q.fee)) + '</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('bank.modal.net')) + '</span><b style="color:var(--success,#34c759)">' + esc(money(q.net)) + '</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('bank.modal.total_interest')) + '</span><b>' + esc(money(q.totalInterest)) + '</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('bank.modal.total_paid')) + '</span><b>' + esc(money(q.totalPaid)) + '</b></div>';
    } else {
        summary = '<div class="rg-lock">' + esc(q.error || '') + '</div>';
    }

    return '<div class="modal-title">' + esc(t('bank.modal.apply.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t('bank.name.' + _apply.bankId)) + '</div>' +
        '<label class="field-label">' + esc(t('bank.modal.amount')) + '</label>' + amountChips +
        '<label class="field-label">' + esc(t('bank.modal.term')) + '</label>' + termChips + summary +
        '<button class="btn-primary" data-bank-confirm style="width:100%;margin-top:14px;"' + (q.ok ? '' : ' disabled') + '>' +
        esc(t('bank.modal.apply.confirm')) + '</button>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + esc(t('bank.modal.cancel')) + '</button>';
}

export function openBankApplyModal(bankId, productId) {
    ensureRegionalStyle();
    var bank = window.__game.bank;
    var b = BANKS.find(function (x) { return x.id === bankId; });
    var product = b && b.products.find(function (p) { return p.id === productId; });
    if (!b || !product) return;
    var amounts = bank.getAmountOptions(bankId, productId);
    _apply = {
        bankId: bankId, productId: productId,
        amount: amounts.length ? amounts[Math.min(1, amounts.length - 1)] : 0,
        term: product.terms[Math.min(1, product.terms.length - 1)]
    };
    Modal.open('bank-apply', _applyHtml());
}

export function updateBankApply(patch) {
    if (!_apply) return;
    Object.assign(_apply, patch);
    var card = document.querySelector('[data-modal-id="bank-apply"] .modal-card');
    if (card) card.innerHTML = _applyHtml();
}

export function getBankApply() { return _apply; }

// ------------------------------------------------------------ modal bayar awal

function _prepayHtml() {
    var bank = window.__game.bank;
    var data = window.__game.state.get();
    var pq = bank.getPrepayQuote(_prepay.uid, _prepay.fraction);
    if (!pq) return '<div class="modal-title">' + esc(t('bank.err.loan_missing')) + '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px;">' + esc(t('bank.modal.cancel')) + '</button>';

    var chips = '<div class="rg-modal-chips">' + [0.25, 0.5, 0.75, 1].map(function (f) {
        return '<button class="rg-chip' + (f === _prepay.fraction ? ' active' : '') + '" data-bank-fraction="' + f + '">' +
            esc(f === 1 ? t('bank.btn.repay_all') : (f * 100) + '%') + '</button>';
    }).join('') + '</div>';

    return '<div class="modal-title">' + esc(t('bank.modal.prepay.title')) + '</div>' +
        '<div class="modal-sub">' + esc(pq.loan.label || pq.loan.id) + '</div>' + chips +
        '<div class="rg-sum"><span>' + esc(t('bank.modal.principal')) + '</span><b>' + esc(money(pq.amount)) + '</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('bank.modal.penalty')) + '</span><b>' + esc(money(pq.penalty)) + '</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('bank.modal.cash_out')) + '</span><b>' + esc(money(pq.total)) + '</b></div>' +
        '<div class="rg-sum"><span>' + esc(t('bank.modal.cash_after')) + '</span><b>' + esc(money(data.cash - pq.total)) + '</b></div>' +
        (pq.affordable ? '' : '<div class="rg-lock">' + esc(t('bank.err.no_cash')) + '</div>') +
        '<button class="btn-primary" data-bank-prepay-confirm style="width:100%;margin-top:14px;"' + (pq.affordable ? '' : ' disabled') + '>' +
        esc(t('bank.modal.prepay.confirm')) + '</button>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + esc(t('bank.modal.cancel')) + '</button>';
}

export function openBankPrepayModal(uid) {
    ensureRegionalStyle();
    _prepay = { uid: uid, fraction: 0.5 };
    Modal.open('bank-prepay', _prepayHtml());
}

export function updateBankPrepay(patch) {
    if (!_prepay) return;
    Object.assign(_prepay, patch);
    var card = document.querySelector('[data-modal-id="bank-prepay"] .modal-card');
    if (card) card.innerHTML = _prepayHtml();
}

export function getBankPrepay() { return _prepay; }

// ------------------------------------------------------------ modal setor

function _depHtml() {
    var bank = window.__game.bank;
    var data = window.__game.state.get();
    var amounts = bank.getDepositAmountOptions();
    var q = bank.quoteDeposit(_dep);

    var bankChips = '<div class="rg-modal-chips">' + BANKS.map(function (b) {
        return '<button class="rg-chip' + (b.id === _dep.bankId ? ' active' : '') + '" data-dep-bank="' + b.id + '">' + esc(t('bank.name.' + b.id)) + '</button>';
    }).join('') + '</div>';

    var kindChips = '<div class="rg-modal-chips"><button class="rg-chip' + (_dep.kind === 'flex' ? ' active' : '') + '" data-dep-kind="flex">' + esc(t('dep.kind.flex')) + '</button>' +
        DEPOSIT_CONFIG.termOptions.map(function (n) {
            return '<button class="rg-chip' + (_dep.kind === 'term' && _dep.term === n ? ' active' : '') + '" data-dep-kind="' + n + '">' + esc(t('dep.kind.term', { n: n })) + '</button>';
        }).join('') + '</div>';

    var amountChips = '<div class="rg-modal-chips">' + (amounts.length ? amounts.map(function (a) {
        return '<button class="rg-chip' + (a === _dep.amount ? ' active' : '') + '" data-dep-amount="' + a + '">' + esc(money(a)) + '</button>';
    }).join('') : '<span class="rg-row-meta">' + esc(t('dep.modal.min', { n: money(bank.getDepositMin()) })) + '</span>') + '</div>';

    var summary;
    if (q.ok) {
        summary =
            '<div class="rg-sum"><span>' + esc(t('dep.modal.rate')) + '</span><b>' + q.annualPct.toFixed(2) + '%</b></div>' +
            '<div class="rg-sum"><span>' + esc(t('dep.modal.tax', { n: Math.round(q.taxPct * 100) })) + '</span><b>✓</b></div>' +
            (q.kind === 'flex'
                ? '<div class="rg-sum"><span>' + esc(t('dep.modal.monthly')) + '</span><b style="color:var(--success,#34c759)">+' + esc(money(q.monthlyNet)) + '</b></div>'
                : '<div class="rg-sum"><span>' + esc(t('dep.modal.maturity')) + '</span><b>' + esc(money(q.maturity)) + '</b></div>' +
                  '<div class="rg-sum"><span>' + esc(t('dep.modal.profit')) + '</span><b style="color:var(--success,#34c759)">+' + esc(money(q.profit)) + '</b></div>') +
            '<div class="rg-sum"><span>' + esc(t('dep.modal.cash_after')) + '</span><b>' + esc(money(data.cash - q.amount)) + '</b></div>';
    } else {
        summary = '<div class="rg-lock">' + esc(q.error || '') + '</div>';
    }

    return '<div class="modal-title">' + esc(t('dep.modal.title')) + '</div>' +
        '<label class="field-label">' + esc(t('dep.modal.bank')) + '</label>' + bankChips +
        '<label class="field-label">' + esc(t('dep.modal.type')) + '</label>' + kindChips +
        '<label class="field-label">' + esc(t('dep.modal.amount')) + '</label>' + amountChips + summary +
        '<button class="btn-primary" data-dep-confirm style="width:100%;margin-top:14px;"' + (q.ok ? '' : ' disabled') + '>' + esc(t('dep.modal.confirm')) + '</button>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + esc(t('bank.modal.cancel')) + '</button>';
}

export function openDepositModal(bankId) {
    ensureRegionalStyle();
    var bank = window.__game.bank;
    var amounts = bank.getDepositAmountOptions();
    _dep = {
        bankId: bankId || 'global_bank', kind: 'flex', term: 0,
        amount: amounts.length ? amounts[Math.min(1, amounts.length - 1)] : 0
    };
    Modal.open('dep-open', _depHtml());
}

export function updateDeposit(patch) {
    if (!_dep) return;
    Object.assign(_dep, patch);
    var card = document.querySelector('[data-modal-id="dep-open"] .modal-card');
    if (card) card.innerHTML = _depHtml();
}

export function getDeposit() { return _dep; }

// ------------------------------------------------------------ modal tarik

function _wdHtml() {
    var bank = window.__game.bank;
    var wq = bank.getWithdrawQuote(_wd.uid, _wd.fraction);
    if (!wq) return '<div class="modal-title">' + esc(t('dep.err.missing')) + '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px;">' + esc(t('bank.modal.cancel')) + '</button>';

    var body;
    if (wq.flex) {
        var chips = '<div class="rg-modal-chips">' + [0.25, 0.5, 0.75, 1].map(function (f) {
            return '<button class="rg-chip' + (f === _wd.fraction ? ' active' : '') + '" data-dep-fraction="' + f + '">' +
                esc(f === 1 ? t('dep.wd.all') : (f * 100) + '%') + '</button>';
        }).join('') + '</div>';
        body = '<label class="field-label">' + esc(t('dep.wd.amount')) + '</label>' + chips;
    } else {
        body = '<div class="rg-tip">' + esc(t('dep.wd.term_note', { n: Math.round(DEPOSIT_CONFIG.earlyPenaltyPct * 100) })) + '</div>';
    }

    return '<div class="modal-title">' + esc(t('dep.wd.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t('bank.name.' + wq.dep.bankId)) + ' · ' + esc(money(wq.dep.balance)) + '</div>' + body +
        '<div class="rg-sum"><span>' + esc(t('bank.modal.principal')) + '</span><b>' + esc(money(wq.amount)) + '</b></div>' +
        (wq.penalty > 0 ? '<div class="rg-sum"><span>' + esc(t('dep.wd.penalty')) + '</span><b>-' + esc(money(wq.penalty)) + '</b></div>' : '') +
        (wq.forfeited > 0 ? '<div class="rg-sum"><span>' + esc(t('dep.wd.forfeit')) + '</span><b>-' + esc(money(wq.forfeited)) + '</b></div>' : '') +
        '<div class="rg-sum"><span>' + esc(t('dep.wd.receive')) + '</span><b style="color:var(--success,#34c759)">' + esc(money(wq.payout)) + '</b></div>' +
        '<button class="btn-primary" data-dep-withdraw-confirm style="width:100%;margin-top:14px;">' + esc(t('dep.wd.confirm')) + '</button>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:6px;">' + esc(t('bank.modal.cancel')) + '</button>';
}

export function openWithdrawModal(uid) {
    ensureRegionalStyle();
    _wd = { uid: uid, fraction: 1 };
    Modal.open('dep-withdraw', _wdHtml());
}

export function updateWithdraw(patch) {
    if (!_wd) return;
    Object.assign(_wd, patch);
    var card = document.querySelector('[data-modal-id="dep-withdraw"] .modal-card');
    if (card) card.innerHTML = _wdHtml();
}

export function getWithdraw() { return _wd; }
