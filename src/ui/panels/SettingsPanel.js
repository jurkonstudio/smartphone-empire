// FILE: src/ui/panels/SettingsPanel.js
// v2027.5 — Executive Console redesign.
// Hero card + 5 sub-tab (Umum/Tampilan/Audio/Keuangan/Data).
// In-family dengan Research/OS/Dashboard panel.
import { state } from '../../core/GameState.js';
import { SaveService } from '../../core/SaveService.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { BALANCE } from '../../data/balance.data.js';
import { ThemeService } from '../../core/ThemeService.js';
import { THEMES, ACCENTS } from '../../data/theme.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { APP_CONFIG } from '../../config/app.config.js';

// ============================================================
// STATE (module-level — persist antar render)
// ============================================================
let _activeTab = 'umum';

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const TABS = [
    { id: 'umum',     label: 'Umum',     icon: 'settings' },
    { id: 'tampilan', label: 'Tampilan', icon: 'palette' },
    { id: 'audio',    label: 'Audio',    icon: 'bell' },
    { id: 'keuangan', label: 'Keuangan', icon: 'coin' },
    { id: 'data',     label: 'Data',     icon: 'database' }
];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ============================================================
// MAIN RENDER
// ============================================================
export function renderSettingsPanel() {
    const s = state.get();
    return _heroCard(s) + _tabBar() + _tabContent(s);
}

// ============================================================
// HERO COMPANY CARD
// ============================================================
function _heroCard(s) {
    const t = s.time || {};
    const monthShort = MONTH_SHORT[(t.currentMonth || 1) - 1] || '';
    const founded = t.currentDay + ' ' + monthShort + ' ' + t.currentYear;
    const diffLabel = { santai: 'Santai', normal: 'Normal', sulit: 'Sulit' }[s.difficulty] || s.difficulty || 'Normal';
    const rep = (s.market && typeof s.market.reputation === 'number') ? s.market.reputation : 0;
    const team = s.team ? ((s.team.engineers || 0) + (s.team.designers || 0) + (s.team.marketers || 0)) : 0;
    const initial = (s.companyName || 'M').charAt(0).toUpperCase();

    return '<div class="settings-hero">' +
        '<div class="settings-hero-top">' +
            '<div class="settings-hero-logo">' + escapeHtml(initial) + '</div>' +
            '<div class="settings-hero-info">' +
                '<div class="settings-hero-name">' + escapeHtml(s.companyName || 'My Tech Co') + '</div>' +
                '<div class="settings-hero-meta">Didirikan ' + escapeHtml(founded) + ' · ' + escapeHtml(diffLabel) + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="settings-hero-kpi">' +
            _kpi('Cash', '$' + (s.cash || 0).toLocaleString('en-US')) +
            _kpi('Reputasi', String(rep)) +
            _kpi('Tim', String(team)) +
        '</div>' +
        '</div>';
}

function _kpi(label, value) {
    return '<div class="settings-kpi">' +
        '<div class="settings-kpi-label">' + escapeHtml(label) + '</div>' +
        '<div class="settings-kpi-value">' + escapeHtml(value) + '</div>' +
        '</div>';
}

// ============================================================
// TAB BAR
// ============================================================
function _tabBar() {
    return '<div class="settings-tabs">' +
        TABS.map(function (t) {
            var cls = 'settings-tab' + (_activeTab === t.id ? ' active' : '');
            return '<button class="' + cls + '" data-set-tab="' + t.id + '" type="button">' +
                renderIcon(t.icon, 13) +
                '<span>' + escapeHtml(t.label) + '</span>' +
                '</button>';
        }).join('') +
        '</div>';
}

// ============================================================
// TAB CONTENT
// ============================================================
function _tabContent(s) {
    switch (_activeTab) {
        case 'tampilan': return _tabTampilan(s);
        case 'audio':    return _tabAudio(s);
        case 'keuangan': return _tabKeuangan(s);
        case 'data':     return _tabData(s);
        default:         return _tabUmum(s);
    }
}

// ============================================================
// TAB — UMUM
// ============================================================
function _tabUmum(s) {
    const foundedLabel = _formatFounded(s);

    return _section('settings', 'Perusahaan',
        _row({ label: 'Nama', value: escapeHtml(s.companyName || '—'), action: true, attrs: 'data-set="edit-name"', chevron: true }) +
        _row({ label: 'Kesulitan', value: escapeHtml(_diffLabel(s.difficulty)) }) +
        _row({ label: 'Didirikan', value: escapeHtml(foundedLabel) })
    ) +
    _section('question', 'Bantuan',
        _row({ label: 'Panduan', hint: 'Cara bermain & tips', action: true, attrs: 'data-set="guide"', chevron: true }) +
        _row({ label: 'Ulangi Tutorial', hint: 'Mulai dari langkah pertama', action: true, attrs: 'data-set="tutorial"', chevron: true })
    );
}

function _formatFounded(s) {
    const t = s.time || {};
    const monthShort = MONTH_SHORT[(t.currentMonth || 1) - 1] || '';
    return t.currentDay + ' ' + monthShort + ' ' + t.currentYear;
}

function _diffLabel(diff) {
    return { santai: 'Santai', normal: 'Normal', sulit: 'Sulit' }[diff] || diff || 'Normal';
}

// ============================================================
// TAB — TAMPILAN
// ============================================================
function _tabTampilan(s) {
    const currentTheme  = ThemeService.getTheme();
    const currentAccent = ThemeService.getAccent();

    const themeSegment = '<div class="settings-segment">' +
        '<button class="settings-seg-btn' + (currentTheme === 'dark' ? ' active' : '') + '" data-theme-pick="dark" type="button">' +
            renderIcon('moon', 14) + '<span>Gelap</span>' +
        '</button>' +
        '<button class="settings-seg-btn' + (currentTheme === 'light' ? ' active' : '') + '" data-theme-pick="light" type="button">' +
            renderIcon('sun', 14) + '<span>Terang</span>' +
        '</button>' +
        '</div>';

    const accentPicker = '<div class="settings-accent-picker">' +
        ACCENTS.map(function (a) {
            var cls = 'accent-dot' + (currentAccent === a.id ? ' active' : '');
            return '<button class="' + cls + '" data-accent-pick="' + a.id + '" type="button" ' +
                'style="background:' + a.hex + ';" ' +
                'aria-label="' + escapeHtml(a.label) + '" ' +
                'title="' + escapeHtml(a.label) + '"></button>';
        }).join('') +
        '</div>';

    return '<div class="settings-section">' +
        '<div class="settings-section-head">' + renderIcon('palette', 12) + 'Tema</div>' +
        '<div class="settings-picker-block">' + themeSegment + '</div>' +
        '<div class="settings-picker-block">' +
            '<div class="settings-picker-label">Warna Aksen</div>' +
            accentPicker +
            '<div class="settings-picker-hint">Warna utama untuk tombol & highlight.</div>' +
        '</div>' +
        '</div>';
}

// ============================================================
// TAB — AUDIO
// ============================================================
function _tabAudio(s) {
    const vib = !!(s.settings && s.settings.vibrate);
    const snd = !!(s.settings && s.settings.sound);

    return _section('bell', 'Suara & Getar',
        _row({ label: 'Suara', hint: snd ? 'Efek suara aktif' : 'Efek suara mati', switchOn: snd, attrs: 'data-toggle="sound"' }) +
        _row({ label: 'Getar', hint: vib ? 'Umpan balik haptic aktif' : 'Umpan balik haptic mati', switchOn: vib, attrs: 'data-toggle="vibrate"' })
    );
}

// ============================================================
// TAB — KEUANGAN
// ============================================================
function _tabKeuangan(s) {
    const activeLoans = (s.finance && s.finance.loans) ? s.finance.loans : [];

    let activeHtml = '';
    if (activeLoans.length) {
        activeHtml = activeLoans.map(function (l) {
            return _row({
                label: escapeHtml(l.label || l.id),
                hint: 'Sisa $' + (l.remaining || 0).toLocaleString('en-US') + ' · ' + Math.round((l.monthlyInterestRate || 0) * 100) + '%/bln'
            });
        }).join('');
    } else {
        activeHtml = '<div class="settings-empty">Tidak ada pinjaman aktif.</div>';
    }

    const offersHtml = BALANCE.loans.map(function (l) {
        return _row({
            label: escapeHtml(l.label),
            hint: '$' + l.principal.toLocaleString('en-US') + ' · ' + Math.round(l.monthlyInterestRate * 100) + '%/bln · ' + l.termMonths + ' bulan',
            action: true,
            attrs: 'data-loan="' + l.id + '"',
            chevron: true
        });
    }).join('');

    return _section('coin', 'Pinjaman Aktif', activeHtml) +
           _section('coin', 'Ambil Pinjaman', offersHtml);
}

// ============================================================
// TAB — DATA
// ============================================================
function _tabData(s) {
    const version = (APP_CONFIG && APP_CONFIG.version) ? APP_CONFIG.version : 'dev';

    return _section('folder', 'Penyimpanan',
        _row({ label: 'Simpan Manual', hint: 'Simpan progres sekarang', action: true, attrs: 'data-set="save"', chevron: true }) +
        _row({ label: 'Muat Save', hint: 'Kembali ke save terakhir', action: true, attrs: 'data-set="load"', chevron: true }) +
        _row({ label: 'Export JSON', hint: 'Salin data sebagai teks', action: true, attrs: 'data-set="export"', chevron: true }) +
        _row({ label: 'Import JSON', hint: 'Tempel backup untuk memuat', action: true, attrs: 'data-set="import"', chevron: true })
    ) +
    _sectionDanger('warn', 'Zona Bahaya',
        _row({ label: 'Reset Perusahaan', hint: 'Hapus semua progres, mulai dari nol', action: true, danger: true, attrs: 'data-set="reset"', chevron: true })
    ) +
    '<div class="settings-footer">' + escapeHtml(APP_CONFIG.name || 'Smartphone Empire') + ' · v' + escapeHtml(version) + '</div>';
}

// ============================================================
// COMPONENTS
// ============================================================
function _section(iconId, title, contentHtml) {
    var icon = iconId ? renderIcon(iconId, 12) : '';
    return '<div class="settings-section">' +
        '<div class="settings-section-head">' + icon + escapeHtml(title) + '</div>' +
        '<div class="settings-list">' + contentHtml + '</div>' +
        '</div>';
}

function _sectionDanger(iconId, title, contentHtml) {
    var icon = iconId ? renderIcon(iconId, 12) : '';
    return '<div class="settings-section settings-section-danger">' +
        '<div class="settings-section-head">' + icon + escapeHtml(title) + '</div>' +
        '<div class="settings-list">' + contentHtml + '</div>' +
        '</div>';
}

function _row(opts) {
    var cls = 'settings-row';
    if (opts.action) cls += ' settings-row-action';
    if (opts.danger) cls += ' settings-row-danger';
    if (opts.disabled) cls += ' settings-row-disabled';

    var attrs = opts.attrs || '';
    var labelHtml = '<div class="settings-row-main">' +
        '<div class="settings-row-label">' + (opts.labelHtml || escapeHtml(opts.label || '')) + '</div>' +
        (opts.hint ? '<div class="settings-row-hint">' + (opts.hintHtml || escapeHtml(opts.hint)) + '</div>' : '') +
        '</div>';

    var rightHtml = '<div class="settings-row-right">';

    if (opts.switchOn != null) {
        rightHtml += '<button class="toggle-switch' + (opts.switchOn ? ' on' : '') + '" ' + attrs + ' type="button" aria-label="Toggle"><span class="toggle-thumb"></span></button>';
        attrs = '';
    } else if (opts.value != null && opts.value !== '') {
        rightHtml += '<span class="settings-row-value">' + opts.value + '</span>';
    }

    if (opts.action && opts.switchOn == null) {
        rightHtml += '<span class="settings-row-chevron">›</span>';
    }

    rightHtml += '</div>';

    return '<div class="' + cls + '" ' + attrs + '>' + labelHtml + rightHtml + '</div>';
}

// ============================================================
// BIND
// ============================================================
export function bindSettingsActions(root) {
    if (!root) return;

    root.addEventListener('click', function (e) {
        var tabBtn = e.target.closest('[data-set-tab]');
        if (tabBtn) {
            e.preventDefault();
            _activeTab = tabBtn.dataset.setTab;
            window.__game.render();
            return;
        }

        var themeBtn = e.target.closest('[data-theme-pick]');
        if (themeBtn) {
            e.preventDefault();
            var tid = themeBtn.dataset.themePick;
            ThemeService.setTheme(tid);
            var label = (tid === 'dark') ? 'Gelap' : 'Terang';
            ToastService.info('Tema: ' + label);
            window.__game.render();
            return;
        }

        var accentBtn = e.target.closest('[data-accent-pick]');
        if (accentBtn) {
            e.preventDefault();
            ThemeService.setAccent(accentBtn.dataset.accentPick);
            ToastService.info('Warna aksen diperbarui.');
            window.__game.render();
            return;
        }

        var setBtn = e.target.closest('[data-set]');
        if (setBtn) {
            e.preventDefault();
            _handleSet(setBtn.dataset.set);
            return;
        }

        var togBtn = e.target.closest('[data-toggle]');
        if (togBtn) {
            e.preventDefault();
            _handleToggle(togBtn.dataset.toggle);
            return;
        }

        var loanBtn = e.target.closest('[data-loan]');
        if (loanBtn) {
            e.preventDefault();
            bus.emit('settings:take-loan', { loanId: loanBtn.dataset.loan });
            return;
        }
    });
}

// ============================================================
// HANDLERS
// ============================================================
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
        case 'guide':  bus.emit('view:changed', { id: 'guide' }); window.__game.navigate('guide'); break;
        case 'tutorial': bus.emit('tutorial:restart'); break;
        case 'edit-name': _openEditName(); break;
    }
}

function _handleToggle(key) {
    const s = state.get();
    s.settings[key] = !s.settings[key];
    state.patch({ settings: s.settings });
    ToastService.info(key + ': ' + (s.settings[key] ? 'ON' : 'OFF'));
    bus.emit('settings:changed', s.settings);
    window.__game.render();
}

// ============================================================
// MODAL — EDIT NAMA PERUSAHAAN
// ============================================================
function _openEditName() {
    const s = state.get();
    const html = '<div class="modal-title">Ubah Nama Perusahaan</div>' +
        '<div class="modal-sub">Nama ini tampil di header dan laporan bulanan.</div>' +
        '<label class="field-label">Nama Perusahaan</label>' +
        '<input class="field-input" data-edit-company-name maxlength="32" value="' + escapeHtml(s.companyName || '') + '" autocomplete="off" />' +
        '<div style="display:flex;gap:8px;margin-top:16px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>' +
        '<button class="btn-primary" data-edit-company-confirm style="flex:1;">Simpan</button>' +
        '</div>';

    Modal.open('edit-company-name', html);

    const root = document.querySelector('[data-modal-id="edit-company-name"]');
    if (!root) return;
    const input = root.querySelector('[data-edit-company-name]');
    if (input) input.focus();

    root.querySelector('[data-edit-company-confirm]').addEventListener('click', function () {
        const val = (input.value || '').trim();
        if (!val) { ToastService.error('Nama tidak boleh kosong.'); return; }
        if (val.length > 32) { ToastService.error('Maksimal 32 karakter.'); return; }
        state.patch({ companyName: val });
        Modal.close('edit-company-name', true);
        ToastService.success('Nama diperbarui.');
        window.__game.render();
    });
}

// ============================================================
// MODAL — EXPORT / IMPORT / LOAD / RESET (tidak berubah)
// ============================================================
function _openExport() {
    const json = SaveService.export(state);
    if (!json) { ToastService.error('Export gagal.'); return; }
    const html = '<div class="modal-title">Export Save</div>' +
        '<div class="modal-sub">Salin teks ini ke catatan HP-mu untuk backup.</div>' +
        '<textarea class="field-textarea" readonly rows="10">' + escapeHtml(json) + '</textarea>' +
        '<button class="btn-secondary" data-modal-close style="margin-top:12px;width:100%;">Tutup</button>';
    Modal.open('export', html);
}

function _openImport() {
    const html = '<div class="modal-title">Import Save</div>' +
        '<div class="modal-sub">Tempel JSON backup di bawah. Ini akan menimpa save saat ini.</div>' +
        '<textarea class="field-textarea" data-import-text rows="10" placeholder=\'{"version":3,"data":{...}}\'></textarea>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>' +
        '<button class="btn-primary" data-import-confirm style="flex:1;">Impor</button>' +
        '</div>';
    Modal.open('import', html);
    const root = document.querySelector('[data-modal-id="import"]');
    if (!root) return;
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
    const html = '<div class="modal-title">Muat Save?</div>' +
        '<div class="modal-sub">Progres saat ini akan diganti.</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>' +
        '<button class="btn-primary" data-load-confirm style="flex:1;">Muat</button>' +
        '</div>';
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
    const html = '<div class="modal-title">Reset Game?</div>' +
        '<div class="modal-sub">Semua progres akan hilang dan tidak bisa dikembalikan.</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">Batal</button>' +
        '<button class="btn-danger" data-reset-confirm style="flex:1;">Reset</button>' +
        '</div>';
    Modal.open('confirm-reset', html);
    document.querySelector('[data-reset-confirm]').addEventListener('click', function () {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
