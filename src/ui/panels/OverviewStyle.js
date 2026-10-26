// FILE: src/ui/panels/OverviewStyle.js  (BARU — Overview v2)
// CSS tambahan untuk Overview. Di-inject sekali, pola sama dengan RegionalStyle.js / HqStyle.js.
// style.css tidak perlu diubah.
var STYLE_ID = 'ov2-style';
var CSS = [
    // sparkline kas di dalam hero
    '.ov-spark-wrap{margin-top:10px;height:46px}',
    '.ov-spark{width:100%;height:46px;display:block;overflow:visible}',
    '.ov-spark polyline{stroke-dasharray:1200;stroke-dashoffset:1200;animation:ov2-draw 1.1s ease-out forwards}',
    '@keyframes ov2-draw{to{stroke-dashoffset:0}}',
    // bar runway
    '.ov-runway-bar{height:5px;border-radius:99px;background:var(--bg-4,rgba(255,255,255,.08));overflow:hidden;margin-top:8px}',
    '.ov-runway-bar i{display:block;height:100%;border-radius:99px;background:var(--ov-tone,var(--info));transition:width .6s ease,background .3s}',
    // chip perhatian
    '.ov-attn{display:flex;flex-wrap:wrap;gap:6px;padding:0;background:none;border:0;box-shadow:none}',
    '.ov-attn-chip{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;',
    'font-weight:600;font-size:12px;line-height:1.2;font-family:inherit;color:var(--text-primary);cursor:pointer;min-height:32px;',
    'background:color-mix(in srgb,var(--ov-tone,var(--warn)) 12%,transparent);',
    'border:1px solid color-mix(in srgb,var(--ov-tone,var(--warn)) 45%,transparent);',
    'transition:transform .1s,background .2s}',
    '.ov-attn-chip:active{transform:scale(.97)}',
    '.ov-attn-dot{width:7px;height:7px;border-radius:50%;background:var(--ov-tone);flex:0 0 auto;animation:ov2-pulse 1.8s ease-in-out infinite}',
    '@keyframes ov2-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ov-tone) 55%,transparent)}50%{box-shadow:0 0 0 5px transparent}}',
    // aksi cepat yang sedang disorot oleh perhatian
    '.ov-qa--hot{border-color:var(--ov-tone)!important;box-shadow:0 0 0 1px color-mix(in srgb,var(--ov-tone) 35%,transparent)}',
    '.ov-qa--hot .ov-chip{animation:ov2-nudge 2.4s ease-in-out infinite}',
    '@keyframes ov2-nudge{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}',
    // feed masuk bertahap
    '.ov-feed-row{animation:ov2-in .35s ease both}',
    '.ov-feed-row:nth-child(2){animation-delay:.06s}.ov-feed-row:nth-child(3){animation-delay:.12s}',
    '@keyframes ov2-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    // kedip kecil saat angka live berubah
    '[data-ov-live].ov2-bump{animation:ov2-bump .4s ease}',
    '@keyframes ov2-bump{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}',
    '@media (prefers-reduced-motion:reduce){',
    '.ov-spark polyline,.ov-attn-dot,.ov-qa--hot .ov-chip,.ov-feed-row,[data-ov-live].ov2-bump{animation:none}',
    '.ov-spark polyline{stroke-dashoffset:0}',
    '}'
].join('');

export function ensureOverviewStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}
