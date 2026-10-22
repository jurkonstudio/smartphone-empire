// FILE: src/ui/campus/CampusAlerts.js  (REPLACE — alert untuk gedung registri baru)
// v2027.62 — + alert Pabrik Komponen (tagihan perawatan menumpuk / menganggur) dan Pusat Desain
// Chip (slot riset chip kosong). Alert hanya tampil bila gedungnya sudah berdiri (lihat CampusScene).
// Peta kampus sebagai menu utama: membaca state game dan menentukan gedung mana yang butuh perhatian,
// beserta aksi langsung (buka tab + sub-tab yang tepat). Murni logika (tanpa THREE / DOM).
//   computeAlerts(data) -> [{ id, tone: 'warn'|'info', text, action: { label, nav, sub?, attrs? } }]
// Satu gedung maksimal satu alert (yang terpenting). 'warn' = masalah, 'info' = peluang / tugas menganggur.
import { LanguageService } from '../../core/LanguageService.js';

function L() {
    var l = 'id';
    try { l = LanguageService.getLang(); } catch (e) {}
    return l === 'en' ? 1 : 0;
}
function f(pair, vars) {
    return String(pair[L()]).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
}
function arr(a) { return Array.isArray(a) ? a : []; }

// Hari tanpa produksi sebelum pabrik komponen dianggap menganggur (samakan dengan ComponentPlantSystem).
var PLANT_IDLE_INFO_DAYS = 30;

var TX = {
    cash:    ['Kas negatif {n}/2 bulan — risiko game over', 'Negative cash {n}/2 months — game over risk'],
    morale:  ['Moral tim rendah ({n}%)', 'Team morale is low ({n}%)'],
    labIdle: ['Slot riset kosong — mulai riset baru', 'Research slot idle — start a project'],
    bugs:    ['{n} bug OS aktif — segera tambal', '{n} active OS bug(s) — patch soon'],
    noDev:   ['Belum ada ponsel dalam pengembangan', 'No phone in development'],
    stock:   ['Stok habis: {n} produk', 'Out of stock: {n} product(s)'],
    fabIdle: ['Fab menganggur — jadwalkan produksi', 'Fab is idle — schedule production'],
    viral:   ['Isu viral negatif sedang berjalan', 'A negative viral issue is running'],
    plantDebt: ['Tagihan perawatan pabrik komponen menumpuk', 'Component plant upkeep bills are piling up'],
    plantIdle: ['Pabrik komponen menganggur — jadwalkan produksi', 'Component plant is idle — schedule production'],
    chipIdle:  ['Slot riset chip kosong — mulai desain baru', 'Chip research slot idle — start a new design']
};
var AC = {
    bank:    ['Buka Bank', 'Open Bank'],
    team:    ['Cek Tim', 'Check Team'],
    research:['Mulai Riset', 'Start Research'],
    patch:   ['Tambal Bug', 'Patch Bugs'],
    design:  ['Rancang Ponsel', 'Design a Phone'],
    restock: ['Kelola Stok', 'Manage Stock'],
    fab:     ['Buka Fab', 'Open Fab'],
    respond: ['Tanggapi', 'Respond'],
    manufacture: ['Buka Manufaktur', 'Open Manufacturing'],
    chip:    ['Mulai Riset Chip', 'Start Chip Research']
};
function act(key, nav, sub, attrs) {
    return { label: AC[key][L()], nav: nav, sub: sub || '', attrs: attrs || null };
}

export function computeAlerts(data) {
    var out = [];
    if (!data) return out;
    var staff = arr(data.staff);

    // HQ: kas negatif > moral rendah
    var neg = (data.finance && data.finance.negativeMonths) || 0;
    if (neg > 0 || (typeof data.cash === 'number' && data.cash < 0)) {
        out.push({ id: 'hq', tone: 'warn', text: f(TX.cash, { n: Math.max(1, neg) }), action: act('bank', 'team', 'bank') });
    } else if (staff.length) {
        var sum = 0;
        staff.forEach(function (s) { sum += (s && typeof s.morale === 'number') ? s.morale : 75; });
        var avg = Math.round(sum / staff.length);
        if (avg < 40) out.push({ id: 'hq', tone: 'warn', text: f(TX.morale, { n: avg }), action: act('team', 'team', 'team') });
    }

    // Lab R&D: slot riset menganggur
    var rs = data.research;
    if (rs && arr(rs.active).length < (rs.maxSlots || 1)) {
        out.push({ id: 'lab', tone: 'info', text: f(TX.labIdle), action: act('research', 'research', 'tech') });
    }

    // Pusat OS: bug aktif
    var bugs = arr(data.os && data.os.bugs).filter(function (b) { return b && b.status === 'active'; }).length;
    if (bugs > 0) out.push({ id: 'os', tone: 'warn', text: f(TX.bugs, { n: bugs }), action: act('patch', 'research', 'os') });

    // Toko: tidak ada pengembangan ponsel
    var pr = data.products || {};
    var selling = arr(pr.catalog).filter(function (p) { return p && p.status === 'selling'; });
    if (!pr.development && !pr.designing && selling.length < 5) {
        out.push({ id: 'store', tone: 'info', text: f(TX.noDev), action: act('design', 'products', 'design') });
    }

    // Pelabuhan: stok habis
    var empty = selling.filter(function (p) { return (p.stock || 0) <= 0; }).length;
    if (empty > 0) out.push({ id: 'port', tone: 'warn', text: f(TX.stock, { n: empty }), action: act('restock', 'products', 'catalog') });

    // Pabrik chip: menganggur
    var fab = data.fab;
    if (fab && fab.built && !fab.producing && !fab.upgrade) {
        out.push({ id: 'factory', tone: 'info', text: f(TX.fabIdle), action: act('fab', '', '', { 'data-chip-action': 'fab' }) });
    }

    // Monumen (pangsa pasar): isu viral negatif aktif
    var viral = arr(data.feedback && data.feedback.activeViral).some(function (v) { return v && v.type === 'negative'; });
    if (viral) out.push({ id: 'monument', tone: 'warn', text: f(TX.viral), action: act('respond', 'market', 'public') });

    // Pabrik komponen: tagihan perawatan menumpuk (warn) / menganggur (info)
    var plants = data.componentPlants && data.componentPlants.plants;
    if (plants && typeof plants === 'object') {
        var built = Object.keys(plants).map(function (k) { return plants[k]; }).filter(function (p) { return p && p.built; });
        if (built.some(function (p) { return (p.unpaid || 0) > 0; })) {
            out.push({ id: 'pcplant', tone: 'warn', text: f(TX.plantDebt), action: act('manufacture', 'research', 'manufaktur') });
        } else if (built.some(function (p) { return !p.producing && (p.idleDays || 0) >= PLANT_IDLE_INFO_DAYS; })) {
            out.push({ id: 'pcplant', tone: 'info', text: f(TX.plantIdle), action: act('manufacture', 'research', 'manufaktur') });
        }
    }

    // Pusat desain chip: slot riset chip kosong (hanya bila sudah ada riset chip selesai)
    var cr = data.chipResearch;
    if (cr && arr(cr.completed).length > 0 && arr(cr.active).length < (cr.maxSlots || 1)) {
        out.push({ id: 'chipdesign', tone: 'info', text: f(TX.chipIdle), action: act('chip', 'research', 'chip') });
    }

    return out;
}

// Peta id -> alert (yang tone 'warn' menang bila ada dua untuk satu gedung).
export function alertMap(list) {
    var m = {};
    list.forEach(function (a) {
        var cur = m[a.id];
        if (!cur || (cur.tone !== 'warn' && a.tone === 'warn')) m[a.id] = a;
    });
    return m;
}
