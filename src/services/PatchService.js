// FILE: src/services/PatchService.js
// Pengecek patch / perbaikan bug. Membaca ./patches.json dari server yang sama
// (tanpa cache) lalu membandingkan dengan versi game yang sedang berjalan.
//
// Format patches.json:
// { "latest": "0.2.1",
//   "releases": [ { "version": "0.2.1", "date": "2026-10-18",
//       "items": [ { "type": "fix" | "feature" | "balance",
//                    "text": { "id": "...", "en": "..." } } ] } ] }
//
// Aman: gagal jaringan / file tidak ada / JSON rusak => diam saja (tidak ada error
// ke pemain). Tidak menyentuh state game. Tidak memakai API key apa pun.
import { APP_CONFIG } from '../config/app.config.js';

var FIRST_CHECK_MS = 4000;          // cek pertama setelah game siap
var INTERVAL_MS = 20 * 60 * 1000;   // cek berkala
var FOCUS_MIN_GAP_MS = 5 * 60 * 1000; // saat tab aktif lagi, minimal jeda
var TIMEOUT_MS = 8000;
var MAX_RELEASES = 20;
var MAX_ITEMS = 12;
var MAX_TEXT = 160;

// Bandingkan "0.2.1" vs "0.10.0" secara numerik. Kembalikan -1 / 0 / 1.
export function cmpVersion(a, b) {
    var pa = String(a || '0').split('.'), pb = String(b || '0').split('.');
    var n = Math.max(pa.length, pb.length);
    for (var i = 0; i < n; i++) {
        var x = parseInt(pa[i], 10) || 0, y = parseInt(pb[i], 10) || 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function cleanText(s) {
    s = String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim();
    return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT - 1).trimEnd() + '…' : s;
}

function validVersion(v) { return typeof v === 'string' && /^\d+(\.\d+){0,3}$/.test(v); }

// Bersihkan JSON dari server: hanya field yang dikenal, batasi jumlah & panjang.
function sanitize(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.releases)) return null;
    var releases = [];
    raw.releases.slice(0, MAX_RELEASES).forEach(function (r) {
        if (!r || !validVersion(r.version) || !Array.isArray(r.items)) return;
        var items = [];
        r.items.slice(0, MAX_ITEMS).forEach(function (it) {
            if (!it || !it.text) return;
            var type = (it.type === 'fix' || it.type === 'balance') ? it.type : 'feature';
            var id = cleanText(it.text.id), en = cleanText(it.text.en);
            if (!id && !en) return;
            items.push({ type: type, text: { id: id || en, en: en || id } });
        });
        if (!items.length) return;
        releases.push({ version: r.version, date: cleanText(r.date).slice(0, 10), items: items });
    });
    if (!releases.length) return null;
    releases.sort(function (a, b) { return cmpVersion(b.version, a.version); });
    var latest = validVersion(raw.latest) ? raw.latest : releases[0].version;
    if (cmpVersion(releases[0].version, latest) > 0) latest = releases[0].version;
    return { latest: latest, releases: releases };
}

export var PatchService = {
    _info: null,
    _timer: null,
    _first: null,
    _lastAt: 0,
    _busy: false,
    _cb: null,
    _onVis: null,

    current: function () { return String((APP_CONFIG && APP_CONFIG.version) || '0.0.0'); },

    // null bila belum pernah berhasil mengambil patches.json.
    getInfo: function () { return this._info; },

    // Rilis yang lebih baru dari versi tertentu (urut terbaru dulu), s/d versi 'upTo' bila diisi.
    releasesAfter: function (ver, upTo) {
        var info = this._info;
        if (!info) return [];
        return info.releases.filter(function (r) {
            return cmpVersion(r.version, ver) > 0 && (!upTo || cmpVersion(r.version, upTo) <= 0);
        });
    },

    updateAvailable: function () {
        return !!(this._info && cmpVersion(this._info.latest, this.current()) > 0);
    },

    start: function (onChange) {
        var self = this;
        this._cb = typeof onChange === 'function' ? onChange : null;
        if (typeof window === 'undefined' || this._timer) return;
        this._first = setTimeout(function () { self.check(true); }, FIRST_CHECK_MS);
        this._timer = setInterval(function () { self.check(true); }, INTERVAL_MS);
        this._onVis = function () {
            if (document.visibilityState === 'visible') self.check(false);
        };
        document.addEventListener('visibilitychange', this._onVis);
    },

    stop: function () {
        if (this._first) { clearTimeout(this._first); this._first = null; }
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        if (this._onVis && typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._onVis);
        this._onVis = null;
        this._cb = null;
    },

    // force=false: hormati jeda minimum. Mengembalikan info terbaru (atau null).
    check: async function (force) {
        if (this._busy || typeof fetch !== 'function') return this._info;
        var now = Date.now();
        if (!force && now - this._lastAt < FOCUS_MIN_GAP_MS) return this._info;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return this._info;
        this._busy = true;
        this._lastAt = now;
        var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS) : null;
        try {
            var base = (APP_CONFIG && APP_CONFIG.patchUrl) || './patches.json';
            var res = await fetch(base + (base.indexOf('?') < 0 ? '?' : '&') + 't=' + now, {
                cache: 'no-store',
                credentials: 'omit',
                signal: ctrl ? ctrl.signal : undefined
            });
            if (!res.ok) throw new Error('http_' + res.status);
            var info = sanitize(await res.json());
            if (info) {
                var changed = !this._info || this._info.latest !== info.latest ||
                    this._info.releases.length !== info.releases.length ||
                    JSON.stringify(this._info.releases[0]) !== JSON.stringify(info.releases[0]);
                this._info = info;
                if (changed && this._cb) { try { this._cb(info); } catch (e) {} }
            }
        } catch (e) {
            // diam: offline / file belum ada / JSON rusak
        } finally {
            if (timer) clearTimeout(timer);
            this._busy = false;
        }
        return this._info;
    }
};
