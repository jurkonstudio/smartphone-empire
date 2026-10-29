// FILE: src/systems/OsAdoptionModel.js  (REPLACE — v3: migrasi pengguna antar versi / update OTA)
// ============================================================
// Model adopsi OS — berapa banyak pengguna yang memakai OS kita, dan VERSI APA
// yang sedang mereka pakai sekarang.
//
// Perubahan v3 (dibanding v2):
//   v2: pengguna "terkunci" di versi bawaan ponsel → v1.0 bisa 95% selamanya,
//       versi baru selalu 0% kecuali ada ponsel baru yang membawanya.
//   v3: seperti dunia nyata (dasbor distribusi Android / iOS):
//     1. Tiap ponsel yang terjual = satu "kohort" perangkat. Perangkat yang masih
//        hidup menyusut mengikuti umur ponsel (ganti HP tiap ±3-5 tahun).
//     2. Saat versi baru rilis, update dikirim BERTAHAP (staged rollout), lalu
//        adopsinya naik membentuk kurva-S: cap × (1 − e^(−t/τ)).
//     3. cap & τ bergantung ERA (2000: update di service center → hanya ±20%;
//        2020+: update otomatis → ±92%) dan stabilitas versi (stabilitas rendah /
//        bug aktif = pengguna menunda update).
//     4. Ponsel punya MASA DUKUNGAN. Lewat masa itu perangkat tidak lagi
//        menerima versi baru ("stuck") dan jadi tanpa patch keamanan.
//     5. Pengguna bisa melompati versi (v1.0 → v1.2 langsung).
//
// Fungsi di file ini murni (tanpa DOM / bus / perubahan state) dan deterministik
// dari state game: tidak ada data baru yang perlu disimpan di save.
// Satu-satunya pengecualian: formatUsers() membaca bahasa aktif (rb/jt vs K/M).
//
// Kompatibilitas: ADOPTION_CONFIG.retention/decay, getVersionTier, getAgeFactor
// tetap diekspor. CountryMarketModel sebaiknya memakai getProductActiveUsers()
// agar total pengguna per negara sama dengan total di tab Pengguna.
// ============================================================
import { LanguageService } from '../core/LanguageService.js';

export const ADOPTION_CONFIG = {
    historyMax: 60,                 // jumlah bulan riwayat yang disimpan

    // --- dipertahankan untuk kompatibilitas (tidak dipakai model v3) ---
    retention: { current: 0.92, previous: 0.60, older: 0.30 },
    decay: { halfLifeYears: 6, ageFloor: 0.05 },

    // Perangkat yang masih dipakai dari total unit terjual.
    device: {
        base: 0.92,                 // sebagian kecil langsung ganti merek / rusak
        halfLifeYears: 4,           // tiap 4 tahun sisa perangkat aktif separuh
        floor: 0.03                 // tak pernah nol mendadak
    },

    rollout: {
        delayMonths: 0.25,          // jeda sebelum update mulai sampai (±1 minggu)
        stagedMonths: 1.5,          // fase "rollout bertahap"
        bugWindowMonths: 6,         // bug aktif menahan adopsi versi yang baru rilis
        bugPenaltyPerSeverity: 0.05,
        bugPenaltyMin: 0.6,
        curvePoints: 14
    },

    // Profil update per era (berdasarkan TAHUN RILIS versi / ponsel).
    //   cap          : porsi maksimum perangkat yang akhirnya memasang update
    //   tauMonths    : konstanta waktu kurva-S (makin kecil = makin cepat)
    //   supportYears : lama ponsel (dan versi) masih didukung sejak rilis
    //   mech         : kunci i18n mekanisme update era itu
    eras: [
        { until: 2002, cap: 0.20, tauMonths: 14,  supportYears: 2.0, mech: 'osp.users.era.0' },
        { until: 2006, cap: 0.32, tauMonths: 10,  supportYears: 2.5, mech: 'osp.users.era.1' },
        { until: 2009, cap: 0.50, tauMonths: 7,   supportYears: 2.5, mech: 'osp.users.era.2' },
        { until: 2013, cap: 0.70, tauMonths: 5,   supportYears: 3.0, mech: 'osp.users.era.3' },
        { until: 2018, cap: 0.85, tauMonths: 3.5, supportYears: 3.5, mech: 'osp.users.era.4' },
        { until: 9999, cap: 0.92, tauMonths: 2.5, supportYears: 4.0, mech: 'osp.users.era.5' }
    ],

    appsUsersPerBonus: 100000,      // setiap 100 rb pengguna aktif...
    appsBonusMax: 20                // ...menambah 1 aplikasi/bulan, maks. +20
};

// ---------- util waktu ----------
function _clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

function _monthsAt(y, m, d) {
    return (y || 2000) * 12 + ((m || 1) - 1) + (((d || 1) - 1) / 30);
}

export function getNowMonths(data) {
    var t = (data && data.time) || {};
    return _monthsAt(t.currentYear || 2000, t.currentMonth || 1, t.currentDay || 1);
}

function _releaseMonths(rel, fallback) {
    return (rel && rel.year) ? _monthsAt(rel.year, rel.month, rel.day) : fallback;
}

// ---------- helper lama (kompatibilitas) ----------
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

// ---------- profil era ----------
export function getUpdateProfile(year) {
    var eras = ADOPTION_CONFIG.eras;
    for (var i = 0; i < eras.length; i++) {
        if ((year || 2000) <= eras[i].until) {
            return { idx: i, cap: eras[i].cap, tauMonths: eras[i].tauMonths, supportYears: eras[i].supportYears, mech: eras[i].mech };
        }
    }
    var l = eras[eras.length - 1];
    return { idx: eras.length - 1, cap: l.cap, tauMonths: l.tauMonths, supportYears: l.supportYears, mech: l.mech };
}

// ---------- perangkat aktif per ponsel ----------
export function getDeviceSurvival(ageMonths) {
    var c = ADOPTION_CONFIG.device;
    var f = c.base * Math.pow(0.5, Math.max(0, ageMonths) / 12 / c.halfLifeYears);
    return Math.max(c.floor, f);
}

// Perangkat aktif dari satu produk (tidak bergantung versi OS).
// Dipakai juga oleh CountryMarketModel agar totalnya konsisten.
export function getProductActiveUsers(product, data) {
    var sold = (product && product.totalSold) || 0;
    if (sold <= 0) return 0;
    var now = getNowMonths(data);
    var t0 = _releaseMonths(product.releaseDate, now);
    return Math.round(sold * getDeviceSurvival(now - t0));
}

// ---------- parameter per versi ----------
function _versionParams(v, data, now, bugSeverity) {
    var rel = v.releasedAt;
    var relM = _releaseMonths(rel, now);
    var year = (rel && rel.year) || (data && data.time && data.time.currentYear) || 2000;
    var prof = getUpdateProfile(year);
    var stab = _clamp(Number(v.stats && v.stats.stability) || 50, 0, 100);
    var cap = prof.cap * (0.8 + 0.2 * stab / 100);
    var R = ADOPTION_CONFIG.rollout;
    if (now - relM <= R.bugWindowMonths && bugSeverity > 0) {
        cap *= Math.max(R.bugPenaltyMin, 1 - R.bugPenaltyPerSeverity * bugSeverity);
    }
    return { relM: relM, year: year, month: rel && rel.month, prof: prof, cap: cap, tau: prof.tauMonths };
}

// Porsi kohort yang sudah memasang versi ini, `startM` bulan-ke berapa update mulai tersedia.
function _uptake(p, startM, now) {
    var m = now - startM - ADOPTION_CONFIG.rollout.delayMonths;
    if (m <= 0) return 0;
    return p.cap * (1 - Math.exp(-m / p.tau));
}

function _buildCurve(p, monthsSince) {
    var R = ADOPTION_CONFIG.rollout;
    var span = _clamp(Math.ceil(p.tau * 3.2), 12, 48);
    var pts = [];
    for (var i = 0; i < R.curvePoints; i++) {
        var m = span * i / (R.curvePoints - 1);
        var mm = m - R.delayMonths;
        pts.push({ m: m, v: mm <= 0 ? 0 : p.cap * (1 - Math.exp(-mm / p.tau)) });
    }
    return { span: span, points: pts, nowM: Math.min(Math.max(monthsSince, 0), span), cap: p.cap };
}

// ---------- hitung adopsi dari state game (tidak mengubah data) ----------
export function computeOsAdoption(data) {
    var os = (data && data.os) || {};
    var now = getNowMonths(data);
    var nowYear = (data && data.time && data.time.currentYear) || 2000;
    var versions = Array.isArray(os.versions) ? os.versions : [];
    var n = versions.length;
    var currentId = os.currentVersionId || (n ? versions[n - 1].id : null);
    var curIdx = versions.findIndex(function (v) { return v.id === currentId; });
    if (curIdx === -1) curIdx = n - 1;
    var products = (data && data.products && Array.isArray(data.products.catalog)) ? data.products.catalog : [];

    var bugSeverity = 0;
    (os.bugs || []).forEach(function (b) { if (b.status === 'active') bugSeverity += (b.severity || 1); });

    var params = versions.map(function (v) { return _versionParams(v, data, now, bugSeverity); });
    var idxById = {};
    versions.forEach(function (v, i) { idxById[v.id] = i; });

    var acc = versions.map(function () { return { shipped: 0, active: 0, atLeast: 0, eligible: 0 }; });

    var shipped = 0, active = 0, licensed = 0;
    var outOfSupport = 0;          // perangkat yang sudah lewat masa dukungan ponsel
    var cannotUpdateLatest = 0;    // perangkat yang tak bisa menerima versi terbaru
    var phones = [];

    products.forEach(function (p) {
        var opt = (p.config && p.config.osOptionId) || '';
        var sold = p.totalSold || 0;
        if (opt.indexOf('own:') !== 0) {
            if (opt) licensed += sold;
            return;
        }
        var vid = opt.slice(4);
        var j = idxById[vid];
        var act = getProductActiveUsers(p, data);
        shipped += sold;
        active += act;

        if (j === undefined) {
            phones.push({ id: p.id, name: p.name, versionString: '-', shipped: sold, active: act, currentVersion: '-' });
            return;
        }

        var t0 = _releaseMonths(p.releaseDate, now);
        var pYear = (p.releaseDate && p.releaseDate.year) || nowYear;
        var supportEnd = t0 + getUpdateProfile(pYear).supportYears * 12;
        if (now > supportEnd) outOfSupport += act;

        // u[k] = porsi perangkat kohort ini yang sudah berada di versi >= k
        var u = new Array(n);
        for (var k = 0; k < n; k++) u[k] = 0;
        u[j] = 1;
        for (var k2 = j + 1; k2 < n; k2++) {
            var relM = params[k2].relM;
            if (relM > supportEnd || u[k2 - 1] <= 0) { u[k2] = 0; continue; }
            u[k2] = Math.min(u[k2 - 1], _uptake(params[k2], Math.max(relM, t0), now));
        }

        var dominant = j, best = -1;
        for (var k3 = j; k3 < n; k3++) {
            var share = u[k3] - (k3 + 1 < n ? u[k3 + 1] : 0);
            if (share > best) { best = share; dominant = k3; }
            acc[k3].active += act * share;
            acc[k3].atLeast += act * u[k3];
            acc[k3].eligible += act;   // kohort ini layak menerima versi k3 (k3 == j atau OTA)
        }
        // versi setelah masa dukungan tidak layak → eligible tidak ditambah (sudah u=0)
        for (var k4 = j + 1; k4 < n; k4++) {
            if (params[k4].relM > supportEnd) acc[k4].eligible -= act;
        }
        if (j < n - 1 && u[n - 1] <= 0 && params[n - 1].relM > supportEnd) cannotUpdateLatest += act;
        acc[j].shipped += sold;

        phones.push({
            id: p.id, name: p.name, versionString: versions[j].versionString,
            shipped: sold, active: act,
            currentVersion: versions[dominant].versionString
        });
    });

    // ---- baris per versi ----
    var rows = versions.map(function (v, i) {
        var pr = params[i];
        var a = acc[i];
        var act = Math.round(a.active);
        var ageMonths = Math.max(0, now - pr.relM);
        var isLatest = (i === curIdx);
        var status = isLatest ? 'latest' : (ageMonths > pr.prof.supportYears * 12 ? 'eol' : 'supported');
        var eligible = Math.max(0, Math.round(a.eligible));
        return {
            id: v.id,
            versionString: v.versionString,
            releaseYear: pr.year,
            releaseMonth: pr.month || 1,
            ageMonths: ageMonths,
            tier: getVersionTier(versions, currentId, v.id),
            status: status,
            ageFactor: getAgeFactor(pr.year, nowYear),
            shipped: Math.round(a.shipped),
            active: act,
            share: active > 0 ? a.active / active : 0,
            eligible: eligible,
            adopted: Math.round(a.atLeast),
            adoption: eligible > 0 ? _clamp(a.atLeast / a.eligible, 0, 1) : 0
        };
    });

    phones.sort(function (a, b) { return b.active - a.active; });

    // ---- ringkasan ----
    var hhi = 0, riskUsers = 0;
    rows.forEach(function (r) {
        hhi += r.share * r.share;
        if (r.status === 'eol') riskUsers += r.active;
    });
    var effective = hhi > 0 ? 1 / hhi : 0;
    var fragmentation = effective < 2 ? 'low' : (effective < 3.5 ? 'medium' : 'high');

    // ---- detail versi terbaru (rollout) ----
    var latest = null;
    if (n > 0 && curIdx >= 0) {
        var lp = params[curIdx];
        var lr = rows[curIdx];
        var R = ADOPTION_CONFIG.rollout;
        var since = lr.ageMonths;
        var phase = since < R.stagedMonths ? 'staged' : (lr.adoption < 0.85 * lp.cap ? 'rolling' : 'steady');
        var eta = null, reached50 = false, never50 = false;
        if (lp.cap <= 0.5) {
            never50 = true;
        } else {
            var m50 = R.delayMonths + lp.tau * Math.log(lp.cap / (lp.cap - 0.5));
            if (since >= m50) reached50 = true; else eta = m50 - since;
        }
        latest = {
            id: lr.id, versionString: lr.versionString, share: lr.share, active: lr.active,
            adoption: lr.adoption, eligible: lr.eligible, monthsSince: since, phase: phase,
            cap: lp.cap, etaMonths: eta, reached50: reached50, never50: never50,
            curve: _buildCurve(lp, since)
        };
    }

    var prof = getUpdateProfile(nowYear);
    var history = (os.adoption && Array.isArray(os.adoption.history)) ? os.adoption.history : [];

    return {
        hasOs: !!os.name && n > 0,
        activeUsers: active,
        shippedUnits: shipped,
        licensedUnits: licensed,
        retentionRate: shipped > 0 ? active / shipped : 0,
        versions: rows,
        topPhones: phones.slice(0, 5),
        phoneCount: phones.length,
        appBonusPerMonth: getEcosystemAppBonus(active),
        history: history,

        // --- BARU v3 ---
        nowYear: nowYear,
        era: { idx: prof.idx, cap: prof.cap, supportYears: prof.supportYears, mech: prof.mech },
        latest: latest,
        latestShare: latest ? latest.share : 0,
        latestAdoption: latest ? latest.adoption : 0,
        outOfSupportUsers: outOfSupport,
        cannotUpdateUsers: cannotUpdateLatest,
        securityRiskUsers: riskUsers,
        securityRiskShare: active > 0 ? riskUsers / active : 0,
        effectiveVersions: effective,
        fragmentation: fragmentation
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
