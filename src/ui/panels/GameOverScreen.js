// FILE: src/ui/panels/GameOverScreen.js
import { bus } from '../../core/EventBus.js';
import { state } from '../../core/GameState.js';
import { SaveService } from '../../core/SaveService.js';

export function initGameOverScreen() {
    bus.on('economy:game-over', ({ reason, negativeMonths }) => _show(reason, negativeMonths));
}

function _show(reason, negativeMonths) {
    const d = state.get();
    const html = `
        <div class="gameover-root">
            <div class="gameover-title">Perusahaan Bangkrut</div>
            <div class="gameover-sub">${d.companyName} tidak bisa bertahan.</div>
            <div class="gameover-fact">
                <div>Uang negatif selama ${negativeMonths} bulan berturut-turut.</div>
                <div>Tahun berakhir: ${d.time.currentYear} Bulan ${d.time.currentMonth}</div>
                <div>Ponsel dirilis: ${d.products.catalog.length}</div>
                <div>Milestone tercapai: ${d.milestones.length}</div>
            </div>
            <button class="btn-primary" data-gameover-reset>Mulai Ulang</button>
        </div>
    `;

    const node = document.createElement('div');
    node.className = 'gameover-backdrop';
    node.innerHTML = `<div class="modal-card">${html}</div>`;
    document.body.appendChild(node);
    requestAnimationFrame(() => node.classList.add('visible'));

    node.querySelector('[data-gameover-reset]').addEventListener('click', () => {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
