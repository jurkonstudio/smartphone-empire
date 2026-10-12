import { icon } from '../icons.js';

function stageRow(stage) {
  const iconName = stage.state === 'done' ? 'check'
                 : stage.state === 'active' ? 'clock'
                 : 'lock';
  const stateText = stage.state === 'done' ? 'Selesai'
                  : stage.state === 'active' ? 'Berjalan'
                  : 'Terkunci';
  return `
    <div class="stage stage--${stage.state}">
      <div class="stage__icon">${icon(iconName, 12)}</div>
      <div class="stage__label">${stage.label}</div>
      <div class="stage__state">${stateText}</div>
    </div>
  `;
}

export function renderProgressPanel(state) {
  const p = state.progress;
  const pct = Math.max(0, Math.min(100, Math.round((p.current / p.target) * 100)));

  return `
    <section class="card" aria-labelledby="progress-title">
      <div class="card__head">
        <div>
          <div class="card__title" id="progress-title">Perkembangan Perusahaan</div>
          <div class="card__sub">Roadmap milestone pengembangan game</div>
        </div>
        <span class="badge badge--accent">Roadmap</span>
      </div>

      <div class="progress">
        <div class="progress__meta">
          <span>${p.label}</span>
          <span class="progress__percent">${pct}%</span>
        </div>
        <div class="progress__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress__fill" style="width:${pct}%"></div>
        </div>

        <div class="stages">
          ${p.stages.map(stageRow).join('')}
        </div>
      </div>
    </section>
  `;
}
