// FILE: src/data/appstore-review.data.js  (BARU — Peninjauan App Store)
// ============================================================
// Data dasar fitur "Peninjauan App Store": developer game/aplikasi mengirim karyanya ke App Store
// milik pemain, lalu pemain menyetujui atau menolaknya. Semua uang dalam USD.
//
// Semua nama developer dan judul aplikasi di sini FIKSI (bukan merek nyata).
// Teks yang tampil ke pemain memakai kamus src/data/i18n/appstore-review.i18n.js (key asr.*).
// ============================================================

export const ASR_CONST = {
    // ---- antrean ----
    queueMax: 14,                 // batas pengiriman yang menunggu; kelebihannya ditolak otomatis oleh sistem (developer kecewa)
    deadlineMonths: 3,            // pengiriman kedaluwarsa bila tidak diputuskan sekian bulan
    expiryGoodwillHit: 2,         // goodwill turun per pengiriman yang kedaluwarsa
    historyMax: 30,               // jumlah keputusan terakhir yang disimpan
    catalogMax: 80,               // aplikasi tersimpan di state (yang lama dibuang, hitungan total tetap)
    devMax: 100,                  // developer yang diingat sistem (yang punya antrean/aplikasi tidak dibuang)

    // ---- kedatangan pengiriman (per hari, dengan peluang = laju bulanan / 30) ----
    rateBase: 0.7,                // pengiriman per bulan saat toko baru dibuka
    rateUserScale: 60000,         // laju naik dengan akar (pengguna OS aktif / skala ini)
    rateUserWeight: 0.55,
    rateMax: 7,
    rateMinYear: 2008,
    rateEraGrowth: 0.05,          // +5%/tahun sejak 2008 (ekosistem developer membesar)
    rateEraCap: 2,
    // pengaruh komisi: komisi tinggi = developer enggan mengirim
    rateCommissionBase: 0.2,
    rateCommissionSlope: 2.2,
    rateCommissionMin: 0.55,
    rateCommissionMax: 1.15,

    // ---- goodwill komunitas developer (0..100) ----
    goodwillStart: 60,
    goodwillDriftPerMonth: 1,     // kembali pelan ke nilai awal
    goodwillRateMin: 0.6,         // pengali laju pengiriman pada goodwill 0
    goodwillRateMax: 1.3,         // pada goodwill 100
    goodwillAppealSlope: 0.0012,  // daya tarik toko = 1 + (goodwill - awal) x slope (netral di goodwill awal)
    goodwillAppealMin: 0.93,
    goodwillAppealMax: 1.05,
    wrongRejectHit: 3,            // menolak aplikasi bagus
    wrongReasonHit: 1,            // menolak aplikasi bermasalah dengan alasan yang meleset
    approveBonus: 0.4,            // menyetujui aplikasi bagus
    takedownHit: 1,
    banCleanHit: 6,               // memblokir developer yang bersih
    scandalHit: 10,

    // ---- penilaian mutu ----
    lowQuality: 45,               // di bawah ini = "mutu rendah" (alasan tolak: quality)
    goodQuality: 60,              // di atas ini dan tanpa masalah = aplikasi bagus
    trustedRep: 75,               // reputasi developer untuk status tepercaya
    trustedApprovals: 3,          // minimal persetujuan bersih
    trustedFlagChance: 0.02,      // peluang developer tepercaya mengirim aplikasi bermasalah

    // ---- pemindai otomatis dan tinjauan manual ----
    scanLevels: ['off', 'basic', 'advanced'],
    scanDetect: { off: 0, basic: 0.55, advanced: 0.85 },
    scanMonthly: { off: 0, basic: 1500, advanced: 6000 },   // biaya per bulan (ikut skala perusahaan)
    scanSetup:   { off: 0, basic: 8000, advanced: 40000 },  // biaya pasang satu kali
    inspectCost: 150,             // biaya tinjauan manual per aplikasi (ikut skala)
    inspectDetect: 0.95,
    qualityNoise: 18,             // galat perkiraan mutu sebelum diperiksa (+/-)

    // ---- biaya pendaftaran developer (masuk ke kas saat diputuskan) ----
    feeSteps: [0, 25, 99, 299],   // USD per pengiriman
    feeRateDivisor: 220,          // pengali laju = 1 / (1 + fee / divisor)

    // ---- insiden aplikasi bermasalah yang lolos ----
    incidentChanceMonthly: 0.15,  // x bobot bahaya flag
    incidentEscalateMonths: 3,    // tidak ditangani sekian bulan -> skandal
    incidentStoreMalus: 0.05,     // pengurangan faktor toko per insiden aktif
    incidentMalusMax: 0.22,
    scandalFine: 20000,           // denda skandal (ikut skala perusahaan, dibulatkan)
    scandalCooldownMonths: 3,     // denda hanya dikenakan sekali per jeda ini
    scandalMalusMonths: 6,
    scandalMalus: 0.06,

    // ---- efek ke App Store (EcosystemSystem) ----
    catalogBonusPerApp: 0.004,    // tiap aplikasi aktif yang bermutu menambah belanja kotor
    catalogBonusMax: 0.15,
    junkMalusPerApp: 0.002,       // aplikasi sampah menurunkan kesan toko
    junkMalusMax: 0.1,
    factorMin: 0.7,
    factorMax: 1.2,

    // ---- umur aplikasi di katalog ----
    appLifeMin: 24,
    appLifeMax: 60,

    // ---- reputasi developer ----
    repStart: [35, 75],
    repApprovedClean: 4,
    repRejectedFlag: -10,
    repRejectedLow: -2,
    repBanned: -100
};

// Jenis developer. flagChance = peluang aplikasinya mengandung masalah; q = [min, maks] mutu dasar.
export const ASR_DEV_TYPES = {
    indie:  { id: 'indie',  weight: 46, q: [30, 85], flagChance: 0.10, feeMult: 1 },
    studio: { id: 'studio', weight: 30, q: [45, 90], flagChance: 0.07, feeMult: 1 },
    corp:   { id: 'corp',   weight: 12, q: [60, 95], flagChance: 0.03, feeMult: 1 },
    shady:  { id: 'shady',  weight: 12, q: [15, 65], flagChance: 0.62, feeMult: 1 }
};
export const ASR_DEV_TYPE_IDS = ['indie', 'studio', 'corp', 'shady'];

// Masalah tersembunyi pada sebuah aplikasi. danger = bobot peluang menjadi insiden (0..1).
export const ASR_FLAGS = {
    malware:   { id: 'malware',   danger: 1.0, reason: 'security' },
    privacy:   { id: 'privacy',   danger: 0.7, reason: 'security' },
    copyright: { id: 'copyright', danger: 0.6, reason: 'copyright' },
    scam:      { id: 'scam',      danger: 0.8, reason: 'policy' },
    adult:     { id: 'adult',     danger: 0.5, reason: 'content' },
    spam:      { id: 'spam',      danger: 0.3, reason: 'spam' }
};
export const ASR_FLAG_IDS = ['malware', 'privacy', 'copyright', 'scam', 'adult', 'spam'];

// Alasan penolakan yang bisa dipilih pemain. Alasan tepat = cocok dengan masalah aplikasi.
export const ASR_REASONS = ['quality', 'security', 'copyright', 'content', 'policy', 'spam'];

// Kategori. minYear = tahun paling awal; weight = peluang muncul; dev = jenis pengirim (game atau aplikasi).
export const ASR_CATEGORIES = [
    { id: 'game',      minYear: 2008, weight: 30, kind: 'game', titles: ['Block', 'Quest', 'Racer', 'Puzzle', 'Arena', 'Siege', 'Tycoon', 'Run', 'Legends', 'Rush'] },
    { id: 'social',    minYear: 2009, weight: 10, kind: 'app',  titles: ['Chatly', 'Friendzy', 'Circle', 'Buzzr', 'Pingo', 'Huddle'] },
    { id: 'tools',     minYear: 2008, weight: 16, kind: 'app',  titles: ['Toolbox', 'Cleaner', 'Scanly', 'Notely', 'Unitz', 'Flashy'] },
    { id: 'media',     minYear: 2009, weight: 12, kind: 'app',  titles: ['Tunez', 'Clipster', 'Radiox', 'Streamo', 'Beatly'] },
    { id: 'finance',   minYear: 2010, weight: 7,  kind: 'app',  titles: ['Walletix', 'Budgetly', 'Coinly', 'Paywise', 'Savr'] },
    { id: 'health',    minYear: 2011, weight: 7,  kind: 'app',  titles: ['Fitly', 'Stepz', 'Calmo', 'Sleepr', 'Vitalo'] },
    { id: 'education', minYear: 2010, weight: 8,  kind: 'app',  titles: ['Learnly', 'Lingo', 'Quizzo', 'Studyo', 'Mathy'] },
    { id: 'camera',    minYear: 2010, weight: 8,  kind: 'app',  titles: ['Snapz', 'Filtro', 'Lensly', 'Framez', 'Pixly'] },
    { id: 'ai',        minYear: 2023, weight: 14, kind: 'app',  titles: ['Mindly', 'Draftr', 'Sage', 'Echo', 'Promptly'] }
];

export const ASR_MODELS = ['free', 'paid', 'freemium', 'subscription'];

// Bahan nama (fiktif). Nama developer = depan + belakang; judul aplikasi = kata sifat + judul kategori.
export const ASR_NAME_PARTS = {
    devFirst: ['Nova', 'Pixel', 'Orbit', 'Lumen', 'Quark', 'Zenith', 'Ember', 'Cobalt', 'Mango', 'Tundra', 'Helix', 'Pebble',
        'Sparrow', 'Maple', 'Vertex', 'Cinder', 'Atlas', 'Pulse', 'Bamboo', 'Crimson', 'Indigo', 'Falcon', 'Saffron', 'Nimbus'],
    devLast: ['Labs', 'Works', 'Studio', 'Games', 'Soft', 'Forge', 'Digital', 'Interactive', 'Apps', 'Collective', 'Systems', 'Workshop'],
    appAdj: ['Super', 'Mega', 'Tiny', 'Rapid', 'Neo', 'Pro', 'Happy', 'Lucky', 'Hyper', 'Smart', 'Pocket', 'Cosmic', 'Zen', 'Turbo']
};

export function getAsrCategory(id) {
    for (var i = 0; i < ASR_CATEGORIES.length; i++) if (ASR_CATEGORIES[i].id === id) return ASR_CATEGORIES[i];
    return null;
}
