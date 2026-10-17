// FILE: src/ui/panels/AdminPanel.js
// v2028.23 — [BULLETPROOF] Memaksa tutup semua modal & tarik saldo setelah approve.
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';

export async function openAdminPanel() {
    const existing = document.getElementById('admin-panel-overlay');
    if (existing) existing.remove();

    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Kamu harus login ke Cloud terlebih dahulu.');
        return;
    }

    ToastService.info('Memuat pesanan...');
    const res = await CloudService.getPendingPayments();
    
    if (!res.ok) {
        ToastService.error(res.reason || 'Gagal memuat data.');
        return;
    }

    const orders = res.data || [];

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

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:16px;">
            <h2 style="margin:0; font-size:20px; color:#ffaa00;">👑 Admin Panel</h2>
            <button id="btn-close-admin" style="background:none; border:none; color:#aaa; font-size:24px; cursor:pointer;">✕</button>
        </div>
    `;

    if (orders.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:#888; font-size:14px;">Tidak ada pesanan pending.</div>`;
    } else {
        orders.forEach(o => {
            const safeAmount = Number(o.amount) || 0;
            const safeSil = Number(o.sil_amount) || 0;
            
            html += `
                <div id="order-${o.id}" style="background:#222; border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
                    <div style="font-size:12px; color:#aaa; margin-bottom:4px;">${o.email} · ${o.company_name || 'Tanpa Nama'}</div>
                    <div style="font-size:16px; font-weight:bold; color:#00d4ff; margin-bottom:8px;">Rp ${safeAmount.toLocaleString('id-ID')} (${safeSil} SIL)</div>
                    <button class="btn-approve" data-id="${o.id}" style="width:100%; padding:10px; background:#00c853; color:#fff; border:none; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer;">
                        ✓ Setujui Pesanan
                    </button>
                </div>
            `;
        });
    }

    html += `<button id="btn-close-bottom" style="margin-top:20px; padding:12px; background:#444; color:#fff; border:none; border-radius:6px; width:100%; font-size:14px; cursor:pointer;">Tutup Panel</button>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    document.getElementById('btn-close-admin').onclick = () => overlay.remove();
    document.getElementById('btn-close-bottom').onclick = () => overlay.remove();

    overlay.querySelectorAll('.btn-approve').forEach(btn => {
        btn.onclick = async function() {
            const orderId = this.dataset.id;
            this.textContent = '⏳ Memproses...';
            this.style.background = '#555';
            this.disabled = true;

            const approveRes = await CloudService.adminApprovePayment(orderId);
            
            if (approveRes.ok) {
                ToastService.success('Pesanan berhasil disetujui!');
                
                // 1. Tutup paksa Panel Admin
                overlay.remove();
                
                // 2. Paksa tutup Pop-up QRIS dan tarik saldo terbaru (BULLETPROOF)
                if (window.__game && window.__game.Modal) {
                    window.__game.Modal.closeAll();
                }
                if (window.__game && window.__game.forcePull) {
                    setTimeout(() => window.__game.forcePull(), 300);
                }

            } else {
                ToastService.error(approveRes.reason || 'Gagal menyetujui.');
                this.textContent = '✓ Setujui Pesanan';
                this.style.background = '#00c853';
                this.disabled = false;
            }
        };
    });
}
