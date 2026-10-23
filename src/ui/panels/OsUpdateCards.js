import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/OsUpdateCards.js  (REPLACE v2)
// ============================================================
// Tab "Rancang Update" di panel Riset > OS.
// Pemain memilih KARTU fitur per jalur, lalu merakit satu build.
// Biaya = biaya pengembangan fitur + biaya rilis per build.
// Logika tetap di OSSystem (startVersion / previewUpdate).
// Semua teks lewat t() (kamus: src/data/i18n/os-update-cards.i18n.js).
// ============================================================
import { OS_ERAS, getOsFeatureById } from '../../data/os.data.js';
import { OS_UPDATE_TRACKS, getOsEraIndexForYear, findUnmappedOsFeatures } from '../../data/os-update-cards.data.js';
import { getNodeById } from '../../data/research.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { ToastService } from '../../core/ToastService.js';
import { WalletService } from '../../systems/WalletService.js';
import { t } from '../../core/LanguageService.js';
import { getOsFeatureCost, currentGameData } from '../../systems/FutureEffects.js';

var STAT_CHIPS = [
    { k: 'stability', key: 'osuc.stat.stability' },
    { k: 'speed', key: 'osuc.stat.speed' },
    { k: 'features', key: 'osuc.stat.features' },
    { k: 'security', key: 'osuc.stat.security' },
    { k: 'design', key: 'osuc.stat.design' }
];

var _draft = [];      // id kartu yang dipilih untuk build berikutnya
var _sys = null;      // OSSystem aktif
var _bound = false;
var _styled = false;
var _warned = false;

// Terjemahan dengan fallback ke teks asli bila kunci belum ada.
function _tx(key, fallback, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fallback;
}
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _rerender() { if (window.__game && window.__game.renderSoft) window.__game.renderSoft(); }
function _featName(id) { var f = getOsFeatureById(id); return _tx('osuc.feat.' + id + '.name', f ? f.name : id); }
function _featDesc(id) { var f = getOsFeatureById(id); return _tx('osuc.feat.' + id + '.desc', f ? f.description : ''); }
function _trackName(tr) { return _tx('osuc.track.' + tr.id + '.name', tr.name); }
function _trackHint(tr) { return _tx('osuc.track.' + tr.id + '.hint', tr.hint); }
function _eraName(eraId) {
    var era = OS_ERAS.find(function (e) { return e.id === eraId; });
    return _tx('osuc.era.' + eraId, era ? era.name : eraId);
}

export function resetUpdateDraft() { _draft = []; }

// ============================================================
// ALASAN KUNCI (diterjemahkan di UI, bukan dari string OSSystem)
// ============================================================
function _lockReason(id, st) {
    var f = getOsFeatureById(id);
    if (!f) return _tx('osuc.lock.generic', 'Locked');
    var year = window.__game.state.get().time.currentYear;
    if (year < f.minYear) return _tx('osuc.lock.year', 'Available in ' + f.minYear, { year: f.minYear });
    var missF = (f.requiresFeatures || []).filter(function (rf) { return !_sys.hasFeature(rf); });
    if (missF.length) {
        var fn = missF.map(_featName).join(', ');
        return _tx('osuc.lock.feature', 'Requires feature: ' + fn, { names: fn });
    }
    if (st.missingResearch && st.missingResearch.length) {
        var rn = st.missingResearch.map(function (rId) { var n = getNodeById(rId); return n ? n.name : rId; }).join(', ');
        return _tx('osuc.lock.research', 'Requires research: ' + rn, { names: rn });
    }
    return _tx('osuc.lock.generic', 'Locked');
}

// ============================================================
// RENDER
// ============================================================
export function renderUpdateCardsTab(osSys, data) {
    _sys = osSys;
    _ensureStyles();
    _ensureHandlers();
    if (!_warned) {
        _warned = true;
        var miss = findUnmappedOsFeatures();
        if (miss.length) console.warn('[OsUpdateCards] fitur belum masuk jalur:', miss);
    }

    var year = data.time.currentYear;
    var eraId = OS_ERAS[getOsEraIndexForYear(year)].id;
    var maxSlots = osSys._getMaxFeatureSlots();
    var dev = data.os.developing;
    var nextVer = osSys._nextVersionString();

    // Buang kartu yang tidak lagi bisa dipilih (misalnya sudah dimiliki).
    _draft = _draft.filter(function (id) { return osSys.getFeatureStatus(id).status === 'available'; });
    if (_draft.length > maxSlots) _draft = _draft.slice(0, maxSlots);

    var head = '<div class="uc-head">' +
        '<div class="uc-head-top"><div>' +
            '<div class="uc-kicker">' + escapeHtml(_tx('osuc.kicker', 'Rancang Update')) + '</div>' +
            '<div class="uc-title">' + escapeHtml(nextVer) + '</div>' +
        '</div><div class="uc-slots' + (_draft.length >= maxSlots ? ' uc-slots-full' : '') + '">' +
            escapeHtml(_tx('osuc.cards', 'Cards')) + ' <b>' + _draft.length + '/' + maxSlots + '</b></div></div>' +
        '<div class="uc-era">' + escapeHtml(_tx('osuc.era_now', 'Current era: {era} · {year}', { era: _eraName(eraId), year: year })) + '</div>' +
        '<div class="uc-hint">' + escapeHtml(_tx('osuc.hint', '')) + '</div>' +
    '</div>';

    if (dev) {
        return head +
            '<div class="uc-notice">' + escapeHtml(_tx('osuc.notice_dev', 'Version {v} is in development.', { v: dev.versionString })) + '</div>' +
            _renderTracks(osSys, true);
    }
    return head + _renderTracks(osSys, false) + _renderTray(osSys);
}

function _renderTracks(osSys, frozen) {
    return OS_UPDATE_TRACKS.map(function (tr) {
        var owned = tr.features.filter(function (id) { return osSys.getFeatureStatus(id).status === 'owned'; }).length;
        var cards = tr.features.map(function (id) { return _renderCard(osSys, id, frozen); }).join('');
        return '<div class="uc-track">' +
            '<div class="uc-track-head">' +
                '<span class="uc-track-ico">' + renderIcon(tr.icon, 16) + '</span>' +
                '<div class="uc-track-txt"><div class="uc-track-name">' + escapeHtml(_trackName(tr)) + '</div>' +
                '<div class="uc-track-hint">' + escapeHtml(_trackHint(tr)) + '</div></div>' +
                '<span class="uc-track-count">' + owned + '/' + tr.features.length + '</span>' +
            '</div>' +
            '<div class="uc-row">' + cards + '</div>' +
        '</div>';
    }).join('');
}

function _renderCard(osSys, id, frozen) {
    var f = getOsFeatureById(id);
    if (!f) return '';
    var st = osSys.getFeatureStatus(id);
    var state = st.status;                       // owned | developing | available | locked
    var selected = _draft.indexOf(id) !== -1;

    var badge;
    if (state === 'owned') badge = _tx('osuc.badge.owned', 'Owned');
    else if (state === 'developing') badge = _tx('osuc.badge.developing', 'In development');
    else if (state === 'available') badge = selected ? _tx('osuc.badge.selected', '✓ Selected') : _tx('osuc.badge.available', 'Available');
    else badge = _lockReason(id, st);

    var chips = STAT_CHIPS.map(function (c) {
        var v = (f.statEffects || {})[c.k] || 0;
        return v > 0 ? '<span class="uc-chip">+' + v + ' ' + escapeHtml(_tx(c.key, c.k)) + '</span>' : '';
    }).join('');

    var attrs = '';
    if (state === 'available') attrs = ' data-uc-action="toggle" data-uc-id="' + id + '" role="button" aria-pressed="' + (selected ? 'true' : 'false') + '"';
    else if (state === 'locked') attrs = ' data-uc-action="why" data-uc-id="' + id + '" role="button"';

    var cost = state === 'owned' ? _tx('osuc.free', 'Free') : _money(getOsFeatureCost(f, currentGameData()));
    var days = f.devDays > 0 ? _tx('osuc.days', '{n} days', { n: f.devDays }) : '—';

    return '<div class="uc-card uc-s-' + state + (selected ? ' is-selected' : '') + '"' + attrs + '>' +
        '<div class="uc-card-top"><span class="uc-era-tag">' + escapeHtml(_eraName(f.era)) + '</span>' +
        '<span class="uc-year">' + f.minYear + '</span></div>' +
        '<div class="uc-name">' + escapeHtml(_featName(id)) + '</div>' +
        '<div class="uc-desc">' + escapeHtml(_featDesc(id)) + '</div>' +
        '<div class="uc-chips">' + chips + '</div>' +
        '<div class="uc-foot"><span class="uc-cost">' + escapeHtml(cost) + '</span><span class="uc-dur">' + escapeHtml(days) + '</span></div>' +
        '<div class="uc-badge uc-badge-' + state + '">' + escapeHtml(badge) + '</div>' +
    '</div>';
}

function _renderTray(osSys) {
    var n = _draft.length;
    if (!n) return '<div class="uc-tray uc-tray-empty">' + escapeHtml(_tx('osuc.tray.empty', 'Select at least 1 card to assemble a build.')) + '</div>';
    var p = osSys.previewUpdate(_draft);
    var can = WalletService.canAfford(p.total);
    return '<div class="uc-tray">' +
        '<div class="uc-tray-row"><span>' + escapeHtml(_tx('osuc.tray.dev_cost', 'Development cost ({n} cards)', { n: n })) + '</span><b>' + _money(p.featureCost) + '</b></div>' +
        '<div class="uc-tray-row"><span>' + escapeHtml(_tx('osuc.tray.build_fee', 'Build release fee')) + '</span><b>' + _money(p.buildFee) + '</b></div>' +
        '<div class="uc-tray-row uc-tray-total"><span>' + escapeHtml(_tx('osuc.tray.total', 'Total')) + '</span><b class="' + (can ? '' : 'uc-neg') + '">' + _money(p.total) + '</b></div>' +
        '<div class="uc-tray-row"><span>' + escapeHtml(_tx('osuc.tray.duration', 'Development time')) + '</span><b>' + escapeHtml(_tx('osuc.days', '{n} days', { n: p.days })) + '</b></div>' +
        '<div class="uc-tray-stats">' + STAT_CHIPS.map(function (c) {
            return '<span class="uc-stat-pill">' + escapeHtml(_tx(c.key, c.k)) + ' <b>' + Math.round((p.stats || {})[c.k] || 0) + '</b></span>';
        }).join('') + '</div>' +
        '<div class="uc-tray-actions">' +
            '<button type="button" class="uc-btn-ghost" data-uc-action="clear">' + escapeHtml(_tx('osuc.btn.clear', 'Clear')) + '</button>' +
            '<button type="button" class="uc-btn-primary" data-uc-action="build"' + (can ? '' : ' disabled') + '>' +
                escapeHtml(can ? _tx('osuc.btn.build', 'Assemble & Develop') : _tx('osuc.btn.nomoney', 'Not enough cash')) +
            '</button>' +
        '</div>' +
    '</div>';
}

// ============================================================
// INTERAKSI
// ============================================================
function _onCard(act, id) {
    var f = getOsFeatureById(id);
    if (!f || !_sys) return;
    var data = window.__game.state.get();
    if (data.os.developing) { ToastService.warning(_tx('osuc.warn.developing', 'A version is in development.')); return; }
    var st = _sys.getFeatureStatus(id);
    if (st.status !== 'available') {
        ToastService.warning(_tx('osuc.warn.item', '{name}: {reason}', { name: _featName(id), reason: _lockReason(id, st) }));
        return;
    }

    var i = _draft.indexOf(id);
    if (i !== -1) { _draft.splice(i, 1); _rerender(); return; }
    var max = _sys._getMaxFeatureSlots();
    if (_draft.length >= max) { ToastService.warning(_tx('osuc.warn.max', 'Max {n} cards per build.', { n: max })); return; }
    _draft.push(id);
    _rerender();
}

function _ensureHandlers() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;
    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest && e.target.closest('[data-uc-action]');
        if (!b || !_sys) return;
        e.preventDefault();
        var act = b.getAttribute('data-uc-action');
        if (act === 'toggle' || act === 'why') { _onCard(act, b.getAttribute('data-uc-id')); return; }
        if (act === 'clear') { _draft = []; _rerender(); return; }
        if (act === 'build') {
            if (!_draft.length) { ToastService.warning(_tx('osuc.err.none', 'Select at least 1 card.')); return; }
            var p = _sys.previewUpdate(_draft);
            if (!WalletService.canAfford(p.total)) {
                ToastService.error(_tx('osuc.warn.cash', 'Not enough cash. Need {amount}.', { amount: _money(p.total) }));
                return;
            }
            var res = _sys.startVersion(_draft.slice());
            if (!res.ok) { ToastService.error(res.reason); _rerender(); return; }
            ToastService.success(_tx('osuc.toast.started', 'Build {v} started · {cost}', { v: res.versionString, cost: _money(res.cost) }));
            _draft = [];
            if (window.__game && window.__game.render) window.__game.render(); else _rerender();
        }
    });
}

// ============================================================
// GAYA (disuntikkan sekali, memakai variabel tema yang sudah ada)
// ============================================================
function _ensureStyles() {
    if (_styled || typeof document === 'undefined') return;
    _styled = true;
    var el = document.createElement('style');
    el.id = 'uc-update-cards-styles';
    el.textContent = UC_CSS;
    document.head.appendChild(el);
}

var UC_CSS = `
.uc-head { background: linear-gradient(135deg, var(--bg-2), var(--bg-3)); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 12px 14px; margin-bottom: 10px; }
.uc-head-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.uc-kicker { font-size: 10px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .8px; color: var(--accent); }
.uc-title { font-size: var(--fs-md); font-weight: var(--fw-bold); color: var(--text-primary); }
.uc-slots { font-size: var(--fs-xs); color: var(--text-secondary); background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--r-pill); padding: 4px 10px; white-space: nowrap; }
.uc-slots b { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.uc-slots.uc-slots-full { color: var(--warn); border-color: var(--warn); }
.uc-slots.uc-slots-full b { color: var(--warn); }
.uc-era { margin-top: 6px; font-size: var(--fs-xs); color: var(--text-secondary); }
.uc-hint { margin-top: 4px; font-size: 11px; color: var(--text-tertiary); line-height: 1.4; }
.uc-notice { font-size: var(--fs-sm); color: var(--warn); background: var(--warn-soft); border: 1px solid var(--warn); border-radius: var(--r-md); padding: 10px 12px; margin-bottom: 10px; line-height: 1.4; }
.uc-track { margin-bottom: 14px; }
.uc-track-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.uc-track-ico { width: 30px; height: 30px; flex: 0 0 auto; border-radius: var(--r-md); background: var(--bg-3); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.uc-track-txt { flex: 1; min-width: 0; }
.uc-track-name { font-size: var(--fs-sm); font-weight: var(--fw-bold); color: var(--text-primary); }
.uc-track-hint { font-size: 10.5px; color: var(--text-tertiary); }
.uc-track-count { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.uc-row { display: flex; gap: 10px; overflow-x: auto; padding: 2px 2px 8px; scroll-snap-type: x proximity; scrollbar-width: thin; touch-action: pan-x; overscroll-behavior-x: contain; }
.uc-card { flex: 0 0 176px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 6px; padding: 11px; background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--r-lg); cursor: pointer; user-select: none; min-width: 0; }
.uc-card:active { transform: scale(0.98); }
.uc-card.uc-s-owned { cursor: default; opacity: .72; }
.uc-card.uc-s-locked { opacity: .6; }
.uc-card.uc-s-developing { border-color: var(--warn); cursor: default; }
.uc-card.is-selected { border-color: var(--accent); background: linear-gradient(135deg, var(--accent-soft), transparent 75%), var(--bg-2); box-shadow: 0 0 0 1px var(--accent) inset; }
.uc-card-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.uc-era-tag { font-size: 9px; font-weight: var(--fw-bold); text-transform: uppercase; letter-spacing: .4px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uc-year { font-size: 10px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.uc-name { font-size: var(--fs-sm); font-weight: var(--fw-bold); color: var(--text-primary); line-height: 1.25; }
.uc-desc { font-size: 10.5px; color: var(--text-tertiary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.uc-chips { display: flex; flex-wrap: wrap; gap: 4px; min-height: 18px; }
.uc-chip { font-size: 9.5px; padding: 2px 6px; border-radius: var(--r-pill); background: var(--bg-4); color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.uc-foot { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; margin-top: auto; }
.uc-cost { color: var(--text-primary); font-weight: var(--fw-bold); }
.uc-badge { font-size: 10px; font-weight: var(--fw-bold); padding: 3px 8px; border-radius: var(--r-pill); align-self: flex-start; background: var(--bg-4); color: var(--text-tertiary); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uc-badge-owned { background: var(--success-soft); color: var(--success); }
.uc-badge-developing { background: var(--warn-soft); color: var(--warn); }
.uc-badge-available { background: var(--info-soft); color: var(--info); }
.uc-card.is-selected .uc-badge { background: var(--accent); color: #fff; }
.uc-tray { position: sticky; bottom: 8px; z-index: 5; background: var(--bg-1); border: 1px solid var(--accent); border-radius: var(--r-lg); padding: 12px; box-shadow: 0 8px 24px -10px rgba(0,0,0,0.5); margin-top: 6px; }
.uc-tray-empty { position: static; border-style: dashed; border-color: var(--border-strong); color: var(--text-tertiary); font-size: var(--fs-sm); text-align: center; box-shadow: none; }
.uc-tray-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: var(--fs-sm); color: var(--text-secondary); padding: 3px 0; }
.uc-tray-row b { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.uc-tray-total { border-top: 1px solid var(--border); margin-top: 4px; padding-top: 7px; font-weight: var(--fw-bold); color: var(--text-primary); }
.uc-tray-total b { font-size: var(--fs-md); }
.uc-neg { color: var(--danger) !important; }
.uc-tray-stats { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 2px; }
.uc-stat-pill { font-size: 10px; color: var(--text-tertiary); background: var(--bg-3); border-radius: var(--r-pill); padding: 2px 7px; }
.uc-stat-pill b { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.uc-tray-actions { display: flex; gap: 8px; margin-top: 8px; }
.uc-btn-primary, .uc-btn-ghost { flex: 1; min-height: 40px; border-radius: var(--r-md); font: inherit; font-size: var(--fs-sm); font-weight: var(--fw-bold); cursor: pointer; }
.uc-btn-primary { border: 0; background: var(--accent); color: #fff; }
.uc-btn-primary:disabled { background: var(--bg-4); color: var(--text-tertiary); cursor: not-allowed; }
.uc-btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
@media (max-width: 380px) { .uc-card { flex-basis: 158px; } }
`;
