// FILE: src/core/NotificationPrefs.js
// ============================================================
// NotificationPrefs — preferensi on/off notifikasi (toast / dynamic island
// + riwayat Pusat Notifikasi). Tersimpan di state.settings sehingga ikut save.
//
// DEFAULT: SEMUA MATI. Notifikasi baru muncul setelah pemain menyalakan
// saklar utama di Pengaturan > Notifikasi. Save lama (tanpa field ini)
// otomatis dianggap MATI juga.
//
// Field di state.settings:
//   notifEnabled  : boolean — saklar utama (default false)
//   notifSuccess / notifInfo / notifWarning / notifError / notifNews
//                 : boolean — per jenis (default true; hanya berlaku bila
//                   saklar utama menyala)
// ============================================================
import { state } from './GameState.js';
import { bus } from './EventBus.js';

export var NOTIF_TYPES = ['success', 'info', 'warning', 'error', 'news'];

var TYPE_KEY = {
    success: 'notifSuccess',
    info:    'notifInfo',
    warning: 'notifWarning',
    error:   'notifError',
    news:    'notifNews'
};

function _settings() {
    try {
        var s = state.get();
        return (s && s.settings) ? s.settings : null;
    } catch (e) {
        return null;
    }
}

function _normType(type) {
    return TYPE_KEY[type] ? type : 'info';
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

    /** Apakah jenis tertentu boleh tampil? (saklar utama + saklar jenis) */
    isTypeEnabled: function (type) {
        var s = _settings();
        if (!s || s.notifEnabled !== true) return false;
        return s[TYPE_KEY[_normType(type)]] !== false;
    },

    /** Status saklar jenis saja (untuk tampilan UI, terlepas dari saklar utama). */
    getTypeFlag: function (type) {
        var s = _settings();
        if (!s) return true;
        return s[TYPE_KEY[_normType(type)]] !== false;
    },

    setEnabled: function (on) {
        var s = _settings();
        if (!s) return false;
        s.notifEnabled = !!on;
        _commit(s);
        return true;
    },

    setType: function (type, on) {
        var s = _settings();
        if (!s || !TYPE_KEY[type]) return false;
        s[TYPE_KEY[type]] = !!on;
        _commit(s);
        return true;
    }
};
