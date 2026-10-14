// FILE: src/ui/panels/GameOverScreen.js
// v2027.13c — i18n.
import { bus } from '../../core/EventBus.js';
import { state } from '../../core/GameState.js';
import { SaveService } from '../../core/SaveService.js';
import { t } from '../../core/LanguageService.js';

export function initGameOverScreen() {
    bus.on('economy:game-over', function (data) { _show(data.reason, data.negativeMonths); });
}

function _show(reason, negativeMonths) {
    const d = state.get();
    const html = `
        <div class="gameover-root">
            <div class="gameover-title">${t('gameover.title')}</div>
            <div class="gameover-sub">${t('gameover.sub', { company: d.companyName })}</div>
            <div class="gameover-fact">
                <div>${t('gameover.reason', { n: negativeMonths })}</div>
                <div>${t('gameover.end_year', { year: d.time.currentYear, month: d.time.currentMonth })}</div>
                <div>${t('gameover.phones', { n: d.products.catalog.length })}</div>
                <div>${t('gameover.milestones', { n: d.milestones.length })}</div>
            </div>
            <button class="btn-primary" data-gameover-reset>${t('gameover.restart')}</button>
        </div>
    `;

    const node = document.createElement('div');
    node.className = 'gameover-backdrop';
    node.innerHTML = '<div class="modal-card">' + html + '</div>';
    document.body.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('visible'); });

    node.querySelector('[data-gameover-reset]').addEventListener('click', function () {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
