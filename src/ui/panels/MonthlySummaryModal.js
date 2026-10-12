// FILE: src/ui/panels/MonthlySummaryModal.js
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';

export function initMonthlySummary() {
    bus.on('economy:month-processed', (entry) => _show(entry));
}

function _show(e) {
    const netColor = e.net >= 0 ? 'var(--accent)' : 'var(--danger)';
    const fmt = (n) => '$' + Math.round(n).toLocaleString('en-US');
    const html = `
        <div class="modal-title">Laporan Bulan ${e.month}/${e.year}</div>
        <div class="modal-sub">Ringkasan keuangan otomatis.</div>
        <div class="sum-row"><span>Pemasukan</span><b>${fmt(e.income)}</b></div>
        <div class="sum-row"><span>Gaji tim</span><b>-${fmt(e.breakdown.salary)}</b></div>
        <div class="sum-row"><span>Sewa & utilitas</span><b>-${fmt(e.breakdown.fixed)}</b></div>
        <div class="sum-row"><span>Bunga pinjaman</span><b>-${fmt(e.breakdown.loanInterest)}</b></div>
        <div class="sum-row"><span>Pajak</span><b>-${fmt(e.tax)}</b></div>
        <div class="sum-row total">
            <span>Laba Bersih</span>
            <b style="color:${netColor}">${e.net >= 0 ? '+' : ''}${fmt(e.net)}</b>
        </div>
        <div class="sum-row"><span>Saldo akhir</span><b>${fmt(e.cash)}</b></div>
        <button class="btn-primary" data-modal-close style="margin-top:16px;">Tutup</button>
    `;
    Modal.open('monthly-summary', html);
}
