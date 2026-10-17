// FILE: src/ui/panels/AdminPanel.js
// v2028.27 — [FEATURE] Menambahkan Tab Manajemen Pemain & Fitur Reset Silicon.
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';

export async function openAdminPanel() {
    const existing = document.getElementById('admin-panel-overlay');
    if (existing) existing.remove();

    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Kamu harus login ke Cloud terlebih dahulu.');
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

    // Kerangka UI
    overlay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:16px;">
            <h2 style="margin:0; font-size:20px; color:#ffaa00;">👑 Admin Panel</h2>
            <button id="btn-close-admin" style="background:none; border:none; color:#aaa; font-size:24px; cursor:pointer;">✕</button>
        </div>
        
        <div style="display:flex; gap:10px; margin-bottom:16px;">
            <button id="tab-pesanan" style="flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#00c853; color:#fff; font-weight:bold; cursor:pointer;">Pesanan</button>
            <button id="tab-pemain" style="flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#333; color:#fff; font-weight:bold; cursor:pointer;">Manajemen Pemain</button>
        </div>

        <div id="admin-content" style="flex:1;">
            <div style="text-align:center; padding:20px;">⏳ Memuat data...</div>
        </div>
        
        <button id="btn-close-bottom" style="margin-top:20px; padding:12px; background:#444; color:#fff; border:none; border-radius:6px; width:100%; font-size:14px; cursor:pointer;">Tutup Panel</button>
    `;

    document.body.appendChild(overlay);

    // Event Tutup
    document.getElementById('btn-close-admin').onclick = () => overlay.remove();
    document.getElementById('btn-close-bottom').onclick = () => overlay.remove();

    const contentDiv = document.getElementById('admin-content');
    const btnPesanan = document.getElementById('tab-pesanan');
    const btnPemain = document.getElementById('tab-pemain');

    // ==========================================
    // TAB 1: PESANAN PENDING
    // ==========================================
    async function loadOrders() {
        btnPesanan.style.background = '#00c853';
        btnPemain.style.background = '#333';
        contentDiv.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Memuat pesanan...</div>';

        const res = await CloudService.getPendingPayments();
        if (!res.ok) {
            contentDiv.innerHTML = `<div style="color:#f44; text-align:center;">${res.reason}</div>`;
            return;
        }

        const orders = res.data || [];
        if (orders.length === 0) {
            contentDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">Tidak ada pesanan pending.</div>`;
            return;
        }

        let html = '';
        orders.forEach(o => {
            html += `
                <div id="order-${o.id}" style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:4px;">${o.email} · ${o.company_name || 'Tanpa Nama'}</div>
                    <div style="font-size:16px; font-weight:bold; color:#00d4ff; margin-bottom:8px;">Rp ${Number(o.amount).toLocaleString('id-ID')} (${o.sil_amount} SIL)</div>
                    <button class="btn-approve" data-id="${o.id}" style="width:100%; padding:10px; background:#00c853; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">✓ Setujui Pesanan</button>
                </div>
            `;
        });
        contentDiv.innerHTML = html;

        contentDiv.querySelectorAll('.btn-approve').forEach(btn => {
            btn.onclick = async function() {
                const orderId = this.dataset.id;
                this.textContent = '⏳ Memproses...';
                this.disabled = true;

                const approveRes = await CloudService.adminApprovePayment(orderId);
                if (approveRes.ok) {
                    ToastService.success('Pesanan disetujui!');
                    this.parentElement.remove();
                    // Trigger update lokal via event bus
                    if (window.__game && window.__game.bus) window.__game.bus.emit('payment:approved', orderId);
                } else {
                    ToastService.error(approveRes.reason);
                    this.textContent = '✓ Setujui Pesanan';
                    this.disabled = false;
                }
            };
        });
    }

    // ==========================================
    // TAB 2: MANAJEMEN PEMAIN
    // ==========================================
    async function loadPlayers() {
        btnPesanan.style.background = '#333';
        btnPemain.style.background = '#00c853';
        contentDiv.innerHTML = '<div style="text-align:center; padding:20px;">⏳ Memuat pemain...</div>';

        const res = await CloudService.adminGetAllProfiles();
        if (!res.ok) {
            contentDiv.innerHTML = `<div style="color:#f44; text-align:center;">${res.reason}</div>`;
            return;
        }

        const players = res.data || [];
        if (players.length === 0) {
            contentDiv.innerHTML = `<div style="text-align:center; color:#888; padding:20px;">Belum ada pemain.</div>`;
            return;
        }

        let html = '';
        players.forEach(p => {
            html += `
                <div id="player-${p.id}" style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="font-size:14px; font-weight:bold; margin-bottom:2px;">${p.company_name || 'Tanpa Nama'}</div>
                    <div style="font-size:11px; color:#aaa; margin-bottom:8px;">${p.email}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:14px; color:#00d4ff; font-weight:bold;">${p.silicon_balance} SIL</div>
                        <button class="btn-reset" data-id="${p.id}" data-name="${p.company_name}" style="padding:6px 12px; background:#d32f2f; color:#fff; border:none; border-radius:6px; font-size:12px; cursor:pointer;">Reset ke 0</button>
                    </div>
                </div>
            `;
        });
        contentDiv.innerHTML = html;

        contentDiv.querySelectorAll('.btn-reset').forEach(btn => {
            btn.onclick = async function() {
                const userId = this.dataset.id;
                const name = this.dataset.name;
                if (!confirm(`Yakin ingin mereset Silicon ${name} menjadi 0?`)) return;

                this.textContent = '⏳...';
                this.disabled = true;

                const resetRes = await CloudService.adminSetSilicon(userId, 0);
                if (resetRes.ok) {
                    ToastService.success(`${name} berhasil di-reset!`);
                    this.parentElement.querySelector('div').textContent = '0 SIL';
                    this.textContent = 'Reset ke 0';
                    this.disabled = false;
                } else {
                    ToastService.error(resetRes.reason);
                    this.textContent = 'Reset ke 0';
                    this.disabled = false;
                }
            };
        });
    }

    // Bind Tabs
    btnPesanan.onclick = loadOrders;
    btnPemain.onclick = loadPlayers;

    // Load awal
    loadOrders();
}
