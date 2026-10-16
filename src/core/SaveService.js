// FILE: src/core/SaveService.js
// v2027.38a — emit save:success satu kali dengan payload lengkap (untuk CloudSync).
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { SCHEMA_VERSION } from './GameState.js';
import { Integrity } from './Integrity.js';

const SAVE_KEY = APP_CONFIG.saveKey;
const AUTOSAVE_INTERVAL_MS = 30000;

export const SaveService = {
    _timerId: null,

    save: function (state) {
        try {
            const payload = {
                version: SCHEMA_VERSION,
                savedAt: Date.now(),
                data: state.serialize()
            };
            payload.sig = Integrity.sign(payload.data, payload.savedAt);
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            // Satu event saja — CloudSync mendengarkan ini untuk autosync.
            bus.emit('save:success', { savedAt: payload.savedAt, at: payload.savedAt });
            return true;
        } catch (err) {
            console.error('[SaveService] Gagal menyimpan:', err);
            bus.emit('save:error', { error: err });
            return false;
        }
    },

    load: function () {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const payload = JSON.parse(raw);
            if (!payload || typeof payload !== 'object') return null;
            return this._check(payload);
        } catch (err) {
            console.error('[SaveService] Gagal memuat:', err);
            return null;
        }
    },

    // Verifikasi tanda tangan. Save lama (tanpa sig) diterima sekali lalu
    // ditandatangani saat save berikutnya. Sig tidak cocok → SIL di-nol-kan.
    _check: function (payload) {
        var d = payload.data;
        if (!d) return null;
        if (!payload.sig) return d;
        if (!Integrity.verify(d, payload.savedAt, payload.sig)) {
            console.warn('[SaveService] Save terdeteksi diubah manual.');
            return Integrity.penalize(d);
        }
        return d;
    },

    // Ambil payload penuh (dengan metadata) — dipakai untuk cek timestamp.
    loadFull: function () {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (err) {
            return null;
        }
    },

    getSavedAt: function () {
        const p = this.loadFull();
        return p && p.savedAt ? p.savedAt : 0;
    },

    clear: function () {
        try {
            localStorage.removeItem(SAVE_KEY);
            bus.emit('save:cleared');
            return true;
        } catch (err) {
            console.error('[SaveService] Gagal menghapus:', err);
            return false;
        }
    },

    hasSave: function () {
        try { return !!localStorage.getItem(SAVE_KEY); }
        catch (e) { return false; }
    },

    export: function (state) {
        try {
            const payload = {
                version: SCHEMA_VERSION,
                savedAt: Date.now(),
                data: state.serialize()
            };
            payload.sig = Integrity.sign(payload.data, payload.savedAt);
            return JSON.stringify(payload);
        } catch (err) {
            console.error('[SaveService] Export gagal:', err);
            return null;
        }
    },

    parseImport: function (text) {
        try {
            const payload = JSON.parse(text);
            if (!payload || typeof payload !== 'object') return null;
            if (!payload.data) return null;
            return this._check(payload);
        } catch (err) {
            console.error('[SaveService] Import gagal:', err);
            return null;
        }
    },

    startAutoSave: function (getState) {
        const self = this;
        if (this._timerId !== null) return;
        this._timerId = setInterval(function () {
            if (document.visibilityState !== 'visible') return;
            var s = getState();
            if (!s || !s.data || s.data.gameOver) return;
            self.save(s);
        }, AUTOSAVE_INTERVAL_MS);
    },

    stopAutoSave: function () {
        if (this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }
};
