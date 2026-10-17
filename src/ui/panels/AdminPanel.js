// FILE: src/ui/panels/AdminPanel.js
// v2028.18 — [FIX] Memperbaiki bug Modal tidak muncul & konversi tipe data String ke Number.
import { Modal } from '../modal.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';

export async function openAdminPanel() {
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Kamu harus login ke Cloud terlebih dahulu.');
        return;
    }

    ToastService.info('Memuat pesanan...');

    // Ambil data DULU sebelum membuka Modal
    const res = await CloudService.getPendingPayments();
    
    if (!res.ok) {
        ToastService.error(res.reason || 'Gagal memuat data.');
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
            
            // Paksa konversi ke Number agar tidak error saat diformat
            const safeAmount = Number(o.amount) || 0;
            const safeSil = Number(o.sil_amount) || 0;
            
            html += `
                <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:8px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                        <span style="color:var(--text-tertiary);">${date}</span>
                        <span style="font-weight:bold; color:var(--accent);">Rp ${safeAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div style="font-size:13px; font-weight:600; margin-bottom:2px;">${o.company_name || 'Tanpa Nama'} <span style="font-size:11px; font-weight:normal; color:var(--text-tertiary);">(${o.email})</span></div>
                    <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">ID: ${o.id} · Dapat ${safeSil} SIL</div>
                    <button class="btn-primary" data-approve-id="${o.id}" style="width:100%; padding:6px; font-size:12px; background:var(--success); border-color:var(--success);">
                        ✓ Setujui Pesanan
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `<button class="btn-secondary" data-modal-close style="width:100%; margin-top:16px;">Tutup</button>`;

    // Buka modal SETELAH semua HTML siap
    Modal.open('admin-panel', html);

    // Bind event untuk tombol Approve
    document.querySelectorAll('[data-approve-id]').forEach(btn => {
        btn.addEventListener('click', async function() {
            const orderId = this.dataset.approveId;
            this.textContent = 'Memproses...';
            this.disabled = true;

            const approveRes = await CloudService.adminApprovePayment(orderId);
            if (approveRes.ok) {
                ToastService.success('Pesanan disetujui!');
                openAdminPanel(); // Segarkan panel
            } else {
                ToastService.error(approveRes.reason || 'Gagal menyetujui.');
                this.textContent = '✓ Setujui Pesanan';
                this.disabled = false;
            }
        });
    });
}
