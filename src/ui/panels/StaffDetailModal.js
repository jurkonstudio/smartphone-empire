import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/StaffDetailModal.js
// v2027.13c — i18n.
// Modal detail staff: info lengkap + tombol Fire + Training.
import { Modal } from '../modal.js';
import { getRoleById, getSkillTier, getTraitById } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { generateAvatar } from '../avatars/AvatarGenerator.js';
import { t } from '../../core/LanguageService.js';
import { WalletService } from '../../systems/WalletService.js';


function renderSkillTier(skill) {
    const tier = getSkillTier(skill);
    const filled = Math.min(5, skill);
    const bars = [];
    for (let i = 1; i <= 5; i++) {
        bars.push('<span class="skill-pip ' + (i <= filled ? 'active' : '') + '" style="' + (i <= filled ? 'background:' + tier.color : '') + '"></span>');
    }
    return `
        <div class="skill-tier-row">
            <div class="skill-tier-label">${t('staff.detail.tier_label', { n: skill })}</div>
            <div class="skill-tier-name" style="color:${tier.color};">${tier.label}</div>
            <div class="skill-pips">${bars.join('')}</div>
        </div>
    `;
}

export function openStaffDetailModal(params) {
    var staffId = params.staffId;
    const data = window.__game.state.get();
    const s = data.staff.find(function (x) { return x.id === staffId; });
    if (!s) return;

    const role = getRoleById(s.role);
    const tier = getSkillTier(s.skill);
    const skillPct = Math.round(s.skillProgress || 0);
    const monthsWorked = Math.floor((data.time.elapsedGameMinutes - (s.hireGameMinute || 0)) / (30 * 1440));

    const traitsHtml = (s.traits && s.traits.length)
        ? s.traits.map(function (tid) {
            const trait = getTraitById(tid);
            if (!trait) return '';
            return '<div class="trait-chip" style="border-color:' + trait.color + ';">' +
                '<div class="trait-name" style="color:' + trait.color + ';">' + escapeHtml(trait.label) + '</div>' +
                '<div class="trait-desc">' + escapeHtml(trait.description) + '</div>' +
                '</div>';
        }).join('')
        : '<div style="font-size:12px;color:var(--text-mute);">' + t('staff.detail.no_traits') + '</div>';

    const moraleColor = s.morale >= 70 ? 'var(--success)' : s.morale >= 40 ? 'var(--warn)' : 'var(--danger)';
    const severance = s.salary * ((BALANCE.team && BALANCE.team.severanceMonths) || 2);
    const trainingCost = s.salary * 2;
    const canTrain = s.skill < 5 && WalletService.canAfford(trainingCost);

    const joinedDate = s.hireDate.day + '/' + s.hireDate.month + '/' + s.hireDate.year;

    const html = `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            ${generateAvatar(s.name, { size: 58 })}
            <div style="flex:1;min-width:0;">
                <div style="font-size:17px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(s.name)}</div>
                <div style="font-size:12px;color:var(--text-dim);">${t('staff.detail.role_joined', { role: role.label, day: s.hireDate.day, month: s.hireDate.month, year: s.hireDate.year })}</div>
                <div style="font-size:11.5px;color:var(--text-mute);margin-top:2px;">${t('staff.detail.months_worked', { n: monthsWorked })}</div>
            </div>
        </div>

        ${renderSkillTier(s.skill)}
        ${s.skill < 5 ? `
            <div style="margin-top:10px;">
                <div class="progress-label">
                    <span>${t('staff.detail.progress_to', { n: s.skill + 1 })}</span>
                    <span>${skillPct}%</span>
                </div>
                <div class="progress" style="height:6px;">
                    <div class="progress-bar" style="width:${skillPct}%;"></div>
                </div>
            </div>
        ` : '<div class="empty-hint" style="margin-top:10px;">' + t('staff.detail.max_tier') + '</div>'}

        <div class="sum-row" style="margin-top:14px;"><span>${t('staff.detail.salary')}</span><b style="color:var(--accent);">$${s.salary.toLocaleString('en-US')}</b></div>
        <div class="sum-row"><span>${t('staff.detail.morale')}</span><b style="color:${moraleColor};">${s.morale}/100</b></div>

        <div class="card-title" style="margin-top:14px;">${t('staff.detail.traits_title')}</div>
        ${traitsHtml}

        ${s.skill < 5 ? `
            <button class="btn-secondary" data-staff-action="train" data-staff-id="${s.id}"
                    ${canTrain ? '' : 'disabled'}
                    style="width:100%;margin-top:14px;${canTrain ? '' : 'opacity:0.5;'}">
                ${t('staff.detail.train_btn', { cost: trainingCost.toLocaleString('en-US') })}
            </button>
        ` : ''}

        <button class="btn-secondary" data-staff-office="${s.id}" style="width:100%;margin-top:8px;">Lihat di kantor</button>

        <button class="btn-danger" data-staff-action="fire" data-staff-id="${s.id}" style="width:100%;margin-top:8px;">
            ${t('staff.detail.fire_btn', { severance: severance.toLocaleString('en-US') })}
        </button>

        <button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">${t('staff.detail.close')}</button>
    `;
    Modal.open('staff-detail', html);
}
