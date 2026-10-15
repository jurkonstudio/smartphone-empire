// FILE: src/ui/panels/HqPanel.js
// v2027.28a — tambah tab Exchange.
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderExchangePanel } from './ExchangePanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

const HQ_TABS = [
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
    if (subtab === 'team') {
        body = renderTeamPanel({ teamSystem: teamSystem });
    } else if (subtab === 'exchange') {
        body = renderExchangePanel({ stockSystem: stockSystem });
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}
