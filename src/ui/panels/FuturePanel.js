// FILE: src/ui/panels/FuturePanel.js  (BARU)
// Sub-tab "Future" di tab Riset, tepat di sebelah "Manufaktur".
// Menampilkan kotak-kotak panel masa depan yang masih terkunci.
// Datanya ada di src/data/future-panels.data.js.
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { describeUserControl, USER_CONTROL_CONFIG, USER_CONTROL_POLICY_ORDER, ALGO_CONFIG, USAGE_CATEGORIES, getAlgoValue, getAlgoStoreMult, getAlgoDemandBonus, getAlgoScareMult, computeUsageMix } from '../../systems/FutureEffects.js';
import { computeOsAdoption, formatUsers } from '../../systems/OsAdoptionModel.js';
import { SEGMENTS } from '../../data/market-nav.data.js';
import { describeMonetization, REGULATION_LEVELS, MONETIZE_CONFIG } from '../../systems/UserControlSystem.js';
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
        '</div>' + _renderUsageInsights(data, d) + _renderAlgo(data) + _renderMonetize(data) + _renderRegulation(data);
}

// ---- Wawasan Pengguna: untuk apa pengguna OS memakai ponselnya ----
function _segName(id) {
    var sg = SEGMENTS.find(function (x) { return x.id === id; });
    return sg ? (_en() ? sg.name.en : sg.name.id) : id;
}

function _renderUsageInsights(data, d) {
    var en = _en();
    var title = _tf('uc.insight.title', 'Wawasan Pengguna', 'User insights');
    var a = null;
    try { a = computeOsAdoption(data); } catch (e) {}
    if (!a || !a.hasOs || !(a.activeUsers > 0)) {
        return '<div class="uc-box"><div class="uc-title">' + esc(title) + '</div><div class="uc-desc">' +
            esc(_tf('uc.insight.empty', 'Belum ada pengguna OS. Jual ponsel ber-OS milikmu untuk melihat pola pemakaian.', 'No OS users yet. Sell phones running your own OS to see usage patterns.')) + '</div></div>';
    }
    var mix = computeUsageMix(data, a.activeUsers);
    var level = mix.level;
    var cats = mix.cats;
    var shown = level === 0 ? cats.slice(0, 3) : cats;
    var rnd = level === 0 ? 5 : 1;
    function pct(x) { return (Math.round(x * 100 / rnd) * rnd) + '%'; }

    var bar = '<div class="uc-stack">' + shown.map(function (c) {
        return '<span style="flex:' + Math.max(0.5, c.share * 100) + ';background:' + c.color + '" title="' + esc(en ? c.nameEn : c.name) + '"></span>';
    }).join('') + '</div>';

    var list = shown.map(function (c) {
        var seg = '';
        if (level >= 2 && c.topSegments && c.topSegments.length) {
            seg = '<div class="uc-seginfo">' + c.topSegments.map(function (x) { return esc(_segName(x.id)) + ' ' + Math.round(x.share * 100) + '%'; }).join(' · ') + '</div>';
        }
        return '<div class="uc-cat"><span class="uc-dot" style="background:' + c.color + '"></span>' +
            '<div class="uc-catmain"><div class="uc-catrow"><span>' + esc(en ? c.nameEn : c.name) + '</span><b>' + pct(c.share) + '</b></div>' +
            (level >= 1 ? '<div class="uc-seginfo">≈ ' + esc(formatUsers(c.users)) + ' ' + esc(_tf('uc.insight.users', 'pengguna', 'users')) + '</div>' : '') + seg + '</div></div>';
    }).join('');

    var note = level === 0
        ? _tf('uc.insight.note0', 'Privasi Ketat: data tetap di perangkat, jadi kamu hanya melihat perkiraan kasar 3 kategori teratas.', 'Strict Privacy: data stays on device, so you only see a rough estimate of the top 3 categories.')
        : level === 1
            ? _tf('uc.insight.note1', 'Kebijakan Seimbang: semua kategori terlihat. Pilih "Terbuka" untuk rincian per segmen.', 'Balanced policy: all categories visible. Choose "Open" for a per-segment breakdown.')
            : _tf('uc.insight.note2', 'Kebijakan Terbuka: rincian per segmen tersedia. Harganya: risiko isu privasi lebih tinggi.', 'Open policy: per-segment breakdown available. The price: higher privacy-scare risk.');

    return '<div class="uc-box"><div class="uc-title">' + esc(title) + '</div>' + bar + '<div class="uc-cats">' + list + '</div>' +
        '<div class="uc-note ' + (level === 0 ? 'warn' : 'ok') + '">' + esc(note) + '</div></div>';
}

// ---- Kemudi Algoritma: tiga slider + dampaknya ----
function _renderAlgo(data) {
    var en = _en();
    var sliders = ALGO_CONFIG.sliders.map(function (sl) {
        var v = getAlgoValue(sl.id, data);
        return '<div class="uc-slider"><div class="uc-slrow"><span>' + esc(en ? sl.nameEn : sl.name) + '</span><b data-uc-algo-val="' + sl.id + '">' + v + '</b></div>' +
            '<input type="range" min="0" max="100" step="5" value="' + v + '" data-uc-algo="' + sl.id + '" aria-label="' + esc(en ? sl.nameEn : sl.name) + '">' +
            '<div class="uc-seginfo">' + esc(en ? sl.descEn : sl.desc) + '</div></div>';
    }).join('');
    var storePct = (getAlgoStoreMult(data) - 1) * 100;
    var demPct = getAlgoDemandBonus(data) * 100;
    var scarePct = (getAlgoScareMult(data) - 1) * 100;
    function row(label, val, goodWhenPositive) {
        var cls = Math.abs(val) < 0.5 ? '' : ((val > 0) === goodWhenPositive ? 'good' : 'bad');
        return '<div class="uc-row"><span>' + esc(label) + '</span><b class="' + cls + '">' + (Math.abs(val) < 0.5 ? esc(_tf('uc.normal', 'Normal', 'Normal')) : _pct(val)) + '</b></div>';
    }
    return '<div class="uc-box"><div class="uc-title">' + esc(_tf('uc.algo.title', 'Kemudi Algoritma', 'Algorithm steering')) + '</div>' + sliders +
        '<div class="uc-rows">' +
        row(_tf('uc.algo.store', 'Belanja App Store', 'App Store spending'), storePct, true) +
        row(_tf('uc.algo.demand', 'Permintaan produk', 'Product demand'), demPct, true) +
        row(_tf('uc.algo.scare', 'Peluang event isu privasi', 'Privacy-scare event chance'), scarePct, false) +
        '</div></div>';
}

// ---- Monetisasi Data ----
function _money(n) {
    n = Math.round(n || 0);
    var a = Math.abs(n);
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
    if (a >= 1e3) return '$' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return '$' + n;
}

function _renderMonetize(data) {
    var m = describeMonetization(data);
    function row(label, val, cls) { return '<div class="uc-row"><span>' + esc(label) + '</span><b class="' + (cls || '') + '">' + esc(val) + '</b></div>'; }
    var label = m.on ? _tf('uc.mon.stop', 'Hentikan penjualan data', 'Stop selling data') : _tf('uc.mon.start', 'Jual data teragregasi ke pengiklan', 'Sell aggregated data to advertisers');
    var block = '';
    if (m.blocked === 'strict') block = _tf('uc.mon.blocked_strict', 'Tidak tersedia pada kebijakan Privasi Ketat.', 'Not available under the Strict Privacy policy.');
    else if (m.blocked === 'users') block = _tf('uc.mon.blocked_users', 'Butuh minimal ' + MONETIZE_CONFIG.minUsers + ' pengguna aktif.', 'Needs at least ' + MONETIZE_CONFIG.minUsers + ' active users.');
    var disabled = (!m.on && m.blocked) ? ' disabled' : '';
    var riskPct = Math.round(m.risk * 1000) / 10;
    var riskCls = riskPct >= 10 ? 'bad' : (riskPct >= 5 ? '' : 'good');
    var rows = row(_tf('uc.mon.revenue', 'Perkiraan pendapatan / bulan', 'Estimated revenue / month'), m.blocked ? '-' : _money(m.revenue), m.revenue > 0 ? 'good' : '') +
        row(_tf('uc.mon.risk', 'Peluang sanksi regulator / bulan', 'Regulator action chance / month'), (m.blocked ? '-' : riskPct + '%'), m.blocked ? '' : riskCls) +
        row(_tf('uc.mon.earned', 'Total pendapatan data', 'Total data revenue'), _money(m.earned), '') +
        row(_tf('uc.mon.fines', 'Total denda (' + m.incidents + ' insiden)', 'Total fines (' + m.incidents + ' incidents)'), _money(m.fines), m.fines > 0 ? 'bad' : '');
    var note = m.on
        ? '<div class="uc-note warn">' + esc(_tf('uc.mon.on_note', 'Aktif: pendapatan masuk tiap bulan, tapi kepercayaan pengguna dan regulator ikut dipertaruhkan.', 'Active: revenue arrives monthly, but user and regulator trust is at stake.')) + '</div>'
        : '<div class="uc-note ok">' + esc(_tf('uc.mon.off_note', 'Nonaktif. Pendapatan lebih tinggi pada kebijakan Terbuka dan Personalisasi AI tinggi; negara beraturan ketat memotongnya.', 'Off. Revenue is higher with the Open policy and high AI personalisation; strict countries cut it.')) + '</div>';
    return '<div class="uc-box"><div class="uc-title">' + esc(_tf('uc.mon.title', 'Monetisasi Data', 'Data monetisation')) + '</div>' +
        '<button class="uc-btn uc-wide ' + (m.on ? 'active' : '') + '" data-uc-monetize="' + (m.on ? '0' : '1') + '"' + disabled + '>' + esc(label) + '</button>' +
        (block ? '<div class="uc-seginfo" style="margin-top:6px">' + esc(block) + '</div>' : '') +
        '<div class="uc-rows" style="margin-top:8px">' + rows + '</div>' + note + '</div>';
}

// ---- Regulasi per negara ----
function _renderRegulation(data) {
    var en = _en();
    var m = describeMonetization(data);
    var reg = m.reg;
    var title = _tf('uc.reg.title', 'Regulasi per negara', 'Regulation by country');
    if (!reg.rows.length) {
        return '<div class="uc-box"><div class="uc-title">' + esc(title) + '</div><div class="uc-desc">' +
            esc(_tf('uc.reg.empty', 'Belum ada pengguna OS di negara mana pun.', 'No OS users in any country yet.')) + '</div></div>';
    }
    var rows = reg.rows.slice().sort(function (a, b) { return b.share - a.share; }).slice(0, 6).map(function (r) {
        var lv = REGULATION_LEVELS[r.level] || REGULATION_LEVELS[0];
        return '<div class="uc-row"><span>' + esc(r.flag + ' ' + r.name) + ' <span class="uc-seginfo">' + Math.round(r.share * 100) + '%</span></span>' +
            '<b style="color:' + lv.color + '">' + esc(en ? lv.nameEn : lv.name) + '</b></div>';
    }).join('');
    var exp = Math.round(reg.exposure * 100);
    return '<div class="uc-box"><div class="uc-title">' + esc(title) + '</div>' +
        '<div class="uc-desc">' + esc(_tf('uc.reg.desc', 'Aturan privasi makin ketat seiring tahun. Pendapatan data dipotong dan denda membesar di negara beraturan ketat.', 'Privacy rules tighten over the years. Data revenue is cut and fines grow in strict countries.')) + '</div>' +
        '<div class="uc-rows">' + rows +
        '<div class="uc-row"><span>' + esc(_tf('uc.reg.exposure', 'Paparan regulasi penggunamu', 'Regulatory exposure of your users')) + '</span><b class="' + (exp >= 50 ? 'bad' : (exp <= 20 ? 'good' : '')) + '">' + exp + '%</b></div>' +
        '</div></div>';
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
        '.uc-wide { width: 100%; background: rgba(0,0,0,.25); }',
        '.uc-btn[disabled] { opacity: .4; cursor: not-allowed; }',
        '.uc-stack { display: flex; height: 10px; border-radius: 6px; overflow: hidden; gap: 1px; margin: 4px 0 8px; }',
        '.uc-stack span { display: block; min-width: 3px; }',
        '.uc-cats { display: flex; flex-direction: column; gap: 6px; }',
        '.uc-cat { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; }',
        '.uc-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 4px; flex: none; }',
        '.uc-catmain { flex: 1; min-width: 0; }',
        '.uc-catrow { display: flex; justify-content: space-between; gap: 8px; }',
        '.uc-catrow b { font-variant-numeric: tabular-nums; }',
        '.uc-seginfo { font-size: 11px; color: var(--text-mute); line-height: 1.35; }',
        '.uc-slider { padding: 6px 0; }',
        '.uc-slrow { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; }',
        '.uc-slider input[type=range] { width: 100%; accent-color: var(--accent, #4f8cff); margin: 4px 0 2px; }',
        '.uc-note { margin-top: 8px; font-size: 11.5px; line-height: 1.4; padding: 6px 8px; border-radius: 8px; }',
        '.uc-note.ok { background: var(--success-soft, rgba(16,185,129,.14)); color: var(--success, #10b981); }',
        '.uc-note.warn { background: var(--warn-soft, rgba(245,158,11,.14)); color: var(--warn, #f59e0b); }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-future-panel', '');
    style.textContent = css;
    document.head.appendChild(style);
}
