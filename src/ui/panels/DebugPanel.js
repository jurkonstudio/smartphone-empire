// FILE: src/ui/panels/DebugPanel.js
// v1.2 — i18n: semua teks lewat _tf('dbg.*'); jam log mengikuti bahasa.
// v1.1 — + tombol Test List Profiles (Sesi 1 Player List).
// Catatan: panel ini dirender dari SettingsPanel (ikut renderAll saat lang:changed), jadi tanpa listener sendiri.
import { LanguageService, t } from '../../core/LanguageService.js';
import { CloudService } from '../../services/CloudService.js';
import { CloudSync } from '../../services/cloud/CloudSync.js';
import { SiliconService } from '../../systems/SiliconService.js';

var _logs = [];

// t(key); jika key belum ada di kamus, pakai fallback sesuai bahasa aktif. Vars diinterpolasi {n}.
function _lang() { var l = 'id'; try { l = LanguageService.getLang(); } catch (e) {} return l; }
function _tf(key, fbId, fbEn, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    var out = (_lang() === 'en') ? fbEn : fbId;
    if (vars) {
        for (var k in vars) {
            if (Object.prototype.hasOwnProperty.call(vars, k)) out = out.split('{' + k + '}').join(String(vars[k]));
        }
    }
    return out;
}
function _emptyLog() { return '<i>' + _esc(_tf('dbg.log.empty', 'Belum ada log.', 'No logs yet.')) + '</i>'; }

function _log(msg) {
    var ts = new Date().toLocaleTimeString(_lang() === 'en' ? 'en-US' : 'id-ID');
    _logs.unshift('[' + ts + '] ' + msg);
    if (_logs.length > 20) _logs.length = 20;
}

function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function _row(label, value, attrs) {
    return '<div class="settings-row">' +
        '<div class="settings-row-main"><div class="settings-row-label">' + _esc(label) + '</div></div>' +
        '<div class="settings-row-right"><span class="settings-row-value"' +
            (attrs ? ' data-dbg="' + attrs + '"' : '') + '>' + _esc(value) + '</span></div>' +
        '</div>';
}

function _btn(label, action, variant) {
    var cls = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
    return '<button type="button" class="' + cls + '" data-dbg-action="' + action + '" style="width:100%;margin:2px 0;padding:10px;font-size:13px;">' + _esc(label) + '</button>';
}

function _getFlag() {
    try { return localStorage.getItem('smartphone-empire:silicon-synced') === '1' ? 'true ✓' : 'false'; }
    catch (e) { return _tf('dbg.val.unknown', 'tidak diketahui', 'unknown'); }
}

export function renderDebugSection() {
    var cloud = CloudService.getStatus();
    var email = CloudService.getEmail() || '—';
    var uid = CloudService.getUserId() || '—';
    var slot = CloudService.getSlot ? CloudService.getSlot() : '—';
    var local = SiliconService.getBalance();

    return '' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">☁️ ' + _esc(_tf('dbg.sec.cloud', 'Status Cloud', 'Cloud Status')) + '</div>' +
        '<div class="settings-list">' +
            _row(_tf('dbg.row.status', 'Status', 'Status'), cloud, 'dbg-cloud-status') +
            _row(_tf('dbg.row.email', 'Email', 'Email'), email) +
            _row(_tf('dbg.row.user_id', 'ID Pengguna', 'User ID'), uid && uid.length > 12 ? uid.slice(0, 12) + '…' : uid) +
            _row(_tf('dbg.row.slot', 'Slot', 'Slot'), slot) +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">💎 ' + _esc(_tf('dbg.sec.silicon', 'Silicon', 'Silicon')) + '</div>' +
        '<div class="settings-list">' +
            _row(_tf('dbg.row.local', 'Lokal', 'Local'), local + ' SIL', 'dbg-sil-local') +
            _row(_tf('dbg.row.server', 'Server', 'Server'), _tf('dbg.val.click_check', '? (klik cek)', '? (click to check)'), 'dbg-sil-server') +
            _row(_tf('dbg.row.synced_flag', 'Flag sinkron', 'Synced flag'), _getFlag(), 'dbg-sil-flag') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">👥 ' + _esc(_tf('dbg.sec.players', 'Pemain', 'Players')) + '</div>' +
        '<div class="settings-list">' +
            _row(_tf('dbg.row.total_profiles', 'Total profil publik', 'Total public profiles'), _tf('dbg.val.click_test', '? (klik test)', '? (click to test)'), 'dbg-players-count') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">🔧 ' + _esc(_tf('dbg.sec.actions', 'Aksi', 'Actions')) + '</div>' +
        '<div class="settings-list" style="padding:6px 0;">' +
            _btn(_tf('dbg.btn.refresh', 'Refresh info', 'Refresh info'), 'dbg-refresh') +
            _btn(_tf('dbg.btn.check_server', 'Cek SIL server', 'Check SIL server'), 'dbg-check-server') +
            _btn(_tf('dbg.btn.sync', 'Sync SIL sekarang', 'Sync SIL now'), 'dbg-sync-sil', 'primary') +
            _btn(_tf('dbg.btn.push', 'Push lokal → server', 'Push local → server'), 'dbg-push-sil') +
            _btn(_tf('dbg.btn.pull', 'Pull server → lokal', 'Pull server → local'), 'dbg-pull-sil') +
            _btn(_tf('dbg.btn.reset_flag', 'Reset synced flag', 'Reset synced flag'), 'dbg-reset-flag') +
            _btn(_tf('dbg.btn.list_profiles', 'Test List Profiles', 'Test List Profiles'), 'dbg-list-profiles', 'primary') +
            _btn(_tf('dbg.btn.get_profile', 'Test Get My Profile', 'Test Get My Profile'), 'dbg-get-my-profile') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">📋 ' + _esc(_tf('dbg.sec.log', 'Log', 'Log')) + '</div>' +
        '<div data-dbg-log style="font-size:11px;font-family:monospace;line-height:1.5;background:var(--bg-3);padding:8px;border-radius:6px;max-height:180px;overflow-y:auto;color:var(--text-secondary);word-break:break-word;">' +
            (_logs.length ? _logs.map(_esc).join('<br>') : _emptyLog()) +
        '</div>' +
    '</div>';
}

function _updateEl(name, value) {
    var el = document.querySelector('[data-dbg="' + name + '"]');
    if (el) el.textContent = value;
}

function _updateLog() {
    var el = document.querySelector('[data-dbg-log]');
    if (el) el.innerHTML = _logs.length ? _logs.map(_esc).join('<br>') : _emptyLog();
}

function _updateLocalSil() {
    _updateEl('dbg-sil-local', SiliconService.getBalance() + ' SIL');
    _updateEl('dbg-sil-flag', _getFlag());
}

export function bindDebugActions(root) {
    if (!root || root._dbgBound) return;
    root._dbgBound = true;

    root.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-dbg-action]');
        if (!btn) return;
        e.preventDefault();
        if (btn.disabled) return;
        _handleAction(btn.dataset.dbgAction, btn);
    });
}

async function _handleAction(action, btn) {
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '⏳ ' + originalText;

    try {
        if (action === 'dbg-refresh') {
            _log(_tf('dbg.btn.refresh', 'Refresh info', 'Refresh info'));
            _updateLocalSil();

        } else if (action === 'dbg-check-server') {
            _log(_tf('dbg.log.check_server', 'Cek SIL server...', 'Checking SIL server...'));
            var r = await CloudService.getSiliconBalance();
            if (r.ok) { _updateEl('dbg-sil-server', r.balance + ' SIL'); _log(_tf('dbg.log.server_sil', 'Server SIL: {n}', 'Server SIL: {n}', { n: r.balance })); }
            else { _updateEl('dbg-sil-server', _tf('dbg.val.error', 'error', 'error')); _log(_tf('dbg.log.fail', 'Gagal: {msg}', 'Failed: {msg}', { msg: (r.code || r.reason) })); }

        } else if (action === 'dbg-sync-sil') {
            _log(_tf('dbg.log.sync_start', 'Trigger manual sync...', 'Triggering manual sync...'));
            if (typeof CloudSync.syncSilicon === 'function') {
                await CloudSync.syncSilicon();
                _log(_tf('dbg.log.sync_done', 'Sync selesai. Cek server sekarang.', 'Sync finished. Check the server now.'));
            } else { _log(_tf('dbg.log.sync_na', 'CloudSync.syncSilicon tidak tersedia.', 'CloudSync.syncSilicon is not available.')); }

        } else if (action === 'dbg-push-sil') {
            _log(_tf('dbg.log.push_start', 'Push lokal → server...', 'Push local → server...'));
            var local = SiliconService.getBalance();
            var rs = await CloudService.getSiliconBalance();
            if (!rs.ok) { _log(_tf('dbg.log.check_fail', 'Cek server gagal: {msg}', 'Server check failed: {msg}', { msg: (rs.code || rs.reason) })); return; }
            var delta = local - rs.balance;
            if (delta === 0) { _log(_tf('dbg.log.in_sync', 'Sudah sinkron (keduanya {n}).', 'Already in sync (both {n}).', { n: local })); return; }
            if (delta > 0) {
                var ra = await CloudService.addSiliconServer(delta);
                if (ra.ok) _log(_tf('dbg.log.push_plus', 'Push +{d} → server {n}', 'Push +{d} → server {n}', { d: delta, n: ra.balance }));
                else _log(_tf('dbg.log.push_fail', 'Gagal push: {msg}', 'Push failed: {msg}', { msg: (ra.code || ra.reason) }));
            } else {
                var rb = await CloudService.spendSiliconServer(-delta);
                if (rb.ok) _log(_tf('dbg.log.push_minus', 'Push -{d} → server {n}', 'Push -{d} → server {n}', { d: (-delta), n: rb.balance }));
                else _log(_tf('dbg.log.push_fail', 'Gagal push: {msg}', 'Push failed: {msg}', { msg: (rb.code || rb.reason) }));
            }

        } else if (action === 'dbg-pull-sil') {
            _log(_tf('dbg.log.pull_start', 'Pull server → lokal...', 'Pull server → local...'));
            var rp = await CloudService.getSiliconBalance();
            if (rp.ok) {
                SiliconService.applyServerBalance(rp.balance);
                _log(_tf('dbg.log.pull_ok', 'Pull server {n} → lokal', 'Pull server {n} → local', { n: rp.balance }));
            } else { _log(_tf('dbg.log.pull_fail', 'Gagal pull: {msg}', 'Pull failed: {msg}', { msg: (rp.code || rp.reason) })); }

        } else if (action === 'dbg-reset-flag') {
            try { localStorage.removeItem('smartphone-empire:silicon-synced'); _log(_tf('dbg.log.flag_reset', 'Flag silicon-synced di-reset.', 'silicon-synced flag has been reset.')); }
            catch (err) { _log(_tf('dbg.log.reset_fail', 'Reset gagal: {msg}', 'Reset failed: {msg}', { msg: err.message })); }

        } else if (action === 'dbg-list-profiles') {
            _log(_tf('dbg.log.list_start', 'List profiles...', 'List profiles...'));
            var rl = await CloudService.listProfiles();
            if (rl.ok) {
                var rows = rl.rows || [];
                _updateEl('dbg-players-count', _tf('dbg.val.profiles', '{n} profil', '{n} profiles', { n: rows.length }));
                _log(_tf('dbg.log.found', 'Ditemukan {n} profil.', 'Found {n} profiles.', { n: rows.length }));
                rows.slice(0, 5).forEach(function (p) {
                    _log('  · ' + (p.company_name || p.display_name || '?') + ' (' + (p.founded_year || '?') + ')');
                });
                if (rows.length > 5) _log(_tf('dbg.log.more', '  ... dan {n} lagi', '  ... and {n} more', { n: (rows.length - 5) }));
            } else {
                _updateEl('dbg-players-count', _tf('dbg.val.error', 'error', 'error'));
                _log(_tf('dbg.log.list_fail', 'Gagal list: {msg}', 'List failed: {msg}', { msg: (rl.code || rl.reason) }));
            }

        } else if (action === 'dbg-get-my-profile') {
            _log(_tf('dbg.log.get_start', 'Get my profile...', 'Get my profile...'));
            var uid = CloudService.getUserId();
            if (!uid) { _log(_tf('dbg.log.not_logged_in', 'Belum login.', 'Not logged in.')); return; }
            var rg = await CloudService.getProfileById(uid);
            if (rg.ok && rg.profile) {
                _log(_tf('dbg.log.profile_ok', 'My profile OK:', 'My profile OK:'));
                _log(_tf('dbg.log.company', '  Perusahaan: {v}', '  Company: {v}', { v: (rg.profile.company_name || '—') }));
                _log(_tf('dbg.log.founded', '  Didirikan: {y}/{m}', '  Founded: {y}/{m}', { y: (rg.profile.founded_year || '?'), m: (rg.profile.founded_month || '?') }));
            } else { _log(_tf('dbg.log.fail', 'Gagal: {msg}', 'Failed: {msg}', { msg: (rg.code || rg.reason) })); }
        }
    } catch (err) {
        _log(_tf('dbg.log.error', 'ERROR: {msg}', 'ERROR: {msg}', { msg: (err && err.message || err) }));
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        _updateLog();
        _updateLocalSil();
    }
}
