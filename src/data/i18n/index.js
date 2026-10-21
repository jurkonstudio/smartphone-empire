// FILE: src/data/i18n/index.js  (REPLACE)
// v2027.52 — + text-fix.i18n.js (perbaikan key mentah: Top Up SIL, Office, ID Pemain, dll).
// Registry kamus bahasa. v2027.51 — + kamus UI batch (ui-batch.i18n.js).
import { id as _id } from './id.js';
import { en as _en } from './en.js';
import { SILICON_SPEED_I18N } from './silicon-speed.i18n.js';
import { PLAYER_PROFILE_I18N } from './player-profile.i18n.js';
import { NOTIFICATION_I18N } from './notification.i18n.js';
import { RESEARCH_UI_I18N } from './research-ui.i18n.js';
import { REGIONAL_I18N } from './regional.i18n.js';
import { OFFICE_I18N } from './office.i18n.js';
import { UI_BATCH_I18N } from './ui-batch.i18n.js';
import { ONBOARDING_AUTH_I18N } from './onboarding-auth.i18n.js';
import { TEXT_FIX_I18N } from './text-fix.i18n.js';
import { OS_UPDATE_CARDS_I18N } from './os-update-cards.i18n.js';
import { RESEARCH_PAGES_I18N } from './research-pages.i18n.js';

const id = Object.assign({}, _id, SILICON_SPEED_I18N.id, PLAYER_PROFILE_I18N.id, NOTIFICATION_I18N.id, RESEARCH_UI_I18N.id, REGIONAL_I18N.id, OFFICE_I18N.id, UI_BATCH_I18N.id, ONBOARDING_AUTH_I18N.id, TEXT_FIX_I18N.id, OS_UPDATE_CARDS_I18N.id, RESEARCH_PAGES_I18N.id);
const en = Object.assign({}, _en, SILICON_SPEED_I18N.en, PLAYER_PROFILE_I18N.en, NOTIFICATION_I18N.en, RESEARCH_UI_I18N.en, REGIONAL_I18N.en, OFFICE_I18N.en, UI_BATCH_I18N.en, ONBOARDING_AUTH_I18N.en, TEXT_FIX_I18N.en, OS_UPDATE_CARDS_I18N.en, RESEARCH_PAGES_I18N.en);

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
