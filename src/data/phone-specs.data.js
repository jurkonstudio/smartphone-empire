// FILE: src/data/phone-specs.data.js
// ============================================================
// PHONE SPECS — spesifikasi visual ponsel per milestone 2000-2026.
// Dipakai PhoneMockup.js (V2.2b+) untuk render layer kondisional.
//
// Setiap milestone mendefinisikan:
//   - screen (inset, corner radius, aspect)
//   - bezel (ketebalan frame)
//   - notch / punch-hole / dynamic island
//   - home button / gesture bar
//   - kamera belakang (jumlah lensa, layout, flash, posisi)
//   - speaker (earpiece / bottom / stereo)
//   - port (charging, audio jack)
//   - material (plastic / aluminum / glass / ceramic / titanium)
//   - sideButtons (power, volume, silent switch)
//
// Field `unlockResearch` (opsional) menandakan milestone ini
// hanya muncul kalau research tertentu sudah selesai. Kalau null,
// murni gated tahun.
// ============================================================

// Skema screen: inset dalam unit viewBox "0 0 100 200" (dari PhoneMockup).
// Body diasumsikan 20-80 (lebar 60) x 8-188 (tinggi 180).
export const PHONE_SPECS = [
    // ---------- 2000-2002: Monokrom Candybar ----------
    {
        id: 'ms_mono',
        fromYear: 2000, toYear: 2002,
        eraId: 'era_lcd_mono',
        label: 'Monokrom Candybar',
        screen: {
            insetTop: 32, insetBottom: 36, insetSide: 12,
            cornerRadius: 2,
            aspect: '4:3'
        },
        bezel: 'thick',
        notch: 'none',
        homeButton: 'row',
        cameras: { rear: 0, layout: 'none', flash: false, position: 'none', bump: 'none' },
        speaker: 'earpiece',
        ports: ['charging_barrel', 'audio_jack_top'],
        sideButtons: ['power_top'],
        material: 'plastic',
        unlockResearch: null
    },

    // ---------- 2003-2004: Kamera Debut ----------
    {
        id: 'ms_camera_debut',
        fromYear: 2003, toYear: 2004,
        eraId: 'era_tft_color',
        label: 'Kamera Pertama',
        screen: {
            insetTop: 28, insetBottom: 32, insetSide: 11,
            cornerRadius: 3,
            aspect: '4:3'
        },
        bezel: 'thick',
        notch: 'none',
        homeButton: 'row',
        cameras: { rear: 1, layout: 'single', flash: false, position: 'top_center', bump: 'flush' },
        speaker: 'earpiece',
        ports: ['charging_barrel', 'audio_jack_top'],
        sideButtons: ['power_top'],
        material: 'plastic',
        unlockResearch: null
    },

    // ---------- 2005-2006: Multimedia & Camera Serius ----------
    {
        id: 'ms_multimedia',
        fromYear: 2005, toYear: 2006,
        eraId: 'era_tft_color',
        label: 'Multimedia',
        screen: {
            insetTop: 26, insetBottom: 30, insetSide: 10,
            cornerRadius: 4,
            aspect: '4:3'
        },
        bezel: 'medium',
        notch: 'none',
        homeButton: 'row',
        cameras: { rear: 1, layout: 'single', flash: true, position: 'top_center', bump: 'slight' },
        speaker: 'earpiece',
        ports: ['charging_barrel', 'audio_jack_top'],
        sideButtons: ['power_top', 'volume_side'],
        material: 'plastic',
        unlockResearch: null
    },

    // ---------- 2007-2008: Revolusi Touchscreen ----------
    {
        id: 'ms_touch_rev',
        fromYear: 2007, toYear: 2008,
        eraId: 'era_touch_revolution',
        label: 'Touchscreen Pertama',
        screen: {
            insetTop: 14, insetBottom: 30, insetSide: 8,
            cornerRadius: 6,
            aspect: '3:2'
        },
        bezel: 'medium',
        notch: 'none',
        homeButton: 'circle',
        cameras: { rear: 1, layout: 'single', flash: false, position: 'top_left', bump: 'slight' },
        speaker: 'earpiece',
        ports: ['charging_dock', 'audio_jack_bottom'],
        sideButtons: ['power_top', 'volume_side', 'silent_side'],
        material: 'aluminum',
        unlockResearch: 'layar_touch_cap'
    },

    // ---------- 2009-2010: Touch Mainstream ----------
    {
        id: 'ms_touch_mainstream',
        fromYear: 2009, toYear: 2010,
        eraId: 'era_touch_revolution',
        label: 'Touchscreen Mainstream',
        screen: {
            insetTop: 12, insetBottom: 28, insetSide: 7,
            cornerRadius: 7,
            aspect: '16:9'
        },
        bezel: 'medium',
        notch: 'none',
        homeButton: 'circle',
        cameras: { rear: 1, layout: 'single', flash: true, position: 'top_left', bump: 'slight' },
        speaker: 'earpiece',
        ports: ['charging_micro_usb', 'audio_jack_bottom'],
        sideButtons: ['power_top', 'volume_side', 'silent_side'],
        material: 'aluminum',
        unlockResearch: 'layar_touch_cap'
    },

    // ---------- 2011-2012: Maturing ----------
    {
        id: 'ms_maturing',
        fromYear: 2011, toYear: 2012,
        eraId: 'era_smartphone_modern',
        label: 'Smartphone Matang',
        screen: {
            insetTop: 11, insetBottom: 24, insetSide: 6,
            cornerRadius: 8,
            aspect: '16:9'
        },
        bezel: 'thin',
        notch: 'none',
        homeButton: 'touch_bar',
        cameras: { rear: 1, layout: 'single', flash: true, position: 'top_left', bump: 'slight' },
        speaker: 'earpiece',
        ports: ['charging_micro_usb', 'audio_jack_bottom'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'aluminum',
        unlockResearch: null
    },

    // ---------- 2013-2014: Flat Modern + Fingerprint ----------
    {
        id: 'ms_flat_modern',
        fromYear: 2013, toYear: 2014,
        eraId: 'era_smartphone_modern',
        label: 'Flat Modern',
        screen: {
            insetTop: 10, insetBottom: 22, insetSide: 5,
            cornerRadius: 9,
            aspect: '16:9'
        },
        bezel: 'thin',
        notch: 'none',
        homeButton: 'fingerprint',
        cameras: { rear: 1, layout: 'single', flash: true, position: 'top_center', bump: 'slight' },
        speaker: 'earpiece',
        ports: ['charging_micro_usb', 'audio_jack_bottom'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'aluminum',
        unlockResearch: null
    },

    // ---------- 2015-2016: Premium & Dual Camera ----------
    {
        id: 'ms_premium',
        fromYear: 2015, toYear: 2016,
        eraId: 'era_premium',
        label: 'Era Premium',
        screen: {
            insetTop: 9, insetBottom: 20, insetSide: 4,
            cornerRadius: 10,
            aspect: '16:9'
        },
        bezel: 'thin',
        notch: 'none',
        homeButton: 'touch_bar',
        cameras: { rear: 2, layout: 'horizontal', flash: true, position: 'top_left', bump: 'band' },
        speaker: 'earpiece',
        ports: ['charging_usb_c', 'audio_jack_bottom'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: null
    },

    // ---------- 2017: Notch (iPhone X) ----------
    {
        id: 'ms_notch',
        fromYear: 2017, toYear: 2017,
        eraId: 'era_premium',
        label: 'Notch Revolution',
        screen: {
            insetTop: 8, insetBottom: 14, insetSide: 4,
            cornerRadius: 12,
            aspect: '19.5:9'
        },
        bezel: 'minimal',
        notch: 'notch',
        homeButton: 'gesture_bar',
        cameras: { rear: 2, layout: 'vertical', flash: true, position: 'top_left', bump: 'square' },
        speaker: 'earpiece',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: 'fw_biometric'
    },

    // ---------- 2018: Teardrop Notch ----------
    {
        id: 'ms_teardrop',
        fromYear: 2018, toYear: 2018,
        eraId: 'era_premium',
        label: 'Teardrop Notch',
        screen: {
            insetTop: 8, insetBottom: 13, insetSide: 3,
            cornerRadius: 13,
            aspect: '19.5:9'
        },
        bezel: 'minimal',
        notch: 'teardrop',
        homeButton: 'gesture_bar',
        cameras: { rear: 2, layout: 'vertical', flash: true, position: 'top_left', bump: 'square' },
        speaker: 'earpiece',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: null
    },

    // ---------- 2019: Punch-hole + Foldable Debut ----------
    {
        id: 'ms_punch_hole',
        fromYear: 2019, toYear: 2019,
        eraId: 'era_ai_era',
        label: 'Punch-hole & Foldable',
        screen: {
            insetTop: 7, insetBottom: 11, insetSide: 3,
            cornerRadius: 14,
            aspect: '20:9'
        },
        bezel: 'minimal',
        notch: 'punch_hole_center',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_lg' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: null
    },

    // ---------- 2020: 5G Era ----------
    {
        id: 'ms_5g',
        fromYear: 2020, toYear: 2020,
        eraId: 'era_ai_era',
        label: 'Era 5G',
        screen: {
            insetTop: 6, insetBottom: 10, insetSide: 2,
            cornerRadius: 15,
            aspect: '20:9'
        },
        bezel: 'none',
        notch: 'punch_hole_center',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_lg' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: 'net_5g'
    },

    // ---------- 2021: 120Hz Era ----------
    {
        id: 'ms_120hz',
        fromYear: 2021, toYear: 2021,
        eraId: 'era_ai_era',
        label: 'Era 120Hz',
        screen: {
            insetTop: 6, insetBottom: 9, insetSide: 2,
            cornerRadius: 16,
            aspect: '20:9'
        },
        bezel: 'none',
        notch: 'punch_hole_left',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_lg' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'glass',
        unlockResearch: 'layar_hfr'
    },

    // ---------- 2022: Dynamic Island ----------
    {
        id: 'ms_dynamic_island',
        fromYear: 2022, toYear: 2022,
        eraId: 'era_foldable',
        label: 'Dynamic Island',
        screen: {
            insetTop: 5, insetBottom: 8, insetSide: 2,
            cornerRadius: 17,
            aspect: '20:9'
        },
        bezel: 'none',
        notch: 'dynamic_island',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_lg' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'titanium',
        unlockResearch: 'fw_dynamic_island'
    },

    // ---------- 2023: Refined AI ----------
    {
        id: 'ms_ai_refined',
        fromYear: 2023, toYear: 2023,
        eraId: 'era_foldable',
        label: 'AI Refined',
        screen: {
            insetTop: 5, insetBottom: 8, insetSide: 2,
            cornerRadius: 18,
            aspect: '20:9'
        },
        bezel: 'none',
        notch: 'dynamic_island',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_xl' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'titanium',
        unlockResearch: null
    },

    // ---------- 2024-2025: Tri-fold & Under-display ----------
    {
        id: 'ms_tri_fold',
        fromYear: 2024, toYear: 2025,
        eraId: 'era_foldable',
        label: 'Tri-fold & Under-display',
        screen: {
            insetTop: 5, insetBottom: 8, insetSide: 2,
            cornerRadius: 18,
            aspect: '20:9'
        },
        bezel: 'none',
        notch: 'under_display',
        homeButton: 'gesture_bar',
        cameras: { rear: 3, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_xl' },
        speaker: 'stereo',
        ports: ['charging_usb_c'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'titanium',
        unlockResearch: null
    },

    // ---------- 2026+: Future ----------
    {
        id: 'ms_future',
        fromYear: 2026, toYear: 9999,
        eraId: 'era_foldable',
        label: 'Future',
        screen: {
            insetTop: 4, insetBottom: 7, insetSide: 2,
            cornerRadius: 20,
            aspect: '21:9'
        },
        bezel: 'none',
        notch: 'under_display',
        homeButton: 'gesture_bar',
        cameras: { rear: 4, layout: 'square_array', flash: true, position: 'top_left', bump: 'square_xl' },
        speaker: 'stereo',
        ports: ['charging_usb_c_wireless'],
        sideButtons: ['power_side', 'volume_side'],
        material: 'titanium',
        unlockResearch: null,
        speculative: true
    }
];

// ============================================================
// UTIL
// ============================================================

// Cari milestone berdasarkan tahun.
export function getSpecForYear(year) {
    for (var i = 0; i < PHONE_SPECS.length; i++) {
        var s = PHONE_SPECS[i];
        if (year >= s.fromYear && year <= s.toYear) return s;
    }
    return PHONE_SPECS[PHONE_SPECS.length - 1];
}

export function getSpecById(id) {
    return PHONE_SPECS.find(function (s) { return s.id === id; }) || null;
}

// Cek apakah spec bisa muncul: tahun cocok DAN (unlockResearch null ATAU sudah selesai).
export function isSpecAvailable(spec, year, completedResearch) {
    if (!spec) return false;
    if (year < spec.fromYear || year > spec.toYear) return false;
    if (spec.unlockResearch) {
        var completed = completedResearch || [];
        if (completed.indexOf(spec.unlockResearch) === -1) return false;
    }
    return true;
}

// Cari spec yang paling cocok: yang paling baru tersedia (dari tahun ke belakang).
// Cocokkan tahun; kalau tidak ada, pakai yang tahunnya paling dekat ke belakang.
export function resolveSpec(year, completedResearch) {
    var completed = completedResearch || [];

    // Prioritas 1: milestone yang tahunnya cocok DAN researchnya terpenuhi.
    var candidates = PHONE_SPECS.filter(function (s) {
        return year >= s.fromYear && year <= s.toYear && isSpecAvailable(s, year, completed);
    });
    if (candidates.length) return candidates[candidates.length - 1];

    // Prioritas 2: milestone sebelum tahun ini yang researchnya terpenuhi.
    var past = PHONE_SPECS.filter(function (s) {
        return s.toYear < year && isSpecAvailable(s, year, completed);
    });
    if (past.length) return past[past.length - 1];

    // Fallback: milestone pertama.
    return PHONE_SPECS[0];
}

// Validasi konsistensi data (ID unik, field wajib, urutan tahun).
export function validatePhoneSpecs() {
    var issues = [];
    var ids = new Set();

    PHONE_SPECS.forEach(function (s) {
        if (ids.has(s.id)) issues.push('ID duplikat: ' + s.id);
        ids.add(s.id);

        var required = ['id', 'fromYear', 'toYear', 'screen', 'bezel', 'notch', 'cameras'];
        required.forEach(function (f) {
            if (s[f] === undefined) issues.push('Spec ' + s.id + ' tidak punya field ' + f);
        });

        if (s.fromYear > s.toYear) {
            issues.push('Spec ' + s.id + ' fromYear > toYear');
        }

        if (s.screen) {
            var scr = ['insetTop', 'insetBottom', 'insetSide', 'cornerRadius', 'aspect'];
            scr.forEach(function (f) {
                if (s.screen[f] === undefined) issues.push('Spec ' + s.id + ' screen.' + f + ' tidak ada');
            });
        }
    });

    // Cek overlap tahun antar milestone.
    for (var i = 0; i < PHONE_SPECS.length; i++) {
        for (var j = i + 1; j < PHONE_SPECS.length; j++) {
            var a = PHONE_SPECS[i];
            var b = PHONE_SPECS[j];
            if (a.fromYear <= b.toYear && b.fromYear <= a.toYear) {
                issues.push('Overlap tahun: ' + a.id + ' dan ' + b.id);
            }
        }
    }

    if (issues.length) {
        console.warn('[phone-specs.data] Ditemukan ' + issues.length + ' masalah:');
        issues.forEach(function (i) { console.warn('  - ' + i); });
    } else {
        console.info('[phone-specs.data] Validasi OK. ' + PHONE_SPECS.length + ' milestone.');
    }
    return issues;
      }
