// FILE: src/ui/panels/FuturePanel.js  (BARU)
// Sub-tab "Future" di tab Riset, tepat di sebelah "Manufaktur".
// Menampilkan kotak-kotak panel masa depan yang masih terkunci.
// Datanya ada di src/data/future-panels.data.js.
import { renderIcon } from '../icons/FeatureIcons.js';
import {
    FUTURE_PANELS, FUTURE_SYSTEM_LABELS,
    getFutureUnlockState
} from '../../data/future-panels.data.js';

let _stylesInjected = false;

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _data() {
    try { return window.__game.state.get(); } catch (e) { return {}; }
}

// Label tab: tanpa gembok, karena tab Future sudah terbuka.
export function renderFutureTabLabel() {
    return 'Future';
}

export function renderFuturePanel() {
    _ensureStyles();
    var data = _data();
    var anyOpen = FUTURE_PANELS.some(function (p) { return getFutureUnlockState(p, data).unlocked; });

    var head = '<div class="fp-hero">' +
        '<div class="fp-hero-title">' + renderIcon('sparkles', 16) + ' Future</div>' +
        '<div class="fp-hero-sub">' + esc(anyOpen
            ? 'Teknologi masa depan yang sudah terbuka.'
            : 'Teknologi masa depan yang akan terhubung ke sistem game. Panel di bawah ini masih terkunci.') + '</div>' +
        '</div>';

    var cards = FUTURE_PANELS.map(function (p) {
        var st = getFutureUnlockState(p, data);
        var links = (p.linksTo || []).map(function (k) {
            return '<span class="fp-tag">' + esc(FUTURE_SYSTEM_LABELS[k] || k) + '</span>';
        }).join('');
        return '<div class="fp-card ' + (st.unlocked ? 'fp-open' : 'fp-locked') + '" data-future-id="' + esc(p.id) + '">' +
            '<div class="fp-card-top">' +
                '<div class="fp-ico">' + renderIcon(p.icon, 20) + '</div>' +
                '<div class="fp-lock">' + renderIcon(st.unlocked ? 'check' : 'lock', 14) + '</div>' +
            '</div>' +
            '<div class="fp-name">' + esc(p.name) + '</div>' +
            '<div class="fp-desc">' + esc(p.description) + '</div>' +
            '<div class="fp-links">' + links + '</div>' +
            '<div class="fp-status">' + esc(st.unlocked ? 'Terbuka' : st.reason) + '</div>' +
            '</div>';
    }).join('');

    return head + '<div class="fp-grid">' + cards + '</div>';
}

function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var css = [
        '.fp-hero { padding: 12px; margin: 8px 0 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); }',
        '.fp-hero-title { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 6px; }',
        '.fp-hero-sub { font-size: 12px; color: var(--text-dim); margin-top: 4px; line-height: 1.4; }',
        '.fp-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }',
        '@media (min-width: 640px) { .fp-grid { grid-template-columns: 1fr 1fr; } }',
        '.fp-card { position: relative; padding: 14px; border-radius: 14px; background: var(--surface, rgba(255,255,255,.04)); border: 1px dashed var(--border, rgba(255,255,255,.14)); display: flex; flex-direction: column; gap: 6px; }',
        '.fp-card.fp-locked { opacity: .72; }',
        '.fp-card.fp-open { border: 1px solid var(--accent, #4f8cff); }',
        '.fp-card-top { display: flex; align-items: center; justify-content: space-between; }',
        '.fp-ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: rgba(255,255,255,.06); }',
        '.fp-lock { opacity: .6; }',
        '.fp-name { font-weight: 700; font-size: 14px; }',
        '.fp-desc { font-size: 12px; color: var(--text-dim); line-height: 1.45; }',
        '.fp-links { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }',
        '.fp-tag { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.06); color: var(--text-mute); }',
        '.fp-status { font-size: 12px; color: var(--text-mute); margin-top: 2px; }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-future-panel', '');
    style.textContent = css;
    document.head.appendChild(style);
}
