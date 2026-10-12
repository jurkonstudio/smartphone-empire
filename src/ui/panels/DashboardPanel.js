// FILE: src/ui/panels/DashboardPanel.js
import { renderKpiCards } from './KpiCards.js';
import { renderTimePanel } from './TimePanel.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderActivityPanel } from './ActivityPanel.js';
import { renderCloudStatus } from './CloudStatus.js';

export function renderDashboard(state, timeSnapshot) {
    return `
        ${renderKpiCards(state, timeSnapshot)}
        ${renderTimePanel(timeSnapshot)}
        ${renderProgressPanel(state)}
        ${renderTimelinePanel(state, timeSnapshot)}
        ${renderActivityPanel(state)}
        ${renderCloudStatus()}
    `;
}
