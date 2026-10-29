// FILE: src/ui/panels/WholesalePanel.js  (PATCH 0.2.10 — modal grosir: live, bisa diperluas, visual baru)
// ============================================================
// Modal grosir: tawaran aktif (Terima / Tolak), kontrak yang sedang dikirim (dengan progres),
// dan ringkasan omzet grosir. Data & aksi lewat WholesaleContractSystem.
//
// Perubahan 0.2.10:
//   - Teks fallback sekarang diisi variabelnya ({n}, {p}, dst). Sebelumnya tampil mentah.
//   - Modal ikut waktu game: progres dan hitung mundur diperbarui tiap detik saat modal terbuka.
//     Posisi scroll dan bagian yang sedang dilipat tetap dipertahankan saat diperbarui.
//   - Tombol "Perluas" melebarkan modal. Setiap bagian bisa dilipat.
//
// Ekspor:
//   openWholesalePanel(sys)      -> buka modal
//   refreshWholesalePanel(sys)   -> render ulang bila modal sedang terbuka
//   initWholesaleNotifications(getSys) -> notifikasi transaksi kompetitor
//       (toast bila notifikasi aktif + entri log permainan, selalu)
// ============================================================
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { state } from '../../core/GameState.js';
import { bus } from '../../core/EventBus.js';
import { t } from '../../core/LanguageService.js';
import { escapeHtml } from '../../utils/html.js';
import { TIME_CONFIG } from '../../config/time.config.js';
import { LOG_TYPES } from '../../config/constants.js';

const MODAL_ID = 'wholesale-panel';
const MINUTES_PER_DAY = TIME_CONFIG.hoursPerDay * TIME_CONFIG.minutesPerHour;
const STYLE_ID = 'wh-panel-style';

// Terjemahan dengan fallback. Fallback juga diisi variabelnya (sebelumnya {n} tampil mentah).
function _fill(s, vars) {
    if (!vars) return s;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? String(vars[k]) : m; });
}
function _tf(key, fb, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : _fill(fb, vars);
}
function _esc(s) { return escapeHtml(String(s == null ? '' : s)); }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _num(n) { return Math.round(n || 0).toLocaleString('en-US'); }
function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function _productOf(productId) {
    var list = (state.data.products && state.data.products.catalog) || [];
    return list.find(function (x) { return x.id === productId; }) || null;
}

var CSS = [
    '[data-modal-id="wholesale-panel"] .modal-card{max-height:74vh;overflow-y:auto;overscroll-behavior:contain}',
    '.wh-wide{width:min(980px,96vw)!important;max-width:96vw!important;max-height:94vh!important}',
    '.wh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
    '.wh-expand{flex:0 0 auto;border:1px solid var(--border);background:var(--bg-2);color:var(--text-secondary);font:600 12px/1 inherit;font-family:inherit;padding:8px 12px;min-height:32px;border-radius:999px;cursor:pointer;transition:background .2s,color .2s}',
    '.wh-expand:hover{color:var(--text-primary);background:var(--bg-3)}',
    '.wh-expand:focus-visible{outline:2px solid var(--info);outline-offset:2px}',
    '.wh-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0 4px}',
    '@media (max-width:480px){.wh-stats{grid-template-columns:1fr 1fr}.wh-stats .wh-stat:last-child{grid-column:1/-1}}',
    '.wh-stat{padding:12px 14px;border-radius:14px;background:linear-gradient(160deg,var(--bg-2),var(--bg-3));border:1px solid var(--border)}',
    '.wh-sv{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--text-primary)}',
    '.wh-sl{font-size:11px;color:var(--text-tertiary);margin-top:4px;text-transform:uppercase;letter-spacing:.04em}',
    '.wh-tone-revenue .wh-sv{color:var(--success)}',
    '.wh-sec{border-top:1px solid var(--border);padding:12px 0}',
    '.wh-sec>summary{cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;font-size:14px;list-style:none;padding:4px 0}',
    '.wh-sec>summary::-webkit-details-marker{display:none}',
    '.wh-sec>summary:focus-visible{outline:2px solid var(--info);outline-offset:2px;border-radius:6px}',
    '.wh-count{font-size:11px;font-weight:600;background:var(--bg-3);color:var(--text-secondary);padding:3px 9px;border-radius:999px;font-variant-numeric:tabular-nums}',
    '.wh-sec-b{padding-top:6px}',
    '.wh-ship{padding:10px 0;border-bottom:1px dashed var(--border)}',
    '.wh-ship-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}',
    '.wh-ship-buyer{font-weight:600;font-size:14px}',
    '.wh-ship-prod{font-size:12px;color:var(--text-tertiary);margin-top:2px}',
    '.wh-ship-amt{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.wh-prog{height:6px;border-radius:99px;background:var(--bg-3);overflow:hidden;margin:9px 0 7px}',
    '.wh-prog i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--info),var(--success));transition:width .6s ease}',
    '.wh-pill{display:inline-block;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--info) 14%,transparent);color:var(--info)}',
    '.wh-hist{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 0;border-bottom:1px dashed var(--border);font-size:13px}',
    '.wh-plus{color:var(--success);font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.wh-card{padding:12px 14px;border-radius:14px;background:var(--bg-2);border:1px solid var(--border);margin-bottom:8px}',
    '.wh-card-h{font-size:14px}',
    '.wh-card-b{font-size:13px;color:var(--text-secondary);margin-top:4px;font-variant-numeric:tabular-nums}',
    '.wh-compare{font-size:12px;color:var(--text-tertiary);margin-top:6px}',
    '.wh-under{color:var(--warn)}',
    '.wh-warn{font-size:12px;color:var(--danger);margin-top:6px}',
    '.wh-actions{display:flex;gap:8px;margin-top:10px}',
    '.wh-actions button{flex:1}',
    '.wh-empty{font-size:13px;color:var(--text-tertiary);padding:14px;text-align:center;border:1px dashed var(--border);border-radius:12px}',
    '@media (prefers-reduced-motion:reduce){.wh-prog i,.wh-expand{transition:none}}'
].join('');

function _ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
}

function _stat(label, value, tone) {
    return '<div class="wh-stat' + (tone ? ' wh-tone-' + tone : '') + '"><div class="wh-sv">' + value + '</div><div class="wh-sl">' + _esc(label) + '</div></div>';
}

function _section(key, title, count, body) {
    return '<details class="wh-sec" data-wh-sec="' + key + '" open>' +
        '<summary><span>' + _esc(title) + '</span><span class="wh-count">' + _num(count) + '</span></summary>' +
        '<div class="wh-sec-b">' + body + '</div>' +
    '</details>';
}

function _offerCard(o) {
    var p = _productOf(o.productId);
    var stock = p ? (p.stock || 0) : 0;
    var enough = stock >= o.qty;
    var id = _esc(o.id);
    // Pembanding: nilai ritel untuk unit yang sama, dan selisih terhadap biaya produksi.
    var retail = p ? (p.price || 0) * o.qty : 0;
    var cost = p ? (p.unitCost || 0) * o.qty : 0;
    var pct = retail > 0 ? Math.round(o.total / retail * 100) : 0;
    var compare = retail > 0
        ? '<div class="wh-compare' + (o.total < retail ? ' wh-under' : '') + '">' +
            _esc(_tf('wh.compare', 'Nilai ritel {r} · tawaran {p}% dari ritel · di atas biaya produksi {g}',
                { r: _money(retail), p: pct, g: _money(o.total - cost) })) +
          '</div>'
        : '';
    return '<div class="wh-card">' +
        '<div class="wh-card-h"><strong>' + _esc(o.buyerName) + '</strong> · ' + _esc(o.productName) + '</div>' +
        '<div class="wh-card-b">' +
            _num(o.qty) + ' unit × ' + _money(o.unitPrice) + ' = <strong>' + _money(o.total) + '</strong>' +
            ' · ' + _esc(_tf('wh.days_left', 'sisa {n} hari', { n: o.daysLeft })) +
        '</div>' + compare +
        (enough ? '' : '<div class="wh-warn">' + _esc(_tf('wh.not_enough', 'Stok hanya {n} unit', { n: _num(stock) })) + '</div>') +
        '<div class="wh-actions">' +
            '<button class="btn-primary" data-wholesale-action="accept" data-wholesale-id="' + id + '"' + (enough ? '' : ' disabled') + '>' + _esc(_tf('wh.accept', 'Terima')) + '</button>' +
            '<button class="btn-secondary" data-wholesale-action="decline" data-wholesale-id="' + id + '">' + _esc(_tf('wh.decline', 'Tolak')) + '</button>' +
        '</div>' +
    '</div>';
}

// Progres dihitung dari waktu diterima sampai waktu bayar. Kontrak tanpa waktu terima dianggap baru.
function _shippingRow(c, now) {
    var deliver = Number(c.deliverAtMinute) || now;
    var accepted = Number.isFinite(Number(c.acceptedAtMinute)) ? Number(c.acceptedAtMinute) : deliver - MINUTES_PER_DAY;
    var span = Math.max(1, deliver - accepted);
    var pct = _clamp((now - accepted) / span, 0, 1) * 100;
    var left = Math.max(0, Math.ceil((deliver - now) / MINUTES_PER_DAY));
    return '<div class="wh-ship">' +
        '<div class="wh-ship-top">' +
            '<div><div class="wh-ship-buyer">' + _esc(c.buyerName) + '</div>' +
            '<div class="wh-ship-prod">' + _esc(c.productName) + ' · ' + _num(c.qty) + ' unit</div></div>' +
            '<div class="wh-ship-amt">' + _money(c.total) + '</div>' +
        '</div>' +
        '<div class="wh-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
        '<span class="wh-pill">' + _esc(_tf('wh.arrive_in', 'bayar {n} hari lagi', { n: left })) + '</span>' +
    '</div>';
}

function _historyRow(h) {
    return '<div class="wh-hist"><span>' + _esc(h.buyerName) + ' · ' + _esc(h.productName) + ' (' + _num(h.qty) + ')</span>' +
        '<span class="wh-plus">+' + _money(h.total) + '</span></div>';
}

function _html(sys, wide) {
    var snap = sys.getSnapshot();
    var now = state.data.time.elapsedGameMinutes || 0;
    var offers = snap.offers.length
        ? snap.offers.map(_offerCard).join('')
        : '<div class="wh-empty">' + _esc(_tf('wh.no_offers', 'Belum ada tawaran grosir. Tawaran muncul tiap bulan untuk produk yang dijual dan punya stok cukup.')) + '</div>';
    var shipping = snap.shipping.length
        ? snap.shipping.map(function (c) { return _shippingRow(c, now); }).join('')
        : '<div class="wh-empty">' + _esc(_tf('wh.no_shipping', 'Tidak ada kontrak yang sedang dikirim.')) + '</div>';
    var history = snap.history.length
        ? snap.history.map(_historyRow).join('')
        : '<div class="wh-empty">' + _esc(_tf('wh.no_history', 'Belum ada pembayaran grosir.')) + '</div>';

    var expandLbl = wide ? _tf('wh.shrink', 'Kecilkan') : _tf('wh.expand', 'Perluas');
    return '<div class="wh-head"><div>' +
            '<div class="modal-title">' + _esc(_tf('wh.title', 'Kontrak Grosir')) + '</div>' +
            '<div class="modal-sub">' + _esc(_tf('wh.sub', 'Merek kompetitor membeli sebagian stok produk jadi. Tidak mengubah pangsa pasar atau penjualan ritel.')) + '</div>' +
        '</div>' +
        '<button class="wh-expand" type="button" data-wh-expand aria-expanded="' + (wide ? 'true' : 'false') + '">' + _esc(expandLbl) + '</button>' +
        '</div>' +
        '<div class="wh-body">' +
            '<div class="wh-stats">' +
                _stat(_tf('wh.stat_revenue', 'Omzet grosir'), _money(snap.revenueTotal), 'revenue') +
                _stat(_tf('wh.stat_delivered', 'Kontrak lunas'), _num(snap.delivered)) +
                _stat(_tf('wh.stat_shipping', 'Sedang dikirim'), _num(snap.shipping.length)) +
            '</div>' +
            _section('offers', _tf('wh.sec_offers', 'Tawaran aktif'), snap.offers.length, offers) +
            _section('shipping', _tf('wh.sec_shipping', 'Sedang dikirim'), snap.shipping.length, shipping) +
            _section('history', _tf('wh.sec_history', 'Riwayat pembayaran'), snap.history.length, history) +
        '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:10px;">' + _esc(_tf('wh.close', 'Tutup')) + '</button>';
}

// Untuk uji: HTML modal tanpa membuka dokumen.
export function buildWholesaleHtml(sys, wide) {
    return _html(sys, !!wide);
}

function _card() {
    return document.querySelector('[data-modal-id="' + MODAL_ID + '"] .modal-card');
}

export function openWholesalePanel(sys) {
    if (!sys) return;
    _ensureStyle();
    Modal.open(MODAL_ID, _html(sys, false));
}

// Dipanggil setelah aksi Terima/Tolak, event grosir, dan tiap detik waktu game (bila modal terbuka).
// Posisi scroll dan bagian yang dilipat pengguna dipertahankan.
export function refreshWholesalePanel(sys) {
    var card = _card();
    if (!card || !sys) return;
    var wide = card.classList.contains('wh-wide');
    var open = {};
    card.querySelectorAll('details[data-wh-sec]').forEach(function (d) {
        open[d.getAttribute('data-wh-sec')] = d.open;
    });
    var scroll = card.scrollTop;

    card.innerHTML = _html(sys, wide);
    if (wide) card.classList.add('wh-wide');

    card.querySelectorAll('details[data-wh-sec]').forEach(function (d) {
        var k = d.getAttribute('data-wh-sec');
        if (k in open) d.open = open[k];
    });
    card.scrollTop = scroll;

    // innerHTML membuang listener lama: pasang lagi tombol tutup.
    var closeBtn = card.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.addEventListener('click', function () { Modal.close(MODAL_ID); });
}

// Tombol Perluas/Kecilkan: satu listener untuk seluruh dokumen (aman walau konten di-render ulang).
function _onExpandClick(ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest('[data-wh-expand]') : null;
    if (!b) return;
    var card = _card();
    if (!card) return;
    var on = card.classList.toggle('wh-wide');
    b.setAttribute('aria-expanded', on ? 'true' : 'false');
    b.textContent = on ? _tf('wh.shrink', 'Kecilkan') : _tf('wh.expand', 'Perluas');
}
if (typeof document !== 'undefined' && !window.__whExpandBound) {
    window.__whExpandBound = true;
    document.addEventListener('click', _onExpandClick);
}

// ============================================================
// NOTIFIKASI TRANSAKSI KOMPETITOR
// ============================================================
export function initWholesaleNotifications(getSys) {
    var unsubs = [];
    function sys() { return getSys ? getSys() : null; }
    function open() { openWholesalePanel(sys()); }
    function touch() { refreshWholesalePanel(sys()); }

    unsubs.push(bus.on('wholesale:offer-new', function (o) {
        state.addLog('Tawaran grosir dari ' + o.buyerName + ': ' + _num(o.qty) + ' unit "' + o.productName + '" @ ' + _money(o.unitPrice) + '.', LOG_TYPES.info);
        ToastService.info(_tf('wh.toast_offer', 'Tawaran grosir dari {b}: {q} unit {p}', { b: o.buyerName, q: _num(o.qty), p: o.productName }), 4000,
            { action: { label: _tf('wh.open', 'Buka'), onClick: open } });
        touch();
    }));

    unsubs.push(bus.on('wholesale:offer-expired', function (o) {
        state.addLog('Tawaran grosir dari ' + o.buyerName + ' untuk "' + o.productName + '" kedaluwarsa.', LOG_TYPES.info);
        touch();
    }));

    unsubs.push(bus.on('wholesale:declined', function () { touch(); }));
    unsubs.push(bus.on('wholesale:accepted', function () { touch(); }));

    unsubs.push(bus.on('wholesale:delivered', function (d) {
        ToastService.success(_tf('wh.toast_paid', 'Pembayaran grosir {m} dari {b}', { m: _money(d.total), b: d.buyerName }));
        touch();
    }));

    unsubs.push(bus.on('wholesale:cancelled', function (d) {
        state.addLog('Kontrak grosir "' + d.productName + '" ke ' + d.buyerName + ' dibatalkan.', LOG_TYPES.warning);
        ToastService.warning(_tf('wh.toast_cancelled', 'Kontrak grosir {b} dibatalkan (produk dihentikan)', { b: d.buyerName }));
        touch();
    }));

    // Live: modal ikut waktu game (progres & hitung mundur). Dibatasi 1x/detik nyata; no-op bila modal tertutup.
    var lastTick = 0;
    unsubs.push(bus.on('time:tick', function () {
        var n = Date.now();
        if (n - lastTick < 1000) return;
        lastTick = n;
        if (_card()) refreshWholesalePanel(sys());
    }));

    return function () { unsubs.forEach(function (u) { u(); }); };
}
