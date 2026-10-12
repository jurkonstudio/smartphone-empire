// FILE: src/ui/panels/DashboardPanel.js
import { renderKpiCards } from './KpiCards.js';
import { renderTimePanel } from './TimePanel.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderLogPanel } from './LogPanel.js';
import { renderQuestsPanel } from './QuestsPanel.js';
import { renderCashChart } from './CashChart.js';
import { renderCloudStatus } from './CloudStatus.js';

export function renderDashboard(state, timeSnapshot) {
    return `
        ${renderKpiCards(state, timeSnapshot)}
        ${renderTimePanel(timeSnapshot)}
        ${renderQuestsPanel(state)}
        ${renderCashChart(state)}
        ${renderProgressPanel(state)}
        ${renderTimelinePanel(state, timeSnapshot)}
        ${renderLogPanel(state)}
        ${renderCloudStatus()}
    `;
}
