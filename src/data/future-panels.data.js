// FILE: src/data/future-panels.data.js  (BARU)
// ============================================================
// Registry panel "Future" — teknologi masa depan yang belum aktif dan
// nantinya akan terhubung ke sistem game.
//
// Semua panel terkunci secara default: unlock.enabled = false.
// Untuk membuka kunci nanti, ubah enabled menjadi true dan isi syarat
// (year = tahun minimum, research = ID riset yang harus selesai).
// Tidak perlu mengubah UI, cukup isi data di sini.
//
// linksTo = sistem game yang akan dihubungkan. Hanya label, belum ada logika.
// ============================================================

export const FUTURE_SYSTEM_LABELS = {
    advisor:   'Asisten Bisnis',
    os:        'OS',
    design:    'Desain Ponsel',
    products:  'Produk',
    chip:      'Chip',
    opinion:   'Opini Publik',
    market:    'Pasar',
    team:      'Tim'
};

export const FUTURE_PANELS = [
    {
        id: 'f_ai',
        name: 'F-AI',
        icon: 'brain',
        description: 'Model AI generasi berikutnya untuk seluruh perusahaan: asisten bisnis yang lebih tajam, saran desain, dan fitur OS berbasis AI.',
        linksTo: ['advisor', 'os', 'design'],
        unlock: { enabled: false, year: null, research: null }
    },
    {
        id: 'dev_tools',
        name: 'Alat Pengembang',
        icon: 'code',
        description: 'SDK dan toolkit untuk developer aplikasi pihak ketiga. Menghubungkan OS dengan ekosistem aplikasinya.',
        linksTo: ['os', 'products'],
        unlock: { enabled: false, year: null, research: null }
    },
    {
        id: 'game_engine',
        name: 'Mesin Game',
        icon: 'gamepad',
        description: 'Mesin grafis dan performa untuk game di ponsel. Bergantung pada kualitas chip dan ekosistem aplikasi.',
        linksTo: ['chip', 'os'],
        unlock: { enabled: false, year: null, research: null }
    },
    {
        id: 'user_control',
        name: 'Kontrol Pengguna',
        icon: 'sliders',
        description: 'Pengaturan privasi, batas penggunaan, dan kendali yang dipegang pengguna. Memengaruhi opini publik dan pasar.',
        linksTo: ['opinion', 'market'],
        unlock: { enabled: false, year: null, research: null }
    }
];

export function getFuturePanelById(id) {
    return FUTURE_PANELS.find(function (p) { return p.id === id; }) || null;
}

// Mengembalikan { unlocked, reason } untuk satu panel.
// data = state.data (berisi time.currentYear dan research.completed).
export function getFutureUnlockState(panel, data) {
    if (!panel) return { unlocked: false, reason: 'Panel tidak dikenal.', reasonKey: 'future.reason.unknown' };
    var u = panel.unlock || {};
    if (!u.enabled) return { unlocked: false, reason: 'Segera hadir. Belum terhubung ke sistem game.', reasonKey: 'future.reason.soon' };

    var year = (data && data.time && data.time.currentYear) || 0;
    if (typeof u.year === 'number' && year < u.year) {
        return { unlocked: false, reason: 'Tersedia mulai ' + u.year + '.', reasonKey: 'future.reason.year', reasonVars: { y: u.year } };
    }
    if (u.research) {
        var done = (data && data.research && data.research.completed) || [];
        if (done.indexOf(u.research) === -1) {
            return { unlocked: false, reason: 'Butuh riset: ' + u.research + '.', reasonKey: 'future.reason.research', reasonVars: { id: u.research } };
        }
    }
    return { unlocked: true, reason: '' };
}

// Tab Future itu sendiri selalu terbuka. Yang dikunci adalah isi kotak panelnya
// (lihat unlock per panel di atas). Ubah ke false hanya jika tab perlu dikunci lagi.
export const FUTURE_TAB_UNLOCKED = true;

export function isFutureTabUnlocked(data) {
    return FUTURE_TAB_UNLOCKED;
}
