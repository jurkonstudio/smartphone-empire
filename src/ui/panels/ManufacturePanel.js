// FILE: src/ui/panels/ManufacturePanel.js  (REPLACE — v2)
// Sub-tab "Manufaktur" dalam tab Riset. Dibagi 4 bagian (navigasi segmented di atas):
//   Ringkasan : alur Chip -> Komponen -> Assembly -> Produk, biaya tetap, peringatan gabungan, langkah berikutnya.
//   Assembly  : pabrik perakitan akhir (lihat AssemblyPanel.js).
//   Komponen  : pabrik baterai/layar/SoC/kamera/RAM (kartu bisa dilipat, pilihan ukuran batch).
//   Chip      : riset manufaktur chip (tidak berubah).
// Aksi tetap lewat data-mf-action (komponen), data-asm-action (assembly), data-chip-fab-buy (chip);
// navigasi bagian lewat data-mf-ui="sec:..." (ManufactureUiState + handler di main.js).
import { CHIP_RESEARCH_CATEGORIES, CHIP_RESEARCH_NODES } from '../../data/chip-research.data.js';
import { FAB_UNLOCK_YEAR, FAB_UNLOCK_CATEGORIES, FAB_MAX_EARLY_YEARS } from '../../core/ChipResearchSystem.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { plantName, plantDesc, plantLevelName } from '../../data/i18n/research-localize.js';
import { PLANT_MIN_ORDER, getPlantYield } from '../../data/material-plants.data.js';
import { renderAssemblySection, renderAlerts } from './AssemblyPanel.js';
import { getSection, isOpen, getBatch } from './ManufactureUiState.js';
import { mfIcon } from '../manufacture/MfIcons.js';

// Ukuran batch default untuk tombol "Produksi" (dibatasi kapasitas pabrik).
var DEFAULT_BATCH = 50000;

var MT = {
    id: {
        s_overview: 'Ringkasan', s_assembly: 'Assembly', s_plants: 'Komponen', s_chip: 'Chip',
        hub: 'Pusat Manufaktur', hub_sub: 'Pantau seluruh rantai produksi dari satu tempat: chip, komponen, perakitan, hingga stok produk.',
        flow: 'Rantai produksi', n_chip: 'Fab Chip', n_comp: 'Komponen', n_asm: 'Assembly', n_prod: 'Produk',
        v_chip_on: 'Fab berdiri', v_chip_off: 'Fab belum ada', v_chip_nodes: '{n} node terkunci', v_comp: '{b}/{t} pabrik', v_asm_none: 'Belum dibangun', v_asm_wait: 'Menunggu izin', v_asm_run: 'Terpakai {u}%', v_asm_build: 'Dibangun', v_prod: '{n} pesanan antre',
        st_cash: 'Kas', st_fixed: 'Biaya tetap/bln', st_save_plant: 'Hemat komponen', st_save_asm: 'Hemat restock (est.)', st_stock: 'Stok komponen', st_rev: 'Omzet grosir', st_cap: 'Kapasitas rakit',
        att: 'Perlu perhatian', att_none: 'Semua lini berjalan lancar.', att_plant_unpaid: '{name}: perawatan menunggak {v}.', att_stock_zero: 'Belum ada stok komponen dari pabrikmu. Produksi dulu agar desain memakai harga internal.',
        att_fab_new: '{n} node manufaktur chip bisa dibuka sekarang.',
        next: 'Langkah berikutnya', nx_asm: 'Bangun Pabrik Assembly agar biaya restock turun dan jeda produksi mengikuti kapasitas.', nx_plant: 'Bangun pabrik komponen pertama untuk memangkas biaya bahan baku.',
        nx_stock: 'Pabrik sudah berdiri tetapi stok kosong. Mulai produksi komponen.', nx_staff: 'Isi tenaga kerja Assembly supaya kapasitas dan diskon restock maksimal.', nx_ok: 'Rantai produksi sudah lengkap. Pertimbangkan upgrade level pabrik.',
        go: 'Buka', go_assembly: 'Ke Assembly', go_plants: 'Ke Komponen', go_chip: 'Ke Chip',
        pl_open: 'Buka detail', pl_close: 'Tutup', pl_batch: 'Ukuran batch', pl_cap: 'Kapasitas penuh', pl_stats: 'Statistik', pl_lv: 'Level', pl_none_built: 'Belum dibangun', pl_stock: 'Stok',
        pl_sum_built: 'Pabrik berdiri', pl_sum_upkeep: 'Perawatan/bln', pl_sum_tax: 'Pajak infra/bln', pl_sum_save: 'Hemat vs pasar', pl_sum_rev: 'Omzet grosir', pl_sum_stock: 'Total stok', pl_sum_unpaid: 'Tunggakan'
    },
    en: {
        s_overview: 'Overview', s_assembly: 'Assembly', s_plants: 'Components', s_chip: 'Chip',
        hub: 'Manufacturing Hub', hub_sub: 'Watch the whole production chain in one place: chips, components, assembly and product stock.',
        flow: 'Production chain', n_chip: 'Chip Fab', n_comp: 'Components', n_asm: 'Assembly', n_prod: 'Products',
        v_chip_on: 'Fab built', v_chip_off: 'No fab yet', v_chip_nodes: '{n} nodes locked', v_comp: '{b}/{t} plants', v_asm_none: 'Not built', v_asm_wait: 'Awaiting permit', v_asm_run: '{u}% used', v_asm_build: 'Building', v_prod: '{n} orders queued',
        st_cash: 'Cash', st_fixed: 'Fixed cost/mo', st_save_plant: 'Component savings', st_save_asm: 'Restock savings (est.)', st_stock: 'Component stock', st_rev: 'Wholesale revenue', st_cap: 'Assembly capacity',
        att: 'Needs attention', att_none: 'Every line is running smoothly.', att_plant_unpaid: '{name}: upkeep overdue {v}.', att_stock_zero: 'No component stock from your plants yet. Produce some so designs use internal prices.',
        att_fab_new: '{n} chip manufacturing nodes can be unlocked now.',
        next: 'Next step', nx_asm: 'Build the Assembly plant to cut restock costs and tie lead times to capacity.', nx_plant: 'Build your first component plant to cut raw material costs.',
        nx_stock: 'Plants are built but stock is empty. Start producing components.', nx_staff: 'Staff the Assembly plant so capacity and the restock discount reach their best.', nx_ok: 'The chain is complete. Consider upgrading plant levels.',
        go: 'Open', go_assembly: 'Go to Assembly', go_plants: 'Go to Components', go_chip: 'Go to Chip',
        pl_open: 'Show details', pl_close: 'Hide', pl_batch: 'Batch size', pl_cap: 'Full capacity', pl_stats: 'Stats', pl_lv: 'Level', pl_none_built: 'Not built', pl_stock: 'Stock',
        pl_sum_built: 'Plants built', pl_sum_upkeep: 'Upkeep/mo', pl_sum_tax: 'Infra tax/mo', pl_sum_save: 'Saved vs market', pl_sum_rev: 'Wholesale revenue', pl_sum_stock: 'Total stock', pl_sum_unpaid: 'Overdue'
    }
};
function mt(key, vars) {
    var l = 'id'; try { l = LanguageService.getLang(); } catch (e) {}
    var d = (l === 'id') ? MT.id : MT.en, s = d[key]; if (s === undefined) s = MT.en[key]; if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
}

function esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _tf(key, fb, vars) { var v = t(key, vars); return (v && v !== key) ? v : fb; }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _num(n) { return Math.round(n || 0).toLocaleString('en-US'); }

// ============================================================
// ENTRI
// ============================================================
export function renderManufacturePanel(params) {
    var sec = getSection();
    var ov = _gather(params);
    var body;
    if (sec === 'assembly') body = params.assemblySystem ? renderAssemblySection(params.assemblySystem, { plantSystem: params.componentPlantSystem }) : '';
    else if (sec === 'plants') body = params.componentPlantSystem ? _renderPlantSection(params.componentPlantSystem) : '';
    else if (sec === 'chip') body = _renderChipManufacture(params);
    else body = _renderOverview(params, ov);
    return '<div class="mfx-root">' + _renderSectionBar(sec, ov) + body + '</div>';
}

// Kumpulkan angka lintas sistem sekali per render.
function _gather(params) {
    var data = window.__game.state.get();
    var ov = { data: data, cash: data.cash || 0, plants: [], built: 0, upkeep: 0, infra: 0, unpaid: 0, stock: 0, asm: null, asmAlerts: [], orders: 0, fixed: 0, chipLocked: 0, fabBuilt: !!(data.fab && data.fab.built), pj: null };
    var ps = params.componentPlantSystem;
    if (ps) {
        ov.plants = ps.getSummary();
        var b = ov.plants.filter(function (s) { return s.built; });
        ov.built = b.length;
        ov.upkeep = b.reduce(function (a, s) { return a + (s.maintenanceMonthly || 0); }, 0);
        ov.unpaid = b.reduce(function (a, s) { return a + (s.unpaid || 0); }, 0);
        try { ov.infra = ps.getMonthlyInfraTax(); } catch (e) {}
        var inv = (data.componentPlants && data.componentPlants.inventory) || {};
        Object.keys(inv).forEach(function (k) { ov.stock += inv[k] || 0; });
    }
    var as = params.assemblySystem;
    if (as) {
        try {
            ov.asm = as.getSnapshot(); ov.asmAlerts = as.getAlerts(); ov.orders = as.getPendingOrders().length; ov.pj = as.getProjection();
            if (ov.asm.built) ov.fixed += ov.asm.wages + ov.asm.upkeep;
            ov.unpaid += ov.asm.unpaid || 0;
        } catch (e) {}
    }
    ov.fixed += ov.upkeep + ov.infra;
    try { if (params.chipResearchSystem) ov.chipLocked = params.chipResearchSystem.getLockedManufactureNodes().length; } catch (e) {}
    return ov;
}

function _renderSectionBar(sec, ov) {
    var warn = ov.asmAlerts.filter(function (a) { return a.level !== 'info'; }).length;
    var tabs = [
        ['overview', mt('s_overview'), ''],
        ['assembly', mt('s_assembly'), warn > 0 ? '<i class="mfx-dot' + (ov.asmAlerts.some(function (a) { return a.level === 'danger'; }) ? ' bad' : '') + '"></i>' : ''],
        ['plants', mt('s_plants'), ov.plants.length ? '<small>' + ov.built + '/' + ov.plants.length + '</small>' : ''],
        ['chip', mt('s_chip'), '']
    ];
    return '<div class="mfx-seg" role="tablist">' + tabs.map(function (x) {
        return '<button type="button" role="tab" class="mfx-seg-b' + (sec === x[0] ? ' active' : '') + '" aria-selected="' + (sec === x[0]) + '" data-mf-ui="sec:' + x[0] + '">' + esc(x[1]) + x[2] + '</button>';
    }).join('') + '</div>';
}

// ============================================================
// BAGIAN RINGKASAN
// ============================================================
function _renderOverview(params, ov) {
    var asm = ov.asm, year = (ov.data.time && ov.data.time.currentYear) || 0;

    // --- rantai produksi (horizontal ringkas, aksen warna per tahap, ikon Tabler) ---
    function node(sec, ico, name, val, tone, nav, stage, pct) {
        var attrs = nav ? 'data-nav="' + nav[0] + '" data-nav-sub="' + nav[1] + '"' : 'data-mf-ui="sec:' + sec + '"';
        var bar = (pct === null || pct === undefined) ? '' :
            '<span class="mfx-node-bar"><i style="width:' + Math.max(0, Math.min(100, Math.round(pct))) + '%"></i></span>';
        return '<button class="mfx-node mfx-st-' + stage + ' ' + tone + '" ' + attrs + '>' +
            '<span class="mfx-node-i">' + mfIcon(ico) + '</span>' +
            '<span class="mfx-node-n">' + esc(name) + '</span>' +
            '<span class="mfx-node-v">' + esc(val) + '</span>' + bar +
            '<span class="mfx-node-dot" aria-hidden="true"></span></button>';
    }
    var chipTone = ov.fabBuilt ? 'ok' : (year >= FAB_UNLOCK_YEAR ? 'info' : 'mute');
    var chipVal = ov.fabBuilt ? mt('v_chip_on') : (ov.chipLocked ? mt('v_chip_nodes', { n: ov.chipLocked }) : mt('v_chip_off'));
    var compTone = ov.plants.length ? (ov.built ? 'ok' : 'info') : 'mute';
    var asmTone = 'mute', asmVal = mt('v_asm_none');
    if (asm) {
        if (asm.upgrade && !asm.built) { asmTone = 'warn'; asmVal = mt('v_asm_build'); }
        else if (asm.built && !asm.operating) { asmTone = 'warn'; asmVal = mt('v_asm_wait'); }
        else if (asm.operating) { asmTone = ov.asmAlerts.some(function (a) { return a.level === 'danger'; }) ? 'bad' : 'ok'; asmVal = mt('v_asm_run', { u: Math.round(asm.utilization * 100) }); }
        else { asmTone = 'info'; }
    }
    var html = '<div class="mfx-hub"><div class="mfx-hub-t">' + esc(mt('hub')) + '</div><div class="mfx-hub-s">' + esc(mt('hub_sub')) + '</div>' +
        '<div class="mfx-chain">' +
            node('chip', 'chip', mt('n_chip'), chipVal, chipTone, null, 'chip', ov.fabBuilt ? 100 : 0) +
            '<span class="mfx-arrow">' + mfIcon('chevron', 14) + '</span>' +
            node('plants', 'gear', mt('n_comp'), mt('v_comp', { b: ov.built, t: ov.plants.length }), compTone, null, 'comp',
                ov.plants.length ? ov.built / ov.plants.length * 100 : 0) +
            '<span class="mfx-arrow">' + mfIcon('chevron', 14) + '</span>' +
            node('assembly', 'factory', mt('n_asm'), asmVal, asmTone, null, 'asm',
                asm && asm.operating ? asm.utilization * 100 : 0) +
            '<span class="mfx-arrow">' + mfIcon('chevron', 14) + '</span>' +
            node('', 'box', mt('n_prod'), mt('v_prod', { n: ov.orders }), ov.orders ? 'info' : 'mute', ['products', 'catalog'], 'prod', null) +
        '</div></div>';

    // --- statistik ---
    var cpd = ov.data.componentPlants || {};
    function S(label, val, warn) { return '<div class="mfx-stat' + (warn ? ' warn' : '') + '"><div class="mfx-sv">' + val + '</div><div class="mfx-sl">' + esc(label) + '</div></div>'; }
    html += '<div class="mfx-stats">' +
        S(mt('st_cash'), _money(ov.cash)) + S(mt('st_fixed'), _money(ov.fixed)) +
        S(mt('st_save_plant'), _money(cpd.savings)) +
        S(mt('st_save_asm'), ov.pj && ov.pj.hasData ? _money(ov.pj.saved30) : '—') +
        S(mt('st_stock'), _num(ov.stock)) +
        (asm && asm.operating ? S(mt('st_cap'), _num(asm.capacity)) : S(mt('st_rev'), _money(cpd.externalRevenue))) + '</div>';

    // --- perlu perhatian ---
    var items = '';
    ov.plants.forEach(function (s) {
        if (s.built && s.unpaid > 0) items += '<div class="asm2-alert danger"><span class="asm2-alert-dot"></span><div class="asm2-alert-t">' + esc(mt('att_plant_unpaid', { name: plantName(s.type), v: _money(s.unpaid) })) +
            '</div><button class="btn-secondary mf-buy-btn asm2-alert-b" data-mf-ui="sec:plants">' + esc(mt('go')) + '</button></div>';
    });
    var asmAlerts = ov.asmAlerts.slice(0, 4);
    var asmHtml = renderAlerts(asmAlerts).replace('<div class="asm2-alerts">', '').replace(/<\/div>$/, '');
    if (ov.built > 0 && ov.stock <= 0) items += '<div class="asm2-alert info"><span class="asm2-alert-dot"></span><div class="asm2-alert-t">' + esc(mt('att_stock_zero')) +
        '</div><button class="btn-secondary mf-buy-btn asm2-alert-b" data-mf-ui="sec:plants">' + esc(mt('go')) + '</button></div>';
    if (year >= FAB_UNLOCK_YEAR && params.chipResearchSystem) {
        try {
            var aff = params.chipResearchSystem.getLockedManufactureNodes().filter(function (n) { return params.chipResearchSystem.isWithinEarlyWindow(n.id) && ov.cash >= params.chipResearchSystem.getUnlockPrice(n.id); }).length;
            if (aff > 0) items += '<div class="asm2-alert info"><span class="asm2-alert-dot"></span><div class="asm2-alert-t">' + esc(mt('att_fab_new', { n: aff })) +
                '</div><button class="btn-secondary mf-buy-btn asm2-alert-b" data-mf-ui="sec:chip">' + esc(mt('go')) + '</button></div>';
        } catch (e) {}
    }
    var all = asmHtml + items;
    html += '<div class="mfx-sec">' + esc(mt('att')) + '</div>' +
        (all ? '<div class="asm2-alerts">' + all + '</div>' : '<div class="asm2-card asm2-empty">' + esc(mt('att_none')) + '</div>');

    // --- langkah berikutnya ---
    var nx = null;
    var asmUnlocked = asm && params.assemblySystem && params.assemblySystem.isUnlocked().ok;
    if (asmUnlocked && !asm.built && !asm.upgrade) nx = { text: mt('nx_asm'), sec: 'assembly', btn: mt('go_assembly') };
    else if (ov.plants.length && ov.built === 0 && ov.plants.some(function (s) { return s.unlock && s.unlock.ok; })) nx = { text: mt('nx_plant'), sec: 'plants', btn: mt('go_plants') };
    else if (ov.built > 0 && ov.stock <= 0) nx = { text: mt('nx_stock'), sec: 'plants', btn: mt('go_plants') };
    else if (asm && asm.operating && asm.staffing.operator < 0.9) nx = { text: mt('nx_staff'), sec: 'assembly', btn: mt('go_assembly') };
    else if (ov.built > 0 || (asm && asm.built)) nx = { text: mt('nx_ok'), sec: '', btn: '' };
    if (nx) html += '<div class="mfx-sec">' + esc(mt('next')) + '</div><div class="asm2-card asm2-row"><div class="asm2-grow asm2-note" style="margin:0;">' + esc(nx.text) + '</div>' +
        (nx.sec ? '<button class="btn-primary mf-buy-btn" data-mf-ui="sec:' + nx.sec + '">' + esc(nx.btn) + '</button>' : '') + '</div>';
    return html;
}

// ============================================================
// BAGIAN KOMPONEN — kartu pabrik (bisa dilipat)
// ============================================================
function _renderPlantSection(sys) {
    var data = window.__game.state.get();
    var cash = data.cash || 0;
    var summary = sys.getSummary();
    var builtList = summary.filter(function (s) { return s.built; });
    var upkeep = builtList.reduce(function (a, s) { return a + (s.maintenanceMonthly || 0); }, 0);
    var infraTax = sys.getMonthlyInfraTax();
    var cpd = data.componentPlants || {};
    var unpaid = builtList.reduce(function (a, s) { return a + (s.unpaid || 0); }, 0);
    var stock = 0;
    var inv = cpd.inventory || {};
    Object.keys(inv).forEach(function (k) { stock += inv[k] || 0; });

    function S(label, val, warn) { return '<div class="mfx-stat' + (warn ? ' warn' : '') + '"><div class="mfx-sv">' + val + '</div><div class="mfx-sl">' + esc(label) + '</div></div>'; }
    var head = '<div class="mfx-hub"><div class="mfx-hub-t">' + esc(_tf('mf.plant.title', 'Pabrik Komponen')) + '</div>' +
        '<div class="mfx-hub-s">' + esc(_tf('mf.plant.sub', 'Buat bahan baku ponsel sendiri. Setelah pabrik dibangun, harga internal otomatis dipakai di Desain ponsel.')) + '</div></div>' +
        '<div class="mfx-stats">' +
        S(mt('pl_sum_built'), builtList.length + '/' + summary.length) + S(mt('pl_sum_stock'), _num(stock)) +
        S(mt('pl_sum_upkeep'), _money(upkeep)) + S(mt('pl_sum_tax'), _money(infraTax)) +
        S(mt('pl_sum_save'), _money(cpd.savings)) + (unpaid > 0 ? S(mt('pl_sum_unpaid'), _money(unpaid), true) : S(mt('pl_sum_rev'), _money(cpd.externalRevenue))) + '</div>';

    var dfltOpen = builtList.length > 0 && builtList.length <= 2;
    var wholesaleEntry = '<div class="mfx-wh-entry"><button class="btn-secondary mf-buy-btn" data-wholesale-action="open">' +
        esc(_tf('wh.entry', 'Kontrak grosir')) + '</button></div>';
    return head + wholesaleEntry + summary.map(function (s) { return _renderPlantCard(sys, s, cash, dfltOpen); }).join('');
}

function _renderPlantCard(sys, s, cash, dfltOpen) {
    var pt = s.type;
    var id = esc(pt.id);
    var key = 'plant:' + pt.id;
    var open = s.built ? isOpen(key, dfltOpen) : false;

    // --- status ringkas + aksi utama (selalu tampil di header) ---
    var status = '', action = '', tone = 'mute';
    if (s.upgrade) {
        var pct = Math.round(Math.min(1, s.upgrade.progressDays / s.upgrade.durationDays) * 100);
        status = (s.upgrade.isBuild ? _tf('mf.plant.building', 'Sedang dibangun') : _tf('mf.plant.upgrading', 'Sedang di-upgrade')) + ' · ' + pct + '%';
        tone = 'warn';
        action = '<button class="btn-secondary mf-buy-btn" data-mf-action="cancel-upgrade" data-mf-plant="' + id + '">' + esc(_tf('mf.plant.cancel', 'Batalkan')) + '</button>';
    } else if (!s.built) {
        if (!s.unlock.ok) {
            status = s.unlock.reasonKey ? t(s.unlock.reasonKey, s.unlock.reasonVars) : s.unlock.reason;
        } else {
            tone = 'info';
            status = _tf('mf.plant.not_built', 'Belum dibangun') + ' · ' + _money(s.nextInfo.cost) + ' · ' + s.nextInfo.durationDays + ' ' + _tf('mf.plant.days', 'hari');
            var canBuild = cash >= s.nextInfo.cost;
            action = '<button class="btn-primary mf-buy-btn" data-mf-action="build" data-mf-plant="' + id + '"' + (canBuild ? '' : ' disabled') + '>' + esc(_tf('mf.plant.build', 'Bangun')) + '</button>' +
                (canBuild ? '' : '<div class="mf-short">' + esc(_tf('mf.reason.need_more', 'Kurang {m}', { m: _money(s.nextInfo.cost - cash) })) + '</div>');
        }
    } else {
        var li = s.levelInfo;
        tone = s.unpaid > 0 ? 'bad' : 'ok';
        status = 'Lv ' + s.level + ' · ' + plantLevelName(pt, s.level, li.name) + ' · ' + _tf('mf.plant.capacity', 'Kapasitas') + ' ' + _num(li.capacityMonthly) + '/' + _tf('mf.plant.month', 'bulan');
        if (s.nextInfo && !s.upgrade) {
            var canUp = cash >= s.nextInfo.cost;
            action = '<button class="btn-primary mf-buy-btn" data-mf-action="upgrade" data-mf-plant="' + id + '"' + (canUp ? '' : ' disabled') + '>' + esc(_tf('mf.plant.upgrade', 'Upgrade')) + ' ' + _money(s.nextInfo.cost) + '</button>';
        }
    }

    var stockOf = 0;
    if (s.built) { sys.getEligibleComponents(pt.id).forEach(function (c) { stockOf += sys.getInventory(c.id) || 0; }); }

    var headInner = '<div class="mfx-pl-ico">' + renderIcon(pt.icon || 'settings', 20) + '</div>' +
        '<div class="mfx-pl-main"><div class="mfx-pl-name">' + esc(plantName(pt)) + (s.built ? ' <span class="asm2-chip ' + tone + '">' + esc(mt('pl_stock')) + ' ' + _num(stockOf) + '</span>' : '') + '</div>' +
        '<div class="mfx-pl-st ' + tone + '">' + esc(status) + '</div></div>';
    var headEl = s.built
        ? '<button class="mfx-pl-tog" data-mf-ui="tog:' + key + ':' + (dfltOpen ? 1 : 0) + '" aria-expanded="' + open + '">' + headInner + '<span class="mfx-pl-chev">' + (open ? '▾' : '▸') + '</span></button>'
        : '<div class="mfx-pl-tog static">' + headInner + '</div>';
    var html = '<div class="mfx-pl' + (s.built ? ' built' : '') + '"><div class="mfx-pl-head">' + headEl + (action ? '<div class="mfx-pl-act">' + action + '</div>' : '') + '</div>';

    if (!s.built || !open) return html + '</div>';

    // --- detail (terbuka) ---
    var li2 = s.levelInfo, fx = _effectText(li2.effects);
    html += '<div class="mfx-pl-body"><div class="mf-desc">' + esc(plantDesc(pt)) + '</div>' +
        '<div class="mfx-chips">' +
        '<span>' + esc(_tf('mf.plant.discount', 'Diskon')) + ' <b>' + Math.round(li2.discount * 100) + '%</b></span>' +
        '<span>' + esc(_tf('mf.plant.yield', 'Yield')) + ' <b>' + Math.round(getPlantYield(s.level) * 100) + '%</b></span>' +
        '<span>' + esc(_tf('mf.plant.upkeep', 'Perawatan')) + ' <b>' + _money(s.maintenanceMonthly) + '</b></span>' +
        '<span>' + esc(_tf('mf.plant.infra_tax', 'Pajak')) + ' <b>' + _money(s.infraTax) + '</b></span>' +
        (fx ? '<span>' + esc(fx) + '</span>' : '') +
        (s.unpaid > 0 ? '<span class="bad">' + esc(_tf('mf.plant.stat.unpaid', 'Tunggakan')) + ' <b>' + _money(s.unpaid) + '</b></span>' : '') + '</div>';

    if (s.producing) {
        var p = s.producing;
        var pp = p.totalUnits ? Math.round((p.progressUnits / p.totalUnits) * 100) : 100;
        html += '<div class="mfx-prod"><div class="asm2-row"><div class="asm2-grow"><b>⚙️ ' + esc(_tf('mf.plant.producing', 'Produksi berjalan')) + ': ' + esc(p.componentName) + '</b>' +
            '<div class="mf-desc">' + _num(p.totalUnits) + ' unit · ' + pp + '%</div></div>' +
            '<button class="btn-secondary mf-buy-btn" data-mf-action="cancel-prod" data-mf-plant="' + id + '">' + esc(_tf('mf.plant.cancel', 'Batalkan')) + '</button></div>' +
            '<div class="asm2-gauge ok sm"><i style="width:' + pp + '%"></i></div></div>';
    }

    var cap = li2.capacityMonthly;
    var stored = getBatch(pt.id, DEFAULT_BATCH);
    var batch = (stored === 0) ? Math.max(PLANT_MIN_ORDER, cap) : Math.max(PLANT_MIN_ORDER, Math.min(cap, stored));
    var opts = [10000, 50000, 100000].filter(function (v) { return v < cap && v >= PLANT_MIN_ORDER; });
    var chips = opts.map(function (v) {
        return '<button class="mfx-bch' + (stored === v ? ' on' : '') + '" data-mf-ui="batch:' + pt.id + ':' + v + '">' + _num(v) + '</button>';
    }).join('') + '<button class="mfx-bch' + ((stored === 0 || (stored >= cap && opts.indexOf(stored) < 0)) ? ' on' : '') + '" data-mf-ui="batch:' + pt.id + ':0">' + esc(mt('pl_cap')) + ' ' + _num(cap) + '</button>';
    html += '<div class="mfx-batch"><span>' + esc(mt('pl_batch')) + '</span><div class="mfx-bch-row">' + chips + '</div></div>';

    var comps = sys.getEligibleComponents(pt.id);
    if (!comps.length) html += '<div class="asm2-card asm2-empty">' + esc(_tf('mf.plant.none', 'Belum ada komponen yang bisa diproduksi. Selesaikan riset komponen dulu.')) + '</div>';
    comps.forEach(function (c) {
        var unit = sys.getUnitCost(c.id);
        var total = Math.round(unit * batch);
        var can = !s.producing && !s.upgrade && cash >= total;
        var invN = sys.getInventory(c.id);
        var q = sys.getExternalQuote(pt.id, c.id);
        var marginTag = '';
        if (q) {
            var mp = Math.round(q.marginPct * 100);
            marginTag = ' · ' + _tf('mf.plant.margin', 'Margin jual') + ' <b style="color:var(' + (q.marginPerUnit >= 0 ? '--success' : '--danger') + ');">' +
                (mp >= 0 ? '+' : '') + mp + '%</b>';
        }
        var canSell = q && q.stock > 0 && q.quotaLeft > 0;
        var sellQty = q ? Math.min(q.stock, q.quotaLeft) : 0;
        var mkNow = sys.getMarketPrice(c.id);
        var priceTag = unit < mkNow ? _money(unit) + ' <s>' + _money(mkNow) + '</s>' : _money(unit);
        html += '<div class="mfx-comp"><div class="mfx-comp-h"><b>' + esc(c.name) + '</b><span class="mfx-comp-s' + (invN > 0 ? '' : ' zero') + '">' + esc(mt('pl_stock')) + ' ' + _num(invN) + '</span></div>' +
            '<div class="mf-reason">' + _tf('mf.plant.unit_cost', 'Biaya internal') + ' ' + priceTag + '/unit' + marginTag + '</div>' +
            '<div class="mfx-comp-b"><button class="btn-primary mf-buy-btn" data-mf-action="order" data-mf-plant="' + id + '" data-mf-comp="' + esc(c.id) + '" data-mf-qty="' + batch + '"' + (can ? '' : ' disabled') + '>' +
            esc(_tf('mf.plant.produce', 'Produksi')) + ' ' + _num(batch) + ' · ' + _money(total) + '</button>' +
            (q ? '<button class="btn-secondary mf-buy-btn" data-mf-action="sell" data-mf-plant="' + id + '" data-mf-comp="' + esc(c.id) + '" data-mf-qty="' + sellQty + '"' + (canSell ? '' : ' disabled') + '>' +
                esc(_tf('mf.plant.sell', 'Jual grosir')) + ' ' + _num(sellQty) + '</button>' : '') + '</div>' +
            (can ? '' : '<div class="mf-short" style="text-align:left;">' + esc(s.producing ? _tf('mf.plant.producing', 'Produksi berjalan') : _tf('mf.reason.need_more', 'Kurang {m}', { m: _money(Math.max(0, total - cash)) })) + '</div>') +
            (q ? '<div class="mf-short" style="text-align:left;">' + esc(_tf('mf.plant.quota_left', 'Kuota bulan ini {n}', { n: _num(q.quotaLeft) })) + '</div>' : '') +
            '</div>';
    });
    return html + '</div></div>';
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

var EFFECT_LABELS = {
    batteryLife:    ['mf.fx.batteryLife', 'Daya tahan baterai'],
    displayQuality: ['mf.fx.displayQuality', 'Kualitas layar'],
    performance:    ['mf.fx.performance', 'Performa'],
    cameraQuality:  ['mf.fx.cameraQuality', 'Kualitas kamera'],
    usability:      ['mf.fx.usability', 'Kelancaran']
};
function _effectText(effects) {
    if (!effects) return '';
    return Object.keys(effects).map(function (k) {
        var l = EFFECT_LABELS[k];
        return (l ? _tf(l[0], l[1]) : k) + ' +' + Math.round(effects[k] * 100) + '%';
    }).join(', ');
}

function _empty() {
    return '<div class="empty"><div class="empty-title">' + esc(_tf('mf.empty', 'Semua node manufaktur sudah terbuka.')) + '</div></div>';
}
