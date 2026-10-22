// FILE: src/ui/panels/OsUsersPanel.js  (BARU)
// ============================================================
// Tampilan adopsi/pengguna OS:
//   - renderOsKpiRow : baris ringkasan di tab Status OS.
//   - renderOsUsersTab : tab "Pengguna" (tren, rincian versi, ponsel teratas,
//     dampak ke ekosistem aplikasi).
// Datanya dari OsAdoptionModel.js (computeOsAdoption) lewat osSystem.getAdoption().
// ============================================================
import { renderIcon } from '../icons/FeatureIcons.js';
import { escapeHtml } from '../../utils/html.js';
import { formatUsers, ADOPTION_CONFIG } from '../../systems/OsAdoptionModel.js';
import { projectedOsAdoption } from '../../systems/LiveProjection.js';

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var TIER_LABEL = { current: 'Terbaru', previous: 'Sebelumnya', older: 'Lama' };

var _stylesInjected = false;

export function renderOsKpiRow(osSystem, data) {
    _ensureStyles();
    var a = osSystem.getAdoption();
    var os = data.os;
    var cur = osSystem.getCurrentVersionObject ? osSystem.getCurrentVersionObject() : null;
    var features = cur && cur.features ? cur.features.length : 0;
    var bugs = (os.bugs || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; }).length;
    var liveUsers = projectedOsAdoption(data).activeUsers;
    var chips = [
        { ico: 'users',  label: 'Pengguna aktif', val: formatUsers(liveUsers), live: true },
        { ico: 'cpu',    label: 'Versi',          val: cur ? cur.versionString : '-' },
        { ico: 'layers', label: 'Fitur di versi', val: String(features) },
        { ico: 'blocks', label: 'Apps pihak ketiga', val: String(os.apps ? os.apps.thirdParty : 0) },
        { ico: 'warn',   label: 'Bug aktif',      val: String(bugs), tone: bugs >= 3 ? 'down' : '' }
    ];
    return '<div class="ou-kpis">' + chips.map(function (c) {
        return '<div class="ou-kpi ' + (c.tone || '') + '"><div class="ou-kpi-ico">' + renderIcon(c.ico, 14) + '</div>' +
            '<div><div class="ou-kpi-val">' + (c.live ? '<span data-live-os-users>' + Math.round(liveUsers).toLocaleString('en-US') + '</span>' : escapeHtml(c.val)) + '</div><div class="ou-kpi-lbl">' + escapeHtml(c.label) + '</div></div></div>';
    }).join('') + '</div>';
}

export function renderOsUsersTab(osSystem, data) {
    _ensureStyles();
    var a = osSystem.getAdoption();

    if (!a.hasOs) {
        return '<div class="empty"><div class="empty-title">Belum ada pengguna OS</div>' +
            '<div class="empty-desc">Rilis versi OS pertama, lalu luncurkan ponsel yang memakai OS-mu. Pengguna dihitung dari unit ponsel tersebut yang terjual.</div></div>';
    }

    var header = '<div class="ou-hero">' +
        '<div class="ou-hero-top"><div><div class="ou-hero-label">Total pengguna aktif</div>' +
        '<div class="ou-hero-big"><span data-live-os-users>' + Math.round(projectedOsAdoption(data).activeUsers).toLocaleString('en-US') + '</span></div></div>' +
        '<div class="ou-hero-side"><div>Unit terjual <b>' + escapeHtml(formatUsers(a.shippedUnits)) + '</b></div>' +
        '<div>Retensi <b>' + Math.round(a.retentionRate * 100) + '%</b></div>' +
        '<div>Ponsel ber-OS <b>' + a.phoneCount + '</b></div></div></div>' +
        (a.licensedUnits > 0 ? '<div class="ou-note">Ponsel berlisensi OS pihak ketiga terjual ' + escapeHtml(formatUsers(a.licensedUnits)) + ' unit (tidak dihitung sebagai pengguna OS-mu).</div>' : '') +
        '</div>';

    var trend = _renderTrend(a.history);

    var versions = '<div class="section-label"><span class="section-label-text">Pengguna per versi</span><span class="section-label-line"></span></div>' +
        '<div class="ou-list">' + (a.versions.length ? a.versions.slice().reverse().map(_renderVersionRow).join('') : '<div class="ou-empty-row">Belum ada versi.</div>') + '</div>';

    var phones = '<div class="section-label"><span class="section-label-text">Ponsel dengan pengguna terbanyak</span><span class="section-label-line"></span></div>' +
        '<div class="ou-list">' + (a.topPhones.length ? a.topPhones.map(_renderPhoneRow).join('') : '<div class="ou-empty-row">Belum ada ponsel ber-OS sendiri yang terjual.</div>') + '</div>';

    var eco = '<div class="section-label"><span class="section-label-text">Dampak ke ekosistem</span><span class="section-label-line"></span></div>' +
        '<div class="ou-eco">' +
        '<div class="ou-eco-row"><span>Bonus aplikasi pihak ketiga</span><b>+' + a.appBonusPerMonth + ' / bulan</b></div>' +
        '<div class="ou-eco-note">Setiap ' + formatUsers(ADOPTION_CONFIG.appsUsersPerBonus) + ' pengguna aktif menambah 1 aplikasi per bulan (maks. +' + ADOPTION_CONFIG.appsBonusMax + ').' +
        ' Semakin banyak pengguna, semakin ramai App Store-mu.</div>' +
        '</div>';

    return header + trend + versions + phones + eco;
}

function _renderVersionRow(v) {
    var pct = Math.round(v.share * 100);
    return '<div class="ou-row">' +
        '<div class="ou-row-top"><span class="ou-row-name">' + escapeHtml(v.versionString) + '</span>' +
        '<span class="ou-tier ou-tier-' + v.tier + '">' + TIER_LABEL[v.tier] + '</span>' +
        '<span class="ou-row-val">' + escapeHtml(formatUsers(v.active)) + ' · ' + pct + '%</span></div>' +
        '<div class="ou-bar"><div class="ou-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
}

function _renderPhoneRow(p) {
    return '<div class="ou-row ou-row-flat">' +
        '<div class="ou-row-top"><span class="ou-row-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="ou-row-val">' + escapeHtml(formatUsers(p.active)) + ' aktif</span></div>' +
        '<div class="ou-row-meta">' + escapeHtml(p.versionString) + ' · terjual ' + escapeHtml(formatUsers(p.shipped)) + '</div>' +
        '</div>';
}

// Grafik tren pengguna aktif per bulan (SVG sederhana, tanpa library).
function _renderTrend(history) {
    var head = '<div class="section-label"><span class="section-label-text">Tren pengguna aktif</span><span class="section-label-line"></span></div>';
    if (!history || history.length < 2) {
        return head + '<div class="ou-trend-empty">Tren akan terlihat setelah pergantian bulan kedua.</div>';
    }
    var W = 320, H = 96, PAD = 10;
    var max = 1;
    history.forEach(function (h) { if (h.active > max) max = h.active; });
    var n = history.length;
    var pts = history.map(function (h, i) {
        var x = PAD + (i * (W - PAD * 2)) / (n - 1);
        var y = H - 14 - (h.active / max) * (H - 28);
        return [x, y];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[n - 1][0].toFixed(1) + ',' + (H - 14) + ' L' + pts[0][0].toFixed(1) + ',' + (H - 14) + ' Z';
    var first = history[0], last = history[n - 1];
    var svg = '<svg class="ou-trend" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Tren pengguna aktif">' +
        '<path d="' + area + '" class="ou-trend-area"/>' +
        '<path d="' + line + '" class="ou-trend-line" fill="none"/>' +
        '</svg>';
    return head + '<div class="ou-trend-wrap">' + svg +
        '<div class="ou-trend-axis"><span>' + _mlabel(first) + ' · ' + formatUsers(first.active) + '</span>' +
        '<span>' + _mlabel(last) + ' · ' + formatUsers(last.active) + '</span></div></div>';
}

function _mlabel(h) {
    var m = MONTHS[(h.month || 1) - 1] || '';
    return m + ' ' + (h.year || '');
}

function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var css = [
        '.ou-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 8px 0 10px; }',
        '@media (min-width: 640px) { .ou-kpis { grid-template-columns: repeat(5, 1fr); } }',
        '.ou-kpi { display: flex; align-items: center; gap: 8px; padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); }',
        '.ou-kpi.down { box-shadow: inset 0 0 0 1px rgba(255,90,90,.45); }',
        '.ou-kpi-ico { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; background: rgba(255,255,255,.06); }',
        '.ou-kpi-val { font-weight: 700; font-size: 14px; }',
        '.ou-kpi-lbl { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); }',
        '.ou-hero { padding: 12px; border-radius: 14px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ou-hero-top { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }',
        '.ou-hero-label { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.6)); }',
        '.ou-hero-big { font-size: 28px; font-weight: 800; letter-spacing: -.01em; }',
        '.ou-hero-side { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.6)); display: grid; gap: 3px; text-align: right; }',
        '.ou-hero-side b { color: var(--text, #fff); }',
        '.ou-note { margin-top: 8px; font-size: 11px; color: var(--text-mute, rgba(255,255,255,.5)); }',
        '.ou-trend-wrap { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ou-trend { width: 100%; height: 96px; display: block; }',
        '.ou-trend-area { fill: var(--accent, #4f8cff); opacity: .15; }',
        '.ou-trend-line { stroke: var(--accent, #4f8cff); stroke-width: 2; vector-effect: non-scaling-stroke; }',
        '.ou-trend-axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); margin-top: 4px; }',
        '.ou-trend-empty { font-size: 12px; color: var(--text-mute, rgba(255,255,255,.55)); padding: 10px 2px; }',
        '.ou-list { display: grid; gap: 6px; margin-top: 6px; }',
        '.ou-row { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); display: grid; gap: 6px; }',
        '.ou-row-flat { gap: 3px; }',
        '.ou-row-top { display: flex; align-items: center; gap: 8px; }',
        '.ou-row-name { font-weight: 600; font-size: 13px; flex: 1; }',
        '.ou-row-val { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.7)); }',
        '.ou-row-meta { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.5)); }',
        '.ou-tier { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,.08); }',
        '.ou-tier-current { background: var(--accent-soft, rgba(79,140,255,.18)); color: var(--accent, #4f8cff); }',
        '.ou-tier-previous { background: rgba(255,200,80,.15); }',
        '.ou-tier-older { opacity: .75; }',
        '.ou-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }',
        '.ou-bar-fill { height: 100%; background: var(--accent, #4f8cff); border-radius: 999px; }',
        '.ou-eco { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); display: grid; gap: 6px; }',
        '.ou-eco-row { display: flex; justify-content: space-between; font-size: 13px; }',
        '.ou-eco-note { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); line-height: 1.45; }',
        '.ou-empty-row { font-size: 12px; color: var(--text-mute, rgba(255,255,255,.55)); padding: 8px 2px; }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-os-users', '');
    style.textContent = css;
    document.head.appendChild(style);
}
