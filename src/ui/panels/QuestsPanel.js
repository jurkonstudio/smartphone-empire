// FILE: src/ui/panels/QuestsPanel.js
// v2027.13c — i18n.
import { t } from '../../core/LanguageService.js';

export function renderQuestsPanel(state) {
    const active = (state.quests && state.quests.active) ? state.quests.active : [];
    const completed = (state.quests && state.quests.completed) ? state.quests.completed : [];

    const list = active.length
        ? active.map(function (q) {
            return `
                <div class="quest-item">
                    <div class="quest-dot"></div>
                    <div>
                        <div class="quest-title">${q.title}</div>
                        <div class="quest-desc">${q.description}</div>
                    </div>
                </div>`;
        }).join('')
        : '<div class="log-empty">' + t('quests.empty') + '</div>';

    return `
        <div class="card">
            <div class="card-title">${t('quests.title', { n: completed.length })}</div>
            ${list}
        </div>
    `;
}
