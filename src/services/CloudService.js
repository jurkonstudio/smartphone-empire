// FILE: src/services/CloudService.js
// Stub cloud sync — untuk integrasi Supabase nanti.

import { bus } from '../core/EventBus.js';

let _adapter = null;
let _status = 'disconnected';
let _userId = null;

function _setStatus(status) {
    if (_status === status) return;
    _status = status;
    bus.emit('cloud:status-changed', { status });
}

function _errorMessage(error) {
    return error?.message || 'Terjadi kesalahan cloud.';
}

export const CloudService = {
    isAvailable() {
        return !!_adapter;
    },

    getStatus() {
        return _status;
    },

    getUserId() {
        return _userId;
    },

    registerAdapter(adapter) {
        if (!adapter) {
            return { ok: false, reason: 'Adapter kosong.' };
        }

        _adapter = adapter;
        _userId = null;
        _setStatus('disconnected');

        return { ok: true };
    },

    unregisterAdapter() {
        _adapter = null;
        _userId = null;
        _setStatus('disconnected');
    },

    async initialize() {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        try {
            const result = await _adapter.getCurrentUser();
            _userId = result?.userId || null;
            _setStatus(_userId ? 'connected' : 'disconnected');

            return { ok: true, userId: _userId };
        } catch (error) {
            _userId = null;
            _setStatus('error');

            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async signUp(email, password) {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        _setStatus('connecting');

        try {
            const result = await _adapter.signUp(email, password);
            _userId = result?.userId || null;
            _setStatus(_userId ? 'connected' : 'disconnected');

            return {
                ok: true,
                userId: _userId,
                needsConfirmation: !!result?.needsConfirmation
            };
        } catch (error) {
            _setStatus('error');
            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async signIn(email, password) {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        _setStatus('connecting');

        try {
            const result = await _adapter.signIn(email, password);
            _userId = result?.userId || null;

            if (!_userId) {
                throw new Error('ID akun tidak ditemukan.');
            }

            _setStatus('connected');

            return { ok: true, userId: _userId };
        } catch (error) {
            _userId = null;
            _setStatus('error');

            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async signOut() {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        try {
            await _adapter.signOut();
            _userId = null;
            _setStatus('disconnected');

            return { ok: true };
        } catch (error) {
            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async uploadSave(payload) {
        if (!_adapter) {
            return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        }

        if (!_userId) {
            return { ok: false, reason: 'Belum login.' };
        }

        bus.emit('cloud:sync-start', { direction: 'up' });

        try {
            const result = await _adapter.uploadSave(_userId, payload);

            bus.emit('cloud:sync-success', {
                direction: 'up',
                at: Date.now()
            });

            return {
                ok: true,
                uploadedAt: result?.uploadedAt || new Date().toISOString()
            };
        } catch (error) {
            bus.emit('cloud:sync-error', {
                direction: 'up',
                message: _errorMessage(error)
            });

            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async downloadSave() {
        if (!_adapter) {
            return { ok: false, reason: 'Cloud belum dikonfigurasi.' };
        }

        if (!_userId) {
            return { ok: false, reason: 'Belum login.' };
        }

        bus.emit('cloud:sync-start', { direction: 'down' });

        try {
            const result = await _adapter.downloadSave(_userId);

            bus.emit('cloud:sync-success', {
                direction: 'down',
                at: Date.now()
            });

            return {
                ok: true,
                payload: result?.payload ?? null,
                updatedAt: result?.updatedAt ?? null
            };
        } catch (error) {
            bus.emit('cloud:sync-error', {
                direction: 'down',
                message: _errorMessage(error)
            });

            return { ok: false, reason: _errorMessage(error) };
        }
    },

    async listSaves() {
        if (!_adapter || !_userId) return [];

        try {
            return await _adapter.listSaves(_userId);
        } catch (error) {
            console.error('[CloudService] Gagal mengambil daftar save:', error);
            return [];
        }
    }
};

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
