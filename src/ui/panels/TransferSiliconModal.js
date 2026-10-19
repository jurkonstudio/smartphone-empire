// FILE: src/ui/panels/TransferSiliconModal.js
import { Modal } from '../modal.js';
import { t } from '../../core/LanguageService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { CloudService } from '../../services/CloudService.js';
import { ToastService } from '../../core/ToastService.js';
import { gIcon } from '../icons/GameIcons.js';

var MODAL_ID = 'transfer-silicon-modal';
var _checkTimeout = null;

export function openTransferSiliconModal() {
    if (CloudService.getStatus() !== 'connected') {
        ToastService.error('Anda harus login ke akun Cloud terlebih dahulu.');
        return;
    }

    // Tampilkan modal dengan loading state
    var html = `
        <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
            ${gIcon('sil', 20)} <span>Kirim SIL</span>
        </div>
        <div class="modal-sub" style="margin-bottom:16px;">
            Memeriksa saldo terbaru dari server...
        </div>
        <div style="text-align:center; padding:20px;">
            <div class="onb-spin" style="margin:0 auto;"></div>
        </div>
    `;
    Modal.open(MODAL_ID, html);

    var root = document.querySelector('[data-modal-id="' + MODAL_ID + '"]');
    if (!root) return;

    // [FIX DESYNC] Tarik saldo asli dari server saat modal dibuka
    CloudService.getSiliconBalance().then(function(res) {
        if (!res.ok) {
            Modal.close(MODAL_ID, true);
            ToastService.error('Gagal terhubung ke server. Coba lagi.');
            return;
        }

        // Update saldo di local storage agar UI di belakang ikut sinkron
        var serverBalance = Math.floor(res.balance || 0);
        SiliconService.applyServerBalance(serverBalance);

        // Render form asli dengan saldo yang sudah 100% valid
        _renderForm(root, serverBalance);
    }).catch(function() {
        Modal.close(MODAL_ID, true);
        ToastService.error('Gagal terhubung ke server. Coba lagi.');
    });
}

function _renderForm(root, balance) {
    var html = `
        <div class="modal-title" style="display:flex; align-items:center; gap:8px;">
            ${gIcon('sil', 20)} <span>Kirim SIL</span>
        </div>
        <div class="modal-sub" style="margin-bottom:16px;">
            Kirim SIL ke pemain lain menggunakan ID Pemain (8 digit) mereka.
        </div>
        
        <div style="background:var(--bg-3); border:1px solid var(--border); border-radius:12px; padding:16px;">
            <label class="field-label">ID Pemain Tujuan</label>
            <input type="number" id="trf-target" class="field-input" placeholder="Contoh: 48271956" style="margin-bottom:8px;" autocomplete="off">
            
            <div id="trf-info" style="display:none; padding:10px; border-radius:8px; font-size:12px; margin-bottom:12px;"></div>
            
            <label class="field-label">Jumlah SIL</label>
            <input type="number" id="trf-amount" class="field-input" placeholder="Maksimal 5000" style="margin-bottom:16px;" autocomplete="off">
            
            <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-tertiary); margin-bottom:16px;">
                <span>Saldo Anda saat ini:</span>
                <b style="color:var(--accent);">${balance} SIL</b>
            </div>

            <div id="trf-error" style="display:none; color:var(--danger); font-size:12px; margin-bottom:12px; background:var(--danger-soft); padding:10px; border-radius:8px; word-break:break-word;"></div>
            
            <div style="display:flex; gap:8px;">
                <button type="button" class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
                <button type="button" class="btn-primary" id="btn-do-transfer" style="flex:1; font-weight:bold;" disabled>Kirim SIL</button>
            </div>
        </div>
    `;

    var card = root.querySelector('.modal-card') || root;
    card.innerHTML = html;

    var btnSubmit = root.querySelector('#btn-do-transfer');
    var inputTarget = root.querySelector('#trf-target');
    var inputAmount = root.querySelector('#trf-amount');
    var infoBox = root.querySelector('#trf-info');
    var errorBox = root.querySelector('#trf-error');

    inputTarget.addEventListener('input', function() {
        var targetId = parseInt(inputTarget.value, 10);
        btnSubmit.disabled = true;
        infoBox.style.display = 'none';
        errorBox.style.display = 'none';

        if (!targetId || targetId < 10000000) return;

        clearTimeout(_checkTimeout);
        _checkTimeout = setTimeout(function() {
            infoBox.style.display = 'block';
            infoBox.style.background = 'var(--bg-2)';
            infoBox.style.color = 'var(--text-secondary)';
            infoBox.innerHTML = 'Mencari pemain...';

            CloudService.getPlayerById(targetId).then(function(res) {
                if (res.ok && res.data && res.data.ok) {
                    infoBox.style.background = 'rgba(76, 175, 80, 0.1)';
                    infoBox.style.color = 'var(--success)';
                    infoBox.innerHTML = `✅ Penerima: <b>${res.data.company_name || res.data.player_name || 'Tanpa Nama'}</b>`;
                    btnSubmit.disabled = false;
                } else {
                    infoBox.style.background = 'rgba(244, 67, 54, 0.1)';
                    infoBox.style.color = 'var(--danger)';
                    infoBox.innerHTML = `❌ ID Pemain tidak ditemukan.`;
                }
            }).catch(function(err) {
                infoBox.style.background = 'rgba(244, 67, 54, 0.1)';
                infoBox.style.color = 'var(--danger)';
                infoBox.innerHTML = `Gagal mengecek ID. Coba lagi.`;
            });
        }, 800);
    });

    btnSubmit.addEventListener('click', function() {
        var targetId = parseInt(inputTarget.value, 10);
        var amount = parseInt(inputAmount.value, 10);

        if (!amount || amount <= 0) return ToastService.error('Jumlah SIL tidak valid.');
        if (amount > 5000) return ToastService.error('Maksimal pengiriman adalah 5000 SIL.');
        if (balance < amount) return ToastService.error('Saldo SIL Anda tidak cukup.');

        if (!confirm(`Kirim ${amount} SIL ke ID ${targetId}?`)) return;

        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Memproses...';
        errorBox.style.display = 'none';

        CloudService.transferSilicon(targetId, amount).then(function(res) {
            if (res.ok && res.data && res.data.ok) {
                ToastService.success(`Berhasil mengirim ${amount} SIL!`);
                Modal.close(MODAL_ID, true);
                
                if (window.__game && window.__game.cloudSync) {
                    window.__game.cloudSync.syncSilicon();
                }
            } else {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Kirim SIL';
                
                var errMsg = res.reason || 'Gagal mengirim.';
                if (errMsg.includes('insufficient_silicon')) errMsg = 'Saldo SIL di server database tidak cukup.';
                if (errMsg.includes('player_not_found')) errMsg = 'ID Pemain tujuan tidak ditemukan.';
                if (errMsg.includes('cannot_transfer_to_self')) errMsg = 'Anda tidak bisa mengirim ke diri sendiri.';
                
                errorBox.style.display = 'block';
                errorBox.innerHTML = `❌ <b>Gagal:</b> ${errMsg}`;
            }
        });
    });
}
