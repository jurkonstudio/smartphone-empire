// FILE: src/ui/panels/EraEventModal.js  (BARU — event pilihan 2000–2002)
// ============================================================
// Modal keputusan untuk EraEventSystem. Game dijeda saat modal tampil dan
// dikembalikan ke keadaan semula setelah pemain menutup layar hasil.
// Teks efek dibuat otomatis dari data supaya selalu cocok dengan angka sebenarnya.
// ============================================================
import { Modal } from '../modal.js';
import { escapeHtml } from '../../utils/html.js';
import { formatCurrency } from '../../utils/format.js';
import { LanguageService } from '../../core/LanguageService.js';
import { WalletService } from '../../systems/WalletService.js';

const MODAL_ID = 'era-event';
const RESULT_ID = 'era-event-result';

function _lang() { try { return LanguageService.getLang() === 'id' ? 'id' : 'en'; } catch (e) { return 'en'; } }
function _L(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_lang()] || o.en || o.id || '')); }

const SCOPE_LABEL = {
    all:     { id: 'semua ponsel',        en: 'all phones' },
    budget:  { id: 'ponsel terjangkau',   en: 'budget phones' },
    premium: { id: 'ponsel premium',      en: 'premium phones' },
    color:   { id: 'ponsel layar warna',  en: 'colour-screen phones' },
    camera:  { id: 'ponsel berkamera',    en: 'camera phones' }
};

// Daftar baris efek (tanpa HTML) untuk satu pilihan.
export function describeEffects(choice) {
    var id = _lang() === 'id';
    var out = [];
    var fx = choice.effects || {};
    if (choice.cost > 0) out.push({ tone: 'bad', text: (id ? 'Biaya ' : 'Cost ') + formatCurrency(choice.cost) });
    if (fx.cash) out.push({ tone: fx.cash > 0 ? 'good' : 'bad', text: (id ? 'Kas ' : 'Cash ') + (fx.cash > 0 ? '+' : '-') + formatCurrency(Math.abs(fx.cash)) });
    if (fx.reputation) out.push({ tone: fx.reputation > 0 ? 'good' : 'bad', text: (id ? 'Reputasi ' : 'Reputation ') + (fx.reputation > 0 ? '+' : '') + fx.reputation });
    (fx.demand || []).forEach(function (m) {
        var pct = Math.round((m.mult - 1) * 100);
        var scope = _L(SCOPE_LABEL[m.scope] || SCOPE_LABEL.all);
        out.push({
            tone: pct >= 0 ? 'good' : 'bad',
            text: (id ? 'Permintaan ' : 'Demand for ') + scope + ' ' + (pct >= 0 ? '+' : '') + pct + '% ' + (id ? 'selama ' : 'for ') + m.days + (id ? ' hari' : ' days')
        });
    });
    if (!out.length) out.push({ tone: 'mute', text: id ? 'Tidak ada perubahan' : 'No change' });
    return out;
}

function _toneColor(tone) {
    if (tone === 'good') return 'var(--success)';
    if (tone === 'bad') return 'var(--danger)';
    return 'var(--text-mute)';
}

function _choiceHtml(ch) {
    var affordable = !(ch.cost > 0) || WalletService.canAfford(ch.cost);
    var lines = describeEffects(ch).map(function (l) {
        return '<div style="font-size:11.5px;color:' + _toneColor(l.tone) + ';">' + escapeHtml(l.text) + '</div>';
    }).join('');
    var warn = affordable ? '' : '<div style="font-size:11.5px;color:var(--danger);margin-top:2px;">' +
        escapeHtml(_lang() === 'id' ? 'Dana tidak cukup' : 'Not enough funds') + '</div>';
    return '<button class="btn-secondary" data-era-choice="' + escapeHtml(ch.id) + '"' + (affordable ? '' : ' disabled') +
        ' style="width:100%;text-align:left;margin-top:8px;padding:10px 12px;display:block;' + (affordable ? '' : 'opacity:.55;') + '">' +
        '<div style="font-weight:600;font-size:13px;margin-bottom:3px;">' + escapeHtml(_L(ch.label)) + '</div>' +
        lines + warn + '</button>';
}

function _resume(ctx) {
    try { if (ctx && ctx.resumeIfRunning) ctx.resumeIfRunning(); } catch (e) {}
}

// ctx = { eraEvents, resumeIfRunning }
export function openEraEventModal(def, ctx) {
    if (!def || !ctx || !ctx.eraEvents) return false;
    var html =
        '<div class="modal-title">' + escapeHtml(_L(def.title)) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_L(def.body)) + '</div>' +
        def.choices.map(_choiceHtml).join('');

    // dismissible:false -> keputusan wajib (selalu ada satu pilihan gratis).
    var node = Modal.open(MODAL_ID, html, { dismissible: false });
    node.querySelectorAll('[data-era-choice]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var res = ctx.eraEvents.choose(def.id, btn.getAttribute('data-era-choice'));
            if (!res.ok) return;
            _openResult(def, res, ctx);
        });
    });
    return true;
}

function _openResult(def, res, ctx) {
    var id = _lang() === 'id';
    var lines = describeEffects(res.choice).map(function (l) {
        return '<div style="font-size:12px;color:' + _toneColor(l.tone) + ';">' + escapeHtml(l.text) + '</div>';
    }).join('');
    var html =
        '<div class="modal-title">' + escapeHtml(_L(def.title)) + '</div>' +
        '<div class="modal-sub"><b>' + escapeHtml(_L(res.choice.label)) + '</b><br>' + escapeHtml(res.outcome) + '</div>' +
        '<div style="margin-bottom:12px;">' + lines + '</div>' +
        '<button class="btn-primary" data-modal-close style="width:100%;">' + escapeHtml(id ? 'Lanjut' : 'Continue') + '</button>';
    Modal.open(RESULT_ID, html, {
        dismissible: false,
        onClose: function () {
            ctx.eraEvents.advance();   // event antrean berikutnya (bila ada)
            _resume(ctx);
        }
    });
}
