// FILE: src/ui/manufacture/ManufactureLogic.js  (BARU — Peta Manufaktur 3D)
// Logika murni (tanpa THREE / DOM) untuk Peta Manufaktur: denah petak pabrik, status tiap pabrik
// (terkunci / siap dibangun / sedang dibangun / berdiri), peringatan, kartu info, dan aksi langsung.
//
// Semua angka dibaca dari sistem game yang SAMA dengan panel Manufaktur (tidak ada logika ganda):
//   * Fab Chip        -> data.fab               (FabSystem: window.__game.fab)
//   * Pabrik komponen -> data.componentPlants   (ComponentPlantSystem: window.__game.plants)
//       battery, display, soc, camera, ram  (PLANT_TYPES di material-plants.data.js)
//   * Pusat Logistik  -> ringkasan stok, perawatan, pajak infrastruktur, hemat vs pasar, omzet grosir.
//
// Tombol "Buka ..." memakai bus 'advisor:go' (ditangani main.js) sehingga langsung mendarat di panel terkait.
import { FAB_LEVELS } from '../../systems/FabSystem.js';
import { WalletService } from '../../systems/WalletService.js';
import { LanguageService } from '../../core/LanguageService.js';
import { PLANT_TYPES, PLANT_MIN_ORDER, INFRA_TAX_RATE_MONTHLY, getPlantTypeById, getPlantLevelInfo, getPlantYield, getPlantCapital, getPlantMaintenance } from '../../data/material-plants.data.js';
import { plantName, plantDesc, plantLevelName } from '../../data/i18n/research-localize.js';
import { fmtMoney, clamp } from '../office/OfficeConfig.js';
import { COMPONENTS } from '../../data/components.data.js';
import { ASSEMBLY_UNLOCK_YEAR, ASSEMBLY_OPERATE_YEAR, ASSEMBLY_ROLES, getAssemblyLevel, getAssemblyCrewTotal } from '../../data/assembly.data.js';
import { at as asmText, assemblyLevelName } from '../panels/AssemblyPanel.js';

// ============================================================
// DENAH — pusat petak (x, z), ukuran (w x d). Kamera isometrik melihat dari +x,+z.
//   Baris belakang (z = -5.2): SoC · FAB CHIP (lebar) · RAM
//   Jalan raya (z = 0)
//   Baris depan    (z = +5.2): Baterai · Layar · Kamera · Pusat Logistik
// Pipa wafer menghubungkan Fab ke SoC, RAM, dan Layar (pabrik yang butuh Fab).
// ============================================================
export var PLOTS = [
    { id: 'fab',     kind: 'fab',   x: 0,   z: -5.2, w: 14, d: 6.4, accent: 0xf97316 },
    { id: 'soc',     kind: 'plant', x: -12, z: -5.2, w: 7,  d: 6,   accent: 0x8a7fe0 },
    { id: 'ram',     kind: 'plant', x: 12,  z: -5.2, w: 7,  d: 6,   accent: 0x14b8a6 },
    { id: 'display', kind: 'plant', x: -4,  z: 5.2,  w: 7,  d: 6,   accent: 0x00b8d9 },
    { id: 'camera',  kind: 'plant', x: 4,   z: 5.2,  w: 7,  d: 6,   accent: 0xef5a8b },
    { id: 'battery', kind: 'plant', x: -12, z: 5.2,  w: 7,  d: 6,   accent: 0x43c07a },
    { id: 'hub',     kind: 'hub',   x: 12,  z: 5.2,  w: 7,  d: 6,   accent: 0x3b82f6 },
    // Pabrik perakitan: petak terbesar, di daratan tambahan sisi selatan.
    { id: 'assembly', kind: 'assembly', x: -4.5, z: 14.0, w: 22, d: 9.0, accent: 0xff7a3d }
];
export var PLOT_BY_ID = {};
PLOTS.forEach(function (p) { PLOT_BY_ID[p.id] = p; });
// Urutan chip di bilah atas.
export var CHIP_ORDER = ['fab', 'soc', 'ram', 'display', 'camera', 'battery', 'assembly', 'hub'];
// Pipa wafer: [dari, ke]. Aktif (mengalir) bila kedua pabrik berdiri.
export var PIPES = [['fab', 'soc'], ['fab', 'ram'], ['fab', 'display']];

// ============================================================
// JARINGAN JALAN, APRON & DERMAGA (data murni, tanpa THREE)
// Koordinat dunia: x ke timur, z ke selatan. Dipakai ManufactureScene untuk menggambar jalan dan
// menjalankan truk kontainer. ROAD_EDGES dengan draw:false hanya untuk rute (permukaannya apron).
// ============================================================
export var ROAD_NODES = {
    hwW:  [-16.6, 0],      // ujung barat jalan raya (bertemu jalan akses barat)
    socW: [-16.6, -4.0],   // akses pabrik SoC (baris utara)
    wsw:  [-16.6, 8.95],   // persimpangan barat-selatan (jalan depan Assembly)
    bat:  [-12, 8.95],     // akses Baterai
    dis:  [-4, 8.95],      // akses Layar
    asm:  [-0.5, 8.95],    // gerbang pemuatan Assembly
    cam:  [4, 8.95],       // akses Kamera
    hubS: [12.2, 8.95],    // persimpangan Pusat Logistik / pangkal apron
    dock: [14.7, 10.5]     // titik bongkar di bawah crane (apron)
};
export var ROAD_EDGES = [
    { a: 'hwW', b: 'socW', w: 1.5 },
    { a: 'hwW', b: 'wsw', w: 1.5 },
    { a: 'wsw', b: 'bat', w: 1.4 },
    { a: 'bat', b: 'dis', w: 1.4 },
    { a: 'dis', b: 'asm', w: 1.4 },
    { a: 'asm', b: 'cam', w: 1.4 },
    { a: 'cam', b: 'hubS', w: 1.4 },
    { a: 'hubS', b: 'dock', w: 2.0, draw: false }
];
// Apron (lapangan beton) di bawah crane, dan dermaga yang menjorok ke laut.
export var APRON = { x0: 12.2, x1: 17.6, z0: 9.6, z1: 11.4 };
export var DOCK = { x: 14.7, z0: 11.4, z1: 19.5, w: 1.4, shipX: 16.6, shipZ: 17.0 };
// Truk kontainer: setiap slot = satu truk yang berangkat dari node asal ke dermaga lalu kembali.
export var CT_SLOTS = [
    { id: 'assembly', origin: 'asm' },
    { id: 'hub', origin: 'hubS' },
    { id: 'battery', origin: 'bat' },
    { id: 'display', origin: 'dis' },
    { id: 'camera', origin: 'cam' },
    { id: 'soc', origin: 'socW' }
];

// Rute terpendek (Dijkstra sederhana, graf kecil) dari node 'from' ke 'to'. Mengembalikan daftar id node, atau null.
export function shortestRoute(from, to) {
    var dist = {}, prev = {}, todo = Object.keys(ROAD_NODES);
    todo.forEach(function (n) { dist[n] = Infinity; });
    if (!(from in dist) || !(to in dist)) return null;
    dist[from] = 0;
    while (todo.length) {
        todo.sort(function (p, q) { return dist[p] - dist[q]; });
        var u = todo.shift();
        if (dist[u] === Infinity || u === to) break;
        ROAD_EDGES.forEach(function (e) {
            var v = e.a === u ? e.b : (e.b === u ? e.a : null);
            if (!v) return;
            var A = ROAD_NODES[u], B = ROAD_NODES[v], nd = dist[u] + Math.hypot(B[0] - A[0], B[1] - A[1]);
            if (nd < dist[v]) { dist[v] = nd; prev[v] = u; }
        });
    }
    if (dist[to] === Infinity) return null;
    var path = [to];
    while (path[0] !== from) path.unshift(prev[path[0]]);
    return path;
}

// Pabrik komponen yang butuh Fab (dibaca dari data, bukan ditulis ulang).
export function plantNeedsFab(id) { var pt = getPlantTypeById(id); return !!(pt && pt.requiresFab); }

// ============================================================
// TEKS (ID / EN). Bahasa lain memakai Inggris.
// ============================================================
var TX = {
    id: {
        aria: 'Peta 3D manufaktur. Geser untuk menjelajah, cubit untuk zoom, ketuk pabrik untuk detail.',
        loading: 'Memuat peta manufaktur…',
        fbTitle: 'Peta manufaktur tidak bisa dimuat',
        fbBody: 'WebGL atau Three.js gagal dimuat. Periksa koneksi internet lalu buka ulang tab Manufaktur.',
        hint: 'Geser untuk menjelajah · cubit untuk zoom · ketuk pabrik',
        all: 'Semua', close: 'Tutup', expand: 'Buka kartu', collapse: 'Ciutkan kartu',
        'room.fab': 'Fab Chip', 'room.hub': 'Pusat Logistik', 'room.assembly': 'Assembly',
        locked: 'Terkunci', empty: 'Siap dibangun', lvl: 'Level {n}', building: 'Dibangun {n}%', upgrading: 'Upgrade {n}%',
        'lock.year': 'Tersedia mulai tahun {y}.',
        'lock.fab': 'Butuh Fab Chip yang sudah berdiri.',
        'lock.research': 'Butuh riset: Konstruksi Fab.',
        'lock.components': 'Selesaikan riset komponen dulu.',
        cost: 'Biaya bangun {v} · {n} hari',
        level: 'Level {n} · {name}',
        capacity: 'Kapasitas {n}/bulan', discount: 'Diskon harga internal {n}%', yield: 'Yield {n}%',
        upkeep: 'Perawatan {v}/bulan', tax: 'Pajak infrastruktur {v}/bulan', fx: 'Bonus: {t}',
        unpaid: 'Tunggakan perawatan {v}', stock: 'Stok {n} unit',
        producing: 'Produksi: {name} · {n} unit · {p}%', idle: 'Belum berproduksi. Kapasitas menganggur.',
        constructing: 'Sedang dibangun · {p}% · sisa {d} hari', upgrading2: 'Sedang di-upgrade · {p}% · sisa {d} hari',
        next: 'Berikutnya: {name} ({v}, {n} hari)', maxed: 'Level maksimum tercapai ✨',
        fabTotal: 'Chip dibuat total {n}', fabStock: 'Stok chip {n}',
        'act.build': 'Bangun {v}', 'act.upgrade': 'Upgrade ke {name} {v}', 'act.cancel': 'Batalkan',
        'act.produce': 'Produksi {n}', 'act.cancelProd': 'Batalkan produksi',
        'note.poor': 'Kurang {v}', 'note.days': 'Selesai dalam {n} hari', 'note.refund': 'Refund {v}',
        'note.comp': '{name} · {v}/unit', 'note.noresearch': 'Butuh riset: Konstruksi Fab.',
        'note.busy': 'Sedang ada pembangunan atau produksi.', 'note.nocomp': 'Selesaikan riset komponen dulu.',
        'go.manu': 'Buka Panel Manufaktur', 'go.chip': 'Chip & Fab', 'go.design': 'Desain Produk',
        hubDesc: 'Semua stok pabrik dikumpulkan di sini lalu dipakai saat rilis atau restok produk. Kekurangan dibeli dengan harga pasar.',
        hubBuilt: 'Pabrik berdiri {n}/{m}', hubStock: 'Total stok {n} unit', hubUpkeep: 'Perawatan {v}/bulan',
        hubTax: 'Pajak infrastruktur {v}/bulan', hubSave: 'Hemat vs pasar {v}', hubRev: 'Omzet jual grosir {v}',
        hubDebt: 'Tunggakan {v}',
        'alert.unpaid': 'Perawatan belum terbayar', 'alert.idle': 'Pabrik menganggur',
        'fx.built': 'Pabrik berdiri!', 'fx.upgraded': 'Upgrade selesai!', 'fx.produced': 'Produksi selesai!',
        'lg.title': 'Legenda',
        'lg.run': 'Menyala + asap = sedang produksi', 'lg.crane': 'Crane + perancah = sedang dibangun / upgrade',
        'lg.ghost': 'Bayangan berwarna = siap dibangun', 'lg.lock': 'Bayangan abu-abu + gembok = belum terbuka',
        'lg.pipe': 'Pipa = jalur wafer dari Fab', 'lg.crate': 'Tumpukan peti = stok', 'lg.alert': 'Tanda seru = perlu perhatian',
        'fxl.batteryLife': 'Daya tahan baterai', 'fxl.displayQuality': 'Kualitas layar', 'fxl.performance': 'Performa',
        'fxl.cameraQuality': 'Kualitas kamera', 'fxl.usability': 'Kelancaran',
        fabName: 'Fab Chip',
        fabDesc: 'Fondasi manufaktur: wafer chip sendiri. Pabrik SoC, RAM, dan Layar butuh Fab yang sudah berdiri.',
        asmDesc: 'Lini perakitan akhir ponsel. Pekerja dikelola per kelompok peran. Izin operasi mulai {y}.',
        'go.assembly': 'Buka Panel Assembly', 'alert.permit': 'Menunggu izin operasi', 'alert.staff': 'Kekurangan pekerja',
        asmCrew: 'Pekerja {n} · staf {p}%', asmRun: 'Kapasitas {c}/bulan · utilisasi {u}%', asmCost: 'Gaji + perawatan {v}/bulan',
        asmWait: 'Sudah berdiri. Izin operasi keluar tahun {y}.', 'lock.asm': 'Tersedia mulai tahun {y}.', 'fx.asm': 'Assembly siap!'
    },
    en: {
        aria: 'Manufacturing 3D map. Drag to explore, pinch to zoom, tap a factory for details.',
        loading: 'Loading manufacturing map…',
        fbTitle: 'The manufacturing map could not load',
        fbBody: 'WebGL or Three.js failed to load. Check your connection and reopen the Manufacture tab.',
        hint: 'Drag to explore · pinch to zoom · tap a factory',
        all: 'All', close: 'Close', expand: 'Expand card', collapse: 'Collapse card',
        'room.fab': 'Chip Fab', 'room.hub': 'Logistics Hub', 'room.assembly': 'Assembly',
        locked: 'Locked', empty: 'Ready to build', lvl: 'Level {n}', building: 'Building {n}%', upgrading: 'Upgrade {n}%',
        'lock.year': 'Available from {y}.',
        'lock.fab': 'Requires a built Chip Fab.',
        'lock.research': 'Requires research: Fab Construction.',
        'lock.components': 'Finish component research first.',
        cost: 'Build cost {v} · {n} days',
        level: 'Level {n} · {name}',
        capacity: 'Capacity {n}/month', discount: 'Internal price discount {n}%', yield: 'Yield {n}%',
        upkeep: 'Upkeep {v}/month', tax: 'Infrastructure tax {v}/month', fx: 'Bonus: {t}',
        unpaid: 'Unpaid upkeep {v}', stock: 'Stock {n} units',
        producing: 'Producing: {name} · {n} units · {p}%', idle: 'Not producing. Capacity is idle.',
        constructing: 'Under construction · {p}% · {d} days left', upgrading2: 'Upgrading · {p}% · {d} days left',
        next: 'Next: {name} ({v}, {n} days)', maxed: 'Max level reached ✨',
        fabTotal: 'Chips made in total {n}', fabStock: 'Chip stock {n}',
        'act.build': 'Build {v}', 'act.upgrade': 'Upgrade to {name} {v}', 'act.cancel': 'Cancel',
        'act.produce': 'Produce {n}', 'act.cancelProd': 'Cancel production',
        'note.poor': 'Short by {v}', 'note.days': 'Ready in {n} days', 'note.refund': 'Refund {v}',
        'note.comp': '{name} · {v}/unit', 'note.noresearch': 'Requires research: Fab Construction.',
        'note.busy': 'A build or production run is in progress.', 'note.nocomp': 'Finish component research first.',
        'go.manu': 'Open Manufacturing panel', 'go.chip': 'Chip & Fab', 'go.design': 'Product Design',
        hubDesc: 'All factory stock is collected here and used when you launch or restock products. Any shortfall is bought at market price.',
        hubBuilt: 'Factories built {n}/{m}', hubStock: 'Total stock {n} units', hubUpkeep: 'Upkeep {v}/month',
        hubTax: 'Infrastructure tax {v}/month', hubSave: 'Saved vs market {v}', hubRev: 'Wholesale revenue {v}',
        hubDebt: 'Unpaid {v}',
        'alert.unpaid': 'Upkeep unpaid', 'alert.idle': 'Factory is idle',
        'fx.built': 'Factory built!', 'fx.upgraded': 'Upgrade done!', 'fx.produced': 'Production done!',
        'lg.title': 'Legend',
        'lg.run': 'Glowing + smoke = producing', 'lg.crane': 'Crane + scaffold = under construction / upgrade',
        'lg.ghost': 'Colored ghost = ready to build', 'lg.lock': 'Grey ghost + padlock = not unlocked yet',
        'lg.pipe': 'Pipe = wafer line from the Fab', 'lg.crate': 'Crate stacks = stock', 'lg.alert': 'Exclamation = needs attention',
        'fxl.batteryLife': 'Battery life', 'fxl.displayQuality': 'Display quality', 'fxl.performance': 'Performance',
        'fxl.cameraQuality': 'Camera quality', 'fxl.usability': 'Smoothness',
        fabName: 'Chip Fab',
        fabDesc: 'The manufacturing foundation: your own chip wafers. SoC, RAM, and Display plants need a built Fab.',
        asmDesc: 'Final phone assembly line. Workers are managed as role groups. Operating permit from {y}.',
        'go.assembly': 'Open Assembly panel', 'alert.permit': 'Awaiting operating permit', 'alert.staff': 'Understaffed',
        asmCrew: 'Workers {n} · staffing {p}%', asmRun: 'Capacity {c}/month · utilization {u}%', asmCost: 'Wages + upkeep {v}/month',
        asmWait: 'Built. Operating permit arrives in {y}.', 'lock.asm': 'Available from {y}.', 'fx.asm': 'Assembly ready!'
    }
};
function dict() {
    var l = 'id';
    try { l = LanguageService.getLang(); } catch (e) {}
    return l === 'id' ? TX.id : TX.en;
}
export function ms(key, vars) {
    var s = dict()[key];
    if (s === undefined) s = TX.en[key];
    if (s === undefined) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    return s;
}
function num(n) { return Math.round(n || 0).toLocaleString('en-US'); }

export function plotTitle(id) {
    if (id === 'fab') return ms('room.fab');
    if (id === 'hub') return ms('room.hub');
    if (id === 'assembly') return ms('room.assembly');
    var pt = getPlantTypeById(id);
    return pt ? plantName(pt) : String(id);
}

// ============================================================
// DATA
// ============================================================
function sysPlants() { var g = window.__game; return (g && g.plants) || null; }
function sysFab() { var g = window.__game; return (g && g.fab) || null; }
function canPay(cost) { try { return !!WalletService.canAfford(cost); } catch (e) { return false; } }
function fabTier(level) {
    for (var i = 0; i < FAB_LEVELS.length; i++) if (FAB_LEVELS[i].level === level) return FAB_LEVELS[i];
    return null;
}
function fabRaw(d) { return (d && d.fab) || {}; }
function plantRaw(d, id) {
    var cp = d && d.componentPlants;
    return (cp && cp.plants && cp.plants[id]) || {};
}
function fabResearched(d) {
    var c = d && d.research && d.research.completed;
    return Array.isArray(c) && c.indexOf('fab_construction') >= 0;
}
// Salinan logika ComponentPlantSystem.getEligibleComponents (UI tidak punya akses ke instance sistem).
function hasProducibleComponents(typeId, d) {
    var pt = getPlantTypeById(typeId);
    if (!pt) return false;
    var year = (d && d.time && d.time.currentYear) || 0;
    var completed = (d && d.research && d.research.completed) || [];
    return COMPONENTS.some(function (c) {
        return c.category === pt.category
            && (c.minYear || 0) <= year
            && (!c.requiresResearch || completed.indexOf(c.requiresResearch) !== -1);
    });
}
function progressOf(u) {
    if (!u) return null;
    var dur = Math.max(1, u.durationDays || 1);
    var pct = clamp((u.progressDays || 0) / dur, 0, 1);
    return { pct: pct, daysLeft: Math.max(0, Math.ceil(dur - (u.progressDays || 0))), isBuild: !!u.isBuild, target: u.targetLevel || 1 };
}
function prodOf(p, nameKey) {
    if (!p) return null;
    var total = p.totalUnits || 0;
    return { pct: total ? clamp((p.progressUnits || 0) / total, 0, 1) : 1, units: total, name: p[nameKey] || '' };
}

// Syarat membuka pabrik. -> { ok } atau { ok:false, key, vars }
export function unlockOf(id, d) {
    if (id === 'fab') return fabResearched(d) ? { ok: true } : { ok: false, key: 'lock.research' };
    if (id === 'assembly') return ((d && d.time && d.time.currentYear) || 0) >= ASSEMBLY_UNLOCK_YEAR ? { ok: true } : { ok: false, key: 'lock.asm', vars: { y: ASSEMBLY_UNLOCK_YEAR } };
    var pt = getPlantTypeById(id);
    if (!pt) return { ok: false, key: 'lock.year', vars: { y: '?' } };
    var year = (d && d.time && d.time.currentYear) || 0;
    if (year < pt.unlockYear) return { ok: false, key: 'lock.year', vars: { y: pt.unlockYear } };
    if (pt.requiresFab && !fabRaw(d).built) return { ok: false, key: 'lock.fab' };
    if (!hasProducibleComponents(id, d)) return { ok: false, key: 'lock.components' };
    return { ok: true };
}

// Status satu petak untuk adegan 3D.
// -> { id, kind, status:'locked'|'empty'|'built', level, building, producing, stock, unpaid, idleDays, alert, unlock }
export function plotState(id, d) {
    var def = PLOT_BY_ID[id];
    var st = { id: id, kind: def.kind, status: 'locked', level: 0, building: null, producing: null, stock: 0, unpaid: 0, idleDays: 0, alert: null, unlock: { ok: true } };
    if (def.kind === 'hub') {
        var built = 0, stock = fabRaw(d).inventory || 0, unpaid = 0, inv = (d.componentPlants && d.componentPlants.inventory) || {};
        if (fabRaw(d).built) built++;
        PLANT_TYPES.forEach(function (pt) { var ps = plantRaw(d, pt.id); if (ps.built) built++; unpaid += ps.unpaid || 0; });
        Object.keys(inv).forEach(function (k) { stock += inv[k] || 0; });
        st.status = built > 0 ? 'built' : 'empty';
        st.level = built;                      // jumlah pabrik berdiri (dipakai adegan untuk ukuran gudang)
        st.stock = stock; st.unpaid = unpaid;
        st.alert = unpaid > 0 ? { lvl: 'bad', key: 'alert.unpaid', vars: { v: fmtMoney(unpaid) } } : null;
        return st;
    }
    if (def.kind === 'assembly') return assemblyState(st, d);
    var raw = id === 'fab' ? fabRaw(d) : plantRaw(d, id);
    st.unlock = unlockOf(id, d);
    st.building = progressOf(raw.upgrade);
    if (raw.built && raw.level) {
        st.status = 'built'; st.level = raw.level;
    } else if (st.building) {
        st.status = 'empty';                   // sedang dibangun pertama kali: adegan menampilkan lokasi konstruksi
    } else {
        st.status = st.unlock.ok ? 'empty' : 'locked';
    }
    if (id === 'fab') { st.stock = raw.inventory || 0; st.producing = prodOf(raw.producing, 'chipName'); }
    else {
        st.unpaid = raw.unpaid || 0; st.idleDays = raw.idleDays || 0;
        st.producing = prodOf(raw.producing, 'componentName');
        var inv2 = (d.componentPlants && d.componentPlants.inventory) || {}, sys = sysPlants(), s2 = 0;
        if (sys) {
            try { sys.getEligibleComponents(id).forEach(function (c) { s2 += inv2[c.id] || 0; }); } catch (e) {}
        }
        st.stock = s2;
    }
    if (st.status === 'built' && st.unpaid > 0) st.alert = { lvl: 'bad', key: 'alert.unpaid', vars: { v: fmtMoney(st.unpaid) } };
    else if (st.status === 'built' && st.idleDays >= 60 && !st.producing && !st.building) st.alert = { lvl: 'warn', key: 'alert.idle', vars: {} };
    return st;
}

function sysAsm() { var g = window.__game; return (g && g.assembly) || null; }
function assemblyState(st, d) {
    var raw = d.assembly || {}, sys = sysAsm();
    st.unlock = unlockOf('assembly', d);
    st.building = progressOf(raw.upgrade);
    var snap = null;
    if (sys) { try { snap = sys.getSnapshot(); } catch (e) {} }
    st.asm = snap;
    if (raw.built && raw.level) { st.status = 'built'; st.level = raw.level; }
    else if (st.building) st.status = 'empty';
    else st.status = st.unlock.ok ? 'empty' : 'locked';
    st.stock = snap ? snap.pending : 0;
    var total = snap ? snap.total : 0, operating = !!(snap && snap.operating);
    st.producing = (operating && snap.pending > 0) ? { pct: clamp(snap.utilization, 0, 1), units: snap.pending, name: '' } : null;
    st.sigExtra = (operating ? 'o' : 'w') + Math.floor(Math.log10(Math.max(1, total)) * 3) + (snap && snap.overtime ? 'x' : '');
    if (st.status === 'built' && snap) {
        if (snap.unpaid > 0) st.alert = { lvl: 'bad', key: 'alert.unpaid', vars: { v: fmtMoney(snap.unpaid) } };
        else if (!operating) st.alert = { lvl: 'warn', key: 'alert.permit', vars: {} };
        else if (snap.staffing.operator < 0.5) st.alert = { lvl: 'warn', key: 'alert.staff', vars: {} };
    }
    return st;
}

export function allStates(d) {
    var out = {};
    PLOTS.forEach(function (p) { out[p.id] = plotState(p.id, d); });
    return out;
}

// Tanda tangan struktur: adegan hanya membangun ulang petak bila nilai ini berubah.
export function plotSig(st, d) {
    var b = st.building ? (st.building.isBuild ? 'B' : 'U') + st.building.target + ':' + Math.floor(st.building.pct * 25) : '';
    var pr = st.producing ? 'P' + Math.floor(st.producing.pct * 10) : '';
    var stockBucket = Math.floor(Math.log10(Math.max(1, st.stock)) * 2);
    return [st.status, st.level, b, pr, stockBucket, st.alert ? st.alert.lvl : '', st.unlock && st.unlock.ok ? 1 : 0, st.sigExtra || ''].join('|');
}

// ============================================================
// KARTU INFO
// ============================================================
function effectText(effects) {
    if (!effects) return '';
    return Object.keys(effects).map(function (k) { return ms('fxl.' + k) + ' +' + Math.round(effects[k] * 100) + '%'; }).join(', ');
}
function cashOf(d) { return (d && d.cash) || 0; }

// -> { title, badge, lines[], actions[], go, go2 }
export function describePlot(id, d) {
    var def = PLOT_BY_ID[id];
    if (!def) return null;
    var st = plotState(id, d);
    var info = { title: plotTitle(id), badge: '', lines: [], actions: [], go: null, go2: null, alert: st.alert };
    if (def.kind === 'hub') return describeHub(info, st, d);
    if (def.kind === 'fab') return describeFab(info, st, d);
    if (def.kind === 'assembly') return describeAssembly(info, st, d);
    return describePlant(info, st, d, id);
}

function statusBadge(st) {
    if (st.building) return ms(st.building.isBuild ? 'building' : 'upgrading', { n: Math.round(st.building.pct * 100) });
    if (st.status === 'built') return ms('lvl', { n: st.level });
    if (st.status === 'empty') return ms('empty');
    return ms('locked');
}

function describeFab(info, st, d) {
    var raw = fabRaw(d), sys = sysFab();
    info.badge = statusBadge(st);
    info.lines.push(ms('fabDesc'));
    if (st.status === 'built') {
        var tier = fabTier(raw.level);
        if (tier) {
            info.lines.push(ms('level', { n: raw.level, name: tier.name }));
            info.lines.push(ms('capacity', { n: num(tier.capacityMonthly) }));
        }
        info.lines.push(ms('fabStock', { n: num(raw.inventory) }) + ' · ' + ms('fabTotal', { n: num(raw.totalProduced) }));
        var cap = FAB_LEVELS.reduce(function (a, l) { return l.level <= raw.level ? a + l.cost : a; }, 0);
        info.lines.push(ms('tax', { v: fmtMoney(Math.round(cap * INFRA_TAX_RATE_MONTHLY)) }));
        if (st.producing) info.lines.push(ms('producing', { name: st.producing.name, n: num(st.producing.units), p: Math.round(st.producing.pct * 100) }));
        else if (!st.building) info.lines.push(ms('idle'));
    } else if (st.status === 'locked') {
        info.lines.push(ms(st.unlock.key, st.unlock.vars));
    } else if (!st.building) {
        var t1 = fabTier(1);
        if (t1) info.lines.push(ms('cost', { v: fmtMoney(t1.cost), n: t1.durationDays }));
    }
    if (st.building) {
        info.lines.push(ms(st.building.isBuild ? 'constructing' : 'upgrading2', { p: Math.round(st.building.pct * 100), d: st.building.daysLeft }));
        if (sys) info.actions.push({ id: 'fab-cancel-up', label: ms('act.cancel'), note: ms('note.refund', { v: fmtMoney(Math.floor((raw.upgrade.cost || 0) * 0.4)) }) });
    } else if (sys) {
        if (!raw.built && st.unlock.ok) {
            var tb = fabTier(1);
            if (tb) {
                var poor = !canPay(tb.cost);
                info.actions.push({ id: 'fab-build', label: ms('act.build', { v: fmtMoney(tb.cost) }), disabled: poor,
                    note: poor ? ms('note.poor', { v: fmtMoney(tb.cost - cashOf(d)) }) : ms('note.days', { n: tb.durationDays }) });
            }
        } else if (raw.built) {
            var nx = fabTier((raw.level || 1) + 1);
            if (nx) {
                var poorU = !canPay(nx.cost);
                info.lines.push(ms('next', { name: nx.name, v: fmtMoney(nx.cost), n: nx.durationDays }));
                info.actions.push({ id: 'fab-upgrade', label: ms('act.upgrade', { name: nx.name, v: fmtMoney(nx.cost) }), disabled: poorU,
                    note: poorU ? ms('note.poor', { v: fmtMoney(nx.cost - cashOf(d)) }) : ms('note.days', { n: nx.durationDays }) });
            } else info.lines.push(ms('maxed'));
        }
    }
    info.go = { nav: 'products', subtab: 'chip', label: ms('go.chip') };
    info.go2 = { nav: 'research', subtab: 'manufaktur', label: ms('go.manu') };
    return info;
}

function describePlant(info, st, d, id) {
    var pt = getPlantTypeById(id), raw = plantRaw(d, id), sys = sysPlants();
    info.badge = statusBadge(st);
    info.lines.push(plantDesc(pt));
    if (st.status === 'built') {
        var li = getPlantLevelInfo(id, raw.level);
        if (li) {
            info.lines.push(ms('level', { n: raw.level, name: plantLevelName(pt, raw.level, li.name) }));
            info.lines.push(ms('capacity', { n: num(li.capacityMonthly) }) + ' · ' + ms('discount', { n: Math.round(li.discount * 100) }) + ' · ' + ms('yield', { n: Math.round(getPlantYield(raw.level) * 100) }));
            var fx = effectText(li.effects);
            if (fx) info.lines.push(ms('fx', { t: fx }));
        }
        info.lines.push(ms('upkeep', { v: fmtMoney(getPlantMaintenance(id, raw.level)) }) + ' · ' +
            ms('tax', { v: fmtMoney(Math.round(getPlantCapital(id, raw.level) * INFRA_TAX_RATE_MONTHLY)) }));
        if (st.unpaid > 0) info.lines.push(ms('unpaid', { v: fmtMoney(st.unpaid) }));
        info.lines.push(ms('stock', { n: num(st.stock) }));
        if (st.producing) info.lines.push(ms('producing', { name: st.producing.name, n: num(st.producing.units), p: Math.round(st.producing.pct * 100) }));
        else if (!st.building) info.lines.push(ms('idle'));
    } else if (st.status === 'locked') {
        info.lines.push(ms(st.unlock.key, st.unlock.vars));
    } else if (!st.building) {
        var l1 = getPlantLevelInfo(id, 1);
        if (l1) info.lines.push(ms('cost', { v: fmtMoney(l1.cost), n: l1.durationDays }));
    }
    if (st.building) {
        info.lines.push(ms(st.building.isBuild ? 'constructing' : 'upgrading2', { p: Math.round(st.building.pct * 100), d: st.building.daysLeft }));
        if (sys) info.actions.push({ id: 'plant-cancel-up', typeId: id, label: ms('act.cancel'), note: ms('note.refund', { v: fmtMoney(Math.floor((raw.upgrade.cost || 0) * 0.4)) }) });
    } else if (sys) {
        if (!raw.built && st.unlock.ok) {
            var lb = getPlantLevelInfo(id, 1);
            if (lb) {
                var poorB = !canPay(lb.cost);
                info.actions.push({ id: 'plant-build', typeId: id, label: ms('act.build', { v: fmtMoney(lb.cost) }), disabled: poorB,
                    note: poorB ? ms('note.poor', { v: fmtMoney(lb.cost - cashOf(d)) }) : ms('note.days', { n: lb.durationDays }) });
            }
        } else if (raw.built) {
            var nl = getPlantLevelInfo(id, (raw.level || 1) + 1);
            if (nl) {
                var poorU = !canPay(nl.cost);
                info.lines.push(ms('next', { name: plantLevelName(pt, nl.level, nl.name), v: fmtMoney(nl.cost), n: nl.durationDays }));
                info.actions.push({ id: 'plant-upgrade', typeId: id, label: ms('act.upgrade', { name: plantLevelName(pt, nl.level, nl.name), v: fmtMoney(nl.cost) }), disabled: poorU,
                    note: poorU ? ms('note.poor', { v: fmtMoney(nl.cost - cashOf(d)) }) : ms('note.days', { n: nl.durationDays }) });
            } else info.lines.push(ms('maxed'));
            if (st.producing) {
                info.actions.push({ id: 'plant-cancel-prod', typeId: id, label: ms('act.cancelProd'),
                    note: ms('note.refund', { v: fmtMoney(Math.floor((raw.producing.costPaid || 0) * 0.5)) }) });
            } else {
                var comps = [];
                try { comps = sys.getEligibleComponents(id); } catch (e) {}
                var li2 = getPlantLevelInfo(id, raw.level);
                if (!comps.length || !li2) {
                    info.actions.push({ id: 'plant-order', typeId: id, label: ms('act.produce', { n: num(PLANT_MIN_ORDER) }), disabled: true, note: ms('note.nocomp') });
                } else {
                    var comp = comps[comps.length - 1];                      // komponen terbaik yang sudah boleh diproduksi
                    var qty = Math.max(PLANT_MIN_ORDER, Math.min(li2.capacityMonthly, 50000));
                    var unit = 0;
                    try { unit = sys.getUnitCost(comp.id); } catch (e2) {}
                    var total = Math.round(unit * qty);
                    var poorP = !canPay(total) || !!raw.upgrade;
                    info.actions.push({ id: 'plant-order', typeId: id, compId: comp.id, qty: qty, label: ms('act.produce', { n: num(qty) }), disabled: poorP,
                        note: !canPay(total) ? ms('note.poor', { v: fmtMoney(total - cashOf(d)) }) : ms('note.comp', { name: comp.name, v: fmtMoney(unit) }) });
                }
            }
        }
    }
    info.go = { nav: 'research', subtab: 'manufaktur', label: ms('go.manu') };
    return info;
}

function describeAssembly(info, st, d) {
    var raw = d.assembly || {}, sys = sysAsm(), s = st.asm;
    info.badge = statusBadge(st);
    info.lines.push(ms('asmDesc', { y: ASSEMBLY_OPERATE_YEAR }));
    if (st.status === 'built' && s) {
        info.lines.push(ms('level', { n: s.level, name: assemblyLevelName(s.level) }));
        if (s.operating) {
            info.lines.push(ms('asmRun', { c: num(s.capacity), u: Math.round(s.utilization * 100) }));
            info.lines.push(ms('asmCrew', { n: num(s.total), p: Math.round(s.staffing.operator * 100) }));
        } else {
            info.lines.push(ms('asmWait', { y: ASSEMBLY_OPERATE_YEAR }));
        }
        info.lines.push(ms('asmCost', { v: fmtMoney(s.wages + s.upkeep) }));
        if (s.unpaid > 0) info.lines.push(ms('unpaid', { v: fmtMoney(s.unpaid) }));
    } else if (st.status === 'locked') {
        info.lines.push(ms(st.unlock.key, st.unlock.vars));
    } else if (!st.building) {
        var l1 = getAssemblyLevel(1);
        if (l1) info.lines.push(ms('cost', { v: fmtMoney(l1.cost), n: l1.durationDays }));
    }
    if (st.building) {
        info.lines.push(ms(st.building.isBuild ? 'constructing' : 'upgrading2', { p: Math.round(st.building.pct * 100), d: st.building.daysLeft }));
        if (sys) info.actions.push({ id: 'asm-cancel', label: ms('act.cancel'), note: ms('note.refund', { v: fmtMoney(Math.floor((raw.upgrade.cost || 0) * 0.4)) }) });
    } else if (sys) {
        if (!raw.built && st.unlock.ok) {
            var tb = getAssemblyLevel(1), poor = !canPay(tb.cost);
            info.actions.push({ id: 'asm-build', label: ms('act.build', { v: fmtMoney(tb.cost) }), disabled: poor,
                note: poor ? ms('note.poor', { v: fmtMoney(tb.cost - cashOf(d)) }) : ms('note.days', { n: tb.durationDays }) });
        } else if (raw.built) {
            var nx = getAssemblyLevel((raw.level || 1) + 1);
            if (nx) {
                var poorU = !canPay(nx.cost);
                info.lines.push(ms('next', { name: assemblyLevelName(nx.level), v: fmtMoney(nx.cost), n: nx.durationDays }));
                info.actions.push({ id: 'asm-upgrade', label: ms('act.upgrade', { name: assemblyLevelName(nx.level), v: fmtMoney(nx.cost) }), disabled: poorU,
                    note: poorU ? ms('note.poor', { v: fmtMoney(nx.cost - cashOf(d)) }) : ms('note.days', { n: nx.durationDays }) });
            } else info.lines.push(ms('maxed'));
        }
    }
    info.go = { nav: 'research', subtab: 'manufaktur', label: ms('go.assembly') };
    return info;
}

function describeHub(info, st, d) {
    var cp = d.componentPlants || {}, sys = sysPlants();
    var upkeep = 0, unpaid = 0, built = 0;
    PLANT_TYPES.forEach(function (pt) {
        var ps = plantRaw(d, pt.id);
        if (ps.built && ps.level) { built++; upkeep += getPlantMaintenance(pt.id, ps.level); }
        unpaid += ps.unpaid || 0;
    });
    if (fabRaw(d).built) built++;
    var tax = 0;
    if (sys) { try { tax = sys.getMonthlyInfraTax(); } catch (e) {} }
    info.badge = ms('hubBuilt', { n: built, m: PLANT_TYPES.length + 1 });
    info.lines.push(ms('hubDesc'));
    info.lines.push(ms('hubStock', { n: num(st.stock) }));
    info.lines.push(ms('hubUpkeep', { v: fmtMoney(upkeep) }) + ' · ' + ms('hubTax', { v: fmtMoney(tax) }));
    info.lines.push(ms('hubSave', { v: fmtMoney(cp.savings || 0) }) + ' · ' + ms('hubRev', { v: fmtMoney(cp.externalRevenue || 0) }));
    if (unpaid > 0) info.lines.push(ms('hubDebt', { v: fmtMoney(unpaid) }));
    info.go = { nav: 'research', subtab: 'manufaktur', label: ms('go.manu') };
    info.go2 = { nav: 'products', subtab: 'design', label: ms('go.design') };
    return info;
}

// ============================================================
// AKSI LANGSUNG (sistem game yang sama dengan panel)
// -> { ok, reason? }
// ============================================================
export function runAction(a) {
    var g = window.__game;
    if (!g || !a) return { ok: false, reason: '' };
    var fab = g.fab, pl = g.plants;
    switch (a.id) {
        case 'fab-build': return fab ? fab.buildFab(1) : { ok: false };
        case 'fab-upgrade': return fab ? fab.upgradeFab() : { ok: false };
        case 'fab-cancel-up': return fab ? fab.cancelUpgrade() : { ok: false };
        case 'plant-build': return pl ? pl.buildPlant(a.typeId) : { ok: false };
        case 'plant-upgrade': return pl ? pl.upgradePlant(a.typeId) : { ok: false };
        case 'plant-cancel-up': return pl ? pl.cancelUpgrade(a.typeId) : { ok: false };
        case 'plant-order': return pl ? pl.orderProduction(a.typeId, a.compId, a.qty) : { ok: false };
        case 'plant-cancel-prod': return pl ? pl.cancelProduction(a.typeId) : { ok: false };
        case 'asm-build': return g.assembly ? g.assembly.build() : { ok: false };
        case 'asm-upgrade': return g.assembly ? g.assembly.upgrade() : { ok: false };
        case 'asm-cancel': return g.assembly ? g.assembly.cancelUpgrade() : { ok: false };
    }
    return { ok: false, reason: '' };
}

// Efek kejadian game -> petak. Dipakai ManufactureMap.
export var FX_EVENTS = {
    'fab:built':                 function () { return { plot: 'fab', kind: 'gold', key: 'fx.built' }; },
    'fab:upgraded':              function () { return { plot: 'fab', kind: 'gold', key: 'fx.upgraded' }; },
    'fab:production-completed':  function () { return { plot: 'fab', kind: 'green', key: 'fx.produced' }; },
    'assembly:built':            function () { return { plot: 'assembly', kind: 'gold', key: 'fx.built' }; },
    'assembly:upgraded':         function () { return { plot: 'assembly', kind: 'gold', key: 'fx.upgraded' }; },
    'plant:built':               function (p) { return p && p.typeId ? { plot: p.typeId, kind: 'gold', key: 'fx.built' } : null; },
    'plant:upgraded':            function (p) { return p && p.typeId ? { plot: p.typeId, kind: 'gold', key: 'fx.upgraded' } : null; },
    'plant:production-completed': function (p) { return p && p.typeId ? { plot: p.typeId, kind: 'green', key: 'fx.produced' } : null; }
};
