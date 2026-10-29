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

// Panel Tim: tombol aksi di roster kosong (memakai label menu Rekrut yang sudah dilokalkan).
function teamEmptyCta() {
    var empty = document.querySelector('.team-dropdown ~ .empty');
    if (!empty || empty.querySelector('.se-empty-cta')) return;
    var cur = document.querySelector('.team-dropdown-item.active');
    var rec = document.querySelector('.team-dropdown-item[data-team-mode="recruit"]');
    if (!rec || (cur && cur.getAttribute('data-team-mode') === 'recruit')) return;
    var lab = rec.querySelector('.team-dropdown-item-label');
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'se-empty-cta';
    b.textContent = lab ? lab.textContent : 'Recruit';
    b.addEventListener('click', function () { rec.click(); });
    empty.appendChild(b);
}

document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.recruit-need');
    if (card) card.classList.toggle('is-open');
});

function scan() {
    queued = false;
    teamEmptyCta();
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
