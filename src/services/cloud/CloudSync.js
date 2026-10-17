// FILE: src/services/cloud/CloudSync.js
// v2028.19 — [SYNC] Memaksa Server (Supabase) menjadi sumber kebenaran mutlak untuk Silicon.
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { SCHEMA_VERSION } from '../../core/GameState.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../CloudService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { CLOUD } from './supabase.config.js';

const DEVICE_KEY = 'smartphone-empire:device-id';
const LAST_SYNC_KEY = 'smartphone-empire:cloud-last-sync';
const SILICON_SYNC_KEY = 'smartphone-empire:silicon-synced';
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
let _siliconSyncing = false;
let _remotePending = false;
let _reloadOnVisible = false;
let _laterChosen = false;
let _lastRetryAt = 0;

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
        return cm > 0 ? { action: 'prompt', reason: 'fresh' } : { action: 'same' };
    }
    if ((cloud.company_name || '') !== (local.company || '')) return { action: 'prompt', reason: 'different' };
    if (cm > local.minutes) return { action: 'prompt', reason: 'ahead' };
    if (cm === local.minutes) return { action: 'same' };
    return { action: 'upload' };
}

function _buildPayload(slot) {
    const data = _state.serialize();
    // [TRANSPARANSI] Hapus Silicon dari payload save game agar tidak bentrok dengan tabel profiles
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

function _applyRemoteNow() {
    if (!_remotePending || !_state || !_isConnected()) return;
    _remotePending = false;
    applyCloud(CloudService.getSlot(), { silent: true }).then(function (r) {
        if (!r || !r.ok) _remotePending = true;
    }).catch(function () { _remotePending = true; });
}

function _onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        if (_remotePending) _applyRemoteNow();
        return;
    }
    if (_reloadOnVisible) { _reloadOnVisible = false; location.reload(); return; }
    if (_isConnected() && !_ready && !_checking && !_conflictOpen && !_laterChosen && _hasSynced()) {
        if (Date.now() - _lastRetryAt < 30000) return;
        _lastRetryAt = Date.now();
        checkOnConnect();
    }
}

// ============================================================
// SILICON — SERVER IS THE BOSS
// ============================================================
function _hasSyncedSilicon() {
    try { return localStorage.getItem(SILICON_SYNC_KEY) === '1'; } catch (e) { return false; }
}

function _markSiliconSynced() {
    try { localStorage.setItem(SILICON_SYNC_KEY, '1'); } catch (e) {}
}

async function syncSiliconOnLogin() {
    if (!_state || !_isConnected()) return;
    if (_siliconSyncing) return;
    _siliconSyncing = true;
    try {
        var res = await CloudService.getSiliconBalance();
        if (!res.ok) return;

        var serverBal = Math.floor(res.balance || 0);
        var localBal = SiliconService.getBalance();
        var hasSynced = _hasSyncedSilicon();

        // [TRANSPARANSI MUTLAK]
        // Jika server berbeda dengan lokal, SELALU ikuti server.
        if (serverBal !== localBal) {
            console.info('[CloudSync] Menimpa Silicon lokal (', localBal, ') dengan Server (', serverBal, ')');
            SiliconService.applyServerBalance(serverBal);
            ToastService.info('Saldo Silicon disinkronkan dari Cloud (' + serverBal + ' SIL).');
        }
        
        if (!hasSynced) _markSiliconSynced();

    } catch (e) {
        console.warn('[CloudSync] syncSiliconOnLogin error:', e);
    } finally {
        _siliconSyncing = false;
    }
}

function _pushSiliconDelta(delta) {
    if (!_state || !_isConnected()) return;
    if (!delta || delta === 0) return;
    if (_siliconSyncing) return;

    try {
        if (delta > 0) {
            return; // Hanya server yang boleh menambah saldo
        } else {
            CloudService.spendSiliconServer(Math.abs(delta)).then(function (res) {
                if (!res.ok) console.warn('[CloudSync] push -SIL gagal:', res.code);
            }).catch(function () {});
        }
    } catch (e) {
        console.warn('[CloudSync] _pushSiliconDelta error:', e);
    }
}

async function uploadNow(opts) {
    opts = opts || {};
    if (!_state) return { ok: false, reason: 'not_inited', code: 'unknown' };
    if (!_isConnected()) return { ok: false, reason: 'Belum login.', code: 'not_signed_in' };
    if (_busy) return { ok: false, reason: 'busy', code: 'busy' };
    if ((_conflictOpen || _remotePending) && !opts.manual) return { ok: false, reason: 'conflict', code: 'conflict' };

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
        } else if (opts.auto) {
            bus.emit('cloud:autosync-failed', { code: res.code });
        }
        return res;
    } finally {
        _busy = false;
    }
}

function _onLocalSaved() {
    if (!_ready || _busy || _conflictOpen || _remotePending || !_isConnected() || !_state) return;
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
        } else if (dec.action === 'same') {
            _ready = true;
            _lastUploadMinutes = local.minutes;
            _markSynced(slot);
            // [TAMBAHAN] Paksa tarik Silicon dari server walau waktu sama
            await syncSiliconOnLogin();
        } else if (_hasSynced(slot)) {
            await _autoResolve(slot, local, cloud, dec.reason);
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
    if (!payload.data || !_state.hydrate(payload.data)) {
        return { ok: false, reason: 'Data cloud tidak valid.', code: 'unknown' };
    }
    
    // [TAMBAHAN] Setelah memuat Save File, paksa tarik Silicon asli dari tabel profil
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
    _unsubRealtime = await CloudService.subscribeSaves(function (row) {
        if (!row || row.device_id === getDeviceId()) return;
        if (row.slot !== CloudService.getSlot()) return;
        const local = localInfo(_state);
        if ((Number(row.game_minutes) || 0) > local.minutes) {
            if (_hasSynced(row.slot)) {
                _remotePending = true;
                if (document.visibilityState === 'hidden') _applyRemoteNow();
            } else {
                bus.emit('cloud:remote-newer', { slot: row.slot, local: local, cloud: row });
            }
        }
    });
}

function _stopRealtime() {
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
        
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') {
                try {
                    var email = CloudService.getEmail();
                    if (email) localStorage.setItem('smartphone-empire:admin-email', email);
                } catch (err) {}

                _startRealtime();
                checkOnConnect();
                syncSiliconOnLogin();
            } else if (e && e.status === 'disconnected') {
                try { localStorage.removeItem('smartphone-empire:admin-email'); } catch(err) {}
                _stopRealtime();
                _ready = false;
                _conflictOpen = false;
                _remotePending = false;
                _laterChosen = false;
            }
        });

        bus.on('silicon:changed', function (payload) {
            if (!payload || payload.fromServer) return;
            _pushSiliconDelta(payload.delta || 0);
        });
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

    resetSiliconSync: function () {
        try { localStorage.removeItem(SILICON_SYNC_KEY); } catch (e) {}
        console.info('[CloudSync] silicon-synced flag di-reset.');
    },

    forcePull: async function () {
        if (!_state) return { ok: false, reason: 'Game belum siap.' };
        if (!_isConnected()) return { ok: false, reason: 'Kamu belum login ke Cloud.' };
        
        _conflictOpen = false;
        _remotePending = false;
        _busy = true; 
        
        ToastService.warning('Menarik data dari server, harap tunggu...');
        
        try {
            var cloudRes = await CloudService.downloadSave(CloudService.getSlot());
            if (cloudRes.ok && cloudRes.payload && cloudRes.payload.data) {
                _state.hydrate(cloudRes.payload.data);
            }

            var silRes = await CloudService.getSiliconBalance();
            if (silRes.ok) {
                SiliconService.applyServerBalance(silRes.balance);
            }

            try { SaveService.save(_state, { silent: true }); } catch (e) {}
            
            _lastUploadMinutes = localInfo(_state).minutes;
            _markSynced(CloudService.getSlot());

            ToastService.success('Data dan Silicon ditarik dari server!');
            setTimeout(function () { location.reload(); }, 1000);
            return { ok: true };
            
        } catch (e) {
            console.error('[ForcePull] Error:', e);
            return { ok: false, reason: e.message };
        } finally {
            _busy = false;
        }
    },

    _reset: function () { _inited = false; _ready = false; _busy = false; _checking = false; _conflictOpen = false; _remotePending = false; _reloadOnVisible = false; _laterChosen = false; _lastUploadAt = 0; _lastUploadMinutes = -1; _stopRealtime(); }
};
