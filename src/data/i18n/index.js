// FILE: src/data/i18n/index.js  (REPLACE)
// Registry kamus bahasa. v2027.43 — gabung kamus notifikasi.
import { id as _id } from './id.js';
import { en as _en } from './en.js';
import { SILICON_SPEED_I18N } from './silicon-speed.i18n.js';
import { PLAYER_PROFILE_I18N } from './player-profile.i18n.js';
import { NOTIFICATION_I18N } from './notification.i18n.js';
import { RESEARCH_UI_I18N } from './research-ui.i18n.js';

const id = Object.assign({}, _id, SILICON_SPEED_I18N.id, PLAYER_PROFILE_I18N.id, NOTIFICATION_I18N.id, RESEARCH_UI_I18N.id);
const en = Object.assign({}, _en, SILICON_SPEED_I18N.en, PLAYER_PROFILE_I18N.en, NOTIFICATION_I18N.en, RESEARCH_UI_I18N.en);

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
