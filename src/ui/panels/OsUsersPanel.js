// FILE: src/ui/panels/OsUsersPanel.js  (REPLACE — v2: distribusi versi ala dasbor dunia nyata)
// ============================================================
// Tampilan adopsi/pengguna OS:
//   - renderOsKpiRow   : baris ringkasan di tab Status OS.
//   - renderOsUsersTab : tab "Pengguna" (hero, tren, DISTRIBUSI VERSI, rollout
//     versi terbaru, rincian per versi, ponsel teratas, dampak ke ekosistem).
// Teks lewat t() (kamus os-panel.i18n.js: key osp.*).
// Datanya dari OsAdoptionModel.js (computeOsAdoption) lewat osSystem.getAdoption().
//
// Yang baru di v2:
//   - Bar bertumpuk 100% (seperti Android Distribution Dashboard) + legenda.
//   - 4 kartu insight: di versi terbaru, sudah update, tanpa patch keamanan, fragmentasi.
//   - Kartu rollout versi terbaru: kurva-S adopsi + marker "Sekarang" + perkiraan 50%.
//   - Baris versi: tanggal rilis + umur, status (Terbaru / Didukung / Akhir dukungan),
//     % pengguna yang presisi (<0.1%, 2.4%), progres update dari perangkat layak.
//   - Versi tanpa pengguna dilipat agar daftar tidak penuh baris 0%.
// ============================================================
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { formatUsers, ADOPTION_CONFIG } from '../../systems/OsAdoptionModel.js';
import { renderOsCountryPreview, ensureCountryHandlers } from './CountryPanels.js';

var VERSION_COLORS = ['#4f8cff', '#35c2a1', '#f5b94a', '#e87a5d', '#a07cf0', '#5fb7e8', '#c9d36a', '#e06fa7'];
var OTHER_COLOR = '#3a4352';

var _stylesInjected = false;

function _isId() {
    try { return LanguageService.getLang() === 'id'; } catch (e) { return false; }
}

function _color(versionIndex) { return VERSION_COLORS[versionIndex % VERSION_COLORS.length]; }

// 0.0004 -> "<0.1%", 0.024 -> "2.4%", 0.95 -> "95%"
function _fmtPct(share) {
    var p = share * 100;
    var s;
    if (p <= 0) s = '0%';
    else if (p < 0.1) s = '<0.1%';
    else if (p < 10) s = p.toFixed(1).replace(/\.0$/, '') + '%';
    else s = Math.round(p) + '%';
    return _isId() ? s.replace('.', ',') : s;
}

function _fmtNum1(x) {
    var s = (Math.round(x * 10) / 10).toString();
    return _isId() ? s.replace('.', ',') : s;
}

function _monthShort(month) {
    try { return new Date(2000, (month || 1) - 1, 1).toLocaleString(LanguageService.getLang(), { month: 'short' }); }
    catch (e) { return String(month || ''); }
}

function _dateLabel(year, month) { return _monthShort(month) + ' ' + year; }

function _ago(months) {
    if (months < 0.05) return t('osp.users.ago.today');
    if (months < 1) return t('osp.users.ago.days', { n: Math.max(1, Math.round(months * 30)) });
    if (months < 24) return t('osp.users.ago.months', { n: Math.max(1, Math.round(months)) });
    return t('osp.users.ago.years', { n: _fmtNum1(months / 12) });
}

export function renderOsKpiRow(osSystem, data) {
    _ensureStyles();
    ensureCountryHandlers();
    var a = osSystem.getAdoption();
    var os = data.os;
    var cur = osSystem.getCurrentVersionObject ? osSystem.getCurrentVersionObject() : null;
    var features = cur && cur.features ? cur.features.length : 0;
    var bugs = (os.bugs || []).filter(function (b) { return b.status === 'active' || b.status === 'patching'; }).length;
    var chips = [
        { ico: 'users',  label: t('osp.kpi.active_users'), val: formatUsers(a.activeUsers), tap: true },
        { ico: 'cpu',    label: t('osp.kpi.version'),      val: cur ? cur.versionString : '-' },
        { ico: 'layers', label: t('osp.kpi.features'),     val: String(features) },
        { ico: 'blocks', label: t('osp.kpi.apps3p'),       val: String(os.apps ? os.apps.thirdParty : 0) },
        { ico: 'warn',   label: t('osp.kpi.bugs'),         val: String(bugs), tone: bugs >= 3 ? 'down' : '' }
    ];
    return '<div class="ou-kpis">' + chips.map(function (c) {
        var tapAttr = c.tap ? ' data-os-countries role="button" tabindex="0"' : '';
        return '<div class="ou-kpi ' + (c.tone || '') + '"' + tapAttr + '><div class="ou-kpi-ico">' + renderIcon(c.ico, 14) + '</div>' +
            '<div><div class="ou-kpi-val">' + escapeHtml(c.val) + '</div><div class="ou-kpi-lbl">' + escapeHtml(c.label) + '</div></div>' +
            (c.tap ? '<span class="ou-kpi-chev">›</span>' : '') + '</div>';
    }).join('') + '</div>';
}

export function renderOsUsersTab(osSystem, data) {
    _ensureStyles();
    ensureCountryHandlers();
    var a = osSystem.getAdoption();

    if (!a.hasOs) {
        return '<div class="empty"><div class="empty-title">' + escapeHtml(t('osp.users.empty_title')) + '</div>' +
            '<div class="empty-desc">' + escapeHtml(t('osp.users.empty_desc')) + '</div></div>';
    }

    var header = '<div class="ou-hero" data-os-countries role="button" tabindex="0">' +
        '<div class="ou-hero-top"><div><div class="ou-hero-label">' + escapeHtml(t('osp.users.total_active')) + '</div>' +
        '<div class="ou-hero-big">' + escapeHtml(formatUsers(a.activeUsers)) + '</div></div>' +
        '<div class="ou-hero-side"><div>' + escapeHtml(t('osp.users.shipped')) + ' <b>' + escapeHtml(formatUsers(a.shippedUnits)) + '</b></div>' +
        '<div>' + escapeHtml(t('osp.users.retention')) + ' <b>' + Math.round(a.retentionRate * 100) + '%</b></div>' +
        '<div>' + escapeHtml(t('osp.users.os_phones')) + ' <b>' + a.phoneCount + '</b></div></div></div>' +
        (a.licensedUnits > 0 ? '<div class="ou-note">' + escapeHtml(t('osp.users.licensed_note', { units: formatUsers(a.licensedUnits) })) + '</div>' : '') +
        '</div>';

    var trend = _renderTrend(a.history);

    var versions = _sectionLabel(t('osp.users.by_version')) +
        '<div class="ou-sub">' + escapeHtml(t('osp.users.by_version_sub')) + '</div>' +
        _renderDistribution(a) +
        _renderTiles(a) +
        _renderRollout(a) +
        _renderVersionList(a) +
        _renderHow(a);

    var phones = _sectionLabel(t('osp.users.top_phones')) +
        '<div class="ou-list">' + (a.topPhones.length ? a.topPhones.map(_renderPhoneRow).join('') : '<div class="ou-empty-row">' + escapeHtml(t('osp.users.no_phones')) + '</div>') + '</div>';

    var eco = _sectionLabel(t('osp.users.ecosystem')) +
        '<div class="ou-eco">' +
        '<div class="ou-eco-row"><span>' + escapeHtml(t('osp.users.app_bonus')) + '</span><b>' + escapeHtml(t('osp.users.per_month', { n: a.appBonusPerMonth })) + '</b></div>' +
        '<div class="ou-eco-note">' + escapeHtml(t('osp.users.eco_note', { users: formatUsers(ADOPTION_CONFIG.appsUsersPerBonus), max: ADOPTION_CONFIG.appsBonusMax })) + '</div>' +
        '</div>';

    return header + renderOsCountryPreview(data) + trend + versions + phones + eco;
}

function _sectionLabel(text) {
    return '<div class="section-label"><span class="section-label-text">' + escapeHtml(text) + '</span><span class="section-label-line"></span></div>';
}

// ---------- bar bertumpuk 100% + legenda ----------
function _renderDistribution(a) {
    var rows = a.versions.map(function (v, i) { return { v: v, i: i }; })
        .filter(function (x) { return x.v.share > 0; });
    if (!rows.length) {
        return '<div class="ou-empty-row">' + escapeHtml(t('osp.users.dist_empty')) + '</div>';
    }
    // urut dari versi terbaru → lama (kiri → kanan), seperti dasbor distribusi
    rows.sort(function (x, y) { return y.i - x.i; });

    var segs = rows.map(function (x) {
        return '<span class="ou-seg" style="flex:' + x.v.share.toFixed(5) + ' 1 0;background:' + _color(x.i) + '" title="' +
            escapeHtml(x.v.versionString + ' · ' + _fmtPct(x.v.share)) + '"></span>';
    }).join('');

    var legendRows = rows.slice().sort(function (x, y) { return y.v.share - x.v.share; });
    var top = legendRows.slice(0, 4);
    var restShare = 0;
    legendRows.slice(4).forEach(function (x) { restShare += x.v.share; });
    var legend = top.map(function (x) {
        return '<span class="ou-leg"><i style="background:' + _color(x.i) + '"></i>' + escapeHtml(x.v.versionString) + ' <b>' + _fmtPct(x.v.share) + '</b></span>';
    }).join('');
    if (restShare > 0) {
        legend += '<span class="ou-leg"><i style="background:' + OTHER_COLOR + '"></i>' + escapeHtml(t('osp.users.dist_other')) + ' <b>' + _fmtPct(restShare) + '</b></span>';
    }

    return '<div class="ou-dist" role="img" aria-label="' + escapeHtml(t('osp.users.dist_label')) + '">' +
        '<div class="ou-stack">' + segs + '</div><div class="ou-legend">' + legend + '</div></div>';
}

// ---------- 4 kartu insight ----------
function _renderTiles(a) {
    var fragKey = 'osp.users.frag.' + a.fragmentation;
    var tiles = [
        { lbl: t('osp.users.tile.latest'), val: _fmtPct(a.latestShare), sub: t('osp.users.tile.latest_sub', { n: formatUsers(a.latest ? a.latest.active : 0) }) },
        { lbl: t('osp.users.tile.adoption'), val: _fmtPct(a.latestAdoption), sub: t('osp.users.tile.adoption_sub') },
        { lbl: t('osp.users.tile.nopatch'), val: formatUsers(a.securityRiskUsers), sub: t('osp.users.tile.nopatch_sub', { p: _fmtPct(a.securityRiskShare) }),
          tone: a.securityRiskShare >= 0.3 ? 'down' : '' },
        { lbl: t('osp.users.tile.frag'), val: t(fragKey), sub: t('osp.users.tile.frag_sub', { n: _fmtNum1(a.effectiveVersions) }),
          tone: a.fragmentation === 'high' ? 'down' : '' }
    ];
    return '<div class="ou-tiles">' + tiles.map(function (x) {
        return '<div class="ou-tile ' + (x.tone || '') + '"><div class="ou-tile-lbl">' + escapeHtml(x.lbl) + '</div>' +
            '<div class="ou-tile-val">' + escapeHtml(x.val) + '</div><div class="ou-tile-sub">' + escapeHtml(x.sub) + '</div></div>';
    }).join('') + '</div>';
}

// ---------- kartu rollout versi terbaru ----------
function _renderRollout(a) {
    var L = a.latest;
    if (!L) return '';
    var phaseChip = '<span class="ou-chip ou-chip-phase">' + escapeHtml(t('osp.users.rollout.phase.' + L.phase)) + '</span>';

    var body;
    if (L.eligible <= 0) {
        body = '<div class="ou-ro-none">' + escapeHtml(t('osp.users.rollout.none')) + '</div>';
    } else {
        body = '<div class="ou-ro-big">' + escapeHtml(_fmtPct(L.adoption)) + '</div>' +
            '<div class="ou-ro-cap">' + escapeHtml(t('osp.users.rollout.adopted', { n: formatUsers(L.eligible) })) + '</div>' +
            _renderCurve(L.curve) +
            '<div class="ou-ro-eta">' + escapeHtml(_etaText(L)) + '</div>';
    }

    return '<div class="ou-rollout">' +
        '<div class="ou-ro-top"><span class="ou-ro-title">' + escapeHtml(t('osp.users.rollout.title', { v: L.versionString })) + '</span>' + phaseChip + '</div>' +
        body + '</div>';
}

function _etaText(L) {
    if (L.reached50) return t('osp.users.rollout.eta_done');
    if (L.never50) return t('osp.users.rollout.eta_never', { p: Math.round(L.cap * 100) });
    if (L.etaMonths !== null && L.etaMonths !== undefined) {
        return t('osp.users.rollout.eta', { n: Math.max(1, Math.round(L.etaMonths)) });
    }
    return '';
}

// Kurva-S adopsi: sumbu Y 0-100% (jujur menunjukkan batas era), garis putus-putus di 50%.
function _renderCurve(c) {
    var W = 320, H = 92, PL = 8, PR = 8, PT = 8, PB = 18;
    var iw = W - PL - PR, ih = H - PT - PB;
    function X(m) { return PL + (m / c.span) * iw; }
    function Y(v) { return PT + (1 - Math.min(1, v)) * ih; }
    var line = c.points.map(function (p, i) { return (i ? 'L' : 'M') + X(p.m).toFixed(1) + ',' + Y(p.v).toFixed(1); }).join(' ');
    var last = c.points[c.points.length - 1];
    var area = line + ' L' + X(last.m).toFixed(1) + ',' + Y(0).toFixed(1) + ' L' + X(0).toFixed(1) + ',' + Y(0).toFixed(1) + ' Z';

    // interpolasi nilai pada marker "sekarang"
    var nowV = 0;
    for (var i = 1; i < c.points.length; i++) {
        if (c.nowM <= c.points[i].m) {
            var p0 = c.points[i - 1], p1 = c.points[i];
            var f = p1.m > p0.m ? (c.nowM - p0.m) / (p1.m - p0.m) : 0;
            nowV = p0.v + (p1.v - p0.v) * f;
            break;
        }
        nowV = c.points[i].v;
    }
    var nx = X(c.nowM), ny = Y(nowV);

    return '<svg class="ou-curve" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">' +
        '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + Y(0.5).toFixed(1) + '" y2="' + Y(0.5).toFixed(1) + '" class="ou-curve-grid"/>' +
        '<path d="' + area + '" class="ou-curve-area"/>' +
        '<path d="' + line + '" class="ou-curve-line" fill="none"/>' +
        '<line x1="' + nx.toFixed(1) + '" x2="' + nx.toFixed(1) + '" y1="' + PT + '" y2="' + (H - PB) + '" class="ou-curve-now"/>' +
        '<circle cx="' + nx.toFixed(1) + '" cy="' + ny.toFixed(1) + '" r="3.5" class="ou-curve-dot"/>' +
        '<text x="' + PL + '" y="' + (H - 4) + '" class="ou-curve-txt">0</text>' +
        '<text x="' + (W - PR) + '" y="' + (H - 4) + '" text-anchor="end" class="ou-curve-txt">' + c.span + ' ' + escapeHtml(t('osp.users.unit_month')) + '</text>' +
        '<text x="' + (W - PR) + '" y="' + (Y(0.5) - 3).toFixed(1) + '" text-anchor="end" class="ou-curve-txt">50%</text>' +
        '</svg>' +
        '<div class="ou-curve-cap"><span class="ou-curve-capdot"></span>' + escapeHtml(t('osp.users.rollout.now')) + '</div>';
}

// ---------- daftar versi ----------
function _renderVersionList(a) {
    var all = a.versions.map(function (v, i) { return { v: v, i: i }; }).reverse();   // terbaru di atas
    var shown = [], empty = [];
    all.forEach(function (x) {
        // versi terbaru selalu tampil walau 0 (rollout baru mulai); sisanya yang kosong dilipat
        if (x.v.active > 0 || x.v.status === 'latest') shown.push(x); else empty.push(x);
    });
    var html = '<div class="ou-list">' + (shown.length ? shown.map(_renderVersionRow).join('') : '<div class="ou-empty-row">' + escapeHtml(t('osp.users.no_versions')) + '</div>') + '</div>';
    if (empty.length) {
        html += '<details class="ou-fold"><summary>' + escapeHtml(t('osp.users.fold', { n: empty.length })) + '</summary>' +
            '<div class="ou-list">' + empty.map(_renderVersionRow).join('') + '</div></details>';
    }
    return html;
}

function _renderVersionRow(x) {
    var v = x.v;
    var col = _color(x.i);
    var widthPct = v.share > 0 ? Math.max(1.5, v.share * 100) : 0;
    var chips = '<span class="ou-chip ou-chip-' + v.status + '">' + escapeHtml(t('osp.users.status.' + v.status)) + '</span>';

    var meta = [escapeHtml(t('osp.users.row.released', { d: _dateLabel(v.releaseYear, v.releaseMonth), ago: _ago(v.ageMonths) }))];
    if (v.status === 'eol') {
        meta.push('<span class="ou-warn">' + escapeHtml(t('osp.users.row.eol')) + '</span>');
    } else if (v.eligible > 0 && v.adoption < 0.995) {
        meta.push(escapeHtml(t('osp.users.row.updated', { p: _fmtPct(v.adoption), n: formatUsers(v.eligible) })));
    } else if (v.shipped > 0) {
        meta.push(escapeHtml(t('osp.users.row.shipped_with', { n: formatUsers(v.shipped) })));
    }

    return '<div class="ou-ver ou-ver-' + v.status + '">' +
        '<div class="ou-row-top"><i class="ou-dot" style="background:' + col + '"></i>' +
        '<span class="ou-row-name">' + escapeHtml(v.versionString) + '</span>' + chips +
        '<span class="ou-row-val">' + escapeHtml(formatUsers(v.active)) + ' · ' + escapeHtml(_fmtPct(v.share)) + '</span></div>' +
        '<div class="ou-bar"><div class="ou-bar-fill" style="width:' + widthPct.toFixed(2) + '%;background:' + col + '"></div></div>' +
        '<div class="ou-row-meta">' + meta.join(' · ') + '</div>' +
        '</div>';
}

// ---------- penjelasan cara kerja ----------
function _renderHow(a) {
    return '<details class="ou-fold ou-how"><summary>' + escapeHtml(t('osp.users.how.title')) + '</summary>' +
        '<div class="ou-how-body">' +
        '<p>' + escapeHtml(t('osp.users.how.1')) + '</p>' +
        '<p>' + escapeHtml(t('osp.users.how.2')) + '</p>' +
        '<p>' + escapeHtml(t('osp.users.how.3')) + '</p>' +
        '<p>' + escapeHtml(t('osp.users.how.era', {
            y: a.nowYear, mech: t(a.era.mech), p: Math.round(a.era.cap * 100), s: _fmtNum1(a.era.supportYears)
        })) + '</p>' +
        '</div></details>';
}

function _renderPhoneRow(p) {
    var meta = t('osp.users.phone_meta', { v: p.versionString, n: formatUsers(p.shipped) });
    if (p.currentVersion && p.currentVersion !== '-' && p.currentVersion !== p.versionString) {
        meta += ' · ' + t('osp.users.phone_now', { v: p.currentVersion });
    }
    return '<div class="ou-row ou-row-flat">' +
        '<div class="ou-row-top"><span class="ou-row-name">' + escapeHtml(p.name) + '</span>' +
        '<span class="ou-row-val">' + escapeHtml(t('osp.users.phone_active', { n: formatUsers(p.active) })) + '</span></div>' +
        '<div class="ou-row-meta">' + escapeHtml(meta) + '</div>' +
        '</div>';
}

// Grafik tren pengguna aktif per bulan (SVG sederhana, tanpa library).
function _renderTrend(history) {
    var head = _sectionLabel(t('osp.users.trend'));
    if (!history || history.length < 2) {
        return head + '<div class="ou-trend-empty">' + escapeHtml(t('osp.users.trend_empty')) + '</div>';
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
    var svg = '<svg class="ou-trend" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + escapeHtml(t('osp.users.trend')) + '">' +
        '<path d="' + area + '" class="ou-trend-area"/>' +
        '<path d="' + line + '" class="ou-trend-line" fill="none"/>' +
        '</svg>';
    return head + '<div class="ou-trend-wrap">' + svg +
        '<div class="ou-trend-axis"><span>' + _mlabel(first) + ' · ' + formatUsers(first.active) + '</span>' +
        '<span>' + _mlabel(last) + ' · ' + formatUsers(last.active) + '</span></div></div>';
}

function _mlabel(h) {
    return _monthShort(h.month) + ' ' + (h.year || '');
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
        '.ou-sub { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); margin: 2px 2px 8px; }',

        /* trend */
        '.ou-trend-wrap { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ou-trend { width: 100%; height: 96px; display: block; }',
        '.ou-trend-area { fill: var(--accent, #4f8cff); opacity: .15; }',
        '.ou-trend-line { stroke: var(--accent, #4f8cff); stroke-width: 2; vector-effect: non-scaling-stroke; }',
        '.ou-trend-axis { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); margin-top: 4px; }',
        '.ou-trend-empty { font-size: 12px; color: var(--text-mute, rgba(255,255,255,.55)); padding: 10px 2px; }',

        /* distribusi */
        '.ou-dist { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ou-stack { display: flex; height: 14px; border-radius: 999px; overflow: hidden; gap: 2px; background: rgba(255,255,255,.06); }',
        '.ou-seg { min-width: 3px; display: block; }',
        '.ou-legend { display: flex; flex-wrap: wrap; gap: 6px 12px; margin-top: 8px; font-size: 11px; color: var(--text-dim, rgba(255,255,255,.7)); }',
        '.ou-leg { display: inline-flex; align-items: center; gap: 5px; }',
        '.ou-leg i { width: 8px; height: 8px; border-radius: 3px; display: inline-block; }',
        '.ou-leg b { color: var(--text, #fff); font-weight: 700; }',

        /* kartu insight */
        '.ou-tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }',
        '.ou-tile { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); min-width: 0; }',
        '.ou-tile.down { box-shadow: inset 0 0 0 1px rgba(255,90,90,.4); }',
        '.ou-tile-lbl { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); }',
        '.ou-tile-val { font-size: 20px; font-weight: 800; letter-spacing: -.01em; margin: 2px 0; }',
        '.ou-tile-sub { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.5)); }',

        /* rollout */
        '.ou-rollout { padding: 12px; border-radius: 14px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ou-ro-top { display: flex; align-items: center; gap: 8px; justify-content: space-between; }',
        '.ou-ro-title { font-weight: 700; font-size: 13px; }',
        '.ou-ro-big { font-size: 26px; font-weight: 800; margin-top: 6px; letter-spacing: -.01em; }',
        '.ou-ro-cap { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); margin-bottom: 6px; }',
        '.ou-ro-none { font-size: 12px; color: var(--text-mute, rgba(255,255,255,.55)); margin-top: 6px; line-height: 1.45; }',
        '.ou-ro-eta { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.7)); margin-top: 4px; line-height: 1.45; }',
        '.ou-curve { width: 100%; height: 92px; display: block; }',
        '.ou-curve-grid { stroke: rgba(255,255,255,.18); stroke-dasharray: 3 4; stroke-width: 1; vector-effect: non-scaling-stroke; }',
        '.ou-curve-area { fill: var(--accent, #4f8cff); opacity: .16; }',
        '.ou-curve-line { stroke: var(--accent, #4f8cff); stroke-width: 2; vector-effect: non-scaling-stroke; }',
        '.ou-curve-now { stroke: rgba(255,255,255,.45); stroke-width: 1; vector-effect: non-scaling-stroke; }',
        '.ou-curve-dot { fill: var(--accent, #4f8cff); stroke: #fff; stroke-width: 1.5; vector-effect: non-scaling-stroke; }',
        '.ou-curve-txt { font-size: 9px; fill: rgba(255,255,255,.5); }',
        '.ou-curve-cap { display: flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-mute, rgba(255,255,255,.55)); margin-top: 2px; }',
        '.ou-curve-capdot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent, #4f8cff); border: 1.5px solid #fff; display: inline-block; }',

        /* daftar */
        '.ou-list { display: grid; gap: 6px; margin-top: 6px; }',
        '.ou-row, .ou-ver { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); display: grid; gap: 6px; }',
        '.ou-ver-latest { box-shadow: inset 0 0 0 1px var(--accent-soft, rgba(79,140,255,.35)); }',
        '.ou-ver-eol { opacity: .92; }',
        '.ou-row-flat { gap: 3px; }',
        '.ou-row-top { display: flex; align-items: center; gap: 8px; }',
        '.ou-dot { width: 9px; height: 9px; border-radius: 3px; flex: none; display: inline-block; }',
        '.ou-row-name { font-weight: 600; font-size: 13px; flex: 1; min-width: 0; }',
        '.ou-row-val { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.7)); white-space: nowrap; }',
        '.ou-row-meta { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.5)); line-height: 1.45; }',
        '.ou-warn { color: #ff8a7a; }',
        '.ou-chip { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: rgba(255,255,255,.08); white-space: nowrap; }',
        '.ou-chip-latest { background: var(--accent-soft, rgba(79,140,255,.18)); color: var(--accent, #4f8cff); }',
        '.ou-chip-supported { background: rgba(53,194,161,.14); color: #35c2a1; }',
        '.ou-chip-eol { background: rgba(255,90,90,.15); color: #ff8a7a; }',
        '.ou-chip-phase { background: rgba(245,185,74,.16); color: #f5b94a; }',
        '.ou-bar { height: 6px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }',
        '.ou-bar-fill { height: 100%; border-radius: 999px; }',
        '.ou-fold { margin-top: 8px; }',
        '.ou-fold > summary { cursor: pointer; font-size: 12px; color: var(--text-dim, rgba(255,255,255,.65)); padding: 8px 2px; list-style: none; }',
        '.ou-fold > summary::-webkit-details-marker { display: none; }',
        '.ou-fold > summary::before { content: "›"; display: inline-block; margin-right: 6px; transition: transform .15s; }',
        '.ou-fold[open] > summary::before { transform: rotate(90deg); }',
        '.ou-how-body { font-size: 12px; line-height: 1.55; color: var(--text-dim, rgba(255,255,255,.7)); padding: 0 2px 6px; }',
        '.ou-how-body p { margin: 0 0 8px; }',

        /* ekosistem */
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
