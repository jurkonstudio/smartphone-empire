// FILE: src/ui/panels/CountryPanels.js  (BARU)
// ============================================================
// UI negara pasar:
//   - renderSupplyCard(dev, year)  : tabel "Negara yang akan dipasok" saat ponsel dikembangkan/diproduksi
//   - renderOsCountryPreview(data) : 5 negara teratas di tab Pengguna OS (bisa diklik)
//   - openOsCountriesModal()       : daftar lengkap negara pengguna OS
//   - ensureCountryHandlers()      : klik [data-os-countries] → buka modal
// Teks dwibahasa lewat helper L(id, en) (tidak menambah key i18n baru).
// ============================================================
import { escapeHtml } from '../../utils/html.js';
import { Modal } from '../modal.js';
import { LanguageService } from '../../core/LanguageService.js';
import { computeSupplyTable, computeOsCountryUsage } from '../../systems/CountryMarketModel.js';
import { formatUsers } from '../../systems/OsAdoptionModel.js';
import { renderWorldMap } from '../components/WorldMap.js';

// Indonesia hanya untuk bahasa 'id'; semua bahasa lain (en, zh, ja, ...) memakai Inggris.
function L(id, en) { return LanguageService.getLang() === 'id' ? id : en; }
function cname(c) { return LanguageService.getLang() === 'id' ? c.id_name : c.en_name; }
function pct(x) { return (x * 100 >= 10 ? Math.round(x * 100) : (Math.round(x * 1000) / 10)) + '%'; }
function units(n) { return formatUsers(n); }

var _stylesInjected = false;
var _bound = false;

// ------------------------------------------------------------
// 1) Tabel pasokan (halaman Produk → Desain, saat ada proyek)
// ------------------------------------------------------------
export function renderSupplyCard(dev, year) {
    if (!dev) return '';
    _ensureStyles();
    var qty = dev.productionQty || (dev.config && dev.config.productionQty) || 0;
    var price = dev.price || (dev.config && dev.config.price) || 0;
    var tbl = computeSupplyTable(price, qty, year, dev.id || dev.name);
    var SHOW = 8;
    var top = tbl.rows.slice(0, SHOW);
    var rest = tbl.rows.slice(SHOW);
    var restUnits = rest.reduce(function (s, r) { return s + r.units; }, 0);

    var rowsHtml = top.map(function (r) {
        var c = r.country;
        return '<div class="cm-row">' +
            '<span class="cm-flag">' + c.flag + '</span>' +
            '<span class="cm-name">' + escapeHtml(cname(c)) + (r.fresh ? ' <i class="cm-new">' + L('baru', 'new') + '</i>' : '') + '</span>' +
            '<span class="cm-pct">' + pct(r.share) + '</span>' +
            '<span class="cm-units">' + escapeHtml(units(r.units)) + '</span>' +
            '<div class="cm-bar"><div class="cm-bar-fill" style="width:' + Math.max(2, Math.round(r.share * 100 * 2.2)) + '%"></div></div>' +
            '</div>';
    }).join('');

    var more = rest.length
        ? '<div class="cm-more">+' + rest.length + ' ' + L('negara lain', 'more countries') + ' · ' + escapeHtml(units(restUnits)) + ' ' + L('unit', 'units') + '</div>' : '';

    var next = tbl.next.length
        ? '<div class="cm-next">' + L('Segera terbuka: ', 'Opening soon: ') +
          tbl.next.map(function (c) { return c.flag + ' ' + escapeHtml(cname(c)) + ' (' + c.since + ')'; }).join(' · ') + '</div>' : '';

    var map = renderWorldMap({
        id: 'wm-supply', year: year, tabs: true,
        items: tbl.rows.map(function (r) { return { id: r.country.id, value: r.units, share: r.share, units: r.units }; }),
        valueText: function (it) { return pct(it.share) + ' · ' + units(it.units) + ' ' + L('unit', 'units'); }
    });

    return '<div class="card cm-card">' +
        '<div class="card-title">' + L('Negara yang akan dipasok', 'Countries to be supplied') + '</div>' +
        '<div class="cm-sub">' + tbl.openCount + '/' + tbl.totalCount + ' ' + L('negara terbuka di ', 'countries open in ') + year +
        ' · ' + escapeHtml(units(qty)) + ' ' + L('unit', 'units') + '</div>' + map +
        '<div class="cm-head"><span></span><span>' + L('Negara', 'Country') + '</span><span>' + L('Porsi', 'Share') + '</span><span>' + L('Unit', 'Units') + '</span></div>' +
        rowsHtml + more + next +
        '<div class="cm-note">' + L('Perkiraan: ikut populasi, penetrasi ponsel, dan kecocokan harga tiap negara.', 'Estimate: based on population, phone penetration and price fit per country.') + '</div>' +
        '</div>';
}

// ------------------------------------------------------------
// 2) Pratinjau di tab Pengguna OS
// ------------------------------------------------------------
export function renderOsCountryPreview(data) {
    _ensureStyles();
    ensureCountryHandlers();
    var u = computeOsCountryUsage(data);
    var head = '<div class="section-label"><span class="section-label-text">' + L('Negara pengguna terbanyak', 'Top user countries') +
        '</span><span class="section-label-line"></span></div>';
    if (!u.list.length) {
        return head + '<div class="ou-empty-row">' + L('Belum ada pengguna per negara. Jual ponsel ber-OS sendiri dulu.', 'No per-country users yet. Sell phones running your own OS first.') + '</div>';
    }
    var rows = u.list.slice(0, 5).map(function (r, i) { return _countryRow(r, i + 1, u.list[0].active); }).join('');
    var nowYear = (data && data.time && data.time.currentYear) || 2000;
    var map = renderWorldMap({
        id: 'wm-os-tab', year: nowYear, tabs: true,
        items: u.list.map(function (r) { return { id: r.country.id, value: r.active, share: r.share }; }),
        valueText: function (it) { return formatUsers(it.value) + ' · ' + pct(it.share); }
    });
    return head + map + '<div class="ou-list cm-tap" data-os-countries role="button" tabindex="0">' + rows +
        '<div class="cm-more">' + L('Lihat semua ', 'See all ') + u.countryCount + ' ' + L('negara ›', 'countries ›') + '</div></div>';
}

function _countryRow(r, rank, maxActive) {
    var c = r.country;
    var w = maxActive > 0 ? Math.max(3, Math.round((r.active / maxActive) * 100)) : 0;
    return '<div class="ou-row ou-row-flat">' +
        '<div class="ou-row-top"><span class="cm-rank">' + rank + '</span><span class="cm-flag">' + c.flag + '</span>' +
        '<span class="ou-row-name">' + escapeHtml(cname(c)) + '</span>' +
        '<span class="ou-row-val">' + escapeHtml(formatUsers(r.active)) + ' · ' + pct(r.share) + '</span></div>' +
        '<div class="ou-bar"><div class="ou-bar-fill" style="width:' + w + '%"></div></div></div>';
}

// ------------------------------------------------------------
// 3) Modal daftar lengkap
// ------------------------------------------------------------
export function openOsCountriesModal() {
    _ensureStyles();
    var data = window.__game && window.__game.state ? window.__game.state.get() : null;
    if (!data) return;
    var u = computeOsCountryUsage(data);
    var nowYear = (data.time && data.time.currentYear) || 2000;
    var map = renderWorldMap({
        id: 'wm-os-modal', year: nowYear, tabs: true,
        items: u.list.map(function (r) { return { id: r.country.id, value: r.active, share: r.share }; }),
        valueText: function (it) { return formatUsers(it.value) + ' · ' + pct(it.share); }
    });
    var body;
    if (!u.list.length) {
        body = '<div class="ou-empty-row">' + L('Belum ada pengguna OS. Rilis ponsel ber-OS sendiri dan mulai menjual.', 'No OS users yet. Release a phone with your own OS and start selling.') + '</div>';
    } else {
        var max = u.list[0].active;
        body = '<div class="ou-list">' + u.list.map(function (r, i) { return _countryRow(r, i + 1, max); }).join('') + '</div>';
    }
    var next = u.next.length
        ? '<div class="cm-next" style="margin-top:12px">' + L('Segera terbuka: ', 'Opening soon: ') +
          u.next.map(function (c) { return c.flag + ' ' + escapeHtml(cname(c)) + ' (' + c.since + ')'; }).join(' · ') + '</div>' : '';

    Modal.open('os-countries',
        '<div class="modal-title">' + L('Pengguna OS per negara', 'OS users by country') + '</div>' +
        '<div class="modal-sub">' + L('Total pengguna aktif ', 'Total active users ') + '<b>' + escapeHtml(formatUsers(u.total)) + '</b> · ' +
        u.countryCount + ' ' + L('negara', 'countries') + '</div>' +
        map + body + next +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:14px;">' + L('Tutup', 'Close') + '</button>');
}

export function ensureCountryHandlers() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;
    document.addEventListener('click', function (e) {
        if (e.target.closest('[data-os-countries]')) openOsCountriesModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var el = e.target.closest && e.target.closest('[data-os-countries]');
        if (el) { e.preventDefault(); openOsCountriesModal(); }
    });
}

function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var css = [
        '.cm-card { margin-top: 10px; }',
        '.cm-sub { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.6)); margin-bottom: 8px; }',
        '.cm-head, .cm-row { display: grid; grid-template-columns: 26px 1fr 52px 56px; align-items: center; column-gap: 6px; }',
        '.cm-head { font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute, rgba(255,255,255,.5)); padding: 0 0 4px; }',
        '.cm-head span:nth-child(n+3), .cm-row .cm-pct, .cm-row .cm-units { text-align: right; }',
        '.cm-row { padding: 6px 0; border-top: 1px solid rgba(255,255,255,.06); font-size: 13px; position: relative; }',
        '.cm-flag { font-size: 16px; }',
        '.cm-name { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
        '.cm-pct { font-variant-numeric: tabular-nums; }',
        '.cm-units { font-variant-numeric: tabular-nums; color: var(--text-dim, rgba(255,255,255,.7)); font-size: 12px; }',
        '.cm-bar { grid-column: 2 / 5; height: 3px; border-radius: 99px; background: rgba(255,255,255,.06); overflow: hidden; margin-top: 4px; }',
        '.cm-bar-fill { height: 100%; background: var(--accent, #4f8cff); border-radius: 99px; }',
        '.cm-new { font-style: normal; font-size: 9px; padding: 1px 6px; border-radius: 99px; background: rgba(80,200,120,.18); color: #3ecf8e; margin-left: 4px; }',
        '.cm-more { font-size: 12px; color: var(--accent, #4f8cff); padding: 8px 2px 2px; }',
        '.cm-next, .cm-note { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); line-height: 1.45; padding-top: 6px; }',
        '.cm-rank { width: 16px; font-size: 11px; color: var(--text-mute, rgba(255,255,255,.5)); text-align: center; }',
        '.cm-tap { cursor: pointer; }',
        '.ou-kpi[data-os-countries], .ou-hero[data-os-countries] { cursor: pointer; }',
        '.ou-kpi[data-os-countries]:active, .ou-hero[data-os-countries]:active, .cm-tap:active { opacity: .8; }',
        '.ou-kpi-chev { margin-left: auto; opacity: .5; font-size: 16px; line-height: 1; }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-country-panels', '');
    style.textContent = css;
    document.head.appendChild(style);
}
