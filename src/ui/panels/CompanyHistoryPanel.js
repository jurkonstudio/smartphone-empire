// FILE: src/ui/panels/CompanyHistoryPanel.js  (BARU)
// ============================================================
// Tab "Riwayat" di HQ — sejarah perusahaan per tahun.
//   - Deret tahun (dari tahun berdiri sampai tahun berjalan) untuk memilih tahun.
//   - Grafik pendapatan penjualan per tahun (klik batang untuk membuka tahun itu).
//   - Ringkasan tahun terpilih (keuangan, produk, riset, OS, infrastruktur).
//   - Daftar peristiwa tahun itu, bisa difilter per kategori.
// Data dari data.history (CompanyHistorySystem). Tidak mengubah state.
// ============================================================
import { escapeHtml } from '../../utils/html.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { HISTORY_CATEGORIES } from '../../systems/CompanyHistorySystem.js';
import { computeOsAdoption, formatUsers } from '../../systems/OsAdoptionModel.js';
import { getDesignEraForYear } from '../../data/era-design.data.js';

var MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
var CAT_TONE = {
    product: 'var(--accent, #4f8cff)', research: '#a78bfa', chip: '#38bdf8', os: '#34d399',
    infra: '#f59e0b', finance: '#f472b6', public: '#fb7185', industry: '#94a3b8', milestone: '#facc15'
};

var _histYear = null;
var _histCat = 'all';
var _bound = false;
var _stylesInjected = false;

function _data() {
    try { return window.__game.state.get(); } catch (e) { return null; }
}

function _money(n) {
    n = Math.round(n || 0);
    var neg = n < 0 ? '-' : '';
    var a = Math.abs(n);
    if (a >= 1000000000) return neg + '$' + (a / 1000000000).toFixed(2).replace(/\.?0+$/, '') + ' M';
    if (a >= 1000000) return neg + '$' + (a / 1000000).toFixed(2).replace(/\.?0+$/, '') + ' jt';
    if (a >= 1000) return neg + '$' + (a / 1000).toFixed(1).replace(/\.0$/, '') + ' rb';
    return neg + '$' + a.toLocaleString('en-US');
}

// Nilai tahun berjalan dihitung dari state (belum dikunci), tahun lampau dari ringkasan.
function _yearValues(data, y, cur) {
    var h = data.history;
    var rec = (h.years && h.years[String(y)]) || null;
    if (!rec) return null;
    var out = Object.assign({}, rec);
    if (y === cur) {
        out.endCash = Math.round(data.cash || 0);
        out.endReputation = Math.round((data.market && data.market.reputation) || 0);
        out.endOsUsers = Math.round(computeOsAdoption(data).activeUsers || 0);
        out.endProducts = (data.products.catalog || []).filter(function (p) { return p.status === 'selling'; }).length;
    }
    return out;
}

export function renderCompanyHistoryPanel() {
    _ensureStyles();
    _ensureHandlers();
    var data = _data();
    if (!data || !data.history || !data.time) {
        return '<div class="empty"><div class="empty-title">Riwayat belum tersedia.</div></div>';
    }
    var h = data.history;
    var cur = data.time.currentYear;
    var startY = h.startYear != null ? h.startYear : cur;
    if (_histYear == null || _histYear < startY || _histYear > cur) _histYear = cur;
    var sel = _histYear;
    var years = [];
    for (var y = startY; y <= cur; y++) years.push(y);

    var head = '<div class="ch-hero">' +
        '<div class="ch-hero-title">' + renderIcon('library', 16) + ' Riwayat ' + escapeHtml(data.companyName || 'Perusahaan') + '</div>' +
        '<div class="ch-hero-sub">Dimulai ' + startY + ' · ' + years.length + ' tahun · ' + h.chronicle.length + ' peristiwa tercatat</div>' +
        '</div>';

    var strip = '<div class="ch-strip">' + years.map(function (yr) {
        var rec = h.years[String(yr)];
        var has = rec && (rec.launched || rec.revenue || rec.researchDone || rec.osVersions || rec.infra || rec.loans || rec.viral || rec.milestones);
        return '<button class="ch-year ' + (yr === sel ? 'active' : '') + (has ? '' : ' ch-year-quiet') + '" data-hist-year="' + yr + '">' + yr + '</button>';
    }).join('') + '</div>';

    var chart = _renderChart(h, years, sel, cur);
    var card = _renderYearCard(data, sel, cur, startY);
    var events = _renderEvents(h, sel);

    return head + strip + chart + card + events;
}

function _renderChart(h, years, sel, cur) {
    var W = 320, H = 110, PAD = 8, BASE = H - 16;
    var vals = years.map(function (yr) {
        var r = h.years[String(yr)];
        return r ? r.revenue || 0 : 0;
    });
    var max = 1;
    vals.forEach(function (v) { if (v > max) max = v; });
    var n = years.length;
    var slot = (W - PAD * 2) / Math.max(1, n);
    var bw = Math.max(3, slot * 0.7);
    var bars = years.map(function (yr, i) {
        var v = vals[i];
        var bh = Math.max(v > 0 ? 2 : 0, (v / max) * (BASE - 6));
        var x = PAD + i * slot + (slot - bw) / 2;
        var cls = 'ch-bar' + (yr === sel ? ' ch-bar-sel' : '');
        return '<rect class="' + cls + '" x="' + x.toFixed(1) + '" y="' + (BASE - bh).toFixed(1) +
            '" width="' + bw.toFixed(1) + '" height="' + bh.toFixed(1) + '" data-hist-year="' + yr + '"><title>' + yr + ': ' + _money(v) + '</title></rect>';
    }).join('');
    var labels = '<text class="ch-axis" x="' + PAD + '" y="' + (H - 2) + '">' + years[0] + '</text>' +
        '<text class="ch-axis" x="' + (W - PAD) + '" y="' + (H - 2) + '" text-anchor="end">' + years[n - 1] + '</text>';
    return '<div class="section-label"><span class="section-label-text">Pendapatan penjualan per tahun</span><span class="section-label-line"></span></div>' +
        '<div class="ch-chart-wrap"><svg class="ch-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Pendapatan per tahun">' +
        '<line class="ch-base" x1="' + PAD + '" x2="' + (W - PAD) + '" y1="' + BASE + '" y2="' + BASE + '"/>' +
        bars + labels + '</svg>' +
        '<div class="ch-chart-foot">Puncak ' + _money(max) + ' · ketuk batang untuk membuka tahun</div></div>';
}

function _renderYearCard(data, sel, cur, startY) {
    var v = _yearValues(data, sel, cur);
    var era = getDesignEraForYear(sel);
    var eraLabel = era ? (era.label || era.shortLabel || '') : '';
    var status = sel === cur ? 'Tahun berjalan' : 'Tahun selesai';
    if (!v) {
        return '<div class="section-label"><span class="section-label-text">' + sel + '</span><span class="section-label-line"></span></div>' +
            '<div class="ch-empty">Belum ada catatan untuk tahun ini.</div>';
    }
    var kpis = [
        { ico: 'coin',     lbl: 'Pendapatan penjualan', val: _money(v.revenue) },
        { ico: 'activity', lbl: 'Laba / rugi bersih',   val: (v.net >= 0 ? '+' : '') + _money(v.net), tone: v.net >= 0 ? 'up' : 'down' },
        { ico: 'phone',    lbl: 'Unit terjual',         val: formatUsers(v.unitsSold) },
        { ico: 'sparkles', lbl: 'Produk diluncurkan',   val: String(v.launched) + (v.discontinued ? ' · dihentikan ' + v.discontinued : '') },
        { ico: 'cpu',      lbl: 'Riset selesai',        val: String(v.researchDone + v.chipDone) + ' (chip ' + v.chipDone + ')' },
        { ico: 'signal',   lbl: 'Rilis OS',             val: String(v.osVersions) },
        { ico: 'factory',  lbl: 'Infrastruktur',        val: String(v.infra) + ' pembangunan/upgrade' },
        { ico: 'warn',     lbl: 'Pinjaman / viral',     val: v.loans + ' / ' + v.viral }
    ];
    var endVals = [
        { lbl: 'Kas akhir', val: v.endCash != null ? _money(v.endCash) : '-' },
        { lbl: 'Reputasi', val: v.endReputation != null ? String(v.endReputation) : '-' },
        { lbl: 'Pengguna OS', val: v.endOsUsers != null ? formatUsers(v.endOsUsers) : '-' },
        { lbl: 'Produk aktif', val: v.endProducts != null ? String(v.endProducts) : '-' }
    ];
    return '<div class="section-label"><span class="section-label-text">' + sel + ' · ' + escapeHtml(status) + '</span><span class="section-label-line"></span></div>' +
        (eraLabel ? '<div class="ch-era">' + escapeHtml(eraLabel) + '</div>' : '') +
        '<div class="ch-kpis">' + kpis.map(function (k) {
            return '<div class="ch-kpi ' + (k.tone || '') + '"><div class="ch-kpi-ico">' + renderIcon(k.ico, 13) + '</div>' +
                '<div><div class="ch-kpi-val">' + escapeHtml(k.val) + '</div><div class="ch-kpi-lbl">' + escapeHtml(k.lbl) + '</div></div></div>';
        }).join('') + '</div>' +
        '<div class="ch-ends">' + endVals.map(function (e) {
            return '<div class="ch-end"><span>' + escapeHtml(e.lbl) + '</span><b>' + escapeHtml(e.val) + '</b></div>';
        }).join('') + '</div>';
}

function _renderEvents(h, sel) {
    var filters = '<div class="ch-filters">' +
        ['all'].concat(HISTORY_CATEGORIES.map(function (c) { return c.id; })).map(function (id) {
            var label = id === 'all' ? 'Semua' : (HISTORY_CATEGORIES.find(function (c) { return c.id === id; }) || {}).label;
            return '<button class="ch-filter ' + (_histCat === id ? 'active' : '') + '" data-hist-cat="' + id + '">' + escapeHtml(label) + '</button>';
        }).join('') + '</div>';

    var list = h.chronicle.filter(function (e) {
        return e.year === sel && (_histCat === 'all' || e.cat === _histCat);
    }).sort(function (a, b) {
        return (b.month - a.month) || (b.day - a.day) || (b.id - a.id);
    });

    var rows = list.length ? list.map(function (e) {
        var catLabel = (HISTORY_CATEGORIES.find(function (c) { return c.id === e.cat; }) || {}).label || e.cat;
        var tone = CAT_TONE[e.cat] || 'var(--text-dim)';
        return '<div class="ch-ev">' +
            '<div class="ch-ev-date">' + (e.day || 1) + ' ' + (MONTHS[(e.month || 1) - 1] || '').slice(0, 3) + '</div>' +
            '<div class="ch-ev-body"><div class="ch-ev-title"><span class="ch-dot" style="background:' + tone + '"></span>' + escapeHtml(e.title) + '</div>' +
            (e.detail ? '<div class="ch-ev-detail">' + escapeHtml(e.detail) + '</div>' : '') +
            '<div class="ch-ev-cat">' + escapeHtml(catLabel) + '</div></div></div>';
    }).join('') : '<div class="ch-empty">' + (_histCat === 'all' ? 'Belum ada peristiwa di tahun ini.' : 'Tidak ada peristiwa dalam kategori ini.') + '</div>';

    return '<div class="section-label"><span class="section-label-text">Peristiwa ' + sel + ' · ' + list.length + '</span><span class="section-label-line"></span></div>' +
        filters + '<div class="ch-events">' + rows + '</div>';
}

function _ensureHandlers() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;
    document.addEventListener('click', function (e) {
        var yBtn = e.target && e.target.closest && e.target.closest('[data-hist-year]');
        if (yBtn) {
            _histYear = parseInt(yBtn.getAttribute('data-hist-year'), 10);
            if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
            return;
        }
        var cBtn = e.target && e.target.closest && e.target.closest('[data-hist-cat]');
        if (cBtn) {
            _histCat = cBtn.getAttribute('data-hist-cat');
            if (window.__game && window.__game.renderSoft) window.__game.renderSoft();
        }
    });
}

function _ensureStyles() {
    if (_stylesInjected || typeof document === 'undefined') return;
    _stylesInjected = true;
    var css = [
        '.ch-hero { padding: 12px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); margin: 8px 0; }',
        '.ch-hero-title { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 6px; }',
        '.ch-hero-sub { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.6)); margin-top: 4px; }',
        '.ch-strip { display: flex; gap: 6px; overflow-x: auto; padding: 4px 2px 8px; }',
        '.ch-year { flex: 0 0 auto; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border, rgba(255,255,255,.12)); background: transparent; color: inherit; font-size: 12px; cursor: pointer; }',
        '.ch-year.active { background: var(--accent-soft, rgba(79,140,255,.18)); border-color: var(--accent, #4f8cff); color: var(--accent, #4f8cff); font-weight: 700; }',
        '.ch-year-quiet { opacity: .55; }',
        '.ch-chart-wrap { padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); margin-bottom: 8px; }',
        '.ch-chart { width: 100%; height: 110px; display: block; }',
        '.ch-base { stroke: var(--border, rgba(255,255,255,.18)); stroke-width: 1; vector-effect: non-scaling-stroke; }',
        '.ch-bar { fill: var(--accent, #4f8cff); opacity: .45; cursor: pointer; }',
        '.ch-bar-sel { opacity: 1; }',
        '.ch-axis { font-size: 9px; fill: var(--text-mute, rgba(255,255,255,.55)); }',
        '.ch-chart-foot { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); margin-top: 4px; }',
        '.ch-era { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.6)); margin: 2px 2px 8px; }',
        '.ch-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }',
        '@media (min-width: 640px) { .ch-kpis { grid-template-columns: repeat(4, 1fr); } }',
        '.ch-kpi { display: flex; gap: 8px; align-items: center; padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); }',
        '.ch-kpi.down .ch-kpi-val { color: #f87171; }',
        '.ch-kpi.up .ch-kpi-val { color: #34d399; }',
        '.ch-kpi-ico { width: 24px; height: 24px; border-radius: 8px; display: grid; place-items: center; background: rgba(255,255,255,.06); }',
        '.ch-kpi-val { font-weight: 700; font-size: 13px; }',
        '.ch-kpi-lbl { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); }',
        '.ch-ends { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 8px; }',
        '@media (min-width: 640px) { .ch-ends { grid-template-columns: repeat(4, 1fr); } }',
        '.ch-end { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; padding: 8px 10px; border-radius: 10px; background: rgba(255,255,255,.03); }',
        '.ch-filters { display: flex; gap: 6px; overflow-x: auto; padding: 6px 2px; }',
        '.ch-filter { flex: 0 0 auto; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--border, rgba(255,255,255,.12)); background: transparent; color: inherit; font-size: 11px; cursor: pointer; }',
        '.ch-filter.active { border-color: var(--accent, #4f8cff); color: var(--accent, #4f8cff); }',
        '.ch-events { display: grid; gap: 6px; margin-top: 6px; }',
        '.ch-ev { display: grid; grid-template-columns: 52px 1fr; gap: 8px; padding: 10px; border-radius: 12px; background: var(--surface, rgba(255,255,255,.04)); }',
        '.ch-ev-date { font-size: 11px; color: var(--text-mute, rgba(255,255,255,.55)); padding-top: 2px; }',
        '.ch-ev-title { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }',
        '.ch-dot { width: 7px; height: 7px; border-radius: 999px; display: inline-block; flex: 0 0 auto; }',
        '.ch-ev-detail { font-size: 12px; color: var(--text-dim, rgba(255,255,255,.65)); margin-top: 2px; }',
        '.ch-ev-cat { font-size: 10px; color: var(--text-mute, rgba(255,255,255,.5)); margin-top: 3px; }',
        '.ch-era, .ch-empty { font-size: 12px; color: var(--text-mute, rgba(255,255,255,.55)); padding: 8px 2px; }'
    ].join('\n');
    var style = document.createElement('style');
    style.setAttribute('data-company-history', '');
    style.textContent = css;
    document.head.appendChild(style);
}
