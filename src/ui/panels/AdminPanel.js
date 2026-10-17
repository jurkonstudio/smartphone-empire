// FILE: src/ui/panels/AdminPanel.js
// Panel Rahasia Admin untuk menyetujui Top-Up Manual.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';
import { PaymentService } from '../../systems/PaymentService.js';

export async function openAdminPanel() {
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Kamu harus login ke Cloud terlebih dahulu.');
        return;
    }

    Modal.open('admin-panel', '<div style="text-align:center; padding:20px;">Memuat pesanan...</div>');
    
    const res = await CloudService.getPendingPayments();
    if (!res.ok) {
        ToastService.error(res.reason || 'Gagal memuat data.');
        Modal.close('admin-panel');
        return;
    }

    const orders = res.data || [];
    let html = `
        <div class="modal-title" style="color:var(--danger); display:flex; align-items:center; gap:8px;">
            👑 Admin Panel 
        </div>
        <div class="modal-sub">Daftar pesanan yang menunggu persetujuanmu.</div>
    `;

    if (orders.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:var(--text-tertiary);">Tidak ada pesanan pending.</div>`;
    } else {
        html += `<div style="max-height:50vh; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">`;
        orders.forEach(o => {
            const date = new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            html += `
                <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:8px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                        <span style="color:var(--text-tertiary);">${date}</span>
                        <span style="font-weight:bold; color:var(--accent);">Rp ${o.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div style="font-size:13px; font-weight:600; margin-bottom:2px;">${o.company_name || 'Tanpa Nama'} (${o.email})</div>
                    <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">ID: ${o.id} · Dapat ${o.sil_amount} SIL</div>
                    <button class="btn-primary" data-approve-id="${o.id}" style="width:100%; padding:6px; font-size:12px; background:var(--success); border-color:var(--success);">
                        ✓ Setujui Pesanan
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `<button class="btn-secondary" data-modal-close style="width:100%; margin-top:16px;">Tutup</button>`;

    Modal.open('admin-panel', html);

    // Bind tombol Approve
    document.querySelectorAll('[data-approve-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const orderId = this.dataset.approveId;
            this.textContent = 'Memproses...';
            this.disabled = true;

            const approveRes = await CloudService.adminApprovePayment(orderId);
            if (approveRes.ok) {
                ToastService.success('Pesanan disetujui!');
                // Refresh panel
                openAdminPanel();
            } else {
                ToastService.error(approveRes.reason || 'Gagal menyetujui.');
                this.textContent = '✓ Setujui Pesanan';
                this.disabled = false;
            }
        });
    });
}
