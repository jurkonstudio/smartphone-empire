// FILE: src/data/i18n/index.js  (REPLACE)
// + os-panel.i18n.js (panel Riset > OS berbahasa Inggris/Indonesia).
// v2027.55 — + bahasa Jepang, Prancis, Jerman, Spanyol, Italia, Rusia, Polandia, Hindi (kamus inti).
// v2027.54 — + bahasa Mandarin (zh) & Korea (ko): kamus inti (zh.js, ko.js), fallback ke Inggris untuk key yang belum diterjemahkan.
// v2027.53 — + os-screen.i18n.js (mockup f-OS & ringkasan R&D).
// v2027.52 — + text-fix.i18n.js (perbaikan key mentah: Top Up SIL, Office, ID Pemain, dll).
// Registry kamus bahasa. v2027.51 — + kamus UI batch (ui-batch.i18n.js).
import { id as _id } from './id.js';
import { en as _en } from './en.js';
import { zh as _zh } from './zh.js';
import { ko as _ko } from './ko.js';
import { ja as _ja } from './ja.js';
import { fr as _fr } from './fr.js';
import { de as _de } from './de.js';
import { es as _es } from './es.js';
import { it as _it } from './it.js';
import { ru as _ru } from './ru.js';
import { pl as _pl } from './pl.js';
import { hi as _hi } from './hi.js';
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
import { OS_SCREEN_I18N } from './os-screen.i18n.js';
import { MARKET_NAV_I18N } from './market-nav.i18n.js';
import { OS_PANEL_I18N } from './os-panel.i18n.js';
import { ECOSYSTEM_I18N } from './ecosystem.i18n.js';
import { APPSTORE_REVIEW_I18N } from './appstore-review.i18n.js';
import { DESIGN_TRACKS_I18N } from './design-tracks.i18n.js';
import { PHONE_GEN_I18N } from './phone-gen.i18n.js';

const id = Object.assign({}, _id, SILICON_SPEED_I18N.id, PLAYER_PROFILE_I18N.id, NOTIFICATION_I18N.id, RESEARCH_UI_I18N.id, REGIONAL_I18N.id, OFFICE_I18N.id, UI_BATCH_I18N.id, ONBOARDING_AUTH_I18N.id, TEXT_FIX_I18N.id, OS_UPDATE_CARDS_I18N.id, RESEARCH_PAGES_I18N.id, OS_SCREEN_I18N.id, MARKET_NAV_I18N.id, OS_PANEL_I18N.id, ECOSYSTEM_I18N.id, APPSTORE_REVIEW_I18N.id, DESIGN_TRACKS_I18N.id, PHONE_GEN_I18N.id);
const en = Object.assign({}, _en, SILICON_SPEED_I18N.en, PLAYER_PROFILE_I18N.en, NOTIFICATION_I18N.en, RESEARCH_UI_I18N.en, REGIONAL_I18N.en, OFFICE_I18N.en, UI_BATCH_I18N.en, ONBOARDING_AUTH_I18N.en, TEXT_FIX_I18N.en, OS_UPDATE_CARDS_I18N.en, RESEARCH_PAGES_I18N.en, OS_SCREEN_I18N.en, MARKET_NAV_I18N.en, OS_PANEL_I18N.en, ECOSYSTEM_I18N.en, APPSTORE_REVIEW_I18N.en, DESIGN_TRACKS_I18N.en, PHONE_GEN_I18N.en);

// zh & ko: kamus inti saja. Key yang tidak ada akan jatuh ke en lewat LanguageService.t().
const zh = Object.assign({}, _zh);
const ko = Object.assign({}, _ko);
const ja = Object.assign({}, _ja);
const fr = Object.assign({}, _fr);
const de = Object.assign({}, _de);
const es = Object.assign({}, _es);
const it = Object.assign({}, _it);
const ru = Object.assign({}, _ru);
const pl = Object.assign({}, _pl);
const hi = Object.assign({}, _hi);

export const DICTIONARIES = { id, en, zh, ko, ja, fr, de, es, it, ru, pl, hi };

export const SUPPORTED_LANGS = [
    { id: 'en', label: 'English' },
    { id: 'id', label: 'Bahasa Indonesia' },
    { id: 'zh', label: '中文（简体）' },
    { id: 'ko', label: '한국어' },
    { id: 'ja', label: '日本語' },
    { id: 'fr', label: 'Français' },
    { id: 'de', label: 'Deutsch' },
    { id: 'es', label: 'Español' },
    { id: 'it', label: 'Italiano' },
    { id: 'ru', label: 'Русский' },
    { id: 'pl', label: 'Polski' },
    { id: 'hi', label: 'हिन्दी' }
];

export function isValidLang(langId) {
    return Object.prototype.hasOwnProperty.call(DICTIONARIES, langId);
}

export function getDictionary(langId) {
    return DICTIONARIES[langId] || DICTIONARIES.en;
}
