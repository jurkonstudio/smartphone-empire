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

var MODAL_ID = 'silicon-store';
var _sel = { pkg: 'pkg_l', method: null, busy: false };
var _pollingTimer = null;
var _countdownTimer = null;
var _adminApprovedUnsub = null;
var _storeTab = 'buy'; // 'buy' | 'exchange' | 'transfer'

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

function _renderExchangeTab() {
    var pkgs = _getExchangePackages();
    var balance = SiliconService.getBalance();

    var cards = pkgs.map(function(p) {
        var canAfford = balance >= p.sil;
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
                    ${canAfford ? _e('exch.btn') : _e('exch.short')}
                </button>
            </div>
        `;
    }).join('');

    return `
        <div style="font-size:12px; color:var(--text-secondary); margin-bottom:16px; text-align:center;">
            ${_e('exch.intro')}
        </div>
        ${cards}
    `;
}

function _handleExchange(silCost, cashReward) {
    if (SiliconService.getBalance() < silCost) {
        ToastService.error(t('silstore.exch.low_balance'));
        return;
    }

    var res = SiliconService.spendRaw(silCost, 'exchange-cash');
    if (!res.ok) {
        ToastService.error(res.reason || t('silstore.exch.spend_fail'));
        return;
    }

    state.addCash(cashReward);
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
    if (!cur) { var first = methods
