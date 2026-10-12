export function renderActivityPanel(state) {
  const items = state.activity.map((a) => `
    <div class="activity__item">
      <span class="activity__marker"></span>
      <div class="activity__body">
        <div class="activity__text">${a.text}</div>
        <div class="activity__time">${a.at}</div>
      </div>
    </div>
  `).join('');

  return `
    <section class="card" aria-labelledby="activity-title">
      <div class="card__head">
        <div>
          <div class="card__title" id="activity-title">Aktivitas Terbaru</div>
          <div class="card__sub">Log contoh untuk M0</div>
        </div>
        <span class="badge badge--demo">Demo</span>
      </div>

      <div class="activity">${items}</div>
    </section>
  `;
}
