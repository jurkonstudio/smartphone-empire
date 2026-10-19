// FILE: src/services/cloud/CloudSync.js
// v2028.41 — [FIX SIL HILANG] (audit menyeluruh)
//   1. Reward quest SIL kini diklaim ke server (claim_quest_silicon, idempoten) — dulu hanya lokal lalu
//      ditimpa saldo server pada sinkron berikutnya. Quest yang sudah selesai dipulihkan otomatis.
//   2. Hadiah harian diklaim SERVER saat sinkron — dulu klaim server tak pernah terpanggil saat boot
//      (window.__game belum ada) sementara tanggal lokal mengunci klaim ulang.
//   3. Refund (aksi gagal setelah bayar) membatalkan belanja yang masih antre — dulu server tetap
//      terpotong sementara saldo lokal dikembalikan, lalu ditimpa.
//   4. Belanja dikirim dengan kunci idempoten (id antrean): retry/dua tab tidak memotong dua kali.
//   5. Sinkron yang bertabrakan tidak lagi dibuang diam-diam (dijadwalkan ulang).
// v2028.40 — init() langsung sinkron bila sudah login (onboarding).
// v2028.30 — [AUTO-SYNC] Menambahkan sinkronisasi saldo otomatis saat tab game kembali dibuka.
// v2028.31 — [FIX SIL] Saldo tidak "terisi lagi" setelah dipakai: pembelanjaan SIL yang gagal/terlewat
//            dikirim ke server disimpan di antrean persisten (localStorage) dan diulang, dan sinkronisasi
//            menghitung saldo = saldo server - belanja yang masih tertunda (bukan menimpa mentah-mentah).
import { bus } from '../../core/EventBus.js';
import { SaveService } from '../../core/SaveService.js';
import { SCHEMA_VERSION } from '../../core/GameState.js';
import { ToastService } from '../../core/ToastService.js';
import { CloudService } from '../CloudService.js';
import { SiliconService } from '../../systems/SiliconService.js';
import { QUEST_DEFS } from '../../systems/QuestSystem.js';
import { CLOUD } from './supabase.config.js';

const DEVICE_KEY = 'smartphone-empire:device-id';
const LAST_SYNC_KEY = 'smartphone-empire:cloud-last-sync';
const SILICON_SYNC_KEY = 'smartphone-empire:silicon-synced';
const SYNCED_PREFIX = 'smartphone-empire:cloud-synced:';
const AUTOAPPLY_KEY = 'smartphone-empire:cloud-autoapply-at';
const SIL_PENDING_KEY = 'smartphone-empire:silicon-pending';
const QUEST_ACK_PREFIX = 'smartphone-empire:silicon-quest-ack:';

// Nominal reward SIL per quest (harus sama dengan claim_quest_silicon di supabase/silicon-fix.sql).
const QUEST_SIL = (function () {
    const m = {};
    QUEST_DEFS.forEach(function (q) { if (q && q.rewards && q.rewards.silicon > 0) m[q.id] = q.rewards.silicon; });
    return m;
})();

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
let _siliconSyncStart = 0;
let _siliconResync = false;   // ada permintaan sinkron yang bertabrakan -> ulangi setelah selesai
let _questScanUid = null;    // akun yang reward quest-nya sudah dipindai untuk pemulihan
let _dailyDay = '';          // hari UTC terakhir hadiah harian berhasil diklaim ke server
// Batasi tunggu: request yang menggantung tidak boleh mengunci sinkron saldo selamanya.
function _withTimeout(promise, ms, fallback) {
    return Promise.race([promise, new Promise(function (r) { setTimeout(function () { r(fallback); }, ms); })]);
}
let _silVersion = 0;       // naik setiap antrean belanja berubah (deteksi balapan saat fetch saldo)
let _flushPromise = null;  // satu flush pada satu waktu
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

// Pemain menutup / meninggalkan game: unggah save (termasuk uang) sekarang, tanpa menunggu jeda otomatis.
function _uploadOnLeave() {
    if (!_ready || _busy || _conflictOpen || _remotePending || !_isConnected() || !_state) return;
    if (localInfo(_state).minutes === _lastUploadMinutes) return;
    uploadNow({ auto: true });
}

function _onVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        if (_remotePending) _applyRemoteNow();
        else _uploadOnLeave();
        return;
    }
    
    // [AUTO-SYNC ON RESUME]
    if (document.visibilityState === 'visible') {
        if (_isConnected()) {
            console.info('[CloudSync] Tab aktif kembali, sinkronisasi saldo...');
            // Tarik saldo terbaru secara senyap
            syncSiliconOnLogin();
        }
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

// ------------------------------------------------------------
// Antrean SIL yang belum terkonfirmasi server (per akun, persisten).
//   type 'spend' : belanja  -> saldo efektif = server - amount
//   type 'quest' : reward quest (key = id quest) -> saldo efektif = server + amount
// Entri lama tanpa `type` dianggap 'spend'.
// ------------------------------------------------------------
function _pendingAll() {
    try {
        var a = JSON.parse(localStorage.getItem(SIL_PENDING_KEY) || '[]');
        return Array.isArray(a) ? a.filter(function (x) { return x && x.amount > 0 && x.uid; }) : [];
    } catch (e) { return []; }
}

function _writePending(list) {
    try {
        if (!list.length) localStorage.removeItem(SIL_PENDING_KEY);
        else localStorage.setItem(SIL_PENDING_KEY, JSON.stringify(list.slice(-200)));
    } catch (e) {}
}

function _isQuest(x) { return x && x.type === 'quest'; }

function _pendingNet() { // belanja tertunda - reward tertunda (milik akun aktif)
    var uid = CloudService.getUserId();
    return _pendingAll().reduce(function (sum, x) {
        if (x.uid !== uid) return sum;
        return _isQuest(x) ? sum - x.amount : sum + x.amount;
    }, 0);
}

function _pendingCount() {
    var uid = CloudService.getUserId();
    return _pendingAll().filter(function (x) { return x.uid === uid; }).length;
}

function _enqueueSpend(amount) {
    var uid = CloudService.getUserId();
    if (!uid || !(amount > 0)) return;
    var list = _pendingAll();
    list.push({ id: 'sp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), uid: uid, type: 'spend', amount: Math.floor(amount), at: Date.now() });
    _writePending(list);
    _silVersion++;
}

function _enqueueQuest(questId, amount) {
    var uid = CloudService.getUserId();
    if (!uid || !questId || !(amount > 0)) return;
    var list = _pendingAll();
    // Satu klaim per quest per akun (server juga idempoten).
    if (list.some(function (x) { return x.uid === uid && _isQuest(x) && x.key === questId; })) return;
    list.push({ id: 'qc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), uid: uid, type: 'quest', key: questId, amount: Math.floor(amount), at: Date.now() });
    _writePending(list);
    _silVersion++;
}

function _removePending(id) {
    _writePending(_pendingAll().filter(function (x) { return x.id !== id; }));
    _silVersion++;
}

function _markSent(id) { // tandai: sudah/sedang dikirim -> tak boleh dibatalkan/diubah lagi
    _writePending(_pendingAll().map(function (x) { if (x.id === id) x.sent = true; return x; }));
}

// Refund: batalkan belanja yang BELUM dikirim (terbaru dulu). Return sisa yang tak bisa dibatalkan.
function _cancelSpend(amount) {
    var uid = CloudService.getUserId();
    var left = Math.floor(amount);
    var list = _pendingAll();
    for (var i = list.length - 1; i >= 0 && left > 0; i--) {
        var x = list[i];
        if (x.uid !== uid || _isQuest(x) || x.sent) continue;
        var cut = Math.min(x.amount, left);
        x.amount -= cut;
        left -= cut;
    }
    _writePending(list.filter(function (x) { return x.amount > 0; }));
    _silVersion++;
    return left;
}

// Penanda quest yang sudah dikonfirmasi server (per akun).
function _ackKey(uid) { return QUEST_ACK_PREFIX + uid; }
function _ackedQuests(uid) {
    try { var a = JSON.parse(localStorage.getItem(_ackKey(uid)) || '[]'); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
}
function _ackQuest(uid, questId) {
    try {
        var a = _ackedQuests(uid);
        if (a.indexOf(questId) < 0) { a.push(questId); localStorage.setItem(_ackKey(uid), JSON.stringify(a)); }
    } catch (e) {}
}

// Quest yang sudah selesai tapi rewardnya belum pernah dikonfirmasi server (mis. selesai saat offline atau
// sebelum perbaikan ini) -> antrekan klaim. Server idempoten, jadi aman diulang.
function _queueQuestRecovery() {
    var uid = CloudService.getUserId();
    if (!uid || _questScanUid === uid || !_state) return;
    _questScanUid = uid;
    try {
        var d = (_state.get && _state.get()) || _state.data || {};
        var done = (d.quests && Array.isArray(d.quests.completed)) ? d.quests.completed : [];
        var acked = _ackedQuests(uid);
        done.forEach(function (id) {
            var amt = QUEST_SIL[id];
            if (amt && acked.indexOf(id) < 0) _enqueueQuest(id, amt);
        });
    } catch (e) { console.warn('[CloudSync] pemulihan reward quest gagal:', e); }
}

// Hadiah harian: server menentukan tanggal & streak. Idempoten (hari sama = tanpa tambahan).
async function _claimDailyOnce() {
    var day = new Date().toISOString().slice(0, 10);
    if (_dailyDay === day) return;
    var res = await CloudService.claimDailySilicon();
    if (res && res.ok) _dailyDay = day;
}

// Kirim antrean ke server satu per satu. Mengembalikan saldo server terakhir (atau null).
function _flushPending() {
    if (_flushPromise) return _flushPromise;
    var p = (async function () {
        await Promise.resolve(); // pastikan _flushPromise sudah terisi sebelum 'finally' jalan
        var lastBal = null;
        var skip = {};
        try {
            while (_isConnected()) {
                var uid = CloudService.getUserId();
                var item = _pendingAll().find(function (x) { return x.uid === uid && !skip[x.id]; });
                if (!item) break;

                var res;
                if (_isQuest(item)) {
                    res = await CloudService.claimQuestSilicon(item.key);
                } else {
                    _markSent(item.id);
                    res = await CloudService.spendSiliconServer(item.amount, item.id);
                }
                if (res && res.ok) {
                    _removePending(item.id);
                    if (_isQuest(item)) _ackQuest(uid, item.key);
                    lastBal = res.balance;
                    continue;
                }
                var msg = String((res && res.reason) || '') + ' ' + String((res && res.code) || '');

                if (_isQuest(item)) {
                    if (/invalid_quest|invalid_amount/i.test(msg)) {
                        console.warn('[CloudSync] klaim quest ditolak server, dibuang:', item.key);
                        _removePending(item.id);
                    } else {
                        // Server belum siap (SQL belum dijalankan / offline): biarkan antre, jangan blokir belanja.
                        console.warn('[CloudSync] klaim quest tertunda, akan dicoba lagi:', item.key, msg.trim());
                        skip[item.id] = true;
                    }
                    continue;
                }

                if (/insufficient|invalid_amount/i.test(msg)) {
                    // Server menolak permanen (saldo kurang / jumlah tak valid): jangan diulang selamanya.
                    console.warn('[CloudSync] belanja SIL ditolak server, dibuang dari antrean:', msg.trim());
                    _removePending(item.id);
                    continue;
                }
                console.warn('[CloudSync] belanja SIL tertunda, akan dicoba lagi:', msg.trim());
                break;
            }
        } catch (e) {
            console.warn('[CloudSync] flush SIL error:', e);
        } finally {
            _flushPromise = null;
        }
        return lastBal;
    })();
    _flushPromise = p;
    return p;
}

async function syncSiliconOnLogin() {
    if (!_state || !_isConnected()) return;
    if (_siliconSyncing && Date.now() - _siliconSyncStart < 20000) { _siliconResync = true; return; }
    _siliconSyncing = true;
    _siliconSyncStart = Date.now();
    try {
        _queueQuestRecovery();
        try { await _withTimeout(_claimDailyOnce(), 8000, null); } catch (e) {}

        // Maksimal 3 percobaan bila ada perubahan antrean selama proses (hindari balapan).
        var settled = false;
        for (var attempt = 0; attempt < 3; attempt++) {
            await _withTimeout(_flushPending(), 8000, null);
            var v0 = _silVersion;
            var res = await _withTimeout(CloudService.getSiliconBalance(), 10000, { ok: false });
            if (!res.ok) return;
            if (v0 !== _silVersion || _flushPromise) continue;

            var serverBal = Math.floor(res.balance || 0);
            // Saldo efektif = server - belanja tertunda + reward quest tertunda.
            var net = _pendingNet();
            var effective = Math.max(0, serverBal - net);
            var localBal = SiliconService.getBalance();

            if (effective !== localBal) {
                console.info('[CloudSync] Silicon lokal (', localBal, ') -> (', effective, ') | server', serverBal, '| tertunda(net)', net);
                SiliconService.applyServerBalance(effective);
                ToastService.info('Saldo Silicon disinkronkan (' + effective + ' SIL).');
            }
            if (!_hasSyncedSilicon()) _markSiliconSynced();
            settled = true;
            break;
        }
        if (!settled) _siliconResync = true; // terus berubah: ulangi sebentar lagi, jangan dilepas begitu saja
    } catch (e) {
        console.warn('[CloudSync] syncSiliconOnLogin error:', e);
    } finally {
        _siliconSyncing = false;
        if (_siliconResync) {
            _siliconResync = false;
            setTimeout(function () { syncSiliconOnLogin(); }, 300);
        }
    }
}

function _reconcileAfterFlush(bal) {
    if (bal == null || _siliconSyncing || _pendingCount() > 0) return;
    var eff = Math.max(0, Math.floor(bal));
    if (eff !== SiliconService.getBalance()) SiliconService.applyServerBalance(eff);
}

function _pushSiliconDelta(delta) {
    if (!delta || delta >= 0) return;               // belanja saja; kredit ditangani _onLocalCredit
    if (!_state || !CloudService.getUserId()) return; // belum login: saldo lokal murni
    // Selalu masuk antrean persisten (dulu: dibuang bila offline / sedang sync / RPC gagal).
    _enqueueSpend(Math.abs(delta));
    if (!_isConnected()) return;
    _flushPending().then(_reconcileAfterFlush).catch(function () {});
}

// Kredit lokal: hanya server yang boleh benar-benar menambah saldo.
function _onLocalCredit(delta, reason, isRefund) {
    if (!_state || !CloudService.getUserId()) return;
    if (isRefund) {
        // Aksi gagal setelah bayar: batalkan belanja yang masih antre agar server tidak ikut terpotong.
        var left = _cancelSpend(delta);
        if (left > 0) console.warn('[CloudSync] refund', left, 'SIL tak bisa dibatalkan (belanja sudah terkirim ke server).');
        return;
    }
    if (reason.indexOf('quest:') === 0) {
        _enqueueQuest(reason.slice(6), delta);
        if (_isConnected()) _flushPending().then(_reconcileAfterFlush).catch(function () {});
        return;
    }
    if (reason === 'daily-login') {
        if (_isConnected()) syncSiliconOnLogin(); // server yang mengklaim & menentukan saldo
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
            await syncSiliconOnLogin(); // Paksa tarik saldo walau waktu sama
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
    
    await syncSiliconOnLogin(); // Tarik saldo asli

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
    // Saldo SIL berubah di server -> tarik saldo baru lewat jalur sinkron yang sama (aman terhadap belanja tertunda).
    _unsubWallet = await CloudService.subscribeWallet(function () {
        clearTimeout(_walletTimer);
        _walletTimer = setTimeout(syncSiliconOnLogin, 400);
    });
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
    clearTimeout(_walletTimer);
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
        window.addEventListener('online', function () { syncSiliconOnLogin(); });
        window.addEventListener('pagehide', _uploadOnLeave);
        
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
                _questScanUid = null;
                _dailyDay = '';
                _ready = false;
                _conflictOpen = false;
                _remotePending = false;
                _laterChosen = false;
            }
        });

        bus.on('silicon:changed', function (payload) {
            if (!payload || payload.fromServer) return;
            var delta = payload.delta || 0;
            if (delta < 0) _pushSiliconDelta(delta);
            else if (delta > 0) _onLocalCredit(delta, String(payload.reason || ''), payload.refund === true);
        });

        // Sudah masuk sebelum init (login dari layar onboarding): event 'connected' sudah lewat, jalankan sekarang.
        if (_isConnected()) {
            try {
                var em = CloudService.getEmail();
                if (em) localStorage.setItem('smartphone-empire:admin-email', em);
            } catch (err) {}
            _startRealtime();
            checkOnConnect();
            syncSiliconOnLogin();
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
        
        ToastService.warning('Menarik data dari server...');
        
        try {
            var cloudRes = await CloudService.downloadSave(CloudService.getSlot());
            if (cloudRes.ok && cloudRes.payload && cloudRes.payload.data) {
                _state.hydrate(cloudRes.payload.data);
            }

            await _flushPending();
            var silRes = await CloudService.getSiliconBalance();
            if (silRes.ok) {
                SiliconService.applyServerBalance(Math.max(0, Math.floor(silRes.balance || 0) - _pendingNet()));
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

    _reset: function () { _inited = false; _ready = false; _busy = false; _checking = false; _conflictOpen = false; _remotePending = false; _reloadOnVisible = false; _laterChosen = false; _lastUploadAt = 0; _lastUploadMinutes = -1; _questScanUid = null; _dailyDay = ''; _siliconResync = false; _stopRealtime(); }
};
