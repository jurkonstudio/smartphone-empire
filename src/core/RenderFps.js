// FILE: src/core/RenderFps.js  (BARU)
// Pilihan frame rate untuk animasi 3D (Peta Kampus & Peta Kantor).
// Disimpan di state.settings.fps (ikut tersimpan di save). Default 30 FPS,
// sama seperti perilaku sebelumnya.
import { state } from './GameState.js';

export var FPS_CHOICES = [30, 60];

export function getRenderFps() {
    try {
        var f = Number(state.get().settings && state.get().settings.fps);
        return FPS_CHOICES.indexOf(f) >= 0 ? f : 30;
    } catch (e) { return 30; }
}

// Jeda minimum antar frame (ms).
// - 60 FPS: jeda 1000/60 dipakai apa adanya. Batas mode hemat (perfFloorMs) dan
//   penurunan kualitas otomatis tidak dipasang, karena pemain memilih ini sendiri.
// - 30 FPS: perilaku lama, yaitu nilai terbesar antara baseMs dan batas mode hemat.
export function frameGapMs(perfFloorMs, baseMs) {
    if (getRenderFps() >= 60) return 1000 / 60;
    return Math.max(baseMs || 0, perfFloorMs || 0);
}
