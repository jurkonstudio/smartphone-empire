// FILE: src/services/cloud/CloudSync.js
// v2029.5 — [FIX] Mencegah UI saldo kembali ke nilai awal (rollback) saat pemain membelanjakan SIL.
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { SCHEMA_VERSION } from '../../core/GameState.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../CloudService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { CLOUD } from './supabase.config.js';

const DEVICE_KEY = 'smartphone-empire:device-id';
const LAST_SYNC_KEY = 'smartphone-empire:cloud-last-sync';
const SYNCED_PREFIX = 'smartphone-empire:cloud-synced:';
const AUTOAPPLY_KEY = 'smartphone-empire:cloud-autoapply-at';

let _state = null;
let _inited = false;
let _ready = false;
let _busy = false;
let _checking = false;
let _conflictOpen = false;
let _lastUploadAt = 0;
let _lastUploadMinutes = -1;
let _unsubRealtime = null;
let _unsubWallet = null;
let _walletTimer = null;
let _siliconSyncing = false;

// [FIX] Kunci antrean: Selama _pendingDebits > 0, sinkronisasi DILARANG menimpa saldo lokal.
let _pendingDebits = 0;
let _localEpoch = 0;
let _debitChain = Promise.resolve();
let _pendingSince = 0;
const PENDING_STUCK_MS = 45000;
const SPEND_TIMEOUT_MS = 25000;

let _silPollTimer = null;
const SIL_POLL_MS = 30000;
let _reloadOnVisible = false;
let _laterChosen = false;
let _syncDebounceTimer = null;

function _withTimeout(promise, ms, fallback) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(function () { r(fallback); }, ms); })]);
}

export function getDeviceId() {
    try {
        let id = localStorage.getItem(DEVICE_KEY);
        if (!id) {
            id = 'd_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
            localStorage.setItem(DEVICE_KEY, id);
        }
        return id;
    } catch (e) { return 'd_unknown'; }
}

export function localInfo(state) {
    const d = (state && state.get && state.get()) || {};
    const t = d.time || {};
    return {
        company: d.companyName || '',
        minutes: Number(t.elapsedGameMinutes) || 0,
        year: t.currentYear || null,
        month: t.currentMonth || null
    };
}

export function decideSync(local, cloud) {
    if (!cloud) return { action: 'upload' };
    const cm = Number(cloud.game_minutes) || 0;
    if (!local || local.minutes <= 0) {
        return cm > 0 ? { action: 'cloud', reason: 'fresh' } : { action: 'same' };
    }
    if ((cloud.company_name || '') !== (local.company || '')) return { action: 'prompt', reason: 'different' };
    if (cm > local.minutes) return { action: 'prompt', reason: 'ahead' };
    if (cm === local.minutes) return { action: 'same' };
    return { action: 'upload' };
}

function _buildPayload(slot) {
    const data = _state.serialize();
    data.silicon = 0; 
    const t = data.time || {};
    return {
        slot: slot,
        version: SCHEMA_VERSION,
        savedAt: Date.now(),
        deviceId: getDeviceId(),
        data: data,
        meta: {
            companyName: data.companyName || '',
            gameMinutes: Number(t.elapsedGameMinutes) || 0,
            gameYear: t.currentYear || null,
            gameMonth: t.currentMonth || null
        }
    };
}

function _isConnected() {
    return CloudService.getStatus() === 'connected' && !!CloudService.getUserId();
}

function _syncedKey(slot) {
    return SYNCED_PREFIX + (CloudService.getUserId() || 'anon') + ':' + (slot || CloudService.getSlot());
}

function _hasSynced(slot) {
    try { return localStorage.getItem(_syncedKey(slot)) === '1'; } catch (e) { return false; }
}

function _markSynced(slot) {
    try { localStorage.setItem(_syncedKey(slot), '1'); } catch (e) {}
}

function _clearAllSynced() {
    try {
        const del = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(SYNCED_PREFIX) === 0) del.push(k);
        }
        del.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
}

function _reloadAfterApply(silent, delay) {
    if (silent) {
        try {
            const last = parseInt(sessionStorage.getItem(AUTOAPPLY_KEY), 10) || 0;
            if (Date.now() - last < 15000) return;
            sessionStorage.setItem(AUTOAPPLY_KEY, String(Date.now()));
        } catch (e) {}
        if (document.visibilityState === 'hidden') { _reloadOnVisible = true; return; }
    }
    setTimeout(function () { location.reload(); }, delay);
}

function _uploadOnLeave() {
    if (!_ready || _busy || _checking || _conflictOpen || !_isConnected() || !_state) return;
    if (localInfo(_state).minutes === _lastUploadMinutes) return;
    uploadNow({ auto: true });
}

function _onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        _uploadOnLeave();
        return;
    }
    
    if (document.visibilityState === 'visible') {
        if (_isConnected()) _debouncedSyncSilicon();
    }
}

// ============================================================
// SILICON — STRICT SERVER AUTHORITATIVE
// ============================================================
async function syncSiliconOnLogin() {
    if (!_state || !_isConnected()) return;
    if (_siliconSyncing) return;
    
    // [FIX] Jika ada potongan yang belum selesai, JANGAN tarik saldo dari server. 
    // Tunggu sampai potongan selesai.
    if (_pendingDebits > 0) {
        if (_pendingSince && Date.now() - _pendingSince > PENDING_STUCK_MS) {
            console.warn('[CloudSync] Antrean potongan macet, direset.');
            _pendingDebits = 0; _pendingSince = 0; _debitChain = Promise.resolve();
        } else {
            return; 
        }
    }

    _siliconSyncing = true;
    var _epoch0 = SiliconService.getEpoch();
    var _again = false;
    try {
        var res = await _withTimeout(CloudService.getSiliconBalance(), 8000, { ok: false });
        
        // Jika selama menunggu ada potongan baru, batalkan update.
        if (_pendingDebits > 0) return;
        // [FIX] Saldo berubah (belanja/tukar/kredit) selama permintaan berjalan -> hasil tarikan ini basi
        // (dulu menimpa saldo baru dengan saldo lama = "SIL naik-turun / balik ke angka lama").
        if (SiliconService.getEpoch() !== _epoch0) { _again = true; return; }

        if (res.ok && typeof res.balance === 'number') {
            var serverBal = Math.floor(res.balance);
            var localBal = SiliconService.getBalance();
            
            if (serverBal !== localBal) {
                SiliconService.applyServerBalance(serverBal);
            } else {
                SiliconService.markServerSync(true);
            }
        } else {
            SiliconService.markServerSync(false);
        }
    } catch (e) {
        console.warn('[CloudSync] Gagal sinkronisasi saldo:', e);
    } finally {
        _siliconSyncing = false;
        if (_again) _debouncedSyncSilicon();
    }
}

function _debouncedSyncSilicon() {
    if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
    _syncDebounceTimer = setTimeout(function() {
        syncSiliconOnLogin();
    }, 800); 
}

function _spendWithRetry(amount, reqId, reason) {
    var BUSINESS = /insufficient_silicon|invalid_amount|invalid_request|not_authenticated/i;
    function attempt(n) {
        return CloudService.spendSiliconServer(amount, reqId, reason).then(function (res) {
            if (res && res.ok) return res;
            if (n >= 2 || BUSINESS.test(String((res && res.reason) || ''))) return res;
            return new Promise(function (r) { setTimeout(r, 800 * (n + 1)); }).then(function () { return attempt(n + 1); });
        }, function (err) {
            if (n >= 2) throw err;
            return new Promise(function (r) { setTimeout(r, 800 * (n + 1)); }).then(function () { return attempt(n + 1); });
        });
    }
    return attempt(0);
}

function _onLocalDebit(delta, reason) {
    if (!_state || !CloudService.getUserId()) return;
    var amount = Math.abs(delta);
    if (amount <= 0) return;

    _localEpoch++;
    if (_pendingDebits === 0) _pendingSince = Date.now();
    _pendingDebits++;
    var reqId = 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    _debitChain = _debitChain.then(function () {
        return _withTimeout(_spendWithRetry(amount, reqId, reason), SPEND_TIMEOUT_MS, { ok: false, reason: 'Koneksi timeout' }).then(function (res) {
            if (!res.ok) {
                SiliconService._refund(amount, 'server-rejected');
                ToastService.error('Gagal memotong SIL: ' + (res.reason || 'Server error'));
            } else {
                if (_pendingDebits <= 1 && typeof res.balance === 'number') {
                    SiliconService.applyServerBalance(res.balance);
                }
            }
        }).catch(function () {
            SiliconService._refund(amount, 'network-error');
            ToastService.error('Koneksi gagal, SIL dikembalikan.');
        });
    }).catch(function (e) {
        console.warn('[CloudSync] error potong SIL:', e);
    }).then(function () {
        _pendingDebits = Math.max(0, _pendingDebits - 1);
        if (_pendingDebits === 0) _pendingSince = 0;
        _localEpoch++;
        if (_pendingDebits === 0) _debouncedSyncSilicon();
    });
}

function _onLocalCredit(delta, reason, payload) {
    if (!_state || !CloudService.getUserId()) return;
    if (reason.indexOf('quest:') === 0) {
        var questId = reason.slice(6);
        CloudService.claimQuestSilicon(questId).then(function(res) {
            if (res.ok) _debouncedSyncSilicon();
        });
        return;
    }
    if (reason === 'daily-login') {
        CloudService.claimDailySilicon().then(function(res) {
            if (res.ok) _debouncedSyncSilicon();
        });
        return;
    }
    if (reason.indexOf('topup:') === 0 || reason === 'server-sync' || reason.indexOf('refund:') === 0) {
        _debouncedSyncSilicon();
        return;
    }
}

async function uploadNow(opts) {
    opts = opts || {};
    // [FIX] Selalu kembalikan objek {ok, code} (dulu `undefined` -> "Cannot read properties of undefined (reading 'ok')").
    if (!_state) return { ok: false, code: 'unknown', reason: 'state belum siap' };
    if (!_isConnected()) return { ok: false, code: 'not_signed_in', reason: 'belum terhubung ke cloud' };
    if (_busy) return { ok: false, code: 'busy', reason: 'sinkronisasi sedang berjalan' };
    if (_conflictOpen && !opts.manual) return { ok: false, code: 'conflict', reason: 'konflik save terbuka' };

    _busy = true;
    try {
        const slot = CloudService.getSlot();
        try { SaveService.save(_state, { silent: true }); } catch (e) {}
        const payload = _buildPayload(slot);
        if (JSON.stringify(payload.data).length > CLOUD.maxSaveBytes) {
            return { ok: false, reason: 'Save terlalu besar.', code: 'too_large' };
        }
        const res = await CloudService.uploadSave(payload);
        if (res.ok) {
            _lastUploadAt = Date.now();
            _lastUploadMinutes = payload.meta.gameMinutes;
            if (opts.manual) _ready = true;
            _markSynced(slot);
            try { localStorage.setItem(LAST_SYNC_KEY, String(_lastUploadAt)); } catch (e) {}
            res.slot = slot;
        }
        return res || { ok: false, code: 'unknown' };
    } catch (e) {
        return { ok: false, code: 'unknown', reason: String(e && e.message || e) };
    } finally {
        _busy = false;
    }
}

function _onLocalSaved() {
    if (!_ready || _busy || _checking || _conflictOpen || !_isConnected() || !_state) return;
    const info = localInfo(_state);
    if (info.minutes === _lastUploadMinutes) return;
    if (Date.now() - _lastUploadAt < CLOUD.autoUploadMinMs) return;
    uploadNow({ auto: true });
}

async function checkOnConnect() {
    if (_checking || !_state) return;
    _checking = true;
    try {
        _ready = false;
        const list = await CloudService.listSavesStrict();
        if (!list.ok) return;
        const slot = CloudService.getSlot();
        const cloud = (list.rows || []).find(function (r) { return r.slot === slot; }) || null;
        const local = localInfo(_state);
        const dec = decideSync(local, cloud);

        if (dec.action === 'upload') {
            _ready = true;
            await uploadNow({ auto: true });
            syncSiliconOnLogin();   // [FIX] jalur ini dulu tidak pernah menarik saldo server
        } else if (dec.action === 'cloud' || (_hasSynced(slot) && dec.action === 'prompt')) {
            await _autoResolve(slot, local, cloud, dec.reason);
        } else if (dec.action === 'same') {
            _ready = true;
            _lastUploadMinutes = local.minutes;
            _markSynced(slot);
            syncSiliconOnLogin(); 
        } else {
            _conflictOpen = true;
            bus.emit('cloud:conflict', { slot: slot, local: local, cloud: cloud, reason: dec.reason });
        }
    } finally {
        _checking = false;
    }
}

async function _autoResolve(slot, local, cloud, reason) {
    const cm = Number(cloud.game_minutes) || 0;
    if (reason === 'different' && local.minutes > cm) {
        _ready = true;
        await uploadNow({ manual: true });
        return;
    }
    const r = await applyCloud(slot, { silent: true });
    if (!r.ok) _ready = false;
}

async function applyCloud(slot, opts) {
    opts = opts || {};
    slot = slot || CloudService.getSlot();
    const res = await CloudService.downloadSave(slot);
    _conflictOpen = false;
    if (!res.ok) return res;
    const payload = res.payload || {};
    var keepSil = SiliconService.getBalance(); 
    if (!payload.data || !_state.hydrate(payload.data)) {
        return { ok: false, reason: 'Data cloud tidak valid.', code: 'unknown' };
    }
    _state.data.silicon = keepSil;
    
    await syncSiliconOnLogin(); 

    SaveService.save(_state);
    const info = localInfo(_state);
    _lastUploadMinutes = info.minutes;
    _ready = true;
    _markSynced(slot);
    if (!opts.silent) bus.emit('cloud:applied', { slot: slot });
    _reloadAfterApply(!!opts.silent, opts.silent ? 300 : 800);
    return { ok: true, slot: slot };
}

async function _startRealtime() {
    _stopRealtime();
    _startSilPoll(); 
    _unsubWallet = await CloudService.subscribeWallet(function () {
        clearTimeout(_walletTimer);
        _walletTimer = setTimeout(_debouncedSyncSilicon, 400);
    });
    _unsubRealtime = await CloudService.subscribeSaves(function (row) {
        if (!row || row.device_id === getDeviceId()) return;
        if (row.slot !== CloudService.getSlot()) return;
        const local = localInfo(_state);
        if ((Number(row.game_minutes) || 0) > local.minutes) {
            if (_hasSynced(row.slot)) {
                applyCloud(CloudService.getSlot(), { silent: true });
            }
        }
    });
}

function _startSilPoll() {
    _stopSilPoll();
    _silPollTimer = setInterval(function () {
        if (document.visibilityState !== 'visible' || !_isConnected()) return;
        _debouncedSyncSilicon();
    }, SIL_POLL_MS);
}

function _stopSilPoll() {
    if (_silPollTimer) { clearInterval(_silPollTimer); _silPollTimer = null; }
}

function _stopRealtime() {
    clearTimeout(_walletTimer);
    clearTimeout(_syncDebounceTimer);
    _stopSilPoll();
    if (_unsubWallet) { try { _unsubWallet(); } catch (e) {} _unsubWallet = null; }
    if (_unsubRealtime) { try { _unsubRealtime(); } catch (e) {} _unsubRealtime = null; }
}

export const CloudSync = {
    init: function (state) {
        if (_inited) return;
        _inited = true;
        _state = state;
        bus.on('save:success', _onLocalSaved);
        bus.on('save:cleared', _clearAllSynced);
        bus.on('save:imported', _clearAllSynced);
        
        document.addEventListener('visibilitychange', _onVisibilityChange);
        window.addEventListener('online', function () { _debouncedSyncSilicon(); });
        window.addEventListener('pagehide', _uploadOnLeave);
        
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') {
                _startRealtime();
                checkOnConnect();
            } else if (e && e.status === 'disconnected') {
                // Bersihkan kunci lama yang pernah menyimpan email (tidak dipakai lagi).
                try { localStorage.removeItem('smartphone-empire:admin-email'); } catch(err) {}
                _stopRealtime();
                _ready = false;
                _conflictOpen = false;
                _laterChosen = false;
            }
        });

        bus.on('silicon:changed', function (payload) {
            if (!payload || payload.fromServer) return;
            var delta = payload.delta || 0;
            if (delta < 0) _onLocalDebit(delta, String(payload.reason || ''));
            else if (delta > 0) _onLocalCredit(delta, String(payload.reason || ''), payload);
        });

        if (_isConnected()) {
            _startRealtime();
            checkOnConnect();
        }
    },

    uploadNow: uploadNow,
    applyCloud: applyCloud,
    recheck: checkOnConnect,
    beginConflict: function () { _conflictOpen = true; },
    resolve: async function (choice) {
        if (choice === 'cloud') { _laterChosen = false; return applyCloud(CloudService.getSlot()); }
        if (choice === 'local') {
            _laterChosen = false;
            _conflictOpen = false;
            return uploadNow({ manual: true });
        }
        _conflictOpen = false;
        _ready = false;
        _laterChosen = true;
        return { ok: true, deferred: true };
    },

    getLastSyncAt: function () {
        try { return parseInt(localStorage.getItem(LAST_SYNC_KEY), 10) || 0; } catch (e) { return 0; }
    },
    isPaused: function () { return _isConnected() && !_ready; },

    syncSilicon: syncSiliconOnLogin,

    forcePull: async function () {
        if (!_state) return { ok: false, reason: 'Game belum siap.' };
        if (!_isConnected()) return { ok: false, reason: 'Kamu belum login ke Cloud.' };
        
        _conflictOpen = false;
        _busy = true; 
        
        ToastService.warning('Menarik data dari server...');
        
        try {
            var cloudRes = await CloudService.downloadSave(CloudService.getSlot());
            if (cloudRes.ok && cloudRes.payload && cloudRes.payload.data) {
                var localSil = _state.get().silicon || 0; 
                _state.hydrate(cloudRes.payload.data);
                _state.data.silicon = localSil;
            }

            var silRes = await _withTimeout(CloudService.getSiliconBalance(), 8000, { ok: false });
            if (silRes.ok) {
                SiliconService.applyServerBalance(Math.floor(silRes.balance || 0));
            }

            try { SaveService.save(_state, { silent: true }); } catch (e) {}
            
            _lastUploadMinutes = localInfo(_state).minutes;
            _markSynced(CloudService.getSlot());

            ToastService.success('Data dan Silicon ditarik!');
            setTimeout(function () { location.reload(); }, 1000);
            return { ok: true };
            
        } catch (e) {
            console.error('[ForcePull] Error:', e);
            return { ok: false, reason: e.message };
        } finally {
            _busy = false;
        }
    },

    _reset: function () { _debitChain = Promise.resolve(); _pendingDebits = 0; _pendingSince = 0; _inited = false; _ready = false; _busy = false; _checking = false; _conflictOpen = false; _reloadOnVisible = false; _laterChosen = false; _lastUploadAt = 0; _lastUploadMinutes = -1; _stopRealtime(); }
};
