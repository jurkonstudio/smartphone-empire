// FILE: src/ui/panels/SettingsPanel.js  (REPLACE — i18n)
// v2027.42 — hero baru (foto pemain), tab Umum tersusun (Akun & Profil / Permainan / Komunitas / Bantuan),
//            ganti nama perusahaan lewat ProfileEditModals (gratis 2x, lalu 150 SIL).
// i18n: semua teks lewat t()/_tf() (key settings.*). Nama bulan memakai date.month.N,
//       label aksen memakai settings.accent.*, Dompet Universal memakai settings.wallet.*.
//       Modal (katalog dompet / export / import / load / reset) dibuka ulang saat 'lang:changed'.
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
import { WalletService } from '../../systems/WalletService.js';
import { WALLET_CATALOG, WALLET_CASH_ONLY } from '../../data/silicon.data.js';
import { NotificationPrefs, NOTIF_TYPES } from '../../core/NotificationPrefs.js';
import { clearNotifications, clearHistory } from '../notifications/NotificationRenderer.js';

let _activeTab = 'umum';
let _boundRoot = null;
let _cashListenerBound = false;

const MONTH_SHORT_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTH_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// t() dengan fallback bila key belum ada di kamus.
function _tf(key, fallback, vars) {
    const v = t(key, vars);
    if (v && v !== key) return v;
    return String(fallback).replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && vars[k] !== undefined) ? vars[k] : m;
    });
}
function _isId() {
    try { return LanguageService.getLang() === 'id'; } catch (e) { return true; }
}
function _pick(idText, enText) { return _isId() ? idText : enText; }

function _monthShort(m) {
    const i = (((m || 1) - 1) % 12 + 12) % 12;
    const key = 'date.month.' + (i + 1);
    const v = t(key);
    if (v && v !== key) return v;
    return (_isId() ? MONTH_SHORT_ID : MONTH_SHORT_EN)[i];
}
function _accentLabel(a) { return _tf('settings.accent.' + a.id, a.label); }

const TABS = [
    { id: 'umum',     key: 'settings.tab.general',    icon: 'settings' },
    { id: 'tampilan', key: 'settings.tab.appearance', icon: 'palette' },
    { id: 'audio',    key: 'settings.tab.audio',      icon: 'bell' },
    { id: 'notif',    key: 'settings.tab.notif',      icon: 'bell' },
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

// Render ulang Settings TANPA reset scroll (toggle/pilihan tidak boleh melempar layar ke atas).
function _refresh() {
    const g = window.__game;
    if (g && typeof g.renderSoft === 'function') g.renderSoft();
    else if (g && typeof g.render === 'function') g.render();
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
        case 'notif':    return _tabNotif(s);
        case 'keuangan': return _tabKeuangan(s);
        case 'bahasa':   return _tabBahasa(s);
        case 'data':     return _tabData(s);
        case 'debug':    return renderDebugSection();
        default:         return _tabUmum(s);
    }
}

let _playerPublicId = null;
function _loadPlayerPublicId() {
    if (_playerPublicId || CloudService.getStatus() !== 'connected') return;
    CloudService.getPublicId().then(function (r) {
        if (!r || !r.ok || !r.publicId) return;
        _playerPublicId = String(r.publicId);
        var el = document.querySelector('[data-player-public-id]');
        if (el) el.textContent = _playerPublicId;
    }).catch(function () {});
}

function _tabUmum(s) {
    const info = PlayerProfileService.getNameChangeInfo();
    const nameHint = info.cost > 0
        ? t('pp.company.rule_paid', { cost: info.cost })
        : t('pp.company.free_left', { n: info.freeLeft });
    const connected = CloudService.getStatus() === 'connected';
    const cloudKey = connected ? 'profile.cloud_connected' : 'profile.cloud_disconnected';
    _loadPlayerPublicId();

    return _section('portrait', t('pp.settings.section_account'),
        _row({ icon: 'portrait', label: t('pp.settings.row_profile'), hint: t('pp.settings.row_profile_hint'), action: true, attrs: 'data-set="player-profile"', chevron: true }) +
        _row({ icon: 'building', label: t('pp.settings.row_company'), hint: nameHint, value: escapeHtml(s.companyName || '—'), action: true, attrs: 'data-set="edit-name"', chevron: true }) +
        (connected ? _row({ icon: 'portrait', label: 'ID Pemain', hint: 'Ketuk untuk menyalin. Pakai ID ini saat top-up SIL di web.', value: '<span data-player-public-id>' + escapeHtml(_playerPublicId || '…') + '</span>', action: true, attrs: 'data-set="copy-id"' }) : '') +
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
    ) +
    _section('globe', t('pp.settings.section_about'),
        _row({ icon: 'link', label: t('pp.settings.row_studio'), hint: t('pp.settings.row_studio_hint'), action: true, attrs: 'data-set="studio"', chevron: true })
    );
}

function _formatFounded(s) {
    const time = s.time || {};
    const monthShort = _monthShort(time.currentMonth);
    return time.currentDay + ' ' + monthShort + ' ' + time.currentYear;
}

function _tabTampilan() {
    const currentTheme  = ThemeService.getTheme();
    const currentAccent = ThemeService.getAccent();

    const themeSegment = '<div class="settings-segment">' +
        '<button class="settings-seg-btn' + (currentTheme === 'dark' ? ' active' : '') + '" data-theme-pick="dark" type="button">' +
            renderIcon('moon', 14) + '<span>' + escapeHtml(_tf('settings.row.theme_dark', _pick('Gelap', 'Dark'))) + '</span>' +
        '</button>' +
        '<button class="settings-seg-btn' + (currentTheme === 'light' ? ' active' : '') + '" data-theme-pick="light" type="button">' +
            renderIcon('sun', 14) + '<span>' + escapeHtml(_tf('settings.row.theme_light', _pick('Terang', 'Light'))) + '</span>' +
        '</button>' +
        '</div>';

    const accentPicker = '<div class="settings-accent-picker">' +
        ACCENTS.map(function (a) {
            var cls = 'accent-dot' + (currentAccent === a.id ? ' active' : '');
            return '<button class="' + cls + '" data-accent-pick="' + a.id + '" type="button" ' +
                'style="background:' + a.hex + ';" ' +
                'aria-label="' + escapeHtml(_accentLabel(a)) + '" ' +
                'title="' + escapeHtml(_accentLabel(a)) + '"></button>';
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

function _tabNotif() {
    const on = NotificationPrefs.isEnabled();

    const main = _section('bell', t('settings.notif.section_main'),
        _row({
            label: t('settings.notif.master'),
            hint: on ? t('settings.notif.master_on') : t('settings.notif.master_off'),
            switchOn: on,
            attrs: 'data-notifpref="master"'
        })
    );

    // Saklar per jenis: dikunci (redup & tidak bisa diklik) selama saklar utama mati.
    const typeRows = NOTIF_TYPES.map(function (type) {
        return _row({
            label: t('settings.notif.type.' + type),
            hint: t('settings.notif.type.' + type + '_hint'),
            switchOn: NotificationPrefs.getTypeFlag(type),
            attrs: 'data-notifpref="' + type + '"',
            disabled: !on
        });
    }).join('');
    const lockStyle = on ? '' : ' style="opacity:.45;pointer-events:none;" aria-disabled="true"';
    const types = '<div class="settings-section">' +
        '<div class="settings-section-head">' + renderIcon('settings', 12) + escapeHtml(t('settings.notif.section_types')) + '</div>' +
        '<div class="settings-list"' + lockStyle + '>' + typeRows + '</div>' +
        '<div class="settings-lang-hint">' + escapeHtml(t('settings.notif.types_hint')) + '</div>' +
        '</div>';

    const tools = _section('settings', t('settings.notif.section_tools'),
        '<div' + (on ? '' : ' style="opacity:.45;pointer-events:none;" aria-disabled="true"') + '>' +
        _row({ label: t('settings.notif.test'), hint: t('settings.notif.test_hint'), action: true, attrs: 'data-notif-action="test"', chevron: true, disabled: !on }) +
        '</div>' +
        _row({ label: t('settings.notif.clear'), hint: t('settings.notif.clear_hint'), action: true, attrs: 'data-notif-action="clear"', chevron: true })
    );

    return main + types + tools;
}

function _handleNotifToggle(key) {
    if (key === 'master') {
        const next = !NotificationPrefs.isEnabled();
        NotificationPrefs.setEnabled(next);
        if (!next) {
            // Dimatikan: bersihkan notifikasi yang sedang tampil + riwayatnya.
            try { clearNotifications(); clearHistory(); } catch (e) { console.warn('[Settings] bersihkan notifikasi gagal:', e); }
        } else {
            ToastService.success(t('settings.notif.enabled_msg'));
        }
    } else if (NOTIF_TYPES.indexOf(key) !== -1) {
        if (!NotificationPrefs.isEnabled()) return; // terkunci saat saklar utama mati
        NotificationPrefs.setType(key, !NotificationPrefs.getTypeFlag(key));
    } else {
        return;
    }
    _refresh();
}

function _handleNotifAction(action) {
    if (action === 'test') {
        if (!NotificationPrefs.isEnabled()) return;
        // Coba lewat jenis 'info'; bila jenis itu dimatikan, pakai jenis pertama yang aktif.
        const type = ['info', 'success', 'warning', 'error', 'news'].filter(function (x) { return NotificationPrefs.isTypeEnabled(x); })[0];
        if (!type) return;
        ToastService.show(t('settings.notif.test_msg') + ' ' + new Date().toLocaleTimeString(), type);
    } else if (action === 'clear') {
        try { clearNotifications(); clearHistory(); } catch (e) { console.warn('[Settings] hapus riwayat gagal:', e); }
    }
}

function _tabKeuangan(s) {
    // [v2027.44] Pinjaman dipindah ke HQ > Bank. Tab ini hanya ringkasan + pintasan.
    const bank = (window.__game && window.__game.bank) ? window.__game.bank : null;
    let summaryHtml = '';
    if (bank) {
        const sm = bank.getSummary();
        summaryHtml =
            _row({ label: t('settings.bank.rating'), value: escapeHtml(sm.rating) + ' · ' + sm.score + '/100' }) +
            _row({ label: t('settings.bank.available'), value: escapeHtml(formatCurrency(sm.available)) }) +
            _row({ label: t('settings.bank.monthly'), value: escapeHtml(formatCurrency(sm.monthly)) }) +
            _row({
                label: t('settings.bank.open'),
                hint: t('settings.bank.hint'),
                action: true,
                attrs: 'data-open-bank',
                chevron: true
            });
    } else {
        summaryHtml = '<div class="settings-empty">' + escapeHtml(t('settings.empty.loans')) + '</div>';
    }
    return _walletSection() + _section('coin', t('settings.bank.title'), summaryHtml);
}

// ---------- Dompet Universal: uang ($) & SIL bisa dipakai untuk apa saja ----------
function _walletSection() {
    const mode = WalletService.getMode();
    const rate = WalletService.getRate();
    const modes = [
        { id: 'auto',
          label: _tf('settings.wallet.mode.auto', _pick('Otomatis', 'Automatic')),
          hint: _tf('settings.wallet.mode.auto_hint', _pick('Pakai mata uang aslinya dulu; kekurangan ditutup mata uang lain.', 'Use the item\'s own currency first; the other covers any shortfall.')) },
        { id: 'cash_first',
          label: _tf('settings.wallet.mode.cash_first', _pick('Uang dulu', 'Cash first')),
          hint: _tf('settings.wallet.mode.cash_first_hint', _pick('Selalu pakai uang ($) dulu, SIL menutup kekurangan.', 'Always spend cash ($) first; SIL covers any shortfall.')) },
        { id: 'sil_first',
          label: _tf('settings.wallet.mode.sil_first', _pick('SIL dulu', 'SIL first')),
          hint: _tf('settings.wallet.mode.sil_first_hint', _pick('Selalu pakai SIL dulu, uang ($) menutup kekurangan.', 'Always spend SIL first; cash ($) covers any shortfall.')) },
        { id: 'strict',
          label: _tf('settings.wallet.mode.strict', _pick('Terpisah (klasik)', 'Separate (classic)')),
          hint: _tf('settings.wallet.mode.strict_hint', _pick('Uang hanya untuk biaya uang, SIL hanya untuk biaya SIL.', 'Cash only for cash costs, SIL only for SIL costs.')) }
    ];
    const rows = modes.map(function (m) {
        const on = m.id === mode;
        return _row({ label: m.label + (on ? ' ✓' : ''), hint: m.hint, action: true, attrs: 'data-wallet-mode="' + m.id + '"', chevron: !on });
    }).join('');
    const info =
        _row({ label: _tf('settings.wallet.rate_today', _pick('Kurs hari ini', 'Today\'s rate')), value: '1 SIL = ' + escapeHtml(formatCurrency(rate)) }) +
        _row({ label: _tf('settings.wallet.buying_power', _pick('Daya beli total', 'Total buying power')), value: escapeHtml(formatCurrency(Math.floor(WalletService.getBuyingPower()))) });
    const rescue = _row({
        label: _tf('settings.wallet.rescue', _pick('Dana darurat SIL', 'SIL emergency fund')),
        hint: _tf('settings.wallet.rescue_hint', _pick('Saat tutup bulan, SIL otomatis menutup kas yang akan minus supaya tidak bangkrut.', 'At month close, SIL automatically covers a cash deficit so you do not go bankrupt.')),
        switchOn: WalletService.isRescueOn(), attrs: 'data-wallet-rescue'
    });
    const catalogRow = _row({
        label: _tf('settings.wallet.catalog', _pick('Apa yang bisa dibayar?', 'What can I pay for?')),
        hint: _tf('settings.wallet.catalog_hint', _pick('Daftar lengkap pembayaran uang & SIL.', 'Full list of cash & SIL payments.')),
        action: true, attrs: 'data-wallet-catalog', chevron: true
    });
    return _section('coin', _tf('settings.wallet.title', _pick('Dompet Universal', 'Universal Wallet')), info + catalogRow + rows + rescue);
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
        rightHtml += '<button class="toggle-switch' + (opts.switchOn ? ' on' : '') + '" ' + attrs + ' type="button" aria-label="' + escapeHtml(_tf('settings.aria.toggle', _pick('Saklar', 'Toggle'))) + '"><span class="toggle-thumb"></span></button>';
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
        // Ganti bahasa: buka ulang modal Pengaturan yang sedang terbuka agar teksnya ikut berganti.
        bus.on('lang:changed', _reopenSettingsModals);
    }

    root.addEventListener('click', function (e) {
        var tabBtn = e.target.closest('[data-set-tab]');
        if (tabBtn) {
            e.preventDefault();
            _activeTab = tabBtn.dataset.setTab;
            window.__game.render();
            // Pindah tab = konten baru, mulai dari atas.
            var _v = document.getElementById('app-view');
            if (_v) _v.scrollTop = 0;
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
            ToastService.info(t('toast.theme_changed', {
                value: themeBtn.dataset.themePick === 'light'
                    ? _tf('settings.row.theme_light', _pick('Terang', 'Light'))
                    : _tf('settings.row.theme_dark', _pick('Gelap', 'Dark'))
            }));
            _refresh();
            return;
        }

        var accentBtn = e.target.closest('[data-accent-pick]');
        if (accentBtn) {
            e.preventDefault();
            ThemeService.setAccent(accentBtn.dataset.accentPick);
            ToastService.info(t('toast.accent_changed'));
            _refresh();
            return;
        }

        var wMode = e.target.closest('[data-wallet-mode]');
        if (wMode) {
            e.preventDefault();
            WalletService.setMode(wMode.dataset.walletMode);
            _refresh();
            return;
        }
        if (e.target.closest('[data-wallet-catalog]')) { e.preventDefault(); _openWalletCatalog(); return; }
        var wResc = e.target.closest('[data-wallet-rescue]');
        if (wResc) {
            e.preventDefault();
            WalletService.setRescue(!WalletService.isRescueOn());
            _refresh();
            return;
        }

        var notifTog = e.target.closest('[data-notifpref]');
        if (notifTog) { e.preventDefault(); _handleNotifToggle(notifTog.dataset.notifpref); return; }
        var notifAct = e.target.closest('[data-notif-action]');
        if (notifAct) { e.preventDefault(); _handleNotifAction(notifAct.dataset.notifAction); return; }

        var setBtn = e.target.closest('[data-set]');
        if (setBtn) { e.preventDefault(); _handleSet(setBtn.dataset.set); return; }

        var togBtn = e.target.closest('[data-toggle]');
        if (togBtn) { e.preventDefault(); _handleToggle(togBtn.dataset.toggle); return; }

        var loanBtn = e.target.closest('[data-loan]');
        if (loanBtn) { e.preventDefault(); bus.emit('settings:take-loan', { loanId: loanBtn.dataset.loan }); return; }
    });
}

// Buka ulang modal Pengaturan yang sedang terbuka (teks berganti bahasa, isian dipertahankan).
function _reopenSettingsModals() {
    if (Modal.isOpen('wallet-catalog')) { _openWalletCatalog(); return; }
    if (Modal.isOpen('export')) { _openExport(); return; }
    if (Modal.isOpen('import')) {
        var oldInp = document.querySelector('[data-modal-id="import"] [data-import-text]');
        var typed = oldInp ? oldInp.value : '';
        _openImport();
        var newInp = document.querySelector('[data-modal-id="import"] [data-import-text]');
        if (newInp) newInp.value = typed;
        return;
    }
    if (Modal.isOpen('confirm-load')) { _confirmLoad(); return; }
    if (Modal.isOpen('confirm-reset')) { _confirmReset(); return; }
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
        case 'copy-id':
            if (_playerPublicId) {
                try { navigator.clipboard.writeText(_playerPublicId); ToastService.info('ID Pemain disalin: ' + _playerPublicId); }
                catch (e) { ToastService.info('ID Pemain: ' + _playerPublicId); }
            }
            break;
        case 'cloud':       openCloudPanel(); break;
        case 'player-profile': setProfileTab('player'); window.__game.navigate('profile'); break;
        case 'studio':      _openStudioPage(); break;
    }
}

// Buka halaman studio di tab baru (di APK/WebView, jatuh ke navigasi biasa bila popup diblokir).
function _openStudioPage() {
    var url = (APP_CONFIG && APP_CONFIG.studioUrl) || '';
    if (!url) return;
    var w = null;
    try { w = window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { w = null; }
    if (!w) window.location.href = url;
}

function _handleToggle(key) {
    const s = state.get();
    s.settings[key] = !s.settings[key];
    state.patch({ settings: s.settings });
    const toggleName = key === 'sound' ? t('settings.row.sound') : (key === 'vibrate' ? t('settings.row.vibrate') : key);
    ToastService.info(_tf('settings.toast.toggle', '{name}: {state}', {
        name: toggleName,
        state: s.settings[key] ? _tf('settings.state.on', _pick('Aktif', 'On')) : _tf('settings.state.off', _pick('Mati', 'Off'))
    }));
    bus.emit('settings:changed', s.settings);
    _refresh();
}

function _openWalletCatalog() {
    const id = _isId();   // WALLET_CATALOG menyimpan teks id_/en_ langsung di data
    const rate = WalletService.getRate();
    const rows = WALLET_CATALOG.map(function (it) {
        const tag = it.native === 'sil' ? '💎 SIL → $' : '$ → 💎 SIL';
        return '<div class="sum-row" style="align-items:flex-start;gap:10px;"><span><b>' + escapeHtml(id ? it.id_ : it.en_) + '</b><br><small style="color:var(--text-tertiary);">' +
            escapeHtml(id ? it.id_d : it.en_d) + '</small></span><b style="white-space:nowrap;font-size:11px;">' + tag + '</b></div>';
    }).join('');
    const only = WALLET_CASH_ONLY.map(function (it) { return '• ' + escapeHtml(id ? it.id_ : it.en_); }).join('<br>');
    const html = '<div class="modal-title">' + escapeHtml(_tf('settings.wallet.catalog', _pick('Apa yang bisa dibayar?', 'What can I pay for?'))) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_tf('settings.wallet.cat_sub', _pick('Uang ($) dan SIL saling menutup. Kurs hari ini: 1 SIL = {rate}', 'Cash ($) and SIL cover each other. Today\'s rate: 1 SIL = {rate}'), { rate: formatCurrency(rate) })) + '</div>' +
        rows +
        '<div class="modal-sub" style="margin-top:12px;"><b>' + escapeHtml(_tf('settings.wallet.cash_only', _pick('Hanya uang (tidak memakai SIL otomatis):', 'Cash only (never auto-spends SIL):'))) + '</b><br>' + only + '</div>' +
        '<button class="btn-secondary" data-modal-close style="margin-top:12px;width:100%;">' + escapeHtml(t('common.tutup')) + '</button>';
    Modal.open('wallet-catalog', html);
}

function _openExport() {
    const json = SaveService.export(state);
    if (!json) { ToastService.error(_tf('settings.export.fail', _pick('Ekspor gagal.', 'Export failed.'))); return; }
    const html = '<div class="modal-title">' + escapeHtml(_tf('settings.export.title', _pick('Ekspor Save', 'Export Save'))) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_tf('settings.export.sub', _pick('Salin teks ini sebagai cadangan.', 'Copy this text for backup.'))) + '</div>' +
        '<textarea class="field-textarea" readonly rows="10">' + escapeHtml(json) + '</textarea>' +
        '<button class="btn-secondary" data-modal-close style="margin-top:12px;width:100%;">' + escapeHtml(t('common.tutup')) + '</button>';
    Modal.open('export', html);
}

function _openImport() {
    const html = '<div class="modal-title">' + escapeHtml(_tf('settings.import.title', _pick('Impor Save', 'Import Save'))) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_tf('settings.import.sub', _pick('Tempel cadangan JSON di bawah. Ini akan menimpa save saat ini.', 'Paste JSON backup below. This overwrites current save.'))) + '</div>' +
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
        if (!data) { ToastService.error(_tf('settings.import.invalid', _pick('JSON tidak valid.', 'Invalid JSON.'))); return; }
        state.hydrate(data);
        SaveService.save(state);
        ToastService.success(_tf('settings.import.done', _pick('Save diimpor. Memuat ulang...', 'Save imported. Reloading...')));
        setTimeout(function () { window.location.reload(); }, 800);
    });
}

function _confirmLoad() {
    if (!SaveService.hasSave()) { ToastService.warning(t('toast.no_save')); return; }
    const html = '<div class="modal-title">' + escapeHtml(_tf('settings.load.title', _pick('Muat Save?', 'Load Save?'))) + '</div>' +
        '<div class="modal-sub">' + escapeHtml(_tf('settings.load.sub', _pick('Progres saat ini akan diganti.', 'Current progress will be replaced.'))) + '</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-secondary" data-modal-close style="flex:1;">' + escapeHtml(t('common.cancel')) + '</button>' +
        '<button class="btn-primary" data-load-confirm style="flex:1;">' + escapeHtml(t('common.load')) + '</button>' +
        '</div>';
    Modal.open('confirm-load', html);
    document.querySelector('[data-load-confirm]').addEventListener('click', function () {
        const data = SaveService.load();
        if (!data) { ToastService.error(_tf('settings.load.fail', _pick('Gagal memuat save.', 'Load failed.'))); return; }
        state.hydrate(data);
        ToastService.success(_tf('settings.load.done', _pick('Save dimuat.', 'Save loaded.')));
        Modal.close('confirm-load', true);
    });
}

function _confirmReset() {
    const html = '<div class="modal-title">' + escapeHtml(_tf('settings.reset.title', _pick('Reset Game?', 'Reset Game?'))) + '</div>' +
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
