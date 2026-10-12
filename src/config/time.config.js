// ============================================================
// Konfigurasi Sistem Waktu Simulasi
// Semua satuan waktu menggunakan nilai integer untuk konsistensi.
// realSecondsPerGameDay = 60 berarti 1 hari game = 60 detik nyata
// pada kecepatan 1x.
// ============================================================
export const TIME_CONFIG = {
    // Tanggal mulai permainan
    startYear: 2000,
    startMonth: 1,
    startDay: 1,
    startHour: 8,
    startMinute: 0,

    // Model kalender sederhana (konsisten & prediktabel)
    daysPerMonth: 30,
    monthsPerYear: 12,
    hoursPerDay: 24,
    minutesPerHour: 60,

    // Laju waktu: 1 hari game = 60 detik nyata pada 1x
    realSecondsPerGameDay: 60,

    // Batas delta per frame (menghindari lompatan waktu besar)
    maxDeltaSeconds: 0.25,

    // Pilihan kecepatan yang tersedia (0 = pause, ditangani terpisah)
    speedOptions: [1, 2, 5, 10],
    defaultSpeed: 1,
    startPaused: true,

    // Interval minimum antar event time:tick (ms) untuk hemat CPU
    tickEmitIntervalMs: 250
};
