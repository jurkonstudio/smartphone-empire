// FILE: src/ui/panels/SiliconStorePanel.js
// v2029.6 — [FIX] Cegah double-render saat proses sinkronisasi. Ganti _e() ke _tf().
import { gIcon, ensureIconStyles } from '../icons/GameIcons.js';
import { Modal } from '../modal.js';
import { t, LanguageService } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { PaymentService } from '../../systems/PaymentService.js';
import { PAYMENT_GROUPS, getCashPerSil } from '../../data/silicon.data.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { DEV_BUILD } from '../../config/dev.config.js';
import { state } from '../../core/GameState.js';
import { CloudService } from '../../services/CloudService.js';
import { SaveService } from '../../core/SaveService.js';

var MODAL_ID = 'silicon-store';
var _sel = { pkg: 'pkg_l', method: null, busy: false };
var _pollingTimer = null;
var _countdownTimer = null;
var _adminApprovedUnsub = null;
var _storeTab = 'buy'; // 'buy' | 'exchange' | 'transfer'
var _exBusy = false;   // cegah dobel-tap saat penukaran diproses server

var STATIC_QRIS_URL = 'https://raw.githubusercontent.com/jurkonstudio/smartphone-empire/refs/heads/main/qris-gopay.png';

function _esc(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function _e(k, vars) { return _esc(t('silstore.' + k, vars)); }
function _tf(key, fallback, vars) {
    var v = t(key, vars);
    return (v && v !== key) ? v : fallback;
}

function _isId() {
    try { return LanguageService.getLang() === 'id'; } catch (e) { return true; }
}
function _price(o) {
    if (_isId()) return 'Rp' + o.priceIdr.toLocaleString('id-ID');
    return '$' + o.priceUsd.toFixed(2);
}

// ============================================================
// TAB KIRIM SIL (TRANSFER)
// ============================================================
function _renderTransferTab() {
    var balance = SiliconService.getBalance();
    var isConnected = CloudService.getStatus() === 'connected';

    if (!isConnected) {
        return `
            <div style="text-align:center; padding: 20px;">
                <div style="font-size:40px; margin-bottom:10px;">☁️</div>
                <div style="font-weight:bold; margin-bottom:8px;">Fitur ini membutuhkan akun Cloud</div>
                <div style="font-size:12px; color:var(--text-tertiary);">Silakan login ke akun cloud terlebih dahulu di menu Setelan untuk dapat mengirim SIL ke pemain lain.</div>
            </div>
        `;
    }

    return `
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:16px; text-align:center;">
            ${_tf('silstore.transfer.intro', 'Kirim SIL ke pemain lain dengan memasukkan ID Pemain (8 digit) mereka.')}
        </div>
        
        <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:12px; padding:16px;">
            <label style="font-size:12px; color:var(--text-secondary); margin-bottom:4px; display:block;">ID Pemain Tujuan</label>
            <input type="number" id="trf-target" class="field-input" placeholder="Contoh: 48271956" style="margin-bottom:12px;">
            
            <label style="font-size:12px; color:var(--text-secondary); margin-bottom:4px; display:block;">Jumlah SIL</label>
            <input type="number" id="trf-amount" class="field-input" placeholder="Maksimal 5000" style="margin-bottom:16px;">
            
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                <span>Saldo Anda saat ini:</span>
                <b style="color:var(--accent);">${balance} SIL</b>
            </div>
            
            <button class="btn-primary" id="btn-do-transfer" style="width:100%; padding:10px; font-weight:bold;">
                Kirim SIL Sekarang
            </button>
        </div>
    `;
}

function _handleTransfer() {
    var targetInput = document.getElementById('trf-target');
    var amountInput = document.getElementById('trf-amount');
    var btn = document.getElementById('btn-do-transfer');

    var targetId = parseInt(targetInput.value, 10);
    var amount = parseInt(amountInput.value, 10);

    if (!targetId || targetId < 10000000) return ToastService.error('ID Pemain tidak valid (harus 8 digit).');
    if (!amount || amount <= 0) return ToastService.error('Jumlah SIL tidak valid.');
    if (amount > 5000) return ToastService.error('Maksimal pengiriman adalah 5000 SIL.');
    if (SiliconService.getBalance() < amount) return ToastService.error('Saldo SIL Anda tidak cukup.');

    if (!confirm(`Kirim ${amount} SIL ke ID ${targetId}?`)) return;

    btn.disabled = true;
    btn.textContent = 'Memproses...';

    CloudService.transferSilicon(targetId, amount).then(function(res) {
        if (res.ok) {
            ToastService.success(`Berhasil mengirim ${amount} SIL!`);
            targetInput.value = '';
            amountInput.value = '';
            
            if (window.__game && window.__game.cloudSync) {
                window.__game.cloudSync.syncSilicon();
            }
            _render();
        } else {
            btn.disabled = false;
            btn.textContent = 'Kirim SIL Sekarang';
            
            var msg = res.reason || 'Gagal mengirim.';
            if (msg.includes('player_not_found')) msg = 'ID Pemain tidak ditemukan.';
            if (msg.includes('insufficient_silicon')) msg = 'Saldo SIL Anda tidak cukup.';
            if (msg.includes('cannot_transfer_to_self')) msg = 'Anda tidak bisa mengirim ke diri sendiri.';
            if (msg.includes('invalid_amount')) msg = 'Jumlah SIL tidak valid.';
            
            ToastService.error(msg);
        }
    });
}

// ============================================================
// TAB TUKAR SIL KE UANG (EXCHANGE)
// ============================================================
function _getExchangePackages() {
    var multiplier = getCashPerSil(state.get().time.currentYear || 2000) / 2500;
    return [
        { sil: 10,  cash: Math.round(25000 * multiplier),  label: t('silstore.exch.pkg.small') },
        { sil: 50,  cash: Math.round(150000 * multiplier), label: t('silstore.exch.pkg.big') },
        { sil: 100, cash: Math.round(400000 * multiplier), label: t('silstore.exch.pkg.suitcase') },
        { sil: 500, cash: Math.round(2500000 * multiplier), label: t('silstore.exch.pkg.truck') }
    ];
}

function _resyncBalance() {
    try { var cs = window.__game && window.__game.cloudSync; if (cs && cs.syncSilicon) return cs.syncSilicon(); } catch (e) {}
}

function _renderExchangeTab() {
    var pkgs = _getExchangePackages();
    var balance = SiliconService.getBalance();
    // [FIX] Tombol hanya aktif bila saldo SERVER sudah terbaca. Dulu tombol memakai saldo lokal (bisa basi/10).
    var active = SiliconService.isActive();
    var ready = SiliconService.isReady();

    var notice = '';
    if (!active) {
        notice = '<div style="font-size:12px; color:var(--warning,#f5a623); text-align:center; margin-bottom:12px;">Login ke Cloud dulu untuk menukar SIL.</div>';
    } else if (!ready) {
        notice = '<div style="font-size:12px; color:var(--text-secondary); text-align:center; margin-bottom:12px;">Menyinkronkan saldo dari server… ' +
            '<button type="button" id="btn-sil-resync" style="background:none;border:none;color:var(--accent);text-decoration:underline;cursor:pointer;font-size:12px;">Coba lagi</button></div>';
    }

    var cards = pkgs.map(function(p) {
        var canAfford = active && ready && !_exBusy && balance >= p.sil;
        var btnStyle = canAfford ? 'background:#00c853; color:#fff;' : 'background:#333; color:#666; cursor:not-allowed;';
        
        return `
            <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:12px; padding:14px; margin-bottom:10px; display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-weight:bold; color:var(--text-primary); font-size:15px;">${p.label}</div>
                    <div style="color:var(--accent); font-weight:bold;">${p.sil} SIL</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:12px; color:var(--text-tertiary);">${_e('exch.you_get')}</div>
                    <div style="color:var(--success); font-weight:bold; font-size:16px;">$${p.cash.toLocaleString('en-US')}</div>
                </div>
                <button class="btn-exchange" data-sil="${p.sil}" data-cash="${p.cash}" style="width:100%; padding:8px; border-radius:8px; border:none; font-weight:bold; font-size:13px; ${btnStyle}" ${canAfford ? '' : 'disabled'}>
                    ${_exBusy ? '…' : (canAfford ? _e('exch.btn') : (active && ready ? _e('exch.short') : '…'))}
                </button>
            </div>
        `;
    }).join('');

    return `
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:16px; text-align:center;">
            ${_e('exch.intro')}
        </div>
        ${notice}
        ${cards}
    `;
}

// [FIX TUKAR SIL] Server-dulu: SIL dipotong di server, BARU uang diberikan.
// Dulu: SIL dipotong lokal -> uang langsung diberikan -> server memotong di belakang layar; bila server
// menolak/timeout, SIL dikembalikan lokal tetapi uang tetap ada (SIL "balik lagi" + uang dobel).
async function _handleExchange(silCost, cashReward) {
    if (_exBusy) return;
    if (!SiliconService.isReady()) {
        ToastService.warning('Saldo belum tersinkron dari server. Coba lagi sebentar.');
        _resyncBalance();
        return;
    }
    if (SiliconService.getBalance() < silCost) {
        ToastService.error(t('silstore.exch.low_balance'));
        return;
    }

    _exBusy = true; _render();
    var res;
    try { res = await SiliconService.spendServer(silCost, 'exchange-cash'); }
    catch (e) { res = { ok: false, reason: 'Koneksi gagal.' }; }
    _exBusy = false;

    if (!res || !res.ok) {
        ToastService.error((res && res.reason) || t('silstore.exch.spend_fail'));
        _resyncBalance();
        _render();
        return;
    }

    state.addCash(cashReward);
    // Simpan segera: SIL sudah dipotong di server, uangnya jangan sampai hilang bila tab ditutup.
    try { SaveService.save(state, { silent: true }); } catch (e) {}
    ToastService.success(t('silstore.exch.done', { sil: silCost, cash: cashReward.toLocaleString('en-US') }));

    if (window.__game && window.__game.AudioService) {
        window.__game.AudioService.play('success');
    }
    _render();
}

// ============================================================
// TAB BELI (BUY)
// ============================================================
function _renderPackages() {
    return '<div class="sil-pkg-grid">' + PaymentService.getPackages().map(function (p) {
        var tag = p.tag ? '<span class="sil-pkg-tag sil-pkg-tag-' + p.tag + '">' + _tf('silicon.store.tag.' + p.tag, p.tag) + '</span>' : '';
        return '<button type="button" class="sil-pkg' + (_sel.pkg === p.id ? ' active' : '') + '" data-sil-pkg="' + p.id + '">' +
            tag + '<span class="sil-pkg-ico">' + gIcon(p.icon, 20) + '</span>' +
            '<span class="sil-pkg-amt">' + p.sil + '</span>' +
            '<span class="sil-pkg-bonus">' + (p.bonus ? '+' + p.bonus + ' ' + _tf('silicon.store.bonus', 'bonus') : '&nbsp;') + '</span>' +
            '<span class="sil-pkg-price">' + _price(p) + '</span>' +
        '</button>';
    }).join('') + '</div>';
}

function _renderMethods(methods) {
    var html = '';
    PAYMENT_GROUPS.forEach(function (g) {
        var items = methods.filter(function (m) { return m.group === g; });
        if (!items.length) return;
        html += '<div class="sil-method-group">' + _tf('silicon.store.group.' + g, g) + '</div>';
        html += items.map(function (m) {
            var avail = m.status === 'available';
            var badge = avail ? '<span class="sil-badge sil-badge-on">' + _tf('silicon.store.available', 'Aktif') + '</span>' : '<span class="sil-badge">' + _tf('silicon.store.soon', 'Segera') + '</span>';
            return '<button type="button" class="sil-method' + (_sel.method === m.id ? ' active' : '') + (avail ? '' : ' is-soon') + '" data-sil-method="' + m.id + '"' + (avail ? '' : ' disabled') + '>' +
                '<span class="sil-method-ico">' + gIcon(m.icon || 'wallet', 18) + '</span>' +
                '<span class="sil-method-name">' + _esc(m.name) + '</span>' + badge + '<span class="sil-radio"></span>' +
            '</button>';
        }).join('');
    });
    return html;
}

function _renderBuyTab() {
    var methods = PaymentService.getMethods();
    var anyAvail = methods.some(function (m) { return m.status === 'available'; });
    var cur = methods.find(function (m) { return m.id === _sel.method && m.status === 'available'; });
    if (!cur) { var first = methods.find(function (m) { return m.status === 'available'; }); _sel.method = first ? first.id : null; }
    var pkg = PaymentService.getPackage(_sel.pkg) || PaymentService.getPackages()[0];
    var canPay = !!_sel.method && !_sel.busy;

    return '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.packages', 'Paket') + '</span><span class="section-label-line"></span></div>' +
        _renderPackages() +
        '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.methods', 'Metode Pembayaran') + '</span><span class="section-label-line"></span></div>' +
        (anyAvail ? '' : '<div class="sil-hint">' + _tf('silicon.store.none', 'Metode pembayaran belum aktif. Segera hadir.') + '</div>') +
        '<div class="sil-methods">' + _renderMethods(methods) + '</div>' +
        '<div class="sil-summary">' +
            '<div class="sum-row"><span>' + _tf('silicon.store.you_get', 'Kamu dapat') + '</span><b>' + (pkg.sil + pkg.bonus) + ' SIL</b></div>' +
            '<div class="sum-row total"><span>' + _tf('silicon.store.total', 'Total') + '</span><b>' + _price(pkg) + '</b></div>' +
        '</div>' +
        '<button type="button" class="btn-primary" data-sil-pay style="width:100%;margin-top:12px;"' + (canPay ? '' : ' disabled') + '>' +
            (_sel.busy ? _tf('silicon.store.processing', 'Memproses…') : _tf('silicon.store.pay', 'Bayar') + ' · ' + _price(pkg)) + '</button>';
}

function _renderOrders() {
    var orders = PaymentService.getOrders().slice(0, 4);
    if (!orders.length) return '';
    var rows = orders.map(function (o) {
        var cls = o.status === 'paid' ? 'pos' : (o.status === 'pending' ? 'warn' : 'neg');
        var refresh = o.status === 'pending' ? ' <button type="button" class="slot-boost" data-sil-order-refresh="' + o.id + '">' + _tf('silicon.store.check', 'Cek') + '</button>' : '';
        return '<div class="sil-hist-row">' +
            '<span class="sil-hist-reason">' + _esc(o.packageId.replace('pkg_', '').toUpperCase()) + ' · ' + o.sil + ' SIL' + refresh + '</span>' +
            '<span class="sil-hist-delta ' + cls + '">' + _tf('silicon.store.status.' + o.status, o.status) + '</span>' +
        '</div>';
    }).join('');
    return '<div class="section-label"><span class="section-label-text">' + _tf('silicon.store.orders', 'Pesanan') + '</span>' +
        '<span class="section-label-line"></span></div><div class="node-list">' + rows + '</div>';
}

// ============================================================
// RENDER UTAMA
// ============================================================
function _build() {
    var isBuy = (_storeTab === 'buy');
    var isEx = (_storeTab === 'exchange');
    var isTrf = (_storeTab === 'transfer');

    var btnStyle = 'flex:1; padding:10px; border-radius:8px; border:none; font-weight:bold; font-size:12px; cursor:pointer;';
    var on = 'background:var(--accent); color:#fff;';
    var off = 'background:var(--bg-3); color:var(--text-secondary);';

    var content = '';
    if (isBuy) content = _renderBuyTab();
    else if (isEx) content = _renderExchangeTab();
    else content = _renderTransferTab();

    return '<div class="modal-title g-ico-title">' + gIcon('sil', 20) + '<span>' + _tf('silstore.title', 'Silicon Store') + '</span></div>' +
        '<div class="sil-balance sil-balance-compact">' +
            '<div class="sil-balance-label">' + _tf('silicon.balance', 'SALDO') + '</div>' +
            '<div class="sil-balance-value">' + SiliconService.getDisplayBalance() + ' <span>SIL</span></div>' +
        '</div>' +
        
        '<div style="display:flex; gap:6px; margin-bottom:16px;">' +
            '<button id="tab-buy" style="' + btnStyle + (isBuy ? on : off) + '">' + _tf('silstore.tab.buy', 'Beli') + '</button>' +
            '<button id="tab-exchange" style="' + btnStyle + (isEx ? on : off) + '">' + _tf('silstore.tab.exchange', 'Tukar Uang') + '</button>' +
            '<button id="tab-transfer" style="' + btnStyle + (isTrf ? on : off) + '">' + _tf('silstore.tab.transfer', 'Kirim') + '</button>' +
        '</div>' +

        content +
        
        (isBuy ? _renderOrders() : '') +
        '<button class="btn-secondary" data-modal-close style="width:100%;margin-top:12px;">' + _tf('common.close', 'Tutup') + '</button>';
}

function _onClick(e) {
    if (e.target.closest('[data-modal-close]')) { Modal.close(MODAL_ID); return; }

    if (e.target.closest('#tab-buy')) { _storeTab = 'buy'; _render(); return; }
    if (e.target.closest('#tab-exchange')) { _storeTab = 'exchange'; _render(); return; }
    if (e.target.closest('#tab-transfer')) { _storeTab = 'transfer'; _render(); return; }

    if (e.target.closest('#btn-do-transfer')) { _handleTransfer(); return; }
    if (e.target.closest('#btn-sil-resync')) { _resyncBalance(); return; }

    var exBtn = e.target.closest('.btn-exchange');
    if (exBtn && !exBtn.disabled) {
        var sil = parseInt(exBtn.dataset.sil, 10);
        var cash = parseInt(exBtn.dataset.cash, 10);
        if (confirm(t('silstore.exch.confirm', { sil: sil, cash: cash.toLocaleString('en-US') }))) { _handleExchange(sil, cash); }
        return;
    }

    var pk = e.target.closest('[data-sil-pkg]');
    if (pk) { _sel.pkg = pk.dataset.silPkg; _render(); return; }

    var md = e.target.closest('[data-sil-method]');
    if (md && !md.disabled) { _sel.method = md.dataset.silMethod; _render(); return; }

    var rf = e.target.closest('[data-sil-order-refresh]');
    if (rf) {
        var btn = rf; btn.textContent = '...';
        PaymentService.refresh(rf.dataset.silOrderRefresh).then(function (r) {
            if (r.ok && r.sil) ToastService.success(_tf('silicon.store.done', '+{n} SIL ditambahkan.', { n: r.sil }));
            else if (r.pending) ToastService.info(_tf('silicon.store.still_pending', 'Menunggu konfirmasi Admin.'));
            _render();
        });
        return;
    }

    if (e.target.closest('[data-sil-pay]')) {
        if (!_sel.method || _sel.busy) return;
        _sel.busy = true; _render();
        PaymentService.pay(_sel.pkg, _sel.method).then(function (r) {
            _sel.busy = false;
            if (r.ok && r.sil) { ToastService.success(_tf('silicon.store.done', '+{n} SIL ditambahkan.', { n: r.sil })); _render(); }
            else if (r.ok && r.pending) { _render(); _showPaymentModal(r.order); }
            else { ToastService.error(r.reason || _tf('silicon.store.failed', 'Pembayaran gagal.')); _render(); }
        });
    }
}

function _showPaymentModal(order) {
    var pkg = PaymentService.getPackage(order.packageId);
    var mockBtnHtml = DEV_BUILD ? `<div style="margin-top:24px; padding-top:16px; border-top:1px dashed var(--border); text-align:center;"><button type="button" data-qr-mock style="background:var(--danger-soft); color:var(--danger); border:1px solid var(--danger); padding:8px; border-radius:8px; font-size:11px; width:100%; cursor:pointer;">${_tf('silstore.qr.mock', 'Simulasi Lunas')}</button></div>` : '';
    var html = `<div class="modal-title" style="text-align:center; font-size:18px;">${_tf('silstore.qr.title', 'Pindai QRIS')}</div><div class="modal-sub" style="text-align:center; margin-bottom:16px;">${_tf('silstore.qr.time_left', 'Sisa waktu')} <b id="qr-timer" style="color:var(--danger); font-family:monospace; font-size:14px;">15:00</b></div><div style="text-align:center; margin-bottom:12px;"><div style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">${_tf('silstore.qr.total', 'Total Pembayaran')}</div><div style="font-size:24px; font-weight:bold; color:var(--accent);">${_price(pkg)}</div></div><div style="text-align:center; padding: 12px; background: #fff; border-radius: 12px; margin-bottom:16px; box-shadow: inset 0 0 10px rgba(0,0,0,0.1);"><img src="${STATIC_QRIS_URL}" style="width:100%; max-width:250px; display:block; margin:0 auto; border-radius:8px;" alt="QRIS" /></div><div style="font-size:13px; color:var(--text-secondary); text-align:center; margin-bottom:16px; line-height:1.5;">${_tf('silstore.qr.scan', 'Pindai kode di atas menggunakan aplikasi bank atau e-wallet Anda.')}<br><b>${_tf('silstore.qr.important', 'PENTING')}</b> ${_tf('silstore.qr.note_pre', 'Sertakan Order ID')} <b>${_esc(order.id)}</b> ${_tf('silstore.qr.note_post', 'pada berita transfer.')}</div><div style="display:flex; flex-direction:column; gap:8px;"><button type="button" class="btn-primary" data-qr-check style="width:100%;">${_tf('silstore.qr.check', 'Cek Status')}</button><button type="button" class="btn-secondary" data-qr-cancel style="width:100%;">${_tf('silstore.qr.cancel', 'Batal')}</button></div>${mockBtnHtml}`;
    Modal.open('payment-qr', html);
    var root = document.querySelector('[data-modal-id="payment-qr"]'); if (!root) return;
    var timerEl = root.querySelector('#qr-timer'); var btnCheck = root.querySelector('[data-qr-check]');
    
    if (_adminApprovedUnsub) _adminApprovedUnsub();
    _adminApprovedUnsub = bus.on('payment:approved', function(approvedId) {
        if (approvedId === order.id) { cleanupTimers(); Modal.close('payment-qr', true); ToastService.success(t('silstore.toast.approved')); if (window.__game && window.__game.cloudSync) window.__game.cloudSync.syncSilicon(); }
    });
    function handleSiliconChange(payload) { if (payload && payload.delta > 0) { cleanupTimers(); Modal.close('payment-qr', true); ToastService.success(t('silstore.toast.paid_synced')); _render(); } }
    bus.on('silicon:changed', handleSiliconChange);
    function cleanupTimers() { if (_countdownTimer) clearInterval(_countdownTimer); if (_pollingTimer) clearInterval(_pollingTimer); document.removeEventListener('visibilitychange', _onVisibilityChange); if (_adminApprovedUnsub) { _adminApprovedUnsub(); _adminApprovedUnsub = null; } bus.off('silicon:changed', handleSiliconChange); }
    function _onVisibilityChange() { if (document.visibilityState === 'visible') checkStatus(false); }
    document.addEventListener('visibilitychange', _onVisibilityChange);
    var timeLeft = 15 * 60; if (_countdownTimer) clearInterval(_countdownTimer);
    _countdownTimer = setInterval(function() { timeLeft--; var m = Math.floor(timeLeft / 60); var s = timeLeft % 60; if (timerEl) timerEl.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; if (timeLeft <= 0) { cleanupTimers(); ToastService.error(t('silstore.toast.expired')); Modal.close('payment-qr', true); } }, 1000);
    function checkStatus(isManual) {
        if (isManual) btnCheck.textContent = t('silstore.qr.checking');
        PaymentService.refresh(order.id).then(function(r) {
            var isPaid = r.ok && (r.sil || (r.order && r.order.status === 'paid'));
            if (isPaid) { cleanupTimers(); Modal.close('payment-qr', true); ToastService.success(t('silstore.toast.paid')); _render(); }
            else { if (isManual) { btnCheck.textContent = t('silstore.qr.check'); ToastService.warning(t('silstore.toast.not_confirmed')); } }
        });
    }
    if (_pollingTimer) clearInterval(_pollingTimer);
    _pollingTimer = setInterval(function() { checkStatus(false); }, 5000); 
    btnCheck.addEventListener('click', function() { checkStatus(true); });
    root.querySelector('[data-qr-cancel]').addEventListener('click', function() { cleanupTimers(); PaymentService.cancel(order.id); Modal.close('payment-qr', true); _render(); });
    var btnMock = root.querySelector('[data-qr-mock]');
    if (btnMock) { btnMock.addEventListener('click', function() { PaymentService._fulfill(order); cleanupTimers(); Modal.close('payment-qr', true); ToastService.success(t('silstore.toast.mock_paid')); _render(); }); }
}

function _render() {
    if (!Modal.isOpen(MODAL_ID)) return;
    var card = document.querySelector('[data-modal-id="' + MODAL_ID + '"] .modal-card');
    if (!card) return;
    var scroll = card.scrollTop;
    card.innerHTML = _build();
    card.scrollTop = scroll;
}

export function openSiliconStoreModal(defaultTab) {
    ensureIconStyles();
    _storeTab = defaultTab || 'buy'; 
    Modal.open(MODAL_ID, _build());
    var root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (root) root.addEventListener('click', _onClick);
    // Tarik saldo asli dengan jeda agar tidak tabrakan dengan render awal
    setTimeout(function() {
        try { var cs = window.__game && window.__game.cloudSync; if (cs && cs.syncSilicon) cs.syncSilicon(); } catch (e) {}
    }, 300);
}

// [FIX] Cegah double-render yang menimpa saldo server dengan cache lokal
var _renderDebounce = null;
bus.on('silicon:changed', function (payload) { 
    if (!Modal.isOpen(MODAL_ID)) return;
    if (_renderDebounce) clearTimeout(_renderDebounce);
    _renderDebounce = setTimeout(function() { 
        _render(); 
    }, 50); 
});

bus.on('silicon:display', function () { if (Modal.isOpen(MODAL_ID)) _render(); });

bus.on('lang:changed', function () { 
    if (Modal.isOpen(MODAL_ID)) _render(); 
});
