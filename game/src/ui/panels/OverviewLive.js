// FILE: src/ui/panels/OverviewLive.js  (BARU — Overview v2)
// Pembaruan live Overview tanpa render ulang seluruh panel.
//  - state:cash-changed : perbarui teks dan bar runway (ringan, dijalankan tiap perubahan kas).
//  - time:day-changed   : perbarui runway dan gambar ulang grafik kas (tidak per tick, agar hemat).
// Kas dan tanggal tetap ditangani main.js lewat [data-cash] dan [data-kpi-*], jadi tidak dobel.
// Hanya MEMBACA state. Bila panel Overview tidak sedang tampil, fungsi ini tidak melakukan apa-apa.
import { bus } from '../../core/EventBus.js';
import { computeRunway, runwayText } from './OverviewSignals.js';
import { drawCashChart } from './CashChart.js';

var _inited = false;

function _state() {
    var g = typeof window !== 'undefined' ? window.__game : null;
    return g && g.state ? g.state.get() : null;
}

function _bump(el) {
    el.classList.remove('ov2-bump');
    void el.offsetWidth;
    el.classList.add('ov2-bump');
}

function _refreshRunway() {
    if (typeof document === 'undefined') return false;
    var txt = document.querySelectorAll('[data-ov-live="runway-text"]');
    var bar = document.querySelectorAll('[data-ov-live="runway-bar"]');
    if (!txt.length && !bar.length) return false;
    var st = _state();
    if (!st) return false;
    var r = computeRunway(st);
    var label = runwayText(r);
    txt.forEach(function (el) {
        if (el.textContent !== label) { el.textContent = label; _bump(el); }
        var row = el.closest('.ov-runway');
        if (row) row.style.setProperty('--ov-tone', r.tone);
    });
    bar.forEach(function (el) {
        el.style.width = r.pct.toFixed(1) + '%';
        var wrap = el.closest('.ov-runway-bar');
        if (wrap) wrap.style.setProperty('--ov-tone', r.tone);
    });
    return true;
}

function _onCash() { _refreshRunway(); }

function _onDay() {
    _refreshRunway();
    if (typeof document === 'undefined') return;
    var chart = document.querySelector('.ov-chart .chart-wrap');
    if (chart) drawCashChart(chart);
}

export function initOverviewLive() {
    if (_inited) return;
    _inited = true;
    bus.on('state:cash-changed', _onCash);
    bus.on('time:day-changed', _onDay);
}
