// FILE: src/systems/OsAdoptionModel.js  (REPLACE — v2: retensi berbasis waktu)
// ============================================================
// Model adopsi OS — berapa banyak pengguna yang memakai OS kita.
//
// Sumber data: produk yang memakai OS sendiri (config.osOptionId = 'own:<versionId>').
//   - shipped = unit terjual (product.totalSold) dari produk ber-OS sendiri.
//   - active  = shipped x retensi tier x faktor umur.
//       · Retensi tier: versi terbaru paling banyak dipakai, versi lama ditinggalkan.
//       · Faktor umur (BARU): pengguna juga menyusut seiring waktu sejak versi rilis.
//         Setiap `halfLifeYears` tahun, sisa pengguna menjadi separuhnya,
//         dengan batas bawah `ageFloor` agar tidak pernah nol mendadak.
//
// Dengan faktor umur, angka pengguna tidak lagi menumpuk selamanya.
// Versi dari awal permainan hanya menyisakan sebagian kecil di akhir permainan.
//
// Integrasi ke sistem game:
//   - OSSystem menambah aplikasi pihak ketiga tiap bulan sebanding dengan
//     jumlah pengguna aktif (getEcosystemAppBonus).
//   - Riwayat bulanan disimpan di data.os.adoption.history untuk grafik tren.
//
// Fungsi perhitungan di file ini murni (tanpa DOM / bus), jadi mudah dites.
// Satu-satunya pengecualian: formatUsers() membaca bahasa aktif (rb/jt vs K/M).
// ============================================================
import { LanguageService } from '../core/LanguageService.js';

export const ADOPTION_CONFIG = {
    historyMax: 60,                 // jumlah bulan riwayat yang disimpan
    retention: {
        current: 0.92,              // versi terbaru
        previous: 0.60,             // satu versi sebelumnya
        older: 0.30                 // versi lebih lama
    },
    decay: {
        halfLifeYears: 6,           // setiap 6 tahun sejak rilis, sisa pengguna separuh
        ageFloor: 0.05              // batas bawah faktor umur
    },
    appsUsersPerBonus: 100000,      // setiap 100 rb pengguna aktif...
    appsBonusMax: 20                // ...menambah 1 aplikasi/bulan, maks. +20
};

export function getVersionTier(versions, currentVersionId, versionId) {
    if (!Array.isArray(versions) || !versions.length) return 'older';
    var last = versions.length - 1;
    var curIdx = versions.findIndex(function (v) { return v.id === currentVersionId; });
    if (curIdx === -1) curIdx = last;
    var idx = versions.findIndex(function (v) { return v.id === versionId; });
    if (idx === -1) return 'older';
    if (idx === curIdx) return 'current';
    if (idx === curIdx - 1) return 'previous';
    return 'older';
}

// Faktor umur versi: 1.0 saat baru rilis, turun setengah tiap halfLifeYears.
export function getAgeFactor(releaseYear, nowYear) {
    if (!releaseYear || !nowYear) return 1;
    var age = Math.max(0, nowYear - releaseYear);
    var f = Math.pow(0.5, age / ADOPTION_CONFIG.decay.halfLifeYears);
    return Math.max(ADOPTION_CONFIG.decay.ageFloor, f);
}

export function getEcosystemAppBonus(activeUsers) {
    var n = Math.floor((activeUsers || 0) / ADOPTION_CONFIG.appsUsersPerBonus);
    return Math.min(ADOPTION_CONFIG.appsBonusMax, Math.max(0, n));
}

// Menghitung adopsi dari state game. Tidak mengubah data.
export function computeOsAdoption(data) {
    var os = (data && data.os) || {};
    var nowYear = (data && data.time && data.time.currentYear) || null;
    var versions = Array.isArray(os.versions) ? os.versions : [];
    var currentId = os.currentVersionId || (versions.length ? versions[versions.length - 1].id : null);
    var products = (data && data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];

    var byVersion = {};
    versions.forEach(function (v) {
        // Versi tanpa tanggal rilis dianggap rilis tahun ini (faktor umur 1).
        var relYear = (v.releasedAt && v.releasedAt.year) || nowYear;
        var age = getAgeFactor(relYear, nowYear);
        byVersion[v.id] = {
            id: v.id,
            versionString: v.versionString,
            releaseYear: relYear,
            tier: getVersionTier(versions, currentId, v.id),
            ageFactor: age,
            shipped: 0,
            active: 0
        };
    });

    var shipped = 0, active = 0, licensed = 0;
    var phones = [];

    products.forEach(function (p) {
        var opt = (p.config && p.config.osOptionId) || '';
        var sold = p.totalSold || 0;
        if (opt.indexOf('own:') === 0) {
            var vid = opt.slice(4);
            var entry = byVersion[vid];
            var tier = entry ? entry.tier : 'older';
            var factor = entry ? entry.ageFactor : getAgeFactor(nowYear, nowYear);
            var act = Math.round(sold * ADOPTION_CONFIG.retention[tier] * factor);
            if (entry) { entry.shipped += sold; entry.active += act; }
            shipped += sold;
            active += act;
            phones.push({
                id: p.id,
                name: p.name,
                versionString: entry ? entry.versionString : '-',
                shipped: sold,
                active: act
            });
        } else if (opt) {
            licensed += sold;
        }
    });

    var versionRows = versions.map(function (v) {
        var e = byVersion[v.id];
        return {
            id: e.id,
            versionString: e.versionString,
            releaseYear: e.releaseYear,
            tier: e.tier,
            ageFactor: e.ageFactor,
            shipped: e.shipped,
            active: e.active,
            share: active > 0 ? e.active / active : 0
        };
    });

    phones.sort(function (a, b) { return b.active - a.active; });

    var history = (os.adoption && Array.isArray(os.adoption.history)) ? os.adoption.history : [];

    return {
        hasOs: !!os.name && versions.length > 0,
        activeUsers: active,
        shippedUnits: shipped,
        licensedUnits: licensed,
        retentionRate: shipped > 0 ? active / shipped : 0,
        versions: versionRows,
        topPhones: phones.slice(0, 5),
        phoneCount: phones.length,
        appBonusPerMonth: getEcosystemAppBonus(active),
        history: history
    };
}

// Bahasa Indonesia: "rb" (ribu) / "jt" (juta). Bahasa lain: "K" / "M".
export function formatUsers(n) {
    n = Math.round(n || 0);
    var idLang = false;
    try { idLang = LanguageService.getLang() === 'id'; } catch (e) {}
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + (idLang ? ' jt' : 'M');
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + (idLang ? ' rb' : 'K');
    return String(n);
}
