// FILE: src/data/feedback.data.js
// ============================================================
// DATA FEEDBACK PUBLIK — template ulasan, viral events, saran.
// ============================================================

// Sumber ulasan per era
export const FEEDBACK_SOURCES = {
    feature_phone:    ['Majalah Tekno', 'Forum HP', 'Tabloid Gadget', 'Radio Teknologi', 'Surat Pembaca'],
    touch_revolution: ['Blog Teknologi', 'Forum Diskusi', 'Portal Berita Tech', 'Podcast Awal', 'Twitter Awal'],
    modern_smartphone:['YouTube Review', 'Media Sosial', 'Situs Teknologi', 'Instagram Tech', 'Forum Reddit'],
    ai_ecosystem:     ['Reviewer Video Pendek', 'Komunitas Online', 'Podcast Tech', 'Thread Viral', 'Live Streaming']
};

// Template ulasan berdasarkan skor (1-10)
export const REVIEW_TEMPLATES = {
    excellent: [  // 8-10
        '{name} luar biasa! {strong} benar-benar kelas atas.',
        'Ini ponsel terbaik tahun ini. {strong} membuat semua orang iri.',
        'Sangat puas. {strong} melampaui ekspektasi.',
        'Rekomendasi wajib! {strong} jadi nilai jual utama.',
        'Performa premium. {strong} tidak mengecewakan.'
    ],
    good: [  // 6-7.9
        '{name} bagus secara keseluruhan. {strong} menonjol.',
        'Pilihan solid. {strong} layak dipertimbangkan.',
        'Puas dengan {name}. {strong} oke, meski {weak}.',
        'Kualitas bagus untuk harganya. {strong} memuaskan.'
    ],
    mixed: [  // 4-5.9
        'Cukup. {strong}, tapi {weak}.',
        '{name} standar saja. {strong} oke, {weak} mengganggu.',
        'Ada plus minus. {strong} bagus, {weak} perlu diperbaiki.',
        'Biasa saja. {strong} tidak cukup menutupi {weak}.'
    ],
    poor: [  // 2-3.9
        '{name} mengecewakan. {weak} parah.',
        'Tidak sesuai harapan. {weak} jadi masalah utama.',
        'Banyak keluhan: {weak}.',
        'Sulit direkomendasikan. {weak} dominan.'
    ],
    bad: [  // 1-1.9
        'Hindari! {weak} sangat mengganggu.',
        '{name} gagal total. {weak} tidak bisa ditolerir.',
        'Kekecewaan besar. {weak}.'
    ]
};

// Mapping stat ke "strength label"
export const STAT_LABELS = {
    display:      { strong: 'layar memukau',   weak: 'layar kurang tajam' },
    camera:       { strong: 'kamera jempolan', weak: 'kamera mengecewakan' },
    battery:      { strong: 'baterai awet',    weak: 'baterai boros' },
    performance:  { strong: 'performa ngebut', weak: 'performa lambat' },
    connectivity: { strong: 'koneksi lancar',  weak: 'sinyal sering hilang' },
    design:       { strong: 'desain cantik',   weak: 'desain kaku' },
    usability:    { strong: 'mudah dipakai',   weak: 'sulit digunakan' },
    quality:      { strong: 'bangunan kokoh',  weak: 'kualitas build rendah' }
};

// Event viral (pujian / kritik) — muncul sekali pakai
export const VIRAL_EVENTS = [
    // POSITIF
    { id: 'viral_camera',     type: 'positive', title: 'Kamera viral di media sosial',
      text: 'Pengguna memuji kamera ponselmu. Foto-foto menyebar viral.',
      effects: { reputation: +5, dailyDemandBoost: 0.20, durationDays: 7 } },
    { id: 'viral_battery',    type: 'positive', title: 'Test baterai viral',
      text: 'Uji ketahanan baterai tersebar luas. Banyak yang terkesan.',
      effects: { reputation: +4, dailyDemandBoost: 0.15, durationDays: 10 } },
    { id: 'viral_design',     type: 'positive', title: 'Desain dipuji',
      text: 'Desain ponselmu dipuji oleh desainer terkenal.',
      effects: { reputation: +6, dailyDemandBoost: 0.25, durationDays: 5 } },
    { id: 'viral_performance',type: 'positive', title: 'Benchmark memukau',
      text: 'Skor benchmark mengejutkan. Gamer berbondong beli.',
      effects: { reputation: +4, dailyDemandBoost: 0.18, durationDays: 8 } },
    { id: 'viral_price',      type: 'positive', title: 'Harga dianggap murah',
      text: 'Kombinasi spesifikasi & harga jadi perbincangan.',
      effects: { reputation: +3, dailyDemandBoost: 0.22, durationDays: 6 } },

    // NEGATIF
    { id: 'viral_heating',    type: 'negative', title: 'Ponsel cepat panas',
      text: 'Keluhan panas berlebih menyebar. Banyak yang komplain.',
      effects: { reputation: -5, dailyDemandBoost: -0.20, durationDays: 7 } },
    { id: 'viral_battery_drain', type: 'negative', title: 'Baterai boros',
      text: 'Uji baterai menunjukkan hasil buruk. Viral di forum.',
      effects: { reputation: -4, dailyDemandBoost: -0.15, durationDays: 10 } },
    { id: 'viral_display_issue', type: 'negative', title: 'Layar bermasalah',
      text: 'Keluhan layar berkedip menyebar cepat.',
      effects: { reputation: -6, dailyDemandBoost: -0.25, durationDays: 5 } },
    { id: 'viral_crash',      type: 'negative', title: 'Aplikasi sering crash',
      text: 'Stabilitas software dipertanyakan. Review negatif muncul.',
      effects: { reputation: -5, dailyDemandBoost: -0.18, durationDays: 8 } },
    { id: 'viral_build',      type: 'negative', title: 'Build quality dipertanyakan',
      text: 'Keluhan bodi cepat rusak. Foto retak viral.',
      effects: { reputation: -4, dailyDemandBoost: -0.20, durationDays: 6 } }
];

// Saran pelanggan (dari keluhan terbanyak)
export const CUSTOMER_SUGGESTIONS = [
    { aspect: 'battery',     text: 'Pengguna meminta baterai lebih awet.' },
    { aspect: 'camera',      text: 'Pengguna meminta kamera lebih bagus.' },
    { aspect: 'performance', text: 'Pengguna meminta performa lebih ngebut.' },
    { aspect: 'display',     text: 'Pengguna meminta layar lebih tajam.' },
    { aspect: 'design',      text: 'Pengguna meminta desain lebih cantik.' },
    { aspect: 'connectivity',text: 'Pengguna meminta koneksi lebih stabil.' },
    { aspect: 'usability',   text: 'Pengguna meminta antarmuka lebih mudah.' },
    { aspect: 'price',       text: 'Pengguna menginginkan harga lebih murah.' }
];

// Aksi pemain untuk merespons viral negatif (opsional, pakai uang)
export const VIRAL_RESPONSES = [
    { id: 'apology',        label: 'Permintaan Maaf Publik',    cost: 2000,  effect: { reputation: +2 }, description: 'Minta maaf terbuka, tenangkan publik.' },
    { id: 'recall',         label: 'Program Perbaikan Unit',    cost: 15000, effect: { reputation: +6 }, description: 'Tukar/perbaiki unit bermasalah.' },
    { id: 'clarify',        label: 'Kampanye Klarifikasi',      cost: 8000,  effect: { reputation: +4 }, description: 'Jelaskan fakta lewat iklan.' },
    { id: 'ignore',         label: 'Abaikan',                   cost: 0,     effect: { reputation: -3 }, description: 'Diamkan saja, biarkan mereda sendiri.' }
];

export function getViralEventById(id) {
    return VIRAL_EVENTS.find(v => v.id === id) || null;
}
