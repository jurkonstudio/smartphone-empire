import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/TeamPanel.js
// v2027.10a — i18n: pakai t() untuk semua string UI.
// v2027.10b — i18n penuh (Fase 2): label role/tier/trait via key (fallback ke data),
//             KPI memakai team.kpi.*, modal kandidat render ulang saat 'lang:changed',
//             variabel `t` yang tertimpa di callback trait diganti `trait`.
import { ROLES, getRoleById, getSkillTier, getTraitById } from '../../data/staff.data.js';
import { BALANCE } from '../../data/balance.data.js';
import { generateAvatar } from '../avatars/AvatarGenerator.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';

let _recruitFilter = 'all';
let _teamMode = 'roster';

const TEAM_MODES = [
    { id: 'roster',  key: 'team.mode.roster',  icon: 'users' },
    { id: 'recruit', key: 'team.mode.recruit', icon: 'plus' },
    { id: 'info',    key: 'team.mode.info',    icon: 'settings' }
];

// _tf(key, fallback): pakai terjemahan jika key ada di kamus, kalau belum pakai fallback
// (teks asli dari data) — aman sebelum Fase 3.
function _tf(key, fallback) {
    var v = t(key);
    return (v && v !== key) ? v : fallback;
}

// Label data staff (role / tier / trait) lewat key, fallback ke teks data.
function _roleLabel(role) {
    if (!role) return '?';
    return _tf('team.kpi.' + role.id, role.label || role.id || '?');
}
function _tierLabel(tier, skill) {
    if (tier && tier.tier) return _tf('team.tier.' + tier.tier, tier.label || ('T' + skill));
    return (tier && tier.label) || ('T' + skill);
}
function _traitLabel(trait) {
    return _tf('team.trait.' + trait.id + '.label', trait.label);
}
function _traitDesc(trait) {
    return _tf('team.trait.' + trait.id + '.desc', trait.description);
}


function safe(fn, fallback) {
    try { return fn(); }
    catch (err) {
        console.error('[TeamPanel] section error:', err);
        return fallback || '<div class="card" style="border-color:var(--danger);"><div class="card-title" style="color:var(--danger);">⚠ ' + escapeHtml(t('team.roster.error')) + '</div><div style="font-size:12px;color:var(--text-dim);">' + escapeHtml(err.message || 'unknown') + '</div></div>';
    }
}

// ============================================================
// MAIN RENDER
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
            '<span class="team-dropdown-item-label">' + escapeHtml(t(m.key)) + '</span>' +
            (isActive ? '<span class="team-dropdown-check">✓</span>' : '') +
            '</button>';
    }).join('');

    return '<details class="team-dropdown">' +
        '<summary class="team-dropdown-trigger">' +
            renderIcon(current.icon, 13) +
            '<span class="team-dropdown-current">' + escapeHtml(t(current.key)) + '</span>' +
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
                <div class="kpi-label">${escapeHtml(t('team.kpi.engineer'))}</div>
                <div class="kpi-value" style="color:#60a5fa;">${counts.engineers || 0}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">${escapeHtml(t('team.kpi.designer'))}</div>
                <div class="kpi-value" style="color:#a78bfa;">${counts.designers || 0}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">${escapeHtml(t('team.kpi.marketer'))}</div>
                <div class="kpi-value" style="color:#34d399;">${counts.marketers || 0}</div>
            </div>
            <div class="kpi">
                <div class="kpi-label">${escapeHtml(t('team.kpi.salary'))}</div>
                <div class="kpi-value" style="font-size:15px;">$${(totalSalary || 0).toLocaleString('en-US')}</div>
            </div>
        </div>
    `;

    if (!staff.length) {
        return summary + `
            <div class="empty">
                <div class="empty-ico">${renderIcon('users', 48)}</div>
                <div class="empty-title">${escapeHtml(t('team.roster.empty_title'))}</div>
                <div class="empty-desc">${escapeHtml(t('team.roster.empty_desc'))}</div>
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
                return '<div class="staff-row" style="opacity:0.5;"><div style="flex:1;">' + escapeHtml(t('team.roster.corrupt')) + '</div></div>';
            }
        }).join('');
        return `
            <div class="card">
                <div class="card-title" style="color:${role.color || 'var(--text)'};display:flex;align-items:center;gap:6px;">
                    ${renderIcon(role.icon, 12)} ${escapeHtml(_roleLabel(role).toUpperCase())} (${list.length})
                </div>
                <div class="staff-list">${rows}</div>
            </div>
        `;
    }).join('');

    return _rosterStyle() + summary + roleSections;
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
        const trait = getTraitById(tid);
        if (!trait) return '';
        return '<span class="trait-dot" title="' + escapeHtml(_traitLabel(trait)) + '" style="background:' + trait.color + ';"></span>';
    }).join('');

    let avatar = '';
    try { avatar = generateAvatar(s.name || 'Unknown', { size: 40 }); }
    catch (e) { avatar = '<div class="staff-avatar" style="background:' + (role.color || '#666') + ';"></div>'; }

    const country = s.countryFlag ? '<span class="staff-country">' + s.countryFlag + '</span>' : '';
    const nameLabel = s.name || t('team.roster.unnamed');

    return `
        <div class="staff-row" data-staff-detail="${s.id || ''}">
            ${avatar}
            <div class="staff-info">
                <div class="staff-name-row">
                    <span class="staff-name">${escapeHtml(nameLabel)}</span>
                    ${country}
                    <span class="staff-tier" style="color:${tier.color || '#999'};">${escapeHtml(_tierLabel(tier, s.skill))}</span>
                    <span class="staff-traits">${traitIcons}</span>
                </div>
                <div class="staff-meta-row">
                    <span>$${salary.toLocaleString('en-US')}${escapeHtml(t('team.recruit.per_month'))}</span>
                    <span>•</span>
                    <span style="color:${moraleColor};">${escapeHtml(t('team.roster.morale'))} ${morale}</span>
                </div>
                ${_progressHtml(s)}
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
    const counts = _countsOf(teamSystem);

    // Urutan: role yang paling kurang dulu, lalu skill tertinggi, lalu biaya termurah.
    const sorted = allCandidates.slice().sort(function (a, b) {
        const ga = _roleCountOf(counts, a.role) - (ROLE_TARGET[a.role] || 1);
        const gb = _roleCountOf(counts, b.role) - (ROLE_TARGET[b.role] || 1);
        if (ga !== gb) return ga - gb;
        if ((b.skill || 1) !== (a.skill || 1)) return (b.skill || 1) - (a.skill || 1);
        return (a.totalCost || 0) - (b.totalCost || 0);
    });

    const candidates = _recruitFilter === 'all'
        ? sorted
        : sorted.filter(c => c.role === _recruitFilter);

    // Headhunter: tombol ganti pool berbayar, dengan cooldown.
    const cdMinutes = (teamSystem && teamSystem.headhuntCooldownLeft) ? teamSystem.headhuntCooldownLeft() : 0;
    const hhCost = (teamSystem && teamSystem.headhuntCost) ? teamSystem.headhuntCost() : 0;
    const hhBtn = cdMinutes > 0
        ? '<button class="btn-secondary recruit-hh" disabled>' + escapeHtml(_tf('team.recruit.hh_cooldown', 'Headhunter cooldown ' + Math.ceil(cdMinutes / 1440) + ' hari')) + '</button>'
        : '<button class="btn-secondary recruit-hh" data-team-action="headhunt">' +
            renderIcon('users', 13) + ' ' + escapeHtml(_tf('team.recruit.hh_btn', 'Headhunter')) + ' · ' + _fmtMoney(hhCost) +
          '</button>';

    const header = `
        <div class="recruit-header">
            <div class="recruit-header-line">
                <span class="recruit-header-count">${allCandidates.length}</span>
                <span class="recruit-header-label">${escapeHtml(t('team.recruit.candidates_avail'))}</span>
                <span class="recruit-header-dot">·</span>
                <span class="recruit-header-label">${escapeHtml(t('team.recruit.refresh_in', { n: refreshIn }))}</span>
            </div>
            <div class="recruit-hh-row">${hhBtn}</div>
            <div class="recruit-hh-hint">${escapeHtml(_tf('team.recruit.hh_hint', 'Headhunter mengganti seluruh kandidat dengan pool baru.'))}</div>
        </div>
    `;

    const filterChips = `
        <div class="chip-bar" style="margin-bottom:8px;">
            <button class="chip ${_recruitFilter === 'all' ? 'active' : ''}" data-recruit-filter="all">${escapeHtml(t('team.recruit.filter_all'))} (${allCandidates.length})</button>
            ${ROLES.map(function(r) {
                var count = allCandidates.filter(c => c.role === r.id).length;
                var need = _roleCountOf(counts, r.id) === 0 ? ' !' : '';
                return '<button class="chip ' + (_recruitFilter === r.id ? 'active' : '') + '" data-recruit-filter="' + r.id + '">' +
                    renderIcon(r.icon, 12) + ' ' + escapeHtml(_roleLabel(r)) + ' (' + count + ')' + need +
                    '</button>';
            }).join('')}
        </div>
    `;

    const pipeline = _renderPipeline(data, teamSystem);

    if (!candidates.length) {
        return _recruitStyle() + _renderPending(data, teamSystem) + pipeline + header + filterChips + `
            <div class="empty">
                <div class="empty-title">${escapeHtml(t('team.recruit.empty_title'))}</div>
                <div class="empty-desc">${escapeHtml(allCandidates.length ? t('team.recruit.empty_hint_filter') : t('team.recruit.empty_hint_wait'))}</div>
                ${allCandidates.length ? '' : '<button class="btn-secondary" data-team-action="refresh-pool" style="max-width:240px;margin:0 auto;">' + escapeHtml(t('team.recruit.refresh_btn')) + '</button>'}
            </div>
        `;
    }

    const rows = candidates.map(function (c) {
        return _renderCandidateRow(c, _impactOf(teamSystem, c));
    }).join('');
    return _recruitStyle() + _renderPending(data, teamSystem) + pipeline + header + filterChips + '<div class="cand-list">' + rows + '</div>';
}

// ---------- Helper rekrut (v2027.10c) ----------
// Target awal per role: engineer untuk riset, designer untuk produk, marketer untuk kampanye.
const ROLE_TARGET = { engineer: 2, designer: 1, marketer: 1 };

const ROLE_EFFECT_HINT = {
    engineer: 'Mempercepat riset dan OS. Dengan 1 engineer, riset hanya punya 1 slot; 2 engineer membuka slot tambahan.',
    designer: 'Mempercepat pengembangan produk dan menambah kualitas ponsel.',
    marketer: 'Memperkuat efek kampanye pemasaran dan penjualan.'
};

function _countsOf(teamSystem) {
    var c = { engineers: 0, designers: 0, marketers: 0 };
    try { if (teamSystem && teamSystem.getTeamCounts) c = teamSystem.getTeamCounts() || c; } catch (e) {}
    return c;
}

function _roleCountOf(counts, roleId) {
    return roleId === 'engineer' ? (counts.engineers || 0)
         : roleId === 'designer' ? (counts.designers || 0)
         : (counts.marketers || 0);
}

function _fmtMoney(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

function _pct(delta) { return '+' + Math.round(delta * 100) + '%'; }

function _impactOf(teamSystem, c) {
    try {
        if (teamSystem && typeof teamSystem.getHireImpact === 'function') return teamSystem.getHireImpact(c);
    } catch (e) {}
    return null;
}

// Dampak kandidat dalam bentuk ringkas, mis. ["Riset +8%", "+1 slot riset"].
function _impactChips(role, impact) {
    if (!impact || !impact.deltas) return [];
    var d = impact.deltas, out = [];
    var EPS = 0.0005;
    if (role === 'engineer') {
        if (d.research > EPS) out.push(_tf('team.recruit.fx_research', 'Riset ') + _pct(d.research));
        if (d.slots > 0) out.push('+' + d.slots + ' ' + _tf('team.recruit.fx_slot', 'slot riset'));
        if (d.osDev > EPS) out.push(_tf('team.recruit.fx_os', 'OS ') + _pct(d.osDev));
    } else if (role === 'designer') {
        if (d.productSpeed > EPS) out.push(_tf('team.recruit.fx_product', 'Produk ') + _pct(d.productSpeed));
        if (d.quality > EPS) out.push(_tf('team.recruit.fx_quality', 'Kualitas +') + d.quality.toFixed(2));
    } else if (role === 'marketer') {
        if (d.marketing > EPS) out.push(_tf('team.recruit.fx_mkt', 'Kampanye ') + _pct(d.marketing));
    }
    return out;
}

// Panel "kebutuhan tim": kondisi per role + langkah berikutnya yang terhubung ke alur game.
function _renderPipeline(data, teamSystem) {
    const counts = _countsOf(teamSystem);
    const total = (data.staff || []).length;

    const cards = ROLES.map(function (r) {
        var n = _roleCountOf(counts, r.id);
        var target = ROLE_TARGET[r.id] || 1;
        var st = n === 0 ? { c: 'var(--danger)', l: _tf('team.recruit.st_empty', 'Kosong') }
              : n < target ? { c: 'var(--warn)', l: _tf('team.recruit.st_low', 'Kurang') }
              : { c: 'var(--success)', l: _tf('team.recruit.st_ok', 'Aman') };
        return '<div class="recruit-need">' +
            '<div class="recruit-need-top">' +
                '<span class="recruit-need-role" style="color:' + r.color + ';">' + escapeHtml(_roleLabel(r)) + '</span>' +
                '<span class="recruit-need-status" style="color:' + st.c + ';">' + escapeHtml(st.l) + '</span>' +
            '</div>' +
            '<div class="recruit-need-num">' + n + '<span> / ' + target + '</span></div>' +
            '<div class="recruit-need-hint">' + escapeHtml(_tf('team.recruit.hint.' + r.id, ROLE_EFFECT_HINT[r.id] || '')) + '</div>' +
        '</div>';
    }).join('');

    var nextRole = ROLES.find(function (r) { return _roleCountOf(counts, r.id) < (ROLE_TARGET[r.id] || 1); });
    var nextLine = nextRole
        ? _tf('team.recruit.next_prefix', 'Langkah berikutnya: rekrut ') + '<b style="color:' + nextRole.color + ';">' + escapeHtml(_roleLabel(nextRole)) + '</b>.'
        : escapeHtml(_tf('team.recruit.next_done', 'Target awal tim sudah terpenuhi. Fokus ke produk dan penjualan.'));

    var questLine = '';
    if (total === 0) {
        var reward = (BALANCE.questRewards && BALANCE.questRewards.first_recruit && BALANCE.questRewards.first_recruit.cash) || 0;
        questLine = '<div class="recruit-quest">' +
            escapeHtml(_tf('team.recruit.quest_prefix', 'Quest “Bangun tim” menunggu: rekrut 1 anggota untuk bonus ')) +
            '<b>' + _fmtMoney(reward) + '</b> + 3 Silicon.</div>';
    }

    return '<div class="recruit-pipeline">' +
        '<div class="recruit-need-grid">' + cards + '</div>' +
        '<div class="recruit-next">' + nextLine + '</div>' +
        questLine +
    '</div>';
}

function _recruitStyle() {
    return '<style>' +
        '.nego-row{display:flex;gap:8px;margin-bottom:4px;}' +
        '.nego-row button{flex:1;font-size:12px;}' +
        '.nego-hint{font-size:10.5px;color:var(--text-tertiary);margin-bottom:6px;line-height:1.4;}' +
        '.recruit-pipeline{margin-bottom:10px;}' +
        '.recruit-need-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}' +
        '.recruit-need{background:var(--bg-2);border:1px solid var(--border);border-radius:10px;padding:8px 8px 7px;min-width:0;}' +
        '.recruit-need-top{display:flex;justify-content:space-between;align-items:center;gap:4px;font-size:11px;}' +
        '.recruit-need-role{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
        '.recruit-need-status{font-size:10px;font-weight:600;flex-shrink:0;}' +
        '.recruit-need-num{font-size:18px;font-weight:700;margin:2px 0;color:var(--text);}' +
        '.recruit-need-num span{font-size:11px;color:var(--text-tertiary);font-weight:500;}' +
        '.recruit-need-hint{font-size:10.5px;line-height:1.4;color:var(--text-secondary);}' +
        '.recruit-next{margin-top:8px;font-size:12px;color:var(--text-secondary);line-height:1.5;}' +
        '.recruit-quest{margin-top:6px;font-size:11.5px;color:var(--text-tertiary);line-height:1.5;}' +
        '.recruit-hh-row{margin-top:6px;}' +
        '.recruit-hh{max-width:100%;font-size:12px;}' +
        '.recruit-hh-hint{font-size:10.5px;color:var(--text-tertiary);margin-top:4px;}' +
        '.cand-row-fx{margin-top:4px;font-size:11px;color:var(--success);display:flex;flex-wrap:wrap;gap:4px 8px;}' +
        '.cand-row-warn{color:var(--warn);}' +
        '.cand-row-fx-none{color:var(--text-tertiary);}' +
    '</style>';
}

function _candidateNotes(role, impact) {
    var notes = [];
    if (!impact) return { chips: [], warn: [] };
    var chips = _impactChips(role, impact);
    if (impact.current === 0) notes.push(_tf('team.recruit.fills', 'Mengisi slot kosong'));
    if (impact.capped) notes.push(_tf('team.recruit.cap_full', 'Kapasitas penuh'));
    if (!impact.affordable) notes.push(_tf('team.recruit.short', 'Kurang ') + _fmtMoney(impact.shortfall));
    return { chips: chips, warn: notes };
}

function _renderCandidateRow(c, impact) {
    if (!c || !c.id) return '';
    const role = getRoleById(c.role) || { id: c.role, label: c.role || '?', icon: 'cpu', color: '#666' };
    const tier = getSkillTier(c.skill || 1) || { label: '' };
    const salary = (typeof c.salary === 'number') ? c.salary : 0;
    const totalCost = (typeof c.totalCost === 'number') ? c.totalCost : salary * 3;
    const flag = c.countryFlag || '';
    const specialty = c.specialty || '';

    const traitList = Array.isArray(c.traits) ? c.traits : [];
    const traitDots = traitList.map(function(tid) {
        const trait = getTraitById(tid);
        if (!trait) return '';
        return '<span class="trait-dot" title="' + escapeHtml(_traitLabel(trait)) + '" style="background:' + trait.color + ';"></span>';
    }).join('');

    let avatar = '';
    try { avatar = generateAvatar(c.name || 'Unknown', { size: 44 }); }
    catch (e) { avatar = '<div class="staff-avatar" style="background:' + (role.color || '#666') + ';"></div>'; }

    const nameLabel = c.name || t('team.roster.unnamed');
    const tierText = tier.tier
        ? _tierLabel(tier, c.skill)
        : (tier.label || t('staff.detail.tier_label', { n: c.skill }));

    const notes = _candidateNotes(c.role, impact);
    const fxHtml = (notes.chips.length || notes.warn.length)
        ? '<div class="cand-row-fx">' +
            notes.chips.map(function (x) { return '<span>▲ ' + escapeHtml(x) + '</span>'; }).join('') +
            notes.warn.map(function (x) { return '<span class="cand-row-warn">' + escapeHtml(x) + '</span>'; }).join('') +
          '</div>'
        : '<div class="cand-row-fx cand-row-fx-none">' + escapeHtml(_tf('team.recruit.fx_none', 'Belum ada efek langsung untuk role ini')) + '</div>';

    return `
        <div class="cand-row" data-team-action="open-candidate" data-candidate-id="${c.id}">
            <div class="cand-row-avatar">${avatar}</div>
            <div class="cand-row-main">
                <div class="cand-row-head">
                    <span class="cand-row-name">${escapeHtml(nameLabel)}</span>
                    ${flag ? '<span class="cand-row-flag">' + flag + '</span>' : ''}
                    <span class="trait-dots">${traitDots}</span>
                </div>
                <div class="cand-row-meta">
                    <span style="color:${role.color || 'inherit'};font-weight:600;">${escapeHtml(_roleLabel(role))}</span>
                    <span class="cand-row-dot">·</span>
                    <span>${escapeHtml(tierText)}</span>
                    ${specialty ? '<span class="cand-row-dot">·</span><span>' + escapeHtml(specialty) + '</span>' : ''}
                </div>
                <div class="cand-row-foot">
                    <span class="cand-row-salary">$${salary.toLocaleString('en-US')}<span class="cand-row-salary-unit">${escapeHtml(t('team.recruit.per_month'))}</span></span>
                    <span class="cand-row-dot">·</span>
                    <span class="cand-row-total">${escapeHtml(t('team.recruit.total'))} $${totalCost.toLocaleString('en-US')}</span>
                </div>
                ${fxHtml}
            </div>
            <div class="cand-row-actions">
                <button class="cand-cta" data-team-action="hire" data-candidate-id="${c.id}" aria-label="${escapeHtml(t('team.modal.aria_hire'))}">
                    ${renderIcon('plus', 16)}
                </button>
            </div>
        </div>
    `;
}

// Bagian "Dampak" di modal kandidat.
function _modalImpactHtml(c, data) {
    const ts = window.__game && window.__game.teamSystem;
    const impact = _impactOf(ts, c);
    if (!impact) return '';
    const chips = _impactChips(c.role, impact);
    const rows = [
        { label: _tf('team.recruit.m_cap', 'Kapasitas role'), value: impact.current + ' / ' + impact.cap },
        { label: _tf('team.recruit.m_monthly', 'Tambahan gaji/bulan'), value: _fmtMoney(c.salary) },
        { label: _tf('team.recruit.m_cash', 'Kas sekarang'), value: _fmtMoney(data.cash) },
        { label: _tf('team.recruit.m_fx', 'Efek ke tim'), value: chips.length ? chips.join(' · ') : _tf('team.recruit.fx_none', 'Belum ada efek langsung untuk role ini') }
    ];
    const body = rows.map(function (r) {
        return '<div class="cand-modal-detail-row">' +
            '<div class="cand-modal-detail-label">' + escapeHtml(r.label) + '</div>' +
            '<div class="cand-modal-detail-value">' + escapeHtml(String(r.value)) + '</div>' +
        '</div>';
    }).join('');
    const warn = [];
    if (!impact.affordable) warn.push(_tf('team.recruit.short', 'Kurang ') + _fmtMoney(impact.shortfall));
    if (impact.capped) warn.push(_tf('team.recruit.cap_full', 'Kapasitas penuh'));
    return '<div class="cand-modal-section-title">' + renderIcon('sparkles', 11) + escapeHtml(_tf('team.recruit.m_title', 'Dampak')) + '</div>' +
        '<div class="cand-modal-details">' + body + '</div>' +
        (warn.length ? '<div class="cand-modal-note">' + renderIcon('warn', 14) + '<span>' + escapeHtml(warn.join(' · ')) + '</span></div>' : '');
}

// ============================================================
// MODAL DETAIL KANDIDAT
// ============================================================
function _candidateModalHtml(candidateId) {
    const data = window.__game.state.get();
    const c = (data.candidates || []).find(x => x.id === candidateId);
    if (!c) return '';

    const role = getRoleById(c.role) || { id: c.role, label: '?', color: '#666', icon: 'cpu' };
    const tier = getSkillTier(c.skill || 1) || { label: '', color: '#999' };
    const salary = c.salary || 0;
    const signing = c.signingBonus != null ? c.signingBonus : Math.round(salary * 1.8);
    const total = c.totalCost != null ? c.totalCost : (salary + signing);

    let avatar = '';
    try { avatar = generateAvatar(c.name || 'Unknown', { size: 72 }); } catch (e) {}

    const traitList = Array.isArray(c.traits) ? c.traits : [];
    const traitHtml = traitList.length
        ? traitList.map(function(tid) {
            const trait = getTraitById(tid);
            if (!trait) return '';
            return '<div class="cand-modal-trait">' +
                '<div class="cand-modal-trait-icon" style="color:' + trait.color + ';">' + renderIcon(trait.icon || 'sparkles', 14) + '</div>' +
                '<div class="cand-modal-trait-body">' +
                    '<div class="cand-modal-trait-name" style="color:' + trait.color + ';">' + escapeHtml(_traitLabel(trait)) + '</div>' +
                    '<div class="cand-modal-trait-desc">' + escapeHtml(_traitDesc(trait)) + '</div>' +
                '</div>' +
                '</div>';
        }).join('')
        : '<div class="cand-modal-empty">' + escapeHtml(t('team.modal.traits_empty')) + '</div>';

    const yearsLabel = t('team.modal.years');
    const detailCandidates = [
        { label: t('team.modal.detail_specialty'), value: c.specialty },
        { label: t('team.modal.detail_exp'), value: (typeof c.yearsExperience === 'number' && c.yearsExperience > 0) ? (c.yearsExperience + ' ' + yearsLabel) : null },
        { label: t('team.modal.detail_age'), value: c.age ? (c.age + ' ' + yearsLabel) : null },
        { label: t('team.modal.detail_bg'), value: c.background }
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
            '<div class="cand-modal-section-title">' + renderIcon('question', 11) + escapeHtml(t('team.modal.detail')) + '</div>' +
            '<div class="cand-modal-details">' + rows + '</div>';
    } else {
        detailSectionHtml =
            '<div class="cand-modal-section-title">' + renderIcon('question', 11) + escapeHtml(t('team.modal.detail')) + '</div>' +
            '<div class="cand-modal-note">' +
                renderIcon('warn', 14) +
                '<span>' + escapeHtml(t('team.modal.detail_limit')) + '</span>' +
            '</div>';
    }

    const countryHtml = c.countryFlag || c.countryLabel
        ? '<div class="cand-modal-country">' +
            (c.countryFlag ? '<span>' + c.countryFlag + '</span>' : '') +
            (c.countryLabel ? '<span>' + escapeHtml(c.countryLabel) + '</span>' : '') +
            '</div>'
        : '';

    const nameLabel = c.name || t('team.roster.unnamed');
    const tierText = tier.tier ? _tierLabel(tier, c.skill) : (tier.label || '');

    const impactSection = _modalImpactHtml(c, data);
    const negotiateHtml = _negotiateHtml(c);
    return '<div class="cand-modal">' +
            '<div class="cand-modal-header">' +
                '<div class="cand-modal-avatar">' + avatar + '</div>' +
                '<div class="cand-modal-identity">' +
                    '<div class="cand-modal-name">' + escapeHtml(nameLabel) + '</div>' +
                    countryHtml +
                    '<div class="cand-modal-role" style="color:' + role.color + ';">' +
                        renderIcon(role.icon || 'cpu', 12) +
                        '<span>' + escapeHtml(_roleLabel(role)) + '</span>' +
                        '<span class="cand-modal-sep">·</span>' +
                        '<span style="color:' + tier.color + ';">' + escapeHtml(tierText) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="cand-modal-section-title">' + renderIcon('sparkles', 11) + escapeHtml(t('team.modal.traits')) + '</div>' +
            '<div class="cand-modal-traits">' + traitHtml + '</div>' +
            detailSectionHtml +
            impactSection + '<div class="cand-modal-section-title">' + renderIcon('coin', 11) + escapeHtml(t('team.modal.cost')) + '</div>' +
            '<div class="cand-modal-costs">' +
                '<div class="cand-modal-cost-row">' +
                    '<span>' + escapeHtml(t('team.modal.cost_salary')) + '</span>' +
                    '<b>$' + salary.toLocaleString('en-US') + '</b>' +
                '</div>' +
                '<div class="cand-modal-cost-row">' +
                    '<span>' + escapeHtml(t('team.modal.cost_signing')) + '</span>' +
                    '<b>$' + signing.toLocaleString('en-US') + '</b>' +
                '</div>' +
                '<div class="cand-modal-cost-row cand-modal-cost-total">' +
                    '<span>' + escapeHtml(t('team.modal.cost_total')) + '</span>' +
                    '<b>$' + total.toLocaleString('en-US') + '</b>' +
                '</div>' +
            '</div>' +
            negotiateHtml + '<div class="cand-modal-actions">' +
                '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('team.modal.btn_cancel')) + '</button>' +
                '<button class="btn-primary" data-team-action="hire" data-candidate-id="' + c.id + '" style="flex:2;">' + escapeHtml(t('team.modal.btn_hire')) + '</button>' +
            '</div>' +
        '</div>';
}

export function openCandidateDetailModal({ candidateId }) {
    const html = _candidateModalHtml(candidateId);
    if (!html) return;

    let unsub = null;
    const node = Modal.open('candidate-detail', html, {
        onClose: function () { if (unsub) { unsub(); unsub = null; } }
    });

    // Ganti bahasa saat modal terbuka: render ulang isi kartu. Listener melepas dirinya sendiri
    // bila modal sudah tertutup (Modal.close silent tidak memanggil onClose).
    unsub = bus.on('lang:changed', function () {
        if (!node || !node.isConnected || !Modal.isOpen('candidate-detail')) {
            if (unsub) { unsub(); unsub = null; }
            return;
        }
        const fresh = _candidateModalHtml(candidateId);
        const card = node.querySelector('.modal-card');
        if (!fresh || !card) return;
        card.innerHTML = fresh;
        const closeBtn = card.querySelector('[data-modal-close]');
        if (closeBtn) closeBtn.addEventListener('click', function () { Modal.close('candidate-detail'); });
    });
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
        return '<div class="empty"><div class="empty-title">' + escapeHtml(t('team.info.system_not_ready')) + '</div></div>';
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
                renderIcon(iconId, 12) + escapeHtml(title.toUpperCase()) +
            '</div>' +
            rows.map(function(r) {
                return '<div class="sum-row"><span>' + escapeHtml(r.label) + '</span><b style="color:' + (r.valueColor || 'var(--text)') + ';">' + escapeHtml(String(r.value)) + '</b></div>';
            }).join('') +
            '</div>';
    }

    const pointsUnit = t('team.info.points_unit');

    const engSec = section(t('team.info.eng_section'), 'cpu', '#60a5fa', [
        { label: t('team.info.eng_count'), value: counts.engineers || 0 },
        { label: t('team.info.research_speed'), value: '× ' + (engineerBonus.speedMult || 1).toFixed(2), valueColor: engineerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: t('team.info.extra_res_slots'), value: '+' + (engineerBonus.extraSlots || 0), valueColor: engineerBonus.extraSlots > 0 ? 'var(--success)' : 'var(--text-dim)' },
        { label: t('team.info.os_speed'), value: '× ' + (osBonus || 1).toFixed(2), valueColor: osBonus > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: t('team.info.extra_os_slots'), value: '+' + (osSlots || 0), valueColor: osSlots > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const desSec = section(t('team.info.des_section'), 'palette', '#a78bfa', [
        { label: t('team.info.des_count'), value: counts.designers || 0 },
        { label: t('team.info.product_speed'), value: '× ' + (designerBonus.speedMult || 1).toFixed(2), valueColor: designerBonus.speedMult > 1 ? 'var(--success)' : 'var(--text-dim)' },
        { label: t('team.info.quality_bonus'), value: '+' + (designerBonus.qualityBonus || 0).toFixed(1) + ' ' + pointsUnit, valueColor: designerBonus.qualityBonus > 0 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const mktSec = section(t('team.info.mkt_section'), 'signal', '#34d399', [
        { label: t('team.info.mkt_count'), value: counts.marketers || 0 },
        { label: t('team.info.campaign_bonus'), value: '× ' + (marketerBonus || 1).toFixed(2), valueColor: marketerBonus > 1 ? 'var(--success)' : 'var(--text-dim)' }
    ]);

    const moraleColor = moraleAvg >= 70 ? 'var(--success)' : moraleAvg >= 40 ? 'var(--warn)' : 'var(--danger)';

    const extraSec = section(t('team.info.summary_section'), 'activity', 'var(--accent)', [
        { label: t('team.info.total_staff'), value: staff.length },
        { label: t('team.info.total_salary'), value: '$' + (totalSalary || 0).toLocaleString('en-US') },
        { label: t('team.info.avg_morale'), value: moraleAvg + '/100', valueColor: moraleColor }
    ]);

    const tips = '<div class="card">' +
        '<div class="card-title" style="display:flex;align-items:center;gap:6px;">' + renderIcon('sparkles', 12) + escapeHtml(t('team.tips.title')) + '</div>' +
        '<div style="font-size:12px;color:var(--text-dim);line-height:1.6;">' +
            '• ' + escapeHtml(t('team.tips.l1')) + '<br>' +
            '• ' + escapeHtml(t('team.tips.l2')) + '<br>' +
            '• ' + escapeHtml(t('team.tips.l3')) + '<br>' +
            '• ' + escapeHtml(t('team.tips.l4')) +
        '</div>' +
        '</div>';

    return engSec + desSec + mktSec + extraSec + tips;
}

// ---------- Progres skill & tawar gaji (v2027.10d) ----------
function _rosterStyle() {
    return '<style>' +
        '.skill-prog{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:10.5px;color:var(--text-tertiary);}' +
        '.skill-prog-track{flex:1;max-width:120px;height:4px;border-radius:2px;background:var(--bg-3);overflow:hidden;}' +
        '.skill-prog-fill{height:100%;background:var(--accent);border-radius:2px;}' +
    '</style>';
}

function _progressHtml(s) {
    const skill = s.skill || 1;
    if (skill >= 5) {
        return '<div class="skill-prog"><span>' + escapeHtml(_tf('team.roster.max_tier', 'Tier maksimum')) + '</span></div>';
    }
    const pct = Math.max(0, Math.min(100, s.skillProgress || 0));
    const next = getSkillTier(skill + 1);
    return '<div class="skill-prog">' +
        '<div class="skill-prog-track"><div class="skill-prog-fill" style="width:' + pct.toFixed(0) + '%;"></div></div>' +
        '<span>' + escapeHtml(_tf('team.roster.next_tier', 'Menuju')) + ' ' + escapeHtml(_tierLabel(next, skill + 1)) + ' · ' + Math.round(pct) + '%</span>' +
    '</div>';
}

function _negotiateHtml(c) {
    const ts = window.__game && window.__game.teamSystem;
    if (!ts || typeof ts.negotiateCandidate !== 'function') return '';
    if (c.negotiated) {
        return '<div class="cand-modal-note"><span>' + escapeHtml(_tf('team.nego.done', 'Kandidat ini sudah tidak bisa ditawar lagi.')) + '</span></div>';
    }
    const light = Math.round(ts.negotiationOdds(c, 'light') * 100);
    const hard = Math.round(ts.negotiationOdds(c, 'hard') * 100);
    return '<div class="cand-modal-section-title">' + renderIcon('coin', 11) + escapeHtml(_tf('team.nego.title', 'Tawar gaji')) + '</div>' +
        '<div class="nego-row">' +
            '<button class="btn-secondary" data-team-action="negotiate" data-level="light" data-candidate-id="' + c.id + '">' +
                escapeHtml(_tf('team.nego.light', 'Ringan −5%')) + ' · ' + light + '%</button>' +
            '<button class="btn-secondary" data-team-action="negotiate" data-level="hard" data-candidate-id="' + c.id + '">' +
                escapeHtml(_tf('team.nego.hard', 'Keras −12%')) + ' · ' + hard + '%</button>' +
        '</div>' +
        '<div class="nego-hint">' + escapeHtml(_tf('team.nego.hint', 'Kalau ditolak, kandidat mundur dari pool. Hanya bisa sekali, potongan maks 15%.')) + '</div>';
}


// ---------- Antrean onboarding (24 jam game) ----------
// Kandidat yang sudah menerima tawaran tampil di sini sampai waktunya bergabung.
function _renderPending(data, teamSystem) {
    const list = (teamSystem && teamSystem.getPendingHires) ? teamSystem.getPendingHires() : (data.pendingHires || []);
    if (!list.length) return '';

    const rows = list.map(function (p) {
        const s = p.staff || {};
        const role = getRoleById(s.role);
        const hours = (teamSystem && teamSystem.pendingHoursLeft) ? teamSystem.pendingHoursLeft(p) : 0;
        const etaText = _tf('team.pending.eta', 'Bergabung dalam {h} jam game').replace('{h}', String(hours));
        return '<div class="cand-row" style="opacity:.85;cursor:default;">' +
            '<div class="cand-row-main">' +
                '<div class="cand-row-head">' +
                    '<span class="cand-row-name">' + escapeHtml(s.name || '?') + '</span>' +
                    (s.countryFlag ? '<span class="cand-row-flag">' + s.countryFlag + '</span>' : '') +
                '</div>' +
                '<div class="cand-row-meta">' +
                    '<span style="color:' + (role.color || 'inherit') + ';font-weight:600;">' + escapeHtml(_roleLabel(role)) + '</span>' +
                    '<span class="cand-row-dot">·</span>' +
                    '<span>' + escapeHtml(etaText) + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    return '<div class="recruit-pending">' +
        '<div class="recruit-next">' + escapeHtml(_tf('team.pending.title', 'Sedang onboarding')) + ' (' + list.length + ')</div>' +
        rows +
    '</div>';
}
