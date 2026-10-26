// FILE: src/ui/phone/TabletMockup.js  (BARU — 0.2.9) mockup SVG tablet (landscape), tanpa logika ekonomi.
var _seq = 0;
export function renderTabletMockup(open, opts) {
    opts = opts || {};
    var w = Number(opts.width) || 200;
    var h = Math.round(w * 0.72);
    var id = 'dtTab' + (++_seq);
    if (!open) {
        return '<svg viewBox="0 0 160 116" width="' + w + '" height="' + h + '" role="img" aria-label="tablet terkunci">' +
            '<rect x="6" y="8" width="148" height="100" rx="14" fill="#1c1c1e" stroke="#3a3a3c" stroke-width="2"/>' +
            '<rect x="14" y="16" width="132" height="84" rx="6" fill="#0b0b0c"/>' +
            '<text x="80" y="62" text-anchor="middle" font-size="11" fill="#8e8e93" font-family="system-ui,sans-serif">' + esc(opts.closedLabel || 'Terkunci') + '</text>' +
            '</svg>';
    }
    return '<svg viewBox="0 0 160 116" width="' + w + '" height="' + h + '" role="img" aria-label="tablet">' +
        '<defs><linearGradient id="' + id + 'b" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#2c2c2e"/><stop offset="1" stop-color="#0a0a0b"/></linearGradient>' +
        '<linearGradient id="' + id + 's" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#0a84ff"/><stop offset="1" stop-color="#5e5ce6"/></linearGradient></defs>' +
        '<rect x="4" y="6" width="152" height="104" rx="14" fill="url(#' + id + 'b)" stroke="#48484a" stroke-width="1.5"/>' +
        '<rect x="12" y="14" width="136" height="88" rx="6" fill="url(#' + id + 's)"/>' +
        '<rect x="12" y="14" width="136" height="88" rx="6" fill="#fff" opacity="0.06"/>' +
        '<rect x="30" y="30" width="46" height="46" rx="10" fill="#fff" opacity="0.22"/>' +
        '<rect x="84" y="30" width="46" height="18" rx="5" fill="#fff" opacity="0.18"/>' +
        '<rect x="84" y="54" width="46" height="22" rx="5" fill="#fff" opacity="0.12"/>' +
        '<circle cx="80" cy="108" r="1.6" fill="#48484a"/>' +
        '</svg>';
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
