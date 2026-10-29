// FILE: src/data/design-tracks.data.js  (0.2.9 → 0.2.10: kategori desain + katalog terpadu)
// Kategori: Ponsel (inti), Tablet, Earbuds nirkabel, Jam pintar, Charger.
// intro/peak = sejarah dunia nyata; dipakai untuk kurva popularitas (tahun game = state.data.time.currentYear).
// Untuk lini aksesori, gerbang buka mengikuti minYear di ecosystem.data.js (aturan permainan),
// sehingga tab Desain dan Market tidak berbeda soal kapan lini bisa dibuka.
import { getEcoLine } from './ecosystem.data.js';

export const DESIGN_TRACKS = [
    { id: 'phone',   nameKey: 'dt.track.phone',   core: true },
    { id: 'tablet',  nameKey: 'dt.track.tablet',  intro: 2010, peak: 2014, floor: 0.35, mock: 'tablet' },
    { id: 'earbuds', nameKey: 'dt.track.earbuds', intro: 2016, peak: 2021, floor: 0.35, mock: 'line', lineId: 'earbuds' },
    { id: 'watch',   nameKey: 'dt.track.watch',   intro: 2015, peak: 2020, floor: 0.35, mock: 'line', lineId: 'watch' },
    { id: 'charger', nameKey: 'dt.track.charger', intro: 2000, peak: 2016, floor: 0.35, mock: 'line', lineId: 'charger' }
];

export function getDesignTrack(id) {
    for (var i = 0; i < DESIGN_TRACKS.length; i++) if (DESIGN_TRACKS[i].id === id) return DESIGN_TRACKS[i];
    return null;
}

// Tahun ketika kategori bisa dibuka di dalam game.
export function gateYear(track) {
    if (track.core) return 0;
    if (track.lineId) { var l = getEcoLine(track.lineId); if (l) return l.minYear; }
    return track.intro;
}

// Popularitas 0..1: naik kuadratik dari tahun dibuka sampai puncak, lalu menurun pelan hingga 'floor'.
export function trackPopularity(track, year) {
    if (track.core) return 1;
    if (year < track.intro) return 0;
    var span = Math.max(1, track.peak - track.intro);
    var t = Math.min(1, (year - track.intro) / span);
    var rise = 1 - Math.pow(1 - t, 2);
    var decay = year > track.peak ? Math.max(track.floor, 1 - 0.05 * (year - track.peak)) : 1;
    return Math.round(rise * decay * 100) / 100;
}

// Tahap: core | locked | early | rising | peak | declining
export function trackStage(track, year) {
    if (track.core) return 'core';
    if (year < gateYear(track)) return 'locked';
    if (year > track.peak + 1) return 'declining';
    if (year >= track.peak - 1) return 'peak';
    var t = (year - track.intro) / Math.max(1, track.peak - track.intro);
    return t < 0.5 ? 'early' : 'rising';
}

export function trackSeries(track, fromYear, toYear) {
    var out = [];
    for (var y = fromYear; y <= toYear; y++) out.push({ year: y, value: trackPopularity(track, y) });
    return out;
}
