// FILE: src/data/cosmetics.data.js  (BARU, v0.2.19)
// ============================================================
// Katalog KOSMETIK yang dibeli dengan SIL (hanya tampilan, TIDAK mengubah hasil permainan).
// Prinsip: SIL membeli gaya & prestise, bukan skor. Harga mengacu paket top-up (50 SIL ≈ Rp15.000)
// dan ganti nama perusahaan (150 SIL).
//   cat   : campus | fx | phone | frame | badge
//   price : SIL (dibayar SIL murni, bukan uang game, lewat SiliconService.spendRaw)
//   art   : data warna/efek yang dibaca tampilan (peta kampus, mockup ponsel, avatar, leaderboard)
// Kosmetik hanya boleh DITAMBAH. Menghapus id lama membuat pemilik kehilangan item (id tak dikenal dibuang).
// ============================================================
export var COSMETIC_CATS = ['campus', 'fx', 'phone', 'frame', 'badge'];

export var COSMETICS = [
    // ---- Tema kampus 3D (suasana langit & cahaya peta kampus) ----
    { id: 'campus_dusk',   cat: 'campus', price: 80,  icon: '🌇', art: { skyTop: '#2b2f6b', skyBottom: '#ff9a5c', tint: '#ffb27a', light: 0.9 } },
    { id: 'campus_sakura', cat: 'campus', price: 120, icon: '🌸', art: { skyTop: '#a8c8f0', skyBottom: '#ffd9e6', tint: '#ffc2d8', light: 1.0 } },
    { id: 'campus_neon',   cat: 'campus', price: 140, icon: '🌃', art: { skyTop: '#0b0f2a', skyBottom: '#3a1a6e', tint: '#7c5cff', light: 0.75 } },
    { id: 'campus_aurora', cat: 'campus', price: 220, icon: '🌌', art: { skyTop: '#04101f', skyBottom: '#0f5f5a', tint: '#5eead4', light: 0.8 } },

    // ---- Efek perayaan (naik level, rilis ponsel, pencapaian) ----
    { id: 'fx_confetti',   cat: 'fx', price: 60,  icon: '🎉', art: { kind: 'confetti',  colors: ['#ff5d8f', '#ffd166', '#3d94ff', '#22c1a5'] } },
    { id: 'fx_fireworks',  cat: 'fx', price: 120, icon: '🎆', art: { kind: 'fireworks', colors: ['#ffd166', '#ff5d8f', '#8b7bff'] } },
    { id: 'fx_stardust',   cat: 'fx', price: 180, icon: '✨', art: { kind: 'stardust',  colors: ['#c9e07c', '#ffffff', '#7db4ff'] } },

    // ---- Warna & finishing ponsel (tampil di mockup ponsel) ----
    { id: 'ph_midnight',   cat: 'phone', price: 50,  icon: '🖤', art: { a: '#1b2433', b: '#0a0f1a', gloss: 0.15 } },
    { id: 'ph_rose',       cat: 'phone', price: 70,  icon: '🌷', art: { a: '#f2b8c6', b: '#d98aa0', gloss: 0.35 } },
    { id: 'ph_titanium',   cat: 'phone', price: 90,  icon: '🔘', art: { a: '#b4bcc6', b: '#7b8794', gloss: 0.5 } },
    { id: 'ph_aurora',     cat: 'phone', price: 160, icon: '🌈', art: { a: '#5eead4', b: '#8b7bff', gloss: 0.6 } },

    // ---- Bingkai avatar (profil & leaderboard) ----
    { id: 'fr_bronze',     cat: 'frame', price: 40,  icon: '🥉', art: { ring: ['#b87333', '#e0a070'], glow: 0 } },
    { id: 'fr_silicon',    cat: 'frame', price: 90,  icon: '💠', art: { ring: ['#3d94ff', '#8b7bff'], glow: 0.4 } },
    { id: 'fr_neon',       cat: 'frame', price: 150, icon: '🟣', art: { ring: ['#ff5d8f', '#7c5cff'], glow: 0.8 } },
    { id: 'fr_gold',       cat: 'frame', price: 260, icon: '🥇', art: { ring: ['#ffd166', '#ff9f43'], glow: 0.9 } },

    // ---- Lencana di samping nama (leaderboard) ----
    { id: 'bd_chip',       cat: 'badge', price: 60,  icon: '🔲', art: { color: '#3d94ff' } },
    { id: 'bd_rocket',     cat: 'badge', price: 100, icon: '🚀', art: { color: '#ff9f43' } },
    { id: 'bd_crown',      cat: 'badge', price: 200, icon: '👑', art: { color: '#ffd166' } }
];

// Kelangkaan hanya label tampilan, diturunkan dari harga.
export function rarityOf(item) {
    var p = item.price;
    return p < 80 ? 'common' : p < 150 ? 'rare' : p < 220 ? 'epic' : 'legendary';
}
