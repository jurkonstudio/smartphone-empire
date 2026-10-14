// FILE: src/ui/panels/HqPanel.js
// v2027.27a — Hapus sub-tab Campus (dipindah ke Home 3D map).
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

const HQ_TABS = [
    { id: 'overview', key: 'hq.tab.overview', icon: 'activity' },
    { id: 'team',     key: 'hq.tab.team',     icon: 'users' }
];

export function renderHqPanel({ subtab, state, timeSnapshot, researchSystem, teamSystem }) {
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
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}
