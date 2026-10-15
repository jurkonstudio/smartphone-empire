// FILE: src/ui/panels/HqPanel.js
// v2027.29a — tambah tab Office (placeholder).
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderExchangePanel } from './ExchangePanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

const HQ_TABS = [
    { id: 'office',   key: 'hq.tab.office',   icon: 'building' },
    { id: 'overview', key: 'hq.tab.overview', icon: 'activity' },
    { id: 'team',     key: 'hq.tab.team',     icon: 'users' },
    { id: 'exchange', key: 'hq.tab.exchange', icon: 'trending-up' }
];

export function renderHqPanel({ subtab, state, timeSnapshot, researchSystem, teamSystem, stockSystem }) {
    var tabBar = '<div class="subtab-bar">' +
        HQ_TABS.map(function (tab) {
            var cls = 'subtab-btn' + (subtab === tab.id ? ' active' : '');
            return '<button class="' + cls + '" data-hq-subtab="' + tab.id + '">' +
                renderIcon(tab.icon, 13) +
                '<span style="margin-left:4px;">' + t(tab.key) + '</span>' +
                '</button>';
        }).join('') +
        '</div>';

    var body = '';
    if (subtab === 'office') {
        body = _renderOfficePlaceholder();
    } else if (subtab === 'team') {
        body = renderTeamPanel({ teamSystem: teamSystem });
    } else if (subtab === 'exchange') {
        body = renderExchangePanel({ stockSystem: stockSystem });
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}

// ============================================================
// PLACEHOLDER OFFICE — 3D scene akan ditambahkan di sesi berikutnya.
// ============================================================
function _renderOfficePlaceholder() {
    return '<div class="card" style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:52px;line-height:1;margin-bottom:14px;">🏢</div>' +
        '<div style="font-size:16px;font-weight:800;margin-bottom:6px;">' +
            t('hq.office.title') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-mute);line-height:1.6;max-width:320px;margin:0 auto;">' +
            t('hq.office.desc') + '</div>' +
    '</div>';
}
