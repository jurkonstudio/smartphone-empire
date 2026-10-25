// FILE: src/ui/panels/EcosystemPanel.js  (BARU — ekosistem: aksesori & App Store)
// Sub-tab "Ekosistem" di panel Pasar. Logika ada di EcosystemSystem.js; klik ditangani main.js
// lewat atribut data-eco-*.
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';
import { ECO_LINES, ECO_TIERS, ECO_TIER_META, ECO_CONST } from '../../data/ecosystem.data.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function T(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_en() ? 'en' : 'id'] || o.en || o.id || '')); }
function money(n) { return formatCurrency(Math.round(_n(n))); }
function int(n) { return Math.round(_n(n)).toLocaleString('en-US'); }
function pct(x, d) { return (_n(x) * 100).toFixed(d == null ? 0 : d) + '%'; }
function signPct(x, d, sign) {
    var v = _n(x) * 100;
    if (Math.abs(v) < 0.05) return '0%';
    return (sign && v > 0 ? '+' : (v < 0 ? '-' : '')) + Math.abs(v).toFixed(d == null ? 0 : d) + '%';
}
function _n(v) { v = Number(v); return isFinite(v) ? v : 0; }
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}
function _lockNote(left) {
    return left > 0 ? ' · ' + esc(L('bisa diubah lagi ' + Math.ceil(left) + ' bln', 'editable in ' + Math.ceil(left) + ' mo')) : '';
}

function _summaryCard(sum) {
    var pctScore = Math.round(sum.score * 100);
    return '<div class="card"><div class="card-title">' + esc(L('Ekosistem', 'Ecosystem')) + '</div>' +
        '<div class="rg-desc">' + esc(L(
            'Aksesori dan App Store membuat pelanggan betah di merekmu. Makin banyak lini dan pengguna, makin kecil pelanggan pindah ke merek lain.',
            'Accessories and the App Store keep customers with your brand. The more lines and users, the fewer customers switch to rivals.')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(L('Skor lock-in', 'Lock-in score')) + '</div>' +
        '<div class="rg-meter"><i style="width:' + pctScore + '%;background:#0a84ff"></i></div></div>' +
        '<div class="rg-val">' + pctScore + '%</div></div>' +
        '<div class="rg-kpis">' +
            kpi(L('Permintaan ponsel', 'Phone demand'), signPct(sum.demandBonus, 1, true)) +
            kpi(L('Tekanan kompetitor', 'Competitor pressure'), signPct(-sum.competitorRelief, 1)) +
            kpi(L('Lini terbuka', 'Lines open'), sum.linesOpen + '/' + sum.lineCount) +
            kpi(L('Basis ponsel aktif', 'Active phone base'), int(sum.phoneBase)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(L('Pendapatan bulan lalu ', 'Last month revenue ')) + '<b>' + money(sum.last && sum.last.revenue) + '</b>' +
        ' · ' + esc(L('total unit terjual ', 'total units sold ')) + '<b>' + int(sum.stats && sum.stats.units) + '</b></div>' +
        '</div>';
}

function _storeCard(sp) {
    if (!sp.available) {
        return '<div class="card"><div class="card-title">App Store</div>' +
            '<div class="rg-desc">' + esc(L(
                'Belum tersedia. Toko aplikasi hanya bisa dijalankan setelah OS milikmu punya fitur App Store.',
                'Not available yet. The app store only runs once your OS has the App Store feature.')) + '</div></div>';
    }
    var dis = sp.locked ? ' disabled' : '';
    return '<div class="card"><div class="card-title">App Store</div>' +
        '<div class="rg-desc">' + esc(L(
            'Komisi dari setiap belanja aplikasi. Komisi tinggi menambah pendapatan, tetapi pengembang jadi enggan, sehingga aplikasi berkurang.',
            'You take a cut of every app purchase. A high cut boosts income, but developers get reluctant and the catalog shrinks.')) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(L('Komisi', 'Commission')) + '</div></div>' +
        '<div class="rg-btn-row"><button class="btn-secondary" data-eco-commission="x" data-eco-val="-1"' + (sp.commission <= sp.minCommission + 1e-9 ? ' disabled' : dis) + '>−</button>' +
        ' <b>' + pct(sp.commission, 0) + '</b> ' +
        '<button class="btn-secondary" data-eco-commission="x" data-eco-val="1"' + (sp.commission >= sp.maxCommission - 1e-9 ? ' disabled' : dis) + '>+</button></div></div>' +
        '<div class="rg-kpis">' +
            kpi(L('Pengguna aktif OS', 'Active OS users'), int(sp.users)) +
            kpi(L('Belanja kotor/bln', 'Gross spend/mo'), money(sp.gross)) +
            kpi(L('Pendapatan komisi/bln', 'Commission/mo'), money(sp.revenue)) +
            kpi(L('Biaya toko/bln', 'Store cost/mo'), money(sp.cost)) +
        '</div>' +
        '<div class="rg-row-meta">' + esc(L('Daya tarik pengembang ', 'Developer appeal ')) + '<b>' + pct(sp.appeal, 0) + '</b> · ' +
        esc(L('kualitas toko ', 'store quality ')) + '<b>' + pct(sp.quality, 0) + '</b>' + _lockNote(sp.lockLeft) + '</div>' +
        '</div>';
}

function _lineCard(sys, line) {
    var p = sys.getLinePreview(line.id);
    if (!p) return '';
    if (!p.yearOk) {
        return '<div class="card" style="opacity:.6"><div class="card-title">' + esc(T(line.name)) + '</div>' +
            '<div class="rg-desc">' + esc(L('Belum tersedia. Terbuka tahun ' + line.minYear + '.', 'Not available yet. Unlocks in ' + line.minYear + '.')) + '</div></div>';
    }
    var tiers = ECO_TIERS.map(function (t) {
        var m = ECO_TIER_META[t];
        return '<button class="' + (p.tier === t ? 'btn-primary' : 'btn-secondary') + '" data-eco-tier="' + esc(line.id) + '" data-eco-val="' + t + '"' +
            (p.locked && p.tier !== t ? ' disabled' : '') + '>' + esc(T(m.name)) + '</button>';
    }).join(' ');
    var priceDis = p.locked ? ' disabled' : '';
    var priceRow = '<div style="display:flex;align-items:center;gap:8px;">' +
        '<button class="btn-secondary" style="flex:1" data-eco-price="' + esc(line.id) + '" data-eco-val="-1"' +
        (p.price <= p.priceMin + 1e-9 ? ' disabled' : priceDis) + '>−</button>' +
        '<b style="min-width:72px;text-align:center">' + esc(money(p.price)) + '</b>' +
        '<button class="btn-secondary" style="flex:1" data-eco-price="' + esc(line.id) + '" data-eco-val="1"' +
        (p.price >= p.priceMax - 1e-9 ? ' disabled' : priceDis) + '>+</button></div>';
    var action;
    if (p.open) {
        action = '<button class="btn-secondary" data-eco-close="' + esc(line.id) + '"' + (p.closeLocked ? ' disabled' : '') + '>' +
            esc(L('Tutup lini', 'Close line')) + '</button>' +
            (p.closeLocked ? ' <span class="rg-row-meta">' + esc(L('terikat ' + Math.ceil(p.commitLeft) + ' bln lagi', 'committed ' + Math.ceil(p.commitLeft) + ' more mo')) + '</span>' : '');
    } else if (!p.yearOk) {
        action = '<span class="rg-row-meta">' + esc(L('Terbuka tahun ' + line.minYear, 'Unlocks in ' + line.minYear)) + '</span>';
    } else {
        action = '<button class="' + (p.canOpen ? 'btn-primary' : 'btn-secondary') + '" data-eco-open="' + esc(line.id) + '"' +
            (p.canOpen ? '' : ' disabled') + '>' + esc(L('Buka lini', 'Open line')) + ' · ' + esc(money(p.setupCost)) + '</button>';
    }
    return '<div class="card"><div class="card-title">' + esc(T(line.name)) + (p.open ? '' : ' · ' + esc(L('belum dibuka', 'not open'))) + '</div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(L('Tier', 'Tier')) + '</div>' +
        '<div class="rg-btn-row">' + tiers + '</div></div></div>' +
        '<div class="rg-row"><div class="rg-row-main"><div class="rg-row-name">' + esc(L('Harga', 'Price')) + '</div>' + priceRow + '</div></div>' +
        '<div class="rg-kpis">' +
            kpi(L('Unit/bln (perkiraan)', 'Units/mo (est.)'), int(p.units)) +
            kpi(L('Pendapatan/bln', 'Revenue/mo'), money(p.revenue)) +
            kpi(L('Biaya/bln', 'Cost/mo'), money(p.cost)) +
            kpi(L('Margin kotor', 'Gross margin'), pct(p.margin, 0)) +
        '</div>' +
        '<div class="rg-btn-row">' + action + '</div>' +
        (p.locked && p.open ? '<div class="rg-row-meta">' + esc(L('Harga/tier bisa diubah lagi ' + Math.ceil(p.lockLeft) + ' bln', 'Price/tier editable in ' + Math.ceil(p.lockLeft) + ' mo')) + '</div>' : '') +
        '</div>';
}

export function renderEcosystemPanel(params) {
    ensureRegionalStyle();
    var sys = params.ecosystemSystem;
    if (!sys) return '';
    var sum = sys.getSummary();
    var sp = sys.getStorePreview();
    var lines = ECO_LINES.map(function (l) { return _lineCard(sys, l); }).join('');
    return _summaryCard(sum) + _storeCard(sp) + lines;
}
