// FILE: src/ui/office/OfficeProgress.js  (BARU — v2027.84 "Office Modern")
// Aturan PROGRESI visual Office 3D Map: murni (tanpa THREE/DOM), mudah dites.
//
// Dua sumbu yang sama persis dengan Peta Kampus (dibaca dari computePlan):
//   * LEVEL  = level ruangan (tumbuh dari exp/aktivitas pemain: staf, riset, produk, dst.)
//   * ERA    = indeks era desain (0..6) yang berasal dari TAHUN game (2000 .. 2023+)
// Satu fitur baru hanya muncul bila KEDUANYA terpenuhi, sehingga kantor tidak tiba-tiba
// futuristik di tahun 2001 dan juga tidak tetap kuno di tahun 2025 walau perusahaan sudah besar.
//
//   Era 0  2000-2002  LCD monokrom      Era 4  2015-2018  Premium
//   Era 1  2003-2006  TFT warna         Era 5  2019-2022  AI & notch
//   Era 2  2007-2010  Touchscreen       Era 6  2023+      Foldable
//   Era 3  2011-2014  Smartphone matang

export var FEATURES = {
    gallery:     { minLevel: 2, minEra: 1, nameId: 'Galeri dinding' },        // bingkai karya di dinding Work
    reception:   { minLevel: 2, minEra: 2, nameId: 'Meja resepsionis' },     // lobi kecil (HQ kecil)
    ceoLamp:     { minLevel: 1, minEra: 2, nameId: 'Lampu lantai CEO' },
    planters:    { minLevel: 3, minEra: 2, nameId: 'Taman dalam ruangan' },  // HQ sedang/besar
    ledTrim:     { minLevel: 2, minEra: 3, nameId: 'Strip LED aksen' },      // semua ruangan
    smartScreen: { minLevel: 2, minEra: 3, nameId: 'Layar pintar dinding' }, // CEO
    labRing:     { minLevel: 2, minEra: 3, nameId: 'Cincin LED Lab' },
    videoWall:   { minLevel: 2, minEra: 4, nameId: 'Video wall showroom' },
    ticker:      { minLevel: 2, minEra: 3, nameId: 'Running text bursa' },
    holoDesk:    { minLevel: 3, minEra: 5, nameId: 'Hologram meja kerja' },
    labPanels:   { minLevel: 3, minEra: 5, nameId: 'Panel data holografik Lab' }
};

export function featureOn(id, level, eraIdx) {
    var f = FEATURES[id];
    if (!f) return false;
    return (level || 0) >= f.minLevel && (eraIdx || 0) >= f.minEra;
}

// Tahap keseluruhan 0..5 (untuk ringkasan / debug): level 1..4 dan era 0..6 digabung.
export function officeStage(plan) {
    var lv = Math.max(1, Math.min(4, (plan && plan.levels && plan.levels.hq) || 1));
    var era = Math.max(0, Math.min(6, (plan && plan.eraIdx) || 0));
    return Math.max(0, Math.min(5, Math.floor((lv - 1) + era / 2)));
}

// Daftar fitur yang sudah aktif untuk (level, era) — dipakai tes & kartu info.
export function activeFeatures(level, eraIdx) {
    return Object.keys(FEATURES).filter(function (k) { return featureOn(k, level, eraIdx); });
}

// Fitur yang paling dekat terbuka berikutnya (null bila semua sudah aktif).
export function nextFeature(level, eraIdx) {
    var best = null, bestGap = 99;
    Object.keys(FEATURES).forEach(function (k) {
        if (featureOn(k, level, eraIdx)) return;
        var f = FEATURES[k];
        var gap = Math.max(0, f.minLevel - (level || 0)) + Math.max(0, f.minEra - (eraIdx || 0));
        if (gap < bestGap) { bestGap = gap; best = { id: k, minLevel: f.minLevel, minEra: f.minEra, gap: gap }; }
    });
    return best;
}

// Slot meja ruang Work (koordinat lokal). Rumus sama dengan BUILD.work di OfficeScene.js.
var COL_ORDER = [2, 3, 1, 4, 0, 5];
export function deskSlot(i, cols, rows) {
    var col, row;
    if (i < 12) { col = COL_ORDER[Math.floor(i / 2)]; row = i % 2; }
    else { col = (i - 12) % (cols || 6); row = 2 + Math.floor((i - 12) / (cols || 6)); }
    if (row >= (rows || 5)) return null;
    return { col: col, row: row, x: -5 + col * 2.0, z: -2.95 + row * 1.45 };
}

// Jumlah baris meja yang terpakai untuk kapasitas `cap`.
export function deskRows(cap) {
    if (cap <= 12) return 2;
    return Math.min(5, 2 + Math.ceil((cap - 12) / 6));
}

// Palet karya seni dinding per era (warna tetap, tidak bergantung aksen → aman saat ganti tema).
export var ART_PALETTE = [
    [0x7a8f5c, 0x9fb08a, 0x4a5a3a],     // 0 monokrom hijau
    [0x5b8fb0, 0x8fb4c8, 0xd9a54a],     // 1 TFT
    [0x4a86e0, 0xe85a6a, 0xf2c14e],     // 2 touchscreen
    [0x3d6fd0, 0x43c07a, 0xf08a4b],     // 3 smartphone matang
    [0xc9a24a, 0x2b2f3a, 0xe8dcc0],     // 4 premium
    [0x22c4e0, 0x7c5cf0, 0x0f172a],     // 5 AI
    [0x9a6bff, 0xff7ab8, 0x1c1030]      // 6 foldable
];
