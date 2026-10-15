// FILE: src/ui/panels/CompanyProfilePanel.js
// v2027.15a — cloud summary + tombol buka CloudUI.
import { t } from '../../core/LanguageService.js';
import { CloudService } from '../../services/CloudService.js';
import { getCloudSummary, openCloudPanel } from '../../services/cloud/CloudUI.js';
import { isCloudConfigured } from '../../services/cloud/supabase.config.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

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

export function renderCompanyProfilePanel(params) {
    var teamSystem = params.teamSystem;
    var opinionSystem = params.opinionSystem;

    const data = window.__game.state.get();
    const tSnap = data.time;

    const totalRevenue = (data.products.catalog || []).reduce(function (s, p) { return s + (p.totalRevenue || 0); }, 0);
    const totalSold    = (data.products.catalog || []).reduce(function (s, p) { return s + (p.totalSold || 0); }, 0);
    const activeProducts = (data.products.catalog || []).filter(function (p) { return p.status === 'selling'; }).length;
    const totalProducts  = (data.products.catalog || []).length;

    const staffCount = (data.staff || []).length;
    const monthlySalary = teamSystem ? teamSystem.getTotalSalary() : 0;
    const avgMorale = teamSystem ? teamSystem.getAverageMorale() : 0;

    const reputation = (data.market && typeof data.market.reputation === 'number') ? data.market.reputation : 0;
    const sentiment = opinionSystem ? opinionSystem.getSentiment() : 50;
    const marketShare = data.market.share || 0;

    const milestones = (data.milestones || []).slice().reverse();
    const diffInfo = DIFF_LABEL[data.difficulty] || DIFF_LABEL.normal;

    const competitorsList = (data.market.competitors || []).slice().sort(function (a, b) { return b.share - a.share; });
    const playerRank = 1 + competitorsList.filter(function (c) { return c.share > marketShare; }).length;
    const totalCompanies = 1 + competitorsList.length;

    const headerCard = `
        <div class="profile-hero">
            <div class="profile-logo">${escapeHtml(data.companyName.charAt(0).toUpperCase())}</div>
            <div class="profile-name">${escapeHtml(data.companyName)}</div>
            <div class="profile-meta">
                <span class="profile-difficulty" style="color:${diffInfo.color};">● ${t(diffInfo.key)}</span>
                <span>•</span>
                <span>${t('profile.founded')}</span>
            </div>
            <div class="profile-era">
                ${t(ERA_LABEL[data.era] || 'profile.era.modern_smartphone')} • ${tSnap.currentYear}
            </div>
        </div>
    `;

    const kpis = `
        <div class="kpi-grid">
            <div class="kpi green">
                <div class="kpi-label">${t('profile.kpi_revenue')}</div>
                <div class="kpi-value" style="font-size:15px;">${_fmtMoney(totalRevenue)}</div>
            </div>
            <div class="kpi blue">
                <div class="kpi-label">${t('profile.kpi_sold')}</div>
                <div class="kpi-value" style="font-size:15px;">${totalSold.toLocaleString('en-US')}</div>
            </div>
            <div class="kpi warn">
                <div class="kpi-label">${t('profile.kpi_rank')}</div>
                <div class="kpi-value">#${playerRank}<span style="font-size:12px;color:var(--text-dim);">/${totalCompanies}</span></div>
            </div>
            <div class="kpi">
                <div class="kpi-label">${t('profile.kpi_share')}</div>
                <div class="kpi-value" style="font-size:15px;">${(marketShare * 100).toFixed(1)}%</div>
            </div>
        </div>
    `;

    const moraleColor = avgMorale >= 70 ? 'var(--success)' : avgMorale >= 40 ? 'var(--warn)' : 'var(--danger)';

    const opsCard = `
        <div class="card">
            <div class="card-title">${t('profile.ops_title')}</div>
            <div class="sum-row"><span>${t('profile.ops_cash')}</span><b>${_fmtMoney(data.cash)}</b></div>
            <div class="sum-row"><span>${t('profile.ops_active')}</span><b>${activeProducts} / ${totalProducts}</b></div>
            <div class="sum-row"><span>${t('profile.ops_staff')}</span><b>${t('profile.ops_staff_unit', { n: staffCount })}</b></div>
            <div class="sum-row"><span>${t('profile.ops_salary')}</span><b>${_fmtMoney(monthlySalary)}</b></div>
            <div class="sum-row"><span>${t('profile.ops_morale')}</span><b style="color:${moraleColor};">${avgMorale}/100</b></div>
            <div class="sum-row"><span>${t('profile.ops_rep')}</span><b>${Number(reputation).toFixed(1)}/100</b></div>
            <div class="sum-row"><span>${t('profile.ops_sentiment')}</span><b>${sentiment}/100</b></div>
        </div>
    `;

    const milestonesHtml = milestones.length
        ? milestones.map(function (m) {
            return '<div class="ms-row">' +
                '<span class="ms-year">' + m.year + '</span>' +
                '<span class="ms-text">' + escapeHtml(m.text) + '</span>' +
                '</div>';
        }).join('')
        : '<div class="log-empty">' + t('profile.milestones_empty') + '</div>';

    const milestonesCard = `
        <div class="card">
            <div class="card-title">${t('profile.milestones', { n: milestones.length })}</div>
            ${milestonesHtml}
        </div>
    `;

    // ---- Cloud card (pakai API Claude) ----
    const cloudStatus = CloudService.getStatus();
    const cloudKeyMap = {
        disconnected: 'profile.cloud_disconnected',
        connecting:   'profile.cloud_connecting',
        connected:    'profile.cloud_connected',
        error:        'profile.cloud_error'
    };
    const cloudLabel = t(cloudKeyMap[cloudStatus] || 'profile.cloud_disconnected');
    const cloudColor = cloudStatus === 'connected' ? 'var(--success)' :
                       cloudStatus === 'connecting' ? 'var(--warn)' :
                       cloudStatus === 'error' ? 'var(--danger)' : 'var(--text-mute)';
    const cloudSummary = isCloudConfigured() ? getCloudSummary() : t('profile.cloud_disconnected');

    const cloudCard = `
        <div class="card">
            <div class="card-title">${t('profile.cloud_title')}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-size:13px;color:var(--text-dim);">${t('profile.cloud_status')}</div>
                <div style="font-size:13px;font-weight:700;color:${cloudColor};">${cloudLabel}</div>
            </div>
            <div style="font-size:11.5px;color:var(--text-mute);line-height:1.5;margin-bottom:10px;">
                ${escapeHtml(cloudSummary)}
            </div>
            <button class="btn-primary" data-cloud-open style="width:100%;font-size:12px;padding:10px;font-weight:700;">
                ${cloudStatus === 'connected' ? '☁️ ' + t('profile.cloud_btn') : t('profile.cloud_btn')}
            </button>
        </div>
    `;

    return headerCard + kpis + opsCard + milestonesCard + cloudCard;
}

export function bindCompanyProfileActions(root) {
    if (!root) return;
    root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-cloud-open]');
        if (!btn) return;
        e.preventDefault();
        openCloudPanel();
    });
}
