// FILE: src/core/LanguageService.js
// v2027.4a — cloud override + missing tracker.
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { getDictionary, isValidLang, SUPPORTED_LANGS } from '../data/i18n/index.js';
import { I18nCloudService } from '../services/i18n/I18nCloudService.js';

const STORAGE_KEY = 'smartphone-empire:lang:v1';
const DEFAULT_LANG = 'en';

let _lang = DEFAULT_LANG;
let _dict = null;
let _cloudDict = null;          // Override dari Supabase

const _missingKeys = new Set();
const _missingOnce = Object.create(null);

function _load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isValidLang(saved)) _lang = saved;
        else _lang = DEFAULT_LANG;
    } catch (e) {
        _lang = DEFAULT_LANG;
    }
    _dict = getDictionary(_lang);

    // Coba muat dari cache lokal (offline fallback).
    var cached = I18nCloudService.loadLocalCache(_lang);
    if (cached) _cloudDict = cached;
}

function _save() {
    try { localStorage.setItem(STORAGE_KEY, _lang); } catch (e) {}
}

function _interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, key) {
        return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m;
    });
}

function _trackMissing(key) {
    if (_missingOnce[key]) return;
    _missingOnce[key] = true;
    _missingKeys.add(key);
    if (typeof console !== 'undefined') console.warn('[i18n] Missing key:', key);
}

export function t(key, vars) {
    if (!key) return '';
    if (!_dict) _dict = getDictionary(_lang);

    // 1. Cloud override dulu (kalau ada).
    if (_cloudDict && _cloudDict[key] !== undefined) {
        return _interpolate(_cloudDict[key], vars);
    }
    // 2. Local dictionary.
    var str = _dict[key];
    if (str !== undefined) return _interpolate(str, vars);
    // 3. Fallback ke English lokal.
    if (_lang !== 'en') {
        var en = getDictionary('en');
        if (en && en[key] !== undefined) return _interpolate(en[key], vars);
    }
    _trackMissing(key);
    return key;
}

export const LanguageService = {
    init() {
        _load();
        console.info('[LanguageService] aktif. Lang:', _lang);
        return _lang;
    },

    getLang() { return _lang; },
    getSupported() { return SUPPORTED_LANGS.slice(); },

    setLang(langId) {
        if (!isValidLang(langId) || langId === _lang) return false;
        _lang = langId;
        _dict = getDictionary(_lang);
        // Muat cache cloud untuk lang baru.
        _cloudDict = I18nCloudService.loadLocalCache(langId) || null;
        _save();
        bus.emit('lang:changed', { lang: _lang });
        return true;
    },

    t,

    // ---------- Cloud integration ----------

    // Apply cloud strings. Menggantikan dict lokal untuk key yang ada.
    applyCloudStrings(lang, map) {
        if (lang !== _lang) return false;
        _cloudDict = map || null;
        bus.emit('lang:changed', { lang: _lang, fromCloud: true });
        return true;
    },

    // Ambil nilai effective (cloud override + local).
    getEffectiveValue(lang, key) {
        if (lang === _lang && _cloudDict && _cloudDict[key] !== undefined) return _cloudDict[key];
        var d = getDictionary(lang);
        if (d && d[key] !== undefined) return d[key];
        return null;
    },

    isCloudOverridden(key) {
        return !!(_cloudDict && _cloudDict[key] !== undefined);
    },

    getLocalDict(lang) {
        return getDictionary(lang || _lang) || {};
    },

    // ---------- i18n diagnostics ----------

    getMissingKeys() { return Array.from(_missingKeys).sort(); },
    clearMissingKeys() {
        _missingKeys.clear();
        Object.keys(_missingOnce).forEach(function (k) { delete _missingOnce[k]; });
        return true;
    },
    getMissingKeysAsJs() {
        var keys = this.getMissingKeys();
        if (!keys.length) return '// Tidak ada key yang hilang.';
        var lines = ['// ---- MISSING KEYS (' + keys.length + ') ----'];
        keys.forEach(function (k) { lines.push("    '" + k + "': '',"); });
        return lines.join('\n');
    },
    getMissingSummary() { return _missingKeys.size + ' missing key(s).'; }
};
