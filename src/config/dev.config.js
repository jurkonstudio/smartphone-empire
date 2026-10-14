// FILE: src/config/dev.config.js
// ============================================================
// Dev Mode — flag + helper.
// Production: DEV_BUILD = false → tidak ada UI dev yang muncul,
// bahkan kalau URL param ?dev=1 dipanggil.
//
// Untuk strip sepenuhnya saat build final:
//   - Set DEV_BUILD = false (default)
//   - Hapus import DevPanel di index.html (satu baris)
//   - (opsional) hapus file ini + DevPanel.js
// ============================================================

// Ubah ke true SAAT DEVELOPMENT SAJA.
// Sebelum build APK, pastikan false.
export const DEV_BUILD = true;

const STORAGE_KEY = 'se_devmode';

// Cek aktif/tidaknya dev mode.
// Production build → selalu false.
export function isDevMode() {
    if (!DEV_BUILD) return false;

    try {
        // URL param ?dev=1 → aktifkan & simpan
        if (typeof window !== 'undefined' && window.location) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('dev') === '1') {
                localStorage.setItem(STORAGE_KEY, '1');
                return true;
            }
            if (params.get('dev') === '0') {
                localStorage.removeItem(STORAGE_KEY);
                return false;
            }
        }
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
        return false;
    }
}

export function enableDevMode() {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
}

export function disableDevMode() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

export function getDevModeKey() { return STORAGE_KEY; }
