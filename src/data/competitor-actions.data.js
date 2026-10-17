// FILE: src/data/competitor-actions.data.js
// ============================================================
// [v2027.5] Balance layer aksi dinamis kompetitor (CompetitorActionSystem).
// SEMUA angka balance aksi ada di file ini. Service tidak punya angka sendiri.
//
// Satuan modifier: poin pangsa ABSOLUT (0.02 = +2 poin) yang ditambahkan ke
// pangsa historis brand di CompetitorSystem.computeCompetitorPower().
// Besaran aksi dinyatakan RELATIF terhadap pangsa historis brand (relEffect),
// jadi brand kecil tidak meloncat tak wajar dan brand besar tidak datar.
// ============================================================

export const COMPETITOR_ACTIONS = {
    // ---- Batas & peluruhan modifier ----
    maxModifier: 0.05,          // batas keras absolut: +-5 poin pangsa
    maxModifierRelative: 0.30,  // dan maksimal 30% dari pangsa historis brand
    minModifierCap: 0.003,      // lantai batas untuk brand sangat kecil
    decayPerTick: 0.85,         // eksponensial per bulan; 0.85^6 = ~38% tersisa
    epsilon: 0.0005,            // di bawah ini modifier dianggap 0
    jitter: 0.30,               // variasi acak +-30% pada besar efek

    // ---- Pool aksi bulanan (rilis produk TIDAK di sini: lihat `release`) ----
    // bobot = weight x (1 + aggressionGain x (2a-1)) x (1 + pressureGain x p)
    //         x (1 + recessionGain bila resesi); a = agresivitas 0..1,
    //         p = tekanan pasar 0..1 (lihat `market`).
    pool: {
        price_cut:      { weight: 1.0, aggressionGain:  0.6, pressureGain:  1.0, recessionGain: 0.5, relEffect:  0.10, durationTicks: 4 },
        marketing_push: { weight: 1.0, aggressionGain:  0.5, pressureGain:  1.0, recessionGain: 0,   relEffect:  0.08, durationTicks: 6 },
        research:       { weight: 0.8, aggressionGain: -0.3, pressureGain:  0,   recessionGain: 0,   relEffect: -0.06, durationTicks: 3 },
        idle:           { weight: 1.5, aggressionGain: -0.7, pressureGain: -0.5, recessionGain: 0,   relEffect:  0,    durationTicks: 0 }
    },

    // ---- Rilis produk: dipicu rilis 8-bulanan CompetitorSystem ----
    // (event 'competitor:released-product'). Satu jalur, tanpa aksi pool ganda.
    release: {
        relEffect: 0.10,
        durationTicks: 6,
        researchBonus: 0.5   // x1.5 bila aksi terakhir brand = 'research'
    },

    // ---- Agresivitas 0..1 per personality (dibaca dari data brand) ----
    aggressionByPersonality: {
        aggressive: 0.85, dominant: 0.60, innovator: 0.50,
        follower: 0.40, premium: 0.35, declining: 0.20
    },
    defaultAggression: 0.5,

    // ---- Kondisi pasar (hanya angka publik: share pemain, siklus makro) ----
    market: {
        pressureRefShare: 0.15,   // share pemain >= ini -> tekanan p = 1
        recessionCycleBelow: 1.0  // demandCycle di bawah ini = resesi
    },

    // ---- Ancaman terhadap pemain ----
    threat: {
        threshold: 0.05,     // share pemain turun melewati ini -> competitor:threat
        rearmMargin: 0.01    // aktif lagi hanya bila share > threshold + margin
    },

    // ---- Log ----
    log: { notableDelta: 0.01 }   // aksi dengan |delta| >= ini masuk log game
};
