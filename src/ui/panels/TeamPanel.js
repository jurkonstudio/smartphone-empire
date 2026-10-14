// FILE: src/ui/panels/TeamPanel.js
// v2027.9 — Dropdown selector Tim Aktif / Rekrut / Info.
import { ROLES, getRoleById, getSkillTier, getTraitById } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { generateAvatar } from '../avatars/AvatarGenerator.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { Modal } from '../modal.js';

let _recruitFilter = 'all';
let _teamMode = 'roster'; // 'roster' | 'recruit' | 'info'

const TEAM_MODES = [
    { id: 'roster',  label: 'Tim Aktif', icon: 'users' },
    { id: 'recruit', label: 'Rekrut',    icon: 'plus' },
    { id: 'info',    label: 'Info',      icon: 'settings' }
];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safe(fn, fallback) {
    try { return fn(); }
    catch (err) {
        console.error('[TeamPanel] section error:', err);
        return fallback || '<div class="card" style="border-color:var(--danger);"><div class="card-title" style="color:var(--danger);">⚠ Error</div><div style="font-size:12px;color:var(--text-dim);">' + escapeHtml(err.message || 'unknown') + '</div></div>';
    }
}

// ============================================================
// MAIN RENDER — dropdown + konten sesuai mode
// ============================================================
export function renderTeamPanel({ teamSystem }) {
    const data = window.__game.state.get();

    const dropdownHtml = _renderDropdown();

    let body = '';
    if (_teamMode === 'recruit') {
        body = safe(function () { return _renderRecruit(data, teamSystem); }, '');
    } else if (_teamMode === 'info') {
        body = safe(function () { return _renderInfo(data, teamSystem); }, '');
    } else {
        body = safe(function () { return _renderActive(data, teamSystem); }, '');
    }

    return dropdownHtml + body;
}

function _renderDropdown() {
    const current = TEAM_MODES.find(m => m.id === _teamMode) || TEAM_MODES[0];

    const items = TEAM_MODES.map(function (m) {
        var isActive = m.id === _teamMode;
        return '<button class="team-dropdown-item' + (isActive ? ' active' : '') + '" ' +
            'data-team-mode="' + m.id + '" type="button">' +
            renderIcon(m.icon, 13) +
            '<span class="team-dropdown-item-label">' + escapeHtml(m.label) + '</span>' +
            (isActive ? '<span class="team-dropdown-check">✓</span>' : '') +
            '</button>';
    }).join('');

    return '<details class="team-dropdown">' +
        '<summary class="team-dropdown-trigger">' +
            renderIcon(current.icon, 13) +
            '<span class="team-dropdown-current">' + escapeHtml(current.label) + '</span>' +
            '<span class="team-dropdown-chevron"></span>' +
        '</summary>' +
        '<div class="team-dropdown-menu">' + items + '</div>' +
        '</details>';
}

// ============================================================
// EXPORT — get/set
// ============================================================
export function getTeamMode() { return _teamMode; }
export function setTeamMode(mode) {
    if (mode === 'roster' || mode === 'recruit' || mode === 'info') _teamMode = mode;
}
export function getRecruitFilter() { return _recruitFilter; }
export function setRecruitFilter(f) { _recruitFilter = f; }

// ============================================================
// TIM AKTIF
// ============================================================
function _renderActive(data, teamSystem) {
    const staff = Array.isArray(data.staff) ? data.staff : [];

    let counts = { engineers: 0, designers: 0, marketers: 0 };
    let totalSalary = 0;
    try {
        if (teamSystem && teamSystem.getTeamCounts) counts = teamSystem.getTeamCounts() || counts;
        if (teamSystem && teamSystem.getTotalSalary) totalSalary = teamSystem.getTotalSalary() || 0;
    } catch (e) {}

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
                <div class="kpi-label">Gaji/Bln</div>
                <div class="kpi-value" style="font-size:15px;">$${(totalSalary || 0).toLocaleString('en-US')}</div>
            </div>
        </div>
    `;

    if (!staff.length) {
        return summary + `
            <div class="empty">
                <div class="empty-ico">${renderIcon('users', 48)}</div>
                <div class="empty-title">Belum ada tim</div>
                <div class="empty-desc">Pilih menu <b>Rekrut</b> di dropdown atas untuk mencari kandidat.</div>
            </div>
        `;
    }

    const byRole = { engineer: [], designer: [], marketer: [] };
    staff.forEach(function(s) {
        if (s && s.role && byRole[s.role]) byRole[s.role].push(s);
    });

    const roleSections = ROLES.map(function(role) {
        const list = byRole[role.id] || [];
        if (!list.length) return '';
        const rows = list.map(function(s) {
            try { return _renderStaffRow(s); }
            catch (err) {
                console.error('[TeamPanel] staff row error:', err, s);
                return '<div class="staff-row" style="opacity:0.5;"><div style="flex:1;">Data staff korup</div></div>';
            }
        }).join('');
        return `
            <div class="card">
                <div class="card-title" style="color:${role.color || 'var(--text)'};display:flex;align-items:center;gap:6px;">
                    ${renderIcon(role.icon, 12)} ${(role.label || role.id || '').toUpperCase()} (${list.length})
                </div>
                <div class="staff-list">${rows}</div>
            </div>
        `;
    }).join('');

    return summary + roleSections;
}

function _renderStaffRow(s) {
    if (!s) return '';

    const role = getRoleById(s.role) || { color: '#666', icon: 'cpu' };
    const tier = getSkillTier(s.skill || 1) || { color: '#999', label: '' };
    const morale = (typeof s.morale === 'number') ? s.morale : 75;
    const salary = (typeof s.salary === 'number') ? s.salary : 0;
    const moraleColor = morale >= 70 ? 'var(--success)' : morale >= 40 ? 'var(--warn)' : 'var(--danger)';

    const traitList = Array.isArray(s.traits) ? s.traits : [];
    const traitIcons = traitList.map(function(tid) {
        const t = getTraitById(tid);
        if (!t) return '';
        return '<span class="trait-dot" title="' + escapeHtml(t.label) + '" style="background:' + t.color + ';"></span>';
    }).join('');

    let avatar = '';
    try { avatar = generateAvatar(s.name || 'Unknown', { size: 40 }); }
    catch (e) { avatar = '<div class="staff-avatar" style="background:' + (role.color || '#666') + ';"></div>'; }

    const country = s.countryFlag ? '<span class="staff-country">' + s.countryFlag + '</span>' : '';

    return `
        <div class="staff-row" data-staff-detail="${s.id || ''}">
            ${avatar}
            <div class="staff-info">
                <div class="staff-name-row">
                    <span class="staff-name">${escapeHtml(s.name || 'Tanpa Nama')}</span>
                    ${country}
                    <span class="staff-tier" style="color:${tier.color || '#999'};">${escapeHtml(tier.label || ('T' + s.skill))}</span>
                    <span class="staff-traits">${traitIcons}</span>
                </div>
                <div class="staff-meta-row">
                    <span>$${salary.toLocaleString('en-US')}/bln</span>
                    <span>•</span>
                    <span style="color:${moraleColor};">Morale ${morale}</span>
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
    const allCandidates = Array.isArray(data.candidates) ? data.candidates : [];
    const poolInfo = data.candidatePool || {};
    const lastRefreshMinute = poolInfo.lastRefreshMinute || 0;
    const nowMinute = (data.time && data.time.elapsedGameMinutes) || 0;
    const daysSinceRefresh = Math.floor((nowMinute - lastRefreshMinute) / 1440);
    const cfg = BALANCE.team || {};
    const refreshIn = Math.max(0, (cfg.poolRefreshDays || 30) - daysSinceRefresh);

    const candidates = _recruitFilter === 'all'
        ? allCandidates
        : allCandidates.filter(c => c.role === _recruitFilter);

    const header = `
        <div class="recruit-header">
            <div class="recruit-header-line">
                <span class="recruit-header-count">${allCandidates.length}</span>
                <span class="recruit-header-label">kandidat tersedia</span>
                <span class="recruit-header-dot">·</span>
                <span class="recruit-header-label">refresh dalam ${refreshIn} hari</span>
            </div>
        </div>
    `;

    const filterChips = `
        <div class="chip-bar" style="margin-bottom:8px;">
            <button class="chip ${_recruitFilter === 'all' ? 'active' : ''}" data-recruit-filter="all">Semua (${allCandidates.length})</button>
            ${ROLES.map(function(r) {
                var count = allCandidates.filter(c => c.role === r.id).length;
                return '<button class="chip ' + (_recruitFilter === r.id ? 'active' : '') + '" data-recruit-filter="' + r.id + '">' +
                    renderIcon(r.icon, 12) + ' ' + escapeHtml(r.label) + ' (' + count + ')' +
                    '</button>';
            }).join('')}
        </div>
    `;

    if (!candidates.length) {
        return header + filterChips + `
            <div class="empty">
                <div class="empty-title">Tidak ada kandidat</div>
                <div class="empty-desc">${allCandidates.length ? 'Coba filter role lain.' : 'Tunggu beberapa hari atau refresh pool.'}</div>
                ${allCandidates.length ? '' : '<button class="btn-secondary" data-team-action="refresh-pool" style="max-width:240px;margin:0 auto;">Refresh Pool Sekarang</button>'}
            </div>
        `;
    }

    const rows = candidates.map(_renderCandidateRow).join('');
    return header + filterChips + '<div class="cand-list">' + rows + '</div>';
}

function _renderCandidateRow(c) {
    if (!c || !c.id) return '';
    const role = getRoleById(c.role) || { label: c.role || '?', icon: 'cpu', color: '#666' };
    const tier = getSkillTier(c.skill || 1) || { label: '' };
    const salary = (typeof c.salary === 'number') ? c.salary : 0;
    const totalCost = (typeof c.totalCost === 'number') ? c.totalCost : salary * 3;
    const flag = c.countryFlag || '';
    const specialty = c.specialty || '';

    const traitList = Array.isArray(c.traits) ? c.traits : [];
    const traitDots = traitList.map(function(tid) {
        const t = getTraitById(tid);
        if (!t) return '';
        return '<span class="trait-dot" title="' + escapeHtml(t.label) + '" style="background:' + t.color + ';"></span>';
    }).join('');

    let avatar = '';
    try { avatar = generateAvatar(c.name || 'Unknown', { size: 44 }); }
    catch (e) { avatar = '<div class="staff-avatar" style="background:' + (role.color || '#666') + ';"></div>'; }

    return `
        <div class="cand-row" data-team-action="open-candidate" data-candidate-id="${c.id}">
            <div class="cand-row-avatar">${avatar}</div>
            <div class="cand-row-main">
                <div class="cand-row-head">
                    <span class="cand-row-name">${escapeHtml(c.name || 'Tanpa Nama')}</span>
                    ${flag ? '<span class="cand-row-flag">' + flag + '</span>' : ''}
                    <span class="trait-dots">${traitDots}</span>
                </div>
                <div class="cand-row-meta">
                    <span style="color:${role.color || 'inherit'};font-weight:600;">${escapeHtml(role.label)}</span>
                    <span class="cand-row-dot">·</span>
                    <span>${escapeHtml(tier.label || 'Tier ' + c.skill)}</span>
                    ${specialty ? '<span class="cand-row-dot">·</span><span>' + escapeHtml(specialty) + '</span>' : ''}
                </div>
                <div class="cand-row-foot">
                    <span class="cand-row-salary">$${salary.toLocaleString('en-US')}<span class="cand-row-salary-unit">/bln</span></span>
                    <span class="cand-row-dot">·</span>
                    <span class="cand-row-total">Total $${totalCost.toLocaleString('en-US')}</span>
                </div>
            </div>
            <div class="cand-row-actions">
                <button class="cand-cta" data-team-action="hire" data-candidate-id="${c.id}" aria-label="Rekrut">
                    ${renderIcon('plus', 16)}
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// MODAL DETAIL KANDIDAT
// ============================================================
export function openCandidateDetailModal({ candidateId }) {
    const data = window.__game.state.get();
    const c = (data.candidates || []).find(x => x.id === candidateId);
    if (!c) return;

    const role = getRoleById(c.role) || { label: '?', color: '#666', icon: 'cpu' };
    const tier = getSkillTier(c.skill || 1) || { label: '', color: '#999' };
    const salary = c.salary || 0;
    const signing = c.signingBonus != null ? c.signingBonus : Math.round(salary * 1.8);
    const total = c.totalCost != null ? c.totalCost : (salary + signing);

    let avatar = '';
    try { avatar = generateAvatar(c.name || 'Unknown', { size: 72 }); } catch (e) {}

    const traitList = Array.isArray(c.traits) ? c.traits : [];
    const traitHtml = traitList.length
        ? traitList.map(function(tid) {
            const t = getTraitById(tid);
            if (!t) return '';
            return '<div class="cand-modal-trait">' +
                '<div class="cand-modal-trait-icon" style="color:' + t.color + ';">' + renderIcon(t.icon || 'sparkles', 14) + '</div>' +
                '<div class="cand-modal-trait-body">' +
                    '<div class="cand-modal-trait-name" style="color:' + t.color + ';">' + escapeHtml(t.label) + '</div>' +
                    '<div class="cand-modal-trait-desc">' + escapeHtml(t.description) + '</div>' +
                '</div>' +
                '</div>';
        }).join('')
        : '<div class="cand-modal-empty">Tidak ada trait khusus.</div>';

    const detailCandidates = [
        { label: 'Spesialisasi', value: c.specialty },
        { label: 'Pengalaman',   value: (typeof c.yearsExperience === 'number' && c.yearsExperience > 0) ? (c.yearsExperience + ' tahun') : null },
        { label: 'Usia',         value: c.age ? (c.age + ' tahun') : null },
        { label: 'Latar Belakang', value: c.background }
    ];
    const filledDetails = detailCandidates.filter(d => d.value != null && d.value !== '');

    let detailSectionHtml = '';
    if (filledDetails.length) {
        const rows = filledDetails.map(function(d) {
            return '<div class="cand-modal-detail-row">' +
                '<div class="cand-modal-detail-label">' + escapeHtml(d.label) + '</div>' +
                '<div class="cand-modal-detail-value">' + escapeHtml(String(d.value)) + '</div>' +
                '</div>';
        }).join('');
        detailSectionHtml =
            '<div class="cand-modal-section-title">' + renderIcon('question', 11) + 'Detail</div>' +
            '<div class="cand-modal-details">' + rows + '</div>';
    } else {
        detailSectionHtml =
            '<div class="cand-modal-section-title">' + renderIcon('question', 11) + 'Detail</div>' +
            '<div class="cand-modal-note">' +
                renderIcon('warn', 14) +
                '<span>Profil terbatas — kandidat ini belum memiliki data lengkap. Kandidat dengan profil penuh akan muncul setelah pool refresh.</span>' +
            '</div>';
    }

    const countryHtml = c.countryFlag || c.countryLabel
        ? '<div class="cand-modal-country">' +
            (c.countryFlag ? '<span>' + c.countryFlag + '</span>' : '') +
            (c.countryLabel ? '<span>' + escapeHtml(c.countryLabel) + '</span>' : '') +
            '</div>'
        : '';

    const html =
        '<div class="cand-modal">' +
            '<div class="cand-modal-header">' +
                '<div class="cand-modal-avatar">' + avatar + '</div>' +
                '<div class="cand-modal-identity">' +
                    '<div class="cand-modal-name">' + escapeHtml(c.name || 'Tanpa Nama') + '</div>' +
                    countryHtml +
                    '<div class="cand-modal-role" style="color:' + role.color + ';">' +
                        renderIcon(role.icon || 'cpu', 12) +
                        '<span>' + escapeHtml(role.label) + '</span>' +
                        '<span class="cand-modal-sep">·</span>' +
                        '<span style="color:' + tier.color + ';">' + escapeHtml(tier.label) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="cand-modal-section-title">' + renderIcon('sparkles', 11) + 'Traits</div>' +
            '<div class="cand-modal-traits">' + traitHtml + '</div>' +
            detailSectionHtml +
            '<div class="cand-modal-section-title">' + renderIcon('coin', 11) + 'Biaya</div>' +
            '<div class="cand-modal-costs">' +
                '<div class="cand-modal-cost-row">' +
                    '<span>Gaji per bulan</span>' +
                    '<b>$' + salary.toLocaleString('en-US') + '</b>' +
                '</div>' +
                '<div class="cand-modal-cost-row">' +
                    '<span>Signing bonus</span>' +
                    '<b>$' + signing.toLocaleString('en-US') + '</b>' +
                '</div>' +
                '<div class="cand-modal-cost-row cand-modal-cost-total">' +
                    '<span>Total bulan pertama</span>' +
                    '<b>$' + total.toLocaleString('en-US') + '</b>' +
                '</div>' +
            '</div>' +
            '<div class="cand-modal-actions">' +
                '<button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>' +
                '<button class="btn-primary" data-team-action="hire" data-candidate-id="' + c.id + '" style="flex:2;">Rekrut</button>' +
            '</div>' +
        '</div>';

    Modal.open('candidate-detail', html);
}

// ============================================================
// INFO
// ============================================================
function _renderInfo(data, teamSystem) {
    const staff = Array.isArray(data.staff) ? data.staff : [];
    const TeamSystemCtor = (window.__game && window.__game.teamSystem)
        ? window.__game.teamSystem.constructor
        : null;

    if (!TeamSystemCtor) {
        return '<div class="empty"><div class="empty-title">TeamSystem belum siap</div></div>';
    }

    function safeCall(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }

    const engineerBonus = safeCall(function() { return TeamSystemCtor.getResearchBonusFromStaff(staff); }, { speedMult: 1, extraSlots: 0 });
    const osBonus = safeCall(function() { return TeamSystemCtor.getOsDevBonusFromStaff(staff); }, 1);
    const osSlots = safeCall(function() { return TeamSystemCtor.getOsFeatureSlotsFromStaff(staff); }, 0);
    const designerBonus = safeCall(function() { return TeamSystemCtor.getProductDevBonusFromStaff(staff); }, { speedMult: 1, qualityBonus: 0 });
    const marketerBonus = safeCall(function() { return TeamSystemCtor.getMarketingBonusFromStaff(staff); }, 1);

    let counts = { engineers: 0, designers: 0, marketers: 0 };
    let moraleAvg = 0;
    let totalSalary = 0;
    try {
        if (teamSystem && teamSystem.getTeamCounts) counts = teamSystem.getTeamCounts() || counts;
        if (teamSystem && teamSystem.getAverageMorale) moraleAvg = teamSystem.getAverageMorale() || 0;
        if (teamSystem && teamSystem.getTotalSalary) totalSalary = teamSystem.getTotalSalary() || 0;
    } catch (e) {}

    function section(title, iconId, color, rows) {
        return '<div class="card">' +
            '<div class="card-title" style="color:' + color + ';display:flex;align-items:center;gap:6px;">' +
                renderIcon(iconId, 12) + title.toUpperCase() +
            '</div>' +
            rows.map(function(r) {
                return '<div class="sum-row"><span>' + r.label + '</span><b style="color:' + (r.valueColor || 'var(--text)') + ';">' + r.value + '</b></div>';
            }).join('') +
            '</div>';
    }

    const engSec = section('Engineer Bonus', 'cpu', '#60a5fa', [
        { label: 'Jumlah Engineer', value: counts.engineers || 0 },
        { label: 'Kecepatan Riset', value: '× ' + (engineerBonus.speedMult || 1).toFixed(2), valueColor: engineerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Riset Ekstra', value: '+' + (engineerBonus.extraSlots || 0), valueColor: engineerBonus.extraSlots > 0 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Kecepatan Dev OS', value: '× ' + (osBonus || 1).toFixed(2), valueColor: osBonus > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Slot Fitur OS Ekstra', value: '+' + (osSlots || 0), valueColor: osSlots > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const desSec = section('Designer Bonus', 'palette', '#a78bfa', [
        { label: 'Jumlah Designer', value: counts.designers || 0 },
        { label: 'Kecepatan Desain Produk', value: '× ' + (designerBonus.speedMult || 1).toFixed(2), valueColor: designerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: 'Bonus Kualitas Produk', value: '+' + (designerBonus.qualityBonus || 0).toFixed(1) + ' poin', valueColor: designerBonus.qualityBonus > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const mktSec = section('Marketer Bonus', 'signal', '#34d399', [
        { label: 'Jumlah Marketer', value: counts.marketers || 0 },
        { label: 'Efektivitas Kampanye', value: '× ' + (marketerBonus || 1).toFixed(2), valueColor: marketerBonus > 1 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const moraleColor = moraleAvg >= 70 ? 'var(--success)' : moraleAvg >= 40 ? 'var(--warn)' : 'var(--danger)';

    const extraSec = section('Ringkasan Tim', 'activity', 'var(--accent)', [
        { label: 'Total Staff', value: staff.length },
        { label: 'Total Gaji / Bulan', value: '$' + (totalSalary || 0).toLocaleString('en-US') },
        { label: 'Rata-rata Moral', value: moraleAvg + '/100', valueColor: moraleColor }
    ]);

    const tips = '<div class="card">' +
        '<div class="card-title" style="display:flex;align-items:center;gap:6px;">' + renderIcon('sparkles', 12) + 'TIPS</div>' +
        '<div style="font-size:12px;color:var(--text-dim);line-height:1.6;">' +
            '• Staff <b>tier tinggi</b> memberi bonus lebih besar tapi gaji lebih mahal.<br>' +
            '• Trait <b>Fast Learner</b> mempercepat naik tier.<br>' +
            '• Trait <b>Specialist</b> memberi bonus +25% di bidangnya.<br>' +
            '• <b>Moral rendah</b> menurunkan produktivitas.' +
        '</div>' +
        '</div>';

    return engSec + desSec + mktSec + extraSec + tips;
}
