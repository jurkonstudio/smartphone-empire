// FILE: src/data/campus-buildings.data.js
// v2027.62 — REGISTRI TUNGGAL gedung kampus (satu sumber kebenaran untuk peta 3D & UI).
// Sebelumnya definisi gedung tersebar: aturan level (CampusBuildings.js), nama/ikon/tujuan
// (CampusInfo.js), daftar panel (data ini, tidak pernah dipakai), dan slot. Sekarang semua di sini.
//
// Setiap entri = satu gedung:
//   kind      'hq' | 'slot' (punya posisi di peta & level) | 'decor' (dekorasi era, tanpa level)
//   slot      [x, z] posisi di peta 3D (hanya kind 'slot')
//   rule      { base, steps, max, metric(data) } — level = base + jumlah ambang yang terlampaui
//   name/desc/unit  [Indonesia, English]
//   nav       tab tujuan tombol "Buka ..." { view, sub?, label? }
//
// CARA MENAMBAH GEDUNG BARU (3 langkah):
//   1. Tambah entri di CAMPUS_REGISTRY (kind 'slot' + slot yang tidak bertabrakan + rule).
//   2. Tulis builder 3D di CampusBuildings.js dan daftarkan di SLOT_BUILDERS.
//   3. (Opsional) tambah alert di CampusAlerts.js.
//   Lalu validateCampusRegistry(BUILDER_IDS) harus mengembalikan [] (kosong = aman).
//
// Metrik membaca state game (lihat GameState.js). Semua metrik defensif: state kosong -> 0.
import { BALANCE } from './balance.data.js';

export const CAMPUS_CATEGORIES = ['core', 'innovation', 'marketing', 'industry', 'support'];

// Salinan NAV_SUBTABS (main.js). Dipakai validasi tujuan tombol "Buka ...".
export const CAMPUS_NAV_SUBTABS = {
    research: ['tech', 'os', 'manufaktur', 'chip'],
    products: ['design', 'catalog', 'sales', 'chip'],
    market: ['share', 'competitors', 'trends', 'promo', 'public'],
    team: ['office', 'overview', 'team', 'exchange', 'bank']
};

// ============================================================
// METRIK (murni, tanpa THREE/DOM)
// ============================================================
function _len(a) { return Array.isArray(a) ? a.length : 0; }

function _staff(d) { return _len(d && d.staff); }

// Riset di luar riset awal + riset chip (perilaku lama dipertahankan).
function _researchDone(d) {
    var starters = _len(BALANCE && BALANCE.starterResearch);
    var done = _len(d && d.research && d.research.completed);
    var chip = _len(d && d.chipResearch && d.chipResearch.completed);
    return Math.max(0, done - starters) + chip;
}

function _products(d) { return _len(d && d.products && d.products.catalog); }

function _stock(d) {
    var cat = d && d.products && d.products.catalog;
    if (!Array.isArray(cat)) return 0;
    var n = 0;
    for (var i = 0; i < cat.length; i++) n += (cat[i] && cat[i].stock) || 0;
    return n;
}

// market.share bisa 0..1 atau 0..100 (dua-duanya didukung).
function _share(d) {
    var s = (d && d.market && typeof d.market.share === 'number') ? d.market.share : 0;
    return s <= 1 ? s * 100 : s;
}

function _fabLevel(d) { return (d && d.fab && d.fab.built) ? Math.max(1, d.fab.level || 1) : 0; }

function _osVersions(d) { return _len(d && d.os && d.os.versions); }

function _campaigns(d) { return _len(d && d.marketing && d.marketing.activeCampaigns); }

// Jumlah total level pabrik komponen yang sudah berdiri (baterai, layar, ...).
function _plantLevels(d) {
    var p = d && d.componentPlants && d.componentPlants.plants;
    if (!p || typeof p !== 'object') return 0;
    var s = 0;
    Object.keys(p).forEach(function (k) {
        var ps = p[k];
        if (ps && ps.built) s += ps.level || 0;
    });
    return s;
}

// Riset chip yang sudah selesai (node desain chip).
function _chipDone(d) { return _len(d && d.chipResearch && d.chipResearch.completed); }

// ============================================================
// REGISTRI
// ============================================================
export const CAMPUS_REGISTRY = [
    // ---------- KANTOR PUSAT (posisi tetap di tengah) ----------
    {
        id: 'hq', kind: 'hq', fp: [-3.4, 4.5, -3.4, 3.4], category: 'core', icon: 'layers', emoji: '🏢', prio: 0, variant: 0,
        name: ['Kantor Pusat', 'Headquarters'],
        desc: ['Tumbuh seiring jumlah staf Anda.', 'Grows with your headcount.'],
        unit: ['staf', 'staff'],
        nav: { view: 'team' },
        levelLabels: ['Kantor Kecil', 'Kantor Kecil', 'Kantor Sedang', 'Kantor Besar', 'Markas Utama'],
        rule: { base: 1, steps: [5, 15, 30], max: 4, metric: _staff }
    },

    // ---------- GEDUNG SLOT (punya posisi & level) ----------
    {
        id: 'lab', kind: 'slot', slot: [-6.0, -3.6], fp: [-1.6, 1.6, -1.3, 2.05], category: 'innovation', icon: 'brain', emoji: '🔬', variant: 1,
        name: ['Lab R&D', 'R&D Lab'],
        desc: ['Tumbuh seiring riset yang selesai.', 'Grows with completed research.'],
        unit: ['riset selesai', 'research done'],
        nav: { view: 'research' },
        levelLabels: ['Belum Ada', 'Lab Kecil', 'Lab Riset', 'Pusat Inovasi'],
        rule: { base: 0, steps: [2, 8, 20], max: 3, metric: _researchDone }
    },
    {
        id: 'factory', kind: 'slot', slot: [7.4, 0.6], fp: [-2.75, 3.2, -3.5, 1.85], category: 'industry', icon: 'factory', emoji: '🏭', variant: 2,
        name: ['Pabrik Chip', 'Chip Factory'],
        desc: ['Mencerminkan level Fab chip Anda.', 'Reflects your chip Fab level.'],
        unit: ['level Fab', 'Fab level'],
        nav: { view: 'research' },
        roofAlt: true,
        levelLabels: ['Belum Ada', 'Fab Kecil', 'Fab Menengah', 'Mega Fab'],
        rule: { base: 0, steps: [1, 2, 3], max: 3, metric: _fabLevel }
    },
    {
        id: 'store', kind: 'slot', slot: [-5.9, 4.4], fp: [-1.6, 2.25, -1.2, 1.86], category: 'marketing', icon: 'store', emoji: '🏬', variant: 3,
        name: ['Toko Flagship', 'Flagship Store'],
        desc: ['Makin megah seiring produk yang dirilis.', 'Grows grander with each product released.'],
        unit: ['produk rilis', 'products released'],
        nav: { view: 'products' },
        levelLabels: ['Belum Ada', 'Etalase Kecil', 'Toko Flagship', 'Flagship Megah'],
        rule: { base: 0, steps: [1, 3, 6], max: 3, metric: _products }
    },
    {
        id: 'os', kind: 'slot', slot: [4.6, 5.0], fp: [-2.6, 2.6, -1.0, 1.32], category: 'innovation', icon: 'database', emoji: '🖥️', variant: 4,
        name: ['Pusat OS & Server', 'OS & Server Hub'],
        desc: ['Server bertambah seiring versi OS.', 'More servers as you ship OS versions.'],
        unit: ['versi OS', 'OS versions'],
        nav: { view: 'research' },
        levelLabels: ['Belum Ada', 'Server Kecil', 'Pusat Server', 'Cloud Hub'],
        rule: { base: 0, steps: [1, 3, 6], max: 3, metric: _osVersions }
    },
    {
        id: 'billboard', kind: 'slot', slot: [2.6, 8.6], fp: [-1.2, 1.2, -1.2, 1.2], category: 'marketing', icon: 'signal', emoji: '📣', prio: 3, variant: 0,
        name: ['Billboard Kampanye', 'Campaign Billboard'],
        desc: ['Menyala saat ada kampanye aktif.', 'Lights up while a campaign is active.'],
        unit: ['kampanye aktif', 'active campaigns'],
        nav: { view: 'products' },
        levelLabels: ['Belum Ada', 'Billboard Kampanye'],
        rule: { base: 0, steps: [1], max: 1, live: true, metric: _campaigns }
    },
    {
        id: 'monument', kind: 'slot', slot: [-2.6, 3.6], fp: [-0.98, 0.98, -0.98, 0.98], category: 'marketing', icon: 'sparkles', emoji: '🏆', prio: 3, variant: 0,
        name: ['Monumen Prestasi', 'Achievement Monument'],
        desc: ['Penanda pangsa pasar Anda.', 'A marker of your market share.'],
        unit: ['% pangsa pasar', '% market share'],
        nav: { view: 'market' },
        levelLabels: ['Belum Ada', 'Monumen Kecil', 'Monumen Prestasi'],
        rule: { base: 0, steps: [2, 8], max: 2, metric: _share }
    },
    {
        id: 'academy', kind: 'slot', slot: [-11.2, -6.8], fp: [-3.4, 3.4, -1.9, 2.64], category: 'innovation', icon: 'library', emoji: '🎓', variant: 5,
        name: ['Akademi Inovasi', 'Innovation Academy'],
        desc: ['Rumah bagi tim yang besar.', 'Home to a large team.'],
        unit: ['staf', 'staff'],
        nav: { view: 'team' },
        levelLabels: ['Belum Ada', 'Akademi Kecil', 'Akademi Inovasi', 'Kampus Inovasi'],
        rule: { base: 0, steps: [8, 20, 40], max: 3, metric: _staff }
    },
    {
        id: 'arena', kind: 'slot', slot: [10.8, -6.2], fp: [-3.4, 3.4, -3.4, 3.4], category: 'marketing', icon: 'zap', emoji: '🏟️', variant: 6,
        name: ['Arena Peluncuran', 'Launch Arena'],
        desc: ['Panggung peluncuran produk.', 'The stage for product launches.'],
        unit: ['produk rilis', 'products released'],
        nav: { view: 'products' },
        levelLabels: ['Belum Ada', 'Arena Kecil', 'Arena Peluncuran', 'Stadion Peluncuran'],
        rule: { base: 0, steps: [4, 10, 20], max: 3, metric: _products }
    },
    {
        id: 'port', kind: 'slot', slot: [11.0, 6.8], fp: [-2.8, 2.85, -1.6, 5.35], category: 'industry', icon: 'cube', emoji: '⚓', variant: 7,
        name: ['Pelabuhan Logistik', 'Logistics Port'],
        desc: ['Menampung stok barang jadi.', 'Holds your finished-goods stock.'],
        unit: ['unit stok', 'stock units'],
        nav: { view: 'products' },
        roofAlt: true,
        levelLabels: ['Belum Ada', 'Dermaga Kecil', 'Pelabuhan Logistik', 'Mega Port'],
        rule: { base: 0, steps: [1000, 5000, 20000], max: 3, metric: _stock }
    },

    // ---------- GEDUNG BARU: terhubung ke sistem game ----------
    {
        id: 'pcplant', kind: 'slot', slot: [5.4, 11.4], fp: [-2.7, 1.8, -1.2, 1.53], category: 'industry', icon: 'battery', emoji: '🔩', variant: 1,
        name: ['Pabrik Komponen', 'Component Plant'],
        desc: ['Baterai & layar buatan sendiri. Naik seiring level pabrik komponen.', 'Your own batteries and displays. Grows with plant levels.'],
        unit: ['level pabrik', 'plant levels'],
        nav: { view: 'research', sub: 'manufaktur', label: ['Manufaktur', 'Manufacturing'] },
        roofAlt: true,
        levelLabels: ['Belum Ada', 'Lini Pilot', 'Pabrik Komponen', 'Kawasan Manufaktur'],
        rule: { base: 0, steps: [1, 4, 8], max: 3, metric: _plantLevels }
    },
    {
        id: 'chipdesign', kind: 'slot', slot: [-6.6, 9.8], fp: [-1.3, 1.3, -1.0, 1.33], category: 'innovation', icon: 'cpu', emoji: '🧠', variant: 2,
        name: ['Pusat Desain Chip', 'Chip Design Center'],
        desc: ['Tumbuh seiring riset chip yang selesai.', 'Grows with completed chip research.'],
        unit: ['riset chip selesai', 'chip research done'],
        nav: { view: 'research', sub: 'chip', label: ['Desain Chip', 'Chip Design'] },
        levelLabels: ['Belum Ada', 'Studio Desain', 'Pusat Desain', 'Lab Silikon'],
        rule: { base: 0, steps: [1, 5, 12], max: 3, metric: _chipDone }
    },

    // ---------- DEKORASI ERA (tanpa level; muncul sesuai era desain) ----------
    { id: 'wind', kind: 'decor', minEra: 4, category: 'support', icon: 'leaf', emoji: '🌬️', prio: 4,
      name: ['Ladang Angin', 'Wind Farm'],
      desc: ['Energi hijau kampus, sejak era Premium.', 'Green energy for the campus, since the Premium era.'],
      unit: ['turbin', 'turbines'], nav: null },
    { id: 'rail', kind: 'decor', minEra: 3, category: 'support', icon: 'move', emoji: '🚆', prio: 4,
      name: ['Monorail Kota', 'City Monorail'],
      desc: ['Menghubungkan kawasan, sejak era Smartphone Matang.', 'Connects districts, since the Mature Smartphone era.'],
      unit: ['kereta', 'trains'], nav: null },
    { id: 'sprawl', kind: 'decor', minEra: 0, category: 'support', icon: 'building', emoji: '🏙️', prio: 4,
      name: ['Kawasan Kota', 'City District'],
      desc: ['Kota tumbuh seiring era desain.', 'The city grows with each design era.'],
      unit: ['blok', 'blocks'], nav: null }
];

// ============================================================
// TURUNAN DARI REGISTRI (jangan diedit; ubah entri di atas)
// ============================================================
var _BY_ID = {};
CAMPUS_REGISTRY.forEach(function (e) { _BY_ID[e.id] = e; });

export const CAMPUS_BY_ID = _BY_ID;

export function getCampusEntry(id) { return _BY_ID[id] || null; }

// Aturan level per gedung ber-level (bentuk yang dipakai CampusBuildings & CampusInfo).
export const CAMPUS_RULES = (function () {
    var out = {};
    CAMPUS_REGISTRY.forEach(function (e) {
        if (!e.rule) return;
        out[e.id] = {
            name: e.name[0], max: e.rule.max, base: e.rule.base,
            steps: e.rule.steps.slice(), unit: e.unit[0],
            metric: e.rule.metric, live: !!e.rule.live
        };
    });
    return out;
})();

// Lahan gedung (absolut) yang dijaga: pohon, semak, dan lampu jalan tidak boleh ditempatkan di dalamnya.
export const CAMPUS_RESERVED = CAMPUS_REGISTRY.filter(function (e) { return !!e.fp; }).map(function (e) {
    var p = e.slot || [0, 0];
    return { id: e.id, x0: p[0] + e.fp[0], x1: p[0] + e.fp[1], z0: p[1] + e.fp[2], z1: p[1] + e.fp[3] };
});

// Posisi slot gedung (HQ tetap di tengah dan tidak ada di sini).
export const CAMPUS_SLOTS = (function () {
    var out = {};
    CAMPUS_REGISTRY.forEach(function (e) { if (e.kind === 'slot') out[e.id] = e.slot.slice(); });
    return out;
})();

export const CAMPUS_SLOT_ORDER = CAMPUS_REGISTRY
    .filter(function (e) { return e.kind === 'slot'; })
    .map(function (e) { return e.id; });

// Level dari metrik: base + jumlah ambang yang sudah terlampaui (dibatasi max).
export function campusLevelFor(rule, m) {
    var lv = rule.base;
    for (var i = 0; i < rule.steps.length; i++) if (m >= rule.steps[i]) lv = rule.base + i + 1;
    return Math.min(lv, rule.max);
}

// ============================================================
// VALIDASI — dipanggil saat tes & bisa dipanggil saat pengembangan.
// Mengembalikan daftar masalah (array string). Kosong = registri sehat.
// builderIds (opsional): id yang punya builder 3D; dicek agar tiap gedung bisa dibangun.
// ============================================================
function _pairOk(p) {
    return Array.isArray(p) && p.length === 2 && typeof p[0] === 'string' && typeof p[1] === 'string' && !!p[0];
}

export function validateCampusRegistry(builderIds) {
    var errs = [], seen = {};
    CAMPUS_REGISTRY.forEach(function (e) {
        var w = 'gedung "' + e.id + '"';
        if (!e.id || typeof e.id !== 'string' || !/^[a-z][a-z0-9_]*$/.test(e.id)) {
            errs.push(w + ': id harus huruf kecil/underscore');
            return;
        }
        if (seen[e.id]) errs.push(w + ': id ganda');
        seen[e.id] = true;
        if (['hq', 'slot', 'decor'].indexOf(e.kind) < 0) errs.push(w + ': kind tidak dikenal');
        if (CAMPUS_CATEGORIES.indexOf(e.category) < 0) errs.push(w + ': kategori tidak dikenal');
        if (!e.icon || !e.emoji) errs.push(w + ': ikon kosong');
        if (!_pairOk(e.name) || !_pairOk(e.desc) || !_pairOk(e.unit)) errs.push(w + ': teks [id, en] tidak lengkap');
        if (e.kind === 'slot') {
            var s = e.slot;
            if (!Array.isArray(s) || s.length !== 2 || !isFinite(s[0]) || !isFinite(s[1])) errs.push(w + ': slot [x,z] tidak valid');
            else if (Math.abs(s[0]) > 20 || Math.abs(s[1]) > 20) errs.push(w + ': slot di luar pulau');
            if (!e.rule) errs.push(w + ': kind slot wajib punya rule');
        }
        if (e.kind === 'hq' && !e.rule) errs.push(w + ': HQ wajib punya rule');
        if (e.kind === 'slot' || e.kind === 'hq') {
            var fp = e.fp;
            if (!Array.isArray(fp) || fp.length !== 4 || !(fp[0] < fp[1]) || !(fp[2] < fp[3])) errs.push(w + ': fp [x0,x1,z0,z1] wajib & valid');
        }
        if (e.kind === 'decor' && typeof e.minEra !== 'number') errs.push(w + ': decor wajib punya minEra');
        if (e.nav) {
            var subs = CAMPUS_NAV_SUBTABS[e.nav.view];
            if (!subs) errs.push(w + ': nav.view tidak dikenal');
            else if (e.nav.sub && subs.indexOf(e.nav.sub) < 0) errs.push(w + ': nav.sub "' + e.nav.sub + '" tidak ada di ' + e.nav.view);
        }
        if (e.rule) {
            var r = e.rule;
            if (!(r.max >= 1)) errs.push(w + ': max harus >= 1');
            if (!Array.isArray(r.steps) || r.steps.length !== r.max - r.base) {
                errs.push(w + ': jumlah steps harus = max - base');
            } else {
                for (var i = 1; i < r.steps.length; i++) if (!(r.steps[i] > r.steps[i - 1])) errs.push(w + ': steps harus naik');
            }
            if (typeof r.metric !== 'function') {
                errs.push(w + ': metric harus fungsi');
            } else {
                try {
                    var v = r.metric({});
                    if (typeof v !== 'number' || !isFinite(v)) errs.push(w + ': metric(kosong) bukan angka');
                } catch (ex) { errs.push(w + ': metric melempar error'); }
            }
            if (e.levelLabels && e.levelLabels.length !== r.max + 1) errs.push(w + ': levelLabels harus berisi max+1 entri');
        }
        if (builderIds && e.kind !== 'decor' && builderIds.indexOf(e.id) < 0) errs.push(w + ': belum punya builder 3D');
    });
    // Slot tidak boleh terlalu rapat (footprint gedung ~2-3 unit).
    var sl = CAMPUS_REGISTRY.filter(function (e) { return e.kind === 'slot' && Array.isArray(e.slot); });
    for (var a = 0; a < sl.length; a++) {
        for (var b = a + 1; b < sl.length; b++) {
            var d = Math.hypot(sl[a].slot[0] - sl[b].slot[0], sl[a].slot[1] - sl[b].slot[1]);
            if (d < 2.5) errs.push('slot "' + sl[a].id + '" & "' + sl[b].id + '" terlalu dekat (' + d.toFixed(2) + ')');
        }
    }
    return errs;
}

// ============================================================
// KOMPATIBILITAS: API lama (dipakai CampusManagerPanel).
// Daftar gedung ber-level dengan bentuk lama (nameKey, progressFn, levelResolver).
// ============================================================
export const CAMPUS_BUILDINGS = CAMPUS_REGISTRY.filter(function (e) { return !!e.rule; }).map(function (e) {
    var r = e.rule;
    return {
        id: e.id,
        nameKey: 'campus.building.' + e.id,
        descKey: 'campus.building.' + e.id + '.desc',
        name: e.name[0],
        desc: e.desc[0],
        namePair: e.name,
        descPair: e.desc,
        unitPair: e.unit || null,
        icon: e.icon,
        category: e.category,
        maxLevel: r.max,
        slot: e.kind === 'slot' ? { x: e.slot[0], z: e.slot[1] } : { x: 0, z: 0 },
        alwaysBuilt: e.kind === 'hq',
        levelLabels: e.levelLabels || [],
        levelResolver: function (data) { return campusLevelFor(r, r.metric(data || {})); },
        requirementKey: null,
        progressFn: function (data) {
            var m = r.metric(data || {});
            var lvl = campusLevelFor(r, m);
            var unitKey = 'campus.unit.' + e.id;
            if (lvl >= r.max) return { cur: m, next: null, pct: 100, unitKey: unitKey, unitText: e.unit[0], unitPair: e.unit };
            var idx = lvl - r.base;
            var need = r.steps[idx];
            var prev = idx > 0 ? r.steps[idx - 1] : 0;
            var pct = Math.round(((m - prev) / (need - prev)) * 100);
            return { cur: m, next: need, pct: Math.max(0, Math.min(100, pct)), unitKey: unitKey, unitText: e.unit[0], unitPair: e.unit };
        }
    };
});

export function getBuildingById(id) {
    return CAMPUS_BUILDINGS.find(function (b) { return b.id === id; }) || null;
}

// Hitung status lengkap sebuah gedung dari state game.
export function resolveBuildingState(building, data) {
    if (!building) return null;
    var level = 0;
    try { level = building.levelResolver(data) || 0; } catch (e) { level = 0; }
    var progress = null;
    try { progress = building.progressFn ? building.progressFn.call(building, data) : null; }
    catch (e) { progress = null; }
    var label = building.levelLabels && building.levelLabels[level]
        ? building.levelLabels[level] : ('Level ' + level);
    return {
        id: building.id,
        built: !!building.alwaysBuilt || level > 0,
        level: level,
        maxLevel: building.maxLevel,
        levelLabel: label,
        category: building.category,
        icon: building.icon,
        name: building.name,
        desc: building.desc,
        namePair: building.namePair,
        descPair: building.descPair,
        nameKey: building.nameKey,
        descKey: building.descKey,
        requirementKey: building.requirementKey,
        progress: progress
    };
}

export function resolveAllBuildings(data) {
    return CAMPUS_BUILDINGS.map(function (b) { return resolveBuildingState(b, data); });
}
