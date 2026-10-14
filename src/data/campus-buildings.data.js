// FILE: src/data/campus-buildings.data.js
// ============================================================
// Definisi gedung kampus. Setiap gedung punya:
//   - levelResolver(data) → 0..maxLevel  (0 = belum dibangun)
//   - requirement         → teks syarat (i18n key)
//   - slot                → posisi di peta 3D (unit dunia)
// Dipakai oleh CampusManagerPanel (UI) & CampusScene (3D).
// ============================================================

// Label level umum. Bisa di-override per gedung.
export const LEVEL_LABELS = [
    'Not Built',
    'Small',
    'Growing',
    'Established',
    'Landmark'
];

function _clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function _staffCount(data) {
    return (data && Array.isArray(data.staff)) ? data.staff.length : 0;
}

function _marketerCount(data) {
    if (!data || !Array.isArray(data.staff)) return 0;
    return data.staff.filter(function (s) { return s && s.role === 'marketer'; }).length;
}

function _researchCompleted(data) {
    return (data && data.research && Array.isArray(data.research.completed))
        ? data.research.completed.length : 0;
}

function _totalStock(data) {
    if (!data || !data.products || !Array.isArray(data.products.catalog)) return 0;
    return data.products.catalog.reduce(function (sum, p) {
        return sum + (p.stock || 0);
    }, 0);
}

function _productsReleased(data) {
    if (!data || !data.products || !Array.isArray(data.products.catalog)) return 0;
    return data.products.catalog.length;
}

function _osMajorVersion(data) {
    if (!data || !data.os || !data.os.currentVersion) return 0;
    var v = data.os.currentVersion.versionString || '';
    var parts = String(v).split('.');
    return parseInt(parts[0], 10) || 0;
}

// ============================================================
// DEFINISI GEDUNG
// ============================================================
export const CAMPUS_BUILDINGS = [
    // ---------- KANTOR PUSAT ----------
    {
        id: 'hq',
        nameKey: 'campus.building.hq',
        descKey: 'campus.building.hq.desc',
        icon: 'layers',
        category: 'core',
        maxLevel: 4,
        slot: { x: 0, z: 0 },
        alwaysBuilt: true,
        levelLabels: ['Kantor Kecil', 'Kantor Kecil', 'Kantor Sedang', 'Kantor Besar', 'Markas Utama'],
        levelResolver: function (data) {
            var n = _staffCount(data);
            if (n >= 30) return 4;
            if (n >= 15) return 3;
            if (n >= 5) return 2;
            return 1;
        },
        requirementKey: null,
        progressFn: function (data) {
            var n = _staffCount(data);
            var thresholds = [0, 5, 15, 30];
            var lvl = this.levelResolver(data);
            if (lvl >= 4) return { cur: n, next: null, pct: 100 };
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.staff' };
        }
    },

    // ---------- LAB R&D ----------
    {
        id: 'lab_rnd',
        nameKey: 'campus.building.lab_rnd',
        descKey: 'campus.building.lab_rnd.desc',
        icon: 'flask',
        category: 'innovation',
        maxLevel: 4,
        slot: { x: -4.5, z: -1.5 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Lab Kecil', 'Lab Riset', 'Lab Canggih', 'Pusat Inovasi'],
        levelResolver: function (data) {
            var n = _researchCompleted(data);
            if (n >= 15) return 4;
            if (n >= 5) return 3;
            if (n >= 1) return 2;
            return 0;
        },
        requirementKey: 'campus.req.start_research',
        progressFn: function (data) {
            var n = _researchCompleted(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: 0, next: 1, pct: 0, unitKey: 'campus.unit.research' };
            if (lvl >= 4) return { cur: n, next: null, pct: 100 };
            var thresholds = [0, 1, 5, 15];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.research' };
        }
    },

    // ---------- MARKETING OFFICE ----------
    {
        id: 'marketing',
        nameKey: 'campus.building.marketing',
        descKey: 'campus.building.marketing.desc',
        icon: 'signal',
        category: 'marketing',
        maxLevel: 4,
        slot: { x: 4.5, z: -1.5 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Kantor Kecil', 'Kantor Marketing', 'Divisi Marketing', 'Agensi Global'],
        levelResolver: function (data) {
            var n = _marketerCount(data);
            if (n >= 10) return 4;
            if (n >= 6) return 3;
            if (n >= 3) return 2;
            if (n >= 1) return 1;
            return 0;
        },
        requirementKey: 'campus.req.hire_marketer',
        progressFn: function (data) {
            var n = _marketerCount(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: 0, next: 1, pct: 0, unitKey: 'campus.unit.marketer' };
            if (lvl >= 4) return { cur: n, next: null, pct: 100 };
            var thresholds = [0, 1, 3, 6, 10];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.marketer' };
        }
    },

    // ---------- FABRIKASI ----------
    {
        id: 'fab',
        nameKey: 'campus.building.fab',
        descKey: 'campus.building.fab.desc',
        icon: 'factory',
        category: 'industry',
        maxLevel: 4,
        slot: { x: -7, z: 3 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Fab Kecil', 'Fab Menengah', 'Fab Besar', 'Mega Fab'],
        levelResolver: function (data) {
            if (!data || !data.fab || !data.fab.built) return 0;
            return _clamp(data.fab.level || 1, 1, 4);
        },
        requirementKey: 'campus.req.build_fab',
        progressFn: function (data) {
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: 0, next: 1, pct: 0, unitKey: 'campus.unit.level' };
            if (lvl >= 4) return { cur: lvl, next: null, pct: 100 };
            return { cur: lvl, next: lvl + 1, pct: Math.round((lvl / 4) * 100), unitKey: 'campus.unit.level' };
        }
    },

    // ---------- GUDANG ----------
    {
        id: 'warehouse',
        nameKey: 'campus.building.warehouse',
        descKey: 'campus.building.warehouse.desc',
        icon: 'box',
        category: 'industry',
        maxLevel: 3,
        slot: { x: 7, z: 3 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Gudang Kecil', 'Gudang Sedang', 'Gudang Besar'],
        levelResolver: function (data) {
            var n = _totalStock(data);
            if (n >= 20000) return 3;
            if (n >= 5000) return 2;
            if (n >= 1000) return 1;
            return 0;
        },
        requirementKey: 'campus.req.release_product',
        progressFn: function (data) {
            var n = _totalStock(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: n, next: 1000, pct: Math.round((n / 1000) * 100), unitKey: 'campus.unit.units' };
            if (lvl >= 3) return { cur: n, next: null, pct: 100 };
            var thresholds = [0, 1000, 5000, 20000];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.units' };
        }
    },

    // ---------- DATA CENTER ----------
    {
        id: 'datacenter',
        nameKey: 'campus.building.datacenter',
        descKey: 'campus.building.datacenter.desc',
        icon: 'database',
        category: 'innovation',
        maxLevel: 4,
        slot: { x: 0, z: -3.5 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Server Kecil', 'Data Center', 'Cloud Hub', 'AI Cluster'],
        levelResolver: function (data) {
            var v = _osMajorVersion(data);
            if (v >= 5) return 4;
            if (v >= 3) return 3;
            if (v >= 1) return 2;
            return 0;
        },
        requirementKey: 'campus.req.create_os',
        progressFn: function (data) {
            var v = _osMajorVersion(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: 0, next: 1, pct: 0, unitKey: 'campus.unit.osver' };
            if (lvl >= 4) return { cur: v, next: null, pct: 100 };
            var thresholds = [0, 1, 3, 5];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((v - prev) / (next - prev)) * 100);
            return { cur: v, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.osver' };
        }
    },

    // ---------- KANTIN ----------
    {
        id: 'cafeteria',
        nameKey: 'campus.building.cafeteria',
        descKey: 'campus.building.cafeteria.desc',
        icon: 'coffee',
        category: 'support',
        maxLevel: 3,
        slot: { x: 3, z: 3.5 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Kantin Kecil', 'Kantin Karyawan', 'Food Court'],
        levelResolver: function (data) {
            var n = _staffCount(data);
            if (n >= 30) return 3;
            if (n >= 15) return 2;
            if (n >= 5) return 1;
            return 0;
        },
        requirementKey: 'campus.req.staff_5',
        progressFn: function (data) {
            var n = _staffCount(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: n, next: 5, pct: Math.round((n / 5) * 100), unitKey: 'campus.unit.staff' };
            if (lvl >= 3) return { cur: n, next: null, pct: 100 };
            var thresholds = [0, 5, 15, 30];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.staff' };
        }
    },

    // ---------- PARKIRAN ----------
    {
        id: 'parking',
        nameKey: 'campus.building.parking',
        descKey: 'campus.building.parking.desc',
        icon: 'map_pin',
        category: 'support',
        maxLevel: 3,
        slot: { x: -3, z: 3.5 },
        alwaysBuilt: false,
        levelLabels: ['Belum Ada', 'Parkiran Kecil', 'Parkiran Luas', 'Basement Parkir'],
        levelResolver: function (data) {
            var n = _staffCount(data);
            if (n >= 20) return 3;
            if (n >= 8) return 2;
            if (n >= 3) return 1;
            return 0;
        },
        requirementKey: 'campus.req.staff_3',
        progressFn: function (data) {
            var n = _staffCount(data);
            var lvl = this.levelResolver(data);
            if (lvl === 0) return { cur: n, next: 3, pct: Math.round((n / 3) * 100), unitKey: 'campus.unit.staff' };
            if (lvl >= 3) return { cur: n, next: null, pct: 100 };
            var thresholds = [0, 3, 8, 20];
            var next = thresholds[lvl];
            var prev = thresholds[lvl - 1];
            var pct = Math.round(((n - prev) / (next - prev)) * 100);
            return { cur: n, next: next, pct: _clamp(pct, 0, 100), unitKey: 'campus.unit.staff' };
        }
    }
];

// ============================================================
// HELPER
// ============================================================
export function getBuildingById(id) {
    return CAMPUS_BUILDINGS.find(function (b) { return b.id === id; }) || null;
}

// Hitung status lengkap sebuah gedung dari state game
export function resolveBuildingState(building, data) {
    if (!building) return null;
    var level = 0;
    try { level = building.levelResolver(data) || 0; } catch (e) { level = 0; }
    var built = building.alwaysBuilt || level > 0;
    var progress = null;
    try { progress = building.progressFn ? building.progressFn.call(building, data) : null; }
    catch (e) { progress = null; }
    var label = building.levelLabels && building.levelLabels[level]
        ? building.levelLabels[level] : ('Level ' + level);
    return {
        id: building.id,
        built: built,
        level: level,
        maxLevel: building.maxLevel,
        levelLabel: label,
        category: building.category,
        icon: building.icon,
        nameKey: building.nameKey,
        descKey: building.descKey,
        requirementKey: building.requirementKey,
        progress: progress
    };
}

// Resolve semua gedung sekaligus
export function resolveAllBuildings(data) {
    return CAMPUS_BUILDINGS.map(function (b) {
        return resolveBuildingState(b, data);
    });
}
