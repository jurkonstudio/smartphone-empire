// FILE: src/ui/panels/TeamPanel.js
// Tab Tim: sub-tab Tim Aktif | Rekrut | Info Bonus.
import { ROLES, getRoleById, getSkillTier, getTraitById } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { generateAvatar } from '../avatars/AvatarGenerator.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderTeamPanel({ subtab, teamSystem }) {
    const data = window.__game.state.get();
    const subtabBar = `
        <div class="subtab-bar">
            <button class="subtab-btn ${subtab === 'active'   ? 'active' : ''}" data-team-subtab="active">Tim Aktif</button>
            <button class="subtab-btn ${subtab === 'recruit'  ? 'active' : ''}" data-team-subtab="recruit">Rekrut</button>
            <button class="subtab-btn ${subtab === 'info'     ? 'active' : ''}" data-team-subtab="info">Info</button>
        </div>
    `;
    let body = '';
    if (subtab === 'recruit') body = _renderRecruit(data, teamSystem);
    else if (subtab === 'info') body = _renderInfo(data, teamSystem);
    else body = _renderActive(data, teamSystem);
    return subtabBar + body;
}

// ============================================================
// SUB-TAB TIM AKTIF
// ============================================================
function _renderActive(data, teamSystem) {
    const staff = data.staff || [];
    const counts = teamSystem.getTeamCounts();

    const summary = `
        <div class="kpi-grid">
            <div class="kpi">
                <div class="kpi-label">Engineer</div>
                <div class="kpi-value" style="color:#60a5fa;">${counts.engineers}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">Designer</div>
                <div class="kpi-value" style="color:#a78bfa;">${counts.designers}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">Marketer</div>
                <div class="kpi-value" style="color:#34d399;">${counts.marketers}</div>
            </div>
            <div class="kpi">
                <div class="kpi-label">Total Gaji/Bln</div>
                <div class="kpi-value" style="font-size:15px;">$${teamSystem.getTotalSalary().toLocaleString('en-US')}</div>
            </div>
        </div>
    `;

    if (!staff.length) {
        return summary + `
            <div class="empty">
                <div class="empty-ico">👥</div>
                <div class="empty-title">Belum ada tim</div>
                <div class="empty-desc">Rekrut engineer, designer, dan marketer untuk mempercepat perusahaan.</div>
                <button class="btn-primary" data-team-action="goto-recruit" style="max-width:200px;margin:0 auto;">Rekrut Sekarang</button>
            </div>
        `;
    }

    const byRole = { engineer: [], designer: [], marketer: [] };
    staff.forEach(s => { if (byRole[s.role]) byRole[s.role].push(s); });

    const roleSections = ROLES.map(role => {
        const list = byRole[role.id] || [];
        if (!list.length) return '';
        return `
            <div class="card">
                <div class="card-title" style="color:${role.color};">
                    ${role.icon} ${role.label.toUpperCase()} (${list.length})
                </div>
                <div class="staff-list">
                    ${list.map(s => _renderStaffRow(s)).join('')}
                </div>
            </div>
        `;
    }).join('');

    return summary + roleSections;
}

function _renderStaffRow(s) {
    const role = getRoleById(s.role);
    const tier = getSkillTier(s.skill);
    const moraleColor = s.morale >= 70 ? 'var(--success)' : s.morale >= 40 ? 'var(--warn)' : 'var(--danger)';
    const traitIcons = (s.traits || []).map(tid => {
        const t = getTraitById(tid);
        return t ? `<span title="${escapeHtml(t.label)}" style="color:${t.color};">●</span>` : '';
    }).join('');

    return `
        <div class="staff-row" data-staff-detail="${s.id}">
            ${generateAvatar(s.name, { size: 38 })}
            <div class="staff-info">
                <div class="staff-name-row">
                    <span class="staff-name">${escapeHtml(s.name)}</span>
                    <span class="staff-tier" style="color:${tier.color};">T${s.skill}</span>
                    <span class="staff-traits">${traitIcons}</span>
                </div>
                <div class="staff-meta-row">
                    <span>$${s.salary.toLocaleString('en-US')}/bln</span>
                    <span>•</span>
                    <span style="color:${moraleColor};">Moral ${s.morale}</span>
                </div>
            </div>
            <div class="staff-arrow">›</div>
        </div>
    `;
}

// ============================================================
// SUB-TAB REKRUT
// ============================================================
function _renderRecruit(data, teamSystem) {
    const candidates = data.candidates || [];
    const poolInfo = data.candidatePool || {};
    const lastRefreshMinute = poolInfo.lastRefreshMinute || 0;
    const nowMinute = data.time.elapsedGameMinutes;
    const daysSinceRefresh = Math.floor((nowMinute - lastRefreshMinute) / 1440);
    const cfg = BALANCE.team || {};
    const refreshIn = Math.max(0, (cfg.poolRefreshDays || 30) - daysSinceRefresh);

    const header = `
        <div class="card" style="padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:13px;color:var(--text-dim);">Kandidat Tersedia</div>
                    <div style="font-size:18px;font-weight:700;">${candidates.length}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:11px;color:var(--text-dim);">Pool refresh</div>
                    <div style="font-size:13px;font-weight:700;">${refreshIn} hari</div>
                </div>
            </div>
        </div>
    `;

    if (!candidates.length) {
        return header + `
            <div class="empty">
                <div class="empty-ico">📋</div>
                <div class="empty-title">Kandidat habis</div>
                <div class="empty-desc">Tunggu beberapa hari atau refresh pool secara manual.</div>
                <button class="btn-secondary" data-team-action="refresh-pool" style="max-width:240px;margin:0 auto;">Refresh Pool Sekarang</button>
            </div>
        `;
    }

    const cards = candidates.map(c => {
        const role = getRoleById(c.role);
        const tier = getSkillTier(c.skill);
        const traitChips = (c.traits || []).map(tid => {
            const t = getTraitById(tid);
            return t ? `<span class="cand-trait" style="color:${t.color};border-color:${t.color};">${escapeHtml(t.label)}</span>` : '';
        }).join('');

        return `
            <div class="cand-card">
                <div class="cand-head">
                    ${generateAvatar(c.name, { size: 38 })}
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13.5px;font-weight:700;">${escapeHtml(c.name)}</div>
                        <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${role.label} • Tier ${c.skill} (${tier.label})</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:14px;font-weight:700;color:var(--accent);">$${c.salary.toLocaleString('en-US')}</div>
                        <div style="font-size:10px;color:var(--text-mute);">/bulan</div>
                    </div>
                </div>
                ${traitChips ? `<div class="cand-traits">${traitChips}</div>` : ''}
                <button class="btn-primary" data-team-action="hire" data-candidate-id="${c.id}" style="width:100%;margin-top:10px;font-size:13px;">
                    Rekrut
                </button>
            </div>
        `;
    }).join('');

    return header + `<div class="cand-list">${cards}</div>`;
}

// ============================================================
// SUB-TAB INFO BONUS
// ============================================================
function _renderInfo(data, teamSystem) {
    const staff = data.staff || [];
    const TeamSystem = window.__game.teamSystem.constructor;

    const engineerBonus = TeamSystem.getResearchBonusFromStaff(staff);
    const osBonus = TeamSystem.getOsDevBonusFromStaff(staff);
    const osSlots = TeamSystem.getOsFeatureSlotsFromStaff(staff);
    const designerBonus = TeamSystem.getProductDevBonusFromStaff(staff);
    const marketerBonus = TeamSystem.getMarketingBonusFromStaff(staff);

    const counts = teamSystem.getTeamCounts();

    const section = (title, icon, color, rows) => `
        <div class="card">
            <div class="card-title" style="color:${color};">${icon} ${title.toUpperCase()}</div>
            ${rows.map(r => `
                <div class="sum-row">
                    <span>${r.label}</span>
                    <b style="color:${r.valueColor || 'var(--text)'};">${r.value}</b>
                </div>
            `).join('')}
        </div>
    `;

    const engSec = section('Engineer Bonus', '🔧', '#60a5fa', [
        { label: 'Jumlah Engineer', value: counts.engineers },
        { label: 'Kecepatan Riset', value: '× ' + engineerBonus.speedMult.toFixed(2), valueColor: engineerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Riset Ekstra', value: '+' + engineerBonus.extraSlots, valueColor: engineerBonus.extraSlots > 0 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Kecepatan Dev OS', value: '× ' + osBonus.toFixed(2), valueColor: osBonus > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Fitur OS Ekstra', value: '+' + osSlots, valueColor: osSlots > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const desSec = section('Designer Bonus', '🎨', '#a78bfa', [
        { label: 'Jumlah Designer', value: counts.designers },
        { label: 'Kecepatan Desain Produk', value: '× ' + designerBonus.speedMult.toFixed(2), valueColor: designerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Bonus Kualitas Produk', value: '+' + designerBonus.qualityBonus.toFixed(1) + ' poin', valueColor: designerBonus.qualityBonus > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const mktSec = section('Marketer Bonus', '📣', '#34d399', [
        { label: 'Jumlah Marketer', value: counts.marketers },
        { label: 'Efektivitas Kampanye', value: '× ' + marketerBonus.toFixed(2), valueColor: marketerBonus > 1 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const moraleAvg = teamSystem.getAverageMorale();
    const moraleColor = moraleAvg >= 70 ? 'var(--success)' : moraleAvg >= 40 ? 'var(--warn)' : 'var(--danger)';

    const extraSec = section('Ringkasan Tim', '📊', 'var(--accent)', [
        { label: 'Total Staff', value: staff.length },
        { label: 'Total Gaji / Bulan', value: '$' + teamSystem.getTotalSalary().toLocaleString('en-US') },
        { label: 'Rata-rata Moral', value: moraleAvg + '/100', valueColor: moraleColor }
    ]);

    const tips = `
        <div class="card">
            <div class="card-title">💡 Tips</div>
            <div style="font-size:12px;color:var(--text-dim);line-height:1.6;">
                • Staff <b>Tier tinggi</b> memberi bonus lebih besar tapi gaji lebih mahal.<br>
                • Trait <b>Cepat Belajar</b> mempercepat naik tier.<br>
                • Trait <b>Spesialis</b> memberi bonus +25% di bidangnya.<br>
                • <b>Moral rendah</b> menurunkan produktivitas.
            </div>
        </div>
    `;

    return engSec + desSec + mktSec + extraSec + tips;
}
