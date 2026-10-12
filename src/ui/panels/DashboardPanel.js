// FILE: src/ui/panels/DashboardPanel.js
import { renderKpiCards } from './KpiCards.js';
import { renderTimePanel } from './TimePanel.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderLogPanel } from './LogPanel.js';
import { renderQuestsPanel } from './QuestsPanel.js';
import { renderCashChart } from './CashChart.js';
import { renderCloudStatus } from './CloudStatus.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _renderPublicHighlight(state) {
    const fb = state.feedback || {};
    const sentiment = fb.sentiment != null ? fb.sentiment : 50;
    const feed = fb.feed || [];
    const viral = (fb.activeViral || [])[0];

    if (!feed.length && !viral) return '';

    const sentColor = sentiment >= 70 ? 'var(--accent)' : sentiment >= 45 ? 'var(--info)' : sentiment >= 30 ? 'var(--warn)' : 'var(--danger)';
    const latest = feed[0];

    return `
        <div class="card">
            <div class="card-title">Sorotan Publik</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:13px;color:var(--text-dim);">Sentimen</div>
                <div style="font-size:16px;font-weight:700;color:${sentColor};">${sentiment}/100</div>
            </div>
            ${viral ? `<div style="font-size:12px;color:${viral.type === 'positive' ? 'var(--accent)' : 'var(--danger)'};margin-bottom:8px;">
                ${viral.type === 'positive' ? '✨' : '⚠'} ${escapeHtml(viral.title)}
            </div>` : ''}
            ${latest ? `
                <div style="font-size:11.5px;color:var(--text-mute);margin-bottom:4px;">${escapeHtml(latest.source)} • ${latest.score}/10</div>
                <div style="font-size:12.5px;color:var(--text);line-height:1.5;">"${escapeHtml(latest.text)}"</div>
            ` : ''}
            <button class="btn-secondary" data-nav="market" style="width:100%;margin-top:10px;font-size:12px;padding:8px;">Lihat Feedback Publik →</button>
        </div>
    `;
}

export function renderDashboard(state, timeSnapshot, researchSystem) {
    return `
        ${renderKpiCards(state, timeSnapshot)}
        ${renderTimePanel(timeSnapshot)}
        ${renderQuestsPanel(state)}
        ${_renderPublicHighlight(state)}
        ${renderCashChart(state)}
        ${renderProgressPanel(state, researchSystem)}
        ${renderTimelinePanel(state, timeSnapshot)}
        ${renderLogPanel(state)}
        ${renderCloudStatus()}
    `;
}
