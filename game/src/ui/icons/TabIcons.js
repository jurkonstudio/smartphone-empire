// FILE: src/ui/icons/TabIcons.js
// Set ikon SVG untuk tab, filter, dan pengurut (gaya duotone: garis 1.75 + isi lembut).
// Grid 24x24, warna ikut currentColor. Bentuk ber-class "d" = lapisan isi lembut (lihat icon-tabs.css).
// Murni data: tidak ada efek samping saat diimpor.

function P(d) { return '<path d="' + d + '"/>'; }
function D(d) { return '<path class="d" d="' + d + '"/>'; }
function DS(d) { return D(d) + P(d); }          // isi lembut + garis dengan bentuk sama
function C(cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>'; }
function DC(cx, cy, r) { return '<circle class="d" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>' + C(cx, cy, r); }
function R(x, y, w, h, r) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/>'; }
function DR(x, y, w, h, r) { return '<rect class="d" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/>' + R(x, y, w, h, r); }

export var TAB_ICONS = {
    // ---- Riset / OS ----
    cpu: DR(6, 6, 12, 12, 2.5) + R(9.5, 9.5, 5, 5, 1) +
        P('M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5'),
    wafer: DC(12, 12, 9) + P('M3.5 9h17M3.5 15h17M9 3.5v17M15 3.5v17'),
    window: DR(3, 4, 18, 16, 3) + P('M3 9h18M6.5 6.5h.01M9.5 6.5h.01M8 13l2.5 2.2L8 17.5M13 17.5h3.5'),
    factory: DS('M3 21v-9.5l6 3.8v-3.8l6 3.8V4h5a1 1 0 0 1 1 1v16Z') + P('M8 18.5h.01M12 18.5h.01M17.5 18.5h.01M17.5 8h.01'),
    sparkles: DS('M10 4.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L3 11.5l5.1-1.9Z') + P('M18.5 3v4M16.5 5h4M18 15.5v4M16 17.5h4'),
    gauge: P('M3.5 16.5a9 9 0 1 1 17 0') + D('M3.5 16.5a9 9 0 1 1 17 0Z') + DC(12, 14, 1.4) + P('M12.8 13.1 16 9.5M7 20h10'),
    pencil: DS('M4 20l1.2-4.6L16.6 4a2.12 2.12 0 0 1 3 3L8.2 18.4Z') + P('M14.5 6.2l3.3 3.3M13 20.5h7.5'),
    users: DC(9.5, 7.5, 3.5) + P('M15.5 20v-1.5a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4V20M17 4.3a3.5 3.5 0 0 1 0 6.8M21 20v-1.5a4 4 0 0 0-3-3.9'),
    blocks: DR(3.5, 13.5, 7, 7, 1.8) + DR(13.5, 13.5, 7, 7, 1.8) + DR(3.5, 3.5, 7, 7, 1.8) + DS('M17 3l3.5 3.5L17 10l-3.5-3.5Z'),
    apps: DR(3.5, 3.5, 7, 7, 2) + R(13.5, 3.5, 7, 7, 2) + R(3.5, 13.5, 7, 7, 2) + R(13.5, 13.5, 7, 7, 2),
    bug: DS('M7.5 11.5a4.5 4.5 0 0 1 9 0V15a4.5 5.5 0 0 1-9 0Z') + P('M9 8.2a3 3 0 0 1 6 0M12 11v9.5M7.5 13H4M16.5 13H20M8 18l-3 2M16 18l3 2M8.7 7.8 6.5 5.8M15.3 7.8l2.2-2'),

    // ---- Pasar ----
    pie: DS('M11 5a8 8 0 1 0 8 8h-8Z') + DS('M14 3.5a6.5 6.5 0 0 1 6.5 6.5H14Z'),
    podium: DR(9, 8, 6, 12.5, 1.2) + DR(3.5, 13, 5.5, 7.5, 1.2) + DR(15, 15, 5.5, 5.5, 1.2) + P('M2.5 20.5h19'),
    trending: D('M3 17l6-6 4 4 5-5v10.5H3Z') + P('M3 17l6-6 4 4 7-7M15 8h5v5'),
    megaphone: DS('M3.5 10v4a1.5 1.5 0 0 0 1.5 1.5h2L16.5 20V4L7 8.5H5A1.5 1.5 0 0 0 3.5 10Z') + P('M19.5 9.5a3.5 3.5 0 0 1 0 5M7.5 15.5l1.2 4.5h2.6l-1.1-4.7'),
    store: DS('M3.5 9.5 5 4.5h14l1.5 5a2.83 2.83 0 0 1-5.67 0 2.83 2.83 0 0 1-5.66 0 2.83 2.83 0 0 1-5.67 0Z') + P('M5 12v8.5h14V12M10 20.5v-5h4v5'),
    headset: P('M4 14v-2a8 8 0 0 1 16 0v2') + DR(3, 13, 4, 6, 1.6) + DR(17, 13, 4, 6, 1.6) + P('M20 19v1a2 2 0 0 1-2 2h-4'),
    orbit: DC(12, 12, 2.6) + '<ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-35 12 12)"/>' + DC(3.9, 16, 1.4),
    bag: DS('M5.5 8h13l1 12a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1Z') + P('M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5'),
    chat: DS('M4 6.5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3V13a3 3 0 0 1-3 3h-6l-4.5 4v-4H7a3 3 0 0 1-3-3Z') +
        P('M12 13.2l-3.2-3.1a1.9 1.9 0 0 1 2.7-2.7l.5.5.5-.5a1.9 1.9 0 0 1 2.7 2.7Z'),

    // ---- Produk ----
    compass: DS('M10.9 6 5.5 20.5h13L13.1 6Z') + C(12, 4.4, 1.6) + P('M8.2 14.5h7.6'),
    library: DR(3.5, 4, 4.5, 16.5, 1.2) + DR(9.5, 4, 4.5, 16.5, 1.2) + DS('M15.2 6.3l3.9-1.1 3 14.4-3.9 1.1Z'),
    receipt: DS('M6 3h12v18l-2.2-1.5L13.6 21 12 19.5 10.4 21l-2.2-1.5L6 21Z') + P('M9 8h6M9 12h6M9 16h3'),
    phone: DR(6.5, 2.5, 11, 19, 2.8) + P('M10.5 5.5h3M12 18.5h.01'),
    tablet: DR(4, 3, 16, 18, 2.8) + P('M10.5 18h3'),
    earbuds: DC(8, 7.5, 3.2) + DC(16, 7.5, 3.2) + P('M6.2 10.2v8.3a1.4 1.4 0 0 0 2.8 0v-7.6M17.8 10.2v8.3a1.4 1.4 0 0 1-2.8 0v-7.6'),
    watch: DR(6.5, 6.5, 11, 11, 3) + P('M9 6.5 9.7 3h4.6l.7 3.5M9 17.5l.7 3.5h4.6l.7-3.5M12 10v2.3l1.6 1'),
    plug: P('M9 3v4M15 3v4') + DS('M6.5 7h11v4.5a5.5 5.5 0 0 1-11 0Z') + P('M12 17v4.5'),
    headphones: P('M4 15v-3a8 8 0 0 1 16 0v3') + DR(3, 14, 4.5, 6.5, 2) + DR(16.5, 14, 4.5, 6.5, 2),

    // ---- Pengurut / filter ----
    layers: DS('M12 3l9 4.5-9 4.5-9-4.5Z') + P('M3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5'),
    calendar: DR(3.5, 5, 17, 15.5, 3) + P('M3.5 10h17M8 3v4M16 3v4'),
    coin: DC(12, 12, 9) + P('M14.6 9.3c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.7 2.7 2.1c1.7.4 2.7.9 2.7 2.1s-1.2 2-2.7 2c-1.2 0-2.2-.6-2.7-1.5M12 6v2M12 16v2'),
    timer: DC(12, 13.5, 8) + P('M12 9.5v4l2.5 1.5M9.5 2.5h5'),
    tag: DS('M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l8.1 8.1a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-8.1-8.1a1 1 0 0 1-.3-.7Z') + C(8, 8, 1.2),
    archive: DR(3, 4, 18, 4.5, 1.5) + P('M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M10 12.5h4'),
    sparkle: DS('M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z'),
    flame: DS('M12 21a6 6 0 0 0 6-6c0-3.2-2-5.3-3.2-6.8-.9-1.1-1.4-2.4-1.3-4.2C11 5.3 9.5 7 8.6 9 7.4 11.6 6 12.4 6 15a6 6 0 0 0 6 6Z') +
        P('M12 21a2.5 2.5 0 0 0 2.5-2.5c0-1.6-1.2-2.2-2.5-3.7-1.3 1.5-2.5 2.1-2.5 3.7A2.5 2.5 0 0 0 12 21Z'),
    star: DS('M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z'),
    box: DS('M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z') + P('M3.5 7.5 12 12l8.5-4.5M12 12v9'),

    // ---- Beranda ----
    target: DC(12, 12, 9) + C(12, 12, 4.8) + '<circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    news: DR(3.5, 4, 17, 16, 2.5) + P('M7 8.5h6M7 12h10M7 15.5h10'),
    pulse: P('M3 12h4l2.5-6 5 12 2.5-6H21'),

    // ---- Setelan ----
    sliders: P('M4 7h9M17 7h3M4 17h3M11 17h9') + DC(15, 7, 2.2) + DC(9, 17, 2.2),
    palette: DS('M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.5 1.9-1.5H17a4 4 0 0 0 4-4C21 6.8 17 3 12 3Z') +
        P('M7.5 11.5h.01M10 7.5h.01M14.5 7.5h.01'),
    speaker: DS('M4 9.5v5h3.5L12.5 19V5L7.5 9.5Z') + P('M16 9a4.2 4.2 0 0 1 0 6M18.6 6.4a8 8 0 0 1 0 11.2'),
    bell: DS('M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z') + P('M10 21.5h4'),
    wallet: P('M5.5 8V6.5A2.5 2.5 0 0 1 8 4h9.5') + DR(3.5, 7.5, 17, 12.5, 2.5) + P('M16.5 13.7h.01'),
    globe: DC(12, 12, 9) + P('M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z'),
    database: '<ellipse class="d" cx="12" cy="6" rx="8" ry="3"/><ellipse cx="12" cy="6" rx="8" ry="3"/>' +
        P('M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3'),
    terminal: DR(3, 4.5, 18, 15, 3) + P('M7.5 10l3 2.5-3 2.5M13 15h3.5')
};

// Penghitung kecil pada ikon (mis. "Store (3)") dipisahkan oleh IconTabs.js.
export function tabIconSvg(name) {
    var inner = TAB_ICONS[name];
    if (!inner) return '';
    return '<svg class="ti-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
}
