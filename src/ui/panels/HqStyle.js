// FILE: src/ui/panels/HqStyle.js  (REPLACE — v2027.64b: fade hanya saat pindah tab, tidak berkedip saat render ulang)
// Gaya tab HQ (Kantor, Ringkasan, Tim, Bursa, Bank, Investasi, Riwayat): lebih lega, mudah disentuh, enak dipandang.
// CSS disuntik SEKALI dari sini (pola yang sama dengan ExchangePanel/CampusOverlay), jadi style.css, density.css
// dan panel lain TIDAK perlu diubah. Selektor memakai "html:root .hq-body ..." agar menang atas mode compact
// (density.css) tanpa !important. Semua warna memakai variabel tema (gelap/terang + aksen) yang sudah ada.
var STYLE_ID = 'hq-style';

var CSS = [
/* ============ BAR TAB: sticky, 1 tab aktif berlabel, sisanya ikon (tidak pernah terpotong) ============ */
'.hq-tabs-wrap{position:sticky;top:0;z-index:6;margin:-8px -8px 10px;padding:8px 8px 8px;',
    'background:var(--bg-0);}',
'@supports (background:color-mix(in srgb,red 10%,transparent)){',
    '.hq-tabs-wrap{background:color-mix(in srgb,var(--bg-0) 88%,transparent);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}}',
'html[data-perf="lite"] .hq-tabs-wrap{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--bg-0);}',
'html:root .hq-tabs{display:flex;gap:2px;margin:0;padding:4px;background:var(--bg-2);',
    'border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-sm);}',
'html:root .hq-tabs .hq-tab{flex:1 1 0;min-width:0;min-height:42px;height:42px;padding:0 4px;display:inline-flex;',
    'align-items:center;justify-content:center;gap:6px;border:0;border-radius:12px;background:transparent;',
    'box-shadow:none;color:var(--text-tertiary);font:inherit;font-size:12.5px;font-weight:700;letter-spacing:-.005em;',
    'cursor:pointer;-webkit-tap-highlight-color:transparent;',
    'transition:background .18s ease,color .18s ease,transform .12s ease;}',
'.hq-tab svg{flex:0 0 auto;width:19px;height:19px;display:block;}',
'.hq-tab-label{display:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}',
'html:root .hq-tabs .hq-tab.active{flex:0 0 auto;max-width:62%;padding:0 14px 0 12px;background:var(--accent-soft);',
    'color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent-soft);}',
'.hq-tab.active .hq-tab-label{display:inline;}',
'html:root .hq-tabs .hq-tab:active{transform:scale(.94);}',
'@media (hover:hover){html:root .hq-tabs .hq-tab:not(.active):hover{background:var(--bg-3);color:var(--text-primary);}}',
'.hq-tab:focus-visible{outline:2px solid var(--accent);outline-offset:1px;}',

/* ============ BADAN PANEL ============ */
'.hq-body{padding-bottom:12px;}',
/* fade hanya saat pindah tab/layar (.view-fresh dipasang main.js), bukan tiap render ulang akibat aksi pemain */
'.view-fresh .hq-body{animation:hqFade .2s ease-out both;}',
'@keyframes hqFade{from{opacity:0;}to{opacity:1;}}',
'@media (prefers-reduced-motion:reduce){.view-fresh .hq-body{animation:none;}}',
'html[data-perf="lite"] .view-fresh .hq-body{animation:none;}',

/* ============ RINGKASAN (ov-*) ============ */
'html:root .hq-body .ov-wrap{gap:12px;padding-bottom:4px;}',
'html:root .hq-body .ov-card,html:root .hq-body .ov-metric,html:root .hq-body .ov-qa,html:root .hq-body .ov-pulse{',
    'border-radius:18px;box-shadow:var(--shadow-sm);}',
'html:root .hq-body .ov-card{padding:16px 18px;}',

/* hero kas */
'html:root .hq-body .ov-hero{padding:18px;border-radius:20px;}',
'html:root .hq-body .ov-hero-value{margin-top:8px;font-size:clamp(30px,9.5vw,40px);line-height:1.05;}',
'html:root .hq-body .ov-hero-sub{margin-top:10px;gap:10px;}',
'html:root .hq-body .ov-split{gap:10px;margin-top:16px;}',
'html:root .hq-body .ov-stat{padding:12px 14px;border-radius:14px;}',
'html:root .hq-body .ov-stat-value{margin-top:6px;font-size:21px;}',
'html:root .hq-body .ov-runway{align-items:center;margin-top:12px;padding:9px 12px;border-radius:12px;font-size:12px;',
    'background:var(--bg-4);}',
'@supports (background:color-mix(in srgb,red 10%,transparent)){',
    'html:root .hq-body .ov-runway{background:color-mix(in srgb,var(--ov-tone,var(--text-secondary)) 12%,transparent);}}',
'html:root .hq-body .ov-runway + .ov-runway{margin-top:8px;}',

/* metrik 2x2 */
'html:root .hq-body .ov-metrics{gap:12px;}',
'html:root .hq-body .ov-metric{padding:14px 16px;}',
'html:root .hq-body .ov-metric-value{margin:10px 0 12px;font-size:clamp(26px,8vw,32px);}',
'html:root .hq-body .ov-meter{height:6px;}',
'html:root .hq-body .ov-metric-sub{display:inline-flex;align-self:flex-start;max-width:100%;margin-top:12px;padding:3px 10px;',
    'border-radius:999px;font-size:11.5px;background:var(--bg-4);}',
'@supports (background:color-mix(in srgb,red 10%,transparent)){',
    'html:root .hq-body .ov-metric-sub{background:color-mix(in srgb,var(--ov-tone,var(--accent)) 14%,transparent);}}',
'html:root .hq-body .ov-chip{width:30px;height:30px;border-radius:10px;}',

/* aktivitas live: 2 baris, tidak terpotong satu baris */
'html:root .hq-body .ov-sec-head{margin-bottom:6px;}',
'html:root .hq-body .ov-sec-title{font-size:11px;letter-spacing:.8px;}',
'html:root .hq-body .ov-feed-row{align-items:flex-start;gap:12px;padding:11px 0;font-size:13px;line-height:1.4;}',
'html:root .hq-body .ov-feed-dot{margin-top:6px;}',
'html:root .hq-body .ov-feed-time{min-width:36px;margin-top:2px;font-size:11px;}',
'html:root .hq-body .ov-feed-text{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;',
    'overflow:hidden;text-overflow:clip;}',

/* aksi cepat */
'html:root .hq-body .ov-qa-grid{gap:12px;}',
'html:root .hq-body .ov-qa{min-height:88px;gap:10px;padding:12px 6px;font-size:12.5px;}',
'html:root .hq-body .ov-qa .ov-chip{width:40px;height:40px;border-radius:13px;}',

/* sorotan publik & timeline */
'html:root .hq-body .ov-pulse{padding:13px 14px;gap:12px;}',
'html:root .hq-body .collapsible-card{border-radius:18px;margin-bottom:0;}',
'html:root .hq-body .collapsible-summary{min-height:52px;padding:0 18px;}',
'html:root .hq-body .collapsible-body{padding:0 18px 18px;}',

/* ============ TAB LAIN (Tim, Bursa, Bank, Investasi, Riwayat): kartu & baris lebih lega ============ */
'html:root .hq-body .card{padding:16px 18px;margin-bottom:12px;border-radius:18px;box-shadow:var(--shadow-sm);}',
'html:root .hq-body .card-title{margin-bottom:12px;}',
'html:root .hq-body .kpi-grid{gap:10px;margin-bottom:12px;}',
'html:root .hq-body .kpi{padding:12px 14px;border-radius:14px;}',
'html:root .hq-body .staff-list{gap:8px;}',
'html:root .hq-body .staff-row,html:root .hq-body .cand-row{min-height:60px;padding:12px 14px;border-radius:14px;}',
'html:root .hq-body .sum-row{padding:11px 0;}',
'html:root .hq-body .rg-row,html:root .hq-body .rg-pkg{padding:12px 14px;border-radius:14px;}',
'html:root .hq-body .rg-kpis{gap:10px;}',
'html:root .hq-body .rg-kpi{padding:12px 14px;border-radius:14px;}',
'html:root .hq-body .rg-btn-row{gap:8px;}',
'html:root .hq-body .ch-kpi,html:root .hq-body .ch-ev{border-radius:14px;}',
'html:root .hq-body .btn-primary,html:root .hq-body .btn-secondary,html:root .hq-body .btn-danger{',
    'min-height:44px;border-radius:12px;}',
'html:root .hq-body .chip-small{min-height:34px;}',
'html:root .hq-body .section-label{margin:18px 2px 8px;}',

/* layar sempit */
'@media (max-width:360px){',
    'html:root .hq-body .ov-card{padding:14px;}',
    'html:root .hq-body .ov-metric{padding:12px;}',
    'html:root .hq-tabs .hq-tab.active{padding:0 10px;}}',
/* layar lebar: isi tidak melebar berlebihan */
'@media (min-width:768px){.hq-body .ov-wrap{max-width:760px;margin:0 auto;}}'
].join('');

export function ensureHqStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    document.head.appendChild(st);
}
