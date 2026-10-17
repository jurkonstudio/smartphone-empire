// FILE: src/ui/panels/HqPanel.js
// v2027.30a — tab Office placeholder full-height.
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderExchangePanel } from './ExchangePanel.js';
import { renderBankPanel } from './BankPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

const HQ_TABS = [
    { id: 'office',   key: 'hq.tab.office',   icon: 'building' },
    { id: 'overview', key: 'hq.tab.overview', icon: 'activity' },
    { id: 'team',     key: 'hq.tab.team',     icon: 'users' },
    { id: 'exchange', key: 'hq.tab.exchange', icon: 'trending-up' },
    { id: 'bank',     key: 'hq.tab.bank',     icon: 'coin' }
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
    } else if (subtab === 'bank') {
        body = renderBankPanel();
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}

// ============================================================
// PLACEHOLDER OFFICE — 3D scene akan ditambahkan di sesi berikutnya.
// Kontainer full-height supaya 3D map bisa lega sampai bawah layar.
// ============================================================
function _renderOfficePlaceholder() {
    return '<div class="office-placeholder" style="' +
                'min-height:calc(100vh - 220px);' +
                'display:flex;' +
                'flex-direction:column;' +
                'align-items:center;' +
                'justify-content:center;' +
                'text-align:center;' +
                'padding:40px 20px;' +
                'background:linear-gradient(180deg, rgba(79,140,255,0.06) 0%, rgba(79,140,255,0.02) 100%);' +
                'border:1px dashed rgba(79,140,255,0.25);' +
                'border-radius:14px;' +
                'margin-top:4px;' +
            '">' +
        '<div style="font-size:64px;line-height:1;margin-bottom:16px;">🏢</div>' +
        '<div style="font-size:17px;font-weight:800;margin-bottom:8px;">' +
            t('hq.office.title') + '</div>' +
        '<div style="font-size:12.5px;color:var(--text-mute);line-height:1.65;max-width:340px;">' +
            t('hq.office.desc') + '</div>' +
        '<div style="margin-top:24px;font-size:11px;color:var(--text-mute);opacity:0.7;letter-spacing:0.5px;">' +
            '🚧 3D MAP · COMING SOON' +
        '</div>' +
    '</div>';
}
