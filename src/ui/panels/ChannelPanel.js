// FILE: src/ui/panels/ChannelPanel.js  (BARU — kanal distribusi)
// Sub-tab "Kanal" di panel Pasar: ringkasan efek kanal, kartu tiap kanal (operator, online,
// toko sendiri) dengan jangkauan tahun ini, potongan, biaya, komitmen, dan tombol buka/tutup.
// Logika ada di ChannelSystem.js; klik ditangani main.js lewat [data-channel-toggle].
import { LanguageService } from '../../core/LanguageService.js';
import { formatCurrency } from '../../utils/format.js';
import { ensureRegionalStyle } from './RegionalStyle.js';

function _en() { try { return LanguageService.getLang() === 'en'; } catch (e) { return false; } }
function L(id, en) { return _en() ? en : id; }
function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function T(o) { return o == null ? '' : (typeof o === 'string' ? o : (o[_en() ? 'en' : 'id'] || o.en || o.id || '')); }
function money(n) { return formatCurrency(n); }
function pct(x, d) { return (x * 100).toFixed(d == null ? 0 : d) + '%'; }
function kpi(label, val) {
    return '<div class="rg-kpi"><div class="rg-kpi-label">' + esc(label) + '</div><div class="rg-kpi-value">' + esc(val) + '</div></div>';
}

function _summaryCard(sum, baseline) {
    var cutPct = 1 - baseline.retention;
    return '<div class="card"><div class="card-title">' + esc(L('Jalur Distribusi', 'Sales Channels')) + '</div>' +
        '<div class="rg-desc">' + esc(L(
            'Distributor & ritel selalu aktif. Kanal tambahan memperluas permintaan, tetapi unit yang lewat kanal itu dipotong margin dan ada biaya tetap. Biaya produksi per unit tidak berubah, jadi pilih kanal sesuai margin ponselmu.',
            'Distributors & retail are always on. Extra channels expand demand, but units sold through them are margin-cut and carry fixed costs. Unit production cost does not change, so match channels to your phone margins.')) + '</div>' +
        '<div class="rg-kpis">' +
            kpi(L('Jangkauan', 'Reach'), '+' + pct(baseline.reach - 1)) +
            kpi(L('Margin diterima', 'Revenue kept'), pct(baseline.retention)) +
            kpi(L('Biaya tetap/bln', 'Fixed/mo'), money(sum.monthlyFixed)) +
            kpi(L('Potongan bulan ini', 'Cuts this month'), money(Math.round(sum.monthCut))) +
        '</div>' +
        (cutPct > 0.0005 ? '<div class="rg-row-meta" style="margin-top:6px;">' + esc(L('Potongan rata-rata ', 'Average cut ')) + pct(cutPct, 1) + esc(L(' dari harga jual.', ' of the sale price.')) + '</div>' : '') +
        '</div>';
}

function _channelCard(ch, cash) {
    var def = ch.def;
    var status, cls;
    if (!ch.unlocked) { status = L('Terbuka tahun ', 'Unlocks in ') + def.unlock; cls = 'rg-lock'; }
    else if (ch.active) { status = L('Aktif', 'Active'); cls = 'rg-ok'; }
    else { status = L('Tidak aktif', 'Inactive'); cls = 'rg-row-meta'; }

    var facts =
        '<div class="rg-row-meta">' + esc(L('Permintaan tambahan tahun ini ', 'Extra demand this year ')) + '<b>+' + pct(ch.reachNow) + '</b>' +
        ' · ' + esc(L('margin diterima ', 'revenue kept ')) + '<b>' + pct(def.retention) + '</b>' + '</div>' +
        '<div class="rg-row-meta">' + esc(L('Biaya buka ', 'Setup ')) + '<b>' + money(ch.setupCost) + '</b>' +
        ' · ' + esc(L('tetap ', 'fixed ')) + '<b>' + money(ch.monthlyCost) + L('/bln', '/mo') + '</b>' +
        ' · ' + esc(L('komitmen ', 'commitment ')) + def.lockMonths + esc(L(' bln', ' mo')) + '</div>';

    var live = '';
    if (ch.active) {
        live = '<div class="rg-row-meta" style="margin-top:2px;">' + esc(L('Bulan ini: ', 'This month: ')) + Math.round(ch.mUnits).toLocaleString('en-US') + esc(L(' unit, potongan ', ' units, cut ')) + money(Math.round(ch.mCut)) +
            (ch.lockLeft > 0 ? ' · ' + esc(L('terikat ', 'locked ')) + ch.lockLeft + esc(L(' bln lagi', ' more mo')) : '') + '</div>';
    }

    var btn;
    if (!ch.unlocked) {
        btn = '<button class="btn-secondary" disabled>' + esc(L('Terkunci', 'Locked')) + '</button>';
    } else if (ch.active) {
        var canClose = ch.lockLeft <= 0;
        btn = '<button class="btn-secondary" data-channel-toggle="' + esc(ch.id) + '"' + (canClose ? '' : ' disabled') + '>' +
            esc(canClose ? L('Tutup kanal', 'Close channel') : L('Terikat komitmen', 'Under commitment')) + '</button>';
    } else {
        var can = cash >= ch.setupCost;
        btn = '<button class="' + (can ? 'btn-primary' : 'btn-secondary') + '" data-channel-toggle="' + esc(ch.id) + '"' + (can ? '' : ' disabled') + '>' +
            esc(can ? L('Buka kanal', 'Open channel') : L('Dana kurang', 'Not enough cash')) + '</button>';
    }

    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
        '<div class="card-title" style="margin:0;">' + esc(T(def.name)) + '</div><div class="' + cls + '">' + esc(status) + '</div></div>' +
        '<div class="rg-desc">' + esc(T(def.desc)) + '</div>' + facts + live +
        '<div class="rg-btn-row">' + btn + '</div></div>';
}

export function renderChannelPanel(params) {
    try { ensureRegionalStyle(); } catch (e) {}
    var sys = params && params.channelSystem;
    if (!sys) return '<div class="card"><div class="rg-row-meta">' + esc(L('Sistem belum siap.', 'System not ready.')) + '</div></div>';
    var cash = 0;
    try { cash = window.__game.state.get().cash || 0; } catch (e) {}
    var sum = sys.getSummary();
    // Rincian gabungan memakai produk rata-rata (tanpa scope khusus) sebagai gambaran.
    var baseline = sys.getBreakdown({ price: 0, config: {} });
    return _summaryCard(sum, baseline) + sum.channels.map(function (ch) { return _channelCard(ch, cash); }).join('');
}
