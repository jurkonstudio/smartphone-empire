// FILE: src/ui/panels/ManufacturePanel.js
// Sub-tab "Manufaktur" dalam tab Riset (menggantikan "Sejarah").
// Menampilkan node riset chip manufaktur (Fabrikasi + Fab & Bisnis) yang masih
// TERKUNCI. Sebelum tahun FAB_UNLOCK_YEAR (2023) isinya disamarkan; mulai 2023
// tiap node bisa dibuka dengan uang game, lalu diriset di sub-tab Chip.
import { CHIP_RESEARCH_CATEGORIES, CHIP_RESEARCH_NODES } from '../../data/chip-research.data.js';
import { FAB_UNLOCK_YEAR, FAB_UNLOCK_CATEGORIES } from '../../core/ChipResearchSystem.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _tf(key, fb, vars) { var v = t(key, vars); return (v && v !== key) ? v : fb; }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }

export function renderManufacturePanel(params) {
    var sys = params.chipResearchSystem;
    var data = window.__game.state.get();
    var year = data.time.currentYear;
    var open = year >= FAB_UNLOCK_YEAR;
    var cash = data.cash || 0;

    var locked = sys.getLockedManufactureNodes();
    var total = CHIP_RESEARCH_NODES.filter(function (n) { return FAB_UNLOCK_CATEGORIES.indexOf(n.category) !== -1; }).length;
    var boughtCount = ((data.chipResearch && data.chipResearch.unlocked) || []).length;

    var head = '<div class="mf-hero">' +
        '<div class="mf-hero-title">' + esc(_tf('mf.title', 'Riset Manufaktur Chip')) + '</div>' +
        '<div class="mf-hero-sub">' + esc(open
            ? _tf('mf.sub_open', 'Buka lebih awal node fabrikasi yang masih terkunci memakai uang perusahaan. Setelah dibuka, riset di sub-tab Chip.')
            : _tf('mf.sub_closed', 'Pembelian akses manufaktur baru tersedia tahun {y}.', { y: FAB_UNLOCK_YEAR })) + '</div>' +
        '<div class="mf-hero-stats">' +
            '<span>' + esc(_tf('mf.stat.locked', 'Terkunci')) + ' <b>' + locked.length + '</b></span>' +
            '<span>' + esc(_tf('mf.stat.bought', 'Dibuka')) + ' <b>' + boughtCount + '/' + total + '</b></span>' +
            '<span>' + esc(_tf('mf.stat.cash', 'Kas')) + ' <b>' + _money(cash) + '</b></span>' +
        '</div></div>';

    if (!open) {
        var cards = locked.length
            ? '<div class="mf-row mf-row-mystery"><div class="mf-ico">🔒</div>' +
              '<div class="mf-main"><div class="mf-name">??? × ' + locked.length + '</div>' +
              '<div class="mf-desc">' + esc(_tf('mf.hidden', 'Teknologi manufaktur belum terlihat.')) + '</div></div>' +
              '<div class="mf-buy"><span class="mf-year">' + FAB_UNLOCK_YEAR + '</span></div></div>'
            : '';
        return head + '<div class="mf-list">' + (cards || _empty()) + '</div>';
    }

    if (!locked.length) return head + _empty();

    var groups = FAB_UNLOCK_CATEGORIES.map(function (catId) {
        var cat = CHIP_RESEARCH_CATEGORIES.find(function (c) { return c.id === catId; });
        var items = locked.filter(function (n) { return n.category === catId; })
            .sort(function (a, b) { return (a.minYear - b.minYear) || (a.tier - b.tier); });
        if (!items.length) return '';
        var rows = items.map(function (n) {
            var price = sys.getUnlockPrice(n.id);
            var can = cash >= price;
            var reason = data.time.currentYear < n.minYear
                ? _tf('mf.reason.year', 'Normalnya tersedia {y}', { y: n.minYear })
                : _tf('mf.reason.prereq', 'Butuh: {n}', { n: (n.prerequisites || []).filter(function (p) { return !sys.isCompleted(p); })
                    .map(function (p) { var pn = CHIP_RESEARCH_NODES.find(function (x) { return x.id === p; }); return pn ? pn.name : p; }).join(', ') });
            return '<div class="mf-row">' +
                '<div class="mf-ico">' + renderIcon(cat ? cat.icon : 'settings', 18) + '</div>' +
                '<div class="mf-main"><div class="mf-name">' + esc(n.name) + '</div>' +
                    '<div class="mf-desc">' + esc(n.description) + '</div>' +
                    '<div class="mf-reason">' + esc(reason) + ' · ' + esc(_tf('mf.research_cost', 'Biaya riset')) + ' ' + _money(n.cost) + '</div></div>' +
                '<div class="mf-buy"><button class="btn-primary mf-buy-btn" data-chip-fab-buy="' + esc(n.id) + '"' + (can ? '' : ' disabled') + '>' +
                    esc(_tf('mf.buy', 'Buka')) + ' ' + _money(price) + '</button></div></div>';
        }).join('');
        return '<div class="section-label"><span class="section-label-text">' + esc(cat ? cat.name : catId) + ' · ' + items.length +
            '</span><span class="section-label-line"></span></div><div class="mf-list">' + rows + '</div>';
    }).join('');

    return head + groups;
}

function _empty() {
    return '<div class="empty"><div class="empty-title">' + esc(_tf('mf.empty', 'Semua node manufaktur sudah terbuka.')) + '</div></div>';
}
