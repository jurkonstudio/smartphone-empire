// FILE: src/core/SaveService.js
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { SCHEMA_VERSION } from './GameState.js';

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
            localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
            bus.emit('save:success', { savedAt: payload.savedAt });
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
            return payload.data;
        } catch (err) {
            console.error('[SaveService] Gagal memuat:', err);
            return null;
        }
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
            return payload.data;
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
            if (getState().data.gameOver) return;
            self.save(getState());
        }, AUTOSAVE_INTERVAL_MS);
    },

    stopAutoSave: function () {
        if (this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }
};
