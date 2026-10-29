// FILE: src/data/campus-expansion.data.js  (BARU — v2027.73: Perluasan Kampus)
// Data murni (tanpa THREE/DOM) untuk distrik perluasan di luar inti kampus (±16.3).
// Garis pantai pulau diperluas ke timur/utara/selatan (sisi barat TETAP agar jembatan ke Pulau Manufaktur tidak bergeser).
// Footprint dipakai CampusBuildings.js agar pohon/semak/bukit/lampu tidak menembus distrik baru.
// Distrik ini DEKORATIF (tidak punya level/slot/kartu info): tidak mengubah logika game maupun ID bangunan.

// Seberapa jauh pulau melebar ke timur (th = 0). 0 = tidak diperluas. Barat (th = PI) selalu 0.
export const EXPAND_GAIN = 0.30;
export const EXPAND_POWER = 0.9;

// x0..x1, z0..z1 absolut (satuan peta). Kamera melihat dari +x,+z: timur = kanan-depan, selatan = kiri-depan.
export const CAMPUS_EXPANSION = [
    { id: 'sport',      name: ['Kompleks Olahraga', 'Sports Complex'],   x0: 17.2, x1: 27.4, z0: -5.4, z1: 3.6 },
    { id: 'pantai',     name: ['Kedai & Dermaga', 'Beach Café & Pier'],  x0: 20.4, x1: 26.4, z0: 6.6,  z1: 11.6 },
    { id: 'mercusuar',  name: ['Mercusuar', 'Lighthouse'],               x0: 20.4, x1: 24.4, z0: -15.2, z1: -11.4 },
    { id: 'botani',     name: ['Taman Botani', 'Botanical Garden'],      x0: 1.2,  x1: 12.4, z0: -21.8, z1: -17.2 },
    { id: 'surya',      name: ['Ladang Surya', 'Solar Field'],           x0: -8.6, x1: -1.0, z0: -20.6, z1: -17.4 },
    { id: 'bundaran',   name: ['Bundaran Selatan', 'South Roundabout'],  x0: -3.2, x1: 3.2,  z0: 15.0, z1: 22.4 },
    { id: 'parkir',     name: ['Area Parkir', 'Parking'],                x0: 3.4,  x1: 13.2, z0: 17.6, z1: 22.2 },
    { id: 'amfiteater', name: ['Amfiteater', 'Amphitheater'],            x0: -7.9, x1: -3.3, z0: 14.6, z1: 21.5 }
];

export const CAMPUS_EXPANSION_BY_ID = (function () {
    var o = {};
    CAMPUS_EXPANSION.forEach(function (e) { o[e.id] = e; });
    return o;
})();
