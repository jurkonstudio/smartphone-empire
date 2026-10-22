import { escapeHtml } from '../../utils/html.js';
// FILE: src/ui/panels/SettingsPanel.js  (REPLACE — i18n)
// v2027.46 — bagian bawah tab Umum (Tentang) diganti Panel Studio bergaya landing page:
//            kartu Jurkon Studio, akun cloud (Masuk / Kelola akun), Top up Silicon, Download APK,
//            sosial media, kontak, dan info legal. Gaya disuntik sendiri (tanpa ubah style.css).
// v2027.45 — profil dipisah dari pengaturan: kartu profil (hero) jadi blok sendiri, lalu judul "Pengaturan" + tab.
//            Baris "Profil Pemain" (duplikat hero) dan "ID Pemain" dipindah ke Profil > tab Pemain.
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
import { FPS_CHOICES, getRenderFps } from '../../core/RenderFps.js';
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


// Render ulang Settings TANPA reset scroll (toggle/pilihan tidak boleh melempar layar ke atas).
function _refresh() {
    const g = window.__game;
    if (g && typeof g.renderSoft === 'function') g.renderSoft();
    else if (g && typeof g.render === 'function') g.render();
}

export function renderSettingsPanel() {
    const s = state.get();
    return '<div class="settings-profile-block">' + _heroCard(s) + '</div>' +
        _pageHead() + _tabBar() + _tabContent(s);
}

// Pemisah antara blok profil dan area pengaturan.
function _pageHead() {
    return '<div class="settings-page-head">' + renderIcon('settings', 12) +
        '<span>' + escapeHtml(_tf('settings.page_head', _pick('Pengaturan', 'Settings'))) + '</span></div>';
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

function _tabUmum(s) {
    const info = PlayerProfileService.getNameChangeInfo();
    const nameHint = info.cost > 0
        ? t('pp.company.rule_paid', { cost: info.cost })
        : t('pp.company.free_left', { n: info.freeLeft });
    const connected = CloudService.getStatus() === 'connected';
    const cloudKey = connected ? 'profile.cloud_connected' : 'profile.cloud_disconnected';

    return _section('portrait', t('pp.settings.section_account'),
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
    ) +
    _studioPanel(s);
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

    const fpsCur = getRenderFps();
    const fpsBlock = '<div class="settings-section">' +
        '<div class="settings-section-head">' + renderIcon('sparkles', 12) + escapeHtml(_pick('Animasi 3D', '3D animation')) + '</div>' +
        '<div class="settings-picker-block"><div class="settings-segment">' +
        FPS_CHOICES.map(function (f) {
            return '<button class="settings-seg-btn' + (fpsCur === f ? ' active' : '') + '" data-fps="' + f + '" type="button"><span>' + f + ' FPS</span></button>';
        }).join('') +
        '</div>' +
        '<div class="settings-picker-hint">' + escapeHtml(_pick('30 FPS lebih hemat baterai. 60 FPS lebih mulus, tapi butuh HP yang lebih kuat. Berlaku untuk Peta Kampus dan Peta Kantor 3D.', '30 FPS saves battery. 60 FPS is smoother but needs a stronger phone. Applies to the Campus and Office 3D maps.')) + '</div>' +
        '</div></div>';

    return '<div class="settings-section">' +
        '<div class="settings-section-head">' + renderIcon('palette', 12) + escapeHtml(t('settings.section.theme')) + '</div>' +
        '<div class="settings-picker-block">' + themeSegment + '</div>' +
        '<div class="settings-picker-block">' +
            '<div class="settings-picker-label">' + escapeHtml(t('settings.section.accent')) + '</div>' +
            accentPicker +
            '<div class="settings-picker-hint">' + escapeHtml(t('settings.hint.accent')) + '</div>' +
        '</div>' +
        '</div>' + fpsBlock;
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
                // Nama asli bahasa dari SUPPORTED_LANGS (mendukung zh & ko tanpa key tambahan).
                var picked = LanguageService.getSupported().filter(function (l) { return l.id === newLang; })[0];
                var label = picked ? picked.label : newLang;
                ToastService.info(t('toast.lang_changed', { value: label }));
            }
            return;
        }

        var fpsBtn = e.target.closest('[data-fps]');
        if (fpsBtn) { e.preventDefault(); _setFps(Number(fpsBtn.dataset.fps)); return; }

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
        case 'cloud':       openCloudPanel(); break;
        case 'player-profile': setProfileTab('player'); window.__game.navigate('profile'); break;
        case 'studio':      _openStudioPage(); break;
        case 'topup':       _openTopup(); break;
    }
}

// ============================================================
// PANEL STUDIO (pengganti bagian "Tentang") — versi ringkas landing page
// ============================================================
var STUDIO_APK_URL = 'https://github.com/jurkonstudio/smartphone-empire/releases/download/tycoon/Smartphone.Empire.apk';
var STUDIO_BUG_URL = 'https://github.com/jurkonstudio/smartphone-empire/issues';
var STUDIO_SOCIALS = [
    { id: 'github',     label: 'GitHub',     href: 'https://github.com/jurkonstudio', bg: 'linear-gradient(180deg,#8b5cf6,#5b21b6)',
      d: 'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z' },
    { id: 'instagram',  label: 'Instagram',  href: 'https://instagram.com/calvf1nka', bg: 'linear-gradient(45deg,#fd5900,#ff0069 50%,#7638fa)',
      d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
    { id: 'tiktok',     label: 'TikTok',     href: 'https://tiktok.com/@ks2908_', bg: 'linear-gradient(180deg,#2a2a2e,#000)',
      d: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z' },
    { id: 'x',          label: 'X',          href: 'https://x.com/calvf1nka', bg: 'linear-gradient(180deg,#3a3a3c,#0b0b0c)',
      d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    { id: 'youtube',    label: 'YouTube',    href: 'https://youtube.com/@calvfinka', bg: 'linear-gradient(180deg,#ff3b30,#d70015)',
      d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    { id: 'spotify',    label: 'Spotify',    href: 'https://open.spotify.com/playlist/4hiTFBL8p8TaaQZxXFaANj', bg: 'linear-gradient(180deg,#34e06f,#14a844)', fg: '#001a08',
      d: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.502 17.302c-.225.369-.705.484-1.074.259-3.022-1.845-6.83-2.263-11.317-1.239-.422.096-.843-.164-.938-.586-.096-.422.164-.843.586-.938 4.905-1.12 9.094-.637 12.482 1.431.368.225.483.704.261 1.073zm1.47-3.265c-.283.46-.886.604-1.346.321-3.458-2.126-8.73-2.741-12.82-1.501-.518.158-1.066-.133-1.224-.65-.158-.518.133-1.066.65-1.224 4.68-1.419 10.482-.733 14.42 1.688.459.283.603.886.32 1.346zm.126-3.416c-4.146-2.462-10.986-2.69-14.963-1.484-.635.193-1.304-.166-1.497-.8-.193-.634.166-1.304.8-1.497 4.566-1.385 12.116-1.114 16.857 1.701.571.339.761 1.08.422 1.651-.34.57-1.081.76-1.651.421z' },
    { id: 'discord',    label: 'Discord',    href: 'https://discord.gg/8rQGa4yYa', bg: '#5865f2',
      d: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z' }
];

var STUDIO_CSS = [
'.se-studio{margin-top:6px;border-radius:18px;overflow:hidden;background:var(--bg-2,#161b24);border:1px solid var(--border,rgba(255,255,255,.08));animation:fadeIn .22s ease-out}',
'.se-st-hero{position:relative;padding:18px 16px 16px;background:radial-gradient(120% 120% at 0% 0%,rgba(37,99,235,.38),transparent 60%),radial-gradient(100% 100% at 100% 0%,rgba(168,85,247,.28),transparent 60%),var(--bg-3,#1e2530)}',
'.se-st-id{display:flex;align-items:center;gap:12px}',
'.se-st-logo{width:46px;height:46px;border-radius:12px;flex:none;box-shadow:0 4px 14px rgba(0,0,0,.4);background:#fff}',
'.se-st-name{font-size:17px;font-weight:800;letter-spacing:-.03em;color:var(--text-primary,#fff);line-height:1.15}',
'.se-st-ver{font-size:11px;font-weight:600;color:var(--text-secondary,#a0a8b3);margin-top:2px}',
'.se-st-tag{margin-top:12px;font-size:12.5px;line-height:1.5;color:var(--text-secondary,#a0a8b3)}',
'.se-st-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px}',
'.se-st-stat{padding:8px 4px;border-radius:10px;background:rgba(0,0,0,.28);text-align:center}',
'.se-st-stat b{display:block;font-size:15px;font-weight:800;letter-spacing:-.03em;color:var(--text-primary,#fff)}',
'.se-st-stat span{font-size:9.5px;font-weight:600;color:var(--text-tertiary,#6a7280)}',
'.se-st-acct{display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid var(--border,rgba(255,255,255,.08))}',
'.se-st-dot{width:9px;height:9px;border-radius:50%;flex:none;background:var(--text-tertiary,#6a7280)}',
'.se-st-dot.on{background:var(--success,#10b981);box-shadow:0 0 0 3px rgba(16,185,129,.2)}',
'.se-st-acct-main{flex:1;min-width:0}',
'.se-st-acct-t{font-size:13px;font-weight:700;color:var(--text-primary,#e8eaee)}',
'.se-st-acct-s{font-size:11.5px;color:var(--text-secondary,#a0a8b3);margin-top:1px}',
'.se-st-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 14px}',
'.se-st-btn{display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 12px;border-radius:12px;border:1px solid var(--border-strong,rgba(255,255,255,.13));background:var(--bg-3,#1e2530);color:var(--text-primary,#e8eaee);font:inherit;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}',
'.se-st-btn:active{transform:scale(.97)}',
'.se-st-btn.pri{background:var(--accent,#2563eb);border-color:transparent;color:#fff;box-shadow:0 4px 14px var(--accent-glow,rgba(37,99,235,.28))}',
'.se-st-btn svg{width:15px;height:15px;flex:none}',
'.se-st-lbl{padding:12px 16px 8px;font-size:11px;font-weight:700;color:var(--text-tertiary,#6a7280);border-top:1px solid var(--border,rgba(255,255,255,.08))}',
'.se-st-soc{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 14px}',
'.se-st-ib{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3);text-decoration:none}',
'.se-st-ib svg{width:18px;height:18px;fill:currentColor}',
'.se-st-contact{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 14px}',
'.se-st-pill{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 14px;border-radius:999px;font-size:12.5px;font-weight:700;text-decoration:none;color:#fff}',
'.se-st-pill.wa{background:#25d366;color:#04230f}.se-st-pill.em{background:var(--accent,#2563eb)}.se-st-pill.bug{background:var(--bg-4,#2a3341);color:var(--text-primary,#e8eaee)}',
'.se-st-legal{padding:12px 16px 14px;border-top:1px solid var(--border,rgba(255,255,255,.08));font-size:10.5px;line-height:1.55;color:var(--text-tertiary,#6a7280)}'
].join('');

function _ensureStudioCss() {
    if (typeof document === 'undefined' || document.getElementById('se-studio-css')) return;
    var st = document.createElement('style');
    st.id = 'se-studio-css';
    st.textContent = STUDIO_CSS;
    document.head.appendChild(st);
}

function _studioPanel(s) {
    _ensureStudioCss();
    var version = (APP_CONFIG && APP_CONFIG.version) ? APP_CONFIG.version : 'dev';
    var connected = CloudService.getStatus() === 'connected';
    var sil = (s && s.silicon) || 0;
    var dl = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>';
    var gem = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/></svg>';
    var user = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    var globe = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>';

    var stats = [
        ['26', _pick('Kompetitor', 'Rivals')],
        ['70', _pick('Node riset', 'Research')],
        ['117', _pick('Komponen', 'Parts')],
        ['84', _pick('Saham', 'Stocks')]
    ].map(function (x) { return '<div class="se-st-stat"><b>' + x[0] + '</b><span>' + escapeHtml(x[1]) + '</span></div>'; }).join('');

    var acctTitle = connected ? _pick('Akun cloud terhubung', 'Cloud account connected') : _pick('Belum masuk', 'Not signed in');
    var acctSub = connected
        ? '💎 ' + sil + ' SIL · ' + _pick('saldo tersimpan di server', 'balance stored on the server')
        : _pick('Masuk untuk cloud save, leaderboard, dan top up Silicon.', 'Sign in for cloud save, leaderboard and Silicon top-up.');

    var socials = STUDIO_SOCIALS.map(function (x) {
        return '<a class="se-st-ib" href="' + x.href + '" target="_blank" rel="noopener noreferrer" aria-label="' + escapeHtml(x.label) + '" style="background:' + x.bg + (x.fg ? ';color:' + x.fg : '') + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + x.d + '"/></svg></a>';
    }).join('');

    return '<div class="se-studio">' +
        '<div class="se-st-hero">' +
            '<div class="se-st-id">' +
                '<img class="se-st-logo" src="./assets/icon/icon-192.png" alt="" width="46" height="46">' +
                '<div><div class="se-st-name">Jurkon Studio</div>' +
                '<div class="se-st-ver">Smartphone Empire · v' + escapeHtml(version) + '</div></div>' +
            '</div>' +
            '<div class="se-st-tag">' + escapeHtml(_pick(
                'Studio game independen. Bangun perusahaan ponsel dari tahun 2000 sampai era AI dan foldable.',
                'Independent game studio. Build a phone company from the year 2000 to the AI and foldable era.')) + '</div>' +
            '<div class="se-st-stats">' + stats + '</div>' +
        '</div>' +
        '<div class="se-st-acct"><span class="se-st-dot' + (connected ? ' on' : '') + '"></span>' +
            '<div class="se-st-acct-main"><div class="se-st-acct-t">' + escapeHtml(acctTitle) + '</div>' +
            '<div class="se-st-acct-s">' + escapeHtml(acctSub) + '</div></div></div>' +
        '<div class="se-st-acts">' +
            '<button class="se-st-btn" type="button" data-set="cloud">' + user + escapeHtml(connected ? _pick('Kelola akun', 'Manage account') : _pick('Masuk / Daftar', 'Sign in / Sign up')) + '</button>' +
            '<button class="se-st-btn pri" type="button" data-set="topup">' + gem + escapeHtml(_pick('Top up Silicon', 'Top up Silicon')) + '</button>' +
            '<a class="se-st-btn" href="' + STUDIO_APK_URL + '" rel="noopener" download>' + dl + escapeHtml(_pick('Download APK', 'Download APK')) + '</a>' +
            '<button class="se-st-btn" type="button" data-set="studio">' + globe + escapeHtml(_pick('Buka website', 'Open website')) + '</button>' +
        '</div>' +
        '<div class="se-st-lbl">' + escapeHtml(_pick('Jejaring', 'Social')) + '</div>' +
        '<div class="se-st-soc">' + socials + '</div>' +
        '<div class="se-st-lbl">' + escapeHtml(_pick('Hubungi langsung', 'Get in touch')) + '</div>' +
        '<div class="se-st-contact">' +
            '<a class="se-st-pill wa" href="https://wa.me/6282243562960" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
            '<a class="se-st-pill em" href="mailto:calvfinka@yahoo.com">Email</a>' +
            '<a class="se-st-pill bug" href="' + STUDIO_BUG_URL + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(_pick('Laporkan bug', 'Report a bug')) + '</a>' +
        '</div>' +
        '<div class="se-st-legal">' + escapeHtml(_pick(
            'Fan project, tidak berafiliasi dengan Nokia, Apple, Samsung, atau perusahaan lain. Nama dan merek dipakai untuk edukasi dan hiburan.',
            'A fan project, not affiliated with Nokia, Apple, Samsung or any other company. Names and brands are used for education and entertainment.')) +
            '<br>&copy; 2026 Jurkon Studio.</div>' +
    '</div>';
}

// Top up Silicon: buka toko Silicon yang sama dengan tombol SIL di header.
function _openTopup() {
    var g = window.__game;
    if (g && typeof g.openSiliconStore === 'function') { g.openSiliconStore(); return; }
    ToastService.info(_pick('Toko Silicon belum siap. Coba lagi sebentar.', 'The Silicon store is not ready yet. Try again shortly.'));
}

// Buka halaman studio di tab baru (di APK/WebView, jatuh ke navigasi biasa bila popup diblokir).
function _openStudioPage() {
    var url = (APP_CONFIG && APP_CONFIG.studioUrl) || '';
    if (!url) return;
    var w = null;
    try { w = window.open(url, '_blank', 'noopener,noreferrer'); } catch (e) { w = null; }
    if (!w) window.location.href = url;
}

function _setFps(fps) {
    if (FPS_CHOICES.indexOf(fps) < 0) return;
    const s = state.get();
    if (Number(s.settings.fps) === fps) return;
    s.settings.fps = fps;
    state.patch({ settings: s.settings });
    ToastService.info(_pick('Animasi 3D: ', '3D animation: ') + fps + ' FPS');
    bus.emit('settings:changed', s.settings);
    _refresh();
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
