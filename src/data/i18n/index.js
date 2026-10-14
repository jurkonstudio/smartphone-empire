// FILE: src/data/i18n/index.js
// Registry kamus bahasa.
import { id } from './id.js';
import { en } from './en.js';

export const DICTIONARIES = { id, en };

export const SUPPORTED_LANGS = [
    { id: 'en', label: 'English' },
    { id: 'id', label: 'Bahasa Indonesia' }
];

export function isValidLang(langId) {
    return Object.prototype.hasOwnProperty.call(DICTIONARIES, langId);
}

export function getDictionary(langId) {
    return DICTIONARIES[langId] || DICTIONARIES.en;
}
