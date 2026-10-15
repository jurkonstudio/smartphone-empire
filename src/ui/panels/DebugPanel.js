// FILE: src/ui/panels/DebugPanel.js
// v1.1 — + tombol Test List Profiles (Sesi 1 Player List).
import { CloudService } from '../../services/CloudService.js';
import { CloudSync } from '../../services/cloud/CloudSync.js';
import { SiliconService } from '../../systems/SiliconService.js';

var _logs = [];

function _log(msg) {
    var t = new Date().toLocaleTimeString('id-ID');
    _logs.unshift('[' + t + '] ' + msg);
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
    catch (e) { return 'unknown'; }
}

export function renderDebugSection() {
    var cloud = CloudService.getStatus();
    var email = CloudService.getEmail() || '—';
    var uid = CloudService.getUserId() || '—';
    var slot = CloudService.getSlot ? CloudService.getSlot() : '—';
    var local = SiliconService.getBalance();

    return '' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">☁️ Cloud Status</div>' +
        '<div class="settings-list">' +
            _row('Status', cloud, 'dbg-cloud-status') +
            _row('Email', email) +
            _row('User ID', uid && uid.length > 12 ? uid.slice(0, 12) + '…' : uid) +
            _row('Slot', slot) +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">💎 Silicon</div>' +
        '<div class="settings-list">' +
            _row('Lokal', local + ' SIL', 'dbg-sil-local') +
            _row('Server', '? (klik cek)', 'dbg-sil-server') +
            _row('Synced flag', _getFlag(), 'dbg-sil-flag') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">👥 Players</div>' +
        '<div class="settings-list">' +
            _row('Total profil publik', '? (klik test)', 'dbg-players-count') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">🔧 Actions</div>' +
        '<div class="settings-list" style="padding:6px 0;">' +
            _btn('Refresh info', 'dbg-refresh') +
            _btn('Cek SIL server', 'dbg-check-server') +
            _btn('Sync SIL sekarang', 'dbg-sync-sil', 'primary') +
            _btn('Push lokal → server', 'dbg-push-sil') +
            _btn('Pull server → lokal', 'dbg-pull-sil') +
            _btn('Reset synced flag', 'dbg-reset-flag') +
            _btn('Test List Profiles', 'dbg-list-profiles', 'primary') +
            _btn('Test Get My Profile', 'dbg-get-my-profile') +
        '</div>' +
    '</div>' +
    '<div class="settings-section">' +
        '<div class="settings-section-head">📋 Log</div>' +
        '<div data-dbg-log style="font-size:11px;font-family:monospace;line-height:1.5;background:var(--bg-3);padding:8px;border-radius:6px;max-height:180px;overflow-y:auto;color:var(--text-secondary);word-break:break-word;">' +
            (_logs.length ? _logs.map(_esc).join('<br>') : '<i>Belum ada log.</i>') +
        '</div>' +
    '</div>';
}

function _updateEl(name, value) {
    var el = document.querySelector('[data-dbg="' + name + '"]');
    if (el) el.textContent = value;
}

function _updateLog() {
    var el = document.querySelector('[data-dbg-log]');
    if (el) el.innerHTML = _logs.length ? _logs.map(_esc).join('<br>') : '<i>Belum ada log.</i>';
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
            _log('Refresh info');
            _updateLocalSil();

        } else if (action === 'dbg-check-server') {
            _log('Cek SIL server...');
            var r = await CloudService.getSiliconBalance();
            if (r.ok) { _updateEl('dbg-sil-server', r.balance + ' SIL'); _log('Server SIL: ' + r.balance); }
            else { _updateEl('dbg-sil-server', 'error'); _log('Gagal: ' + (r.code || r.reason)); }

        } else if (action === 'dbg-sync-sil') {
            _log('Trigger manual sync...');
            if (typeof CloudSync.syncSilicon === 'function') {
                await CloudSync.syncSilicon();
                _log('Sync selesai. Cek server sekarang.');
            } else { _log('CloudSync.syncSilicon tidak tersedia.'); }

        } else if (action === 'dbg-push-sil') {
            _log('Push lokal → server...');
            var local = SiliconService.getBalance();
            var rs = await CloudService.getSiliconBalance();
            if (!rs.ok) { _log('Cek server gagal: ' + (rs.code || rs.reason)); return; }
            var delta = local - rs.balance;
            if (delta === 0) { _log('Sudah sinkron (keduanya ' + local + ').'); return; }
            if (delta > 0) {
                var ra = await CloudService.addSiliconServer(delta);
                if (ra.ok) _log('Push +' + delta + ' → server ' + ra.balance);
                else _log('Gagal push: ' + (ra.code || ra.reason));
            } else {
                var rb = await CloudService.spendSiliconServer(-delta);
                if (rb.ok) _log('Push -' + (-delta) + ' → server ' + rb.balance);
                else _log('Gagal push: ' + (rb.code || rb.reason));
            }

        } else if (action === 'dbg-pull-sil') {
            _log('Pull server → lokal...');
            var rp = await CloudService.getSiliconBalance();
            if (rp.ok) {
                SiliconService.applyServerBalance(rp.balance);
                _log('Pull server ' + rp.balance + ' → lokal');
            } else { _log('Gagal pull: ' + (rp.code || rp.reason)); }

        } else if (action === 'dbg-reset-flag') {
            try { localStorage.removeItem('smartphone-empire:silicon-synced'); _log('Flag silicon-synced di-reset.'); }
            catch (err) { _log('Reset gagal: ' + err.message); }

        } else if (action === 'dbg-list-profiles') {
            _log('List profiles...');
            var rl = await CloudService.listProfiles();
            if (rl.ok) {
                var rows = rl.rows || [];
                _updateEl('dbg-players-count', rows.length + ' profil');
                _log('Ditemukan ' + rows.length + ' profil.');
                rows.slice(0, 5).forEach(function (p) {
                    _log('  · ' + (p.company_name || p.display_name || '?') + ' (' + (p.founded_year || '?') + ')');
                });
                if (rows.length > 5) _log('  ... dan ' + (rows.length - 5) + ' lagi');
            } else {
                _updateEl('dbg-players-count', 'error');
                _log('Gagal list: ' + (rl.code || rl.reason));
            }

        } else if (action === 'dbg-get-my-profile') {
            _log('Get my profile...');
            var uid = CloudService.getUserId();
            if (!uid) { _log('Belum login.'); return; }
            var rg = await CloudService.getProfileById(uid);
            if (rg.ok && rg.profile) {
                _log('My profile OK:');
                _log('  Company: ' + (rg.profile.company_name || '—'));
                _log('  Founded: ' + (rg.profile.founded_year || '?') + '/' + (rg.profile.founded_month || '?'));
            } else { _log('Gagal: ' + (rg.code || rg.reason)); }
        }
    } catch (err) {
        _log('ERROR: ' + (err && err.message || err));
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        _updateLog();
        _updateLocalSil();
    }
}
