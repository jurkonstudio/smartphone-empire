// FILE: src/services/cloud/CloudSync.js
// v2027.37a — Orkestrasi sinkronisasi save lokal <-> cloud.
//
// Prinsip keselamatan (agar progres tidak hilang):
//  1. Tidak ada unggahan otomatis sebelum pengecekan saat-terhubung selesai (_ready).
//  2. Kalau cloud lebih maju / beda perusahaan / perangkat masih kosong -> pemain DIMINTA memilih.
//  3. Kalau daftar save di cloud gagal dibaca (offline, dll) -> TIDAK mengunggah apa pun.
//  4. Autosync dibatasi jeda minimal dan hanya jika progres game berubah.
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { SCHEMA_VERSION } from '../../core/GameState.js';
import { CloudService } from '../CloudService.js';
import { CLOUD } from './supabase.config.js';

const DEVICE_KEY = 'smartphone-empire:device-id';
const LAST_SYNC_KEY = 'smartphone-empire:cloud-last-sync';

let _state = null;
let _inited = false;
let _ready = false;            // boleh autosync?
let _busy = false;             // sedang mengunggah
let _checking = false;
let _conflictOpen = false;
let _lastUploadAt = 0;
let _lastUploadMinutes = -1;
let _unsubRealtime = null;

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

// Keputusan sinkronisasi saat terhubung / ganti slot.
//  upload -> aman unggah (cloud kosong atau lokal lebih maju)
//  same   -> identik, tidak perlu apa-apa
//  prompt -> tanya pemain (reason: fresh | different | ahead)
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

// Dipicu setelah save lokal berhasil (autosave 30 dtk / simpan manual).
function _onLocalSaved() {
    if (!_ready || _busy || _conflictOpen || !_isConnected() || !_state) return;
    const info = localInfo(_state);
    if (info.minutes === _lastUploadMinutes) return;                       // tidak ada progres baru
    if (Date.now() - _lastUploadAt < CLOUD.autoUploadMinMs) return;        // jeda minimal
    uploadNow({ auto: true });
}

// ---------- cek saat terhubung / ganti slot ----------
async function checkOnConnect() {
    if (_checking || !_state) return;
    _checking = true;
    try {
        _ready = false;
        const list = await CloudService.listSavesStrict();
        if (!list.ok) return;                                 // gagal baca -> JANGAN unggah apa pun
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
    setTimeout(function () { location.reload(); }, 800);     // sama seperti alur Import: mulai bersih
    return { ok: true, slot: slot };
}

// ---------- realtime ----------
async function _startRealtime() {
    _stopRealtime();
    _unsubRealtime = await CloudService.subscribeSaves(function (row) {
        if (!row || row.device_id === getDeviceId()) return;          // gema dari perangkat ini
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
            if (e && e.status === 'connected') { _startRealtime(); checkOnConnect(); }
            else if (e && e.status === 'disconnected') { _stopRealtime(); _ready = false; _conflictOpen = false; }
        });
    },

    uploadNow: uploadNow,
    applyCloud: applyCloud,
    recheck: checkOnConnect,

    beginConflict: function () { _conflictOpen = true; },

    // choice: 'cloud' | 'local' | 'later'
    resolve: async function (choice) {
        if (choice === 'cloud') return applyCloud(CloudService.getSlot());
        if (choice === 'local') {
            _conflictOpen = false;
            return uploadNow({ manual: true });
        }
        _conflictOpen = false;      // "nanti": autosync tetap dijeda (_ready=false) sampai pemain memilih
        _ready = false;
        return { ok: true, deferred: true };
    },

    getLastSyncAt: function () {
        try { return parseInt(localStorage.getItem(LAST_SYNC_KEY), 10) || 0; } catch (e) { return 0; }
    },
    isPaused: function () { return _isConnected() && !_ready; },

    // hanya untuk pengujian
    _reset: function () { _inited = false; _ready = false; _busy = false; _checking = false; _conflictOpen = false; _lastUploadAt = 0; _lastUploadMinutes = -1; _stopRealtime(); }
};
