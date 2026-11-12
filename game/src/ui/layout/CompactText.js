// FILE: src/ui/layout/CompactText.js
// Mode teks ringkas: ketuk teks penjelas yang dipotong (lihat compact.css) untuk membuka/menutupnya.
// Berdiri sendiri: tidak mengubah panel apa pun. ?text=full mematikan, ?text=compact menyalakan lagi.
var KEY = 'smartphone-empire:text';
var SEL = '.tl-text,.node-row-desc,.tech-node-desc,.gen-note,.rg-row-meta,.se-st-tag,.settings-row-hint,.settings-hint,' +
    '.settings-picker-hint,.settings-lang-hint,.pf-hint,.onb-hint,.map-hint,.mf-desc,.sil-row-desc,.sil-hint,.quest-desc,' +
    '.focus-quest-desc,.focus-empty-desc,.guide-sys-desc,.fab-tier-desc,.empty-desc,.empty-hint,.diff-desc,.wiz-era-desc,' +
    '.wiz-autofill-hint,.campus-row-desc,.asm-note,.asm2-note,.asm2-help-b,.recruit-need-hint,.cat2-hidden-note,' +
    '.slot-strip-hint,.news-subheadline,.tl-subtitle,.ov-hero-sub,.gen-hero-sub,.mf-hero-sub,.asm2-hero-sub,.chip-wiz-sub,' +
    '.cand-modal-trait-desc,.campus-row-meta,.auto-restock-sub,.cand-modal-note,.modal-sub,.gen-hero-meta';

function pref() {
    try {
        var q = /[?&]text=(full|compact)/.exec(location.search);
        if (q) { localStorage.setItem(KEY, q[1]); return q[1]; }
        return localStorage.getItem(KEY) || 'compact';
    } catch (e) { return 'compact'; }
}

if (pref() === 'full') {
    document.documentElement.setAttribute('data-text', 'full');
} else {
    document.addEventListener('click', function (e) {
        var el = e.target.closest && e.target.closest(SEL);
        if (!el) return;
        // Jangan ganggu tombol/tautan: hanya teks biasa yang bisa dibuka-tutup.
        if (e.target.closest('button, a, input, select, textarea, [role="button"]') && !el.contains(e.target.closest('button, a, input, select, textarea, [role="button"]'))) return;
        if (el.scrollHeight > el.clientHeight + 1 || el.classList.contains('se-open')) el.classList.toggle('se-open');
    });
}
