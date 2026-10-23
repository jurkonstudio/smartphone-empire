import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/OSPanel.js
// ============================================================
// Sub-tab OS dalam tab Riset.
// v2028.38 — Tabbed UI (Status, Fitur, Bug, Apps) untuk mengurangi scroll.
// v2028.39 — Ringkasan Status & R&D di atas tab Status; lencana status di hero ponsel; sub-tab ikut bahasa.
// ============================================================
import { renderOsStatBar } from './OsStatBar.js';
import { OS_FEATURES, OS_LICENSES, BUILTIN_APPS, OS_ERAS, OS_PLATFORM_TRACKS, getOsFeatureById, getLicenseStatsAtYear } from '../../data/os.data.js';
import { renderRndOverview, renderRndRow, ensureRndStyles } from '../components/TechNodeCard.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { renderOsScreenMockup } from '../phone/OsScreenMockup.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';
import { renderSilSlotBoost } from '../components/SilResearchBlock.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { renderOsKpiRow, renderOsUsersTab } from './OsUsersPanel.js';
import { formatUsers } from '../../systems/OsAdoptionModel.js';
import { renderUpdateCardsTab, resetUpdateDraft } from './OsUpdateCards.js';
import { TIME_CONFIG } from '../../config/time.config.js';
import { getOsFeatureCost, currentGameData } from '../../systems/FutureEffects.js';

const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;


var STAT_ORDER = ['stability', 'speed', 'features', 'security', 'design'];
var STAT_SHORT_KEYS = { stability: 'os.stat.stab_short', speed: 'os.stat.cepat_short', features: 'os.stat.fitur_short', security: 'os.stat.aman_short', design: 'os.stat.desain_short' };

// STATE UNTUK TAB OS
let _osActiveTab = 'status'; 

// ============================================================
// MAIN
// ============================================================
export function renderOSPanel(params) {
    var osSystem = params.osSystem;
    const data = window.__game.state.get();
    const os = data.os;

    if (!os.name) return _renderEmptyState();

    const currentVersion = osSystem.getCurrentVersionObject();
    const developing = os.developing;

    ensureRndStyles();
    _ensureOsPlatformHandlers(osSystem);
    _ensureOsTabHandlers();

    // --- RENDER SUB-TABS OS ---
    const subtabsHtml = `
        <div class="os-subtabs">
            <button class="os-subtab-btn ${_osActiveTab === 'status' ? 'active' : ''}" data-os-tab="status">${t('osrd.tab.status')}</button>
            <button class="os-subtab-btn ${_osActiveTab === 'rancang' ? 'active' : ''}" data-os-tab="rancang">${t('osuc.subtab')}</button>
            <button class="os-subtab-btn ${_osActiveTab === 'pengguna' ? 'active' : ''}" data-os-tab="pengguna">Pengguna</button>
            <button class="os-subtab-btn ${_osActiveTab === 'fitur' ? 'active' : ''}" data-os-tab="fitur">Fitur</button>
            <button class="os-subtab-btn ${_osActiveTab === 'bug' ? 'active' : ''}" data-os-tab="bug">Bug</button>
            <button class="os-subtab-btn ${_osActiveTab === 'apps' ? 'active' : ''}" data-os-tab="apps">Apps & Lisensi</button>
        </div>
    `;

    // --- KONTEN BERDASARKAN TAB ---
    let bodyHtml = '';
    if (_osActiveTab === 'status') {
        const hero = _renderHero(os, currentVersion, osSystem);
        const devStrip = developing ? _renderDevStrip(developing) : '';
        const platformHtml = _renderPlatformSection(osSystem, data);
        const history = _renderVersionHistory(os, currentVersion, osSystem.getAdoption());
        _ensureSumStyles();
        bodyHtml = _renderRdSummary(osSystem, data) + renderOsKpiRow(osSystem, data) + hero + devStrip + platformHtml + history;
    } 
    else if (_osActiveTab === 'rancang') {
        bodyHtml = renderUpdateCardsTab(osSystem, data);
    }
    else if (_osActiveTab === 'pengguna') {
        bodyHtml = renderOsUsersTab(osSystem, data);
    }
    else if (_osActiveTab === 'fitur') {
        bodyHtml = _renderFeaturesSection(osSystem);
    } 
    else if (_osActiveTab === 'bug') {
        bodyHtml = _renderBugsSection(os.bugs, data.time.elapsedGameMinutes) || '<div class="empty"><div class="empty-title">Tidak ada bug aktif saat ini.</div></div>';
    } 
    else if (_osActiveTab === 'apps') {
        bodyHtml = _renderAppsSection(osSystem, os) + _renderLicensesSection(data);
    }

    return subtabsHtml + '<div style="animation: fadeIn 0.2s ease-out;">' + bodyHtml + '</div>';
}

// Handler klik tab OS
let _osTabBound = false;
function _ensureOsTabHandlers() {
    if (_osTabBound) return;
    _osTabBound = true;
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-os-tab]');
        if (!btn) return;
        _osActiveTab = btn.getAttribute('data-os-tab');
        if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
    });
}

// ============================================================
// R&D PLATFORM OS (v2028.36)
// ============================================================
function _renderPlatformSection(osSystem, data) {
    if (typeof osSystem.getPlatformInfo !== 'function') return '';
    var STAT_LABEL = { stability: 'Stabilitas', speed: 'Kecepatan', features: 'Fitur', security: 'Keamanan', design: 'Desain' };

    if (!data.os.versions || !data.os.versions.length) {
        return '<div class="rnd-ov" data-osp-root><div class="rnd-ov-title">R&amp;D Platform OS</div>' +
            '<div class="rnd-verdict">Rilis versi OS pertama untuk membuka R&amp;D platform: tiap level menambah stat OS ke semua ponsel ber-OS sendiri.</div></div>';
    }

    var levels = osSystem.getPlatformLevels();
    var sum = 0, n = 0;
    OS_PLATFORM_TRACKS.forEach(function (t) { sum += levels[t.id] || 0; n++; });
    var avg = n ? sum / n : 0;
    var bench = Math.max(0, data.time.currentYear - 2000) * 0.5;
    var bestLic = 0;
    OS_LICENSES.forEach(function (l) {
        if (data.time.currentYear < l.availableFromYear) return;
        var ls = getLicenseStatsAtYear(l, data.time.currentYear);
        var a = (ls.stability + ls.speed + ls.features + ls.security + ls.design) / 5;
        if (a > bestLic) bestLic = a;
    });
    var cs = osSystem.getCurrentStats();
    var own = cs ? (cs.stability + cs.speed + cs.features + cs.security + cs.design) / 5 : 0;
    var diff = Math.round(own - bestLic);
    var tone = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'flat');
    var verdict = diff >= 0
        ? 'OS-mu unggul ' + diff + ' poin dari lisensi OS terbaik tahun ini — ponselmu lebih menarik.'
        : 'OS-mu tertinggal ' + Math.abs(diff) + ' poin dari lisensi OS terbaik tahun ini (lisensi pihak ketiga terus diperbarui).';

    var overview = '<div class="rnd-ov" data-osp-root>' +
        '<div class="rnd-ov-head"><div class="rnd-ov-title">R&amp;D Platform OS</div>' +
        '<div class="rnd-ov-slots">' + (data.os.platform && data.os.platform.developing ? '1/1' : '0/1') + '</div></div>' +
        '<div class="rnd-ov-grid">' +
            '<div class="rnd-chip"><span>Level rata-rata</span><b>' + avg.toFixed(1) + '</b></div>' +
            '<div class="rnd-chip"><span>Skor OS</span><b>' + Math.round(own) + '</b></div>' +
            '<div class="rnd-chip rnd-' + tone + '"><span>vs lisensi</span><b>' + (diff > 0 ? '+' : '') + diff + '</b></div>' +
        '</div>' +
        '<div class="rnd-verdict rnd-' + tone + '">' + escapeHtml(verdict) + '</div></div>';

    var rows = OS_PLATFORM_TRACKS.map(function (t) {
        var info = osSystem.getPlatformInfo(t.id);
        if (info.running) info.running = Object.assign({}, info.running);
        return renderRndRow(info, { actionAttr: 'data-osp-action', bonusLabel: STAT_LABEL[t.id], benchmark: bench });
    }).join('');

    return '<details class="section-collapsible rnd-card" open>' +
        '<summary class="section-summary"><span class="section-summary-text">R&amp;D Platform</span><span class="section-summary-line"></span></summary>' +
        overview + 
        '<div class="rnd-carousel-container">' + rows + '</div>' + // CAROUSEL WRAPPER
        '</details>';
}

var _osPlatformBound = false;
var _osPlatformSys = null;
function _ensureOsPlatformHandlers(osSystem) {
    _osPlatformSys = osSystem;
    if (_osPlatformBound || typeof document === 'undefined') return;
    _osPlatformBound = true;
    document.addEventListener('click', function (e) {
        var b = e.target && e.target.closest && e.target.closest('[data-osp-action]');
        if (!b || !_osPlatformSys) return;
        e.preventDefault();
        var act = b.getAttribute('data-osp-action');
        var sid = b.getAttribute('data-rnd-id');
        var res = act === 'cancel' ? _osPlatformSys.cancelPlatformUpgrade() : _osPlatformSys.startPlatformUpgrade(sid);
        if (!res.ok) ToastService.error(res.reason);
        else ToastService.success(act === 'cancel' ? 'R&D dibatalkan.' : 'R&D platform dimulai.');
        if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
    });
    bus.on('os:platform-progress', function (d) {
        var pct = Math.round(d.percent * 100);
        var bar = document.querySelector('[data-rnd-bar="' + d.statId + '"]'); if (bar) bar.style.width = pct + '%';
        var pe = document.querySelector('[data-rnd-pct="' + d.statId + '"]'); if (pe) pe.textContent = pct + '%';
    });
    bus.on('os:platform-done', function () {
        if (document.querySelector('[data-osp-root]') && window.__game && window.__game.renderSoft) window.__game.renderSoft();
    });
}

// ============================================================
// RINGKASAN STATUS & R&D (v2028.39) — paling atas tab Status
// ============================================================
var _sumStyled = false;
function _ensureSumStyles() {
    if (_sumStyled || typeof document === 'undefined') return;
    _sumStyled = true;
    var st = document.createElement('style');
    st.id = 'os-rd-sum-style';
    st.textContent = [
        '.os-rd-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0 0 12px;}',
        '.os-rd-cell{background:var(--bg-2);border:1px solid var(--border);border-radius:12px;padding:10px;min-width:0;}',
        '.os-rd-cell.accent{border-color:var(--accent);}',
        '.os-rd-lbl{font-size:10.5px;color:var(--text-tertiary);font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.os-rd-val{font-size:16px;font-weight:800;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.os-rd-cell.up .os-rd-val{color:#43c07a;}.os-rd-cell.down .os-rd-val{color:#ef5350;}',
        '.os-rd-sub{font-size:11px;color:var(--text-tertiary);margin-top:2px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.os-hero-badge{display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;vertical-align:middle;background:var(--accent-soft);color:var(--accent);}',
        '.os-hero-badge-dev{background:rgba(245,158,11,.16);color:#d97706;}'
    ].join('');
    document.head.appendChild(st);
}

function _renderRdSummary(osSystem, data) {
    var os = data.os;
    if (!os.versions || !os.versions.length) return '';
    var dev = os.developing;
    var cs = osSystem.getCurrentStats ? osSystem.getCurrentStats() : null;
    var own = cs ? (cs.stability + cs.speed + cs.features + cs.security + cs.design) / 5 : 0;
    var bestLic = 0;
    OS_LICENSES.forEach(function (l) {
        if (data.time.currentYear < l.availableFromYear) return;
        var ls = getLicenseStatsAtYear(l, data.time.currentYear);
        var a = (ls.stability + ls.speed + ls.features + ls.security + ls.design) / 5;
        if (a > bestLic) bestLic = a;
    });
    var diff = Math.round(own - bestLic);
    var levels = osSystem.getPlatformLevels ? osSystem.getPlatformLevels() : {};
    var sum = 0, n = 0;
    OS_PLATFORM_TRACKS.forEach(function (tr) { sum += levels[tr.id] || 0; n++; });
    var avg = n ? sum / n : 0;
    var platBusy = !!(os.platform && os.platform.developing);

    var cells = [
        { cls: dev ? 'accent' : '', lbl: t('osrd.dev'), val: dev ? escapeHtml(dev.versionString) : t('osrd.idle'),
          sub: dev ? t('os.dev.features_count', { n: dev.features.length }) : t('osrd.dev_idle_sub') },
        { cls: platBusy ? 'accent' : '', lbl: t('osrd.platform'), val: (platBusy ? '1' : '0') + '/1',
          sub: t('osrd.platform_sub', { n: avg.toFixed(1) }) },
        { cls: diff > 0 ? 'up' : (diff < 0 ? 'down' : ''), lbl: t('osrd.vs_license'), val: (diff > 0 ? '+' : '') + diff,
          sub: diff >= 0 ? t('osrd.ahead') : t('osrd.behind') }
    ];
    return '<div class="os-rd-sum">' + cells.map(function (c) {
        return '<div class="os-rd-cell ' + c.cls + '"><div class="os-rd-lbl">' + escapeHtml(c.lbl) + '</div>' +
            '<div class="os-rd-val">' + c.val + '</div><div class="os-rd-sub">' + escapeHtml(c.sub) + '</div></div>';
    }).join('') + '</div>';
}

function _renderEmptyState() {
    return '<div class="empty"><div class="empty-ico" style="font-size:0;line-height:0;">' + renderIcon('disc', 48) + '</div>' +
        '<div class="empty-title">' + t('os.empty.title') + '</div>' +
        '<div class="empty-desc">' + t('os.empty.desc') + '</div>' +
        '<button class="btn-primary" data-os-action="create" style="max-width:220px;margin:0 auto;">' + t('os.empty.create') + '</button></div>';
}

function _renderHero(os, currentVersion, osSystem) {
    let mockupHtml = '';
    try { mockupHtml = renderOsScreenMockup({ size: 100 }); } catch (e) { console.error('[OSPanel] mockup error:', e); }
    const verLabel = currentVersion ? t('os.hero.version', { v: escapeHtml(currentVersion.versionString) }) : t('os.hero.no_version');
    const heroBadge = os.developing
        ? '<span class="os-hero-badge os-hero-badge-dev">' + t('osrd.badge_dev') + '</span>'
        : (currentVersion ? '<span class="os-hero-badge">' + t('osrd.badge_live') + '</span>' : '');
    const statHtml = currentVersion ? renderOsStatBar(osSystem.getCurrentStats() || currentVersion.stats) : '<div class="os-hero-empty-stat">' + t('os.hero.dev_empty') + '</div>';
    return '<div class="card os-hero"><div class="os-hero-top"><div class="os-hero-screen">' + mockupHtml + '</div>' +
        '<div class="os-hero-info"><div class="os-hero-name">' + escapeHtml(os.name) + '</div>' +
        '<div class="os-hero-version">' + verLabel + heroBadge + '</div>' +
        '<button class="btn-primary os-hero-cta" data-os-action="wizard"><span style="font-size:15px;line-height:1;margin-right:4px;">+</span>' + t('os.hero.dev_new') + '</button></div></div>' +
        '<div class="os-hero-stats">' + statHtml + '</div></div>';
}

function _renderVersionHistory(os, currentVersion, adoption) {
    if (!os.versions || !os.versions.length) return '';
    const usersOf = function (vid) {
        const row = adoption && adoption.versions ? adoption.versions.find(x => x.id === vid) : null;
        return row ? row.active : 0;
    };
    const versions = [...os.versions].reverse();
    const rows = versions.map(v => {
        const isCurrent = currentVersion && v.id === currentVersion.id;
        const dateStr = v.releasedAt ? `${v.releasedAt.month}/${v.releasedAt.year}` : 'Unknown';
        const featureNames = v.features.slice(0, 3).map(fid => { const f = getOsFeatureById(fid); return f ? f.name : fid; });
        const moreCount = v.features.length - 3;
        const featureText = featureNames.join(', ') + (moreCount > 0 ? ` +${moreCount} lainnya` : '');
        return `<div class="os-row" style="align-items: flex-start; ${isCurrent ? 'background: var(--accent-soft);' : ''}">
            <div class="os-row-main"><div class="os-row-title" style="display:flex; justify-content:space-between;"><span>${escapeHtml(v.versionString)}</span><span style="font-size:10px; color:var(--text-tertiary); font-weight:normal;">${dateStr}${' · ' + formatUsers(usersOf(v.id)) + ' pengguna'}</span></div>
            <div class="os-row-meta" style="margin-top:4px; line-height:1.4;">${escapeHtml(featureText)}</div></div>
            <div class="os-row-actions">${isCurrent ? '<span class="os-status-badge os-status-owned">Aktif</span>' : '<span class="os-status-badge os-status-locked">Usang</span>'}</div></div>`;
    }).join('');
    return '<details class="section-collapsible" open><summary class="section-summary"><span class="section-summary-text">Riwayat Versi · ' + os.versions.length + '</span><span class="section-summary-line"></span></summary><div class="os-list" style="margin-top:8px;">' + rows + '</div></details>';
}

function _renderDevStrip(developing) {
    let finishCost = 10; try { finishCost = SiliconService.researchFinishCost(developing); } catch(e) {}
    return '<div class="slot-strip"><div class="slot-strip-top"><span class="slot-strip-label">' + t('os.dev.title') + '</span><span class="slot-strip-count">' + escapeHtml(developing.versionString) + '</span></div>' +
        '<div class="slot-strip-item"><div class="slot-strip-item-head"><span class="slot-strip-item-name">' + t('os.dev.features_count', { n: developing.features.length }) + '</span><span class="slot-strip-item-pct" data-os-dev-pct>0%</span></div>' +
        '<div class="progress slot-strip-item-progress"><div class="progress-bar" data-os-dev-bar style="width:0%;"></div></div>' +
        '<div class="slot-strip-item-eta" data-os-dev-eta>' + t('os.dev.eta_calc') + '</div>' +
        '<div class="slot-strip-item-boost" style="margin-top: 8px;">' + renderSilSlotBoost('os', developing.versionString, finishCost) + '</div></div>' +
        '<button class="btn-danger os-dev-cancel" data-os-action="cancel-deving" style="margin-top: 8px;">' + t('os.dev.cancel') + '</button></div>';
}

function _renderBugsSection(bugs, nowMinute) {
    const active = (bugs || []).filter(b => b.status === 'active' || b.status === 'patching');
    if (!active.length) return '';
    const rows = active.map(function (b) {
        const isPatching = b.status === 'patching';
        const pct = isPatching ? _patchPercent(b, nowMinute) : 0;
        const actions = isPatching
            ? '<span class="os-status-badge os-status-running"><span class="os-spin" aria-hidden="true"></span>' + t('os.bug.patching') + '</span>'
            : '<button class="os-mini-btn" data-os-action="patch-bug" data-bug-id="' + b.id + '">' + t('os.bug.patch') + '</button>' +
              '<button class="os-mini-btn os-mini-btn-ghost" data-os-action="ignore-bug" data-bug-id="' + b.id + '">' + t('os.bug.ignore') + '</button>';
        const bar = isPatching
            ? '<div class="os-patch-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><span style="width:' + pct + '%"></span></div>'
            : '';
        return '<div class="os-row os-bug-row"><div class="os-row-main"><div class="os-row-title"><span class="os-bug-dot" aria-hidden="true"></span>' + escapeHtml(b.name) + '</div>' +
            '<div class="os-row-meta"><span class="os-bug-sev">' + t('os.bug.severity', { n: b.severity }) + '</span><span class="os-row-dot">·</span><span>$' + b.patchCost.toLocaleString('en-US') + '</span><span class="os-row-dot">·</span><span>' + b.patchDays + ' </span></div>' +
            bar + '</div>' +
            '<div class="os-row-actions">' + actions + '</div></div>';
    }).join('');
    return '<div class="section-label"><span class="section-label-text">' + t('os.bug.title', { n: active.length }) + '</span><span class="section-label-line"></span></div><div class="os-list">' + rows + '</div>';
}

// Persentase progres patch (0-100) berdasarkan waktu game yang sudah berjalan.
function _patchPercent(b, nowMinute) {
    const total = (b.patchDays || 0) * MINUTES_PER_DAY;
    if (total <= 0 || typeof b.patchCompleteAtMinute !== 'number' || typeof nowMinute !== 'number') return 0;
    const left = Math.max(0, b.patchCompleteAtMinute - nowMinute);
    return Math.max(0, Math.min(100, Math.round((1 - left / total) * 100)));
}

function _renderFeaturesSection(osSystem) {
    var groups = { available: [], developing: [], owned: [], locked: [] };
    OS_FEATURES.forEach(function (f) { var st = osSystem.getFeatureStatus(f.id); var bucket = groups[st.status] || groups.locked; bucket.push({ node: f, status: st.status }); });
    Object.keys(groups).forEach(k => groups[k].sort((a, b) => (a.node.minYear || 0) - (b.node.minYear || 0)));
    var html = '';
    if (groups.available.length) html += _renderFeatureGroup(t('os.features.section_available'), groups.available, 'available');
    if (groups.developing.length) html += _renderFeatureGroup(t('os.features.section_deving'), groups.developing, 'developing');
    if (groups.owned.length) html += _renderFeatureGroupCollapsible(t('os.features.section_owned'), groups.owned, 'owned');
    if (groups.locked.length) html += _renderFeatureGroupCollapsible(t('os.features.section_locked'), groups.locked, 'locked');
    return html;
}

function _renderFeatureGroup(label, items, status) {
    var rows = items.map(function (it) { return _renderFeatureRow(it.node, it.status); }).join('');
    return '<div class="section-label"><span class="section-label-text">' + label + ' · ' + items.length + '</span><span class="section-label-line"></span></div><div class="os-list">' + rows + '</div>';
}
function _renderFeatureGroupCollapsible(label, items, status) {
    var rows = items.map(function (it) { return _renderFeatureRow(it.node, it.status); }).join('');
    return '<details class="section-collapsible"><summary class="section-summary"><span class="section-summary-text">' + label + ' · ' + items.length + '</span><span class="section-summary-line"></span></summary><div class="os-list">' + rows + '</div></details>';
}

function _renderFeatureRow(feature, status) {
    var era = OS_ERAS.find(function (e) { return e.id === feature.era; }); var eraName = era ? era.name : feature.era;
    var se = feature.statEffects || {};
    var statChips = STAT_ORDER.map(function (k) { var v = se[k] || 0; if (v <= 0) return ''; return '<span class="os-stat-chip">+' + v + ' ' + t(STAT_SHORT_KEYS[k]) + '</span>'; }).filter(s => s).join('');
    var badgeCls = 'os-status-badge os-status-' + status;
    var badgeLabel = status === 'owned' ? t('os.feature.badge_owned') : status === 'developing' ? t('os.feature.badge_deving') : status === 'available' ? t('os.feature.badge_available') : t('os.feature.badge_locked');
    return '<div class="os-row os-feat-row os-feat-' + status + '" data-os-action="feature-detail" data-feature-id="' + feature.id + '"><div class="os-row-main">' +
        '<div class="os-row-title">' + escapeHtml(feature.name) + '<span class="os-row-year">' + feature.minYear + '</span></div>' +
        '<div class="os-row-meta"><span>' + escapeHtml(eraName) + '</span>' + (statChips ? '<span class="os-row-dot">·</span>' + statChips : '') + '</div>' +
        '<div class="os-row-foot"><span class="os-row-cost">$' + getOsFeatureCost(feature, currentGameData()).toLocaleString('en-US') + '</span><span class="os-row-dot">·</span><span class="os-row-dur">' + feature.devDays + '</span></div></div>' +
        '<div class="os-row-actions"><span class="' + badgeCls + '">' + badgeLabel + '</span></div></div>';
}

function _renderAppsSection(osSystem, os) {
    if (!osSystem.hasFeature('fw_appstore')) return '';
    var owned = os.apps.builtin || []; var thirdParty = os.apps.thirdParty || 0; var total = BUILTIN_APPS.length;
    var rows = BUILTIN_APPS.map(function (a) {
        var isOwned = owned.indexOf(a.id) !== -1; var hasFeature = !a.requiresFeature || osSystem.hasFeature(a.requiresFeature);
        var statusHtml = '';
        if (isOwned) statusHtml = '<span class="os-status-badge os-status-owned">' + t('os.apps.owned_badge') + '</span>';
        else if (!hasFeature) statusHtml = '<span class="os-status-badge os-status-locked">' + t('os.apps.locked_badge') + '</span>';
        else statusHtml = '<button class="os-mini-btn os-mini-btn-primary" data-os-action="start-app" data-app-id="' + a.id + '">' + t('os.apps.build') + '</button>';
        return '<div class="os-row os-app-row"><div class="os-row-main"><div class="os-row-title">' + escapeHtml(a.name) + '</div><div class="os-row-meta"><span>$' + a.devCost.toLocaleString('en-US') + '</span><span class="os-row-dot">·</span><span>' + t('os.apps.appeal_bonus', { n: a.appealBonus }) + '</span></div></div><div class="os-row-actions">' + statusHtml + '</div></div>';
    }).join('');
    return '<div class="section-label"><span class="section-label-text">' + t('os.apps.section', { owned: owned.length, total: total }) + '</span><span class="section-label-line"></span></div>' +
        '<div class="os-apps-summary"><span>' + t('os.apps.third_party', { n: thirdParty }) + '</span><span> · +' + osSystem.getAdoption().appBonusPerMonth + ' dari pengguna OS / bulan</span></div><div class="os-list">' + rows + '</div>' +
        '<button class="btn-secondary os-apps-invite" data-os-action="invite-devs">' + t('os.apps.invite') + '</button>';
}

function _renderLicensesSection(data) {
    var rows = OS_LICENSES.map(function (l) {
        var available = data.time.currentYear >= l.availableFromYear;
        var ls = getLicenseStatsAtYear(l, data.time.currentYear) || l.stats;
        var avgStat = Math.round((ls.stability + ls.speed + ls.features + ls.security + ls.design) / 5);
        var availLabel = available ? t('os.licenses.available') : t('os.licenses.available_from', { year: l.availableFromYear });
        return '<div class="os-row os-lic-row' + (available ? '' : ' os-lic-locked') + '"><div class="os-row-main"><div class="os-row-title">' + escapeHtml(l.name) + '</div><div class="os-row-meta"><span>' + t('os.licenses.per_unit', { cost: l.costPerUnit }) + '</span><span class="os-row-dot">·</span><span>' + availLabel + '</span></div></div><div class="os-row-actions"><span class="os-lic-stat">' + avgStat + '</span></div></div>';
    }).join('');
    return '<details class="section-collapsible"><summary class="section-summary"><span class="section-summary-text">' + t('os.licenses.section') + '</span><span class="section-summary-line"></span></summary><div class="os-list">' + rows + '</div></details>';
}

// ============================================================
// MODAL — WIZARD VERSI BARU (TETAP)
// ============================================================
export function openOsWizardModal(params) {
    // Wizard modal lama digantikan tab "Rancang Update" (kartu per jalur + biaya rilis).
    _osActiveTab = 'rancang';
    resetUpdateDraft();
    if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
}

export function openCreateOsModal(params) {
    var osSystem = params.osSystem;
    const html = `
        <div class="modal-title">${t('os.create.title')}</div><div class="modal-sub">${t('os.create.sub')}</div>
        <label class="field-label">${t('os.create.label')}</label><input class="field-input" data-os-name maxlength="24" placeholder="${t('os.create.placeholder')}" />
        <div style="display:flex;gap:8px;margin-top:16px;"><button class="btn-secondary" data-modal-close style="flex:1;">${t('os.create.cancel')}</button><button class="btn-primary" data-os-create-confirm style="flex:1;">${t('os.create.btn')}</button></div>
    `;
    window.__game.Modal.open('os-create', html);
    const root = document.querySelector('[data-modal-id="os-create"]'); const input = root.querySelector('[data-os-name]'); input.focus();
    root.querySelector('[data-os-create-confirm]').addEventListener('click', function () {
        const res = osSystem.createOs(input.value);
        if (!res.ok) window.__game.ToastService.error(res.reason);
        else { window.__game.ToastService.success('OS'); window.__game.Modal.close('os-create', true); window.__game.render(); }
    });
}

export function openFeatureDetailModal(params) {
    var osSystem = params.osSystem; var featureId = params.featureId;
    const f = OS_FEATURES.find(x => x.id === featureId); if (!f) return;
    const st = osSystem.getFeatureStatus(featureId);
    let actionBtn = '';
    if (st.status === 'locked' && st.missingResearch && st.missingResearch.length > 0) actionBtn = `<button class="btn-secondary" data-nav="research" style="width:100%;margin-top:8px;background:var(--accent-soft);color:var(--accent);border-color:var(--accent);">👉 Buka Tab Riset</button>`;
    const html = `
        <div class="modal-title">${escapeHtml(f.name)}</div><div class="modal-sub">${escapeHtml(f.description)}</div>
        <div class="sum-row"><span>${t('os.feature_detail.era')}</span><b>${f.era}</b></div><div class="sum-row"><span>${t('os.feature_detail.min_year')}</span><b>${f.minYear}</b></div>
        <div class="sum-row"><span>${t('os.feature_detail.cost')}</span><b>$${getOsFeatureCost(f, currentGameData()).toLocaleString('en-US')}</b></div><div class="sum-row"><span>${t('os.feature_detail.duration')}</span><b>${f.devDays}</b></div>
        <div class="card-title" style="margin-top:12px;">${t('os.feature_detail.effects')}</div>
        ${renderOsStatBar({ stability: f.statEffects.stability || 0, speed: f.statEffects.speed || 0, features: f.statEffects.features || 0, security: f.statEffects.security || 0, design: f.statEffects.design || 0 }, { compact: true })}
        <div class="sum-row" style="margin-top:12px;"><span>${t('os.feature_detail.status')}</span><b>${_statusLabel(st)}</b></div>${actionBtn}
        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('os.feature_detail.close')}</button>
    `;
    window.__game.Modal.open('feature-detail', html);
}

function _statusLabel(st) {
    if (st.status === 'owned') return t('os.feature_detail.status_owned');
    if (st.status === 'developing') return t('os.feature_detail.status_deving');
    if (st.status === 'available') return t('os.feature_detail.status_available');
    return st.reason || t('os.feature.badge_locked');
            }

// ============================================================
// LOADING STATE UNTUK AKSI OS (patch, abaikan, buat app, dll.)
// Tombol tampil spinner + teks "Memproses…" dulu, baru aksi dijalankan
// setelah jeda singkat, sehingga perubahan tidak terjadi secara tiba-tiba.
// ============================================================
let _osLoadingStylesInjected = false;
function _ensureOsLoadingStyles() {
    if (_osLoadingStylesInjected || typeof document === 'undefined') return;
    _osLoadingStylesInjected = true;
    const el = document.createElement('style');
    el.id = 'os-loading-styles';
    el.textContent = [
        '.os-spin{display:inline-block;width:10px;height:10px;margin-right:6px;vertical-align:-1px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:osSpin .7s linear infinite;}',
        '@keyframes osSpin{to{transform:rotate(360deg);}}',
        '.os-mini-btn.is-loading{opacity:.8;cursor:progress;pointer-events:none;}',
        '.os-patch-bar{height:4px;margin-top:6px;border-radius:999px;background:var(--bg-4);overflow:hidden;}',
        '.os-patch-bar>span{display:block;height:100%;border-radius:inherit;background:var(--warn);transition:width .5s ease;position:relative;overflow:hidden;}',
        '.os-patch-bar>span::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);animation:osBarShine 1.4s linear infinite;}',
        '@keyframes osBarShine{from{transform:translateX(-100%);}to{transform:translateX(100%);}}'
    ].join('\n');
    document.head.appendChild(el);
}

// Jalankan `action` setelah `delayMs` sambil menampilkan loading di `btn`.
// `action` mengembalikan false bila gagal; tombol lalu dikembalikan ke keadaan semula.
export function runOsActionWithLoading(btn, loadingText, delayMs, action) {
    if (!btn || btn.getAttribute('data-busy') === '1') return;
    _ensureOsLoadingStyles();
    const original = btn.innerHTML;
    btn.setAttribute('data-busy', '1');
    btn.setAttribute('aria-busy', 'true');
    btn.classList.add('is-loading');
    btn.disabled = true;
    btn.innerHTML = '<span class="os-spin" aria-hidden="true"></span>' + escapeHtml(loadingText);

    setTimeout(function () {
        let ok = false;
        try { ok = action() !== false; } catch (e) { ok = false; console.error(e); }
        if (btn.isConnected) {
            btn.removeAttribute('data-busy');
            btn.removeAttribute('aria-busy');
            btn.classList.remove('is-loading');
            btn.disabled = false;
            if (!ok) btn.innerHTML = original;
        }
    }, Math.max(0, delayMs | 0));
}

