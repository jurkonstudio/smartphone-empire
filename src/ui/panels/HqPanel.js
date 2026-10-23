// FILE: src/ui/panels/HqPanel.js
// v2027.50a — tab Office kini memuat Office 3D Map (lihat ui/office/OfficeMap.js).
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderExchangePanel } from './ExchangePanel.js';
import { renderBankPanel } from './BankPanel.js';
import { renderInvestPanel } from './InvestPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderCompanyHistoryPanel } from './CompanyHistoryPanel.js';

// Label tab HQ; jika kunci i18n belum ada, pakai fallback.
function _tabLabel(tab) {
    var v = t(tab.key);
    return (v && v !== tab.key) ? v : (tab.fallback || tab.key);
}
import { t } from '../../core/LanguageService.js';
import { renderOfficeLoading } from '../office/OfficeMap.js';

const HQ_TABS = [
    { id: 'office',   key: 'hq.tab.office',   icon: 'building' },
    { id: 'overview', key: 'hq.tab.overview', icon: 'activity' },
    { id: 'team',     key: 'hq.tab.team',     icon: 'users' },
    { id: 'exchange', key: 'hq.tab.exchange', icon: 'trending-up' },
    { id: 'bank',     key: 'hq.tab.bank',     icon: 'coin' },
    { id: 'invest',   key: 'hq.tab.invest',   icon: 'trending-up', fallback: 'Investasi' },
    { id: 'history',  key: 'hq.tab.history',  icon: 'library', fallback: 'Riwayat' }
];

export function renderHqPanel({ subtab, state, timeSnapshot, researchSystem, teamSystem, stockSystem }) {
    var tabBar = '<div class="subtab-bar">' +
        HQ_TABS.map(function (tab) {
            var cls = 'subtab-btn' + (subtab === tab.id ? ' active' : '');
            return '<button class="' + cls + '" data-hq-subtab="' + tab.id + '">' +
                renderIcon(tab.icon, 13) +
                '<span style="margin-left:4px;">' + _tabLabel(tab) + '</span>' +
                '</button>';
        }).join('') +
        '</div>';

    var body = '';
    if (subtab === 'office') {
        body = _renderOfficeMap();
    } else if (subtab === 'team') {
        body = renderTeamPanel({ teamSystem: teamSystem });
    } else if (subtab === 'exchange') {
        body = renderExchangePanel({ stockSystem: stockSystem });
    } else if (subtab === 'bank') {
        body = renderBankPanel();
    } else if (subtab === 'invest') {
        body = renderInvestPanel();
    } else if (subtab === 'history') {
        body = renderCompanyHistoryPanel();
    } else {
        body = renderDashboard(state, timeSnapshot, researchSystem, teamSystem);
    }
    return tabBar + body;
}

// ============================================================
// OFFICE 3D MAP — wadah peta. main.js memanggil mountOfficeMap() pada #office-map
// setelah HTML dipasang. Class "home-map" dipakai ulang: sudah bebas dari swipe-tab
// (SwipeService), position:relative, overflow hidden, dan touch-action:none.
// ============================================================
function _renderOfficeMap() {
    return '<div id="office-map" class="home-map office-map" style="' +
                'flex:none;' +
                'height:max(380px, calc(100dvh - 235px));' +
                'margin-top:4px;' +
                'border-radius:14px;' +
                'border:1px solid var(--border);' +
                'background:linear-gradient(180deg, var(--accent-soft) 0%, transparent 100%);' +
            '">' + renderOfficeLoading() + '</div>';
}
