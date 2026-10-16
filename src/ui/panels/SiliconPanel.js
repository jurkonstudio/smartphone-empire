// FILE: src/ui/panels/SiliconPanel.js  (REPLACE)
// v2027.41 — Halaman Silicon di header kini HANYA untuk Top Up.
// Semua aksi pemakaian Silicon (percepatan, selesaikan, boost riset)
// pindah langsung ke halaman riset / produk / fab (lihat SilSpeedBar.js).
import { openSiliconStoreModal } from './SiliconStorePanel.js';

export function openSiliconModal() {
    openSiliconStoreModal();
}
