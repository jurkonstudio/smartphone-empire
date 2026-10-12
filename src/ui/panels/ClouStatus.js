import { icon } from '../icons.js';
import { APP_CONFIG } from '../../config/app.config.js';

export function renderCloudStatus() {
  const c = APP_CONFIG.cloud;
  return `
    <section class="card" aria-labelledby="cloud-title">
      <div class="cloud">
        <div class="cloud__icon">${icon('cloudOff', 20)}</div>
        <div class="cloud__body">
          <div class="cloud__title" id="cloud-title">
            Status Cloud
            <span class="badge badge--danger">Belum terhubung</span>
          </div>
          <div class="cloud__desc">${c.message}</div>
        </div>
      </div>
    </section>
  `;
}
