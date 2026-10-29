import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/ProgressPanel.js
// v2027.13a — i18n.
import { t } from '../../core/LanguageService.js';
import { localizeQuest } from '../../systems/QuestSystem.js';


export function renderProgressPanel(state, researchSystem) {
    var activeResearch = [];
    try {
        if (researchSystem && typeof researchSystem.getProgress === 'function') {
            activeResearch = researchSystem.getProgress() || [];
        }
    } catch (e) { activeResearch = []; }

    var activeQuests = (state.quests && Array.isArray(state.quests.active))
        ? state.quests.active : [];

    var hasAny = activeResearch.length > 0 || activeQuests.length > 0;

    if (!hasAny) {
        return '<div class="card">' +
            '<div class="card-title">' + t('dashboard.focus_title') + '</div>' +
            '<div class="focus-empty">' +
                '<div class="focus-empty-title">' + t('dashboard.focus_empty_title') + '</div>' +
                '<div class="focus-empty-desc">' + t('dashboard.focus_empty_desc') + '</div>' +
                '<button class="btn-primary" data-nav="research" style="width:100%;margin-top:10px;">' + t('dashboard.focus_open_research') + '</button>' +
            '</div>' +
            '</div>';
    }

    var body = '';

    if (activeResearch.length) {
        var slots = (state.research && state.research.maxSlots) || 1;
        var activeCount = (state.research && state.research.active)
            ? state.research.active.length : activeResearch.length;

        body += '<div class="focus-section-label">' + t('dashboard.focus_active_research') + '</div>';
        body += '<div class="focus-section-meta">' + t('dashboard.focus_slots', { n: activeCount, max: slots }) + '</div>';
        body += activeResearch.map(function (r) {
            var pct = Math.round(r.percent * 100);
            return '<div class="focus-item">' +
                '<div class="progress-label">' +
                    '<span>' + escapeHtml(r.name) + '</span>' +
                    '<span>' + pct + '% • ' + r.remainingDays + 'h</span>' +
                '</div>' +
                '<div class="progress"><div class="progress-bar" style="width:' + pct + '%;"></div></div>' +
                '</div>';
        }).join('');
    }

    if (activeQuests.length) {
        body += '<div class="focus-section-label">' + t('dashboard.focus_quest') + '</div>';
        body += activeQuests.slice(0, 3).map(function (q0) {
            var q = Object.assign({}, q0, localizeQuest(q0));
            return '<div class="focus-quest">' +
                '<div class="quest-dot"></div>' +
                '<div>' +
                    '<div class="focus-quest-title">' + escapeHtml(q.title) + '</div>' +
                    '<div class="focus-quest-desc">' + escapeHtml(q.description) + '</div>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    return '<div class="card">' +
        '<div class="card-title">' + t('dashboard.focus_title') + '</div>' +
        body +
        '</div>';
}
