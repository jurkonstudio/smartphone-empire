// FILE: src/ui/panels/AdminPanel.js
// v2028.20 — [PERMANENT FIX] Admin Panel tidak lagi pakai sistem Modal game.
// Dibuat sebagai overlay mandiri (z-index tertinggi) agar tidak pernah bentrok dengan QRIS.
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../../services/CloudService.js';

export async function openAdminPanel() {
    // 1. Hapus panel lama jika ada yang masih menggantung
    const existing = document.getElementById('admin-panel-overlay');
    if (existing) existing.remove();

    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Kamu harus login ke Cloud terlebih dahulu.');
        return;
    }

    // 2. Buat Overlay (Latar Belakang Gelap)
    const overlay = document.createElement('div');
    overlay.id = 'admin-panel-overlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; 
        background: rgba(0,0,0,0.85); 
        z-index: 999999; 
        display: flex; align-items: center; justify-content: center; 
        padding: 20px; backdrop-filter: blur(4px);
    `;

    // 3. Buat Kotak Panel (Konten)
    const panel = document.createElement('div');
    panel.style.cssText = `
        background: var(--bg-1, #1e1e1e); 
        border: 1px solid var(--border, #333); 
        border-radius: 16px; 
        width: 100%; max-width: 400px; 
        max-height: 90vh; overflow-y: auto; 
        padding: 20px; color: #fff; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        font-family: sans-serif;
    `;
    panel.innerHTML = `<div style="text-align:center; padding:20px;">⏳ Memuat pesanan...</div>`;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // 4. Ambil Data Pesanan
    const res = await CloudService.getPendingPayments();
    
    if (!res.ok) {
        panel.innerHTML = `
            <div style="color:#ff4444; text-align:center; padding:20px;">
                <b>Gagal memuat data!</b><br>${res.reason || 'Koneksi terputus.'}
                <br><br>
                <button id="btn-close-admin" style="padding:10px 20px; border-radius:8px; border:0; background:#333; color:#fff;">Tutup</button>
            </div>
        `;
        document.getElementById('btn-close-admin').onclick = () => overlay.remove();
        return;
    }

    const orders = res.data || [];
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #333; padding-bottom:10px;">
            <h2 style="margin:0; font-size:18px; color:#ffaa00;">👑 Admin Panel</h2>
            <button id="btn-close-admin" style="background:none; border:none; color:#888; font-size:20px; cursor:pointer;">✕</button>
        </div>
    `;

    if (orders.length === 0) {
        html += `<div style="text-align:center; padding:20px; color:#888;">Tidak ada pesanan pending.</div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap:12px;">`;
        
        orders.forEach(o => {
            const date = new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const safeAmount = Number(o.amount) || 0;
            const safeSil = Number(o.sil_amount) || 0;
            
            html += `
                <div style="background:#2a2a2a; border:1px solid #444; border-radius:10px; padding:12px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                        <span style="color:#aaa;">⏰ ${date}</span>
                        <span style="font-weight:bold; color:#00d4ff;">Rp ${safeAmount.toLocaleString('id-ID')}</span>
                    </div>
                    <div style="font-size:14px; font-weight:bold; margin-bottom:2px;">${o.company_name || 'Tanpa Nama'}</div>
                    <div style="font-size:11px; color:#aaa; margin-bottom:10px;">${o.email} · Dapat ${safeSil} SIL</div>
                    <button class="admin-approve-btn" data-id="${o.id}" style="width:100%; padding:10px; border-radius:8px; border:0; background:#00c853; color:#fff; font-weight:bold; cursor:pointer; transition:0.2s;">
                        ✓ Setujui Pesanan
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    }

    panel.innerHTML = html;

    // 5. Bind Event Tutup
    document.getElementById('btn-close-admin').onclick = () => overlay.remove();

    // 6. Bind Event Approve
    panel.querySelectorAll('.admin-approve-btn').forEach(btn => {
        btn.onclick = async function() {
            const orderId = this.dataset.id;
            this.textContent = '⏳ Memproses...';
            this.style.background = '#555';
            this.disabled = true;

            const approveRes = await CloudService.adminApprovePayment(orderId);
            
            if (approveRes.ok) {
                ToastService.success('Pesanan berhasil disetujui!');
                // Hapus kartu pesanan dari layar tanpa reload
                this.closest('div[style*="background:#2a2a2a"]').remove();
                
                // Jika pesanan habis, tutup panel
                if (panel.querySelectorAll('.admin-approve-btn').length === 0) {
                    panel.innerHTML = `<div style="text-align:center; padding:20px; color:#00c853; font-weight:bold;">✅ Semua pesanan telah diproses!</div>
                    <button id="btn-close-done" style="width:100%; margin-top:10px; padding:10px; border-radius:8px; border:0; background:#333; color:#fff;">Tutup</button>`;
                    document.getElementById('btn-close-done').onclick = () => overlay.remove();
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
