// FILE: src/data/chip-design-registry.js
// ============================================================
// Chip hasil desain pemain (data.chips.catalog) dibaca sebagai komponen,
// supaya bisa dipilih di wizard produk dan dipakai ProductSystem lewat
// getComponentById(). ID-nya diberi awalan "cd_" agar tidak bentrok dengan
// komponen statis di components.data.js.
//
// Modul ini tanpa impor (hindari siklus impor). Sumber daftarnya didaftarkan
// ComponentPlantSystem lewat setChipDesignSource(), dan dibaca malas setiap
// kali dibutuhkan, jadi selalu sesuai dengan state game saat ini.
// ============================================================

export const CHIP_DESIGN_PREFIX = 'cd_';

let _source = null;

export function setChipDesignSource(fn) {
    _source = typeof fn === 'function' ? fn : null;
}

export function isDesignChipId(id) {
    return typeof id === 'string' && id.indexOf(CHIP_DESIGN_PREFIX) === 0;
}

// Semua chip desain yang sudah rilis, dalam bentuk komponen.
export function getDesignChipComponents() {
    if (!_source) return [];
    try { return _source() || []; } catch (e) { return []; }
}

export function getDesignChipComponentById(id) {
    if (!isDesignChipId(id)) return null;
    return getDesignChipComponents().find(c => c.id === id) || null;
}
