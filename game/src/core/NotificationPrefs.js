// FILE: src/core/NotificationPrefs.js  (REPLACE — v2 disederhanakan: 3 saklar)
// ============================================================
// NotificationPrefs — preferensi on/off notifikasi (toast / dynamic island
// + riwayat Pusat Notifikasi). Tersimpan di state.settings sehingga ikut save.
//
// DEFAULT: SEMUA MATI. Notifikasi baru muncul setelah pemain menyalakan
// saklar utama di Pengaturan > Notifikasi. Save lama (tanpa field ini)
// otomatis dianggap MATI juga.
//
// Field di state.settings (hanya 3 yang dipakai UI):
//   notifEnabled       : boolean — saklar utama (default false)
//   notifImportantOnly : boolean — true: hanya peringatan & gagal (default false)
//   notifNews          : boolean — berita industri (default true)
// Field lama notifSuccess/notifInfo/notifWarning/notifError tidak lagi dipakai.
// ============================================================
import { state } from './GameState.js';
import { bus } from './EventBus.js';

export var NOTIF_TYPES = ['success', 'info', 'warning', 'error', 'news'];

var IMPORTANT = { warning: true, error: true };

function _settings() {
    try {
        var s = state.get();
        return (s && s.settings) ? s.settings : null;
    } catch (e) {
        return null;
    }
}

function _normType(type) {
    return NOTIF_TYPES.indexOf(type) !== -1 ? type : 'info';
}

function _commit(s) {
    try { state.patch({ settings: s }); } catch (e) { /* abaikan */ }
    try { bus.emit('settings:changed', s); } catch (e2) { /* abaikan */ }
}

export var NotificationPrefs = {
    /** Saklar utama. Hanya true bila pemain menyalakannya secara eksplisit. */
    isEnabled: function () {
        var s = _settings();
        return !!(s && s.notifEnabled === true);
    },

    isImportantOnly: function () {
        var s = _settings();
        return !!(s && s.notifImportantOnly === true);
    },

    isNewsEnabled: function () {
        var s = _settings();
        return !s || s.notifNews !== false;
    },

    /** Apakah jenis tertentu boleh tampil? */
    isTypeEnabled: function (type) {
        var s = _settings();
        if (!s || s.notifEnabled !== true) return false;
        var t = _normType(type);
        if (t === 'news') return s.notifNews !== false;
        if (s.notifImportantOnly === true) return !!IMPORTANT[t];
        return true;
    },

    setEnabled: function (on) {
        var s = _settings();
        if (!s) return false;
        s.notifEnabled = !!on;
        _commit(s);
        return true;
    },

    setImportantOnly: function (on) {
        var s = _settings();
        if (!s) return false;
        s.notifImportantOnly = !!on;
        _commit(s);
        return true;
    },

    setNews: function (on) {
        var s = _settings();
        if (!s) return false;
        s.notifNews = !!on;
        _commit(s);
        return true;
    }
};
