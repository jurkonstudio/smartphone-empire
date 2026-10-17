// FILE: src/ui/panels/DashboardPanel.js
// v2026.1 — 7 kartu hierarkis.
// v2027.13a — i18n.
// v2027.26a — Focus/News/Activity dipindah ke Home carousel.
// v2027.31a — Overview dirombak: Hero → Metrics → Live Feed → Chart → Quick Actions
//             → Sorotan Publik (ringkas) → Timeline (collapsible). Hanya membaca state.
import { renderHeroFinance, renderMetricsGrid, ovIcon } from './KpiCards.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderCashChart } from './CashChart.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ---------------- BAGIAN 3 — LIVE FEED (3 log terbaru) ----------------
var _FEED_TONE = {
    info:    'var(--text-tertiary)',
    success: 'var(--success)',
    warning: 'var(--warn)',
    danger:  'var(--danger)'
};

function _renderLiveFeed(state) {
    var entries = (state.log || []).slice(0, 3);
    var rows = entries.length
        ? entries.map(function (e) {
            return '<div class="ov-feed-row" style="--ov-tone:' + (_FEED_TONE[e.type] || _FEED_TONE.info) + ';">' +
                '<span class="ov-feed-dot"></span>' +
                '<span class="ov-feed-time">' + e.day + '/' + e.month + '</span>' +
                '<span class="ov-feed-text">' + escapeHtml(String(e.text == null ? '' : e.text)) + '</span>' +
            '</div>';
        }).join('')
        : '<div class="ov-feed-empty">' + t('log.empty') + '</div>';

    return '<section class="ov-sec ov-card ov-feed">' +
        '<div class="ov-sec-head">' +
            '<h3 class="ov-sec-title">' + t('ov.feed.title') + '</h3>' +
            '<span class="ov-live"><span class="ov-live-dot"></span>' + t('ov.feed.live') + '</span>' +
        '</div>' +
        rows +
    '</section>';
}

// ---------------- BAGIAN 5 — QUICK ACTIONS ----------------
function _renderQuickActions() {
    function btn(attr, icon, tone, label) {
        return '<button type="button" class="ov-qa" ' + attr + ' style="--ov-tone:' + tone + ';">' +
            '<span class="ov-chip">' + ovIcon(icon, 18) + '</span>' +
            '<span class="ov-qa-label">' + label + '</span>' +
        '</button>';
    }
    return '<section class="ov-sec">' +
        '<div class="ov-sec-head"><h3 class="ov-sec-title">' + t('ov.qa.title') + '</h3></div>' +
        '<div class="ov-qa-grid">' +
            btn('data-nav="research"',     'flask',  'var(--info)',    t('ov.qa.research')) +
            btn('data-nav="products"',     'rocket', 'var(--warn)',    t('ov.qa.release')) +
            btn('data-hq-subtab="team"',   'hire',   'var(--success)', t('ov.qa.hire')) +
        '</div>' +
    '</section>';
}

// ---------------- SOROTAN PUBLIK (ringkas, di atas Timeline) ----------------
function _renderPublicPulse(state) {
    var fb = state.feedback || {};
    var feed = fb.feed || [];
    var viral = (fb.activeViral || [])[0];
    if (!feed.length && !viral) return '';

    var latest = feed[0];
    var score = latest ? Number(latest.score) : null;
    var scoreTone = score == null ? 'var(--text-tertiary)'
        : score >= 7 ? 'var(--success)' : score >= 4 ? 'var(--warn)' : 'var(--danger)';

    var viralHtml = viral
        ? '<span class="ov-pulse-viral" style="color:' + (viral.type === 'positive' ? 'var(--success)' : 'var(--danger)') + ';">' +
          (viral.type === 'positive' ? '✨ ' : '⚠ ') + escapeHtml(viral.title) + '</span>'
        : '';
    var textHtml = latest
        ? '<span class="ov-pulse-text"><b>' + escapeHtml(latest.source) + '</b> · “' + escapeHtml(latest.text) + '”</span>'
        : '';

    return '<button type="button" class="ov-sec ov-pulse" data-nav="market" style="--ov-tone:' + scoreTone + ';">' +
        '<span class="ov-chip">' + ovIcon('news') + '</span>' +
        '<span class="ov-pulse-body">' +
            '<span class="ov-pulse-head">' +
                '<span class="ov-label">' + t('dashboard.public_highlight') + '</span>' +
                (score != null && isFinite(score) ? '<span class="ov-pulse-score">' + score + '/10</span>' : '') +
            '</span>' +
            viralHtml + textHtml +
        '</span>' +
        '<span class="ov-pulse-go" aria-hidden="true">›</span>' +
    '</button>';
}

function _renderTimelineCollapsible() {
    return '<details class="collapsible-card">' +
        '<summary class="collapsible-summary">' +
        '<span>' + t('dashboard.timeline_title') + '</span>' +
        '</summary>' +
        '<div class="collapsible-body">' +
        renderTimelinePanel() +
        '</div>' +
        '</details>';
}

export function renderDashboard(state, timeSnapshot, researchSystem, teamSystem) {
    return '<div class="ov-wrap">' +
        renderHeroFinance(state) +                          // ① Hero Finance
        renderMetricsGrid(state, timeSnapshot, teamSystem) + // ② Metrics 2×2
        _renderLiveFeed(state) +                            // ③ Live Feed
        renderCashChart(state) +                            // ④ Chart 24 bulan
        _renderQuickActions() +                             // ⑤ Quick Actions
        _renderPublicPulse(state) +                         //    Sorotan Publik (ringkas)
        _renderTimelineCollapsible() +                      //    Timeline (collapsible)
        '</div>';
}
