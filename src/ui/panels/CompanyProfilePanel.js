// FILE: src/ui/panels/CompanyProfilePanel.js
// v2027.46 — Menambahkan tombol pintas "Kirim SIL" di tab Pemain.
import { gIcon } from '../icons/GameIcons.js';
import { t } from '../../core/LanguageService.js';
import { CloudService } from '../../services/CloudService.js';
import { getCloudSummary, openCloudPanel } from '../../services/cloud/CloudUI.js';
import { isCloudConfigured } from '../../services/cloud/supabase.config.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { avatarHtml, esc } from '../social/AvatarView.js';
import { openEditCompanyNameModal, openEditPlayerModal } from '../social/ProfileEditModals.js';
import { openPlayerListModal } from '../social/PlayerListPanel.js';
import { compactNumber } from '../social/PlayerProfileModal.js';
import { PlayerProfileService, NAME_RULES } from '../../systems/PlayerProfileService.js';
import { pidTf, getCachedMyPublicId, loadMyPublicId, copyPublicId } from '../social/PlayerIdView.js';
import { openSiliconStoreModal } from './SiliconStorePanel.js'; // IMPORT BARU

var _tab = 'company';
var _boundRoot = null;

export function setProfileTab(id) { _tab = (id === 'player') ? 'player' : 'company'; }

function _fmtMoney(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '$0';
    return '$' + Math.round(n).toLocaleString('en-US');
}

const DIFF_LABEL = {
    santai: { key: 'settings.difficulty.santai', color: 'var(--success)' },
    normal: { key: 'settings.difficulty.normal', color: 'var(--info)' },
    sulit:  { key: 'settings.difficulty.sulit',  color: 'var(--danger)' }
};

const ERA_LABEL = {
    feature_phone:     'profile.era.feature_phone',
    touch_revolution:  'profile.era.touch_revolution',
    modern_smartphone: 'profile.era.modern_smartphone',
    ai_ecosystem:      'profile.era.ai_ecosystem'
};

function _tone(v) { return v >= 70 ? 'good' : v >= 40 ? 'mid' : 'bad'; }

function _meter(label, value, suffix) {
    var v = Math.max(0, Math.min(100, Number(value) || 0));
    return '<div class="pf-meter">' +
        '<div class="pf-meter-head"><span>' + esc(label) + '</span><b>' + esc(Math.round(v) + (suffix || '/100')) + '</b></div>' +
        '<div class="pf-meter-track"><div class="pf-meter-fill is-' + _tone(v) + '" style="width:' + v + '%;"></div></div>' +
    '</div>';
}

function _tabs() {
    function btn(id, icon, key) {
        return '<button class="settings-tab' + (_tab === id ? ' active' : '') + '" data-pf-tab="' + id + '" type="button">' +
            renderIcon(icon, 13) + '<span>' + esc(t(key)) + '</span></button>';
    }
    return '<div class="settings-tabs pf-tabs">' + btn('company', 'building', 'pp.tab.company') + btn('player', 'portrait', 'pp.tab.player') + '</div>';
}

function _cloudCard() {
    var status = CloudService.getStatus();
    var keyMap = {
        disconnected: 'profile.cloud_disconnected', connecting: 'profile.cloud_connecting',
        connected: 'profile.cloud_connected', error: 'profile.cloud_error'
    };
    var color = status === 'connected' ? 'var(--success)' : status === 'connecting' ? 'var(--warn)' :
                status === 'error' ? 'var(--danger)' : 'var(--text-tertiary)';
    var summary = isCloudConfigured() ? getCloudSummary() : t('profile.cloud_disconnected');

    return '<div class="card pf-card">' +
        '<div class="card-title">' + esc(t('profile.cloud_title')) + '</div>' +
        '<div class="pf-cloud-row">' +
            '<span class="pf-cloud-label">' + esc(t('profile.cloud_status')) + '</span>' +
            '<span class="pf-cloud-state" style="color:' + color + ';"><i style="background:' + color + ';"></i>' + esc(t(keyMap[status] || keyMap.disconnected)) + '</span>' +
        '</div>' +
        '<div class="pf-cloud-sum">' + esc(summary) + '</div>' +
        '<button class="btn-primary pf-btn-block" data-cloud-open type="button">' +
            (status === 'connected' ? '☁️ ' : '') + esc(t('profile.cloud_btn')) + '</button>' +
    '</div>';
}

function _companyTab(params) {
    var teamSystem = params.teamSystem;
    var opinionSystem = params.opinionSystem;
    var data = window.__game.state.get();
    var cat = data.products.catalog || [];

    var totalRevenue = cat.reduce(function (s, p) { return s + (p.totalRevenue || 0); }, 0);
    var totalSold    = cat.reduce(function (s, p) { return s + (p.totalSold || 0); }, 0);
    var activeProducts = cat.filter(function (p) { return p.status === 'selling'; }).length;

    var staffCount = (data.staff || []).length;
    var monthlySalary = teamSystem ? teamSystem.getTotalSalary() : 0;
    var avgMorale = teamSystem ? teamSystem.getAverageMorale() : 0;
    var reputation = (data.market && typeof data.market.reputation === 'number') ? data.market.reputation : 0;
    var sentiment = opinionSystem ? opinionSystem.getSentiment() : 50;
    var marketShare = data.market.share || 0;

    var milestones = (data.milestones || []).slice().reverse();
    var diff = DIFF_LABEL[data.difficulty] || DIFF_LABEL.normal;

    var comps = (data.market.competitors || []).slice().sort(function (a, b) { return b.share - a.share; });
    var rank = 1 + comps.filter(function (c) { return c.share > marketShare; }).length;
    var totalCompanies = 1 + comps.length;

    var hero =
        '<div class="pf-hero">' +
            '<div class="pf-hero-top">' +
                '<div class="pf-logo">' + esc((data.companyName || '?').charAt(0).toUpperCase()) + '</div>' +
                '<div class="pf-hero-info">' +
                    '<div class="pf-name">' + esc(data.companyName) + '</div>' +
                    '<div class="pf-tags">' +
                        '<span class="pf-tag"><i style="background:' + diff.color + ';"></i>' + esc(t(diff.key)) + '</span>' +
                        '<span class="pf-tag">' + esc(t(ERA_LABEL[data.era] || ERA_LABEL.modern_smartphone)) + '</span>' +
                        '<span class="pf-tag">' + esc(data.time.currentYear) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="pf-stats">' +
                '<div class="pf-stat"><div class="pf-stat-label">' + esc(t('pp.kpi.cash')) + '</div><div class="pf-stat-value">' + esc(_fmtMoney(data.cash)) + '</div></div>' +
                '<div class="pf-stat"><div class="pf-stat-label">' + esc(t('profile.kpi_rank')) + '</div><div class="pf-stat-value">#' + rank + '<small>/' + totalCompanies + '</small></div></div>' +
                '<div class="pf-stat"><div class="pf-stat-label">' + esc(t('profile.kpi_share')) + '</div><div class="pf-stat-value">' + (marketShare * 100).toFixed(1) + '%</div></div>' +
            '</div>' +
        '</div>';

    var kpis =
        '<div class="kpi-grid">' +
            '<div class="kpi green"><div class="kpi-label">' + esc(t('profile.kpi_revenue')) + '</div><div class="kpi-value" style="font-size:15px;">' + esc(_fmtMoney(totalRevenue)) + '</div></div>' +
            '<div class="kpi blue"><div class="kpi-label">' + esc(t('profile.kpi_sold')) + '</div><div class="kpi-value" style="font-size:15px;">' + esc(totalSold.toLocaleString('en-US')) + '</div></div>' +
            '<div class="kpi warn"><div class="kpi-label">' + esc(t('pp.kpi.products')) + '</div><div class="kpi-value" style="font-size:15px;">' + activeProducts + '<small class="pf-dim"> / ' + cat.length + '</small></div></div>' +
            '<div class="kpi"><div class="kpi-label">' + esc(t('pp.kpi.staff')) + '</div><div class="kpi-value" style="font-size:15px;">' + staffCount + '</div></div>' +
        '</div>';

    var health =
        '<div class="card pf-card">' +
            '<div class="card-title">' + esc(t('pp.section.health')) + '</div>' +
            _meter(t('pp.meter.morale'), avgMorale) +
            _meter(t('pp.meter.reputation'), reputation) +
            _meter(t('pp.meter.sentiment'), sentiment) +
            '<div class="sum-row" style="margin-top:6px;"><span>' + esc(t('profile.ops_salary')) + '</span><b>' + esc(_fmtMoney(monthlySalary)) + '</b></div>' +
        '</div>';

    var msHtml = milestones.length
        ? milestones.map(function (m) {
            return '<div class="pf-ms"><span class="pf-ms-year">' + esc(m.year) + '</span><span class="pf-ms-text">' + esc(m.text) + '</span></div>';
        }).join('')
        : '<div class="log-empty">' + esc(t('profile.milestones_empty')) + '</div>';

    var ms =
        '<div class="card pf-card">' +
            '<div class="card-title">' + esc(t('profile.milestones', { n: milestones.length })) + '</div>' +
            '<div class="pf-timeline">' + msHtml + '</div>' +
        '</div>';

    return hero + kpis + health + ms + _cloudCard();
}

function _playerTab(params) {
    var data = window.__game.state.get();
    var player = PlayerProfileService.getPlayer();
    var info = PlayerProfileService.getNameChangeInfo();
    var stats = PlayerProfileService.getStatsSnapshot();
    var connected = CloudService.getStatus() === 'connected' && !!CloudService.getUserId();
    var playerName = player.displayName || t('pp.player.default_name');

    var badge = info.cost > 0
        ? '<span class="pf-badge pf-badge-sil">' + gIcon('sil', 13) + ' ' + esc(t('pp.company.paid_badge', { cost: info.cost })) + '</span>'
        : '<span class="pf-badge pf-badge-free">' + esc(t('pp.company.free_left', { n: info.freeLeft })) + '</span>';

    var hero =
        '<div class="pf-hero pf-hero-player">' +
            '<button class="pf-avatar-btn" data-pf="edit-player" type="button" aria-label="' + esc(t('pp.player.edit')) + '">' +
                avatarHtml({ src: player.avatar, name: player.displayName || data.companyName, size: 88, cls: 'pp-avatar-lg', edit: true }) +
            '</button>' +
            '<div class="pf-player-name">' + esc(playerName) + '</div>' +
            '<div class="pf-player-company">' + renderIcon('building', 12) + '<span>' + esc(data.companyName) + '</span></div>' +
            '<div class="pf-tags pf-tags-center">' +
                '<span class="pf-tag">' + gIcon('sil', 13) + ' ' + esc(info.balance) + ' SIL</span>' +
                '<span class="pf-tag"><i style="background:' + (connected ? 'var(--success)' : 'var(--text-tertiary)') + ';"></i>' +
                    esc(t(connected ? 'profile.cloud_connected' : 'profile.cloud_disconnected')) + '</span>' +
            '</div>' +
            '<div class="pf-actions" style="display:flex; flex-wrap:wrap; gap:8px;">' +
                '<button class="btn-primary" data-pf="edit-player" type="button" style="flex:1;">' + esc(t('pp.player.edit')) + '</button>' +
                '<button class="btn-secondary" data-pf="leaderboard" type="button" style="flex:1;">🏆 ' + esc(t('pp.lb.title')) + '</button>' +
                // TOMBOL BARU: KIRIM SIL
                '<button class="btn-secondary" data-pf="transfer-sil" type="button" style="flex:1; background:var(--accent); color:#fff; border:none;">' + gIcon('sil', 16) + ' Kirim SIL</button>' +
            '</div>' +
        '</div>';

    var myId = connected ? getCachedMyPublicId() : null;
    if (connected && !myId) loadMyPublicId();
    var idCard =
        '<div class="card pf-card pf-id-wrap">' +
            '<button class="pf-id-card' + (connected ? '' : ' is-off') + '" data-pf="copy-id" type="button"' + (connected ? '' : ' disabled') + '>' +
                '<span class="pf-id-ico">' + renderIcon('portrait', 16) + '</span>' +
                '<span class="pf-id-main">' +
                    '<span class="pf-id-label">' + esc(pidTf('pp.id.label', 'ID Pemain')) + '</span>' +
                    '<span class="pf-id-value" data-player-public-id>' + esc(connected ? (myId || '…') : '—') + '</span>' +
                '</span>' +
                (connected ? '<span class="pf-id-copy">' + esc(pidTf('pp.id.copy', 'Salin')) + '</span>' : '') +
            '</button>' +
            '<div class="pf-hint">' + esc(connected
                ? pidTf('pp.id.hint', 'Pemain lain bisa melihat ID ini di profil publikmu. Pakai ID ini saat top-up SIL di web.')
                : pidTf('pp.id.hint_off', 'Masuk akun cloud untuk mendapatkan ID Pemain.')) + '</div>' +
        '</div>';

    var company =
        '<div class="card pf-card">' +
            '<div class="card-title">' + esc(t('pp.company.title')) + '</div>' +
            '<div class="pf-company-row">' +
                '<div class="pf-company-main">' +
                    '<div class="pf-company-name">' + esc(data.companyName) + '</div>' +
                    '<div class="pf-company-meta">' + badge + '<span>' + esc(t('pp.company.changes_done', { n: info.used })) + '</span></div>' +
                '</div>' +
                '<button class="btn-secondary pf-btn-sm" data-pf="edit-company" type="button">' + esc(t('pp.company.change')) + '</button>' +
            '</div>' +
            '<div class="pf-hint">' + esc(info.cost > 0
                ? t('pp.company.rule_paid', { cost: NAME_RULES.silCost })
                : t('pp.company.rule_free', { n: info.freeLeft, cost: NAME_RULES.silCost })) + '</div>' +
        '</div>';

    function mini(label, value) {
        return '<div class="pf-mini"><div class="pf-mini-label">' + esc(label) + '</div><div class="pf-mini-value">' + esc(value) + '</div></div>';
    }
    var statsCard =
        '<div class="card pf-card">' +
            '<div class="card-title">' + esc(t('pp.stats.title')) + '</div>' +
            '<div class="pf-mini-grid">' +
                mini(t('pp.stats.revenue'), '$' + compactNumber(stats.revenue)) +
                mini(t('pp.stats.sold'), compactNumber(stats.sold)) +
                mini(t('pp.stats.reputation'), stats.reputation.toFixed(1)) +
                mini(t('pp.stats.share'), stats.share.toFixed(1) + '%') +
            '</div>' +
            '<div class="pf-hint">' + esc(t('pp.stats.hint')) + ' ' + esc(t(connected ? 'pp.player.cloud_on' : 'pp.player.cloud_off')) + '</div>' +
        '</div>';

    return hero + idCard + company + statsCard + _cloudCard();
}

export function renderCompanyProfilePanel(params) {
    params = params || {};
    return _tabs() + (_tab === 'player' ? _playerTab(params) : _companyTab(params));
}

export function bindCompanyProfileActions(root) {
    if (!root || _boundRoot === root) return;
    _boundRoot = root;

    root.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-pf-tab]');
        if (tab) { e.preventDefault(); _tab = tab.dataset.pfTab === 'player' ? 'player' : 'company'; window.__game.render(); return; }

        var act = e.target.closest('[data-pf]');
        if (act) {
            e.preventDefault();
            var a = act.dataset.pf;
            if (a === 'edit-player') openEditPlayerModal();
            else if (a === 'edit-company') openEditCompanyNameModal();
            else if (a === 'leaderboard') openPlayerListModal();
            else if (a === 'copy-id') copyPublicId(getCachedMyPublicId());
            else if (a === 'transfer-sil') openSiliconStoreModal('transfer'); // BUKA TAB TRANSFER
            return;
        }

        var cloud = e.target.closest('[data-cloud-open]');
        if (cloud) { e.preventDefault(); openCloudPanel(); }
    });
}
