// FILE: src/ui/layout/UxPolish.js
// Rapi-rapi navigasi tab: tab aktif otomatis tampak (scroll ke tengah) dan tepi memudar bila masih ada tab tersembunyi.
// Berdiri sendiri: tidak mengubah panel apa pun; hanya menambah class .se-fade-l/.se-fade-r (lihat ux-polish.css).
var SEL = '.subtab-bar:not(.hq-tabs), .settings-tabs, .chip-bar';
var seen = new WeakSet();
var queued = false;

function fade(bar) {
    var max = bar.scrollWidth - bar.clientWidth;
    bar.classList.toggle('se-fade-l', bar.scrollLeft > 4);
    bar.classList.toggle('se-fade-r', max > 4 && bar.scrollLeft < max - 4);
}

function setup(bar) {
    if (seen.has(bar)) { fade(bar); return; }
    seen.add(bar);
    bar.addEventListener('scroll', function () { fade(bar); }, { passive: true });
    var on = bar.querySelector('.active, [aria-selected="true"]');
    if (on && bar.scrollWidth > bar.clientWidth) {
        bar.scrollLeft = Math.max(0, on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2);
    }
    fade(bar);
}

function scan() {
    queued = false;
    var bars = document.querySelectorAll(SEL);
    for (var i = 0; i < bars.length; i++) setup(bars[i]);
}

function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
}

function start() {
    var root = document.getElementById('app-view') || document.body;
    new MutationObserver(queue).observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', queue, { passive: true });
    queue();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
