// FILE: src/ui/manufacture/MfIcons.js  (BARU)
// Ikon SVG inline untuk ringkasan Manufaktur. Gaya outline (mirip Tabler):
// stroke = currentColor, tanpa dependensi font/CDN, jadi selalu tampil (termasuk offline).
const PATHS = {
    chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.4 2.5 2.8-.6.7 2.8 2.5 1.4-1 2.7 1 2.7-2.5 1.4-.7 2.8-2.8-.6L12 21.2l-1.4-2.5-2.8.6-.7-2.8-2.5-1.4 1-2.7-1-2.7 2.5-1.4.7-2.8 2.8.6z"/>',
    factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V4h3v17z"/><path d="M3 21h18"/>',
    box: '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>'
};

export function mfIcon(name, size) {
    var s = size || 17;
    var body = PATHS[name] || '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
}
