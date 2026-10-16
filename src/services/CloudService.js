// FILE: src/services/CloudService.js
// v2027.40a — Fasad cloud. + subscribePresence().
import { bus } from '../core/EventBus.js';

const SLOT_KEY = 'smartphone-empire:cloud-slot';

let _adapter = null;
let _status = 'disconnected';
let _userId = null;
let _email = null;
let _slot = _loadSlot();
let _authBound = false;

function _loadSlot() {
    try {
        const n = parseInt(localStorage.getItem(SLOT_KEY), 10);
        if (n >= 1 && n <= 9) return n;
    } catch (e) {}
    return 1;
}

function _setStatus(s) {
    if (_status === s) return;
    _status = s;
    bus.emit('cloud:status-changed', { status: _status });
}

function _setUser(u) {
    _userId = u && u.userId ? u.userId : null;
    _email = u && u.email ? u.email : null;
}

function _fail(err) {
    return { ok: false, reason: (err && err.message) || 'error', code: (err && err.code) || 'unknown' };
}

const NOT_CONFIGURED = { ok: false, reason: 'Cloud belum dikonfigurasi.', code: 'not_configured' };
const NOT_SIGNED_IN  = { ok: false, reason: 'Belum login.', code: 'not_signed_in' };

function _bindAuth() {
    if (_authBound || !_adapter || typeof _adapter.onAuthChange !== 'function') return;
    _authBound = true;
    _adapter.onAuthChange(function (event, user) {
        if (event === 'PASSWORD_RECOVERY') { bus.emit('cloud:password-recovery', {}); }
        if (user && user.userId) {
            const changed = user.userId !== _userId;
            _setUser(user);
            if (changed || _status !== 'connected') _setStatus('connected');
        } else if (event === 'SIGNED_OUT') {
            _setUser(null);
            _setStatus('disconnected');
        }
        bus.emit('cloud:auth-changed', { event: event, userId: _userId });
    });
}

export const CloudService = {
    isAvailable() { return !!_adapter; },
    getStatus() { return _status; },
    getUserId() { return _userId; },
    getEmail() { return _email; },

    getSlot() { return _slot; },
    setSlot(n) {
        n = parseInt(n, 10);
        if (!(n >= 1 && n <= 9)) return false;
        _slot = n;
        try { localStorage.setItem(SLOT_KEY, String(n)); } catch (e) {}
        bus.emit('cloud:slot-changed', { slot: _slot });
        return true;
    },

    registerAdapter(adapter) {
        if (!adapter) return { ok: false, reason: 'Adapter kosong.' };
        _adapter = adapter;
        _authBound = false;
        _setStatus('disconnected');
        return { ok: true };
    },

    unregisterAdapter() {
        _adapter = null;
        _authBound = false;
        _setUser(null);
        _setStatus('disconnected');
    },

    async restoreSession() {
        if (!_adapter) return NOT_CONFIGURED;
        _setStatus('connecting');
        try {
            const u = await _adapter.init();
            _bindAuth();
            if (u && u.userId) {
                _setUser(u);
                _setStatus('connected');
                return { ok: true, userId: _userId, email: _email };
            }
            _setUser(null);
            _setStatus('disconnected');
            return { ok: false, reason: 'Tidak ada sesi.', code: 'no_session' };
        } catch (err) {
            _setStatus('disconnected');
            return _fail(err);
        }
    },

    async signIn(email, password) {
        if (!_adapter) return NOT_CONFIGURED;
        _setStatus('connecting');
        try {
            const res = await _adapter.signIn(email, password);
            _bindAuth();
            _setUser(res);
            _setStatus(_userId ? 'connected' : 'error');
            return { ok: !!_userId, userId: _userId, email: _email };
        } catch (err) {
            _setStatus('error');
            _setStatus('disconnected');
            return _fail(err);
        }
    },

    async signUp(email, password) {
        if (!_adapter) return NOT_CONFIGURED;
        if (typeof _adapter.signUp !== 'function') return { ok: false, reason: 'Pendaftaran tidak didukung.', code: 'unknown' };
        _setStatus('connecting');
        try {
            const res = await _adapter.signUp(email, password);
            _bindAuth();
            if (res.needsConfirm || !res.userId) {
                _setStatus('disconnected');
                return { ok: true, needsConfirm: true };
            }
            _setUser(res);
            _setStatus('connected');
            return { ok: true, needsConfirm: false, userId: _userId, email: _email };
        } catch (err) {
            _setStatus('disconnected');
            return _fail(err);
        }
    },

    async signOut() {
        if (!_adapter) return NOT_CONFIGURED;
        try {
            await _adapter.signOut();
            _setUser(null);
            _setStatus('disconnected');
            return { ok: true };
        } catch (err) {
            return _fail(err);
        }
    },

    async resetPassword(email) {
        if (!_adapter) return NOT_CONFIGURED;
        try { await _adapter.resetPassword(email); return { ok: true }; }
        catch (err) { return _fail(err); }
    },

    async updatePassword(password) {
        if (!_adapter) return NOT_CONFIGURED;
        try { await _adapter.updatePassword(password); return { ok: true }; }
        catch (err) { return _fail(err); }
    },

    async uploadSave(payload) {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        const p = Object.assign({}, payload);
        if (!p.slot) p.slot = _slot;
        bus.emit('cloud:sync-start', { direction: 'up' });
        try {
            const res = await _adapter.uploadSave(_userId, p);
            bus.emit('cloud:sync-success', { direction: 'up', at: Date.now(), slot: p.slot });
            return { ok: true, uploadedAt: res.uploadedAt, slot: p.slot };
        } catch (err) {
            bus.emit('cloud:sync-error', { direction: 'up', message: err.message, code: err.code });
            return _fail(err);
        }
    },

    async downloadSave(slot) {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        bus.emit('cloud:sync-start', { direction: 'down' });
        try {
            const payload = await _adapter.downloadSave(_userId, slot || _slot);
            bus.emit('cloud:sync-success', { direction: 'down', at: Date.now(), slot: slot || _slot });
            return { ok: true, payload: payload };
        } catch (err) {
            bus.emit('cloud:sync-error', { direction: 'down', message: err.message, code: err.code });
            return _fail(err);
        }
    },

    async listSaves() {
        if (!_adapter || !_userId) return [];
        try { return await _adapter.listSaves(_userId); }
        catch (err) { return []; }
    },

    async listSavesStrict() {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        try { return { ok: true, rows: await _adapter.listSaves(_userId) }; }
        catch (err) { return _fail(err); }
    },

    async subscribeSaves(cb) {
        if (!_adapter || !_userId || typeof _adapter.subscribeSaves !== 'function') return function () {};
        try { return await _adapter.subscribeSaves(_userId, cb); }
        catch (err) { return function () {}; }
    },

    async subscribePresence(meta, onSync) {
        if (!_adapter || !_userId) return function () {};
        if (typeof _adapter.subscribePresence !== 'function') return function () {};
        try { return await _adapter.subscribePresence(_userId, meta, onSync); }
        catch (err) { return function () {}; }
    },

    async getProfile() {
        if (!_adapter || !_userId || typeof _adapter.getProfile !== 'function') return null;
        try { return await _adapter.getProfile(_userId); } catch (err) { return null; }
    },

    async updateProfile(fields) {
        if (!_adapter || !_userId) return NOT_SIGNED_IN;
        try { return { ok: true, profile: await _adapter.updateProfile(_userId, fields) }; }
        catch (err) { return _fail(err); }
    },

    async uploadPlayerAsset(name, fileOrBlob, contentType) {
        if (!_adapter || !_userId) return NOT_SIGNED_IN;
        try { return Object.assign({ ok: true }, await _adapter.uploadPlayerAsset(_userId, name, fileOrBlob, contentType)); }
        catch (err) { return _fail(err); }
    },

    async getPlayerAssetUrl(path, expiresSec) {
        if (!_adapter || !_userId) return NOT_SIGNED_IN;
        try { return { ok: true, url: await _adapter.getPlayerAssetUrl(path, expiresSec) }; }
        catch (err) { return _fail(err); }
    },

    async getGameAssetUrl(path) {
        if (!_adapter || typeof _adapter.getGameAssetUrl !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, url: await _adapter.getGameAssetUrl(path) }; }
        catch (err) { return _fail(err); }
    },

    async listProfiles() {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        if (typeof _adapter.listProfiles !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, rows: await _adapter.listProfiles() }; }
        catch (err) { return _fail(err); }
    },

    async getProfileById(id) {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        if (typeof _adapter.getProfileById !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, profile: await _adapter.getProfileById(id) }; }
        catch (err) { return _fail(err); }
    },

    async getSiliconBalance() {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        if (typeof _adapter.rpcGetSilicon !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, balance: await _adapter.rpcGetSilicon() }; }
        catch (err) { return _fail(err); }
    },

    // [HARDENING] addSiliconServer dihapus: kredit SIL hanya boleh dari server.
    async addSiliconServer() { return { ok: false, code: 'FORBIDDEN' }; },

    async claimDailySilicon() {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        if (typeof _adapter.rpcClaimDaily !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, balance: await _adapter.rpcClaimDaily() }; }
        catch (err) { return _fail(err); }
    },

    async spendSiliconServer(amount) {
        if (!_adapter) return NOT_CONFIGURED;
        if (!_userId) return NOT_SIGNED_IN;
        if (typeof _adapter.rpcSpendSilicon !== 'function') return NOT_CONFIGURED;
        try { return { ok: true, balance: await _adapter.rpcSpendSilicon(amount) }; }
        catch (err) { return _fail(err); }
    }
};
