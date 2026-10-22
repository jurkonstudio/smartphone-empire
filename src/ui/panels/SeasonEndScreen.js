// FILE: src/ui/panels/SeasonEndScreen.js
// Layar hasil akhir musim. Memakai kelas CSS yang sama dengan layar bangkrut.
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { LanguageService } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { ENDGAME } from '../../config/endgame.config.js';

function L(id, en, idText) {
    try { return LanguageService.getLang() === 'en' ? en : idText; } catch (e) { return idText; }
}

export function initSeasonEndScreen() {
    bus.on('endgame:finished', function (info) { _show(info); });
}

function _show(info) {
    const b = info.breakdown || {};
    const fmt = (n) => Math.round(n || 0).toLocaleString('en-US');
    const rows = [
        [L('n', 'Net worth', 'Kekayaan bersih'), b.netWorth],
        [L('m', 'Milestones', 'Milestone'), b.milestones],
        [L('p', 'Phone models', 'Model ponsel'), b.products],
        [L('r', 'Research', 'Riset selesai'), b.research],
        [L('s', 'Staff', 'Staf tim'), b.staff]
    ].map(function (r) {
        return '<div style="display:flex;justify-content:space-between;"><span>' + r[0] + '</span><b>' + fmt(r[1]) + '</b></div>';
    }).join('');

    const node = document.createElement('div');
    node.className = 'gameover-backdrop';
    node.innerHTML = '<div class="modal-card"><div class="gameover-root">' +
        '<div class="gameover-title">' + L('t', 'Season ' + ENDGAME.endYear + ' Complete', 'Musim ' + ENDGAME.endYear + ' Selesai') + '</div>' +
        '<div class="gameover-sub">' + escapeHtml(info.companyName || '') + '</div>' +
        '<div class="gameover-fact">' + rows +
            '<div style="margin-top:10px;font-size:18px;"><b>' + L('tot', 'Final score', 'Skor akhir') + ': ' + fmt(info.score) + '</b></div>' +
        '</div>' +
        '<button class="btn-primary" data-season-reset>' + L('btn', 'Start a new season', 'Mulai musim baru') + '</button>' +
        '</div></div>';
    document.body.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('visible'); });

    node.querySelector('[data-season-reset]').addEventListener('click', function () {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
