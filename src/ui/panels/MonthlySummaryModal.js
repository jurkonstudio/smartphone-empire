// FILE: src/ui/panels/MonthlySummaryModal.js
// v2027.13c — i18n.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';

export function initMonthlySummary() {
    bus.on('economy:month-processed', function (entry) { _show(entry); });
}

function _infraLabel() {
    const k = 'monthly.infra_tax';
    const v = t(k);
    if (v && v !== k) return v;
    return 'Pajak & utilitas infrastruktur';
}

function _afterSalesLabel() {
    try { return document.documentElement.lang === 'en' || (window.__game && window.__game.LanguageService.getLang() === 'en') ? 'After-sales (claims, OS support, service)' : 'Pasca-jual (klaim, dukungan OS, servis)'; }
    catch (err) { return 'Pasca-jual (klaim, dukungan OS, servis)'; }
}

function _show(e) {
    const netColor = e.net >= 0 ? 'var(--accent)' : 'var(--danger)';
    const fmt = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    const html = `
        <div class="modal-title">${t('monthly.title', { month: e.month, year: e.year })}</div>
        <div class="modal-sub">${t('monthly.sub')}</div>
        <div class="sum-row"><span>${t('monthly.income')}</span><b>${fmt(e.income)}</b></div>
        <div class="sum-row"><span>${t('monthly.salary')}</span><b>-${fmt(e.breakdown.salary)}</b></div>
        <div class="sum-row"><span>${t('monthly.fixed')}</span><b>-${fmt(e.breakdown.fixed)}</b></div>
        ${(e.breakdown.infraTax || 0) > 0 ? `<div class="sum-row"><span>${_infraLabel()}</span><b>-${fmt(e.breakdown.infraTax)}</b></div>` : ''}
        ${(e.breakdown.afterSales || 0) > 0 ? `<div class="sum-row"><span>${_afterSalesLabel()}</span><b>-${fmt(e.breakdown.afterSales)}</b></div>` : ''}
        <div class="sum-row"><span>${t('monthly.loan_interest')}</span><b>-${fmt(e.breakdown.loanInterest)}</b></div>
        <div class="sum-row"><span>${t('monthly.tax')}</span><b>-${fmt(e.tax)}</b></div>
        <div class="sum-row total">
            <span>${t('monthly.net')}</span>
            <b style="color:${netColor}">${e.net >= 0 ? '+' : ''}${fmt(e.net)}</b>
        </div>
        ${(e.breakdown.loanPrincipal || 0) > 0 ? `<div class="sum-row" style="color:var(--text-mute);"><span>${t('monthly.loan_principal')}</span><b>-${fmt(e.breakdown.loanPrincipal)}</b></div>` : ''}
        ${(e.breakdown.depositInterest || 0) > 0 ? `<div class="sum-row" style="color:var(--text-mute);"><span>${t('monthly.deposit_interest')}</span><b>+${fmt(e.breakdown.depositInterest)}</b></div>` : ''}
        <div class="sum-row"><span>${t('monthly.cash_end')}</span><b>${fmt(e.cash)}</b></div>
        <button class="btn-primary" data-modal-close style="margin-top:16px;">${t('monthly.close')}</button>
    `;
    Modal.open('monthly-summary', html);
}
