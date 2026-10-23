// FILE: src/systems/FutureEffects.js  (BARU)
// Efek panel Future ke sistem game. Satu-satunya tempat angka bonus F-AI dan Alat Pengembang.
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

export const FAI_CONFIG = {
    // Diskon biaya pengembangan fitur OS berbasis AI (0.20 = 20%). Ubah di sini untuk menyeimbangkan.
    osAiDiscount: 0.20,
    // Fitur OS yang kena diskon.
    osAiFeatures: ['fw_ai_on_device', 'fw_ondevice_llm', 'fw_ai_agent'],
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
