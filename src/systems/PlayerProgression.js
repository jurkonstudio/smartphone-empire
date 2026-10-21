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
    var level = levelFromXp(xp);
    var m10 = money10(c.revenue);
    var years = Math.floor(Math.max(0, Number(c.gameMinutes) || 0) / MIN_PER_YEAR);
    var curXp = levelXp(level);
    var nextXp = level >= LEVEL_MAX ? curXp : levelXp(level + 1);
    return {
        credibility: c10 / 10,
        cred10: c10,
        tier: credTier(c10),
        xp: xp,
        level: level,
        levelXp: curXp,
        nextLevelXp: nextXp,
        levelPct: level >= LEVEL_MAX ? 100 : Math.max(0, Math.min(100, Math.floor(((xp - curXp) * 100) / Math.max(1, nextXp - curXp)))),
        money: m10 / 10,
        score: score10(m10, c10, level) / 10,
        year: START_YEAR + years,
        years: years,
        nextReward: level >= LEVEL_MAX ? 0 : rewardLevelCash(level + 1, START_YEAR + years)
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

var _cache = null;
var _cacheAt = 0;

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
    getCached: function () { return _cache || PlayerProgression.compute(true); },
    invalidate: function () { _cache = null; }
};

// Cache dibuang saat hari berganti / save dimuat, supaya header & profil selalu segar tanpa hitung tiap render.
if (typeof bus !== 'undefined' && bus && typeof bus.on === 'function') {
    bus.on('time:day-changed', function () { _cache = null; });
    bus.on('state:hydrated', function () { _cache = null; });
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
