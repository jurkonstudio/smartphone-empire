// FILE: src/core/SaveService.js
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { SCHEMA_VERSION } from './GameState.js';

const SAVE_KEY = APP_CONFIG.saveKey;
const AUTOSAVE_INTERVAL_MS = 30000;

export const SaveService = {
    _timerId: null,

    save(state) {
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

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const payload = JSON.parse(raw);
            if (!payload || typeof payload !== 'object') return null;
            // Terima versi apa pun — migrateV1toV2 di GameState.hydrate akan tangani
            return payload.data;
        } catch (err) {
            console.error('[SaveService] Gagal memuat:', err);
            return null;
        }
    },

    clear() {
        try {
            localStorage.removeItem(SAVE_KEY);
            bus.emit('save:cleared');
            return true;
        } catch (err) {
            console.error('[SaveService] Gagal menghapus:', err);
            return false;
        }
    },

    hasSave() {
        try { return !!localStorage.getItem(SAVE_KEY); }
        catch { return false; }
    },

    // Export sebagai string JSON (untuk backup manual di HP)
    export(state) {
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

    // Import dari string JSON. Return objek data | null.
    parseImport(text) {
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

    startAutoSave(getState) {
        if (this._timerId !== null) return;
        this._timerId = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            if (getState().data.gameOver) return; // jangan autosave saat game over
            this.save(getState());
        }, AUTOSAVE_INTERVAL_MS);
    },

    stopAutoSave() {
        if (this._timerId !== null) {
            clearInterval(this._timerId);
            this._timerId = null;
        }
    }
};
