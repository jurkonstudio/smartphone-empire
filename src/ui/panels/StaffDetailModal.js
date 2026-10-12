// FILE: src/ui/panels/StaffDetailModal.js
// Modal detail staff: info lengkap + tombol Fire + Training.
import { Modal } from '../modal.js';
import { getRoleById, getSkillTier, getTraitById, TRAITS } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function renderSkillTier(skill) {
    const t = getSkillTier(skill);
    const filled = Math.min(5, skill);
    const bars = [];
    for (let i = 1; i <= 5; i++) {
        bars.push(`<span class="skill-pip ${i <= filled ? 'active' : ''}" style="${i <= filled ? 'background:' + t.color : ''}"></span>`);
    }
    return `
        <div class="skill-tier-row">
            <div class="skill-tier-label">Tier ${skill}</div>
            <div class="skill-tier-name" style="color:${t.color};">${t.label}</div>
            <div class="skill-pips">${bars.join('')}</div>
        </div>
    `;
}

export function openStaffDetailModal({ staffId }) {
    const data = window.__game.state.get();
    const s = data.staff.find(x => x.id === staffId);
    if (!s) return;

    const role = getRoleById(s.role);
    const tier = getSkillTier(s.skill);
    const skillPct = Math.round(s.skillProgress || 0);
    const monthsWorked = Math.floor((data.time.elapsedGameMinutes - (s.hireGameMinute || 0)) / (30 * 1440));

    const traitsHtml = (s.traits && s.traits.length)
        ? s.traits.map(tid => {
            const t = getTraitById(tid);
            if (!t) return '';
            return `
                <div class="trait-chip" style="border-color:${t.color};">
                    <div class="trait-name" style="color:${t.color};">${escapeHtml(t.label)}</div>
                    <div class="trait-desc">${escapeHtml(t.description)}</div>
                </div>
            `;
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">Tanpa trait khusus.</div>';

    const moraleColor = s.morale >= 70 ? 'var(--success)' : s.morale >= 40 ? 'var(--warn)' : 'var(--danger)';
    const severance = s.salary * ((BALANCE.team && BALANCE.team.severanceMonths) || 2);
    const trainingCost = s.salary * 2;
    const canTrain = s.skill < 5 && data.cash >= trainingCost;

    const html = `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            <div class="staff-avatar-lg" style="background:${role.color};">${role.icon}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:17px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(s.name)}</div>
                <div style="font-size:12px;color:var(--text-dim);">${role.label} • Bergabung ${s.hireDate.day}/${s.hireDate.month}/${s.hireDate.year}</div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:2px;">${monthsWorked} bulan bekerja</div>
            </div>
        </div>

        ${renderSkillTier(s.skill)}
        ${s.skill < 5 ? `
            <div style="margin-top:10px;">
                <div class="progress-label">
                    <span>Progres ke Tier ${s.skill + 1}</span>
                    <span>${skillPct}%</span>
                </div>
                <div class="progress" style="height:6px;">
                    <div class="progress-bar" style="width:${skillPct}%;"></div>
                </div>
            </div>
        ` : '<div class="empty-hint" style="margin-top:10px;">Sudah di tier tertinggi</div>'}

        <div class="sum-row" style="margin-top:14px;"><span>Gaji per bulan</span><b style="color:var(--accent);">$${s.salary.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>Moral</span><b style="color:${moraleColor};">${s.morale}/100</b></div>

        <div class="card-title" style="margin-top:14px;">Trait</div>
        ${traitsHtml}

        ${s.skill < 5 ? `
            <button class="btn-secondary" data-staff-action="train" data-staff-id="${s.id}"
                    ${canTrain ? '' : 'disabled'}
                    style="width:100%;margin-top:14px;${canTrain ? '' : 'opacity:0.5;'}">
                📚 Training Intensif (+30
