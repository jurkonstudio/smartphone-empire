// FILE: src/services/i18n/I18nCloudService.js
// v2027.1a — Fetch/save translations dari Supabase.
// Cache di localStorage untuk offline fallback.
import { CloudService } from '../CloudService.js';

var CACHE_PREFIX = 'smartphone-empire:i18n-cache:';
var TABLE = 'i18n_strings';

// Cache in-memory: { en: {...}, id: {...} }
var _cache = { en: null, id: null };
var _lastFetch = 0;
var MIN_REFETCH_MS = 60 * 1000;

function _loadCacheFromLS(lang) {
    try {
        var raw = localStorage.getItem(CACHE_PREFIX + lang);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) { return null; }
}

function _saveCacheToLS(lang, map) {
    try {
        localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(map));
    } catch (e) { /* quota error, diamkan */ }
}

export var I18nCloudService = {
    // Ambil semua strings untuk lang tertentu dari Supabase.
    // Return: Map { key: value } — atau null kalau gagal.
    async fetchLang(lang) {
        if (!CloudService.isAvailable()) return null;
        if (!CloudService.getUserId()) return null;    // belum login
        var adapter = CloudService._adapter;
        if (!adapter) return null;

        // Cache in-memory fresh?
        if (_cache[lang] && (Date.now() - _lastFetch < MIN_REFETCH_MS)) {
            return _cache[lang];
        }

        try {
            var client = await adapter._getClient ? adapter._getClient() : null;
            // Fallback: pakai adapter yang kita punya via method.
            var rows = null;
            if (typeof adapter.fetchI18nStrings === 'function') {
                rows = await adapter.fetchI18nStrings(lang);
            } else {
                // No adapter support — return null.
                return null;
            }
            var map = {};
            (rows || []).forEach(function (r) {
                if (r && r.key && typeof r.value === 'string') map[r.key] = r.value;
            });
            _cache[lang] = map;
            _saveCacheToLS(lang, map);
            _lastFetch = Date.now();
            return map;
        } catch (err) {
            console.warn('[I18nCloud] fetch gagal:', err);
            // Fallback ke cache LS.
            var cached = _loadCacheFromLS(lang);
            if (cached) {
                _cache[lang] = cached;
                return cached;
            }
            return null;
        }
    },

    // Muat dari cache LS tanpa network. Sinkron, untuk boot instan.
    loadLocalCache(lang) {
        if (_cache[lang]) return _cache[lang];
        var cached = _loadCacheFromLS(lang);
        if (cached) _cache[lang] = cached;
        return cached;
    },

    // Simpan/update satu key untuk satu bahasa.
    async saveString(lang, key, value) {
        if (!CloudService.isAvailable()) {
            return { ok: false, reason: 'Cloud tidak tersedia.' };
        }
        if (!CloudService.getUserId()) {
            return { ok: false, reason: 'Login dulu.' };
        }
        var adapter = CloudService._adapter;
        if (!adapter || typeof adapter.saveI18nString !== 'function') {
            return { ok: false, reason: 'Adapter tidak mendukung i18n.' };
        }
        try {
            await adapter.saveI18nString(lang, key, value);
            // Update cache.
            if (!_cache[lang]) _cache[lang] = {};
            _cache[lang][key] = value;
            _saveCacheToLS(lang, _cache[lang]);
            return { ok: true };
        } catch (err) {
            return { ok: false, reason: err.message || 'save gagal' };
        }
    },

    // Hapus override (kembali ke nilai file lokal).
    async deleteString(lang, key) {
        if (!CloudService.isAvailable() || !CloudService.getUserId()) {
            return { ok: false, reason: 'Login dulu.' };
        }
        var adapter = CloudService._adapter;
        if (!adapter || typeof adapter.deleteI18nString !== 'function') {
            return { ok: false, reason: 'Adapter tidak mendukung i18n.' };
        }
        try {
            await adapter.deleteI18nString(lang, key);
            if (_cache[lang] && _cache[lang][key] !== undefined) {
                delete _cache[lang][key];
                _saveCacheToLS(lang, _cache[lang]);
            }
            return { ok: true };
        } catch (err) {
            return { ok: false, reason: err.message };
        }
    },

    // Reset cache (mis. setelah login/logout).
    resetCache() {
        _cache = { en: null, id: null };
        _lastFetch = 0;
    },

    getCached(lang) {
        return _cache[lang] || null;
    }
};
