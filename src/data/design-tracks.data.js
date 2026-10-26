// FILE: src/data/design-tracks.data.js  (BARU — 0.2.9: kategori desain di tab Produk → Desain)
// Kategori: Ponsel (inti), Tablet, Earbuds nirkabel, Jam pintar, Charger.
// Tahun dibuka & puncak diambil dari sejarah dunia nyata (rujukan, bukan simulasi). Popularitas
// dihitung dari tahun dalam game (state.data.time.currentYear), jadi kartu ikut berkembang seiring waktu.
// Lini aksesori (earbuds, watch, charger) tetap dikelola di Pasar → Ekosistem; ini hanya tampilan desain.

export const DESIGN_TRACKS = [
    { id: 'phone',   nameKey: 'dt.track.phone',   core: true },
    // iPad 2010; tablet mencapai puncak minat pasar sekitar 2014
    { id: 'tablet',  nameKey: 'dt.track.tablet',  intro: 2010, peak: 2014, floor: 0.35, mock: 'tablet' },
    // Earbuds nirkabel sejati mulai arus utama 2016 (AirPods); puncak tren sekitar 2021
    { id: 'earbuds', nameKey: 'dt.track.earbuds', intro: 2016, peak: 2021, floor: 0.35, mock: 'line', lineId: 'earbuds' },
    // Jam pintar arus utama sejak 2015 (Apple Watch); puncak sekitar 2020
    { id: 'watch',   nameKey: 'dt.track.watch',   intro: 2015, peak: 2020, floor: 0.35, mock: 'line', lineId: 'watch' },
    // Charger cepat/USB-C menguat sejak 2014; kategori sudah ada jauh sebelumnya
    { id: 'charger', nameKey: 'dt.track.charger', intro: 2000, peak: 2016, floor: 0.35, mock: 'line', lineId: 'charger' }
];

export function getDesignTrack(id) {
    for (var i = 0; i < DESIGN_TRACKS.length; i++) if (DESIGN_TRACKS[i].id === id) return DESIGN_TRACKS[i];
    return null;
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
    if (year < track.intro) return 'locked';
    if (year > track.peak + 1) return 'declining';
    if (year >= track.peak - 1 && year <= track.peak + 1) return 'peak';
    var t = (year - track.intro) / Math.max(1, track.peak - track.intro);
    return t < 0.5 ? 'early' : 'rising';
}

export function trackSeries(track, fromYear, toYear) {
    var out = [];
    for (var y = fromYear; y <= toYear; y++) out.push({ year: y, value: trackPopularity(track, y) });
    return out;
}
