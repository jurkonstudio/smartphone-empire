import { icon } from '../icons.js';

function tlItem(t) {
  const stateClass = `tl-item--${t.state}`;
  return `
    <div class="tl-item ${stateClass}">
      <div class="tl-item__dot">
        ${t.state === 'locked' ? icon('lock', 8) : ''}
      </div>
      <div class="tl-item__head">
        <span class="tl-item__year">${t.year}</span>
        <span class="tl-item__title">${t.title}</span>
      </div>
      <div class="tl-item__desc">${t.desc}</div>
    </div>
  `;
}

export function renderTimelinePanel(state) {
  return `
    <section class="card" aria-labelledby="timeline-title">
      <div class="card__head">
        <div>
          <div class="card__title" id="timeline-title">Timeline Era</div>
          <div class="card__sub">Peta tonggak industri (pratinjau konten)</div>
        </div>
        <span class="badge badge--warn">Pratinjau</span>
      </div>

      <div class="timeline">
        ${state.timeline.map(tlItem).join('')}
      </div>
    </section>
  `;
}
