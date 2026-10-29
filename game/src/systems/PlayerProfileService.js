// FILE: src/systems/PlayerProfileService.js  (BARU)
// ============================================================
// Profil PEMAIN (terpisah dari profil perusahaan).
//  - nama pemain + foto profil (disimpan di save: state.player)
//  - ganti nama perusahaan: gratis 2x, berikutnya 150 SIL
//  - snapshot statistik untuk leaderboard + sinkron ke Supabase
// ============================================================
import { bus } from '../core/EventBus.js';
import { state } from '../core/GameState.js';
import { SaveService } from '../core/SaveService.js';
import { CloudService } from '../services/CloudService.js';
import { SiliconService } from './SiliconService.js';
import { validateCompanyName } from '../data/name-blocklist.data.js';
import { TIME_CONFIG } from '../config/time.config.js';
import { PlayerProgression, readComponents } from './PlayerProgression.js';

export var NAME_RULES = { free: 2, silCost: 150, min: 2, max: 24 };
var AVATAR = { size: 256, quality: 0.82, maxBytes: 8 * 1024 * 1024 };
var PUSH_MIN_MS = 60000;

var _lastPush = 0;
var _pushing = false;
var _pulledFor = null;
var _warnedDb = false;

function _p() {
    var d = state.data;
    if (!d.player || typeof d.player !== 'object') d.player = {};
    var p = d.player;
    if (typeof p.displayName !== 'string') p.displayName = '';
    if (typeof p.avatar !== 'string') p.avatar = '';
    if (typeof p.avatarPath !== 'string') p.avatarPath = '';
    if (typeof p.nameChanges !== 'number' || p.nameChanges < 0) p.nameChanges = 0;
    if (typeof p.accountCreatedAt !== 'string') p.accountCreatedAt = '';
    return p;
}

// Tanggal akun dibuat menurut DUNIA NYATA (ISO), bukan tanggal in-game.
// Save lama yang belum punya cap waktu diberi cap saat pertama kali dibaca.
export function getAccountCreatedAt() {
    var p = _p();
    if (!p.accountCreatedAt || isNaN(new Date(p.accountCreatedAt).getTime())) {
        p.accountCreatedAt = new Date().toISOString();
        _saveNow();
    }
    return p.accountCreatedAt;
}

export function cleanName(s) {
    return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

function _saveNow() {
    try { SaveService.save(state); } catch (e) {}
}

// ---------- Nama ----------
export function nameErrorKey(reason) {
    switch (reason) {
        case 'empty':      return 'settings.edit_name.error_empty';
        case 'too_short':  return 'settings.edit_name.error_too_short';
        case 'too_long':   return 'settings.edit_name.error_long';
        case 'competitor': return 'settings.edit_name.error_competitor';
        case 'brand':      return 'settings.edit_name.error_brand';
        case 'public_figure': return 'settings.edit_name.error_public_figure';
        default:           return 'settings.edit_name.error_profanity';
    }
}

export function validateName(raw) {
    var name = cleanName(raw);
    if (!name) return { ok: false, reason: 'empty' };
    if (name.length < NAME_RULES.min) return { ok: false, reason: 'too_short' };
    if (name.length > NAME_RULES.max) return { ok: false, reason: 'too_long' };
    var v = validateCompanyName(name);
    if (!v.ok) return v;
    return { ok: true, name: name };
}

export function getNameChangeInfo() {
    var used = _p().nameChanges;
    var freeLeft = Math.max(0, NAME_RULES.free - used);
    return {
        used: used,
        freeLeft: freeLeft,
        cost: freeLeft > 0 ? 0 : NAME_RULES.silCost,
        balance: SiliconService.getBalance()
    };
}

export function changeCompanyName(raw) {
    var v = validateName(raw);
    if (!v.ok) return v;
    var name = v.name;
    if (name === cleanName(state.data.companyName)) return { ok: false, reason: 'same' };

    var info = getNameChangeInfo();
    if (info.cost > 0) {
        if (!SiliconService.canAfford(info.cost)) {
            return { ok: false, reason: 'insufficient', need: info.cost - info.balance };
        }
        var sp = SiliconService.spend(info.cost, 'rename-company');
        if (!sp.ok) return { ok: false, reason: 'insufficient', need: info.cost };
    }

    var p = _p();
    p.nameChanges += 1;
    state.patch({ companyName: name, player: p });
    _saveNow();
    bus.emit('player:changed', { kind: 'company-name' });
    pushToCloud({ force: true });
    return { ok: true, cost: info.cost, name: name };
}

export function getDisplayName() {
    return _p().displayName || '';
}

export function setDisplayName(raw) {
    var name = cleanName(raw);
    var p = _p();
    if (name) {
        var v = validateName(name);
        if (!v.ok) return v;
        name = v.name;
    }
    p.displayName = name;
    state.patch({ player: p });
    _saveNow();
    bus.emit('player:changed', { kind: 'display-name' });
    return { ok: true, name: name };
}

// ---------- Foto ----------
function _dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(',');
    var mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    var bin = atob(parts[1] || '');
    var len = bin.length;
    var buf = new Uint8Array(len);
    for (var i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: mime });
}

// Baca file gambar -> kotak 256x256 JPEG. Reject dengan { code: 'type'|'big'|'read' }.
export function processImageFile(file) {
    return new Promise(function (resolve, reject) {
        if (!file || !/^image\//.test(file.type || '')) { reject({ code: 'type' }); return; }
        if (file.size > AVATAR.maxBytes) { reject({ code: 'big' }); return; }
        var reader = new FileReader();
        reader.onerror = function () { reject({ code: 'read' }); };
        reader.onload = function () {
            var img = new Image();
            img.onerror = function () { reject({ code: 'read' }); };
            img.onload = function () {
                try {
                    var w = img.naturalWidth, h = img.naturalHeight;
                    var side = Math.min(w, h);
                    if (!side) { reject({ code: 'read' }); return; }
                    var c = document.createElement('canvas');
                    c.width = AVATAR.size; c.height = AVATAR.size;
                    var ctx = c.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, AVATAR.size, AVATAR.size);
                    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, AVATAR.size, AVATAR.size);
                    var dataUrl = c.toDataURL('image/jpeg', AVATAR.quality);
                    resolve({ dataUrl: dataUrl, blob: _dataUrlToBlob(dataUrl) });
                } catch (e) { reject({ code: 'read' }); }
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

export function getAvatar() { return _p().avatar || ''; }

// Simpan foto lokal (dataUrl) lalu unggah ke cloud bila login. dataUrl '' = hapus.
export async function commitAvatar(dataUrl, blob) {
    var p = _p();
    p.avatar = dataUrl || '';
    if (!dataUrl) p.avatarPath = '';
    state.patch({ player: p });
    _saveNow();
    bus.emit('player:changed', { kind: 'avatar' });
    if (!CloudService.isAvailable() || !CloudService.getUserId()) return { ok: true, cloud: false };

    try {
        if (!dataUrl) {
            await CloudService.updateProfile({ avatar_path: null });
            return { ok: true, cloud: true };
        }
        var up = await CloudService.uploadPlayerAsset('avatar.jpg', blob || _dataUrlToBlob(dataUrl), 'image/jpeg');
        if (up && up.ok && up.path) {
            p.avatarPath = up.path;
            await CloudService.updateProfile({ avatar_path: up.path });
            _saveNow();
            return { ok: true, cloud: true };
        }
        return { ok: true, cloud: false };
    } catch (e) {
        return { ok: true, cloud: false };
    }
}

// ---------- Statistik / leaderboard ----------
export function getStatsSnapshot() {
    var d = state.data;
    var cat = (d.products && d.products.catalog) || [];
    var revenue = 0, sold = 0, active = 0;
    for (var i = 0; i < cat.length; i++) {
        revenue += cat[i].totalRevenue || 0;
        sold += cat[i].totalSold || 0;
        if (cat[i].status === 'selling') active++;
    }
    var m = d.market || {};
    return {
        revenue: Math.max(0, Math.round(revenue)),
        sold: Math.max(0, Math.round(sold)),
        products: active,
        reputation: Math.max(0, Math.min(100, Number(m.reputation) || 0)),
        share: Math.max(0, Math.min(100, (Number(m.share) || 0) * 100)),
        cash: Math.round(d.cash || 0),
        foundedYear: TIME_CONFIG.startYear,
        foundedMonth: TIME_CONFIG.startMonth
    };
}

export async function pushToCloud(opts) {
    opts = opts || {};
    if (!CloudService.isAvailable() || !CloudService.getUserId()) return { ok: false, code: 'not_signed_in' };
    if (_pushing) return { ok: false, code: 'busy' };
    var now = Date.now();
    if (!opts.force && now - _lastPush < PUSH_MIN_MS) return { ok: false, code: 'throttled' };

    _pushing = true;
    try {
        var s = getStatsSnapshot();
        var p = _p();
        var comp = readComponents();   // komponen mentah; server yang menghitung kredibilitas, level & hadiah
        var res = await CloudService.syncPlayerProfile({
            p_player_name: p.displayName || null,
            p_company_name: cleanName(state.data.companyName),
            p_founded_year: s.foundedYear,
            p_founded_month: s.foundedMonth,
            p_revenue: s.revenue,
            p_sold: s.sold,
            p_reputation: s.reputation,
            p_share: s.share,
            p_cash: s.cash,
            p_products: s.products,
            p_name_changes: p.nameChanges,
            p_credit_score: comp.creditScore,
            p_missed: comp.missed,
            p_sentiment: comp.sentiment,
            p_game_minutes: comp.gameMinutes
        });
        if (res && res.ok) _lastPush = Date.now();
        else if (res && res.code === 'db_setup' && !_warnedDb) {
            _warnedDb = true;
            console.warn('[PlayerProfile] Database belum lengkap: jalankan SQL 03, 11, 12, 14, 15 di Supabase (supabase/BACA-DULU.md).');
        }
        return res;
    } catch (e) {
        return { ok: false, code: 'unknown' };
    } finally {
        _pushing = false;
    }
}

// Tarik profil cloud sekali per login: isi nama/foto lokal yang masih kosong.
async function _pullFromCloud() {
    var uid = CloudService.getUserId();
    if (!uid || _pulledFor === uid) return;
    _pulledFor = uid;
    try {
        var row = await CloudService.getProfile();
        if (!row) return;
        var p = _p();
        var changed = false;

        // Tanggal pembuatan akun cloud (dunia nyata) lebih akurat -> pakai bila lebih awal.
        if (row.created_at) {
            var cTs = new Date(row.created_at).getTime();
            var lTs = p.accountCreatedAt ? new Date(p.accountCreatedAt).getTime() : NaN;
            if (!isNaN(cTs) && (isNaN(lTs) || cTs < lTs)) { p.accountCreatedAt = new Date(cTs).toISOString(); changed = true; }
        }

        if (!p.displayName && row.player_name) { p.displayName = cleanName(row.player_name).slice(0, NAME_RULES.max); changed = true; }

        if (!p.avatar && row.avatar_path) {
            var u = await CloudService.getPlayerAssetUrl(row.avatar_path, 300);
            if (u && u.ok && u.url) {
                var blob = await (await fetch(u.url)).blob();
                var dataUrl = await new Promise(function (resolve, reject) {
                    var fr = new FileReader();
                    fr.onload = function () { resolve(fr.result); };
                    fr.onerror = reject;
                    fr.readAsDataURL(blob);
                });
                p.avatar = dataUrl; p.avatarPath = row.avatar_path; changed = true;
            }
        } else if (p.avatar && !row.avatar_path) {
            await commitAvatar(p.avatar, null);   // migrasi foto lokal ke cloud
        }

        if (changed) {
            state.patch({ player: p });
            bus.emit('player:changed', { kind: 'cloud-pull' });
        }
        pushToCloud({ force: true });
    } catch (e) {
        _pulledFor = null;
    }
}

export const PlayerProfileService = {
    init: function () {
        if (PlayerProfileService._inited) return;
        PlayerProfileService._inited = true;
        bus.on('cloud:auth-changed', function (e) {
            if (e && e.userId) _pullFromCloud(); else _pulledFor = null;
        });
        bus.on('cloud:status-changed', function (e) {
            if (e && e.status === 'connected') _pullFromCloud();
        });
        bus.on('cloud:sync-success', function (e) {
            if (e && e.direction === 'up') pushToCloud();
        });
        if (CloudService.getUserId()) _pullFromCloud();
    },
    getPlayer: _p,
    getDisplayName: getDisplayName,
    getAccountCreatedAt: getAccountCreatedAt,
    getAvatar: getAvatar,
    getNameChangeInfo: getNameChangeInfo,
    getStatsSnapshot: getStatsSnapshot,
    getProgression: function () { return PlayerProgression.compute(); },
    pushToCloud: pushToCloud
};

PlayerProfileService.init();
