// FILE: src/ui/panels/ExchangePanel.js  (REPLACE — i18n)
// v2027.4a — Exchange "Rich & Alive":
//   • Market Pulse (sentimen, breadth, indeks + sparkline, top gainers/losers)
//   • Daftar emiten: cari, urut, filter (milik saya / watchlist), sparkline per baris
//   • Detail: grafik interaktif (rentang + crosshair), statistik, posisi Anda
//   • Portofolio: net worth, P/L, alokasi per kategori, holding bisa diklik
//   • Riwayat transaksi: ikon, harga per lembar, "lihat semua"
// Drop-in: hanya file ini yang diganti. API ekspor lama tetap sama
// (renderExchangePanel, setExchangeCategory, setExchangeStock,
//  drawExchangeChart, openBuyModal, openSellModal).
// i18n: semua teks lewat S(key, fallbackID, fallbackEN) → t() dulu, fallback sesuai
// bahasa aktif. Nama negara & kategori (data bahasa Indonesia) ikut diterjemahkan.
// Saat 'lang:changed': panel dirender ulang & modal beli/jual dibuka ulang
// (jumlah lembar yang sudah diketik dipertahankan).
import { t, LanguageService } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import {
    STOCKS, MARKET_INDICES, STOCK_CATEGORIES, CURRENCIES,
    getStockById, getStocksForYear
} from '../../data/stocks.data.js';
import { WalletService } from '../../systems/WalletService.js';

// ============================================================
// STATE MODUL (bertahan walau panel di-render ulang)
// ============================================================
var _selectedCategory = 'all';
var _selectedStockId = null;
var _search = '';
var _sort = 'change';          // change | gainers | losers | price | name
var _filterMode = 'all';       // all | held | watch
var _range = '3y';             // 1y | 3y | 5y | max
var _showAllTx = false;
var _sys = null;               // stockSystem terakhir yang dirender
var _lastPrices = {};          // untuk animasi flash naik/turun
var _hoverIdx = -1;
var _geo = null;               // geometri grafik terakhir (untuk crosshair)
var _seriesCache = {};
var _bound = false;

export function setExchangeCategory(catId) { _selectedCategory = catId; }
export function setExchangeStock(stockId)   { _selectedStockId = stockId; }

// ============================================================
// KONSTANTA TAMPILAN
// ============================================================
var CAT_COLORS = {
    phone: '#4f8cff', chip: '#a78bfa', software: '#22d3ee', social: '#f472b6',
    streaming: '#fb923c', ecommerce: '#facc15', other: '#94a3b8', player: '#10b981'
};
var FLAGS = {
    'Amerika Serikat': '🇺🇸', 'Finlandia': '🇫🇮', 'Kanada': '🇨🇦', 'Korea Selatan': '🇰🇷',
    'Taiwan': '🇹🇼', 'Tiongkok': '🇨🇳', 'Jepang': '🇯🇵', 'Indonesia': '🇮🇩',
    'Belanda': '🇳🇱', 'Inggris': '🇬🇧', 'Swedia': '🇸🇪'
};
var MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var RANGES = [
    { id: '1y', n: 12, label: '1T', labelEn: '1Y' },
    { id: '3y', n: 36, label: '3T', labelEn: '3Y' },
    { id: '5y', n: 60, label: '5T', labelEn: '5Y' },
    { id: 'max', n: 0, label: 'MAX', labelEn: 'MAX' }
];

// ============================================================
// HELPER UMUM
// ============================================================
function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _isEn() {
    try { return LanguageService.getLang() === 'en'; } catch (e) { return false; }
}

// Teks: pakai i18n (t) bila key ada di kamus, jika tidak pakai fallback
// (ID/EN sesuai bahasa aktif). Fallback tetap menjaga UI utuh bila kamus belum lengkap.
function S(key, id, en) {
    var v = t(key);
    if (v && v !== key) return v;
    return (_isEn() && en) ? en : id;
}

function _monthName(m) {
    var i = ((m - 1) % 12 + 12) % 12;
    var key = 'date.month.' + (i + 1);
    var v = t(key);
    if (v && v !== key) return v;
    return (_isEn() ? MONTHS_EN : MONTHS_ID)[i];
}
function _fmtDate(p) { return _monthName(p.month) + ' ' + p.year; }

function _fmtCurrency(value, currency) {
    var c = CURRENCIES[currency] || CURRENCIES.USD;
    var n = Number(value);
    if (!isFinite(n)) return '—';
    return c.symbol + n.toLocaleString('en-US', {
        minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals
    });
}

function _fmtUSD(value) {
    var n = Number(value);
    if (!isFinite(n)) return '—';
    var neg = n < 0;
    return (neg ? '−' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _fmtUSDCompact(value) {
    var n = Number(value);
    if (!isFinite(n)) return '—';
    var a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e9) return s + '$' + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return s + '$' + (a / 1e3).toFixed(1) + 'K';
    return _fmtUSD(n);
}

function _fmtChange(pct) {
    if (!isFinite(pct) || Math.abs(pct) < 0.00005) return '0.00%';
    return (pct > 0 ? '+' : '') + (pct * 100).toFixed(2) + '%';
}

function _dir(pct) { return pct > 0.0001 ? 'up' : (pct < -0.0001 ? 'down' : 'flat'); }
function _arrow(pct) { return pct > 0.0001 ? '▲' : (pct < -0.0001 ? '▼' : '•'); }
function _dirColor(pct) {
    var d = _dir(pct);
    return d === 'up' ? 'var(--success)' : (d === 'down' ? 'var(--danger)' : 'var(--text-tertiary)');
}

var CAT_EN = {
    phone: 'Phones', chip: 'Chips', software: 'Software', social: 'Social Media',
    streaming: 'Streaming', ecommerce: 'E-commerce', other: 'Other', player: 'Your Company'
};
function _categoryLabel(id) {
    for (var i = 0; i < STOCK_CATEGORIES.length; i++) {
        if (STOCK_CATEGORIES[i].id === id) {
            return S('exchange.cat.' + id, STOCK_CATEGORIES[i].label, CAT_EN[id]);
        }
    }
    return id;
}

// Data saham menyimpan nama negara dalam bahasa Indonesia → terjemahkan di sini.
var COUNTRY_I18N = {
    'Amerika Serikat': { k: 'us', en: 'United States' },
    'Finlandia':       { k: 'fi', en: 'Finland' },
    'Kanada':          { k: 'ca', en: 'Canada' },
    'Korea Selatan':   { k: 'kr', en: 'South Korea' },
    'Taiwan':          { k: 'tw', en: 'Taiwan' },
    'Tiongkok':        { k: 'cn', en: 'China' },
    'Jepang':          { k: 'jp', en: 'Japan' },
    'Indonesia':       { k: 'id', en: 'Indonesia' },
    'Belanda':         { k: 'nl', en: 'Netherlands' },
    'Inggris':         { k: 'gb', en: 'United Kingdom' },
    'Swedia':          { k: 'se', en: 'Sweden' }
};
function _countryLabel(country) {
    if (!country) return '—';
    var c = COUNTRY_I18N[country];
    if (!c) return country;
    return S('exchange.country.' + c.k, country, c.en);
}

function _flag(country) { return FLAGS[country] || '🌐'; }

function _holdingOf(stockSystem, stockId) {
    var p = stockSystem.state.data.stocks.portfolio || [];
    for (var i = 0; i < p.length; i++) if (p[i].stockId === stockId) return p[i];
    return null;
}

// ---------- Watchlist (disimpan di save game) ----------
function _watchlist(stockSystem) {
    var st = stockSystem.state.data.stocks;
    if (!Array.isArray(st.watchlist)) st.watchlist = [];
    return st.watchlist;
}
function _isWatched(stockSystem, id) { return _watchlist(stockSystem).indexOf(id) !== -1; }
function _toggleWatch(stockSystem, id) {
    var w = _watchlist(stockSystem);
    var i = w.indexOf(id);
    if (i === -1) w.push(id); else w.splice(i, 1);
    return i === -1;
}

// ---------- Seri data (di-cache per bulan game) ----------
function _timeKey(stockSystem) {
    var tm = stockSystem.state.data.time;
    return tm.currentYear + '-' + tm.currentMonth;
}
function _series(stockSystem, stockId) {
    var key = _timeKey(stockSystem) + '|' + stockId;
    if (_seriesCache[key]) return _seriesCache[key];
    // buang cache bulan lama
    var tk = _timeKey(stockSystem) + '|';
    Object.keys(_seriesCache).forEach(function (k) { if (k.indexOf(tk) !== 0) delete _seriesCache[k]; });
    var s = stockSystem.getSeries(stockId) || [];
    _seriesCache[key] = s;
    return s;
}
function _indexSeries(stockSystem, idx, n) {
    var key = _timeKey(stockSystem) + '|idx:' + idx.id;
    if (_seriesCache[key]) return _seriesCache[key].slice(-n);
    var tm = stockSystem.state.data.time;
    var out = [];
    if (typeof stockSystem._interpolate !== 'function') return out;
    for (var y = 1999; y <= tm.currentYear; y++) {
        var lim = (y === tm.currentYear) ? tm.currentMonth : 12;
        for (var m = 1; m <= lim; m++) {
            var v = stockSystem._interpolate(idx.valueByYear, y, m);
            if (v != null) out.push({ year: y, month: m, value: v });
        }
    }
    _seriesCache[key] = out;
    return out.slice(-n);
}
function _indexChange(stockSystem, id) {
    var h = stockSystem.state.data.stocks.history || [];
    if (h.length < 2 || !h[0].indices || !h[1].indices) return 0;
    var c = h[0].indices[id], p = h[1].indices[id];
    if (c == null || p == null || p === 0) return 0;
    return (c - p) / p;
}

// ---------- SVG sparkline ----------
function _spark(values, w, h, color) {
    if (!values || values.length < 2) {
        return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '"></svg>';
    }
    var min = Infinity, max = -Infinity, i;
    for (i = 0; i < values.length; i++) { if (values[i] < min) min = values[i]; if (values[i] > max) max = values[i]; }
    var range = (max - min) || 1;
    var pad = 2;
    var pts = values.map(function (v, k) {
        var x = pad + ((w - pad * 2) * k) / (values.length - 1);
        var y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);
        return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var area = 'M' + pts[0] + ' L' + pts.join(' L') + ' L' + (w - pad) + ',' + (h - pad) + ' L' + pad + ',' + (h - pad) + ' Z';
    var last = pts[pts.length - 1].split(',');
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' +
        '<path d="' + area + '" fill="' + color + '" opacity="0.13"/>' +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="' + last[0] + '" cy="' + last[1] + '" r="2" fill="' + color + '"/></svg>';
}

function _sparkColor(values) {
    if (!values || values.length < 2) return '#94a3b8';
    return values[values.length - 1] >= values[0] ? '#10b981' : '#ef4444';
}

function _avatar(stock, size) {
    var c = CAT_COLORS[stock.category] || '#94a3b8';
    var sz = size || 36;
    return '<div class="ex-ava" style="width:' + sz + 'px;height:' + sz + 'px;background:' + c + '22;color:' + c +
        ';border-color:' + c + '55;font-size:' + Math.round(sz * 0.3) + 'px;">' +
        escapeHtml(stock.ticker.slice(0, 4)) + '</div>';
}

// ============================================================
// CSS (disuntik sekali)
// ============================================================
function _ensureStyles() {
    if (typeof document === 'undefined' || document.getElementById('ex-style')) return;
    var css = [
        '.ex-root{display:flex;flex-direction:column;gap:12px;}',
        '.ex-root .card{margin-bottom:0;}',
        '.ex-sec-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10.5px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:10px;}',
        '.ex-mute{color:var(--text-tertiary);}',
        '.ex-num{font-variant-numeric:tabular-nums;}',
        /* pulse */
        '.ex-pulse{background:linear-gradient(135deg,var(--accent-soft),transparent 70%),var(--bg-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px;}',
        '.ex-pulse-head{display:flex;justify-content:space-between;align-items:center;gap:10px;}',
        '.ex-live{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:.8px;color:var(--success);}',
        '.ex-live i{width:7px;height:7px;border-radius:50%;background:var(--success);box-shadow:0 0 0 0 rgba(16,185,129,.6);animation:ex-pulse 1.8s infinite;}',
        '@keyframes ex-pulse{0%{box-shadow:0 0 0 0 rgba(16,185,129,.55);}70%{box-shadow:0 0 0 8px rgba(16,185,129,0);}100%{box-shadow:0 0 0 0 rgba(16,185,129,0);}}',
        '.ex-date{font-size:11px;color:var(--text-secondary);font-weight:600;}',
        '.ex-mood{display:flex;align-items:baseline;gap:8px;margin-top:10px;}',
        '.ex-mood b{font-size:20px;font-weight:800;letter-spacing:-.02em;}',
        '.ex-mood span{font-size:11.5px;color:var(--text-secondary);}',
        '.ex-breadth{display:flex;height:6px;border-radius:99px;overflow:hidden;background:var(--bg-3);margin-top:10px;}',
        '.ex-breadth i{display:block;height:100%;transition:width .5s ease;}',
        '.ex-breadth-lg{display:flex;justify-content:space-between;font-size:10.5px;margin-top:5px;font-weight:600;}',
        '.ex-idx-row{display:flex;gap:8px;overflow-x:auto;margin-top:12px;padding-bottom:2px;scrollbar-width:none;}',
        '.ex-idx-row::-webkit-scrollbar{display:none;}',
        '.ex-idx{flex:1 0 118px;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-md);padding:9px 10px;min-width:0;}',
        '.ex-idx-t{font-size:10px;font-weight:800;letter-spacing:.5px;color:var(--text-tertiary);}',
        '.ex-idx-v{font-size:15px;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums;}',
        '.ex-idx-c{font-size:10.5px;font-weight:700;margin-top:1px;}',
        '.ex-idx svg{display:block;margin-top:5px;width:100%;}',
        /* movers */
        '.ex-movers{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
        '.ex-mv-col{background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-lg);padding:10px;min-width:0;}',
        '.ex-mv-h{font-size:10px;font-weight:800;letter-spacing:.6px;margin-bottom:6px;}',
        '.ex-mv{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:6px 4px;border-radius:var(--r);cursor:pointer;font-size:12px;}',
        '.ex-mv:active{background:var(--bg-3);}',
        '.ex-mv b{font-weight:800;}',
        '.ex-mv span{font-weight:700;font-variant-numeric:tabular-nums;font-size:11.5px;}',
        /* toolbar */
        '.ex-search{position:relative;}',
        '.ex-search input{width:100%;box-sizing:border-box;padding:10px 34px 10px 36px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-md);color:var(--text-primary);font-size:13px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s;}',
        '.ex-search input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft);}',
        '.ex-search .ex-s-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;opacity:.6;pointer-events:none;}',
        '.ex-search .ex-s-clr{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:26px;height:26px;border:none;background:transparent;color:var(--text-tertiary);font-size:14px;cursor:pointer;}',
        '.ex-chips{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:1px 0;}',
        '.ex-chips::-webkit-scrollbar{display:none;}',
        '.ex-chips .chip-small{flex:0 0 auto;white-space:nowrap;}',
        '.ex-cnt{opacity:.65;font-weight:700;margin-left:4px;font-size:10px;}',
        '.ex-tools{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;}',
        /* list */
        '.ex-list{padding:0;overflow:hidden;}',
        '.ex-list-h{padding:12px 14px 8px;}',
        '.ex-row{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;border-left:3px solid transparent;border-top:1px solid var(--border);transition:background .15s;}',
        '.ex-row:active{background:var(--bg-3);}',
        '@media (hover:hover){.ex-row:hover{background:var(--bg-3);}}',
        '.ex-row.sel{background:var(--accent-soft);border-left-color:var(--accent);}',
        '.ex-ava{flex:0 0 auto;display:flex;align-items:center;justify-content:center;border-radius:11px;border:1px solid;font-weight:800;letter-spacing:-.02em;}',
        '.ex-row-main{flex:1;min-width:0;}',
        '.ex-row-name{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px;}',
        '.ex-row-sub{font-size:10.5px;color:var(--text-tertiary);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.ex-row-spark{flex:0 0 auto;}',
        '.ex-row-px{flex:0 0 auto;text-align:right;min-width:78px;}',
        '.ex-px{font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;display:inline-block;padding:0 3px;border-radius:4px;}',
        '.ex-chg{font-size:11px;font-weight:700;margin-top:2px;font-variant-numeric:tabular-nums;}',
        '.ex-held{font-size:9px;font-weight:800;background:var(--accent-soft);color:var(--accent);padding:1px 6px;border-radius:99px;letter-spacing:.3px;}',
        '.ex-star{border:none;background:transparent;font-size:16px;line-height:1;padding:6px;cursor:pointer;color:var(--text-disabled);transition:transform .15s,color .15s;}',
        '.ex-star.on{color:#facc15;}',
        '.ex-star:active{transform:scale(1.3);}',
        '@keyframes ex-flash-up{0%{background:rgba(16,185,129,.38);}100%{background:transparent;}}',
        '@keyframes ex-flash-dn{0%{background:rgba(239,68,68,.38);}100%{background:transparent;}}',
        '.ex-flash-up{animation:ex-flash-up 1.4s ease-out;}',
        '.ex-flash-down{animation:ex-flash-dn 1.4s ease-out;}',
        '.ex-empty{padding:26px 16px;text-align:center;color:var(--text-tertiary);font-size:12.5px;line-height:1.6;}',
        '.ex-empty big{display:block;font-size:26px;margin-bottom:6px;}',
        /* detail */
        '.ex-d-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}',
        '.ex-d-id{display:flex;gap:10px;align-items:center;min-width:0;}',
        '.ex-d-name{font-size:17px;font-weight:800;letter-spacing:-.01em;line-height:1.2;}',
        '.ex-d-sub{font-size:11.5px;color:var(--text-tertiary);margin-top:3px;}',
        '.ex-d-px{text-align:right;flex:0 0 auto;}',
        '.ex-d-px .ex-px{font-size:20px;}',
        '.ex-ranges{display:flex;gap:4px;background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-pill);padding:3px;}',
        '.ex-ranges button{border:none;background:transparent;color:var(--text-secondary);font-size:11px;font-weight:700;padding:5px 11px;border-radius:99px;cursor:pointer;font-family:inherit;}',
        '.ex-ranges button.on{background:var(--accent);color:#fff;box-shadow:0 2px 6px var(--accent-glow);}',
        '.ex-chartbox{position:relative;height:180px;margin-top:10px;touch-action:pan-y;}',
        '.ex-chartbox canvas{display:block;width:100%;height:180px;}',
        '.ex-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}',
        '.ex-stat{background:var(--bg-1);border:1px solid var(--border);border-radius:var(--r-md);padding:9px 10px;min-width:0;}',
        '.ex-stat small{display:block;font-size:9.5px;font-weight:700;letter-spacing:.4px;color:var(--text-tertiary);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.ex-stat b{display:block;font-size:12.5px;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.ex-pos{margin-top:14px;padding:12px;border-radius:var(--r-md);background:var(--accent-soft);border:1px solid var(--accent-glow);}',
        '.ex-pos-h{font-size:10px;font-weight:800;letter-spacing:.6px;color:var(--accent);margin-bottom:6px;}',
        '.ex-pos-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;}',
        '.ex-pos-grid small{display:block;font-size:10px;color:var(--text-secondary);}',
        '.ex-pos-grid b{font-size:13px;font-variant-numeric:tabular-nums;}',
        '.ex-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}',
        '.ex-tag{font-size:10.5px;font-weight:600;padding:4px 9px;border-radius:99px;background:var(--bg-3);color:var(--text-secondary);border:1px solid var(--border);}',
        '.ex-trade{display:flex;gap:8px;margin-top:14px;}',
        '.ex-trade button{flex:1;padding:12px;font-weight:800;font-size:13.5px;border-radius:var(--r-md);}',
        '.ex-note{font-size:10.5px;color:var(--text-tertiary);margin-top:10px;line-height:1.5;}',
        /* portfolio */
        '.ex-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;}',
        '.ex-hero-v{font-size:26px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.1;}',
        '.ex-hero-sub{font-size:11.5px;margin-top:4px;font-weight:700;}',
        '.ex-pf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;}',
        '.ex-alloc{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--bg-3);margin-top:14px;}',
        '.ex-alloc i{display:block;height:100%;transition:width .5s ease;}',
        '.ex-legend{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px;font-size:10.5px;color:var(--text-secondary);}',
        '.ex-legend span{display:inline-flex;align-items:center;gap:5px;}',
        '.ex-legend em{width:8px;height:8px;border-radius:50%;display:inline-block;}',
        '.ex-hold{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--border);cursor:pointer;}',
        '.ex-hold-l{display:flex;align-items:center;gap:10px;min-width:0;}',
        '.ex-hold-r{text-align:right;flex:0 0 auto;}',
        /* tx */
        '.ex-tx{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--border);}',
        '.ex-tx-ico{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;}',
        '.ex-tx-l{display:flex;align-items:center;gap:10px;min-width:0;}',
        '.ex-more{display:block;width:100%;margin-top:6px;padding:9px;border:none;background:var(--bg-3);color:var(--text-secondary);border-radius:var(--r-md);font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;}',
        '@media (prefers-reduced-motion:reduce){.ex-live i,.ex-flash-up,.ex-flash-down{animation:none;}.ex-breadth i,.ex-alloc i{transition:none;}}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'ex-style';
    el.textContent = css;
    document.head.appendChild(el);
}

// ============================================================
// RENDER UTAMA
// ============================================================
export function renderExchangePanel(opts) {
    var stockSystem = opts && opts.stockSystem;
    if (!stockSystem) {
        return '<div class="card"><div class="card-title">' + S('exchange.title', 'Bursa Saham', 'Exchange') + '</div>' +
            '<div class="ex-empty">' + S('exchange.not_ready', 'Sistem saham belum siap.', 'Stock system is not ready.') + '</div></div>';
    }
    _sys = stockSystem;
    _ensureStyles();
    _bindOnce();

    var active = getStocksForYear(stockSystem.state.data.time.currentYear);
    if (!_selectedStockId || !active.some(function (s) { return s.id === _selectedStockId; })) {
        _selectedStockId = active.length ? active[0].id : null;
    }
    return '<div class="ex-root" data-ex-root>' + _renderInner(stockSystem, active) + '</div>';
}

function _renderInner(stockSystem, active) {
    var html =
        '<div data-ex-sec="pulse">' + _renderPulse(stockSystem, active) + '</div>' +
        '<div data-ex-sec="movers">' + _renderMovers(stockSystem, active) + '</div>' +
        '<div data-ex-sec="list">' + _renderBrowse(stockSystem, active) + '</div>' +
        '<div data-ex-sec="detail">' + _renderDetail(stockSystem) + '</div>' +
        '<div data-ex-sec="portfolio">' + _renderPortfolio(stockSystem) + '</div>' +
        '<div data-ex-sec="tx">' + _renderTransactions(stockSystem) + '</div>';
    // catat harga untuk animasi flash render berikutnya
    active.forEach(function (s) { _lastPrices[s.id] = stockSystem.getPrice(s.id); });
    return html;
}

// ---------- refresh parsial (tanpa renderView penuh) ----------
function _root() { return document.querySelector('[data-ex-root]'); }

function _refreshAll() {
    var root = _root();
    if (!root || !_sys) return;
    var active = getStocksForYear(_sys.state.data.time.currentYear);
    var y = root.closest('#view') ? root.closest('#view').scrollTop : null;
    root.innerHTML = _renderInner(_sys, active);
    _drawChartInRoot();
    if (y != null && root.closest('#view')) root.closest('#view').scrollTop = y;
}

function _refreshSection(name) {
    var root = _root();
    if (!root || !_sys) return;
    var el = root.querySelector('[data-ex-sec="' + name + '"]');
    if (!el) return;
    var active = getStocksForYear(_sys.state.data.time.currentYear);
    if (name === 'list') el.innerHTML = _renderBrowse(_sys, active, true);
    else if (name === 'detail') { el.innerHTML = _renderDetail(_sys); _drawChartInRoot(); }
    else if (name === 'portfolio') el.innerHTML = _renderPortfolio(_sys);
    else if (name === 'tx') el.innerHTML = _renderTransactions(_sys);
    else if (name === 'movers') el.innerHTML = _renderMovers(_sys, active);
}

function _drawChartInRoot() {
    var root = _root();
    if (!root) return;
    var c = root.querySelector('[data-ex-chart]');
    if (c) drawExchangeChart(c);
}

// ============================================================
// 1. MARKET PULSE
// ============================================================
function _renderPulse(stockSystem, active) {
    var tm = stockSystem.state.data.time;
    var up = 0, down = 0, flat = 0;
    active.forEach(function (s) {
        var d = _dir(stockSystem.getChangePercent(s.id));
        if (d === 'up') up++; else if (d === 'down') down++; else flat++;
    });
    var total = Math.max(1, up + down + flat);
    var ratio = up / total;
    var mood, moodColor, moodIcon;
    if (up + down === 0) { mood = S('exchange.mood.wait', 'Menunggu data', 'Awaiting data'); moodColor = 'var(--text-secondary)'; moodIcon = '⏳'; }
    else if (ratio >= 0.62) { mood = S('exchange.mood.bull', 'Bullish', 'Bullish'); moodColor = 'var(--success)'; moodIcon = '🐂'; }
    else if (ratio <= 0.38) { mood = S('exchange.mood.bear', 'Bearish', 'Bearish'); moodColor = 'var(--danger)'; moodIcon = '🐻'; }
    else { mood = S('exchange.mood.flat', 'Netral', 'Neutral'); moodColor = 'var(--warn)'; moodIcon = '⚖️'; }

    var idxCards = MARKET_INDICES.map(function (idx) {
        var v = stockSystem.getIndexValue(idx.id);
        var ch = _indexChange(stockSystem, idx.id);
        var ser = _indexSeries(stockSystem, idx, 24).map(function (p) { return p.value; });
        return '<div class="ex-idx">' +
            '<div class="ex-idx-t">' + escapeHtml(idx.ticker) + '</div>' +
            '<div class="ex-idx-v">' + v.toLocaleString('en-US', { maximumFractionDigits: 2 }) + '</div>' +
            '<div class="ex-idx-c" style="color:' + _dirColor(ch) + ';">' + _arrow(ch) + ' ' + _fmtChange(ch) + '</div>' +
            _spark(ser, 100, 26, _sparkColor(ser)) +
        '</div>';
    }).join('');

    return '<div class="ex-pulse">' +
        '<div class="ex-pulse-head">' +
            '<span class="ex-live"><i></i>' + S('exchange.live', 'BURSA BUKA', 'MARKET OPEN') + '</span>' +
            '<span class="ex-date">' + _monthName(tm.currentMonth) + ' ' + tm.currentYear + '</span>' +
        '</div>' +
        '<div class="ex-mood"><b style="color:' + moodColor + ';">' + moodIcon + ' ' + mood + '</b>' +
            '<span>' + S('exchange.breadth_txt', '{n} dari {m} emiten naik bulan ini', '{n} of {m} stocks up this month')
                .replace('{n}', up).replace('{m}', up + down + flat) + '</span></div>' +
        '<div class="ex-breadth">' +
            '<i style="width:' + (up / total * 100).toFixed(1) + '%;background:var(--success);"></i>' +
            '<i style="width:' + (flat / total * 100).toFixed(1) + '%;background:var(--text-disabled);"></i>' +
            '<i style="width:' + (down / total * 100).toFixed(1) + '%;background:var(--danger);"></i>' +
        '</div>' +
        '<div class="ex-breadth-lg"><span style="color:var(--success);">▲ ' + up + '</span>' +
            '<span class="ex-mute">• ' + flat + '</span><span style="color:var(--danger);">▼ ' + down + '</span></div>' +
        '<div class="ex-idx-row">' + idxCards + '</div>' +
    '</div>';
}

// ============================================================
// 2. MOVERS (Top gainers / losers)
// ============================================================
function _renderMovers(stockSystem, active) {
    var rows = active.map(function (s) { return { s: s, ch: stockSystem.getChangePercent(s.id) }; })
        .filter(function (r) { return Math.abs(r.ch) > 0.0001; });
    if (rows.length < 2) return '';
    var gain = rows.filter(function (r) { return r.ch > 0; }).sort(function (a, b) { return b.ch - a.ch; }).slice(0, 3);
    var lose = rows.filter(function (r) { return r.ch < 0; }).sort(function (a, b) { return a.ch - b.ch; }).slice(0, 3);

    function col(list, title, color) {
        var inner = list.length ? list.map(function (r) {
            return '<div class="ex-mv" data-ex2-pick="' + r.s.id + '">' +
                '<b>' + escapeHtml(r.s.ticker) + '</b>' +
                '<span style="color:' + color + ';">' + _fmtChange(r.ch) + '</span></div>';
        }).join('') : '<div class="ex-mute" style="font-size:11px;padding:6px 4px;">—</div>';
        return '<div class="ex-mv-col"><div class="ex-mv-h" style="color:' + color + ';">' + title + '</div>' + inner + '</div>';
    }
    return '<div class="ex-movers">' +
        col(gain, '🔥 ' + S('exchange.gainers', 'TOP NAIK', 'TOP GAINERS'), 'var(--success)') +
        col(lose, '🧊 ' + S('exchange.losers', 'TOP TURUN', 'TOP LOSERS'), 'var(--danger)') +
    '</div>';
}

// ============================================================
// 3. TOOLBAR + DAFTAR EMITEN
// ============================================================
function _sortLabel(id) {
    var m = {
        change: S('exchange.sort.change', 'Perubahan', 'Change'),
        gainers: S('exchange.sort.gainers', 'Naik', 'Gainers'),
        losers: S('exchange.sort.losers', 'Turun', 'Losers'),
        price: S('exchange.sort.price', 'Harga', 'Price'),
        name: S('exchange.sort.name', 'A–Z', 'A–Z')
    };
    return m[id];
}

function _renderBrowse(stockSystem, active, listOnly) {
    var cats = [{ id: 'all', label: S('exchange.cat.all', 'Semua', 'All') }].concat(
        STOCK_CATEGORIES.filter(function (c) { return c.id !== 'player'; })
    );
    var counts = {};
    active.forEach(function (s) { counts[s.category] = (counts[s.category] || 0) + 1; });

    var catChips = cats.map(function (c) {
        var n = c.id === 'all' ? active.length : (counts[c.id] || 0);
        if (c.id !== 'all' && !n) return '';
        return '<button class="chip-small' + (_selectedCategory === c.id ? ' active' : '') + '" data-ex2-cat="' + c.id + '">' +
            escapeHtml(c.id === 'all' ? c.label : _categoryLabel(c.id)) + '<span class="ex-cnt">' + n + '</span></button>';
    }).join('');

    var heldN = (stockSystem.state.data.stocks.portfolio || []).length;
    var watchN = _watchlist(stockSystem).length;
    var filters =
        '<button class="chip-small' + (_filterMode === 'all' ? ' active' : '') + '" data-ex2-filter="all">' + S('exchange.f.all', 'Semua', 'All') + '</button>' +
        '<button class="chip-small' + (_filterMode === 'held' ? ' active' : '') + '" data-ex2-filter="held">💼 ' + S('exchange.f.held', 'Milik saya', 'Mine') + '<span class="ex-cnt">' + heldN + '</span></button>' +
        '<button class="chip-small' + (_filterMode === 'watch' ? ' active' : '') + '" data-ex2-filter="watch">★ ' + S('exchange.f.watch', 'Watchlist', 'Watchlist') + '<span class="ex-cnt">' + watchN + '</span></button>';

    var sorts = ['change', 'gainers', 'losers', 'price', 'name'].map(function (id) {
        return '<button class="chip-small' + (_sort === id ? ' active' : '') + '" data-ex2-sort="' + id + '">' + _sortLabel(id) + '</button>';
    }).join('');

    var toolbar = '';
    if (!listOnly) {
        toolbar =
            '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">' +
                '<div class="ex-search"><span class="ex-s-ico">🔍</span>' +
                    '<input type="search" data-ex2-search placeholder="' + escapeHtml(S('exchange.search', 'Cari emiten, ticker, negara…', 'Search stock, ticker, country…')) +
                    '" value="' + escapeHtml(_search) + '" autocomplete="off" />' +
                    (_search ? '<button class="ex-s-clr" data-ex2-clear aria-label="' + escapeHtml(S('exchange.aria.clear', 'Hapus pencarian', 'Clear search')) + '">✕</button>' : '') +
                '</div>' +
                '<div class="ex-chips" data-ex-chips-cat>' + catChips + '</div>' +
                '<div class="ex-chips">' + filters + '</div>' +
                '<div class="ex-chips"><span class="ex-mute" style="font-size:10.5px;align-self:center;font-weight:700;">' + S('exchange.sort_by', 'URUTKAN', 'SORT') + '</span>' + sorts + '</div>' +
            '</div>';
    }

    return toolbar + '<div data-ex-listbox>' + _renderStockList(stockSystem, active) + '</div>';
}

function _filteredStocks(stockSystem, active) {
    var q = _search.trim().toLowerCase();
    var watch = _watchlist(stockSystem);
    var out = active.filter(function (s) {
        if (_selectedCategory !== 'all' && s.category !== _selectedCategory) return false;
        if (_filterMode === 'held' && !_holdingOf(stockSystem, s.id)) return false;
        if (_filterMode === 'watch' && watch.indexOf(s.id) === -1) return false;
        if (q) {
            var hay = (s.name + ' ' + s.ticker + ' ' + (s.realTicker || '') + ' ' + (s.country || '') + ' ' + _countryLabel(s.country) + ' ' + _categoryLabel(s.category)).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        return true;
    });
    var chg = function (s) { return stockSystem.getChangePercent(s.id); };
    out.sort(function (a, b) {
        if (_sort === 'gainers') return chg(b) - chg(a);
        if (_sort === 'losers') return chg(a) - chg(b);
        if (_sort === 'price') return stockSystem.getPriceUSD(b.id) - stockSystem.getPriceUSD(a.id);
        if (_sort === 'name') return a.name.localeCompare(b.name);
        return Math.abs(chg(b)) - Math.abs(chg(a));   // 'change' = pergerakan terbesar
    });
    return out;
}

function _renderStockList(stockSystem, active) {
    var list = _filteredStocks(stockSystem, active);

    if (!list.length) {
        var msg = _filterMode === 'held'
            ? S('exchange.empty.held', 'Kamu belum memegang saham apa pun.', 'You do not hold any stocks yet.')
            : _filterMode === 'watch'
                ? S('exchange.empty.watch', 'Watchlist kosong. Ketuk ☆ pada emiten untuk menandainya.', 'Watchlist is empty. Tap ☆ on a stock to add it.')
                : S('exchange.empty', 'Tidak ada emiten yang cocok.', 'No matching stocks.');
        return '<div class="card"><div class="ex-empty"><big>🔎</big>' + msg + '</div></div>';
    }

    var rows = list.map(function (s) {
        var price = stockSystem.getPrice(s.id);
        var change = stockSystem.getChangePercent(s.id);
        var color = _dirColor(change);
        var prev = _lastPrices[s.id];
        var flash = '';
        if (prev != null && Math.abs(prev - price) > 1e-9) flash = price > prev ? ' ex-flash-up' : ' ex-flash-down';
        var holding = _holdingOf(stockSystem, s.id);
        var ser = _series(stockSystem, s.id).slice(-18).map(function (p) { return p.value; });
        var watched = _isWatched(stockSystem, s.id);
        return '<div class="ex-row' + (s.id === _selectedStockId ? ' sel' : '') + '" data-ex2-pick="' + s.id + '">' +
            _avatar(s, 38) +
            '<div class="ex-row-main">' +
                '<div class="ex-row-name">' + escapeHtml(s.name) +
                    (holding ? '<span class="ex-held">' + holding.shares.toLocaleString('en-US') + '</span>' : '') + '</div>' +
                '<div class="ex-row-sub">' + _flag(s.country) + ' ' + escapeHtml(s.ticker) + ' · ' + escapeHtml(_categoryLabel(s.category)) + '</div>' +
            '</div>' +
            '<div class="ex-row-spark">' + _spark(ser, 56, 26, _sparkColor(ser)) + '</div>' +
            '<div class="ex-row-px">' +
                '<div><span class="ex-px' + flash + '">' + _fmtCurrency(price, s.currency) + '</span></div>' +
                '<div class="ex-chg" style="color:' + color + ';">' + _arrow(change) + ' ' + _fmtChange(change) + '</div>' +
            '</div>' +
            '<button class="ex-star' + (watched ? ' on' : '') + '" data-ex2-star="' + s.id + '" aria-label="' + escapeHtml(S('exchange.aria.watchlist', 'Watchlist', 'Watchlist')) + '">' + (watched ? '★' : '☆') + '</button>' +
        '</div>';
    }).join('');

    return '<div class="card ex-list">' +
        '<div class="ex-list-h ex-sec-title" style="margin:0;"><span>' + S('exchange.list_title', 'DAFTAR EMITEN', 'STOCK LIST') + '</span>' +
            '<span class="ex-mute">' + list.length + '</span></div>' + rows +
    '</div>';
}

// ============================================================
// 4. DETAIL EMITEN
// ============================================================
function _rangeSlice(series) {
    var r = RANGES.filter(function (x) { return x.id === _range; })[0] || RANGES[1];
    if (!r.n || series.length <= r.n + 1) return series;
    return series.slice(-(r.n + 1));
}

function _volatility(series) {
    var s = series.slice(-13);
    if (s.length < 4) return null;
    var rets = [];
    for (var i = 1; i < s.length; i++) if (s[i - 1].value > 0) rets.push((s[i].value - s[i - 1].value) / s[i - 1].value);
    if (rets.length < 3) return null;
    var mean = rets.reduce(function (a, b) { return a + b; }, 0) / rets.length;
    var v = rets.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / rets.length;
    return Math.sqrt(v);
}

function _renderDetail(stockSystem) {
    if (!_selectedStockId) return '';
    var stock = getStockById(_selectedStockId);
    if (!stock) return '';

    var price = stockSystem.getPrice(stock.id);
    var change = stockSystem.getChangePercent(stock.id);
    var color = _dirColor(change);
    var tm = stockSystem.state.data.time;
    var series = _series(stockSystem, stock.id);
    var watched = _isWatched(stockSystem, stock.id);
    var holding = _holdingOf(stockSystem, stock.id);

    // --- statistik ---
    var last12 = series.slice(-12).map(function (p) { return p.value; });
    var hi52 = last12.length ? Math.max.apply(null, last12) : price;
    var lo52 = last12.length ? Math.min.apply(null, last12) : price;
    var all = series.map(function (p) { return p.value; });
    var ath = all.length ? Math.max.apply(null, all) : price;
    var atl = all.length ? Math.min.apply(null, all) : price;
    var oneY = null;
    if (series.length > 12 && series[series.length - 13].value > 0) {
        oneY = price / series[series.length - 13].value - 1;
    }
    var ytd = null;
    for (var i = 0; i < series.length; i++) {
        if (series[i].year === tm.currentYear && series[i].month === 1) { ytd = series[i].value; break; }
    }
    var ytdPct = (ytd && ytd > 0) ? price / ytd - 1 : null;
    var vol = _volatility(series);
    var volLabel = vol == null ? '—' : (vol < 0.05 ? S('exchange.vol.low', 'Rendah', 'Low') : (vol < 0.10 ? S('exchange.vol.mid', 'Sedang', 'Medium') : S('exchange.vol.high', 'Tinggi', 'High')));
    var volColor = vol == null ? 'var(--text-primary)' : (vol < 0.05 ? 'var(--success)' : (vol < 0.10 ? 'var(--warn)' : 'var(--danger)'));

    function pctCell(v) {
        return v == null ? '—' : '<span style="color:' + _dirColor(v) + ';">' + _fmtChange(v) + '</span>';
    }
    function stat(label, valueHtml) {
        return '<div class="ex-stat"><small>' + label + '</small><b>' + valueHtml + '</b></div>';
    }
    var stats =
        stat(S('exchange.st.hi52', 'Tertinggi 1T', '52w High'), _fmtCurrency(hi52, stock.currency)) +
        stat(S('exchange.st.lo52', 'Terendah 1T', '52w Low'), _fmtCurrency(lo52, stock.currency)) +
        stat(S('exchange.st.usd', 'Harga (USD)', 'Price (USD)'), _fmtUSD(stockSystem.getPriceUSD(stock.id))) +
        stat('YTD', pctCell(ytdPct)) +
        stat(S('exchange.st.1y', 'Setahun', '1 Year'), pctCell(oneY)) +
        stat(S('exchange.st.vol', 'Volatilitas', 'Volatility'), '<span style="color:' + volColor + ';">' + volLabel + '</span>') +
        stat(S('exchange.st.ath', 'Puncak Sepanjang Masa', 'All-time High'), _fmtCurrency(ath, stock.currency)) +
        stat(S('exchange.st.atl', 'Terendah Sepanjang Masa', 'All-time Low'), _fmtCurrency(atl, stock.currency)) +
        stat(S('exchange.st.from_ath', 'Dari Puncak', 'From ATH'), pctCell(ath > 0 ? price / ath - 1 : null));

    // --- posisi Anda ---
    var pos = '';
    if (holding) {
        var priceUSD = stockSystem.getPriceUSD(stock.id);
        var val = priceUSD * holding.shares;
        var pl = val - holding.totalCostUSD;
        var plPct = holding.totalCostUSD > 0 ? pl / holding.totalCostUSD : 0;
        pos = '<div class="ex-pos">' +
            '<div class="ex-pos-h">💼 ' + S('exchange.your_position', 'POSISI ANDA', 'YOUR POSITION') + '</div>' +
            '<div class="ex-pos-grid">' +
                '<div><small>' + S('exchange.owned_shares', 'Lembar Anda', 'Shares') + '</small><b>' + holding.shares.toLocaleString('en-US') + '</b></div>' +
                '<div><small>' + S('exchange.pos.value', 'Nilai sekarang', 'Market value') + '</small><b>' + _fmtUSD(val) + '</b></div>' +
                '<div><small>' + S('exchange.avg_buy', 'Harga beli rata-rata', 'Avg. cost') + '</small><b>' + _fmtUSD(holding.avgBuyPriceUSD) + '</b></div>' +
                '<div><small>' + S('exchange.pos.pl', 'Untung / Rugi', 'Profit / Loss') + '</small><b style="color:' + _dirColor(pl) + ';">' +
                    _arrow(pl) + ' ' + _fmtUSD(pl) + ' (' + _fmtChange(plPct) + ')</b></div>' +
            '</div></div>';
    }

    var conf = stock.confidence === 'trend'
        ? ['📉', S('exchange.conf.trend', 'Perkiraan tren', 'Trend estimate')]
        : stock.confidence === 'fictional'
            ? ['🎮', S('exchange.conf.fict', 'Emiten fiktif', 'Fictional')]
            : ['✅', S('exchange.conf.ver', 'Data historis terverifikasi', 'Verified history')];
    var listing = (stock.listedFrom || '—') + ' – ' + (stock.listedTo ? stock.listedTo : S('exchange.detail.now', 'sekarang', 'present'));

    var rangeBtns = RANGES.map(function (r) {
        return '<button class="' + (r.id === _range ? 'on' : '') + '" data-ex2-range="' + r.id + '">' + (_isEn() ? r.labelEn : r.label) + '</button>';
    }).join('');

    var tickerLine = escapeHtml(stock.ticker) + (stock.realTicker ? ' · ' + escapeHtml(stock.realTicker) : '');

    return '<div class="card" data-ex-detail>' +
        '<div class="ex-d-head">' +
            '<div class="ex-d-id">' + _avatar(stock, 44) +
                '<div style="min-width:0;"><div class="ex-d-name">' + escapeHtml(stock.name) + '</div>' +
                '<div class="ex-d-sub">' + tickerLine + '</div></div></div>' +
            '<div class="ex-d-px"><div><span class="ex-px">' + _fmtCurrency(price, stock.currency) + '</span></div>' +
                '<div class="ex-chg" style="color:' + color + ';font-size:12px;">' + _arrow(change) + ' ' + _fmtChange(change) + '</div></div>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:8px;">' +
            '<div class="ex-sec-title" style="margin:0;">' + S('exchange.detail.chart', 'GRAFIK HARGA', 'PRICE CHART') + '</div>' +
            '<div class="ex-ranges">' + rangeBtns + '</div>' +
        '</div>' +
        '<div class="ex-chartbox chart-wrap" data-ex-chart><canvas></canvas></div>' +

        '<div class="ex-stats">' + stats + '</div>' +
        pos +
        '<div class="ex-meta">' +
            '<span class="ex-tag">' + _flag(stock.country) + ' ' + escapeHtml(_countryLabel(stock.country)) + '</span>' +
            '<span class="ex-tag">' + escapeHtml(_categoryLabel(stock.category)) + '</span>' +
            '<span class="ex-tag">' + escapeHtml(stock.currency) + '</span>' +
            '<span class="ex-tag">' + S('exchange.detail.listing', 'Listing', 'Listed') + ' ' + listing + '</span>' +
            '<span class="ex-tag">' + conf[0] + ' ' + conf[1] + '</span>' +
        '</div>' +

        '<div class="ex-trade">' +
            '<button class="btn-primary" data-ex-buy="' + stock.id + '">' + S('exchange.buy', 'Beli', 'Buy') + '</button>' +
            (holding ? '<button class="btn-secondary" data-ex-sell="' + stock.id + '">' + S('exchange.sell', 'Jual', 'Sell') + '</button>' : '') +
            '<button class="btn-secondary" data-ex2-star="' + stock.id + '" aria-label="' + escapeHtml(S('exchange.aria.watchlist', 'Watchlist', 'Watchlist')) + '" style="flex:0 0 52px;font-size:18px;color:' + (watched ? '#facc15' : 'var(--text-secondary)') + ';">' + (watched ? '★' : '☆') + '</button>' +
        '</div>' +
        '<div class="ex-note">' + S('exchange.detail.hint', 'Geser/ketuk grafik untuk melihat harga di bulan tertentu.', 'Drag or tap the chart to inspect a month.') + '</div>' +
    '</div>';
}

// ============================================================
// 5. PORTOFOLIO
// ============================================================
function _renderPortfolio(stockSystem) {
    var d = stockSystem.state.data;
    var cash = d.cash || 0;
    var list = stockSystem.getPortfolio().slice().sort(function (a, b) { return b.currentValueUSD - a.currentValueUSD; });
    var pv = stockSystem.getPortfolioValue();
    var net = stockSystem.getNetWorth();

    var cost = 0, plTotal = 0, prevVal = 0;
    list.forEach(function (e) {
        cost += e.totalCostUSD;
        plTotal += e.plUSD;
        var ch = stockSystem.getChangePercent(e.stockId);
        prevVal += e.currentValueUSD / (1 + ch);
    });
    var plPct = cost > 0 ? plTotal / cost : 0;
    var monthDelta = pv - prevVal;
    var monthPct = prevVal > 0 ? monthDelta / prevVal : 0;

    // alokasi per kategori + kas
    var alloc = {};
    list.forEach(function (e) {
        var st = getStockById(e.stockId);
        var c = st ? st.category : 'other';
        alloc[c] = (alloc[c] || 0) + e.currentValueUSD;
    });
    var allocBar = '', legend = '';
    if (net > 0) {
        var keys = Object.keys(alloc).sort(function (a, b) { return alloc[b] - alloc[a]; });
        keys.forEach(function (k) {
            var pct = alloc[k] / net * 100;
            allocBar += '<i style="width:' + pct.toFixed(2) + '%;background:' + (CAT_COLORS[k] || '#94a3b8') + ';"></i>';
            legend += '<span><em style="background:' + (CAT_COLORS[k] || '#94a3b8') + ';"></em>' + escapeHtml(_categoryLabel(k)) + ' ' + pct.toFixed(0) + '%</span>';
        });
        var cashPct = Math.max(0, cash) / net * 100;
        allocBar += '<i style="width:' + cashPct.toFixed(2) + '%;background:var(--text-disabled);"></i>';
        legend += '<span><em style="background:var(--text-disabled);"></em>' + S('exchange.portfolio.cash_short', 'Kas', 'Cash') + ' ' + cashPct.toFixed(0) + '%</span>';
    }

    var rows = '';
    if (list.length) {
        rows = list.map(function (e) {
            var st = getStockById(e.stockId);
            var ser = _series(stockSystem, e.stockId).slice(-18).map(function (p) { return p.value; });
            var share = pv > 0 ? e.currentValueUSD / pv * 100 : 0;
            return '<div class="ex-hold" data-ex2-pick="' + e.stockId + '">' +
                '<div class="ex-hold-l">' + (st ? _avatar(st, 36) : '') +
                    '<div style="min-width:0;">' +
                        '<div style="font-size:13px;font-weight:800;">' + escapeHtml(e.ticker) + '</div>' +
                        '<div class="ex-row-sub">' + e.shares.toLocaleString('en-US') + ' × ' + _fmtUSD(e.avgBuyPriceUSD) + ' · ' + share.toFixed(0) + '%</div>' +
                    '</div></div>' +
                '<div class="ex-row-spark">' + _spark(ser, 52, 24, _sparkColor(ser)) + '</div>' +
                '<div class="ex-hold-r">' +
                    '<div style="font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;">' + _fmtUSD(e.currentValueUSD) + '</div>' +
                    '<div class="ex-chg" style="color:' + _dirColor(e.plUSD) + ';">' + _arrow(e.plUSD) + ' ' + _fmtUSD(e.plUSD) + ' (' + _fmtChange(e.plPct) + ')</div>' +
                '</div></div>';
        }).join('');
    }

    var hero =
        '<div class="ex-hero"><div>' +
            '<div class="ex-mute" style="font-size:10.5px;font-weight:700;letter-spacing:.5px;">' + S('exchange.portfolio.net_worth', 'Total Aset', 'Net Worth').toUpperCase() + '</div>' +
            '<div class="ex-hero-v">' + _fmtUSD(net) + '</div>' +
            (list.length
                ? '<div class="ex-hero-sub" style="color:' + _dirColor(monthDelta) + ';">' + _arrow(monthDelta) + ' ' + _fmtUSD(monthDelta) + ' (' + _fmtChange(monthPct) + ') ' +
                    '<span class="ex-mute" style="font-weight:600;">' + S('exchange.this_month', 'bulan ini', 'this month') + '</span></div>'
                : '<div class="ex-hero-sub ex-mute" style="font-weight:600;">' + S('exchange.portfolio.hint', 'Mulai investasi untuk melihat pertumbuhan asetmu.', 'Start investing to grow your net worth.') + '</div>') +
        '</div></div>';

    var grid =
        '<div class="ex-pf-grid">' +
            '<div class="ex-stat"><small>' + S('exchange.portfolio.cash', 'Uang Tunai', 'Cash') + '</small><b>' + _fmtUSDCompact(cash) + '</b></div>' +
            '<div class="ex-stat"><small>' + S('exchange.portfolio.stocks', 'Nilai Saham', 'Stocks') + '</small><b>' + _fmtUSDCompact(pv) + '</b></div>' +
            '<div class="ex-stat"><small>' + S('exchange.pos.pl_total', 'Total P/L', 'Total P/L') + '</small><b style="color:' + _dirColor(plTotal) + ';">' +
                (list.length ? _fmtChange(plPct) : '—') + '</b></div>' +
        '</div>';

    var body = list.length
        ? '<div style="margin-top:12px;"><div class="ex-sec-title" style="margin-bottom:2px;"><span>' + S('exchange.holdings', 'KEPEMILIKAN', 'HOLDINGS') + '</span><span class="ex-mute">' + list.length + '</span></div>' + rows + '</div>'
        : '<div class="ex-empty" style="padding:18px 8px 6px;"><big>📈</big>' + S('exchange.portfolio.empty', 'Belum ada saham yang dimiliki.', 'You do not own any stocks yet.') + '<br>' +
            '<button class="chip-small" data-ex2-filter="all" data-ex2-cat="all" style="margin-top:10px;">' + S('exchange.browse', 'Jelajahi emiten', 'Browse stocks') + '</button></div>';

    return '<div class="card">' +
        '<div class="ex-sec-title"><span>' + S('exchange.portfolio.title', 'Portofolio', 'Portfolio') + '</span></div>' +
        hero + grid +
        (list.length ? '<div class="ex-alloc">' + allocBar + '</div><div class="ex-legend">' + legend + '</div>' : '') +
        body +
    '</div>';
}

// ============================================================
// 6. RIWAYAT TRANSAKSI
// ============================================================
function _renderTransactions(stockSystem) {
    var all = stockSystem.getTransactions();
    if (!all.length) return '';
    var list = _showAllTx ? all : all.slice(0, 5);

    var rows = list.map(function (tx) {
        var isBuy = tx.type === 'buy';
        var color = isBuy ? 'var(--danger)' : 'var(--success)';
        var bg = isBuy ? 'var(--danger-soft)' : 'var(--success-soft)';
        var label = isBuy ? S('exchange.tx.buy', 'Beli', 'Buy') : S('exchange.tx.sell', 'Jual', 'Sell');
        var unit = tx.priceUSD != null ? ' @ ' + _fmtUSD(tx.priceUSD) : '';
        return '<div class="ex-tx" data-ex2-pick="' + escapeHtml(tx.stockId || '') + '" style="cursor:pointer;">' +
            '<div class="ex-tx-l">' +
                '<div class="ex-tx-ico" style="background:' + bg + ';color:' + color + ';">' + (isBuy ? '↓' : '↑') + '</div>' +
                '<div style="min-width:0;"><div style="font-size:12.5px;font-weight:700;">' + escapeHtml(tx.ticker) +
                    ' <span class="ex-mute" style="font-weight:600;">· ' + label + ' ' + tx.shares.toLocaleString('en-US') + ' ' + S('exchange.shares_short', 'lbr', 'sh') + '</span></div>' +
                    '<div class="ex-row-sub">' + tx.day + ' ' + _monthName(tx.month) + ' ' + tx.year + unit + '</div></div>' +
            '</div>' +
            '<div class="ex-num" style="font-size:12.5px;font-weight:800;color:' + color + ';">' + (isBuy ? '−' : '+') + _fmtUSD(Math.abs(tx.totalUSD)).replace('−', '') + '</div>' +
        '</div>';
    }).join('');

    var more = all.length > 5
        ? '<button class="ex-more" data-ex2-alltx>' + (_showAllTx
            ? S('exchange.tx.less', 'Tampilkan lebih sedikit', 'Show less')
            : S('exchange.tx.more', 'Lihat semua', 'View all') + ' (' + all.length + ')') + '</button>'
        : '';

    return '<div class="card">' +
        '<div class="ex-sec-title"><span>' + S('exchange.tx.title', 'Riwayat Transaksi', 'Transaction History') + '</span><span class="ex-mute">' + all.length + '</span></div>' +
        rows + more +
    '</div>';
}

// ============================================================
// INTERAKSI (delegasi event, didaftarkan sekali)
// ============================================================
function _bindOnce() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;

    document.addEventListener('click', function (e) {
        var root = _root();
        if (!root || !root.contains(e.target)) return;
        var el;

        if ((el = e.target.closest('[data-ex2-star]'))) {
            e.preventDefault(); e.stopPropagation();
            var id = el.dataset.ex2Star;
            var on = _toggleWatch(_sys, id);
            try { ToastService.success((on ? '★ ' : '☆ ') + (getStockById(id) ? getStockById(id).ticker : id) + ' — ' +
                (on ? S('exchange.watch_added', 'ditambahkan ke watchlist', 'added to watchlist') : S('exchange.watch_removed', 'dihapus dari watchlist', 'removed from watchlist'))); } catch (err) {}
            _refreshSection('list'); _refreshSection('detail');
            return;
        }
        if ((el = e.target.closest('[data-ex2-pick]'))) {
            var pid = el.dataset.ex2Pick;
            if (!pid) return;
            e.preventDefault();
            _selectedStockId = pid; _hoverIdx = -1;
            _refreshSection('list'); _refreshSection('detail');
            var det = root.querySelector('[data-ex-detail]');
            if (det && det.scrollIntoView) det.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        if ((el = e.target.closest('[data-ex2-cat]'))) {
            e.preventDefault();
            _selectedCategory = el.dataset.ex2Cat;
            if (el.dataset.ex2Filter) _filterMode = el.dataset.ex2Filter;
            _refreshSection('list');
            return;
        }
        if ((el = e.target.closest('[data-ex2-filter]'))) {
            e.preventDefault();
            _filterMode = el.dataset.ex2Filter;
            _refreshSection('list');
            return;
        }
        if ((el = e.target.closest('[data-ex2-sort]'))) {
            e.preventDefault();
            _sort = el.dataset.ex2Sort;
            _refreshSection('list');
            return;
        }
        if ((el = e.target.closest('[data-ex2-range]'))) {
            e.preventDefault();
            _range = el.dataset.ex2Range; _hoverIdx = -1;
            _refreshSection('detail');
            return;
        }
        if (e.target.closest('[data-ex2-clear]')) {
            e.preventDefault(); _search = '';
            _refreshSection('list');
            return;
        }
        if (e.target.closest('[data-ex2-alltx]')) {
            e.preventDefault(); _showAllTx = !_showAllTx;
            _refreshSection('tx');
            return;
        }
    });

    document.addEventListener('input', function (e) {
        var inp = e.target.closest && e.target.closest('[data-ex2-search]');
        if (!inp) return;
        _search = inp.value || '';
        // render ulang hanya kotak daftar agar input tidak kehilangan fokus
        var root = _root();
        if (!root || !_sys) return;
        var box = root.querySelector('[data-ex-listbox]');
        if (box) box.innerHTML = _renderStockList(_sys, getStocksForYear(_sys.state.data.time.currentYear));
        var wrap = inp.parentNode;
        var clr = wrap.querySelector('[data-ex2-clear]');
        if (_search && !clr) {
            var b = document.createElement('button');
            b.className = 'ex-s-clr'; b.setAttribute('data-ex2-clear', ''); b.textContent = '✕';
            wrap.appendChild(b);
        } else if (!_search && clr) { clr.remove(); }
    });

    // crosshair grafik
    function chartPointer(e) {
        var box = e.target.closest && e.target.closest('[data-ex-chart]');
        if (!box || !_geo) return;
        var canvas = box.querySelector('canvas');
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var n = _geo.n;
        var idx = Math.round(((x - _geo.padL) / _geo.plotW) * (n - 1));
        idx = Math.max(0, Math.min(n - 1, idx));
        if (idx !== _hoverIdx) { _hoverIdx = idx; drawExchangeChart(box); }
    }
    document.addEventListener('pointermove', chartPointer);
    document.addEventListener('pointerdown', chartPointer);
    document.addEventListener('pointerleave', function (e) {
        if (e.target && e.target.closest && e.target.closest('[data-ex-chart]') && _hoverIdx !== -1) {
            _hoverIdx = -1; drawExchangeChart(e.target.closest('[data-ex-chart]'));
        }
    }, true);
    document.addEventListener('pointerup', function (e) {
        if (e.pointerType === 'touch' && _hoverIdx !== -1) {
            var box = e.target.closest && e.target.closest('[data-ex-chart]');
            setTimeout(function () { if (box && box.isConnected) { _hoverIdx = -1; drawExchangeChart(box); } }, 1800);
        }
    });

    // ganti bahasa → render ulang panel + buka ulang modal beli/jual yang sedang terbuka
    bus.on('lang:changed', function () {
        if (_root() && _sys) _refreshAll();
        _reopenTradeModals();
    });

    // hidupkan otomatis saat harga/bulan berganti
    var raf = 0;
    bus.on('stocks:updated', function () {
        if (!_root() || raf) return;
        raf = requestAnimationFrame(function () { raf = 0; _refreshAll(); });
    });
}

// Buka ulang modal beli/jual (teks berganti bahasa) tanpa kehilangan jumlah lembar.
function _reopenTradeModals() {
    [
        { id: 'buy-modal',  attr: 'data-buy-confirm',  open: function (sid) { openBuyModal(sid); } },
        { id: 'sell-modal', attr: 'data-sell-confirm', open: function (sid) { openSellModal(sid); } }
    ].forEach(function (m) {
        if (!Modal.isOpen(m.id)) return;
        var nodes = document.querySelectorAll('[data-modal-id="' + m.id + '"]');
        var node = nodes[nodes.length - 1];
        if (!node) return;
        var conf = node.querySelector('[' + m.attr + ']');
        var sid = conf ? conf.getAttribute(m.attr) : null;
        if (!sid) return;
        var inp = node.querySelector('[data-qty-input]');
        var qty = inp ? inp.value : null;
        m.open(sid);
        if (qty == null) return;
        var fresh = document.querySelectorAll('[data-modal-id="' + m.id + '"]');
        var nn = fresh[fresh.length - 1];
        var ni = nn && nn.querySelector('[data-qty-input]');
        if (ni) {
            ni.value = qty;
            ni.dispatchEvent(new Event('input', { bubbles: true }));   // hitung ulang total
        }
    });
}

// ============================================================
// MODAL BELI
// ============================================================
export function openBuyModal(stockId) {
    var stock = getStockById(stockId);
    if (!stock) return;
    var g = window.__game;
    if (!g || !g.stocks) return;

    var stockSystem = g.stocks;
    var localPrice = stockSystem.getPrice(stockId);
    var priceUSD = stockSystem.getPriceUSD(stockId);
    var cash = Math.floor(WalletService.getBuyingPower()); // uang + SIL setara
    var maxShares = stockSystem.getMaxAffordableShares(stockId);
    var change = stockSystem.getChangePercent(stockId);

    var html =
        '<div class="modal-title">' + S('exchange.buy_modal.title', 'Beli Saham', 'Buy Stock') + '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin:6px 0 10px;">' + _avatar(stock, 40) +
            '<div><div style="font-weight:800;font-size:14px;">' + escapeHtml(stock.name) + '</div>' +
            '<div class="ex-chg" style="color:' + _dirColor(change) + ';">' + escapeHtml(stock.ticker) + ' · ' + _arrow(change) + ' ' + _fmtChange(change) + '</div></div></div>' +
        '<div class="sum-row"><span>' + S('exchange.price_per_share', 'Harga / lembar', 'Price / share') + '</span><b>' +
            _fmtCurrency(localPrice, stock.currency) +
            ' <span style="font-size:10.5px;color:var(--text-tertiary);">(' + _fmtUSD(priceUSD) + ')</span></b></div>' +
        '<div class="sum-row"><span>' + S('exchange.cash_available', 'Uang Tunai', 'Cash') + '</span><b>' + _fmtUSD(cash) + '</b></div>' +

        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-tertiary);margin-bottom:6px;">' +
                S('exchange.shares_label', 'Jumlah Lembar', 'Shares') + '</div>' +
            '<input type="number" data-qty-input value="10" min="1" step="1" ' +
                'style="width:100%;box-sizing:border-box;padding:10px;font-size:16px;font-weight:700;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);" />' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
                _presetBtn(10) + _presetBtn(50) + _presetBtn(100) +
                '<button class="chip-small" data-buy-preset="max" data-buy-stock="' + stockId + '" ' +
                    'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' +
                    S('exchange.max', 'MAX', 'MAX') + ' (' + maxShares.toLocaleString('en-US') + ')</button>' +
            '</div>' +
        '</div>' +

        '<div style="margin-top:12px;padding:10px;background:var(--accent-soft);border-radius:8px;">' +
            '<div class="sum-row"><span>' + S('exchange.total', 'Total estimasi', 'Estimated total') + '</span>' +
                '<b data-buy-total style="color:var(--accent);">' + _fmtUSD(priceUSD * 10) + '</b></div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:14px;">' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:10px;">' +
                S('common.cancel', 'Batal', 'Cancel') + '</button>' +
            '<button class="btn-primary" data-buy-confirm="' + stockId + '" ' +
                'style="flex:1;padding:10px;font-weight:700;">' +
                S('exchange.buy', 'Beli', 'Buy') + '</button>' +
        '</div>';

    Modal.open('buy-modal', html);
}

function _presetBtn(n) {
    return '<button class="chip-small" data-buy-preset="' + n + '" ' +
        'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' + n + '</button>';
}

// ============================================================
// MODAL JUAL
// ============================================================
export function openSellModal(stockId) {
    var stock = getStockById(stockId);
    if (!stock) return;
    var g = window.__game;
    if (!g || !g.stocks) return;

    var stockSystem = g.stocks;
    var holding = _holdingOf(stockSystem, stockId);
    if (!holding) {
        ToastService.error(S('exchange.not_owned', 'Anda tidak memiliki saham ini.', 'You do not own this stock.'));
        return;
    }

    var localPrice = stockSystem.getPrice(stockId);
    var priceUSD = stockSystem.getPriceUSD(stockId);
    var maxShares = holding.shares;
    var pl = (priceUSD - holding.avgBuyPriceUSD) * maxShares;
    var change = stockSystem.getChangePercent(stockId);

    var html =
        '<div class="modal-title">' + S('exchange.sell_modal.title', 'Jual Saham', 'Sell Stock') + '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;margin:6px 0 10px;">' + _avatar(stock, 40) +
            '<div><div style="font-weight:800;font-size:14px;">' + escapeHtml(stock.name) + '</div>' +
            '<div class="ex-chg" style="color:' + _dirColor(change) + ';">' + escapeHtml(stock.ticker) + ' · ' + _arrow(change) + ' ' + _fmtChange(change) + '</div></div></div>' +
        '<div class="sum-row"><span>' + S('exchange.price_per_share', 'Harga / lembar', 'Price / share') + '</span><b>' +
            _fmtCurrency(localPrice, stock.currency) +
            ' <span style="font-size:10.5px;color:var(--text-tertiary);">(' + _fmtUSD(priceUSD) + ')</span></b></div>' +
        '<div class="sum-row"><span>' + S('exchange.owned_shares', 'Lembar Anda', 'Your shares') + '</span><b>' + maxShares.toLocaleString('en-US') + '</b></div>' +
        '<div class="sum-row"><span>' + S('exchange.avg_buy', 'Harga beli rata-rata', 'Avg. cost') + '</span><b>' + _fmtUSD(holding.avgBuyPriceUSD) + '</b></div>' +
        '<div class="sum-row"><span>' + S('exchange.pos.pl', 'Untung / Rugi', 'Profit / Loss') + '</span><b style="color:' + _dirColor(pl) + ';">' + _fmtUSD(pl) + '</b></div>' +

        '<div style="margin-top:12px;">' +
            '<div style="font-size:11px;font-weight:700;color:var(--text-tertiary);margin-bottom:6px;">' +
                S('exchange.shares_label', 'Jumlah Lembar', 'Shares') + '</div>' +
            '<input type="number" data-qty-input value="' + Math.min(10, maxShares) + '" min="1" max="' + maxShares + '" step="1" ' +
                'style="width:100%;box-sizing:border-box;padding:10px;font-size:16px;font-weight:700;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);" />' +
            '<div style="display:flex;gap:6px;margin-top:8px;">' +
                _sellPresetBtn(10, maxShares) + _sellPresetBtn(50, maxShares) + _sellPresetBtn(100, maxShares) +
                '<button class="chip-small" data-sell-preset="all" ' +
                    'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' +
                    S('exchange.all', 'SEMUA', 'ALL') + '</button>' +
            '</div>' +
        '</div>' +

        '<div style="margin-top:12px;padding:10px;background:var(--accent-soft);border-radius:8px;">' +
            '<div class="sum-row"><span>' + S('exchange.proceeds', 'Perkiraan hasil', 'Estimated proceeds') + '</span>' +
                '<b data-sell-total style="color:var(--accent);">' +
                _fmtUSD(priceUSD * Math.min(10, maxShares)) + '</b></div>' +
        '</div>' +

        '<div style="display:flex;gap:8px;margin-top:14px;">' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:10px;">' +
                S('common.cancel', 'Batal', 'Cancel') + '</button>' +
            '<button class="btn-primary" data-sell-confirm="' + stockId + '" ' +
                'style="flex:1;padding:10px;font-weight:700;background:var(--danger);">' +
                S('exchange.sell', 'Jual', 'Sell') + '</button>' +
        '</div>';

    Modal.open('sell-modal', html);
}

function _sellPresetBtn(n, maxShares) {
    var v = Math.min(n, maxShares);
    return '<button class="chip-small" data-sell-preset="' + v + '" ' +
        'style="flex:1;padding:6px;font-size:11px;font-weight:700;">' + v + '</button>';
}

// ============================================================
// GRAFIK (canvas) — rentang, crosshair, tooltip
// ============================================================
export function drawExchangeChart(container) {
    if (!container) return;
    var canvas = container.querySelector('canvas');
    if (!canvas) return;
    var game = window.__game;
    var sys = _sys || (game && game.stocks);
    if (!sys || !_selectedStockId) return;

    var stock = getStockById(_selectedStockId);
    if (!stock) return;
    var series = _rangeSlice(_series(sys, _selectedStockId));
    if (series.length < 2) { _geo = null; return; }

    var cs = getComputedStyle(container);
    var cssW = container.clientWidth || 320;
    var cssH = 180;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var rootStyle = getComputedStyle(document.documentElement);
    var textMute = (rootStyle.getPropertyValue('--text-tertiary') || '#6a7280').trim();
    var textMain = (rootStyle.getPropertyValue('--text-primary') || '#e8eaee').trim();
    var bgCard = (rootStyle.getPropertyValue('--bg-4') || '#2a3341').trim();
    var gridCol = (rootStyle.getPropertyValue('--border') || 'rgba(255,255,255,0.07)').trim();

    var cur = CURRENCIES[stock.currency] || CURRENCIES.USD;
    var padL = 50, padR = 10, padT = 12, padB = 20;
    var plotW = cssW - padL - padR;
    var plotH = cssH - padT - padB;
    var n = series.length;

    var minV = Infinity, maxV = -Infinity;
    series.forEach(function (p) { if (p.value < minV) minV = p.value; if (p.value > maxV) maxV = p.value; });
    if (minV === maxV) { minV *= 0.95; maxV *= 1.05; }
    var padV = (maxV - minV) * 0.08;
    minV -= padV; maxV += padV;
    var range = maxV - minV;

    var xOf = function (i) { return padL + (plotW * i) / (n - 1); };
    var yOf = function (v) { return padT + plotH - ((v - minV) / range) * plotH; };
    _geo = { n: n, padL: padL, plotW: plotW };

    var fmt = function (v) {
        var dec = cur.decimals;
        if (v >= 1000) dec = 0;
        return cur.symbol + v.toLocaleString('en-US', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
    };

    // grid + label sumbu Y (4 garis)
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = textMute;
    for (var g = 0; g <= 3; g++) {
        var gy = padT + (plotH * g) / 3;
        ctx.strokeStyle = gridCol;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(cssW - padR, gy); ctx.stroke();
        var gv = maxV - (range * g) / 3;
        ctx.fillText(fmt(gv), padL - 5, gy + 3.5);
    }

    var firstV = series[0].value;
    var lastV = series[n - 1].value;
    var up = lastV >= firstV;
    var lineColor = up ? '#10b981' : '#ef4444';

    // garis acuan harga awal rentang
    var y0 = yOf(firstV);
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = textMute;
    ctx.globalAlpha = 0.45;
    ctx.beginPath(); ctx.moveTo(padL, y0); ctx.lineTo(cssW - padR, y0); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // area
    var grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, lineColor + '40');
    grad.addColorStop(1, lineColor + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xOf(0), padT + plotH);
    series.forEach(function (p, i) { ctx.lineTo(xOf(i), yOf(p.value)); });
    ctx.lineTo(xOf(n - 1), padT + plotH);
    ctx.closePath();
    ctx.fill();

    // garis
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    series.forEach(function (p, i) {
        var x = xOf(i), y = yOf(p.value);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // titik beli rata-rata (jika punya)
    var holding = _holdingOf(sys, stock.id);
    if (holding) {
        var rate = sys.getPrice(stock.id) > 0 ? sys.getPriceUSD(stock.id) / sys.getPrice(stock.id) : 0;
        if (rate > 0) {
            var avgLocal = holding.avgBuyPriceUSD / rate;
            if (avgLocal >= minV && avgLocal <= maxV) {
                var ya = yOf(avgLocal);
                ctx.setLineDash([5, 3]);
                ctx.strokeStyle = '#4f8cff';
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(padL, ya); ctx.lineTo(cssW - padR, ya); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#4f8cff';
                ctx.textAlign = 'left';
                ctx.font = '9.5px sans-serif';
                ctx.fillText(S('exchange.chart.avg', 'Rata-rata beli', 'Avg. cost'), padL + 4, ya - 3);
            }
        }
    }

    // label X
    ctx.fillStyle = textMute;
    ctx.font = '9.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(_fmtDate(series[0]), padL, cssH - 5);
    ctx.textAlign = 'right';
    ctx.fillText(_fmtDate(series[n - 1]), cssW - padR, cssH - 5);

    // titik terakhir
    ctx.fillStyle = lineColor;
    ctx.beginPath(); ctx.arc(xOf(n - 1), yOf(lastV), 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath(); ctx.arc(xOf(n - 1), yOf(lastV), 7, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // crosshair + tooltip
    if (_hoverIdx >= 0 && _hoverIdx < n) {
        var hp = series[_hoverIdx];
        var hx = xOf(_hoverIdx), hy = yOf(hp.value);
        ctx.strokeStyle = textMute;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(hx, padT); ctx.lineTo(hx, padT + plotH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = lineColor;
        ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.stroke();

        var diff = firstV > 0 ? hp.value / firstV - 1 : 0;
        var l1 = fmt(hp.value) .replace(/\.0+$/, '');
        var l1full = _fmtCurrency(hp.value, stock.currency);
        var l2 = _fmtDate(hp) + ' · ' + _fmtChange(diff);
        ctx.font = '700 11.5px sans-serif';
        var w1 = ctx.measureText(l1full).width;
        ctx.font = '10px sans-serif';
        var w2 = ctx.measureText(l2).width;
        var bw = Math.max(w1, w2) + 16, bh = 36;
        var bx = hx - bw / 2;
        if (bx < padL) bx = padL;
        if (bx + bw > cssW - padR) bx = cssW - padR - bw;
        var by = padT + 2;
        ctx.fillStyle = bgCard;
        ctx.strokeStyle = gridCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 7); else ctx.rect(bx, by, bw, bh);
        ctx.fill(); ctx.stroke();
        ctx.textAlign = 'left';
        ctx.fillStyle = textMain;
        ctx.font = '700 11.5px sans-serif';
        ctx.fillText(l1full, bx + 8, by + 15);
        ctx.fillStyle = diff >= 0 ? '#10b981' : '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.fillText(l2, bx + 8, by + 28);
        void l1; void cs;
    }
}

