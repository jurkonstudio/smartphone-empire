// FILE: src/services/cloud/CloudSync.js
// v2027.38a — Orkestrasi sinkronisasi save lokal <-> cloud.
// + Sinkronisasi Silicon (pull-once-then-server).
//
// Prinsip keselamatan (agar progres tidak hilang):
//  1. Tidak ada unggahan otomatis sebelum pengecekan saat-terhubung selesai (_ready).
//  2. Kalau cloud lebih maju / beda perusahaan / perangkat masih kosong -> pemain DIMINTA memilih.
//  3. Kalau daftar save di cloud gagal dibaca (offline, dll) -> TIDAK mengunggah apa pun.
//  4. Autosync dibatasi jeda minimal dan hanya jika progres game berubah.
//
// Prinsip Silicon:
//  - Login pertama kali (setelah fitur ini rilis): rekonsiliasi (lokal vs server).
//  - Setelah ditandai synced: server authoritative (pull saat login).
//  - Setiap perubahan lokal (add/spend): push delta ke server (fire-and-forget).
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { SCHEMA_VERSION } from '../../core/GameState.js';
import { CloudService } from '../CloudService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { CLOUD } from './supabase.config.js';

const DEVICE_KEY = 'smartphone-empire:device-id';
const LAST_SYNC_KEY = 'smartphone-empire:cloud-last-sync';
const SILICON_SYNC_KEY = 'smartphone-empire:silicon-synced';

let _state = null;
let _inited = false;
let _ready = false;            // boleh autosync?
let _busy = false;             // sedang mengunggah
let _checking = false;
let _conflictOpen = false;
let _lastUploadAt = 0;
let _lastUploadMinutes = -1;
let _unsubRealtime = null;
let _siliconSyncing = false;   // sedang pull dari server (skip push)

// ---------- util murni (diekspor agar mudah dites) ----------
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

// ============================================================
// SILICON — sinkronisasi dengan server
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
        if (!res.ok) {
            console.info('[CloudSync] SIL pull gagal:', res.code);
            return;
        }
        var serverBal = Math.floor(res.balance || 0);
        var localBal = SiliconService.getBalance();
        var hasSynced = _hasSyncedSilicon();

        if (!hasSynced) {
            // Pertama kali: rekonsiliasi (yang lebih besar menang)
            if (localBal > serverBal) {
                var delta = localBal - serverBal;
                console.info('[CloudSync] SIL rekonsiliasi: push +' + delta + ' ke server.');
                var pushRes = await CloudService.addSiliconServer(delta);
                if (!pushRes.ok) {
                    console.warn('[CloudSync] SIL push gagal:', pushRes.code);
                    return;   // jangan tandai synced kalau gagal
                }
                _markSiliconSynced();
            } else if (serverBal > localBal) {
                console.info('[CloudSync] SIL rekonsiliasi: pull ' + serverBal + ' dari server (lokal ' + localBal + ').');
                SiliconService.applyServerBalance(serverBal);
                _markSiliconSynced();
            } else {
                // Sama — cukup tandai
                _markSiliconSynced();
            }
            return;
        }

        // Sudah sync: server authoritative
        if (serverBal !== localBal) {
            console.info('[CloudSync] SIL pull: server ' + serverBal + ', lokal ' + localBal + '. Terapkan server.');
            SiliconService.applyServerBalance(serverBal);
        }
    } catch (e) {
        console.warn('[CloudSync] syncSiliconOnLogin error:', e);
    } finally {
        _siliconSyncing = false;
    }
}

function _pushSiliconDelta(delta) {
    if (!_state || !_isConnected()) return;
    if (!delta || delta === 0) return;
    if (_siliconSyncing) return;   // sedang pull, jangan push balik

    // Fire-and-forget: tidak block UI. Kalau gagal, akan direkonsiliasi
    // saat login berikutnya (server authoritative).
    try {
        if (delta > 0) {
            CloudService.addSiliconServer(delta).then(function (res) {
                if (!res.ok) console.warn('[CloudSync] push +SIL gagal:', res.code);
            }).catch(function () {});
        } else {
            CloudService.spendSiliconServer(Math.abs(delta)).then(function (res) {
                if (!res.ok) console.warn('[CloudSync] push -SIL gagal:', res.code);
            }).catch(function () {});
        }
    } catch (e) {
        console.warn('[CloudSync] _pushSiliconDelta error:', e);
    }
}

// ---------- unggah ----------
async function uploadNow(opts) {
    opts = opts || {};
    if (!_state) return { ok: false, reason: 'not_inited', code: 'unknown' };
    if (!_isConnected()) return { ok: false, reason: 'Belum login.', code: 'not_signed_in' };
    if (_busy) return { ok: false, reason: 'busy', code: 'busy' };
    if (_conflictOpen && !opts.manual) return { ok: false, reason: 'conflict', code: 'conflict' };

    _busy = true;
    try {
        const slot = CloudService.getSlot();
        const payload = _buildPayload(slot);
        if (JSON.stringify(payload.data).length > CLOUD.maxSaveBytes) {
            return { ok: false, reason: 'Save terlalu besar.', code: 'too_large' };
        }
        const res = await CloudService.uploadSave(payload);
        if (res.ok) {
            _lastUploadAt = Date.now();
            _lastUploadMinutes = payload.meta.gameMinutes;
            if (opts.manual) _ready = true;
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
    if (!_ready || _busy || _conflictOpen || !_isConnected() || !_state) return;
    const info = localInfo(_state);
    if (info.minutes === _lastUploadMinutes) return;
    if (Date.now() - _lastUploadAt < CLOUD.autoUploadMinMs) return;
    uploadNow({ auto: true });
}

// ---------- cek saat terhubung / ganti slot ----------
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
        } else {
            _conflictOpen = true;
            bus.emit('cloud:conflict', { slot: slot, local: local, cloud: cloud, reason: dec.reason });
        }
    } finally {
        _checking = false;
    }
}

// ---------- terapkan save cloud ke game ----------
async function applyCloud(slot) {
    slot = slot || CloudService.getSlot();
    const res = await CloudService.downloadSave(slot);
    _conflictOpen = false;
    if (!res.ok) return res;
    const payload = res.payload || {};
    if (!payload.data || !_state.hydrate(payload.data)) {
        return { ok: false, reason: 'Data cloud tidak valid.', code: 'unknown' };
    }
    SaveService.save(_state);
    const info = localInfo(_state);
    _lastUploadMinutes = info.minutes;
    _ready = true;
    bus.emit('cloud:applied', { slot: slot });
    setTimeout(function () { location.reload(); }, 800);
    return { ok: true, slot: slot };
}

// ---------- realtime ----------
async function _startRealtime() {
    _stopRealtime();
    _unsubRealtime = await CloudService.subscribeSaves(function (row) {
        if (!row || row.device_id === getDeviceId()) return;
        if (row.slot !== CloudService.getSlot()) return;
        const local = localInfo(_state);
        if ((Number(row.game_minutes) || 0) > local.minutes) {
            bus.emit('cloud:remote-newer', { slot: row.slot, local: local, cloud: row });
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
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') {
                _startRealtime();
                checkOnConnect();
                syncSiliconOnLogin();          // ← tambah: sinkron SIL saat login
            } else if (e && e.status === 'disconnected') {
                _stopRealtime();
                _ready = false;
                _conflictOpen = false;
            }
        });

        // Push delta SIL ke server setiap perubahan lokal
        bus.on('silicon:changed', function (payload) {
            if (!payload || payload.fromServer) return;   // skip kalau dari server
            _pushSiliconDelta(payload.delta || 0);
        });
    },

    uploadNow: uploadNow,
    applyCloud: applyCloud,
    recheck: checkOnConnect,

    beginConflict: function () { _conflictOpen = true; },

    resolve: async function (choice) {
        if (choice === 'cloud') return applyCloud(CloudService.getSlot());
        if (choice === 'local') {
            _conflictOpen = false;
            return uploadNow({ manual: true });
        }
        _conflictOpen = false;
        _ready = false;
        return { ok: true, deferred: true };
    },

    getLastSyncAt: function () {
        try { return parseInt(localStorage.getItem(LAST_SYNC_KEY), 10) || 0; } catch (e) { return 0; }
    },
    isPaused: function () { return _isConnected() && !_ready; },

    // Manual trigger (opsional dipakai dari UI)
    syncSilicon: syncSiliconOnLogin,

    _reset: function () { _inited = false; _ready = false; _busy = false; _checking = false; _conflictOpen = false; _lastUploadAt = 0; _lastUploadMinutes = -1; _stopRealtime(); }
};
