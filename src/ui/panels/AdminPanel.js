// FILE: src/ui/panels/AdminPanel.js
// v2028.27 — [FEATURE] Menambahkan Tab Manajemen Pemain & Fitur Reset Silicon.
// v2028.27b — i18n penuh (Fase 2): semua teks lewat _tf(); panel render ulang saat 'lang:changed';
//             data dari server (email, nama, alasan error) di-escape sebelum masuk innerHTML;
//             respons async yang datang setelah panel ditutup / tab berpindah diabaikan.
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { bus } from '../../core/EventBus.js';
import { t, LanguageService } from '../../core/LanguageService.js';

// _tf(key, fallbackId, fallbackEn, vars): terjemahan jika key ada di kamus,
// kalau belum (sebelum Fase 3) pakai fallback sesuai bahasa aktif.
function _tf(key, fbId, fbEn, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    var en = false;
    try { en = LanguageService.getLang() === 'en'; } catch (e) {}
    var s = (en && fbEn !== undefined) ? fbEn : fbId;
    if (vars) {
        s = String(s).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
    }
    return s;
}

function _esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Daftar teks (id, en) — dipusatkan supaya mudah dipetakan ke key di Fase 3.
var TXT = {
    title:          ['admin.title',            '👑 Admin Panel',                    '👑 Admin Panel'],
    tab_orders:     ['admin.tab_orders',       'Pesanan',                           'Orders'],
    tab_players:    ['admin.tab_players',      'Manajemen Pemain',                  'Player Management'],
    close:          ['admin.close',            'Tutup Panel',                       'Close Panel'],
    login_required: ['admin.login_required',   'Kamu harus login ke Cloud terlebih dahulu.', 'You must log in to Cloud first.'],
    loading:        ['admin.loading',          '⏳ Memuat data...',                 '⏳ Loading data...'],
    loading_orders: ['admin.loading_orders',   '⏳ Memuat pesanan...',              '⏳ Loading orders...'],
    loading_players:['admin.loading_players',  '⏳ Memuat pemain...',               '⏳ Loading players...'],
    no_orders:      ['admin.no_orders',        'Tidak ada pesanan pending.',        'No pending orders.'],
    no_players:     ['admin.no_players',       'Belum ada pemain.',                 'No players yet.'],
    no_name:        ['admin.no_name',          'Tanpa Nama',                        'Unnamed'],
    btn_approve:    ['admin.btn_approve',      '✓ Setujui Pesanan',                 '✓ Approve Order'],
    btn_processing: ['admin.btn_processing',   '⏳ Memproses...',                   '⏳ Processing...'],
    approved:       ['admin.approved',         'Pesanan disetujui!',                'Order approved!'],
    btn_reset:      ['admin.btn_reset',        'Reset ke 0',                        'Reset to 0'],
    reset_confirm:  ['admin.reset_confirm',    'Yakin ingin mereset Silicon {name} menjadi 0?', 'Are you sure you want to reset {name}\'s Silicon to 0?'],
    reset_done:     ['admin.reset_done',       '{name} berhasil di-reset!',         '{name} has been reset!']
};

function _x(id, vars) {
    var r = TXT[id];
    return _tf(r[0], r[1], r[2], vars);
}

export async function openAdminPanel() {
    const existing = document.getElementById('admin-panel-overlay');
    if (existing) existing.remove();

    if (CloudService.getStatus() !== 'connected') {
        ToastService.error(_x('login_required'));
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'admin-panel-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.95);
        z-index: 2147483647;
        display: flex; flex-direction: column;
        padding: 20px; overflow-y: auto;
        color: #fff; font-family: sans-serif;
    `;

    // Kerangka UI (teks statis diisi oleh _applyStaticText agar ikut berganti bahasa)
    overlay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:16px;">
            <h2 id="admin-title" style="margin:0; font-size:20px; color:#ffaa00;"></h2>
            <button id="btn-close-admin" aria-label="${_esc(_tf('common.close', 'Tutup', 'Close'))}" style="background:none; border:none; color:#aaa; font-size:24px; cursor:pointer;">✕</button>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:16px;">
            <button id="tab-pesanan" style="flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#00c853; color:#fff; font-weight:bold; cursor:pointer;"></button>
            <button id="tab-pemain" style="flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#333; color:#fff; font-weight:bold; cursor:pointer;"></button>
        </div>

        <div id="admin-content" style="flex:1;">
            <div style="text-align:center; padding:20px;"></div>
        </div>

        <button id="btn-close-bottom" style="margin-top:20px; padding:12px; background:#444; color:#fff; border:none; border-radius:6px; width:100%; font-size:14px; cursor:pointer;"></button>
    `;

    document.body.appendChild(overlay);

    let unsubLang = null;
    function closePanel() {
        if (unsubLang) { unsubLang(); unsubLang = null; }
        overlay.remove();
    }

    // Event Tutup
    document.getElementById('btn-close-admin').onclick = closePanel;
    document.getElementById('btn-close-bottom').onclick = closePanel;

    const contentDiv = document.getElementById('admin-content');
    const btnPesanan = document.getElementById('tab-pesanan');
    const btnPemain = document.getElementById('tab-pemain');
    const titleEl = document.getElementById('admin-title');
    const closeTop = document.getElementById('btn-close-admin');
    const closeBottom = document.getElementById('btn-close-bottom');

    let currentTab = 'orders';

    function _applyStaticText() {
        titleEl.textContent = _x('title');
        btnPesanan.textContent = _x('tab_orders');
        btnPemain.textContent = _x('tab_players');
        closeBottom.textContent = _x('close');
        closeTop.setAttribute('aria-label', _tf('common.close', 'Tutup', 'Close'));
    }
    _applyStaticText();
    contentDiv.firstElementChild.textContent = _x('loading');

    // Respons async yang terlambat (panel sudah ditutup / tab sudah pindah) diabaikan.
    function _stale(tab) {
        return !overlay.isConnected || currentTab !== tab;
    }

    // ==========================================
    // TAB 1: PESANAN PENDING
    // ==========================================
    async function loadOrders() {
        currentTab = 'orders';
        btnPesanan.style.background = '#00c853';
        btnPemain.style.background = '#333';
        contentDiv.innerHTML = '<div style="text-align:center; padding:20px;">' + _esc(_x('loading_orders')) + '</div>';

        const res = await CloudService.getPendingPayments();
        if (_stale('orders')) return;
        if (!res.ok) {
            contentDiv.innerHTML = `<div style="color:#f44; text-align:center;">${_esc(res.reason)}</div>`;
            return;
        }

        const orders = res.data || [];
        if (orders.length === 0) {
            contentDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">${_esc(_x('no_orders'))}</div>`;
            return;
        }

        let html = '';
        orders.forEach(o => {
            html += `
                <div id="order-${_esc(String(o.id))}" style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:4px;">${_esc(o.email)} · ${_esc(o.company_name || _x('no_name'))}</div>
                    <div style="font-size:16px; font-weight:bold; color:#00d4ff; margin-bottom:8px;">Rp ${Number(o.amount).toLocaleString('id-ID')} (${_esc(String(o.sil_amount))} SIL)</div>
                    <button class="btn-approve" data-id="${_esc(String(o.id))}" style="width:100%; padding:10px; background:#00c853; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">${_esc(_x('btn_approve'))}</button>
                </div>
            `;
        });
        contentDiv.innerHTML = html;

        contentDiv.querySelectorAll('.btn-approve').forEach(btn => {
            btn.onclick = async function() {
                const orderId = this.dataset.id;
                this.textContent = _x('btn_processing');
                this.disabled = true;

                const approveRes = await CloudService.adminApprovePayment(orderId);
                if (!overlay.isConnected) return;
                if (approveRes.ok) {
                    ToastService.success(_x('approved'));
                    this.parentElement.remove();
                    // Trigger update lokal via event bus
                    if (window.__game && window.__game.bus) window.__game.bus.emit('payment:approved', orderId);
                } else {
                    ToastService.error(approveRes.reason);
                    this.textContent = _x('btn_approve');
                    this.disabled = false;
                }
            };
        });
    }

    // ==========================================
    // TAB 2: MANAJEMEN PEMAIN
    // ==========================================
    async function loadPlayers() {
        currentTab = 'players';
        btnPesanan.style.background = '#333';
        btnPemain.style.background = '#00c853';
        contentDiv.innerHTML = '<div style="text-align:center; padding:20px;">' + _esc(_x('loading_players')) + '</div>';

        const res = await CloudService.adminGetAllProfiles();
        if (_stale('players')) return;
        if (!res.ok) {
            contentDiv.innerHTML = `<div style="color:#f44; text-align:center;">${_esc(res.reason)}</div>`;
            return;
        }

        const players = res.data || [];
        if (players.length === 0) {
            contentDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">${_esc(_x('no_players'))}</div>`;
            return;
        }

        let html = '';
        players.forEach(p => {
            html += `
                <div id="player-${_esc(String(p.id))}" style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="font-size:14px; font-weight:bold; margin-bottom:2px;">${_esc(p.company_name || _x('no_name'))}</div>
                    <div style="font-size:11px; color:#aaa; margin-bottom:8px;">${_esc(p.email)}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:14px; color:#00d4ff; font-weight:bold;">${_esc(String(p.silicon_balance))} SIL</div>
                        <button class="btn-reset" data-id="${_esc(String(p.id))}" data-name="${_esc(p.company_name || _x('no_name'))}" style="padding:6px 12px; background:#d32f2f; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;">${_esc(_x('btn_reset'))}</button>
                    </div>
                </div>
            `;
        });
        contentDiv.innerHTML = html;

        contentDiv.querySelectorAll('.btn-reset').forEach(btn => {
            btn.onclick = async function() {
                const userId = this.dataset.id;
                const name = this.dataset.name;
                if (!confirm(_x('reset_confirm', { name: name }))) return;

                this.textContent = '⏳...';
                this.disabled = true;

                const resetRes = await CloudService.adminSetSilicon(userId, 0);
                if (!overlay.isConnected) return;
                if (resetRes.ok) {
                    ToastService.success(_x('reset_done', { name: name }));
                    this.parentElement.querySelector('div').textContent = '0 SIL';
                    this.textContent = _x('btn_reset');
                    this.disabled = false;
                } else {
                    ToastService.error(resetRes.reason);
                    this.textContent = _x('btn_reset');
                    this.disabled = false;
                }
            };
        });
    }

    // Bind Tabs
    btnPesanan.onclick = loadOrders;
    btnPemain.onclick = loadPlayers;

    // Ganti bahasa: perbarui teks statis lalu muat ulang tab yang sedang aktif.
    unsubLang = bus.on('lang:changed', function () {
        if (!overlay.isConnected) {
            if (unsubLang) { unsubLang(); unsubLang = null; }
            return;
        }
        _applyStaticText();
        if (currentTab === 'players') loadPlayers(); else loadOrders();
    });

    // Load awal
    loadOrders();
}
