// FILE: src/data/era-design.data.js
// ============================================================
// ERA-AWARE DESIGN SYSTEM
// Mendefinisikan 7 sub-era desain smartphone (finer than tech era).
// Setiap era mendefinisikan: warna bodi, form factor, gaya layar,
// tema UI wizard, dan parameter estetika.
// ============================================================

export const DESIGN_ERAS = [
    {
        id: 'era_lcd_mono',
        fromYear: 2000, toYear: 2002,
        label: 'Era LCD Monokrom',
        shortLabel: 'Monokrom',
        description: 'Layar hijau/abu monokrom, ponsel kokoh, dominasi plastik. Selain candybar sudah ada flip, slider, dan communicator.',
        screenStyle: 'monochrome',
        uiTheme: 'retro-mono',
        bodyColors: ['color_black', 'color_silver'],
        formFactors: ['ff_candybar', 'ff_flip', 'ff_slider', 'ff_communicator'],
        aesthetic: {
            primary: '#4a5a3a',
            accent: '#7a9a6a',
            bg: '#1a2015',
            text: '#c8d0b8',
            font: 'ui-monospace, "Courier New", monospace',
            borderRadius: 3,
            shadow: '0 1px 2px rgba(0,0,0,0.6)',
            pattern: 'grid'
        }
    },
    {
        id: 'era_tft_color',
        fromYear: 2003, toYear: 2006,
        label: 'Era Layar TFT Warna',
        shortLabel: 'TFT Warna',
        description: 'Layar warna pertama; candybar, flip, slider, PDA stylus, QWERTY, dan swivel bersaing.',
        screenStyle: 'color_tft',
        uiTheme: 'retro-color',
        bodyColors: ['color_black', 'color_silver', 'color_white', 'color_blue', 'color_red', 'color_orange'],
        formFactors: ['ff_candybar', 'ff_flip', 'ff_slider', 'ff_communicator', 'ff_pda', 'ff_qwerty', 'ff_swivel'],
        aesthetic: {
            primary: '#3a5a7a',
            accent: '#5aa0d0',
            bg: '#0f1822',
            text: '#d8e5f0',
            font: '-apple-system, "Segoe UI", sans-serif',
            borderRadius: 6,
            shadow: '0 2px 6px rgba(0,0,0,0.4)',
            pattern: 'dots'
        }
    },
    {
        id: 'era_touch_revolution',
        fromYear: 2007, toYear: 2010,
        label: 'Era Revolusi Touchscreen',
        shortLabel: 'Touchscreen',
        description: 'Layar sentuh kapasitif, OS glossy; keypad, QWERTY, dan layar penuh berebut pasar.',
        screenStyle: 'glossy',
        uiTheme: 'glossy',
        bodyColors: ['color_black', 'color_white', 'color_silver', 'color_blue', 'color_red', 'color_orange', 'color_graphite', 'color_teal'],
        formFactors: ['ff_candybar', 'ff_flip', 'ff_slider', 'ff_communicator', 'ff_pda', 'ff_qwerty', 'ff_swivel', 'ff_fullscreen', 'ff_touch_slider'],
        aesthetic: {
            primary: '#1a3050',
            accent: '#0a8aef',
            bg: '#0a1525',
            text: '#e8f0ff',
            font: '-apple-system, "Segoe UI", sans-serif',
            borderRadius: 12,
            shadow: '0 4px 16px rgba(10,138,239,0.35)',
            pattern: 'gloss'
        }
    },
    {
        id: 'era_smartphone_modern',
        fromYear: 2011, toYear: 2014,
        label: 'Era Smartphone Matang',
        shortLabel: 'Modern',
        description: 'Material flat, layar besar, dual-core menjadi standar.',
        screenStyle: 'flat',
        uiTheme: 'material',
        bodyColors: ['color_black', 'color_white', 'color_silver', 'color_gold', 'color_rose', 'color_mint', 'color_graphite'],
        formFactors: ['ff_flip', 'ff_slider', 'ff_qwerty', 'ff_fullscreen', 'ff_touch_slider', 'ff_bezel'],
        aesthetic: {
            primary: '#20262e',
            accent: '#4f8cff',
            bg: '#0f1218',
            text: '#eef0f5',
            font: '-apple-system, "Segoe UI", Roboto, sans-serif',
            borderRadius: 8,
            shadow: '0 2px 8px rgba(0,0,0,0.4)',
            pattern: 'flat'
        }
    },
    {
        id: 'era_premium',
        fromYear: 2015, toYear: 2018,
        label: 'Era Premium & Bezel-less',
        shortLabel: 'Premium',
        description: 'Bodi kaca & aluminium, bezel tipis, kamera ganda.',
        screenStyle: 'amoled',
        uiTheme: 'premium',
        bodyColors: ['color_black', 'color_white', 'color_gold', 'color_silver', 'color_green', 'color_midnight', 'color_rose', 'color_teal', 'color_sand'],
        formFactors: ['ff_qwerty', 'ff_fullscreen', 'ff_bezel', 'ff_edge', 'ff_popup'],
        aesthetic: {
            primary: '#1a1a1a',
            accent: '#c9a961',
            bg: '#0a0a0a',
            text: '#f0ede8',
            font: '-apple-system, "SF Pro Display", sans-serif',
            borderRadius: 10,
            shadow: '0 6px 20px rgba(201,169,97,0.2)',
            pattern: 'noise'
        }
    },
    {
        id: 'era_ai_era',
        fromYear: 2019, toYear: 2022,
        label: 'Era AI & Notch',
        shortLabel: 'AI & Notch',
        description: 'Notch / punch-hole, AI on-device, 5G, refresh rate tinggi.',
        screenStyle: 'hdr',
        uiTheme: 'modern',
        bodyColors: ['color_black', 'color_white', 'color_gold', 'color_green', 'color_red', 'color_violet', 'color_mint', 'color_midnight', 'color_orange', 'color_lavender', 'color_rose', 'color_sand'],
        formFactors: ['ff_fullscreen', 'ff_bezel', 'ff_edge', 'ff_popup', 'ff_dual', 'ff_fold', 'ff_flip_fold'],
        aesthetic: {
            primary: '#0f1420',
            accent: '#00d4ff',
            bg: '#080c14',
            text: '#ffffff',
            font: '-apple-system, "SF Pro Display", Inter, sans-serif',
            borderRadius: 12,
            shadow: '0 8px 24px rgba(0,212,255,0.25)',
            pattern: 'mesh'
        }
    },
    {
        id: 'era_foldable',
        fromYear: 2023, toYear: 9999,
        label: 'Era Foldable & Ultra',
        shortLabel: 'Foldable',
        description: 'Layar lipat, titanium, AI generatif, satelit.',
        screenStyle: 'flexible',
        uiTheme: 'futuristic',
        bodyColors: ['color_black', 'color_titanium', 'color_green', 'color_white', 'color_violet', 'color_graphite', 'color_wine', 'color_lavender', 'color_midnight', 'color_sand', 'color_teal', 'color_mint'],
        formFactors: ['ff_fullscreen', 'ff_bezel', 'ff_edge', 'ff_dual', 'ff_fold', 'ff_flip_fold', 'ff_tri_fold'],
        aesthetic: {
            primary: '#080810',
            accent: '#a855f7',
            bg: '#04040a',
            text: '#ffffff',
            font: '-apple-system, "SF Pro Display", Inter, sans-serif',
            borderRadius: 16,
            shadow: '0 12px 32px rgba(168,85,247,0.3)',
            pattern: 'aurora'
        }
    }
];

// ============================================================
// Tambahan warna bodi untuk era akhir
// ============================================================
export const EXTRA_BODY_COLORS = [
    { id: 'color_titanium', name: 'Titanium', hex: '#8a8a8a', designBonus: 10, era: 'era_foldable' }
];

// ============================================================
// Helper functions
// ============================================================
export function getDesignEraForYear(year) {
    for (const era of DESIGN_ERAS) {
        if (year >= era.fromYear && year <= era.toYear) return era;
    }
    return DESIGN_ERAS[DESIGN_ERAS.length - 1];
}

export function getDesignEraById(id) {
    return DESIGN_ERAS.find(e => e.id === id) || DESIGN_ERAS[0];
}

export function getBodyColorsForYear(year) {
    const era = getDesignEraForYear(year);
    return era.bodyColors || [];
}

export function getFormFactorsForYear(year) {
    const era = getDesignEraForYear(year);
    return era.formFactors || [];
}

export function getScreenStyleForYear(year) {
    const era = getDesignEraForYear(year);
    return era.screenStyle || 'flat';
}

export function getUiThemeForYear(year) {
    const era = getDesignEraForYear(year);
    return era.uiTheme || 'modern';
}

export function getAestheticForYear(year) {
    const era = getDesignEraForYear(year);
    return era.aesthetic || {};
}

// Cek apakah warna bodi tersedia di tahun tertentu
export function isBodyColorAvailable(colorId, year) {
    const available = getBodyColorsForYear(year);
    return available.includes(colorId);
}

// Cek apakah form factor ada di daftar era pada tahun tertentu
export function isFormFactorAvailable(ffId, year) {
    const available = getFormFactorsForYear(year);
    return available.includes(ffId);
}

// Cek apakah sebuah komponen form factor boleh dipilih untuk desain BARU di tahun tertentu:
// ada di daftar era, sudah lewat minYear, belum lewat maxYear, dan riset (jika perlu) selesai.
// maxYear hanya membatasi desain baru — produk lama yang sudah rilis tidak terpengaruh.
export function isFormFactorSelectable(ff, year, completedResearch) {
    if (!ff || ff.category !== 'form_factor') return false;
    if (typeof ff.minYear === 'number' && year < ff.minYear) return false;
    if (typeof ff.maxYear === 'number' && year > ff.maxYear) return false;
    if (ff.requiresResearch && (completedResearch || []).indexOf(ff.requiresResearch) === -1) return false;
    const list = getFormFactorsForYear(year);
    return !list.length || list.indexOf(ff.id) !== -1;
}
