// FILE: src/ui/panels/OnboardingModal.js
// v2028.41 — [FIX STUCK] Menangani timeout koneksi. Mencegah layar "Checking cloud progress" macet selamanya.
import { Modal } from '../modal.js';
import { bus } from '../../core/EventBus.js';
import { DIFFICULTY } from '../../config/constants.js';
import { LanguageService, t } from '../../core/LanguageService.js';
import { ToastService } from '../../core/ToastService.js';
import { icon } from '../icons.js';
import { validateCompanyName } from '../../data/name-blocklist.data.js';
import { checkCompanyNameAvailable } from '../../services/cloud/CompanyNameCheck.js';
import { generateCompanyName, withNumericSuffix } from '../../data/random-company-names.data.js';
import { CloudService } from '../../services/CloudService.js';
import { SupabaseAdapter } from '../../services/cloud/SupabaseAdapter.js';
import { isCloudConfigured } from '../../services/cloud/supabase.config.js';

const DIFF_INFO = {
    santai: { labelKey: 'onb.diff_santai', descKey: 'onb.diff_santai_desc' },
    normal: { labelKey: 'onb.diff_normal', descKey: 'onb.diff_normal_desc' },
    sulit:  { labelKey: 'onb.diff_sulit',  descKey: 'onb.diff_sulit_desc' }
};

const KNOWN_ERRORS = ['invalid_credentials', 'email_exists', 'email_not_confirmed', 'weak_password', 'rate_limit',
    'network', 'lib', 'not_configured', 'too_large', 'no_save', 'not_signed_in', 'db_setup', 'permission',
    'busy', 'conflict', 'unknown'];

const MONTHS = {
    id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
};

// [FIX] Waktu tunggu dikurangi jadi 6 detik agar pemain tidak bosan menunggu
const NET_TIMEOUT_MS = 6000; 

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function _lang() {
    var l = 'en';
    try { l = LanguageService.getLang(); } catch (e) {}
    return MONTHS[l] ? l : 'en';
}

function _validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function _errText(code) {
    var c = KNOWN_ERRORS.indexOf(code) >= 0 ? code : 'unknown';
    return t('cloud.err.' + c);
}

function _fmtGameDate(year, month) {
    if (!year) return '—';
    var m = MONTHS[_lang()][(month || 1) - 1] || '';
    return (m ? m + ' ' : '') + year;
}

function _fmtDateTime(v) {
    var d = new Date(v);
    if (!v || isNaN(d.getTime())) return '—';
    try { return d.toLocaleString(_lang() === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch (e) { return d.toISOString(); }
}

// [FIX] Pastikan promise tidak pernah "menggantung" atau melempar error tanpa tertangkap
function _withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise(function (resolve) {
            setTimeout(function () { resolve({ ok: false, code: 'timeout' }); }, ms || NET_TIMEOUT_MS);
        })
    ]).catch(function (err) {
        console.warn('[Onboarding] Network/Timeout Error:', err);
        return { ok: false, code: 'network' };
    });
}

function _failText(res) {
    return res && res.code === 'timeout' ? t('onb.auth.timeout') : _errText(res && res.code);
}

function _reasonToKey(reason) {
    switch (reason) {
        case 'empty':      return 'onb.name.error_empty';
        case 'too_short':  return 'onb.name.error_too_short';
        case 'too_long':   return 'onb.name.error_too_long';
        case 'competitor': return 'onb.name.error_competitor';
        case 'brand':      return 'onb.name.error_brand';
        case 'public_figure': return 'onb.name.error_public_figure';
        case 'profanity':  return 'onb.name.error_profanity';
        default:           return 'onb.name.error_profanity';
    }
}

function _ensureCloud() {
    try {
        if (!isCloudConfigured()) return false;
        if (!CloudService.isAvailable()) CloudService.registerAdapter(SupabaseAdapter);
        return CloudService.isAvailable();
    } catch (e) {
        console.warn('[Onboarding] Cloud tidak siap:', e);
        return false;
    }
}

// [FIX] Payload save valid = ada data objek dari game_saves.
function _hasCloudData(res) {
    return !!(res && res.ok && res.payload && res.payload.data && typeof res.payload.data === 'object');
}

function _isSignedIn() {
    return CloudService.getStatus() === 'connected' && !!CloudService.getUserId();
}

function _viewStart(cloudOk, form) {
    var signedIn = cloudOk && _isSignedIn();

    var account = signedIn
        ? '<div class="onb-account">' +
              '<span class="onb-account__icon">' + icon('cloud', 18) + '</span>' +
              '<div class="onb-account__txt">' +
                  '<div class="onb-account__label">' + esc(t('onb.auth.signed_as')) + '</div>' +
                  '<div class="onb-account__email">' + esc(CloudService.getEmail() || '') + '</div>' +
              '</div>' +
              '<button type="button" class="onb-link" data-onb-signout>' + esc(t('onb.auth.signout')) + '</button>' +
          '</div>'
        : '';

    var loginBtn = (cloudOk && !signedIn)
        ? '<button type="button" class="btn-secondary onb-login-btn" data-onb-login>' + icon('user', 16) + '<span>' + esc(t('onb.login')) + '</span></button>'
        : '';

    var hint = (cloudOk && !signedIn)
        ? '<div class="onb-hint">' + icon('cloud', 14) + '<span>' + esc(t('onb.login_hint')) + '</span></div>'
        : '';

    return '' +
        '<div class="onb-view" data-onb-view="start">' +
            '<div class="modal-title">' + esc(t('onb.title')) + '</div>' +
            '<div class="modal-sub">' + esc(t('onb.sub')) + '</div>' +
            account +
            '<label class="field-label" style="margin-top:' + (signedIn ? '12' : '0') + 'px;">' + esc(t('onb.name_label')) + '</label>' +
            '<input class="field-input" data-onb-name maxlength="24"' +
                ' placeholder="' + esc(t('onb.name_placeholder')) + '"' +
                ' autocomplete="off" autocapitalize="words" />' +
            '<div data-onb-error style="display:none;color:var(--danger);font-size:12px;margin-top:6px;line-height:1.4;"></div>' +
            '<label class="field-label" style="margin-top:12px;">' + esc(t('onb.diff_label')) + '</label>' +
            '<div class="diff-grid">' +
                Object.keys(DIFF_INFO).map(function (k) {
                    var info = DIFF_INFO[k];
                    return '<button type="button" class="diff-btn ' + (k === form.diff ? 'active' : '') + '" data-onb-diff="' + k + '">' +
                        '<div class="diff-label">' + esc(t(info.labelKey)) + '</div>' +
                        '<div class="diff-desc">' + esc(t(info.descKey)) + '</div>' +
                    '</button>';
                }).join('') +
            '</div>' +
            '<div class="onb-actions">' +
                '<button type="button" class="btn-primary" data-onb-submit>' + esc(t('onb.submit')) + '</button>' +
                loginBtn +
            '</div>' +
            hint +
        '</div>';
}

function _viewAuth(auth) {
    var isReg = auth.mode === 'register';
    return '' +
        '<div class="onb-view" data-onb-view="auth">' +
            '<button type="button" class="onb-back" data-onb-back>' + icon('arrowLeft', 16) + '<span>' + esc(t('onb.auth.back')) + '</span></button>' +
            '<div class="modal-title">' + esc(t(isReg ? 'onb.auth.title_register' : 'onb.auth.title_login')) + '</div>' +
            '<div class="modal-sub">' + esc(t(isReg ? 'onb.auth.sub_register' : 'onb.auth.sub_login')) + '</div>' +
            '<div class="onb-seg" role="tablist">' +
                '<button type="button" role="tab" class="' + (isReg ? '' : 'active') + '" data-onb-tab="login">' + esc(t('cloud.auth.tab_login')) + '</button>' +
                '<button type="button" role="tab" class="' + (isReg ? 'active' : '') + '" data-onb-tab="register">' + esc(t('cloud.auth.tab_register')) + '</button>' +
            '</div>' +
            '<button type="button" class="onb-google" data-onb-google>' + '<svg class="onb-google__g" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>' + '<span>' + esc(t('onb.auth.google')) + '</span></button>' +
            '<button type=\"button\" class=\"onb-discord\" data-onb-discord>' + '<svg class=\"onb-discord__d\" viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\" fill=\"currentColor\"><path d=\"M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z\"/></svg>' + '<span>' + esc(t('onb.auth.discord')) + '</span></button>' +
            '<div class="onb-or" aria-hidden="true"><span>' + esc(t('onb.auth.or')) + '</span></div>' +
            '<form data-onb-authform novalidate>' +
                '<label class="field-label">' + esc(t('cloud.auth.email')) + '</label>' +
                '<input class="field-input" type="email" data-onb-email name="email" autocomplete="email" inputmode="email"' +
                    ' autocapitalize="off" spellcheck="false" placeholder="' + esc(t('onb.auth.email_ph')) + '" />' +
                '<label class="field-label" style="margin-top:10px;">' + esc(t('cloud.auth.password')) + '</label>' +
                '<div class="onb-passwrap">' +
                    '<input class="field-input" type="password" data-onb-pass name="password"' +
                        ' autocomplete="' + (isReg ? 'new-password' : 'current-password') + '"' +
                        ' placeholder="' + esc(t('onb.auth.pass_ph')) + '" />' +
                    '<button type="button" class="onb-eye" data-onb-eye aria-label="' + esc(t('onb.auth.show_pass')) + '">' + icon('eye', 18) + '</button>' +
                '</div>' +
                '<div class="onb-msg" data-onb-msg style="display:none;" role="alert"></div>' +
                (isReg ? '' : '<button type="button" class="onb-link onb-forgot" data-onb-forgot>' + esc(t('cloud.auth.forgot')) + '</button>') +
                '<button type="submit" class="btn-primary onb-wide" data-onb-authsubmit>' + esc(t(isReg ? 'cloud.auth.tab_register' : 'cloud.auth.tab_login')) + '</button>' +
            '</form>' +
            '<button type="button" class="onb-link onb-switch" data-onb-tab="' + (isReg ? 'login' : 'register') + '">' +
                esc(t(isReg ? 'onb.auth.to_login' : 'onb.auth.to_register')) + '</button>' +
        '</div>';
}

function _viewChecking() {
    return '' +
        '<div class="onb-view onb-center" data-onb-view="checking">' +
            '<div class="onb-spin" aria-hidden="true"></div>' +
            '<div class="modal-sub" style="margin:12px 0 0;">' + esc(t('onb.auth.checking')) + '</div>' +
        '</div>';
}

function _viewFound(row) {
    return '' +
        '<div class="onb-view" data-onb-view="found">' +
            '<div class="modal-title">' + esc(t('onb.cloud.found_title')) + '</div>' +
            '<div class="modal-sub">' + esc(t('onb.cloud.found_sub')) + '</div>' +
            '<div class="onb-save">' +
                '<span class="onb-save__icon">' + icon('cloud', 20) + '</span>' +
                '<div class="onb-save__txt">' +
                    '<div class="onb-save__name">' + esc(row.company_name || '—') + '</div>' +
                    '<div class="onb-save__meta">' + esc(_fmtGameDate(row.game_year, row.game_month)) + '</div>' +
                    '<div class="onb-save__meta">' + esc(t('onb.cloud.updated', { value: _fmtDateTime(row.updated_at) })) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="onb-msg" data-onb-msg style="display:none;" role="alert"></div>' +
            '<button type="button" class="btn-primary onb-wide" data-onb-continue>' + esc(t('onb.cloud.continue')) + '</button>' +
            '<button type="button" class="btn-secondary onb-wide" data-onb-new style="margin-top:8px;">' + esc(t('onb.cloud.new')) + '</button>' +
            '<div class="onb-hint" style="margin-top:10px;">' + icon('info', 14) + '<span>' + esc(t('onb.cloud.new_warn')) + '</span></div>' +
        '</div>';
}

export function showOnboarding() {
    return new Promise(function (resolve) {
        var cloudOk = _ensureCloud();
        var form = { name: '', diff: DIFFICULTY.normal };
        var auth = { mode: 'login', email: '', busy: false, notice: '' };
        var foundRow = null;
        var current = 'start';
        var finished = false;

        Modal.open('onboarding', '<div data-onb-host></div>', { dismissible: false });

        var root = document.querySelector('[data-modal-id="onboarding"]');
        var host = root.querySelector('[data-onb-host]');

        function $(sel) { return host.querySelector(sel); }

        function render(view) {
            current = view;
            if (view === 'auth') host.innerHTML = _viewAuth(auth);
            else if (view === 'checking') host.innerHTML = _viewChecking();
            else if (view === 'found') host.innerHTML = _viewFound(foundRow || {});
            else host.innerHTML = _viewStart(cloudOk, form);

            if (view === 'start') {
                $('[data-onb-name]').value = form.name;
            } else if (view === 'auth') {
                $('[data-onb-email]').value = auth.email;
                if (auth.notice) { _msg(auth.notice, 'ok'); auth.notice = ''; }
                setTimeout(function () {
                    var el = $(auth.email ? '[data-onb-pass]' : '[data-onb-email]');
                    if (el) el.focus();
                }, 60);
            }
        }

        function _msg(text, kind) {
            var el = $('[data-onb-msg]');
            if (!el) return;
            el.style.display = 'block';
            el.style.color = kind === 'ok' ? 'var(--success)' : 'var(--danger)';
            el.textContent = text;
        }

        function _clearNameError() {
            var errorEl = $('[data-onb-error]');
            var nameInput = $('[data-onb-name]');
            if (!errorEl || !nameInput) return;
            errorEl.style.display = 'none';
            errorEl.textContent = '';
            nameInput.style.borderColor = '';
        }

        function _showNameError(reasonKey) {
            var errorEl = $('[data-onb-error]');
            var nameInput = $('[data-onb-name]');
            if (!errorEl || !nameInput) return;
            errorEl.textContent = t(reasonKey);
            errorEl.style.display = 'block';
            nameInput.style.borderColor = 'var(--danger)';
        }

        function _setAuthBusy(b) {
            auth.busy = b;
            var btn = $('[data-onb-authsubmit]');
            if (btn) {
                btn.disabled = b;
                btn.textContent = b ? t('cloud.auth.working')
                    : t(auth.mode === 'register' ? 'cloud.auth.tab_register' : 'cloud.auth.tab_login');
            }
        }

        function _finish(result) {
            if (finished) return;
            finished = true;
            Modal.close('onboarding', true);
            bus.emit('onboarding:done', result);
            resolve(result);
        }

        async function doAuth() {
            if (auth.busy) return;
            var emailEl = $('[data-onb-email]');
            var passEl = $('[data-onb-pass]');
            var email = emailEl.value.trim();
            var pass = passEl.value;
            auth.email = email;

            if (!_validEmail(email)) { _msg(t('cloud.auth.need_email'), 'err'); emailEl.focus(); return; }
            if (pass.length < 6) { _msg(t('cloud.auth.need_password'), 'err'); passEl.focus(); return; }

            _setAuthBusy(true);
            var res = await _withTimeout(auth.mode === 'register'
                ? CloudService.signUp(email, pass)
                : CloudService.signIn(email, pass));
            
            if (finished || current !== 'auth') return;
            _setAuthBusy(false);

            if (!res.ok) { _msg(_failText(res), 'err'); return; }

            if (auth.mode === 'register' && res.needsConfirm) {
                auth.mode = 'login';
                auth.notice = t('onb.auth.confirm_sent');
                render('auth');
                return;
            }
            await afterSignedIn();
        }

        async function afterSignedIn() {
            render('checking');
            try {
                await _afterSignedInInner();
            } catch (err) {
                // [FIX] Jika ada error di tengah jalan, jangan biarkan layar "Memeriksa progres cloud" menggantung.
                console.error('[Onboarding] afterSignedIn gagal:', err);
                if (finished) return;
                ToastService.error(t('cloud.err.unknown'));
                render('start');
            }
        }

        function _showFoundFromPayload(payload, slot) {
            var dd = payload.data;
            var tm = dd.time || {};
            foundRow = {
                slot: slot, company_name: dd.companyName || '',
                game_year: tm.currentYear || null, game_month: tm.currentMonth || null,
                updated_at: payload.updatedAt || null
            };
            render('found');
            doContinue();
        }

        async function _afterSignedInInner() {
            var slot = CloudService.getSlot();
            var list = await _withTimeout(CloudService.listSavesStrict(), 5000);
            if (finished) return;

            if (!list || !list.ok) {
                ToastService.error(t('cloud.err.network') || 'Koneksi ke server gagal. Coba lagi.');
                render('auth');
                return;
            }

            var row = (list.rows || []).find(function (r) { return r.slot === slot; }) || null;
            ToastService.success(t('cloud.auth.signed_in'));
            if (row) {
                // Akun punya progres cloud -> muat & masuk game.
                foundRow = row;
                render('found');
                doContinue();
                return;
            }

            // Daftar save (save_heads) kosong/terlambat: cek langsung ke tabel save.
            var direct = await _withTimeout(CloudService.downloadSave(slot), 8000);
            if (finished) return;
            if (_hasCloudData(direct)) { _showFoundFromPayload(direct.payload, slot); return; }
            if (direct && !direct.ok && direct.code !== 'no_save') {
                console.warn('[Onboarding] cek save cloud gagal:', direct.code);
                ToastService.error(t('onb.cloud.load_fail'));
                render('auth');
                _msg(t('onb.cloud.load_fail'), 'err');
                return;
            }

            // [FIX] Tidak ada save terlihat. Token basi membuat RLS diam-diam mengembalikan 0 baris
            // (tanpa error), sehingga akun lama terlihat seperti akun baru. Verifikasi sesi ke server
            // lalu coba sekali lagi sebelum menganggap akun ini baru.
            console.info('[Onboarding] Save tidak terlihat; memverifikasi sesi...');
            var verified = await _withTimeout(CloudService.restoreSession(), 6000);
            if (finished) return;
            if (!(verified && verified.ok)) {
                console.warn('[Onboarding] Sesi tidak sah di server:', verified && verified.code);
                render('auth');
                _msg(_errText('not_signed_in'), 'err');
                return;
            }

            var again = await _withTimeout(CloudService.downloadSave(slot), 8000);
            if (finished) return;
            if (_hasCloudData(again)) { _showFoundFromPayload(again.payload, slot); return; }
            if (again && !again.ok && again.code !== 'no_save') {
                console.warn('[Onboarding] cek ulang save cloud gagal:', again.code);
                render('auth');
                _msg(t('onb.cloud.load_fail'), 'err');
                return;
            }

            console.info('[Onboarding] Sesi valid, tidak ada save di cloud: akun baru -> mulai otomatis.');
            await _autoStartNewAccount();
        }

        // Akun baru (mis. baru konfirmasi email): langsung masuk game dengan nama acak + kesulitan Normal.
        // Nama bisa diganti nanti lewat pengaturan. Bila gagal, tampilkan form setup biasa.
        async function _autoStartNewAccount() {
            try {
                var name = '';
                for (var i = 0; i < 6; i++) {
                    var cand = generateCompanyName();
                    var av = await _withTimeout(checkCompanyNameAvailable(cand), 4000);
                    if (finished) return;
                    if (av !== false) { name = cand; break; }
                }
                if (!name) name = withNumericSuffix(generateCompanyName());
                ToastService.success(t('onb.auto.welcome', { name: name }));
                _finish({ companyName: name, difficulty: DIFFICULTY.normal, autoCreated: true });
            } catch (err) {
                console.warn('[Onboarding] Auto-start gagal, pakai form manual:', err);
                if (!finished) render('start');
            }
        }

        var _loadingCloud = false;
        async function doContinue() {
            if (_loadingCloud) return;
            _loadingCloud = true;
            var btn = $('[data-onb-continue]');
            var other = $('[data-onb-new]');
            if (btn) { btn.disabled = true; btn.textContent = t('onb.cloud.loading'); }
            if (other) other.disabled = true;

            var res = await _withTimeout(CloudService.downloadSave(CloudService.getSlot()), 8000);
            var data = res && res.ok && res.payload && res.payload.data;
            _loadingCloud = false;
            if (finished) return;

            if (!data || typeof data !== 'object') {
                if (btn) { btn.disabled = false; btn.textContent = t('onb.cloud.continue'); }
                if (other) other.disabled = false;
                _msg(res && res.ok === false && res.code !== 'timeout' ? _errText(res.code) : t('onb.cloud.load_fail'), 'err');
                return;
            }
            _finish({
                companyName: data.companyName || (foundRow && foundRow.company_name) || '',
                difficulty: data.difficulty || form.diff,
                cloudData: data,
                fromCloud: true
            });
        }

        var _checking = false;
        async function doSubmit() {
            if (_checking) return;
            var nameInput = $('[data-onb-name]');
            var submitBtn = $('[data-onb-submit]');
            var result = validateCompanyName(nameInput.value);

            if (!result.ok) {
                _showNameError(_reasonToKey(result.reason));
                nameInput.focus();
                return;
            }

            var finalName = nameInput.value.trim();

            _checking = true;
            var origLabel = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = t('onb.name.checking');
            
            var available = await _withTimeout(checkCompanyNameAvailable(finalName), 4000);
            
            _checking = false;
            if (finished) return;
            submitBtn.disabled = false;
            submitBtn.textContent = origLabel;
            
            if (available === false) {
                _showNameError('onb.name.error_taken');
                nameInput.focus();
                return;
            }

            _finish({ companyName: finalName, difficulty: form.diff });
        }

        root.addEventListener('click', async function (e) {
            var el;

            if ((el = e.target.closest('[data-onb-diff]'))) {
                form.diff = el.dataset.onbDiff;
                root.querySelectorAll('[data-onb-diff]').forEach(function (b) { b.classList.remove('active'); });
                el.classList.add('active');
                return;
            }
            if (e.target.closest('[data-onb-submit]')) { doSubmit(); return; }

            if (e.target.closest('[data-onb-login]')) {
                form.name = ($('[data-onb-name]') || {}).value || form.name;
                auth.mode = 'login';
                render('auth');
                return;
            }
            if (e.target.closest('[data-onb-back]')) { render('start'); return; }

            if ((el = e.target.closest('[data-onb-tab]'))) {
                if (auth.busy) return;
                var emailEl = $('[data-onb-email]');
                if (emailEl) auth.email = emailEl.value.trim();
                auth.mode = el.dataset.onbTab === 'register' ? 'register' : 'login';
                render('auth');
                return;
            }

            if (e.target.closest('[data-onb-eye]')) {
                var passEl = $('[data-onb-pass]');
                var eye = e.target.closest('[data-onb-eye]');
                var show = passEl.type === 'password';
                passEl.type = show ? 'text' : 'password';
                eye.innerHTML = icon(show ? 'eyeOff' : 'eye', 18);
                eye.setAttribute('aria-label', t(show ? 'onb.auth.hide_pass' : 'onb.auth.show_pass'));
                passEl.focus();
                return;
            }

            if (e.target.closest('[data-onb-forgot]')) {
                var mail = $('[data-onb-email]').value.trim();
                auth.email = mail;
                if (!_validEmail(mail)) { _msg(t('cloud.auth.need_email_reset'), 'err'); $('[data-onb-email]').focus(); return; }
                var r = await _withTimeout(CloudService.resetPassword(mail), 5000);
                if (current !== 'auth') return;
                if (r && r.ok) _msg(t('cloud.auth.reset_sent'), 'ok'); else _msg(_failText(r), 'err');
                return;
            }

            if ((el = e.target.closest('[data-onb-google]'))) {
                if (auth.busy || el.disabled) return;
                // Login Google: browser dialihkan ke Google dan kembali ke halaman ini; sesi dipulihkan oleh pemeriksaan di bawah
                // (restoreSession), lalu alurnya sama dengan login email (cek save cloud, atau form perusahaan baru).
                el.disabled = true;
                var lbl = el.querySelector('span'), lblAwal = lbl ? lbl.textContent : '';
                if (lbl) lbl.textContent = t('onb.auth.google_go');
                var gr = await _withTimeout(CloudService.signInWithGoogle(), 15000);
                if (finished || current !== 'auth') return;
                if (gr && gr.ok) {
                    // Halaman sedang pindah ke Google. Bila pengguna menekan Back (halaman dipulihkan dari cache), tombol aktif lagi.
                    setTimeout(function () { if (!finished && el.isConnected) { el.disabled = false; if (lbl) lbl.textContent = lblAwal; } }, 10000);
                    return;
                }
                console.warn('[Onboarding] Login Google gagal:', gr && (gr.code || gr.reason), gr && gr.reason);
                el.disabled = false; if (lbl) lbl.textContent = lblAwal;
                _msg(t('onb.auth.google_fail'), 'err');
                return;
            }

            if ((el = e.target.closest('[data-onb-discord]'))) {
                if (auth.busy || el.disabled) return;
                // Login Discord: sama seperti Google (browser dialihkan ke Discord lalu kembali; sesi dipulihkan oleh restoreSession).
                el.disabled = true;
                var dlbl = el.querySelector('span'), dlblAwal = dlbl ? dlbl.textContent : '';
                if (dlbl) dlbl.textContent = t('onb.auth.discord_go');
                var dr = await _withTimeout(CloudService.signInWithDiscord(), 15000);
                if (finished || current !== 'auth') return;
                if (dr && dr.ok) {
                    setTimeout(function () { if (!finished && el.isConnected) { el.disabled = false; if (dlbl) dlbl.textContent = dlblAwal; } }, 10000);
                    return;
                }
                console.warn('[Onboarding] Login Discord gagal:', dr && (dr.code || dr.reason), dr && dr.reason);
                el.disabled = false; if (dlbl) dlbl.textContent = dlblAwal;
                _msg(t('onb.auth.discord_fail'), 'err');
                return;
            }

            if (e.target.closest('[data-onb-signout]')) {
                var so = e.target.closest('[data-onb-signout]');
                so.disabled = true;
                form.name = ($('[data-onb-name]') || {}).value || form.name;
                await CloudService.signOut();
                if (!finished) render('start');
                return;
            }

            if (e.target.closest('[data-onb-continue]')) { doContinue(); return; }
            if (e.target.closest('[data-onb-new]')) { render('start'); return; }
        });

        root.addEventListener('submit', function (e) {
            if (e.target.closest('[data-onb-authform]')) {
                e.preventDefault();
                doAuth();
            }
        });

        root.addEventListener('input', function (e) {
            if (e.target.matches('[data-onb-name]')) {
                form.name = e.target.value;
                _clearNameError();
            } else if (e.target.matches('[data-onb-email], [data-onb-pass]')) {
                var m = $('[data-onb-msg]');
                if (m) { m.style.display = 'none'; m.textContent = ''; }
            }
        });

        root.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.target.matches('[data-onb-name]')) {
                e.preventDefault();
                doSubmit();
            }
        });

        root.addEventListener('focusout', function (e) {
            if (!e.target.matches || !e.target.matches('[data-onb-name]')) return;
            var name = e.target.value.trim();
            if (!name) return;
            var result = validateCompanyName(name);
            if (!result.ok) { _showNameError(_reasonToKey(result.reason)); return; }
            
            checkCompanyNameAvailable(name).then(function (av) {
                var cur = $('[data-onb-name]');
                if (av === false && cur && cur.value.trim() === name) _showNameError('onb.name.error_taken');
            });
        });

        render('start');

        // [FIX] Sudah login saat layar ini dibuka (sesi tersimpan / baru login): cek progres cloud sekarang.
        // Dulu hanya dicek pada alur login manual atau pemulihan sesi, sehingga form "perusahaan baru" muncul
        // meski akun sudah punya save.
        if (cloudOk && _isSignedIn()) {
            afterSignedIn().catch(function () { if (!finished && current === 'checking') render('start'); });
        }

        if (cloudOk && !_isSignedIn() && typeof SupabaseAdapter.hasStoredSession === 'function' && SupabaseAdapter.hasStoredSession()) {
            CloudService.restoreSession().then(function (r) {
                if (finished || !(r && r.ok)) return;
                if (current === 'start') afterSignedIn();
            }).catch(function () {});
        }
    });
    }
