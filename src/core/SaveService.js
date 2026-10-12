// FILE: src/core/SaveService.js
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';

const SAVE_KEY = APP_CONFIG.saveKey;
const SAVE_VERSION = 1;
const AUTOSAVE_INTERVAL_MS = 30000;

export const SaveService = {
    _timerId: null,

    // Simpan state ke localStorage. Return true/false.
    save(state) {
        try {
            const payload = {
                version: SAVE_VERSION,
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

    // Muat data dari localStorage. Return objek data | null.
    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;
            const payload = JSON.parse(raw);
            if (!payload || typeof payload !== 'object') return null;
            if (payload.version !== SAVE_VERSION) {
                console.warn('[SaveService] Versi save tidak cocok, diabaikan.');
                return null;
            }
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
            console.error('[SaveService] Gagal menghapus save:', err);
            return false;
        }
    },

    hasSave() {
        try { return !!localStorage.getItem(SAVE_KEY); }
        catch { return false; }
    },

    // Autosave tiap 30 detik. Skip jika tab tidak terlihat.
    startAutoSave(getState) {
        if (this._timerId !== null) return;
        this._timerId = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
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
