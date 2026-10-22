// FILE: src/systems/PlayerProgression.js  (BARU)
// ============================================================
// Level pemain, Kredibilitas, dan Skor leaderboard.
//
// Semua rumus memakai aritmetika BILANGAN BULAT (BigInt) supaya identik dengan fungsi SQL di
// supabase/12-level-kredibilitas-reward.sql (_lg_pts, _cred10, _xp, _level_from_xp, _score10, ...).
// Server menghitung ulang dari komponen mentah; angka di sini untuk tampilan lokal / offline.
//
//   Kredibilitas (0-100) = reputasi 30% + skor kredit bank 30% + sentimen publik 25% + integritas bayar 15%
//   Level (1-50)         = dari XP: pendapatan + unit terjual + lama bermain + kredibilitas + pangsa pasar
//   Skor leaderboard     = kekayaan (skala log) 40% + kredibilitas 40% + level 20%
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';

export var LEVEL_MAX = 50;
export var START_YEAR = 2000;

// BATAS LEVEL PER ERA (tahun game). Level tidak boleh melewati batas tahun berjalan,
// meski XP sudah cukup. Ubah angka di sini LALU samakan dengan fungsi public._level_cap()
// di supabase/12-level-kredibilitas-reward.sql (server yang menyimpan stat_level).
// Entri dibaca dari atas ke bawah: batas = entri terakhir yang `from` <= tahun berjalan.
export var ERA_LEVEL_CAP = [
    { from: 2000, cap: 5 },
    { from: 2003, cap: 10 },
    { from: 2006, cap: 14 },
    { from: 2010, cap: 22 },
    { from: 2015, cap: 32 },
    { from: 2020, cap: 42 },
    { from: 2025, cap: 50 }
];
export function levelCapForYear(year) {
    var y = Number(year) || START_YEAR, cap = ERA_LEVEL_CAP[0].cap;
    for (var i = 0; i < ERA_LEVEL_CAP.length; i++) if (y >= ERA_LEVEL_CAP[i].from) cap = ERA_LEVEL_CAP[i].cap;
    return Math.min(LEVEL_MAX, cap);
}
var MIN_PER_MONTH = 43200;        // 30 hari * 1440
var MIN_PER_YEAR = 525600;        // 365 hari * 1440

export var TIERS = [
    { id: 0, min: 0 },
    { id: 1, min: 25 },
    { id: 2, min: 45 },
    { id: 3, min: 65 },
    { id: 4, min: 85 }
];

function _big(v) {
    v = Number(v);
    if (!isFinite(v) || v < 0) return 0n;
    return BigInt(Math.floor(v));
}
function _clamp(v, lo, hi) { v = Number(v); if (!isFinite(v)) v = lo; return Math.min(hi, Math.max(lo, v)); }
function _round(v) { return Math.round(v); }           // v >= 0: sama dengan round() PostgreSQL

// x di [10^k, 10^(k+1)) -> K * (k + (x - 10^k) / (9 * 10^k)), dibulatkan ke bawah.
export function lgPts(x, K) {
    x = typeof x === 'bigint' ? x : _big(x);
    if (x < 1n) return 0n;
    var p = 1n, kk = 0n;
    while (p * 10n <= x) { p *= 10n; kk += 1n; }
    return (BigInt(K) * (9n * kk * p + (x - p))) / (9n * p);
}

// Persepuluhan 0..1000
export function cred10(rep, credit, sentiment, missed) {
    var r = BigInt(_round(_clamp(rep, 0, 100)));
    var c = BigInt(_round(_clamp(credit, 0, 100)));
    var s = BigInt(_round(_clamp(sentiment, 0, 100)));
    var m = BigInt(_round(_clamp(missed, 0, 20)));
    var integrity = 100n - 25n * m; if (integrity < 0n) integrity = 0n;
    return Number((30n * r + 30n * c + 25n * s + 15n * integrity) / 10n);
}

export function credTier(c10) {
    return c10 >= 850 ? 4 : c10 >= 650 ? 3 : c10 >= 450 ? 2 : c10 >= 250 ? 1 : 0;
}

export function xpOf(revenue, sold, minutes, c10, share) {
    var rev = _big(revenue) / 100000n;
    var tenure = _big(minutes) / BigInt(MIN_PER_MONTH); if (tenure > 400n) tenure = 400n;
    var cp = BigInt(Math.floor(c10)) - 400n; cp = cp > 0n ? (cp * 5n) / 10n : 0n; if (cp > 300n) cp = 300n;
    var sh = BigInt(Math.floor(_clamp(share, 0, 100)));
    return Number(lgPts(rev, 60) + lgPts(_big(sold), 40) + tenure + cp + 3n * sh);
}

export function levelXp(n) { return Math.floor((4 * (n - 1) * (n - 1)) / 5) + 5 * (n - 1); }

export function levelFromXp(xp) {
    var n = 1;
    while (n < LEVEL_MAX && xp >= levelXp(n + 1)) n++;
    return n;
}

export function money10(revenue) {
    var v = lgPts(_big(revenue) / 1000n, 1000) / 9n;
    return Number(v > 1000n ? 1000n : v);
}

export function score10(m10, c10, level) {
    return Number((40n * BigInt(m10) + 40n * BigInt(c10) + 20n * (BigInt(level - 1) * 1000n / 49n)) / 100n);
}

export function rewardScalePct(year) {
    return 100 + 15 * Math.max(0, Math.min(Number(year) || START_YEAR, 2100) - START_YEAR);
}
export function rewardLevelCash(level, year) {
    return Math.floor(((2000 + 250 * level) * rewardScalePct(year)) / 10000) * 100;
}
export function rewardTierCash(tier, year) {
    var base = tier === 2 ? 15000 : tier === 3 ? 40000 : tier === 4 ? 100000 : 0;
    return Math.floor((base * rewardScalePct(year)) / 10000) * 100;
}

// Komponen mentah -> semua angka turunan (fungsi murni; dipakai UI, uji paritas, dan sinkron).
export function derive(c) {
    var c10 = cred10(c.reputation, c.creditScore, c.sentiment, c.missed);
    var xp = xpOf(c.revenue, c.sold, c.gameMinutes, c10, c.share);
    var years = Math.floor(Math.max(0, Number(c.gameMinutes) || 0) / MIN_PER_YEAR);
    var year = START_YEAR + years;
    var cap = levelCapForYear(year);
    var level = Math.min(levelFromXp(xp), cap);      // dibatasi era
    var isMax = level >= cap;                        // maks untuk tahun ini (bisa < 50)
    var m10 = money10(c.revenue);
    var curXp = levelXp(level);
    var nextXp = isMax ? curXp : levelXp(level + 1);
    return {
        credibility: c10 / 10,
        cred10: c10,
        tier: credTier(c10),
        xp: xp,
        level: level,
        cap: cap,
        isMax: isMax,
        levelXp: curXp,
        nextLevelXp: nextXp,
        levelPct: isMax ? 100 : Math.max(0, Math.min(100, Math.floor(((xp - curXp) * 100) / Math.max(1, nextXp - curXp)))),
        money: m10 / 10,
        score: score10(m10, c10, level) / 10,
        year: year,
        years: years,
        nextReward: isMax ? 0 : rewardLevelCash(level + 1, year)
    };
}

// ---------- Baca komponen dari game ----------
function _game() { try { return window.__game || null; } catch (e) { return null; } }

export function readComponents() {
    var d = state.data || {};
    var cat = (d.products && d.products.catalog) || [];
    var revenue = 0, sold = 0;
    for (var i = 0; i < cat.length; i++) { revenue += cat[i].totalRevenue || 0; sold += cat[i].totalSold || 0; }
    var m = d.market || {};
    var g = _game();
    var credit = 50, missed = 0;
    try {
        if (g && g.bank) {
            credit = g.bank.getCreditScore().score;
            missed = g.bank.getRecentMissed();
        }
    } catch (e) {}
    var fb = d.feedback || {};
    return {
        revenue: Math.max(0, Math.round(revenue)),
        sold: Math.max(0, Math.round(sold)),
        reputation: Math.round(_clamp(m.reputation, 0, 100)),
        share: _clamp((Number(m.share) || 0) * 100, 0, 100),
        creditScore: Math.round(_clamp(credit, 0, 100)),
        missed: Math.round(_clamp(missed, 0, 1000)),
        sentiment: Math.round(_clamp(typeof fb.sentiment === 'number' ? fb.sentiment : 50, 0, 100)),
        gameMinutes: Math.max(0, Math.floor(Number(d.time && d.time.elapsedGameMinutes) || 0))
    };
}


// ============================================================
// LEVEL PERUSAHAAN (lokal / tampilan) — AKTIVITAS + KREDIBILITAS
//   Aktivitas    : pendapatan, unit terjual, produk aktif, staf, riset selesai, lama beroperasi, pangsa pasar
//   Kredibilitas : reputasi 30% + skor kredit 30% + sentimen publik 25% + moral tim 15%
//   XP perusahaan = XP aktivitas + XP kredibilitas (maks 300), lalu level 1..50 memakai kurva levelXp().
// ============================================================
export function companyCred(rep, credit, sentiment, morale) {
    return (30 * _clamp(rep, 0, 100) + 30 * _clamp(credit, 0, 100) + 25 * _clamp(sentiment, 0, 100) + 15 * _clamp(morale, 0, 100)) / 100;
}

export function deriveCompany(c) {
    var cred = companyCred(c.reputation, c.creditScore, c.sentiment, c.morale);
    var months = Math.min(400, Math.floor(Math.max(0, Number(c.gameMinutes) || 0) / MIN_PER_MONTH));
    var parts = {
        revenue: Number(lgPts(_big(c.revenue) / 100000n, 60)),
        sold: Number(lgPts(_big(c.sold), 40)),
        products: Math.min(40, 4 * Math.max(0, Math.floor(Number(c.activeProducts) || 0))),
        staff: Math.min(60, 2 * Math.max(0, Math.floor(Number(c.staff) || 0))),
        research: Math.min(150, 3 * Math.max(0, Math.floor(Number(c.research) || 0))),
        tenure: months,
        share: 3 * Math.floor(_clamp(c.share, 0, 100))
    };
    var activityXp = 0;
    for (var k in parts) activityXp += parts[k];
    var credXp = Math.min(300, Math.max(0, Math.floor((cred * 10 - 400) * 0.5)));
    var xp = activityXp + credXp;
    var years = Math.floor(Math.max(0, Number(c.gameMinutes) || 0) / MIN_PER_YEAR);
    var year = START_YEAR + years;
    var cap = levelCapForYear(year);
    var level = Math.min(levelFromXp(xp), cap);      // dibatasi era
    var isMax = level >= cap;
    var curXp = levelXp(level);
    var nextXp = isMax ? curXp : levelXp(level + 1);
    return {
        level: level, cap: cap, isMax: isMax, year: year, xp: xp, activityXp: activityXp, credXp: credXp,
        credibility: Math.round(cred * 10) / 10,
        tier: credTier(Math.round(cred * 10)),
        parts: parts,
        levelXp: curXp, nextLevelXp: nextXp,
        levelPct: isMax ? 100 : Math.max(0, Math.min(100, Math.floor(((xp - curXp) * 100) / Math.max(1, nextXp - curXp))))
    };
}

export function readCompanyComponents() {
    var base = readComponents();
    var d = state.data || {};
    var cat = (d.products && d.products.catalog) || [];
    var staff = d.staff || [];
    var msum = 0;
    for (var i = 0; i < staff.length; i++) msum += Number(staff[i].morale) || 0;
    var done = (d.research && Array.isArray(d.research.completed)) ? d.research.completed.length : 0;
    base.activeProducts = cat.filter(function (p) { return p.status === 'selling'; }).length;
    base.staff = staff.length;
    base.morale = staff.length ? Math.round(msum / staff.length) : 50;
    base.research = done;
    return base;
}

// Tingkat peringkat visual (0..5) dari level 1..50 — menentukan warna & bentuk ikon.
export var RANKS = [
    { id: 0, min: 1,  id_name: 'Rintisan',  en_name: 'Starter',   c1: '#cd8a54', c2: '#8a5a2b' },
    { id: 1, min: 10, id_name: 'Berkembang', en_name: 'Rising',   c1: '#cbd5e1', c2: '#64748b' },
    { id: 2, min: 20, id_name: 'Mapan',     en_name: 'Established', c1: '#fbbf24', c2: '#b45309' },
    { id: 3, min: 30, id_name: 'Elit',      en_name: 'Elite',     c1: '#67e8f9', c2: '#0e7490' },
    { id: 4, min: 40, id_name: 'Legenda',   en_name: 'Legend',    c1: '#c4b5fd', c2: '#6d28d9' },
    { id: 5, min: 50, id_name: 'Puncak',    en_name: 'Apex',      c1: '#fda4af', c2: '#be123c' }
];
export function rankOfLevel(level) {
    var r = RANKS[0];
    for (var i = 0; i < RANKS.length; i++) if (level >= RANKS[i].min) r = RANKS[i];
    return r;
}

var _cache = null;
var _cacheAt = 0;
// Hasil level perusahaan dari server (sync_company_level). null = belum ada / belum login.
var _serverCo = null;
export function setServerCompany(d) {
    _serverCo = (d && typeof d.level === 'number') ? { level: d.level, xp: Number(d.xp) || 0, cap: Number(d.cap) || d.level } : null;
}
function _applyServerCompany(r) {
    var s = _serverCo;
    if (!s) return r;
    var lv = Math.max(1, Math.min(LEVEL_MAX, s.level | 0));
    var max = lv >= s.cap;
    var curXp = levelXp(lv);
    var nextXp = max ? curXp : levelXp(lv + 1);
    r.level = lv; r.xp = s.xp; r.cap = s.cap; r.isMax = max; r.serverSynced = true;
    r.levelXp = curXp; r.nextLevelXp = nextXp;
    r.levelPct = max ? 100 : Math.max(0, Math.min(100, Math.floor(((s.xp - curXp) * 100) / Math.max(1, nextXp - curXp))));
    return r;
}

export var PlayerProgression = {
    // Hitung ulang dari state game (murah, tapi bank.getCreditScore() agak berat -> ada cache singkat).
    compute: function (force) {
        var now = Date.now();
        if (!force && _cache && now - _cacheAt < 1500) return _cache;
        try {
            var c = readComponents();
            var r = derive(c);
            r.components = c;
            _cache = r; _cacheAt = now;
        } catch (e) {
            if (!_cache) _cache = derive({ revenue: 0, sold: 0, reputation: 0, creditScore: 50, missed: 0, sentiment: 50, gameMinutes: 0, share: 0 });
        }
        return _cache;
    },
    computeCompany: function () {
        var r;
        try { var c = readCompanyComponents(); r = deriveCompany(c); r.components = c; }
        catch (e) { r = deriveCompany({ revenue: 0, sold: 0, reputation: 0, creditScore: 50, sentiment: 50, morale: 50, gameMinutes: 0, share: 0 }); }
        return _applyServerCompany(r);
    },
    getCached: function () { return _cache || PlayerProgression.compute(true); },
    invalidate: function () { _cache = null; }
};

// Cache dibuang saat hari berganti / save dimuat, supaya header & profil selalu segar tanpa hitung tiap render.
if (typeof bus !== 'undefined' && bus && typeof bus.on === 'function') {
    bus.on('time:day-changed', function () { _cache = null; });
    bus.on('state:hydrated', function () { _cache = null; _serverCo = null; });
}

// Nama tingkat kredibilitas (0..4) untuk tampilan.
var TIER_NAMES = {
    id: ['Meragukan', 'Biasa', 'Terpercaya', 'Terhormat', 'Terkemuka'],
    en: ['Doubtful', 'Average', 'Trusted', 'Respected', 'Renowned']
};
export function tierName(tier, lang) {
    var list = lang === 'en' ? TIER_NAMES.en : TIER_NAMES.id;
    return list[Math.max(0, Math.min(4, tier | 0))];
}
