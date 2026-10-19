// FILE: src/ui/social/PlayerIdView.js  (BARU)
// Helper ID Pemain (8 digit): muat ID milik sendiri (cache per akun), salin ke clipboard,
// dan label berbahasa ganda. Dipakai Profil Pemain (CompanyProfilePanel) & PlayerProfileModal.
import { CloudService } from '../../services/CloudService.js';
import { ToastService } from '../../core/ToastService.js';
import { t } from '../../core/LanguageService.js';

var _mineId = null;
var _mineFor = null;
var _loading = null;

// t() dengan fallback bila key belum ada di kamus.
export function pidTf(key, fallback, vars) {
    var v = t(key, vars);
    if (v && v !== key) return v;
    return String(fallback).replace(/\{(\w+)\}/g, function (m, k) {
        return (vars && vars[k] !== undefined) ? vars[k] : m;
    });
}

export function getCachedMyPublicId() {
    var uid = CloudService.getUserId();
    return (uid && _mineFor === uid) ? _mineId : null;
}

// Muat ID sendiri; setelah selesai, semua elemen [data-player-public-id] ikut terisi.
export function loadMyPublicId() {
    var uid = CloudService.getUserId();
    if (!uid || CloudService.getStatus() !== 'connected') return Promise.resolve(null);
    if (_mineFor === uid && _mineId) return Promise.resolve(_mineId);
    if (_loading) return _loading;
    _loading = CloudService.getPublicId().then(function (r) {
        _loading = null;
        if (!r || !r.ok || !r.publicId) return null;
        _mineId = String(r.publicId);
        _mineFor = uid;
        var els = document.querySelectorAll('[data-player-public-id]');
        for (var i = 0; i < els.length; i++) els[i].textContent = _mineId;
        return _mineId;
    }).catch(function () { _loading = null; return null; });
    return _loading;
}

export function copyPublicId(id) {
    if (!id) return;
    var text = String(id);
    var msg = pidTf('pp.id.copied', 'ID Pemain disalin: {id}', { id: text });
    function done() { ToastService.info(msg); }
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { ToastService.info('ID: ' + text); });
            return;
        }
    } catch (e) {}
    ToastService.info('ID: ' + text);
}
