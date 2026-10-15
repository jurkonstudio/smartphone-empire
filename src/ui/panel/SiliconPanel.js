// FILE: src/ui/panels/SiliconPanel.js
// v2027.1a — Modal Silicon.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { SiliconService, SILICON_ACTIONS } from '../../systems/SiliconService.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';

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
    return SILICON_ACTIONS.map(function (a) {
        var can = balance >= a.cost;
        var opacity = can ? '1' : '0.5';
        var btnCls = can ? 'btn-primary' : 'btn-secondary';
        var label = _tf('silicon.action.' + a.id + '.t', a.id);
        var desc = _tf('silicon.action.' + a.id + '.d', '');
        return '<button class="' + btnCls + '" data-sil-action="' + a.id + '" ' +
            (can ? '' : 'disabled ') +
            'style="width:100%;padding:12px;text-align:left;display:flex;align-items:center;gap:10px;margin-bottom:8px;opacity:' + opacity + ';">' +
            '<span style="font-size:20px;">' + a.icon + '</span>' +
            '<span style="flex:1;min-width:0;">' +
                '<span style="display:block;font-weight:700;font-size:13px;">' + _esc(label) + '</span>' +
                (desc ? '<span style="display:block;font-size:11px;color:var(--text-mute);margin-top:2px;">' + _esc(desc) + '</span>' : '') +
            '</span>' +
            '<span style="font-weight:800;font-size:13px;flex-shrink:0;">' + a.cost + ' SIL</span>' +
        '</button>';
    }).join('');
}

function _renderHistory(history) {
    if (!history.length) {
        return '<div style="font-size:11px;color:var(--text-mute);padding:6px 0;">' +
            _tf('silicon.empty', 'No transactions yet.') + '</div>';
    }
    return history.slice(0, 6).map(function (h) {
        var positive = h.delta > 0;
        var color = positive ? 'var(--success)' : 'var(--danger)';
        var sign = positive ? '+' : '';
        return '<div style="display:flex;justify-content:space-between;gap:10px;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
            '<span style="color:var(--text-dim);">' + _esc(h.reason || h.type) + '</span>' +
            '<span style="color:' + color + ';font-weight:700;">' + sign + h.delta + '</span>' +
        '</div>';
    }).join('');
}

export function openSiliconModal() {
    var balance = SiliconService.getBalance();
    var history = SiliconService.getHistory();

    var html =
        '<div class="modal-title">💎 ' + _tf('silicon.title', 'Silicon') + '</div>' +
        '<div class="modal-sub">' + _tf('silicon.sub', 'Boost & speed up actions.') + '</div>' +

        '<div style="background:linear-gradient(135deg, rgba(79,140,255,0.14), rgba(139,92,246,0.14));' +
            'border-radius:12px;padding:14px;margin-bottom:14px;text-align:center;">' +
            '<div style="font-size:11px;color:var(--text-mute);letter-spacing:0.5px;">' +
                _tf('silicon.balance', 'BALANCE') + '</div>' +
            '<div style="font-size:30px;font-weight:900;color:var(--accent);letter-spacing:-0.02em;line-height:1.1;">' +
                balance + ' <span style="font-size:14px;color:var(--text-dim);">SIL</span></div>' +
        '</div>' +

        _renderActions(balance) +

        '<div class="card-title" style="margin-top:16px;">' +
            _tf('silicon.history', 'History') + '</div>' +
        _renderHistory(history) +

        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:14px;padding:10px;">' +
            _tf('common.close', 'Close') + '</button>';

    Modal.open('silicon-panel', html);

    var root = document.querySelector('[data-modal-id="silicon-panel"]');
    if (!root) return;

    root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-sil-action]');
        if (!btn) return;
        e.preventDefault();
        if (btn.disabled) return;

        var id = btn.dataset.silAction;
        var res = SiliconService.runAction(id);
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
