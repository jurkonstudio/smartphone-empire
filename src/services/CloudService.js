
 // FILE: src/services/CloudService.js
 // Cloud sync service with adapter-based authentication.

import { bus } from '../core/EventBus.js';

let _adapter = null;
let _status = 'disconnected';
let _userId = null;

function _setStatus(s) {
    if (_status === s) return;

    _status = s;
    bus.emit('cloud:status-changed', {
        status: _status
    });
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
            return {
                ok: false,
                reason: 'Adapter kosong.'
            };
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

    // Restore the existing Supabase session.
    async initialize() {
        if (!_adapter) {
            return {
                ok: false,
                userId: null,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        try {
            if (typeof _adapter.getCurrentUser !== 'function') {
                throw new Error(
                    'Adapter belum menyediakan getCurrentUser().'
                );
            }

            const user = await _adapter.getCurrentUser();

            _userId = user?.userId ?? null;

            _setStatus(
                _userId ? 'connected' : 'disconnected'
            );

            return {
                ok: true,
                userId: _userId
            };
        } catch (err) {
            _userId = null;
            _setStatus('error');

            return {
                ok: false,
                userId: null,
                reason: err?.message ?? 'Gagal memulihkan sesi.'
            };
        }
    },

    // Register a new account.
    async signUp(email, password) {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        if (typeof _adapter.signUp !== 'function') {
            return {
                ok: false,
                reason: 'Adapter belum menyediakan signUp().'
            };
        }

        _setStatus('connecting');

        try {
            const res = await _adapter.signUp(email, password);

            _userId = res?.userId ?? null;

            _setStatus(
                _userId ? 'connected' : 'disconnected'
            );

            return {
                ok: true,
                userId: _userId,
                needsEmailConfirmation:
                    !!res?.needsEmailConfirmation
            };
        } catch (err) {
            _setStatus('error');

            return {
                ok: false,
                reason: err?.message ?? 'Pendaftaran gagal.'
            };
        }
    },

    // Sign in with email and password.
    async signIn(email, password) {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        _setStatus('connecting');

        try {
            const res = await _adapter.signIn(email, password);

            _userId = res?.userId ?? null;

            _setStatus(
                _userId ? 'connected' : 'error'
            );

            return {
                ok: !!_userId,
                userId: _userId,
                reason: _userId
                    ? undefined
                    : 'Login tidak menghasilkan user ID.'
            };
        } catch (err) {
            _setStatus('error');

            return {
                ok: false,
                reason: err?.message ?? 'Login gagal.'
            };
        }
    },

    // Sign out the current account.
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
        } catch (err) {
            return {
                ok: false,
                reason: err?.message ?? 'Logout gagal.'
            };
        }
    },

    // Upload the current game save.
    async uploadSave(payload) {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        if (!_userId) {
            return {
                ok: false,
                reason: 'Belum login.'
            };
        }

        bus.emit('cloud:sync-start', {
            direction: 'up'
        });

        try {
            const res = await _adapter.uploadSave(
                _userId,
                payload
            );

            bus.emit('cloud:sync-success', {
                direction: 'up',
                at: Date.now()
            });

            return {
                ok: true,
                uploadedAt: res?.uploadedAt ?? null
            };
        } catch (err) {
            bus.emit('cloud:sync-error', {
                direction: 'up',
                message: err?.message ?? 'Upload gagal.'
            });

            return {
                ok: false,
                reason: err?.message ?? 'Upload gagal.'
            };
        }
    },

    // Download the current game save.
    async downloadSave() {
        if (!_adapter) {
            return {
                ok: false,
                reason: 'Cloud belum dikonfigurasi.'
            };
        }

        if (!_userId) {
            return {
                ok: false,
                reason: 'Belum login.'
            };
        }

        bus.emit('cloud:sync-start', {
            direction: 'down'
        });

        try {
            const payload = await _adapter.downloadSave(_userId);

            bus.emit('cloud:sync-success', {
                direction: 'down',
                at: Date.now()
            });

            return {
                ok: true,
                payload
            };
        } catch (err) {
            bus.emit('cloud:sync-error', {
                direction: 'down',
                message: err?.message ?? 'Download gagal.'
            });

            return {
                ok: false,
                reason: err?.message ?? 'Download gagal.'
            };
        }
    },

    // List available cloud saves.
    async listSaves() {
        if (!_adapter || !_userId) {
            return [];
        }

        try {
            return await _adapter.listSaves(_userId);
        } catch (err) {
            console.error('[CloudService] listSaves:', err);
            return [];
        }
    }
};
