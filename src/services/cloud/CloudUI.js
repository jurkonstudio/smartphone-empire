// FILE: src/services/cloud/CloudUI.js
// v2027.37a — Tampilan cloud: masuk/daftar, akun & slot, konflik save, reset password.
// Memakai kelas CSS yang sudah ada (field-input, btn-primary, modal-title, ...).
// Catatan: Modal hanya menampilkan satu jendela sekaligus (membuka yang baru menutup yang lama).
import { Modal } from '../../ui/modal.js';
import { ToastService } from '../../core/ToastService.js';
import { bus } from '../../core/EventBus.js';
import { LanguageService, t } from '../../core/LanguageService.js';
import { CloudService } from '../CloudService.js';
import { CloudSync } from './CloudSync.js';
import { isCloudConfigured, CLOUD } from './supabase.config.js';

var KNOWN_ERRORS = ['invalid_credentials', 'email_exists', 'email_not_confirmed', 'weak_password', 'rate_limit',
    'network', 'lib', 'not_configured', 'too_large', 'no_save', 'not_signed_in', 'db_setup', 'permission',
    'busy', 'conflict', 'unknown'];

var MONTHS = {
    id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

var _bound = false;
var _lastAutoFailToast = 0;

// ---------- util ----------
function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function lang() { var l = 'en'; try { l = LanguageService.getLang(); } catch (e) {} return MONTHS[l] ? l : 'en'; }

function errText(code) {
    var c = KNOWN_ERRORS.indexOf(code) >= 0 ? code : 'unknown';
    return t('cloud.err.' + c);
}

function fmtDateTime(v) {
    if (!v) return t('cloud.account.never');
    var d = new Date(v);
    if (isNaN(d.getTime())) return t('cloud.account.never');
    try {
        return d.toLocaleString(lang() === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) { return d.toISOString(); }
}

function fmtGameDate(year, month) {
    if (!year) return '—';
    var m = MONTHS[lang()][(month || 1) - 1] || '';
    return (m ? m + ' ' : '') + year;
}

function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function modalNode(id) { return document.querySelector('[data-modal-id="' + id + '"]'); }

// ---------- API publik ----------
export function getCloudSummary() {
    if (!isCloudConfigured()) return t('cloud.err.not_configured');
    var s = CloudService.getStatus();
    if (s === 'connected') return (CloudService.getEmail() || '') + ' · ' + t('cloud.slot', { n: CloudService.getSlot() });
    if (s === 'connecting') return t('cloud.status.connecting');
    if (s === 'error') return t('cloud.status.error');
    return t('cloud.row.account_hint_off');
}

export function openCloudPanel() {
    if (!isCloudConfigured() || !CloudService.isAvailable()) {
        ToastService.error(t('cloud.err.not_configured'));
        return;
    }
    if (CloudService.getStatus() === 'connected' && CloudService.getUserId()) openAccount();
    else openAuth('login');
}

export async function syncNow() {
    if (!(CloudService.isAvailable() && CloudService.getStatus() === 'connected')) { openCloudPanel(); return; }
    var r = await CloudSync.uploadNow({ manual: true });
    if (r.ok) ToastService.success(t('cloud.upload_ok', { n: r.slot || CloudService.getSlot() }));
    else ToastService.error(errText(r.code));
}

// ---------- Masuk / Daftar ----------
function openAuth(mode, prefillEmail) {
    var isReg = mode === 'register';
    var html = '' +
        '<div class="modal-title">☁️ ' + esc(t(isReg ? 'cloud.auth.title_register' : 'cloud.auth.title_login')) + '</div>' +
        '<div class="modal-sub">' + esc(t('cloud.auth.sub')) + '</div>' +
        '<button type="button" data-ca-google style="width:100%;padding:12px;font-weight:700;margin-bottom:12px;background:#fff;color:#333;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;gap:8px;">' +
            '<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.2 35.3 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>' +
            '<span>' + esc(t('cloud.auth.google')) + '</span>' +
        '</button>' +
        '<div style="text-align:center;font-size:11px;color:var(--text-mute);margin:8px 0 12px;">' +
            esc(t('cloud.auth.or_email')) +
        '</div>' +
            '<button type="button" class="' + (isReg ? 'btn-secondary' : 'btn-primary') + '" data-ca-tab="login" style="flex:1;">' + esc(t('cloud.auth.tab_login')) + '</button>' +
            '<button type="button" class="' + (isReg ? 'btn-primary' : 'btn-secondary') + '" data-ca-tab="register" style="flex:1;">' + esc(t('cloud.auth.tab_register')) + '</button>' +
        '</div>' +
        '<label class="field-label">' + esc(t('cloud.auth.email')) + '</label>' +
        '<input class="field-input" type="email" data-ca-email autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" value="' + esc(prefillEmail || '') + '" />' +
        '<label class="field-label" style="margin-top:10px;">' + esc(t('cloud.auth.password')) + '</label>' +
        '<input class="field-input" type="password" data-ca-pass autocomplete="' + (isReg ? 'new-password' : 'current-password') + '" />' +
        '<div data-ca-msg style="display:none;font-size:12px;margin-top:8px;line-height:1.4;"></div>' +
        (isReg ? '' : '<button type="button" data-ca-forgot style="background:none;border:none;color:var(--accent);font-size:12px;margin-top:8px;padding:0;cursor:pointer;">' + esc(t('cloud.auth.forgot')) + '</button>') +
        '<div style="display:flex;gap:8px;margin-top:16px;">' +
            '<button type="button" class="btn-secondary" data-modal-close style="flex:1;">' + esc(t('cloud.confirm.cancel')) + '</button>' +
            '<button type="button" class="btn-primary" data-ca-submit style="flex:1;">' + esc(t(isReg ? 'cloud.auth.tab_register' : 'cloud.auth.tab_login')) + '</button>' +
        '</div>';

    Modal.open('cloud-auth', html);
    var root = modalNode('cloud-auth');
    if (!root) return;

    var emailEl = root.querySelector('[data-ca-email]');
    var passEl = root.querySelector('[data-ca-pass]');
    var msgEl = root.querySelector('[data-ca-msg]');
    var submitEl = root.querySelector('[data-ca-submit]');
    var busy = false;

    function showMsg(text, kind) {
        msgEl.style.display = 'block';
        msgEl.style.color = kind === 'ok' ? 'var(--success)' : 'var(--danger)';
        msgEl.textContent = text;
    }
    function setBusy(b) {
        busy = b;
        submitEl.disabled = b;
        submitEl.textContent = b ? t('cloud.auth.working') : t(isReg ? 'cloud.auth.tab_register' : 'cloud.auth.tab_login');
    }

    async function submit() {
        if (busy) return;
        var email = emailEl.value.trim();
        var pass = passEl.value;
        if (!validEmail(email)) { showMsg(t('cloud.auth.need_email'), 'err'); emailEl.focus(); return; }
        if (pass.length < 6) { showMsg(t('cloud.auth.need_password'), 'err'); passEl.focus(); return; }
        setBusy(true);
        var res = isReg ? await CloudService.signUp(email, pass) : await CloudService.signIn(email, pass);
        setBusy(false);
        if (!res.ok) { showMsg(errText(res.code), 'err'); return; }
        if (isReg && res.needsConfirm) {
            ToastService.info(t('cloud.auth.check_email'), 6000);
            openAuth('login', email);
            return;
        }
        Modal.close('cloud-auth', true);
        ToastService.success(t('cloud.auth.signed_in'));
    }

    root.addEventListener('click', async function (e) {
        var tab = e.target.closest('[data-ca-tab]');
        if (tab) { openAuth(tab.dataset.caTab, emailEl.value.trim()); return; }
        if (e.target.closest('[data-ca-google]')) {
    e.preventDefault();
    CloudService.signInWithGoogle().then(function (r) {
        if (!r.ok) showMsg(errText(r.code), 'err');
    });
    return;
        }
        if (e.target.closest('[data-ca-submit]')) { submit(); return; }
        if (e.target.closest('[data-ca-forgot]')) {
            var email = emailEl.value.trim();
            if (!validEmail(email)) { showMsg(t('cloud.auth.need_email_reset'), 'err'); emailEl.focus(); return; }
            var r = await CloudService.resetPassword(email);
            if (r.ok) showMsg(t('cloud.auth.reset_sent'), 'ok'); else showMsg(errText(r.code), 'err');
        }
    });
    [emailEl, passEl].forEach(function (el) {
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    });
    emailEl.focus();
}

// ---------- Akun & slot ----------
function openAccount() {
    var last = CloudSync.getLastSyncAt();
    var html = '' +
        '<div class="modal-title">☁️ ' + esc(t('cloud.account.title')) + '</div>' +
        '<div class="modal-sub">' + esc(CloudService.getEmail() || '') + '</div>' +
        '<div data-ca-slots style="font-size:13px;color:var(--text-tertiary);">' + esc(t('cloud.slot.loading')) + '</div>' +
        '<div data-ca-paused style="display:none;font-size:12px;color:var(--warn);margin-top:10px;line-height:1.4;">' + esc(t('cloud.account.paused')) + '</div>' +
        '<div style="font-size:12px;color:var(--text-tertiary);margin-top:10px;">' +
            esc(t('cloud.account.last_sync', { value: last ? fmtDateTime(last) : t('cloud.account.never') })) + '</div>' +
        '<button type="button" class="btn-primary" data-ca-sync style="width:100%;margin-top:12px;">' + esc(t('cloud.account.sync_now')) + '</button>' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button type="button" class="btn-danger" data-ca-signout style="flex:1;">' + esc(t('cloud.account.signout')) + '</button>' +
            '<button type="button" class="btn-secondary" data-modal-close style="flex:1;">' + esc(t('common.tutup')) + '</button>' +
        '</div>';

    Modal.open('cloud-account', html);
    var root = modalNode('cloud-account');
    if (!root) return;

    var rows = null;           // null = belum / gagal dimuat

    function render() {
        var box = root.querySelector('[data-ca-slots]');
        if (!box) return;
        if (rows === null) { box.textContent = t('cloud.slot.load_fail'); return; }
        var active = CloudService.getSlot();
        var out = '';
        for (var n = 1; n <= CLOUD.slots; n++) {
            var row = rows.find(function (r) { return r.slot === n; }) || null;
            var isActive = n === active;
            var meta = row
                ? esc(row.company_name || '—') + ' · ' + esc(fmtGameDate(row.game_year, row.game_month)) + ' · ' + esc(fmtDateTime(row.updated_at))
                : esc(t('cloud.slot.empty'));
            out += '<div style="border:1px solid ' + (isActive ? 'var(--accent)' : 'var(--border)') + ';border-radius:var(--r-lg);padding:10px 12px;margin-top:8px;background:var(--bg-3);">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
                    '<div style="font-weight:600;color:var(--text-primary);">' + esc(t('cloud.slot', { n: n })) +
                        (isActive ? ' <span style="color:var(--accent);font-size:11px;">• ' + esc(t('cloud.slot.active')) + '</span>' : '') + '</div>' +
                    '<div style="display:flex;gap:6px;">' +
                        (isActive ? '' : '<button type="button" class="btn-secondary" data-slot-pick="' + n + '" style="padding:6px 10px;font-size:12px;">' + esc(t('cloud.slot.pick')) + '</button>') +
                        '<button type="button" class="btn-secondary" data-slot-upload="' + n + '" style="padding:6px 10px;font-size:12px;">' + esc(t('cloud.slot.upload')) + '</button>' +
                        '<button type="button" class="btn-secondary" data-slot-load="' + n + '"' + (row ? '' : ' disabled') + ' style="padding:6px 10px;font-size:12px;">' + esc(t('cloud.slot.load')) + '</button>' +
                    '</div>' +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;line-height:1.4;">' + meta + '</div>' +
            '</div>';
        }
        box.innerHTML = out;
        var paused = root.querySelector('[data-ca-paused]');
        if (paused) paused.style.display = CloudSync.isPaused() ? 'block' : 'none';
    }

    async function reload() {
        var r = await CloudService.listSavesStrict();
        rows = r.ok ? (r.rows || []) : null;
        if (Modal.isOpen('cloud-account')) render();
    }

    async function doUpload(n) {
        CloudService.setSlot(n);
        var r = await CloudSync.uploadNow({ manual: true });
        if (r.ok) ToastService.success(t('cloud.upload_ok', { n: n })); else ToastService.error(errText(r.code));
        if (Modal.isOpen('cloud-account')) reload();
    }

    async function doLoad(n) {
        CloudService.setSlot(n);
        var r = await CloudSync.applyCloud(n);
        if (!r.ok) { ToastService.error(errText(r.code)); if (Modal.isOpen('cloud-account')) reload(); }
    }

    root.addEventListener('click', async function (e) {
        var pick = e.target.closest('[data-slot-pick]');
        if (pick) {
            CloudService.setSlot(parseInt(pick.dataset.slotPick, 10));
            render();
            await CloudSync.recheck();          // slot baru bisa memicu dialog konflik
            if (Modal.isOpen('cloud-account')) reload();
            return;
        }
        var up = e.target.closest('[data-slot-upload]');
        if (up) {
            var un = parseInt(up.dataset.slotUpload, 10);
            var exists = rows && rows.some(function (r) { return r.slot === un; });
            if (!exists) { doUpload(un); return; }
            openConfirm({
                title: t('cloud.confirm.upload_title', { n: un }), sub: t('cloud.confirm.upload_sub'),
                danger: true, onYes: function () { doUpload(un); }, onCancel: openAccount
            });
            return;
        }
        var ld = e.target.closest('[data-slot-load]');
        if (ld && !ld.disabled) {
            var ln = parseInt(ld.dataset.slotLoad, 10);
            openConfirm({
                title: t('cloud.confirm.load_title'), sub: t('cloud.confirm.load_sub', { n: ln }),
                danger: true, onYes: function () { doLoad(ln); }, onCancel: openAccount
            });
            return;
        }
        if (e.target.closest('[data-ca-sync]')) {
            var btn = e.target.closest('[data-ca-sync]');
            btn.disabled = true;
            await doUpload(CloudService.getSlot());
            btn.disabled = false;
            return;
        }
        if (e.target.closest('[data-ca-signout]')) {
            var r = await CloudService.signOut();
            Modal.close('cloud-account', true);
            if (r.ok) ToastService.info(t('cloud.auth.signed_out')); else ToastService.error(errText(r.code));
        }
    });

    reload();
}

// ---------- Konfirmasi umum ----------
function openConfirm(o) {
    var html = '' +
        '<div class="modal-title">' + esc(o.title) + '</div>' +
        '<div class="modal-sub">' + esc(o.sub) + '</div>' +
        '<div style="display:flex;gap:8px;margin-top:8px;">' +
            '<button type="button" class="btn-secondary" data-cc-no style="flex:1;">' + esc(t('cloud.confirm.cancel')) + '</button>' +
            '<button type="button" class="' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-cc-yes style="flex:1;">' + esc(t('cloud.confirm.yes')) + '</button>' +
        '</div>';
    Modal.open('cloud-confirm', html);
    var root = modalNode('cloud-confirm');
    if (!root) return;
    root.querySelector('[data-cc-no]').addEventListener('click', function () {
        Modal.close('cloud-confirm', true);
        if (o.onCancel) o.onCancel();
    });
    root.querySelector('[data-cc-yes]').addEventListener('click', function () {
        Modal.close('cloud-confirm', true);
        if (o.onYes) o.onYes();
    });
}

// ---------- Konflik save ----------
function sideCard(title, company, gameDate, extra) {
    return '<div style="flex:1;min-width:0;border:1px solid var(--border);border-radius:var(--r-lg);padding:10px 12px;background:var(--bg-3);">' +
        '<div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;">' + esc(title) + '</div>' +
        '<div style="font-weight:600;color:var(--text-primary);margin-top:4px;word-break:break-word;">' + esc(company || '—') + '</div>' +
        '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">' + esc(gameDate) + '</div>' +
        (extra ? '<div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">' + esc(extra) + '</div>' : '') +
    '</div>';
}

function openConflict(info) {
    if (!info || Modal.isOpen('cloud-conflict')) return;
    var reasonKey = 'cloud.conflict.reason_' + (['ahead', 'different', 'fresh', 'remote'].indexOf(info.reason) >= 0 ? info.reason : 'ahead');
    var local = info.local || {};
    var cloud = info.cloud || {};
    var html = '' +
        '<div class="modal-title">☁️ ' + esc(t('cloud.conflict.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t(reasonKey)) + '</div>' +
        '<div style="display:flex;gap:8px;">' +
            sideCard(t('cloud.conflict.local'), local.company, fmtGameDate(local.year, local.month), '') +
            sideCard(t('cloud.conflict.cloud'), cloud.company_name, fmtGameDate(cloud.game_year, cloud.game_month), fmtDateTime(cloud.updated_at)) +
        '</div>' +
        '<div data-cf-msg style="display:none;color:var(--danger);font-size:12px;margin-top:8px;"></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">' +
            '<button type="button" class="btn-primary" data-cf="cloud" style="width:100%;">' + esc(t('cloud.conflict.use_cloud')) + '</button>' +
            '<button type="button" class="btn-danger" data-cf="local" style="width:100%;">' + esc(t('cloud.conflict.keep_local')) + '</button>' +
            '<button type="button" class="btn-secondary" data-cf="later" style="width:100%;">' + esc(t('cloud.conflict.later')) + '</button>' +
        '</div>';

    // Tidak bisa ditutup lewat latar: pemain harus memilih (atau "Nanti saja").
    Modal.open('cloud-conflict', html, { dismissible: false });
    var root = modalNode('cloud-conflict');
    if (!root) return;
    var working = false;

    root.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-cf]');
        if (!b || working) return;
        working = true;
        var choice = b.dataset.cf;
        var r = await CloudSync.resolve(choice);
        if (r && r.ok === false) {
            working = false;
            var m = root.querySelector('[data-cf-msg]');
            if (m) { m.style.display = 'block'; m.textContent = errText(r.code); }
            return;
        }
        Modal.close('cloud-conflict', true);
        if (choice === 'later') ToastService.info(t('cloud.conflict.paused'));
        else if (choice === 'local') ToastService.success(t('cloud.upload_ok', { n: info.slot || CloudService.getSlot() }));
    });
}

// ---------- Reset password (dari tautan email) ----------
function openRecovery() {
    var html = '' +
        '<div class="modal-title">🔑 ' + esc(t('cloud.recovery.title')) + '</div>' +
        '<div class="modal-sub">' + esc(t('cloud.recovery.sub')) + '</div>' +
        '<label class="field-label">' + esc(t('cloud.auth.password')) + '</label>' +
        '<input class="field-input" type="password" data-cr-pass autocomplete="new-password" />' +
        '<div data-cr-msg style="display:none;color:var(--danger);font-size:12px;margin-top:8px;"></div>' +
        '<button type="button" class="btn-primary" data-cr-save style="width:100%;margin-top:14px;">' + esc(t('cloud.recovery.btn')) + '</button>';
    Modal.open('cloud-recovery', html);
    var root = modalNode('cloud-recovery');
    if (!root) return;
    var passEl = root.querySelector('[data-cr-pass]');
    var msgEl = root.querySelector('[data-cr-msg]');
    root.querySelector('[data-cr-save]').addEventListener('click', async function () {
        if (passEl.value.length < 6) { msgEl.style.display = 'block'; msgEl.textContent = t('cloud.auth.need_password'); return; }
        var r = await CloudService.updatePassword(passEl.value);
        if (!r.ok) { msgEl.style.display = 'block'; msgEl.textContent = errText(r.code); return; }
        Modal.close('cloud-recovery', true);
        ToastService.success(t('cloud.recovery.done'));
    });
}

// ---------- Pasang listener (sekali) ----------
export function bindCloudUI() {
    if (_bound) return;
    _bound = true;

    bus.on('cloud:conflict', function (info) { openConflict(info); });

    bus.on('cloud:remote-newer', function (info) {
        ToastService.info(t('cloud.remote_newer'), 9000, {
            action: {
                label: t('cloud.view'),
                onClick: function () {
                    CloudSync.beginConflict();
                    openConflict({ slot: info.slot, local: info.local, cloud: info.cloud, reason: 'remote' });
                }
            }
        });
    });

    bus.on('cloud:applied', function () { ToastService.success(t('cloud.applied'), 4000); });
    bus.on('cloud:password-recovery', function () { openRecovery(); });

    bus.on('cloud:autosync-failed', function () {
        var now = Date.now();
        if (now - _lastAutoFailToast < 5 * 60 * 1000) return;       // maks 1 toast / 5 menit
        _lastAutoFailToast = now;
        ToastService.warning(t('cloud.autosync_failed'), 4000);
    });

    // Segarkan baris "Akun Cloud" di Setelan bila sedang terbuka.
    bus.on('cloud:status-changed', function () {
        if (document.querySelector('[data-set="cloud"]') && window.__game && typeof window.__game.render === 'function') {
            window.__game.render();
        }
    });
}
