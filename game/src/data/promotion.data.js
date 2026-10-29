// FILE: src/data/promotion.data.js  (BARU)
// ============================================================
// PAKET PROMOSI GLOBAL / ASIA / EROPA.
// coverage = pengali jangkauan per wilayah:
//   - regional  : fokus lokal  -> 1.6x di satu wilayah (lebih hemat per dolar)
//   - global    : menyebar     -> 0.75x di semua wilayah (lebih luas, lebih mahal)
// cost dasar diskalakan oleh PromotionSystem mengikuti besar pasar (era).
// ============================================================

export const LOCAL_FOCUS   = 1.6;
export const GLOBAL_SPREAD = 0.75;
export const MAX_ACTIVE_PER_PRODUCT = 3;

export const PROMO_PACKAGES = [
    // ---------------- GLOBAL ----------------
    { id: 'global_digital',    scope: 'global', tier: 1, cost: 20000,  durationDays: 21, reach: 0.20, brandGain: 6,  repGain: 0 },
    { id: 'global_tour',       scope: 'global', tier: 2, cost: 60000,  durationDays: 28, reach: 0.34, brandGain: 12, repGain: 1 },
    { id: 'global_ambassador', scope: 'global', tier: 3, cost: 150000, durationDays: 42, reach: 0.50, brandGain: 20, repGain: 2 },
    // ---------------- ASIA ----------------
    { id: 'asia_social',   scope: 'asia', tier: 1, cost: 7000,  durationDays: 14, reach: 0.30, brandGain: 8,  repGain: 0 },
    { id: 'asia_festival', scope: 'asia', tier: 2, cost: 22000, durationDays: 21, reach: 0.48, brandGain: 14, repGain: 0, festivalBonus: 0.25 },
    { id: 'asia_telco',    scope: 'asia', tier: 3, cost: 45000, durationDays: 30, reach: 0.60, brandGain: 18, repGain: 1, valueFitBonus: 0.10 },
    // ---------------- EROPA ----------------
    { id: 'eu_retail',  scope: 'europe', tier: 1, cost: 9000,  durationDays: 14, reach: 0.30, brandGain: 8,  repGain: 0 },
    { id: 'eu_design',  scope: 'europe', tier: 2, cost: 26000, durationDays: 21, reach: 0.45, brandGain: 14, repGain: 1, designFitBonus: 0.10 },
    { id: 'eu_carrier', scope: 'europe', tier: 3, cost: 52000, durationDays: 30, reach: 0.58, brandGain: 18, repGain: 1 },
    // ---------------- AMERIKA & LAINNYA (rest) ----------------
    { id: 'rest_retail',  scope: 'rest', tier: 1, cost: 8000,  durationDays: 14, reach: 0.30, brandGain: 8 },
    { id: 'rest_carrier', scope: 'rest', tier: 2, cost: 24000, durationDays: 21, reach: 0.46, brandGain: 14, repGain: 1 },
    { id: 'rest_event',   scope: 'rest', tier: 3, cost: 48000, durationDays: 30, reach: 0.58, brandGain: 18, repGain: 1, festivalBonus: 0.25 },
    // ---------------- SEGMEN (menyebar seperti global, tetapi menggeser bobot segmen target) ----------------
    // segmentBoost: bobot segmen target dikali (1 + boost) di MarketNavSystem selama kampanye aktif.
    // Bila produk TIDAK cocok dengan selera segmen itu, efeknya justru menurunkan permintaan.
    { id: 'seg_value',   scope: 'segment', segment: 'value',   tier: 1, cost: 17000, durationDays: 21, reach: 0.18, brandGain: 5, segmentBoost: 0.5 },
    { id: 'seg_youth',   scope: 'segment', segment: 'youth',   tier: 1, cost: 17000, durationDays: 21, reach: 0.18, brandGain: 5, segmentBoost: 0.5 },
    { id: 'seg_gamer',   scope: 'segment', segment: 'gamer',   tier: 2, cost: 19000, durationDays: 21, reach: 0.18, brandGain: 5, segmentBoost: 0.5, minYear: 2004 },
    { id: 'seg_creator', scope: 'segment', segment: 'creator', tier: 2, cost: 19000, durationDays: 21, reach: 0.18, brandGain: 5, segmentBoost: 0.5, minYear: 2004 },
    { id: 'seg_pro',     scope: 'segment', segment: 'pro',     tier: 2, cost: 21000, durationDays: 21, reach: 0.18, brandGain: 5, segmentBoost: 0.5 },
    { id: 'seg_premium', scope: 'segment', segment: 'premium', tier: 3, cost: 24000, durationDays: 21, reach: 0.18, brandGain: 6, repGain: 1, segmentBoost: 0.5 }
];

// Paket yang menyebar ke semua wilayah (global dan segmen).
export function isBroadScope(scope) { return scope === 'global' || scope === 'segment'; }

export function getPackageById(id) {
    return PROMO_PACKAGES.find(function (p) { return p.id === id; }) || null;
}

export function getPackagesByScope(scope) {
    return PROMO_PACKAGES.filter(function (p) { return p.scope === scope; });
}

// Cakupan wilayah sebuah paket: { asia, europe, rest }
export function getCoverage(pkg) {
    if (isBroadScope(pkg.scope)) return { asia: GLOBAL_SPREAD, europe: GLOBAL_SPREAD, rest: GLOBAL_SPREAD };
    var c = { asia: 0, europe: 0, rest: 0 };
    c[pkg.scope] = LOCAL_FOCUS;
    return c;
}
