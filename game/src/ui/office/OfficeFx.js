// FILE: src/ui/office/OfficeFx.js  (NEW — v2027.53a)
// Logika murni (tanpa THREE, DOM, atau bus) untuk Office 3D Map:
//   * progres riset & fase pengembangan produk (dibaca dari state game, sama dengan panel)
//   * pemetaan event game -> efek di ruangan (partikel + label melayang)
//   * throttle agar event yang sering (penjualan harian) tidak membanjiri adegan
// Dipisah supaya bisa dites tanpa browser.

export var FX_PHASES = ['design', 'prototype', 'production', 'released'];

// Rata-rata progres riset aktif (riset biasa + riset chip), 0..1. -1 bila tidak ada riset aktif.
export function activeResearchPct(data) {
    var a = (data && data.research && Array.isArray(data.research.active)) ? data.research.active : [];
    var b = (data && data.chipResearch && Array.isArray(data.chipResearch.active)) ? data.chipResearch.active : [];
    var sum = 0, n = 0, i, e, dur;
    for (i = 0; i < a.length + b.length; i++) {
        e = i < a.length ? a[i] : b[i - a.length];
        dur = Number(e && e.durationDays) || 0;
        if (dur <= 0) continue;
        sum += Math.min(1, Math.max(0, (Number(e.progressDays) || 0) / dur));
        n++;
    }
    return n ? sum / n : -1;
}

// Progres fase berjalan (0..1) dari objek development produk. -1 bila tidak ada proyek.
export function devPhaseFrac(dev) {
    if (!dev) return -1;
    var dur = Number(dev.phaseDurationDays) || 0;
    if (dur <= 0) return 0;
    return Math.min(1, Math.max(0, (Number(dev.phaseProgressDays) || 0) / dur));
}

// Progres keseluruhan proyek dalam persen (0..100), sama rumusnya dengan ProductSystem.percentOverall.
// -1 bila tidak ada proyek.
export function devOverallPct(dev) {
    var f = devPhaseFrac(dev);
    if (f < 0) return -1;
    var idx = Math.max(0, FX_PHASES.indexOf(dev.phase));
    return Math.round(Math.min(100, idx * 25 + f * 25));
}

// Event game yang ditampilkan di peta kantor.
// Setiap entri: payload -> { room, kind, key, params, gap } | null
//   room : id ruangan (lihat ROOM_DEFS)
//   kind : 'gold' | 'green' | 'cyan' | 'red' (warna partikel)
//   key  : kunci i18n untuk label melayang (null = hanya partikel)
//   gap  : jeda minimum (ms) antar efek untuk event ini
export var FX_EVENTS = {
    'research:completed': function (p) {
        return { room: 'lab', kind: 'gold', key: 'office.fx.research', params: { name: p.name || '' }, gap: 1500 };
    },
    'chip-research:completed': function (p) {
        return { room: 'lab', kind: 'cyan', key: 'office.fx.chipres', params: { name: p.name || '' }, gap: 1500 };
    },
    'product:released': function (p) {
        return { room: 'showroom', kind: 'gold', key: 'office.fx.released', params: { name: p.name || '' }, gap: 1500 };
    },
    'product:phase-changed': function (p) {
        if (FX_PHASES.indexOf(p.phase) < 1) return null;      // 'design' bukan transisi
        return { room: 'design', kind: 'cyan', key: 'office.fx.phase.' + p.phase, params: {}, gap: 1500 };
    },
    'product:sale': function (p) {
        var n = Math.round(Number(p.sold) || 0);
        if (n <= 0) return null;
        return { room: 'showroom', kind: 'green', key: 'office.fx.sold', params: { n: n }, gap: 6000 };
    },
    'os:version-released': function (p) {
        return { room: 'server', kind: 'cyan', key: 'office.fx.osver', params: { v: p.versionString || '' }, gap: 1500 };
    },
    'os:bug-appeared': function () {
        return { room: 'server', kind: 'red', key: 'office.fx.bug', params: {}, gap: 4000 };
    },
    'fab:built': function (p) {
        return { room: 'chip', kind: 'gold', key: 'office.fx.fabbuilt', params: { n: p.level || 1 }, gap: 1500 };
    },
    'fab:upgraded': function (p) {
        return { room: 'chip', kind: 'gold', key: 'office.fx.fabup', params: { n: p.level || 1 }, gap: 1500 };
    },
    'team:skill-up': function () {
        return { room: 'work', kind: 'green', key: 'office.fx.skillup', params: {}, gap: 2500 };
    }
};

// Throttle per kunci: createThrottle()(key, nowMs, gapMs) -> true bila boleh tampil.
export function createThrottle() {
    var last = {};
    return function (key, nowMs, gapMs) {
        var g = gapMs || 1500;
        if (last[key] !== undefined && nowMs - last[key] < g) return false;
        last[key] = nowMs;
        return true;
    };
}
