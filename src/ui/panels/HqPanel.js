// FILE: src/ui/panels/HqPanel.js
// ============================================================
// HqPanel — orchestrator halaman HQ.
// Sub-tab: Overview (dashboard), Campus (3D map placeholder), Team (staff scroll).
// ============================================================
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';

const HQ_TABS = [
    { id: 'overview', label: 'Overview', icon: 'activity' },
    { id: 'campus',   label: 'Campus',   icon: 'layers' },
    { id: 'team',     label: 'Team',     icon: 'users' }
];

export function renderHqPanel({ subtab, state, timeSnapshot, researchSystem, teamSystem }) {
    var tabBar = '<div class="subtab-bar">' +
        HQ_TABS.map(function (t) {
            var cls = 'subtab-btn' + (subtab === t.id ? ' active' : '');
            return '<button class="' + cls + '" data-hq-subtab="' + t.id + '">' +
                renderIcon(t.icon, 13) +
                '<span style="margin-left:4px;">' + t.label + '</span>' +
                '</button>';
        }).join('') +
        '</div>';

    var body = '';
    if (subtab === 'campus') {
        body = _renderCampusPlaceholder();
    } else if (subtab === 'team') {
        body = renderTeamPanel({ teamSystem: teamSystem });
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}

function _renderCampusPlaceholder() {
    return '<div class="card" style="text-align:center;padding:48px 20px;">' +
        '<div style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:20px;background:var(--accent-soft);color:var(--accent);margin-bottom:16px;">' +
            renderIcon('layers', 36) +
        '</div>' +
        '<div style="font-size:16px;font-weight:700;margin-bottom:6px;letter-spacing:-0.01em;">Campus 3D Map</div>' +
        '<div style="font-size:12.5px;color:var(--text-tertiary);line-height:1.5;max-width:300px;margin:0 auto;">' +
            'Peta 3D kantor pusat dan sistem upgrade gedung akan tersedia di update berikutnya.' +
        '</div>' +
        '</div>';
}
