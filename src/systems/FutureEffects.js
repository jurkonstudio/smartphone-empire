// FILE: src/systems/FutureEffects.js  (BARU)
// Efek panel Future ke sistem game. Satu-satunya tempat angka bonus F-AI, Alat Pengembang, dan Mesin Game.
// Semua hitungan biaya OS (sistem + UI) harus lewat helper ini supaya angkanya cocok.
import { getFutureUnlockState, getFuturePanelById } from '../data/future-panels.data.js';
import { getSegmentWeights } from '../data/market-nav.data.js';

export const DEV_TOOLS_CONFIG = {
    // Diskon biaya pengembangan fitur ekosistem aplikasi (0.15 = 15%). Ubah di sini untuk menyeimbangkan.
    osDevDiscount: 0.15,
    // Fitur OS yang kena diskon Alat Pengembang.
    osDevFeatures: ['fw_appstore', 'fw_cloud_sync', 'fw_sign_in', 'fw_ecosystem'],
    // Bonus permintaan untuk produk ber-OS milik pemain (own:) saat terbuka. 0.04 = faktor OS x1.04. Sengaja kecil.
    demandBonus: 0.04
};

export const GAME_ENGINE_CONFIG = {
    // Bonus performa per poin performa chip (0.12 = chip performa 72 dapat +8,6 poin). Sebanding performa chip.
    perfPerChipPoint: 0.12,
    // Fitur OS yang wajib dimiliki OS produk milik pemain agar bonus berlaku.
    requiredOsFeature: 'fw_appstore'
};

export const FAI_CONFIG = {
    // Diskon biaya pengembangan fitur OS berbasis AI (0.20 = 20%). Ubah di sini untuk menyeimbangkan.
    osAiDiscount: 0.20,
    // Fitur OS yang kena diskon.
    osAiFeatures: ['fw_ai_on_device', 'fw_ondevice_llm', 'fw_ai_agent', 'fw_agentic_os', 'fw_agent_guard', 'fw_agent_store'],
    // Saran desain: markup harga = designMarkupBase + (skor mutu / 100) * designMarkupSpan.
    // Skor mutu 0 -> x1.35, skor 100 -> x2.10 dari biaya produksi per unit.
    designMarkupBase: 1.35,
    designMarkupSpan: 0.75
};

// True bila F-AI terbuka (tahun >= 2022 dan riset chip_npu selesai).
export function isFaiActive(data) {
    try { return getFutureUnlockState(getFuturePanelById('f_ai'), data).unlocked === true; }
    catch (e) { return false; }
}

// True bila Alat Pengembang terbuka (tahun >= 2008 dan riset net_4g selesai).
export function isDevToolsActive(data) {
    try { return getFutureUnlockState(getFuturePanelById('dev_tools'), data).unlocked === true; }
    catch (e) { return false; }
}

// ---- Kontrol Pengguna: kebijakan data (Terbuka / Seimbang / Privasi Ketat) ----
// Semua angka keseimbangan ada di sini.
//  scareMult     pengali peluang event viral "kekhawatiran privasi data" (<1 = lebih jarang).
//  audience      perubahan permintaan = audience * porsi pasar segmen pro+premium (0.20 dan porsi 30% = +6%).
//  general       perubahan permintaan semua produk (personalisasi data vs gesekan privasi).
//  aiFactor      pengali besar diskon F-AI dan Alat Pengembang (privasi ketat membatasi personalisasi).
//  wellbeing     seberapa kuat bonus Kesejahteraan Digital berlaku (segmen youth & senior).
// Efek PERLINDUNGAN (scareMult < 1, audience > 0, wellbeing) hanya berlaku bila OS produk/pemain punya
// fitur Pusat Privasi; BIAYA kebijakan (scareMult > 1, audience < 0, general, aiFactor) selalu berlaku.
export const USER_CONTROL_CONFIG = {
    defaultPolicy: 'balanced',
    requiredOsFeature: 'fw_privacy',
    wellbeingFeature: 'fw_digital_wellbeing',
    wellbeingBonus: 0.12,
    privacyAudienceSegments: ['pro', 'premium'],
    wellbeingSegments: ['youth', 'senior'],
    policies: {
        open:     { id: 'open',     name: 'Terbuka',       nameEn: 'Open',
                    desc: 'Kumpulkan data untuk personalisasi. Fitur AI lebih murah, tapi pembeli peduli privasi menjauh.',
                    descEn: 'Collect data for personalisation. AI features cost less, but privacy-minded buyers drift away.',
                    scareMult: 1.8, audience: -0.20, general: 0.02, aiFactor: 1.10, wellbeing: 0 },
        balanced: { id: 'balanced', name: 'Seimbang',      nameEn: 'Balanced',
                    desc: 'Pengaturan standar. Perlindungan ringan bila OS punya Pusat Privasi.',
                    descEn: 'Standard settings. Light protection if the OS has the Privacy Center.',
                    scareMult: 0.85, audience: 0.05, general: 0, aiFactor: 1.0, wellbeing: 0.5 },
        strict:   { id: 'strict',   name: 'Privasi Ketat', nameEn: 'Strict Privacy',
                    desc: 'Data tetap di perangkat. Kepercayaan dan permintaan segmen pro naik, tapi personalisasi dan diskon AI berkurang.',
                    descEn: 'Data stays on the device. Trust and pro-segment demand rise, but personalisation and AI discounts shrink.',
                    scareMult: 0.4, audience: 0.20, general: -0.01, aiFactor: 0.7, wellbeing: 1 }
    }
};

export const USER_CONTROL_POLICY_ORDER = ['open', 'balanced', 'strict'];

// True bila Kontrol Pengguna terbuka (tahun >= 2019 dan riset sensor_face3d selesai).
export function isUserControlActive(data) {
    try { return getFutureUnlockState(getFuturePanelById('user_control'), data).unlocked === true; }
    catch (e) { return false; }
}

export function getUserControlPolicyId(data) {
    var id = data && data.userControl && data.userControl.policy;
    return USER_CONTROL_CONFIG.policies[id] ? id : USER_CONTROL_CONFIG.defaultPolicy;
}

export function getUserControlPolicy(data) {
    return USER_CONTROL_CONFIG.policies[getUserControlPolicyId(data)];
}

// Mengganti kebijakan. Mengembalikan true bila berhasil (panel harus terbuka).
export function setUserControlPolicy(policyId, data) {
    data = data || currentGameData();
    if (!USER_CONTROL_CONFIG.policies[policyId] || !isUserControlActive(data)) return false;
    if (!data.userControl || typeof data.userControl !== 'object') data.userControl = {};
    data.userControl.policy = policyId;
    return true;
}

// True bila ada versi OS milik pemain yang punya fitur itu (untuk efek tingkat perusahaan, mis. opini publik).
export function playerOsHasFeature(featureId, data) {
    var versions = (data && data.os && data.os.versions) || [];
    return versions.some(function (v) { return Array.isArray(v.features) && v.features.indexOf(featureId) !== -1; });
}

// Pengali peluang event viral "kekhawatiran privasi data". 1 bila panel belum terbuka.
export function getPrivacyScareMult(data) {
    if (!isUserControlActive(data)) return 1;
    var pol = getUserControlPolicy(data);
    if (pol.scareMult < 1 && !playerOsHasFeature(USER_CONTROL_CONFIG.requiredOsFeature, data)) return 1;
    return pol.scareMult;
}

// Pengali permintaan produk (osOptionId 'own:...' dicek per produk; OS lisensi tidak punya daftar fitur).
// Dipanggil dari ProductSystem._getOsFactor, jadi preview desain dan penjualan nyata selalu sama.
export function getUserControlDemandMult(osOptionId, data) {
    if (!isUserControlActive(data)) return 1;
    var cfg = USER_CONTROL_CONFIG, pol = getUserControlPolicy(data);
    var year = (data && data.time && data.time.currentYear) || 2019;
    var w = getSegmentWeights(year);
    var share = 0;
    cfg.privacyAudienceSegments.forEach(function (id) { share += w[id] || 0; });
    var hasPriv = osOptionHasFeature(osOptionId, cfg.requiredOsFeature, data);
    var audience = pol.audience;
    if (audience > 0 && !hasPriv) audience = 0;
    var bonus = pol.general + audience * share;
    if (pol.wellbeing > 0 && osOptionHasFeature(osOptionId, cfg.wellbeingFeature, data)) {
        var wshare = 0;
        cfg.wellbeingSegments.forEach(function (id) { wshare += w[id] || 0; });
        bonus += cfg.wellbeingBonus * pol.wellbeing * wshare;
    }
    return Math.max(0.8, 1 + bonus);
}

// Ringkasan efek kebijakan saat ini untuk ditampilkan di kartu panel. Tidak mengubah state.
export function describeUserControl(data) {
    var cfg = USER_CONTROL_CONFIG, pol = getUserControlPolicy(data);
    var year = (data && data.time && data.time.currentYear) || 2019;
    var w = getSegmentWeights(year);
    var share = 0;
    cfg.privacyAudienceSegments.forEach(function (id) { share += w[id] || 0; });
    var hasPriv = playerOsHasFeature(cfg.requiredOsFeature, data);
    var hasWell = playerOsHasFeature(cfg.wellbeingFeature, data);
    var audience = pol.audience;
    if (audience > 0 && !hasPriv) audience = 0;
    return {
        policy: pol,
        hasPrivacyOs: hasPriv,
        hasWellbeingOs: hasWell,
        scareMult: getPrivacyScareMult(data),
        demandPct: (pol.general + audience * share) * 100,
        wellbeingPct: (pol.wellbeing > 0 && hasWell) ? cfg.wellbeingBonus * pol.wellbeing * (function () { var x = 0; cfg.wellbeingSegments.forEach(function (id) { x += w[id] || 0; }); return x; })() * 100 : 0,
        aiFactor: pol.aiFactor
    };
}

// Pengali besar diskon F-AI / Alat Pengembang menurut kebijakan data (1 bila Kontrol Pengguna belum terbuka).
export function getUserControlDiscountFactor(data) {
    return isUserControlActive(data) ? getUserControlPolicy(data).aiFactor : 1;
}

// Biaya fitur OS setelah efek F-AI dan Alat Pengembang. f = objek fitur dari os.data.js.
export function getOsFeatureCost(f, data) {
    if (!f) return 0;
    var base = f.devCost || 0;
    var cost = base;
    var discounted = false;
    if (FAI_CONFIG.osAiFeatures.indexOf(f.id) !== -1 && isFaiActive(data)) {
        cost *= (1 - FAI_CONFIG.osAiDiscount * getUserControlDiscountFactor(data));
        discounted = true;
    }
    if (DEV_TOOLS_CONFIG.osDevFeatures.indexOf(f.id) !== -1 && isDevToolsActive(data)) {
        cost *= (1 - DEV_TOOLS_CONFIG.osDevDiscount * getUserControlDiscountFactor(data));
        discounted = true;
    }
    return discounted ? Math.round(cost) : base;
}

// Pengali permintaan dari Alat Pengembang untuk produk ber-OS milik pemain (osOptionId 'own:...').
// Dipanggil dari ProductSystem._getOsFactor, jadi preview desain dan penjualan nyata selalu sama.
export function getDevToolsDemandMult(osOptionId, data) {
    if (!osOptionId || osOptionId.indexOf('own:') !== 0) return 1;
    return isDevToolsActive(data) ? 1 + DEV_TOOLS_CONFIG.demandBonus : 1;
}

// True bila Mesin Game terbuka (riset chip_octa selesai).
export function isGameEngineActive(data) {
    try { return getFutureUnlockState(getFuturePanelById('game_engine'), data).unlocked === true; }
    catch (e) { return false; }
}

// True bila OS produk punya fitur itu. Hanya OS milik pemain ('own:') yang dicek:
// OS lisensi tidak punya daftar fitur di data, jadi dianggap tidak memenuhi syarat.
export function osOptionHasFeature(osOptionId, featureId, data) {
    if (!osOptionId || !featureId || osOptionId.indexOf('own:') !== 0) return false;
    var versionId = osOptionId.slice(4);
    var versions = (data && data.os && data.os.versions) || [];
    var v = versions.find(function (x) { return x.id === versionId; });
    return !!v && Array.isArray(v.features) && v.features.indexOf(featureId) !== -1;
}

// Bonus poin performa Mesin Game untuk produk. chipPerf = performa chip dari komponen (0 bila tanpa chip).
// Dipanggil dari ProductSystem.computeStats, jadi preview desain dan produk nyata selalu sama.
export function getGameEnginePerfBonus(chipPerf, osOptionId, data) {
    if (!(chipPerf > 0)) return 0;
    if (!isGameEngineActive(data)) return 0;
    if (!osOptionHasFeature(osOptionId, GAME_ENGINE_CONFIG.requiredOsFeature, data)) return 0;
    return chipPerf * GAME_ENGINE_CONFIG.perfPerChipPoint;
}

// True bila fitur ini sedang mendapat diskon F-AI (untuk label di UI).
export function hasFaiOsDiscount(f, data) {
    return !!f && FAI_CONFIG.osAiFeatures.indexOf(f.id) !== -1 && isFaiActive(data);
}

export function currentGameData() {
    try { return window.__game.state.get(); } catch (e) { return {}; }
}

// Saran desain F-AI: harga yang disarankan dan komponen terlemah.
// stats = hasil computeStats (display, camera, ..., qualityScore); unitCost = biaya per unit;
// limits = { min, max } batas harga; skipStats = stat yang tidak dihitung (mis. ['camera'] bila tanpa kamera).
// Mengembalikan { price, weakKey, weakVal }. Tidak mengubah state.
export function getFaiDesignAdvice(stats, unitCost, limits, skipStats) {
    stats = stats || {};
    var q = Math.max(0, Math.min(100, stats.qualityScore || 0));
    var mult = FAI_CONFIG.designMarkupBase + (q / 100) * FAI_CONFIG.designMarkupSpan;
    var price = Math.ceil((unitCost * mult) / 5) * 5;
    if (limits) price = Math.max(limits.min, Math.min(limits.max, price));
    var keys = ['display', 'camera', 'battery', 'performance', 'connectivity', 'design', 'usability'];
    var weakKey = null, weakVal = Infinity;
    keys.forEach(function (k) {
        if (skipStats && skipStats.indexOf(k) !== -1) return;
        if (typeof stats[k] !== 'number') return;
        if (stats[k] < weakVal) { weakKey = k; weakVal = stats[k]; }
    });
    return { price: price, weakKey: weakKey, weakVal: weakKey ? weakVal : 0 };
}
