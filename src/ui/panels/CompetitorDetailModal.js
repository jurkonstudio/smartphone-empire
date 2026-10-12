// FILE: src/ui/panels/CompetitorDetailModal.js
import { Modal } from '../modal.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _personalityLabel(p) {
    const map = {
        aggressive: '⚔️ Agresif Harga',
        premium:    '💎 Premium',
        innovator:  '💡 Inovator',
        follower:   '🔄 Pengikut',
        dominant:   '👑 Dominan',
        declining:  '📉 Menurun'
    };
    return map[p] || p;
}

export function openCompetitorDetailModal({ competitorData }) {
    if (!competitorData) return;
    const c = competitorData;

    const signatureHtml = (c.signatureProducts || []).length
        ? c.signatureProducts.map(sp => `
            <div class="sum-row">
                <span>${escapeHtml(sp.name)}</span>
                <b>${sp.year}</b>
            </div>
        `).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">Belum ada produk ikonik.</div>';

    const strengthsHtml = (c.strengths || []).map(s =>
        `<div style="font-size:12px;color:var(--accent);">+ ${escapeHtml(s)}</div>`
    ).join('');
    const weaknessesHtml = (c.weaknesses || []).map(w =>
        `<div style="font-size:12px;color:var(--warn);">− ${escapeHtml(w)}</div>`
    ).join('');

    const html = `
        <div class="modal-title">${escapeHtml(c.name)}</div>
        <div class="modal-sub">${escapeHtml(c.country || '')} • ${_personalityLabel(c.personality)}</div>

        <div class="sum-row"><span>OS</span><b>${escapeHtml(c.osName || '-')}</b></div>
        <div class="sum-row"><span>Pangsa saat ini</span><b>${((c.currentShare || 0) * 100).toFixed(1)}%</b></div>
        <div class="sum-row"><span>Tier riset</span><b>${(c.currentTier || 1).toFixed(1)}</b></div>
        <div class="sum-row"><span>Aktif sejak</span><b>${c.activeFromYear}${c.activeToYear ? ' - ' + c.activeToYear : ''}</b></div>
        ${c.lastRelease ? `<div class="sum-row"><span>Rilis terbaru</span><b>${escapeHtml(c.lastRelease.name)} (${c.lastRelease.year})</b></div>` : ''}

        ${strengthsHtml || weaknessesHtml ? `
            <div class="card-title" style="margin-top:12px;">Kekuatan & Kelemahan</div>
            ${strengthsHtml}
            ${weaknessesHtml}
        ` : ''}

        <div class="card-title" style="margin-top:12px;">Produk Ikonik</div>
        ${signatureHtml}

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">Tutup</button>
    `;
    Modal.open('competitor-detail', html);
}
