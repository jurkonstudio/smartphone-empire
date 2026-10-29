// FILE: src/ui/panels/AcquisitionShowcase.js
// Aset visual mockup produk merek rival untuk panel Akuisisi (HQ > Investasi).
//  - Sebelum diakuisisi: deretan thumbnail ponsel rival (tanpa angka produksi).
//  - Setelah diakuisisi: kartu "Lini produksi" berisi mockup + volume, pendapatan,
//    laba, dan margin (estimasi). Angka dihitung ulang dari state game tiap render.
// Bentuk & warna mockup diturunkan di data/competitor-products.model.js.
import { renderPhoneMockup } from '../phone/PhoneMockup.js';
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency, formatCompactMoney } from '../../utils/format.js';
import { buildCompetitorProducts } from '../../data/competitor-products.model.js';
import { getCompetitorById } from '../../data/competitors/index.js';
import { ensureRegionalStyle } from './RegionalStyle.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function pct(x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; }
function units(n) { return Number(n || 0).toLocaleString('en-US'); }

var STATUS_LABEL = {
    new: ['Baru', 'New'], selling: ['Dijual', 'On sale'], declining: ['Menurun', 'Declining'],
    ended: ['Berakhir', 'Ended'], upcoming: ['Mendatang', 'Upcoming']
};
var LIVE = { new: 1, selling: 1, declining: 1 };

function _ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById('acq-show-style')) return;
    var css = [
        '.acq-strip{display:flex;gap:8px;overflow-x:auto;padding:8px 0 2px;scrollbar-width:thin}',
        '.acq-thumb{flex:0 0 auto;width:74px;text-align:center;filter:grayscale(.75);opacity:.8}',
        '.acq-strip.owned .acq-thumb{filter:none;opacity:1}',
        '.acq-cap{font-size:10px;line-height:1.25;color:var(--text-secondary);margin-top:3px;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:74px}',
        '.acq-prod{border:1px solid var(--border);border-radius:12px;background:var(--bg-2);padding:10px;margin-top:10px}',
        '.acq-prod-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:700}',
        '.acq-prod-sub{font-size:11px;color:var(--text-secondary);margin-top:2px}',
        '.acq-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:8px}',
        '.acq-card{border:1px solid var(--border);border-radius:10px;padding:6px 6px 7px;text-align:center;background:var(--bg-3);min-width:0}',
        '.acq-card-name{font-size:11px;font-weight:700;margin-top:4px;line-height:1.25;word-break:break-word}',
        '.acq-card-meta{font-size:10px;color:var(--text-secondary);margin-top:2px;font-variant-numeric:tabular-nums}',
        '.acq-card-margin{font-size:12px;font-weight:800;font-variant-numeric:tabular-nums;margin-top:3px}',
        '.acq-lock{font-size:11px;color:var(--text-tertiary);margin-top:6px}',
        '.acq-ap-thumb{flex:0 0 auto;width:56px}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'acq-show-style';
    el.textContent = css;
    document.head.appendChild(el);
}

function _marginColor(m) {
    return m >= 0.35 ? '#34c759' : (m >= 0.25 ? '#0a84ff' : (m >= 0.15 ? '#ff9f0a' : '#ff453a'));
}

// Konteks state game untuk satu merek (sama dengan yang dipakai modal produk).
export function acqContext(competitorId) {
    var st = window.__game.state.get();
    var share = 0;
    ((st.market && st.market.competitors) || []).forEach(function (c) { if (c.id === competitorId) share = c.share || 0; });
    var ent = st.competitorState && st.competitorState.entities && st.competitorState.entities[competitorId];
    return {
        year: st.time.currentYear, month: st.time.currentMonth,
        share: share, releases: (ent && ent.releases) || []
    };
}

// SVG mockup satu produk. Cache dikunci juga pada jumlah riset selesai,
// karena spesifikasi (layar, kamera) ikut riset.
var _cache = {}, _cacheN = 0;
export function acqProductSvg(p, size) {
    if (!p || !p.mockupConfig) return '';
    var n = 0;
    try { n = ((window.__game.state.get().research || {}).completed || []).length; } catch (e) {}
    var key = size + '|' + p.year + '|' + n + '|' + JSON.stringify(p.mockupConfig);
    if (_cache[key] !== undefined) return _cache[key];
    var svg = '';
    try { svg = renderPhoneMockup(p.mockupConfig, { size: size, year: p.year, showBrand: false, isStatic: true }); } catch (e) { svg = ''; }
    if (_cacheN > 400) { _cache = {}; _cacheN = 0; }
    _cache[key] = svg; _cacheN++;
    return svg;
}

// Deretan thumbnail produk rival di baris target. owned=false: tanpa angka.
// Memakai produk aktif; bila tak ada, produk yang sudah berakhir.
export function acqThumbStripHtml(data, owned) {
    if (!data || !data.products || !data.products.length) return '';
    var list = data.products.filter(function (p) { return LIVE[p.status]; });
    if (!list.length) list = data.products;
    list = list.slice(0, 4);
    return '<div class="acq-strip' + (owned ? ' owned' : '') + '">' + list.map(function (p) {
        return '<div class="acq-thumb" title="' + esc(p.name) + '">' + acqProductSvg(p, 64) +
            '<div class="acq-cap">' + esc(p.name) + '</div></div>';
    }).join('') + '</div>';
}

function _kpi(label, val, color) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value"' +
        (color ? ' style="color:' + color + '"' : '') + '>' + esc(val) + '</div></div>';
}

// Kartu "Lini produksi" untuk merek yang sudah dimiliki.
export function acqProductionHtml(entry) {
    if (!entry || !entry.id) return '';
    ensureRegionalStyle(); _ensureStyle();
    var comp = getCompetitorById(entry.id);
    var data = buildCompetitorProducts(entry.id, acqContext(entry.id));
    if (!data) return '';
    var sm = data.summary;
    var live = data.products.filter(function (p) { return p.unitsPerMonth > 0; })
        .sort(function (a, b) { return b.unitsPerMonth - a.unitsPerMonth; }).slice(0, 6);
    var acqWhen = entry.year ? entry.year + (entry.month ? '-' + (entry.month < 10 ? '0' + entry.month : entry.month) : '') : '';
    var accent = (comp && comp.color) || '#0a84ff';

    var grid = live.length ? '<div class="acq-grid">' + live.map(function (p) {
        var s = STATUS_LABEL[p.status] || STATUS_LABEL.selling;
        return '<div class="acq-card">' + acqProductSvg(p, 72) +
            '<div class="acq-card-name">' + esc(p.name) + '</div>' +
            '<div class="acq-card-meta">' + esc(p.year) + ' · ' + esc(L(s[0], s[1])) + '</div>' +
            '<div class="acq-card-meta">' + units(p.unitsPerMonth) + L(' unit/bln', ' units/mo') + '</div>' +
            '<div class="acq-card-margin" style="color:' + _marginColor(p.marginPct) + '">' + pct(p.marginPct) + ' ' +
            esc(L('margin', 'margin')) + '</div></div>';
    }).join('') + '</div>' : '<div class="rg-row-meta" style="margin-top:8px">' +
        esc(L('Belum ada produk yang terjual.', 'No products on sale yet.')) + '</div>';

    return '<div class="acq-prod" style="border-left:3px solid ' + esc(accent) + '">' +
        '<div class="acq-prod-head"><span>' + esc(L('Lini produksi ', 'Production line ')) + esc(entry.name) + '</span>' +
        '<span class="acq-prod-sub" style="margin:0">' + esc(L('diakuisisi ', 'acquired ')) + esc(acqWhen) + '</span></div>' +
        '<div class="acq-prod-sub">' + sm.liveCount + esc(L(' produk aktif', ' active products')) + '</div>' +
        '<div class="rg-kpis" style="margin-top:8px">' +
            _kpi(L('Unit/bulan', 'Units/month'), units(sm.unitsPerMonth)) +
            _kpi(L('Pendapatan/bln', 'Revenue/mo'), formatCompactMoney(sm.revenuePerMonth)) +
            _kpi(L('Laba kotor/bln', 'Gross profit/mo'), formatCompactMoney(sm.profitPerMonth)) +
            _kpi(L('Margin rata-rata', 'Avg margin'), pct(sm.marginPct, 1), _marginColor(sm.marginPct)) +
        '</div>' + grid +
        '<button class="btn-secondary" data-econ-acq-products="' + esc(entry.id) + '" style="width:100%;margin-top:10px;min-height:34px;font-size:12px;">' +
            esc(L('Lihat semua produk & margin', 'View all products & margin')) + '</button>' +
        '<div class="ap-note" style="margin-top:8px;font-size:11px;color:var(--text-secondary);">' + esc(L(
            'Volume, harga, dan margin adalah ESTIMASI game.', 'Volume, price, and margin are in-game ESTIMATES.')) + '</div>' +
    '</div>';
}

// Mockup thumbnail satu produk untuk modal produk (di samping kartu produk).
export function acqModalThumbHtml(p) {
    _ensureStyle();
    return '<div class="acq-ap-thumb">' + acqProductSvg(p, 56) + '</div>';
}
