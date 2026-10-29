// FILE: src/ui/panels/HqPanel.js  (REPLACE — v2027.64: tampilan tab HQ lebih nyaman)
// v2027.64 — bar tab baru: menempel di atas saat scroll, tab aktif tampil ikon+label dan tab lain ikon saja,
//   sehingga ke-7 tab (Kantor … Riwayat) selalu muat tanpa terpotong/geser; Bursa, Bank & Investasi kini punya
//   ikon berbeda. Isi tab (kecuali Kantor 3D) dibungkus .hq-body agar kartu/baris lebih lega (lihat HqStyle.js).
//   Atribut data-hq-subtab, class subtab-bar/subtab-btn, dan semua panel anak TIDAK berubah.
// Tab Kantor dihapus dari HQ; Office 3D Map kini hanya lewat sakelar Kampus | Kantor di Home.
import { renderDashboard } from './DashboardPanel.js';
import { renderTeamPanel } from './TeamPanel.js';
import { renderExchangePanel } from './ExchangePanel.js';
import { renderBankPanel } from './BankPanel.js';
import { renderInvestPanel } from './InvestPanel.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { renderCompanyHistoryPanel } from './CompanyHistoryPanel.js';
import { ensureHqStyle } from './HqStyle.js';

// Label tab HQ; jika kunci i18n belum ada, pakai fallback.
function _tabLabel(tab) {
    var v = t(tab.key);
    return (v && v !== tab.key) ? v : (tab.fallback || tab.key);
}
import { t } from '../../core/LanguageService.js';

// Ikon khusus agar Bursa / Bank / Investasi tidak kembar (sebelumnya Bursa & Investasi sama-sama "trending-up").
var _OWN_ICONS = {
    candles: '<path d="M7 3v3M7 17v4M17 6v3M17 19v2"/><rect x="5" y="6" width="4" height="11" rx="1"/><rect x="15" y="9" width="4" height="10" rx="1"/>',
    bank:    '<path d="M3 10 12 4l9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/>',
    pie:     '<path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M15.5 3.6A9 9 0 0 1 20.4 8.5H15.5z"/>'
};
function _ownIcon(name, size) {
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
        'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        _OWN_ICONS[name] + '</svg>';
}
function _tabIcon(tab) {
    return tab.own ? _ownIcon(tab.own, 19) : renderIcon(tab.icon, 19);
}

const HQ_TABS = [
    { id: 'overview', key: 'hq.tab.overview', icon: 'activity' },
    { id: 'team',     key: 'hq.tab.team',     icon: 'users' },
    { id: 'exchange', key: 'hq.tab.exchange', own: 'candles' },
    { id: 'bank',     key: 'hq.tab.bank',     own: 'bank' },
    { id: 'invest',   key: 'hq.tab.invest',   own: 'pie', fallback: 'Investasi' },
    { id: 'history',  key: 'hq.tab.history',  icon: 'library', fallback: 'Riwayat' }
];

export function renderHqPanel({ subtab, state, timeSnapshot, researchSystem, teamSystem, stockSystem }) {
    ensureHqStyle();

    var tabBar = '<div class="hq-tabs-wrap"><div class="subtab-bar hq-tabs" role="tablist">' +
        HQ_TABS.map(function (tab) {
            var on = subtab === tab.id;
            var label = _tabLabel(tab);
            return '<button type="button" role="tab" class="subtab-btn hq-tab' + (on ? ' active' : '') + '"' +
                ' data-hq-subtab="' + tab.id + '" aria-selected="' + (on ? 'true' : 'false') + '"' +
                ' aria-label="' + label + '" title="' + label + '">' +
                _tabIcon(tab) +
                '<span class="hq-tab-label">' + label + '</span>' +
                '</button>';
        }).join('') +
        '</div></div>';

    var body = '';
    var wrap = true;
    if (subtab === 'team') {
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
    return tabBar + (wrap ? '<div class="hq-body hq-sub-' + (subtab || 'overview') + '">' + body + '</div>' : body);
}
