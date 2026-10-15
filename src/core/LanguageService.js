// FILE: src/core/LanguageService.js
// v2027.3a — default English + missing-key tracker.
// ============================================================
// LanguageService — singleton i18n.
//   t('nav.home')             → 'Home'
//   t('toast.x', {value: 'a'}) → substitusi {value}
//   setLang('id')             → ganti + persist + emit
//
// [v2027.3a] Missing-key tracker:
//   Setiap t('key') yang tidak ditemukan dicatat.
//   Buka Eruda Console → ketik __game.i18nReport()
//   → dapat daftar key yang belum ditranslate, siap copy-paste.
// ============================================================
import { bus } from './EventBus.js';
import { APP_CONFIG } from '../config/app.config.js';
import { getDictionary, isValidLang, SUPPORTED_LANGS } from '../data/i18n/index.js';

const STORAGE_KEY = 'smartphone-empire:lang:v1';
const DEFAULT_LANG = 'en';

let _lang = DEFAULT_LANG;
let _dict = null;

// ---- Missing key tracker ----
const _missingKeys = new Set();       // unique
const _missingOnce = Object.create(null); // fast dedup for warn log

function _load() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isValidLang(saved)) {
            _lang = saved;
        } else {
            _lang = DEFAULT_LANG;
        }
    } catch (e) {
        console.warn('[LanguageService] Gagal load:', e);
        _lang = DEFAULT_LANG;
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

function _trackMissing(key) {
    if (_missingOnce[key]) return;
    _missingOnce[key] = true;
    _missingKeys.add(key);
    if (typeof console !== 'undefined') {
        console.warn('[i18n] Missing key:', key);
    }
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
        _trackMissing(key);
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

    t,

    // ---- i18n diagnostics ----

    // Kembalikan array key yang hilang (sorted).
    getMissingKeys() {
        return Array.from(_missingKeys).sort();
    },

    // Hapus daftar key yang hilang (mis. setelah Anda tambahkan ke id.js/en.js).
    clearMissingKeys() {
        _missingKeys.clear();
        // Reset dedup flag juga.
        Object.keys(_missingOnce).forEach(function (k) { delete _missingOnce[k]; });
        return true;
    },

    // Kembalikan teks siap copy-paste — siap tempel ke id.js atau en.js.
    // Contoh output:
    //   // ---- MISSING KEYS ----
    //   'foo.bar': '',
    //   'baz.qux': '',
    getMissingKeysAsJs() {
        var keys = this.getMissingKeys();
        if (!keys.length) return '// Tidak ada key yang hilang.';
        var lines = ['// ---- MISSING KEYS (' + keys.length + ') ----'];
        keys.forEach(function (k) {
            lines.push("    '" + k + "': '',");
        });
        return lines.join('\n');
    },

    // Ringkasan singkat untuk toast / tampilan.
    getMissingSummary() {
        return _missingKeys.size + ' missing key(s).';
    }
};
