// FILE: src/ui/panels/RegistrarContract.js  (BARU)
// Halaman "Terima Kontrak" untuk akreditasi registrar ICANN: tanda tangan RAA + perjanjian escrow data, bayar biaya tahunan.
// Dibuka dari tombol di kartu Registrar atau dari surat ICANN di Pesan. Semua teks lewat i18n (registrar.*).
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { ToastService } from '../../core/ToastService.js';
import { REGISTRAR_CONFIG as C } from '../../data/registrar.data.js';
import { ensureRegistrarState, canAcceptContract } from '../../systems/RegistrarSystem.js';

var MODAL_ID = 'registrar-contract-modal';
var _signed = { raa: false, escrow: false };
var _sys = null, _done = null;

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('rgc-style')) return;
    var el = document.createElement('style');
    el.id = 'rgc-style';
    el.textContent = [
        '.rgc-title{font-size:17px;font-weight:700;margin-bottom:10px}',
        '.rgc-sign{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;padding:12px;margin-bottom:8px;border-radius:12px;',
        'border:1px solid var(--border,rgba(255,255,255,.14));background:rgba(255,255,255,.05);color:inherit;font:inherit;font-size:13px;line-height:1.4;cursor:pointer}',
        '.rgc-sign[aria-pressed="true"]{border-color:var(--accent,#4f8cff);background:var(--accent-soft,rgba(79,140,255,.16))}',
        '.rgc-box{flex:0 0 auto;width:18px;height:18px;margin-top:1px;border-radius:5px;border:2px solid currentColor;display:grid;place-items:center;font-size:12px;line-height:1}',
        '.rgc-row{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-top:1px solid var(--border,rgba(255,255,255,.08));font-size:13px}',
        '.rgc-row b{font-variant-numeric:tabular-nums}',
        '.rgc-note{margin-top:8px;font-size:12px;line-height:1.4;color:var(--text-dim,#a1a1aa)}',
        '.rgc-note.bad{color:var(--danger,#ef4444)}',
        '.rgc-foot{display:flex;gap:8px;margin-top:14px}',
        '.rgc-btn{flex:1;min-height:42px;border:0;border-radius:12px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;background:rgba(255,255,255,.08);color:inherit}',
        '.rgc-btn.pri{background:var(--accent,#4f8cff);color:#fff}',
        '.rgc-btn[disabled]{opacity:.4;cursor:not-allowed}'
    ].join('');
    document.head.appendChild(el);
}

function body(data) {
    var r = ensureRegistrarState(data);
    var left = r.app && r.app.phase === 'offer' ? r.app.daysLeft : 0;
    var chk = canAcceptContract(data);
    var ready = _signed.raa && _signed.escrow && chk.ok;
    function sign(key, label) {
        var on = _signed[key];
        return '<button type="button" class="rgc-sign" data-rgc-sign="' + key + '" aria-pressed="' + on + '"><span class="rgc-box">' + (on ? '✓' : '') + '</span><span>' + esc(label) + '</span></button>';
    }
    return '<div class="rgc-title">' + esc(t('registrar.contract.title')) + '</div>' +
        sign('raa', t('registrar.contract.raa')) + sign('escrow', t('registrar.contract.escrow')) +
        '<div class="rgc-row"><span>' + esc(t('registrar.contract.annual')) + '</span><b>' + money(C.annualFee) + '</b></div>' +
        '<div class="rgc-row"><span>' + esc(t('registrar.contract.capital')) + '</span><b>' + money(C.workingCapital) + '</b></div>' +
        '<div class="rgc-note">' + esc(t('registrar.contract.expires', { n: left })) + ' ' + esc(t('registrar.contract.next')) + '</div>' +
        (chk.ok ? '' : '<div class="rgc-note bad">' + esc(t('registrar.contract.need_cash')) + '</div>') +
        '<div class="rgc-foot"><button type="button" class="rgc-btn" data-modal-close>' + esc(t('registrar.contract.close')) + '</button>' +
        '<button type="button" class="rgc-btn pri" data-rgc-go' + (ready ? '' : ' disabled') + '>' + esc(t('registrar.contract.sign')) + '</button></div>';
}

function root() { return document.querySelector('[data-modal-id="' + MODAL_ID + '"]'); }

function rerender() {
    var r = root(); if (!r) return;
    var host = r.querySelector('.rgc-host');
    var d; try { d = window.__game.state.get(); } catch (e) { return; }
    if (host) host.innerHTML = body(d);
}

function onClick(e) {
    var tg = e.target; if (!tg || !tg.closest) return;
    var b = tg.closest('[data-rgc-sign]');
    if (b) { var k = b.getAttribute('data-rgc-sign'); _signed[k] = !_signed[k]; rerender(); return; }
    if (tg.closest('[data-rgc-go]')) {
        if (!_sys) return;
        var res = _sys.accept(_signed.raa, _signed.escrow);
        if (res && res.ok) {
            Modal.close(MODAL_ID);
            try { ToastService.success(t('registrar.contract.done')); } catch (err) {}
            if (typeof _done === 'function') _done();
        } else rerender();
    }
}

// system = instance RegistrarSystem, onDone = dipanggil setelah kontrak ditandatangani (render ulang layar).
export function openRegistrarContract(system, onDone) {
    var d; try { d = window.__game.state.get(); } catch (e) { return false; }
    var r = ensureRegistrarState(d);
    if (!r.app || r.app.phase !== 'offer') return false;
    ensureStyle();
    _sys = system; _done = onDone || null;
    _signed = { raa: false, escrow: false };
    var node = Modal.open(MODAL_ID, '<div class="rgc-host">' + body(d) + '</div>');
    if (node) node.addEventListener('click', onClick);
    return true;
}
