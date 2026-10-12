import { icon } from '../icons.js';
import { renderKpiCards } from './KpiCards.js';
import { renderProgressPanel } from './ProgressPanel.js';
import { renderActivityPanel } from './ActivityPanel.js';
import { renderTimelinePanel } from './TimelinePanel.js';
import { renderCloudStatus } from './CloudStatus.js';

export function renderDashboard(state) {
  return `
    <div class="notice" role="note">
      <span class="notice__icon">${icon('info', 16)}</span>
      <div>
        <b>Ini build M0 (fondasi UI).</b>
        Semua angka, log, dan timeline di bawah adalah <b>data demo</b>.
        Belum ada ekonomi, produksi, riset, maupun cloud yang berjalan.
      </div>
    </div>

    <div class="section">
      <div class="section__label">
        <span>Indikator Kunci</span>
        <span class="line"></span>
        <span class="badge badge--demo">Demo</span>
      </div>
      ${renderKpiCards(state)}
    </div>

    <div class="section grid-2">
      ${renderProgressPanel(state)}
      ${renderActivityPanel(state)}
    </div>

    <div class="section">
      ${renderTimelinePanel(state)}
    </div>

    <div class="section">
      ${renderCloudStatus()}
    </div>
  `;
}
