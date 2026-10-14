// FILE: src/ui/panels/CompetitorDetailModal.js
// v2027.13c — i18n.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _personalityLabel(p) {
    var map = {
        aggressive: 'market.personality.aggressive',
        premium:    'market.personality.premium',
        innovator:  'market.personality.innovator',
        follower:   'market.personality.follower',
        dominant:   'market.personality.dominant',
        declining:  'market.personality.declining'
    };
    var key = map[p];
    return key ? t(key) : p;
}

export function openCompetitorDetailModal(params) {
    var competitorData = params.competitorData;
    if (!competitorData) return;
    const c = competitorData;

    const signatureHtml = (c.signatureProducts || []).length
        ? c.signatureProducts.map(function (sp) {
            return '<div class="sum-row">' +
                '<span>' + escapeHtml(sp.name) + '</span>' +
                '<b>' + sp.year + '</b>' +
                '</div>';
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">' + t('market.comp_detail.no_sig') + '</div>';

    const strengthsHtml = (c.strengths || []).map(function (s) {
        return '<div style="font-size:12px;color:var(--accent);">+ ' + escapeHtml(s) + '</div>';
    }).join('');
    const weaknessesHtml = (c.weaknesses || []).map(function (w) {
        return '<div style="font-size:12px;color:var(--warn);">− ' + escapeHtml(w) + '</div>';
    }).join('');

    const activeLabel = c.activeFromYear + (c.activeToYear ? ' - ' + c.activeToYear : '');

    const html = `
        <div class="modal-title">${escapeHtml(c.name)}</div>
        <div class="modal-sub">${escapeHtml(c.country || '')} • ${_personalityLabel(c.personality)}</div>

        <div class="sum-row"><span>${t('market.comp_detail.os')}</span><b>${escapeHtml(c.osName || '-')}</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.share')}</span><b>${((c.currentShare || 0) * 100).toFixed(1)}%</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.tier')}</span><b>${(c.currentTier || 1).toFixed(1)}</b></div>
        <div class="sum-row"><span>${t('market.comp_detail.active')}</span><b>${activeLabel}</b></div>
        ${c.lastRelease ? '<div class="sum-row"><span>' + t('market.comp_detail.latest') + '</span><b>' + escapeHtml(c.lastRelease.name) + ' (' + c.lastRelease.year + ')</b></div>' : ''}

        ${strengthsHtml || weaknessesHtml ? `
            <div class="card-title" style="margin-top:12px;">${t('market.comp_detail.str_weak')}</div>
            ${strengthsHtml}
            ${weaknessesHtml}
        ` : ''}

        <div class="card-title" style="margin-top:12px;">${t('market.comp_detail.signature')}</div>
        ${signatureHtml}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">${t('market.comp_detail.close')}</button>
    `;
    Modal.open('competitor-detail', html);
}
