// FILE: src/ui/panels/SiliconPanel.js
// v2027.1a — Modal Silicon.
// v2027.40 — layout berkelompok, tombol Top Up, gaya konsisten dengan panel lain.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { SiliconService, SILICON_ACTIONS } from '../../systems/SiliconService.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { openSiliconStoreModal } from './SiliconStorePanel.js';

var GROUPS = ['time', 'research', 'production', 'team'];

function _esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _tf(key, fallback) {
    var v = t(key);
    return (v && v !== key) ? v : fallback;
}

function _renderActions(balance) {
    return GROUPS.map(function (g) {
        var items = SILICON_ACTIONS.filter(function (a) { return a.group === g; });
        if (!items.length) return '';
        var rows = items.map(function (a) {
            var can = balance >= a.cost;
            var label = _tf('silicon.action.' + a.id + '.t', a.id);
            var desc = _tf('silicon.action.' + a.id + '.d', '');
            return '<button type="button" class="sil-row' + (can ? '' : ' is-short') + '" data-sil-action="' + a.id + '"' +
                (can ? '' : ' data-sil-short="1"') + '>' +
                '<span class="sil-row-ico">' + a.icon + '</span>' +
                '<span class="sil-row-text">' +
                    '<span class="sil-row-title">' + _esc(label) + '</span>' +
                    (desc ? '<span class="sil-row-desc">' + _esc(desc) + '</span>' : '') +
                '</span>' +
                '<span class="sil-cost">💎 ' + a.cost + '</span>' +
            '</button>';
        }).join('');
        return '<div class="section-label"><span class="section-label-text">' + _tf('silicon.group.' + g, g) + '</span>' +
               '<span class="section-label-line"></span></div>' +
               '<div class="node-list">' + rows + '</div>';
    }).join('');
}

function _renderHistory(history) {
    if (!history.length) {
        return '<div class="sil-empty">' + _tf('silicon.empty', 'No transactions yet.') + '</div>';
    }
    return '<div class="node-list">' + history.slice(0, 6).map(function (h) {
        var positive = h.delta > 0;
        return '<div class="sil-hist-row">' +
            '<span class="sil-hist-reason">' + _esc(h.reason || h.type) + '</span>' +
            '<span class="sil-hist-delta ' + (positive ? 'pos' : 'neg') + '">' + (positive ? '+' : '') + h.delta + '</span>' +
        '</div>';
    }).join('') + '</div>';
}

export function openSiliconModal() {
    var balance = SiliconService.getBalance();
    var history = SiliconService.getHistory();

    var html =
        '<div class="modal-title">💎 ' + _tf('silicon.title', 'Silicon') + '</div>' +
        '<div class="modal-sub">' + _tf('silicon.sub', 'Boost & speed up actions.') + '</div>' +

        '<div class="sil-balance">' +
            '<div>' +
                '<div class="sil-balance-label">' + _tf('silicon.balance', 'BALANCE') + '</div>' +
                '<div class="sil-balance-value">' + balance + ' <span>SIL</span></div>' +
            '</div>' +
            '<button type="button" class="btn-primary sil-topup-btn" data-sil-topup>＋ ' + _tf('silicon.topup', 'Top Up') + '</button>' +
        '</div>' +

        _renderActions(balance) +

        '<div class="section-label"><span class="section-label-text">' + _tf('silicon.history', 'History') + '</span>' +
            '<span class="section-label-line"></span></div>' +
        _renderHistory(history) +

        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:14px;">' +
            _tf('common.close', 'Close') + '</button>';

    Modal.open('silicon-panel', html);

    var root = document.querySelector('[data-modal-id="silicon-panel"]');
    if (!root) return;

    root.addEventListener('click', function (e) {
        if (e.target.closest('[data-sil-topup]')) {
            e.preventDefault();
            openSiliconStoreModal();
            return;
        }
        var btn = e.target.closest('[data-sil-action]');
        if (!btn) return;
        e.preventDefault();

        // SIL kurang → arahkan ke Top Up
        if (btn.dataset.silShort) {
            ToastService.warning(_tf('silicon.short', 'Silicon tidak cukup.'));
            openSiliconStoreModal();
            return;
        }

        var res = SiliconService.runAction(btn.dataset.silAction);
        if (!res.ok) {
            ToastService.error(res.reason || 'Gagal.');
            return;
        }
        Modal.close('silicon-panel', true);
        openSiliconModal();
    });
}

bus.on('silicon:changed', function () {
    if (Modal.isOpen('silicon-panel')) {
        Modal.close('silicon-panel', true);
        openSiliconModal();
    }
});
