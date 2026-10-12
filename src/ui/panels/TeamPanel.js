// FILE: src/ui/panels/TeamPanel.js
// Tab Tim: sub-tab Tim Aktif | Rekrut | Info.
// Versi DEFENSIVE — setiap section dibungkus try/catch agar tidak crash total.
import { ROLES, getRoleById, getSkillTier, getTraitById } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { generateAvatar } from '../avatars/AvatarGenerator.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safe(fn, fallback) {
    try { return fn(); }
    catch (err) {
        console.error('[TeamPanel] Section error:', err);
        return fallback || `<div class="card" style="border-color:var(--danger);">
            <div class="card-title" style="color:var(--danger);">⚠ Error</div>
            <div style="font-size:12px;color:var(--text-dim);">${escapeHtml(err.message || 'Unknown error')}</div>
        </div>`;
    }
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
    if (subtab === 'recruit') {
        body = safe(() => _renderRecruit(data, teamSystem), '<div class="empty"><div class="empty-title">Gagal render Rekrut</div></div>');
    } else if (subtab === 'info') {
        body = safe(() => _renderInfo(data, teamSystem), '<div class="empty"><div class="empty-title">Gagal render Info</div></div>');
    } else {
        body = safe(() => _renderActive(data, teamSystem), '<div class="empty"><div class="empty-title">Gagal render Tim Aktif</div></div>');
    }
    return subtabBar + body;
}

// ============================================================
// TIM AKTIF
// ============================================================
function _renderActive(data, teamSystem) {
    const staff = Array.isArray(data.staff) ? data.staff : [];
    const counts = teamSystem && teamSystem.getTeamCounts ? teamSystem.getTeamCounts() : { engineers: 0, designers: 0, marketers: 0 };
    const totalSalary = teamSystem && teamSystem.getTotalSalary ? teamSystem.getTotalSalary() : 0;

    const summary = `
        <div class="kpi-grid">
            <div class="kpi">
                <div class="kpi-label">Engineer</div>
                <div class="kpi-value" style="color:#60a5fa;">${counts.engineers || 0}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">Designer</div>
                <div class="kpi-value" style="color:#a78bfa;">${counts.designers || 0}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">Marketer</div>
                <div class="kpi-value" style="color:#34d399;">${counts.marketers || 0}</div>
            </div>
            <div class="kpi">
                <div class="kpi-label">Total Gaji/Bln</div>
                <div class="kpi-value" style="font-size:15px;">$${(totalSalary || 0).toLocaleString('en-US')}</div>
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
    staff.forEach(s => {
        if (s && s.role && byRole[s.role]) byRole[s.role].push(s);
    });

    const roleSections = ROLES.map(role => {
        const list = byRole[role.id] || [];
        if (!list.length) return '';
        const rows = list.map(s => {
            try { return _renderStaffRow(s); }
            catch (err) {
                console.error('[TeamPanel] Staff row error:', err, s);
                return `<div class="staff-row" style="opacity:0.5;"><div style="flex:1;">Data staff korup</div></div>`;
            }
        }).join('');
        return `
            <div class="card">
                <div class="card-title" style="color:${role.color};">
                    ${role.icon} ${role.label.toUpperCase()} (${list.length})
                </div>
                <div class="staff-list">${rows}</div>
            </div>
        `;
    }).join('');

    return summary + roleSections;
}

function _renderStaffRow(s) {
    const role = getRoleById(s.role) || { color: '#666', icon: '?' };
    const tier = getSkillTier(s.skill || 1) || { color: '#999' };
    const morale = (typeof s.morale === 'number') ? s.morale : 75;
    const salary = (typeof s.salary === 'number') ? s.salary : 0;
    const moraleColor = morale >= 70 ? 'var(--success)' : morale >= 40 ? 'var(--warn)' : 'var(--danger)';

    const traitIcons = (Array.isArray(s.traits) ? s.traits : []).map(tid => {
        const t = getTraitById(tid);
        return t ? `<span title="${escapeHtml(t.label)}" style="color:${t.color};">●</span>` : '';
    }).join('');

    let avatar = '';
    try { avatar = generateAvatar(s.name || 'Unknown', { size: 38 }); }
    catch (e) { avatar = `<div class="staff-avatar" style="background:${role.color};">${role.icon}</div>`; }

    return `
        <div class="staff-row" data-staff-detail="${s.id || ''}">
            ${avatar}
            <div class="staff-info">
                <div class="staff-name-row">
                    <span class="staff-name">${escapeHtml(s.name || 'Tanpa Nama')}</span>
                    <span class="staff-tier" style="color:${tier.color};">T${s.skill || 1}</span>
                    <span class="staff-traits">${traitIcons}</span>
                </div>
                <div class="staff-meta-row">
                    <span>$${salary.toLocaleString('en-US')}/bln</span>
                    <span>•</span>
                    <span style="color:${moraleColor};">Moral ${morale}</span>
                </div>
            </div>
            <div class="staff-arrow">›</div>
        </div>
    `;
}

// ============================================================
// REKRUT
// ============================================================
function _renderRecruit(data, teamSystem) {
    const candidates = Array.isArray(data.candidates) ? data.candidates : [];
    const poolInfo = data.candidatePool || {};
    const lastRefreshMinute = poolInfo.lastRefreshMinute || 0;
    const nowMinute = (data.time && data.time.elapsedGameMinutes) || 0;
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
        if (!c || !c.id) return '';
        const role = getRoleById(c.role) || { label: c.role || '?', icon: '?' };
        const tier = getSkillTier(c.skill || 1) || { label: 'Pemula' };
        const traitChips = (Array.isArray(c.traits) ? c.traits : []).map(tid => {
            const t = getTraitById(tid);
            return t ? `<span class="cand-trait" style="color:${t.color};border-color:${t.color};">${escapeHtml(t.label)}</span>` : '';
        }).join('');

        let avatar = '';
        try { avatar = generateAvatar(c.name || 'Unknown', { size: 38 }); }
        catch (e) { avatar = `<div class="staff-avatar" style="background:#666;">?</div>`; }

        const salary = (typeof c.salary === 'number') ? c.salary : 0;

        return `
            <div class="cand-card">
                <div class="cand-head">
                    ${avatar}
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13.5px;font-weight:700;">${escapeHtml(c.name || 'Tanpa Nama')}</div>
                        <div style="font-size:11px;color:var(--text-mute);margin-top:2px;">${role.label} • Tier ${c.skill || 1} (${tier.label})</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:14px;font-weight:700;color:var(--accent);">$${salary.toLocaleString('en-US')}</div>
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
// INFO BONUS
// ============================================================
function _renderInfo(data, teamSystem) {
    const staff = Array.isArray(data.staff) ? data.staff : [];
    const TeamSystem = (window.__game && window.__game.teamSystem)
        ? window.__game.teamSystem.constructor
        : null;

    if (!TeamSystem) {
        return '<div class="empty"><div class="empty-title">TeamSystem belum siap</div></div>';
    }

    const engineerBonus = TeamSystem.getResearchBonusFromStaff ? TeamSystem.getResearchBonusFromStaff(staff) : { speedMult: 1, extraSlots: 0 };
    const osBonus = TeamSystem.getOsDevBonusFromStaff ? TeamSystem.getOsDevBonusFromStaff(staff) : 1;
    const osSlots = TeamSystem.getOsFeatureSlotsFromStaff ? TeamSystem.getOsFeatureSlotsFromStaff(staff) : 0;
    const designerBonus = TeamSystem.getProductDevBonusFromStaff ? TeamSystem.getProductDevBonusFromStaff(staff) : { speedMult: 1, qualityBonus: 0 };
    const marketerBonus = TeamSystem.getMarketingBonusFromStaff ? TeamSystem.getMarketingBonusFromStaff(staff) : 1;

    const counts = teamSystem && teamSystem.getTeamCounts ? teamSystem.getTeamCounts() : { engineers: 0, designers: 0, marketers: 0 };

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
        { label: 'Jumlah Engineer', value: counts.engineers || 0 },
        { label: 'Kecepatan Riset', value: '× ' + (engineerBonus.speedMult || 1).toFixed(2), valueColor: engineerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Riset Ekstra', value: '+' + (engineerBonus.extraSlots || 0), valueColor: engineerBonus.extraSlots > 0 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Kecepatan Dev OS', value: '× ' + (osBonus || 1).toFixed(2), valueColor: osBonus > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Fitur OS Ekstra', value: '+' + (osSlots || 0), valueColor: osSlots > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const desSec = section('Designer Bonus', '🎨', '#a78bfa', [
        { label: 'Jumlah Designer', value: counts.designers || 0 },
        { label: 'Kecepatan Desain Produk', value: '× ' + (designerBonus.speedMult || 1).toFixed(2), valueColor: designerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Bonus Kualitas Produk', value: '+' + (designerBonus.qualityBonus || 0).toFixed(1) + ' poin', valueColor: designerBonus.qualityBonus > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const mktSec = section('Marketer Bonus', '📣', '#34d399', [
        { label: 'Jumlah Marketer', value: counts.marketers || 0 },
        { label: 'Efektivitas Kampanye', value: '× ' + (marketerBonus || 1).toFixed(2), valueColor: marketerBonus > 1 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const moraleAvg = (teamSystem && teamSystem.getAverageMorale) ? teamSystem.getAverageMorale() : 0;
    const totalSalary = (teamSystem && teamSystem.getTotalSalary) ? teamSystem.getTotalSalary() : 0;
    const moraleColor = moraleAvg >= 70 ? 'var(--success)' : moraleAvg >= 40 ? 'var(--warn)' : 'var(--danger)';

    const extraSec = section('Ringkasan Tim', '📊', 'var(--accent)', [
        { label: 'Total Staff', value: staff.length },
        { label: 'Total Gaji / Bulan', value: '$' + (totalSalary || 0).toLocaleString('en-US') },
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
