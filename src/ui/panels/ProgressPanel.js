// FILE: src/ui/panels/ProgressPanel.js
// Rework: merge riset aktif + quest aktif menjadi satu kartu "Fokus Hari Ini".

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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
            '<div class="card-title">Fokus Hari Ini</div>' +
            '<div class="focus-empty">' +
                '<div class="focus-empty-title">Semua berjalan lancar</div>' +
                '<div class="focus-empty-desc">Riset teknologi baru, rekrut tim, atau rilis produk untuk mempercepat pertumbuhan.</div>' +
                '<button class="btn-primary" data-nav="research" style="width:100%;margin-top:10px;">Buka Tab Riset</button>' +
            '</div>' +
            '</div>';
    }

    var body = '';

    if (activeResearch.length) {
        var slots = (state.research && state.research.maxSlots) || 1;
        var activeCount = (state.research && state.research.active)
            ? state.research.active.length : activeResearch.length;

        body += '<div class="focus-section-label">Riset Aktif</div>';
        body += '<div class="focus-section-meta">' + activeCount + '/' + slots + ' slot terpakai</div>';
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
        body += '<div class="focus-section-label">Quest</div>';
        body += activeQuests.slice(0, 3).map(function (q) {
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
        '<div class="card-title">Fokus Hari Ini</div>' +
        body +
        '</div>';
}
