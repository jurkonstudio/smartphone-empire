// FILE: src/core/LanguageService.js
// ============================================================
// LanguageService — singleton i18n.
//   t('nav.home')             → 'Home'
//   t('toast.x', {value: 'a'}) → substitusi {value}
//   setLang('id')             → ganti + persist + emit
//
// Persist di localStorage (mirip ThemeService).
// ============================================================
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { getDictionary, isValidLang, SUPPORTED_LANGS } from '../data/i18n/index.js';

const STORAGE_KEY = 'smartphone-empire:lang:v1';

let _lang = (APP_CONFIG && APP_CONFIG.defaultLang) || 'en';
let _dict = null;

function _load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isValidLang(saved)) _lang = saved;
    } catch (e) {
        console.warn('[LanguageService] Gagal load:', e);
    }
    _dict = getDictionary(_lang);
}

function _save() {
    try {
        localStorage.setItem(STORAGE_KEY, _lang);
    } catch (e) {
        console.warn('[LanguageService] Gagal save:', e);
    }
}

function _interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, key) {
        return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m;
    });
}

export function t(key, vars) {
    if (!key) return '';
    if (!_dict) _dict = getDictionary(_lang);
    var str = _dict[key];
    if (str === undefined) {
        // Fallback ke English dulu, lalu key apa adanya.
        if (_lang !== 'en') {
            var en = getDictionary('en');
            if (en && en[key] !== undefined) return _interpolate(en[key], vars);
        }
        if (typeof console !== 'undefined') {
            console.warn('[i18n] Missing key:', key);
        }
        return key;
    }
    return _interpolate(str, vars);
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
        _save();
        bus.emit('lang:changed', { lang: _lang });
        return true;
    },

    t
};
