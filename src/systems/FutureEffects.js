// FILE: src/systems/FutureEffects.js  (BARU)
// Efek panel Future ke sistem game. Satu-satunya tempat angka bonus F-AI, Alat Pengembang, dan Mesin Game.
// Semua hitungan biaya OS (sistem + UI) harus lewat helper ini supaya angkanya cocok.
import { getFutureUnlockState, getFuturePanelById } from '../data/future-panels.data.js';

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

// Biaya fitur OS setelah efek F-AI dan Alat Pengembang. f = objek fitur dari os.data.js.
export function getOsFeatureCost(f, data) {
    if (!f) return 0;
    var base = f.devCost || 0;
    var cost = base;
    var discounted = false;
    if (FAI_CONFIG.osAiFeatures.indexOf(f.id) !== -1 && isFaiActive(data)) {
        cost *= (1 - FAI_CONFIG.osAiDiscount);
        discounted = true;
    }
    if (DEV_TOOLS_CONFIG.osDevFeatures.indexOf(f.id) !== -1 && isDevToolsActive(data)) {
        cost *= (1 - DEV_TOOLS_CONFIG.osDevDiscount);
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
