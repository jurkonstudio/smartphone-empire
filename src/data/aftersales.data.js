// FILE: src/data/aftersales.data.js  (BARU — layanan pasca-jual)
// Konfigurasi garansi, pusat servis, dukungan update OS, dan insiden cacat massal.
// Semua angka dipusatkan di sini supaya mudah diseimbangkan.

export const AS_SCALE_BASE = 30000;   // pendapatan 3 bulan rata-rata yang dianggap "skala 1" (sama dengan kanal distribusi)
export const AS_SCALE_MAX = 300;

// Pilihan garansi (bulan) -> pengaruh ke permintaan produk baru.
export const WARRANTY_OPTIONS = [
    { months: 6,  demand: 0.985 },
    { months: 12, demand: 1.0 },
    { months: 24, demand: 1.035 }
];
export const WARRANTY_DEFAULT = 12;
export const OS_YEARS_MIN = 1;
export const OS_YEARS_MAX = 5;
export const OS_YEARS_DEFAULT = 2;
export const POLICY_LOCK_MONTHS = 3;     // jeda antar perubahan garansi per produk

// Tingkat pusat servis.
//  capacityPct : bagian unit dalam garansi yang bisa ditangani per bulan
//  costMult    : pengali biaya per klaim (mitra lebih mahal per klaim)
//  satCap      : batas atas kepuasan layanan (0–100)
//  setup       : biaya pasang dasar (dikali akar skala perusahaan)
//  monthlyBase / perUnit : biaya tetap bulanan = dasar + perUnit x jumlah unit dalam garansi
export const SERVICE_LEVELS = [
    {
        id: 'partner', unlock: 2000, setup: 0, monthlyBase: 0, perUnit: 0, capacityPct: 0.010, costMult: 1.30, satCap: 70,
        name: { id: 'Mitra Servis Pihak Ketiga', en: 'Third-party Service Partner' },
        desc: {
            id: 'Servis dititipkan ke mitra. Tanpa biaya tetap, tetapi biaya per klaim paling mahal dan antreannya mudah menumpuk.',
            en: 'Repairs are outsourced. No fixed cost, but the highest cost per claim and queues build up easily.'
        }
    },
    {
        id: 'own', unlock: 2002, setup: 120000, monthlyBase: 15000, perUnit: 0.10, capacityPct: 0.024, costMult: 1.0, satCap: 88,
        name: { id: 'Pusat Servis Sendiri', en: 'Own Service Centers' },
        desc: {
            id: 'Pusat servis resmi milik perusahaan. Biaya tetap bulanan, kapasitas besar, kepuasan pelanggan jauh lebih baik.',
            en: 'Company-run service centers. Monthly fixed cost, large capacity, much better customer satisfaction.'
        }
    },
    {
        id: 'global', unlock: 2008, setup: 900000, monthlyBase: 90000, perUnit: 0.22, capacityPct: 0.050, costMult: 0.82, satCap: 100,
        name: { id: 'Jaringan Servis Global', en: 'Global Service Network' },
        desc: {
            id: 'Jaringan servis di banyak negara dengan layanan tukar unit cepat. Mahal, tetapi tahan lonjakan klaim dan paling hemat per klaim.',
            en: 'A multi-country service network with fast unit exchange. Expensive, but absorbs claim surges and is cheapest per claim.'
        }
    }
];

export function getServiceLevel(id) {
    for (var i = 0; i < SERVICE_LEVELS.length; i++) if (SERVICE_LEVELS[i].id === id) return SERVICE_LEVELS[i];
    return null;
}

// Tingkat kerusakan dasar per tahun menurut era (pecahan unit yang diklaim per tahun, sebelum pengali kualitas).
export const BASE_ANNUAL_FAILURE = [
    { year: 2000, v: 0.045 },
    { year: 2007, v: 0.080 },
    { year: 2013, v: 0.075 },
    { year: 2019, v: 0.070 },
    { year: 2030, v: 0.065 }
];
export function baseFailureAt(yearFrac) {
    var t = BASE_ANNUAL_FAILURE;
    if (yearFrac <= t[0].year) return t[0].v;
    for (var i = 1; i < t.length; i++) {
        if (yearFrac <= t[i].year) {
            var a = t[i - 1], b = t[i], k = (yearFrac - a.year) / (b.year - a.year);
            return a.v + (b.v - a.v) * k;
        }
    }
    return t[t.length - 1].v;
}

export const FOLDABLE_FORMS = ['ff_fold', 'ff_flip_fold', 'ff_tri_fold'];
export const FOLDABLE_FAILURE_MULT = 1.5;

// Biaya klaim: bagian dari biaya produksi per unit (campuran servis ringan dan tukar unit) + biaya penanganan.
export const CLAIM_COST_UNIT_FRACTION = 0.33;
export const CLAIM_HANDLING_COST = 3;

// Dukungan update OS: biaya per unit-bulan = faktor x biaya produksi x (tahun dukungan - 1).
export const OS_SUPPORT_COST_FACTOR = 0.0006;

// Insiden cacat massal (batch cacat). Pemain memutuskan: recall, kampanye servis gratis, atau abaikan.
export const INCIDENT = {
    minUnitsInForce: 500,
    baseChancePerMonth: 0.016,
    maxChancePerMonth: 0.06,
    severities: [
        { id: 1, affected: 0.03 },
        { id: 2, affected: 0.06 },
        { id: 3, affected: 0.10 }
    ],
    durationMonths: 3,      // klaim akibat cacat tersebar selama beberapa bulan
    decideMonths: 2,        // batas waktu keputusan sebelum dianggap diabaikan
    recallCostFraction: 0.09,    // x biaya produksi per unit dalam garansi
    campaignCostFraction: 0.045,
    campaignResidual: 0.40,      // sisa klaim yang tetap terjadi setelah kampanye servis
    reputationPerSeverity: 0.5,  // penalti reputasi bila diabaikan (per tingkat)
    sentimentPerSeverity: 2,
    stigmaPerSeverity: 0.06,     // pengurang permintaan produk saat diabaikan
    stigmaMonths: 4,
    recallRepBonus: 0.3,
    campaignRepBonus: 0.1
};
