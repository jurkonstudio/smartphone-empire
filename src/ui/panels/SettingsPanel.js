// FILE: src/ui/panels/SettingsPanel.js
// v2027.42 — hero baru (foto pemain), tab Umum tersusun (Akun & Profil / Permainan / Komunitas / Bantuan),
//            ganti nama perusahaan lewat ProfileEditModals (gratis 2x, lalu 150 SIL).
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
import { formatCurrency } from '../../utils/format.js';
import { renderDebugSection, bindDebugActions } from './DebugPanel.js';
import { openPlayerListModal } from '../social/PlayerListPanel.js';
import { avatarHtml } from '../social/AvatarView.js';
import { openEditCompanyNameModal } from '../social/ProfileEditModals.js';
import { setProfileTab } from './CompanyProfilePanel.js';
import { openCloudPanel } from '../../services/cloud/CloudUI.js';
import { CloudService } from '../../services/CloudService.js';
import { PlayerProfileService } from '../../systems/PlayerProfileService.js';

let _activeTab = 'umum';
let _boundRoot = null;
let _cashListenerBound = false;

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const TABS = [
    { id: 'umum',     key: 'settings.tab.general',    icon: 'settings' },
    { id: 'tampilan', key: 'settings.tab.appearance', icon: 'palette' },
    { id: 'audio',    key: 'settings.tab.audio',      icon: 'bell' },
    { id: 'keuangan', key: 'settings.tab.finance',    icon: 'coin' },
    { id: 'bahasa',   key: 'settings.tab.language',   icon: 'globe' },
    { id: 'data',     key: 'settings.tab.data',       icon: 'database' },
    { id: 'debug',    label: 'Debug',                 icon: 'settings' }
];

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderSettingsPanel() {
    const s = state.get();
    return _heroCard(s) + _tabBar() + _tabContent(s);
}

function _heroCard(s) {
    const diffLabel = t('settings.difficulty.' + (s.difficulty || 'normal'));
    const rep = (s.market && typeof s.market.reputation === 'number') ? s.market.reputation : 0;
    const team = s.team ? ((s.team.engineers || 0) + (s.team.designers || 0) + (s.team.marketers || 0)) : 0;
    const player = PlayerProfileService.getPlayer();
    const playerName = player.displayName || t('pp.player.default_name');
    const companyName = s.companyName || 'My Tech Co';

    return '<div class="settings-hero">' +
        '<button class="settings-hero-top settings-hero-link" data-set="player-profile" type="button">' +
            avatarHtml({ src: player.avatar, name: player.displayName || companyName, size: 52 }) +
            '<div class="settings-hero-info">' +
                '<div class="settings-hero-name">' + escapeHtml(playerName) + '</div>' +
                '<div class="settings-hero-company">' + renderIcon('building', 11) + '<span>' + escapeHtml(companyName) + '</span></div>' +
                '<div class="settings-hero-meta">' + escapeHtml(t('settings.row.founded')) + ' ' + escapeHtml(_formatFounded(s)) + ' · ' + escapeHtml(diffLabel) + '</div>' +
            '</div>' +
            '<span class="settings-row-chevron">›</span>' +
        '</button>' +
        '<div class="settings-hero-kpi is-4">' +
            _kpi(t('pp.kpi.cash'), formatCurrency(s.cash), 'data-settings-cash') +
            _kpi('SIL', '💎 ' + (s.silicon || 0), 'data-settings-sil') +
            _kpi(t('pp.kpi.rep'), Number(rep).toFixed(1)) +
            _kpi(t('pp.kpi.team'), String(team)) +
        '</div>' +
        '</div>';
}

function _kpi(label, value, valueAttrs) {
    return '<div class="settings-kpi">' +
        '<div class="settings-kpi-label">' + escapeHtml(label) + '</div>' +
        '<div class="settings-kpi-value"' + (valueAttrs ? ' ' + valueAttrs : '') + '>' + escapeHtml(value) + '</div>' +
        '</div>';
}

function _tabBar() {
    return '<div class="settings-tabs">' +
        TABS.map(function (tab) {
            var cls = 'settings-tab' + (_activeTab === tab.id ? ' active' : '');
            var label = tab.label || t(tab.key);
            return '<button class="' + cls + '" data-set-tab="' + tab.id + '" type="button">' +
                renderIcon(tab.icon, 13) +
                '<span>' + escapeHtml(label) + '</span>' +
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
        case 'debug':    return renderDebugSection();
        default:         return _tabUmum(s);
    }
}

function _tabUmum(s) {
    const info = PlayerProfileService.getNameChangeInfo();
    const nameHint = info.cost > 0
        ? t('pp.company.rule_paid', { cost: info.cost })
        : t('pp.company.free_left', { n: info.freeLeft });
    const connected = CloudService.getStatus() === 'connected';
    const cloudKey = connected ? 'profile.cloud_connected' : 'profile.cloud_disconnected';

    return _section('portrait', t('pp.settings.section_account'),
        _row({ icon: 'portrait', label: t('pp.settings.row_profile'), hint: t('pp.settings.row_profile_hint'), action: true, attrs: 'data-set="player-profile"', chevron: true }) +
        _row({ icon: 'building', label: t('pp.settings.row_company'), hint: nameHint, value: escapeHtml(s.companyName || '—'), action: true, attrs: 'data-set="edit-name"', chevron: true }) +
        _row({ icon: 'cloud', label: t('pp.settings.row_cloud'), value: '<span style="color:' + (connected ? 'var(--success)' : 'var(--text-tertiary)') + ';">' + escapeHtml(t(cloudKey)) + '</span>', action: true, attrs: 'data-set="cloud"', chevron: true })
    ) +
    _section('gamepad', t('pp.settings.section_game'),
        _row({ label: t('settings.row.difficulty'), value: escapeHtml(t('settings.difficulty.' + (s.difficulty || 'normal'))) }) +
        _row({ label: t('settings.row.founded'), value: escapeHtml(_formatFounded(s)) })
    ) +
    _section('globe', t('pp.settings.section_community'),
        _row({ icon: 'target', label: t('pp.settings.row_leaderboard'), hint: t('pp.settings.row_leaderboard_hint'), action: true, attrs: 'data-set="leaderboard"', chevron: true }) +
        _row({ icon: 'globe', label: t('pp.settings.row_players'), hint: t('pp.settings.row_players_hint'), action: true, attrs: 'data-set="player-list"', chevron: true })
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
                hint: 'Sisa ' + formatCurrency(l.remaining) + ' · ' + Math.round((l.monthlyInterestRate || 0) * 100) + '%/mo'
            });
        }).join('');
    } else {
        activeHtml = '<div class="settings-empty">' + escapeHtml(t('settings.empty.loans')) + '</div>';
    }

    const offersHtml = BALANCE.loans.map(function (l) {
        return _row({
            label: escapeHtml(l.label),
            hint: formatCurrency(l.principal) + ' · ' + Math.round(l.monthlyInterestRate * 100) + '%/mo · ' + l.termMonths + ' mo',
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

    var iconHtml = opts.icon ? '<span class="settings-row-ico">' + renderIcon(opts.icon, 15) + '</span>' : '';
    return '<div class="' + cls + '" ' + attrs + '>' + iconHtml + labelHtml + rightHtml + '</div>';
}

export function bindSettingsActions(root) {
    if (!root) return;

    bindDebugActions(root);

    if (_boundRoot === root) return;
    _boundRoot = root;

    if (!_cashListenerBound) {
        _cashListenerBound = true;
        bus.on('state:cash-changed', function (data) {
            var el = document.querySelector('[data-settings-cash]');
            if (!el) return;
            el.textContent = formatCurrency(data.next);
        });
        bus.on('silicon:changed', function (data) {
            var el = document.querySelector('[data-settings-sil]');
            if (!el) return;
            el.textContent = '💎 ' + (data && data.balance != null ? data.balance : state.get().silicon || 0);
        });
    }

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
        case 'load':        _confirmLoad(); break;
        case 'export':      _openExport(); break;
        case 'import':      _openImport(); break;
        case 'reset':       _confirmReset(); break;
        case 'guide':       bus.emit('view:changed', { id: 'guide' }); window.__game.navigate('guide'); break;
        case 'tutorial':    bus.emit('tutorial:restart'); break;
        case 'edit-name':   openEditCompanyNameModal(); break;
        case 'player-list': openPlayerListModal(); break;
        case 'leaderboard': openPlayerListModal('revenue'); break;
        case 'cloud':       openCloudPanel(); break;
        case 'player-profile': setProfileTab('player'); window.__game.navigate('profile'); break;
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
