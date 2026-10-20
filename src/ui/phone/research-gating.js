// FILE: src/ui/phone/research-gating.js
// ============================================================
// Gating komponen mockup berdasarkan riset (fungsi murni, tanpa DOM).
//
// Jika konfigurasi desain memuat komponen yang belum diriset (mis. desain
// lama, atau data tersimpan sebelum riset berubah), mockup turun ke
// komponen terbuka di kategori yang sama: tier tertinggi yang <= tier
// komponen asli. Jika tidak ada yang lebih rendah, dipakai yang terbuka
// dengan tier terendah.
//
// Kategori yang digate: display, camera, battery, chip, network.
// Komponen tanpa requiresResearch dianggap selalu terbuka.
// ============================================================
import { COMPONENTS, getComponentById } from '../../data/components.data.js';
import { RESEARCH_VISUALS } from './research-visuals.js';

const GATED_CATEGORIES = ['display', 'camera', 'battery', 'chip', 'network'];

// Konfigurasi yang kuncinya berisi ID komponen yang digate.
const GATED_CONFIG_KEYS = {
    displayId: 'display',
    cameraId: 'camera',
    batteryId: 'battery',
    chipId: 'chip',
    networkId: 'network',
};

export function isComponentUnlocked(comp, completed) {
    if (!comp) return false;
    if (!comp.requiresResearch) return true;
    return (completed || []).indexOf(comp.requiresResearch) !== -1;
}

// Mengembalikan ID komponen yang sudah terbuka. Jika `id` sudah terbuka atau
// tidak perlu digate, ID dikembalikan apa adanya.
export function resolveUnlockedComponentId(id, completed) {
    if (!id) return id;
    const comp = getComponentById(id);
    if (!comp || GATED_CATEGORIES.indexOf(comp.category) === -1) return id;
    if (isComponentUnlocked(comp, completed)) return id;

    const candidates = COMPONENTS.filter(function (c) {
        return c.category === comp.category && isComponentUnlocked(c, completed);
    });
    if (!candidates.length) return id;

    const lower = candidates.filter(function (c) { return (c.tier || 0) <= (comp.tier || 0); });
    const pool = lower.length ? lower : candidates;
    // Urutan dari COMPONENTS dipertahankan untuk tier yang sama (sort stabil).
    const best = pool.slice().sort(function (a, b) { return (b.tier || 0) - (a.tier || 0); })[0];
    return best.id;
}

// Label jaringan di status bar: generasi tertinggi dari riset yang sudah selesai.
// Urutan generasi mengikuti RESEARCH_VISUALS; 'SOS' (satelit) tidak dihitung sebagai generasi.
const NETWORK_LABEL_ORDER = ['2G', '2.5G', 'E', '3G', 'H+', '4G', '5G'];
export function resolveNetworkLabel(completed) {
    let best = -1;
    (completed || []).forEach(function (id) {
        const fx = RESEARCH_VISUALS[id] && RESEARCH_VISUALS[id].effects;
        const label = fx && fx.statusLabel;
        const idx = NETWORK_LABEL_ORDER.indexOf(label);
        if (idx > best) best = idx;
    });
    return best >= 0 ? NETWORK_LABEL_ORDER[best] : null;
}

// Sensor tidak ada di konfigurasi desain; visualnya ditentukan dari riset
// yang sudah selesai. Mengembalikan flag untuk tiap sensor yang digambar.
export function resolveSensorVisuals(completed) {
    function on(id) {
        return isComponentUnlocked(getComponentById(id), completed);
    }
    return {
        fpRear: on('sensor_fp_rear'),
        fpInDisplay: on('sensor_indisplay'),
        lidar: on('sensor_lidar'),
    };
}

// Mengembalikan salinan konfigurasi dengan ID komponen yang digate sudah
// diganti. Konfigurasi asal tidak diubah.
export function resolveConfigForResearch(config, completed) {
    if (!config) return config;
    const out = Object.assign({}, config);
    Object.keys(GATED_CONFIG_KEYS).forEach(function (key) {
        if (out[key]) out[key] = resolveUnlockedComponentId(out[key], completed);
    });
    return out;
}
