// FILE: src/ui/components/SilSpeedBar.js  (REPLACE — i18n)
// ============================================================
// SilSpeedBar — tombol Silicon langsung di halaman yang sedang berjalan
// (riset / pengembangan produk / build-upgrade fab / produksi fab).
//   • Percepatan 2x / 5x / 10x  → bayar SIL, ada batas waktu per pembelian
//   • "Selesaikan sekarang"     → bayar SIL, menyelesaikan proses aktif
// Modul ini mengurus event klik & update live (countdown) sendiri,
// jadi main.js TIDAK perlu diubah.
// i18n: semua teks via _tf(); label/modal ikut berganti saat 'lang:changed'.
// ============================================================
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
ensureIconStyles();
import { t } from '../../core/LanguageService.js';
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { SiliconService, SILICON_ACTIONS } from '../../systems/SiliconService.js';
import { SILICON_COSTS } from '../../data/silicon.data.js';
import { openSiliconStoreModal } from '../panels/SiliconStorePanel.js';

var SPEEDS = [2, 5, 10];

function _tf(key, fb, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fb;
}
function _fmtClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function _fmtMin(sec) {
    var m = sec / 60;
    return _tf('sil.speed.min_short', '{n}m', { n: Math.round(m * 10) / 10 });
}
// Alasan gagal dari SiliconService (teks dari service masih hardcode) →
// bila kasusnya saldo kurang (res.need), pakai teks terjemahan.
function _reasonText(res, fallbackKey, fallbackText) {
    if (res && res.need) return _tf('silicon.short', 'Silicon tidak cukup.');
    return (res && res.reason) || _tf(fallbackKey, fallbackText);
}

// ---------- RENDER ----------
// opts: { speed: true|false, finish: 'dev'|'fabBuild'|'fabProd'|undefined }
export function renderSilSpeedBar(opts) {
    opts = opts || {};
    var showSpeed = opts.speed !== false;
    var boost = SiliconService.getSpeedBoost();
    var bal = SiliconService.getBalance();
    var html = '<div class="sil-inline" data-sil-inline>';

    if (showSpeed) {
        html += '<div class="sil-inline-head">' +
            '<span class="sil-inline-title g-ico-title">' + gIcon('bolt', 15) + _tf('sil.speed.title', 'Percepat Waktu') + '</span>' +
            '<span class="sil-inline-timer" data-sil-boost-label>' + _labelText(boost) + '</span>' +
        '</div>';
        html += '<div class="sil-speed-row">' + SPEEDS.map(function (sp) {
            var pack = SiliconService.speedPack(sp);
            var active = boost && boost.speed === sp;
            var short = bal < pack.cost;
            return '<button type="button" class="sil-speed-btn' + (active ? ' is-active' : '') + (short ? ' is-short' : '') + '" ' +
                'data-sil-speed="' + sp + '">' +
                '<b>' + sp + 'x</b>' +
                '<small>💎 ' + pack.cost + ' · ' + _fmtMin(pack.seconds) + '</small>' +
            '</button>';
        }).join('') + '</div>';
        html += '<div class="sil-inline-note">' + _tf('sil.speed.note', 'Waktu boost hanya berkurang saat game berjalan (tidak saat pause).') + '</div>';
    }

    if (opts.finish) {
        var def = SILICON_ACTIONS.find(function (a) { return a.id === opts.finish; });
        if (def) {
            var short2 = bal < def.cost;
            html += '<button type="button" class="sil-finish-btn' + (short2 ? ' is-short' : '') + '" data-sil-finish="' + def.id + '">' +
                '<span class="g-ico-title">' + gIcon('bolt', 15) + _tf('sil.finish.' + def.id, _tf('sil.research.finish', 'Selesaikan Sekarang')) + '</span>' +
                '<span class="sil-cost">' + gIcon('sil', 13) + ' ' + def.cost + '</span>' +
            '</button>';
        }
    }
    return html + '</div>';
}

function _labelText(boost) {
    if (!boost) return _tf('sil.speed.normal', 'Normal 1x');
    return _tf('sil.speed.active', '{speed}x · sisa {time}', { speed: boost.speed, time: _fmtClock(boost.remainingSec) });
}

// ---------- LIVE UPDATE (tanpa re-render) ----------
function _refreshLive() {
    var boost = SiliconService.getSpeedBoost();
    var bal = SiliconService.getBalance();

    var labels = document.querySelectorAll('[data-sil-boost-label]');
    for (var i = 0; i < labels.length; i++) labels[i].textContent = _labelText(boost);

    var chips = document.querySelectorAll('[data-time-boost]');
    for (var c = 0; c < chips.length; c++) {
        if (boost) { chips[c].style.display = ''; chips[c].textContent = '⚡ ' + boost.speed + 'x · ' + _fmtClock(boost.remainingSec); }
        else { chips[c].style.display = 'none'; chips[c].textContent = ''; }
    }

    var btns = document.querySelectorAll('[data-sil-speed]');
    for (var b = 0; b < btns.length; b++) {
        var sp = parseInt(btns[b].dataset.silSpeed, 10);
        var pack = SiliconService.speedPack(sp);
        btns[b].classList.toggle('is-active', !!(boost && boost.speed === sp));
        btns[b].classList.toggle('is-short', !!(pack && bal < pack.cost));
    }
    var fins = document.querySelectorAll('[data-sil-finish]');
    for (var f = 0; f < fins.length; f++) {
        var def = SILICON_ACTIONS.find(function (a) { return a.id === fins[f].dataset.silFinish; });
        if (def) fins[f].classList.toggle('is-short', bal < def.cost);
    }
    var balEls = document.querySelectorAll('[data-sil-speed-balance]');
    for (var q = 0; q < balEls.length; q++) balEls[q].textContent = bal;
}

// ---------- AKSI ----------
function _onSpeedClick(btn) {
    var sp = parseInt(btn.dataset.silSpeed, 10);
    var res = SiliconService.buySpeed(sp);
    if (!res.ok) {
        if (res.reason === 'limit') {
            ToastService.warning(_tf('sil.speed.msg.max', 'Batas waktu boost maksimal tercapai ({time}).', { time: _fmtMin(res.maxSeconds) }));
        } else {
            ToastService.warning(_reasonText(res, 'silicon.short', 'Silicon tidak cukup.'));
            if (res.need) openSiliconStoreModal();
        }
        return;
    }
    ToastService.success(_tf('sil.speed.msg.ok', 'Boost {speed}x aktif · sisa {time} (-{cost} SIL)', {
        speed: res.speed, time: _fmtClock(res.remainingSec), cost: res.spent
    }));
    _refreshLive();
}

function _onFinishClick(btn) {
    var id = btn.dataset.silFinish;
    var def = SILICON_ACTIONS.find(function (a) { return a.id === id; });
    if (def && !SiliconService.canAfford(def.cost)) {
        ToastService.warning(_tf('silicon.short', 'Silicon tidak cukup.'));
        openSiliconStoreModal();
        return;
    }
    var res = SiliconService.runAction(id);
    if (!res.ok) { ToastService.error(_reasonText(res, 'sil.finish.failed', 'Gagal.')); return; }
    // Modal Fab tidak punya live-render → buka ulang agar kartu progres hilang.
    if (id === 'fabBuild' || id === 'fabProd') {
        if (Modal.isOpen('fab-panel')) {
            import('../panels/FabPanel.js').then(function (m) { m.openFabPanel(); });
        }
    }
    _refreshLive();
}

// ---------- MODAL CEPAT (tombol ⏩ di header / tombol F) ----------
export function openSpeedModal() {
    var html =
        '<div class="modal-title g-ico-title">' + gIcon('bolt', 20) + '<span>' + _tf('sil.speed.title', 'Percepat Waktu') + '</span></div>' +
        '<div class="modal-sub">' + _tf('sil.speed.modal_sub', 'Setiap pembelian punya batas waktu. Setelah habis, game kembali ke 1x.') + '</div>' +
        renderSilSpeedBar({ speed: true }) +
        '<div class="sil-inline-bal">' + _tf('sil.speed.balance', 'Saldo: {n} SIL', { n: '<b data-sil-speed-balance>' + SiliconService.getBalance() + '</b>' }) +
            ' <button type="button" class="slot-boost" data-sil-open-store>' + gIcon('plus', 12) + ' ' + _tf('silicon.topup', 'Top Up') + '</button></div>' +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">' + _tf('common.close', 'Tutup') + '</button>';
    Modal.open('speed-quick', html);
}

// ---------- INIT (sekali) ----------
function _injectStyle() {
    if (document.getElementById('sil-inline-style')) return;
    var st = document.createElement('style');
    st.id = 'sil-inline-style';
    st.textContent =
'.sil-inline{margin-top:10px;padding:10px;border:1px solid var(--border,rgba(255,255,255,.12));border-radius:12px;background:var(--surface-2,rgba(139,92,246,.06));}' +
'.sil-inline-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;}' +
'.sil-inline-title{font-size:12px;font-weight:700;}' +
'.sil-inline-timer{font-size:11px;font-variant-numeric:tabular-nums;color:var(--text-tertiary,#94a3b8);}' +
'.sil-speed-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}' +
'.sil-speed-btn{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;min-height:48px;border-radius:10px;border:1px solid var(--border,rgba(255,255,255,.14));background:var(--surface,transparent);color:inherit;cursor:pointer;font:inherit;}' +
'.sil-speed-btn b{font-size:15px;}' +
'.sil-speed-btn small{font-size:10.5px;color:var(--text-tertiary,#94a3b8);}' +
'.sil-speed-btn:hover{border-color:var(--accent,#8b5cf6);}' +
'.sil-speed-btn:active{transform:scale(.96);}' +
'.sil-speed-btn.is-active{border-color:var(--success,#22c55e);background:rgba(34,197,94,.12);}' +
'.sil-speed-btn.is-short small{color:var(--danger,#ef4444);}' +
'.sil-inline-note{margin-top:6px;font-size:10.5px;color:var(--text-tertiary,#94a3b8);line-height:1.4;}' +
'.sil-finish-btn{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;margin-top:8px;padding:11px 12px;border-radius:10px;border:1px solid var(--accent,#8b5cf6);background:var(--accent-soft,rgba(139,92,246,.14));color:inherit;font:inherit;font-size:13px;font-weight:700;cursor:pointer;}' +
'.sil-finish-btn:active{transform:scale(.98);}' +
'.sil-finish-btn.is-short{border-color:rgba(239,68,68,.4);background:var(--danger-soft,rgba(239,68,68,.12));}' +
'.sil-inline-bal{margin-top:10px;font-size:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;}' +
'.header-boost{font-weight:700;font-variant-numeric:tabular-nums;color:var(--accent,#8b5cf6);}';
    document.head.appendChild(st);
}

function _init() {
    if (window.__silSpeedBarInit) return;
    window.__silSpeedBarInit = true;
    _injectStyle();

    // Capture phase → berjalan sebelum handler global main.js.
    document.addEventListener('click', function (e) {
        var sp = e.target.closest && e.target.closest('[data-sil-speed]');
        if (sp) { e.preventDefault(); e.stopPropagation(); _onSpeedClick(sp); return; }
        var fin = e.target.closest && e.target.closest('[data-sil-finish]');
        if (fin) { e.preventDefault(); e.stopPropagation(); _onFinishClick(fin); return; }
        var st = e.target.closest && e.target.closest('[data-sil-open-store]');
        if (st) { e.preventDefault(); e.stopPropagation(); openSiliconStoreModal(); return; }
    }, true);

    bus.on('time:tick', _refreshLive);
    bus.on('time:speed-changed', _refreshLive);
    bus.on('silicon:changed', _refreshLive);
    bus.on('sil:open-speed', openSpeedModal);
    // Ganti bahasa: segarkan label live & render ulang modal cepat bila sedang terbuka.
    bus.on('lang:changed', function () {
        _refreshLive();
        if (Modal.isOpen && Modal.isOpen('speed-quick')) openSpeedModal();
    });
    bus.on('time:boost-expired', function () {
        ToastService.info(_tf('sil.speed.msg.expired', 'Boost habis. Kembali ke 1x.'));
        _refreshLive();
    });
}
_init();

// Dipakai SILICON_COSTS oleh pihak lain bila perlu menampilkan konfigurasi.
export var SPEED_CONFIG = SILICON_COSTS.speed;
