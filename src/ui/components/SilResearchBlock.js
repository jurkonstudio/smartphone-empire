// FILE: src/ui/components/SilResearchBlock.js
// Blok aksi Silicon untuk modal detail riset (tech & chip).
// Tombol memakai atribut:
//   data-sil-research="unlock|instant|boost|finish"
//   data-kind="tech|chip"  data-node-id="..."  [data-sil-short="1" bila SIL kurang]
import { t } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';

function _esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _btn(action, kind, nodeId, title, sub, cost, balance) {
    var short = balance < cost;
    return '<button type="button" class="sil-btn' + (short ? ' is-short' : '') + '" ' +
        'data-sil-research="' + action + '" data-kind="' + kind + '" data-node-id="' + _esc(nodeId) + '"' +
        (short ? ' data-sil-short="1"' : '') + '>' +
        '<span class="sil-btn-text">' +
            '<span class="sil-btn-title">' + _esc(title) + '</span>' +
            '<span class="sil-btn-sub">' + _esc(sub) + '</span>' +
        '</span>' +
        '<span class="sil-cost">💎 ' + cost + '</span>' +
    '</button>';
}

export function renderSilResearchBlock(kind, nodeId) {
    var opt = SiliconService.getResearchOptions(kind, nodeId);
    if (opt.state === 'done') return '';
    var bal = SiliconService.getBalance();

    var body = '';
    if (opt.state === 'startable') {
        body += _btn('unlock', kind, nodeId, t('sil.research.unlock'), t('sil.research.unlock_sub'), opt.unlockCost, bal);
        body += _btn('instant', kind, nodeId, t('sil.research.instant'), t('sil.research.instant_sub'), opt.instantCost, bal);
    } else if (opt.state === 'running') {
        if (opt.canBoost) {
            body += _btn('boost', kind, nodeId, t('sil.research.boost', { n: opt.boostDays }), t('sil.research.boost_sub'), opt.boostCost, bal);
        }
        body += _btn('finish', kind, nodeId, t('sil.research.finish'), t('sil.research.finish_sub'), opt.finishCost, bal);
    } else {
        body = '<div class="sil-hint">' + _esc(t('sil.research.blocked', { reason: opt.reason || '—' })) + '</div>';
    }

    return '<div class="sil-block">' +
        '<div class="sil-block-head">' +
            '<span class="sil-block-title">💎 ' + t('sil.title') + '</span>' +
            '<span class="sil-block-bal">' + t('sil.research.balance', { n: bal }) + '</span>' +
        '</div>' + body +
    '</div>';
}

// Tombol kecil "Selesaikan" di slot-strip (riset berjalan).
export function renderSilSlotBoost(kind, nodeId, finishCost) {
    return '<button type="button" class="slot-boost" data-sil-research="finish" data-kind="' + kind +
        '" data-node-id="' + _esc(nodeId) + '" data-sil-finish-cost="' + _esc(nodeId) + '"' +
        (SiliconService.canAfford(finishCost) ? '' : ' data-sil-short="1"') + '>' +
        '⚡ ' + t('sil.research.finish_short') + ' · 💎 <b>' + finishCost + '</b></button>';
}
