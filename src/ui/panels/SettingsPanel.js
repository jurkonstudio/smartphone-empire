// FILE: src/ui/panels/SettingsPanel.js
// v2027.33b — validasi nama via name-blocklist.data.js
import { renderCloudPanel, bindCloudUI } from '../../cloud/CloudUI.js';
import { state } from '../../core/GameState.js';
import { SaveService } from '../../core/SaveService.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { Modal } from '../modal.js';
import { BALANCE } from '../../data/balance.data.js';
import { ThemeService } from '../../core/ThemeService.js';
import { LanguageService, t } from '../../core/LanguageService.js';
import { THEMES, ACCENTS } from '../../data/theme.data.js';
import { renderIcon } from '../icons/FeatureIcons.js';
import { APP_CONFIG } from '../../config/app.config.js';
import { SUPPORTED_LANGS } from '../../data/i18n/index.js';
import { validateCompanyName } from '../../data/name-blocklist.data.js';

let _activeTab = 'umum';
let _boundRoot = null;

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const TABS = [
    { id: 'umum',     key: 'settings.tab.general',    icon: 'settings' },
    { id: 'tampilan', key: 'settings.tab.appearance', icon: 'palette' },
    { id: 'audio',    key: 'settings.tab.audio',      icon: 'bell' },
    { id: 'keuangan', key: 'settings.tab.finance',    icon: 'coin' },
    { id: 'bahasa',   key: 'settings.tab.language',   icon: 'globe' },
    { id: 'data',     key: 'settings.tab.data',       icon: 'database' }
];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function _reasonToKey(reason) {
    switch (reason) {
        case 'empty':      return 'settings.edit_name.error_empty';
        case 'too_short':  return 'settings.edit_name.error_too_short';
        case 'too_long':   return 'settings.edit_name.error_long';
        case 'competitor': return 'settings.edit_name.error_competitor';
        case 'brand':      return 'settings.edit_name.error_brand';
        case 'profanity':  return 'settings.edit_name.error_profanity';
        default:           return 'settings.edit_name.error_profanity';
    }
}

export function renderSettingsPanel() {
    const s = state.get();
    return _heroCard(s) + _tabBar() + _tabContent(s);
}

function _heroCard(s) {
    const time = s.time || {};
    const monthShort = MONTH_SHORT[(time.currentMonth || 1) - 1] || '';
    const founded = time.currentDay + ' ' + monthShort + ' ' + time.currentYear;
    const diffKey = 'settings.difficulty.' + (s.difficulty || 'normal');
    const diffLabel = t(diffKey);
    const rep = (s.market && typeof s.market.reputation === 'number') ? s.market.reputation : 0;
    const team = s.team ? ((s.team.engineers || 0) + (s.team.designers || 0) + (s.team.marketers || 0)) : 0;
    const initial = (s.companyName || 'M').charAt(0).toUpperCase();

    return '<div class="settings-hero">' +
        '<div class="settings-hero-top">' +
            '<div class="settings-hero-logo">' + escapeHtml(initial) + '</div>' +
            '<div class="settings-hero-info">' +
                '<div class="settings-hero-name">' + escapeHtml(s.companyName || 'My Tech Co') + '</div>' +
                '<div class="settings-hero-meta">' + escapeHtml(t('settings.row.founded')) + ' ' + escapeHtml(founded) + ' · ' + escapeHtml(diffLabel) + '</div>' +
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

function _tabBar() {
    return '<div class="settings-tabs">' +
        TABS.map(function (tab) {
            var cls = 'settings-tab' + (_activeTab === tab.id ? ' active' : '');
            return '<button class="' + cls + '" data-set-tab="' + tab.id + '" type="button">' +
                renderIcon(tab.icon, 13) +
                '<span>' + escapeHtml(t(tab.key)) + '</span>' +
                '</button>';
        }).join('') +
        '</div>';
}

function _tabContent(s) {
    switch (_activeTab) {
        case 'tampilan': return _tabTampilan(s);
        case 'audio':    return _tabAudio(s);
        case 'keuangan': return _tabKeuangan(s);
        case 'bahasa':   return _tabBahasa(s);
        case 'data':     return _tabData(s);
        default:         return _tabUmum(s);
    }
}

function _tabUmum(s) {
    return _section('settings', t('settings.section.company'),
        _row({ label: t('settings.row.name'), value: escapeHtml(s.companyName || '—'), action: true, attrs: 'data-set="edit-name"', chevron: true }) +
        _row({ label: t('settings.row.difficulty'), value: escapeHtml(t('settings.difficulty.' + (s.difficulty || 'normal'))) }) +
        _row({ label: t('settings.row.founded'), value: escapeHtml(_formatFounded(s)) })
    ) +
    _section('question', t('settings.section.help'),
        _row({ label: t('settings.row.guide'), hint: t('settings.row.guide_hint'), action: true, attrs: 'data-set="guide"', chevron: true }) +
        _row({ label: t('settings.row.tutorial'), hint: t('settings.row.tutorial_hint'), action: true, attrs: 'data-set="tutorial"', chevron: true })
    );
}

function _formatFounded(s) {
    const time = s.time || {};
    const monthShort = MONTH_SHORT[(time.currentMonth || 1) - 1] || '';
    return time.currentDay + ' ' + monthShort + ' ' + time.currentYear;
}

function _tabTampilan() {
    const currentTheme  = ThemeService.getTheme();
    const currentAccent = ThemeService.getAccent();

    const themeSegment = '<div class="settings-segment">' +
        '<button class="settings-seg-btn' + (currentTheme === 'dark' ? ' active' : '') + '" data-theme-pick="dark" type="button">' +
            renderIcon('moon', 14) + '<span>' + escapeHtml(t('settings.row.theme_dark') || 'Dark') + '</span>' +
        '</button>' +
        '<button class="settings-seg-btn' + (currentTheme === 'light' ? ' active' : '') + '" data-theme-pick="light" type="button">' +
            renderIcon('sun', 14) + '<span>' + escapeHtml(t('settings.row.theme_light') || 'Light') + '</span>' +
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
        '<div class="settings-section-head">' + renderIcon('palette', 12) + escapeHtml(t('settings.section.theme')) + '</div>' +
        '<div class="settings-picker-block">' + themeSegment + '</div>' +
        '<div class="settings-picker-block">' +
            '<div class="settings-picker-label">' + escapeHtml(t('settings.section.accent')) + '</div>' +
            accentPicker +
            '<div class="settings-picker-hint">' + escapeHtml(t('settings.hint.accent')) + '</div>' +
        '</div>' +
        '</div>';
}

function _tabAudio(s) {
    const vib = !!(s.settings && s.settings.vibrate);
    const snd = !!(s.settings && s.settings.sound);

    return _section('bell', t('settings.section.audio_haptic'),
        _row({ label: t('settings.row.sound'),   hint: snd ? t('settings.sound_on') : t('settings.sound_off'),   switchOn: snd, attrs: 'data-toggle="sound"' }) +
        _row({ label: t('settings.row.vibrate'), hint: vib ? t('settings.vibrate_on') : t('settings.vibrate_off'), switchOn: vib, attrs: 'data-toggle="vibrate"' })
    );
}

function _tabKeuangan(s) {
    const activeLoans = (s.finance && s.finance.loans) ? s.finance.loans : [];

    let activeHtml = '';
    if (activeLoans.length) {
        activeHtml = activeLoans.map(function (l) {
            return _row({
                label: escapeHtml(l.label || l.id),
                hint: 'Sisa $' + (l.remaining || 0).toLocaleString('en-US') + ' · ' + Math.round((l.monthlyInterestRate || 0) * 100) + '%/mo'
            });
        }).join('');
    } else {
        activeHtml = '<div class="settings-empty">' + escapeHtml(t('settings.empty.loans')) + '</div>';
    }

    const offersHtml = BALANCE.loans.map(function (l) {
        return _row({
            label: escapeHtml(l.label),
            hint: '$' + l.principal.toLocaleString('en-US') + ' · ' + Math.round(l.monthlyInterestRate * 100) + '%/mo · ' + l.termMonths + ' mo',
            action: true,
            attrs: 'data-loan="' + l.id + '"',
            chevron: true
        });
    }).join('');

    return _section('coin', t('settings.section.loans_active'), activeHtml) +
           _section('coin', t('settings.section.loans_take'), offersHtml);
}

function _tabBahasa() {
    const current = LanguageService.getLang();
    const langs = LanguageService.getSupported();

    const rows = langs.map(function (lang) {
        var isActive = lang.id === current;
        var activeTag = isActive ? '<span class="settings-lang-check">✓</span>' : '';
        return '<button class="settings-lang-row' + (isActive ? ' active' : '') + '" data-lang-pick="' + lang.id + '" type="button">' +
            '<div class="settings-lang-main">' +
                '<div class="settings-lang-label">' + escapeHtml(lang.label) + '</div>' +
                (isActive ? '<div class="settings-lang-meta">' + escapeHtml(t('settings.lang.active')) + '</div>' : '') +
            '</div>' +
            activeTag +
            '</button>';
    }).join('');

    return '<div class="settings-section">' +
        '<div class="settings-section-head">' + renderIcon('globe', 12) + escapeHtml(t('settings.section.language')) + '</div>' +
        '<div class="settings-list settings-list-langs">' + rows + '</div>' +
        '<div class="settings-lang-hint">' + escapeHtml(t('settings.lang.hint')) + '</div>' +
        '</div>';
}

function _tabData() {
    const version = (APP_CONFIG && APP_CONFIG.version) ? APP_CONFIG.version : 'dev';

    return _section('folder', t('settings.section.storage'),
        _row({ label: t('settings.row.save'), hint: t('settings.row.save_hint'), action: true, attrs: 'data-set="save"', chevron: true }) +
        _row({ label: t('settings.row.load'), hint: t('settings.row.load_hint'), action: true, attrs: 'data-set="load"', chevron: true }) +
        _row({ label: t('settings.row.export'), hint: t('settings.row.export_hint'), action: true, attrs: 'data-set="export"', chevron: true }) +
        _row({ label: t('settings.row.import'), hint: t('settings.row.import_hint'), action: true, attrs: 'data-set="import"', chevron: true })
    ) +
    _sectionDanger('warn', t('settings.section.danger'),
        _row({ label: t('settings.row.reset'), hint: t('settings.row.reset_hint'), action: true, danger: true, attrs: 'data-set="reset"', chevron: true })
    ) +
    '<div class="settings-footer">' + escapeHtml(APP_CONFIG.name || 'Smartphone Empire') + ' · v' + escapeHtml(version) + '</div>';
}

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
    } else if (opts.value != null && opts.value !== '') {
        rightHtml += '<span class="settings-row-value">' + opts.value + '</span>';
    }

    if (opts.action && opts.switchOn == null) {
        rightHtml += '<span class="settings-row-chevron">›</span>';
    }

    rightHtml += '</div>';

    return '<div class="' + cls + '" ' + attrs + '>' + labelHtml + rightHtml + '</div>';
}

export function bindSettingsActions(root) {
    if (!root) return;
    if (_boundRoot === root) return;
    _boundRoot = root;

    root.addEventListener('click', function (e) {
        var tabBtn = e.target.closest('[data-set-tab]');
        if (tabBtn) {
            e.preventDefault();
            _activeTab = tabBtn.dataset.setTab;
            window.__game.render();
            return;
        }

        var langBtn = e.target.closest('[data-lang-pick]');
        if (langBtn) {
            e.preventDefault();
            var newLang = langBtn.dataset.langPick;
            var ok = LanguageService.setLang(newLang);
            if (ok) {
                var label = newLang === 'id' ? t('settings.lang.indonesian') : t('settings.lang.english');
                ToastService.info(t('toast.lang_changed', { value: label }));
            }
            return;
        }

        var themeBtn = e.target.closest('[data-theme-pick]');
        if (themeBtn) {
            e.preventDefault();
            ThemeService.setTheme(themeBtn.dataset.themePick);
            ToastService.info(t('toast.theme_changed', { value: themeBtn.dataset.themePick }));
            window.__game.render();
            return;
        }

        var accentBtn = e.target.closest('[data-accent-pick]');
        if (accentBtn) {
            e.preventDefault();
            ThemeService.setAccent(accentBtn.dataset.accentPick);
            ToastService.info(t('toast.accent_changed'));
            window.__game.render();
            return;
        }

        var setBtn = e.target.closest('[data-set]');
        if (setBtn) { e.preventDefault(); _handleSet(setBtn.dataset.set); return; }

        var togBtn = e.target.closest('[data-toggle]');
        if (togBtn) { e.preventDefault(); _handleToggle(togBtn.dataset.toggle); return; }

        var loanBtn = e.target.closest('[data-loan]');
        if (loanBtn) { e.preventDefault(); bus.emit('settings:take-loan', { loanId: loanBtn.dataset.loan }); return; }
    });
}

function _handleSet(action) {
    switch (action) {
        case 'save':
            if (SaveService.save(state)) ToastService.success(t('toast.save_ok'));
            else ToastService.error(t('toast.save_fail'));
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

function _openEditName() {
    const s = state.get();
    const html = '<div class="modal-title">' + escapeHtml(t('settings.edit_name.title')) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(t('settings.edit_name.sub')) + '</div>' +
        '<label class="field-label">' + escapeHtml(t('settings.edit_name.label')) + '</label>' +
        '<input class="field-input" data-edit-company-name maxlength="24" value="' + escapeHtml(s.companyName || '') + '" placeholder="' + escapeHtml(t('settings.edit_name.placeholder')) + '" autocomplete="off" />' +
        '<div data-edit-name-error style="display:none;color:var(--danger);font-size:12px;margin-top:6px;line-height:1.4;"></div>' +
        '<div style="display:flex;gap:8px;margin-top:16px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('common.cancel')) + '</button>' +
        '<button class="btn-primary" data-edit-company-confirm style="flex:1;">' + escapeHtml(t('common.save')) + '</button>' +
        '</div>';

    Modal.open('edit-company-name', html);

    const root = document.querySelector('[data-modal-id="edit-company-name"]');
    if (!root) return;
    const input = root.querySelector('[data-edit-company-name]');
    const errorEl = root.querySelector('[data-edit-name-error]');
    if (input) input.focus();

    function _clearError() {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
        input.style.borderColor = '';
    }

    function _showError(key) {
        errorEl.textContent = t(key);
        errorEl.style.display = 'block';
        input.style.borderColor = 'var(--danger)';
    }

    if (input) input.addEventListener('input', _clearError);

    root.querySelector('[data-edit-company-confirm]').addEventListener('click', function () {
        const result = validateCompanyName(input.value);
        if (!result.ok) {
            _showError(_reasonToKey(result.reason));
            input.focus();
            return;
        }
        const finalName = input.value.trim();
        state.patch({ companyName: finalName });
        Modal.close('edit-company-name', true);
        ToastService.success(t('settings.edit_name.success'));
        window.__game.render();
    });
}

function _openExport() {
    const json = SaveService.export(state);
    if (!json) { ToastService.error('Export failed.'); return; }
    const html = '<div class="modal-title">Export Save</div>' +
        '<div class="modal-sub">Copy this text for backup.</div>' +
        '<textarea class="field-textarea" readonly rows="10">' + escapeHtml(json) + '</textarea>' +
        '<button class="btn-secondary" data-modal-close style="margin-top:12px;width:100%;">' + escapeHtml(t('common.tutup')) + '</button>';
    Modal.open('export', html);
}

function _openImport() {
    const html = '<div class="modal-title">Import Save</div>' +
        '<div class="modal-sub">Paste JSON backup below. This overwrites current save.</div>' +
        '<textarea class="field-textarea" data-import-text rows="10" placeholder=\'{"version":3,"data":{...}}\'></textarea>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('common.cancel')) + '</button>' +
        '<button class="btn-primary" data-import-confirm style="flex:1;">' + escapeHtml(t('common.import')) + '</button>' +
        '</div>';
    Modal.open('import', html);
    const root = document.querySelector('[data-modal-id="import"]');
    if (!root) return;
    root.querySelector('[data-import-confirm]').addEventListener('click', function () {
        const text = root.querySelector('[data-import-text]').value;
        const data = SaveService.parseImport(text);
        if (!data) { ToastService.error('Invalid JSON.'); return; }
        state.hydrate(data);
        SaveService.save(state);
        ToastService.success('Save imported. Reloading...');
        setTimeout(function () { window.location.reload(); }, 800);
    });
}

function _confirmLoad() {
    if (!SaveService.hasSave()) { ToastService.warning(t('toast.no_save')); return; }
    const html = '<div class="modal-title">Load Save?</div>' +
        '<div class="modal-sub">Current progress will be replaced.</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('common.cancel')) + '</button>' +
        '<button class="btn-primary" data-load-confirm style="flex:1;">' + escapeHtml(t('common.load')) + '</button>' +
        '</div>';
    Modal.open('confirm-load', html);
    document.querySelector('[data-load-confirm]').addEventListener('click', function () {
        const data = SaveService.load();
        if (!data) { ToastService.error('Load failed.'); return; }
        state.hydrate(data);
        ToastService.success('Save loaded.');
        Modal.close('confirm-load', true);
    });
}

function _confirmReset() {
    const html = '<div class="modal-title">Reset Game?</div>' +
        '<div class="modal-sub">' + escapeHtml(t('toast.reset_confirm')) + '</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('common.cancel')) + '</button>' +
        '<button class="btn-danger" data-reset-confirm style="flex:1;">' + escapeHtml(t('common.reset')) + '</button>' +
        '</div>';
    Modal.open('confirm-reset', html);
    document.querySelector('[data-reset-confirm]').addEventListener('click', function () {
        SaveService.clear();
        SaveService.stopAutoSave();
        window.location.reload();
    });
}
