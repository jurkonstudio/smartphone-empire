// FILE: src/ui/panels/FuturePanel.js  (BARU)
// Sub-tab "Future" di tab Riset, tepat di sebelah "Manufaktur".
// Menampilkan kotak-kotak panel masa depan yang masih terkunci.
// Datanya ada di src/data/future-panels.data.js.
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { describeUserControl, USER_CONTROL_CONFIG, USER_CONTROL_POLICY_ORDER } from '../../systems/FutureEffects.js';
import { futureName, futureDesc, futureSystemLabel, nodeNameById } from '../../data/i18n/research-localize.js';
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
            ? t('future.hero.open')
            : t('future.hero.locked')) + '</div>' +
        '</div>';

    var cards = FUTURE_PANELS.map(function (p) {
        var st = getFutureUnlockState(p, data);
        var links = (p.linksTo || []).map(function (k) {
            return '<span class="fp-tag">' + esc(futureSystemLabel(k, FUTURE_SYSTEM_LABELS[k] || k)) + '</span>';
        }).join('');
        return '<div class="fp-card ' + (st.unlocked ? 'fp-open' : 'fp-locked') + '" data-future-id="' + esc(p.id) + '">' +
            '<div class="fp-card-top">' +
                '<div class="fp-ico">' + renderIcon(p.icon, 20) + '</div>' +
                '<div class="fp-lock">' + renderIcon(st.unlocked ? 'check' : 'lock', 14) + '</div>' +
            '</div>' +
            '<div class="fp-name">' + esc(futureName(p)) + '</div>' +
            '<div class="fp-desc">' + esc(futureDesc(p)) + '</div>' +
            '<div class="fp-links">' + links + '</div>' +
            '<div class="fp-status">' + esc(_statusText(p, st)) + '</div>' +
            ((p.id === 'user_control' && st.unlocked) ? _renderUserControl(data) : '') +
            '</div>';
    }).join('');

    return head + '<div class="fp-grid">' + cards + '</div>';
}

// Teks status kartu: terkunci -> alasan; terbuka -> "Terbuka" (+ efek menyusul bila belum terhubung).
function _statusText(p, st) {
    if (st.unlocked) {
        var base = t('future.status.open');
        return (p.connected && p.connected.length) ? base : base + '. ' + t('future.status.open_soon');
    }
    if (!st.reasonKey) return st.reason;
    var vars = st.reasonVars;
    if (vars && vars.nodeId) vars = { id: nodeNameById(vars.nodeId, vars.id) };   // nama riset sesuai bahasa
    return t(st.reasonKey, vars);
}


// ---- Kontrol Pengguna: pilihan kebijakan + ringkasan efek ----
function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function _tf(key, id, en) { var v = t(key); return (v && v !== key) ? v : (_en() ? en : id); }
function _pct(n) { var r = Math.round(n * 10) / 10; return (r > 0 ? '+' : '') + r + '%'; }

function _renderUserControl(data) {
    var d = describeUserControl(data);
    var en = _en();
    var btns = USER_CONTROL_POLICY_ORDER.map(function (id) {
        var pol = USER_CONTROL_CONFIG.policies[id];
        return '<button class="uc-btn ' + (d.policy.id === id ? 'active' : '') + '" data-uc-policy="' + id + '" aria-pressed="' + (d.policy.id === id) + '">' + esc(en ? pol.nameEn : pol.name) + '</button>';
    }).join('');

    var scarePct = (d.scareMult - 1) * 100;
    function row(label, val, cls) { return '<div class="uc-row"><span>' + esc(label) + '</span><b class="' + (cls || '') + '">' + esc(val) + '</b></div>'; }
    var scareCls = scarePct < -0.5 ? 'good' : (scarePct > 0.5 ? 'bad' : '');
    var demCls = d.demandPct > 0.05 ? 'good' : (d.demandPct < -0.05 ? 'bad' : '');
    var aiPct = (d.aiFactor - 1) * 100;
    var aiCls = aiPct > 0.5 ? 'good' : (aiPct < -0.5 ? 'bad' : '');
    var rows = row(_tf('uc.row.scare', 'Peluang event isu privasi', 'Privacy-scare event chance'), d.scareMult === 1 ? _tf('uc.normal', 'Normal', 'Normal') : _pct(scarePct), scareCls) +
        row(_tf('uc.row.demand', 'Permintaan (pro & premium)', 'Demand (pro & premium)'), _pct(d.demandPct), demCls) +
        row(_tf('uc.row.ai', 'Besar diskon F-AI & Alat Pengembang', 'F-AI & Dev Tools discount size'), d.aiFactor === 1 ? _tf('uc.normal', 'Normal', 'Normal') : _pct(aiPct), aiCls) +
        (d.wellbeingPct > 0 ? row(_tf('uc.row.wellbeing', 'Bonus Kesejahteraan Digital (anak muda & senior)', 'Digital Wellbeing bonus (youth & seniors)'), _pct(d.wellbeingPct), 'good') : '');

    var req = d.hasPrivacyOs
        ? '<div class="uc-note ok">' + esc(_tf('uc.req.ok', 'Pusat Privasi aktif di OS-mu: efek perlindungan berlaku.', 'Privacy Center is active in your OS: protection effects apply.')) + '</div>'
        : '<div class="uc-note warn">' + esc(_tf('uc.req.missing', 'Efek perlindungan butuh fitur OS "Pusat Privasi" (OS milik sendiri, mulai 2020). Biaya kebijakan tetap berlaku.', 'Protection effects need the OS feature "Privacy Center" (own OS, from 2020). Policy costs still apply.')) + '</div>';

    return '<div class="uc-box">' +
        '<div class="uc-title">' + esc(_tf('uc.title', 'Kebijakan data', 'Data policy')) + '</div>' +
        '<div class="uc-seg" role="group">' + btns + '</div>' +
        '<div class="uc-desc">' + esc(en ? d.policy.descEn : d.policy.desc) + '</div>' +
        '<div class="uc-rows">' + rows + '</div>' + req +
        '</div>';
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
        '.fp-status { font-size: 12px; color: var(--text-mute); margin-top: 2px; }',
        '.uc-box { margin-top: 8px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--border, rgba(255,255,255,.08)); }',
        '.uc-title { font-size: 10.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-tertiary, var(--text-mute)); margin-bottom: 6px; }',
        '.uc-seg { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: rgba(0,0,0,.25); }',
        '.uc-btn { flex: 1; min-height: 34px; border: 0; border-radius: 8px; background: transparent; color: var(--text-secondary, inherit); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }',
        '.uc-btn.active { background: var(--accent-soft, rgba(79,140,255,.18)); color: var(--accent, #4f8cff); box-shadow: inset 0 0 0 1px var(--accent, #4f8cff); }',
        '.uc-desc { font-size: 12px; color: var(--text-dim); line-height: 1.45; margin: 8px 0; }',
        '.uc-rows { display: flex; flex-direction: column; }',
        '.uc-row { display: flex; justify-content: space-between; gap: 10px; padding: 5px 0; border-top: 1px solid var(--border, rgba(255,255,255,.07)); font-size: 12px; color: var(--text-secondary, inherit); }',
        '.uc-row b { font-variant-numeric: tabular-nums; white-space: nowrap; }',
        '.uc-row b.good { color: var(--success, #10b981); } .uc-row b.bad { color: var(--danger, #ef4444); }',
        '.uc-note { margin-top: 8px; font-size: 11.5px; line-height: 1.4; padding: 6px 8px; border-radius: 8px; }',
        '.uc-note.ok { background: var(--success-soft, rgba(16,185,129,.14)); color: var(--success, #10b981); }',
        '.uc-note.warn { background: var(--warn-soft, rgba(245,158,11,.14)); color: var(--warn, #f59e0b); }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-future-panel', '');
    style.textContent = css;
    document.head.appendChild(style);
}
