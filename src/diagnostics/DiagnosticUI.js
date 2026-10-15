// FILE: src/diagnostics/DiagnosticUI.js
// v2027.1a — Modal tampilan report + tombol copy.
import { Modal } from '../ui/modal.js';
import { ToastService } from '../core/ToastService.js';
import { buildReport, formatReportText } from './DiagnosticReport.js';

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function openDiagnosticModal() {
    var game = window.__game;
    if (!game || !game.state) {
        ToastService.error('Game belum siap.');
        return;
    }
    var state = game.state.get();
    var report = buildReport(state, game, { detailed: true });
    var text = formatReportText(report);

    var alertCount = (report.sanity && report.sanity.alerts) ? report.sanity.alerts.length : 0;
    var statusColor = alertCount === 0 ? 'var(--success)' : 'var(--warn)';
    var statusLabel = alertCount === 0 ? 'Semua sistem sehat' : alertCount + ' anomali terdeteksi';

    var html =
        '<div class="modal-title">Diagnostic Report</div>' +
        '<div class="modal-sub">Snapshot kondisi game. Cocokkan dengan AI untuk diagnosa.</div>' +

        '<div style="background:rgba(79,140,255,0.08);padding:10px 12px;border-radius:8px;margin-bottom:12px;">' +
            '<div style="font-size:11px;color:var(--text-mute);letter-spacing:0.5px;">STATUS</div>' +
            '<div style="font-size:14px;font-weight:700;color:' + statusColor + ';">' + statusLabel + '</div>' +
        '</div>' +

        '<div style="margin-bottom:8px;font-size:11px;font-weight:700;color:var(--text-mute);letter-spacing:0.4px;">' +
            'REPORT TEKS (siap copy)' +
        '</div>' +
        '<textarea readonly data-diag-text ' +
            'style="width:100%;height:280px;padding:10px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;' +
            'background:var(--bg-3);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);' +
            'line-height:1.45;resize:vertical;white-space:pre;overflow:auto;">' +
            escapeHtml(text) +
        '</textarea>' +

        '<div style="display:flex;gap:8px;margin-top:12px;">' +
            '<button class="btn-secondary" data-modal-close style="flex:1;padding:10px;">Tutup</button>' +
            '<button class="btn-primary" data-diag-copy style="flex:1;padding:10px;font-weight:700;">Copy Teks</button>' +
        '</div>' +

        '<div style="font-size:10.5px;color:var(--text-mute);margin-top:10px;line-height:1.5;">' +
            'Tips: pilih semua teks → copy → paste ke DeepSeek/ChatGPT untuk diagnosa.' +
        '</div>';

    Modal.open('diagnostic-report', html);

    var root = document.querySelector('[data-modal-id="diagnostic-report"]');
    if (!root) return;
    var textarea = root.querySelector('[data-diag-text]');
    var copyBtn = root.querySelector('[data-diag-copy]');

    if (textarea) {
        textarea.addEventListener('focus', function () { textarea.select(); });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function () {
                        ToastService.success('Report di-copy ke clipboard.');
                    }).catch(function () {
                        _fallbackCopy(textarea, text);
                    });
                } else {
                    _fallbackCopy(textarea, text);
                }
            } catch (e) {
                _fallbackCopy(textarea, text);
            }
        });
    }
}

function _fallbackCopy(textarea, text) {
    try {
        if (textarea) { textarea.focus(); textarea.select(); }
        var ok = document.execCommand && document.execCommand('copy');
        if (ok) ToastService.success('Report di-copy.');
        else ToastService.warning('Copy gagal — pilih teks manual lalu copy.');
    } catch (e) {
        ToastService.warning('Copy gagal — pilih teks manual lalu copy.');
    }
}
