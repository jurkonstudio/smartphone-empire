// FILE: src/data/competitors/index.js
// ============================================================
// Registry kompetitor — import dari file per-kompetitor.
// Semua helper publik (getCompetitorById, getActiveCompetitors,
// getHistoricalShare, dll.) ada di sini.
// ============================================================
import { FICTIONAL_NAMES, getFictionalName, interpShare } from './helpers.js';

// Batch 1
import { nokia } from './nokia.js';
import { motorola } from './motorola.js';
import { sony_ericsson } from './sony_ericsson.js';
import { siemens } from './siemens.js';
import { palm } from './palm.js';
// Batch 2
import { blackberry } from './blackberry.js';
import { samsung } from './samsung.js';
import { lg } from './lg.js';
import { htc } from './htc.js';
import { apple } from './apple.js';
import { google_android } from './google_android.js';
import { huawei } from './huawei.js';
// Batch 3
import { oppo } from './oppo.js';
import { vivo } from './vivo.js';
import { microsoft_nokia } from './microsoft_nokia.js';
import { honor } from './honor.js';
import { oneplus } from './oneplus.js';
import { nothing } from './nothing.js';
import { asus } from './asus.js';
import { sony_mobile } from './sony_mobile.js';
import { realme } from './realme.js';
import { meizu } from './meizu.js';
import { lenovo } from './lenovo.js';
import { tecno } from './tecno.js';
import { zte } from './zte.js';
import { xiaomi } from './xiaomi.js';

export const COMPETITORS = [
    nokia, motorola, sony_ericsson, siemens, palm,
    blackberry, samsung, lg, htc, apple, google_android, huawei,
    oppo, vivo, microsoft_nokia, honor, oneplus, nothing,
    asus, sony_mobile, realme, meizu, lenovo, tecno, zte, xiaomi
];

export { FICTIONAL_NAMES, getFictionalName };

export function getCompetitorById(id) {
    return COMPETITORS.find(c => c.id === id) || null;
}

export function getActiveCompetitors(year) {
    return COMPETITORS.filter(c => {
        if (year < c.activeFromYear) return false;
        if (c.activeToYear !== null && year > c.activeToYear) return false;
        return true;
    });
}

export function getLifeEventsForYear(year) {
    const events = [];
    COMPETITORS.forEach(c => {
        (c.lifeEvents || []).forEach(le => {
            if (le.year === year) {
                events.push({ competitorId: c.id, competitorName: c.name, ...le });
            }
        });
    });
    return events;
}

export function getHistoricalShare(competitorId, year) {
    const comp = getCompetitorById(competitorId);
    if (!comp || !comp.shareByYear) return null;
    return interpShare(comp.shareByYear, year);
}
