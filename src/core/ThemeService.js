// FILE: src/core/ThemeService.js
// ============================================================
// ThemeService — mengatur theme (dark/light) & accent color.
// Menyimpan ke localStorage agar persist antar sesi.
// Juga meng-emit event agar UI bisa re-render jika perlu.
// ============================================================
import { bus } from './EventBus.js';
import {
    DEFAULT_THEME, DEFAULT_ACCENT,
    isValidTheme, isValidAccent
} from '../data/theme.data.js';

const STORAGE_KEY = 'smartphone-empire:theme:v1';

let _theme = DEFAULT_THEME;
let _accent = DEFAULT_ACCENT;

function _load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && isValidTheme(parsed.theme))  _theme = parsed.theme;
        if (parsed && isValidAccent(parsed.accent)) _accent = parsed.accent;
    } catch (e) {
        console.warn('[ThemeService] Gagal load theme:', e);
    }
}

function _save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: _theme, accent: _accent }));
    } catch (e) {
        console.warn('[ThemeService] Gagal save theme:', e);
    }
}

function _apply() {
    const root = document.documentElement;
    root.setAttribute('data-theme', _theme);
    root.setAttribute('data-accent', _accent);
    // Meta theme-color untuk address bar mobile
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', _theme === 'dark' ? '#0a0c10' : '#ffffff');
    }
}

export const ThemeService = {
    init() {
        _load();
        _apply();
        console.info('[ThemeService] aktif. Theme:', _theme, 'Accent:', _accent);
        return { theme: _theme, accent: _accent };
    },

    getTheme()  { return _theme; },
    getAccent() { return _accent; },

    setTheme(id) {
        if (!isValidTheme(id) || id === _theme) return;
        _theme = id;
        _save();
        _apply();
        bus.emit('theme:changed', { theme: _theme, accent: _accent });
    },

    setAccent(id) {
        if (!isValidAccent(id) || id === _accent) return;
        _accent = id;
        _save();
        _apply();
        bus.emit('theme:changed', { theme: _theme, accent: _accent });
    },

    toggleTheme() {
        this.setTheme(_theme === 'dark' ? 'light' : 'dark');
    }
};
