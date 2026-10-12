// FILE: src/ui/panels/SettingsPanel.js
import { state } from '../../core/GameState.js';
import { SaveService } from '../../core/SaveService.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { BALANCE } from '../../data/balance.data.js';

export function renderSettingsPanel() {
    const s = state.get();
    const loans = BALANCE.loans;
    return `
        <div class="card">
            <div class="card-title">Perusahaan</div>
            <div class="sum-row"><span>Nama</span><b>${s.companyName}</b></div>
            <div class="sum-row"><span>Kesulitan</span><b>${s.difficulty}</b></div>
            <div class="sum-row"><span>Uang</span><b>$${s.cash.toLocaleString('en-US')}</b></div>
        </div>

        <div class="card">
            <div class="card-title">Penyimpanan</div>
            <div class="settings-actions">
                <button class="btn-secondary" data-set="save">💾 Simpan Manual</button>
                <button class="btn-secondary" data-set="load">📂 Muat Save</button>
                <button class="btn-secondary" data-set="export">⬆️ Export JSON</button>
                <button class="btn-secondary" data-set="import">⬇️ Import JSON</button>
                <button class="btn-danger"    data-set="reset">🗑️ Reset Game</button>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Pinjaman</div>
            ${loans.map(function (l) {
                return `
                    <div class="sum-row">
                        <span>${l.label} ($${l.principal.toLocaleString('en-US')}, ${Math.round(l.monthlyInterestRate * 100)}%/bln)</span>
                        <button class="btn-secondary" data-loan="${l.id}">Ambil</button>
                    </div>
                `;
            }).join('')}
            ${s.finance.loans.length
                ? '<div style="margin-top:10px;font-size:12px;color:var(--warn);">Pinjaman aktif: ' +
                  s.finance.loans.map(function (l) { return l.label; }).join(', ') +
                  '</div>'
                : ''}
        </div>

        <div class="card">
            <div class="card-title">Preferensi</div>
            <div class="sum-row">
                <span>Getar</span>
                <button class="btn-toggle ${s.settings.vibrate ? 'on' : ''}" data-toggle="vibrate">
                    ${s.settings.vibrate ? 'ON' : 'OFF'}
                </button>
            </div>
            <div class="sum-row">
                <span>Suara</span>
                <button class="btn-toggle ${s.settings.sound ? 'on' : ''}" data-toggle="sound">
                    ${s.settings.sound ? 'ON' : 'OFF'}
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-title">Bantuan</div>
            <div class="settings-actions">
                <button class="btn-secondary" data-set="guide">📖 Panduan</button>
                <button class="btn-secondary" data-set="tutorial">🎓 Ulangi Tutorial</button>
            </div>
        </div>
    `;
}

export function bindSettingsActions(root) {
    root.addEventListener('click', function (e) {
        const setBtn = e.target.closest('[data-set]');
        const togBtn = e.target.closest('[data-toggle]');
        const loanBtn = e.target.closest('[data-loan]');

        if (setBtn) { _handleSet(setBtn.dataset.set); return; }
        if (togBtn) { _handleToggle(togBtn.dataset.toggle); return; }
        if (loanBtn) { bus.emit('settings:take-loan', { loanId: loanBtn.dataset.loan }); return; }
    });
}

function _handleSet(action) {
    switch (action) {
        case 'save':
            if (SaveService.save(state)) ToastService.success('Save tersimpan.');
            else ToastService.error('Gagal save.');
            break;
        case 'load':   _confirmLoad(); break;
        case 'export': _openExport(); break;
        case 'import': _openImport(); break;
        case 'reset':  _confirmReset(); break;
        case 'guide':  bus.emit('view:changed', { id: 'guide' }); break;
        case 'tutorial': bus.emit('tutorial:restart'); break;
    }
}

function _handleToggle(key) {
    const s = state.get();
    s.settings[key] = !s.settings[key];
    state.patch({ settings: s.settings });
    ToastService.info(key + ': ' + (s.settings[key] ? 'ON' : 'OFF'));
    bus.emit('settings:changed', s.settings);
}

function _openExport() {
    const json = SaveService.export(state);
    if (!json) { ToastService.error('Export gagal.'); return; }
    const html = `
        <div class="modal-title">Export Save</div>
        <div class="modal-sub">Salin teks ini ke catatan HP-mu untuk backup.</div>
        <textarea class="field-textarea" readonly rows="10">${json}</textarea>
        <button class="btn-secondary" data-modal-close style="margin-top:12px;">Tutup</button>
    `;
    Modal.open('export', html);
}

function _openImport() {
    const html = `
        <div class="modal-title">Import Save</div>
        <div class="modal-sub">Tempel JSON backup di bawah. Ini akan menimpa save saat ini.</div>
        <textarea class="field-textarea" data-import-text rows="10" placeholder='{"version":2,"data":{...}}'></textarea>
        <div style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-import-confirm style="flex:1;">Impor</button>
        </div>
    `;
    Modal.open('import', html);
    const root = document.querySelector('[data-modal-id="import"]');
    root.querySelector('[data-import-confirm]').addEventListener('click', function () {
        const text = root.querySelector('[data-import-text]').value;
        const data = SaveService.parseImport(text);
        if (!data) { ToastService.error('JSON tidak valid.'); return; }
        state.hydrate(data);
        SaveService.save(state);
        ToastService.success('Save diimpor. Memuat ulang...');
        setTimeout(function () { window.location.reload(); }, 800);
    });
}

function _confirmLoad() {
    if (!SaveService.hasSave()) { ToastService.warning('Tidak ada save.'); return; }
    const html = `
        <div class="modal-title">Muat Save?</div>
        <div class="modal-sub">Progres saat ini akan diganti.</div>
        <div style="display:flex;gap:8px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-primary" data-load-confirm style="flex:1;">Muat</button>
        </div>`;
    Modal.open('confirm-load', html);
    document.querySelector('[data-load-confirm]').addEventListener('click', function () {
        const data = SaveService.load();
        if (!data) { ToastService.error('Gagal memuat.'); return; }
        state.hydrate(data);
        ToastService.success('Save dimuat.');
        Modal.close('confirm-load', true);
    });
}

function _confirmReset() {
    const html = `
        <div class="modal-title">Reset Game?</div>
        <div class="modal-sub">Semua progres akan hilang dan tidak bisa dikembalikan.</div>
        <div style="display:flex;gap:8px;">
            <button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>
            <button class="btn-danger" data-reset-confirm style="flex:1;">Reset</button>
        </div>`;
    Modal.open('confirm-reset', html);
    document.querySelector('[data-reset-confirm]').addEventListener('click', function () {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
