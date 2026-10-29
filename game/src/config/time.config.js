// FILE: src/config/time.config.js
// Konfigurasi tunggal sistem waktu. Kalender mengikuti kalender Gregorian.

export const TIME_CONFIG = {
    startYear: 2000,
    startMonth: 1,
    startDay: 1,
    startHour: 8,
    startMinute: 0,

    // Kalender realistis: nama bulan + jumlah hari.
    // Februari = 28 hari, otomatis jadi 29 saat tahun kabisat (dihitung di TimeSystem).
    months: [
        { name: 'Januari',   short: 'Jan', days: 31 },
        { name: 'Februari',  short: 'Feb', days: 28 },
        { name: 'Maret',     short: 'Mar', days: 31 },
        { name: 'April',     short: 'Apr', days: 30 },
        { name: 'Mei',       short: 'Mei', days: 31 },
        { name: 'Juni',      short: 'Jun', days: 30 },
        { name: 'Juli',      short: 'Jul', days: 31 },
        { name: 'Agustus',   short: 'Agu', days: 31 },
        { name: 'September', short: 'Sep', days: 30 },
        { name: 'Oktober',   short: 'Okt', days: 31 },
        { name: 'November',  short: 'Nov', days: 30 },
        { name: 'Desember',  short: 'Des', days: 31 }
    ],
    monthsPerYear: 12,
    hoursPerDay: 24,
    minutesPerHour: 60,

    // Laju waktu: 1 hari game = 60 detik nyata pada 1x
    realSecondsPerGameDay: 60,
    maxDeltaSeconds: 0.25,
    speedOptions: [1, 2, 5, 10],
    defaultSpeed: 1,
    startPaused: true,
    tickEmitIntervalMs: 250
};
