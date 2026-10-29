// FILE: src/ui/icons/IconRenderer.js
// ============================================================
// IconRenderer — render icon SVG dalam wrapper duotone.
// Mode: 'duotone' (default, dengan accent bg) | 'outline' (tanpa bg)
// ============================================================

import { getIconContent } from './FeatureIcons.js';

var FALLBACK_ID = 'question';

function _resolveContent(id) {
    var content = getIconContent(id);
    if (!content) content = getIconContent(FALLBACK_ID);
    return content;
}

// Wrapper dengan soft accent background (duotone effect)
export function renderIcon(id, opts) {
    opts = opts || {};
    var content = _resolveContent(id);
    var size = opts.size || 20;
    var mode = opts.mode || 'duotone';
    var cls = 'icon-wrap' + (mode === 'outline' ? ' outline' : '');
    if (opts.className) cls += ' ' + opts.className;

    var boxSize = size + 12;
    var svg =
        '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '"' +
        ' fill="none" stroke="currentColor" stroke-width="1.75"' +
        ' stroke-linecap="round" stroke-linejoin="round">' +
        content +
        '</svg>';

    return '<span class="' + cls + '" style="width:' + boxSize + 'px;height:' + boxSize + 'px;" aria-hidden="true">' +
        svg +
        '</span>';
}

// Inline SVG — tanpa wrapper, untuk dipakai di dalam teks
export function renderIconInline(id, size) {
    var content = _resolveContent(id);
    var s = size || 16;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '"' +
        ' fill="none" stroke="currentColor" stroke-width="1.75"' +
        ' stroke-linecap="round" stroke-linejoin="round"' +
        ' style="display:inline-block;vertical-align:-3px;" aria-hidden="true">' +
        content +
        '</svg>';
}

// Wrapper besar untuk empty state / hero section
export function renderIconHero(id, size) {
    var content = _resolveContent(id);
    var s = size || 48;
    var boxSize = s + 32;
    var svg =
        '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '"' +
        ' fill="none" stroke="currentColor" stroke-width="1.5"' +
        ' stroke-linecap="round" stroke-linejoin="round">' +
        content +
        '</svg>';

    return '<span class="icon-hero" style="width:' + boxSize + 'px;height:' + boxSize + 'px;" aria-hidden="true">' +
        svg +
        '</span>';
}
