// FILE: src/ui/panels/TransferSiliconModal.js
// Fungsi khusus untuk menampilkan pop-up Kirim SIL yang bersih dan rapi.
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { CloudService } from '../../services/CloudService.js';
import { ToastService } from '../../core/ToastService.js';
import { gIcon } from '../icons/GameIcons.js';

var MODAL_ID = 'transfer-silicon-modal';

export function openTransferSiliconModal() {
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Anda harus login ke akun Cloud terlebih dahulu.');
        return;
    }

    var balance = SiliconService.getBalance();
    
    var html = `
        <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
            ${gIcon('sil', 20)} <span>Kirim SIL</span>
        </div>
        <div class="modal-sub" style="margin-bottom:16px;">
            Kirim SIL ke pemain lain menggunakan ID Pemain (8 digit) mereka.
        </div>
        
        <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:12px; padding:16px;">
            <label class="field-label">ID Pemain Tujuan</label>
            <input type="number" id="trf-target" class="field-input" placeholder="Contoh: 48271956" style="margin-bottom:12px;" autocomplete="off">
            
            <label class="field-label">Jumlah SIL</label>
            <input type="number" id="trf-amount" class="field-input" placeholder="Maksimal 5000" style="margin-bottom:16px;" autocomplete="off">
            
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                <span>Saldo Anda saat ini:</span>
                <b style="color:var(--accent);">${balance} SIL</b>
            </div>
            
            <div style="display:flex; gap:8px;">
                <button type="button" class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
                <button type="button" class="btn-primary" id="btn-do-transfer" style="flex:1; font-weight:bold;">Kirim SIL</button>
            </div>
        </div>
    `;

    Modal.open(MODAL_ID, html);

    var root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!root) return;

    var btnSubmit = root.querySelector('#btn-do-transfer');
    var inputTarget = root.querySelector('#trf-target');
    var inputAmount = root.querySelector('#trf-amount');

    btnSubmit.addEventListener('click', function() {
        var targetId = parseInt(inputTarget.value, 10);
        var amount = parseInt(inputAmount.value, 10);

        // Validasi Input
        if (!targetId || targetId < 10000000) return ToastService.error('ID Pemain tidak valid (harus 8 digit).');
        if (!amount || amount <= 0) return ToastService.error('Jumlah SIL tidak valid.');
        if (amount > 5000) return ToastService.error('Maksimal pengiriman adalah 5000 SIL.');
        if (SiliconService.getBalance() < amount) return ToastService.error('Saldo SIL Anda tidak cukup.');

        if (!confirm(`Kirim ${amount} SIL ke ID ${targetId}?`)) return;

        // Cegah double-click
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Memproses...';

        CloudService.transferSilicon(targetId, amount).then(function(res) {
            if (res.ok) {
                ToastService.success(`Berhasil mengirim ${amount} SIL!`);
                Modal.close(MODAL_ID, true);
                
                // Tarik saldo terbaru dari server agar layar langsung terupdate
                if (window.__game && window.__game.cloudSync) {
                    window.__game.cloudSync.syncSilicon();
                }
            } else {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Kirim SIL';
                
                var msg = res.reason || 'Gagal mengirim.';
                if (msg.includes('player_not_found')) msg = 'ID Pemain tidak ditemukan.';
                if (msg.includes('insufficient_silicon')) msg = 'Saldo SIL Anda tidak cukup.';
                if (msg.includes('cannot_transfer_to_self')) msg = 'Anda tidak bisa mengirim ke diri sendiri.';
                if (msg.includes('invalid_amount')) msg = 'Jumlah SIL tidak valid.';
                
                ToastService.error(msg);
            }
        });
    });
}
