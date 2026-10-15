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
        description: 'Layar hijau/abu monokrom, ponsel kokoh, dominasi plastik.',
        screenStyle: 'monochrome',
        uiTheme: 'retro-mono',
        bodyColors: ['color_black', 'color_silver'],
        formFactors: ['ff_candybar'],
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
        description: 'Layar warna pertama, ponsel candybar & flip, plastik berwarna.',
        screenStyle: 'color_tft',
        uiTheme: 'retro-color',
        bodyColors: ['color_black', 'color_silver', 'color_white', 'color_blue', 'color_red'],
        formFactors: ['ff_candybar', 'ff_slider', 'ff_flip'],
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
        description: 'Layar sentuh kapasitif, OS glossy, aplikasi mulai berlimpah.',
        screenStyle: 'glossy',
        uiTheme: 'glossy',
        bodyColors: ['color_black', 'color_white', 'color_silver', 'color_blue', 'color_red'],
        formFactors: ['ff_candybar', 'ff_touchscreen', 'ff_fullscreen'],
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
        bodyColors: ['color_black', 'color_white', 'color_silver', 'color_gold'],
        formFactors: ['ff_fullscreen', 'ff_bezel'],
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
        bodyColors: ['color_black', 'color_white', 'color_gold', 'color_silver', 'color_green'],
        formFactors: ['ff_bezel', 'ff_fullscreen'],
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
        bodyColors: ['color_black', 'color_white', 'color_gold', 'color_green', 'color_red'],
        formFactors: ['ff_bezel', 'ff_fullscreen'],
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
        bodyColors: ['color_black', 'color_titanium', 'color_green', 'color_white'],
        formFactors: ['ff_foldable', 'ff_fullscreen'],
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

// Cek apakah form factor tersedia di tahun tertentu
export function isFormFactorAvailable(ffId, year) {
    const available = getFormFactorsForYear(year);
    return available.includes(ffId);
      }
