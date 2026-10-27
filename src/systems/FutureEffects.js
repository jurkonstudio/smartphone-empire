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
                    scareMult: 1.8, audience: -0.20, general: 0.02, aiFactor: 1.10, wellbeing: 0, insight: 2 },
        balanced: { id: 'balanced', name: 'Seimbang',      nameEn: 'Balanced',
                    desc: 'Pengaturan standar. Perlindungan ringan bila OS punya Pusat Privasi.',
                    descEn: 'Standard settings. Light protection if the OS has the Privacy Center.',
                    scareMult: 0.85, audience: 0.05, general: 0, aiFactor: 1.0, wellbeing: 0.5, insight: 1 },
        strict:   { id: 'strict',   name: 'Privasi Ketat', nameEn: 'Strict Privacy',
                    desc: 'Data tetap di perangkat. Kepercayaan dan permintaan segmen pro naik, tapi personalisasi dan diskon AI berkurang.',
                    descEn: 'Data stays on the device. Trust and pro-segment demand rise, but personalisation and AI discounts shrink.',
                    scareMult: 0.4, audience: 0.20, general: -0.01, aiFactor: 0.7, wellbeing: 1, insight: 0 }
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

// ---- Wawasan Pengguna: 8 kategori pemakaian dari segmen pasar × pengguna OS ----
// affinity = seberapa kuat tiap segmen memakai kategori itu (0–1). Porsi dihitung dari bobot segmen tahun ini.
// insight di kebijakan: 2 = rincian per segmen, 1 = semua kategori, 0 = perkiraan 3 teratas.
export const USAGE_CATEGORIES = [
    { id: 'social',   name: 'Sosial',          nameEn: 'Social',           color: '#ec4899',
      affinity: { youth: 1.0, mainstream: 0.8, creator: 0.5, value: 0.6, premium: 0.3, gamer: 0.4, pro: 0.3, senior: 0.4 } },
    { id: 'games',    name: 'Game',            nameEn: 'Games',            color: '#ef4444',
      affinity: { gamer: 1.0, youth: 0.8, mainstream: 0.5, value: 0.5, creator: 0.1, premium: 0.2, pro: 0.1, senior: 0.05 } },
    { id: 'camera',   name: 'Kamera',          nameEn: 'Camera',           color: '#f59e0b',
      affinity: { creator: 1.0, premium: 0.9, youth: 0.7, mainstream: 0.5, value: 0.2, gamer: 0.2, pro: 0.3, senior: 0.2 } },
    { id: 'work',     name: 'Kerja',           nameEn: 'Work',             color: '#0ea5e9',
      affinity: { pro: 1.0, premium: 0.6, mainstream: 0.5, senior: 0.2, value: 0.2, youth: 0.1, creator: 0.2, gamer: 0.05 } },
    { id: 'video',    name: 'Video',           nameEn: 'Video',            color: '#8b5cf6',
      affinity: { creator: 0.8, mainstream: 0.6, youth: 0.7, gamer: 0.5, premium: 0.5, value: 0.4, pro: 0.2, senior: 0.3 } },
    { id: 'shopping', name: 'Belanja',         nameEn: 'Shopping',         color: '#22c55e',
      affinity: { value: 1.0, mainstream: 0.7, senior: 0.4, youth: 0.6, premium: 0.5, pro: 0.3, creator: 0.3, gamer: 0.2 } },
    { id: 'learning', name: 'Belajar',         nameEn: 'Learning',         color: '#14b8a6',
      affinity: { youth: 1.0, pro: 0.6, creator: 0.4, value: 0.5, mainstream: 0.4, premium: 0.2, senior: 0.3, gamer: 0.1 } },
    { id: 'calls',    name: 'Telepon & Pesan', nameEn: 'Calls & Messages', color: '#64748b',
      affinity: { senior: 1.0, mainstream: 0.7, value: 0.6, pro: 0.7, youth: 0.4, premium: 0.4, creator: 0.3, gamer: 0.3 } }
];

// Pemakaian per kategori untuk OS pemain. users = jumlah pengguna OS aktif. Tidak mengubah state.
// Mengembalikan { level, cats } dengan cats terurut dari porsi terbesar; porsi berjumlah 1.
export function computeUsageMix(data, users) {
    var pol = getUserControlPolicy(data);
    var level = pol.insight;
    var year = (data && data.time && data.time.currentYear) || 2019;
    var w = getSegmentWeights(year);
    var raw = USAGE_CATEGORIES.map(function (cat) {
        var parts = [], total = 0;
        Object.keys(cat.affinity).forEach(function (segId) {
            var c = (w[segId] || 0) * cat.affinity[segId];
            parts.push({ id: segId, value: c });
            total += c;
        });
        parts.sort(function (a, b) { return b.value - a.value; });
        return { cat: cat, parts: parts, total: total };
    });
    var sum = raw.reduce(function (a, r) { return a + r.total; }, 0) || 1;
    var cats = raw.map(function (r) {
        var share = r.total / sum;
        var topSegments = r.parts.slice(0, 2).map(function (p) {
            return { id: p.id, share: r.total > 0 ? p.value / r.total : 0 };
        });
        return {
            id: r.cat.id, name: r.cat.name, nameEn: r.cat.nameEn, color: r.cat.color,
            share: share, users: share * (users || 0), topSegments: topSegments
        };
    });
    cats.sort(function (a, b) { return b.share - a.share; });
    return { level: level, cats: cats };
}

// ---- Kemudi Algoritma: tiga slider 0–100 (netral 50) ----
// r = (nilai - 50) / 50, dari -1 sampai +1.
//  recommend  -> belanja App Store (storeSwing) dan peluang isu privasi (kecil).
//  personal   -> permintaan produk (demandSwing) dan peluang isu privasi (scareSwing).
//  notify     -> permintaan produk: notifikasi berlebihan mendorong pengguna menjauh (notifySwing).
export const ALGO_CONFIG = {
    step: 5,
    storeSwing: 0.20,
    demandSwing: 0.03,
    notifySwing: 0.02,
    scareSwing: 0.5,
    scareRecommendSwing: 0.1,
    sliders: [
        { id: 'recommend', name: 'Rekomendasi Aplikasi', nameEn: 'App recommendations',
          desc: 'Makin tinggi, makin besar belanja App Store, tapi pengguna juga makin merasa diganggu.',
          descEn: 'Higher means more App Store spending, but users also feel more pushed.' },
        { id: 'notify', name: 'Notifikasi', nameEn: 'Notifications',
          desc: 'Seberapa sering aplikasi mengirim notifikasi. Terlalu banyak membuat pengguna menjauh.',
          descEn: 'How often apps send notifications. Too many drives users away.' },
        { id: 'personal', name: 'Personalisasi AI', nameEn: 'AI personalisation',
          desc: 'Makin personal, makin relevan bagi pengguna, tapi peluang isu privasi ikut naik.',
          descEn: 'More personal means more relevant for users, but privacy-scare chance rises too.' }
    ]
};

function _algoSliderIds() { return ALGO_CONFIG.sliders.map(function (s) { return s.id; }); }

// Nilai slider (0–100) dari save. Bawaan 50 bila belum pernah diatur.
export function getAlgoValue(id, data) {
    var algo = data && data.userControl && data.userControl.algo;
    var v = algo ? Number(algo[id]) : NaN;
    if (!isFinite(v)) return 50;
    return Math.max(0, Math.min(100, v));
}

function _algoR(id, data) { return (getAlgoValue(id, data) - 50) / 50; }

// Pengali belanja App Store dari slider Rekomendasi. 1 bila Kontrol Pengguna belum terbuka.
export function getAlgoStoreMult(data) {
    if (!isUserControlActive(data)) return 1;
    return 1 + ALGO_CONFIG.storeSwing * _algoR('recommend', data);
}

// Tambahan permintaan produk (pecahan, mis. 0.03 = +3%) dari slider Personalisasi dan Notifikasi.
export function getAlgoDemandBonus(data) {
    if (!isUserControlActive(data)) return 0;
    return ALGO_CONFIG.demandSwing * _algoR('personal', data) - ALGO_CONFIG.notifySwing * _algoR('notify', data);
}

// Pengali peluang event isu privasi dari slider Personalisasi dan Rekomendasi.
export function getAlgoScareMult(data) {
    if (!isUserControlActive(data)) return 1;
    var m = 1 + ALGO_CONFIG.scareSwing * _algoR('personal', data) + ALGO_CONFIG.scareRecommendSwing * _algoR('recommend', data);
    return Math.max(0.5, Math.min(2, m));
}

// Mengatur slider. Mengembalikan true bila berhasil (panel harus terbuka dan id dikenal).
// Nilai dibulatkan ke kelipatan 5 dan dibatasi 0–100.
export function setUserControlAlgo(id, value, data) {
    data = data || currentGameData();
    if (_algoSliderIds().indexOf(id) === -1 || !isUserControlActive(data)) return false;
    var v = Number(value);
    if (!isFinite(v)) return false;
    v = Math.max(0, Math.min(100, Math.round(v / ALGO_CONFIG.step) * ALGO_CONFIG.step));
    if (!data.userControl || typeof data.userControl !== 'object') data.userControl = {};
    if (!data.userControl.algo || typeof data.userControl.algo !== 'object') data.userControl.algo = {};
    data.userControl.algo[id] = v;
    return true;
}
