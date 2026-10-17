// FILE: src/ui/panels/RegionalBindings.js  (BARU)
// Satu listener klik terdelegasi untuk panel Promosi & Bank (main.js cukup memanggil sekali).
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { t } from '../../core/LanguageService.js';
import { setPromoProduct, getPromoProduct, openPromoConfirmModal } from './PromotionPanel.js';
import {
    openBankApplyModal, updateBankApply, getBankApply,
    openBankPrepayModal, updateBankPrepay, getBankPrepay
} from './BankPanel.js';

var _bound = false;
var OWN_MODALS = ['bank-apply', 'bank-prepay', 'promo-confirm'];

function refreshUi() { bus.emit('regional:ui', {}); }

function vibrateSoft(ms) {
    try {
        var s = window.__game && window.__game.state.get().settings;
        if (s && s.vibrate && navigator.vibrate) navigator.vibrate(ms || 8);
    } catch (e) {}
}

export function bindRegionalActions() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('click', function (e) {
        var g = window.__game;
        if (!g || !g.promotion || !g.bank) return;
        var el;

        // ---- Tutup modal milik panel ini (modal.js hanya mengikat tombol pertama) ----
        if ((el = e.target.closest('[data-modal-close]'))) {
            var holder = el.closest('[data-modal-id]');
            if (holder && OWN_MODALS.indexOf(holder.dataset.modalId) >= 0) Modal.close(holder.dataset.modalId);
            return;
        }

        // ---- Navigasi pintas ----
        if ((el = e.target.closest('[data-open-bank]'))) {
            e.preventDefault(); vibrateSoft();
            bus.emit('advisor:go', { nav: 'team', subtab: 'bank' });
            return;
        }
        if ((el = e.target.closest('[data-open-promo]'))) {
            e.preventDefault(); vibrateSoft();
            bus.emit('advisor:go', { nav: 'market', subtab: 'promo' });
            return;
        }

        // ---- PROMOSI ----
        if ((el = e.target.closest('[data-promo-product]'))) {
            e.preventDefault(); vibrateSoft();
            setPromoProduct(el.dataset.promoProduct);
            refreshUi();
            return;
        }
        if ((el = e.target.closest('[data-promo-open]'))) {
            e.preventDefault(); vibrateSoft();
            openPromoConfirmModal(el.dataset.promoOpen);
            return;
        }
        if ((el = e.target.closest('[data-promo-confirm]'))) {
            e.preventDefault();
            var r = g.promotion.startCampaign(getPromoProduct(), el.dataset.promoConfirm);
            if (!r.ok) { ToastService.error(r.reason || t('promo.err.generic')); return; }
            Modal.close('promo-confirm', true);
            refreshUi();
            return;
        }

        // ---- BANK: ajukan pinjaman ----
        if ((el = e.target.closest('[data-bank-apply]'))) {
            e.preventDefault(); vibrateSoft();
            var parts = String(el.dataset.bankApply).split('|');
            openBankApplyModal(parts[0], parts[1]);
            return;
        }
        if ((el = e.target.closest('[data-bank-amount]'))) {
            e.preventDefault();
            updateBankApply({ amount: Number(el.dataset.bankAmount) });
            return;
        }
        if ((el = e.target.closest('[data-bank-term]'))) {
            e.preventDefault();
            updateBankApply({ term: Number(el.dataset.bankTerm) });
            return;
        }
        if (e.target.closest('[data-bank-confirm]')) {
            e.preventDefault();
            var req = getBankApply();
            if (!req) return;
            var res = g.bank.applyForLoan(req);
            if (!res.ok) { ToastService.error(res.error || t('bank.err.generic')); return; }
            ToastService.success(t('bank.toast.loan', { amount: '$' + res.quote.net.toLocaleString('en-US') }));
            Modal.close('bank-apply', true);
            refreshUi();
            return;
        }

        // ---- BANK: bayar lebih awal ----
        if ((el = e.target.closest('[data-bank-prepay]'))) {
            e.preventDefault(); vibrateSoft();
            openBankPrepayModal(el.dataset.bankPrepay);
            return;
        }
        if ((el = e.target.closest('[data-bank-fraction]'))) {
            e.preventDefault();
            updateBankPrepay({ fraction: Number(el.dataset.bankFraction) });
            return;
        }
        if (e.target.closest('[data-bank-prepay-confirm]')) {
            e.preventDefault();
            var pp = getBankPrepay();
            if (!pp) return;
            var pr = g.bank.prepay(pp.uid, pp.fraction);
            if (!pr.ok) { ToastService.error(pr.error || t('bank.err.generic')); return; }
            ToastService.success(t('bank.toast.prepaid'));
            Modal.close('bank-prepay', true);
            refreshUi();
            return;
        }

        // ---- BANK: kredit modal kerja ----
        if ((el = e.target.closest('[data-bank-draw]'))) {
            e.preventDefault(); vibrateSoft();
            var dr = g.bank.drawLine(Number(el.dataset.bankDraw));
            if (!dr.ok) ToastService.error(dr.error || t('bank.err.generic'));
            else { ToastService.success(t('bank.toast.draw')); refreshUi(); }
            return;
        }
        if ((el = e.target.closest('[data-bank-repay]'))) {
            e.preventDefault(); vibrateSoft();
            var rp = g.bank.repayLine(Number(el.dataset.bankRepay));
            if (!rp.ok) ToastService.error(rp.error || t('bank.err.generic'));
            else { ToastService.success(t('bank.toast.repay')); refreshUi(); }
            return;
        }
    });
}
