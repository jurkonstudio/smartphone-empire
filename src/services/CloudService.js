// FILE: src/services/CloudService.js
// Stub cloud sync — untuk integrasi Supabase nanti.
import { bus } from '../core/EventBus.js';

let _adapter = null;
let _status = 'disconnected';
let _userId = null;

function _setStatus(s) {
    if (_status === s) return;
    _status = s;
    bus.emit('cloud:status-changed', { status: _status });
}

export const CloudService = {
    isAvailable() { return !!_adapter; },
    getStatus() { return _status; },
    getUserId() { return _userId; },

    registerAdapter(adapter) {
        if (!adapter) return { ok: false, reason: 'Adapter kosong.' };
        _adapter = adapter;
        _setStatus('disconnected');
        return { ok: true };
    },

    unregisterAdapter() {
        _adapter = null;
        _userId = null;
        _setStatus('disconnected');
    },

    async signIn(email, password) {
        if (!_adapter) return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        _setStatus('connecting');
        try {
            const res = await _adapter.signIn(email, password);
            _userId = res && res.userId ? res.userId : null;
            _setStatus(_userId ? 'connected' : 'error');
            return { ok: !!_userId, userId: _userId };
        } catch (err) {
            _setStatus('error');
            return { ok: false, reason: err.message };
        }
    },

    async signOut() {
        if (!_adapter) return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        try {
            await _adapter.signOut();
            _userId = null;
            _setStatus('disconnected');
            return { ok: true };
        } catch (err) {
            return { ok: false, reason: err.message };
        }
    },

    async uploadSave(payload) {
        if (!_adapter) return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        if (!_userId)  return { ok: false, reason: 'Belum login.' };
        bus.emit('cloud:sync-start', { direction: 'up' });
        try {
            const res = await _adapter.uploadSave(_userId, payload);
            bus.emit('cloud:sync-success', { direction: 'up', at: Date.now() });
            return { ok: true, uploadedAt: res.uploadedAt };
        } catch (err) {
            bus.emit('cloud:sync-error', { direction: 'up', message: err.message });
            return { ok: false, reason: err.message };
        }
    },

    async downloadSave() {
        if (!_adapter) return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        if (!_userId)  return { ok: false, reason: 'Belum login.' };
        bus.emit('cloud:sync-start', { direction: 'down' });
        try {
            const payload = await _adapter.downloadSave(_userId);
            bus.emit('cloud:sync-success', { direction: 'down', at: Date.now() });
            return { ok: true, payload };
        } catch (err) {
            bus.emit('cloud:sync-error', { direction: 'down', message: err.message });
            return { ok: false, reason: err.message };
        }
    },

    async listSaves() {
        if (!_adapter || !_userId) return [];
        try { return await _adapter.listSaves(_userId); }
        catch (err) { return []; }
    }
};
