import { renderKpiCards } from './KpiCards.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderActivityPanel } from './ActivityPanel.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderCloudStatus } from './CloudStatus.js';

export function renderDashboard(state) {
    return `
        <div style="max-width:800px; margin:0 auto; padding:10px;">
            ${renderKpiCards(state)}
            ${renderProgressPanel()}
            ${renderTimelinePanel()}
            ${renderActivityPanel()}
            ${renderCloudStatus()}
        </div>
    `;
}
