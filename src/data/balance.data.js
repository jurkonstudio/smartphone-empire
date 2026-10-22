// FILE: src/data/balance.data.js
// Semua angka balancing di sini — ubah tanpa menyentuh logika.
// v2027.2a — tambah market.marketUnitsByYear + avgPriceByYear + othersShareByYear.

export const BALANCE = {
    startingCash: {
        santai: 200000,
        normal: 100000,
        sulit:   50000
    },

    starterResearch: [
        'layar_mono',
        'cam_vga',
        'bat_liion',
        'chip_single',
        'net_gsm'
    ],

    difficultyMultiplier: {
        santai: { expense: 0.8, competitorAggression: 0.7, taxRate: 0.12 },
        normal: { expense: 1.0, competitorAggression: 1.0, taxRate: 0.15 },
        sulit:  { expense: 1.3, competitorAggression: 1.4, taxRate: 0.20 }
    },

    monthly: { rentHQ: 5000, utilities: 500, baseAdmin: 300 },

    salary: { engineer: 2500, designer: 2300, marketer: 2000 },

    recruitCost: { engineer: 2000, designer: 1800, marketer: 1500 },

    teamCap: { engineer: 20, designer: 20, marketer: 20 },

    taxRate: 0.15,

    loans: [
        { id: 'small',  label: 'Pinjaman Kecil',  principal:  50000, monthlyInterestRate: 0.03, termMonths: 12 },
        { id: 'medium', label: 'Pinjaman Sedang', principal: 100000, monthlyInterestRate: 0.04, termMonths: 18 },
        { id: 'large',  label: 'Pinjaman Besar',  principal: 200000, monthlyInterestRate: 0.05, termMonths: 24 }
    ],

    gameOverNegativeMonths: 2,
    burnRateWarnThreshold: 2,

    maxLogEntries: 100,
    maxMilestones: 200,

    questRewards: {
        first_start_research: { cash: 2000, reputation: 1 },
        first_recruit:        { cash: 1500, reputation: 0 },
        first_product:        { cash: 5000, reputation: 3 }
    },

    // ============================================================
    // TEAM
    // ============================================================
    team: {
        candidatePoolSize: 10,
        langQuota: 0.4,
        onboardingHours: 24,
        poolRefreshDays: 30,

        skillWeightsByYear: {
            early:    { 1: 0.55, 2: 0.30, 3: 0.12, 4: 0.03, 5: 0.00 },
            mid:      { 1: 0.35, 2: 0.35, 3: 0.20, 4: 0.08, 5: 0.02 },
            late:     { 1: 0.20, 2: 0.30, 3: 0.30, 4: 0.15, 5: 0.05 },
            modern:   { 1: 0.15, 2: 0.25, 3: 0.30, 4: 0.20, 5: 0.10 }
        },

        traitSalaryBonus: {
            fast_learner: 0,
            productive:   0.10,
            team_player:  0.05,
            innovative:   0.15,
            loyal:        -0.05,
            demanding:    0.25,
            specialist:   0.20,
            mentor:       0.15
        },

        signingBonusMult: 0.6,
        severanceMonths: 2,

        moraleStart: 75,
        moraleMax: 100,
        moraleMin: 0,
        moraleDecayPerMonth: 2,
        moraleFromExtraPay: 15,

        skillProgressPerMonth: 1.5,
        skillFastLearnerBonus: 0.5,
        skillMentorBonus: 0.25,

        engineer: {
            researchSpeedPerEngineer: 0.08,
            maxResearchSpeed: 2.5,
            researchSlotPer2Engineers: 0.5,
            maxResearchSlots: 3,
            osDevSpeedPerEngineer: 0.06,
            maxOsDevSpeed: 2.0
        },
        designer: {
            productDevSpeedPerDesigner: 0.10,
            maxProductDevSpeed: 3.0,
            qualityBonusPerDesigner: 0.5,
            maxQualityBonus: 15
        },
        marketer: {
            marketingBonusPerMarketer: 0.10,
            maxMarketingBonus: 2.0
        },

        minStaffForFullBonus: 1,
        maxStaffBonusScale: 1.5
    },

    research: {
        baseSlots: 1,
        perEngineerSlots: 0.5,
        maxSlots: 3,
        baseSpeed: 1.0,
        perEngineerSpeed: 0.08,
        maxSpeedMultiplier: 2.5,
        refundPercent: 0.5
    },

    os: {
        baseFeatureSlots: 3,
        perEngineerFeatureSlots: 0.33,
        maxFeatureSlots: 8,
        baseSpeed: 1.0,
        perEngineerSpeed: 0.06,
        maxSpeedMultiplier: 2.0,
        baseBugChancePerDay: 0.02,
        appGrowthPerMonth: 5,
        appGrowthPerReputation: 0.5,
        appGrowthPerStability: 0.1,
        maxApps: 2000,
        refundPercent: 0.5,
        initialVersion: 'v1.0',
        minorVersionMax: 9,
        majorVersionStart: 1
    },

    // ============================================================
    // R&D BERKELANJUTAN (v2028.36)
    // Riset dasar membuka teknologi; R&D lanjutan menaikkan LEVEL teknologi
    // tanpa batas akhir semu. Pasar punya "standar teknologi" yang naik tiap
    // tahun, jadi produk yang memakai riset lama perlahan terasa usang.
    // ============================================================
    rnd: {
        maxLevel: 20,
        benchmarkPerYear: 0.5,          // standar level teknologi pasar naik 0.5/tahun
        capPerCompletedNode: 2,         // batas level = 2 + 2 x riset dasar selesai di kategori
        capBase: 2,
        capYearBase: 3,                 // batas level juga dibatasi zaman: 3 + 0.9 x (tahun-2000)
        capYearPerYear: 0.9,
        baseCost: { display: 15000, camera: 15000, battery: 12000, chip: 20000, network: 14000 },
        costGrowth: 1.32,
        yearCostInflation: 0.03,
        baseDays: 12,
        daysGrowth: 1.10,
        maxDays: 120,
        slotsBase: 1,                   // slot R&D lanjutan (terpisah dari slot riset dasar)
        engineersPerExtraSlot: 5,
        maxSlots: 3,
        statPerLevel: 0.6,              // bonus stat produk per level
        statCap: 10,
        edge: { perLevel: 0.025, min: 0.88, max: 1.30 },
        buzz: {
            perNode: 6, perTier: 3,     // riset dasar selesai
            perRefineBase: 5, perRefineLevel: 0.6,
            osPlatformBase: 5, osPlatformPerLevel: 0.5,
            max: 60, decayPerMonth: 0.80,
            demandPerPoint: 0.0035, maxDemandBonus: 0.20,
            reputationPerLevel: 0.15, reputationPerNode: 0.3
        },
        os: {
            maxLevel: 20,
            baseCost: 20000, costGrowth: 1.30, yearCostInflation: 0.03,
            baseDays: 14, daysGrowth: 1.10, maxDays: 120,
            statPerLevel: 1.0,
            capBase: 3, capPerFeature: 1,
            licenseGrowthPerYear: 1.0, licenseGrowthCap: 20
        }
    },

    products: {
        baseMarketDemand: {
            feature_phone:     5000,
            touch_revolution:  25000,
            modern_smartphone: 80000,
            ai_ecosystem:      200000
        },
        weights: { quality: 1.6, price: 1.2, reputation: 0.8, marketing: 0.6, os: 1.0, trend: 0.7 },
        refs:    { quality: 60, price: 150, reputation: 50, os: 60 },
        lifecycle: {
            riseDays: 60, peakDays: 120, declineDays: 200, deadDays: 365,
            riseMult: 0.7, peakMult: 1.0, declineMult: 0.5, deadMult: 0.1
        },
        warehouseCostPerUnitPerDay: 0.02,
        productionSetupCost: 2000,
        // Jeda hari produksi manual: baseDays + floor(qty / unitsPerExtraDay), maks maxDays
        manualRestock: { baseDays: 2, unitsPerExtraDay: 2500, maxDays: 10 },
        dailyNoise: 0.09,
        discontinueDiscountPercent: 0.6,
        reviewThresholds: { excellent: 85, good: 70, average: 50, poor: 30, bad: 0 },
        reputationPerReviewPoint: 0.4,
        maxActiveProducts: 5,

        autoRestock: {
            defaultEnabled: false,
            defaultThresholdPercent: 20,
            defaultCooldownDays: 7,
            maxStockMultiplier: 2.0,
            minOrderQty: 100,
            warnIntervalDays: 3
        }
    },

    market: {
        startingReputation: 10,
        maxReputation: 100,
        minReputation: 0,
        baseCompetitorCount: 3,
        competitorAggressionMultiplier: { santai: 0.7, normal: 1.0, sulit: 1.4 },
        trendsByEra: {
            feature_phone:    { camera: 0.3, battery: 0.5, screen: 0.2, performance: 0.2, design: 0.4 },
            touch_revolution: { camera: 0.5, battery: 0.4, screen: 0.6, performance: 0.5, design: 0.6 },
            modern_smartphone:{ camera: 0.7, battery: 0.6, screen: 0.5, performance: 0.8, design: 0.5 },
            ai_ecosystem:     { camera: 0.6, battery: 0.7, screen: 0.5, performance: 0.9, design: 0.5 }
        },
        trendVariationPerMonth: 0.05,

        // [v2027.2a] Pangsa pasar brand kecil di luar competitor tracked.
        // Dipakai untuk hitung "Others" di MarketSystem.
        othersShareByYear: {
            2000: 0.25, 2005: 0.22, 2010: 0.25, 2015: 0.28,
            2020: 0.26, 2024: 0.30, 2026: 0.30
        },

        // [v2027.2a] Ukuran pasar ponsel global per bulan (unit).
        // Dipakai sebagai anchor revenue kompetitor.
        marketUnitsByYear: {
            2000: 30000000, 2005: 60000000, 2010: 120000000,
            2015: 130000000, 2020: 110000000, 2024: 120000000, 2026: 125000000
        },

        // [v2027.2a] Harga rata-rata ponsel global (USD).
        avgPriceByYear: {
            2000: 200, 2005: 150, 2010: 220, 2015: 280, 2020: 320, 2026: 350
        },

        // [v2027.4] FIX pangsa pasar 0%: skala penjualan pemain (permintaan
        // dasar ~4.200 unit/hari/produk di 2000) jauh lebih kecil daripada
        // ukuran pasar global (~30 juta unit/bulan), sehingga pangsa pemain
        // selalu ~0,00x%. Pendapatan pemain kini dikonversi ke skala pasar
        // saat menghitung pangsa. referenceShare = pangsa yang dicapai bila
        // pemain menjual tepat sebesar permintaan dasar pasar sebulan penuh.
        // Naikkan nilainya agar lebih mudah bersaing, turunkan agar lebih sulit.
        playerShareScale: {
            enabled: true,
            referenceShare: 0.20, // [v2027.5] 0.10 -> 0.20: kalibrasi simulasi 10 th (default ~6%, agresif ~52% di th-10)
            smoothMonths: 3,      // rata-rata bergerak agar grafik tidak liar
            maxShare: 0.70
        }
    },

    // [v2027.3] Parameter efek makro-ekonomi dunia nyata (lihat core/MacroModel.js).
    macro: {
        cycleElasticity: 0.045,        // 1 poin PDB di bawah tren -> permintaan -4.5%
        cycleMin: 0.80,
        cycleMax: 1.12,
        priceCycleSensitivity: 0.06,   // resesi -> konsumen lebih sensitif harga
        wagePassThrough: 0.6,          // porsi pertumbuhan pendapatan riil yang masuk ke upah
        priceIncomePassThrough: 0.5,   // porsi pertumbuhan pendapatan riil yang masuk ke harga referensi
        basePriceRef: 150,             // harga referensi awal 2000 (USD)
        rateBase: 0.8,                 // faktor bunga pinjaman = rateBase + ratePerPoint * suku bunga acuan
        ratePerPoint: 0.08,
        demandNoiseSmoothing: 0.7,     // 0 = noise harian acak penuh, 0.9 = sangat halus
        sentimentSmoothing: 0.25,      // kecepatan sentimen publik mengejar target (0-1)
        trendPull: 0.15,               // tarikan tren pasar ke jangkar historis per bulan
        trendNoise: 0.02,              // gejolak acak tren per bulan
        reviewValueWeight: 0.8         // pengaruh "harga vs nilai" pada skor ulasan
    },

    marketing: { perMarketerBonus: 0.1, maxMarketingFactor: 2.5 },

    reviews: {
        initialWaveDays: 7,
        followUpDays: 30,
        maxReviewsInFeed: 30,
        perDayChance: 0.15
    },

    competitors: {
        playerPressureMultiplier: 0.4,
        aiResearchTierPerYear: 0.3,
        aiResearchCostScale: 0.9,
        aiReleaseIntervalMonths: 8,
        aiReactionSensitivity: 0.3,

        // [v2027.4] Tekanan kompetitor ke penjualan produk pemain.
        // Sebelumnya competitorPressure di-set 0.2 saat rilis dan tidak pernah
        // berubah, jadi kompetitor tidak pernah benar-benar bersaing.
        pressure: {
            base: 0.10,        // tekanan minimum dari 'pasar ramai'
            gainPerShare: 2.0, // pangsa kompetitor x kesenjangan kualitas x ini
            tierToQuality: 20, // tier 1-5 -> skor kualitas 20-100
            tierOffset: 10,
            gapDivisor: 40,
            maxGap: 1.5,
            maxPressure: 1.5   // competitorF minimum = 1/(1+1.5) = 0.4
        }
    },

    feedback: {
        initialSentiment: 50,
        sentimentWeights: {
            quality:    0.25,
            price:      0.15,
            reputation: 0.20,
            bugPenalty: 0.15,
            viralBoost: 0.25
        },
        aspectWeights: {
            design:      0.15,
            camera:      0.15,
            battery:     0.15,
            performance: 0.15,
            price:       0.15,
            reliability: 0.10,
            os:          0.10,
            support:     0.05
        },
        reviewsPerMonthBase: 8,
        suggestionBonus: 5,
        viralEventImpact: 0.3,

        reputationDrift: {
            pullPerMonth: 0.2,
            maxPerMonth: 2,
            minThreshold: 0.5
        }
    }
};
