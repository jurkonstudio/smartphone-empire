// FILE: src/ui/panels/WholesalePanel.js  (BARU — panel kontrak grosir produk jadi)
// ============================================================
// Modal grosir: tawaran aktif (Terima / Tolak), kontrak yang sedang dikirim,
// dan ringkasan omzet grosir. Data & aksi lewat WholesaleContractSystem.
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

function _tf(key, fb, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fb;
}
function _esc(s) { return escapeHtml(String(s == null ? '' : s)); }
function _money(n) { return '$' + Math.round(n || 0).toLocaleString('en-US'); }
function _num(n) { return Math.round(n || 0).toLocaleString('en-US'); }

function _productOf(productId) {
    var list = (state.data.products && state.data.products.catalog) || [];
    return list.find(function (x) { return x.id === productId; }) || null;
}

function _stat(label, value) {
    return '<div class="mfx-stat"><div class="mfx-sv">' + value + '</div><div class="mfx-sl">' + _esc(label) + '</div></div>';
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

function _shippingRow(c, nowMinute) {
    var left = Math.max(0, Math.ceil((c.deliverAtMinute - nowMinute) / MINUTES_PER_DAY));
    return '<div class="wh-row"><span>' + _esc(c.buyerName) + ' · ' + _esc(c.productName) + ' (' + _num(c.qty) + ')</span>' +
        '<span>' + _money(c.total) + ' · ' + _esc(_tf('wh.arrive_in', 'bayar {n} hari lagi', { n: left })) + '</span></div>';
}

function _historyRow(h) {
    return '<div class="wh-row"><span>' + _esc(h.buyerName) + ' · ' + _esc(h.productName) + ' (' + _num(h.qty) + ')</span>' +
        '<span>+' + _money(h.total) + '</span></div>';
}

function _html(sys) {
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

    return '<div class="modal-title">' + _esc(_tf('wh.title', 'Kontrak Grosir')) + '</div>' +
        '<div class="modal-sub">' + _esc(_tf('wh.sub', 'Merek kompetitor membeli sebagian stok produk jadi. Tidak mengubah pangsa pasar atau penjualan ritel.')) + '</div>' +
        '<div class="wh-body">' +
            '<div class="mfx-stats">' +
                _stat(_tf('wh.stat_revenue', 'Omzet grosir'), _money(snap.revenueTotal)) +
                _stat(_tf('wh.stat_delivered', 'Kontrak lunas'), _num(snap.delivered)) +
                _stat(_tf('wh.stat_shipping', 'Sedang dikirim'), _num(snap.shipping.length)) +
            '</div>' +
            '<h4>' + _esc(_tf('wh.sec_offers', 'Tawaran aktif')) + '</h4>' + offers +
            '<h4>' + _esc(_tf('wh.sec_shipping', 'Sedang dikirim')) + '</h4>' + shipping +
            '<h4>' + _esc(_tf('wh.sec_history', 'Riwayat pembayaran')) + '</h4>' + history +
        '</div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:8px;">' + _esc(_tf('wh.close', 'Tutup')) + '</button>';
}

function _card() {
    return document.querySelector('[data-modal-id="' + MODAL_ID + '"] .modal-card');
}

export function openWholesalePanel(sys) {
    if (!sys) return;
    Modal.open(MODAL_ID, _html(sys));
}

// Dipanggil setelah aksi Terima/Tolak atau event grosir. No-op bila modal tertutup.
export function refreshWholesalePanel(sys) {
    var card = _card();
    if (!card || !sys) return;
    // Ganti isi card saja, agar modal tidak tertutup & dibuka ulang.
    card.innerHTML = _html(sys);
    // innerHTML membuang listener lama: pasang lagi tombol tutup.
    var closeBtn = card.querySelector('[data-modal-close]');
    if (closeBtn) closeBtn.addEventListener('click', function () { Modal.close(MODAL_ID); });
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

    return function () { unsubs.forEach(function (u) { u(); }); };
}
