// FILE: src/ui/panels/AcquisitionProductsModal.js
// Modal "Produk Rival" di halaman Akuisisi (HQ > Invest). Menampilkan SEMUA
// produk sebuah merek rival beserta data lengkap dan margin (estimasi).
// Perhitungan ada di data/competitor-products.model.js.
import { Modal } from '../modal.js';
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency, formatCompactMoney } from '../../utils/format.js';
import { buildCompetitorProducts } from '../../data/competitor-products.model.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { acqModalThumbHtml } from './AcquisitionShowcase.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function pct(x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; }
function units(n) { return Number(n || 0).toLocaleString('en-US'); }

var STATUS = {
    new:       { id: 'Baru',       en: 'New',       color: '#34c759' },
    selling:   { id: 'Dijual',     en: 'On sale',   color: '#0a84ff' },
    declining: { id: 'Menurun',    en: 'Declining', color: '#ff9f0a' },
    ended:     { id: 'Berakhir',   en: 'Ended',     color: '#8e8e93' },
    upcoming:  { id: 'Mendatang',  en: 'Upcoming',  color: '#bf5af2' }
};

function _ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('ap-style')) return;
    var css = [
        '.ap-note{font-size:11px;color:var(--text-secondary);line-height:1.5;margin:8px 0;padding:8px 10px;',
        'background:rgba(255,159,10,.10);border-left:3px solid #ff9f0a;border-radius:6px}',
        '.ap-bar{display:flex;gap:6px;align-items:center;justify-content:space-between;margin:10px 0 8px;flex-wrap:wrap}',
        '.ap-sort{background:var(--bg-3);color:var(--text-primary);border:1px solid var(--border);border-radius:8px;',
        'font-size:12px;padding:6px 8px;min-height:34px}',
        '.ap-item{border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--bg-2);overflow:hidden}',
        '.ap-item>summary{list-style:none;cursor:pointer;padding:9px 10px;display:block}',
        '.ap-item>summary::-webkit-details-marker{display:none}',
        '.ap-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}',
        '.ap-name{font-size:13px;font-weight:700;line-height:1.3;min-width:0;word-break:break-word}',
        '.ap-sub{font-size:11px;color:var(--text-secondary);margin-top:2px}',
        '.ap-badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;white-space:nowrap;border:1px solid}',
        '.ap-margin{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;text-align:right}',
        '.ap-mbar{height:5px;border-radius:999px;background:var(--bg-4);margin-top:7px;overflow:hidden}',
        '.ap-mbar i{display:block;height:100%;border-radius:999px}',
        '.ap-body{padding:2px 10px 10px;border-top:1px solid var(--border)}',
        '.ap-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:5px 0;',
        'border-bottom:1px solid rgba(128,128,128,.12)}',
        '.ap-row:last-child{border-bottom:none}',
        '.ap-row span{color:var(--text-secondary)}',
        '.ap-row b{font-variant-numeric:tabular-nums;text-align:right}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ap-style';
    el.textContent = css;
    document.head.appendChild(el);
}

function _marginColor(m) {
    return m >= 0.35 ? '#34c759' : (m >= 0.25 ? '#0a84ff' : (m >= 0.15 ? '#ff9f0a' : '#ff453a'));
}

// Kumpulkan konteks dari state game.
function _context(competitorId) {
    var g = window.__game, st = g.state.get();
    var share = 0;
    ((st.market && st.market.competitors) || []).forEach(function (c) { if (c.id === competitorId) share = c.share || 0; });
    var ent = st.competitorState && st.competitorState.entities && st.competitorState.entities[competitorId];
    return {
        year: st.time.currentYear, month: st.time.currentMonth,
        share: share, releases: (ent && ent.releases) || []
    };
}

function _itemHtml(p) {
    var s = STATUS[p.status] || STATUS.selling;
    var mc = _marginColor(p.marginPct);
    var when = p.year + (p.month ? '-' + (p.month < 10 ? '0' + p.month : p.month) : '');
    var live = p.unitsPerMonth > 0;
    var row = function (k, v) { return '<div class="ap-row"><span>' + esc(k) + '</span><b>' + v + '</b></div>'; };
    return '<details class="ap-item">' +
        '<summary><div class="ap-head">' + acqModalThumbHtml(p) +
            '<div style="min-width:0;flex:1"><div class="ap-name">' + esc(p.name) + '</div>' +
            '<div class="ap-sub">' + esc(when) + ' · Tier ' + p.tier + ' · ' + formatCurrency(p.price) + '</div></div>' +
            '<div><div class="ap-margin" style="color:' + mc + '">' + pct(p.marginPct) + '</div>' +
            '<div class="ap-badge" style="color:' + s.color + ';border-color:' + s.color + '">' + esc(L(s.id, s.en)) + '</div></div>' +
        '</div><div class="ap-mbar"><i style="width:' + Math.round(Math.min(1, p.marginPct / 0.5) * 100) + '%;background:' + mc + '"></i></div></summary>' +
        '<div class="ap-body">' +
            row(L('Tahun / bulan rilis', 'Release year / month'), esc(p.year) + (p.month ? ' / ' + p.month : ' / —')) +
            row(L('Umur produk', 'Product age'), p.status === 'upcoming' ? '—' : p.ageYears + L(' thn', ' yr')) +
            row('Tier', p.tier + ' / 5') +
            row(L('Status', 'Status'), esc(L(s.id, s.en))) +
            row(L('Sumber data', 'Data source'), esc(p.source === 'signature' ? L('Produk ikonik', 'Signature product') : L('Rilis AI rival', 'Rival AI release'))) +
            row(L('Boost pangsa (data merek)', 'Share boost (brand data)'), p.shareBoost == null ? '—' : (p.shareBoost > 0 ? '+' : '') + (p.shareBoost * 100).toFixed(1) + '%') +
            row(L('Harga jual (est.)', 'Sale price (est.)'), formatCurrency(p.price)) +
            row(L('Biaya produksi/unit (est.)', 'Unit cost (est.)'), formatCurrency(p.unitCost)) +
            row(L('Margin/unit', 'Margin/unit'), '<span style="color:' + mc + '">' + formatCurrency(p.marginPerUnit) + '</span>') +
            row(L('Margin kotor', 'Gross margin'), '<span style="color:' + mc + '">' + pct(p.marginPct, 1) + '</span>') +
            row(L('Volume/bulan (est.)', 'Volume/month (est.)'), live ? units(p.unitsPerMonth) : '—') +
            row(L('Pendapatan/bulan', 'Revenue/month'), live ? formatCompactMoney(p.revenuePerMonth) : '—') +
            row(L('Laba kotor/bulan', 'Gross profit/month'), live ? formatCompactMoney(p.profitPerMonth) : '—') +
            (p.ramIndex > 1.001 && live ? row(L('Indeks biaya RAM', 'RAM cost index'), 'x' + p.ramIndex.toFixed(2)) : '') +
        '</div></details>';
}

function _kpi(label, val, color) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value"' +
        (color ? ' style="color:' + color + '"' : '') + '>' + esc(val) + '</div></div>';
}

function _sortList(list, mode) {
    var a = list.slice();
    if (mode === 'margin') a.sort(function (x, y) { return y.marginPct - x.marginPct; });
    else if (mode === 'profit') a.sort(function (x, y) { return y.profitPerMonth - x.profitPerMonth; });
    else if (mode === 'price') a.sort(function (x, y) { return y.price - x.price; });
    // 'status' = urutan bawaan model (baru -> berakhir)
    return a;
}

function _filterList(list, f) {
    if (f === 'live') return list.filter(function (p) { return p.status === 'new' || p.status === 'selling' || p.status === 'declining'; });
    if (f === 'ended') return list.filter(function (p) { return p.status === 'ended'; });
    return list;
}

export function openAcquisitionProductsModal(params) {
    var competitorId = params && params.competitorId;
    var g = window.__game;
    if (!g || !competitorId) return;
    ensureRegionalStyle(); _ensureStyle();

    var data = buildCompetitorProducts(competitorId, _context(competitorId));
    if (!data) return;
    var mode = (g.state.get().settings || {}).competitorMode || 'real';
    var cd = g.competitors.getCompetitorData(competitorId, mode);
    var brand = cd ? cd.name : competitorId;
    var sm = data.summary;
    var st = { filter: 'live', sort: 'status' };

    function body() {
        var shown = _sortList(_filterList(data.products, st.filter), st.sort);
        var chip = function (id, label) {
            return '<button class="rg-chip' + (st.filter === id ? ' active' : '') + '" data-ap-filter="' + id + '">' + esc(label) + '</button>';
        };
        var sel = function (id, label) { return '<option value="' + id + '"' + (st.sort === id ? ' selected' : '') + '>' + esc(label) + '</option>'; };
        return '<div class="ap-bar"><div class="rg-chips">' +
                chip('live', L('Dijual', 'On sale')) + chip('all', L('Semua', 'All')) +
                chip('ended', L('Berakhir', 'Ended')) +
            '</div><select class="ap-sort" data-ap-sort>' +
                sel('status', L('Urut: Status', 'Sort: Status')) + sel('margin', L('Urut: Margin', 'Sort: Margin')) +
                sel('profit', L('Urut: Laba/bln', 'Sort: Profit/mo')) + sel('price', L('Urut: Harga', 'Sort: Price')) +
            '</select></div>' +
            (shown.length ? shown.map(_itemHtml).join('')
                : '<div class="rg-row-meta" style="padding:12px 0">' + esc(L('Tidak ada produk pada filter ini.', 'No products in this filter.')) + '</div>');
    }

    var html =
        '<div class="modal-title">' + esc(L('Produk ', 'Products · ')) + esc(brand) + '</div>' +
        '<div class="modal-sub">' + esc(L('Pangsa ', 'Share ')) + pct(_context(competitorId).share, 1) + ' · ' +
            esc(L('Total ', 'Total ')) + sm.total + esc(L(' produk', ' products')) + ' · ' + sm.liveCount + esc(L(' aktif', ' active')) + '</div>' +
        '<div class="rg-kpis" style="margin-top:10px">' +
            _kpi(L('Unit/bulan', 'Units/month'), units(sm.unitsPerMonth)) +
            _kpi(L('Pendapatan/bln', 'Revenue/mo'), formatCompactMoney(sm.revenuePerMonth)) +
            _kpi(L('Laba kotor/bln', 'Gross profit/mo'), formatCompactMoney(sm.profitPerMonth)) +
            _kpi(L('Margin rata-rata', 'Avg margin'), pct(sm.marginPct, 1), _marginColor(sm.marginPct)) +
        '</div>' +
        (sm.bestName ? '<div class="rg-row-meta">' + esc(L('Penyumbang laba terbesar: ', 'Top profit contributor: ')) + '<b>' + esc(sm.bestName) + '</b></div>' : '') +
        '<div class="ap-note">' + esc(L(
            'Harga, biaya, margin, dan volume adalah ESTIMASI game (rival tidak punya data finansial asli). Dihitung dari harga rata-rata pasar, tier, watak merek, umur produk, dan krisis memori 2027–2029.',
            'Price, cost, margin, and volume are in-game ESTIMATES (rivals have no real financial data). Derived from market average price, tier, brand personality, product age, and the 2027–2029 memory crisis.')) + '</div>' +
        '<div data-ap-list>' + body() + '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px">' + esc(L('Tutup', 'Close')) + '</button>';

    var node = Modal.open('acq-products', html);
    if (!node) return;
    var listEl = node.querySelector('[data-ap-list]');
    function refresh() { listEl.innerHTML = body(); }
    node.addEventListener('click', function (e) {
        var f = e.target.closest('[data-ap-filter]');
        if (f) { st.filter = f.dataset.apFilter; refresh(); }
    });
    node.addEventListener('change', function (e) {
        if (e.target.matches('[data-ap-sort]')) { st.sort = e.target.value; refresh(); }
    });
}
