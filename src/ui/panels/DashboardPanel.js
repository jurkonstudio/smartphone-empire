// FILE: src/ui/panels/DashboardPanel.js
// v2026.1 — 7 kartu hierarkis.
// v2027.13a — i18n.
// v2027.26a — Focus/News/Activity dipindah ke Home carousel.
import { renderKpiCards } from './KpiCards.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderCashChart } from './CashChart.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _renderPublicHighlight(state) {
    var fb = state.feedback || {};
    var sentiment = fb.sentiment != null ? fb.sentiment : 50;
    var feed = fb.feed || [];
    var viral = (fb.activeViral || [])[0];

    if (!feed.length && !viral) return '';

    var sentColor = sentiment >= 70 ? 'var(--success)'
        : sentiment >= 45 ? 'var(--info)'
        : sentiment >= 30 ? 'var(--warn)'
        : 'var(--danger)';
    var latest = feed[0];

    return '<div class="card">' +
        '<div class="card-title">' + t('dashboard.public_highlight') + '</div>' +
        '<div class="sum-row"><span>' + t('dashboard.sentiment') + '</span><b style="color:' + sentColor + ';">' + sentiment + ' / 100</b></div>' +
        (viral
            ? '<div class="viral-line" style="color:' + (viral.type === 'positive' ? 'var(--success)' : 'var(--danger)') + ';">' +
              (viral.type === 'positive' ? '✨' : '⚠') + ' ' + escapeHtml(viral.title) +
              '</div>'
            : '') +
        (latest
            ? '<div class="feedback-quote">' +
              '<div class="feedback-quote-meta">' + escapeHtml(latest.source) + ' • ' + latest.score + '/10</div>' +
              '<div class="feedback-quote-text">"' + escapeHtml(latest.text) + '"</div>' +
              '</div>'
            : '') +
        '<button class="btn-secondary" data-nav="market" style="width:100%;margin-top:10px;font-size:12px;padding:8px;">' + t('dashboard.view_feedback') + '</button>' +
        '</div>';
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
    return renderKpiCards(state, timeSnapshot, teamSystem) +
        renderCashChart(state) +
        _renderPublicHighlight(state) +
        _renderTimelineCollapsible();
}
