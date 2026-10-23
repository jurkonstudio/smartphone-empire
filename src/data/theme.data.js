// FILE: src/data/theme.data.js
// Theme presets for Smartphone Empire. Existing dark/light IDs remain supported.
export const THEMES = [
    { id: 'dark', label: 'Dark', icon: 'moon', description: 'Classic dark interface' },
    { id: 'light', label: 'Light', icon: 'sun', description: 'Clean bright interface' },
    { id: 'ocean', label: 'Ocean', icon: 'waves', description: 'Deep blue, cool and calm' },
    { id: 'forest', label: 'Forest', icon: 'trees', description: 'Natural green palette' },
    { id: 'sunset', label: 'Sunset', icon: 'sunset', description: 'Warm copper palette' },
    { id: 'plum', label: 'Plum', icon: 'sparkles', description: 'Elegant violet palette' }
];

export const ACCENTS = [
    { id: 'blue', label: 'Blue', hex: '#2563eb' },
    { id: 'emerald', label: 'Emerald', hex: '#10b981' },
    { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
    { id: 'amber', label: 'Amber', hex: '#f59e0b' },
    { id: 'rose', label: 'Rose', hex: '#f43f5e' },
    { id: 'cyan', label: 'Cyan', hex: '#06b6d4' }
];

export const DEFAULT_THEME = 'dark';
export const DEFAULT_ACCENT = 'blue';
export function isValidTheme(id) { return THEMES.some(t => t.id === id); }
export function isValidAccent(id) { return ACCENTS.some(a => a.id === id); }
export function getThemeById(id) { return THEMES.find(t => t.id === id) || THEMES[0]; }
export function getAccentById(id) { return ACCENTS.find(a => a.id === id) || ACCENTS[0]; }
