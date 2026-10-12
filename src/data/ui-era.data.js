// FILE: src/data/ui-era.data.js
// ============================================================
// DATA ERA UI — konfigurasi gaya notifikasi per era.
// Dipakai oleh NotificationRenderer untuk memilih renderer.
//
// Setiap era punya: id, label, range tahun, renderer ID, dan
// metadata visual (font, warna, animasi) untuk referensi.
// ============================================================

export const UI_ERAS = [
    {
        id: 'feature_phone',
        label: 'Feature Phone (LCD Monokrom)',
        fromYear: 2000,
        toYear: 2006,
        renderer: 'classic',
        description: 'Kotak LCD abu-abu, huruf monospace, tanpa animasi.',
        font: 'monospace',
        bgColor: '#cfcfc0',
        fgColor: '#1a1a1a',
        borderColor: '#4a4a4a',
        animation: 'slide-up'
    },
    {
        id: 'touch_revolution',
        label: 'Touch Revolution (Glossy)',
        fromYear: 2007,
        toYear: 2012,
        renderer: 'glossy',
        description: 'Bubble glossy dengan highlight, sudut membulat.',
        font: 'sans-serif',
        bgColor: '#2a2a2a',
        fgColor: '#ffffff',
        borderColor: '#4a4a4a',
        animation: 'bounce-in'
    },
    {
        id: 'modern_smartphone',
        label: 'Smartphone Modern (Flat)',
        fromYear: 2013,
        toYear: 2018,
        renderer: 'flat',
        description: 'Kartu flat Material Design, ikon bulat berwarna.',
        font: 'sans-serif',
        bgColor: '#202020',
        fgColor: '#ffffff',
        borderColor: '#333333',
        animation: 'slide-fade'
    },
    {
        id: 'ai_ecosystem',
        label: 'AI & Ecosystem (Dynamic Island)',
        fromYear: 2019,
        toYear: 9999,
        renderer: 'dynamic_island',
        description: 'Pill mengambang, blur, morph saat di-tap.',
        font: 'sans-serif',
        bgColor: '#000000',
        fgColor: '#ffffff',
        borderColor: '#1a1a1a',
        animation: 'morph'
    }
];

// Cari era berdasarkan tahun
export function getEraForYear(year) {
    for (const era of UI_ERAS) {
        if (year >= era.fromYear && year <= era.toYear) return era;
    }
    return UI_ERAS[UI_ERAS.length - 1];
}

export function getEraById(id) {
    return UI_ERAS.find(e => e.id === id) || UI_ERAS[0];
}
