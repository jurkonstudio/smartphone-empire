// FILE: src/ui/panels/ManufacturePanel.js  (REPLACE — Tahap 1)
// Sub-tab "Manufaktur" dalam tab Riset.
//
// Bagian 1 — Pabrik Komponen (BARU): bangun, upgrade, dan jalankan produksi
//   bahan baku ponsel sendiri (baterai, layar). Harga internal di sini
//   otomatis dipakai oleh Desain ponsel setelah pabrik dibangun.
// Bagian 2 — Riset Manufaktur Chip (tidak berubah): node fabrikasi yang
//   bisa dibuka dengan uang game mulai FAB_UNLOCK_YEAR.
import { CHIP_RESEARCH_CATEGORIES, CHIP_RESEARCH_NODES } from '../../data/chip-research.data.js';
import { FAB_UNLOCK_YEAR, FAB_UNLOCK_CATEGORIES, FAB_MAX_EARLY_YEARS } from '../../core/ChipResearchSystem.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t } from '../../core/LanguageService.js';
import { plantName, plantDesc, plantLevelName } from '../../data/i18n/research-localize.js';
import { PLANT_MIN_ORDER } from '../../data/material-plants.data.js';

// Ukuran batch default untuk tombol "Produksi" (dibatasi kapasitas pabrik).
var DEFAULT_BATCH = 50000;

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _tf(key, fb, vars) { var v = t(key, vars); return (v && v !== key) ? v : fb; }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _num(n) { return Math.round(n || 0).toLocaleString('en-US'); }

export function renderManufacturePanel(params) {
    var plantHtml = params.componentPlantSystem ? _renderPlantSection(params.componentPlantSystem) : '';
    return plantHtml + _renderChipManufacture(params);
}

// ============================================================
// BAGIAN 1 — PABRIK KOMPONEN
// ============================================================
function _renderPlantSection(sys) {
    var data = window.__game.state.get();
    var cash = data.cash || 0;

    var head = '<div class="mf-hero">' +
        '<div class="mf-hero-title">' + esc(_tf('mf.plant.title', 'Pabrik Komponen')) + '</div>' +
        '<div class="mf-hero-sub">' + esc(_tf('mf.plant.sub',
            'Buat bahan baku ponsel sendiri. Setelah pabrik dibangun, harga internal otomatis dipakai di Desain ponsel.')) + '</div>' +
        '<div class="mf-hero-stats">' +
            '<span>' + esc(_tf('mf.stat.cash', 'Kas')) + ' <b>' + _money(cash) + '</b></span>' +
            '<span>' + esc(_tf('mf.plant.total_made', 'Total dibuat')) + ' <b>' + _num((data.componentPlants && data.componentPlants.totalProduced) || 0) + '</b></span>' +
        '</div></div>';

    var cards = sys.getSummary().map(function (s) { return _renderPlantCard(sys, s, cash); }).join('');
    return head + cards;
}

function _renderPlantCard(sys, s, cash) {
    var pt = s.type;
    var id = esc(pt.id);
    var rows = [];

    // --- Status & aksi bangun / upgrade ---
    var status = '';
    var action = '';
    if (s.upgrade) {
        var pct = Math.round(Math.min(1, s.upgrade.progressDays / s.upgrade.durationDays) * 100);
        status = (s.upgrade.isBuild ? _tf('mf.plant.building', 'Sedang dibangun') : _tf('mf.plant.upgrading', 'Sedang di-upgrade')) + ' · ' + pct + '%';
        action = '<button class="btn-secondary mf-buy-btn" data-mf-action="cancel-upgrade" data-mf-plant="' + id + '">' +
            esc(_tf('mf.plant.cancel', 'Batalkan')) + '</button>';
    } else if (!s.built) {
        if (!s.unlock.ok) {
            status = s.unlock.reasonKey ? t(s.unlock.reasonKey, s.unlock.reasonVars) : s.unlock.reason;
        } else {
            status = _tf('mf.plant.not_built', 'Belum dibangun') + ' · ' + _money(s.nextInfo.cost) + ' · ' + s.nextInfo.durationDays + ' ' + _tf('mf.plant.days', 'hari');
            var canBuild = cash >= s.nextInfo.cost;
            action = '<button class="btn-primary mf-buy-btn" data-mf-action="build" data-mf-plant="' + id + '"' + (canBuild ? '' : ' disabled') + '>' +
                esc(_tf('mf.plant.build', 'Bangun')) + ' ' + _money(s.nextInfo.cost) + '</button>';
            if (!canBuild) action += '<div class="mf-short">' + esc(_tf('mf.reason.need_more', 'Kurang {m}', { m: _money(s.nextInfo.cost - cash) })) + '</div>';
        }
    } else {
        var li = s.levelInfo;
        status = 'Level ' + s.level + ' · ' + plantLevelName(pt, s.level, li.name) + ' · ' + _tf('mf.plant.capacity', 'Kapasitas') + ' ' + _num(li.capacityMonthly) + '/' + _tf('mf.plant.month', 'bulan') +
            ' · ' + _tf('mf.plant.discount', 'Diskon') + ' ' + Math.round(li.discount * 100) + '%';
        if (s.nextInfo) {
            var canUp = cash >= s.nextInfo.cost && !s.upgrade;
            action = '<button class="btn-primary mf-buy-btn" data-mf-action="upgrade" data-mf-plant="' + id + '"' + (canUp ? '' : ' disabled') + '>' +
                esc(_tf('mf.plant.upgrade', 'Upgrade')) + ' ' + _money(s.nextInfo.cost) + '</button>';
        }
    }

    rows.push('<div class="mf-row"><div class="mf-ico">' + renderIcon(pt.icon || 'settings', 18) + '</div>' +
        '<div class="mf-main"><div class="mf-name">' + esc(plantName(pt)) + '</div>' +
        '<div class="mf-desc">' + esc(plantDesc(pt)) + '</div>' +
        '<div class="mf-reason">' + esc(status) + '</div></div>' +
        (action ? '<div class="mf-buy">' + action + '</div>' : '') + '</div>');

    // --- Produksi (hanya saat pabrik sudah berdiri) ---
    if (s.built) {
        if (s.producing) {
            var p = s.producing;
            var pp = p.totalUnits ? Math.round((p.progressUnits / p.totalUnits) * 100) : 100;
            rows.push('<div class="mf-row"><div class="mf-ico">⚙️</div>' +
                '<div class="mf-main"><div class="mf-name">' + esc(_tf('mf.plant.producing', 'Produksi berjalan')) + ': ' + esc(p.componentName) + '</div>' +
                '<div class="mf-desc">' + _num(p.totalUnits) + ' unit · ' + pp + '%</div></div>' +
                '<div class="mf-buy"><button class="btn-secondary mf-buy-btn" data-mf-action="cancel-prod" data-mf-plant="' + id + '">' +
                esc(_tf('mf.plant.cancel', 'Batalkan')) + '</button></div></div>');
        }

        var batch = Math.max(PLANT_MIN_ORDER, Math.min(s.levelInfo.capacityMonthly, DEFAULT_BATCH));
        var comps = sys.getEligibleComponents(pt.id);
        if (!comps.length) {
            rows.push('<div class="mf-row mf-row-mystery"><div class="mf-main"><div class="mf-desc">' +
                esc(_tf('mf.plant.none', 'Belum ada komponen yang bisa diproduksi. Selesaikan riset komponen dulu.')) + '</div></div></div>');
        }
        comps.forEach(function (c) {
            var unit = sys.getUnitCost(c.id);
            var total = Math.round(unit * batch);
            var can = !s.producing && !s.upgrade && cash >= total;
            var inv = sys.getInventory(c.id);
            var priceTag = unit < c.costPerUnit
                ? _money(unit) + ' <s>' + _money(c.costPerUnit) + '</s>'
                : _money(unit);
            rows.push('<div class="mf-row"><div class="mf-main">' +
                '<div class="mf-name">' + esc(c.name) + '</div>' +
                '<div class="mf-reason">' + _tf('mf.plant.unit_cost', 'Biaya internal') + ' ' + priceTag + '/unit' +
                ' · ' + _tf('mf.plant.stock', 'Stok') + ' <b>' + _num(inv) + '</b></div></div>' +
                '<div class="mf-buy"><button class="btn-primary mf-buy-btn" data-mf-action="order" data-mf-plant="' + id +
                '" data-mf-comp="' + esc(c.id) + '" data-mf-qty="' + batch + '"' + (can ? '' : ' disabled') + '>' +
                esc(_tf('mf.plant.produce', 'Produksi')) + ' ' + _num(batch) + '</button>' +
                (can ? '' : '<div class="mf-short">' + esc(_tf('mf.reason.need_more', 'Kurang {m}', { m: _money(total - cash) })) + '</div>') +
                '</div></div>');
        });
    }

    return '<div class="section-label"><span class="section-label-text">' + esc(plantName(pt)) + '</span><span class="section-label-line"></span></div>' +
        '<div class="mf-list">' + rows.join('') + '</div>';
}

// ============================================================
// BAGIAN 2 — RISET MANUFAKTUR CHIP (tidak berubah dari versi sebelumnya)
// ============================================================
function _renderChipManufacture(params) {
    var sys = params.chipResearchSystem;
    var data = window.__game.state.get();
    var year = data.time.currentYear;
    var open = year >= FAB_UNLOCK_YEAR;
    var cash = data.cash || 0;

    var locked = sys.getLockedManufactureNodes();
    var total = CHIP_RESEARCH_NODES.filter(function (n) { return FAB_UNLOCK_CATEGORIES.indexOf(n.category) !== -1; }).length;
    var boughtCount = ((data.chipResearch && data.chipResearch.unlocked) || []).length;
    // Hanya node dalam jendela pembelian yang ditampilkan; sisanya disamarkan.
    var buyable = open ? locked.filter(function (n) { return sys.isWithinEarlyWindow(n.id); }) : [];
    var future = open ? locked.filter(function (n) { return !sys.isWithinEarlyWindow(n.id); }) : [];
    var affordableCount = buyable.filter(function (n) { return cash >= sys.getUnlockPrice(n.id); }).length;

    var head = '<div class="mf-hero">' +
        '<div class="mf-hero-title">' + esc(_tf('mf.title', 'Riset Manufaktur Chip')) + '</div>' +
        '<div class="mf-hero-sub">' + esc(open
            ? _tf('mf.sub_open', 'Buka lebih awal node fabrikasi yang masih terkunci memakai uang perusahaan. Setelah dibuka, riset di sub-tab Chip.')
            : _tf('mf.sub_closed', 'Pembelian akses manufaktur baru tersedia tahun {y}.', { y: FAB_UNLOCK_YEAR })) + '</div>' +
        '<div class="mf-hero-stats">' +
            '<span>' + esc(_tf('mf.stat.locked', 'Terkunci')) + ' <b>' + locked.length + '</b></span>' +
            '<span>' + esc(_tf('mf.stat.bought', 'Dibuka')) + ' <b>' + boughtCount + '/' + total + '</b></span>' +
            (open ? '<span>' + esc(_tf('mf.stat.affordable', 'Terjangkau')) + ' <b>' + affordableCount + '</b></span>' : '') +
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
        var items = buyable.filter(function (n) { return n.category === catId; })
            .sort(function (a, b) { return (a.minYear - b.minYear) || (a.tier - b.tier); });
        if (!items.length) return '';
        var rows = items.map(function (n) {
            var price = sys.getUnlockPrice(n.id);
            var can = cash >= price;
            var early = sys.getEarlyYears(n.id);
            var reason = early > 0
                ? _tf('mf.reason.early', '{n} tahun lebih awal dari jadwal ({y})', { n: early, y: n.minYear })
                : _tf('mf.reason.prereq', 'Butuh: {n}', { n: (n.prerequisites || []).filter(function (p) { return !sys.isCompleted(p); })
                    .map(function (p) { var pn = CHIP_RESEARCH_NODES.find(function (x) { return x.id === p; }); return pn ? pn.name : p; }).join(', ') });
            return '<div class="mf-row">' +
                '<div class="mf-ico">' + renderIcon(cat ? cat.icon : 'settings', 18) + '</div>' +
                '<div class="mf-main"><div class="mf-name">' + esc(n.name) + '</div>' +
                    '<div class="mf-desc">' + esc(n.description) + '</div>' +
                    '<div class="mf-reason">' + esc(reason) + ' · ' + esc(_tf('mf.research_cost', 'Biaya riset')) + ' ' + _money(n.cost) + '</div></div>' +
                '<div class="mf-buy"><button class="btn-primary mf-buy-btn" data-chip-fab-buy="' + esc(n.id) + '"' + (can ? '' : ' disabled') + '>' +
                    esc(_tf('mf.buy', 'Buka')) + ' ' + _money(price) + '</button>' +
                    (can ? '' : '<div class="mf-short">' + esc(_tf('mf.reason.need_more', 'Kurang {m}', { m: _money(price - cash) })) + '</div>') +
                '</div></div>';
        }).join('');
        return '<div class="section-label"><span class="section-label-text">' + esc(cat ? cat.name : catId) + ' · ' + items.length +
            '</span><span class="section-label-line"></span></div><div class="mf-list">' + rows + '</div>';
    }).join('');

    // Teknologi yang masih terlalu jauh di masa depan: satu baris samar.
    var futureRow = '';
    if (future.length) {
        var nextYear = Math.min.apply(null, future.map(function (n) { return n.minYear; })) - FAB_MAX_EARLY_YEARS;
        futureRow = '<div class="mf-list"><div class="mf-row mf-row-mystery"><div class="mf-ico">🔒</div>' +
            '<div class="mf-main"><div class="mf-name">??? × ' + future.length + '</div>' +
            '<div class="mf-desc">' + esc(_tf('mf.future', 'Teknologi masa depan · bisa dibuka mulai {y}', { y: Math.max(nextYear, year + 1) })) + '</div></div></div></div>';
    }

    return head + (groups || (future.length ? '' : _empty())) + futureRow;
}

function _empty() {
    return '<div class="empty"><div class="empty-title">' + esc(_tf('mf.empty', 'Semua node manufaktur sudah terbuka.')) + '</div></div>';
}
