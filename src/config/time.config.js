// FILE: src/config/time.config.js
// Konfigurasi tunggal sistem waktu. Ubah di sini tanpa menyentuh logika.
export const TIME_CONFIG = {
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

    // Laju waktu: 1 hari game = 60 detik nyata pada kecepatan 1x
    realSecondsPerGameDay: 60,

    // Batas delta antar frame (mencegah lompatan waktu besar)
    maxDeltaSeconds: 0.25,

    // Pilihan kecepatan simulasi
    speedOptions: [1, 2, 5, 10],
    defaultSpeed: 1,
    startPaused: true,

    // Throttle emit event time:tick (ms)
    tickEmitIntervalMs: 250
};
