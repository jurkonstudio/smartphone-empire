// FILE: src/systems/OsAdoptionModel.js  (BARU)
// ============================================================
// Model adopsi OS — berapa banyak pengguna yang memakai OS kita.
//
// Sumber data: produk yang memakai OS sendiri (config.osOptionId = 'own:<versionId>').
//   - shipped = unit terjual (product.totalSold) dari produk ber-OS sendiri.
//   - active  = shipped x retensi versi. Versi terbaru paling banyak dipakai,
//               versi lama ditinggalkan pengguna.
//
// Integrasi ke sistem game:
//   - OSSystem menambah aplikasi pihak ketiga tiap bulan sebanding dengan
//     jumlah pengguna aktif (getEcosystemAppBonus).
//   - Riwayat bulanan disimpan di data.os.adoption.history untuk grafik tren.
//
// Fungsi di file ini murni (tanpa DOM / bus), jadi mudah dites.
// ============================================================

export const ADOPTION_CONFIG = {
    historyMax: 60,                 // jumlah bulan riwayat yang disimpan
    retention: {
        current: 0.92,              // versi terbaru
        previous: 0.60,             // satu versi sebelumnya
        older: 0.30                 // versi lebih lama
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

export function getEcosystemAppBonus(activeUsers) {
    var n = Math.floor((activeUsers || 0) / ADOPTION_CONFIG.appsUsersPerBonus);
    return Math.min(ADOPTION_CONFIG.appsBonusMax, Math.max(0, n));
}

// Menghitung adopsi dari state game. Tidak mengubah data.
export function computeOsAdoption(data) {
    var os = (data && data.os) || {};
    var versions = Array.isArray(os.versions) ? os.versions : [];
    var currentId = os.currentVersionId || (versions.length ? versions[versions.length - 1].id : null);
    var products = (data && data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];

    var byVersion = {};
    versions.forEach(function (v) {
        byVersion[v.id] = {
            id: v.id,
            versionString: v.versionString,
            tier: getVersionTier(versions, currentId, v.id),
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
            var act = Math.round(sold * ADOPTION_CONFIG.retention[tier]);
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
            tier: e.tier,
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

export function formatUsers(n) {
    n = Math.round(n || 0);
    if (n >= 1000000) return (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + ' jt';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + ' rb';
    return String(n);
}
